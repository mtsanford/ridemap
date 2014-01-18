<?php
/**
* Ridemap
*
* Copyright (C) 2014 Mark T. Sanford
* Licensed under GNU GENERAL PUBLIC LICENSE version 2
* see http://www.gnu.org/licenses/gpl-2.0.txt for more information
*/

	// Webstapr utility functions
	
	$WEBSNAPR_string = 'websnapr';
	
	function URL_is_websnapr($url)
	{
		global $WEBSNAPR_string;
		return(strcmp(trim($url), $WEBSNAPR_string)==0);
	}
	
	// the websnapr.com thumbnail url for this url
	function websnapr_url($url)
	{
		global $WEBSNAPR_API_KEY;
		return "http://images.websnapr.com/?size=s&key={$WEBSNAPR_API_KEY}&url=$url";
	}
