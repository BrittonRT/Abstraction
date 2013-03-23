<?php
	session_start();
	require('config.php');
	require('errors.php');
	$errors = new ErrorHandler('upload', $log_errors, $root.$install_dir.$log_dir);
	if (!isset($_SESSION["UID"]) || $_SESSION["ROOT"] != $root) exit("Warning: You must be logged in to edit files.");
	
	$target_path = $root.$_GET['path'] . basename( $_FILES["upload_image"]["name"]); 
	
	if ($_FILES["upload_image"]["error"] > 0) {
		$errors->throw_error('01', $_FILES["upload_image"]["error"]);	
	} else {
		if (move_uploaded_file($_FILES["upload_image"]["tmp_name"], $target_path)) {
			echo substr($_GET['path'], 1) . basename( $_FILES["upload_image"]["name"]); 
		} else {
		    echo false;  
		}
	}
?>