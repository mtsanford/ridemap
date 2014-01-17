<?php
/**
* @package 'Route Groups for Google Maps'
* @copyright Copyright (C) 2007 Mark Sanford. All rights reserved.
* @license http://www.gnu.org/copyleft/gpl.html GNU/GPL, see LICENSE.php
* Route Groups for Google Maps is free software. This version may have been
* modified pursuant to the GNU General Public License, and as distributed it
* includes or is derivative of works licensed under the GNU General Public License
* or other free or open source software licenses.
* See COPYRIGHT.txt for copyright notices and details.
*/
	
	/* 
	 * Set $RM_redirect_to_login to TRUE before including this
	 * file if page should redirect to login page, otherwise
	 * a HTTP 403 Forbidden error will be issued.
	 */
	
	$RM_native_authentication = false;

	// Open an optional permission.php to check for
	// user admin permission
	// permission.php is allowed to muck with the cwd,
	// so save it and restore it
	$permissions_file = RMDIR . 'admin/permission.php';
	if (file_exists($permissions_file)) {
		$RM_have_permission = true;
		$cwd = getcwd();
		$olderr = error_reporting(0);
		include ($permissions_file);
		if ($RM_have_permission == false)
		{
			header("HTTP/1.0 403");
			die("<html><body><h1>Permission Denied</h1></body></html>");
		}
		error_reporting($olderr);
		chdir($cwd);
	}

	// If it doesn't exist, use our own built in authentication	
	else
	{
		$RM_native_authentication = true;
		session_start();
		if ( isset( $_SESSION['admin'] ) && $_SESSION['admin'] == "1" )
		{
			// user authenticated
		}
		else
		{
			if ($RM_redirect_to_login)
			{
				// stash away intended destination so we can go to it after login
				$_SESSION['loginurl'] = 'http://' . $_SERVER['HTTP_HOST'] . $_SERVER["SCRIPT_NAME"];
				header( "Location:login.php" );
			}
			else
			{
				header("HTTP/1.0 403");
			}
			exit();
		}
	}
	
?>