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
require_once ('../includes/db.inc');
require_once ('../includes/websnapr.inc');

session_start();

$op_query_string = empty($_GET['op']) ? 'admin' : $_GET['op'];
$ops = explode('/', $op_query_string);
$op = $ops[0];

include_once("includes/checkpermission.inc");
include_once("includes/login.inc");
include_once("includes/admin.inc");
include_once("includes/edit.inc");
include_once("includes/edit_post.inc");
//include_once("includes/delete_post.inc");

