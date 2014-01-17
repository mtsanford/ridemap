var Ridemap = {};

// Ridemap.routes[].status:
// 0 - unloaded
// 1 - load pending
// 2 - loaded
// 3 - route displayed

Ridemap.initialize = function(id) {
	Ridemap.routes = [];
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

Ridemap.setClickListener = function(marker, routeID) {
	var infowindow = new google.maps.InfoWindow({
		content: "...loading...",
		maxWidth: 256
	});
	google.maps.event.addListener(marker, 'click', function(event) {
		infowindow.open(Ridemap.map, marker);
		Ridemap.loadRoute(routeID, function() {
			infowindow.setContent(Ridemap.routes[routeID].infoHTML);
			Ridemap.routes[routeID].line.setVisible(true);
		});
	});
};

Ridemap.loadRoute = function(routeID, callback) {
	if (Ridemap.routes[routeID].status == 0) {
		Ridemap.routes[routeID].status = 1;
		$.ajax({
			url: 'getroutes.php?q=' + routeID,
			dataType: 'json',
			success: function(data) {
				Ridemap.loadRouteFull(data[0]);
				Ridemap.routes[routeID].status = 2;
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

Ridemap.loadRouteFull = function(data) {
	Ridemap.routes[data.ID] = data;
	var route = Ridemap.routes[data.ID];
	route.line = new google.maps.Polyline({
		path: google.maps.geometry.encoding.decodePath(data.encoded_polyline),
		clickable: false,
		draggable: false,
		strokeOpacity: 0.7,
		visible: false,
		map: Ridemap.map
	});
	console.log(route.line);
	route.infoHTML = Ridemap.makeInfoHTML(data);
};

Ridemap.makeInfoHTML = function(record) {
    var html = 
        '<div class="rm_infodiv"><div class="rm_caption">CAPTION</div><div class="rm_picture">'
        + '<a href="LINK_URL" target="_blank"><img class="rm_img" src="PICTURE_URL" width="PICTURE_WIDTH" '
        + 'height="PICTURE_HEIGHT" /></a><div class="rm_description">DESCRIPTION</div>'
        + '<img id="rm_mag" src="img/mg.png" width="20" height="20" /></div>';
    
    
    html = html.replace(/CAPTION/g, record['caption']);
    html = html.replace(/LINK_URL/g, record['link_url']);
    html = html.replace(/PICTURE_URL/g, record['picture_url']);
    html = html.replace(/PICTURE_WIDTH/g, record['picture_width']);
    html = html.replace(/PICTURE_HEIGHT/g, record['picture_height']);
    html = html.replace(/DESCRIPTION/g, record['description']);

    return html;
};

/*
Ridemap.markerClicked = function(event) {
	rm.element.focus();

	rm.currentindex = this.routeindex;
	console.log("got click on routeindex " + this.routeindex);
	
	var r = rm.routes[rm.currentindex];

	// If we've already loaded this route, just show the infowindow
	switch (r.status) {
		case 0:
			r.status = 1;
			var iw = new google.maps.InfoWindow({content: "<p>Loading...<p>"});
			iw.open(rm, m);
			$.ajax({
				url: rm.getroute + "q=" + r.id,
				dataType: 'json',
				success: function(data, textStatus, jqXHR) {
					var loaded = rm.loadRoute(data);
					for (idx in loaded) {
						if (loaded[idx] == rm.currentindex) {
							iw.setContent(r.infoHTML);
						}
					}
				}
			});						
			
			//rm.map.openInfoWindowHtml(this.getPosition(), "<p>Loading...<p>");
			//var grurl = rm.getroute + "q=" + r.id;
			//ajaxSend(grurl, this, this.onRouteLoaded);
			// fall through
		case 1:
			if (!MTSUtil.KeyModMonitor.ctrlKey)
			rm.unloadAllButCurrent();
			// do nothing.. we already have a load pending
			break;
		case 2:
			if (MTSUtil.KeyModMonitor.ctrlKey) {
				rm.unloadRoute(rm.currentindex);
			} else {
				rm.openInfoWnd(this.getPoint());
			}
			break;
	}
}
*/


Ridemap.utils = {
	parseLatLng: function(string) {
		var coords = string.split(',');
		return new google.maps.LatLng(parseFloat(coords[0]), parseFloat(coords[1]));
	}
};