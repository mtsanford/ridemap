
// Create a ridemap on the elemenent with specified ID.   Options
// can be specified using opts, or if missing URL query parameters
// will be used.
var Ridemap = function(id, opts) {
	this.opts = opts || Ridemap.utils.getUrlParameters(['q', 'label', 'tag', 'region', 'wheelzoom']);
	this.routes = [];
	this.activeRoute = 0;
	this.element = document.getElementById(id);
	this.map = new google.maps.Map(this.element, { mapTypeId: google.maps.MapTypeId.ROADMAP });
	
	// The route set to include in the map can be restricted by tag OR by region
	var routeFetchURI = 'getroutes.php'
	        + (this.opts.tag ? ('?tag=' + this.opts.tag) :
		      (this.opts.region ? ('?region=' + this.opts.region) : ''));

	$.ajax({
		url: routeFetchURI,
		context: this,
		dataType: 'json',
		success: this.onRoutesFetched
	});
};

Ridemap.prototype = {

	// Callback when route list is fetched
	onRoutesFetched : function(data) {
		// set region of map displayed
		var r = (this.opts.region) ? this.opts.region.split(',')
				: [ data.bounds.s, data.bounds.w, data.bounds.n, data.bounds.e ];
		this.map.fitBounds(new google.maps.LatLngBounds(
			new google.maps.LatLng(parseFloat(r[0]), parseFloat(r[1])),
			new google.maps.LatLng(parseFloat(r[2]), parseFloat(r[3]))
		));

		data.routes.forEach(function(route) {
			this.routes[route.ID] = route;
			route.status = Ridemap.Status.NOT_LOADED;
			route.infoWindow = new google.maps.InfoWindow({
				content: "<p>loading...</p>",
			});
			route.marker = new google.maps.Marker({
				position: Ridemap.utils.parseLatLng(route.marker_pos),
				map: this.map,
				title : route.caption
			});
			
			this.setClickListener(route.marker, route.ID);
		}, this);
		
		// If label(s) or a specific route ID was specified, fetch those full
		// routes, and the zoom the region and show the route lines
		if (this.opts.label || this.opts.q) {
			var routeFetchURI = 'getroutes.php?mode=full&'
								 + (this.opts.label ? ('label=' + this.opts.label) : ('q=' + this.opts.q));
			$.ajax({
				url: routeFetchURI,
				context: this,
				dataType: 'json',
				success: this.onZoomRoutesFetched
			});
		}
	},

	// Set up a click event listener for a marker
	setClickListener : function(marker, routeID) {
		var route = this.routes[routeID];
		var map = this;
		google.maps.event.addListener(marker, 'click', function(event) {
			route.infoWindow.open(map.map, marker);
			if (map.activeRoute != routeID) {
				if (map.activeRoute) {
					map.routes[map.activeRoute].infoWindow.close();
				}
				if (!Ridemap.utils.ctrlDown) {
					map.routes.forEach(function(_route) {
						if (_route.ID != routeID && _route.line) {
							_route.line.setVisible(false);
						}
					}, map);
				}
				map.activeRoute = routeID;
				
				if (route.status == Ridemap.Status.NOT_LOADED) {
					route.status == Ridemap.Status.LOADING;
					$.ajax({
						url: 'getroutes.php?q=' + routeID,
						dataType: 'json',
						context: map,
						success: function(data) {
							this.setFullRoute(route, data['routes'][0]);
							route.line.setVisible(true);
						}
					});
				} else if (route.status == Ridemap.Status.LOADED) {
					route.line.setVisible(true);
				}
			}
		});
	},

	// A route set was requested to preload, show lines, and set map
	// bounds.   So act on the data!
	onZoomRoutesFetched : function(data) {
		data.routes.forEach(function(routeData) {
			var route = this.routes[routeData.ID];
			this.setFullRoute(route, routeData);
			route.line.setVisible(true);
		}, this);
		this.map.fitBounds(new google.maps.LatLngBounds(
			new google.maps.LatLng(data.bounds.s, data.bounds.w),
			new google.maps.LatLng(data.bounds.n, data.bounds.e)
		));
	},

	// From data fetched from getroutes.php, fill in all the data
	// in the route so that it is fully loaded.
	setFullRoute : function(route, data) {
		if (route.status < Ridemap.Status.LOADED) {
			route.status = Ridemap.Status.LOADED;
			$.extend(route, data);
			route.line = new google.maps.Polyline({
				path: google.maps.geometry.encoding.decodePath(route.encoded_polyline),
				clickable: false,
				draggable: false,
				strokeOpacity: 0.7,
				strokeWeight: 5,
				strokeColor: route.color,
				visible: false,
				map: this.map
			});
			route.infoWindow.setContent(Ridemap.makeInfoHTML(route));
		}
	}

};


/*
 *	"Static" functions
 *
 */

 
Ridemap.Status = {
	NOT_LOADED: 0,
	LOADING: 1,
	LOADED: 2
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

// For some reason Google maps does not give status of meta keys
// on click events, so we have to track this ourselves.
$( document ).ready(function() {
	Ridemap.utils.listenMetaKeys();
});


