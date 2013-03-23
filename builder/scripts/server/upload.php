<?php
	session_start();
	$extRoot = $_SERVER['SERVER_NAME'].$_SERVER['REQUEST_URI'];
	$extRoot = explode("/builder/scripts/server/upload.php", $extRoot);
	$extRoot = $extRoot[0];
	$absRoot = $_SERVER['DOCUMENT_ROOT'].$_SERVER['REQUEST_URI'];
	$absRoot = explode("/builder/scripts/server/upload.php", $absRoot); // remove trailing directories, leaving only the root directory to the subdirectory abstraction is attached to
	$absRoot = $absRoot[0];  // We are left with the exact internal directory path to our abstraction install's root editable folder
	if (!isset($_SESSION["UID"]) || $_SESSION["ROOT"] != $extRoot) exit("Warning: You must be logged in to edit files.");
	
	$target_path = "../../.." . $_GET['path'] . basename( $_FILES["upload_image"]["name"]); 
	
	if ($_FILES["upload_image"]["error"] > 0) {
		echo "Error: " . $_FILES["upload_image"]["error"] . "<br />";	
	} else {
		if (move_uploaded_file($_FILES["upload_image"]["tmp_name"], $target_path)) {
			echo substr($_GET['path'], 1) . basename( $_FILES["upload_image"]["name"]); 
		} else {
		    echo false;  
		}
	}
?>