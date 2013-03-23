<?php
	session_start();
	global $version;
	$release = file_get_contents("http://abstractionbuilder.com/downloads/abstractionbuilder/release.txt");
	if ($version != $release)
		echo "<div id='updateAbstraction'>There is a new version of Abstraction available.<br>You can download it <a href='http://abstractionbuilder.com/downloads.php'>here</a>.</div>";
?>