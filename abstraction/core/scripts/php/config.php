<?php
	/*		 	Abstraction v.1.0 (c) 2008-2011			 */
	/*				  SAL  Configuration:				 */
	/*	do not edit unless you know what you are doing!	 */
	
	global $full_url, $install, $install_dir, $log_dir, $log_errors, $modules_dir, $root, $url, $version;
	
	/*  SETTINGS  */
	$log_errors  = true;
	$install_dir = '/desktop';
	$backup_dir  = '/backups';
	$log_dir     = '/logs';
	$module_dir  = '/modules';
	
	/*  DO NOT EDIT BELOW THIS LINE  */
	$version = '1.0.9';
	
	$install = $_SERVER['REQUEST_URI'];
	if (!is_dir($install))
		$install = (reverse_strrchr($install, "/", 0));
	
	$url		= $_SERVER['SERVER_NAME'].$_SERVER['REQUEST_URI'];					// external root is the url
	$url		= explode($install_dir, $url);
	$url		= $url[0];
	
	$root		= $_SERVER['DOCUMENT_ROOT'].$_SERVER['REQUEST_URI'];				// internal root is the filesystem path
	$root		= explode($install_dir, $root);										// remove trailing directories, leaving only the root directory to the subdirectory abstraction is attached to
	$root		= $root[0];															// We are left with the exact internal directory path to our abstraction install's root editable folder
	
	$full_url 	 = (!empty($_SERVER['HTTPS']))  ? "https://" : "http://";
	$full_url	.= $url.$install_dir;

	// return everything up to last instance of needle
	// use $trail to include needle chars including and past last needle 
	function reverse_strrchr($haystack, $needle, $trail) {
		return strrpos($haystack, $needle) ? substr($haystack, 0, strrpos($haystack, $needle) + $trail) : false;
	}
?>