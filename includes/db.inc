<?php

// If $error_string is set, don't die, but set the string and
// return false instead.
function DB_Connect(&$error_string = null)
{
	global $CONFIG;
	static $db = null;
	
	if (!empty($db)) {
		return $db;
	}

	$db = mysqli_connect($CONFIG['DB_HOST'], $CONFIG['DB_USERNAME'], $CONFIG['DB_PASSWORD'], $CONFIG['DB_DATABASE']);
	if (!$db) {
		$err = 'Connect Error (errno=' . mysqli_connect_errno() . '): ' . mysqli_connect_error();
		if ($error_string == null) {
			die($err);
		} else {
			$error_string = $err;
		}
	}
	return $db;
}

// If $error_string is set, don't die, but set the string and
// return false instead.
function DB_Query($query, &$error_string = null) {
	$db = DB_Connect($error_string);
	if (!$db) {
		return false;
	}
	$result = mysqli_query($db, $query);
	if ($result == FALSE) {
		$err = "Error: " . mysqli_error($db) . "   Full query: [$query]";
		if ($error_string == null) {
			die($err);
		} else {
			$error_string = $err;
		}
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
