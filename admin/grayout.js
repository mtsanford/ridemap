
var grayOut = {

  zindex : 50,
  opacity : 70,
  bgcolor : '#000000',
  dlgText : '<br />Please wait...<br />',

  dark : null,
  dlg : null,
  
  on : function() {
      if (!grayOut.dark) {
        // The dark layer doesn't exist, it's never been created.  So we'll
        // create it here and apply some basic styles.
        // If you are getting errors in IE see: http://support.microsoft.com/default.aspx/kb/927917
        var tbody = document.getElementsByTagName("body")[0];
        var tnode = document.createElement('div');           // Create the layer.
            tnode.style.position='absolute';                 // Position absolutely
            tnode.style.top='0px';                           // In the top
            tnode.style.left='0px';                          // Left corner of the page
            tnode.style.overflow='hidden';                   // Try to avoid making scroll bars            
            tnode.style.display='none';                      // Start out Hidden
            tnode.id='darkenScreenObject';                   // Name it so we can find it later
        tbody.appendChild(tnode);                            // Add it to the web page
        grayOut.dark =document.getElementById('darkenScreenObject');  // Get the object.
        
        var tnode2 = document.createElement('div');           // Create the layer.
            tnode2.id='grayout_dlg';                   // Name it so we can find it later
            tnode2.style.zIndex=grayOut.zindex+1;
            tnode2.innerHTML = grayOut.dlgText; 
        tbody.appendChild(tnode2);                            // Add it to the web page
        
        grayOut.dlg=document.getElementById('grayout_dlg');  // Get the object.
      }
    // Calculate the page width and height 
    var pageWidth=grayOut.windowWidth()+'px';
    var pageHeight=grayOut.windowHeight()+'px';

    //set the shader to cover the entire page and make it visible.
    var opaque = (grayOut.opacity / 100);
    dark=grayOut.dark;
    dark.style.opacity=opaque;                      
    dark.style.MozOpacity=opaque;                   
    dark.style.filter='alpha(opacity='+grayOut.opacity+')'; 
    dark.style.zIndex=grayOut.zindex;        
    dark.style.backgroundColor=grayOut.bgcolor;  
    dark.style.width= pageWidth;
    dark.style.height= pageHeight;
    dark.style.display='block';
    
    grayOut.dlg.style.display='block';
    
    grayOut.adjust();
  },
  
  off : function() {
    if (!grayOut.dark) return;
    grayOut.dark.style.display='none';
    grayOut.dlg.style.display='none';
  },

    // Reposition the gallery to be at the center of the page
    // even when the page has been scrolled
  adjust : function() {
    		var obj = grayOut.id("grayout_dlg");
    		
    		if ( !obj ) return;
    		
    		var w = grayOut.getWidth( obj );
    		var h = grayOut.getHeight( obj );
            
    		// Position the box, vertically, in the middle of the window
    		var t = grayOut.scrollY() + ( grayOut.windowHeight() / 2 ) - ( h / 2 );

    		// But no heigher than the top of the page
    		if ( t < 0 ) t = 0;
    		
    		// Position the box, horizontally, in the middle of the window
    		var l = grayOut.scrollX() + ( grayOut.windowWidth() / 2 ) - ( w / 2 );
    		
    		// But no less than the left of the page
    		if ( l < 0 ) l = 0;
    		
    		grayOut.setY( obj, t );
    		grayOut.setX( obj, l );
    },

    // A function for determining how far horizontally the browser is scrolled
    scrollX : function() {
        // A shortcut, in case weÕre using Internet Explorer 6 in Strict Mode
        var de = document.documentElement;

        // If the pageXOffset of the browser is available, use that
        return self.pageXOffset ||

            // Otherwise, try to get the scroll left off of the root node
            ( de && de.scrollLeft ) ||

            // Finally, try to get the scroll left off of the body element
            document.body.scrollLeft;
    },
        
    // A function for determining how far vertically the browser is scrolled
    scrollY : function() {
        // A shortcut, in case weÕre using Internet Explorer 6 in Strict Mode
        var de = document.documentElement;

        // If the pageYOffset of the browser is available, use that
        return self.pageYOffset ||

            // Otherwise, try to get the scroll top off of the root node
            ( de && de.scrollTop ) ||

            // Finally, try to get the scroll top off of the body element
            document.body.scrollTop;
    },

    // Find the height of the viewport
    windowHeight : function() {
        // A shortcut, in case weÕre using Internet Explorer 6 in Strict Mode
        var de = document.documentElement;

        // If the innerHeight of the browser is available, use that
        return self.innerHeight ||

            // Otherwise, try to get the height off of the root node
            ( de && de.clientHeight ) ||

            // Finally, try to get the height off of the body element
            document.body.clientHeight;
    },

    // Find the width of the viewport
    windowWidth : function() {
        // A shortcut, in case weÕre using Internet Explorer 6 in Strict Mode
        var de = document.documentElement;

        // If the innerWidth of the browser is available, use that
        return self.innerWidth ||

            // Otherwise, try to get the width off of the root node
            ( de && de.clientWidth ) ||

            // Finally, try to get the width off of the body element
            document.body.clientWidth;
    },

    // Get the actual height (using the computed CSS) of an element
    getHeight : function( elem ) {
        // Gets the computed CSS value and parses out a usable number
        return parseInt( grayOut.getStyle( elem, "height" ) );
    },

    // Get the actual width (using the computed CSS) of an element
    getWidth : function( elem ) {
        // Gets the computed CSS value and parses out a usable number
        return parseInt( grayOut.getStyle( elem, "width" ) );
    },

    // A function for setting the horizontal position of an element
    setX : function(elem, pos) {
        // Set the ÔleftÕ CSS property, using pixel units
        elem.style.left = pos + "px";
    },

    // A function for setting the vertical position of an element
    setY : function(elem, pos) {
        // Set the ÔleftÕ CSS property, using pixel units
        elem.style.top = pos + "px";
    },
    
    // Get a style property (name) of a specific element (elem)
    getStyle : function( elem, name ) {
        // If the property exists in style[], then itÕs been set recently (and is current)
        if (elem.style[name])
            return elem.style[name];

        // Otherwise, try to use IEÕs method
        else if (elem.currentStyle)
            return elem.currentStyle[name];

        // Or the W3CÕs method, if it exists
        else if (document.defaultView && document.defaultView.getComputedStyle) {
            // It uses the traditional Ôtext-alignÕ style of rule writing, instead of textAlign
            name = name.replace(/([A-Z])/g,"-$1");
            name = name.toLowerCase();

            // Get the style object and get the value of the property (if it exists)
            var s = document.defaultView.getComputedStyle(elem,"");
            return s && s.getPropertyValue(name);

        // Otherwise, weÕre using some other browser
        } else
            return null;
    },


    // A function for hiding (using display) an element
    hide : function( elem ) {
        // Find out what itÕs current display state is
        var curDisplay = grayOut.getStyle( elem, "display" );

        //  Remember its display state for later
        if ( curDisplay != "none" )
            elem.$oldDisplay = curDisplay;

        // Set the display to none (hiding the element)
        elem.style.display = "none";
    },

    // A function for showing (using display) an element
    show : function( elem ) {
        // Set the display property back to what it use to be, or use
        // ÔblockÕ, if no previous display had been saved
        elem.style.display = elem.$oldDisplay || "block";
    },

    // Returns the height of the web page
    // (could change if new content is added to the page)
    pageHeight : function() {
        return document.body.scrollHeight;
    },

    // Returns the width of the web page
    pageWidth : function() {
        return document.body.scrollWidth;
    },

    id : function( name ) {
        return document.getElementById( name );
    }

}