<?php
	session_start();
	global $full_url, $theme;	
	require("abstraction/core/scripts/php/config.php");
	require("abstraction/core/scripts/php/login.php");
?>
<!DOCTYPE html>

	<!--     Abstraction v.1.0 (c) 2008-2011 Abstract Method     -->
	<!--               Server Abstraction Layer                  -->

<html lang="en">
<head>
	<meta charset="utf-8" />
	<meta http-equiv="cache-control" content="no-cache">
	<meta http-equiv="pragma" content="no-cache">
	<meta http-equiv="expires" content="-1">

	<title>Abstraction</title>
	
	<script type="text/javascript">
		var uiFile = "<?php echo $_SESSION['UI']; ?>";
	</script>

	<!--[if IE]> <script type="text/javascript">window.isIE = true;</script> <![endif]-->
	
	<link class="abs-ui" rel="stylesheet" type="text/css" href="<?php echo $full_url; ?>/abstraction/core/styles/@-defaults.css" />
	<link class="abs-ui" rel="stylesheet" type="text/css" href="<?php echo $full_url; ?>/abstraction/ui/styles/ui-defaults.css" />
	<link class="abs-ui" rel="stylesheet" type="text/css" href="<?php echo $full_url.'/themes/'.$theme; ?>" />
	
	<script class="abs-ui" src="<?php echo $full_url; ?>/abstraction/util/scripts/js/jquery.js" type="text/javascript"></script>
	<script class="abs-ui" src="<?php echo $full_url; ?>/abstraction/util/scripts/js/jquery-ui.js" type="text/javascript"></script>
	<script class="abs-ui" src="<?php echo $full_url; ?>/abstraction/util/scripts/js/jshashtable.js" type="text/javascript"></script>
	<script class="abs-ui" src="<?php echo $full_url; ?>/abstraction/util/scripts/js/oop.js" type="text/javascript"></script>
	<script class="abs-ui" src="http://mobwrite3.appspot.com/static/compressed_codemirror.js"></script>
	<script>
	  mobwrite.syncGateway = 'http://mobwrite3.appspot.com/scripts/q.py';
	</script>
	<script class="abs-ui" src="<?php echo $full_url; ?>/abstraction/ui/scripts/js/ui.js" type="text/javascript"></script>
	<script class="abs-ui" src="<?php echo $full_url; ?>/abstraction/core/scripts/codemirror1/js/codemirror.js" type="text/javascript"></script>
	<script class="abs-ui" src="<?php echo $full_url; ?>/abstraction/core/scripts/js/abstraction.js" type="text/javascript"></script>
	<script class="abs-ui" src="<?php echo $full_url; ?>/abstraction/core/scripts/js/loader.js" type="text/javascript"></script>
</head>
<body>
</body>
</html>