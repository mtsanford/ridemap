<?php

/*
 *  This is the 'master' admin page.  All admin pages are served
 *  up through this script.  Parameters:
 *
 *  id : serve up page to edit route with given id
 *  new: serve up page to create a new route
 *  
 *  if neither id or new are specified the main admin map is shows with all
 *  route markers, that show tag and label info.
 *
 *  for new, and edit pages lat, lng, and zoom params are also available
 *    to specify map center and zoom level.
 * 
 *  for the main admin page, the param 'load' can specify a route to
 *    initially load and center on.
 *
 */	 

require_once 'config.php';
require_once ('includes/db.inc');
require_once ('includes/websnapr.inc');

$RM_redirect_to_login = true;
require_once ('includes/checkpermission.inc');


if (isset($_GET['id'])) {
	include_once("includes/edit.inc");
} else {
	include_once("includes/admin.inc");
}

echo $html;

