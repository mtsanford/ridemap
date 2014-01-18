<?php
/**
* Ridemap
*
* Copyright (C) 2014 Mark T. Sanford
* Licensed under GNU GENERAL PUBLIC LICENSE version 2
* see http://www.gnu.org/licenses/gpl-2.0.txt for more information
*/

function DB_Connect()
{
	global $db, $db_host, $db_username, $db_password, $db_database;
	static $db;
	
	if (!empty($db))
		return $db;

	$db = mysqli_connect($db_host, $db_username, $db_password, $db_database);
	return $db;
}

