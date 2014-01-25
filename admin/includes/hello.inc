<?php

if ($op == 'hello' && $_SERVER['REQUEST_METHOD'] == 'GET') {

	$result = DB_Query("SELECT json FROM cache WHERE query = 'fields=full&q=1';");
	echo $result->fetch_object()->json;
	
	
}
