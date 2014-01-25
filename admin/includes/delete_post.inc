<?php


if ($op == 'delete' && $_SERVER['REQUEST_METHOD'] == 'POST') {

 	RequireAuthentication();
 
    if (!$_POST['id'] || !is_numeric($_POST['id']))
        die ("");
        
    $id = $_POST['id'];

	$error_string = "";
	
    DB_Query("DELETE FROM routes WHERE ID = $id", $error_string);
    DB_Query("DELETE FROM tags where ID = $id", $error_string);
    DB_Query("DELETE FROM cache WHERE 1;", $error_string);

	echo '{ "id" : "' + $id + '" }';

}