<?php

	/*
	 *	Input 	id = id of route to delete
	 *	Output  of route deleted (i.e. '5'), or empty string on failure
	 */

	require_once '../global.php';
	require_once '../config.php';
	require_once (RMINCLUDEDIR . 'db.php');
	require_once (RMINCLUDEDIR . 'cache.php');

	header("Last-Modified: " . gmdate("D, d M Y H:i:s") . " GMT");
	header("Cache-Control: no-store, no-cache, must-revalidate");
	header("Cache-Control: post-check=0, pre-check=0", false);
	header("Pragma: no-cache");

	require_once (RMINCLUDEDIR . 'checkpermission.php');

	DB_Connect() or exit();

    if (!$_GET['id'] || !is_numeric($_GET['id']))
        die ("");
        
    $id = $_GET['id'];

    $query="DELETE FROM routes where ID=$id";
    $result=@mysql_query($query);
    
    if ($result)
	{
		// Don't really care if this fails.  Just trying to stay clean...        
		$query="DELETE FROM tags where ID=$id";
		@mysql_query($query);

		RouteCache_Flush();
        echo($id);
	}
    else
	{
        echo("");
	}
?>