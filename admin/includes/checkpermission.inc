<?php
	
	/* 
	 * Set $RM_redirect_to_login to TRUE before including this
	 * file if page should redirect to login page, otherwise
	 * a HTTP 403 Forbidden error will be issued.
	 */


if ($op != "login" && $op != "setpass") {

	$RM_native_authentication = false;

	// Open an optional permission.php to check for
	// user admin permission
	// permission.php is allowed to muck with the cwd,
	// so save it and restore it
	$permissions_file = dirname(__FILE__) . '/permission.php';
	if (file_exists($permissions_file)) {
		$RM_have_permission = true;
		$cwd = getcwd();
		$olderr = error_reporting(0);
		include ($permissions_file);
		if ($RM_have_permission == false) {
			header("HTTP/1.0 403");
			echo "<html><body><h1>Permission Denied</h1></body></html>";
			exit;
		}
		error_reporting($olderr);
		chdir($cwd);
	}

	// If it doesn't exist, use our own built in authentication	
	else {
		$RM_native_authentication = true;
		if (empty($_SESSION['admin']) || $_SESSION['admin'] != "1") {
			header( "Location:?op=login" );
			exit;
		}
	}
	
}