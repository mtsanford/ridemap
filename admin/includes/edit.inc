<?php

if ($op == 'edit' && $_SERVER['REQUEST_METHOD'] == 'GET') {

	$label = "";
	$caption = "";
	$wsinfo = "";
	
	if (empty($_GET['id']) ||  $_GET['id'] == 'new') {
		$result = DB_Query("SELECT MAX(ID) AS max_route_id FROM routes");
		if ($result->num_rows > 0) {
			extract($result->fetch_assoc());
			$label = 'route' . ($max_route_id + 1);
			$caption = 'Route #' . ($max_route_id + 1);
		}
	}

	if (!empty($WEBSNAPR_API_KEY)) {
		$wsinfo = "or type 'websnapr' to use websnaper on the link url.";
	}

	$html = <<<EOD
	<!DOCTYPE html>
	<html>
		<head>
			<meta http-equiv="content-type" content="text/html; charset=UTF-8"/>
			<title>Ridemap - Add/Edit a Route</title>
			<script src="//maps.googleapis.com/maps/api/js?libraries=geometry&sensor=false" type="text/javascript"></script>
			<script src="//ajax.googleapis.com/ajax/libs/jquery/1.10.2/jquery.min.js"></script>
			<script src="js/jquery.blockUI.js"></script>
			<script src="js/edit.js" type="text/javascript"></script>
			<link href="css/ridemapadmin.css" rel="stylesheet" type="text/css"/>
		</head>
		<body>
			<div id="control-panel">
				<div id="control-panel-inner">
					<form id="routeform" name="routeform" action="?op=edit" method="post" >
						<div class="rm_admin_label">Label:</div>
						<input type="text" name="label" maxlength="63" value="{$label}" id="label"></input>
						<div class="rm_small">(required) Internal label for this route - start with letter, no spaces</div>
						
						<div class="rm_admin_label">Caption: </div>
						<input type="text" name="caption" maxlength="255" value="{$caption}" id="caption"></input>
						<div class="rm_small">(required) Text to display in tooltip for route's marker, and at top of info popup balloon</div>
						
						<div class="rm_admin_label">Tags:</div>
						<input type="text" name="tags" maxlength="255" value="" id="tags"></input>
						<div class="rm_small">(optional, comma separated) tags describing the route</div>
						
						<div class="rm_admin_label">Picture URL: </div>
						<input type="text" name="picture_url" maxlength="255" value="" id="picture_url"></input>
						<div class="rm_small">(optional) Picture to display in the info popup balloon for the route {$wsinfo}</div>
						
						<div class="rm_admin_label">Description:</div>
						<textarea rows="3" cols="32" name="description" id="description"></textarea>
						<div class="rm_small">(optional) more detailed description that appears below the picture</div>
						
						<div class="rm_admin_label">Link URL: </div>
						<input type="text" name="link_url" maxlength="255" value=""  id="link_url"></input>
						<div class="rm_small">(optional) Link to page when user clicks on picture</div>
						
						<div class="rm_admin_label">Color: </div>
						<input type="text" name="color" id="color" maxlength="32" value="" id="color"></input>
						<div class="rm_small">(optional) The RGB color of the path in #RRGGBB format</div>
						
						<div id="rm_admin_buttonblock">
							<input type="button" id="submit_btn" value="submit" />
							<input type="button" id="cancel_btn" name="cancel" value="cancel" />
						</div>

						<!-- HIDDEN FORM DATA -->
						<input type="hidden" name="edit_id" id="edit_id" maxlength="64" value="" />
						<input type="hidden" name="encoded_polyline" id="encoded_polyline" maxlength="16000" value="" />
						<input type="hidden" name="marker_pos" id="marker_pos" maxlength="64" value=""></input>
						<input type="hidden" name="bound_south" id="bound_south" maxlength="64" value=""></input>
						<input type="hidden" name="bound_west" id="bound_west" maxlength="64" value=""></input>
						<input type="hidden" name="bound_north" id="bound_north" maxlength="64" value=""></input>
						<input type="hidden" name="bound_east" id="bound_east" maxlength="64" value=""></input>

					</form>
				</div>
			</div> <!-- control-panel -->
			
			<div id="map-container">
				<div id="map-message"></div>
				<div id="map-canvas"></div>
			</div>
		
		</body>
	</html>
EOD;

	echo $html;
	
}
