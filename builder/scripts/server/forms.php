<?php
// Abstraction Builder v.1.0 Beta - Abstract Method © 2009-2011. "Abstraction" is a trademark of Abstract Method //
	function get($name, $default = false){
		return (isset($_GET[$name])) ? $_GET[$name] : $default;
	}
	function post($name, $default = false){
		return (isset($_POST[$name])) ? $_POST[$name] : $default;	
	}
	function request($name, $default = false){	
		return (isset($_REQUEST[$name])) ? $_REQUEST[$name] : $default;
	}
	function set_get($name, $value){
		$_GET[$name] = $value;	
	}
	function set_post($name, $value){
		$_POST[$name] = $value;		
	}
?>