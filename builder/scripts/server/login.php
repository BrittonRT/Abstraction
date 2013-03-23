<?php
	// Abstraction Builder v.1.0.7 Beta - Abstract Method © 2009-2011. "Abstraction" is a trademark of Abstract Method //
	session_start();
	$version = '1.0.8';
	$extRoot = $_SERVER['SERVER_NAME'].$_SERVER['REQUEST_URI'];
	$extRoot = explode("/builder/", $extRoot);
	$extRoot = $extRoot[0];
	
	if (isset($_GET['logout'])) {
		unset($_SESSION['USER']);
		unset($_SESSION['UID']);
		$_SESSION = array(); // reset session array
		session_destroy();   // destroy session.
	}
	if (isset($_POST['loginSubmit'])) {
		include("accounts.php");
		if (stripslashes($_POST['loginUsername']) == $GLOBALS['username'] && hash('sha256', stripslashes($_POST['loginPassword'])) == $GLOBALS['password']) {
			$_SESSION["USER"] = $_POST['loginUsername'];
			$_SESSION["UID"] = uniqid(rand(1,1024));
			$_SESSION["HOSTS"] = $GLOBALS['hosts'];
			$_SESSION["ROOT"] = $extRoot;
		} else
			$error = "<p class='abs-login-error'>Incorrect username or password.</p>";
	}
	if (isset($_POST['createSubmit'])) {
		$url = $serverRoot."accounts.php";
		
		$content = "<?php \$GLOBALS['username']='".stripslashes($_POST['createUsername'])."'; \$GLOBALS['password']='".hash('sha256', stripslashes($_POST['createPassword']))."'; ?>";
		//chmod($url, 0777);
		if ($_POST['createPassword'] == $_POST['reenterPassword']) {
			if (strlen($_POST['createPassword']) > 5) {
				if (strlen($_POST['createUsername']) < 33) {
					if (preg_match('/[^a-zA-Z0-9]/', $_POST['createPassword']) == 0) {
						if (preg_match('/[^a-zA-Z0-9]/', $_POST['createUsername']) == 0) {
							if (file_put_contents("accounts.php", $content)) {
								$_SESSION["USER"] = $_POST['createUsername'];
								$_SESSION["UID"] = uniqid(rand(1,1024));
								$_SESSION["HOSTS"] = $GLOBALS['hosts'];
								$_SESSION["ROOT"] = $extRoot;
							} else
								$error = "<p class='abs-login-error'>There was an error creating your account.</p>";
						} else
							$error = "<p class='abs-login-error'>Your username may only contain alpha-numeric characters.</p>";
					} else
						$error = "<p class='abs-login-error'>Your password may only contain alpha-numeric characters.</p>";
				} else
					$error = "<p class='abs-login-error'>Your username must be 32 characters or less.</p>";
			} else
				$error = "<p class='abs-login-error'>Your password must be at least 6 characters.</p>";
		} else
			$error = "<p class='abs-login-error'>Your passwords do not match.</p>";
		
			
	}
	if (!isset($_SESSION["UID"]) || $_SESSION["ROOT"] != $extRoot) {
		?>
<!DOCTYPE html>
<html>
<head>
	<link class="abs-ui" rel="stylesheet" type="text/css" href="<?php echo $builder_url; ?>/styles/@-defaults.css" />
	<link class="abs-ui" rel="stylesheet" type="text/css" href="<?php echo $theme; ?>" />
</head>
<body>
		<?php
		if (file_exists("accounts.php")) {
			if (isset($error))
				echo $error;
			// prompt user for login info
			require("scripts/server/update.php");
			?>
	<div class="abs-login-wrapper">
		<div class="abs-login-bg"></div>
		<div class="abs-login-logo"></div>
		<div class="abs-login-version"><?php echo $version; ?></div>
		<p>Please enter your username and password:</p>
		<form action="<? echo $_SERVER['PHP_SELF']; ?>" method="post">
			<fieldset>
				<label for="loginUsername">Username</label><input id="loginUsername" name="loginUsername" type="text" /><br />
				<label for="loginPassword">Password</label><input id="loginPassword" name="loginPassword" type="password" />
				<input id="loginSubmit" name="loginSubmit" type="submit" value="Login" />
			</fieldset>
		</form>
	</div>
	<div style="position: absolute; bottom: 30px; width: 100%;">
        <center style="font-size: 12px; color: #C7C9FF;">Abstract Method &copy; 2009-2011.  "Abstraction" is a trademark of Abstract Method - <a title="Legal" href="http://abstractionbuilder.com/legal.php" target="_blank" style="font-weight: 500;">Terms of Use, Privacy Policy, and EULA</a></center>
    </div>
			<?php
		} else {
			if (isset($error))
				echo $error;
			// prompt user to create their username and password
			require("scripts/server/update.php");
			?>	
	<div class="abs-create-wrapper">
		<div class="abs-login-bg"></div>
		<div class="abs-login-logo"></div>
		<div class="abs-login-version"><?php echo $version; ?></div>
		<p>Please create a new username and password:</p>
		<form action="<? echo $_SERVER['PHP_SELF']; ?>" method="post">
			<fieldset>
				<label for="createUsername">Create username</label><input id="createUsername" name="createUsername" type="text" /><br />
				<label for="createPassword">Create password</label><input id="createPassword" name="createPassword" type="password" /><br />
				<label for="reenterPassword">Re-enter Password</label><input id="reenterPassword" name="reenterPassword" type="password" />
				<input id="createSubmit" name="createSubmit" type="submit" value="Create account" />
			</fieldset>
		</form>
		<p class="abs-login-footnote">* Your username may not be more then 32 characters long.</p>
		<p class="abs-login-footnote">* Your password must be at least 6 characters long.</p>
		<p class="abs-login-footnote">* You may only use alphanumeric characters in your username and password.</p>
	</div>
	<div style="position: absolute; bottom: 30px; width: 100%;">
        <center style="font-size: 12px; color: #C7C9FF;">Abstract Method &copy; 2009-2011.  "Abstraction" is a trademark of Abstract Method - <a title="Legal" href="http://abstractionbuilder.com/legal.php" target="_blank" style="font-weight: 500;">Terms of Use, Privacy Policy, and EULA</a></center>
	</div>
			<?php
		}
		?>
</body>		
</html>
		<?php
		exit();
	}
?>