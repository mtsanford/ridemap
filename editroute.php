<?php

/*************************************************************
 * Form processing script for edit/add of a route
 ************************************************************/

require_once ('config.php');
require_once ('includes/db.inc');
require_once ('includes/websnapr.inc');

require_once ('includes/checkpermission.inc');

if (	!isset($_POST['label']) ||
		!isset($_POST['caption']) ||
		!isset($_POST['description']) ||
		!isset($_POST['tags']) ||
		!isset($_POST['picture_url']) ||
		!isset($_POST['link_url']) ||
		!isset($_POST['marker_pos']) ||
		!isset($_POST['encoded_polyline']) ||
		!isset($_POST['bound_south']) ||
		!isset($_POST['bound_west']) ||
		!isset($_POST['bound_north']) ||
		!isset($_POST['bound_east']) ||
		!isset($_POST['color'])
	) die ("incomplete data posted");
	

// Get strings ready for use in mysql
$data = array();
foreach ($_POST as $key => $value) {
	$data[$key] = DB_EscapeString($value);
}
extract($data);

// Check to see if required data is here
//! A little more validation would be nice!
if (	strlen($encoded_polyline) == 0 ||	
		strlen($marker_pos) == 0 ||
		strlen($label) == 0 ||
		strlen($caption) == 0
	) die ("incomplete data posted");

$id = $edit_id;

if (strlen($id) > 0) {
	// If the hidden field edit_id is filled in with an routeID,then
	// we treat the post as an edit, not a new route

	if (!is_numeric($id))
		die("bad ID");
	
	$query = "UPDATE routes SET
		label = '$label',
		caption = '$caption',
		description = '$description',
		picture_url = '$picture_url',
		link_url = '$link_url',
		color = '$color',
		encoded_polyline = '$encoded_polyline',
		marker_pos = '$marker_pos',
		bound_south = $bound_south,
		bound_west = $bound_west,
		bound_north = $bound_north,
		bound_east = $bound_east
		WHERE ID = $id;";
	
	DB_Query($query);

} else {
	
	$date_added = date("Y-m-d H:i:s");

	$query = "INSERT INTO routes
		(label, caption, description, picture_url,
		 link_url, date_added, encoded_polyline, 
		 marker_pos, color, 
		 bound_south, bound_west, bound_north, bound_east )
		 VALUES
		 ( '$label', '$caption', '$description', '$picture_url',
			'$link_url', '$date_added', '$encoded_polyline', 
			'$marker_pos', '$color',
			$bound_south, $bound_west, $bound_north, $bound_east
		 );";
	
	DB_Query($query);
	$id = DB_InsertID();
}

/* insert new, or edit, we need up update the tags */

$query = "DELETE FROM tags WHERE ID = $id;";

DB_Query($query);

$tags_array = Array();
$tag_strings = preg_split('/,/', $tags, 0, PREG_SPLIT_NO_EMPTY);
foreach ($tag_strings as $tag) {
	$tag = strtolower(preg_replace('/[^\040\da-z]/i', '', trim($tag)));
	if (strlen($tag) > 0) {
		$tags_array[] = $tag;
	}
}
$tags_array = array_unique($tags_array);

if (count($tags_array)) {
	$tagq = array();
	foreach ($tags_array as $tag) {
		$tagq[] = "($id, '$tag')";
	}
	$query = "INSERT INTO tags (ID, tag) VALUES " . implode(',', $tagq);

	DB_Query($query);
	echo $query;
}

DB_Query("DELETE FROM cache WHERE 1;");

header("Location: admin.php?load=$id");

