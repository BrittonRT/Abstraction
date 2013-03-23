<?php
	session_start();
	require('config.php');
	if (file_exists($root.$install_dir.'/modules/keys.php'))
		$modules = include($root.$install_dir.'/modules/keys.php');
	else
		exit('no modules');
	$output = '';
	foreach ($modules as $module => $key) {
		$output .= ','.$module;
	}
	echo substr($output, 1);
?>