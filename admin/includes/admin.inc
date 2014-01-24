<?php

if ($op == 'admin') {

	RequireAuthentication();

	if (IsNativeAuthentication()) {
		$logout_html = '<div class="rm_loginlinks">
		                  <a href="?op=logout">logout</a><a href="?op=changepass">change password</a>
		                </div>';
	} else {
		$logout_html = "";
	}
	
	$opts = $CONFIG['ROUTE_DEFAULTS'];
	$opts['mode'] = 'admin';
	if (isset($_GET['load']) && is_numeric($_GET['load'])) {
		$opts['q'] = $_GET['load'];
		$opts['openinfo'] = 'true';
	}
	$opts = json_encode($opts);
	
	$google_maps_key_string = (strlen($CONFIG['GOOGLEMAPS_API_KEY']) == 0) ? "" : ("key=" . $CONFIG['GOOGLEMAPS_API_KEY'] . "&");	

	$html = <<<EOD
	<!DOCTYPE html>
	<html>
	  <head>
		<meta http-equiv="content-type" content="text/html; charset=utf-8"/>
		<title>Ridemap - Admin</title>
		<script src="//maps.googleapis.com/maps/api/js?{$google_maps_key_string}libraries=geometry&sensor=false" type="text/javascript"></script>
		<script src="//ajax.googleapis.com/ajax/libs/jquery/1.10.2/jquery.min.js"></script>
		<script src="../js/ridemap.js" type="text/javascript"></script>
		<link href="../css/ridemap.css" rel="stylesheet" type="text/css"/>
		<link href="css/ridemapadmin.css" rel="stylesheet" type="text/css"/>
		<script type="text/javascript">

		var Admin = {
			rideMap : null,
			initialize : function() {
				Admin.rideMap = new Ridemap('map-canvas', {$opts});
			},
			newRoute : function() {
				var bounds =  Admin.rideMap.map.getBounds();
				var sw = bounds.getSouthWest();
				var ne = bounds.getNorthEast();
				window.location = '?op=edit&id=new&bounds=' + [sw.lat(), sw.lng(), ne.lat(), ne.lng()].join(','); 
			}
		};
		
		$( document ).ready(function() {
			Admin.initialize();
		});

		</script>

	  </head>
	  <body>
			<div id="control-panel">
				<div id="control-panel-inner">
					<p>Click on a marker to view EDIT and DELETE options for a route</p>
					<div style="margin:8px;"><input type="button" onclick="Admin.newRoute();" value="New Route"/></div>
					<div style="margin:8px;"><input type="button" onclick="window.location='tag.php';" value="Tag Routes"/></div>
					{$logout_html}
				</div>
			</div> <!-- control-panel -->
			
			<div id="map-container">
				<div id="map-canvas"></div>
			</div>
	  
	  </body>
	</html>
EOD;

	echo $html;
	
}