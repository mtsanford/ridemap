/**
* @package 'Route Groups for Google Maps'
* @copyright Copyright (C) 2007 Mark Sanford. All rights reserved.
* @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
* Route Groups for Google Maps is free software. This version may have been
* modified pursuant to the GNU General Public License, and as distributed it
* includes or is derivative of works licensed under the GNU General Public License
* or other free or open source software licenses.
* See COPYRIGHT.txt for copyright notices and details.
*/
    
    // Global map object
    var makeRouteMap = null;

    function MakeRouteMap() {
	  this.haveRoute = false;
      this.waypoints = new Array();
      this.newWayPoints = new Array();
      this.markers = new Array();
      this.polyline = null;
	  this.setHaveRoute(false);
	  this.routeDirty = false;
	  this.canEdit = true;

      this.map = new GMap2(document.getElementById("map_canvas"), { draggableCursor: 'crosshair' });

      this.map.setCenter(new GLatLng(
        parseFloat(document.getElementById("pass_lat").innerHTML),
        parseFloat(document.getElementById("pass_lng").innerHTML)),
        parseInt(document.getElementById("pass_zoom").innerHTML));
        
      this.map.enableScrollWheelZoom();

      this.map.addControl(new GSmallMapControl());

	  this.map.addControl(new ClearUndoControls());

	  this.gdir = new GDirections(null, null);
      GEvent.bind(this.gdir, "load", this, this.onGDirectionsLoad);
      GEvent.bind(this.gdir, "error", this, this.handleErrors);
	  
      var myEventListener = GEvent.bind(this.map, "click", this, this.onMapClick); 
	  
    }

    MakeRouteMap.prototype.setHaveRoute = function(state) {
	    this.haveRoute = state;
    	document.getElementById("submitbtn").disabled = !state;
    	document.getElementById("rm_noroute").style.visibility = state ? 'hidden' : 'visible';
	}

    MakeRouteMap.prototype.onMapClick = function(marker,point) {
        if (point && !marker && this.canEdit)
        {
            var l = this.waypoints.length;
            
            if (l == 0) {
                this.waypoints[0] = point;
                var marker = new GMarker(point);
                this.markers[0] = marker;
                this.map.addOverlay(marker);
            } else {
                this.newWayPoints = this.waypoints.slice();
                this.newWayPoints[this.newWayPoints.length] = point;
                this.calculateRouteLine();
            }
        }
    }

    MakeRouteMap.prototype.clearMap = function() {
		if (confirm("Clear all points from map?"))
			this.ResetMap();
	}

    MakeRouteMap.prototype.undo = function() {
        var l = this.waypoints.length;
		if (l == 0 || !this.canEdit) {
			return;
		}
		if (l == 1) {
			this.ResetMap();
			return;
		}
        if (l == 2) {
            this.setHaveRoute(false);
            if (this.polyline != null)
                this.map.removeOverlay(this.polyline);
            this.map.removeOverlay(this.markers[1]);
            this.markers.length = 1;
            this.waypoints.length = 1;
            return;
        }

        // otherwise we need to calculate a new polyline
        this.newWayPoints = this.waypoints.slice();
        this.newWayPoints.length--;
        this.calculateRouteLine();
			
	}

	MakeRouteMap.prototype.calculateRouteLine = function() {
        grayOut.on();
        this.gdir.loadFromWaypoints(this.newWayPoints, 
			 { locale : "en_US" , preserveViewport : true, getPolyline : true }	);
    }
    
    
	MakeRouteMap.prototype.onGDirectionsLoad = function() {
        var i;
		var route = this.gdir.getPolyline();
		
		// convert to an encoded polyline overlay
		if (route != null)
		{
            this.waypoints = this.newWayPoints;

            this.setHaveRoute(true);
			this.routeDirty = true;
            
            if (this.polyline != null)
                this.map.removeOverlay(this.polyline);

            // redo the markers
			for (i=0; i<this.markers.length; i++) {
                this.map.removeOverlay(this.markers[i]);
            }
			for (i=0; i<this.waypoints.length; i++) {
                var marker = new GMarker(this.waypoints[i]);
                this.markers[i] = marker;
                this.map.addOverlay(marker);
            }
            this.markers.length = this.waypoints.length; 

			var rawVertices = new Array();
			for (i=0; i<route.getVertexCount(); i++)
				rawVertices[i] = route.getVertex(i);
				
			var raw_points_txt = encodePointsArray(rawVertices);
			
			var waypoint_txt = encodePointsArray(this.waypoints);

            // note: The encoder runs in polynonial time on IE
			var polylineEncoder = new PolylineEncoder(4, 8, 0.00002);
			var jsonEncoded = polylineEncoder.dpEncode(rawVertices);

			document.getElementById("way_points").value = waypoint_txt;
			document.getElementById("raw_points").value = raw_points_txt;
			document.getElementById("encoded_polyline").value = jsonEncoded.encodedPoints;
			document.getElementById("encoded_levels").value = jsonEncoded.encodedLevels;
			document.getElementById("zoomfactor").value = '8';
			document.getElementById("numlevels").value = '4';
            
            // compute router marker position as middle point in route
			var midIndex = Math.floor(route.getVertexCount() / 2);
			var midPt = new Array();
			midPt[0] = route.getVertex(midIndex);
			var midText = encodePointsArray(midPt);
			document.getElementById("marker_pos").value = midText;
            
            this.AddOverlay();

            grayOut.off();
			
		}
		
	}

    MakeRouteMap.prototype.handleErrors = function() {
       grayOut.off();
	   if (this.gdir.getStatus().code == G_GEO_UNKNOWN_ADDRESS)
	     alert("No corresponding geographic location could be found for one of the specified addresses. "
                + "This may be due to the fact that the address is relatively new, or it may be incorrect.");
	   else if (this.gdir.getStatus().code == G_GEO_SERVER_ERROR)
	     alert("A geocoding or directions request could not be successfully processed, yet the exact reason "
                + "for the failure is not known.");
	   else if (this.gdir.getStatus().code == G_GEO_MISSING_QUERY)
	     alert("The HTTP q parameter was either missing or had no value. For geocoder requests, this means that an empty  "
                + "address was specified as input. For directions requests, this means that no query was specified in the input.");
	//   else if (gdir.getStatus().code == G_UNAVAILABLE_ADDRESS)  <--- Doc bug... this is either not defined, or Doc is wrong
	//     alert("The geocode for the given address or the route for the given directions query cannot be returned due to legal or contractual reasons.\\n Error code: " + gdir.getStatus().code);
	   else if (this.gdir.getStatus().code == G_GEO_BAD_KEY)
	     alert("The given key is either invalid or does not match the domain for which it was given.  " );
	   else if (this.gdir.getStatus().code == G_GEO_BAD_REQUEST)
	     alert("A directions request could not be successfully parsed.");
	   else alert("An unknown error occurred.");
    }
    
    
    // Add the overlays from the hidden form fields
	MakeRouteMap.prototype.AddOverlay = function() {
	        var encodedPolyline = new GPolyline.fromEncoded({
				color: document.getElementById("color").value,
				weight: 5,
                opacity : 0.7,
				points: document.getElementById("encoded_polyline").value,
				levels: document.getElementById("encoded_levels").value,
				zoomFactor: document.getElementById("zoomfactor").value,
				numLevels: document.getElementById("numlevels").value
			});
			this.map.addOverlay(encodedPolyline);
            this.polyline = encodedPolyline;
    }

	
    MakeRouteMap.prototype.ResetMap = function() {
        this.map.clearOverlays();
        this.waypoints = new Array();
        this.markers = new Array();
        this.gdir.clear();
		this.setHaveRoute(false);
        this.canEdit = true;
	}
	

            function rm_wheelevent(e)
            {
            if (!e){
                e = window.event
            }
            if (e.preventDefault){
                e.preventDefault()
            }
            e.returnValue = false;
            }



    // Load a route from an JSON http request responce
    function loadRoute(responseText)
    {
        if (responseText.length > 0) {
            var oObject = responseText.parseJSON();
    		for (var idx in oObject)
    		{
				if (! oObject.hasOwnProperty(idx)) continue;
				
    			var route = oObject[idx];
                document.getElementById("label").value = route['label'];
                document.getElementById("tags").value = route['tags'];
                document.getElementById("caption").value = route['caption'];
                document.getElementById("description").value = route['description'];
                document.getElementById("picture_url").value = route['picture_url'];
                document.getElementById("color").value = route['color'];
                document.getElementById("link_url").value = route['link_url'];
                document.getElementById("way_points").value = route['way_points'];
                document.getElementById("raw_points").value = route['raw_points'];
                document.getElementById("encoded_polyline").value = route['encoded_polyline'];
                document.getElementById("encoded_levels").value = route['encoded_levels'];
                document.getElementById("zoomfactor").value = route['zoomfactor'];
                document.getElementById("numlevels").value = route['numlevels'];
                document.getElementById("marker_pos").value = route['marker_pos'];
                
                makeRouteMap.AddOverlay();

				makeRouteMap.setHaveRoute(true);
                
                //zoom and center on route
                var sw = new GLatLng( route['bound_south'], route['bound_west']);
                var ne = new GLatLng(route['bound_north'], route['bound_east']);
                var bounds = new GLatLngBounds(sw, ne);
                var center = bounds.getCenter();
                var zoom = makeRouteMap.map.getBoundsZoomLevel(bounds)-1;
                makeRouteMap.map.setCenter(center, zoom);
               
                break;
            }
        }
		else
		{
			alert("Route not found");
			window.location = ".";
		}
    }

    function on_load() {
	
        makeRouteMap = new MakeRouteMap();
        GEvent.addDomListener(makeRouteMap.map.getContainer(), "DOMMouseScroll", rm_wheelevent);
        makeRouteMap.map.getContainer().onmousewheel = rm_wheelevent;
        makeRouteMap.canEdit = false;

        // If there is an ID in the 'edit_id' element, fetch that route from the database, otherwise
        // start a new route
        var id = document.getElementById("edit_id").value;
        if (id.length > 0) {
            var request = GXmlHttp.create();
            request.open("GET", "../getroutes.php?mode=edit&q=" + id, true);
            request.onreadystatechange = function() {
                // ! need to prevent user from changing active route!!
              if (request.readyState == 4) {
                loadRoute(request.responseText);
              }
            }
            request.send(null);
        } else {
            makeRouteMap.canEdit = true;
            document.getElementById("caption").value = "Enter a caption";
            document.getElementById("link_url").value = "http://www.google.com/apis/maps/";
            document.getElementById("color").value = "#AA33AA";
        }
        grayOut.dlgText = '<br/><br/>Calculating Route<br/><br/>Please Wait...<br/><br/>';
        document.getElementById("submitbtn").onclick = on_submit;
        document.getElementById("cancel").onclick = on_cancel;
        document.getElementById("help").onclick = on_help;
    }
    
    function on_submit() {
			// If we have not changed the route line, don't bother sending the
			// info back to the server.
			if (makeRouteMap.routeDirty == false)
			{
                document.getElementById("way_points").value = "";
                document.getElementById("raw_points").value = "";
                document.getElementById("encoded_polyline").value = "";
                document.getElementById("encoded_levels").value = "";
                document.getElementById("zoomfactor").value = "";
                document.getElementById("numlevels").value = "";
                document.getElementById("marker_pos").value = "";
			}
			document.routeform.submit();
	}

    function on_cancel() {
        window.location = 'index.php';
    }
    
    var helpwindow = null;
    function on_help() {
        helpwindow = window.open("edithelp.htm", "mywindow","menubar=0,resizable=1,width=600,height=600");
        //if (window.sizeToContent) window.sizeToContent();
    }
    
	/*
	 *	Custom controls	
	 */

    function ClearUndoControls() {
    }
    ClearUndoControls.prototype = new GControl();

    ClearUndoControls.prototype.initialize = function(map) {
      var container = document.createElement("div");

      var clearDiv = document.createElement("div");
      this.setButtonStyle_(clearDiv);
      container.appendChild(clearDiv);
      clearDiv.appendChild(document.createTextNode("Clear Map"));
      GEvent.addDomListener(clearDiv, "click", function() {
        makeRouteMap.clearMap();
      });

      var undoDiv = document.createElement("div");
      this.setButtonStyle_(undoDiv);
      container.appendChild(undoDiv);
      undoDiv.appendChild(document.createTextNode("Undo Last Point"));
      GEvent.addDomListener(undoDiv, "click", function() {
        makeRouteMap.undo();
      });

      map.getContainer().appendChild(container);
      return container;
    }

    // By default, the control will appear in the top left corner of the
    // map with 7 pixels of padding.
    ClearUndoControls.prototype.getDefaultPosition = function() {
      return new GControlPosition(G_ANCHOR_TOP_LEFT, new GSize(50, 7));
    }

    // Sets the proper CSS for the given button element.
    ClearUndoControls.prototype.setButtonStyle_ = function(button) {
      button.style.textDecoration = "underline";
      button.style.color = "#0000cc";
      button.style.backgroundColor = "white";
      button.style.font = "small Arial";
      button.style.border = "1px solid black";
      button.style.padding = "2px";
      button.style.marginBottom = "3px";
      button.style.textAlign = "center";
      button.style.width = "6em";
      button.style.cursor = "pointer";
    }

        // 'floor' string to nearest 0.00001 (~2meters @ equator)
        function roundString(numstr)
        {
            var decimal = numstr.indexOf(".");
            if (decimal > 0)
            {
                var maxlen = decimal + 6;
                if (numstr.length > maxlen)
                    return numstr.substr(0,maxlen);
            }
            return numstr;
        }
		
		function encodePointsArray(points)
		{
			var sb = [];
			var out = "";
			for (var i=0; i<points.length; i++) {
                var pointstr = + roundString(points[i].lat().toString()) + "," + roundString(points[i].lng().toString());
                if (i>0)
                    pointstr = ";" + pointstr;
				sb[i] = pointstr;
			}
			return sb.join('');
		}


