<?php

if ($op == 'edit' && $_SERVER['REQUEST_METHOD'] == 'GET') {

	RequireAuthentication();

	$google_maps_key_string = (strlen($CONFIG['GOOGLEMAPS_API_KEY']) == 0) ? "" : ("key=" . $CONFIG['GOOGLEMAPS_API_KEY'] . "&");
	$label = $caption = "";
	
	if (empty($_GET['id']) || $_GET['id'] == 'new') {
		$result = DB_Query("SELECT MAX(ID) AS max_route_id FROM routes");
		if ($result->num_rows > 0) {
			extract($result->fetch_assoc());
			$label = 'route' . ($max_route_id + 1);
			$caption = 'Route #' . ($max_route_id + 1);
		}
	}

	echo $M->render('edit', array(
		'google_maps_key_string' => (strlen($CONFIG['GOOGLEMAPS_API_KEY']) == 0) ? "" : ("key=" . $CONFIG['GOOGLEMAPS_API_KEY'] . "&"),
		'label' => $label,
		'caption' => $caption,
	));
	
	echo $html;
	
}
