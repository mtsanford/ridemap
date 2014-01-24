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

// Allow modules to do a sanity check before making queries
function DB_Installed() {
	global $CONFIG;
	$db = mysqli_connect($CONFIG['DB_HOST'], $CONFIG['DB_USERNAME'], $CONFIG['DB_PASSWORD'], $CONFIG['DB_DATABASE']);
	if ($db == false) {
		return false;
	}
	$result = mysqli_query($db, "SELECT value FROM settings WHERE setting='version';");
	if (!$result || $result->num_rows == 0 || $result->fetch_object()->value != "2.0") {
		return false;
	}
	return true;
}
