<?php
	session_start();
	global $builder_url, $theme;
	
	require("config.php");
	require("settings.php");
	//require("scripts/server/files.php");
	require("scripts/server/login.php");
?>
<!DOCTYPE html>

	<!-- Abstraction v.1.0 (c) 2008-2011 Britton Reeder-Thompson -->
	<!--               Web Builder Application                   -->

<html lang="en">
<head>
	<meta charset="utf-8" />
	<meta http-equiv="cache-control" content="no-cache">
	<meta http-equiv="pragma" content="no-cache">
	<meta http-equiv="expires" content="-1">

	<title>Abstraction Builder</title>

	<!--[if IE]> <script type="text/javascript">window.isIE = true;</script> <![endif]-->
	
	<link class="abs-ui" rel="stylesheet" type="text/css" href="<?php echo $builder_url; ?>/styles/@-defaults.css" />
	<link class="abs-ui" rel="stylesheet" type="text/css" href="<?php echo $theme; ?>" />
	<link class="abs-ui" rel="stylesheet" type="text/css" href="<?php echo $builder_url; ?>/scripts/codemirror/lib/codemirror.css" />
	<link class="abs-ui" rel="stylesheet" type="text/css" href="<?php echo $builder_url; ?>/scripts/codemirror/theme/default.css" />
	
	<script class="abs-ui" src="<?php echo $builder_url; ?>/scripts/js/jquery-1.4.4.min.js" type="text/javascript"></script>
	<script class="abs-ui" src="<?php echo $builder_url; ?>/scripts/js/jquery-ui-1.8.7.custom.min.js" type="text/javascript"></script>
	<script class="abs-ui" src="<?php echo $builder_url; ?>/scripts/js/jshashtable-2.1.js" type="text/javascript"></script>
	<script class="abs-ui" src="<?php echo $builder_url; ?>/scripts/js/oop.js" type="text/javascript"></script>
	<script class="abs-ui" src="<?php echo $builder_url; ?>/scripts/codemirror/lib/codemirror.js" type="text/javascript"></script>
	<script class="abs-ui" src="<?php echo $builder_url; ?>/scripts/codemirror/mode/clike/clike.js" type="text/javascript"></script>
	<script class="abs-ui" src="<?php echo $builder_url; ?>/scripts/codemirror/mode/xml/xml.js" type="text/javascript"></script>
	<script class="abs-ui" src="<?php echo $builder_url; ?>/scripts/codemirror/mode/css/css.js" type="text/javascript"></script>
	<script class="abs-ui" src="<?php echo $builder_url; ?>/scripts/codemirror/mode/javascript/javascript.js" type="text/javascript"></script>
	<script class="abs-ui" src="<?php echo $builder_url; ?>/scripts/codemirror/mode/php/php.js" type="text/javascript"></script>
	<script class="abs-ui" src="<?php echo $builder_url; ?>/scripts/codemirror/mode/htmlmixed/htmlmixed.js" type="text/javascript"></script>
	<script class="abs-ui" src="<?php echo $builder_url; ?>/scripts/js/user_input.js" type="text/javascript"></script>
	<script class="abs-ui" src="<?php echo $builder_url; ?>/scripts/js/window.js" type="text/javascript"></script>
	<script class="abs-ui" src="<?php echo $builder_url; ?>/scripts/js/engine.js" type="text/javascript"></script>
	<script class="abs-ui" src="<?php echo $builder_url; ?>/scripts/js/builder.js" type="text/javascript"></script>
	<script class="abs-ui" src="<?php echo $builder_url; ?>/scripts/js/pixlr.js" type="text/javascript"></script>
</head>
<body>
</body>
</html>