/**
* Ridemap
*
* Copyright (C) 2014 Mark T. Sanford
* Licensed under GNU GENERAL PUBLIC LICENSE version 2
* see http://www.gnu.org/licenses/gpl-2.0.txt for more information
*
*/


$( document ).ready(function() {
	Ridemap.initialize('map-canvas');
});


var Ridemap = {};

// Ridemap.routes[].status:
// 0 - unloaded
// 1 - load pending
// 2 - loaded

Ridemap.initialize = function(id) {
	Ridemap.params = Ridemap.utils.getUrlParameters(['q', 'label', 'tag', 'region', 'wheelzoom']);
	Ridemap.utils.listenMetaKeys();
	Ridemap.routes = [];
	Ridemap.activeRoute = 0;
	Ridemap.element = document.getElementById(id);
	Ridemap.map	= new google.maps.Map(Ridemap.element, { mapTypeId: google.maps.MapTypeId.ROADMAP });
	
	// The route set to include in the map can be restricted by tag OR by region
	var routeFetchURI = 'getroutes.php'
	        + (Ridemap.params.tag ? ('?tag=' + Ridemap.params.tag) :
		      (Ridemap.params.region ? ('?region=' + Ridemap.params.region) : ''));

	$.ajax({
		url: routeFetchURI,
		dataType: 'json',
		success: Ridemap.onRoutesFetched
	});
};

// Callback when route list is fetched
Ridemap.onRoutesFetched = function(data) {
	// set region of map displayed
	var r = (Ridemap.params.region) ? Ridemap.params.region.split(',')
	        : [ data.bounds.s, data.bounds.w, data.bounds.n, data.bounds.e ];
	Ridemap.map.fitBounds(new google.maps.LatLngBounds(
		new google.maps.LatLng(parseFloat(r[0]), parseFloat(r[1])),
		new google.maps.LatLng(parseFloat(r[2]), parseFloat(r[3]))
	));

	data.routes.forEach(function(route) {
		Ridemap.routes[route.ID] = route;
		route.status = 0;
		route.infoWindow = new google.maps.InfoWindow({
			content: "<p>loading...</p>",
		});
		route.marker = new google.maps.Marker({
			position: Ridemap.utils.parseLatLng(route.marker_pos),
			map: Ridemap.map,
			title : route.caption
		});
		
		Ridemap.setClickListener(route.marker, route.ID);
	});
	
	// If label(s) or a specific route ID was specified, fetch those full
	// routes, and the zoom the region and show the route lines
	if (Ridemap.params.label || Ridemap.params.q) {
		var routeFetchURI = 'getroutes.php?mode=full&'
		                     + (Ridemap.params.label ? ('label=' + Ridemap.params.label) : ('q=' + Ridemap.params.q));
		$.ajax({
			url: routeFetchURI,
			dataType: 'json',
			success: Ridemap.onZoomRoutesFetched
		});
	}
};

// Set up a click listener for a marker,
// and associate it with a Ridemap.routes[] using
// a closure
Ridemap.setClickListener = function(marker, routeID) {
	var route = Ridemap.routes[routeID];
	google.maps.event.addListener(marker, 'click', function(event) {
		route.infoWindow.open(Ridemap.map, marker);
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
			Ridemap.fullyLoadRoute(routeID, function() {
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
				Ridemap.setFullRoute(route, data['routes'][0]);
				callback();
			}
		});
	} else if (Ridemap.routes[routeID].status == 1) {
		// Do nothing.
		// TODO really should cue up callbacks?  Right now just expecting 
		// caller to check status before calling
		// and not call if status == 1
	} else {
		// status >= 2, already loaded
		callback();
	}
};

// From data fetched from getroutes.php, fill in all the data
// in the route so that it is fully loaded.
Ridemap.setFullRoute = function(route, data) {
	if (route.status == 2) return;
	$.extend(route, data);
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
	route.infoWindow.setContent(Ridemap.makeInfoHTML(route));
};


Ridemap.onZoomRoutesFetched = function(data) {
	data.routes.forEach(function(routeData) {
		var route = Ridemap.routes[routeData.ID];
		Ridemap.setFullRoute(route, routeData);
		route.line.setVisible(true);
	});
	Ridemap.map.fitBounds(new google.maps.LatLngBounds(
		new google.maps.LatLng(data.bounds.s, data.bounds.w),
		new google.maps.LatLng(data.bounds.n, data.bounds.e)
	));
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
	getUrlParameters: function(params) {
		var values = {};
		params.forEach(function(param) {
			values[param] = Ridemap.utils.getURLParameter(param);
		});
		return values;
	},
	getURLParameter: function(name) {
		return decodeURIComponent((new RegExp('[?|&]' + name + '=' + '([^&;]+?)(&|#|;|$)').exec(location.search)||[,""])[1].replace(/\+/g, '%20'))||null;
	}
};