<?php
	// Abstraction Builder v.1.0.7 Beta - Abstract Method © 2009-2011. "Abstraction" is a trademark of Abstract Method //
	session_start();
	$version = '1.0.8';
	$release = file_get_contents("http://abstractionbuilder.com/downloads/abstractionbuilder/release.txt");
	if ($version != $release)
		echo "<div id='updateAbstraction'>There is a new version of Abstraction available.<br>You can download it <a href='http://abstractionbuilder.com/downloads.php'>here</a>.</div>";
?>