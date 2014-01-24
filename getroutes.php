<?php

/*
 * AJAX call to get stored route information.
 *
 * Usage getroutes.php[?options]
 *
 * Options:
 *
 *     (none)                  fetch info for all routes
 *     q=id1[,id2]...          fetch info for routes with specified ID's
 *     region=s,w,n,e          fetch info for routes who's bounds overlap specified geographic region.
 *     tag=tag1[,tag2]..       fetch info for routes tagged with all specified tags (e.g. tag1 and tag2)
 *     label=label1[,label2].. fetch info for routes with specified labels
 *
 *     fields=basic            (default) fetch just ID, caption, marker_pos, label for routes
 *     fields=full             fetch all data, including tags
 *
 * Output:
 *     JSON describing the return value.  Empty string on failure, or no data.  E.g.:
 *
 *     { 
 *       routes: [
 *         {"ID": 1, "label": "santarosard", "caption": "Santa Rosa Rd.", ...},
 *         {"ID": 2, "label": "happyrd", "caption": "Happy Rd.", ...},
 *           ....
 *       ],
 *       // Geographic bounds for the entire set of routes.
 *       bounds: {"s":"32.9347","w":"-124.403","n":"42.4278","e":"-114.037"}
 *     }
 *
 */
 
require_once 'config.php';
require_once ('includes/db.inc');

const FIELDS_BASIC = 0;  
const FIELDS_FULL = 1;  

// TODO validate query string
$qs = DB_EscapeString($_SERVER["QUERY_STRING"]);
$output = "";

// Try to fetch cached data first.		
$query = "SELECT json FROM cache WHERE query = '" . $qs . "' LIMIT 1;"; 
$result = DB_Query($query);

// Cached result found.  Use it.
if ($result->num_rows > 0) {
	$output = $result->fetch_object()->json;
}

// No cached result found
// Perform a query on a subset of routes, based on
// region, tag, ID, labels, or all routes.   Calculate the geographic 
// bounds of the set.
else {
	
	$fields = FIELDS_BASIC;
	
	// Query on region
	if (!empty($_GET['region'])) {
		$c = explode(',', $_GET['region']);
		$query = "SELECT *
				  FROM routes
				  WHERE (bound_south < {$c[2]}) AND (bound_west < {$c[3]})
						AND (bound_north > {$c[0]}) AND (bound_east > {$c[1]});";
	} 
	
	// Query on tag(s)
	else if (!empty($_GET['tag'])) {
		$c = explode(',', strtolower($_GET['tag']));
		$cc = count($c);
		$query = "SELECT *
				  FROM routes r1
				  INNER JOIN tags t1 
				  ON r1.ID = t1.ID WHERE
				  t1.tag IN ('" . implode("','", $c) . "')
				  GROUP BY r1.ID
				  HAVING COUNT(*) = {$cc};";
	} 
	
	// Query on label(s)
	else if (!empty($_GET['label'])) {
		$labels = explode(',', strtolower($_GET['label']));
		$query = "SELECT *
				  FROM routes
				  WHERE label IN ('" . implode("','", $labels) . "')";
	}
	
	// query on ID(s)
	else if (!empty($_GET['q'])) {
		$query = "SELECT * FROM routes where ID IN (" . $_GET['q'] . ")";
	}
	
	// fetch ALL routes
	else {
		$query = "SELECT * FROM routes WHERE 1";
	}
	
	// Override default fetch mode
	if (!empty($_GET['fields'])) {
		switch ($_GET['fields']) {
			case 'basic': $fields = FIELDS_BASIC; break;
			case 'full': $fields = FIELDS_FULL; break;
		}
	}

	$out = array(
		'routes' => array(),
		'bounds' => array('s' => 90, 'w' => 180, 'n' => -90, 'e' => -180),
	);

	$result = DB_Query($query);
	
	if ($result->num_rows > 0) {
		for ($i=0; $i < $result->num_rows; $i++) {
			$record = $result->fetch_object();

			$route = array();
			$route['ID'] = $record->ID;
			$route['caption'] = $record->caption;
			$route['marker_pos'] = $record->marker_pos;
			$route['label'] = $record->label;
			
			if ($fields >= FIELDS_FULL) {
				$route['description'] = $record->description;
				$route['picture_url'] = $record->picture_url;
				$route['link_url'] = $record->link_url;
				$route['date_added'] = $record->date_added;
				$route['encoded_polyline'] = $record->encoded_polyline;
				$route['color'] = $record->color;
				$route['bound_west'] = $record->bound_west;
				$route['bound_east'] = $record->bound_east;
				$route['bound_north'] = $record->bound_north;
				$route['bound_south'] = $record->bound_south;

				// Include route tags too
				$tags_query = "SELECT tag FROM tags WHERE ID = {$record->ID};";
				$tags_result = DB_Query($tags_query);
				$tags = array();
				while ($tag_row = $tags_result->fetch_object()) {
					$tags[] = $tag_row->tag;
				}
				$route['tags'] = implode( ', ', $tags );
			}
			
			$out['routes'][$i] = $route;

			$out['bounds']['s'] = min($out['bounds']['s'], $record->bound_south);
			$out['bounds']['w'] = min($out['bounds']['w'], $record->bound_west);
			$out['bounds']['n'] = max($out['bounds']['n'], $record->bound_north);
			$out['bounds']['e'] = max($out['bounds']['e'], $record->bound_east);

		}

		$output = json_encode($out);
	}
	
	// Cache this result!
	$json = DB_EscapeString($output);
	$query = "INSERT INTO cache (query, json) VALUES ('{$qs}', '{$json}');";
	DB_Query($query);

}

header("Last-Modified: " . gmdate("D, d M Y H:i:s") . " GMT");
header("Cache-Control: no-store, no-cache, must-revalidate");
header("Cache-Control: post-check=0, pre-check=0", false);
header("Pragma: no-cache");
 
print($output);
