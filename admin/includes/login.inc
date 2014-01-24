<?php

	/*
	 *	Quick and dirty authentication
	 *  
	 *	This one module is multipurpose:
	 *		If user is authenicated, do nothing and return
	 *		If user is not authenticated ask for password
	 *		If password is not set, ask to create password
	 *		De-authentication (logout) can be accomplished with a ?logout in URL
	 *		Change password with ?changepass in URL
	 *
	 *  Use:
	 *
	 *		set $_SESSION['loginurl'] to url to go to after authentication passed
	 *		redirect to this page.
	 *
	 *
	 *  Note: 
	 *
	 *		Expects table called 'settings' with 2 text fields 'setting' and 'value'
	 *
	 */
	 
	/*
	 * Install specific stuff.  Need to connect to database. 
	 */
	require_once 'config.php';
	require_once ('../includes/db.inc');

	/*
	 * end install specific stuff 
	 */


	/**********************************
		Settings
	**********************************/
	$sSession_admin = 'admin';			// $_SESSION variable to use to get/set authenication state
	$sSession_url  = 'loginurl';		// $_SESSION variable to look for for url to go to after authentication
	$sGet_logout = 'logout';			// $_GET variable to look for for logout
	$sGet_change = 'changepass';		// $_GET variable to look for for change password


	// Look at post variables, and return new password if OK,
	// else set error message and return false
	function CheckNewPassword()
	{
		global $login_message;
		$p1 = trim( $_POST['pass1'] );
		$p2 = trim( $_POST['pass2'] );
		if ($p1 != $p2)
		{
			$login_message = "The two entries for new password must match";
			return false;
		}
		else if ( strlen($p1) < 5 )
		{
			$login_message = "Password must be at least 5 characters";
			return false;
		}
		return $p1;
	}

session_start();


$login_screen = 0;
$login_message = "";
$login_this = 'http://' . $_SERVER['HTTP_HOST'] . $_SERVER["SCRIPT_NAME"];

if ( isset( $_SESSION[$sSession_url] ) )
{
	$login_script = $_SESSION[$sSession_url];
}
else
{
	$login_script = 'http://' . $_SERVER['HTTP_HOST'] . dirname($_SERVER["SCRIPT_NAME"]);
}

// If we're already logged in, we'll check for logout, and change password
// otherwise, just redirect to the specified admin page ($login_script)
if ( isset( $_SESSION[$sSession_admin] ) && $_SESSION[$sSession_admin] == "1" )
{
	if ( isset($_GET[$sGet_logout]) )
	{
		unset( $_SESSION[$sSession_admin] );
		header( "Location:{$login_this}" );
		exit;
	}
	else if ( isset($_GET[$sGet_change]) )
	{
		// do change password stuff below
	}
	else
	{
		header( "Location:{$login_script}" ); // already logged in, why were we called?
		exit();
	}
}

$query = "SELECT value FROM settings WHERE setting = 'password';";
$result = DB_Query( $query );

if ($result == false)
	die( "unable to access database" );


// If there is no row for password, ask user to create one
if ($result->num_rows == 0) {	
	if ( isset($_POST['pass1']) && isset($_POST['pass2']) ) {
		$newpwd = CheckNewPassword();
		if ( $newpwd == false ) {
			$login_screen = 2;
		} else {
			$hash = md5($newpwd);
			$query = "INSERT INTO settings (setting, value) VALUES ('password', '{$hash}');";
			$result = DB_Query($query);
			if ($result) {
				$_SESSION['admin'] = "1";
				$login_message = 'Password change accepted';
				$login_screen = 4;
			} else {
				die("unable to create password");
			}
		}
	} else {
		$login_screen = 2;
	}
}

// otherwise, if there is a password posted, check it
else if ( isset($_POST['pass']) ) {
	$row = $result->fetch_object();
	if ( $row->value == md5( trim($_POST['pass']) ) ) {
		$_SESSION[$sSession_admin] = "1";
		header("Location: {$login_script}");
		exit(); 
	} else {
		$login_message = 'Wrong Password.  Try Again.';
		$login_screen = 1;
	}
}

