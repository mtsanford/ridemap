<?php

	require_once '../global.php';
	require_once '../config.php';
	require_once (RMINCLUDEDIR . 'db.php');
	require_once (RMINCLUDEDIR . 'cache.php');

	header("Last-Modified: " . gmdate("D, d M Y H:i:s") . " GMT");
	header("Cache-Control: no-store, no-cache, must-revalidate");
	header("Cache-Control: post-check=0, pre-check=0", false);
	header("Pragma: no-cache");
	
	// Check permission, redirecting to login only
	// if were processing script tag editing form
	if ( isset($_GET['get']) || isset($_GET['set']) )
		$RM_redirect_to_login = false;
	else
		$RM_redirect_to_login = true;		
	require_once (RMINCLUDEDIR . 'checkpermission.php');

	DB_Connect() or die();
	
	$errormsg = "database error";

/***************************************************
*** AJAX call to get tag table data
***************************************************/
if (isset($_GET['get']))
{
	$query = "SELECT ID, label, caption, link_url FROM routes;";
	$result = mysql_query($query);
	if ( !$result )
		die($errormsg);

	$tag = strtolower(ereg_replace("[^A-Za-z0-9\040-]", "", trim($_GET['get'])));
	$out = "<table id='tagtable'><tr><th style='text-align:center;'>$tag</th><th>label</th><th>caption</th></tr>";

	for ( $i=0; $i<mysql_numrows($result); $i++ )
	{
		$record = mysql_fetch_array($result);
		$id = $record['ID'];
		
		$query = "SELECT * FROM tags WHERE id={$id} AND tag = '$tag';";
		$result2 = mysql_query($query);
		if ( !$result2 )
			die($errormsg);
		
		$checked = ($result2 && mysql_numrows($result2) > 0) ? 'checked' : '';
		$out .= <<<EOD
			<tr>
				<td style="text-align:center; width:5em"><input type="checkbox" name="{$id}" {$checked} onclick="dirty(true);" /></td>
				<td style="text-align:left; width:10em">{$record['label']}</td>
				<td style="text-align:left; width:22em"><a href="{$record['link_url']}" target="_blank">{$record['caption']}</a></td>
			</tr>
EOD;
	}
	
	$out .= "</table>";
	echo $out;
	exit();

}


/***************************************************
*** AJAX call to set tag data
***************************************************/
else if ( isset($_GET['set']) )
{
	if ( !isset($_GET['ids']) )
		die($errormsg);

	$ids = $_GET['ids'];
	$tag = strtolower(ereg_replace("[^A-Za-z0-9\040-]", "", trim($_GET['set'])));

	$query = "DELETE FROM tags WHERE tag='$tag';";
	$result = mysql_query($query);
	if ( !$result )
		die($errormsg);

	RouteCache_Flush();

	$ids = explode(',', $ids);
	
	if ( count($ids) > 0 && strlen($ids[0]) )
	{
		$values = array();
		foreach ($ids as $id)
		{
			$values[] = "($id, '$tag')";
		}
		$query = "INSERT INTO tags (ID, tag) VALUES " . implode(",", $values) . ";"; 
		$result = mysql_query($query);
		if ( !$result )
			die($errormsg);
	}

	exit();
}


