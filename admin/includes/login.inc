<?php

/*
 *	 Handle all ?op= URL's related to logins and passwords
 */

 
/*
 *	
 */
if ($op == 'login' && $_SERVER['REQUEST_METHOD'] == 'GET') {

	// If there is no password yet, prompt user for one
	$query = "SELECT value FROM settings WHERE setting = 'password';";
	$result = DB_Query( $query );
	
	$error_message = getErrorMessage();
	
	echo $M->render('password_page', array(
		'page_contents' => ($result->num_rows == 0)
						   ? $M->render('password_choose', array('error_message' => $error_message))
						   : $M->render('password_enter', array('error_message' => $error_message))
	));

}

/*
 *	
 */
if ($op == 'login' && $_SERVER['REQUEST_METHOD'] == 'POST') {
	$query = "SELECT value FROM settings WHERE setting = 'password';";
	$value = DB_Query($query)->fetch_object()->value;
	if ( $value == md5( trim($_POST['pass']) ) ) {
		$_SESSION['admin'] = "1";
		header("Location: .");
	} else {
		header("Location: ?op=login&error=true");
	}
}
	 
/*
 *	
 */
if ($op == 'changepass' && $_SERVER['REQUEST_METHOD'] == 'GET') {

	RequireAuthentication();

	$error_message = getErrorMessage();

	echo $M->render('password_page', array(
		'page_contents' => $M->render('password_change', array('error_message' => getErrorMessage()))
	));

}

/*
 *	
 */
if ($op == 'changepass' && $_SERVER['REQUEST_METHOD'] == 'POST') {

	RequireAuthentication();

	$query = "SELECT value FROM settings WHERE setting = 'password';";
	$value = DB_Query($query)->fetch_object()->value;
	if ( $value != md5(trim($_POST['oldpass'])) ) {
		header("Location: ?op=changepass&error=bad");
	} else if (trim($_POST['pass1']) != trim($_POST['pass2'])) {
		header("Location: ?op=changepass&error=mismatch");
	} else if (strlen(trim($_POST['pass1'])) < 4) {
		header("Location: ?op=changepass&error=tooshort");
	} else {
		$hash = md5(trim($_POST['pass1']));
		$query = "UPDATE settings SET value='{$hash}' WHERE setting='password';";
		$result = DB_Query($query);
		header("Location: ?op=changepassaccept");
	}
}

/*
 *	
 */
if ($op == 'changepassaccept') {
	RequireAuthentication();

	echo $M->render('password_page', array(
		'page_contents' => $M->render('password_change_accepted')
	));
}

/*
 *	
 */
if ($op == 'setpass' && $_SERVER['REQUEST_METHOD'] == 'POST') {

	$query = "SELECT value FROM settings WHERE setting = 'password';";
	$result = DB_Query($query);
	if ($result->num_rows > 0) {
		header("Location: .");
	} else {
		if (trim($_POST['pass1']) != trim($_POST['pass2'])) {
			header("Location: ?op=login&error=mismatch");
		} else if (strlen(trim($_POST['pass1'])) < 4) {
			header("Location: ?op=login&error=tooshort");
		} else {
			$hash = md5(trim($_POST['pass1']));
			$query = "INSERT INTO settings (setting, value) VALUES ('password', '{$hash}');";
			DB_Query($query);
			$_SESSION['admin'] = "1";
			header("Location: ?op=changepassaccept");
		}
	}
}


/*
 *	
 */
if ($op == 'logout') {
	unset( $_SESSION['admin'] );
	header( "Location: ?op=login" );
}


/*
 *  Utility functions	
 */
 
function getErrorMessage() {
	$error_message = "";
	if (!empty($_GET['error'])) {
		switch($_GET['error']) {
			case 'mismatch':
				$error_message = "New password fields don't match";
				break;
			case 'tooshort':
				$error_message = "New password too short";
				break;
			default:
				$error_message = "Wrong password";
				break;
		}
	}
	return $error_message;
}




