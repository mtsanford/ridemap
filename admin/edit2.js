
RouteEdit = {

	init: function() {
		RouteEdit.id = RouteEdit.utils.getURLParameter('id');
		RouteEdit.new_route = (RouteEdit.id === 'new');
		RouteEdit.map = new google.maps.Map(document.getElementById('map-canvas'), {
		   zoom:7,
		   mapTypeId: google.maps.MapTypeId.ROADMAP,
		   center: new google.maps.LatLng(35.7711329, -120.9741874),
		   draggableCursor: 'crosshair'
		});
		
		if (!RouteEdit.new_route) {
			$.ajax({
				url: "../getroutes.php?fields=complete&q=" + RouteEdit.id,
				dataType: 'json',
				success: function(data) {
					RouteEdit.loadRoute(data.routes[0]);
					RouteEdit.map.fitBounds(new google.maps.LatLngBounds(
						new google.maps.LatLng(data.bounds.s, data.bounds.w),
						new google.maps.LatLng(data.bounds.n, data.bounds.e)
					));
					RouteEdit.showRoute();
				}
			});
		}
	},
	
	// load route from getroutes response
	loadRoute: function(data) {
		RouteEdit.route = data;

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
		
		var wayStrings = (RouteEdit.route.way_points || '').split(';');
		RouteEdit.route.way_points = [];
		wayStrings.forEach(function(string) {
			var c = string.split(',');
			RouteEdit.route.way_points.push(new google.maps.LatLng(parseFloat(c[0]), parseFloat(c[1])));
		});
		
	},
	
	showRoute: function () {
		if (RouteEdit.line) {
			RouteEdit.line.setMap(null);
		}
		RouteEdit.markers.forEach(function(marker) {
			marker.setMap(null);
		});
		RouteEdit.markers = [];
		RouteEdit.line = new google.maps.Polyline({
			path: google.maps.geometry.encoding.decodePath(RouteEdit.route.encoded_polyline),
			clickable: false,
			draggable: false,
			strokeOpacity: 0.7,
			strokeWeight: 5,
			strokeColor: RouteEdit.route.color,
			visible: true,
			map: this.map
		});
		RouteEdit.route.way_points.forEach( function(latlng) {
			m = new google.maps.Marker({
				position: latlng,
				map: RouteEdit.map,
				visible: true
			});
			RouteEdit.markers.push(m);
		});
	},

	route: null,
	line: null,
	markers: [],
	way_points: [],
	
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