/***************************************************
*** Present Tag Editing Form
***************************************************/
else
{

if ( isset($_GET['tag']) && strlen($_GET['tag']) > 0)
{
	$tag = mysql_escape_string($_GET['tag']);
}
else
{
	$tag = "";
}

$tagoptions = "";
$query = "SELECT tag FROM tags GROUP BY tag;";
$result = mysql_query($query);
if ($result)
{
	for ( $i=0; $i<mysql_numrows($result); $i++ )
	{
		$record = mysql_fetch_array($result);
		$o = $record['tag'];
		$tagoptions .= "<option value='{$o}'>{$o}</option>";
	}		
}


$html = <<<EOD
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN" "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html xmlns="http://www.w3.org/1999/xhtml" xmlns:v="urn:schemas-microsoft-com:vml">
  <head>
    <meta http-equiv="content-type" content="text/html; charset=UTF-8"/>
    <title>Route Tagger</title>
	<script type="text/javascript" src="../js/zxml.js" ></script>
	<script type="text/javascript" src="../js/json.js" ></script>
    <script type="text/javascript">
	
	var tag = '{$tag}';
	var bDirty = false;
	var sel;

	
	String.prototype.trim = function() { return this.replace(/^\s+|\s+$/g, ""); };


	// alter UI to reflect dirty state
	function dirty(d) {
	   	document.getElementById("message").innerHTML = "&nbsp;";
		document.getElementById("submitbtn").disabled = !d;
		var tt = document.getElementById("tagtable");
		if (tt)
			tt.style.backgroundColor = d ? '#FFEEEE' : '#EEEEEE';
		bDirty = d;
	}

	// alter UI to reflect AJAX call state
	function loading(b, message) {
	   	var s = document.getElementById("status");
		if (b) {
			s.innerHTML = message;
			s.style.backgroundColor = 'red';
			s.style.color = 'white';
		} else {
			s.innerHTML = "Tag: " + tag;
			s.style.backgroundColor = 'white';
			s.style.color = 'black';
		}
		sel.disabled = b;
    	document.getElementById("updatebtn").disabled = b;
		document.getElementById("submitbtn").disabled = bDirty ? b : true;
	}

	// AJAC call with timeout
	function doAJAX(url, message, callback) {
		var timer;
		var serverSlow = false;
		
		var oXmlHttp = zXmlHttp.createRequest();
		oXmlHttp.open("get", url, true);
		oXmlHttp.onreadystatechange = function() {
			if (oXmlHttp.readyState == 4)
			{
				if (serverSlow) return; //oh, so now you show up...Ignore!
				clearTimeout(timer);
				if (oXmlHttp.status == 200)
				{
					callback.call(null, oXmlHttp.responseText);
				}
				else
				{
					alert('Sorry, an error occured!');
				}
				loading(false);
			}
		}
		function timeout() {
			serverSlow = true;
			alert('Server not responding. Try Again.');
			loading(false);
		}
		oXmlHttp.send(null);
		timer = setTimeout(timeout, 20000);
		loading(true, message);
	}

	// Load up tag data into table
	function getTags(newtag) {
		if (newtag.length == 0)
			return;

		var onSuccess = function(responseText) {
			havetag = false;
			var form = document.getElementById('tagform');
			document.getElementById("tagtablediv").innerHTML = responseText;
			form.style.display = 'inline';
			tag = newtag;
			setselect(tag);
			dirty(false);

			for (i = 0; i < form.elements.length; i++) {
				if (form.elements[i].checked) {
					havetag = true;
					break;
				}
			}
			if (!havetag)
				document.getElementById("message").innerHTML = "Note: There are no routes tagged '" + tag + "'";
		}
		
		doAJAX("tag.php?get=" + newtag, "Loading...", onSuccess);
	}

	// Send table tag data to server
	function setTags()
	{
		var form = document.getElementById('tagform');
		if (form.elements.length==0)
			return;

		var data = "&ids=";
		var comma = false;
		for (i = 0; i < form.elements.length; i++) {
			if (form.elements[i].checked) {
				if (comma) data += ',';
				data += form.elements[i].name;
				comma = true;
			}
		}
		var url = "tag.php?set=" + tag + data;

		var onSuccess = function(responseText) {
			dirty(false);
		}

		doAJAX(url, "Sending Data...", onSuccess);
	}

	function onTagSelect() {
		document.getElementById("tagfield").value = '';
		var newtag = sel.options[sel.selectedIndex].value;
		getTags(newtag);
	}
	
	function onTagNew() {
		var newtag = document.getElementById("tagfield").value.trim().toLowerCase();
		document.getElementById("tagfield").value = '';
		getTags(newtag);
	}


	// set the tag selector to 'str' option, or create if not there
	function setselect(str) {
		sellen = sel.options.length;
		for (var i=0; i<sellen; i++) {
			if (str == sel.options[i].value) {
				sel.selectedIndex = i;
				return;
			}
		}
		var newop = new Option(str);
		sel.options[sellen] = newop;
		sel.selectedIndex = sellen;
	}


	function initialize() {
		sel = document.forms['taginput'].elements['tagselect'];
		dirty(false);
		if (tag.length > 0) {
			getTags(tag);
		}
	}


	</script>
	<style type="text/css">
	table {
		border-style:solid;
		border-width:1px;
	}
	td, th {
		text-align:left;
		border-style:solid;
		border-width:1px;
		padding-left:8px;
		padding-right:8px;
	}
	fieldset {
		background-color:#CCCCCC;
	}
	fieldset div {
		margin:6px;
	}
	thead {
		overflow:auto;
	}
	</style>
  </head>
  <body onload="initialize()" style="height:100%;">
  
  <table id="navtable" style="border:none;">
  	<tr>
		<td style="width:300px; height:100%; border:none; vertical-align:top;">
		  	<div style="font-size:36px; margin-bottom:6px;">Route Tagger</div>
			<fieldset>
				<legend>Choose Tag</legend>
				<form name="taginput" action="" method="post" onsubmit="onTagNew(); return false;" >
				  <div>Tag:&nbsp;<select name="tagselect" style="width:200px" onchange="onTagSelect();">
				    <option value="">-- Select A Tag ---</option>
				    {$tagoptions}</select>
				  </div>
				  <div style="font-size:small">Or, make a new tag:</div>
				  <div><input type="text" name="tag" size="24" maxlength="32" value="" id="tagfield"/>
					   <input type="submit" id="updatebtn" value="New" />
				  </div>
				</form>
			</fieldset>
			<input style="margin-top:16px" type="button" onclick="window.location='.'" value="Back to Admin Main" />
		</td>
		<td style="border:none; vertical-align:top;">
			<div style="font-size:x-large; margin-bottom:6px;" id="status"></div>
			<div style="color:red; font-size:x-small; margin:4px;" id="message">&nbsp;</div>
		  	<form name="tagform" action="" method="post" id="tagform" style="display:none;">
				<div id="tagtablediv" style="border:1px black solid; width:100%; height:600px; overflow:auto;">&nbsp;</div>		
				<input style="margin-top:16px" type="button" id="submitbtn" onclick="setTags();" value="Set Tag Data" />
		    </form>
		</td>
	</tr>
  </table>
  
  </body>
</html>
EOD;

echo $html;

}

?>