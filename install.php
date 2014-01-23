<?php

	require_once 'config.php';
	require_once ('includes/db.inc');
	require_once ('includes/websnapr.inc');
	
    $result = DB_Query("SELECT * FROM settings WHERE setting = 'version';");

	if ($result->num_rows > 0) {
		echo "<h2>Already installed</h2>";
		die;
	}
	
	$query = <<<EOD
CREATE TABLE IF NOT EXISTS `routes` (
  `ID` int(11) NOT NULL auto_increment,
  `label` varchar(64) default NULL,
  `caption` text,
  `description` text,
  `picture_url` text,
  `link_url` text,
  `date_added` datetime default NULL,
  `encoded_polyline` text,
  `marker_pos` text,
  `color` varchar(32),
  `bound_west` float default '-180',
  `bound_east` float default '180',
  `bound_north` float default '90',
  `bound_south` float default '-90',
  PRIMARY KEY  (`ID`)
) ENGINE=MyISAM DEFAULT CHARSET=latin1;
EOD;
		
    $result = DB_Query($query);
    
	$query = <<<EOD
CREATE TABLE IF NOT EXISTS `cache` (
  `query` varchar(128) NOT NULL default '',
  `json` text,
  PRIMARY KEY  (`query`)
) ENGINE=MyISAM DEFAULT CHARSET=latin1;
EOD;

    $result = DB_Query($query);

	$query = <<<EOD
CREATE TABLE IF NOT EXISTS `settings` (
  `setting` varchar(255) default NULL,
  `value` varchar(1023) default NULL
) ENGINE=MyISAM DEFAULT CHARSET=utf8;
EOD;

    $result = DB_Query($query);
		
    $result = DB_Query("INSERT INTO settings (setting, value) VALUES ('version', '2.0')");

	$query = <<<EOD
CREATE TABLE IF NOT EXISTS `tags` (
  `ID` int(11) NOT NULL,
  `tag` char(32) NOT NULL,
  PRIMARY KEY  (`ID`,`tag`),
  KEY `tag`(`tag`)
) ENGINE=MyISAM DEFAULT CHARSET=latin1;
EOD;

    $result = DB_Query($query);

	echo "<h2>Install Succesful</h2><br /><br />";
	echo"<h3>Please click to go to <a href='admin.php'>admin</a></h3>";

