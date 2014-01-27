<?php

if ($op == 'admin') {

	RequireAuthentication();

	$opts = $CONFIG['ROUTE_DEFAULTS'];
	$opts['mode'] = 'admin';
	if (isset($_GET['load'])) {
		$opts['q'] = $_GET['load'];
		$opts['openinfo'] = 'true';
	}
	
	echo $M->render('admin', array(
		'google_maps_key_string' => (strlen($CONFIG['GOOGLEMAPS_API_KEY']) == 0) ? "" : ("key=" . $CONFIG['GOOGLEMAPS_API_KEY'] . "&"),
		'opts' => json_encode($opts),
		'native-authentication' => IsNativeAuthentication(),
	));
	
}