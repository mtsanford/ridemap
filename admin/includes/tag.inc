<?php

/***************************************************
* AJAX call to get tag table data, if no tag is 
* specified routes are still returned, but none
* are marked as tagged.
***************************************************/
if ($op == 'tag_getroutes' && $_SERVER['REQUEST_METHOD'] == 'GET') {

	RequireAuthentication();

	$tag = empty($_GET['tag']) ? "" : preg_replace("[^A-Za-z0-9-_\040]", "", trim($_GET['tag']));

	$table_data = array(
		'tag' => $tag,
		'routes' => array(),
	);
	
	if (strlen($tag)) {
		$query = "
			SELECT r.ID as ID, r.label as label, r.caption as caption, r.link_url as link_url, not isnull(t.tag) as tagged
			FROM routes r
			LEFT JOIN tags t
			ON r.ID = t.ID AND t.tag = '$tag';";
	} else {
		$query = "
			SELECT r.ID as ID, r.label as label, r.caption as caption, r.link_url as link_url, 0 as tagged
			FROM routes r
			WHERE 1;";
	}
	
	$result = DB_Query($query);

	for ( $i=0; $i < $result->num_rows; $i++ ) {
		$table_data['routes'][] = mysqli_fetch_assoc($result);
	}
	
	echo json_encode($table_data);

}


/***************************************************
*** AJAX call to set tag data
***************************************************/
if ($op == 'tag' && $_SERVER['REQUEST_METHOD'] == 'POST') {

	RequireAuthentication();

	$out = "";
	
	$values = array();
	$ids = explode(',', $_POST['ids']);
	$tag = preg_replace("[^A-Za-z0-9-_\040]", "", trim($_POST['tag']));

	$out .= $tag . "\n";
	$out .= $_POST['ids'] . "\n";
	$out .= $_POST['tag'] . "\n";
	echo $out;
	
	$query = "DELETE FROM tags WHERE tag='$tag';";
	$result = DB_Query($query);

	foreach ($ids as $id) {
		if (strlen($id)) {
			$values[] = "($id, '$tag')";
		}
	}
	
	if (count($values)) {
		$query = "INSERT INTO tags (ID, tag) VALUES " . implode(",", $values) . ";"; 
		DB_Query($query);
	}
	
	DB_Query("DELETE FROM cache WHERE 1;");
	
	echo "ok";

}

/***************************************************
*** Present Tag Editing Form
***************************************************/
if ($op == 'tag' && $_SERVER['REQUEST_METHOD'] == 'GET') {

	RequireAuthentication();
	
	$tag_options = array();
	$query = "SELECT tag FROM tags GROUP BY tag;";
	$result = DB_Query($query);

	for ( $i = 0; $i < $result->num_rows; $i++ ) {
		$tag_options[] = array(
			'name' => mysqli_fetch_object($result)->tag,
		);
	}		

	echo $M->render('tagger', array(
		'tag_options' => $tag_options,
	));

}

