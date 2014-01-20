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

	require_once '../config.php';
	require_once (dirname(__FILE__) . '/../includes/db.php');
	require_once (dirname(__FILE__) . '/../includes/websnapr.php');
	
	$RM_redirect_to_login = true;
	require_once (dirname(__FILE__) . '/../includes/checkpermission.php');

	$logout_html = "";
	if ($RM_native_authentication)
	{
		$logout_html = <<<EOD
			<div style="position:absolute; bottom:10px;">
			<a href="login.php?logout">logout</a>&nbsp;&nbsp;<a href="login.php?changepass">Change Password</a>
			</div>
EOD;
	}
    
    if (isset($_GET['id'])) {

        $id = $_GET['id'];

		if ($id != 'new' && !is_numeric($id)) 
			die("Bad id parameter");
			
        include_once("edit.htm");
    } else {
		if (isset($_GET['load']) && is_numeric($_GET['load']))
		{
	        $routeID = $_GET['load'];
		}
        include_once("admin.htm");
    }

	echo $html;

