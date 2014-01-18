<?php
/**
* Ridemap
*
* Copyright (C) 2014 Mark T. Sanford
* Licensed under GNU GENERAL PUBLIC LICENSE version 2
* see http://www.gnu.org/licenses/gpl-2.0.txt for more information
*/

	/*
	 * AJAX call to get stored route information.
	 *
	 * Usage getroutes.php[?options]
	 *
	 * Options:
	 *    (none)   			fetch basic marker info for all routes
	 *     q=id1[,id2]...   fetch full route info for routes with specified ID's
	 *     region=s,w,n,e	fetch basic marker info for routes overlapping specified
	 *                      geographic region.
	 *     tag=tag1[,tag2]..fetch basic marker info for routes tagged with all specified tags
	 *     label=
	 *      label1[,label2] fetch full route info for routes with specified labels
	 *     mode=edit		fetch ALL information about routes specified with 'q' or 'label' 
	 *     mode=admin		fetch ALL information about routes specified with 'q' or 'label' (w/ websnapr conversion)
	 *
	 *     Basic marker info is ID, caption, marker_pos
	 *     Full route info also includes everything but raw point info and way points.
	 *	   All route info is 'full' but with raw and way points included.
	 *
	 * Output:
	 *     JSON describing the return value.  Empty string on failure, or no data
	 *
	 *     { routes: [
	 *         {"ID": 1, "label": "santarosard", "caption": "Santa Rosa Rd.", ...},
	 *         {"ID": 2, "label": "happyrd", "caption": "Happy Rd.", ...},
	 *           ....
	 *       ],
	 *       // Geographic bounds for the entire set of routes.  No bounds property given
	 *       // if region parameter was specified, or just a single route requested
	 *       bounds: {"s":"32.9347","w":"-124.403","n":"42.4278","e":"-114.037"}
	 *     }
	 *
	 */
	 
	require_once 'config.php';
	require_once (dirname(__FILE__) . '/includes/db.php');
	require_once (dirname(__FILE__) . '/includes/websnapr.php');

	$db = DB_Connect() or die("could not connect to database");

	// Fetch a subset of routes, based on URI query string $qs
	// Try to fetch cached data first.
	function FetchRouteSet($qs)
	{
		global $db;
		
		$query = "SELECT json FROM cache WHERE query = '{$qs}' LIMIT 1;"; 
		$result = mysqli_query($db, $query);

		if ($result && $result->num_rows > 0) {
			$record = $result->fetch_object();
			return $record->json;
		} else {
			$output = FetchRouteSet_DoQuery($qs);
			$json = $db->real_escape_string($output);
			$query = "INSERT INTO cache (query, json) VALUES ( '{$qs}', '{$json}');";
			mysqli_query($db, $query);
			return $output;
		}		
	}
	
	// Perform an actual query on a subset of routes, based on
	// region, tag, or all routes.   Calculate the geographic 
	// bounds of the set.
	function FetchRouteSet_DoQuery($qs)
	{
		global $db;
		
		if ( strpos($qs, 'region=') === 0 ) {
			$c = explode(',', substr($qs, 7));
			$query = "SELECT ID, caption, marker_pos, bound_west, bound_east, bound_north, bound_south
			          FROM routes
					  WHERE (bound_south < {$c[2]}) AND (bound_west < {$c[3]})
			                AND (bound_north > {$c[0]}) AND (bound_east > {$c[1]});";
		} else if ( strpos($qs, 'tag=') === 0 ) {
			$c = explode(',', strtolower(substr($qs, 4)));
			$cc = count($c);
			$query = "SELECT r1.ID, caption, marker_pos, bound_west, bound_east, bound_north, bound_south
			          FROM routes r1
			          INNER JOIN tags t1 
			          ON r1.ID = t1.ID WHERE
			          t1.tag IN ('" . implode("','", $c) . "')
			          GROUP BY r1.ID
			          HAVING COUNT(*) = {$cc};";
		} else {
			$query = "SELECT ID, caption, marker_pos, bound_west, bound_east, bound_north, bound_south
			          FROM routes";
		}

		$result = mysqli_query($db, $query);
		if (!$result || $result->num_rows == 0 )
			return "";

		$out = array(
			'routes' => array(),
			'bounds' => array('s' => 90, 'w' => 180, 'n' => -90, 'e' => -180),
		);

		for ($i=0; $i < $result->num_rows; $i++) {
			$record = $result->fetch_object();
			$out['routes'][$i] = array();
			$out['routes'][$i]['ID'] = $record->ID;
			$out['routes'][$i]['caption'] = $record->caption;
			$out['routes'][$i]['marker_pos'] = $record->marker_pos;

			$out['bounds']['s'] = min($out['bounds']['s'], $record->bound_south);
			$out['bounds']['w'] = min($out['bounds']['w'], $record->bound_west);
			$out['bounds']['n'] = max($out['bounds']['n'], $record->bound_north);
			$out['bounds']['e'] = max($out['bounds']['e'], $record->bound_east);
		}

		return json_encode($out);
		
	}
    
    // if no argument is specified, return all the routes, but just the IDs, marker positions,
    // and captions.  
	if (!isset($_GET['q']) && !isset($_GET['label'])) {
		$query = '';
		if (isset($_GET['region'])) {
			$query = 'region=' . $_GET['region'];
		}
		else if (isset($_GET['tag'])) {
			$query = 'tag=' . $_GET['tag'];
		}
		$output = FetchRouteSet($query);
	} else {
	    $value = array();

		if (isset($_GET['label'])) {
			$labels = explode(',', $_GET['label']);
	        $where = " WHERE label IN ('" . implode("','", $labels) . "')";
		} elseif (isset($_GET['q'])) {
	        $where=" where ID IN (" . $_GET['q'] . ")";
		}
		
		// With editmode, we will return ALL info, including raw route points, and tags list
		$editmode = isset($_GET['mode']) && ($_GET['mode'] == 'edit' || $_GET['mode'] == 'admin');

		// convert_websnapr indicates we should convert the Picture URL of 'websnapr' to
		// the proper websnapr URL (i.e. http://www.websnapr.com/blahblah...)
		$convert_websnapr = isset($_GET['mode']) && ($_GET['mode'] == 'edit');

		if ($editmode) {
			// For edit mode we return ALL fields, including raw points
	        $query="SELECT * FROM routes {$where} LIMIT 1;";
		} else {
			// Regular query for a particular route
	        $query="SELECT ID, label, caption, description, picture_url, picture_width, picture_height,
					link_url, encoded_polyline, encoded_levels, zoomfactor, numlevels, 
					marker_pos, color, bound_west, bound_east, bound_north, bound_south 
					FROM routes {$where};";
		}

		$result = mysqli_query($db, $query);
		
		if ($result && $result->num_rows > 0) {			
			for ($i = 0; $i < $result->num_rows; $i++ ) {
				$value[$i] = $result->fetch_array(MYSQLI_ASSOC);
				if ($convert_websnapr && URL_is_websnapr($value[$i]['picture_url']) ) {
					$value[$i]['picture_url'] = websnapr_url($value[$i]['link_url']);
					$value[$i]['picture_width'] = 202;
					$value[$i]['picture_height'] = 152;
				}
			}
			if ($editmode) {
				//! we will fail if selector is label...
				$query = "SELECT tag FROM tags WHERE ID = {$_GET['q']};";
				$result = mysqli_query($db, $query);
				$tags = array();
				while ($row = $result->fetch_object()) {
					$tags[] = $row->tag;
				}
				$value[0]['tags'] = implode( ' ', $tags );
			}
			
			$output = json_encode($value);

		} else {
			$output = "";
		}
    }

	header("Last-Modified: " . gmdate("D, d M Y H:i:s") . " GMT");
	header("Cache-Control: no-store, no-cache, must-revalidate");
	header("Cache-Control: post-check=0, pre-check=0", false);
	header("Pragma: no-cache");
     
    print($output);
