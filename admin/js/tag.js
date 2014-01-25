var tag = 'silly';
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
	
	$.ajax({
		url: '?op=tag&get=' + newtag,
		success: onSuccess
	});
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
	var url = "?op=tag&set=" + tag + data;

	$.ajax({
		url: url,
		success: function() {
			dirty(false);
		}
	});
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


