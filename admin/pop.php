<?php

require_once '../config.php';
require_once (dirname(__FILE__) . '/../includes/db.php');
require_once (dirname(__FILE__) . '/../includes/websnapr.php');

$ch = curl_init();

curl_setopt($ch, CURLOPT_URL, "http://www.pashnit.com/ridemap/getroutes.php");
curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
curl_setopt($ch, CURLOPT_TIMEOUT, 4);
// curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
// curl_setopt($ch, CURLOPT_POSTFIELDS, $content);

$data = curl_exec($ch);

if (curl_errno($ch)) {
 print curl_error($ch);
} else {
 curl_close($ch);
}

$routes = json_decode($data);
$routes = $routes->routes;

//$r = json_encode($routes['routes'][0]);
//print_r($routes[0]);
//echo($r);
//exit;

foreach ($routes as $route) {
	$id = $route->ID;
	//echo($route->ID . " ");

	//if ($id != "154") continue;
	
	$ch = curl_init();
	curl_setopt($ch, CURLOPT_URL, "http://www.pashnit.com/ridemap/getroutes.php?mode=edit&q=" . $id);
	curl_setopt($ch, CURLOPT_RETURNTRANSFER, 1);
	curl_setopt($ch, CURLOPT_TIMEOUT, 10);
	// curl_setopt($ch, CURLOPT_HTTPHEADER, $headers);
	// curl_setopt($ch, CURLOPT_POSTFIELDS, $content);

	$data = curl_exec($ch);

	if (curl_errno($ch)) {
	 print curl_error($ch);
	} else {
	 curl_close($ch);
	}	

	
	$full_route = json_decode($data);
	$full_route = $full_route[0];
	//print_r($full_route);
	
	$full_route->encoded_polyline = mysql_escape_string($full_route->encoded_polyline);
	$full_route->encoded_levels = mysql_escape_string($full_route->encoded_levels);
	$full_route->caption = mysql_escape_string($full_route->caption);
	$full_route->encoded_levels = mysql_escape_string($full_route->encoded_levels);
	$full_route->encoded_levels = mysql_escape_string($full_route->encoded_levels);
	
	$query = "INSERT INTO routes
		(ID, label, caption, description, picture_url, picture_width, picture_height, 
		 link_url, encoded_polyline, way_points, raw_points,
		 encoded_levels, zoomfactor, numlevels, marker_pos, color, 
		 bound_west, bound_east, bound_north, bound_south )
		 VALUES
		 ( {$full_route->ID}, '{$full_route->label}', '{$full_route->caption}',  '{$full_route->description}',  
		   '{$full_route->picture_url}',  '{$full_route->picture_width}',  '{$full_route->picture_height}', '{$full_route->link_url}',
		   '{$full_route->encoded_polyline}', '{$full_route->way_points}', '{$full_route->raw_points}',
		   '{$full_route->encoded_levels}', '{$full_route->zoomfactor}',  '{$full_route->numlevels}', '{$full_route->marker_pos}', '{$full_route->color}',
		   '{$full_route->bound_west}', '{$full_route->bound_east}', '{$full_route->bound_north}', '{$full_route->bound_south}'
		 )
	;";
		
		$result = DB_Query($query);

		//echo $query;
	
}

/*
[{"0":"63","ID":"63","1":"santarosaroad","label":"santarosaroad","2":"Santa Rosa Rd","caption":"Santa Rosa Rd","3":"",
"description":"","4":"http:\/\/www.pashnit.com\/pics\/screenshots\/socal\/240_SantaRosaRd.jpg",
"picture_url":"http:\/\/www.pashnit.com\/pics\/screenshots\/socal\/240_SantaRosaRd.jpg","5":"240",
"picture_width":"240","6":"220","picture_height":"220",
"7":"http:\/\/www.pashnit.com\/roads\/cal\/SantaRosaRd.htm",
"link_url":"http:\/\/www.pashnit.com\/roads\/cal\/SantaRosaRd.htm",
"8":"a","encoded_polyline":"","10":"8","zoomfactor":"8","11":"4","numlevels":"4","12":"34.61977, -120.39527000000001",
"marker_pos":"34.61977, -120.39527000000001","13":"#AA33DD","color":"#AA33DD","14":"-120.429",
"bound_west":"-120.429","15":"-120.195","bound_east":"-120.195","16":"34.6233","bound_north":"34.6233","17":"34.5947","bound_south":"34.5947"}]
*/

/*
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
*/