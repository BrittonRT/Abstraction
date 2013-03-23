	// Abstraction v.1.0 (c) 2008-2011 Britton Reeder-Thompson //
	//            Module Loader Object Definition              //

// Global shortcuts
var $window = $(window),
	$document = $(document),
	loader;
	
$document.ready(function() {
	$.ajax({
		type: "POST",
		url: "abstraction/core/scripts/php/modules.php",
		success: function(data) {
			var modules = data.split(",");
			loader = new ModuleLoader(abstraction, modules, function() {
				abstraction.getUI();
			});
		}
	});
});
// ModuleLoader object prototype
var ModuleLoader = (function() {
	function ModuleLoader(target, modules, callback) {
		var moduleLoader = this,
			i = modules.length;
		moduleLoader.loading = {};
		moduleLoader.modules = [];
		moduleLoader.callback = callback;
		if (i == 1 && '' == $.trim(modules[i]))
			moduleLoader.callback();
		while (i--)
			moduleLoader.load(modules[i]);
	}
	ModuleLoader.prototype.load = function(module) {
		var moduleLoader = this;
		moduleLoader.loading[module] = true;
		$.ajax({
			url: "modules/"+module+"/scripts/js/"+module+".js",
			dataType: "script",
			success: function() { moduleLoader.loaded(module); }
		});
	}
	ModuleLoader.prototype.loaded = function(module) {
		delete this.loading[module];
		this.modules[this.modules.length] = module;
		if (isEmpty(this.loading))
			this.callback();
	}
	return ModuleLoader;
})();

function isEmpty(o) {
  for(var p in o) {
    if (o[p] != o.constructor.prototype[p])
      return false;
  }
  return true;
}