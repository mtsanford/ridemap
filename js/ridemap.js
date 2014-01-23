
// Create a ridemap on the elemenent with specified ID.   Options
// can be specified using opts, or if missing URL query parameters
// will be used.
var Ridemap = function(id, opts) {
	this.opts = opts || Ridemap.utils.getUrlParameters(['q', 'label', 'tag', 'region', 'wheelzoom']);
	this.admin = this.opts.mode && (this.opts.mode == 'admin');
	this.routes = [];
	this.activeRoute = 0;
	this.element = document.getElementById(id);
	this.map = new google.maps.Map(this.element, { mapTypeId: google.maps.MapTypeId.ROADMAP });
	
	// The route set to include in the map can be restricted by tag OR by region
	var fetchParams = {};
	if (this.opts.tag) {
		fetchParams.tag = this.opts.tag;
	} else if (this.opts.region) {
		fetchParams.region = this.opts.region;
	}

	this.fetchRoutes(fetchParams, this.onRoutesFetched);

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
			var params = { fields: 'full' };
			if (this.opts.label) {
				params.label = this.opts.label;
			} else {
				params.q = this.opts.q;
			}
			this.fetchRoutes(params, this.onZoomRoutesFetched);
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
					map.fetchRoutes({q: routeID, fields: 'full'}, function(data) {
						map.setFullRoute(route, data['routes'][0]);
						route.line.setVisible(true);
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
			route.infoWindow.setContent(this.makeInfoHTML(route));
			if (this.admin) {
				var map = this;
				google.maps.event.addDomListener(document.getElementById("rm_edit-" + route.ID), 'click', function() {
					window.location = "?id=" + map.routes[map.activeRoute].ID;
				});
				google.maps.event.addDomListener(document.getElementById("rm_delete-" + route.ID), 'click', function() {	
					if (map.activeRoute < 0) return;
					//this.map.closeInfoWindow();
					if (!confirm("Delete route?")) return;
					//ajaxSend("delete.php?id=" + this.routes[this.activeRoute].ID, this, function();
					//!what happenens if user click marker while we're waiting?
				});
			}
		}
	},
	
	zoomToRoute: function(id) {
	},
	
	makeInfoHTML : function(route) {
		var html = 
			'<div class="rm_infodiv"><div class="rm_caption">CAPTION</div><div class="rm_picture">'
			+ '<a href="LINK_URL" target="_blank"><img class="rm_img" src="PICTURE_URL" width="240px" />'
			+ '</a></div><div class="rm_description">DESCRIPTION</div>'
	
		if (this.opts.mode == 'admin') {
			html = html + '</div><div class="rm_adminpanel"><div>Label: LABEL</div>'
			            + '<div>Tags: TAGS</div><div class="admin-links">'
			            + '<a id="rm_edit-ROUTEID" class="admin-link" ref="#">edit</a>'
						+ '<a id="rm_delete-ROUTEID" class="admin-link" href="#">delete</a></div></div>';
		} else {
			html = html + '<img class="rm_mag" src="img/mg.png" /></div>';
		}
			
		html = html.replace(/CAPTION/g, route['caption']);
		html = html.replace(/LINK_URL/g, route['link_url']);
		html = html.replace(/PICTURE_URL/g, route['picture_url']);
		html = html.replace(/PICTURE_WIDTH/g, route['picture_width']);
		html = html.replace(/PICTURE_HEIGHT/g, route['picture_height']);
		html = html.replace(/DESCRIPTION/g, route['description']);
		html = html.replace(/LABEL/g, route['label']);
		html = html.replace(/TAGS/g, route['tags']);
		html = html.replace(/ROUTEID/g, route['ID']);

		return html;
	},
	
	fetchRoutes: function(params, success) {
		var url = 'getroutes.php' + ((Object.keys(params).length > 0) ? ('?' + $.param(params)) : '');
		$.ajax({
			url: url,
			context: this,
			dataType: 'json',
			success: success
		});
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


