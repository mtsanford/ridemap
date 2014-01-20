<?php

	require_once '../../global.php';
	require_once '../../config.php';
	require_once (RMINCLUDEDIR . 'db.php');

	DB_Connect() or die( "can't connect to database");

	$query = "SELECT ID, bound_north, bound_south, bound_east, bound_west FROM routes";
	
	$result=mysql_query($query);
	echo "result: $result<br>";
	if ($result)
	{
		$num = mysql_numrows($result);
		echo "num: $num<br>";
		for ($i=0; $i<$num; $i++)
		{
			$value = mysql_fetch_object($result);
			if ($value->bound_south > 38.6)
			{
				$query = "INSERT INTO tags (ID, tag) values ({$value->ID}, 'norcal')";
				@mysql_query($query);
			}
			if ($value->bound_north < 36.6)
			{
				$query = "INSERT INTO tags (ID, tag) values ({$value->ID}, 'socal')";
				@mysql_query($query);
			}
			if ( ! ($value->bound_south > 39.5 || $value->bound_north < 36.6) )
			{
				$query = "INSERT INTO tags (ID, tag) values ({$value->ID}, 'central')";
				@mysql_query($query);
			}

		}
	}
	
?>