
/*
 *	Ridemap javascript class
 *
 *  Create a ridemap on the elemenent with specified ID.
 *  Handles all interaction with Google MAPS
 *
 *  Options can be on the query string, but can be passed in
 *  in an options object on creation
 *
 */

var Ridemap = function(id, opts) {
	this.opts = $.extend(Ridemap.utils.getUrlParameters(['q', 'label', 'tag', 'region', 'wheelzoom', 'openinfo', 'maptype']), opts);
	
	// Having no default route color specified will not do.
	if ((typeof this.opts.ROUTE_COLOR == "undefined") ||  this.opts.ROUTE_COLOR.length == 0) {
		this.opts.ROUTE_COLOR = "#55F";
	}
	
	var mapTypeId;
	switch (this.opts.maptype) {
		case 'TERRAIN': mapTypeId = google.maps.MapTypeId.TERRAIN; break;
		case 'SATELLITE': mapTypeId = google.maps.MapTypeId.SATELLITE; break;
		case 'HYBRID': mapTypeId = google.maps.MapTypeId.HYBRID; break;
		default: mapTypeId = google.maps.MapTypeId.ROADMAP; break;
	}
	
	console.log(this.opts);
	
	this.admin = this.opts.mode && (this.opts.mode == 'admin');
	this.routes = [];
	this.activeRoute = 0;
	this.element = document.getElementById(id);
	this.map = new google.maps.Map(this.element, { mapTypeId: mapTypeId });
	
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

			route.infoWindow = route.infoWindow || new google.maps.InfoWindow({
				content: "<p>loading...</p>",
			});
			
			map.openInfoWindow(route);

			if (!Ridemap.utils.ctrlDown) {
				map.routes.forEach(function(_route) {
					if (_route.ID != routeID && _route.line) {
						_route.line.setVisible(false);
					}
				});
			}
				
			map.loadRoute(routeID, function() {
				route.line.setVisible(true);
			});

		});
	},

	// A route set was requested to preload, show lines, and set map
	// bounds.   So act on the data!
	onZoomRoutesFetched : function(data) {
		this.map.fitBounds(new google.maps.LatLngBounds(
			new google.maps.LatLng(data.bounds.s, data.bounds.w),
			new google.maps.LatLng(data.bounds.n, data.bounds.e)
		));
		data.routes.forEach(function(routeData) {
			var route = this.routes[routeData.ID];
			this.setFullRoute(route, routeData);
			route.line.setVisible(true);
			if (this.opts.openinfo) {
				this.openInfoWindow(route);
			}
		}, this);
	},

	// From data fetched from getroutes.php, fill in all the data
	// in the route so that it is fully loaded.  Also set up
	// the routes infoWindow, and set up any needed event handlers.
	setFullRoute : function(route, data) {
		var map = this;
		if (route.status < Ridemap.Status.LOADED) {
			route.status = Ridemap.Status.LOADED;
			$.extend(route, data);
			route.line = new google.maps.Polyline({
				path: google.maps.geometry.encoding.decodePath(route.encoded_polyline),
				clickable: false,
				draggable: false,
				strokeOpacity: 0.7,
				strokeWeight: 5,
				strokeColor: route.color.length == 0 ? this.opts.ROUTE_COLOR : route.color,
				visible: false,
				map: this.map
			});
			
			route.infoWindow = route.infoWindow || new google.maps.InfoWindow();
			route.infoWindow.setContent(this.makeInfoHTML(route));
			
			google.maps.event.addListener(route.infoWindow, 'domready', function() {
				if (map.admin) {
					$('#rm_edit-' + route.ID).click( function(event) {
						window.location = "?op=edit&id=" + map.routes[map.activeRoute].ID;
					});
					$('#rm_delete-' + route.ID).click( function(event) {
						if (!confirm("Delete route?")) return;
						$.blockUI({ message: '<h1>Just a moment...</h1>' });
						$.ajax({
							url: '?op=delete',
							type: 'POST',
							data: 'id=' + route.ID,
							success: function() {
								$.unblockUI();
								map.deleteRoute(route.ID);
							}
						});
					});
				} else {
					$('#rm_mag-' + route.ID).click( function(event) {
						map.zoomToRoute(route.ID);
					});
				}
			});
		}
	},
	
	zoomToRoute: function(routeID) {
		var route = this.routes[routeID];
		this.loadRoute(routeID, function() {
			this.openInfoWindow(route);
			route.line.setVisible(true);
			this.map.fitBounds(new google.maps.LatLngBounds(
				new google.maps.LatLng(route.bound_south, route.bound_west),
				new google.maps.LatLng(route.bound_north, route.bound_east)
			));
		});
	},
	
	// Open a routes infowindow, and close any other infowindow that
	// may be open
	openInfoWindow: function(route) {
		if (this.activeRoute && this.activeRoute != route.ID) {
			this.routes[this.activeRoute].infoWindow.close();
		}
		route.infoWindow.open(this.map, route.marker);
		this.activeRoute = route.ID;
	},
	
	makeInfoHTML : function(route) {
		var extra;
		var linkHtml;
		var picture_url = route['picture_url'].length == 0 ? this.opts.PICTURE_URL : route['picture_url'];

		if (this.opts.mode == 'admin') {
			extra = '<div class="rm_adminpanel">'
			      + '  <div>Label: LABEL</div>'
			      + '  <div>Tags: TAGS</div>'
				  + '  <div class="admin-links">'
			      + '    <a id="rm_edit-ROUTEID" class="admin-link" ref="#">edit</a>'
			      + '    <a id="rm_delete-ROUTEID" class="admin-link" href="#">delete</a>'
				  + '  </div>'
				  + '</div>';
		} else {
			extra = '<div class="rm_viewpanel"><img id="rm_mag-ROUTEID" class="rm_mag" src="img/mg.png" /></div>';
		}

		if (picture_url.length > 0) {
			if (route['link_url'].length > 0) {
				linkHtml = '<div class="rm_picture"><a href="LINK_URL" target="_blank"><img src="PICTURE_URL" /></a></div>';
			} else {
				linkHtml = '<div class="rm_picture"><img src="PICTURE_URL" /></div>';
			}
		} else {
			if (route['link_url'].length > 0) {
				linkHtml = '<div class="rm_morelink"><a href="LINK_URL" target="_blank">' +  this.opts.MORE_TEXT + '</a></div>';
			} else {
				linkHtml = "";
			}
		}
		
		var html = 
		      '<div class="rm_infodiv">'
			+ '  <div class="rm_caption">CAPTION</div>'
			+  linkHtml
			+ '  <div class="rm_description">DESCRIPTION</div>'
			+ '</div>'
			+  extra;
	
			
		html = html.replace(/CAPTION/g, route['caption']);
		html = html.replace(/LINK_URL/g, route['link_url']);
		html = html.replace(/PICTURE_URL/g, picture_url);
		html = html.replace(/DESCRIPTION/g, route['description']);
		html = html.replace(/LABEL/g, route['label']);
		html = html.replace(/TAGS/g, route['tags']);
		html = html.replace(/ROUTEID/g, route['ID']);

		return html;
	},
	
	// ensure a single route is loaded, then call the callback
	// callback may be called synchronously
	loadRoute: function(routeID, callback) {
		var route = this.routes[routeID];
		if (route.status == Ridemap.Status.NOT_LOADED) {
			route.status == Ridemap.Status.LOADING;
			this.fetchRoutes({q: routeID, fields: 'full'}, function(data) {
				this.setFullRoute(route, data['routes'][0]);
				callback.call(this);
			});
		} else if (route.status == Ridemap.Status.LOADED) {
			callback.call(this);
		}
	},
	
	fetchRoutes: function(params, success) {
		var url = (this.admin ? '../getroutes.php' : 'getroutes.php') + ((Object.keys(params).length > 0) ? ('?' + $.param(params)) : '');
		$.ajax({
			url: url,
			context: this,
			dataType: 'json',
			success: success
		});
	},
	
	deleteRoute: function(routeID) {
		var route = this.routes[routeID];
		if (route) {
			route.infoWindow.close();
			if (route.line) {
				route.line.setMap(null);
				delete route.line;
			}
			if (route.marker) {
				route.marker.setMap(null);
				delete route.marker;
			}
			delete this.routes[route.ID];
		}
		if (this.activeRoute == routeID) {
			this.activeRoute = null;
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


