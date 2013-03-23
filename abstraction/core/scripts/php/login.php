<?php
	session_start();
	global $full_url, $root, $theme, $url, $version;
	//require('config.php');
	
	if (isset($_GET['logout'])) {
		unset($_SESSION['USER']);
		unset($_SESSION['UID']);
		$_SESSION = array(); // reset session array
		session_destroy();   // destroy session.
	}
	if (isset($_POST['loginSubmit'])) {
		include("settings/accounts.php");
		foreach ($GLOBALS['users'] as $user) {
			if (stripslashes($_POST['loginUsername']) == $user['username'] && hash('sha256', stripslashes($_POST['loginPassword'])) == $user['password']) {
				$_SESSION["USER"] = $_POST['loginUsername'];
				$_SESSION["UID"] = uniqid(rand(1,1024));
				$_SESSION["HOSTS"] = $user['hosts'];
				$_SESSION["ROLE"] = $user['role'];
				$_SESSION["THEME"] = $user['theme'];
				$_SESSION["UI"] = $user['ui'];
				$_SESSION["ROOT"] = $root;
				$error = null;
				break;
			} else
				$error = "<p class='abs-login-error'>Incorrect username or password.</p>";
		}
	}
	if (isset($_POST['createSubmit'])) {
		$content = "<?php \$GLOBALS['users'] = array(array('username' => '".stripslashes($_POST['createUsername'])."','password' => '".hash('sha256', stripslashes($_POST['createPassword']))."','role' => 'admin','theme' => 'themes/black.css','ui' => 'settings/'".stripslashes($_POST['createUsername'])."'.ui',)); ?>";
		if ($_POST['createPassword'] == $_POST['reenterPassword']) {
			if (strlen($_POST['createPassword']) > 5) {
				if (strlen($_POST['createUsername']) < 33) {
					if (preg_match('/[^a-zA-Z0-9]/', $_POST['createPassword']) == 0) {
						if (preg_match('/[^a-zA-Z0-9]/', $_POST['createUsername']) == 0) {
							if (file_put_contents("settings/accounts.php", $content)) {
								$_SESSION["USER"] = $_POST['createUsername'];
								$_SESSION["UID"] = uniqid(rand(1,1024));
								$_SESSION["ROLE"] = 'admin';
								$_SESSION["THEME"] = 'themes/black.css';
								$_SESSION["UI"] = 'settings/'.stripslashes($_POST['createUsername']).'.ui';
								$_SESSION["ROOT"] = $root;
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
	$theme = (isset($_SESSION["THEME"])) ? $_SESSION["THEME"] : 'black/black.css';	// Default theme is black
	if (!isset($_SESSION["UID"]) || $_SESSION["ROOT"] != $root) {
		?>
<!DOCTYPE html>
<html>
<head>
	<link class="abs-ui" rel="stylesheet" type="text/css" href="<?php echo $full_url; ?>/abstraction/core/styles/@-defaults.css" />
	<link class="abs-ui" rel="stylesheet" type="text/css" href="<?php echo $full_url; ?>/abstraction/ui/styles/ui-defaults.css" />
	<link class="abs-ui" rel="stylesheet" type="text/css" href="<?php echo $full_url.'/themes/'.$theme; ?>" />
</head>
<body>
		<?php
		if (file_exists("settings/accounts.php")) {
			if (isset($error))
				echo $error;
			// prompt user for login info
			require("abstraction/core/scripts/php/update.php");
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
	<div class="abs-login-legal">
        Abstract Method &copy; 2009-2011.  "Abstraction" is a trademark of Abstract Method - <a title="Legal" href="http://abstractionbuilder.com/legal.php" target="_blank" style="font-weight: 500;">Terms of Use, Privacy Policy, and EULA</a>
    </div>
			<?php
		} else {
			if (isset($error))
				echo $error;
			// prompt user to create their username and password
			require("abstraction/scripts/server/update.php");
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
	<div class="abs-login-legal">
        Abstract Method &copy; 2009-2011.  "Abstraction" is a trademark of Abstract Method - <a title="Legal" href="http://abstractionbuilder.com/legal.php" target="_blank" style="font-weight: 500;">Terms of Use, Privacy Policy, and EULA</a>
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