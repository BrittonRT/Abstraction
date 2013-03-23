<?php
	session_start();
	global $full_url, $root, $url;
	require('config.php');
	require('errors.php');
	$errors = new ErrorHandler('files', $log_errors, $root.$install_dir.$log_dir);
	
	if ($_POST['fn'] == "relog") {
		include("../../../settings/accounts.php");
		foreach ($GLOBALS['users'] as $user) {
			if (stripslashes($_POST['loginUsername']) == $user['username'] && hash('sha256', stripslashes($_POST['loginPassword'])) == $user['password']) {
				$_SESSION["USER"] = $_POST['loginUsername'];
				$_SESSION["UID"] = uniqid(rand(1,1024));
				$_SESSION["HOSTS"] = $user['hosts'];
				$_SESSION["ROLE"] = $user['role'];
				$_SESSION["THEME"] = $user['theme'];
				$_SESSION["UI"] = $user['ui'];
				$_SESSION["ROOT"] = $root;
				echo "<p class='abs-login-success'>Login successful.</p>";
				break;
			} else
				echo "<p class='abs-login-error'>Incorrect username or password.</p>";
		}
	}
	
	if (!isset($_SESSION["UID"]) || $_SESSION["ROOT"] != $root) exit("Warning: You must be logged in to edit files.");
	
	switch($_POST['fn']) {
	
		case 'get':		// Nonlocal get file contents:  gets contents of a file over http
			$target = explode($url, $_POST['path']);
			$target = (sizeOf($target) == 1) ? $root.$_POST['path'] : $root.$target[1];
			echo file_get_contents($target);
			break;

		case 'lset':	// Lazy set file contents: will not overwrite existing file
			$target = explode($url, $_POST['path']);
			$target = (sizeOf($target) == 1) ? $root.$_POST['path'] : $root.$target[1];
			if (file_exists($target))
				echo "exists";
			else
				echo file_put_contents($target, stripslashes($_POST['content']));
			break;
			
		case 'gset':	// Greedy set file contents: will overwrite existing file
			$target = explode($url, $_POST['path']);
			$target = (sizeOf($target) == 1) ? $root.$_POST['path'] : $root.$target[1];
			echo file_put_contents($target, stripslashes($_POST['content']));
			break;
			
		case 'revset':
			if ($_POST['path'] == '') {
				$date = date('Y-m');
				mkdir($root.$install_dir.'/backups/'.$_POST['url'].'/'.$date);
				$output = '/'.$date.'/'.date('Y-m-j-H-i-s').'.backup';
				$target = $root.$install_dir.'/backups/'.$_POST['url'].$output;
			} else {
				$output = '/'.$_POST['path'].'/'.date('Y-m-j-H-i-s').'.backup';
				$target = $root.$install_dir.'/backups/'.$_POST['url'].$output;
			}
			file_put_contents($target, stripslashes($_POST['content']));	
			echo $target;
			break;
			
		case 'revdset':
			$target = $root.$install_dir.'/backups/'.$_POST['path'].date('Y-m').'-'.$_POST['name'];
			echo mkdir($target);
			break;
			
		case 'dir':		// Returns contents of a specified directory as JSON
			$target = $root.$_POST['path'];
			if (is_dir($target)) {
				$contents = get_directory_contents($target);
				$arr = array();
				foreach ($contents as $file) {
					$arr[$file] = filetype($target.$file);
				}
				echo json_encode($arr);
			} else
				echo $errors->throw_error('008', 'Target directory does not exist');
			break;
			
		case 'dset':	// Creates a new directory
			$target = $root.$_POST['path'];
			if (mkdir($target))
				echo "directory created";
			else
				echo "creation failed";
			break;
			
		case 'copy':	// Copies a file and pastes it to a specified directory
			$src = $root.$_POST['src'];
			$srcName = explode('/', $_POST['src']);
			$srcName = $srcName[sizeof($srcName)-1];
			$dst = $root.$_POST['dest'];
			if (is_dir($src)) {
				mkdir($dst.$srcName);
				recurse_copy($src, $dst.$srcName);
			} else
				copy($src, $dst.$srcName);
			echo $dst.$srcName;
			break;
			
		case 'rename':	// Renames a file to a specified name
			$src = $root.$_POST['src'];
			$target = explode("/", $src);
			$ext = explode(".", $target[sizeof($target)-1]);
			if (isset($ext[1]))
				$ext = '.'.$ext[1];
			else
				$ext = "";
			$target = str_replace($target[sizeof($target)-1], "", $src);
			$name = explode("/", $_POST['name']);
			$nameArr = explode(".", $name[sizeof($name)-1]);
			if (!isset($nameArr[1]))
				$name = $name[sizeof($name)-1].$ext;
			else
				$name = $name[sizeof($name)-1];
			$target .= $name;
			rename($src, $target);
			echo $target;
			break;
			
		case 'renamerev':	// Renames a file to a specified name
			$src = $root.$_POST['src'];
			$target = explode(".backup", $src);
			if (isset($target[1])) {
				$target = explode("/", $target[0]);
				$date = explode("-", $target[sizeof($target)-1]);
				$name = $date[0].'-'.$date[1].'-'.$date[2].'-'.$date[3].'-'.$date[4].'-'.$date[5].'-'.$_POST['name'].'.backup';
				$target = explode($target[sizeof($target)-1], $src);
				$target = $target[0].$name;
			} else {
				$target = explode("/", $target[0]);
				$date = explode("-", $target[sizeof($target)-1]);
				$name = $date[0].'-'.$date[1].'-'.$_POST['name'];
				$target = explode($target[sizeof($target)-1], $src);
				$target = $target[0].$name;
			}
			rename($src, $target);
			echo $target;
			break;
			
		case 'del':		// Deletes a specified file or directory
			$src = $root.$_POST['src'];
			recurse_delete($src);
			echo 'deleted';
			break;
			
		case 'root':	// Returns the url of the abstraction web root
			$output 	 = (!empty($_SERVER['HTTPS']))  ? "https://" : "http://";
			$output		.= $url;
			echo $output;
			break;
	}

	// INTERNAL FUNCTIONS
	
	function get_file_extension($file) {
		$file_array = explode(".", $file);
		
		if ($file_array[1]) {
			$file_extension = $file_array[1];
			unset($file_array);
			return $file_extension;	
		} else
			return false;
	}
	
	function get_directory_contents($dir_path) {
		if (is_dir($dir_path)) {
			if ($handle = opendir($dir_path)) {
				while (false !== ($file = readdir($handle))) {	
					$content[] = $file;	
				}
				closedir($handle);
				return $content;	
			} else
				closedir($handle);	
		}
		return false;
	}
	
	function recurse_copy($src, $dst) { 
	    $dir = opendir($src); 
	    @mkdir($dst); 
	    while(false !== ( $file = readdir($dir)) ) { 
	        if (( $file != '.' ) && ( $file != '..' )) { 
	            if ( is_dir($src . '/' . $file) && $file != 'builder' )
	                recurse_copy($src . '/' . $file,$dst . '/' . $file); 
	            else
	                copy($src . '/' . $file,$dst . '/' . $file); 
	        } 
	    } 
	    closedir($dir); 
	}
	
	function recurse_delete($src) {
        if(is_file($src))
            return @unlink($src);
		elseif(is_dir($src)) {
            $scan = glob(rtrim($src,'/').'/*');
            foreach($scan as $index=>$path) {
                recurse_delete($path);
            }
            return @rmdir($src);
        }
    }
?>