<?php

require_once 'config.php';

$defaults = json_encode($CONFIG['ROUTE_DEFAULTS']);
$google_maps_key_string = (strlen($CONFIG['GOOGLEMAPS_API_KEY']) == 0) ? "" : ("key=" . $CONFIG['GOOGLEMAPS_API_KEY'] . "&");

$page = <<<EOL
<!DOCTYPE html>
<html>
	<head>
		<script src="//maps.googleapis.com/maps/api/js?{$google_maps_key_string}libraries=geometry&sensor=false" type="text/javascript"></script>
		<script src="//ajax.googleapis.com/ajax/libs/jquery/1.10.2/jquery.min.js"></script>
		<script src="js/ridemap.js" type="text/javascript"></script>
		<link href="css/ridemap.css" rel="stylesheet" type="text/css" />
	</head>
	<script>
		$( document ).ready(function() {
			var ridemap = new Ridemap('map-canvas', {$defaults});
		});
	</script>
	<body>
		<div id="map-canvas"></div>
	</body>
</html>
EOL;

echo $page;
