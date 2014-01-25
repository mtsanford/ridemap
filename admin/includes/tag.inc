<?php

if ($op == 'tag' && $_SERVER['REQUEST_METHOD'] == 'GET') {

	RequireAuthentication();

	/***************************************************
	*** AJAX call to get tag table data
	***************************************************/
	if (isset($_GET['get']))
	{
		$query = "SELECT ID, label, caption, link_url FROM routes;";
		$result = DB_Query($query);

		//$tag = strtolower(ereg_replace("[^A-Za-z0-9\040-]", "", trim($_GET['get'])));
		$tag = strtolower(preg_replace("[^A-Za-z0-9\040-]", "", trim($_GET['get'])));
		$out = "<table id='tagtable'><tr><th style='text-align:center;'>$tag</th><th>label</th><th>caption</th></tr>";

		for ( $i=0; $i < $result->num_rows; $i++ )
		{
			$record = mysqli_fetch_array($result);
			$id = $record['ID'];
			
			$query = "SELECT * FROM tags WHERE id={$id} AND tag = '$tag';";
			$result2 = DB_Query($query);
			
			$checked = ($result2->num_rows > 0) ? 'checked' : '';
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
		$result = DB_Query($query);

		$ids = explode(',', $ids);
		
		if ( count($ids) > 0 && strlen($ids[0]) )
		{
			$values = array();
			foreach ($ids as $id)
			{
				$values[] = "($id, '$tag')";
			}
			$query = "INSERT INTO tags (ID, tag) VALUES " . implode(",", $values) . ";"; 
			DB_Query($query);
		}

		DB_Query("DELETE FROM cache WHERE 1;");
		
		exit();
	}


	/***************************************************
	*** Present Tag Editing Form
	***************************************************/
	else
	{

		if ( isset($_GET['tag']) && strlen($_GET['tag']) > 0)
		{
			$tag = DB_EscapeString($_GET['tag']);
		}
		else
		{
			$tag = "";
		}

		$tagoptions = "";
		$query = "SELECT tag FROM tags GROUP BY tag;";
		$result = DB_Query($query);

		for ( $i = 0; $i < $result->num_rows; $i++ )
		{
			$record = mysqli_fetch_array($result);
			$o = $record['tag'];
			$tagoptions .= "<option value='{$o}'>{$o}</option>";
		}		


		$html = <<<EOD
		<!DOCTYPE html>
		<html>
			<head>
				<meta http-equiv="content-type" content="text/html; charset=UTF-8"/>
				<title>Route Tagger</title>
				<script src="//ajax.googleapis.com/ajax/libs/jquery/1.10.2/jquery.min.js"></script>
				<link href="css/ridemapadmin.css" rel="stylesheet" type="text/css"/>
				<script type="text/javascript" src="js/tag.js"></script>
				<link href="css/tag.css" rel="stylesheet" type="text/css"/>
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

}