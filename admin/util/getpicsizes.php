<?php

	require_once '../../global.php';
	require_once '../../config.php';
	require_once (RMINCLUDEDIR . 'db.php');
	require_once (RMINCLUDEDIR . 'websnapr.php');

	DB_Connect() or die( "can't connect to database");

	$resulttext = "getting size of images...<br>";
	
	$updated = 0;
	
	$query="SELECT ID, label, picture_url FROM routes";
	$result=mysql_query($query);
	if ($result)
	{
		$num=mysql_numrows($result);
		for ($i=0; $i<$num; $i++) {
			$value = mysql_fetch_object($result);
			if (!URL_is_websnapr($value->picture_url)) {
				$im = @imagecreatefromjpeg($value->picture_url); /* Attempt to open */
				if ($im)
				{
					$picture_width = imagesx($im);
					$picture_height = imagesy($im);
					$query="UPDATE routes SET
						picture_width = '$picture_width',
						picture_height = '$picture_height'
						WHERE ID = {$value->ID};";
					$result2=mysql_query($query);
					if ($result2 == false) {
						$resulttext .= "Failed to update route id {$value->ID}, label '{$value->label}'<br>";
						$resulttext .= "    Picture URL: '{$value->picture_url}'<br>";
					}
					else {
						$updated++;
					}
				}
				else
				{
					$resulttext .= "Failed to fetch image for route id {$value->ID}, label '{$value->label}'<br>";
					$resulttext .= "    Picture URL: '{$value->picture_url}'<br>";
				}
			} else {
			}
		}
	} else {
		$resulttext .= "Failed fetch routes<br>";
	}
	
	$resulttext .= "<br><br>$updated records updated";
	
	print $resulttext;


