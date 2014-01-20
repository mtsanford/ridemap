<?php

	require_once '../global.php';
	require_once '../config.php';
	require_once (RMINCLUDEDIR . 'db.php');
	require_once (RMINCLUDEDIR . 'websnapr.php');
	
	DB_Connect() or die( "can't connect to database");
    
	$query = <<<EOD
CREATE TABLE IF NOT EXISTS `routes` (
  `ID` int(11) NOT NULL auto_increment,
  `label` varchar(64) default NULL,
  `caption` text,
  `description` text,
  `picture_url` text,
  `picture_width` smallint(6) default '0',
  `picture_height` smallint(6) default '0',
  `link_url` text,
  `date_added` datetime default NULL,
  `way_points` text,
  `raw_points` text,
  `encoded_polyline` text,
  `encoded_levels` text,
  `zoomfactor` int(11) default NULL,
  `numlevels` int(11) default NULL,
  `marker_pos` text,
  `color` varchar(32) default 'purple',
  `bound_west` float default '-180',
  `bound_east` float default '180',
  `bound_north` float default '90',
  `bound_south` float default '-90',
  PRIMARY KEY  (`ID`)
) ENGINE=MyISAM DEFAULT CHARSET=latin1;
EOD;
		
    $result=mysql_query($query);
    
    if ($result == false)
		die ("can't create route table");

	$query = <<<EOD
CREATE TABLE IF NOT EXISTS `cache` (
  `query` varchar(128) NOT NULL default '',
  `json` text,
  PRIMARY KEY  (`query`)
) ENGINE=MyISAM DEFAULT CHARSET=latin1;
EOD;

    $result=mysql_query($query);

    if ($result == false)
		die ("can't create cache table");

	$query = <<<EOD
SELECT * FROM cache LIMIT 1;
EOD;

    $result=mysql_query($query);

    if ($result == false)
		die ("can't query cache table");

    if (mysql_numrows($result) < 1)
	{
		$query = <<<EOD
INSERT INTO cache (json) VALUES ('');
EOD;
	
		$result=mysql_query($query);
	
		if ($result == false)
			die ("can't insert cache record");
	}


	$query = <<<EOD
CREATE TABLE IF NOT EXISTS `settings` (
  `setting` varchar(255) default NULL,
  `value` varchar(1023) default NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8;
EOD;

    $result=mysql_query($query);

    if ($result == false)
		die ("can't create settings table");


	$query = <<<EOD
CREATE TABLE IF NOT EXISTS `tags` (
  `ID` int(11) NOT NULL,
  `tag` char(32) NOT NULL,
  PRIMARY KEY  (`ID`,`tag`),
  KEY `tag`(`tag`)
) ENGINE=MyISAM DEFAULT CHARSET=latin1;
EOD;

    $result=mysql_query($query);

    if ($result == false)
		die ("can't create tags table");

	echo "<h2>Install Succesful</h2><br /><br />";
	echo"<h3>Please click to go to <a href='.'>admin</a></h3>";

?>