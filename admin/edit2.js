
RouteEdit = {

	init: function() {
		RouteEdit.id = RouteEdit.utils.getURLParameter('id');
		RouteEdit.new_route = (RouteEdit.id === 'new');
		RouteEdit.map = new google.maps.Map(document.getElementById('map-canvas'), {
		   zoom:5,
		   mapTypeId: google.maps.MapTypeId.ROADMAP,
		   center: new google.maps.LatLng(37.7711329, -90.9741874),
		   draggableCursor: 'crosshair'
		});
		
		google.maps.event.addListener(RouteEdit.map, 'click', function(event) {
			RouteEdit.addWayPoint(event.latLng);
        });
		
		$('#map-undo').click(function(event) {
		});

		$('#map-clear').click(function(event) {
		});
		
		if (RouteEdit.new_route) {
			RouteEdit.route = {
				caption: "",
				label: "",
				description: "",
				tags: "",
				color: "",
				picture_url: "",
				link_url: "",
				way_points: [],
				raw_points: [],
				encoded_polyline: ""
			}
		} else {
			$.ajax({
				url: "../getroutes.php?fields=complete&q=" + RouteEdit.id,
				dataType: 'json',
				success: function(data) {
					RouteEdit.loadRoute(data.routes[0]);
					RouteEdit.map.fitBounds(new google.maps.LatLngBounds(
						new google.maps.LatLng(data.bounds.s, data.bounds.w),
						new google.maps.LatLng(data.bounds.n, data.bounds.e)
					));
					RouteEdit.route.way_points.forEach(RouteEdit.addMarker);
					RouteEdit.refreshLine();
				}
			});
		}
		
	},
	
	// load route from getroutes response
	loadRoute: function(data) {
		RouteEdit.route = data;
		console.log(data);

		for(var prop in RouteEdit.route) { 
		   if (RouteEdit.route.hasOwnProperty(prop)) {
				$('#'+prop).val(RouteEdit.route[prop]);
		   }
		}

		// Convert coordinate strings to LatLng objects
		// Some legacy data does not way/raw point data
		var rawStrings = (RouteEdit.route.raw_points || '').split(';');
		RouteEdit.route.raw_points = [];
		rawStrings.forEach(function(string) {
			var c = string.split(',');
			RouteEdit.route.raw_points.push(new google.maps.LatLng(parseFloat(c[0]), parseFloat(c[1])));
		});

		// legacy routes did not save raw points, so reconstruct from encoded path
		if (RouteEdit.route.raw_points.length == 0) {
			RouteEdit.route.raw_points = google.maps.geometry.encoding.decodePath(RouteEdit.route.encoded_polyline);
		}
		
		var wayStrings = (RouteEdit.route.way_points || '').split(';');
		RouteEdit.route.way_points = [];
		wayStrings.forEach(function(string) {
			var c = string.split(',');
			RouteEdit.route.way_points.push(new google.maps.LatLng(parseFloat(c[0]), parseFloat(c[1])));
		});
		
	},
	
	showRoute: function () {
		RouteEdit.markers.forEach(function(marker) {
			marker.setMap(null);
		});
		RouteEdit.markers = [];
		RouteEdit.route.raw_points = google.maps.geometry.encoding.decodePath(RouteEdit.route.encoded_polyline);
		RouteEdit.route.way_points.forEach(RouteEdit.addMarker);
		RouteEdit.refreshLine();
	},

	addMarker: function(point) {
		m = new google.maps.Marker({
			position: point,
			map: RouteEdit.map,
			visible: true,
			clickable: false
		});
		RouteEdit.markers.push(m);
	},
	
	refreshLine: function() {
		if (RouteEdit.line) {
			RouteEdit.line.setMap(null);
		}
		RouteEdit.line = new google.maps.Polyline({
			path: RouteEdit.route.raw_points,
			clickable: false,
			draggable: false,
			strokeOpacity: 0.7,
			strokeWeight: 5,
			strokeColor: "#000",
			visible: true,
			map: RouteEdit.map
		});
	},
	
	addWayPoint: function(newWayPoint) {
	
		console.log(newWayPoint);
		
		if (RouteEdit.route.way_points.length == 0) {
			RouteEdit.route.way_points.push(newWayPoint);
			RouteEdit.addMarker(newWayPoint);
			return;
		}
	
		var request = {
			origin: RouteEdit.route.way_points[RouteEdit.route.way_points.length - 1],
			destination: newWayPoint,
			travelMode: google.maps.DirectionsTravelMode.DRIVING
		};

		RouteEdit.directionsService.route(request, function(result, status) {
		
			if (status != google.maps.DirectionsStatus.OK) {
				console.log(status);
				return;
			}
				
			RouteEdit.route.way_points.push(newWayPoint);
			
			// The first point of each path in a step is typically the same
			// as the last point in the previous path.  Check for this
			// so we don't have multiple copies of the point on the final path.
			var lastPoint = (RouteEdit.route.raw_points.length > 0)
							? RouteEdit.route.raw_points[RouteEdit.route.raw_points.length-1] 
							: new google.maps.LatLng(0,0);
			
			result.routes[0].legs.forEach(function(leg) {
				leg.steps.forEach(function(step) {
					step.path.forEach(function(point) {
						if (!lastPoint.equals(point)) {
							RouteEdit.route.raw_points.push(point);
						}
						lastPoint = point;
					});
				});
			});

			RouteEdit.route.encoded_polyline = google.maps.geometry.encoding.encodePath(RouteEdit.route.raw_points);
			
			RouteEdit.refreshLine();
			
			RouteEdit.addMarker(newWayPoint);

			//console.log(JSON.stringify(pathPoints));
		});

	},
	
	directionsService: new google.maps.DirectionsService(),
	route: null,
	line: null,
	markers: [],
	
	/*
	 * Utility functions 
	 */
	 
	utils: {
		parseLatLng: function(string) {
			var coords = string.split(',');
			return new google.maps.LatLng(parseFloat(coords[0]), parseFloat(coords[1]));
		},
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
	}

}

$( document ).ready(function() {
	RouteEdit.init();
});
