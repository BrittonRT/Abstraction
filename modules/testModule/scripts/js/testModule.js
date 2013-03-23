	// Abstraction v.1.0 (c) 2008-2011 Britton Reeder-Thompson //
	//               Example Module Definition                 //

var $window = $(window),
	$document = $(document),
	YourModule = (function() {
		YourModule.Inherits(ui.Window);
		function YourModule(parent) {
			var cmLoadTimer;
			parent = parent || document.body;
			this.window = $('<div/>')
				.attr("id", "absMobWriteTest")
				.appendTo(parent)
				.append('<textarea id="absMobwriteTextarea" style="border: none; margin: 0; padding: 0;"></textarea>')
				.get(0);
			this.options({
				selector: this.window,
				title: "<div class='abs-sourceEditor-icon'></div>Collaborative Editing Test",
				taskbar: abstraction.taskbar,
				left: 300,
				top: 300,
				width: 500,
				height: 400,
				focus: this.onfocus
			});
			this.focus();
			mobwrite.debug = true;
			var absMobwriteTextarea = mobwrite.shareCodeMirror.create('absMobwriteTextarea', {
				height: '100%',
				width: 'auto',
				parserfile: ['tokenizejavascript.js', 'parsejavascript.js'],
				path: 'abstraction/core/scripts/codemirror1/js/',
				stylesheet: 'abstraction/core/scripts/codemirror1/css/jscolors.css',
				lineNumbers: true,
				onLoad: function(editor) {
					cmLoadTimer = setTimeout(function() {
						//if (editor.editor.fullyLoaded) {
						//	clearTimeout(cmLoadTimer);
							mobwrite.share(absMobwriteTextarea);
						//}
					}, 1000);
				}
			});
		}
		YourModule.prototype.onfocus = function() {
			abstraction.updateGroupFocus(this);
		}
		YourModule.prototype.setZindex = function() {
			var i = abstraction.groupZindex.length;
			while (i--)
				if (abstraction.groupZindex[i] === this) {
					abstraction.groupZindex.splice(i, 1);
				}
			abstraction.groupZindex[abstraction.groupZindex.length] = this;
		}
		return YourModule;
	})(),
	yourModule = new YourModule(abstraction.desktop);