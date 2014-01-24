<?php
/*
 *	Global configuration
 *
 *	1) Change fields
 *	2) Rename this file to config.php
 *	3) Change file owenership/permissions so that webserver can read this file
 *     but not write it, and the general public cant see it at all.
 *	
 */

$CONFIG = array(

	/*
	 * Required
	 */
	
	'DB_HOST' => 'localhost',
	'DB_DATABASE' => 'ridemap',
	'DB_USERNAME' => 'ridemap',
	'DB_PASSWORD' => 'ridemap',
	
	/*
	 * Optional
	 */

	// Maps will work w/o API key, but it's recommended to have one
	// https://developers.google.com/maps/signup
	'GOOGLEMAPS_API_KEY' => "",	

	'ROUTE_DEFAULTS' => array(
	
		// Default picture to use in info windows if not specified
		'PICTURE_URL' => "",
		
		// Default color to use for routes if not specified.
		'ROUTE_COLOR' => "#55F",
		
		// Text to show in info window for links with no picture
		'MORE_TEXT' => "More...",
		
	),
);
