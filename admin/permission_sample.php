<?php

	/*
	 *	Optional file to check authentication.  This is for
	 *  integration into an authentication system like vBulletin
	 *
	 *	Use: 
	 *		Rename this file to 'permission.php'
	 *		set $RM_have_permission to true if user has admin permission
	 *		go ahead and use chdir
	 *		this script is included at global scope (rather than in a function)
	 *
	 */
	 
	 
	 /*	
	  *	Example of getting permissions from vBulletin:
	  *
	 
		chdir('/home/username/public_html/forum');
		include_once('./global.php');
		
		if ( is_member_of($vbulletin->userinfo, 6) ) // 6 is usergroup for admins
			$RM_have_permission = true;
		else
			$RM_have_permission = false;
	 
	 */
	 

?>