<?php

function DB_Connect()
{
	global $CONFIG;
	static $db = null;
	
	if (!empty($db)) {
		return $db;
	}

	$db = mysqli_connect($CONFIG['DB_HOST'], $CONFIG['DB_USERNAME'], $CONFIG['DB_PASSWORD'], $CONFIG['DB_DATABASE']);
	if (!$db) {
		die('Connect Error (errno=' . mysqli_connect_errno() . '): ' . mysqli_connect_error());
	}
	return $db;
}

function DB_Query($query) {
	$db = DB_Connect();
	$result = mysqli_query($db, $query);
	if ($result == FALSE) {
		die("Error: " . mysqli_error($db) . "   Full query: [$query]");
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