<?php
/**
* @package 'Route Groups for Google Maps'
* @copyright Copyright (C) 2007 Mark Sanford. All rights reserved.
* @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
* Route Groups for Google Maps is free software. This version may have been
* modified pursuant to the GNU General Public License, and as distributed it
* includes or is derivative of works licensed under the GNU General Public License
* or other free or open source software licenses.
* See COPYRIGHT.txt for copyright notices and details.
*/

	/*************************************************************
	 * Form processing script for edit/add of a route
	 ************************************************************/

	require_once '../global.php';
	require_once '../config.php';
	require_once (RMINCLUDEDIR . 'db.php');
	require_once (RMINCLUDEDIR . 'websnapr.php');
	require_once (RMINCLUDEDIR . 'cache.php');
	
	require_once (RMINCLUDEDIR . 'checkpermission.php');

	DB_Connect() or die( "database error");

	if (	!isset($_POST['label']) ||
			!isset($_POST['tags']) ||
			!isset($_POST['caption']) ||
			!isset($_POST['description']) ||
			!isset($_POST['picture_url']) ||
			!isset($_POST['link_url']) ||
//			!isset($_POST['way_points']) ||  	// some old routes don't have...
			!isset($_POST['raw_points']) ||
			!isset($_POST['encoded_levels']) ||
			!isset($_POST['encoded_polyline']) ||
			!isset($_POST['zoomfactor']) ||
			!isset($_POST['numlevels']) ||
			!isset($_POST['marker_pos']) ||
			!isset($_POST['color'])
		) die ("incomplete data posted");
		

	// Get strings ready for use in mysql
	$data = array();
	foreach ($_POST as $key => $value)
	{
		if (get_magic_quotes_gpc())
			$data[$key] = mysql_escape_string(stripslashes($value));
		else
			$data[$key] = mysql_escape_string($value);
	}
	extract($data);

	// Check to see if required data is here
	//! A little more validation would be nice!
	if (strlen($edit_id) == 0) {
		if (	strlen($raw_points) == 0 ||	
				strlen($encoded_polyline) == 0 ||	
				strlen($encoded_levels) == 0 ||	
				strlen($zoomfactor) == 0 ||	
				strlen($numlevels) == 0 ||	
				strlen($marker_pos) == 0 ||	
				strlen($color) == 0 )
			die ("incomplete data posted");
	} else {
		if (strlen($color) == 0)
			die ("incomplete data posted");
	}

	// Try to get the image width and height
	//! IS there really no way to get this on client size??!?!

	if (!URL_is_websnapr($picture_url)) {
		$im = imagecreatefromjpeg($picture_url);
		if ($im)
		{
			$picture_width = imagesx($im);
			$picture_height = imagesy($im);
		}
	}

	$date_added = date("Y-m-d H:i:s");

    // Calculate the bounding box
    //!! this will not work if there is a wrap in lon/lat!?
	if (strlen($raw_points) > 0) {
		$box_west = 1000;
		$box_east = -1000;
		$box_north = -1000;
		$box_south = 1000;
		$points = explode(';', $raw_points);
		foreach ($points as $point)
		{
			$pt = explode(',', $point);
			$lat = $pt[0];
					$lng = $pt[1];
			if ($lat < $box_south) $box_south = $lat;
			if ($lat > $box_north) $box_north = $lat;
			if ($lng < $box_west) $box_west = $lng;
			if ($lng > $box_east) $box_east = $lng;
		}
	}
    
    // If the hidden field edit_id is filled in with an routeID,then
    // we treat the post as an edit, not a new route
    $id = $edit_id;
    if (strlen($id) > 0)
    {
        if (!is_numeric($id))
            die("bad ID");
        
		// If we could not get picture size, don't bother updating fields
		$picsize = "";
		if (isset($picture_width) && $picture_width > 0) {
            $picsize = "picture_width = '$picture_width',
            			picture_height = '$picture_height',";
		}

		// If we've been given new line info, update it
		$lineupdate = "";
		if (strlen($encoded_polyline) > 0) {
			$lineupdate = "
				way_points = '$way_points',
				raw_points = '$raw_points',
				encoded_polyline = '$encoded_polyline',
				encoded_levels = '$encoded_levels',
				zoomfactor = '$zoomfactor',
				numlevels = '$numlevels',
				marker_pos = '$marker_pos',
				bound_west = '$box_west',
				bound_east = '$box_east',
				bound_north = '$box_north',
				bound_south = '$box_south',";
		}

        $query = "UPDATE routes SET
            label = '$label',
            caption = '$caption',
            description = '$description',
            picture_url = '$picture_url',
			{$picsize}
            link_url = '$link_url',
			{$lineupdate}
            color = '$color'
            WHERE ID = $id;";
		
	    $result=mysql_query($query);

    }
    else
    {
		if (!isset($picture_width))
		{
			$picture_width =0;
			$picture_height =0;
		}
        $query = "INSERT INTO routes
            (label, caption, description, picture_url, picture_width, picture_height, 
			 link_url, date_added, way_points, raw_points, encoded_polyline, 
             encoded_levels, zoomfactor, numlevels, marker_pos, color, 
             bound_west, bound_east, bound_north, bound_south )
             VALUES
             ( '$label', '$caption',  '$description',  
			   '$picture_url',  '$picture_width',  '$picture_height', '$link_url',
               '$date_added', '$way_points', '$raw_points', '$encoded_polyline', 
			   '$encoded_levels', '$zoomfactor',  '$numlevels', '$marker_pos', '$color',
               '$box_west', '$box_east', '$box_north', '$box_south'
             )
        ;";
    	$result=mysql_query($query);
		$id = mysql_insert_id();
    }

	/* insert new, or edit, we need up update the tags */

	$query = "DELETE FROM tags WHERE ID = $id;";

	$result=mysql_query($query);
	
	$tags = preg_split ("/\s+/", strtolower(ereg_replace("[^A-Za-z0-9\040-]", "", trim($tags) )), -1, PREG_SPLIT_NO_EMPTY);
	$tags = array_unique($tags);
	if (count($tags))
	{
		$tagq = array();
		foreach ($tags as $tag)
		{
			$tagq[] = "($id, '$tag')";
		}
		$query = "INSERT INTO tags (ID, tag) VALUES " . implode(',', $tagq);
	
		$result=mysql_query($query);
	}

    if ($result == false) {
        echo "edit failed<br>";
        echo mysql_error();
        die;
    }
    
	RouteCache_Flush();
	
    header("Location: ./?load=$id");

?>