// otherwise, if admin is trying to change password...
else if ( isset($_GET[$sGet_change]) && isset($_SESSION[$sSession_admin]) && $_SESSION[$sSession_admin] == "1" ) {
	if ( isset($_POST['pass1']) && isset($_POST['pass2']) && isset($_POST['oldpass']) ) {
		$row = $result->fetch_object();
		if ( $row->value == md5( trim($_POST['oldpass']) ) ) {
			$newpwd = CheckNewPassword();
			if ( $newpwd == false ) {
				$login_screen = 3;
			} else {
				$hash = md5($newpwd);
				$query = "UPDATE settings SET value = '{$hash}' WHERE setting = 'password';";
				$result = DB_Query($query);
				if ($result) {
					$login_message = 'Password change accepted';
					$login_screen = 4;
				} else {
					die("unable to change password");
				}
			}
		} else {
			$login_message = 'Wrong Password.  Try Again.';
			$login_screen = 3;
		}
	} else {
		$login_screen = 3;
	}
}

// otherwise, password challenge
else
{
	$login_screen = 1;
}


$css = <<<EOD
body { text-align: center; }
.c {
	background-color: #ccccee;
	text-align: center;
	width:240px;
	border: 1px solid #000000;
	padding: 10px;
	margin: 20px;
	margin-left: auto; 
	margin-right: auto;
}	
.e {
	margin-bottom: 6px;
}
.m {
	margin-bottom: 8px;
	font-size:1.5em;
}
.err {
	margin-bottom: 6px;
	font-size:0.8em;
	color:red;
}
EOD;

$header = <<<EOD
<!DOCTYPE html PUBLIC "-//W3C//DTD XHTML 1.0 Strict//EN"
    "http://www.w3.org/TR/xhtml1/DTD/xhtml1-strict.dtd">
<html xmlns="http://www.w3.org/1999/xhtml"
      xmlns:v="urn:schemas-microsoft-com:vml">
  <head>
  <style type="text/css">{$css}</style>
  </head>
  <body onLoad="document.getElementById('focus').focus();" >
  <div class="c">
EOD;

$footer = <<<EOD
  </div>
  </body>
</html>
EOD;

if ($login_screen == 1) {
	$page = <<<EOD
{$header}
	  <div class="m">Enter Password</div>
	  <div class="err">{$login_message}</div>
	  <form name="pwdform" action='{$login_this}' method="post">
	  <div class="e"><input type="password" name="pass" size="16" maxlength="24" value="" id="focus" /></div>
	  <div class="e"><input type="submit" id="submitbtn" value="logon" /></div>
	  </form>
{$footer}
EOD;
}

else if ($login_screen == 2) {
	$page = <<<EOD
{$header}
  	<div class="m">Choose a Password</div>
  	<div class="err">{$login_message}</div>
	<form name="pwdform" action='{$login_this}' method="post">
    <div>New Password</div>
	<div class="e"><input type="text" name="pass1" size="16" maxlength="24" value="" id="focus" /></div>
	<div>Again for confirmation</div>
	<div class="e"><input type="text" name="pass2" size="16" maxlength="24" value="" id="pass2" /></div>
	<div class="e"><input type="submit" id="submitbtn" value="submit" /></div>
	</form>
{$footer}
EOD;
}

else if ($login_screen == 3) {
	$page = <<<EOD
{$header}
	  <div class="m">Change Password</div>
	  <div class="err">{$login_message}</div>
	  <form name="pwdform" action='{$login_this}?{$sGet_change}' method="post">
	  <div>Old Password</div>
	  <div class="e"><input type="text" name="oldpass" size="16" maxlength="24" value="" id="focus" /></div>
	  <div>New Password</div>
	  <div class="e"><input type="text" name="pass1" size="16" maxlength="24" value="" id="pass1" /></div>
	  <div>New Password, again</div>
	  <div class="e"><input type="text" name="pass2" size="16" maxlength="24" value="" id="pass2" /></div>
	  <div class="e"><input type="submit" id="submitbtn" value="change" /></div>
	  </form>
{$footer}
EOD;
}


else if ($login_screen == 4) {
	$page = <<<EOD
{$header}
	  <div class="m">{$login_message}</div>
	  <div class="e"><input type="button" id="focus" value="OK" onClick="window.location='{$login_script}'" /></div>
{$footer}
EOD;
}


echo $page;

