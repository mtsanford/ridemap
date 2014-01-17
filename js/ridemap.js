var Ridemap = {};

// Ridemap.routes[].status:
// 0 - unloaded
// 1 - load pending
// 2 - loaded
// 3 - route displayed

Ridemap.initialize = function(id) {
	Ridemap.utils.listenMetaKeys();
	Ridemap.routes = [];
	Ridemap.activeRoute = 0;
	Ridemap.map	= new google.maps.Map(
		document.getElementById(id), {
			center: new google.maps.LatLng(37.4419, -122.1419),
			zoom: 6,
			mapTypeId:	google.maps.MapTypeId.ROADMAP,
		}
	);
	$.ajax({
		url: 'getroutes.php',
		dataType: 'json',
		success: Ridemap.onRoutesFetched
	});
};

// Callback when route list is fetched
Ridemap.onRoutesFetched = function(data) {
	data.routes.forEach(function(route) {
		Ridemap.routes[route.ID] = route;
		route.status = 0;
		
		var marker = new google.maps.Marker({
			position: Ridemap.utils.parseLatLng(route.marker_pos),
			map: Ridemap.map,
			title : route.caption
		});
		
		Ridemap.setClickListener(marker, route.ID);
	});
};

// Set up a click listener for a marker,
// and associate it with a Ridemap.routes[] using
// a closure
Ridemap.setClickListener = function(marker, routeID) {
	var route = Ridemap.routes[routeID];
	route.infoWindow = new google.maps.InfoWindow({
		content: "<p>loading...</p>",
		maxWidth: 256
	});
	google.maps.event.addListener(marker, 'click', function(event) {
		if (Ridemap.activeRoute != routeID) {
			if (Ridemap.activeRoute) {
				Ridemap.routes[Ridemap.activeRoute].infoWindow.close();
			}
			if (!Ridemap.utils.ctrlDown) {
				Ridemap.routes.forEach(function(_route) {
					if (_route.ID != routeID && _route.line) {
						_route.line.setVisible(false);
					}
				});
			}
			Ridemap.activeRoute = routeID;
			route.infoWindow.open(Ridemap.map, marker);
			Ridemap.fullyLoadRoute(routeID, function() {
				route.infoWindow.setContent(route.infoHTML);
				route.line.setVisible(true);
			});
		}
	});
};

// Fully load a route (including details & route line), and
// call callback when done.   May ball callback synchronously
// if the route is already loaded.
Ridemap.fullyLoadRoute = function(routeID, callback) {
	var route = Ridemap.routes[routeID];
	if (route.status == 0) {
		route.status = 1;
		$.ajax({
			url: 'getroutes.php?q=' + routeID,
			dataType: 'json',
			success: function(data) {
				$.extend(route, data[0]);
				route.status = 2;
				route.line = new google.maps.Polyline({
					path: google.maps.geometry.encoding.decodePath(route.encoded_polyline),
					clickable: false,
					draggable: false,
					strokeOpacity: 0.7,
					strokeWeight: 5,
					strokeColor: route.color,
					visible: false,
					map: Ridemap.map
				});
				route.infoHTML = Ridemap.makeInfoHTML(route);
				callback();
			}
		});
	} else if (Ridemap.routes[routeID].status == 1) {
		// Do nothing.
		//TODO really should cue up callbacks?
	} else {
		// status >= 2, already loaded
		callback();
	}
};


Ridemap.makeInfoHTML = function(route) {
    var html = 
        '<div class="rm_infodiv"><div class="rm_caption">CAPTION</div><div class="rm_picture">'
        + '<a href="LINK_URL" target="_blank"><img class="rm_img" src="PICTURE_URL" width="PICTURE_WIDTH" '
        + 'height="PICTURE_HEIGHT" /></a><div class="rm_description">DESCRIPTION</div>'
        + '<img id="rm_mag" src="img/mg.png" width="20" height="20" /></div>';
    
    
    html = html.replace(/CAPTION/g, route['caption']);
    html = html.replace(/LINK_URL/g, route['link_url']);
    html = html.replace(/PICTURE_URL/g, route['picture_url']);
    html = html.replace(/PICTURE_WIDTH/g, route['picture_width']);
    html = html.replace(/PICTURE_HEIGHT/g, route['picture_height']);
    html = html.replace(/DESCRIPTION/g, route['description']);

    return html;
};


/*
 *	Misc utility functions
 */

Ridemap.utils = {
	parseLatLng: function(string) {
		var coords = string.split(',');
		return new google.maps.LatLng(parseFloat(coords[0]), parseFloat(coords[1]));
	},
	listenMetaKeys: function() {
		function set(event) {
			Ridemap.utils.ctrlDown = event.ctrlKey;
		}
		$(window).keydown(set).keyup(set);
	},
	ctrlDown: false,
};