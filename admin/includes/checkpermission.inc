<?php
	
	/* 
	 * Set $RM_redirect_to_login to TRUE before including this
	 * file if page should redirect to login page, otherwise
	 * a HTTP 403 Forbidden error will be issued.
	 */
	 
function IsNativeAuthentication() {
	static $RM_native_authentication = null;
	if ($RM_native_authentication === null) {
		$permissions_file = dirname(__FILE__) . '/permission.php';
		$RM_native_authentication = !file_exists($permissions_file);
	} 
	return $RM_native_authentication;
}
	 
function RequireAuthentication() {
	
	if (IsNativeAuthentication()) {
		if (empty($_SESSION['admin']) || $_SESSION['admin'] != "1") {
			header( "Location:?op=login" );
			exit;
		}
	} 
	
	// Open an optional permission.php to check for
	// user admin permission
	// permission.php is allowed to muck with the cwd,
	// so save it and restore it
	else {
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
	}
	
}