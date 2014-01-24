<?php

/*
 *	 Handle all ?op= URL's related to logins and passwords
 */

 
/*
 *	
 */
if ($op == 'login' && $_SERVER['REQUEST_METHOD'] == 'GET') {

	$error_message = getErrorMessage();

	// If there is no password yet, prompt user for one
	$query = "SELECT value FROM settings WHERE setting = 'password';";
	$result = DB_Query( $query );
	
	if ($result->num_rows == 0) {
		$page_contents = <<<EOD
			<div class="m">Choose a Password</div>
			<div class="err">{$error_message}</div>
			<form name="pwdform" action="?op=setpass" method="post">
				<div>New Password</div>
				<input type="password" name="pass1" maxlength="24" autofocus />
				<div>Again for confirmation</div>
				<input type="password" name="pass2" maxlength="24" />
				<input type="submit" value="submit" />
			</form>
EOD;
	} else {
		// otherwise ask user for password
		$page_contents = <<<EOD
			<div class="m">Enter Password</div>
			<div class="err">{$error_message}</div>
			<form action='?op=login' method="post">
				<input type="password" name="pass" maxlength="24" autofocus />
				<input type="submit" value="logon" />
			</form>
EOD;
	}
	
	outputPage($page_contents);
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
	$error_message = getErrorMessage();
	
	$page_contents = <<<EOD
		<div class="m">Change Password</div>
		<div class="err">{$error_message}</div>
		<form action="?op=changepass" method="post">
			<div>Old Password</div>
			<input type="password" name="oldpass" maxlength="24" autofocus />
			<div>New Password</div>
			<input type="password" name="pass1" maxlength="24" />
			<div>New Password, again</div>
			<input type="password" name="pass2" maxlength="24" />
			<input type="submit" value="change" />
		</form>
EOD;

	outputPage($page_contents);
}

/*
 *	
 */
if ($op == 'changepass' && $_SERVER['REQUEST_METHOD'] == 'POST') {
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
	$page_contents = <<<EOD
	  <div class="m">Password change accepted</div>
	  <input type="button" value="OK" onClick="window.location='.';" autofocus />
EOD;
	outputPage($page_contents);
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
	 
	 
function outputPage($page_contents) {

$page = <<<EOD
<!DOCTYPE html>
<html>
	<head>
		<link href="css/login.css" rel="stylesheet" type="text/css"/>
	</head>
	<body>
		<div class="c">
			{$page_contents}
		</div>
	</body>
</html>
EOD;

	echo $page;
}


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




