# ridemap

##Summary:

Google Maps version 3 based database of road paths (polylines), with admin interface for editing and tagging paths.
A marker is displayed for each path on a google map, and the full route, with additional information
is shown in a google maps infoWindow when the marker is clicked on.   In the infoWindow is a user specified image
that links to a user specified URL.

##Dependencies:

A server with PHP and MySQL installed.   Sorry not sure which versions are needed, but nothing fancy is
being done, so if it's not older that 2008 vintage you should be fine.

##Sample screen shots:

###A map:
![Admin page](img/map-sample.jpg)

###Administration interface:
![Admin page](img/admin-sample.jpg)

###Tagger interface:
![Admin page](img/tagger-sample.jpg)

##Installation

1. Download the source files and place them in a folder where your webserver can find them.
2. Create a database
3. Rename config_sample.php to config.php, and edit it to put in your database settings. 
4. Run the install script in the admin/ folder by pointing your broswer to it.  
   e.g. (http://my.site.com/ridemap/admin/install.php)
5. Click the admin link, choose a password for the administation interface.
6. Start creating routes.

##Use

The preferred way to use ridemap is to embed index.php in an iframe in your webpage.   For example,
if I have ridemap installed at http://localhost/ridemap:

```
<!DOCTYPE html>
<html>
	<head>
	</head>
	<body>
		<p>this is my map:</p>
		<iframe src="http://localhost/ridemap/index.php" width="400" height="400" scrolling="no"></iframe>
	</body>
</html>
```

##Options

URL parameters can be specified to control how the map is displayed.   If no options are given, markers for 
all routes in the database are shown.

| URL parameter | explaination |
| -------------------- | ------------------------------------------------------------ |
| q=123[,...]  | Load and show the route line for route with id 123, and any other comma separated routes |
| label=springroad[,...]  | Load and show the route line for route with label 'springroad', and any other comma separated routes |
| tag=scenic[,...] | Load only route markers that are tagged 'scenic', and and any other comma separated tags. |
| region=s,w,n,e | Load only route markers in the specified geograpic region |
| maptype=TERRAIN | Specify the type of map to display.   Default is ROADMAP.  This must correspond to [MapTypeID](https://developers.google.com/maps/documentation/javascript/reference#MapTypeId). |

###Examples

```
http://localhost/ridemap/index.php?label=riverroad,shastaloop&maptype=TERRAIN
```

This will load all route markers, and load the route lines for the routes labeled 'riverroad' and
'shastaloop', and center the map on them.   The map will show terrain rather than roads.

```
http://localhost/ridemap/?region=37.65,-122.5,37.8,-122.3
```

This will load only the route markers for routes that intersect the region (roughly San Francisco),
and centers the map on them.

Creator: Mark T. Sanford (marktsanford@gmail.com)
Licenced under MIT License.
