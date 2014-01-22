
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
		
		RouteEdit.directionsService = new google.maps.DirectionsService();
		
		RouteEdit.directionsDisplay = new google.maps.DirectionsRenderer( {draggable: true} );

		google.maps.event.addListener(RouteEdit.map, 'click', RouteEdit.mapClick);
		
		$('#map-message').click(RouteEdit.clear);
		
		if (RouteEdit.new_route) {
			RouteEdit.setState(RouteEdit.State.STATE_FRESH);
		} else {
			RouteEdit.setState(RouteEdit.State.STATE_DEAD_LINE);
			$.ajax({
				url: "../getroutes.php?fields=full&q=" + RouteEdit.id,
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

			RouteEdit.directionsService.route(request, function(result, status) {
			
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
