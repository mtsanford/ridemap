<?php

$db_connected = false;

function DB_Connect()
{
	global $db_connected;
	
	if ($db_connected)
		return true;

	global $db_host, $db_username, $db_password, $db_database;
	
    mysql_connect($db_host,$db_username,$db_password);
    if (@mysql_select_db($db_database) == false)
		return false;
	
	$db_connected = true;
	
	return true;
}

