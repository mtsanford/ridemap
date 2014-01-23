<?php

function DB_Connect()
{
	global $db, $db_host, $db_username, $db_password, $db_database;
	static $db = null;
	
	if (!empty($db))
		return $db;

	$db = mysqli_connect($db_host, $db_username, $db_password, $db_database);
	if (!$db) {
		die('Connect Error (' . mysqli_connect_errno() . ') '
				. mysqli_connect_error());
	}
	return $db;
}

function DB_Query($query) {
	$db = DB_Connect();
	$result = mysqli_query($db, $query);
	if ($result == FALSE) {
		die('Error(' . mysqli_connect_errno() . ') '
				. mysqli_connect_error() . ". Full query: [$query]");
	}
	return $result;
}

function DB_EscapeString($string) {
	$db = DB_Connect();
	return $db->real_escape_string($string);
}

function DB_InsertID() {
	$db = DB_Connect();
	return mysqli_insert_id($db);
}
