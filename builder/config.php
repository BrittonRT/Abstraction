<?php
	/*		 	Abstraction v.1.0 (c) 2008-2011			 */
	/*				 Builder Configuration:				 */
	/*	do not edit unless you know what you are doing!	 */
	
	/* Directory names */
	$master_file_path 	= $_SERVER['DOCUMENT_ROOT'];
	$url 				= (!empty($_SERVER['HTTPS'])) ? "https://".$_SERVER['SERVER_NAME'] : "http://".$_SERVER['SERVER_NAME'];

	$builder_dir 		= '/'.basename(dirname(__FILE__));
	
			$root = $url.$_SERVER['REQUEST_URI'];
			$root = explode($builder_dir, $root);
			$root = explode($url, $root[0]);
			$root = $root[1];
	
	$site_dir 			= $root;
	
	$builder_url 		= $url.$site_dir.$builder_dir;	
	
?>