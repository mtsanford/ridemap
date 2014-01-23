
RouteEdit = {

	init: function() {
		RouteEdit.id = RouteEdit.utils.getURLParameter('id');
		RouteEdit.new_route = (RouteEdit.id === 'new');
		
		RouteEdit.map = new google.maps.Map(document.getElementById('map-canvas'), {
		   mapTypeId: google.maps.MapTypeId.ROADMAP,
		   draggableCursor: 'crosshair'
		});
		
		RouteEdit.directionsService = new google.maps.DirectionsService();
		
		RouteEdit.directionsDisplay = new google.maps.DirectionsRenderer( {draggable: true} );

		google.maps.event.addListener(RouteEdit.map, 'click', RouteEdit.mapClick);
		
		$('#map-message').click(RouteEdit.clear);
		
		$('#cancel_btn').click(function() {
			window.location = window.location.pathname;
		});
		
		$('#submit_btn').click(function() {
			RouteEdit.getEncodedPolyLine();
		});
		
		if (RouteEdit.new_route) {
			RouteEdit.setState(RouteEdit.State.STATE_FRESH);
			var boundsString = RouteEdit.utils.getURLParameter('bounds');
			var bounds = boundsString 
				? RouteEdit.utils.parseBounds(boundsString)
		        : new google.maps.LatLngBounds( new google.maps.LatLng(-89, -179), new google.maps.LatLng(89, 179) );
			RouteEdit.map.fitBounds(bounds);
		} else {
			RouteEdit.setState(RouteEdit.State.STATE_DEAD_LINE);
			$.ajax({
				url: "getroutes.php?fields=full&q=" + RouteEdit.id,
				dataType: 'json',
				success: RouteEdit.loadRoute
			});
		}
		
	},
	
	// load route from getroutes response
	loadRoute: function(data) {
		RouteEdit.route = data.routes[0];

		RouteEdit.map.fitBounds(new google.maps.LatLngBounds(
			new google.maps.LatLng(data.bounds.s, data.bounds.w),
			new google.maps.LatLng(data.bounds.n, data.bounds.e)
		));
		
		RouteEdit.line = new google.maps.Polyline({
			path: google.maps.geometry.encoding.decodePath(RouteEdit.route.encoded_polyline),
			clickable: false,
			draggable: false,
			strokeOpacity: 0.7,
			strokeWeight: 5,
			strokeColor: "#000",
			visible: true,
			map: RouteEdit.map
		});

		for(var prop in RouteEdit.route) {
		   if (RouteEdit.route.hasOwnProperty(prop)) {
				$('#'+prop).val(RouteEdit.route[prop]);
		   }
		}
		
	},
	
	mapClick: function(event) {

		if (RouteEdit.state == RouteEdit.State.STATE_FRESH) {
			RouteEdit.startMarker = new google.maps.Marker({
				position: event.latLng,
				map: RouteEdit.map,
				visible: true,
				clickable: false,
				optimized: false
			});
			RouteEdit.setState(RouteEdit.State.STATE_HAVE_START);
			return;
		}
	
		if (RouteEdit.state == RouteEdit.State.STATE_HAVE_START) {
	
			var request = {
				origin: RouteEdit.startMarker.getPosition(),
				destination: event.latLng,
				travelMode: google.maps.DirectionsTravelMode.DRIVING
			};

			$.blockUI({ message: '<h1>Just a moment...</h1>' });
			
			RouteEdit.directionsService.route(request, function(result, status) {
			
				$.unblockUI();
				
				if (status != google.maps.DirectionsStatus.OK) {
					console.log(status);
					return;
				}
					
				RouteEdit.startMarker.setMap(null);
				RouteEdit.startMarker = null;
				
				RouteEdit.directionsDisplay.setMap(RouteEdit.map);
				RouteEdit.directionsDisplay.setDirections(result);

				RouteEdit.setState(RouteEdit.State.STATE_HAVE_DESTINATION);
			});
			
			return;
		}

	},
	
	getEncodedPolyLine: function() {
		// The first point of each path in a step is typically the same
		// as the last point in the previous path.  Check for this
		// so we don't have multiple copies of the point on the final path.
		var lastPoint = new google.maps.LatLng(0,0);
		var points = [];
		var result = RouteEdit.directionsDisplay.getDirections();
		var index = RouteEdit.directionsDisplay.getRouteIndex();		
		
		result.routes[index].legs.forEach(function(leg) {
			leg.steps.forEach(function(step) {
				step.path.forEach(function(point) {
					if (!lastPoint.equals(point)) {
						points.push(point);
					}
					lastPoint = point;
				});
			});
		});
		
		var encoded_polyline = google.maps.geometry.encoding.encodePath(points);
		$('#encoded_polyline').val(encoded_polyline);

		var centerPoint = points[Math.floor(points.length / 2)];
		$('#marker_pos').val('' + centerPoint.lat() + ',' + centerPoint.lng());

		var bound_south = 90;
		var bound_west = 180;
		var bound_north = -90;
		var bound_east = -180;
		
		points.forEach(function(p) {
			bound_south = Math.min(p.lat(), bound_south);
			bound_west = Math.min(p.lng(), bound_west);
			bound_north = Math.max(p.lat(), bound_north);
			bound_east = Math.max(p.lng(), bound_east);
		});
		
		$('#bound_south').val(bound_south);
		$('#bound_west').val(bound_west);
		$('#bound_north').val(bound_north);
		$('#bound_east').val(bound_east);
		
		if (RouteEdit.id != 'new') {
			$('#edit_id').val(RouteEdit.id);
		}
		
		console.log(bound_south + ', ' + bound_west + ', ' + bound_north + ', ' + bound_east);
		console.log(centerPoint.lat() + ',' + centerPoint.lng());
		
		$( "#routeform" ).submit();
			
	},

	clear: function() {
	
		if (      RouteEdit.state == RouteEdit.State.STATE_HAVE_DESTINATION 
		       || RouteEdit.state == RouteEdit.State.STATE_DEAD_LINE
		       || RouteEdit.state == RouteEdit.State.STATE_DEAD_LINE) {
			   
			RouteEdit.directionsDisplay.setMap(null);
			
			if (RouteEdit.startMarker) {
				RouteEdit.startMarker.setMap(null);
				RouteEdit.startMarker = null;
			}
			
			if (RouteEdit.line) {
				RouteEdit.line.setMap(null);
				RouteEdit.line = null;
			}

			RouteEdit.setState(RouteEdit.State.STATE_FRESH);

		}
	},
	
	setState: function(state) {
		var messages = {};
		messages[RouteEdit.State.STATE_UNDEFINED] = "Bad state";
		messages[RouteEdit.State.STATE_FRESH] = "Click a starting point";
		messages[RouteEdit.State.STATE_HAVE_START] = "Click a destination point";
		messages[RouteEdit.State.STATE_HAVE_DESTINATION] = "Drag route to change, or click here to start over";
		messages[RouteEdit.State.STATE_DEAD_LINE] = "Click here to start over";

		RouteEdit.state = state;
		$("#map-message").text(messages[state]);
	},
	
	directionsService: null,
	
	directionsDisplay: null,
	
	route: {
		caption: "",
		label: "",
		description: "",
		tags: "",
		color: "",
		picture_url: "",
		link_url: "",
		encoded_polyline: ""
	},

	line: null,
	
	startMarker: null,
	
	State: {
		STATE_UNDEFINED: 0,
		STATE_FRESH: 1,
		STATE_HAVE_START: 2,
		STATE_HAVE_DESTINATION: 3,
		STATE_DEAD_LINE: 4
	},
		 
	/*
	 * Utility functions 
	 */
	 
	utils: {
		parseLatLng: function(string) {
			var coords = string.split(',');
			return new google.maps.LatLng(parseFloat(coords[0]), parseFloat(coords[1]));
		},
		parseBounds: function(string) {
			var boundsArray = string.split(',');
			return new google.maps.LatLngBounds(
				new google.maps.LatLng(boundsArray[0], boundsArray[1]),
			    new google.maps.LatLng(boundsArray[2], boundsArray[3]));
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
