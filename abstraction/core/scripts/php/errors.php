<?php
	session_start();
	class ErrorHandler {
		private $group;
		private $log_errors;
		private $log_path;
		public function __construct($group, $log_errors, $log_path) {
			$this->group = $group;
			$this->log_errors = $log_errors;
			$this->log_path = $log_path;
		}
		public function throw_error($code, $error) {
			$full_error = 'Error ['.$this->group.$code.']: '.$error;
			if ($this->log_errors)
				$this->log_error($full_error);
			return $full_error;
		}
		private function log_error($error) {
			$date = date('Y-m');
			$path = $this->log_path.'/'.$date;
			$file = '/'.$this->group;
			mkdir($path);
			$fp = fopen($path.$file, 'w');
			fwrite($fp, $error.'\r');
			fclose($fp);
		}
	}
?>