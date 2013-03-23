	// Abstraction v.1.0 (c) 2008-2011 Britton Reeder-Thompson //
	//            Abstraction Object Definition                //

// Global shortcuts
var $window = $(window),
	$document = $(document),
	abstraction;

$document.ready(function() {
	abstraction = new Abstraction();
});
// This variable is the only object prototype we declare in the global namespace.  All other variables are incapsulated in the scope of an anonymous function...
var Abstraction = (function() {
	// Define Abstraction object
	function Abstraction(parent, docFilePath) {
		// Argument logic
		parent = parent || document.body;
		
		// Local variable declaration
		var abstraction = this,				 		// Preserves the meaning of 'this' keyword throughout the object
			attributeEditors = new Hashtable(),
			documentPreviews = new Hashtable(),
			documentStates   = new Hashtable(),
			inlineEditors    = new Hashtable(),
			sourceEditors    = new Hashtable(),
			$parent = $(parent);
		abstraction.attributeEditors = attributeEditors;
		abstraction.documentPreviews = documentPreviews;
		abstraction.documentStates   = documentStates;
		abstraction.inlineEditors    = inlineEditors;
		abstraction.sourceEditors    = sourceEditors;
		
		// Member variable declaration
		abstraction.parent = parent;
		abstraction.$ =
		abstraction.jquery = $(parent);
		abstraction.uiHidden = false;
		abstraction.groupZindex = [];
		abstraction.contextElem;
		abstraction.contextFile;
		abstraction.contextRevision;
		abstraction.uiLoaded = false;
		abstraction.autosave = true;     // Boolean which toggles autoupdate on the source editor working docs
		abstraction.protectedMode = true;  // Boolean which toggles between experimental rich editing features and stable raw file editing
		abstraction.version = '1.0.9';
		abstraction.editorsDockable = true;
		abstraction.previewsDockable = true;
		
		// Logic
		//$window.bind('unload', function() {
		//	documentStates.each(function(key) {
		//		documentStates.get(key).destroy();  // Properly destroys all state objects, including deleting working documents
		//	});
		//});
		$window.focus();
		$parent.bind('click', function() { abstraction.docClick() });
	
	  /////////////////////////////////////
	 // 	  WINDOW CONSTRUCTORS		//
	/////////////////////////////////////
		
		var AttributeEditor = (function() {
			AttributeEditor.Inherits(ui.Window);
			function AttributeEditor(file, elem, taskbars, parent) {
				parent = parent || abstraction.desktop;
				var attributeEditor = this;
					
				this.$ = $("<div/>")
					.attr("class", "window abs-attribute-editor-ui abs-ui")
					.css("display", "none")
					.appendTo(parent);
				this.window = this.$.get(0);
				this.$wrapper = $("<div/>")
					.css({
						overflow: 'auto',
						width: '100%',
						height: '100%'
					})
					.addClass("content abs-ui")
					.appendTo(this.window);  // add wrapper to the new window
				this.wrapper = this.$wrapper.get(0);
				this.attributes = {};
				this.name = 'attributeEditor';
				
				attributeEditor.options({
					selector: this.window,
					title: "<div class='abs-attributeEditor-icon'></div>Editing: &lt;"+elem.nodeName+"&gt;'s Attributes",
					taskbar: taskbars,
					left: 500,
					top: 200,
					width: 630,
					height: 360,
					dragstop: attributeEditor.saveUI,
					resizestop: attributeEditor.saveUI,
					minimize: attributeEditor.saveUI,
					unminimize: attributeEditor.saveUI,
					maximize: attributeEditor.saveUI,
					unmaximize: attributeEditor.saveUI,
					menu: false,
					focus: this.onfocus
				});
				
				attributeEditor.load(file, elem);
				attributeEditor.open();           // reveal the new window
				attributeEditor.focus();
			}
			AttributeEditor.prototype.close = function() {
				if (this.elem)
					attributeEditors.remove(this.elem);
				if (this.state) {
					var i = this.state.attributeEditors.length;
					while (i--)
						 if (this.state.attributeEditors[i] === this)
							this.state.attributeEditors.splice(i, 1);
					var i = this.state.winZindex.length;
					while (i--)
						if (this.state.winZindex[i] === this)
							this.state.winZindex.splice(i, 1);
					this.state = null;
				}
				this.$.unbind().empty();
				this.destroy();
			}
			AttributeEditor.prototype.blankAttribute = function(attr) {
				var attributeEditor = this,
					cases = {};
				cases['onclick'] =
				cases['onmouseover'] = 
				cases['onmouseout'] = 
				cases['onload'] = 
				cases['onunload'] = 
				cases['style'] = function() {
					var editor = document.createElement("textarea");
					$(editor)
						.css({
							marginBottom: '1px',
							width: 350,
							height: 150
						})
						.bind("keyup", function(e) {
							var val = $(this).val();
							clearTimeout(attributeEditor.attrTimer);
							attributeEditor.attrTimer = setTimeout(function() {
								attributeEditor.state.execute({
									fn: 'editAttribute',
									elem: attributeEditor.elem,
									attribute: attr,
									content: val
								});
								val = null;
							}, 500);  // save file if no typing for .5 seconds
						});
					return editor;
				}
				cases['default'] = function() {
					var editor = document.createElement("input");
					$(editor)
						.css({
							margin: '0px',
							marginBottom: '3px',
							padding: '0px'
						})
						.bind("keyup", function(e) {
							var val = $(this).val();
							clearTimeout(attributeEditor.attrTimer);
							attributeEditor.attrTimer = setTimeout(function() {
								attributeEditor.state.execute({
									fn: 'editAttribute',
									elem: attributeEditor.elem,
									attribute: attr,
									content: val
								});
								val = null;
							}, 500);  // save file if no typing for .5 seconds
						});
					return editor;
				}
				attributeEditor.attributes[attr] = true;
				if (typeof cases[attr] == 'function')
					var attrEditor = cases[attr]();
				else
					var attrEditor = cases['default']();
				var newAttribute = document.createElement("div");  // This is the window wrapper
					$(newAttribute).css({
						marginLeft: 10,
						marginTop: 5
					});
					newAttribute.innerHTML = "<b style='display: inline-block; width: 100px;'>"+attr+"</b>";
					newAttribute.appendChild(attrEditor);
				cases = null;
				attrEditor = null;
				return newAttribute;
			}
			AttributeEditor.prototype.getAttribute = function(attr) {
				var attributeEditor = this,
					cases = {};
				cases['onclick'] =
				cases['onmouseover'] = 
				cases['onmouseout'] = 
				cases['onload'] = 
				cases['onunload'] = 
				cases['style'] = function() {
					var editor = document.createElement("textarea");
					$(editor)
						.css({
							marginBottom: '1px',
							width: 350,
							height: 150
						})
						.val(attr.nodeValue.replace(/;\s*/gi, ";\r"))
						.bind("keyup", function(e) {
							var val = $(this).val();
							clearTimeout(attributeEditor.attrTimer);
							attributeEditor.attrTimer = setTimeout(function() {
								attributeEditor.state.execute({
									fn: 'editAttribute',
									elem: attributeEditor.elem,
									attribute: attr.nodeName,
									content: val
								});
								val = null;
							}, 500);  // save file if no typing for .5 seconds
						});
					return editor;
				}
				cases['default'] = function() {
					var editor = document.createElement("input");
					$(editor)
						.css({
							margin: '0px',
							marginBottom: '3px',
							padding: '0px'
						})
						.val(uncacheSafe(attr.nodeValue.replace(/;\s*/gi, ";\r")))
						.bind("keyup", function(e) {
							var val = $(this).val();
							clearTimeout(attributeEditor.attrTimer);
							attributeEditor.attrTimer = setTimeout(function() {
								attributeEditor.state.execute({
									fn: 'editAttribute',
									elem: attributeEditor.elem,
									attribute: attr.nodeName,
									content: val
								});
								val = null;
							}, 500);  // save file if no typing for .5 seconds
						});
					return editor;
				}
				attributeEditor.attributes[attr.nodeName] = true;
				var attrEditor;
				if (typeof cases[attr.nodeName] == 'function')
					var attrEditor = cases[attr.nodeName]();
				else
					var attrEditor = cases['default']();
				var newAttribute = document.createElement("div");  // This is the window wrapper
					$(newAttribute).css({
						marginLeft: 10,
						marginTop: 10
					});
					newAttribute.innerHTML = "<b style='display: inline-block; width: 100px;'>"+attr.nodeName+"</b>";
					newAttribute.appendChild(attrEditor);
				cases = null;
				attrEditor = null;
				return newAttribute;
			}
			AttributeEditor.prototype.load = function(file, elem) {
				var attributeEditor = this,
					cases = {},
					arr = file.split(abstraction.root);
				if (arr.length > 1)
					file = arr[1];
				arr = file.split("/");
				for (var i=0; i<arr.length-1; i++)
					if (arr[i] != "") {
						attributeEditor.currentPath += arr[i]+"/";
						attributeEditor.returnPath += "../";
					}
				arr = file.split("?");
				file = arr[0];
				if (file.charAt(0) != "/")
					file = "/"+file;
				if (attributeEditor.currentDoc == undefined)  // If abstraction was just loaded...
					attributeEditor.currentDoc = uncacheSafe(file.substr(1));
				else {
					attributeEditor.lastDoc = attributeEditor.currentDoc;
					attributeEditor.currentDoc = uncacheSafe(file.substr(1));
				}
				attributeEditor.file = file;
				attributeEditor.elem = elem;
				attributeEditors.put(elem, attributeEditor);
				if (this.state) {
					var i = this.state.attributeEditors.length;
					while (i--)
						 if (this.state.attributeEditors[i] === this)
							this.state.attributeEditors.splice(i, 1);
				}
				attributeEditor.state = documentStates.get(file);
				if (attributeEditor.state == undefined)  // If a documentState object does not exist for this file, create one
					attributeEditor.state = new DocumentState(file);
				attributeEditor.state.linkAttributeEditor(attributeEditor);
				attributeEditor.$wrapper.empty();
				for (i=0; i<elem.attributes.length; i++) {
					attributeEditor.$wrapper.append(attributeEditor.getAttribute(elem.attributes[i]));
					//$(newWrapper).append("<div>"+elem.attributes[i].nodeName+": "+elem.attributes[i].nodeValue+"</div>");
				}
				switch (elem.nodeName) {
				case 'A':
					if (attributeEditor.attributes['href'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('href'));
					if (attributeEditor.attributes['target'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('target'));
					if (attributeEditor.attributes['rel'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('rel'));
					if (attributeEditor.attributes['hreflang'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('hreflang'));
					if (attributeEditor.attributes['media'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('media'));
					if (attributeEditor.attributes['type'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('type'));
					if (attributeEditor.attributes['class'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('class'));
					if (attributeEditor.attributes['id'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('id'));
					if (attributeEditor.attributes['style'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('style'));
					break;
				case 'AREA':
					if (attributeEditor.attributes['href'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('href'));
					if (attributeEditor.attributes['shape'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('shape'));
					if (attributeEditor.attributes['coords'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('coords'));
					if (attributeEditor.attributes['alt'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('alt'));
					if (attributeEditor.attributes['class'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('class'));
					if (attributeEditor.attributes['id'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('id'));
					break;
				case 'AUDIO':
				case 'VIDEO':
					if (attributeEditor.attributes['src'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('src'));
					if (attributeEditor.attributes['controls'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.getAttribute('controls'));
					if (attributeEditor.attributes['preload'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('preload'));
					if (attributeEditor.attributes['autoplay'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('autoplay'));
					if (attributeEditor.attributes['class'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('class'));
					if (attributeEditor.attributes['id'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('id'));
					if (attributeEditor.attributes['style'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('style'));
					break;
				case 'BASE':
					if (attributeEditor.attributes['href'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.getAttribute('href'));
					if (attributeEditor.attributes['target'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('target'));
					break;
				case 'BDO':
					if (attributeEditor.attributes['dir'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('dir'));
					if (attributeEditor.attributes['class'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('class'));
					if (attributeEditor.attributes['id'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('id'));
					if (attributeEditor.attributes['style'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('style'));
					break;
				case 'BLOCKQUOTE':
				case 'Q':
					if (attributeEditor.attributes['cite'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('cite'));
					if (attributeEditor.attributes['class'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('class'));
					if (attributeEditor.attributes['id'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('id'));
					if (attributeEditor.attributes['style'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('style'));
					break;
				case 'CANVAS':
					if (attributeEditor.attributes['width'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('width'));
					if (attributeEditor.attributes['height'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('height'));
					if (attributeEditor.attributes['class'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('class'));
					if (attributeEditor.attributes['id'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('id'));
					if (attributeEditor.attributes['style'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('style'));
					break;
				case 'COL':
				case 'COLGROUP':
					if (attributeEditor.attributes['span'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('span'));
					if (attributeEditor.attributes['align'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('align'));
					if (attributeEditor.attributes['class'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('class'));
					if (attributeEditor.attributes['id'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('id'));
					break;
				case 'COMMAND':
					if (attributeEditor.attributes['class'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('class'));
					if (attributeEditor.attributes['id'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('id'));
					if (attributeEditor.attributes['name'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('name'));
					if (attributeEditor.attributes['type'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('type'));
					if (attributeEditor.attributes['disabled'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('disabled'));
					if (attributeEditor.attributes['label'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('label'));
					if (attributeEditor.attributes['icon'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('icon'));
					break;
				case 'DETAILS':
					if (attributeEditor.attributes['open'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('open'));
					if (attributeEditor.attributes['class'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('class'));
					if (attributeEditor.attributes['id'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('id'));
					if (attributeEditor.attributes['style'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('style'));
					break;
				case 'EMBED':
					if (attributeEditor.attributes['src'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('src'));
					if (attributeEditor.attributes['width'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('width'));
					if (attributeEditor.attributes['height'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('height'));
					if (attributeEditor.attributes['wmode'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('wmode'));
					if (attributeEditor.attributes['type'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('type'));
					if (attributeEditor.attributes['class'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('class'));
					if (attributeEditor.attributes['id'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('id'));
					if (attributeEditor.attributes['style'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('style'));
					break;
				case 'FORM':
					if (attributeEditor.attributes['name'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('name'));
					if (attributeEditor.attributes['action'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('action'));
					if (attributeEditor.attributes['method'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('method'));
					if (attributeEditor.attributes['enctype'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('enctype'));
					if (attributeEditor.attributes['accept-charset'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('accept-charset'));
					if (attributeEditor.attributes['novalidate'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('novalidate'));
					if (attributeEditor.attributes['target'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('target'));
					if (attributeEditor.attributes['autocomplete'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('autocomplete'));
					if (attributeEditor.attributes['class'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('class'));
					if (attributeEditor.attributes['id'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('id'));
					if (attributeEditor.attributes['style'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('style'));
					break;
				case 'IFRAME':
					if (attributeEditor.attributes['src'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('src'));
					if (attributeEditor.attributes['width'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('width'));
					if (attributeEditor.attributes['height'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('height'));
					if (attributeEditor.attributes['name'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('name'));
					if (attributeEditor.attributes['sandbox'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('sandbox'));
					if (attributeEditor.attributes['seamless'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('seamless'));
					if (attributeEditor.attributes['class'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('class'));
					if (attributeEditor.attributes['id'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('id'));
					break;
				case 'IMG':
					if (attributeEditor.attributes['src'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('src'));
					if (attributeEditor.attributes['alt'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('alt'));
					if (attributeEditor.attributes['title'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('title'));
					if (attributeEditor.attributes['class'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('class'));
					if (attributeEditor.attributes['id'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('id'));
					if (attributeEditor.attributes['style'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('style'));
					break;
				case 'INPUT':
					if (attributeEditor.attributes['name'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('name'));
					if (attributeEditor.attributes['type'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('type'));
					if (attributeEditor.attributes['value'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('value'));
					if (attributeEditor.attributes['form'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('form'));
					if (attributeEditor.attributes['disabled'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('disabled'));
					if (attributeEditor.attributes['class'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('class'));
					if (attributeEditor.attributes['id'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('id'));
					break;
				case 'KEYGEN':
					if (attributeEditor.attributes['name'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('name'));
					if (attributeEditor.attributes['keytype'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('keytype'));
					if (attributeEditor.attributes['autofocus'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('autofocus'));
					if (attributeEditor.attributes['form'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('form'));
					if (attributeEditor.attributes['challenge'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('challenge'));
					if (attributeEditor.attributes['disabled'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('disabled'));
					if (attributeEditor.attributes['class'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('class'));
					if (attributeEditor.attributes['id'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('id'));
					break;
				case 'LABEL':
					if (attributeEditor.attributes['for'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('for'));
					if (attributeEditor.attributes['form'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('form'));
					if (attributeEditor.attributes['class'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('class'));
					if (attributeEditor.attributes['id'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('id'));
					if (attributeEditor.attributes['style'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('style'));
					break;
				case 'LI':
					if (attributeEditor.attributes['value'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('value'));
					if (attributeEditor.attributes['class'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('class'));
					if (attributeEditor.attributes['id'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('id'));
					if (attributeEditor.attributes['style'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('style'));
					break;
				case 'LINK':
					if (attributeEditor.attributes['href'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('href'));
					if (attributeEditor.attributes['rel'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('rel'));
					if (attributeEditor.attributes['type'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('type'));
					if (attributeEditor.attributes['hreflang'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('hreflang'));
					if (attributeEditor.attributes['media'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('media'));
					if (attributeEditor.attributes['sizes'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('sizes'));
					break;
				case 'MENU':
					if (attributeEditor.attributes['type'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('type'));
					if (attributeEditor.attributes['label'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('label'));
					if (attributeEditor.attributes['class'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('class'));
					if (attributeEditor.attributes['id'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('id'));
					break;
				case 'META':
					if (attributeEditor.attributes['name'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('name'));
					if (attributeEditor.attributes['charset'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('charset'));
					if (attributeEditor.attributes['http-equiv'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('http-equiv'));
					if (attributeEditor.attributes['content'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('content'));
					break;
				case 'METER':
					if (attributeEditor.attributes['value'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('value'));
					if (attributeEditor.attributes['min'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('min'));
					if (attributeEditor.attributes['low'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('low'));
					if (attributeEditor.attributes['high'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('high'));
					if (attributeEditor.attributes['max'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('max'));
					if (attributeEditor.attributes['optimum'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('optimum'));
					if (attributeEditor.attributes['class'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('class'));
					if (attributeEditor.attributes['id'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('id'));
					break;
				case 'OBJECT':
					if (attributeEditor.attributes['data'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.getAttribute('data'));
					if (attributeEditor.attributes['width'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.getAttribute('width'));
					if (attributeEditor.attributes['height'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.getAttribute('height'));
					if (attributeEditor.attributes['name'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.getAttribute('name'));
					if (attributeEditor.attributes['type'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.getAttribute('type'));
					if (attributeEditor.attributes['form'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('form'));
					if (attributeEditor.attributes['usemap'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.getAttribute('usemap'));
					break;
				case 'OL':
					if (attributeEditor.attributes['type'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('type'));
					if (attributeEditor.attributes['start'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('start'));
					if (attributeEditor.attributes['reversed'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('reversed'));
					if (attributeEditor.attributes['class'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('class'));
					if (attributeEditor.attributes['id'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('id'));
					if (attributeEditor.attributes['style'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('style'));
					break;
				case 'OPTGROUP':
					if (attributeEditor.attributes['disabled'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('disabled'));
					if (attributeEditor.attributes['label'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('label'));
					if (attributeEditor.attributes['class'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('class'));
					if (attributeEditor.attributes['id'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('id'));
					if (attributeEditor.attributes['style'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('style'));
					break;
				case 'OPTION':
					if (attributeEditor.attributes['value'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('value'));
					if (attributeEditor.attributes['label'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('label'));
					if (attributeEditor.attributes['disabled'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('disabled'));
					if (attributeEditor.attributes['selected'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('selected'));
					if (attributeEditor.attributes['class'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('class'));
					if (attributeEditor.attributes['id'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('id'));
					if (attributeEditor.attributes['style'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('style'));
					break;
				case 'OUTPUT':
					if (attributeEditor.attributes['name'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('name'));
					if (attributeEditor.attributes['for'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('for'));
					if (attributeEditor.attributes['form'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('form'));
					if (attributeEditor.attributes['class'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('class'));
					if (attributeEditor.attributes['id'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('id'));
					if (attributeEditor.attributes['style'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('style'));
					break;
				case 'PARAM':
					if (attributeEditor.attributes['name'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('name'));
					if (attributeEditor.attributes['value'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('value'));
					if (attributeEditor.attributes['class'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('class'));
					if (attributeEditor.attributes['id'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('id'));
					break;
				case 'SCRIPT':
					if (attributeEditor.attributes['src'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.getAttribute('src'));
					if (attributeEditor.attributes['type'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.getAttribute('type'));
					if (attributeEditor.attributes['language'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.getAttribute('language'));
					if (attributeEditor.attributes['defer'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.getAttribute('defer'));
					if (attributeEditor.attributes['async'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.getAttribute('async'));
					if (attributeEditor.attributes['charset'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.getAttribute('charset'));
					break;
				case 'SELECT':
					if (attributeEditor.attributes['name'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('name'));
					if (attributeEditor.attributes['disabled'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('disabled'));
					if (attributeEditor.attributes['form'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('form'));
					if (attributeEditor.attributes['multiple'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('multiple'));
					if (attributeEditor.attributes['size'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('size'));
					if (attributeEditor.attributes['autofocus'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('autofocus'));
					if (attributeEditor.attributes['required'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('required'));
					if (attributeEditor.attributes['class'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('class'));
					if (attributeEditor.attributes['id'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('id'));
					break;
				case 'STYLE':
					if (attributeEditor.attributes['media'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.getAttribute('media'));
					if (attributeEditor.attributes['type'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.getAttribute('type'));
					if (attributeEditor.attributes['scoped'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.getAttribute('scoped'));
					break;
				case 'TABLE':
					if (attributeEditor.attributes['border'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('border'));
					if (attributeEditor.attributes['class'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('class'));
					if (attributeEditor.attributes['id'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('id'));
					if (attributeEditor.attributes['style'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('style'));
					break;
				case 'TD':
					if (attributeEditor.attributes['colspan'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('colspan'));
					if (attributeEditor.attributes['rowspan'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('rowspan'));
					if (attributeEditor.attributes['headers'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('headers'));
					if (attributeEditor.attributes['class'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('class'));
					if (attributeEditor.attributes['id'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('id'));
					if (attributeEditor.attributes['style'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('style'));
					break;
				case 'TH':
					if (attributeEditor.attributes['colspan'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('colspan'));
					if (attributeEditor.attributes['rowspan'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('rowspan'));
					if (attributeEditor.attributes['headers'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('headers'));
					if (attributeEditor.attributes['scope'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('scope'));
					if (attributeEditor.attributes['class'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('class'));
					if (attributeEditor.attributes['id'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('id'));
					if (attributeEditor.attributes['style'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('style'));
					break;
				case 'TIME':
					if (attributeEditor.attributes['datetime'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('datetime'));
					if (attributeEditor.attributes['pubdate'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('pubdate'));
					if (attributeEditor.attributes['class'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('class'));
					if (attributeEditor.attributes['id'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('id'));
					if (attributeEditor.attributes['style'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('style'));
					break;
				case 'TRACK':
					if (attributeEditor.attributes['src'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('src'));
					if (attributeEditor.attributes['kind'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('kind'));
					if (attributeEditor.attributes['srclang'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('srclang'));
					if (attributeEditor.attributes['label'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('label'));
					if (attributeEditor.attributes['default'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('default'));
					if (attributeEditor.attributes['class'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('class'));
					if (attributeEditor.attributes['id'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('id'));
					break;
				default:
					if (attributeEditor.attributes['class'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('class'));
					if (attributeEditor.attributes['id'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('id'));
					if (attributeEditor.attributes['title'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('title'));
					if (attributeEditor.attributes['style'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('style'));
					if (attributeEditor.attributes['accesskey'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('accesskey'));
					if (attributeEditor.attributes['contenteditable'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('contenteditable'));
					if (attributeEditor.attributes['contextmenu'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('contextmenu'));
					if (attributeEditor.attributes['dir'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('dir'));
					if (attributeEditor.attributes['draggable'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('draggable'));
					if (attributeEditor.attributes['dropzone'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('dropzone'));
					if (attributeEditor.attributes['lang'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('lang'));
					if (attributeEditor.attributes['spellcheck'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('spellcheck'));
					if (attributeEditor.attributes['tabindex'] == undefined) attributeEditor.wrapper.appendChild(attributeEditor.blankAttribute('tabindex'));
					break;
				}
			}
			AttributeEditor.prototype.onfocus = function() {
				var attributeEditor = this;
				if (abstraction.activeState != attributeEditor.state) {
					abstraction.activeState = attributeEditor.state;
					abstraction.sourceOutline.load(attributeEditor.file);
					abstraction.revisionManager.load(attributeEditor.file);
				}
				abstraction.updateGroupFocus(attributeEditor);
			}
			AttributeEditor.prototype.saveUI = function() {
				abstraction.saveUI();
			}
			AttributeEditor.prototype.setZindex = function() {
				var i = this.state.winZindex.length;
				while (i--)
					if (this.state.winZindex[i] === this)
						this.state.winZindex.splice(i, 1);
				this.state.winZindex[this.state.winZindex.length] = this;
			}
			AttributeEditor.prototype.toggleMenu = function() {
				if (this.menuClosed) {
					this.menu.$.show();
					this.menuClosed = false;
				} else {
					this.menu.$.hide();
					this.menuClosed = true;
				}
			}
			return AttributeEditor;
		})();
		
		var ContextMenu = (function() {
			//ContextMenu.Inherits(Menu);
			function ContextMenu() {
				var contextMenu = this,
					json = {};
				contextMenu.$ = $("<div/>")
					.addClass("abs-contextMenu")
					.attr("id", 'absContextMenu')
					.css("display", 'none')
					.appendTo(document.body);
				contextMenu.wrapper = contextMenu.$.get(0);
				contextMenu.target;
				this.name = 'contextMenu';
				//contextMenu.set(json);
			}
			ContextMenu.prototype.close = function() {
				var contextMenu = this;
				contextMenu.$.fadeOut('fast', function() {
					contextMenu.$.unbind().empty();
					contextMenu.target = undefined;
				});
			}
			// CONTEXT MENU EVENT HANDLERS
			ContextMenu.prototype.adminToggle = function(e) {
				e = window.event || e;    // window.event is for IE
				if (e.stopPropagation)
					e.stopPropagation();  // Standards complient browsers
				else
					e.cancelBubble=true;  // IE
				abstraction.activeState.execute({
					fn: 'toggleAdmin',
					elem: abstraction.contextElem
				});
				$("#absContextMenu").fadeOut("fast");
			}
			ContextMenu.prototype.copyElement = function(e) {
				e = window.event || e;    // window.event is for IE
				if (e.stopPropagation)
					e.stopPropagation();  // Standards complient browsers
				else
					e.cancelBubble=true;  // IE
				abstraction.activeState.clipboard.push(abstraction.contextElem);
				$("#absContextMenu").fadeOut("fast");
			}
			ContextMenu.prototype.pasteElement = function(e) {
				abstraction.activeState.execute({
					fn: 'pasteElem',
					elem: abstraction.activeState.clipboard[$(this).attr("id").substr(3)],
					dest: abstraction.contextElem
				});
			}
			ContextMenu.prototype.clearClipboard = function(e) {
				e = window.event || e;    // window.event is for IE
				if (e.stopPropagation)
					e.stopPropagation();  // Standards complient browsers
				else
					e.cancelBubble=true;  // IE
				abstraction.activeState.clipboard = [];
				$("#absContextMenu").fadeOut("fast");
			}
			ContextMenu.prototype.clearFileClipboard = function(e) {
				e = window.event || e;    // window.event is for IE
				if (e.stopPropagation)
					e.stopPropagation();  // Standards complient browsers
				else
					e.cancelBubble=true;  // IE
				abstraction.fileManager.clipboard = [];
				$("#absContextMenu").fadeOut("fast");
			}
			ContextMenu.prototype.positionElemRel = function(e) {
				e = window.event || e;    // window.event is for IE
				if (e.stopPropagation)
					e.stopPropagation();  // Standards complient browsers
				else
					e.cancelBubble=true;  // IE
				abstraction.activeState.execute({
					fn: 'posElem',
					pos: 'relative',
					elem: abstraction.contextElem
				});
				$("#absContextMenu").fadeOut("fast");
			}
			ContextMenu.prototype.positionElemAbs = function(e) {
				e = window.event || e;    // window.event is for IE
				if (e.stopPropagation)
					e.stopPropagation();  // Standards complient browsers
				else
					e.cancelBubble=true;  // IE
				abstraction.activeState.execute({
					fn: 'posElem',
					pos: 'absolute',
					elem: abstraction.contextElem
				});
				$("#absContextMenu").fadeOut("fast");
			}
			ContextMenu.prototype.positionElemFix = function(e) {
				e = window.event || e;    // window.event is for IE
				if (e.stopPropagation)
					e.stopPropagation();  // Standards complient browsers
				else
					e.cancelBubble=true;  // IE
				abstraction.activeState.execute({
					fn: 'posElem',
					pos: 'fixed',
					elem: abstraction.contextElem
				});
				$("#absContextMenu").fadeOut("fast");
			}
			ContextMenu.prototype.editElemSize = function(e) {
				e = window.event || e;    // window.event is for IE
				if (e.stopPropagation)
					e.stopPropagation();  // Standards complient browsers
				else
					e.cancelBubble=true;  // IE
				abstraction.activeState.execute({
					fn: 'resizeElem',
					elem: abstraction.contextElem
				});
				$("#absContextMenu").fadeOut("fast");
			}
			ContextMenu.prototype.editElemText = function(e) {
				e = window.event || e;    // window.event is for IE
				if (e.stopPropagation)
					e.stopPropagation();  // Standards complient browsers
				else
					e.cancelBubble=true;  // IE
				// OPTIMIZE THIS WITH A CALLBACK ARRAY
				if ($(abstraction.contextElem).is("article, aside, b, blockquote, caption, cite, center, dd, div, dl, dt, em, fieldset, figcaption, footer, form, h1, h2, h3, h4, h5, h6, header, i, legend, li, ruby, s, strong, summary, td, th, p, q, section, span, u"))  // Check if the clicked element is a container object
				{
					abstraction.activeState.wysiwygFrame.set(abstraction.contextElem); // Sets the edit frame to the position and dimensions of the clicked element
				}
				$("#absContextMenu").fadeOut("fast");
			}
			ContextMenu.prototype.editElemImage = function(e) {
				e = window.event || e;    // window.event is for IE
				if (e.stopPropagation)
					e.stopPropagation();  // Standards complient browsers
				else
					e.cancelBubble=true;  // IE
				abstraction.activeState.setImage(abstraction.contextElem);
				$("#absContextMenu").fadeOut("fast");
			}
			ContextMenu.prototype.editElemStyles = function(e) {
				e = window.event || e;    // window.event is for IE
				if (e.stopPropagation)
					e.stopPropagation();  // Standards complient browsers
				else
					e.cancelBubble=true;  // IE
				new InlineEditor(abstraction.activeState.file, abstraction.contextElem, 'style', abstraction.taskbar);
				$("#absContextMenu").fadeOut("fast");
			}
			ContextMenu.prototype.editElemAttr = function(e) {
				e = window.event || e;    // window.event is for IE
				if (e.stopPropagation)
					e.stopPropagation();  // Standards complient browsers
				else
					e.cancelBubble=true;  // IE
				new AttributeEditor(abstraction.activeState.file, abstraction.contextElem, abstraction.taskbar);
				$("#absContextMenu").fadeOut("fast");
			}
			ContextMenu.prototype.editElemHTML = function(e) {
				e = window.event || e;    // window.event is for IE
				if (e.stopPropagation)
					e.stopPropagation();  // Standards complient browsers
				else
					e.cancelBubble=true;  // IE
				new InlineEditor(abstraction.activeState.file, abstraction.contextElem, 'html', abstraction.taskbar);
				//abstraction.activeState.editElem(elem, "html");
				$("#absContextMenu").fadeOut("fast");
			}
			ContextMenu.prototype.editDocHTML = function(e) {
				e = window.event || e;    // window.event is for IE
				if (e.stopPropagation)
					e.stopPropagation();  // Standards complient browsers
				else
					e.cancelBubble=true;  // IE
				//new sourceEditor("body", '/'+abstraction.activeState.currentDoc, generateHTML(), taskbar);
				//new SourceEditor(desktop, abstraction.activeState.workingDoc, abstraction.activeState.html('clean'), abstraction.taskbar, '/'+abstraction.activeState.currentDoc);  // writes changes to the working doc
				if (sourceEditors.get(abstraction.activeState.file) == undefined)
					new SourceEditor(abstraction.activeState.file, abstraction.taskbar);
				$("#absContextMenu").fadeOut("fast");
			}
			ContextMenu.prototype.createElemA = function(e) {
				e = window.event || e;    // window.event is for IE
				if (e.stopPropagation)
					e.stopPropagation();  // Standards complient browsers
				else
					e.cancelBubble=true;  // IE
				//abstraction.activeState.createElem("div", elem);
				abstraction.activeState.execute({
					fn: 'createElem',
					elem: 'a',
					parent: abstraction.contextElem
				});
				$("#absContextMenu").fadeOut("fast");
			}
			ContextMenu.prototype.createElemArticle = function(e) {
				e = window.event || e;    // window.event is for IE
				if (e.stopPropagation)
					e.stopPropagation();  // Standards compliant browsers
				else
					e.cancelBubble=true;  // IE
				abstraction.activeState.execute({
					fn: 'createElem',
					elem: 'article',
					parent: abstraction.contextElem
				});
				$("#absContextMenu").fadeOut("fast");
			}
			ContextMenu.prototype.createElemArea = function(e) {
				e = window.event || e;    // window.event is for IE
				if (e.stopPropagation)
					e.stopPropagation();  // Standards compliant browsers
				else
					e.cancelBubble=true;  // IE
				//abstraction.activeState.createElem("div", elem);
				abstraction.activeState.execute({
					fn: 'createElem',
					elem: 'area',
					parent: abstraction.contextElem
				});
				$("#absContextMenu").fadeOut("fast");
			}
			ContextMenu.prototype.createElemAside = function(e) {
				e = window.event || e;    // window.event is for IE
				if (e.stopPropagation)
					e.stopPropagation();  // Standards compliant browsers
				else
					e.cancelBubble=true;  // IE
				abstraction.activeState.execute({
					fn: 'createElem',
					elem: 'aside',
					parent: abstraction.contextElem
				});
				$("#absContextMenu").fadeOut("fast");
			}
			ContextMenu.prototype.createElemAudio = function(e) {
				e = window.event || e;    // window.event is for IE
				if (e.stopPropagation)
					e.stopPropagation();  // Standards compliant browsers
				else
					e.cancelBubble=true;  // IE
				abstraction.activeState.execute({
					fn: 'createElem',
					elem: 'audio',
					parent: abstraction.contextElem
				});
				$("#absContextMenu").fadeOut("fast");
			}
			ContextMenu.prototype.createElemBase = function(e) {
				e = window.event || e;    // window.event is for IE
				if (e.stopPropagation)
					e.stopPropagation();  // Standards compliant browsers
				else
					e.cancelBubble=true;  // IE
				abstraction.activeState.execute({
					fn: 'createElem',
					elem: 'base',
					parent: abstraction.contextElem
				});
				$("#absContextMenu").fadeOut("fast");
			}
			ContextMenu.prototype.createElemCanvas = function(e) {
				e = window.event || e;    // window.event is for IE
				if (e.stopPropagation)
					e.stopPropagation();  // Standards compliant browsers
				else
					e.cancelBubble=true;  // IE
				abstraction.activeState.execute({
					fn: 'createElem',
					elem: 'canvas',
					parent: abstraction.contextElem
				});
				$("#absContextMenu").fadeOut("fast");
			}
			ContextMenu.prototype.createElemCaption = function(e) {
				e = window.event || e;    // window.event is for IE
				if (e.stopPropagation)
					e.stopPropagation();  // Standards compliant browsers
				else
					e.cancelBubble=true;  // IE
				//abstraction.activeState.createElem("div", elem);
				abstraction.activeState.execute({
					fn: 'createElem',
					elem: 'caption',
					parent: abstraction.contextElem
				});
				$("#absContextMenu").fadeOut("fast");
			}
			ContextMenu.prototype.createElemCol = function(e) {
				e = window.event || e;    // window.event is for IE
				if (e.stopPropagation)
					e.stopPropagation();  // Standards compliant browsers
				else
					e.cancelBubble=true;  // IE
				abstraction.activeState.execute({
					fn: 'createElem',
					elem: 'col',
					parent: abstraction.contextElem
				});
				$("#absContextMenu").fadeOut("fast");
			}
			ContextMenu.prototype.createElemCommand = function(e) {
				e = window.event || e;    // window.event is for IE
				if (e.stopPropagation)
					e.stopPropagation();  // Standards complient browsers
				else
					e.cancelBubble=true;  // IE
				abstraction.activeState.execute({
					fn: 'createElem',
					elem: 'command',
					parent: abstraction.contextElem
				});
				$("#absContextMenu").fadeOut("fast");
			}
			ContextMenu.prototype.createElemDD = function(e) {
				e = window.event || e;    // window.event is for IE
				if (e.stopPropagation)
					e.stopPropagation();  // Standards compliant browsers
				else
					e.cancelBubble=true;  // IE
				//abstraction.activeState.createElem("div", elem);
				abstraction.activeState.execute({
					fn: 'createElem',
					elem: 'dd',
					parent: abstraction.contextElem
				});
				$("#absContextMenu").fadeOut("fast");
			}
			ContextMenu.prototype.createElemDetails = function(e) {
				e = window.event || e;    // window.event is for IE
				if (e.stopPropagation)
					e.stopPropagation();  // Standards compliant browsers
				else
					e.cancelBubble=true;  // IE
				abstraction.activeState.execute({
					fn: 'createElem',
					elem: 'details',
					parent: abstraction.contextElem
				});
				$("#absContextMenu").fadeOut("fast");
			}
			ContextMenu.prototype.createElemDiv = function(e) {
				e = window.event || e;    // window.event is for IE
				if (e.stopPropagation)
					e.stopPropagation();  // Standards complient browsers
				else
					e.cancelBubble=true;  // IE
				abstraction.activeState.execute({
					fn: 'createElem',
					elem: 'div',
					parent: abstraction.contextElem
				});
				$("#absContextMenu").fadeOut("fast");
			}
			ContextMenu.prototype.createElemDL = function(e) {
				e = window.event || e;    // window.event is for IE
				if (e.stopPropagation)
					e.stopPropagation();  // Standards complient browsers
				else
					e.cancelBubble=true;  // IE
				//abstraction.activeState.createElem("div", elem);
				abstraction.activeState.execute({
					fn: 'createElem',
					elem: 'dl',
					parent: abstraction.contextElem
				});
				$("#absContextMenu").fadeOut("fast");
			}
			ContextMenu.prototype.createElemDT = function(e) {
				e = window.event || e;    // window.event is for IE
				if (e.stopPropagation)
					e.stopPropagation();  // Standards complient browsers
				else
					e.cancelBubble=true;  // IE
				//abstraction.activeState.createElem("div", elem);
				abstraction.activeState.execute({
					fn: 'createElem',
					elem: 'dt',
					parent: abstraction.contextElem
				});
				$("#absContextMenu").fadeOut("fast");
			}
			ContextMenu.prototype.createElemEmbed = function(e) {
				e = window.event || e;    // window.event is for IE
				if (e.stopPropagation)
					e.stopPropagation();  // Standards complient browsers
				else
					e.cancelBubble=true;  // IE
				abstraction.activeState.execute({
					fn: 'createElem',
					elem: 'embed',
					parent: abstraction.contextElem
				});
				$("#absContextMenu").fadeOut("fast");
			}
			ContextMenu.prototype.createElemFieldset = function(e) {
				e = window.event || e;    // window.event is for IE
				if (e.stopPropagation)
					e.stopPropagation();  // Standards complient browsers
				else
					e.cancelBubble=true;  // IE
				//abstraction.activeState.createElem("div", elem);
				abstraction.activeState.execute({
					fn: 'createElem',
					elem: 'fieldset',
					parent: abstraction.contextElem
				});
				$("#absContextMenu").fadeOut("fast");
			}
			ContextMenu.prototype.createElemFigCaption = function(e) {
				e = window.event || e;    // window.event is for IE
				if (e.stopPropagation)
					e.stopPropagation();  // Standards complient browsers
				else
					e.cancelBubble=true;  // IE
				//abstraction.activeState.createElem("div", elem);
				abstraction.activeState.execute({
					fn: 'createElem',
					elem: 'figcaption',
					parent: abstraction.contextElem
				});
				$("#absContextMenu").fadeOut("fast");
			}
			ContextMenu.prototype.createElemFigure = function(e) {
				e = window.event || e;    // window.event is for IE
				if (e.stopPropagation)
					e.stopPropagation();  // Standards compliant browsers
				else
					e.cancelBubble=true;  // IE
				//abstraction.activeState.createElem("div", elem);
				abstraction.activeState.execute({
					fn: 'createElem',
					elem: 'figure',
					parent: abstraction.contextElem
				});
				$("#absContextMenu").fadeOut("fast");
			}
			ContextMenu.prototype.createElemFooter = function(e) {
				e = window.event || e;    // window.event is for IE
				if (e.stopPropagation)
					e.stopPropagation();  // Standards complient browsers
				else
					e.cancelBubble=true;  // IE
				//abstraction.activeState.createElem("div", elem);
				abstraction.activeState.execute({
					fn: 'createElem',
					elem: 'footer',
					parent: abstraction.contextElem
				});
				$("#absContextMenu").fadeOut("fast");
			}
			ContextMenu.prototype.createElemForm = function(e) {
				e = window.event || e;    // window.event is for IE
				if (e.stopPropagation)
					e.stopPropagation();  // Standards complient browsers
				else
					e.cancelBubble=true;  // IE
				//abstraction.activeState.createElem("div", elem);
				abstraction.activeState.execute({
					fn: 'createElem',
					elem: 'form',
					parent: abstraction.contextElem
				});
				$("#absContextMenu").fadeOut("fast");
			}
			ContextMenu.prototype.createElemH1 = function(e) {
				e = window.event || e;    // window.event is for IE
				if (e.stopPropagation)
					e.stopPropagation();  // Standards complient browsers
				else
					e.cancelBubble=true;  // IE
				//abstraction.activeState.createElem("div", elem);
				abstraction.activeState.execute({
					fn: 'createElem',
					elem: 'h1',
					parent: abstraction.contextElem
				});
				$("#absContextMenu").fadeOut("fast");
			}
			ContextMenu.prototype.createElemH2 = function(e) {
				e = window.event || e;    // window.event is for IE
				if (e.stopPropagation)
					e.stopPropagation();  // Standards complient browsers
				else
					e.cancelBubble=true;  // IE
				//abstraction.activeState.createElem("div", elem);
				abstraction.activeState.execute({
					fn: 'createElem',
					elem: 'h2',
					parent: abstraction.contextElem
				});
				$("#absContextMenu").fadeOut("fast");
			}
			ContextMenu.prototype.createElemH3 = function(e) {
				e = window.event || e;    // window.event is for IE
				if (e.stopPropagation)
					e.stopPropagation();  // Standards complient browsers
				else
					e.cancelBubble=true;  // IE
				//abstraction.activeState.createElem("div", elem);
				abstraction.activeState.execute({
					fn: 'createElem',
					elem: 'h3',
					parent: abstraction.contextElem
				});
				$("#absContextMenu").fadeOut("fast");
			}
			ContextMenu.prototype.createElemH4 = function(e) {
				e = window.event || e;    // window.event is for IE
				if (e.stopPropagation)
					e.stopPropagation();  // Standards complient browsers
				else
					e.cancelBubble=true;  // IE
				//abstraction.activeState.createElem("div", elem);
				abstraction.activeState.execute({
					fn: 'createElem',
					elem: 'h4',
					parent: abstraction.contextElem
				});
				$("#absContextMenu").fadeOut("fast");
			}
			ContextMenu.prototype.createElemH5 = function(e) {
				e = window.event || e;    // window.event is for IE
				if (e.stopPropagation)
					e.stopPropagation();  // Standards complient browsers
				else
					e.cancelBubble=true;  // IE
				//abstraction.activeState.createElem("div", elem);
				abstraction.activeState.execute({
					fn: 'createElem',
					elem: 'h5',
					parent: abstraction.contextElem
				});
				$("#absContextMenu").fadeOut("fast");
			}
			ContextMenu.prototype.createElemH6 = function(e) {
				e = window.event || e;    // window.event is for IE
				if (e.stopPropagation)
					e.stopPropagation();  // Standards complient browsers
				else
					e.cancelBubble=true;  // IE
				//abstraction.activeState.createElem("div", elem);
				abstraction.activeState.execute({
					fn: 'createElem',
					elem: 'h6',
					parent: abstraction.contextElem
				});
				$("#absContextMenu").fadeOut("fast");
			}
			ContextMenu.prototype.createElemHeader = function(e) {
				e = window.event || e;    // window.event is for IE
				if (e.stopPropagation)
					e.stopPropagation();  // Standards complient browsers
				else
					e.cancelBubble=true;  // IE
				//abstraction.activeState.createElem("div", elem);
				abstraction.activeState.execute({
					fn: 'createElem',
					elem: 'header',
					parent: abstraction.contextElem
				});
				$("#absContextMenu").fadeOut("fast");
			}
			ContextMenu.prototype.createElemHgroup = function(e) {
				e = window.event || e;    // window.event is for IE
				if (e.stopPropagation)
					e.stopPropagation();  // Standards complient browsers
				else
					e.cancelBubble=true;  // IE
				//abstraction.activeState.createElem("div", elem);
				abstraction.activeState.execute({
					fn: 'createElem',
					elem: 'hgroup',
					parent: abstraction.contextElem
				});
				$("#absContextMenu").fadeOut("fast");
			}
			ContextMenu.prototype.createElemImg = function(e) {
				e = window.event || e;    // window.event is for IE
				if (e.stopPropagation)
					e.stopPropagation();  // Standards complient browsers
				else
					e.cancelBubble=true;  // IE
				abstraction.activeState.execute({
					fn: 'createElem',
					elem: 'img',
					parent: abstraction.contextElem
				});
				$("#absContextMenu").fadeOut("fast");
			}
			ContextMenu.prototype.createElemInput = function(e) {
				e = window.event || e;    // window.event is for IE
				if (e.stopPropagation)
					e.stopPropagation();  // Standards compliant browsers
				else
					e.cancelBubble=true;  // IE
				abstraction.activeState.execute({
					fn: 'createElem',
					elem: 'input',
					parent: abstraction.contextElem
				});
				$("#absContextMenu").fadeOut("fast");
			}
			ContextMenu.prototype.createElemLabel = function(e) {
				e = window.event || e;    // window.event is for IE
				if (e.stopPropagation)
					e.stopPropagation();  // Standards complient browsers
				else
					e.cancelBubble=true;  // IE
				//abstraction.activeState.createElem("div", elem);
				abstraction.activeState.execute({
					fn: 'createElem',
					elem: 'label',
					parent: abstraction.contextElem
				});
				$("#absContextMenu").fadeOut("fast");
			}
			ContextMenu.prototype.createElemLegend = function(e) {
				e = window.event || e;    // window.event is for IE
				if (e.stopPropagation)
					e.stopPropagation();  // Standards complient browsers
				else
					e.cancelBubble=true;  // IE
				//abstraction.activeState.createElem("div", elem);
				abstraction.activeState.execute({
					fn: 'createElem',
					elem: 'legend',
					parent: abstraction.contextElem
				});
				$("#absContextMenu").fadeOut("fast");
			}
			ContextMenu.prototype.createElemLI = function(e) {
				e = window.event || e;    // window.event is for IE
				if (e.stopPropagation)
					e.stopPropagation();  // Standards complient browsers
				else
					e.cancelBubble=true;  // IE
				abstraction.activeState.execute({
					fn: 'createElem',
					elem: 'li',
					parent: abstraction.contextElem
				});
				$("#absContextMenu").fadeOut("fast");
			}
			ContextMenu.prototype.createElemLink = function(e) {
				e = window.event || e;    // window.event is for IE
				if (e.stopPropagation)
					e.stopPropagation();  // Standards complient browsers
				else
					e.cancelBubble=true;  // IE
				//abstraction.activeState.createElem("div", elem);
				abstraction.activeState.execute({
					fn: 'createElem',
					elem: 'link',
					parent: abstraction.contextElem
				});
				$("#absContextMenu").fadeOut("fast");
			}
			ContextMenu.prototype.createElemMap = function(e) {
				e = window.event || e;    // window.event is for IE
				if (e.stopPropagation)
					e.stopPropagation();  // Standards compliant browsers
				else
					e.cancelBubble=true;  // IE
				//abstraction.activeState.createElem("div", elem);
				abstraction.activeState.execute({
					fn: 'createElem',
					elem: 'map',
					parent: abstraction.contextElem
				});
				$("#absContextMenu").fadeOut("fast");
			}
			ContextMenu.prototype.createElemMenu = function(e) {
				e = window.event || e;    // window.event is for IE
				if (e.stopPropagation)
					e.stopPropagation();  // Standards compliant browsers
				else
					e.cancelBubble=true;  // IE
				//abstraction.activeState.createElem("div", elem);
				abstraction.activeState.execute({
					fn: 'createElem',
					elem: 'menu',
					parent: abstraction.contextElem
				});
				$("#absContextMenu").fadeOut("fast");
			}
			ContextMenu.prototype.createElemNav = function(e) {
				e = window.event || e;    // window.event is for IE
				if (e.stopPropagation)
					e.stopPropagation();  // Standards compliant browsers
				else
					e.cancelBubble=true;  // IE
				//abstraction.activeState.createElem("div", elem);
				abstraction.activeState.execute({
					fn: 'createElem',
					elem: 'nav',
					parent: abstraction.contextElem
				});
				$("#absContextMenu").fadeOut("fast");
			}
			ContextMenu.prototype.createElemNoScript = function(e) {
				e = window.event || e;    // window.event is for IE
				if (e.stopPropagation)
					e.stopPropagation();  // Standards compliant browsers
				else
					e.cancelBubble=true;  // IE
				//abstraction.activeState.createElem("div", elem);
				abstraction.activeState.execute({
					fn: 'createElem',
					elem: 'noscript',
					parent: abstraction.contextElem
				});
				$("#absContextMenu").fadeOut("fast");
			}
			ContextMenu.prototype.createElemObject = function(e) {
				e = window.event || e;    // window.event is for IE
				if (e.stopPropagation)
					e.stopPropagation();  // Standards complient browsers
				else
					e.cancelBubble=true;  // IE
				abstraction.activeState.execute({
					fn: 'createElem',
					elem: 'object',
					parent: abstraction.contextElem
				});
				$("#absContextMenu").fadeOut("fast");
			}
			ContextMenu.prototype.createElemOL = function(e) {
				e = window.event || e;    // window.event is for IE
				if (e.stopPropagation)
					e.stopPropagation();  // Standards complient browsers
				else
					e.cancelBubble=true;  // IE
				abstraction.activeState.execute({
					fn: 'createElem',
					elem: 'ol',
					parent: abstraction.contextElem
				});
				$("#absContextMenu").fadeOut("fast");
			}
			ContextMenu.prototype.createElemP = function(e) {
				e = window.event || e;    // window.event is for IE
				if (e.stopPropagation)
					e.stopPropagation();  // Standards compliant browsers
				else
					e.cancelBubble=true;  // IE
				//abstraction.activeState.createElem("div", elem);
				abstraction.activeState.execute({
					fn: 'createElem',
					elem: 'p',
					parent: abstraction.contextElem
				});
				$("#absContextMenu").fadeOut("fast");
			}
			ContextMenu.prototype.createElemParam = function(e) {
				e = window.event || e;    // window.event is for IE
				if (e.stopPropagation)
					e.stopPropagation();  // Standards complient browsers
				else
					e.cancelBubble=true;  // IE
				abstraction.activeState.execute({
					fn: 'createElem',
					elem: 'param',
					parent: abstraction.contextElem
				});
				$("#absContextMenu").fadeOut("fast");
			}
			ContextMenu.prototype.createElemRP = function(e) {
				e = window.event || e;    // window.event is for IE
				if (e.stopPropagation)
					e.stopPropagation();  // Standards complient browsers
				else
					e.cancelBubble=true;  // IE
				//abstraction.activeState.createElem("div", elem);
				abstraction.activeState.execute({
					fn: 'createElem',
					elem: 'rp',
					parent: abstraction.contextElem
				});
				$("#absContextMenu").fadeOut("fast");
			}
			ContextMenu.prototype.createElemSection = function(e) {
				e = window.event || e;    // window.event is for IE
				if (e.stopPropagation)
					e.stopPropagation();  // Standards compliant browsers
				else
					e.cancelBubble=true;  // IE
				//abstraction.activeState.createElem("div", elem);
				abstraction.activeState.execute({
					fn: 'createElem',
					elem: 'section',
					parent: abstraction.contextElem
				});
				$("#absContextMenu").fadeOut("fast");
			}
			ContextMenu.prototype.createElemSource = function(e) {
				e = window.event || e;    // window.event is for IE
				if (e.stopPropagation)
					e.stopPropagation();  // Standards compliant browsers
				else
					e.cancelBubble=true;  // IE
				//abstraction.activeState.createElem("div", elem);
				abstraction.activeState.execute({
					fn: 'createElem',
					elem: 'source',
					parent: abstraction.contextElem
				});
				$("#absContextMenu").fadeOut("fast");
			}
			ContextMenu.prototype.createElemStyle = function(e) {
				e = window.event || e;    // window.event is for IE
				if (e.stopPropagation)
					e.stopPropagation();  // Standards compliant browsers
				else
					e.cancelBubble=true;  // IE
				//abstraction.activeState.createElem("div", elem);
				abstraction.activeState.execute({
					fn: 'createElem',
					elem: 'style',
					parent: abstraction.contextElem
				});
				$("#absContextMenu").fadeOut("fast");
			}
			ContextMenu.prototype.createElemSummary = function(e) {
				e = window.event || e;    // window.event is for IE
				if (e.stopPropagation)
					e.stopPropagation();  // Standards complient browsers
				else
					e.cancelBubble=true;  // IE
				abstraction.activeState.execute({
					fn: 'createElem',
					elem: 'summary',
					parent: abstraction.contextElem
				});
				$("#absContextMenu").fadeOut("fast");
			}
			ContextMenu.prototype.createElemTable = function(e) {
				e = window.event || e;    // window.event is for IE
				if (e.stopPropagation)
					e.stopPropagation();  // Standards complient browsers
				else
					e.cancelBubble=true;  // IE
				abstraction.activeState.execute({
					fn: 'createElem',
					elem: 'table',
					parent: abstraction.contextElem
				});
				$("#absContextMenu").fadeOut("fast");
			}
			ContextMenu.prototype.createElemTD = function(e) {
				e = window.event || e;    // window.event is for IE
				if (e.stopPropagation)
					e.stopPropagation();  // Standards complient browsers
				else
					e.cancelBubble=true;  // IE
				abstraction.activeState.execute({
					fn: 'createElem',
					elem: 'td',
					parent: abstraction.contextElem
				});
				$("#absContextMenu").fadeOut("fast");
			}
			ContextMenu.prototype.createElemTfoot = function(e) {
				e = window.event || e;    // window.event is for IE
				if (e.stopPropagation)
					e.stopPropagation();  // Standards complient browsers
				else
					e.cancelBubble=true;  // IE
				//abstraction.activeState.createElem("div", elem);
				abstraction.activeState.execute({
					fn: 'createElem',
					elem: 'tfoot',
					parent: abstraction.contextElem
				});
				$("#absContextMenu").fadeOut("fast");
			}
			ContextMenu.prototype.createElemThead = function(e) {
				e = window.event || e;    // window.event is for IE
				if (e.stopPropagation)
					e.stopPropagation();  // Standards complient browsers
				else
					e.cancelBubble=true;  // IE
				abstraction.activeState.execute({
					fn: 'createElem',
					elem: 'th',
					parent: abstraction.contextElem
				});
				$("#absContextMenu").fadeOut("fast");
			}
			ContextMenu.prototype.createElemTrow = function(e) {
				e = window.event || e;    // window.event is for IE
				if (e.stopPropagation)
					e.stopPropagation();  // Standards complient browsers
				else
					e.cancelBubble=true;  // IE
				abstraction.activeState.execute({
					fn: 'createElem',
					elem: 'tr',
					parent: abstraction.contextElem
				});
				$("#absContextMenu").fadeOut("fast");
			}
			ContextMenu.prototype.createElemUL = function(e) {
				e = window.event || e;    // window.event is for IE
				if (e.stopPropagation)
					e.stopPropagation();  // Standards complient browsers
				else
					e.cancelBubble=true;  // IE
				abstraction.activeState.execute({
					fn: 'createElem',
					elem: 'ul',
					parent: abstraction.contextElem
				});
				$("#absContextMenu").fadeOut("fast");
			}
			ContextMenu.prototype.createElemVideo = function(e) {
				e = window.event || e;    // window.event is for IE
				if (e.stopPropagation)
					e.stopPropagation();  // Standards compliant browsers
				else
					e.cancelBubble=true;  // IE
				abstraction.activeState.execute({
					fn: 'createElem',
					elem: 'video',
					parent: abstraction.contextElem
				});
				$("#absContextMenu").fadeOut("fast");
			}
			ContextMenu.prototype.createElemRT = function(e) {
				e = window.event || e;    // window.event is for IE
				if (e.stopPropagation)
					e.stopPropagation();  // Standards complient browsers
				else
					e.cancelBubble=true;  // IE
				//abstraction.activeState.createElem("div", elem);
				abstraction.activeState.execute({
					fn: 'createElem',
					elem: 'rt',
					parent: abstraction.contextElem
				});
				$("#absContextMenu").fadeOut("fast");
			}
			ContextMenu.prototype.deleteElement = function(e) {
				e = window.event || e;    // window.event is for IE
				if (e.stopPropagation)
					e.stopPropagation();  // Standards complient browsers
				else
					e.cancelBubble=true;  // IE
				abstraction.activeState.execute({
					fn: 'deleteElem',
					elem: abstraction.contextElem
				});
				$("#absContextMenu").fadeOut("fast");
			}
			ContextMenu.prototype.createNewCSS = function(e) {
				e = window.event || e;    // window.event is for IE
				if (e.stopPropagation)
					e.stopPropagation();  // Standards complient browsers
				else
					e.cancelBubble=true;  // IE
				// Set the contents of what will appear in the Name File window
				var popupContents = "<form><fieldset style='margin: 10px;'><label for=\"nameStylesheet\">Enter a name for your new Stylesheet:</label><input class=\"text_input\" name=\"nameStylesheet\" id=\"nameStylesheet\" type=\"text\" /><input class=\"button\" id=\"nameStylesheetSubmit\" type=\"submit\" value=\"submit\" /></fieldset></form>";
				new ui.Popup({
					id: "nameFilePopup",
					content: popupContents,
					title: "Name Stylesheet",
					position: "average"
				});
				
				// When the upload form is submitted, submit to the upload iframe to retrieve the image from the server
				//document.getElementById("nameStylesheetSubmit").onclick = createDoc;
				$("#nameFilePopup").find("form")
					.submit(createDoc)
					.find("input")[0]
						.focus();
				
				// Insert the uploaded image into the DOM element
				function createDoc() {
					var newName = document.getElementById("nameStylesheet").value.split(".css", 1);
					newName += ".css";
					var fileref = document.createElement("link");
						fileref.setAttribute("rel", "stylesheet");
						fileref.setAttribute("type", "text/css");
						fileref.setAttribute("href", abstraction.activeState.returnPath+"styles/"+newName);
					var activeDoc = abstraction.activeState.frame.contentWindow.document;
					activeDoc.getElementsByTagName("head")[0].appendChild(fileref);
					abstraction.activeState.add(fileref, abstraction.activeState.elementHash.get(activeDoc.getElementsByTagName("head")[0]));
					abstraction.setFileContents(abstraction.activeState.workingDoc, abstraction.activeState.html(), function(){});
					abstraction.setFileContents("/styles/"+newName, "", function(){}, false);  // empty function is the callback
					abstraction.sourceOutline.update();
					if (sourceEditors.get("/styles/"+newName) == undefined)
						new SourceEditor("/styles/"+newName, abstraction.taskbar);
					$("#nameFilePopup").fadeOut('fast', function() { $(this).empty().remove(); });
					abstraction.fileManager.update();
					return false;
				}
				$("#absContextMenu").fadeOut("fast");
			}
			ContextMenu.prototype.createNewJS = function(e) {
				e = window.event || e;    // window.event is for IE
				if (e.stopPropagation)
					e.stopPropagation();  // Standards complient browsers
				else
					e.cancelBubble=true;  // IE
				// Set the contents of what will appear in the Name File window
				var popupContents = "<form><fieldset style='margin: 10px;'><label for=\"nameStylesheet\">Enter a name for your new Script:</label><input class=\"text_input\" name=\"nameScript\" id=\"nameScript\" type=\"text\" /><input class=\"button\" id=\"nameScriptSubmit\" type=\"submit\" value=\"submit\" /></fieldset></form>";
				new ui.Popup({
					id: "nameFilePopup",
					content: popupContents,
					title: "Name Script",
					position: "average"
				});
				
				// When the upload form is submitted, submit to the upload iframe to retrieve the image from the server
				document.getElementById("nameScriptSubmit").onclick = createDoc;
				$("#nameFilePopup").find("form")
					.submit(createDoc)
					.find("input")[0]
						.focus();
				
				// Insert the uploaded image into the DOM element
				function createDoc() {
					var newName = document.getElementById("nameScript").value.split(".js", 1);
					newName += ".js";
					
					var fileref=document.createElement('script');
					  fileref.setAttribute("type","text/javascript");
					  fileref.setAttribute("src", abstraction.activeState.returnPath+"scripts/"+newName);
					var activeDoc = abstraction.activeState.frame.contentWindow.document;
					activeDoc.getElementsByTagName("head")[0].appendChild(fileref);
					abstraction.activeState.add(fileref, abstraction.activeState.elementHash.get(activeDoc.getElementsByTagName("head")[0]));
					abstraction.setFileContents(abstraction.activeState.workingDoc, abstraction.activeState.html(), function(){});
					abstraction.setFileContents("/scripts/"+newName, "", function(){}, false);  // empty function is the callback
					abstraction.sourceOutline.update();
					if (sourceEditors.get("/scripts/"+newName) == undefined)
						new SourceEditor("/scripts/"+newName, abstraction.taskbar);
					$("#nameFilePopup").fadeOut('fast', function() { $(this).empty().remove(); });
					abstraction.fileManager.update();
					return false;
				}
				$("#absContextMenu").fadeOut("fast");
			}
			ContextMenu.prototype.undoAction = function(e) {
				abstraction.activeState.undo(abstraction.activeState.history.pop());
			}
			ContextMenu.prototype.redoAction = function(e) {
				abstraction.activeState.execute(abstraction.activeState.redoHistory.pop());
			}
			ContextMenu.prototype.parentClick = function(e) {
				e = window.event || e;    // window.event is for IE
				if (e.stopPropagation)
					e.stopPropagation();  // Standards complient browsers
				else
					e.cancelBubble=true;  // IE
				var levels = parseInt($(this).attr("id").replace("lvl", ""));
				var newElem = abstraction.contextElem;
				while (levels > 0)
				{
					newElem = $(newElem).parent().get(0);
					levels--;
				}
				abstraction.contextMenu.element(newElem, abstraction.activeState);
				abstraction.activeState.preview.$selector.fadeOut("fast");
			}
			ContextMenu.prototype.parentMouseover = function(e) {
				var levels = parseInt($(this).attr("id").replace("lvl", ""));
				var newElem = abstraction.contextElem;
				while (levels--)
					newElem = $(newElem).parent().get(0);
				var scrolltop = (navigator.userAgent.indexOf("Firefox")!=-1) ? $(abstraction.activeState.frame.contentWindow.document).find('html,body').scrollTop() : $(abstraction.activeState.frame.contentWindow.document).find('body').scrollTop();
				abstraction.activeState.preview.$selector
					.css("display", "block")
					.dequeue()
					.animate({
						top: $(newElem).offset().top - scrolltop,
						left: $(newElem).offset().left,
						width: $(newElem).outerWidth(),
						height:  $(newElem).outerHeight(),
						opacity: 0.5
					}, "fast");
				newElem = null;
			}
			ContextMenu.prototype.parentWrapperMouseout = function() {
				abstraction.activeState.preview.$selector.fadeOut("fast");
			}
			ContextMenu.prototype.editScript = function(e) {
				e = window.event || e;    // window.event is for IE
				if (e.stopPropagation)
					e.stopPropagation();  // Standards complient browsers
				else
					e.cancelBubble=true;  // IE
				var file = $(this).attr("class"),
					file = file.split(' ')[0],
					noQuery = file.split('?')[0];
				if (sourceEditors.get(noQuery) == undefined)
					new SourceEditor(file, abstraction.taskbar);
				$("#absContextMenu").fadeOut("fast");
			}
			ContextMenu.prototype.editStylesheet = function(e) {
				e = window.event || e;    // window.event is for IE
				if (e.stopPropagation)
					e.stopPropagation();  // Standards complient browsers
				else
					e.cancelBubble=true;  // IE
				var file = $(this).attr("class"),
					file = file.split(' ')[0],
					noQuery = file.split('?')[0];
				if (sourceEditors.get(noQuery) == undefined)
					new SourceEditor(file, abstraction.taskbar);
				$("#absContextMenu").fadeOut("fast");
			}
			ContextMenu.prototype.editInlineScript = function(e) {
				e = window.event || e;    // window.event is for IE
				if (e.stopPropagation)
					e.stopPropagation();  // Standards complient browsers
				else
					e.cancelBubble=true;  // IE
				var level = parseInt($(this).attr("id").replace("lvl", ""));
				var newElem = abstraction.activeState.scriptRefs[level];
				new InlineEditor(desktop, newElem, 'html', $(newElem).html(), taskbar);
				$("#absContextMenu").fadeOut("fast");
			}
			ContextMenu.prototype.editInlineStylesheet = function(e) {
				e = window.event || e;    // window.event is for IE
				if (e.stopPropagation)
					e.stopPropagation();  // Standards complient browsers
				else
					e.cancelBubble=true;  // IE
				var level = parseInt($(this).attr("id").replace("lvl", ""));
				var newElem = abstraction.activeState.scriptRefs[level];
				new InlineEditor(desktop, newElem, 'html', $(newElem).html(), taskbar);
				$("#absContextMenu").fadeOut("fast");
			}
			ContextMenu.prototype.selectScript = function(e) {
				e = window.event || e;    // window.event is for IE
				if (e.stopPropagation)
					e.stopPropagation();  // Standards complient browsers
				else
					e.cancelBubble=true;  // IE
				var level = parseInt($(this).attr("id").replace("lvl", ""));
				var newElem = abstraction.activeState.scriptRefs[level];
				//$("#absHTMLEditor").fadeIn("fast");
				//$("#absHTMLTextarea").val($(newElem).html());
				//$("#absHTMLTextarea").unbind("keyup");
				//$("#absHTMLTextarea").bind("keyup", function()
				//{
				//	$(newElem).html($("#absHTMLTextarea").val());
				//});
				$("#absContextMenu").fadeOut("fast");
			}
			ContextMenu.prototype.setTooltip = function() {
				$("#absTooltip").remove();
				if ($(this).attr("alt") !== undefined) {
					var tooltip = $("<div/>")
						.attr({
							id: 'absTooltip',
							style: 'position: absolute; top: -1px;',
						})
						.html($(this).attr("alt"))
						.appendTo(this);
					if ($(this).find(".absSubmenu").length == 0) {
						if ($("#absContextMenu").offset().left > $window.width()*0.85) {  // If the menu is close to the right edge of the screen...
							//alert(tooltip.width());
							var curLeft = -20-tooltip.width();
						} else {
							var curLeft = $(this).parent().width()+10;
						}
					} else {
						if ($("#absContextMenu").offset().left > $window.width()*0.9) {  // If the menu is close to the right edge of the screen...
							var curLeft = -$(this).find("div").width()-tooltip.width()-21;
						} else {
							var curLeft = $(this).find("div").width()+$(this).parent().width()+11;	
						}
					}
					tooltip.css("left", curLeft);
					//$(this).append("<div id='absTooltip' style='position: absolute; top: -1px; left: "+curLeft+"px;'>"+$(this).attr("alt")+"</div>");
				}
			}
			ContextMenu.prototype.newFile = function() {
				// Set the contents of what will appear in the Name File window
				var popupContents = "<form><fieldset style=\"margin: 10px;\"><label for=\"nameFile\">Enter a name for your new file:</label><input class=\"text_input\" name=\"nameFile\" id=\"nameFile\" type=\"text\" /><select id=\"fileExtensionSelect\"><option value=\"css\">.css</option><option value=\"html\">.html</option><option value=\"js\">.js</option><option value=\"pl\">.pl</option><option value=\"php\">.php</option><option value=\"txt\">.txt</option><option value=\"xml\">.xml</option></select><input class=\"button\" id=\"nameFileSubmit\" type=\"submit\" value=\"submit\" /></fieldset></form>";
				new ui.Popup({
					id: "nameFilePopup",
					content: popupContents,
					title: "Name Document",
					position: "average"
				});
				
				// When the upload form is submitted, submit to the upload iframe to retrieve the image from the server
				//document.getElementById("nameFileSubmit").onclick = createDoc;
				$("#nameFilePopup").find("form")
					.submit(createDoc)
					.find("input")[0]
						.focus();
				document.getElementById("nameFile").onkeyup = checkExt;
				
				// Insert the uploaded image into the DOM element
				function createDoc() {
					abstraction.fileManager.$handle.find('.open-menu').css('background', 'transparent url(abstraction/core/styles/images/ajax-loader.gif) no-repeat center');
					var newName = document.getElementById("nameFile").value,
						newNameArr = newName.split("."),
						newExt;
					if (newNameArr.length == 1) {
						newExt = document.getElementById("fileExtensionSelect").value;
						newName = newNameArr[0]+'.'+newExt;
					} else
						newExt = newNameArr[0];
					switch (newExt.toLowerCase()) {
						case "html":
						case "htm":
							var content = '<!DOCTYPE html>\n<html lang="en">\n\t<head>\n\t\t<meta charset="utf-8">\n\t\t<title>title</title>\n\t</head>\n\t<body>\n\t</body>\n</html>';
							break;
						default:
							var content = "";
							break;
					}
					var targetDir = (abstraction.contextFile == '/' || abstraction.contextFile == '') ? '/' :abstraction.contextFile+"/";
					var tempDir = abstraction.contextFile.split(".");
					if (tempDir.length > 1) {
						tempDir = tempDir[0].split("/");
						targetDir = "";
						var target = tempDir.length-1;
						var i = 0;
						while (i < target) {
							targetDir += tempDir[i]+"/";
							i++;
						}
					}
					abstraction.setFileContents(targetDir+newName, content, function(data) {
						if (data !== false) {
							var fileType = getFileType(targetDir+newName, 'file'),
								isHTML = (fileType == 'html' || fileType == 'htm' || fileType == 'php') ? true : false,
								parentChildWrapper = (targetDir == '/') ? $("#absFileManagerWrapper") : $(document.getElementById(targetDir.slice(0, -1))).next();
							if (isHTML && documentPreviews.get(targetDir+newName) == undefined)
								new DocumentPreview(targetDir+newName, abstraction.taskbar);
							if (sourceEditors.get(targetDir+newName) == undefined)
								new SourceEditor(targetDir+newName, abstraction.taskbar);
							if (data != 'exists' && parentChildWrapper.css('display') != 'none')
								abstraction.fileManager.generateFileItem(targetDir, newName, 'file', parentChildWrapper);
							abstraction.fileManager.$handle.find('.open-menu').css('background', '');
						}
					}, false);

					$("#nameFilePopup").fadeOut('fast', function() { $(this).empty().remove(); });
					//abstraction.fileManager.update();
					return false;
				}
				function checkExt() {
					var newName = document.getElementById("nameFile").value;
					newNameArr = newName.split(".");
					if (newNameArr.length > 1)
						document.getElementById("fileExtensionSelect").disabled = "disabled";
					else
						document.getElementById("fileExtensionSelect").disabled = undefined;
				}
			}
			ContextMenu.prototype.newDirectory = function() {
				// Set the contents of what will appear in the Name File window
				var popupContents = "<form><fieldset style=\"margin: 10px;\"><label for=\"nameDir\">Enter a name for your new directory:</label><input class=\"text_input\" name=\"nameDir\" id=\"nameDir\" type=\"text\" /><input class=\"button\" id=\"nameDirSubmit\" type=\"submit\" value=\"submit\" /></fieldset></form>";
				new ui.Popup({
					id: "nameFilePopup",
					content: popupContents,
					title: "Name Directory",
					position: "average"
				});
				// When the upload form is submitted, submit to the upload iframe to retrieve the image from the server
				//document.getElementById("nameDirSubmit").onclick = createDirectory;
				$("#nameFilePopup").find("form")
					.submit(createDirectory)
					.find("input")[0]
						.focus();
				
				function createDirectory() {
					abstraction.fileManager.$handle.find('.open-menu').css('background', 'transparent url(abstraction/core/styles/images/ajax-loader.gif) no-repeat center');
					var newName = document.getElementById("nameDir").value;
					var targetDir = (abstraction.contextFile == '/' || abstraction.contextFile == '') ? '/' :abstraction.contextFile+"/";
					var tempDir = abstraction.contextFile.split(".");
					if (tempDir.length > 1) {
						tempDir = tempDir[0].split("/");
						targetDir = "";
						var target = tempDir.length-1;
						var i = 0;
						while (i < target) {
							targetDir += tempDir[i]+"/";
							i++;
						}
					}
					abstraction.createDir(targetDir+newName, function(data) {
						//abstraction.fileManager.update();
						parentChildWrapper = (targetDir == '/') ? $("#absFileManagerWrapper") : $(document.getElementById(targetDir.slice(0, -1))).next();
						if (data !== false && parentChildWrapper.css('display') != 'none')
							abstraction.fileManager.generateFileItem(targetDir, newName, 'dir', parentChildWrapper);
						abstraction.fileManager.$handle.find('.open-menu').css('background', '');
					});
					$("#nameFilePopup").fadeOut('fast', function() { $(this).empty().remove(); });
					return false;
				}
			}
			ContextMenu.prototype.uploadFile = function() {
				if ($("#uploadFilePopup").length == 0) {
					var targetDir = (abstraction.contextFile == '/' || abstraction.contextFile == '') ? '/' :abstraction.contextFile+"/";
					var tempDir = abstraction.contextFile.split(".");
					if (tempDir.length > 1) {
						tempDir = tempDir[0].split("/");
						targetDir = "";
						var target = tempDir.length-1;
						var i = 0;
						while (i < target) {
							targetDir += tempDir[i]+"/";
							i++;
						}
					}
					// Set the contents of what will appear in the popup
					var popupContents = "<form id=\"image_upload_form\" method=\"post\" enctype=\"multipart/form-data\" style=\"margin: 10px; margin-bottom: 0px;\" action=\"abstraction/core/scripts/php/upload.php?path="+targetDir+"\"><fieldset><label for=\"upload_image\">Select File to Upload:</label><br /><input class=\"text_input\" name=\"upload_image\" id=\"upload_image\" type=\"file\" /><input class=\"button\" name=\"insert_image_submit\" type=\"submit\" value=\"submit\" /></fieldset><iframe id=\"upload_iframe\" name=\"upload_iframe\" src=\"\" style=\"width: 100%; height: 100px; border: 0px solid #fff; margin: 0;\"></iframe></form>";
					
					// Use the createPopup method to display a window where the user may select an image from their HD
					new ui.Popup({
						id: "uploadFilePopup",
						content: popupContents,
						title: "Select a File",
						position: "average"
					});
					
					// When the upload form is submitted, submit to the upload iframe to retrieve the image from the server
					document.getElementById("image_upload_form").onsubmit = function() {
						abstraction.fileManager.$handle.find('.open-menu').css('background', 'transparent url(abstraction/core/styles/images/ajax-loader.gif) no-repeat center');
						document.getElementById("image_upload_form").target = "upload_iframe";
						document.getElementById("upload_iframe").onload = insertUploadedFile;	
					}
					
					// Insert the uploaded image into the DOM element
					function insertUploadedFile() {
						//abstraction.fileManager.update();
						parentChildWrapper = (targetDir == '/') ? $("#absFileManagerWrapper") : $(document.getElementById(targetDir.slice(0, -1)+':'+abstraction.contextFiletype)).next(),
							file = document.getElementById("upload_iframe").contentWindow.document.body.innerHTML,
							newName = file.split('/');
						newName = newName[newName.length-1];
						if (file != 'false' && parentChildWrapper.css('display') != 'none')
							abstraction.fileManager.generateFileItem(targetDir.slice(1), newName, 'file', parentChildWrapper);
						abstraction.fileManager.$handle.find('.open-menu').css('background', '');
						$("#uploadFilePopup").fadeOut('fast', function() { $(this).empty().remove(); });
					}
				}
			}
			ContextMenu.prototype.editFile = function(e) {
				e = window.event || e;    // window.event is for IE
				if (e.stopPropagation)
					e.stopPropagation();  // Standards complient browsers
				else
					e.cancelBubble=true;  // IE
				var noQuery = abstraction.contextFile.split('?')[0],
					fileType = getFileType(noQuery, abstraction.contextFiletype),
					isHTML = (fileType == 'html' || fileType == 'htm' || fileType == 'php') ? true : false;
				if (isHTML && documentPreviews.get(noQuery) == undefined)
					new DocumentPreview(abstraction.contextFile, abstraction.taskbar);
				if (sourceEditors.get(noQuery) == undefined)
					new SourceEditor(abstraction.contextFile, abstraction.taskbar);
				$("#absContextMenu").fadeOut("fast");
			}
			ContextMenu.prototype.copyFile = function(e) {
				e = window.event || e;    // window.event is for IE
				if (e.stopPropagation)
					e.stopPropagation();  // Standards complient browsers
				else
					e.cancelBubble=true;  // IE
				abstraction.fileManager.clipboard.push(abstraction.contextFile+':'+abstraction.contextFiletype);
				$("#absContextMenu").fadeOut("fast");
			}
			ContextMenu.prototype.copyFiles = function(e) {
				e = window.event || e;    // window.event is for IE
				if (e.stopPropagation)
					e.stopPropagation();  // Standards complient browsers
				else
					e.cancelBubble=true;  // IE
				var i = abstraction.fileManager.selection.length;
				while (i--) {
					abstraction.fileManager.clipboard.push(abstraction.fileManager.selection[i]);
				}
				abstraction.fileManager.selection = [];
				$("#absContextMenu").fadeOut("fast");
			}
			ContextMenu.prototype.pasteFile = function(e) {
				e = window.event || e;    // window.event is for IE
				if (e.stopPropagation)
					e.stopPropagation();  // Standards complient browsers
				else
					e.cancelBubble=true;  // IE
				abstraction.fileManager.$handle.find('.open-menu').css('background', 'transparent url(abstraction/core/styles/images/ajax-loader.gif) no-repeat center');
				var targetDir = abstraction.contextFile+"/";
				var tempDir = abstraction.contextFile.split(".");
				if (tempDir.length > 1) {
					tempDir = tempDir[0].split("/");
					targetDir = "";
					var target = tempDir.length-1;
					var i = 0;
					while (i < target) {
						targetDir += tempDir[i]+"/";
						i++;
					}
				}
				var newName = abstraction.fileManager.clipboard[$(this).attr("id").substr(3)].slice(1).split(':'),
					filetype = newName[1];
				newName = newName[0];
				abstraction.copyFile(abstraction.fileManager.clipboard[$(this).attr("id").substr(3)].split(':')[0], targetDir, function(data) {
					//abstraction.fileManager.update();
					var parentChildWrapper = $(document.getElementById(targetDir.slice(0, -1)+':'+abstraction.contextFiletype)).next();
					if (data !== false && parentChildWrapper.css('display') != 'none')
						abstraction.fileManager.generateFileItem(targetDir, newName, filetype, parentChildWrapper);
					abstraction.fileManager.$handle.find('.open-menu').css('background', '');
				})
				$("#absContextMenu").fadeOut("fast");
			}
			ContextMenu.prototype.pasteFiles = function(e) {
				e = window.event || e;    // window.event is for IE
				if (e.stopPropagation)
					e.stopPropagation();  // Standards complient browsers
				else
					e.cancelBubble=true;  // IE
				abstraction.fileManager.$handle.find('.open-menu').css('background', 'transparent url(abstraction/core/styles/images/ajax-loader.gif) no-repeat center');
				var i = abstraction.fileManager.selection.length,
					callback = function() {},
					newName = abstraction.fileManager.clipboard[$(this).attr("id").substr(3)].slice(1).split(':'),
					filetype = newName[1];
				newName = newName[0];
				while (i--) {
					var targetDir = abstraction.fileManager.selection[i].split(':')[0]+"/";
					var tempDir = abstraction.fileManager.selection[i].split(':')[0].split(".");
					if (!i)
						callback = function(data) {
							//abstraction.fileManager.update();
							abstraction.fileManager.$handle.find('.open-menu').css('background', '');
							abstraction.fileManager.$wrapper.find('.abs-fileManager-selectedFile').removeClass('abs-fileManager-selectedFile');
							abstraction.fileManager.selection = [];
						}
					if (tempDir.length = 1) {
						var parentChildWrapper = $(document.getElementById(targetDir.slice(0, -1)+':'+abstraction.contextFiletype)).next();
						if (parentChildWrapper.css('display') != 'none')
							abstraction.fileManager.generateFileItem(targetDir, newName, filetype, parentChildWrapper);
						abstraction.copyFile(abstraction.fileManager.clipboard[$(this).attr("id").substr(3)].split(':')[0], targetDir, callback);
					}
				}
				$("#absContextMenu").fadeOut("fast");
			}
			ContextMenu.prototype.renameFile = function(e) {
				e = window.event || e;    // window.event is for IE
				if (e.stopPropagation)
					e.stopPropagation();  // Standards complient browsers
				else
					e.cancelBubble=true;  // IE
				abstraction.fileManager.$handle.find('.open-menu').css('background', 'transparent url(abstraction/core/styles/images/ajax-loader.gif) no-repeat center');
				abstraction.renameFile(abstraction.contextFile, function(data, newName, newPath) {
					//abstraction.fileManager.update();
					var fileItem = $(document.getElementById(abstraction.contextFile));
					fileItem.contents().last().wrap("<span />").parent().text(newName).contents().unwrap();
					fileItem.attr('id', newPath+newName);
					abstraction.fileManager.$handle.find('.open-menu').css('background', '');
				});
				$("#absContextMenu").fadeOut("fast");
			}
			ContextMenu.prototype.deleteFile = function(e) {
				e = window.event || e;    // window.event is for IE
				if (e.stopPropagation)
					e.stopPropagation();  // Standards complient browsers
				else
					e.cancelBubble=true;  // IE
				abstraction.fileManager.$handle.find('.open-menu').css('background', 'transparent url(abstraction/core/styles/images/ajax-loader.gif) no-repeat center');
				abstraction.deleteFile(abstraction.contextFile, function(data) {
					//abstraction.fileManager.update();
					var fileItem = $(document.getElementById(abstraction.contextFile+':'+abstraction.contextFiletype));
					if (data !== false) {
						fileItem.next('.abs-child-wrapper').empty().remove();
						fileItem.empty().remove();
						if (documentStates.get(abstraction.contextFile))
							documentStates.get(abstraction.contextFile).destroy();
					}
					abstraction.fileManager.$handle.find('.open-menu').css('background', '');
				});
				$("#absContextMenu").fadeOut("fast");
			}
			ContextMenu.prototype.deleteFiles = function(e) {
				e = window.event || e;    // window.event is for IE
				if (e.stopPropagation)
					e.stopPropagation();  // Standards complient browsers
				else
					e.cancelBubble=true;  // IE
				var i = abstraction.fileManager.selection.length,
					callback = function() {};
				while (i--) {
					abstraction.fileManager.$handle.find('.open-menu').css('background', 'transparent url(abstraction/core/styles/images/ajax-loader.gif) no-repeat center');
					if (!i)
						callback = function(data) {
							//abstraction.fileManager.update();
							abstraction.fileManager.$handle.find('.open-menu').css('background', '');
							abstraction.fileManager.selection = [];
						}
					abstraction.deleteFile(abstraction.fileManager.selection[i], callback);
					var fileItem = $(document.getElementById(abstraction.fileManager.selection[i]));
					fileItem.next('.abs-child-wrapper').empty().remove();
					fileItem.empty().remove();
					if (documentStates.get(abstraction.fileManager.selection[i]))
						documentStates.get(abstraction.fileManager.selection[i]).destroy();
				}
				$("#absContextMenu").fadeOut("fast");
			}
			ContextMenu.prototype.loadFileDirectory = function(e) {
				var newDir = abstraction.contextFile;
				if (abstraction.fileManager.directories[newDir])
					abstraction.fileManager.dblclickLoadedDirectory(document.getElementById(abstraction.contextFile+':'+abstraction.contextFiletype));
				else
					abstraction.fileManager.dblclickDirectory(document.getElementById(abstraction.contextFile+':'+abstraction.contextFiletype));
				$("#absContextMenu").fadeOut("fast");
			}
			ContextMenu.prototype.loadRevisionDirectory = function(e) {
				var newDir = abstraction.contextRevision;
				if (abstraction.revisionManager.directories[newDir])
					abstraction.revisionManager.dblclickLoadedDirectory(document.getElementById(abstraction.contextRevision));
				else
					abstraction.revisionManager.dblclickDirectory(document.getElementById(abstraction.contextRevision));
				$("#absContextMenu").fadeOut("fast");
			}
			ContextMenu.prototype.createRevision = function(e) {
				abstraction.revisionManager.$handle.find('.open-menu').css('background', 'transparent url(abstraction/core/styles/images/ajax-loader.gif) no-repeat center');
				if (abstraction.contextRevision == 'none' || abstraction.contextRevision == undefined)
					abstraction.activeState.save();
				else {
					var content = abstraction.activeState.html(),
						targetDir = abstraction.contextRevision+"/",
						tempDir = targetDir.split(".");
					if (tempDir.length > 1) {
						tempDir = tempDir[0].split("/");
						var target = tempDir.length-1,
							i = 0;
						targetDir = "";
						while (i < target) {
							targetDir += tempDir[i]+"/";
							i++;
						}
					}
					abstraction.setFileContents(abstraction.activeState.file, content, function() {
						abstraction.activeState.saved = true;
						abstraction.activeState.saveRevision(abstraction.activeState.file, content, targetDir);
					});
				}
				$("#absContextMenu").fadeOut("fast");
			}
			ContextMenu.prototype.createRevDir = function(e) {
				// Set the contents of what will appear in the Name File window
				var popupContents = "<form><fieldset style=\"margin: 10px;\"><label for=\"nameRevDir\">Enter a name for your new directory:</label><input class=\"text_input\" name=\"nameRevDir\" id=\"nameRevDir\" type=\"text\" /><input class=\"button\" id=\"nameRevDirSubmit\" type=\"submit\" value=\"submit\" /></fieldset></form>";
				new ui.Popup({
					id: "nameRevisionPopup",
					content: popupContents,
					title: "Name Directory",
					position: "average"
				});

				// When the upload form is submitted, submit to the upload iframe to retrieve the image from the server
				//document.getElementById("nameRevDirSubmit").onclick = createDirectory;
				$("#nameRevisionPopup").children("form")
					.submit(function() {
						abstraction.revisionManager.$handle.find('.open-menu').css('background', 'transparent url(abstraction/core/styles/images/ajax-loader.gif) no-repeat center');
						var targetDir = "/",
							newName = document.getElementById("nameRevDir").value;
						if (abstraction.contextRevision != 'none') {
							targetDir = abstraction.contextRevision+"/";
							var tempDir = targetDir.split(".");
							if (tempDir.length > 1) {
								tempDir = tempDir[0].split("/");
								var target = tempDir.length-1,
									i = 0;
								targetDir = "";
								while (i < target) {
									targetDir += tempDir[i]+"/";
									i++;
								}
							}
						}
						abstraction.createRevDir(newName, abstraction.activeState.currentDoc.replace(/-/gi, '-!@h@!-').replace(/\//gi, '-!@s@!-').replace(/\./gi, '-!@p@!-')+targetDir, function() { abstraction.revisionManager.update(); });
						$("#nameRevisionPopup").fadeOut('fast', function() { $(this).empty().remove(); });
						return false;
					})
					.find("input")[0]
						.focus();
				
				$("#absContextMenu").fadeOut("fast");
			}
			ContextMenu.prototype.renameDirectory = function(e) {
				e = window.event || e;    // window.event is for IE
				if (e.stopPropagation)
					e.stopPropagation();  // Standards complient browsers
				else
					e.cancelBubble=true;  // IE
				abstraction.revisionManager.$handle.find('.open-menu').css('background', 'transparent url(abstraction/core/styles/images/ajax-loader.gif) no-repeat center');
				abstraction.renameRevDir('/backups/'+abstraction.activeState.currentDoc.replace(/-/gi, '-!@h@!-').replace(/\//gi, '-!@s@!-').replace(/\./gi, '-!@p@!-')+abstraction.contextRevision, function() { abstraction.revisionManager.update(); });
				$("#absContextMenu").fadeOut("fast");
			}
			ContextMenu.prototype.loadRevision = function(e) {
				var curState = abstraction.activeState;
				curState.editor.$handle.find('.open-menu').css('background', 'transparent url(abstraction/core/styles/images/ajax-loader.gif) no-repeat center');
				abstraction.getFileContents('/backups/'+abstraction.activeState.currentDoc.replace(/-/gi, '-!@h@!-').replace(/\//gi, '-!@s@!-').replace(/\./gi, '-!@p@!-')+abstraction.contextRevision, function(data) {
					abstraction.setFileContents(encodeURIComponent(abstraction.activeState.workingDoc), data, function() {
						curState.getServerSideScripts(data);  // Finds any server side scripts (only PhP atm) in the html and adds some new variables
						curState.getDoctype(data);			   // Finds and stores the doctype of the document
						curState.source = data;
						curState.update(function() {
							if (curState.editor)
								curState.editor.update();
							curState.editor.$handle.find('.open-menu').css('background', '');
							curState = null;
						});
					});
				});
				$("#absContextMenu").fadeOut("fast");
			}
			ContextMenu.prototype.renameRevision = function(e) {
				e = window.event || e;    // window.event is for IE
				if (e.stopPropagation)
					e.stopPropagation();  // Standards complient browsers
				else
					e.cancelBubble=true;  // IE
				abstraction.revisionManager.$handle.find('.open-menu').css('background', 'transparent url(abstraction/core/styles/images/ajax-loader.gif) no-repeat center');
				abstraction.renameRevision('/backups/'+abstraction.activeState.currentDoc.replace(/-/gi, '-!@h@!-').replace(/\//gi, '-!@s@!-').replace(/\./gi, '-!@p@!-')+abstraction.contextRevision, function() { abstraction.revisionManager.update(); });
				$("#absContextMenu").fadeOut("fast");
			}
			ContextMenu.prototype.deleteRevision = function(e) {
				e = window.event || e;    // window.event is for IE
				if (e.stopPropagation)
					e.stopPropagation();  // Standards complient browsers
				else
					e.cancelBubble=true;  // IE
				abstraction.revisionManager.$handle.find('.open-menu').css('background', 'transparent url(abstraction/core/styles/images/ajax-loader.gif) no-repeat center');
				abstraction.deleteFile('/desktop/backups/'+abstraction.activeState.currentDoc.replace(/-/gi, '-!@h@!-').replace(/\//gi, '-!@s@!-').replace(/\./gi, '-!@p@!-')+abstraction.contextRevision, function() { abstraction.revisionManager.update(); });
				$("#absContextMenu").fadeOut("fast");
			}
			ContextMenu.prototype.deleteRevisions = function(e) {
				e = window.event || e;    // window.event is for IE
				if (e.stopPropagation)
					e.stopPropagation();  // Standards complient browsers
				else
					e.cancelBubble=true;  // IE
				//abstraction.revisionManager.$handle.find('.open-menu').css('background', 'transparent url(abstraction/core/styles/images/ajax-loader.gif) no-repeat center');
				//abstraction.deleteFile('/backups/'+abstraction.activeState.currentDoc.replace(/-/gi, '-!@h@!-').replace(/\//gi, '-!@s@!-').replace(/\./gi, '-!@p@!-')+abstraction.contextRevision, function() { abstraction.revisionManager.update(); });
				
				var i = abstraction.revisionManager.selection.length,
					callback = function() {};
				while (i--) {
					abstraction.revisionManager.$handle.find('.open-menu').css('background', 'transparent url(abstraction/core/styles/images/ajax-loader.gif) no-repeat center');
					if (!i)
						callback = function() {
							abstraction.revisionManager.update();
							abstraction.revisionManager.selection = [];
						}
					abstraction.deleteFile('/desktop/backups/'+abstraction.activeState.currentDoc.replace(/-/gi, '-!@h@!-').replace(/\//gi, '-!@s@!-').replace(/\./gi, '-!@p@!-')+abstraction.revisionManager.selection[i], callback);
				}
				$("#absContextMenu").fadeOut("fast");
			}
			// CONTEXT MENU GENERATOR FUNCTIONS
			ContextMenu.prototype.database = function(name, type) {
				var contextMenu = this,
					menu = '',
					cases = {};
				cases["sqlHost"] = function() {
					menu += 'sqlhost';
				}				
				cases["database"] = function() {
					menu += 'database';
				}
				cases["table"] = function() {
					menu += 'table';
				}
				cases["column"] = function() {
					menu += 'column';
				}
				cases["field"] = function() {
					menu += 'field';
				}
				cases["none"] = function() {
					menu += 'none';
				}					
				if (typeof cases[type] == 'function') {
					cases[type]();
					cases = {};  // Clear up memory to prevent leak
				} else {
					cases = {};  // Clear up memory to prevent leak
					return false;
				}
			
				// Add menu contents to the DOM and create the submenus
				contextMenu.$.empty().html(menu);  // empty method removes event handlers to avoid memory leaks
				contextMenu.$.find("div").hover(contextMenu.submenuMouseover, contextMenu.submenuMouseout);
				
				// Set the onclick events for the various context menu options
				$("#absTableSomethingWonk")		.bind('click', contextMenu.adminToggle);
				$("#absContextMenu div:not(.absSubmenu)").bind('mouseenter', contextMenu.setTooltip);
				
				return true;
			}
			ContextMenu.prototype.element = function(elem, state) {
				var contextMenu = this,
					menu = '';
				if ($(elem).is("html")) elem = state.frame.contentWindow.document.body; // if html element clicked, return body content menu
				abstraction.activeState = state;
				abstraction.contextElem = elem;
				contextMenu.target = state;
				var parents = "",
					paste = '<div style="color: gray;" alt="There are no elements in your clipboard"><span class="abs-menu-paste"></span>Paste</div>',
					undo = '<div style="color: gray;" alt="There are no actions to undo"><span class="abs-menu-undo"></span>Undo</div>',
					redo = '<div style="color: gray;" alt="There are no actions to redo"><span class="abs-menu-redo"></span>Redo</div>',
					admin = ($(elem).hasClass("abs-administrable-element")) ? '<div alt="Turn off administration for this element" id="absToggleAdmin"><span class="abs-menu-adminOff"></span>Admin</div>' : '<div alt="Turn on administration for this element" id="absToggleAdmin"><span class="abs-menu-adminOn"></span>Admin</div>',
					revisions = "",
					cases = {},
					level = 0;
					
				var deleteList = '<div><span class="abs-menu-delete"></span>Delete<div class="absSubmenu"><div id="absDelete" alt="Delete this item?" style="color:pink">Confirm</div></div></div>';
				var saveList = '<div id="absSaveDoc" alt="Save this document?"><span class="abs-menu-save"></span>Save<div class="absSubmenu"><div style="color:#90EE90">Confirm</div></div></div>';
				var flowContentList = '<div id="absCreateDiv" alt="Add a Division">Container<div class="absSubmenu"><div id="absCreateArticle" alt="Add an Article tag* - HTML5">Article</div><div id="absCreateAside" alt="Add an Aside tag* - HTML5">Aside</div><div id="absCreateCanvas" alt="Add a Canvas tag* - HTML5">Canvas</div><div id="absCreateDeta" alt="Add a Details tag* - HTML5">Details</div><div id="absCreateDiv" alt="Add a Division">DIV</div><div id="absCreateFooter" alt="Add a Footer* - HTML5">Footer</div><div id="absCreateHeader" alt="Add a Header* - HTML5">Header</div><div id="absCreateNav" alt="Add Navigation links* - HTML5">Nav</div><div id="absCreateSection" alt="Add a Section* - HTML5">Section</div></div></div><hr />';
				
				var editAttrHTML = '<div id="absElemAttr" alt="Edit the tag\'s attributes">Attributes</div><div id="absEditInnerHTML" alt="Edit the tag\'s inner html">Html</div>';
				
				var editStylesEvents = '<div id="absEditStyles" alt="Edit the tag\'s inline style">Styles</div><hr /><div id="absEditEvents" alt="Edit the tag\'s events">Events</div>';
				
				var listTypeList = '<div alt="Create a list">List<div class="absSubmenu"><div id="absCreateMenu" alt="Add Menu List* - HTML4+">Menu</div><div id="absCreateDL" alt="Add a Definition List">Definition List</div><div id="absCreateOL" alt="Add an ordered list">Ordered</div><div id="absCreateUL" alt="Add an unordered list">Unordered</div></div></div>';
				
				var mediaList = '<div id="absCreateImg" alt="Add an image">Image</div><div>Media<div class="absSubmenu"><div id="absCreateAudio" alt="Add a HTML Audio player* - HTML5">Audio</div><div id="absCreateFigure" alt="Add a Figure* - HTML5">Figure</div><div id="absCreateObject" alt="Embed a Flash Video or Javascript Object">Embed</div><div id="absCreateVideo" alt="Add a HTML Video player* - HTML5">Video</div></div></div>';
				
				var positionList = '<div alt="Edit the tag\'s position">Position<div class="absSubmenu"><div id="absPosRel" alt="Relative to its normal position">Relative</div><div id="absPosAbs" alt="Relative to its ancestor">Absolute</div><div id="absPosFix" alt="Relative to the browser window">Fixed</div></div></div>';
				
				var stylesTextEvents = '<div id="absEditStyles" alt="Edit the tag\'s inline style">Styles</div><hr /><div id="absEditEvents" alt="Edit the tag\'s events">Events</div>';
				
				var textContentList = '<div id="absCreateHgroup" alt="Add a Header Group">Hgroup</div><div id="absCreateP" alt="Add a paragraph">Paragraph</div>';
				
				var textHeaderList = '<div>Text Header<div class="absSubmenu"><div id="absCreateH1" alt="Add a h1">H1</div><div id="absCreateH2" alt="Add a h2">H2</div><div id="absCreateH3" alt="Add a h3">H3</div><div id="absCreateH4" alt="Add a h4">H4</div><div id="absCreateH5" alt="Add a h5">H5</div><div id="absCreateH6" alt="Add a h6">H6</div></div></div>';
				
				if (state.clipboard.length >= 1) {
					paste = '<div><span class="abs-menu-paste"></span>Paste<div class="absSubmenu">';
					for (var i in state.clipboard) {
						paste += '<div class="absElemPaste" id="lvl'+i+'" alt="Copy '+state.clipboard[i].nodeName+' to this element">'+state.clipboard[i].nodeName+'</div>';
					}
					paste += '<div id="absClipboardClear" alt="Clear the clipboard">Clear</div></div></div>';
				}
				
				if (state.history.length >= 1) {
					undo = '<div id="absUndoAct"><span class="abs-menu-undo"></span>Undo</div>';
				}
				if (state.redoHistory.length >= 1) {
					//redo = '<div id="absRedoAct">Redo</div>';
				}
				
				var saveAdminList = '<hr />'+saveList+undo+redo+'<hr />'+admin;
				
				// If the element is not the body or the html elem, provide a list of all the element's parent elements for
				// quick selection of the parent elements
				if (!$(elem).is("html, body, head, style, script, meta, link, title")) {
					var levels = 1;
					parents += "<div><span class='abs-menu-parents'></span>Parents<div class='absSubmenu'>";
					parents += '<div id="lvl1" class="absSelParent" alt="Select this element\'s parent element">&lt;'+$(elem).parent().get(0).nodeName+"&gt;</div>";
					var curElem = elem;
					while (!$(curElem).parent().is("body, head")) {
						levels++;
						parents += '<div id="lvl'+levels+';" class="absSelParent" alt="Select this element\'s ancestor element">&lt;'+$(curElem).parent().parent().get(0).nodeName+"&gt;</div>";
						curElem = $(curElem).parent().get(0);
					}
					parents += "</div></div>";
				}
				menu = '<h1>&lt;'+elem.nodeName+'&gt;</h1>';
				
				if (!state.php.length && !abstraction.protectedMode) {
					
					// Create menu for the body element
					cases["BODY"] = function() {
						var stylesheets = "";
						var jscripts = "";
						state.$frame.contents().find('link:not(.abs-ui), style').each( function() {
							if ($(this).attr("href") == undefined) {
							
							} else {
								var cssname = $(state.elementHash.get(this)).attr("href").split("/");
									cssname = uncacheSafe(cssname[cssname.length-1]);  // Release all cache control strings from the path
								var csspath = uncacheSafe($(state.elementHash.get(this)).attr("href"));
								
								var arr = csspath.split(abstraction.root);
								if (arr.length > 1)
									csspath = arr[1];   // ...
								if (state.returnPath != '') {
									arr = csspath.split(state.returnPath);
									if (arr.length > 1)
										csspath = arr[1];   // ...
								}
								arr = csspath.split(state.currentPath);
								if (arr.length > 1)
									csspath = arr[1];   // ...
								csspath = state.currentPath+csspath;
								if (csspath.charAt(0) != "/")
									csspath = "/"+csspath;
								stylesheets += '<div alt="Edit this stylesheet" class="'+csspath+' absSelStylesheet">'+cssname+'</div>';
							}
						});
						stylesheets += '<div id="absNewCss" alt="Add a stylesheet">New&nbsp;Stylesheet</div>';
						state.$frame.contents().find('script:not(.abs-ui)').each( function() {
							if ($(this).attr("src") == undefined) {
								jscripts += '<div id="lvl'+level+'" class="absInlineScript" alt="Edit this script">inline script</div>';
								state.scriptRefs[level] = this;
								level++;
							} else {
								var jsname = $(state.elementHash.get(this)).attr("src").split("/");
									jsname = uncacheSafe(jsname[jsname.length-1]);
								var jspath = uncacheSafe($(state.elementHash.get(this)).attr("src"));
								var jspath = uncacheSafe($(state.elementHash.get(this)).attr("src"));
								var arr = jspath.split(abstraction.root);
								if (arr.length > 1)
									jspath = arr[1];   // ...
								if (state.returnPath != '') {
									arr = jspath.split(state.returnPath);
									if (arr.length > 1)
										jspath = arr[1];   // ...
								}
								arr = jspath.split(state.currentPath);
								if (arr.length > 1)
									jspath = arr[1];   // ...
									jspath = state.currentPath+jspath;
								if (jspath.charAt(0) != "/")
									jspath = "/"+jspath;
								jscripts += '<div alt="Edit this script" class="'+jspath+' absSelScript">'+jsname+'</div>';
							}
						});
						jscripts += '<div id="absNewJs" alt="Add a script">New&nbsp;Script</div>';
						menu += '<div><span class="abs-menu-edit"></span>Edit'
								+ '<div class="absSubmenu">'
									+ editAttrHTML
									+ editStylesEvents
								+ '</div>'
							 + '</div>'
							 + '<div><span class="abs-menu-insert"></span>Insert'
								+ '<div class="absSubmenu">'
									+ flowContentList
									+ textContentList
									+ textHeaderList
									+ '<hr />'
									+ mediaList
									+ '<hr />'
									+ '<div id="absCreateForm" alt="Add a Form">Form</div>'
									+ listTypeList
									+ '<div id="absCreateTable" alt="Add a table">Table</div>'
								+ '</div>'
							 + '</div>'
							 + paste
							 + '<hr />'
							 + '<div><span class="abs-menu-css"></span>Stylesheets'
								+ '<div class="absSubmenu">'
									+ stylesheets
								+ '</div>'
							 + '</div>'
							 + '<div><span class="abs-menu-scripts"></span>Scripts'
								+ '<div class="absSubmenu">'
									+ jscripts
								+ '</div>'
							 + '</div>'
							 + '<hr />'
							 + saveList
							 + undo
							 + redo
							 + '<hr />'
							 + admin;
					}
					// Create menu for the head element
					cases["HEAD"] = function() {
						menu += '<div><span class="abs-menu-insert"></span>Insert<div class="absSubmenu"><div id="absCreateBase" alt="Specify a base URL for the page">Base</div><div id="absNewCss" alt="Add a stylesheet to the document">Stylesheet</div><div id="absNewJs" alt="Add a script to the document">Script</div><div id="absCreateNoScript" alt="Alternate content when scripts are disabled">NoScript</div></div></div>'+saveAdminList;
					}
					cases["SCRIPT"] = function() {
						if ($(elem).attr("src") != undefined) {
							var jsname = $(elem).attr("src").split("/");
							jsname = uncacheSafe(jsname[jsname.length-1]);
							var jspath = uncacheSafe(elem.src);
							var arr = jspath.split(abstraction.root);
								if (arr.length > 1)
									jspath = arr[1];   // ...
							menu += '<div alt="Edit this script" class="'+jspath+' absSelScript"><span class="abs-menu-edit"></span>Edit</div>'+deleteList+saveAdminList;
						} else {
							menu += '<div alt="Edit this script" id="lvl'+level+'" class="absInlineScript"><span class="abs-menu-edit"></span>Edit</div>'+deleteList+saveAdminList;
							scriptRefs[level] = elem;
							level++;
						}
					}
					cases["META"] = function() {
						menu += '<div><span class="abs-menu-edit"></span>Edit<div class="absSubmenu"><div id="absElemAttr" alt="Edit the tag\'s attributes">Attributes</div></div></div>'+deleteList+saveAdminList;
					}
					cases["TITLE"] = function() {
						menu += '<div id="absEditInnerHTML"><span class="abs-menu-edit"></span>Edit<div class="absSubmenu">'+editAttrHTML+'</div></div>'+saveAdminList;
					}
					cases["LINK"] = 
					cases["STYLE"] = function() {
						if ($(elem).attr("src") != undefined) {
							var cssname = $(elem).attr("src").split("/");
							cssname = uncacheSafe(cssname[cssname.length-1]);
							var csspath = uncacheSafe(elem.src);
							var arr = csspath.split(abstraction.root);
								if (arr.length > 1)
									csspath = arr[1];   // ...
							menu += '<div alt="Edit this stylesheet" class="'+csspath+' absSelStylesheet"><span class="abs-menu-edit"></span>Edit<div class="absSubmenu"><div id="absElemAttr" alt="Edit the tag\'s attributes">Attributes</div></div></div>'+deleteList+saveAdminList;
						} else if ($(elem).attr("href") != undefined) {
							var cssname = $(elem).attr("href").split("/");
							cssname = uncacheSafe(cssname[cssname.length-1]);
							var csspath = uncacheSafe(elem.href);
							var arr = csspath.split(abstraction.root);
								if (arr.length > 1)
									csspath = arr[1];   // ...
							menu += '<div alt="Edit this stylesheet" class="'+csspath+' absSelStylesheet"><span class="abs-menu-edit"></span>Edit<div class="absSubmenu"><div id="absElemAttr" alt="Edit the tag\'s attributes">Attributes</div></div></div>'+deleteList+saveAdminList;
						} else {
							menu += '<div alt="Edit this stylesheet" id="lvl'+level+'" class="absInlineStylesheet"><span class="abs-menu-edit"></span>Edit<div class="absSubmenu">'+editAttrHTML+'</div></div>'+admin+deleteList+saveAdminList;
							scriptRefs[level] = elem;
							level++;
						}
					}
					cases["A"] = 
					cases["ARTICLE"] = 
					cases["ASIDE"] =
					cases["BLOCKQUOTE"] =
					cases["CAPTION"] = 		
					cases["DD"] = 
					cases["DIV"] = 
					cases["LI"] = 
					cases["SECTION"] = 
					cases["TD"] = function() {
						menu += '<div id="absEditInnerHTML"><span class="abs-menu-edit"></span>Edit<div class="absSubmenu">'+editAttrHTML+stylesTextEvents+'</div></div><div><span class="abs-menu-insert"></span>Insert<div class="absSubmenu">'+flowContentList+textContentList+textHeaderList+'<hr />'+mediaList+'<hr />'+listTypeList+'<div id="absCreateForm" alt="Add a Form">Form</div><div id="absCreateTable" alt="Add a Table">Table</div></div></div>'+parents+'<hr /><div id="absElemCopy" alt="Copy to your clipboard"><span class="abs-menu-copy"></span>Copy</div>'+paste+deleteList+saveAdminList;
					}
					cases["ABBR"] =
					cases["ACRONYM"] = 
					cases["ADDRESS"] =
					cases["B"] = 
					cases["BDI"] = 
					cases["BDO"] = 
					cases["BIG"] =
					cases["CENTER"] = 
					cases["CITE"] = 
					cases["CODE"] = 
					cases["DEL"] = 
					cases["DFN"] = 
					cases["EM"] = 
					cases["FIGCAPTION"] = 
					cases["FONT"] = 
					cases["H1"] = 
					cases["H2"] = 
					cases["H3"] = 
					cases["H4"] = 
					cases["H5"] = 
					cases["H6"] = 
					cases["I"] = 
					cases["INPUT"] = 
					cases["INS"] = 
					cases["KBD"] = 
					cases["LEGEND"] = 
					cases["MARK"] = 
					cases["METER"] = 
					cases["OUTPUT"] = 
					cases["P"] = 
					cases["PROGRESS"] =
					cases["PRE"] = 
					cases["Q"] = 
					cases["RP"] = 
					cases["S"] = 
					cases["SAMP"] = 
					cases["STRIKE"] = 
					cases["STRONG"] = 
					cases["SUP"] =
					cases["SUB"] = 
					cases["SMALL"] = 
					cases["SUMMARY"] = 
					cases["TEXTAREA"] = 
					cases["TH"] = 
					cases["TIME"] = 
					cases["TT"] =
					cases["U"] = 
					cases["VAR"] = 
					cases["XMP"] = function() {
						menu += '<div id="absEditText"><span class="abs-menu-edit"></span>Edit<div class="absSubmenu">'+editAttrHTML+stylesTextEvents+'</div></div>'+parents+'<hr /><div id="absElemCopy" alt="Copy to your clipboard"><span class="abs-menu-copy"></span>Copy</div>'+paste+deleteList+saveAdminList;
					}
					cases["APPLET"] = 
					cases["BUTTON"] = 
					cases["TITLE"] = function() {
						menu += '<div id="absEditInnerHTML"><span class="abs-menu-edit"></span>Edit<div class="absSubmenu">'+editAttrHTML+'</div></div>'+parents+'<hr /><div id="absElemCopy" alt="Copy to your clipboard"><span class="abs-menu-copy"></span>Copy</div>'+paste+deleteList+saveAdminList;
					}
					cases["AREA"] = 
					cases["BASE"] = 
					cases["BASEFONT"] = 
					cases["COL"] = 
					cases["COMMAND"] = 
					cases["EMBED"] =
					cases["KEYGEN"] = 		
					cases["PARAM"] =
					cases["SOURCE"] = function() {
						menu += '<div id="absElemAttr"><span class="abs-menu-edit"></span>Edit<div class="absSubmenu"><div id="absElemAttr" alt="Edit the tag\'s attributes">Attributes</div></div></div>'+parents+'<hr /><div id="absElemCopy" alt="Copy to your clipboard"><span class="abs-menu-copy"></span>Copy</div>'+paste+deleteList+saveAdminList;
					}
					cases["BR"] = 
					cases["HR"] = 
					cases["WBR"] = function() {
						menu += parents+'<hr /><div id="absElemCopy" alt="Copy to your clipboard"><span class="abs-menu-copy"></span>Copy</div>'+deleteList+saveAdminList;
					}
					cases["AUDIO"] = 
					cases["VIDEO"] = function() {
						menu += '<div id="absElemAttr"><span class="abs-menu-edit"></span>Edit<div class="absSubmenu">'+editAttrHTML+editStylesEvents+'</div></div><div><span class="abs-menu-insert"></span>Insert<div class="absSubmenu"><div id="absCreateSource" alt="Add a Source tag* - HTML5">Source</div></div></div>'+parents+'<hr /><div id="absElemCopy" alt="Copy to your clipboard"><span class="abs-menu-copy"></span>Copy</div>'+paste+deleteList+saveAdminList;
					}
					cases["CANVAS"] = function() {
						menu += '<div id="absElemAttr"><span class="abs-menu-edit"></span>Edit<div class="absSubmenu">'+editAttrHTML+editStylesEvents+'</div></div>'+parents+'<hr /><div id="absElemCopy" alt="Copy to your clipboard"><span class="abs-menu-copy"></span>Copy</div>'+paste+deleteList+saveAdminList;
					}
					cases["COLGROUP"] = function() {
						menu += '<div id="absEditInnerHTML"><span class="abs-menu-edit"></span>Edit<div class="absSubmenu">'+editAttrHTML+'</div></div><div><span class="abs-menu-insert"></span>Insert<div class="absSubmenu"><div id="absCreateCol" alt="Add a column">Col</div></div></div>'+parents+'<hr /><div id="absElemCopy" alt="Copy to your clipboard"><span class="abs-menu-copy"></span>Copy</div>'+paste+deleteList+saveAdminList;
					}
					cases["DATALIST"] = 
					cases["SELECT"] = function() {
						menu += '<div id="absCreateOption" alt="Add an option to the list"><span class="abs-menu-insert"></span>Option</div><div id="absEditInnerHTML"><span class="abs-menu-edit"></span>Edit<div class="absSubmenu">'+editAttrHTML+editStylesEvents+'</div></div>'+parents+'<hr /><div id="absElemCopy" alt="Copy to your clipboard"><span class="abs-menu-copy"></span>Copy</div>'+paste+deleteList+saveAdminList;
					}
					cases["DETAILS"] = function() {
						menu += '<div id="absEditInnerHTML"><span class="abs-menu-edit"></span>Edit<div class="absSubmenu">'+editAttrHTML+stylesTextEvents+'</div></div><div><span class="abs-menu-insert"></span>Insert<div class="absSubmenu"><div id="absCreateSum" alt="Add a Summary* - HTML5">Summary</div>'+flowContentList+textContentList+textHeaderList+'<hr />'+mediaList+'<hr />'+listTypeList+'<div id="absCreateForm" alt="Add a Form">Form</div><div id="absCreateTable" alt="Add a Table">Table</div></div></div>'+parents+'<hr /><div id="absElemCopy" alt="Copy to your clipboard"><span class="abs-menu-copy"></span>Copy</div>'+paste+deleteList+saveAdminList;
					}
					cases["DIR"] = 
					cases["UL"] = 
					cases["OL"] = function() {
						menu += '<div alt="Add a list item" id="absCreateLI"><span class="abs-menu-insert"></span>Add LI</div></div></div><div id="absEditInnerHTML"><span class="abs-menu-edit"></span>Edit<div class="absSubmenu">'+editAttrHTML+editStylesEvents+'</div></div>'+parents+'<hr /><div id="absElemCopy" alt="Copy to your clipboard"><span class="abs-menu-copy"></span>Copy</div>'+paste+deleteList+saveAdminList;
					}
					cases["DL"] = function() {
						menu += '<div alt="Insert a Term" id="absCreateDT"><span class="abs-menu-insert"></span>Add DT</div><div id="absEditInnerHTML"><span class="abs-menu-edit"></span>Edit<div class="absSubmenu">'+editAttrHTML+stylesTextEvents+'</div></div>'+parents+'<hr /><div id="absElemCopy" alt="Copy to your clipboard"><span class="abs-menu-copy"></span>Copy</div>'+paste+deleteList+saveAdminList;
					}
					cases["DT"] = function() {
						menu += '<div alt="Add a Description" id="absCreateDD"><span class="abs-menu-insert"></span>Add DD</div><div id="absEditInnerHTML"><span class="abs-menu-edit"></span>Edit<div class="absSubmenu">'+editAttrHTML+stylesTextEvents+'</div></div>'+parents+'<hr /><div id="absElemCopy" alt="Copy to your clipboard"><span class="abs-menu-copy"></span>Copy</div>'+paste+deleteList+saveAdminList;
					}
					cases["FIELDSET"] = function() {
						menu += '<div id="absEditInnerHTML"><span class="abs-menu-edit"></span>Edit<div class="absSubmenu">'+editAttrHTML+editStylesEvents+'</div></div><div><span class="abs-menu-insert"></span>Insert<div class="absSubmenu"><div id="absCreateLgnd" alt="Add a caption to this fieldset">Legend</div><div id="absCreateLbl" alt="Add a label">Label</div><div id="absCreateInput" alt="Add an input">Input</div></div></div>'+parents+'<hr /><div id="absElemCopy" alt="Copy to your clipboard"><span class="abs-menu-copy"></span>Copy</div>'+paste+deleteList+saveAdminList;
					}
					cases["FIGURE"] = function() {
						menu += '<div id="absEditInnerHTML"><span class="abs-menu-edit"></span>Edit<div class="absSubmenu">'+editAttrHTML+editStylesEvents+'</div></div><div><span class="abs-menu-insert"></span>Insert<div class="absSubmenu"><div id="absCreateFigCapt" alt="Add a Caption* - HTML5">Caption</div><hr/>'+mediaList+'</div></div>'+parents+'<hr /><div id="absElemCopy" alt="Copy to your clipboard"><span class="abs-menu-copy"></span>Copy</div>'+paste+deleteList+saveAdminList;
					}
					cases["FORM"] = function() {
						menu += '<div id="absEditInnerHTML"><span class="abs-menu-edit"></span>Edit<div class="absSubmenu">'+editAttrHTML+editStylesEvents+'</div></div><div><span class="abs-menu-insert"></span>Insert<div class="absSubmenu"><div id="absCreateFieldset" alt="Create a Fieldset">Fieldset</div><div id="absCreateInput" alt="Add an input">Input</div></div></div>'+parents+'<hr /><div id="absElemCopy" alt="Copy to your clipboard"><span class="abs-menu-copy"></span>Copy</div>'+paste+deleteList+saveAdminList;
					}
					cases["FOOTER"] = 
					cases["HEADER"] =  function()  {
						menu += '<div id="absEditInnerHTML"><span class="abs-menu-edit"></span>Edit<div class="absSubmenu">'+editAttrHTML+stylesTextEvents+'</div></div><div><span class="abs-menu-insert"></span>Insert<div class="absSubmenu"><div>Layer<div class="absSubmenu"><div id="absCreateDiv" alt="Add a Division">DIV</div><div id="absCreateNav" alt="Add Navigation links* - HTML5">Nav</div></div></div><hr /><div id="absCreateHgroup" alt="Add a Header Group">Hgroup</div><div id="absCreateImg" alt="Add an image">Image</div><div id="absCreateP" alt="Add a paragraph">Paragraph</div>'+textHeaderList+'<hr/>'+listTypeList+'<div id="absCreateTable" alt="Add a Table">Table</div></div></div>'+parents+'<hr /><div id="absElemCopy" alt="Copy to your clipboard"><span class="abs-menu-copy"></span>Copy</div>'+paste+deleteList+saveAdminList;
					}
					cases["HGROUP"] = function() {
						menu += textHeaderList+'<div id="absEditInnerHTML"><span class="abs-menu-edit"></span>Edit<div class="absSubmenu">'+editAttrHTML+editStylesEvents+'</div></div>'+parents+'<hr /><div id="absElemCopy" alt="Copy to your clipboard"><span class="abs-menu-copy"></span>Copy</div>'+paste+deleteList+saveAdminList;
					}
					cases["IFRAME"] = function() {
						menu += '<div id="absElemAttr"><span class="abs-menu-edit"></span>Edit<div class="absSubmenu">'+editAttrHTML+'</div></div>'+parents+'<hr /><div id="absElemCopy" alt="Copy to your clipboard"><span class="abs-menu-copy"></span>Copy</div>'+paste+deleteList+saveAdminList;
					}
					cases["IMG"] = function() {
						menu += '<div id="absEditImage"><span class="abs-menu-edit"></span>Edit<div class="absSubmenu"><div id="absElemAttr" alt="Edit the tag\'s attributes">Attributes</div><div id="absEditImage" alt="Change the image\'s source">Source</div>'+editStylesEvents+'</div></div><div id="absCreateMap" alt="Map coordinates on image"><span class="abs-menu-insert"></span>Add Map</div>'+parents+'<hr /><div id="absElemCopy" alt="Copy to your clipboard"><span class="abs-menu-copy"></span>Copy</div>'+paste+deleteList+saveAdminList;
					}
					cases["LABEL"] = function() {
						menu += '<div id="absCreateInput" alt="Add an input"><span class="abs-menu-insert"></span>Add Input</div><div id="absEditInnerHTML"><span class="abs-menu-edit"></span>Edit<div class="absSubmenu">'+editAttrHTML+editStylesEvents+'</div></div>'+parents+'<hr /><div id="absElemCopy" alt="Copy to your clipboard"><span class="abs-menu-copy"></span>Copy</div>'+paste+deleteList+saveAdminList;
					}
					cases["MAP"] = function() {
						menu += '<div alt="Add a Map Area" id="absCreateArea"><span class="abs-menu-insert"></span>Add Area</div><div id="absEditInnerHTML"><span class="abs-menu-edit"></span>Edit<div class="absSubmenu">'+editAttrHTML+'<div id="absEditEvents" alt="Edit the tag\'s events">Events</div></div></div>'+parents+'<hr /><div id="absElemCopy" alt="Copy to your clipboard"><span class="abs-menu-copy"></span>Copy</div>'+paste+deleteList+saveAdminList;
					}
					cases["MENU"] = function() {
						menu += '<div id="absEditInnerHTML"><span class="abs-menu-edit"></span>Edit<div class="absSubmenu">'+editAttrHTML+editStylesEvents+'</div></div><div><span class="abs-menu-insert"></span>Insert<div class="absSubmenu"><div id="absCreateLI" alt="Add an item to the list">List Item</div><div id="absCreateCommand" alt="Add a Command to the menu* - HTML5">Command</div></div></div>'+parents+'<hr /><div id="absElemCopy" alt="Copy to your clipboard"><span class="abs-menu-copy"></span>Copy</div>'+paste+deleteList+saveAdminList;
					}
					cases["NAV"] = function() {
						menu += '<div alt="Add a hyperlink" id="absCreateA"><span class="abs-menu-insert"></span>Add Link</div><div id="absEditInnerHTML"><span class="abs-menu-edit"></span>Edit<div class="absSubmenu">'+editAttrHTML+stylesTextEvents+'</div></div>'+parents+'<hr /><div id="absElemCopy" alt="Copy to your clipboard"><span class="abs-menu-copy"></span>Copy</div>'+paste+deleteList+saveAdminList;
					}
					cases["NOFRAMES"] = 
					cases["NOSCRIPT"] = function() {
						menu += '<div id="absEditInnerHTML"><span class="abs-menu-edit"></span>Edit<div class="absSubmenu">'+editAttrHTML+editStylesEvents+'</div></div><div><span class="abs-menu-insert"></span>Insert<div class="absSubmenu"><div id="absCreateLink" alt="Add a Link tag">Link</div><div id="absCreateStyle" alt="Add a Style tag">Style</div><hr /><div id="absCreateP" alt="Add a paragraph">Paragraph</div></div></div>'+parents+'<hr /><div id="absElemCopy" alt="Copy to your clipboard"><span class="abs-menu-copy"></span>Copy</div>'+paste+deleteList+saveAdminList;
					}
					cases["OBJECT"] = function() {
						menu += '<div id="absEditInnerHTML"><span class="abs-menu-edit"></span>Edit<div class="absSubmenu">'+editAttrHTML+editStylesEvents+'</div></div><div><span class="abs-menu-insert"></span>Insert<div class="absSubmenu"><div id="absCreateParam" alt="Add a Parameter">Parameter</div><div id="absCreateSwf" alt="Add an Embed tag">Embed</div><div id="absCreateMap" alt="Map coordinates on the object"><span class="abs-menu-insert"></span>Map</div></div></div>'+parents+'<hr /><div id="absElemCopy" alt="Copy to your clipboard"><span class="abs-menu-copy"></span>Copy</div>'+paste+deleteList+saveAdminList;
					}
					cases["OPTGROUP"] = function() {
						menu += '<div id="absCreateOption" alt="Add an Option">+Option</div><div id="absEditInnerHTML"><span class="abs-menu-edit"></span>Edit<div class="absSubmenu">'+editAttrHTML+editStylesEvents+'</div></div>'+parents+'<hr /><div id="absElemCopy" alt="Copy to your clipboard"><span class="abs-menu-copy"></span>Copy</div>'+paste+deleteList+saveAdminList;
					}
					cases["OPTION"] = function() {
						menu += '<div id="absEditInnerHTML"><span class="abs-menu-edit"></span>Edit<div class="absSubmenu">'+editAttrHTML+editStylesEvents+'</div></div>'+parents+'<hr /><div id="absElemCopy" alt="Copy to your clipboard"><span class="abs-menu-copy"></span>Copy</div>'+paste+deleteList+saveAdminList;
					}
					cases["RUBY"] = function() {
						menu += '<div id="absCreateRT" alt="Add Ruby text"><span class="abs-menu-insert"></span>Add RT</div><div id="absEditInnerHTML"><span class="abs-menu-edit"></span>Edit<div class="absSubmenu">'+editAttrHTML+stylesTextEvents+'</div></div>'+parents+'<hr /><div id="absElemCopy" alt="Copy to your clipboard"><span class="abs-menu-copy"></span>Copy</div>'+paste+deleteList+saveAdminList;
					}
					cases["RT"] = function() {
						menu += '<div id="absCreateRP" alt="Add Ruby Parenthesis for unsupporting browsers"><span class="abs-menu-insert"></span>Add RP</div><div id="absEditInnerHTML"><span class="abs-menu-edit"></span>Edit<div class="absSubmenu">'+editAttrHTML+editStylesEvents+'</div></div>'+parents+'<hr /><div id="absElemCopy" alt="Copy to your clipboard"><span class="abs-menu-copy"></span>Copy</div>'+paste+deleteList+saveAdminList;
					}
					// Span is a special case element atm because it can also represent other inline content, such as inline PHP
					// 		we check here for any special cases and generate the appropriate menus
					cases["SPAN"] = function() {
						switch(elem.getAttribute("class")) {
							case "abs-inline-php":
								menu = '<h1 style="color: red;">&lt;?PHP&gt;</h1><div>Edit</div>'+parents+'<hr />'+deleteList+'<hr /><div id="absSaveDoc"><span class="abs-menu-save"></span>Save</div>'+undo+redo;
								break;
								
							default:
								menu += '<div id="absEditInnerHTML"><span class="abs-menu-edit"></span>Edit<div class="absSubmenu">'+editAttrHTML+stylesTextEvents+'</div></div><div><span class="abs-menu-insert"></span>Insert<div class="absSubmenu">'+flowContentList+textContentList+textHeaderList+'<hr />'+mediaList+'<hr />'+listTypeList+'<div id="absCreateForm" alt="Add a Form">Form</div><div id="absCreateTable" alt="Add a Table">Table</div></div></div><hr /><div id="absElemCopy" alt="Copy to your clipboard"><span class="abs-menu-copy"></span>Copy</div>'+paste+deleteList+parents+saveAdminList;
								break;
						}
					}
					cases["TABLE"] = function() {
						menu += '<div><span class="abs-menu-insert"></span>Insert<div class="absSubmenu"><div id="absCreateCaption" alt="Add a Table Caption">Caption</div><div id="absCreateThead" alt="Add a Table Header">Header</div><div id="absCreateTrow" alt="Add a Row">Row</div><div id="absCreateTfoot" alt="Add a Table Footer">Footer</div></div></div><div id="absEditInnerHTML"><span class="abs-menu-edit"></span>Edit<div class="absSubmenu">'+editAttrHTML+editStylesEvents+'</div></div><div id="absElemCopy" alt="Copy to your clipboard"><span class="abs-menu-copy"></span>Copy</div>'+paste+deleteList+parents+saveAdminList;
					}
					cases["TBODY"] = function() {
						menu += '<div id="absCreateTrow" alt="Add a Row"><span class="abs-menu-insert"></span>Add Row</div><div id="absEditInnerHTML"><span class="abs-menu-edit"></span>Edit<div class="absSubmenu">'+editAttrHTML+editStylesEvents+'</div></div><div id="absElemCopy" alt="Copy to your clipboard"><span class="abs-menu-copy"></span>Copy</div>'+paste+deleteList+parents+saveAdminList;
					}
					cases["TFOOT"] = 
					cases["THEAD"] = function() {
						menu += '<div id="absCreateTrow" alt="Add a row"><span class="abs-menu-insert"></span>Add Row</div><div id="absEditInnerHTML"><span class="abs-menu-edit"></span>Edit<div class="absSubmenu">'+editAttrHTML+editStylesEvents+'</div></div><div id="absElemCopy" alt="Copy to your clipboard"><span class="abs-menu-copy"></span>Copy</div>'+paste+deleteList+parents+saveAdminList;
					}
					cases["TR"] = function() {
						menu += '<div id="absCreateColumn" alt="Add a Column"><span class="abs-menu-insert"></span>Add TD</div><div id="absEditInnerHTML"><span class="abs-menu-edit"></span>Edit<div class="absSubmenu">'+editAttrHTML+'<div id="absEditStyles" alt="Edit the row\'s styles">Styles</div><hr /><div id="absEditEvents" alt="Edit the row\'s events">Events</div></div></div><div id="absElemCopy" alt="Copy to your clipboard"><span class="abs-menu-copy"></span>Copy</div>'+paste+deleteList+parents+saveAdminList;
					}
					
					if (typeof cases[elem.nodeName] == 'function') {
						cases[elem.nodeName]();
						cases = {};  // Clear up memory to prevent leak
					} else {
						cases = {};  // Clear up memory to prevent leak
						return false;
					}
				} else {
					var stylesheets = "";
					var jscripts = "";
					state.$frame.contents().find('link:not(.abs-ui), style').each( function() {
						if ($(this).attr("href") == undefined) {
						
						} else {
							var cssname = $(state.elementHash.get(this)).attr("href").split("/");
								cssname = uncacheSafe(cssname[cssname.length-1]);  // Release all cache control strings from the path
							var csspath = uncacheSafe($(state.elementHash.get(this)).attr("href"));
							
							var arr = csspath.split(abstraction.root);
							if (arr.length > 1)
								csspath = arr[1];   // ...
							if (state.returnPath != '') {
								arr = csspath.split(state.returnPath);
								if (arr.length > 1)
									csspath = arr[1];   // ...
							}
							arr = csspath.split(state.currentPath);
							if (arr.length > 1)
								csspath = arr[1];   // ...
							csspath = state.currentPath+csspath;
							if (csspath.charAt(0) != "/")
								csspath = "/"+csspath;
							stylesheets += '<div alt="Edit this stylesheet" class="'+csspath+' absSelStylesheet">'+cssname+'</div>';
						}
					});
					state.$frame.contents().find('script:not(.abs-ui)').each( function() {
						if ($(this).attr("src") == undefined) {
							jscripts += '<div id="lvl'+level+'" class="absInlineScript" alt="Edit this script">inline script</div>';
							state.scriptRefs[level] = this;
							level++;
						} else {
							var jsname = $(state.elementHash.get(this)).attr("src").split("/");
								jsname = uncacheSafe(jsname[jsname.length-1]);
							var jspath = uncacheSafe($(state.elementHash.get(this)).attr("src"));
							var arr = jspath.split(abstraction.root);
							if (arr.length > 1)
								jspath = arr[1];   // ...
							if (state.returnPath != '') {
								arr = jspath.split(state.returnPath);
								if (arr.length > 1)
									jspath = arr[1];   // ...
							}
							arr = jspath.split(state.currentPath);
							if (arr.length > 1)
								jspath = arr[1];   // ...
								jspath = state.currentPath+jspath;
							if (jspath.charAt(0) != "/")
								jspath = "/"+jspath;
							jscripts += '<div alt="Edit this script" class="'+jspath+' absSelScript">'+jsname+'</div>';
						}
					});
					menu += parents + '<hr />'
							+ '<div><span class="abs-menu-css"></span>Stylesheets'
							+ '<div class="absSubmenu">'
								+ stylesheets
							+ '</div>'
						 + '</div>'
						 + '<div><span class="abs-menu-scripts"></span>Scripts'
							+ '<div class="absSubmenu">'
								+ jscripts
							+ '</div>'
						 + '</div>'
						 + '<hr />'
						 + saveList
						 + undo
						 + redo;
				}
				// Add menu contents to the DOM and create the submenus
				contextMenu.$.removeClass('abs-taskbar-contextMenu').empty().html(menu);  // empty method removes event handlers to avoid memory leaks
				
				contextMenu.$.find("div").hover(contextMenu.submenuMouseover, contextMenu.submenuMouseout);
				//$("#absContextMenu div").mouseenter(c_submenuMouseover).mouseleave(c_submenuMouseout);
				
				// Set the onclick events for the various context menu options
				$("#absToggleAdmin")		.bind('click', contextMenu.adminToggle);
				$("#absElemCopy")			.bind('click', contextMenu.copyElement);
				$(".absElemPaste")			.bind('click', contextMenu.pasteElement);
				$("#absClipboardClear")		.bind('click', contextMenu.clearClipboard);
				$("#absPosRel")				.bind('click', contextMenu.positionElemRel);
				$("#absPosAbs")				.bind('click', contextMenu.positionElemAbs);
				$("#absPosFix")				.bind('click', contextMenu.positionElemFix);
				$("#absEditSize")			.bind('click', contextMenu.editElemSize);
				$("#absEditText")			.bind('click', contextMenu.editElemText);
				$("#absEditImage")			.bind('click', contextMenu.editElemImage);
				$("#absEditStyles")			.bind('click', contextMenu.editElemStyles);
				$("#absElemAttr")			.bind('click', contextMenu.editElemAttr);
				$("#absEditInnerHTML")		.bind('click', contextMenu.editElemHTML);
				$("#absEditHTML")			.bind('click', contextMenu.editDocHTML);
				$("#absCreateA")			.bind('click', contextMenu.createElemA);
				$("#absCreateArticle")		.bind('click', contextMenu.createElemArticle);
				$("#absCreateArea")			.bind('click', contextMenu.createElemArea);
				$("#absCreateAside")		.bind('click', contextMenu.createElemAside);
				$("#absCreateAudio")		.bind('click', contextMenu.createElemAudio);
				$("#absCreateCanvas")		.bind('click', contextMenu.createElemCanvas);
				$("#absCreateCaption")		.bind('click', contextMenu.createElemCaption);
				$("#absCreateCol")			.bind('click', contextMenu.createElemCol);
				$("#absCreateColumn")		.bind('click', contextMenu.createElemTD);
				$("#absCreateCommand")		.bind('click', contextMenu.createElemCommand);
				$("#absCreateBase")			.bind('click', contextMenu.createElemBase);
				$("#absCreateDeta")			.bind('click', contextMenu.createElemDetails);
				$("#absCreateDD")			.bind('click', contextMenu.createElemDD);
				$("#absCreateDiv")			.bind('click', contextMenu.createElemDiv);
				$("#absCreateDL")			.bind('click', contextMenu.createElemDL);
				$("#absCreateDT")			.bind('click', contextMenu.createElemDT);
				$("#absCreateFigCapt")		.bind('click', contextMenu.createElemFigCaption);
				$("#absCreateFigure")		.bind('click', contextMenu.createElemFigure);
				$("#absCreateFooter")		.bind('click', contextMenu.createElemFooter);
				$("#absCreateForm")			.bind('click', contextMenu.createElemForm);
				$("#absCreateFieldset")		.bind('click', contextMenu.createElemFieldset);
				$("#absCreateH1")			.bind('click', contextMenu.createElemH1);
				$("#absCreateH2")			.bind('click', contextMenu.createElemH2);
				$("#absCreateH3")			.bind('click', contextMenu.createElemH3);
				$("#absCreateH4")			.bind('click', contextMenu.createElemH4);
				$("#absCreateH5")			.bind('click', contextMenu.createElemH5);
				$("#absCreateH6")			.bind('click', contextMenu.createElemH6);
				$("#absCreateHeader")		.bind('click', contextMenu.createElemHeader);
				$("#absCreateHgroup")		.bind('click', contextMenu.createElemHgroup);
				$("#absCreateImg")			.bind('click', contextMenu.createElemImg);
				$("#absCreateInput")		.bind('click', contextMenu.createElemInput);
				$("#absCreateLbl")			.bind('click', contextMenu.createElemLabel);
				$("#absCreateLgnd")			.bind('click', contextMenu.createElemLegend);
				$("#absCreateLI")			.bind('click', contextMenu.createElemLI);
				$("#absCreateLink")			.bind('click', contextMenu.createElemLink);
				$("#absCreateMap")			.bind('click', contextMenu.createElemMap);
				$("#absCreateMenu")			.bind('click', contextMenu.createElemMenu);
				$("#absCreateNav")			.bind('click', contextMenu.createElemNav);
				$("#absCreateNoScript")		.bind('click', contextMenu.createElemNoScript);
				$("#absCreateObject")		.bind('click', contextMenu.createElemObject);
				$("#absCreateOL")			.bind('click', contextMenu.createElemOL);
				$("#absCreateP")			.bind('click', contextMenu.createElemP);
				$("#absCreateParam")		.bind('click', contextMenu.createElemParam);
				$("#absCreateRP")			.bind('click', contextMenu.createElemRP);
				$("#absCreateRT")			.bind('click', contextMenu.createElemRT);
				$("#absCreateSection")		.bind('click', contextMenu.createElemSection);
				$("#absCreateSource")		.bind('click', contextMenu.createElemSource);
				$("#absCreateStyle")		.bind('click', contextMenu.createElemStyle);
				$("#absCreateSum")			.bind('click', contextMenu.createElemSummary);
				$("#absCreateSwf")			.bind('click', contextMenu.createElemEmbed);
				$("#absCreateTable")		.bind('click', contextMenu.createElemTable);
				$("#absCreateTfoot")		.bind('click', contextMenu.createElemTfoot);
				$("#absCreateThead")		.bind('click', contextMenu.createElemThead);
				$("#absCreateTrow")			.bind('click', contextMenu.createElemTrow);
				$("#absCreateUL")			.bind('click', contextMenu.createElemUL);
				$("#absCreateVideo")		.bind('click', contextMenu.createElemVideo);
				$("#absDelete")				.bind('click', contextMenu.deleteElement);
				$("#absNewCss")				.bind('click', contextMenu.createNewCSS);
				$("#absNewJs")				.bind('click', contextMenu.createNewJS);
				$("#absSaveDoc")			.bind('click', function() { abstraction.activeState.save(); });
				$("#absUndoAct")			.bind('click', contextMenu.undoAction);
				$("#absRedoAct")			.bind('click', contextMenu.redoAction);
				$(".absSelParent")			.bind('click', contextMenu.parentClick);
				$(".absSelParent")			.bind('mouseenter', contextMenu.parentMouseover);
				$(".absSelParent").parent()	.bind('mouseleave', contextMenu.parentWrapperMouseout);
				$(".absSelScript")			.bind('click', contextMenu.editScript);
				$(".absSelStylesheet")		.bind('click', contextMenu.editStylesheet);
				$(".absInlineScript")		.bind('click', contextMenu.editInlineScript);
				$(".absInlineStylesheet")	.bind('click', contextMenu.editInlineStylesheet);
				$("#absContextMenu div:not(.absSubmenu)").bind('mouseenter', contextMenu.setTooltip);
				state = null;
				return true;
			}
			ContextMenu.prototype.file = function(file) {
				var contextMenu = this,
					filetype;
				file = file.split(':');
				filetype = file[1];
				file = file[0];
				abstraction.contextFile = file;
				abstraction.contextFiletype = filetype;
				contextMenu.target = abstraction.fileManager;
				var paste = '<div style="color: gray;" alt="There are no files in your clipboard"><span class="abs-menu-paste"></span>Paste</div>';
				
				if (abstraction.fileManager.clipboard.length >= 1) {
					paste = '<div><span class="abs-menu-paste"></span>Paste<div class="absSubmenu">';
					for (var i in abstraction.fileManager.clipboard) {
						paste += '<div class="absFilePaste" id="lvl'+i+'" alt="Paste '+abstraction.fileManager.clipboard[i].substr(1).split(':')[0]+' in this directory">'+abstraction.fileManager.clipboard[i].substr(1).split(':')[0]+'</div>';
					}
					paste += '<div id="absClipboardClear" alt="Clear the clipboard">Clear</div></div></div>';
				}
				
				if (abstraction.fileManager.selection.length > 1) {
					var menu = '<h1>Selected files</h1><div id="absFileCopy" alt="Copy these files to your clipboard"><span class="abs-menu-copy"></span>Copy</div>'+paste+'<div><span class="abs-menu-delete"></span>Delete<div class="absSubmenu"><div id="absDelete" alt="Delete these files?" style="color:pink">Confirm</div></div></div>';
					// Add menu contents to the DOM and create the submenus
					$("#absContextMenu").empty().html(menu);
					$("#absContextMenu div").hover(contextMenu.submenuMouseover, contextMenu.submenuMouseout);
					
					//$("#absNewFile")		.bind('click', contextMenu.newFile);
					//$("#absNewDirectory")	.bind('click', contextMenu.newDirectory);
					//$("#absUploadFile")	.bind('click', contextMenu.uploadFile);
					$("#absClipboardClear")	.bind('click', contextMenu.clearFileClipboard);
					$("#absFileCopy")		.bind('click', contextMenu.copyFiles);
					$(".absFilePaste")		.bind('click', contextMenu.pasteFiles);
					$("#absDelete")			.bind('click', contextMenu.deleteFiles);
					$("#absContextMenu div:not(.absSubmenu)").bind('mouseenter', contextMenu.setTooltip);
					return true;
				}
				
				var menu = file.split("/");
				var menu = '<h1>/'+menu[menu.length-1]+'</h1>';
				
				var cases = {};
				cases["zip"] = 
				cases["rar"] =
				cases["dir"] = function() {
					menu += '<div id="absOpenDir" alt="Open this directory"><span class="abs-menu-open"></span>Open</div><div id="absFileCopy" alt="Copy this directory to your clipboard"><span class="abs-menu-copy"></span>Copy</div>'+paste+'<div id="absFileRename" alt="Rename this file"><span class="abs-menu-rename"></span>Rename</div><div><span class="abs-menu-delete"></span>Delete<div class="absSubmenu"><div id="absDelete" alt="Delete this directory?" style="color:pink">Confirm</div></div></div><hr /><div id="absNewFile" alt="Create a new file"><span class="abs-menu-newFile"></span>New File<div class="absSubmenu"><div id="absNewCss" alt="Create a new css file?">Css</div><div id="absNewHtml" alt="Create a new html file?">Html</div><div id="absNewJs" alt="Create a new javascript file?">Javascript</div><div id="absNewPhp" alt="Create a new php file?">Php</div><hr /><div alt="Create a new file?">Other</div></div></div><div id="absNewDirectory" alt="Create a new directory"><span class="abs-menu-newDir"></span>New Folder</div><div id="absUploadFile" alt="Upload a file"><span class="abs-menu-upload"></span>Upload</div>';
				}
				cases["html"] = 
				cases["htm"] = 
				cases["php"] = 
				cases["pl"] = 
				cases["py"] = 
				cases["xml"] = 
				cases["log"] = 
				cases["js"] = 
				cases["css"] = 
				cases["htaccess"] = 
				cases["htpasswd"] = 
				cases["txt"] = function() {
					menu += '<div id="absFileEdit" alt="Edit this file\'s source"><span class="abs-menu-edit"></span>Edit</div><div id="absFileCopy" alt="Copy this file to your clipboard"><span class="abs-menu-copy"></span>Copy</div>'+paste+'<div id="absFileRename" alt="Rename this file"><span class="abs-menu-rename"></span>Rename</div><div><span class="abs-menu-delete"></span>Delete<div class="absSubmenu"><div id="absDelete" alt="Delete this file?" style="color:pink">Confirm</div></div></div><hr /><div id="absNewFile" alt="Create a new file"><span class="abs-menu-newFile"></span>New File<div class="absSubmenu"><div id="absNewCss" alt="Create a new css file?">Css</div><div id="absNewHtml" alt="Create a new html file?">Html</div><div id="absNewJs" alt="Create a new javascript file?">Javascript</div><div id="absNewPhp" alt="Create a new php file?">Php</div><hr /><div alt="Create a new file?">Other</div></div></div><div id="absNewDirectory" alt="Create a new directory"><span class="abs-menu-newDir"></span>New Folder</div><div id="absUploadFile" alt="Upload a file"><span class="abs-menu-upload"></span>Upload</div>';
				}
				cases["jpeg"] = 
				cases["jpg"] = 
				cases["gif"] = 
				cases["png"] = 
				cases["ico"] =
				cases["bmp"] = function() {
					menu += '<div id="absFileCopy" alt="Copy this file to your clipboard"><span class="abs-menu-copy"></span>Copy</div>'+paste+'<div id="absFileRename" alt="Rename this file"><span class="abs-menu-rename"></span>Rename</div><div><span class="abs-menu-delete"></span>Delete<div class="absSubmenu"><div id="absDelete" alt="Delete this file?" style="color:pink">Confirm</div></div></div><hr /><div id="absNewFile" alt="Create a new file"><span class="abs-menu-newFile"></span>New File<div class="absSubmenu"><div id="absNewCss" alt="Create a new css file?">Css</div><div id="absNewHtml" alt="Create a new html file?">Html</div><div id="absNewJs" alt="Create a new javascript file?">Javascript</div><div id="absNewPhp" alt="Create a new php file?">Php</div><hr /><div alt="Create a new file?">Other</div></div></div><div id="absNewDirectory" alt="Create a new directory"><span class="abs-menu-newDir"></span>New Folder</div><div id="absUploadFile" alt="Upload a file"><span class="abs-menu-upload"></span>Upload</div>';
				}
				cases["aif"] =
				cases["mpa"] =
				cases["mp3"] = 
				cases["mp4"] = 
				cases["oga"] =
				cases["ogg"] =
				cases["rm"] =
				cases["wav"] = 
				cases["wma"] =
				cases["wmp"] = function() {
					menu += '<div id="absAudioPlay" alt="Play this audio file"><span class="abs-menu-playAudio"></span>Play</div><div id="absFileCopy" alt="Copy this file to your clipboard"><span class="abs-menu-copy"></span>Copy</div>'+paste+'<div id="absFileRename" alt="Rename this file"><span class="abs-menu-rename"></span>Rename</div><div><span class="abs-menu-delete"></span>Delete<div class="absSubmenu"><div id="absDelete" alt="Delete this file?" style="color:pink">Confirm</div></div></div><hr /><div id="absNewFile" alt="Create a new file"><span class="abs-menu-newFile"></span>New File<div class="absSubmenu"><div id="absNewCss" alt="Create a new css file?">Css</div><div id="absNewHtml" alt="Create a new html file?">Html</div><div id="absNewJs" alt="Create a new javascript file?">Javascript</div><div id="absNewPhp" alt="Create a new php file?">Php</div><hr /><div alt="Create a new file?">Other</div></div></div><div id="absNewDirectory" alt="Create a new directory"><span class="abs-menu-newDir"></span>New Folder</div><div id="absUploadFile" alt="Upload a file"><span class="abs-menu-upload"></span>Upload</div>';
				}
				cases["avi"] =
				cases["mov"] = 
				cases["mpg"] = 
				cases["ogv"] =
				cases["wmp"] = 
				cases["swf"] = 
				cases["wmv"] = function() {
					menu += '<div id="absVideoPlay" alt="Play this video file"><span class="abs-menu-playVideo"></span>Play</div><div id="absFileCopy" alt="Copy this file to your clipboard"><span class="abs-menu-copy"></span>Copy</div>'+paste+'<div id="absFileRename" alt="Rename this file"><span class="abs-menu-rename"></span>Rename</div><div><span class="abs-menu-delete"></span>Delete<div class="absSubmenu"><div id="absDelete" alt="Delete this file?" style="color:pink">Confirm</div></div></div><hr /><div id="absNewFile" alt="Create a new file"><span class="abs-menu-newFile"></span>New File<div class="absSubmenu"><div id="absNewCss" alt="Create a new css file?">Css</div><div id="absNewHtml" alt="Create a new html file?">Html</div><div id="absNewJs" alt="Create a new javascript file?">Javascript</div><div id="absNewPhp" alt="Create a new php file?">Php</div><hr /><div alt="Create a new file?">Other</div></div></div><div id="absNewDirectory" alt="Create a new directory"><span class="abs-menu-newDir"></span>New Folder</div><div id="absUploadFile" alt="Upload a file"><span class="abs-menu-upload"></span>Upload</div>';
				}
				if (file == 'none') {
					abstraction.contextFile = "/";
					menu = '<h1>/</h1><div id="absNewFile" alt="Create a new file"><span class="abs-menu-newFile"></span>New File<div class="absSubmenu"><div id="absNewCss" alt="Create a new css file?">Css</div><div id="absNewHtml" alt="Create a new html file?">Html</div><div id="absNewJs" alt="Create a new javascript file?">Javascript</div><div id="absNewPhp" alt="Create a new php file?">Php</div><hr /><div alt="Create a new file?">Other</div></div></div><div id="absNewDirectory" alt="Create a new directory"><span class="abs-menu-newDir"></span>New Folder</div><div id="absUploadFile" alt="Upload a file"><span class="abs-menu-upload"></span>Upload</div>'+paste;
					cases = null;
				} else if (typeof cases[getFileType(file, filetype)] == 'function') {
					cases[getFileType(file, filetype)]();
					cases = {};
				} else {
					cases = {};
					return false;
				}
				
				// Add menu contents to the DOM and create the submenus
				$("#absContextMenu").removeClass('abs-taskbar-contextMenu').empty().html(menu);
				$("#absContextMenu div").hover(contextMenu.submenuMouseover, contextMenu.submenuMouseout);
				
				$("#absClipboardClear")	.bind('click', contextMenu.clearFileClipboard);
				$("#absOpenDir")		.bind('click', contextMenu.loadFileDirectory);
				$("#absNewFile")		.bind('click', contextMenu.newFile);
				$("#absNewDirectory")	.bind('click', contextMenu.newDirectory);
				$("#absUploadFile")		.bind('click', contextMenu.uploadFile);
				$("#absFileEdit")		.bind('click', contextMenu.editFile);
				$("#absFileCopy")		.bind('click', contextMenu.copyFile);
				$(".absFilePaste")		.bind('click', contextMenu.pasteFile);
				$("#absFileRename")		.bind('click', contextMenu.renameFile);
				$("#absDelete")			.bind('click', contextMenu.deleteFile);
				$("#absContextMenu div:not(.absSubmenu)").bind('mouseenter', contextMenu.setTooltip);
				
				return true;
			}
			ContextMenu.prototype.revision = function(revision, state) {
				var contextMenu = this,
					filetype;
				revision = revision.split(':');
				filetype = revision[1];
				revision = revision[0];
				abstraction.contextRevision = revision;
				contextMenu.target = abstraction.revisionManager;
				if (abstraction.revisionManager.selection.length > 1) {
					var menu = '<h1>Selected revisions</h1><div><span class="abs-menu-delete"></span>Delete<div class="absSubmenu"><div id="absDelete" alt="Delete these files?" style="color:pink">Confirm</div></div></div>';
					// Add menu contents to the DOM and create the submenus
					$("#absContextMenu").removeClass('abs-taskbar-contextMenu').empty().html(menu);
					$("#absContextMenu div").hover(contextMenu.submenuMouseover, contextMenu.submenuMouseout);
					
					//$("#absNewFile")		.bind('click', contextMenu.newFile);
					//$("#absNewDirectory")	.bind('click', contextMenu.newDirectory);
					//$("#absUploadFile")	.bind('click', contextMenu.uploadFile);
					//$("#absClipboardClear")	.bind('click', contextMenu.clearFileClipboard);
					//$("#absFileCopy")		.bind('click', contextMenu.copyFiles);
					//$(".absFilePaste")		.bind('click', contextMenu.pasteFiles);
					$("#absDelete")			.bind('click', contextMenu.deleteRevisions);
					$("#absContextMenu div:not(.absSubmenu)").bind('mouseenter', contextMenu.setTooltip);
					return true;
				}
				if (revision == 'none')
					menu = '<h1>/'+contextMenu.target.state.currentDoc+'</h1><div id="absCreateRevision" alt="Create a new revision of the current document">New Revision</div><div id="absCreateRevDir" alt="Create a new directory">New Folder</div>';
				else if (revision.indexOf(".backup") == -1) {
					var head = revision.split("/");
						head = head[head.length-1];
						head = head.split('-');
						head = new Date(head[0], head[1]-1);
						head = head.toDateString().split(" ");
						head = head[1]+" "+head[3];
					var menu = '<h1>'+head+'</h1>';
						menu += '<div id="absLoadDirectory" alt="Open this directory">Open</div><div id="absRenameDirectory" alt="Rename this directory">Rename</div><div>Delete<div class="absSubmenu"><div id="absDeleteRevision" alt="Delete this directory?" style="color:pink">Confirm</div></div></div><hr /><div id="absCreateRevision" alt="Create a new revision in this directory">New Revision</div><div id="absCreateRevDir" alt="Create a new directory">New Folder</div>';
				} else {
					var head = revision.split("/");
						head = head[head.length-1];
						head = head.replace('.backup', '').split('-');
						head = new Date(head[0], head[1]-1, head[2], head[3], head[4], head[5]);
						head = head.toString().split(" GMT");
						head = head[0].split(" ");
					var menu = '<h1>'+head[1]+' '+head[2]+' '+head[4]+'</h1>';
						menu += '<div id="absLoadRevision" alt="Load from this revision">Load</div><div id="absRenameRevision" alt="Rename this revision">Rename</div><div>Delete<div class="absSubmenu"><div id="absDeleteRevision" alt="Delete this revision?" style="color:pink">Confirm</div></div></div><hr /><div id="absCreateRevision" alt="Create a new revision in this directory">New Revision</div><div id="absCreateRevDir" alt="Create a new directory">New Folder</div>';
				}
			
				// Add menu contents to the DOM and create the submenus
				$("#absContextMenu").removeClass('abs-taskbar-contextMenu').empty().html(menu);
				$("#absContextMenu div").hover(contextMenu.submenuMouseover, contextMenu.submenuMouseout);
				
				$("#absCreateRevision")	.bind('click', contextMenu.createRevision);
				$("#absCreateRevDir")	.bind('click', contextMenu.createRevDir);
				$("#absLoadRevision")	.bind('click', contextMenu.loadRevision);
				$("#absLoadDirectory")	.bind('click', contextMenu.loadRevisionDirectory);
				$("#absRenameRevision")	.bind('click', contextMenu.renameRevision);
				$("#absRenameDirectory").bind('click', contextMenu.renameRevision);
				$("#absDeleteRevision")	.bind('click', contextMenu.deleteRevision);
				$("#absContextMenu div:not(.absSubmenu)").bind('mouseenter', contextMenu.setTooltip);
				
				return true;
			}
			ContextMenu.prototype.taskbar = function(taskbarItem) {
				var contextMenu = this;
					
				contextMenu.target = abstraction.taskbar;
				var menu = '<h1>'+taskbarItem.title+'</h1>';
				//	menu += '<div id="absLoadRevision" alt="Load from this revision">Load</div><div id="absRenameRevision" alt="Rename this revision">Rename</div><div>Delete<div class="absSubmenu"><div id="absDeleteRevision" alt="Delete this revision?" style="color:pink">Confirm</div></div></div><hr /><div id="absCreateRevision" alt="Create a new revision in this directory">New Revision</div><div id="absCreateRevDir" alt="Create a new directory">New Folder</div>';
			
				// Add menu contents to the DOM and create the submenus
				//var x = '';
				//for (var i in taskbarItem.menu.fragment.childNodes)
				//	x += i+': '+taskbarItem.menu.fragment.childNodes[i]+'\r';
				taskbarItem.menu.set(taskbarItem.menu.json);
				$("#absContextMenu").addClass('abs-taskbar-contextMenu').empty().html(menu).append(taskbarItem.menu.fragment);
				//$("#absContextMenu div").hover(contextMenu.submenuMouseover, contextMenu.submenuMouseout);
				
				//$("#absCreateRevision")	.bind('click', contextMenu.createRevision);
				$("#absContextMenu div:not(.absSubmenu)").bind('mouseenter', contextMenu.setTooltip);
				
				return true;
			}
			// List of all bindable context menu functions.  Context meny functions are prefixed with 'c_'
			ContextMenu.prototype.submenuMouseover = function() {
				//clearTimeout(menuTimer);
				//alert(menuItem);
				//$("#absContextMenu").find(".absSubmenu").fadeOut("fast");
				var submenu = $(this).children(".absSubmenu");
				if ($("#absContextMenu").offset().left > $window.width()*0.85) {  // If the menu is close to the right edge of the screen...
					var lPos = -$(this).children(".absSubmenu").width()-2;					  // make the submenus appear on the left of the menu
					submenu.addClass("abs-right-side");
					submenu.removeClass("abs-left-side");
				} else {
					var lPos = $(this).width()+6;
					submenu.removeClass("abs-right-side");
					submenu.addClass("abs-left-side");
				}
				submenu
					.css({
						"left": lPos,
						"top": -1
					})
					.fadeIn("fast");
			}
			ContextMenu.prototype.submenuMouseout = function() {
				//menuItem = this
				//clearTimeout(menuTimer);
				//menuTimer = setTimeout(function() {
					$(this).children(".absSubmenu").fadeOut("fast");
				//	menuItem = null;
				//}, 500);
			}
			return ContextMenu;
		})();

		var DocumentPreview = (function() {
			DocumentPreview.Inherits(ui.Window);
			function DocumentPreview(file, taskbars, newOptions, parent) {
				// Argument logic
				parent = parent || abstraction.desktop;
				newOptions = newOptions || {};
				// Local variable declaration
				var documentPreview = this,
					menuTimer, submenuTimer,
					maximized = false;
				
				// Member variable declaration & Logic
				//documentPreviews.put(documentPreview, documentPreview);	// Append this editor to the 'documentPreviews' hashtable
				this.currentPath = "";
				this.returnPath = "";
				this.file = "";
				this.loaded = false;
				this.menuClosed = true;
				this.$ = $('<div/>')
					.attr("class", "window abs-documentPreview-ui abs-ui")
					.css("display", "none")
					.appendTo(parent);
				this.window = this.$.get(0);
				this.$wrapper = $('<div/>')
					.addClass('abs-documentPreview-wrapper')
					.attr("style", "overflow: hidden; background-color: #cfcfcf")
					.appendTo(this.window);
				this.wrapper = this.$wrapper.get(0);
				this.$frame = $('<iframe/>')
					.addClass("abs-documentPreview-frame-ui abs-ui")
					.attr({
						id: "abs-documentPreview-frame-"+documentPreviews.size(),
						name: "abs-documentPreview-frame-"+documentPreviews.size()
						//style: "width: 680px; height: 500px; left: 50%; top: 50%; margin-left: -340px; margin-top: -250px;"
					})
					.appendTo(this.wrapper);
				this.frame = this.$frame.get(0);
				this.$selector = $('<div/>')
					.addClass("abs-selector-ui abs-ui")
					.appendTo(this.wrapper);
				this.selector = this.$frame.get(0);
				this.name = 'documentPreview';
				this.workingAssets = {};
				this.liveAssets = {};
				this.linkedAssetEditors = {};
				
				var menu = new ui.Menu({
					refresh: {
						content: '<span class="abs-menu-refresh"></span>Refresh',
						click: function() { documentPreview.refresh(); }
					},
					save: {
						content: '<span class="abs-menu-save"></span>Save'
					},
					close: {
						content: '<span class="abs-menu-delete"></span>Close',
						click: function() { documentPreview.close(); }
					},
					insert: "<hr />",
					options: {
						content: '<span class="abs-menu-options"></span>Options',
						mouseover: function() {
							var submenu = $(this).children(".ui-submenu");
							clearTimeout(submenuTimer);
							submenu.css('display', 'block');
							if (submenu.offset().top+submenu.outerHeight() > $window.height()) {
								submenu
									.css({
										"top": submenu.position().top - ((submenu.offset().top+submenu.outerHeight())-$window.height())
									});
							}
							submenu
								.css({
									"left": $(this).parent().width()
								});	
						},
						mouseout: function() {
							var menuItem = this;
							submenuTimer = setTimeout(function() {
								$(menuItem).children(".ui-submenu").fadeOut("fast");
								menuItem = null;
							}, 500);
						},
						children: {
							resolution: {
								content: "<span class='abs-menu-blank'></span>resolution",
								styles: 'color: gray;'
							},
							dockable: {
								content: function() {
									return abstraction.previewsDockable ? "<span class='abs-menu-check'></span>dockable" : "<span class='abs-menu-blank'></span>dockable"
								},
								click: function() {
									abstraction.previewsDockable = !abstraction.previewsDockable;
									if (abstraction.previewsDockable) {
										documentPreviews.each( function(key, win) {
											win.dockable = true;
										});
										$(".window-menu > .options .dockable span").attr("class", "abs-menu-check");
									} else {
										documentPreviews.each( function(key, win) {
											win.dockable = false;
										});
										$(".window-menu > .options .dockable span").attr("class", "abs-menu-blank");
									}
									abstraction.saveUI();
								}
							}
						}
					}
				});
				menu.$
					.addClass("window-menu")
					.mouseenter(function() {
						clearTimeout(menuTimer)
					})
					.mouseleave(function() {
						menuTimer = setTimeout(function() {
							documentPreview.$menu.hide();
							documentPreview.menuClosed = true;
						}, 500);
					});
				if (abstraction.activeState && abstraction.activeState.preview) {
					var newLeft = parseInt(abstraction.activeState.preview.left())+20;
					var newTop = parseInt(abstraction.activeState.preview.top())+20;
					if (abstraction.activeState.preview.isMaximized)
						maximized = true;
				} else {
					var newLeft = 200;
					var newTop = 20;
				}
				documentPreview.options($.extend({
					selector: this.window,
					title: "<div class='abs-preview-icon'></div>Document Preview",
					taskbar: taskbars,
					left: newLeft,
					top: newTop,
					width: 900,
					height: 700,
					attachedWidth: 700,
					dragstop: documentPreview.saveUI,
					resizestop: documentPreview.saveUI,
					minimize: documentPreview.saveUI,
					unminimize: documentPreview.saveUI,
					maximize: documentPreview.saveUI,
					unmaximize: documentPreview.saveUI,
					menu: menu,
					openmenu: documentPreview.toggleMenu,
					focus: documentPreview.onfocus
				}, newOptions));
				if (maximized)
					documentPreview.maximize(true);
				else
					documentPreview.checkBounds();
				documentPreview.load(file);
				documentPreview.open();           		// reveal the new window
				documentPreview.setZindex();
				menu = null;  // For garbage collection
			}
			DocumentPreview.prototype.saveUI = function() {
				abstraction.saveUI();
			}
			DocumentPreview.prototype.bindContextMenu = function() {
				var documentPreview = this,
					frameDoc = documentPreview.frame.contentWindow.document,
					htmlElement = $(frameDoc).find('html').get(0);
				$(frameDoc)
					.bind('contextmenu', function(e) { documentPreview.oncontextmenu(e); })
					.bind('click', function() { abstraction.docClick(); });
			}
			DocumentPreview.prototype.bindInternalLinks = function() {
				// Attach an event listener to all links, execute 'setDocumentSource' on click and override normal link functionality
				var documentPreview = this,
					docLinks = documentPreview.frame.contentWindow.document.getElementsByTagName("a");
				for (var i=0; i<docLinks.length; i++) {
					if ($(docLinks[i]).attr('href') && $(docLinks[i]).attr('href').search(/(http:\/\/|https:\/\/)/i) == -1) {
						$(docLinks[i]).unbind('click.linkClick').bind('click.linkClick', function() {
							var href = this.href;
							var arr = href.split(abstraction.root);
							if (arr.length > 1)
								href = arr[1];
							//if (href.indexOf('http://') == -1 && href.indexOf('https://') == -1)
							href = (href.charAt(0) == "/") ? href : "/"+href;
							if (documentPreviews.get(href) == undefined)
								new DocumentPreview(href, abstraction.taskbar);
							if (sourceEditors.get(href) == undefined)
								new SourceEditor(href, abstraction.taskbar);
							return false;  // This return value prevents the link from actually being followed
						});
					} else if ($(docLinks[i]).attr('href')) {
						$(docLinks[i]).unbind('click.linkClick').bind('click.linkClick', function() {
							window.open(this.href);
							return false;
						});
					}
				}
			}
			DocumentPreview.prototype.bindWorkingDocs = function() {
				var documentPreview = this,
					docLinks = documentPreview.frame.contentWindow.document.getElementsByTagName("link");
					docScripts = documentPreview.frame.contentWindow.document.getElementsByTagName("script");
				for (var i=0; i<docLinks.length; i++) {
					var href = uncacheSafe(docLinks[i].href);
					var arr = href.split(abstraction.root);
					//alert(docLinks[i].href);
					if (arr.length > 1) {
						href = arr[1];
						//if (href.indexOf('http://') == -1 && href.indexOf('https://') == -1)
						href = (href.charAt(0) == "/") ? href : "/"+href;
						var fullLive = documentPreview.state.returnPath+((href.charAt(0) == "/") ? href.slice(1) : href);
						if (!documentPreview.workingAssets[href]) {
							var sourceEditor = sourceEditors.get(href);
							if (sourceEditor != undefined) {
								var fullWorking = documentPreview.state.returnPath+((sourceEditor.state.workingDoc.charAt(0) == "/") ? sourceEditor.state.workingDoc.slice(1) : sourceEditor.state.workingDoc);
								documentPreview.workingAssets[href] = fullWorking;
								documentPreview.liveAssets[sourceEditor.state.workingDoc] = fullLive;
								docLinks[i].href = cacheSafePath(uncacheSafe(documentPreview.workingAssets[href]));
								sourceEditor.linkedPreviews[href] = documentPreview;
								documentPreview.linkedAssetEditors[href] = sourceEditor;
								//alert(documentPreview.linkedAssetEditors[href].file);
							} else
								docLinks[i].href = cacheSafePath(uncacheSafe(fullLive));
						} else
							docLinks[i].href = cacheSafePath(uncacheSafe(documentPreview.workingAssets[href]));
					} else
						docLinks[i].href = cacheSafePath(uncacheSafe(docLinks[i].href));
				}
				for (var i=0; i<docScripts.length; i++) {
					if (docScripts[i].src) {
						var href = uncacheSafe(docScripts[i].src);
						var arr = href.split(abstraction.root);
						if (arr.length > 1)
							href = arr[1];
						//if (href.indexOf('http://') == -1 && href.indexOf('https://') == -1)
						href = (href.charAt(0) == "/") ? href : "/"+href;
						if (!documentPreview.workingAssets[href]) {
							var sourceEditor = sourceEditors.get(href);
							if (sourceEditor != undefined) {
								documentPreview.workingAssets[href] = (sourceEditor.state.workingDoc.charAt(0) == "/") ? sourceEditor.state.workingDoc.slice(1) : sourceEditor.state.workingDoc;
								documentPreview.liveAssets[sourceEditor.state.workingDoc] = (href.charAt(0) == "/") ? href.slice(1) : href;
								//docScripts[i].src = cacheSafePath(uncacheSafe(documentPreview.workingAssets[href]));
								sourceEditor.linkedPreviews[href] = documentPreview;
								documentPreview.linkedAssetEditors[href] = sourceEditor;
							}// else
								//docScripts[i].src = cacheSafePath(uncacheSafe((href.charAt(0) == "/") ? href.slice(1) : href));
						}// else
							//docScripts[i].src = cacheSafePath(uncacheSafe(documentPreview.workingAssets[href]));
					}
				}
			}
			DocumentPreview.prototype.unbindWorkingDoc = function(href) {
				var documentPreview = this;
				documentPreview.linkedAssetEditors[href].linkedPreviews = {};
				delete documentPreview.workingAssets[href];
				delete documentPreview.liveAssets[documentPreview.linkedAssetEditors[href].state.workingDoc];
				delete documentPreview.linkedAssetEditors[href];
				this.state.update();
			}
			DocumentPreview.prototype.unbindWorkingDocs = function() {
				var documentPreview = this;
				for (var i in documentPreview.linkedAssetEditors)
					delete documentPreview.linkedAssetEditors[i].linkedPreviews[i];
				documentPreview.workingAssets = {};
				documentPreview.liveAssets = {};
			}
			DocumentPreview.prototype.close = function() {
				//this.frame.contentWindow.document.removeEventListener('contextmenu', this.oncontextmenu, false);
				this.unbindWorkingDocs();
				$(this.frame.contentWindow.document).unbind();
				this.state.preview = undefined;
				this.state.$preview = undefined;
				documentPreviews.remove(this.file);
				var i = this.state.winZindex.length;
				while (i--)
					if (this.state.winZindex[i] === this)
						this.state.winZindex.splice(i, 1);
				//this.$.unbind();
				//this.$menu.unbind().empty();
				this.menu.destroy();
				this.destroy();
				abstraction.saveUI();
			};
			DocumentPreview.prototype.load = function(file) {
				var documentPreview = this
					arr = file.split(abstraction.root);
				if (arr.length > 1)
					file = arr[1];
				arr = file.split("/");
				for (var i=0; i<arr.length-1; i++)
					if (arr[i] != "") {
						documentPreview.currentPath += arr[i]+"/";
						documentPreview.returnPath += "../";
					}
				arr = file.split("?");
				if (arr.length > 1) {
					file = arr[0];
					documentPreview.urlQuery = "?"+arr[1];
				} else
					documentPreview.urlQuery = "";
				if (file.charAt(0) != "/")
					file = "/"+file;
				if (documentPreview.currentDoc == undefined)  // If abstraction was just loaded...
					documentPreview.currentDoc = uncacheSafe(file.substr(1));
				else {
					documentPreview.lastDoc = documentPreview.currentDoc;
					documentPreview.currentDoc = uncacheSafe(file.substr(1));
					abstraction.saveUI();
				}
				documentPreviews.put(file, documentPreview);  // Associate this window with it's file in the preview windows hashtable
				documentPreview.file = file;
				if (file.length < 24)
					documentPreview.setTitle("<div class='abs-preview-icon'></div>Viewing: /"+documentPreview.currentDoc+documentPreview.urlQuery);
				else
					documentPreview.setTitle("<div class='abs-preview-icon'></div>Viewing: ... "+(documentPreview.currentDoc+documentPreview.urlQuery).slice(-24));
				documentPreview.state = documentStates.get(file);
				if (documentPreview.state == undefined)  // If a documentState object does not exist for this file, create one
					documentPreview.state = new DocumentState(file);
				else 
					documentPreview.state.linkDocumentPreview(documentPreview);
				documentPreview.state.onload(function(){
					var frameDoc,
						elem;
					//documentPreview.refresh(documentPreview.bindContextMenu);
					//documentPreview.bindContextMenu();
					//documentPreview.bindInternalLinks();
					//documentPreview.bindWorkingDocs();
					$(documentPreview.frame.contentWindow.document).bind('keydown', ui.globalKeydown).bind('keyup', ui.globalKeyup);
					$(documentPreview.menu.save).unbind('click').bind('click', function() { documentPreview.state.save(); });
				});

				/*
				documentPreview.lastWorkingDoc = documentPreview.workingDoc;
				documentPreview.workingDoc = '/'+documentPreview.currentPath+'abs-working-doc-'+documentPreview.currentDoc.replace(/-/gi, '-!@h@!-').replace(/\./gi, '-!@p@!-')+'.php';
				alert(documentPreview.currentDoc);
				abstraction.getFileContents(uncacheSafe(file), function(html) {
					alert(documentPreview.workingDoc);
					abstraction.setFileContents(encodeURIComponent(documentPreview.workingDoc), html, function() {
						documentPreview.$frame
							.one('load', function() {  })  // initialize abstraction once
							.attr("src", cacheSafePath(".."+documentPreview.workingDoc+documentPreview.urlQuery));
					});
				});
				*/
			}
			DocumentPreview.prototype.oncontextmenu = function(e) {
				var documentPreview = this,
					newleft, newtop,
					frameDoc = documentPreview.frame.contentWindow.document;
				e = window.event || e;    // window.event is for IE
				if (e.stopPropagation)
					e.stopPropagation();  // Standards complient browsers
				else
					e.cancelBubble=true;  // IE
				var target = e.target != null ? e.target : e.srcElement;
				if (e.pageX != undefined) {
					newleft = e.pageX;
					newtop = e.pageY;
				} else {
					newleft = e.clientX;
					newtop = e.clientY;
				}
				//if (frameDoc.getElementFromPoint)
				//	elem = frameDoc.getElementFromPoint(newleft, newtop);
				//else
				//	elem = frameDoc.elementFromPoint(newleft, newtop);
				if (abstraction.contextMenu.element(target, documentPreview.state)) {  // Generate the element context menu
					//var wmod = (window.leftbar.isAttached) ? ($(window.leftbar.selector).width()+2) : 0;  // Determines if the sidebar is locked in
					var wmod = 0;
					var scrolltop = (navigator.userAgent.indexOf("Firefox")!=-1) ? $(frameDoc).find('html,body').scrollTop() : $(frameDoc).find('body').scrollTop();
					newleft = newleft + documentPreview.$frame.offset().left;
					newtop = newtop - scrolltop + documentPreview.$frame.offset().top;
						
					if (newtop + abstraction.contextMenu.$.outerHeight() > $window.height())  // This keeps the context menu from displaying lower then the bottom of the window
						newtop = $window.height() - abstraction.contextMenu.$.outerHeight();
					abstraction.contextMenu.$
						.css({ display: 'none', left: newleft+'px', top: newtop+'px' })
						.fadeIn("fast");
				}
				e.preventDefault();
				return false;
			}
			DocumentPreview.prototype.onfocus = function() {
				var documentPreview = this;
				if (abstraction.activeState != documentPreview.state) {
					abstraction.activeState = documentPreview.state;
					abstraction.sourceOutline.load(documentPreview.file);
					abstraction.revisionManager.load(documentPreview.file);
				}
				abstraction.updateGroupFocus(documentPreview);
			}
			DocumentPreview.prototype.refresh = function(onload) {
				onload = onload || function(){};
				var documentPreview = this;
				this.$handle.find('.open-menu').css('background', 'transparent url(abstraction/core/styles/images/ajax-loader.gif) no-repeat center');
				$(documentPreview.frame.contentWindow.document).unbind();
				//documentPreview.$frame
				//	.one('load', function() { documentPreview.bindContextMenu(); documentPreview.bindInternalLinks(); documentPreview.bindWorkingDocs(); documentPreview.$handle.find('.open-menu').css('background', ''); onload.call(documentPreview); })  // initialize abstraction once
				//	.attr("src", cacheSafePath(".."+documentPreview.state.workingDoc+documentPreview.urlQuery));
				documentPreview.state.update();
			}
			DocumentPreview.prototype.setZindex = function() {
				var i = this.state.winZindex.length;
				while (i--)
					if (this.state.winZindex[i] === this) {
						this.state.winZindex.splice(i, 1);
					}
				this.state.winZindex[this.state.winZindex.length] = this;
			}
			DocumentPreview.prototype.toggleMenu = function() {
				var documentPreview = this;
				if (documentPreview.menuClosed) {
					documentPreview.$menu.show();
					documentPreview.menuClosed = false;
				} else {
					documentPreview.$menu.hide();
					documentPreview.menuClosed = true;
				}
			}
			return DocumentPreview;
		})();
		this.DocumentPreview = DocumentPreview;
		
		var DocumentState = (function() {
			function DocumentState(file) {
				var documentState = this;
				
				documentState.currentPath = "";
				documentState.returnPath = "";
				documentState.source = "";
				documentState.loaded = false;		// has the state object finished loading a file?
				documentState.saved = true;			// has the file loaded into the state object been saved since any changes were made?
				documentState.doctype = "";		    //	the 'state' will only change when changed by the editor, and will not store changes made via internal javascript
				documentState.protectedMode = true; // protectedMode restricts editing to the source editor and does not attempt to process the file in any way
				documentState.elementHash = new Hashtable();
				documentState.loadQueue = [];
				documentState.php = [];
				documentState.history = [];
				documentState.redoHistory = [];
				documentState.clipboard = [];
				documentState.winZindex = [];
				documentState.scriptRefs = [];
				documentState.inlineEditors = [];
				documentState.attributeEditors = [];
				documentState.liveAssets = {};
				documentState.workingAssets = {};
				documentState.linkedAssetEditors = {};
				this.name = 'documentState';
				// Logic
				if (file != undefined)
					documentState.load(file);
			}
			DocumentState.prototype.add = function(dom, _parent) {
				var documentState = this;
				var elem = dom.cloneNode(false);	// This is a copy of the entire DOM starting with the HTML element
				_parent.appendChild(elem);        // which is now appended to the 'state' documentFragment
				documentState.elementHash.put(dom, elem);
				documentState.elementHash.put(elem, dom);
				this.appendChildren(dom, elem);
			}
			DocumentState.prototype.appendChildren = function(dom, _parent) {
				var documentState = this;
				traverseDOM(dom, _parent);
				function traverseDOM(dom, _parent) {
					//if (dom.childNodes.length >2)
					//alert(_parent.nodeName+" "+dom.childNodes[2].nodeName);
					var l = dom.childNodes.length;
					for (var i=0; i<l; i++) {
						var elem = dom.childNodes[i].cloneNode(false);
						_parent.appendChild(elem);  
						documentState.elementHash.put(dom.childNodes[i], elem);
						documentState.elementHash.put(elem, dom.childNodes[i]);
						if (dom.childNodes.length > 0)
							traverseDOM(dom.childNodes[i], elem);
					}
				}
			}
			// Function which creates a new element and inserts it into the DOM, returning a pointer to the object
			DocumentState.prototype.createElement = function(element, _parent, args) {
				var documentState = this,
					newElem = document.createElement(element),
					cases = [];
				//If element is an anchor/link, create element with 'New Link' as its content
				cases["A"] = function() {
					newElem.innerHTML = "New Link";
					$(_parent)
						//.add(documentState.elementHash.get(_parent))  // Edits the 'state' document as well
						.append(newElem);
					documentState.add(newElem, documentState.elementHash.get(_parent));
				}
				// If element is a void tag, add it to its parent with no preset attributes.
				cases["AREA"] =
				cases["EMBED"] =
				cases["LINK"] = 
				cases["NOSCRIPT"] = 
				cases["PARAM"] = 
				cases["SOURCE"] = function() {
					$(_parent)
						//.add(documentState.elementHash.get(_parent))  // Edits the 'state' document as well
						.append(newElem);
					documentState.add(newElem, documentState.elementHash.get(_parent));
				}
				// If element is any of the below nodes, simply append element with the node name as its content
				cases["ARTICLE"] = 
				cases["ASIDE"] = 
				cases["B"] = 
				cases["CANVAS"] =
				cases["COMMAND"] =
				cases["DD"] = 
				cases["DIV"] = 
				cases["DL"] = 
				cases["DT"] = 
				cases["EM"] = 
				cases["FIELDSET"] = 
				cases["FIGCAPTION"] = 
				cases["FIGURE"] = 
				cases["FOOTER"] = 
				cases["FORM"] = 
				cases["H1"] = 
				cases["H2"] = 
				cases["H3"] = 
				cases["H4"] = 
				cases["H5"] = 
				cases["H6"] = 
				cases["HEADER"] = 
				cases["HGROUP"] = 
				cases["I"] = 
				cases["LABEL"] = 
				cases["LEGEND"] =  
				cases["LI"] = 
				cases["NAV"] = 
				cases["Q"] = 
				cases["S"] = 
				cases["SECTION"] = 
				cases["SPAN"] = 
				cases["STRONG"] = 
				cases["STYLE"] = 
				cases["SUMMARY"] = 
				cases["TFOOT"] = 
				cases["U"] =function() {
					newElem.innerHTML = "New "+element;
					$(_parent)
						//.add(documentState.elementHash.get(_parent))  // Edits the 'state' document as well
						.append(newElem);
					documentState.add(newElem, documentState.elementHash.get(_parent));
				}
				//If element is a video or audio tag, create with 'May not support' warning as content
				cases["AUDIO"] = 
				cases["VIDEO"] = function() {
					newElem.innerHTML = "Your browser may not support this content.";
					$(newElem).attr('controls', 'controls');
					$(_parent).append(newElem);				
					documentState.add(newElem, documentState.elementHash.get(_parent));
				}
				// If element is a Base, append element with empty href
				cases["BASE"] = function() {
					$(newElem).attr('href', 'Enter URL');
					$(_parent)
						//.add(documentState.elementHash.get(_parent))  // Edits the 'state' document as well
						.append(newElem);
					documentState.add(newElem, documentState.elementHash.get(_parent));
				}
				// If element is a header or table caption, prepend it to the beginning of the parent with "New"+element name as content
				cases["CAPTION"] = 
				cases["HEADER"] = 
				cases["LEGEND"] = function() {
					newElem.innerHTML = "New "+element;
					$(_parent)
						//.add(documentState.elementHash.get(_parent))  // Edits the 'state' document as well
						.prepend(newElem);
					documentState.pre(newElem, documentState.elementHash.get(_parent));
				}
				cases["DETAILS"] = function() {
					newElem.innerHTML = "New "+element;
					$(newElem).attr('open', 'open');
					$(_parent).append(newElem);				
					documentState.add(newElem, documentState.elementHash.get(_parent));
				}

				// If element is an image, add an image with 'noImg.jpg' as it's source
				cases["IMG"] = function() {
					if (args == undefined || args.src == undefined) {
						var imgSrc = documentState.returnPath+"builder/styles/images/noImg.jpg";
						documentState.setImage(newElem);
					} else
						var imgSrc = args.src;
					newElem.setAttribute("src", imgSrc);
					$(_parent)
						//.add(documentState.elementHash.get(_parent))  // Edits the 'state' document as well
						.append(newElem);
						//$(_parent).css('background-color', 'red');
					documentState.add(newElem, documentState.elementHash.get(_parent));
				}
				// If element is an input, set 'type' attribute to 'text'
				cases["INPUT"] = function() {
					$(newElem).attr('type', 'text');
					$(_parent)
						//.add(documentState.elementHash.get(_parent))  // Edits the 'state' document as well
						.append(newElem);
					documentState.add(newElem, documentState.elementHash.get(_parent));
				}
				// If element is an image map, create a map element after the selected image 
				cases["MAP"] = function() {
					$(_parent)
						//.add(documentState.elementHash.get(_parent))  // Edits the 'state' document as well
						.after(newElem);
					documentState.add(newElem, documentState.elementHash.get(_parent));
				}
				// If element is a list, add a single child with 'New list' as its content and set its context menu
				cases["MENU"] = 
				cases["UL"] = 
				cases["OL"] = function() {
					var newChild1 = document.createElement("li");
					newChild1.innerHTML = "New list";
					$(newElem).append(newChild1);
					$(_parent)
						//.add(documentState.elementHash.get(_parent))  // Edits the 'state' document as well
						.append(newElem);
					documentState.add(newElem, documentState.elementHash.get(_parent));
				}
				// If element is an Object, add it to the DOM with an embed child
				cases["OBJECT"] = function() {
					var newChild1 = document.createElement("embed");
					$(newChild1).attr({
						src:"builder/styles/images/embed.png",
						height: "50",
						width: "50"
					});	
					newElem.setAttribute("width", "50");
					newElem.setAttribute("height", "50");
					$(newElem).append(newChild1);
					$(_parent)
						//.add(documentState.elementHash.get(_parent))  // Edits the 'state' document as well
						.append(newElem);
					documentState.add(newElem, documentState.elementHash.get(_parent));
				}
				//If element is a Paragraph, create p with 'New Paragraph' as its content
				cases["P"] = function() {
					newElem.innerHTML = "New Paragraph";
					$(_parent)
						//.add(documentState.elementHash.get(_parent))  // Edits the 'state' document as well
						.append(newElem);
					documentState.add(newElem, documentState.elementHash.get(_parent));
				}
				// If element is a param, add it to the object
				cases["PARAM"] = function() {
					$(_parent)
						//.add(documentState.elementHash.get(_parent))  // Edits the 'state' document as well
						.append(newElem);
					documentState.add(newElem, documentState.elementHash.get(_parent));
				}
				// If element is a table, add a row with 'New table' as its content and set context menus
				cases["TABLE"] = function() {
					var newChild1 = document.createElement("tbody");
					var newChild2 = document.createElement("tr");
					var newChild3 = document.createElement("td");
					newChild3.innerHTML = "New table";
					$(newElem).append(newChild1);
					$(newChild1).append(newChild2);
					$(newChild2).append(newChild3);
					$(_parent)
						//.add(documentState.elementHash.get(_parent))  // Edits the 'state' document as well
						.append(newElem);
					documentState.add(newElem, documentState.elementHash.get(_parent));
				}
				// If element is a table column, add 'New column' as its content
				cases["TD"] = function() {
					newElem.innerHTML = "New column";
					$(_parent)
						//.add(documentState.elementHash.get(_parent))  // Edits the 'state' document as well.append(newElem);
						.append(newElem);
					documentState.add(newElem, documentState.elementHash.get(_parent));
				}
				// If element is a table header, add 'Table header' as its content
				cases["TH"] = function() {
					newElem.innerHTML = "Table header";
					
					if ($(_parent).find("thead").length != 0) {
						$(_parent).find("thead").prepend(newElem);
						documentState.pre(newElem, documentState.elementHash.get($(_parent).find("thead").get(0)));
					} else {
						var newChild1 = document.createElement("thead");
						var newChild2 = document.createElement("tr").appendChild(newElem);
						$(newChild1).append(newChild2);
						$(_parent)
							//.add(documentState.elementHash.get(_parent))  // Edits the 'state' document as well
							.prepend(newChild1);	
						documentState.pre(newChild1, documentState.elementHash.get(_parent));  // THIS FUNCTION NEEDS TO BE ABLE TO PREPEND
					}
				}
				// If element is a row, add a single child with 'New row' as its content and set its context menu
				cases["TR"] = function() {
					var newChild1 = document.createElement("td");
					newChild1.innerHTML = "New row";
					$(newElem).append(newChild1);
					$(_parent)
						//.add(documentState.elementHash.get(_parent))  // Edits the 'state' document as well
						.append(newElem);
					documentState.add(newElem, documentState.elementHash.get(_parent));
				}
				
				if (typeof cases[newElem.nodeName] == 'function')
					cases[newElem.nodeName]();
				else
					return false;
				
				for (var i in args) {
					if (i == 'cssClass')
						$(newElem).addClass(args[i]);	
					else if (args[i] != undefined)
						$(newElem).attr(i, args[i]);
				}
				return newElem;
			}
			// Method which deletes an element from the DOM
			DocumentState.prototype.deleteElement = function(elem) {
				var node = elem.cloneNode(true);
				$(elem)
					.add(this.elementHash.get(elem))  // Edits the 'state' document as well
					.empty()
					.remove();
				return node;
			}
			DocumentState.prototype.destroy = function(html) {
				var documentState = this;
				if (!this.saved) {
					if ($("#saveDocPopup").length == 0) {
						var popupContents = "<form><fieldset style=\"margin: 10px;\"><p>Save the current document?</p><input class=\"button\" id=\"saveDoc\" type=\"button\" value=\"yes\" /><input class=\"button\" id=\"noSaveDoc\" type=\"button\" value=\"no\" /></fieldset></form>";
							new ui.Popup({
								id: "saveDocPopup",
								content: popupContents,
								title: "Save Document",
								position: "average"
							});
							//$("#saveDocPopup").css("z-index", 50001);
							$("#saveDocPopup")
								.find("input")[0]
									.focus();
							document.getElementById("saveDoc").onclick = function() {
								if (documentState.editor) {
									documentState.editor.saveContent(function() {
										documentState.save(deleteState);
									});
								} else {
									documentState.save(deleteState);
								}
								$("#saveDocPopup").fadeOut('fast', function() { $(this).empty().remove(); });
							}
							document.getElementById("noSaveDoc").onclick = function() {
								deleteState();
								$("#saveDocPopup").fadeOut('fast', function() { $(this).empty().remove(); });
							}
					}
				} else
					deleteState();
				function deleteState() {
					if (documentState.preview) {			// If there's a preview window for this file, close it too
						documentState.preview.close();
						documentState.preview = null;
						documentState.$preview = null;
					}
					if (documentState.editor) {
						documentState.editor.codemirror.sourceEditor = null;
						$(documentState.editor.codemirror.wrapping).unbind().empty().remove();
						documentState.editor.menu.destroy();
						documentState.editor.destroy();
						documentState.editor = null;
						documentState.$editor = null;
					}
					var i = documentState.attributeEditors.length;
					while (i--)
						documentState.attributeEditors[i].close();
					documentState.attributeEditors = null;
					var i = documentState.inlineEditors.length;
					while (i--)
						documentState.inlineEditors[i].close();
					documentState.inlineEditors = null;
					documentState.winZindex = null;
					if (abstraction.activeState === documentState)
						abstraction.activeState = undefined;
					var i = abstraction.groupZindex.length;
					while (i--)
						if (abstraction.groupZindex[i] === documentState)
							abstraction.groupZindex.splice(i, 1);
					if (abstraction.contextMenu.target === documentState)
						abstraction.contextMenu.close();
					if (abstraction.sourceOutline.state === documentState)
						abstraction.sourceOutline.clear();
					abstraction.revisionManager.clear();
					abstraction.activePreview = undefined;
					abstraction.deleteFile(documentState.workingDoc);
					documentStates.remove(documentState.file);
				}
			}
			DocumentState.prototype.getDoctype = function(html) {
				var documentState = this,
					matchString = "",
					doctypeRegion = html.split("<html");
				doctypeRegion = doctypeRegion[0];
				match = doctypeRegion.indexOf("<!", 0);
				if (match != -1) {
					matchClose = doctypeRegion.indexOf(">", match);
					if (matchClose != -1) {
						matchClose += 1;	// Add the length of the php closing string
						
						//var preMatch = html.slice(0, match);
						//var postMatch = html.slice(matchClose);
						matchString = html.substring(match, matchClose);
					}
				}
				documentState.doctype = matchString;
			}
			// This function searches for inline PHP in the document and replaces it with html containing the php code as content
			DocumentState.prototype.getServerSideScripts = function(html) {
				var documentState = this,
					searchFor = [ "<?" ], // "<?php", "<?Php", "<?pHp", "<?phP", "<?PHp", "<?pHP", "<?PhP", "<?PHP",  these were taken out because <? covers all of them
					match, matchClose,
					i = searchFor.length;
				while (i--) {
					curPosition = 0;
					match = undefined;
					while (match != -1) {
						match = html.indexOf(searchFor[i], curPosition);
						if (match != -1) {
							matchClose = html.indexOf("?>", match);
							if (matchClose != -1) {
								matchClose += 3;	// Add the length of the php closing string
								
								var preMatch = html.slice(0, match);
								var postMatch = html.slice(matchClose);
								var matchString = html.substring(match, matchClose);
									documentState.php.push(matchString);
								curPosition = preMatch.length + matchString.length;
							} else
								curPosition = html.length;
						}
					}
				}
				
			}
			// Function which returns the full HTML of the current document
			DocumentState.prototype.html = function(format, file) {
				var documentState = this;
				
				// return the page html with &quot; replaced by actual single quotes (a fix for firefox)
				// also removes firebug div's from the html since they should not be part of the final site html
				//clearCacheControl();
				//return "<html>\r"+$("#absSiteIframe").contents().find('html').html().replace(/&quot;/g, "'").replace(/<div([\s\S]*?)firebugversion([\s\S]*?)_firebugConsole([\s\S]*?)\/div>/gi, "").replace(/[\s\S]absid="([\s\S]*?)"/gi, "")+"</html>";
				if (documentState.isHTML && !documentState.php.length && !abstraction.protectedMode) {
					//documentState.clearWorkingDocs();
					if (format == 'clean')
						var output = documentState.doctype+"\n<html>"+ $(documentState.doc.firstChild).cleanWhitespace().cleanMarkup().html().replace(/&quot;/g, "'").replace(/<div([\s\S]*?)firebugversion([\s\S]*?)_firebugConsole([\s\S]*?)\/div>/gi, "")+"\n</html>";
					else if (format == 'fast')
						var output = documentState.doctype+"<html>"+ $(documentState.doc.firstChild).html().replace(/&quot;/g, "'").replace(/<div([\s\S]*?)firebugversion([\s\S]*?)_firebugConsole([\s\S]*?)\/div>/gi, "")+"</html>";
					else
						var output = documentState.doctype+"<html>"+ $(documentState.doc.firstChild).cleanWhitespace().html().replace(/&quot;/g, "'").replace(/<div([\s\S]*?)firebugversion([\s\S]*?)_firebugConsole([\s\S]*?)\/div>/gi, "")+"</html>";
					//documentState.restoreWorkingDocs();
				} else
					var output = documentState.source;
				//updateCacheControl();
				return output;
			}
			DocumentState.prototype.linkAttributeEditor = function(attributeEditor) {
				var documentState = this;
				documentState.attributeEditors[documentState.attributeEditors.length] = attributeEditor;
			}
			DocumentState.prototype.linkDocumentPreview = function(documentPreview) {
				var documentState = this;
				documentState.load(documentPreview.file);
			}
			DocumentState.prototype.linkInlineEditor = function(inlineEditor) {
				var documentState = this;
				documentState.inlineEditors[documentState.inlineEditors.length] = inlineEditor;
			}
			DocumentState.prototype.linkSourceEditor = function(sourceEditor) {
				var documentState = this;
				documentState.editor = sourceEditor;
				documentState.$editor = documentState.editor.$;
			}
			// Method which loads a document into the 'state' object
			DocumentState.prototype.load = function(file) {
				var documentState = this,
					arr = file.split(abstraction.root);
				// Logic
				documentState.loaded = false;
				if (arr.length > 1)
					file = arr[1];
				arr = file.split("/");
				for (var i=0; i<arr.length-1; i++)
					if (arr[i] != "") {
						documentState.currentPath += arr[i]+"/";
						documentState.returnPath += "../";
					}
				//alert(documentState.currentPath+" "+documentState.returnPath);
				documentState.fileName = arr[arr.length-1];
				documentState.fileType = getFileType(documentState.fileName, 'file');
				if (documentState.fileType == "htm" || documentState.fileType == "html" || documentState.fileType == "php")
					documentState.isHTML = true;
				if (documentState.fileType == "css")
					documentState.isCSS = true;
				if (documentState.fileType == "js")
					documentState.isJS = true;
				if (documentState.fileType == "php")
					documentState.isPHP = true;
				arr = file.split("?");
				file = arr[0];
				if (file.charAt(0) != "/")
					file = "/"+file;
				if (documentState.currentDoc == undefined)  // If abstraction was just loaded...
					documentState.currentDoc = uncacheSafe(file.substr(1));
				else {
					documentState.lastDoc = documentState.currentDoc;
					documentState.currentDoc = uncacheSafe(file.substr(1));
					abstraction.saveUI();
				}
				documentStates.put(file, documentState);
				documentState.saved = true;
				documentState.file = file;
				documentState.lastWorkingDoc = documentState.workingDoc;
				documentState.lastPreviewDoc = documentState.previewDoc;
				documentState.workingDoc = '/'+documentState.currentPath+'abs-working-doc-'+documentState.fileName.replace(/-/gi, '-!@h@!-').replace(/\./gi, '-!@p@!-')+'.'+documentState.fileType;
				documentState.previewDoc = '/'+documentState.currentPath+'abs-preview-doc-'+documentState.fileName.replace(/-/gi, '-!@h@!-').replace(/\./gi, '-!@p@!-')+'.'+documentState.fileType;
				abstraction.getFileContents(file, function(source) {
					documentState.getServerSideScripts(source);  // Finds any server side scripts (only PhP atm) in the html and adds some new variables
					documentState.getDoctype(source);			   // Finds and stores the doctype of the document
					documentState.source = source;
					abstraction.setFileContents(encodeURIComponent(documentState.workingDoc), source, function() { documentState.update(); });
				});
			}
			// Safe way of passing code to the documentState that you want to execute only after it has finished loading
			DocumentState.prototype.onload = function(callback) {
				var documentState = this;
				// Logic
				if (documentState.loaded)  // If the state is already finished loading, execute the callback immediately
					callback();
				else
					documentState.loadQueue[documentState.loadQueue.length] = callback;
			}
			// Method which makes an element draggable or sets it to passed in coordinates
			DocumentState.prototype.positionElem = function(elem, pos, dest, callback) {  // THIS NEEDS TO BE REWRITTEN            <---------------------------------------
				var documentState = this;
				if (dest == undefined) {
					$(elem)
						.add(documentState.elementHash.get(elem))  // Edits the 'state' document as well
						.css({
							position: pos
						});
					$(elem)
						.addClass("abs-ui-draggable")
						.draggable({
							//drag: function() {
							//	parent.editor.updateEditors();
							//},
							stop: function() {
								$(documentState.elementHash.get(elem))
									.css({
										left: $(elem).css("left"),
										top: $(elem).css("top")
									})
								$(elem).removeClass("abs-ui-draggable");
								if (typeof callback == 'function')
									callback();
							}
						});
					//draggableElements.push(elem);
				} else
					$(elem)
						.add(documentState.elementHash.get(elem))  // Edits the 'state' document as well
						.css({
							position: pos,
							left: dest.left,
							top: dest.top
						});

			}
			DocumentState.prototype.pre = function(dom, _parent) {
				var documentState = this;
				var elem = dom.cloneNode(false);	// This is a copy of the entire DOM starting with the HTML element
				$(_parent).prepend(elem);        // which is now appended to the 'state' documentFragment
				documentState.elementHash.put(dom, elem);
				documentState.elementHash.put(elem, dom);
				this.prependChildren(dom, elem);
			}
			DocumentState.prototype.prependChildren = function(dom, _parent) {
				var documentState = this;
				traverseDOM(dom, _parent);
				function traverseDOM(dom, _parent) {
					for (var i=0; i<dom.childNodes.length; i++) {
						var elem = dom.childNodes[i].cloneNode(false);
						$(_parent).prepend(elem);  
						documentState.elementHash.put(dom.childNodes[i], elem);
						documentState.elementHash.put(elem, dom.childNodes[i]);
						if (dom.childNodes.length > 0)
							traverseDOM(dom.childNodes[i], elem);
					}
				}
			}
			DocumentState.prototype.replace = function(dom, _dom) {
				var documentState = this;
				var elem = dom.cloneNode(false);	// This is a copy of the entire DOM starting with the HTML element
				$(_dom).replaceWith(elem);        // which is now appended to the 'state' documentFragment
				documentState.elementHash.put(dom, elem);
				documentState.elementHash.put(elem, dom);
				this.replaceChildren(dom, elem);
			}
			DocumentState.prototype.replaceChildren = function(dom, _parent) {
				var documentState = this;
				traverseDOM(dom, _parent);
				function traverseDOM(dom, _parent) {
					for (var i=0; i<dom.childNodes.length; i++) {
						var elem = dom.childNodes[i].cloneNode(false);
						$(_parent).append(elem);  
						documentState.elementHash.put(dom.childNodes[i], elem);
						documentState.elementHash.put(elem, dom.childNodes[i]);
						if (dom.childNodes.length > 0)
							traverseDOM(dom.childNodes[i], elem);
					}
				}
			}
			DocumentState.prototype.replaceElements = function(dom, _parent) {
				var documentState = this;
				$(_parent).empty();
				this.appendChildren(dom, _parent);
			}
			// Method which saves the working document
			DocumentState.prototype.save = function(callback) {
				var documentState = this,
					content = documentState.html('clean');
				abstraction.setFileContents(documentState.file, content, function() {
					documentState.saved = true;
					documentState.saveRevision(documentState.file, content);
					if (typeof callback == 'function')
						callback();
				});
			}
			DocumentState.prototype.saveRevision = function(url, content, path) {
				if (path == undefined)
					path = "";
				url = url.substr(1).replace(/-/gi, '-!@h@!-').replace(/\//gi, '-!@s@!-').replace(/\./gi, '-!@p@!-');
				var query = "fn=revset&url="+url+"&content="+encodeURIComponent(content)+"&path="+path;
				
				abstraction.createDir('/backups/'+url, function() {
					$.ajax({
						type: "POST",
						url: "abstraction/core/scripts/php/files.php",
						data: query,
						success: function(data) {
							if (data == "Warning: You must be logged in to edit files.")
								abstraction.restoreSession();
							else {
								abstraction.revisionManager.curRevision = '';
								abstraction.revisionManager.update();
							}
						}
					});
				});
			}
			// Method which sets the source of an image element by allowing an image to be uploaded
			DocumentState.prototype.setImage = function(elem) {
				var documentState = this;
				if ($("#select_image_popup").length == 0) {
					// Set the contents of what will appear in the Select Image window
					var popupContents = "<form id=\"image_upload_form\" method=\"post\" enctype=\"multipart/form-data\" action=\"abstraction/core/scripts/php/upload.php?path=/styles/uploads/\" style=\"margin: 10px;\"><fieldset><label for=\"upload_image\">Select Image to Upload:</label><input class=\"text_input\" name=\"upload_image\" id=\"upload_image\" type=\"file\" /><input class=\"button\" name=\"insert_image_submit\" type=\"submit\" value=\"submit\" /></fieldset><iframe id=\"upload_iframe\" name=\"upload_iframe\" src=\"\" style=\"width: 100%; height: 40px; border: 0px solid #fff; margin: 0;\"></iframe></form>";	
					// Use the createPopup method to display a window where the user may select an image from their HD
					new ui.Popup({
						id: "select_image_popup",
						content: popupContents,
						title: "Select an Image",
						position: "average"
					});
					// When the upload form is submitted, submit to the upload iframe to retrieve the image from the server
					document.getElementById("image_upload_form").onsubmit = function() {	
						document.getElementById("image_upload_form").target = "upload_iframe";
						document.getElementById("upload_iframe").onload = insertUploadedImage;	
					}
					// Insert the uploaded image into the DOM element
					function insertUploadedImage() {
						documentState.execute({
							fn: 'setImage',
							elem: elem,
							img: documentState.returnPath+$("#upload_iframe").get(0).contentDocument.body.innerHTML
						});
						$("#select_image_popup").fadeOut('fast', function() { $(this).empty().remove(); });
					}
				}
			}
			DocumentState.prototype.setZindex = function() {
				var i = abstraction.groupZindex.length;
				while (i--)
					if (abstraction.groupZindex[i] === this) {
						abstraction.groupZindex.splice(i, 1);
					}
				abstraction.groupZindex[abstraction.groupZindex.length] = this;
			}
			DocumentState.prototype.update = function(callback) {
				var documentState = this,
					previewExists = true,
					frameScroll = 0;
				if (documentState.isHTML) {
					var i = this.attributeEditors.length;
					while (i--)
						this.attributeEditors[i].close();
					this.attributeEditors = [];
					if (abstraction.sourceOutline.file == documentState.file)
						abstraction.sourceOutline.$handle.find('.open-menu').css('background', 'transparent url(abstraction/core/styles/images/ajax-loader.gif) no-repeat center');
					if (documentPreviews.get(documentState.file) == undefined) {
						documentState.$frame = $("<iframe/>")
							.css("display", 'none')
							.appendTo(document.body);
						previewExists = false;
					} else {
						documentState.preview = documentPreviews.get(documentState.file);
						documentState.$preview = documentState.preview.$;
						documentState.$frame = documentState.preview.$frame;
						$(documentState.preview.frame.contentWindow.document).unbind();
						frameScroll = documentState.preview.frame.contentWindow.document.body.scrollTop || documentState.preview.frame.contentWindow.document.documentElement.scrollTop;
						documentState.preview.$handle.find('.open-menu').css('background', 'transparent url(abstraction/core/styles/images/ajax-loader.gif) no-repeat center');
					}
					documentState.frame = documentState.$frame
						.bind('load.once', function() {
							documentState.elementHash.clear();
							var dom = documentState.$frame.get(0).contentWindow.document.documentElement,
								elem = dom.cloneNode(false),							// This is a copy of the entire DOM starting with the HTML element
								l;
							documentState.doc = document.createDocumentFragment();		// This is a snapshot of the current state of the document, as it will be served by the server
							documentState.doc.appendChild(elem);  
							documentState.elementHash.put(dom, elem);      		// which is now appended to the 'state' documentFragment
							documentState.elementHash.put(elem, dom);
							documentState.appendChildren(dom, elem);
							if (previewExists)
								documentState.$frame.unbind('load.once');
							else
								documentState.$frame
									.unbind('load.once')
									.remove();  // destroy the iframe when we are done loading from it
							documentState.loaded = true;
							if (abstraction.sourceOutline.file == documentState.file)
								abstraction.sourceOutline.update();
							if (documentState.preview) {
								documentState.preview.bindContextMenu();
								documentState.preview.bindInternalLinks();
								documentState.preview.bindWorkingDocs();
								documentState.preview.$handle.find('.open-menu').css('background', '');
								
								$(documentState.preview.frame.contentWindow.document).find('html,body').scrollTop(frameScroll);
							}
							//documentState.bindWorkingDocs();
							l = documentState.loadQueue.length;
							for (var i=0; i<l; i++) {
								documentState.loadQueue[i]();
							}
							documentState.loadQueue = [];
							if (typeof callback == 'function')
								callback();
						})
						.attr("src", ".."+cacheSafePath(documentState.workingDoc))
						.get(0);
				} else {
					documentState.elementHash.clear();
					//if (documentState.isCSS || documentState.isJS) {
					//	documentPreviews.each(function(key, value) {
					//		if (documentPreviews.get(key).workingDocs
					//	});
					//}
					documentState.loaded = true;
					//if (abstraction.sourceOutline.file == documentState.file)
					//	abstraction.sourceOutline.update();
					l = documentState.loadQueue.length;
					for (var i=0; i<l; i++) {
						documentState.loadQueue[i]();
					}
					documentState.loadQueue = [];
					if (typeof callback == 'function')
						callback();
				}
			}
			// This function calls other abstraction functions in a way that allows the data to be added to the history clipboard for undo,
			//		as well as allows it to be transported across the network to other collaborative authors of the document
			DocumentState.prototype.execute = function(args, callback, postUpdate) {
				var documentState = this;
				switch (args.fn) {
					case "toggleAdmin":
						$(args.elem)
							.add(documentState.elementHash.get(args.elem))  // Edits the 'state' document as well
							.toggleClass("abs-administrable-element");
						documentState.history.push(args);
						if (abstraction.sourceOutline.file == documentState.file)
							abstraction.sourceOutline.update();
						if (documentState.editor !== undefined)
							documentState.editor.update();
						break;
					case "createElem":
						//args.state = document.createDocumentFragment();
						args.elem = documentState.createElement(args.elem, args.parent);       // Replace the 'elem' variable with an actual pointer to the new element
						//args.state.appendChild(args.parent.cloneNode(true));  // Add the entire contents of the parent to the 'state' argument
						documentState.history.push(args);
						if (abstraction.sourceOutline.file == documentState.file)
							abstraction.sourceOutline.update();
						if (documentState.editor !== undefined)
							documentState.editor.update();
						break;
					case "pasteElem":
						var newElem = $(args.elem).clone().get(0);
						$(args.dest).append(newElem);
						documentState.add(newElem, documentState.elementHash.get(args.dest));
						args.elem = newElem;
						documentState.history.push(args);
						if (abstraction.sourceOutline.file == documentState.file)
							abstraction.sourceOutline.update();
						if (documentState.editor !== undefined)
							documentState.editor.update();
						break;
					case "deleteElem":
						args.parent = $(args.elem).parent().get(0);
						args.parentClone = $(args.elem).parent().get(0).cloneNode(true);
						/*
						args.attr = {
							id: args.elem.id,
							cssClass: args.elem.cssClass,
							name: args.elem.name,
							src: args.elem.src,
							style: $(args.elem).attr("style")
						};
						args.children = $(args.elem).children().clone();
						*/
						args.elem = documentState.deleteElement(args.elem);  // Replace the 'elem' variable with an actual pointer to the new element
						documentState.history.push(args);
						if (abstraction.sourceOutline.file == documentState.file)
							abstraction.sourceOutline.update();
						if (documentState.editor !== undefined)
							documentState.editor.update();
						break;
					case "posElem":
						args.dest = $(args.elem).position();

						documentState.history.push(args);
						documentState.positionElem(args.elem, args.pos, undefined, function() {
							if (documentState.editor !== undefined)
								documentState.editor.update();
							//args.dest = $(args.elem).position();
							//alert(args.dest.left+" "+args.dest.top);
							//histClipboard.push(args);
						});
						break;
					case "resizeElem":
						args.dest = { width: $(args.elem).width(), height: $(args.elem).height() };
						documentState.history.push(args);
						resizeElem(args.elem, undefined, function() {
							if (documentState.editor !== undefined)
								documentState.editor.update();
							//args.dest = $(args.elem).position();
							//alert(args.dest.left+" "+args.dest.top);
							//histClipboard.push(args);
						});
						break;
					case "setImage":
						var oldImg = args.elem.src;
						args.elem.src = args.img;
						documentState.elementHash.get(args.elem).src = args.img;
						args.img = oldImg;
						documentState.history.push(args);
						if (abstraction.sourceOutline.file == documentState.file)
							abstraction.sourceOutline.update();
						if (documentState.editor !== undefined)
							documentState.editor.update();
						break;
					case "editText":
						args.html = args.elem.innerHTML;
						documentState.history.push(args);
						
						args.elem.innerHTML = args.editor.body.innerHTML;
						$(args.elem).find('*').css('visibility', 'inherit');  // PLEASE REVIEW THIS AND FIND A GOOD WAY TO RESTORE VISIBILITY TO ITS TRULY ORIGINAL STATE, NOT JUST INHERIT
						documentState.replaceElements(args.elem, documentState.elementHash.get(args.elem));
						//elemHash.get(args.elem).innerHTML = args.editor.body.innerHTML;
						$(args.frame)
							.css({
								width: $(args.elem).outerWidth(),
								height: $(args.elem).outerHeight()
							});
						if (abstraction.sourceOutline.file == documentState.file)
							abstraction.sourceOutline.update();
						if (documentState.editor !== undefined)
							documentState.editor.update();
						break;
					case "editInnerHTML":
						var phpBool = false;
						documentState.history.push(args);
						$(args.elem)
							//.add(elemHash.get(args.elem))
							.html(args.editor.getCode());
							documentState.replaceElements(args.elem, documentState.elementHash.get(args.elem));
						if (abstraction.sourceOutline.file == documentState.file)
							abstraction.sourceOutline.update();
						if (documentState.editor !== undefined)
							documentState.editor.update();
						break;
					case "editInlineStyles":
						documentState.history.push(args);
						$(args.elem)
							.add(documentState.elementHash.get(args.elem))
							.attr("style", args.editor.getCode().replace(/\r/gi, ""));
						//state.replaceElements(args.elem, elemHash.get(args.elem));
						if (documentState.editor !== undefined)
							documentState.editor.update();
						break;
					case "editAttribute":
						var oldElem = documentState.elementHash.get(args.elem);
						args.oldContent = $(args.elem).attr(args.attribute);
						documentState.history.push(args);
						//alert(oldElem.href+" "+args.elem.href);
						$(args.elem)
							.add(documentState.elementHash.get(args.elem))
							.attr(args.attribute, args.content.replace(/\r/gi, ""));
						//	oldElem.css("border", "10px solid black");
						//alert(oldElem+" "+args.elem+" "+(elemHash.get(old3lem)===elemHash.get(args.elem)));
						documentState.elementHash.put(args.elem, oldElem);
						//$(elemHash.get(oldElem)).replaceWith(elemHash.get(args.elem));
						if (abstraction.sourceOutline.file == documentState.file)
							abstraction.sourceOutline.update();
						if (documentState.editor !== undefined)
							documentState.editor.update();
						break;
					case "editSource":
						documentState.history.push(args);
						documentState.source = args.editor.getCode();
						abstraction.setFileContents(documentState.workingDoc, documentState.source, function(data) {
							switch (getFileType(args.file)){
								case "js":
									//$.getScript(args.file);
									if (typeof postUpdate == 'function')
										postUpdate();
									break;
									
								case "css":
									//var stylesheets = window.frames["absSiteIframe"].document.getElementsByTagName('link');
									//for (var i=0; i<stylesheets.length; i++) {
									//	stylesheets[i].href = cacheSafePath(uncacheSafe(stylesheets[i].href));
									//}
									documentState.update(postUpdate);
									break;
									
								default:
									//setDocumentSource("/"+public.currentDoc);
									//$("#absSiteIframe").attr("src", "../"+public.currentDoc);
									documentState.update(postUpdate);
									break;
							}
							if (typeof callback == 'function')
								callback();
						});
						//updateInternalUI();
						break;
				}
				this.saved = false;
				// Update the overview to reflect DOM changes
			}
			DocumentState.prototype.undo = function(args, callback) {
				var documentState = this;
				switch (args.fn) {
					case "toggleAdmin":
						$(args.elem)
							.add(documentState.elementHash.get(args.elem))  // Edits the 'state' document as well
							.toggleClass("abs-administrable-element");
						if (abstraction.sourceOutline.file == documentState.file)
							abstraction.sourceOutline.update();
						if (documentState.editor !== undefined)
							documentState.editor.update();
						break;
					case "createElem": 
					case "pasteElem":
						deleteElem(args.elem);
						//args.parent.innerHTML(args.parent, args.state);
						if (abstraction.sourceOutline.file == documentState.file)
							abstraction.sourceOutline.update();
						if (documentState.editor !== undefined)
							documentState.editor.update();
						break;
					case "deleteElem":
						//$(createElem(args.elem, args.parent, args.attr))
						//	.add(elemHash.get(args.elem))  // Edits the 'state' document as well
						//	.html(args.children);
						$(args.parent)
							//.add(elemHash.get(args.parent))  // Edits the 'state' document as well
							.replaceWith(args.parentClone);
						documentState.replace(args.parentClone, documentState.elementHash.get(args.parent));
						if (abstraction.sourceOutline.file == documentState.file)
							abstraction.sourceOutline.update();
						if (documentState.editor !== undefined)
							documentState.editor.update();
						break;
					case "posElem":
						documentState.positionElem(args.elem, args.pos, args.dest, documentState.updateEditors);
						if (documentState.editor !== undefined)
							documentState.editor.update();
						break;
					case "resizeElem":
						resizeElem(args.elem, args.dest, documentState.updateEditors);
						if (documentState.editor !== undefined)
							documentState.editor.update();
						break;
					case "setImage":
						args.elem.src = args.img;
						documentState.elementHash.get(args.elem).src = args.img;
						if (abstraction.sourceOutline.file == documentState.file)
							abstraction.sourceOutline.update();
						if (documentState.editor !== undefined)
							documentState.editor.update();
						break;
					case "editText":
						args.elem.innerHTML = args.html;
						//elemHash.get(args.elem).innerHTML = args.html;
						args.editor.body.innerHTML = args.html;
						documentState.replaceElements(args.elem, documentState.elementHash.get(args.elem));
						$(args.frame)
							.css({
								width: $(args.elem).width(),
								height: $(args.elem).height()
							});
						if (abstraction.sourceOutline.file == documentState.file)
							abstraction.sourceOutline.update();
						if (documentState.editor !== undefined)
							documentState.editor.update();
						break;
					case "editInlineStyles":
						var oldElem = documentState.elementHash.get(args.elem);	
						if (args.win.style.display != 'none')
							args.editor.setCode(args.content);
						$(args.elem)
							.add(documentState.elementHash.get(args.elem))
							.attr("style", args.content.replace(/\r/gi, ""));
						documentState.elementHash.put(args.elem, oldElem);
						//state.replaceElements(args.elem, elemHash.get(args.elem));
						args.setContent();
						if (documentState.editor !== undefined)
							documentState.editor.update();
						break;
					case "editAttribute":
						$(args.elem)
							.add(documentState.elementHash.get(args.elem))
							.attr(args.attribute, args.oldContent.replace(/\r/gi, ""));
						//state.replaceElements(args.elem, elemHash.get(args.elem));
						if (abstraction.sourceOutline.file == documentState.file)
							abstraction.sourceOutline.update();
						if (documentState.editor !== undefined)
							documentState.editor.update();
						break;
					case "editInnerHTML":
						if (args.win.style.display != 'none')
							args.editor.setCode(args.content);
						$(args.elem)
							//.add(elemHash.get(args.elem))
							.html(phpDecode(args.content, absRawHTML()));
						documentState.replaceElements(args.elem, documentState.elementHash.get(args.elem));
						args.setContent();
						if (abstraction.sourceOutline.file == documentState.file)
							abstraction.sourceOutline.update();
						if (documentState.editor !== undefined)
							documentState.editor.update();
						break;
					case "editSource":
						if (args.win.style.display != 'none')
							args.editor.setCode(args.content);
						documentState.source = args.content;
						abstraction.setFileContents(documentState.workingDoc, args.content, refreshDoc);
						args.setContent(args.content);
						
						// Refresh the current document after making file changes to reflect the current contents
						function refreshDoc(data) {
							//$("#absSiteIframe").attr("src", "../"+public.currentDoc);
							switch (getFileType(args.file)) {
								case "js":
									// PLEASE REVIEW THE WISDOM OF FORCING THE SCRIPTS TO RELOAD EVERY EDIT, THIS IS PROBABLY A HORRIBLE IDEA IN GENERAL :(
									// At least I know it's possible to do now though is needed
									//$.getScript(cacheSafePath(args.file));
									break;
									
								case "css":
									//var stylesheets = window.frames["absSiteIframe"].document.getElementsByTagName('link');
									//for (var i=0; i<stylesheets.length; i++) {
									//	stylesheets[i].href = cacheSafePath(uncacheSafe(stylesheets[i].href));
									//}
									documentState.update();
									break;
									
								default:
									//setDocumentSource("/"+public.currentDoc);
									//$("#absSiteIframe").attr("src", "../"+public.currentDoc);
									documentState.update();
									break;
							}
						}
						break;
				}
				this.saved = false;
				// Update the overview to reflect DOM changes
			}
			// Method which ensures that loaded stylesheets will be current and not cached versions
			DocumentState.prototype.updateCacheControl = function() {
				var documentState = this,
					i, a;
				for (i = 0; (a = documentState.$frame.get(0).contentWindow.document.getElementsByTagName("link")[i]); i++ ) {
					//a.disabled = true;
					//var corehref = a.href.split("?refresh");
					//a.href = corehref[0]+"?refresh"+Math.floor(Math.random()*10001);
					//a.disabled = false;
					a.href = cacheSafePath(uncacheSafe(a.href)); // refresh all cache control strings
				}
				for (i = 0; (a = documentState.$frame.get(0).contentWindow.document.getElementsByTagName("script")[i]); i++ ) {
					//a.disabled = true;
					//var corehref = a.href.split("?refresh");
					//a.href = corehref[0]+"?refresh"+Math.floor(Math.random()*10001);
					//a.disabled = false;
					if (a.src != "")
						a.src = cacheSafePath(uncacheSafe(a.src)); // refresh all cache control strings
				}
			}
			// Adds the abstraction context menu to elements in the working document
			DocumentState.prototype.updateInternalUI = function() {
				var documentState = this;
				//window.frames["absSiteIframe"].cleanUp();
				//window.frames["absSiteIframe"].setUI();
				//overview.update();
			}
			return DocumentState;
		})();
		
		var FileManager = (function() {
			FileManager.Inherits(ui.Window);
			function FileManager(taskbars, parent) {
				if (parent == undefined) parent = abstraction.desktop;

				var fileManager = this,
					menuTimer, submenuTimer;
				fileManager.curDir = "/";  		// Current working directory of the file manager, what show's up in the window
				fileManager.directories = {};	// List of all cached directories
				fileManager.name = "fileManager";
				fileManager.menuClosed = true;
				fileManager.preview = true;
				fileManager.clipboard = [];
				fileManager.selection = [];
				fileManager.clickTimer;
				fileManager.clickedOnce = false;
				
				fileManager.window = $("<div/>")  // This is the window wrapper
					.attr('id', "absFileManager")
					.addClass("window abs-ui")
					.appendTo(parent)
					.get(0);
				fileManager.$wrapper = $("<div/>")
					.attr('id', "absFileManagerWrapper")
					.addClass("content abs-ui")
					.click(function() {
						fileManager.$wrapper.find('.abs-fileManager-selectedFile').removeClass('abs-fileManager-selectedFile');
						fileManager.selection = [];
					})
					.appendTo(fileManager.window);
				fileManager.wrapper = fileManager.$wrapper.get(0);
				var menu = new ui.Menu({
					newFile: {
						content: '<span class="abs-menu-newFile"></span>New File'
						//click: c_newFile
					},
					newFolder: {
						content: '<span class="abs-menu-newDir"></span>New Folder'
					//	click: c_newDirectory
					},
					upload: {
						content: '<span class="abs-menu-upload"></span>Upload'
					//	click: c_uploadFile
					},
					close: {
						content: '<span class="abs-menu-delete"></span>Close',
						click: function() { fileManager.close(); }
					},
					insert: "<hr />",
					options: {
						content: '<span class="abs-menu-options"></span>Options',
						mouseover: function() {
							var submenu = $(this).children(".ui-submenu");
							clearTimeout(submenuTimer);
							submenu.css('display', 'block');
							if (submenu.offset().top+submenu.outerHeight() > $window.height()) {
								submenu
									.css({
										"top": submenu.position().top - ((submenu.offset().top+submenu.outerHeight())-$window.height())
									});
							}
							submenu
								.css({
									"left": $(this).parent().width()
								});
						},
						mouseout: function() {
							var menuItem = this;
							submenuTimer = setTimeout(function() {
								$(menuItem).children(".ui-submenu").fadeOut("fast");
								menuItem = null;
							}, 500);
						},
						children: {
							previewToggle: {
								content: function() {
									return fileManager.preview ? "<span class='abs-menu-check'></span>preview" : "<span class='abs-menu-blank'></span>preview"
								},
								click: function() {
									fileManager.preview = !fileManager.preview;
									if (fileManager.preview)
										$(this).find('span').attr("class", "abs-menu-check");
									else
										$(this).find('span').attr("class", "abs-menu-blank");
									fileManager.update();
									abstraction.saveUI();
								}
							}
						}
					}
				});
				menu.$
					.addClass("window-menu")
					.mouseenter(function() {
							clearTimeout(menuTimer)
					})
					.mouseleave(function() {
						menuTimer = setTimeout(function() {
							fileManager.$menu.hide();
							fileManager.menuClosed = true;
						}, 500);
					});
				
				fileManager.options({
					selector: fileManager.window,
					title: "<div class='abs-fileManager-icon'></div>File Manager",
					taskbar: taskbars,
					top: 20,
					dragstop: fileManager.saveUI,
					resizestop: fileManager.saveUI,
					minimize: fileManager.saveUI,
					unminimize: fileManager.saveUI,
					maximize: false,
					menu: menu,
					openmenu: fileManager.toggleMenu,
					focus: fileManager.onfocus
				});
				fileManager.update();
				fileManager.focus();
			}
			FileManager.prototype.bindContextMenu = function() {
				var fileManager = this;
				fileManager.$wrapper.bind('contextmenu', fileManager.oncontextmenu);
			}
			FileManager.prototype.click = function(clickedUI) {
				var fileManager = this,
					$clickedUI = $(clickedUI);
					
				if (!ui.input.ctrl && !ui.input.shift) {
					fileManager.$wrapper.find('.abs-fileManager-selectedFile').removeClass('abs-fileManager-selectedFile');
					fileManager.selection = [];
					$clickedUI.addClass('abs-fileManager-selectedFile');
					fileManager.selection[fileManager.selection.length] = clickedUI.id;
				}
			}
			FileManager.prototype.singleclick = function(clickedUI) {
				var fileManager = this,
					$clickedUI = $(clickedUI);
					
				if (ui.input.ctrl || ui.input.shift) {
					if ($clickedUI.hasClass('abs-fileManager-selectedFile')) {
						$clickedUI.removeClass('abs-fileManager-selectedFile');
						var i = fileManager.selection.length;
						while (i--)
							if (fileManager.selection[i] == clickedUI.id)
								fileManager.selection.splice(i,1);
					} else {
						$clickedUI.addClass('abs-fileManager-selectedFile');
						fileManager.selection[fileManager.selection.length] = clickedUI.id;
					}
				}
			}
			FileManager.prototype.dblclickDirectory = function(clickedUI) {
				var fileManager = this,
					$clickedUI = $(clickedUI),
					newDir = $clickedUI.attr("id").split(':')[0]+"/",
					newParent = $clickedUI.next();
					newParent.css("display", 'none');
				fileManager.$handle.find('.open-menu').css('background', 'transparent url(abstraction/core/styles/images/ajax-loader.gif) no-repeat center');
				fileManager.loadDirectory(newDir, newParent, function() {
					$clickedUI
						.unbind("click")
						.click( function(e) {
							e = window.event || e;    // window.event is for IE
							if (e.stopPropagation)
								e.stopPropagation();  // Standards complient browsers
							else
								e.cancelBubble=true;  // IE
							var clickedUI = this;
							if (fileManager.clickedOnce) {
								fileManager.clickedOnce = false;
								clearTimeout(fileManager.clickTimer);
								fileManager.dblclickLoadedDirectory(clickedUI);
							} else {
								fileManager.clickedOnce = true;
								fileManager.click(clickedUI);
								fileManager.clickTimer = setTimeout(function() {
									fileManager.clickedOnce = false;
									fileManager.singleclick(clickedUI);
								}, 200);
							}
							$("#absContextMenu").fadeOut("fast");
						});
					$clickedUI.find(".abs-toggle")
						.attr("src", "abstraction/core/styles/images/hidechildren.png");
					newParent
						.slideDown('fast');
					fileManager.directories[newDir] = true;
					fileManager.$handle.find('.open-menu').css('background', '');
					$clickedUI = null;
					newDir = null;		// Garbage collect
					newParent = null;
				});
				fileManager.$wrapper.find('.abs-fileManager-selectedFile').removeClass('abs-fileManager-selectedFile');
				fileManager.selection = [];
			}
			FileManager.prototype.dblclickLoadedDirectory = function(clickedUI) {
				var fileManager = this,
					$clickedUI = $(clickedUI),
					newDir = $clickedUI.attr("id").split(':')[0]+"/";
				if ($clickedUI.next().css("display") == "none") {
					$clickedUI.next().slideDown('fast');
					$clickedUI.find(".abs-toggle").attr("src", "abstraction/core/styles/images/hidechildren.png");
					fileManager.directories[newDir] = true;
				} else {
					$clickedUI.next().slideUp('fast');
					$clickedUI.find(".abs-toggle").attr("src", "abstraction/core/styles/images/showchildren.png");
					fileManager.directories[newDir] = false;
				}
				fileManager.$wrapper.find('.abs-fileManager-selectedFile').removeClass('abs-fileManager-selectedFile');
				fileManager.selection = [];
			}
			FileManager.prototype.dblclickArchive = function(clickedUI) {
				fileManager.$wrapper.find('.abs-fileManager-selectedFile').removeClass('abs-fileManager-selectedFile');
				fileManager.selection = [];
			}
			FileManager.prototype.dblclickAudio = function(clickedUI) {
				fileManager.$wrapper.find('.abs-fileManager-selectedFile').removeClass('abs-fileManager-selectedFile');
				fileManager.selection = [];
			}
			FileManager.prototype.dblclickFile = function(clickedUI) {
				var fileManager = this,
					$clickedUI = $(clickedUI),
					file = $clickedUI.attr("id").split(':')[0],
					noQuery = file.split('?')[0],
					sourceEditor = sourceEditors.get(noQuery);
				if (sourceEditor == undefined)
					new SourceEditor(file, abstraction.taskbar);
				else
					sourceEditor.focus();
				fileManager.$wrapper.find('.abs-fileManager-selectedFile').removeClass('abs-fileManager-selectedFile');
				fileManager.selection = [];
			}
			FileManager.prototype.dblclickFlash = function(clickedUI) {
				fileManager.$wrapper.find('.abs-fileManager-selectedFile').removeClass('abs-fileManager-selectedFile');
				fileManager.selection = [];
			}
			FileManager.prototype.dblclickHTML = function(clickedUI) {
				var fileManager = this,
					$clickedUI = $(clickedUI),
					file = $clickedUI.attr("id").split(':')[0],
					noQuery = file.split('?')[0],
					documentPreview = documentPreviews.get(noQuery),
					sourceEditor = sourceEditors.get(noQuery);
					alert(file);
				if (documentPreview == undefined)
					new DocumentPreview(file, abstraction.taskbar);
				else
					documentPreview.focus();
				if (sourceEditor == undefined)
					new SourceEditor(file, abstraction.taskbar);
				else
					sourceEditor.focus();
				fileManager.$wrapper.find('.abs-fileManager-selectedFile').removeClass('abs-fileManager-selectedFile');
				fileManager.selection = [];
			}
			FileManager.prototype.dblclickImage = function(clickedUI) {
				fileManager.$wrapper.find('.abs-fileManager-selectedFile').removeClass('abs-fileManager-selectedFile');
				fileManager.selection = [];
			}
			FileManager.prototype.dblclickVideo = function(clickedUI) {
				fileManager.$wrapper.find('.abs-fileManager-selectedFile').removeClass('abs-fileManager-selectedFile');
				fileManager.selection = [];
			}
			FileManager.prototype.generateFileItem = function(dir, filename, filetype, parent) {
				var fileManager = this,
					fmDivClass = "abs-fileManager-div";
				if (parent.hasClass("abs-fileManager-div"))
					fmDivClass = "abs-fileManager-alt";
				if (filename != "." && filename != ".." && filename != 'builder' && filename != 'admin' && filename != 'cms' && filename.slice(0, 16) != 'abs-working-doc-') {
					var fmElem = $("<div/>")
						.attr('id', dir+filename+':'+filetype)
						.addClass(fmDivClass)
						.html(filename)
						.appendTo(parent);
	/*
					fmElem.get(0).oncontextmenu = function(e) {
						e = window.event || e;    // window.event is for IE
						if (e.stopPropagation)
							e.stopPropagation();  // Standards complient browsers
						else
							e.cancelBubble=true;  // IE
						public.openFileMenu(e, $(this).attr("id")); return false;
					}
					*/
					var fileType = getFileType(filename, filetype);
					switch (fileType) {
						case "dir":
							var thisDir = dir+filename+"/";
						
							var childWrapper = $("<div/>")
									.attr("class", "abs-child-wrapper "+fmDivClass)
									.css("display", "none")
									.css("padding-left", 10)
									.appendTo(parent);
							
							var childToggle = $("<img/>");
								childToggle.addClass("abs-toggle");
									
							fmElem
								//.css("padding-left", (depth-1)*10)
								.prepend("<span class='directory'></span>");
								
							if (fileManager.directories[thisDir] == true) {
								childToggle
									.attr("src", "abstraction/core/styles/images/hidechildren.png")
									.prependTo(fmElem);
								fmElem.click( function(e) {
									e = window.event || e;    // window.event is for IE
									if (e.stopPropagation)
										e.stopPropagation();  // Standards complient browsers
									else
										e.cancelBubble=true;  // IE
									var clickedUI = this;
									if (fileManager.clickedOnce) {
										fileManager.clickedOnce = false;
										clearTimeout(fileManager.clickTimer);
										fileManager.dblclickLoadedDirectory(clickedUI);
									} else {
										fileManager.clickedOnce = true;
										fileManager.click(clickedUI);
										fileManager.clickTimer = setTimeout(function() {
											fileManager.clickedOnce = false;
											fileManager.singleclick(clickedUI);
										}, 200);
									}
									$("#absContextMenu").fadeOut("fast");
								});
								fileManager.loadDirectory(thisDir, childWrapper);
							} else {
								childToggle
									.attr("src", "abstraction/core/styles/images/showchildren.png")
									.prependTo(fmElem);
								fmElem
									.click( function(e) {
										e = window.event || e;    // window.event is for IE
										if (e.stopPropagation)
											e.stopPropagation();  // Standards complient browsers
										else
											e.cancelBubble=true;  // IE
										var clickedUI = this;
										if (fileManager.clickedOnce) {
											fileManager.clickedOnce = false;
											clearTimeout(fileManager.clickTimer);
											fileManager.dblclickDirectory(clickedUI);
										} else {
											fileManager.clickedOnce = true;
											fileManager.click(clickedUI);
											fileManager.clickTimer = setTimeout(function() {
												fileManager.clickedOnce = false;
												fileManager.singleclick(clickedUI);
											}, 200);
										}
										$("#absContextMenu").fadeOut("fast");
									});
							}	
							
							childWrapper = null;	// Garbage collect
							childToggle = null;
							break;
						
						case "zip": case "rar": case "7z":
							var thisDir = dir+filename+"/";
							fmElem
								.css("padding-left", 10)
								.click( function(e) {
									e = window.event || e;    // window.event is for IE
									if (e.stopPropagation)
										e.stopPropagation();  // Standards complient browsers
									else
										e.cancelBubble=true;  // IE
									var clickedUI = this;
									if (fileManager.clickedOnce) {
										fileManager.clickedOnce = false;
										clearTimeout(fileManager.clickTimer);
										fileManager.dblclickArchive(clickedUI);
									} else {
										fileManager.clickedOnce = true;
										fileManager.click(clickedUI);
										fileManager.clickTimer = setTimeout(function() {
											fileManager.clickedOnce = false;
											fileManager.singleclick(clickedUI);
										}, 200);
									}
									$("#absContextMenu").fadeOut("fast");
								})
								.prepend("<span class='directory'></span>");
							break;
						
						case "html": case "htm": case "php": case "php5": case "pl":  case "phtml": case "shtml":
							var preview;
							fmElem
								.css("padding-left", 10)
								.click( function(e) {
									e = window.event || e;    // window.event is for IE
									if (e.stopPropagation)
										e.stopPropagation();  // Standards complient browsers
									else
										e.cancelBubble=true;  // IE
									var clickedUI = this;
									if (fileManager.clickedOnce) {
										fileManager.clickedOnce = false;
										clearTimeout(fileManager.clickTimer);
										fileManager.dblclickHTML(clickedUI);
									} else {
										fileManager.clickedOnce = true;
										fileManager.click(clickedUI);
										fileManager.clickTimer = setTimeout(function() {
											fileManager.clickedOnce = false;
											fileManager.singleclick(clickedUI);
										}, 200);
									}
									$("#absContextMenu").fadeOut("fast");
								})
								.prepend("<span class='file"+fileType+"'></span>");
							if (fileManager.preview)
								fmElem.hover( function() {
									var iframe = document.createElement("iframe");
										iframe.setAttribute("style", "width: 1024px; height: 768px;");
									if (parseFloat($(fileManager.selector).offset().left) < $window.width()/2) {
										var left = $("#absFileManager").width()+20;
										var right = '';
									} else {
										var left = '';
										var right = $("#absFileManager").width()+20;
									}
									if (parseFloat($(fileManager.selector).offset().top) < $window.height()/2) {
										var top = $("#absFileManagerWrapper").position().top;
										var bottom = '';
									} else {
										var top = '';
										var bottom = 20;
									}
									preview = $("<div/>")
										.appendTo("#absFileManagerWrapper")
										.addClass("abs-file-preview")
										.css({
											position: 'absolute',
											left: left,
											right: right,
											top: top,
											bottom: bottom,
											width: 500,
											height: 500
										})
										.append(iframe);
										var filePath = ".."+fileManager.curDir+$(this).attr("id").split(':')[0];
										iframe.src = filePath;
								}, function() {
									preview.empty().remove();
								});
							break;
							
						case "jpeg": case "jpg": case "gif": case "png": case "bmp":
							var preview;
							fmElem
								.css("padding-left", 10)
								.click( function(e) {
									e = window.event || e;    // window.event is for IE
									if (e.stopPropagation)
										e.stopPropagation();  // Standards complient browsers
									else
										e.cancelBubble=true;  // IE
									var clickedUI = this;
									if (fileManager.clickedOnce) {
										fileManager.clickedOnce = false;
										clearTimeout(fileManager.clickTimer);
										fileManager.dblclickImage(clickedUI);
									} else {
										fileManager.clickedOnce = true;
										fileManager.click(clickedUI);
										fileManager.clickTimer = setTimeout(function() {
											fileManager.clickedOnce = false;
											fileManager.singleclick(clickedUI);
										}, 200);
									}
									$("#absContextMenu").fadeOut("fast");
								})
								.prepend("<span class='image'></span>");
							if (fileManager.preview)
								fmElem.hover( function() {
									if (parseFloat($(fileManager.selector).offset().left) < $window.width()/2) {
										var left = $("#absFileManager").width()+20;
										var right = '';
									} else {
										var left = '';
										var right = $("#absFileManager").width()+20;
									}
									if (parseFloat($(fileManager.selector).offset().top) < $window.height()/2) {
										var top = $("#absFileManagerWrapper").position().top;
										var bottom = '';
									} else {
										var top = '';
										var bottom = 20;
									}
									preview = $("<div/>")
										.appendTo("#absFileManagerWrapper")
										.addClass("abs-file-preview")
										.css({
											position: 'absolute',
											left: left,
											right: right,
											top: top,
											bottom: bottom,
											width: 500,
											height: 500
										})
										.append("<img src='.."+fileManager.curDir+$(this).attr("id").split(':')[0]+"' alt='Preview of "+$(this).attr("id").split(':')[0]+"' />");
								}, function() {
									preview.empty().remove();
								});
							break;
							
						case "swf":
							fmElem
								.css("padding-left", 10)
								.click( function(e) {
									e = window.event || e;    // window.event is for IE
									if (e.stopPropagation)
										e.stopPropagation();  // Standards complient browsers
									else
										e.cancelBubble=true;  // IE
									var clickedUI = this;
									if (fileManager.clickedOnce) {
										fileManager.clickedOnce = false;
										clearTimeout(fileManager.clickTimer);
										fileManager.dblclickFlash(clickedUI);
									} else {
										fileManager.clickedOnce = true;
										fileManager.click(clickedUI);
										fileManager.clickTimer = setTimeout(function() {
											fileManager.clickedOnce = false;
											fileManager.singleclick(clickedUI);
										}, 200);
									}
									$("#absContextMenu").fadeOut("fast");
								})
								.prepend("<span class='file"+fileType+"'></span>");
							break;
						
						case "mpeg": case "avi": case "mov":
							fmElem
								.css("padding-left", 10)
								.click( function(e) {
									e = window.event || e;    // window.event is for IE
									if (e.stopPropagation)
										e.stopPropagation();  // Standards complient browsers
									else
										e.cancelBubble=true;  // IE
									var clickedUI = this;
									if (fileManager.clickedOnce) {
										fileManager.clickedOnce = false;
										clearTimeout(fileManager.clickTimer);
										fileManager.dblclickVideo(clickedUI);
									} else {
										fileManager.clickedOnce = true;
										fileManager.click(clickedUI);
										fileManager.clickTimer = setTimeout(function() {
											fileManager.clickedOnce = false;
											fileManager.singleclick(clickedUI);
										}, 200);
									}
									$("#absContextMenu").fadeOut("fast");
								})
								.prepend("<span class='fileswf'></span>");
							break;
							
						case "mp3": case "mp4": case "wav": case "ogg": case "midi":
							fmElem
								.css("padding-left", 10)
								.click( function(e) {
									e = window.event || e;    // window.event is for IE
									if (e.stopPropagation)
										e.stopPropagation();  // Standards complient browsers
									else
										e.cancelBubble=true;  // IE
									var clickedUI = this;
									if (fileManager.clickedOnce) {
										fileManager.clickedOnce = false;
										clearTimeout(fileManager.clickTimer);
										fileManager.dblclickAudio(clickedUI);
									} else {
										fileManager.clickedOnce = true;
										fileManager.click(clickedUI);
										fileManager.clickTimer = setTimeout(function() {
											fileManager.clickedOnce = false;
											fileManager.singleclick(clickedUI);
										}, 200);
									}
									$("#absContextMenu").fadeOut("fast");
								})
								.prepend("<span class='fileswf'></span>");
							break;
							
						case "js": case "css": case "txt": case "xml":
							var preview;
							fmElem
								.css("padding-left", 10)
								.click( function(e) {
									e = window.event || e;    // window.event is for IE
									if (e.stopPropagation)
										e.stopPropagation();  // Standards complient browsers
									else
										e.cancelBubble=true;  // IE
									var clickedUI = this;
									if (fileManager.clickedOnce) {
										fileManager.clickedOnce = false;
										clearTimeout(fileManager.clickTimer);
										fileManager.dblclickFile(clickedUI);
									} else {
										fileManager.clickedOnce = true;
										fileManager.click(clickedUI);
										fileManager.clickTimer = setTimeout(function() {
											fileManager.clickedOnce = false;
											fileManager.singleclick(clickedUI);
										}, 200);
									}
									$("#absContextMenu").fadeOut("fast");
								})
								.prepend("<span class='file"+fileType+"'></span>");
							if (fileManager.preview)
								fmElem.hover( function() {
									if (parseFloat($(fileManager.selector).offset().left) < $window.width()/2) {
										var left = $("#absFileManager").width()+20;
										var right = '';
									} else {
										var left = '';
										var right = $("#absFileManager").width()+20;
									}
									if (parseFloat($(fileManager.selector).offset().top) < $window.height()/2) {
										var top = $("#absFileManagerWrapper").position().top;
										var bottom = '';
									} else {
										var top = '';
										var bottom = 20;
									}
									preview = $("<div/>")
										.appendTo("#absFileManagerWrapper")
										.addClass("abs-file-preview")
										.css({
											position: 'absolute',
											left: left,
											right: right,
											top: top,
											bottom: bottom,
											padding: 5,
											width: 500,
											height: 500
										});
										abstraction.getFileContents(fileManager.curDir+$(this).attr("id").split(':')[0], function(data) {
											preview.html(text2html(data));
										});
								}, function() {
									preview.empty().remove();
								});
							break;
							
						default:
							var preview;
							fmElem
								.css("padding-left", 10)
								.click( function(e) {
									e = window.event || e;    // window.event is for IE
									if (e.stopPropagation)
										e.stopPropagation();  // Standards complient browsers
									else
										e.cancelBubble=true;  // IE
									var clickedUI = this;
									if (fileManager.clickedOnce) {
										fileManager.clickedOnce = false;
										clearTimeout(fileManager.clickTimer);
										fileManager.dblclickFile(clickedUI);
									} else {
										fileManager.clickedOnce = true;
										fileManager.click(clickedUI);
										fileManager.clickTimer = setTimeout(function() {
											fileManager.clickedOnce = false;
											fileManager.singleclick(clickedUI);
										}, 200);
									}
									$("#absContextMenu").fadeOut("fast");
								})
								.prepend("<span class='filetxt'></span>");
							break;
					}
					return fmElem;
				}
				return false;
			}
			FileManager.prototype.loadDirectory = function(dir, parent, callback) {
				var fileManager = this;
				abstraction.getDirContents(dir, parseList);
				function parseList(data) {  // When the server responds, take the data and insert it into the file manager
					parent.empty();			// empty the parent to make sure it never double prints contents.
					for (var i in data) {
						fileManager.generateFileItem(dir, i, data[i], parent);
					}
					if (typeof callback == 'function')
						callback.call(fileManager);
				}
			}
			FileManager.prototype.oncontextmenu = function(e) {
				var newleft, newtop;
				e = window.event || e;    // window.event is for IE
				if (e.stopPropagation)
					e.stopPropagation();  // Standards complient browsers
				else
					e.cancelBubble=true;  // IE
				var target = e.target != null ? e.target : e.srcElement;
				if (target === abstraction.fileManager.wrapper)
					target = 'none';
				else
					target = $(target).closest("div").attr("id");
				if (e.pageX != undefined) {
					newleft = e.pageX;
					newtop = e.pageY;
				} else {
					newleft = e.clientX;
					newtop = e.clientY;
				}
				//if (frameDoc.getElementFromPoint)
				//	elem = frameDoc.getElementFromPoint(newleft, newtop);
				//else
				//	elem = frameDoc.elementFromPoint(newleft, newtop);
				if (abstraction.contextMenu.file(target)) {  // Generate the element context menu
					//newtop -= 20;
					if (newtop + abstraction.contextMenu.$.outerHeight() > $window.height())  // This keeps the context menu from displaying lower then the bottom of the window
						newtop = $window.height() - abstraction.contextMenu.$.outerHeight();
					abstraction.contextMenu.$
						.css({ display: 'none', left: newleft+'px', top: newtop+'px' })
						.fadeIn("fast");
				}
				e.preventDefault();
				return false;
			}
			FileManager.prototype.onfocus = function() {
				var fileManager = this;
				abstraction.updateGroupFocus(fileManager);
			}
			FileManager.prototype.saveUI = function() {
				abstraction.saveUI();
			}
			FileManager.prototype.setZindex = function() {
				var i = abstraction.groupZindex.length;
				while (i--)
					if (abstraction.groupZindex[i] === this) {
						abstraction.groupZindex.splice(i, 1);
					}
				abstraction.groupZindex[abstraction.groupZindex.length] = this;
			}
			FileManager.prototype.toggleMenu = function() {
				var fileManager = this;
				if (fileManager.menuClosed) {
					fileManager.$menu.show();
					fileManager.menuClosed = false;
				} else {
					fileManager.$menu.hide();
					fileManager.menuClosed = true;
				}
			}
			FileManager.prototype.update = function() {
				var fileManager = this;
				fileManager.$handle.find('.open-menu').css('background', 'transparent url(abstraction/core/styles/images/ajax-loader.gif) no-repeat center');
				fileManager.$wrapper
					.empty();
				fileManager.loadDirectory("/", fileManager.$wrapper, function() {
					fileManager.bindContextMenu();
					fileManager.$handle.find('.open-menu').css('background', '');
				});
			}
			return FileManager;
		})();
		
		var InlineEditor = (function() {
			InlineEditor.Inherits(ui.Window);
			function InlineEditor(file, elem, attr, taskbars, parent) {
				if (parent == undefined) parent = abstraction.desktop;
				var inlineEditor = this,
					menuTimer, submenuTimer,  		// save while typing timer tracks how long it's been since you last typed a character in this editor
					maximized = false;
				inlineEditor.$ = $("<div/>")
						.attr("class", "window abs-inlineEditor-ui abs-ui")
						.css("display", "none")
						.appendTo(parent);
				inlineEditor.window = inlineEditor.$.get(0);
				inlineEditor.menuClosed = true;
				inlineEditor.autosave = true;
				this.name = 'inlineEditor';

				var menu = new ui.Menu({
					save: {
						content: '<span class="abs-menu-refresh"></span>Update<span class="abs-menu-buffer"></span><span class="abs-menu-shortcut">CTRL+R</span>',
						click: function() { inlineEditor.saveContent(); }
					},
					close: {
						content: '<span class="abs-menu-windowClose"></span>Close',
						click: function() { inlineEditor.close(); }
					},
					insert: "<hr/>",
					options: {
						content: "<span class='abs-menu-windowOptions'></span>Options",
						mouseover: function() {
							var submenu = $(this).children(".ui-submenu");
							clearTimeout(submenuTimer);
							submenu.css('display', 'block');
							if (submenu.offset().top+submenu.outerHeight() > $window.height()) {
								submenu
									.css({
										"top": submenu.position().top - ((submenu.offset().top+submenu.outerHeight())-$window.height())
									});
							}
							submenu
								.css({
									"left": $(this).parent().width()
								});
						},
						mouseout: function() {
							var menuItem = this;
							submenuTimer = setTimeout(function() {
								$(menuItem).children(".ui-submenu").fadeOut("fast");
								menuItem = null;
							}, 500);
						},
						children: {
							codemirror1: {
								content: "<span class='abs-menu-blank'></span>codemirror 1",
								styles: "color: gray"
							},
							codemirror2: {
								content: "<span class='abs-menu-blank'></span>codemirror 2",
								styles: "color: gray"
							},
							autosaveToggle: {
								content: function() {
									return abstraction.autosave ? "<span class='abs-menu-check'></span>autoupdate" : "<span class='abs-menu-blank'></span>autoupdate"
								},
								click: function() {
									abstraction.autosave = !abstraction.autosave;
									if (abstraction.autosave)
										$(".window-menu > .options .autosaveToggle").find('span').attr("class", "abs-menu-check");
									else
										$(".window-menu > .options .autosaveToggle").find('span').attr("class", "abs-menu-blank");
									abstraction.saveUI();
								}
							},
							dockable: {
								content: function() {
									return abstraction.editorsDockable ? "<span class='abs-menu-check'></span>dockable" : "<span class='abs-menu-blank'></span>dockable"
								},
								click: function() {
									abstraction.editorsDockable = !abstraction.editorsDockable;
									if (abstraction.editorsDockable) {
										inlineEditors.each( function(key, win) {
											win.dockable = true;
										});
										sourceEditors.each( function(key, win) {
											win.dockable = true;
										});
										$(".window-menu > .options .dockable span").attr("class", "abs-menu-check");
									} else {
										inlineEditors.each( function(key, win) {
											win.dockable = false;
										});
										sourceEditors.each( function(key, win) {
											win.dockable = false;
										});s
										$(".window-menu > .options .dockable span").attr("class", "abs-menu-blank");
									}
									abstraction.saveUI();
								}
							}
						}
					}
				});
				menu.$
					.addClass("window-menu")
					.mouseenter(function() {
							clearTimeout(menuTimer)
					})
					.mouseleave(function() {
						menuTimer = setTimeout(function() {
							inlineEditor.$menu.hide();
							inlineEditor.menuClosed = true;
						}, 500);
					});
				if (abstraction.activeState && abstraction.activeState.editor) {
					var newLeft = parseInt(abstraction.activeState.editor.left())+20;
					var newTop = parseInt(abstraction.activeState.editor.top())+20;
					if (abstraction.activeState.editor.isMaximized)
						maximized = true;
				} else {
					var newLeft = 220;
					var newTop = 40;
				}
				inlineEditor.options({
					selector: this.window,
					title: "<div class='abs-inlineEditor-icon'></div>Empty document",
					taskbar: taskbars,
					left: newLeft,
					top: newTop,
					attachedWidth: 600,
					dragstop: abstraction.saveUI,
					resizestop: inlineEditor.updateCodemirror,
					minimize: abstraction.updateCodemirror,
					unminimize: abstraction.updateCodemirror,
					maximize: inlineEditor.updateCodemirror,
					unmaximize: inlineEditor.updateCodemirror,
					menu: menu,
					openmenu: inlineEditor.toggleMenu,
					focus: inlineEditor.onfocus
				});
				if (maximized)
					inlineEditor.maximize(false);
				else
					inlineEditor.checkBounds();
				inlineEditor.open();
				inlineEditor.load(file, elem, attr);
				           // reveal the new window
				inlineEditor.focus();
			}
			InlineEditor.prototype.close = function() {
				var i = this.state.inlineEditors.length;
				while (i--)
					if (this.state.inlineEditors[i] === this)
						this.state.inlineEditors.splice(i, 1);
				inlineEditors.remove(this.elem);
				var i = this.state.winZindex.length;
				while (i--)
					if (this.state.winZindex[i] === this)
						this.state.winZindex.splice(i, 1);
				//this.$.unbind();
				//this.$menu.unbind().empty();
				this.codemirror.inlineEditor = undefined;
				this.menu.destroy();
				this.destroy();
			};
			InlineEditor.prototype.codemirrorFocus = function() {
				this.focus();
				abstraction.docClick();
			}
			InlineEditor.prototype.getStyles = function(elem) {
				return $(elem).attr('style');
			}
			InlineEditor.prototype.getHTML = function(elem) {
				return $(elem).html();
			}
			InlineEditor.prototype.keyEvent = function(editor, e) {
				var inlineEditor = editor.inlineEditor,
					keyCode = (e.keyCode != undefined) ? e.keyCode :
					(e.charCode != undefined) ? e.charCode : e.which;
				clearTimeout(inlineEditor.keyEventTimer);
				//if ((e.which == 83 && e.ctrlKey) || (e.which == 115 && e.ctrlKey) || (e.which == 19)) {	// Check for CTRL+S and bind save to it
				if ((keyCode == 83 || keyCode == 82) && e.ctrlKey) {	// Check for CTRL+R or CTRL+S and bind save to it
					if (window.isIE)
						editor.stop();
					inlineEditor.saveContent();
					e.preventDefault();
					return false;
				} else if (e.type == 'keyup' && abstraction.autosave)
					inlineEditor.keyEventTimer = setTimeout(function() { inlineEditor.saveContent.call(inlineEditor); }, 1000);  // save to working document if no typing for 1 second
				//sourceEditor = null;
			}
			InlineEditor.prototype.load = function(file, elem, attr) {
				var inlineEditor = this;
				inlineEditor.setSource(elem);
				inlineEditor.file = file;
				inlineEditor.attr = attr;
				inlineEditor.state = documentStates.get(file);
				if (inlineEditor.state == undefined)  // If a documentState object does not exist for this file, create one
					inlineEditor.state = new DocumentState(file);
				inlineEditor.state.linkInlineEditor(inlineEditor);
				inlineEditor.state.onload(function() {
					var codemirrorOptions = {
						lineNumbers: true,
						tabMode: 'shift',
						onKeyEvent: inlineEditor.keyEvent
					};
					switch (attr) {
						case 'onclick':
						case 'onmouseover':
						case 'onmouseout':
						case 'onload':
						case 'onunload':
							codemirrorOptions.mode = 'javascript';
							codemirrorOptions.value = '';
							inlineEditor.fn = 'editInlineEvents';
							inlineEditor.getContent = function(){};
							inlineEditor.title = "<div class='abs-inlineEditor-icon'></div>Editing: &lt;"+elem.nodeName+"&gt;'s Events";
							break;
						case 'style':
							codemirrorOptions.mode = 'css';
							codemirrorOptions.value = inlineEditor.getStyles(elem);
							inlineEditor.fn = 'editInlineStyles';
							inlineEditor.getContent = inlineEditor.getStyles;
							inlineEditor.title = "<div class='abs-inlineEditor-icon'></div>Editing: &lt;"+elem.nodeName+"&gt;'s Styles";
							break;
						case 'html':
							codemirrorOptions.mode = 'htmlmixed';
							codemirrorOptions.value = inlineEditor.getHTML(elem);
							inlineEditor.fn = 'editInnerHTML';
							inlineEditor.getContent = inlineEditor.getHTML;
							inlineEditor.title = "<div class='abs-inlineEditor-icon'></div>Editing: &lt;"+elem.nodeName+"&gt;'s InnerHTML";
							break;
							
						default:
							inlineEditor.title = "Editor";
							break;
					}
					inlineEditor.setTitle(inlineEditor.title);
					if (inlineEditor.codemirror != undefined)
						$(inlineEditor.codemirror.wrapping).empty().remove();
					inlineEditor.codemirror = new CodeMirror(inlineEditor.window, codemirrorOptions);
					inlineEditor.codemirror.inlineEditor = inlineEditor;
					codemirrorOptions = null;
					inlineEditor.update();
				});
			}
			InlineEditor.prototype.onfocus = function() {
				var inlineEditor = this,
					taskbarTab;
				if (abstraction.activeState != inlineEditor.state) {
					abstraction.activeState = inlineEditor.state;
					abstraction.sourceOutline.load(inlineEditor.file);
					abstraction.revisionManager.load(inlineEditor.file);
				}
				abstraction.updateGroupFocus(inlineEditor);
			}
			InlineEditor.prototype.saveContent = function() {
				var inlineEditor = this;
				inlineEditor.state.execute({
					fn: inlineEditor.fn,
					elem: inlineEditor.elem,
					content: inlineEditor.content,
					setContent: inlineEditor.setContent,
					editor: inlineEditor.codemirror,
					win: inlineEditor.window
				});
				inlineEditor.content = inlineEditor.codemirror.getCode();
				//alert(sourceEditor.content);
			}
			InlineEditor.prototype.setContent = function(newContent) {
				this.content = newContent;
			}
			InlineEditor.prototype.setSource = function(elem) {
				var inlineEditor = this;
				if (inlineEditor.elem != undefined)
					inlineEditors.remove(inlineEditor.file);
				inlineEditor.elem = elem;
				inlineEditors.put(inlineEditor.elem, inlineEditor);
			}
			InlineEditor.prototype.setZindex = function() {
				var i = this.state.winZindex.length;
				while (i--)
					if (this.state.winZindex[i] === this) {
						this.state.winZindex.splice(i, 1);
					}
				this.state.winZindex[this.state.winZindex.length] = this;
			}
			InlineEditor.prototype.toggleMenu = function() {
				if (this.menuClosed) {
					this.menu.$.show();
					this.menuClosed = false;
				} else {
					this.menu.$.hide();
					this.menuClosed = true;
				}
			}
			InlineEditor.prototype.update = function() {
				var inlineEditor = this;
				inlineEditor.content = inlineEditor.getContent(inlineEditor.elem);
				inlineEditor.codemirror.setCode(inlineEditor.content);
			}
			InlineEditor.prototype.updateCodemirror = function() {
				this.codemirror.refresh();
				abstraction.saveUI();
			}
			return InlineEditor;
		})();
		
		var RevisionManager = (function() {
			RevisionManager.Inherits(ui.Window);
			function RevisionManager(file, taskbars, parent) {
				parent = parent || abstraction.desktop;
				var revisionManager = this,
					menuTimer, submenuTimer;
				revisionManager.name = "revisionManager";
				revisionManager.file;
				revisionManager.directories = {};
				revisionManager.curRevision;
				revisionManager.menuClosed = true;
				revisionManager.isHidden = true;
				revisionManager.selection = [];
				revisionManager.clickedOnce = false;
					
				revisionManager.window = $("<div/>")
					.attr({
						id: 'absRevisionManager',
						style: 'display: none;'
					})
					.addClass("window abs-ui")
					.appendTo(parent)
					.get(0);
				revisionManager.$wrapper = $("<div/>")
					.attr('id', "absRevisionManagerWrapper")
					.addClass("content abs-ui")
					.click(function() {
						revisionManager.$wrapper.find('.abs-revisionManager-selectedFile').removeClass('abs-revisionManager-selectedFile');
						revisionManager.selection = [];
					})
					.appendTo(revisionManager.window);
				revisionManager.wrapper = revisionManager.$wrapper.get(0);
					
				var menu = new ui.Menu({
					newRevision: {
						content: '<span class="abs-menu-save"></span>New Revision',
						click: function() { revisionManager.state.save(); }
					},
					close: {
						content: '<span class="abs-menu-delete"></span>Close',
						click: function() { revisionManager.close(); }
					},
					insert: "<hr />",
					options: {
						content: '<span class="abs-menu-options"></span>Options',
						styles: 'color: gray;'
					}
				});
				menu.$
					.addClass("window-menu")
					.mouseenter(function() {
							clearTimeout(menuTimer)
					})
					.mouseleave(function() {
						menuTimer = setTimeout(function() {
							revisionManager.$menu.hide();
							revisionManager.menuClosed = true;
						}, 500);
					});
				
				revisionManager.options({
					selector: revisionManager.window,
					title: "<div class='abs-revisionManager-icon'></div>Revisions",
					taskbar: taskbars,
					top: 20,
					dragstop: revisionManager.saveUI,
					resizestop: revisionManager.saveUI,
					minimize: revisionManager.saveUI,
					unminimize: revisionManager.saveUI,
					maximize: false,
					menu: menu,
					openmenu: revisionManager.toggleMenu,
					focus: revisionManager.onfocus
				});
				//revisionManager.setEvents();
				if (file != undefined)
					revisionManager.load(file);
				revisionManager.focus();
			}
			RevisionManager.prototype.bindContextMenu = function() {
				var revisionManager = this;
				revisionManager.$wrapper.bind('contextmenu', revisionManager.oncontextmenu);
			}
			// Method which unlinks the revisionManager from it's current documentState
			RevisionManager.prototype.clear = function() {
				this.state = undefined;
				this.$wrapper.unbind().empty();
				this.$.css('display', 'none');
				this.isHidden = true;
			}
			RevisionManager.prototype.click = function(clickedUI) {
				var revisionManager = this,
					$clickedUI = $(clickedUI);
					
				if (!ui.input.ctrl && !ui.input.shift) {
					revisionManager.$wrapper.find('.abs-revisionManager-selectedFile').removeClass('abs-revisionManager-selectedFile');
					revisionManager.selection = [];
					$clickedUI.addClass('abs-revisionManager-selectedFile');
					revisionManager.selection[revisionManager.selection.length] = clickedUI.id;
				}
			}
			RevisionManager.prototype.singleclick = function(clickedUI) {
				var revisionManager = this,
					$clickedUI = $(clickedUI);
					
				if (ui.input.ctrl || ui.input.shift) {
					if ($clickedUI.hasClass('abs-revisionManager-selectedFile')) {
						$clickedUI.removeClass('abs-revisionManager-selectedFile');
						var i = revisionManager.selection.length;
						while (i--)
							if (revisionManager.selection[i] == clickedUI.id)
								revisionManager.selection.splice(i,1);
					} else {
						$clickedUI.addClass('abs-revisionManager-selectedFile');
						revisionManager.selection[revisionManager.selection.length] = clickedUI.id;
					}
				}
			}
			RevisionManager.prototype.dblclickDirectory = function(clickedUI) {
				var revisionManager = this,
					$clickedUI = $(clickedUI),
					curDir = $clickedUI,
					newDir = $clickedUI.attr("id"),
					newParent = $clickedUI.next();
				revisionManager.$handle.find('.open-menu').css('background', 'transparent url(abstraction/core/styles/images/ajax-loader.gif) no-repeat center');
				newParent.css("display", 'none');
				revisionManager.loadDirectory(newDir, newParent, function() {
					$clickedUI
						.unbind("click")
						.click(function(e) {
							e = window.event || e;    // window.event is for IE
							if (e.stopPropagation)
								e.stopPropagation();  // Standards complient browsers
							else
								e.cancelBubble=true;  // IE
							var clickedUI = this;
							if (revisionManager.clickedOnce) {
								revisionManager.clickedOnce = false;
								clearTimeout(revisionManager.clickTimer);
								revisionManager.dblclickLoadedDirectory(clickedUI);
							} else {
								revisionManager.clickedOnce = true;
								revisionManager.clickTimer = setTimeout(function() {
									revisionManager.clickedOnce = false;
									revisionManager.click(clickedUI);
								}, 200);
							}
						});
					curDir.find(".abs-toggle")
						.attr("src", "abstraction/core/styles/images/hidechildren.png");
					newParent
						.slideDown('fast');
					revisionManager.directories[newDir] = true;
					revisionManager.$handle.find('.open-menu').css('background', '');
					curDir = null;
					newDir = null;		// Garbage collect
					newParent = null;
				});
			}
			RevisionManager.prototype.dblclickLoadedDirectory = function(clickedUI) {
				var revisionManager = this,
					$clickedUI = $(clickedUI),
					newDir = $clickedUI.attr("id");
				if ($clickedUI.next().css("display") == "none") {
					$clickedUI.next().slideDown('fast');
					$clickedUI.find(".abs-toggle").attr("src", "abstraction/core/styles/images/hidechildren.png");
					revisionManager.directories[newDir] = true;
				} else {
					$clickedUI.next().slideUp('fast');
					$clickedUI.find(".abs-toggle").attr("src", "abstraction/core/styles/images/showchildren.png");
					revisionManager.directories[newDir] = false;
				}
				revisionManager.$wrapper.find('.abs-revisionManager-selectedFile').removeClass('abs-revisionManager-selectedFile');
				revisionManager.selection = [];
			}
			RevisionManager.prototype.dblclickRevision = function(clickedUI) {
				var revisionManager = this,
					$clickedUI = $(clickedUI),
					newRevision = clickedUI,
					curState = revisionManager.state;
				revisionManager.curRevision = newRevision.getAttribute('id');
				//alert('/backups/'+revisionManager.state.currentDoc.replace(/-/gi, '-!@h@!-').replace(/\//gi, '-!@s@!-').replace(/\./gi, '-!@p@!-')+revisionManager.curRevision);
				curState.editor.$handle.find('.open-menu').css('background', 'transparent url(abstraction/core/styles/images/ajax-loader.gif) no-repeat center');
				abstraction.getFileContents('/desktop/backups/'+revisionManager.state.currentDoc.replace(/-/gi, '-!@h@!-').replace(/\//gi, '-!@s@!-').replace(/\./gi, '-!@p@!-')+revisionManager.curRevision, function(data) {
					abstraction.setFileContents(encodeURIComponent(revisionManager.state.workingDoc), data, function() {
						curState.getServerSideScripts(data);  // Finds any server side scripts (only PhP atm) in the html and adds some new variables
						curState.getDoctype(data);			   // Finds and stores the doctype of the document
						curState.source = data;
						curState.update(function() {
							if (curState.editor)
								curState.editor.update();
							curState.editor.$handle.find('.open-menu').css('background', '');
							curState = null;
						});
					});
				});
			}
			RevisionManager.prototype.load = function(file) {
				var revisionManager = this, 					
				arr = file.split(abstraction.root);

				if (arr.length > 1)
					file = arr[1];
				arr = file.split("/");
				for (var i=0; i<arr.length-1; i++)
					if (arr[i] != "") {
						revisionManager.currentPath += arr[i]+"/";
						revisionManager.returnPath += "../";
					}
				arr = file.split("?");
				file = arr[0];
				if (file.charAt(0) != "/")
					file = "/"+file;
				if (revisionManager.currentDoc == undefined)  // If abstraction was just loaded...
					revisionManager.currentDoc = uncacheSafe(file.substr(1));
				else {
					revisionManager.lastDoc = revisionManager.currentDoc;
					revisionManager.currentDoc = uncacheSafe(file.substr(1));
					abstraction.saveUI();
				}
				revisionManager.file = file;
				revisionManager.state = documentStates.get(file);
				revisionManager.update();
				revisionManager.$.css('display', 'block');
				revisionManager.isHidden = false;
				if (revisionManager.isAttached) {
					var l = ui.maximizedWindows.length;
					while (l--)
						ui.maximizedWindows[l].maximize(true);
				}
			}
			RevisionManager.prototype.loadDirectory = function(dir, parent, callback){
				var revisionManager = this,
					file = revisionManager.file;
				if (file.charAt(0) == "/")
					file = file.substr(1);
				abstraction.getDirContents('/desktop/backups/'+file.replace(/-/gi, '-!@h@!-').replace(/\//gi, '-!@s@!-').replace(/\./gi, '-!@p@!-')+dir, parseList);
				function parseList(data) {  // When the server responds, take the data and insert it into the file manager
					var name = {}, type = {}, files = {}, dates = {};
					var revisions = [], type = [];
					var dHour = 0,
						dMin = 0,
						dSec = 0,
						dMilli = 0;
					for (var i in data) {
						if (i != '.' && i != '..') {
							var arr = i.replace('.backup', '').split('-');
							if (arr.length == 2) { // If it is length 2 it's a directory
								var date = new Date(arr[0], arr[1], dHour, dMin, dSec, dMilli);
								if (type[date.toString()] == undefined)
									revisions.push(date);
								else {
									dMilli++;  // Make this also increment minutes and hours, etc
									revisions.push(new Date(arr[0], arr[1], dHour, dMin, dSec, dMilli));
								}
								type[revisions[revisions.length-1].toString()] = 'dir';
								files[revisions[revisions.length-1].toString()] = i;
							}
							if (arr.length == 3) { // If it is length 3 it's a custom named directory
								var date = new Date(arr[0], arr[1]-1, dHour, dMin, dSec, dMilli);
								if (type[date.toString()] == undefined)
									revisions.push(date);
								else {
									dMilli++;
									revisions.push(new Date(arr[0], arr[1]-1, dHour, dMin, dSec, dMilli));
								}
								type[revisions[revisions.length-1].toString()] = 'dir';
								name[revisions[revisions.length-1].toString()] = arr[2];
								files[revisions[revisions.length-1].toString()] = i;
							}
							if (arr.length == 6) { // If it is length 5 it's a revision
								revisions.push(new Date(arr[0], arr[1]-1, arr[2], arr[3], arr[4], arr[5]));
								type[revisions[revisions.length-1].toString()] = 'rev';
								files[revisions[revisions.length-1].toString()] = i;
							}
							if (arr.length == 7) { // If it is length 2 it's a custom named file
								revisions.push(new Date(arr[0], arr[1]-1, arr[2], arr[3], arr[4], arr[5]));
								type[revisions[revisions.length-1].toString()] = arr[6];
								files[revisions[revisions.length-1].toString()] = i;
							}
						}
					}
					revisions.sort(dateSortDesc);
					parent.empty();
					for (var i in revisions) {
						var revDivClass = "abs-revisionManager-div";
						if (parent.hasClass("abs-revisionManager-div"))
							revDivClass = "abs-revisionManager-alt";
						if (type[revisions[i].toString()] == 'dir') {
							var thisDir = dir+'/'+files[revisions[i].toString()];
							if (name[revisions[i].toString()] != undefined)
								var content = '<span class="directory"></span>'+name[revisions[i].toString()];
							else {
								var content = revisions[i].toDateString().split(" ");
									content = '<span class="directory"></span>'+content[1]+" "+content[3];
							}
							var newDirectory = $("<div/>")
								.attr('id', thisDir)
								.addClass(revDivClass)
								.html(content)
								.get(0);
							parent.append(newDirectory);
							var childWrapper = $("<div/>")
									.attr("class", "abs-child-wrapper "+revDivClass)
									.css("display", "none")
									.css("padding-left", 10)
									.appendTo(parent);
							var childToggle = $("<img/>")
									.addClass("abs-toggle")
									.prependTo(newDirectory);
							
							if (revisionManager.directories[thisDir] == true) {
								childToggle.attr("src", "abstraction/core/styles/images/hidechildren.png");
								childWrapper.css('display', 'block');
								$(newDirectory).click(function(e) {
									e = window.event || e;    // window.event is for IE
									if (e.stopPropagation)
										e.stopPropagation();  // Standards complient browsers
									else
										e.cancelBubble=true;  // IE
									var clickedUI = this;
									if (revisionManager.clickedOnce) {
										revisionManager.clickedOnce = false;
										clearTimeout(revisionManager.clickTimer);
										revisionManager.dblclickLoadedDirectory(clickedUI);
									} else {
										revisionManager.clickedOnce = true;
										revisionManager.click(clickedUI);
										revisionManager.clickTimer = setTimeout(function() {
											revisionManager.clickedOnce = false;
											revisionManager.singleclick(clickedUI);
										}, 200);
									}
									$("#absContextMenu").fadeOut("fast");
								});
								revisionManager.loadDirectory(thisDir, childWrapper);
							} else {
								childToggle
									.attr("src", "abstraction/core/styles/images/showchildren.png");
								$(newDirectory)
									.click( function(e) {
										e = window.event || e;    // window.event is for IE
										if (e.stopPropagation)
											e.stopPropagation();  // Standards complient browsers
										else
											e.cancelBubble=true;  // IE
										var clickedUI = this;
										if (revisionManager.clickedOnce) {
											revisionManager.clickedOnce = false;
											clearTimeout(revisionManager.clickTimer);
											revisionManager.dblclickDirectory(clickedUI);
										} else {
											revisionManager.clickedOnce = true;
											revisionManager.click(clickedUI);
											revisionManager.clickTimer = setTimeout(function() {
												revisionManager.clickedOnce = false;
												revisionManager.singleclick(clickedUI);
											}, 200);
										}
										$("#absContextMenu").fadeOut("fast");
									});
							}
							newDirectory = null;
							childToggle = null;
							content = null;
							thisDir = null;
						} else {
							var thisRev =  dir+'/'+files[revisions[i].toString()];
							var content = revisions[i].toString().split(" GMT");
								content = '<span class="filetxt"></span>'+content[0];
							var newRevision = $('<div/>')
								.attr({
									id: thisRev,
									style: "padding-left: 10px;"
								})
								.addClass(revDivClass)
								.get(0);
							if (revisionManager.curRevision == thisRev)
								$(newRevision).addClass("abs-selected-revision");
							if (type[revisions[i].toString()] == 'rev')
								newRevision.innerHTML = content;
							else
								newRevision.innerHTML = '<span class="filepl"></span>'+type[revisions[i].toString()];
								$(newRevision).bind('click', function(e) {
									e = window.event || e;    // window.event is for IE
									if (e.stopPropagation)
										e.stopPropagation();  // Standards complient browsers
									else
										e.cancelBubble=true;  // IE
									var clickedUI = this;
									if (revisionManager.clickedOnce) {
										revisionManager.clickedOnce = false;
										clearTimeout(revisionManager.clickTimer);
										revisionManager.dblclickRevision(clickedUI);
									} else {
										revisionManager.clickedOnce = true;
										revisionManager.click(clickedUI);
										revisionManager.clickTimer = setTimeout(function() {
											revisionManager.clickedOnce = false;
											revisionManager.singleclick(clickedUI);
										}, 200);
									}
									$("#absContextMenu").fadeOut("fast");
								});
								parent.append(newRevision);
						}
					}
					if (typeof callback == 'function')
						callback.call(revisionManager);
				}
			}
			RevisionManager.prototype.oncontextmenu = function(e) {
				var newleft, newtop;
				e = window.event || e;    // window.event is for IE
				if (e.stopPropagation)
					e.stopPropagation();  // Standards complient browsers
				else
					e.cancelBubble=true;  // IE
				var target = e.target != null ? e.target : e.srcElement;
				if (target === abstraction.revisionManager.wrapper)
					target = 'none';
				else
					target = $(target).closest("div").attr("id");
				if (e.pageX != undefined) {
					newleft = e.pageX;
					newtop = e.pageY;
				} else {
					newleft = e.clientX;
					newtop = e.clientY;
				}
				//if (frameDoc.getElementFromPoint)
				//	elem = frameDoc.getElementFromPoint(newleft, newtop);
				//else
				//	elem = frameDoc.elementFromPoint(newleft, newtop);
				if (abstraction.contextMenu.revision(target)) {  // Generate the element context menu
					//newtop -= 20;
					if (newtop + abstraction.contextMenu.$.outerHeight() > $window.height())  // This keeps the context menu from displaying lower then the bottom of the window
						newtop = $window.height() - abstraction.contextMenu.$.outerHeight();
					abstraction.contextMenu.$
						.css({ display: 'none', left: newleft+'px', top: newtop+'px' })
						.fadeIn("fast");
				}
				e.preventDefault();
				return false;
			}
			RevisionManager.prototype.onfocus = function() {
				var revisionManager = this;
				abstraction.updateGroupFocus(revisionManager);
			}
			RevisionManager.prototype.saveUI = function() {
				abstraction.saveUI();
			}
			RevisionManager.prototype.setEvents = function(){
				var revisionManager = this;
				revisionManager.$wrapper.get(0).oncontextmenu = function(e) {
					e = window.event || e;    // window.event is for IE
					if (e.stopPropagation)
						e.stopPropagation();  // Standards complient browsers
					else
						e.cancelBubble=true;  // IE
					abstraction.openRevisionMenu(e, 'none'); return false;
				};
			}
			RevisionManager.prototype.setZindex = function() {
				var i = abstraction.groupZindex.length;
				while (i--)
					if (abstraction.groupZindex[i] === this) {
						abstraction.groupZindex.splice(i, 1);
					}
				abstraction.groupZindex[abstraction.groupZindex.length] = this;
			}
			RevisionManager.prototype.toggleMenu = function() {
				var revisionManager = this;
				if (revisionManager.menuClosed) {
					revisionManager.$menu.show();
					revisionManager.menuClosed = false;
				} else {
					revisionManager.$menu.hide();
					revisionManager.menuClosed = true;
				}
			}
			RevisionManager.prototype.update = function() {
				var revisionManager = this;
				revisionManager.$handle.find('.open-menu').css('background', 'transparent url(abstraction/core/styles/images/ajax-loader.gif) no-repeat center');
				revisionManager.$wrapper.empty();
				revisionManager.loadDirectory('', revisionManager.$wrapper, function() {
					if (revisionManager.$wrapper.html() == '')
						revisionManager.state.saveRevision(revisionManager.state.file, revisionManager.state.html('clean'));
					else {
						revisionManager.bindContextMenu();
						revisionManager.$handle.find('.open-menu').css('background', '');
					}
				});
			}
			return RevisionManager;
		})();
		
		var SourceEditor = (function() {
			SourceEditor.Inherits(ui.Window);
			// Constructor function for the document source editor window object
			function SourceEditor(file, taskbars, newOptions, parent) {
				// Argument logic
				parent = parent || abstraction.desktop;
				newOptions = newOptions || {};
				if (file.charAt(0) != "/")
					file = "/"+file;
				
				// Local variable declaration
				var sourceEditor = this,
					keyEventTimer, menuTimer, submenuTimer,  // save while typing timer tracks how long it's been since you last typed a character in this editor
					maximized = false;
				// Member variable declaration
				sourceEditor.content = "";
				sourceEditor.autosave = true;
				sourceEditor.menuClosed = true;
				sourceEditor.linkedPreviews = {};
				sourceEditor.window = $('<div/>')
					.attr("class", "window abs-sourceEditor-ui abs-ui")
					.css("display", "none")
					.appendTo(parent)
					.get(0);
				this.name = 'sourceEditor';
					
				var menu = new ui.Menu({
					update: {
						content: '<span class="abs-menu-refresh"></span>Update<span class="abs-menu-buffer"></span><span class="abs-menu-shortcut">CTRL+R</span>',
						click: function() { sourceEditor.saveContent(); }
					},
					save: {
						content: '<span class="abs-menu-windowSave"></span>Save<span class="abs-menu-buffer"></span><span class="abs-menu-shortcut">CTRL+S</span>',
						click: function() {
							if (abstraction.autosave)
								sourceEditor.state.save(function() {
									if (sourceEditor.state.isJS)
										for (var i in sourceEditor.linkedPreviews)
											sourceEditor.linkedPreviews[i].refresh();
								});
							else
								sourceEditor.saveContent(function() {
									sourceEditor.state.save(function() {
										if (sourceEditor.state.isJS)
											for (var i in sourceEditor.linkedPreviews)
												sourceEditor.linkedPreviews[i].refresh();
									});
								});
						}
					},
					close: {
						content: '<span class="abs-menu-windowClose"></span>Close',
						click: function() { sourceEditor.close(); }
					},
					insert: "<hr/>",
					options: {
						content: "<span class='abs-menu-windowOptions'></span>Options",
						mouseover: function() {
							var submenu = $(this).children(".ui-submenu");
							clearTimeout(submenuTimer);
							submenu.css('display', 'block');
							if (submenu.offset().top+submenu.outerHeight() > $window.height()) {
								submenu
									.css({
										"top": submenu.position().top - ((submenu.offset().top+submenu.outerHeight())-$window.height())
									});
							}
							submenu
								.css({
									"left": $(this).parent().width()
								});
						},
						mouseout: function() {
							var menuItem = this;
							submenuTimer = setTimeout(function() {
								$(menuItem).children(".ui-submenu").fadeOut("fast");
								menuItem = null;
							}, 500);
						},
						children: {
							codemirror1: {
								content: "<span class='abs-menu-blank'></span>codemirror 1",
								styles: "color: gray"
							},
							codemirror2: {
								content: "<span class='abs-menu-blank'></span>codemirror 2",
								styles: "color: gray"
							},
							autosaveToggle: {
								content: function() {
									return abstraction.autosave ? "<span class='abs-menu-check'></span>autoupdate" : "<span class='abs-menu-blank'></span>autoupdate"
								},
								click: function() {
									abstraction.autosave = !abstraction.autosave;
									if (abstraction.autosave)
										$(".window-menu > .options .autosaveToggle").find('span').attr("class", "abs-menu-check");
									else
										$(".window-menu > .options .autosaveToggle").find('span').attr("class", "abs-menu-blank");
									abstraction.saveUI();
								}
							},
							protectedMode: {
								content: function() {
									return abstraction.protectedMode ? "<span class='abs-menu-check'></span>protected mode" : "<span class='abs-menu-blank'></span>protected mode"
								},
								click: function() {
									abstraction.protectedMode = !abstraction.protectedMode;
									if (abstraction.protectedMode)
										$(".window-menu > .options .protectedMode span").attr("class", "abs-menu-check");
									else
										$(".window-menu > .options .protectedMode span").attr("class", "abs-menu-blank");
									sourceEditor.state.update();
									abstraction.saveUI();
								}
							},
							dockable: {
								content: function() {
									return abstraction.editorsDockable ? "<span class='abs-menu-check'></span>dockable" : "<span class='abs-menu-blank'></span>dockable"
								},
								click: function() {
									abstraction.editorsDockable = !abstraction.editorsDockable;
									if (abstraction.editorsDockable) {
										inlineEditors.each( function(key, win) {
											win.dockable = true;
										});
										sourceEditors.each( function(key, win) {
											win.dockable = true;
										});
										$(".window-menu > .options .dockable span").attr("class", "abs-menu-check");
									} else {
										inlineEditors.each( function(key, win) {
											win.dockable = false;
										});
										sourceEditors.each( function(key, win) {
											win.dockable = false;
										});
										$(".window-menu > .options .dockable span").attr("class", "abs-menu-blank");
									}
									abstraction.saveUI();
								}
							}
						}
					}
				});
				menu.$
					.addClass("window-menu")
					.mouseenter(function() {
							clearTimeout(menuTimer)
					})
					.mouseleave(function() {
						menuTimer = setTimeout(function() {
							sourceEditor.$menu.hide();
							sourceEditor.menuClosed = true;
						}, 500);
					});
					
				if (abstraction.activeState && abstraction.activeState.editor) {
					var newLeft = parseInt(abstraction.activeState.editor.left())+20;
					var newTop = parseInt(abstraction.activeState.editor.top())+20;
					if (abstraction.activeState.editor.isMaximized)
						maximized = true;
				} else {
					var newLeft = 220;
					var newTop = 40;
				}
				sourceEditor.options($.extend({
					selector: this.window,
					title: "<div class='abs-sourceEditor-icon'></div>Empty document",
					taskbar: taskbars,
					left: newLeft,
					top: newTop,
					attachedWidth: 600,
					dragstop: sourceEditor.updateCodemirror,
					resizestop: sourceEditor.updateCodemirror,
					minimize: sourceEditor.updateCodemirror,
					unminimize: sourceEditor.updateCodemirror,
					maximize: sourceEditor.updateCodemirror,
					unmaximize: sourceEditor.updateCodemirror,
					menu: menu,
					openmenu: sourceEditor.toggleMenu,
					focus: sourceEditor.onfocus
				}, newOptions));
				if (maximized)
					sourceEditor.maximize(true);
				else
					sourceEditor.checkBounds();
				sourceEditor.load(file);
				sourceEditor.open();           		// reveal the new window
				sourceEditor.focus();
			}
			
			SourceEditor.prototype.close = function() {
				sourceEditors.remove(this.file);
				this.state.destroy();
				
				for (var i in this.linkedPreviews) {
					this.linkedPreviews[i].unbindWorkingDoc(this.file);
					//this.linkedPreviews[i].state.update();
				}
				abstraction.saveUI();
			};
			SourceEditor.prototype.codemirrorFocus = function() {
				this.focus();
				abstraction.docClick();
			}
			SourceEditor.prototype.keyEvent = function(editor, e) {
				var sourceEditor = editor,
					keyCode = (e.keyCode != undefined) ? e.keyCode :
					(e.charCode != undefined) ? e.charCode : e.which;;
				clearTimeout(sourceEditor.keyEventTimer);
				sourceEditor.state.saved = false;
				//if ((e.which == 83 && e.ctrlKey) || (e.which == 115 && e.ctrlKey) || (e.which == 19)) {	// Check for CTRL+S and bind save to it
				if (keyCode == 83 && e.ctrlKey) {	// Check for CTRL+S and bind save to it
					//if (window.isIE)
					//	editor.stop();
					if (abstraction.autosave)
						sourceEditor.state.save();
					else
						sourceEditor.saveContent(function() {
							sourceEditor.state.save();
						});
					e.preventDefault();
					return false;
				} else if (keyCode == 82 && e.ctrlKey) {	// Check for CTRL+R and bind refresh to it
					if (window.isIE)
						editor.stop();
					sourceEditor.saveContent();
					e.preventDefault();
					return false;
				} else if (e.type == 'keyup' && abstraction.autosave)
					sourceEditor.keyEventTimer = setTimeout(function() { sourceEditor.saveContent.call(sourceEditor); }, 1000);  // save to working document if no typing for 1 second
				//sourceEditor = null;
			}
			SourceEditor.prototype.keyUp = function(e) {
			alert(this);
				
			}
			SourceEditor.prototype.keyDown = function() {}
			SourceEditor.prototype.load = function(file) {
				var sourceEditor = this,
					arr = file.split(abstraction.root);
				if (arr.length > 1)
					file = arr[1];
				arr = file.split("/");
				for (var i=0; i<arr.length-1; i++)
					if (arr[i] != "") {
						sourceEditor.currentPath += arr[i]+"/";
						sourceEditor.returnPath += "../";
					}
				arr = file.split("?");
				file = arr[0];
				if (file.charAt(0) != "/")
					file = "/"+file;
				if (sourceEditor.currentDoc == undefined)  // If abstraction was just loaded...
					sourceEditor.currentDoc = uncacheSafe(file.substr(1));
				else {
					sourceEditor.lastDoc = sourceEditor.currentDoc;
					sourceEditor.currentDoc = uncacheSafe(file.substr(1));
					abstraction.saveUI();
				}
				if (file.length < 24)
					sourceEditor.setTitle("<div class='abs-sourceEditor-icon'></div>Editing: /"+sourceEditor.currentDoc);
				else
					sourceEditor.setTitle("<div class='abs-sourceEditor-icon'></div>Editing: ... "+file.slice(-24));
				sourceEditor.$handle.find('.open-menu').css('background', 'transparent url(abstraction/core/styles/images/ajax-loader.gif) no-repeat center');
				sourceEditor.file = file;
				sourceEditor.fileType = getFileType(file);
				sourceEditor.setSource(file);
				sourceEditor.state = documentStates.get(file);
				if (sourceEditor.state == undefined)  // If a documentState object does not exist for this file, create one
					sourceEditor.state = new DocumentState(file);
				sourceEditor.state.linkSourceEditor(sourceEditor);
				sourceEditor.state.onload(function() {
					switch (sourceEditor.fileType) {
						case 'js':
							fn = 'editScript';
							var codemirrorOptions = {
								parserfile: ["tokenizejavascript.js", "parsejavascript.js"],
								path: 'abstraction/core/scripts/codemirror1/js/',
								stylesheet: "abstraction/core/scripts/codemirror1/css/jscolors.css",
								width: 'auto',
								height: '100%',
								lineNumbers: true,
								tabMode: 'shift',
								onLoad: sourceEditor.onload
								//onFocus: function(editor) { editor.sourceEditor.codemirrorFocus(); }
							};
							documentPreviews.each( function(key, value) {
								documentPreviews.get(key).bindWorkingDocs();
							});
							break;
						case 'css':
							fn = 'editStylesheet';
							var codemirrorOptions = {
								parserfile: "parsecss.js",
								path: 'abstraction/core/scripts/codemirror1/js/',
								stylesheet: "abstraction/core/scripts/codemirror1/css/csscolors.css",
								width: 'auto',
								height: '100%',
								lineNumbers: true,
								tabMode: 'shift',
								onLoad: sourceEditor.onload
								//onFocus: function(editor) { editor.sourceEditor.codemirrorFocus(); }
							};
							documentPreviews.each( function(key, value) {
								documentPreviews.get(key).bindWorkingDocs();
							});
							break;
						case 'html': case 'htm': case 'xml': case 'txt':
							fn = 'editSource';
							var codemirrorOptions = {
								parserfile: "parsexml.js",
								path: 'abstraction/core/scripts/codemirror1/js/',
								stylesheet: "abstraction/core/scripts/codemirror1/css/xmlcolors.css",
								width: 'auto',
								height: '100%',
								lineNumbers: true,
								tabMode: 'shift',
								onLoad: sourceEditor.onload
								//onFocus: function(editor) { editor.sourceEditor.codemirrorFocus(); }
							};
							break;
						case 'php':
							fn = 'editSource';
							var codemirrorOptions = {
								parserfile: "parsexml.js",
								path: 'abstraction/core/scripts/codemirror1/js/',
								stylesheet: "abstraction/core/scripts/codemirror1/css/xmlcolors.css",
								width: 'auto',
								height: '100%',
								lineNumbers: true,
								tabMode: 'shift',
								onLoad: sourceEditor.onload
								//onFocus: function(editor) { editor.sourceEditor.codemirrorFocus(); }
							};
							break;
					}
					//if (sourceEditor.codemirror != undefined)
					//	$(sourceEditor.codemirror.wrapping).empty().remove();
					sourceEditor.createEditor(codemirrorOptions);
					codemirrorOptions = null;
					sourceEditor.$handle.find('.open-menu').css('background', '');
				});
			}
			SourceEditor.prototype.createEditor = function(codemirrorOptions) {
				var sourceEditor = this;
				sourceEditor.codemirror = new CodeMirror(sourceEditor.window, codemirrorOptions);
				sourceEditor.codemirror.sourceEditor = sourceEditor;
			}
			SourceEditor.prototype.onfocus = function() {
				var sourceEditor = this;
				if (abstraction.activeState != sourceEditor.state) {
					abstraction.activeState = sourceEditor.state;
					if (abstraction.activeState.isHTML)
						abstraction.sourceOutline.load(sourceEditor.file);
					abstraction.revisionManager.load(sourceEditor.file);
				}
				abstraction.updateGroupFocus(sourceEditor);
			}
			SourceEditor.prototype.onload = function(editor) {
				var sourceEditor = editor.sourceEditor;
				$(sourceEditor.window).find('iframe')
					.contents()
						.bind("keyup", function(e) { return sourceEditor.keyEvent(sourceEditor, e); })
						.bind("keydown", function(e) { return sourceEditor.keyEvent(sourceEditor, e); })
						.find('body')
							.css('font-size', '12px');
				sourceEditor.update();
			}
			SourceEditor.prototype.resizeCodemirror = function() {
				var $thisWindow = $(this.window);
				$thisWindow.find('.CodeMirror-wrapping')
					.width($thisWindow.width()-$thisWindow.find('.CodeMirror-line-numbers').width());
			}
			SourceEditor.prototype.saveContent = function(callback) {
				var sourceEditor = this;
					sourceEditor.$handle.find('.open-menu').css('background', 'transparent url(abstraction/core/styles/images/ajax-loader.gif) no-repeat center');
					sourceEditor.state.execute({
						fn: 'editSource',
						file: sourceEditor.file,
						content: sourceEditor.content,
						setContent: sourceEditor.setContent,
						editor: sourceEditor.codemirror,
						win: sourceEditor.window
					}, function() {
						if (sourceEditor.state.isCSS)
							for (var i in sourceEditor.linkedPreviews)
								sourceEditor.linkedPreviews[i].state.update();
						sourceEditor.$handle.find('.open-menu').css('background', '');
					}, callback);
				sourceEditor.content = sourceEditor.codemirror.getCode();
				//alert(sourceEditor.content);
			}
			SourceEditor.prototype.setContent = function(newContent) {
				this.content = newContent;
			}
			SourceEditor.prototype.setSource = function(file) {
				var sourceEditor = this;
				if (sourceEditor.file != undefined)
					sourceEditors.remove(sourceEditor.file);
				sourceEditor.file = file;
				sourceEditors.put(sourceEditor.file, sourceEditor);
			}
			SourceEditor.prototype.setZindex = function() {
				var i = this.state.winZindex.length;
				while (i--)
					if (this.state.winZindex[i] === this) {
						this.state.winZindex.splice(i, 1);
					}
				this.state.winZindex[this.state.winZindex.length] = this;
			}
			SourceEditor.prototype.toggleMenu = function() {
				var sourceEditor = this;
				if (sourceEditor.menuClosed) {
					sourceEditor.$menu.show();
					sourceEditor.menuClosed = false;
				} else {
					sourceEditor.$menu.hide();
					sourceEditor.menuClosed = true;
				}
			}
			SourceEditor.prototype.update = function() {
				var sourceEditor = this;
				sourceEditor.content = sourceEditor.state.html('clean');
				sourceEditor.codemirror.setCode(sourceEditor.content);
				//alert('t');
				//sourceEditor.resizeCodemirror();
			}
			SourceEditor.prototype.updateCodemirror = function() {
				//this.codemirror.refresh();
				abstraction.saveUI();
			}
			return SourceEditor;
		})();
		this.SourceEditor = SourceEditor;
		
		var SourceOutline = (function() {
			SourceOutline.Inherits(ui.Window);
			function SourceOutline(file, taskbars, parent) {
				// Argument logic
					parent = parent || abstraction.desktop;
				// Local variable declaration
				var sourceOutline = this,
					editWrapper;
				
				sourceOutline.elementHash = new Hashtable();      // Stores the references of items in the overview to their respective items in the document
				sourceOutline.name = "sourceOutline";
				sourceOutline.file;
				sourceOutline.closeAttributeEditor = function(){};
				sourceOutline.isHidden = true;
				sourceOutline.window = $("<div/>")
						.attr({
							id: 'absOverview',
							style: 'display: none;'
						})
						.addClass("window abs-sourceOutline-ui abs-ui")
						.appendTo(parent),
				sourceOutline.$wrapper = $("<div/>")		
						.attr('id', "absOverviewWrapper")
						.addClass("content abs-ui")
						.appendTo(sourceOutline.window);
				sourceOutline.wrapper = sourceOutline.$wrapper.get(0);		
				sourceOutline.menuClosed = true;

				var menu = new ui.Menu({
					close: {
						content: '<span class="abs-menu-delete"></span>Close',
						click: function() { sourceOutline.close(); }
					},
					insert: "<hr />",
					options: {
						content: '<span class="abs-menu-options"></span>Options',
						styles: 'color: gray;'
					}
				});
				menu.$
					.addClass("window-menu")
					.mouseenter(function() {
							clearTimeout(menuTimer)
					})
					.mouseleave(function() {
						menuTimer = setTimeout(function() {
							sourceOutline.$menu.hide();
							sourceOutline.menuClosed = true;
						}, 500);
					});	
					
				sourceOutline.options({
					selector: sourceOutline.window,
					title: "<div class='abs-overview-icon'></div>Outline",
					taskbar: taskbars,
					top: 20,
					dragstop: sourceOutline.saveUI,
					resizestop: sourceOutline.saveUI,
					minimize: sourceOutline.saveUI,
					unminimize: sourceOutline.saveUI,
					maximize: false,
					menu: menu,
					openmenu: sourceOutline.toggleMenu,
					focus: sourceOutline.onfocus
				});
				if (file != undefined)
					sourceOutline.load(file);
				sourceOutline.focus();
			}
			// Method which unlinks the sourceOutline from it's current documentState
			SourceOutline.prototype.clear = function() {
				this.state = undefined;
				this.$wrapper.unbind().empty();
				this.$.css('display', 'none');
				this.isHidden = true;
			}
			// Method which updates the abstraction overview
			SourceOutline.prototype.load = function(file) {
				var sourceOutline = this,
					arr = file.split(abstraction.root);
				if (arr.length > 1)
					file = arr[1];
				arr = file.split("/");
				for (var i=0; i<arr.length-1; i++)
					if (arr[i] != "") {
						sourceOutline.currentPath += arr[i]+"/";
						sourceOutline.returnPath += "../";
					}
				arr = file.split("?");
				file = arr[0];
				if (file.charAt(0) != "/")
					file = "/"+file;
				if (sourceOutline.currentDoc == undefined)  // If abstraction was just loaded...
					sourceOutline.currentDoc = uncacheSafe(file.substr(1));
				else {
					sourceOutline.lastDoc = sourceOutline.currentDoc;
					sourceOutline.currentDoc = uncacheSafe(file.substr(1));
					abstraction.saveUI();
				}
				sourceOutline.state = documentStates.get(file);
				if (sourceOutline.state != undefined)
					sourceOutline.state.onload(function() {
						sourceOutline.file = file;
						sourceOutline.update();
						sourceOutline.$.css('display', 'block');
						sourceOutline.isHidden = false;
						if (sourceOutline.isAttached) {
							var l = ui.maximizedWindows.length;
							while (l--)
								ui.maximizedWindows[l].maximize(true);
						}
					});
			}
			SourceOutline.prototype.oncontextmenu = function(e) {
				var sourceOutline = this,
					newleft, newtop;
				e = window.event || e;    // window.event is for IE
				if (e.stopPropagation)
					e.stopPropagation();  // Standards complient browsers
				else
					e.cancelBubble=true;  // IE
				var target = e.target != null ? e.target : e.srcElement;
				target = $(target).closest("div").get(0);
				target = sourceOutline.elementHash.get(target);
				if (e.pageX != undefined) {
					newleft = e.pageX;
					newtop = e.pageY;
				} else {
					newleft = e.clientX;
					newtop = e.clientY;
				}
				//if (frameDoc.getElementFromPoint)
				//	elem = frameDoc.getElementFromPoint(newleft, newtop);
				//else
				//	elem = frameDoc.elementFromPoint(newleft, newtop);
				if (abstraction.contextMenu.element(target, sourceOutline.state)) {  // Generate the element context menu
					if (newtop + abstraction.contextMenu.$.outerHeight() > $window.height())  // This keeps the context menu from displaying lower then the bottom of the window
						newtop = $window.height() - abstraction.contextMenu.$.outerHeight();
					abstraction.contextMenu.$
						.css({ display: 'none', left: newleft+'px', top: newtop+'px' })
						.fadeIn("fast");
				}
				e.preventDefault();
				return false;
			}
			SourceOutline.prototype.onfocus = function() {
				var sourceOutline = this;
				abstraction.updateGroupFocus(sourceOutline);
			}
			SourceOutline.prototype.saveUI = function() {
				abstraction.saveUI();
			}
			SourceOutline.prototype.setZindex = function() {
				var i = abstraction.groupZindex.length;
				while (i--)
					if (abstraction.groupZindex[i] === this) {
						abstraction.groupZindex.splice(i, 1);
					}
				abstraction.groupZindex[abstraction.groupZindex.length] = this;
			}
			// Stops event bubbling in the property editors
			SourceOutline.prototype.stopBubble = function(e) {
				e = window.event || e;    // window.event is for IE
				if (e.stopPropagation)
					e.stopPropagation();  // Standards complient browsers
				else
					e.cancelBubble=true;  // IE
			}
			SourceOutline.prototype.toggleMenu = function() {
				var sourceOutline = this;
				if (sourceOutline.menuClosed) {
					sourceOutline.$menu.show();
					sourceOutline.menuClosed = false;
				} else {
					sourceOutline.$menu.hide();
					sourceOutline.menuClosed = true;
				}
			}
			// Method which updates the abstraction overview
			SourceOutline.prototype.update = function() {
				var sourceOutline = this,
					//keys = getKeys(php),
					curPHP = 0,
					newOvFragment = document.createDocumentFragment(),  // Container that will hold all of our new overview data
					newOvItem = document.createElement("div");
				if (sourceOutline.state.isHTML) {
					sourceOutline.$handle.find('.open-menu').css('background', 'transparent url(abstraction/core/styles/images/ajax-loader.gif) no-repeat center');
					newOvItem.setAttribute("class", "absOvItem");
					newOvItem.setAttribute("style", "margin-left: 0px;");
					newOvItem.innerHTML = "&lt;HTML&gt;"
					newOvFragment.appendChild(newOvItem);					// Append new HTML element to the overview fragment
					//$("#absOverviewWrapper").html(newOvItem);
					
					/* 
					// Add context menus to the new overview items
					newOvItem.oncontextmenu = function(e)
					{
						e = window.event || e;    // window.event is for IE
						if (e.stopPropagation)
							e.stopPropagation();  // Standards complient browsers
						else
							e.cancelBubble=true;  // IE
						public.openMenu(e, window.frames["absSiteIframe"].document.firstChild, true); return false;
					}
					*/
					var childWrapper = document.createElement("div");
						childWrapper.setAttribute("class", "abs-child-wrapper");
									
					newOvFragment.appendChild(childWrapper);
						
					sourceOutline.$wrapper.find("*").each( function() {
						$(this).unbind().get(0).oncontextmenu = null;
					});
						
					sourceOutline.traverseDOM(sourceOutline.state.doc.firstChild, childWrapper, 1);
					sourceOutline.$wrapper.unbind().empty()
						.mouseleave(function() {
							if (sourceOutline.state.preview)
								sourceOutline.state.preview.$selector.dequeue().fadeOut('fast');
						})
						.bind('contextmenu', function(e) { sourceOutline.oncontextmenu(e); });
					sourceOutline.wrapper.appendChild(newOvFragment);
					sourceOutline.$handle.find('.open-menu').css('background', '');
				} else
					sourceOutline.clear();
				newOvFragment = null;  // This is to prevent a memory leak
				newOvItem = null;
				childwrapper = null;
			}
			// Internal function used to explore all nodes in the DOM and add them to the overview
			SourceOutline.prototype.traverseDOM = function(elem, parentWrapper, depth) {
				var sourceOutline = this;
				setTimeout(function() {
					depth++;
					$(elem)
						.children()
						.each(function(){
							var $this = $(this),
								origElem = this,
								elemId,
								elemClass,
								elemName,
								elemSrc = "",
								dynamic = "",
								text = "";
								
							if ($this.hasClass("abs-ui")) return;
							
							// Create new element and indent based on depth in the DOM
							var newOvItem = document.createElement("div");
								newOvItem.setAttribute("style", "position: relative;");
								newOvItem.setAttribute("class", "absOvItem");
							var previewElem = sourceOutline.state.elementHash.get(origElem);
							sourceOutline.elementHash.put(previewElem, newOvItem);  // Attach a reference to the overview item using a reference to the element it corresponds to in the document
							sourceOutline.elementHash.put(newOvItem, previewElem);
							
							if (this.src != undefined) {
								var srcName = this.src.split("/");
								elemSrc = "<span style='color: #ff9900; margin-left: 5px; font-size: 10px; font-weight: bold;'>"+uncacheSafe(srcName[srcName.length-1])+"</span>";
							} else if (this.href != undefined) {
								var srcName = this.href.split("/");
								elemSrc = "<span style='color: #ff9900; margin-left: 5px; font-size: 10px; font-weight: bold;'>"+uncacheSafe(srcName[srcName.length-1])+"</span>";
							}
							if ($this.css('display') == 'none' || $this.css('visibility') == 'hidden')
								nodeName = "<span style='color: gray;'>&lt;"+this.nodeName+"&gt;</span>";
							else
								nodeName = "&lt;"+this.nodeName+"&gt;";
							if (this.nodeName == 'TITLE')
								text = "<span style='color: cfcfcf; margin-left: 5px; font-size: 10px; font-weight: bold;'>"+this.innerHTML+"</span>";
							// Insert node name and id + classes to the content of the overview element and append to DOM
							newOvItem.innerHTML = nodeName+dynamic+text;
							if ($this.attr("src") != undefined || $this.attr("href") != undefined) {
								var attr = (this.src != undefined) ? "src" : "href";
								var srcName = $this.attr(attr).split("/");
								//elemSrc = "<span style='color: orange; margin-left: 5px; font-size: 10px; font-weight: bold;'>"+uncacheSafe(srcName[srcName.length-1])+"</span>";
								elemSrc = document.createElement("span");
								elemSrc.setAttribute("style", 'color: #F5D0A9; margin-left: 5px; font-size: 10px; font-weight: bold;');
								elemSrc.innerHTML = uncacheSafe(srcName[srcName.length-1]);
								var origElem = this;
								/* REMOVED UNTIL LATER TIME
								$(elemSrc).bind("click", function(e) {
									e = window.event || e;    // window.event is for IE
									if (e.stopPropagation)
										e.stopPropagation();  // Standards complient browsers
									else
										e.cancelBubble=true;  // IE
									var elemSrc = this;
									sourceOutline.closeAttributeEditor();
									var curTop = $(elemSrc).position().top+'px';
									var curLeft = $(elemSrc).position().left+'px';
										editWrapper = document.createElement("div");
										editWrapper.setAttribute("style", 'position: absolute; top: '+curTop+'; left: '+curLeft+'; margin-left: 5px; color: orange; font-size: 10px; font-weight: bold; border: none; z-index: 2;');
										editWrapper.innerHTML = "";
										$(editWrapper).bind("click", sourceOutline.stopBubble);
									var editSrc = document.createElement("input");
										editSrc.setAttribute("type", 'text');
										editSrc.setAttribute("style", 'width: '+$(elemSrc).width()+'; color: #ff6600; margin: 0; padding: 0; font-size: 10px; font-weight: bold; border: none; z-index: 2; background-color: transparent;');
										editSrc.setAttribute("value", $(elemSrc).text());
									function setSrc(e) {
										var $this = $(this),
											$elemSrc = $(elemSrc);
										$elemSrc.html($this.val());
										$this.width($elemSrc.width());
									}
									$(editSrc).bind("keyup", setSrc);
									$(editWrapper).append(editSrc);
									$(elemSrc)
										.css("visibility", "hidden")
										.parent()
											.append(editWrapper);
									sourceOutline.closeAttributeEditor = function() {
										var $editSrc = $(editSrc);
										$(elemSrc).css("visibility", "");
										var newVal = $(origElem).attr(attr).split(srcName[srcName.length-1]);
											newVal = newVal[0]+$editSrc.val();
										sourceOutline.state.execute({
											fn: 'editAttribute',
											elem: origElem,
											attribute: attr,
											content: newVal
										});
										$editSrc.unbind("keyup", setSrc);
										$(editWrapper)
											.unbind("click", sourceOutline.stopBubble)
											.empty().remove();
										sourceOutline.closeAttributeEditor = function(){};
										elemSrc = null;
										editWrapper = null;
										editSrc = null;
										$editSrc = null;
									};
								});
								*/
								newOvItem.appendChild(elemSrc);
								elemSrc = null;
							}
							// If element has an id, display it in red to the right of the element
							if ($this.attr("id") != "" && $this.attr("id") != undefined) {
								elemId = document.createElement("span");
								elemId.setAttribute("style", 'color: #F5A9A9; margin-left: 5px; font-size: 10px; font-weight: bold;');
								elemId.innerHTML = "#"+$(this).attr("id");
								/*
								$(elemId).bind("click", function(e) {
									var elemId = this,
										$elemId = $(elemId);
									e = window.event || e;    // window.event is for IE
									if (e.stopPropagation)
										e.stopPropagation();  // Standards complient browsers
									else
										e.cancelBubble=true;  // IE
									sourceOutline.closeAttributeEditor();
									var curTop = $elemId.position().top+'px';
									var curLeft = $elemId.position().left+'px';
									editWrapper = document.createElement("div");
									editWrapper.setAttribute("style", 'position: absolute; top: '+curTop+'; left: '+curLeft+'; margin-left: 5px; color: red; font-size: 10px; font-weight: bold; border: none; z-index: 2;');
									editWrapper.innerHTML = "#";
									$(editWrapper).bind("click", sourceOutline.stopBubble);
									var editId = document.createElement("input");
									editId.setAttribute("type", 'text');
									editId.setAttribute("style", 'width: '+$elemId.width()+'; color: red; margin: 0; padding: 0; font-size: 10px; font-weight: bold; border: none; z-index: 2; background-color: transparent;');
									editId.setAttribute("value", $(origElem).attr("id"));	
									function setId(e) {
										var $this = $(this);
										$elemId.html('#'+$this.val());
										$this.width($elemId.width());
									}
									$(editId).bind("keyup", setId);
									$(editWrapper).append(editId);
									$elemId
										.css("visibility", "hidden")
										.parent()
											.append(editWrapper);
									sourceOutline.closeAttributeEditor = function() {
										$elemId.css("visibility", "");
										//public.execute({
										//	fn: 'editAttribute',
										//	elem: origElem,
										//	attribute: "id",
										//	content: $(editId).val()
										//});
										$(editId).unbind("keyup", setId);
										$(editWrapper)
											.unbind("click", sourceOutline.stopBubble)
											.empty().remove();
										sourceOutline.closeAttributeEditor = function(){};
										elemId = null;
										$elemId = null;
										editWrapper = null;
										editId = null;
									};
								});
								*/
								newOvItem.appendChild(elemId);
								elemId = null;
							}	
							// If element has classes, display them in blue to the right of the element
							if ($this.attr("class") != "" && $this.attr("class") != undefined) {
								elemClass = document.createElement("span");
								elemClass.setAttribute("style", 'color: #A9BCF5; margin-left: 5px; font-size: 10px; font-weight: bold;');
								elemClass.innerHTML = "."+$this.attr("class").replace(/([\s\S]*?)abs-administrable-element([\s\S]*?)/g, "");
								/*
								$(elemClass).bind("click", function(e) {
									var elemClass = this,
										$elemClass = $(this);
									e = window.event || e;    // window.event is for IE
									if (e.stopPropagation)
										e.stopPropagation();  // Standards complient browsers
									else
										e.cancelBubble=true;  // IE
									sourceOutline.closeAttributeEditor();
									var curTop = $elemClass.position().top+'px';
									var curLeft = $elemClass.position().left+'px';
										editWrapper = document.createElement("div");
										editWrapper.setAttribute("style", 'position: absolute; top: '+curTop+'; left: '+curLeft+'; margin-left: 5px; color: blue; font-size: 10px; font-weight: bold; border: none; z-index: 2;');
										editWrapper.innerHTML = ".";
										$(editWrapper).bind("click", sourceOutline.stopBubble);
									var editClass = document.createElement("input");
										editClass.setAttribute("type", 'text');
										editClass.setAttribute("style", 'color: blue; margin: 0; padding: 0; font-size: 10px; font-weight: bold; border: none; z-index: 2; background-color: transparent;');
										editClass.setAttribute("value", $(origElem).attr("class"));
									function setClass(e) {
										var $this = $(this);
										$elemClass.html('#'+$this.val());
										$this.width($elemClass.width());
									}
									$(editClass).bind("keyup", setClass);
									$(editWrapper).append(editClass);
									$elemClass
										.css("visibility", "hidden")
										.parent()
											.append(editWrapper);
									sourceOutline.closeAttributeEditor = function() {
										$elemClass.css("visibility", "");
										//public.execute({
										//	fn: 'editAttribute',
										//	elem: origElem,
										//	attribute: "class",
										//	content: $(editClass).val()
										//});
										$(editClass).unbind("keyup", setClass);
										$(editWrapper)
											.unbind("click", sourceOutline.stopBubble)
											.empty().remove();
										sourceOutline.closeAttributeEditor = function(){};
										elemClass = null;
										$elemClass = null;
										editWrapper = null;
										editClass = null;
									};
								});
								*/
								newOvItem.appendChild(elemClass);
								elemClass = null;
							}
							// If element has a name, display it in green to the right of the element
							if ($this.attr("name") != undefined) {
								elemName = document.createElement("span");
								elemName.setAttribute("style", 'color: #BCF5A9; margin-left: 5px; font-size: 10px; font-weight: bold;');
								elemName.innerHTML = $this.attr("name");
								/*
								$(elemName).bind("click", function(e) {
									var elemName = this,
										$elemName = $(this);
									e = window.event || e;    // window.event is for IE
									if (e.stopPropagation)
										e.stopPropagation();  // Standards complient browsers
									else
										e.cancelBubble=true;  // IE
									sourceOutline.closeAttributeEditor();
									var curTop = $elemName.position().top+'px';
									var curLeft = $elemName.position().left+'px';
										editWrapper = document.createElement("div");
										editWrapper.setAttribute("style", 'position: absolute; top: '+curTop+'; left: '+curLeft+'; margin-left: 5px; color: green; font-size: 10px; font-weight: bold; border: none; z-index: 2;');
										editWrapper.innerHTML = "";
										$(editWrapper).bind("click", sourceOutline.stopBubble);
									var editName = document.createElement("input");
										editName.setAttribute("type", 'text');
										editName.setAttribute("style", 'color: green; margin: 0; padding: 0; font-size: 10px; font-weight: bold; border: none; z-index: 2; background-color: transparent;');
										editName.setAttribute("value", $(origElem).attr("name"));
									function setName(e) {
										var $this = $(this);
										$elemName.html($this.val());
										$this.width($elemName.width());
									}
									$(editName).bind("keyup", setName);
									$(editWrapper).append(editName);
									$elemName
										.css("visibility", "hidden")
										.parent()
											.append(editWrapper);
									sourceOutline.closeAttributeEditor = function() {
										$elemName
											.css("visibility", "");
										//public.execute({
										//	fn: 'editAttribute',
										//	elem: origElem,
										//	attribute: "name",
										//	content: $(editName).val()
										//});
										$(editName).unbind("keyup", setName);
										$(editWrapper)
											.unbind("click", sourceOutline.stopBubble)
											.empty().remove();
										sourceOutline.closeAttributeEditor = function(){};
										elemName = null;
										$elemName = null;
										editWrapper = null;
										editName = null;
									};
								});
								*/
								newOvItem.appendChild(elemName);
								elemName = null;
							}	
						
							$(parentWrapper).append(newOvItem);
			
							var elem = this;  // This is to preserve the meaning of 'this' within the following internal methods
							var previewElem = sourceOutline.state.elementHash.get(elem);
							
							$(newOvItem)
								.mouseenter( function() {
									if (sourceOutline.state.preview && !sourceOutline.isDragging && !$(previewElem).is("body")) {
										var scrolltop = (navigator.userAgent.indexOf("Firefox")!=-1) ? $(sourceOutline.state.frame.contentWindow.document).find('html,body').scrollTop() : $(sourceOutline.state.frame.contentWindow.document).find('body').scrollTop();
										sourceOutline.state.preview.$selector
											.dequeue()
											.css({
												display: 'block'
											})
											.animate({
												//top: $(elem).offset().top - window.frames["absSiteIframe"].document.body.scrollTop + $("#absSiteIframe").offset().top,
												//left: $(elem).offset().left + $("#absSiteIframe").offset().left,
												top: $(previewElem).offset().top - scrolltop,
												left: $(previewElem).offset().left,
												width: $(previewElem).outerWidth(),
												height:  $(previewElem).outerHeight(),
												opacity: 0.5
											}, "fast");
									} else
										sourceOutline.state.preview.$selector.dequeue().fadeOut("fast");
								});
							
							// Now check the current element for children and parse through them as well
							if ($this.children().length > 0) {
								var childWrapper = $("<div/>")
									.attr("class", "abs-child-wrapper")
									.css("display", "block");
									//.sortable({
									//	cursor: 'ns-resize',
									//	start: function(e, ui) {
											//$(ui.item).css('background-color', 'red');
									//	}
									//});
										
								$(parentWrapper).append(childWrapper);
								
								var childToggle = $("<img/>")
									.attr("src", "abstraction/core/styles/images/hidechildren.png")
									.prependTo(newOvItem);
										
								if ($(elem).is("p, li, td, dd")) {
									childToggle
										.attr("src", "abstraction/core/styles/images/showchildren.png");
									childWrapper
										.css("display", "none");
								}
								/*
								if (win.ovElems.get(elem) != undefined) {
									if (win.ovElems.get(elem).css("display") == 'none') {
										childToggle
											.attr("src", "abstraction/core/styles/images/showchildren.png");
										childWrapper
											.css("display", "none");
									} //else if ($(this).is("head")) {
										//childToggle
										//	.attr("src", "abstraction/core/styles/images/showchildren.png");
										//childWrapper
										//	.css("display", "none");
									//}
								}*/
								
								$(newOvItem)
									.css("padding-left", (depth-1)*10)
									.click( function() {
										if (childWrapper.css("display") == "none") {
											childWrapper.slideDown('fast');
											childToggle.attr("src", "abstraction/core/styles/images/hidechildren.png");
										} else {
											childWrapper.slideUp('fast');
											childToggle.attr("src", "abstraction/core/styles/images/showchildren.png");
										}
										//sourceOutline.elementHash.put(elem, newOvItem);  // Attach a reference to the overview item using a reference to the element it corresponds to in the document
										//sourceOutline.elementHash.put(newOvItem, elem);
									});
								
								//alert(this.getAttribute("absid")+' - '+win.ovElems[this.getAttribute("absid")].css("display"));	
								sourceOutline.traverseDOM(this, childWrapper, depth);  // recurse through children of this element
							} else
								$(newOvItem).css("padding-left", ((depth-1)*10)+10);
							
							// If the element is administrable
							if ($(this).hasClass("abs-administrable-element")) {
								$(newOvItem)
									.css("background-color", "#FFEEEE")
									.prepend(document.createElement('div'))
									.find("div")
										.html("administrable")
										.css({
											fontSize: 10,
											color: '#666666',
											textAlign: 'right',
											marginRight: 5
										});
								$(childWrapper).css("background-color", "#FFEEEE");
							}
							newOvItem = null;
						});
				}, 0);
			}
			return SourceOutline;
		})();
	
		this.getRoot(function() {
			//window.onresize = this.resizeDesktop;
			
			abstraction.createBlackout();
			abstraction.createDesktop();
			abstraction.createTaskbar();
			//createSidebars();
			
			//getUI();
			abstraction.contextMenu = new ContextMenu();
			//abstraction.databaseManager = new DatabaseManager();
			abstraction.fileManager = new FileManager();
			abstraction.revisionManager = new RevisionManager();
			abstraction.sourceOutline = new SourceOutline();
			//new DocumentPreview("index.php", abstraction.taskbar);
			//new SourceEditor("index.php", abstraction.taskbar);
			//new DocumentPreview("blast.html", abstraction.taskbar);
			//new SourceEditor("blast.html", abstraction.taskbar);
			
			//abstraction.getUI();
			$("#absSplash")		// Remove the update screen
				.empty()
				.remove();
		});	
	}
	// Method which copies a file from one directory to another on the server
	Abstraction.prototype.copyFile = function(srcpath, destpath, callback) {
		var query = "fn=copy&src="+srcpath+"&dest="+destpath;
		
		$.ajax({
			type: "POST",
			url: "abstraction/core/scripts/php/files.php",
			data: query,
			success: callback
		});
	}
	Abstraction.prototype.createBlackout = function() {
		$(this.parent).append('<div id="absBlackout" class="abs-ui" style="opacity: 0; display: none; z-index: 0;"></div>');
	}
	// Method which creates and inserts the Desktop wrapper into the DOM
	Abstraction.prototype.createDesktop = function() {
		var abstraction = this;
		abstraction.desktop = document.createElement("div");
		abstraction.desktop.setAttribute("id", "absDesktop");
		abstraction.desktop.setAttribute("class", "abs-ui abs-desktop");
		$(abstraction.desktop).css({
			position: 'absolute',
			width: $(abstraction.parent).width(),
			height: $(abstraction.parent).height()
		});
		abstraction.parent.appendChild(abstraction.desktop);
	}
	// Method which creates a new directory on the server
	Abstraction.prototype.createDir = function(dirpath, callback) {
		var abstraction = this,
		// Send the url of the file to be created to the server via ajax
			query = "fn=dset&path="+dirpath;
		
		$.ajax({
			type: "POST",
			url: "abstraction/core/scripts/php/files.php",
			data: query,
			success: function(data) {
				if (data == "Warning: You must be logged in to edit files.")
					abstraction.restoreSession();
				else if (typeof callback == 'function')
					callback(data);
			}
		});
	}
	// Method which creates a new directory on the server
	Abstraction.prototype.createRevDir = function(dirname, dirpath, callback) {
		var abstraction = this,
		// Send the url of the file to be created to the server via ajax
			query = "fn=revdset&path="+dirpath+'&name='+dirname;
		
		$.ajax({
			type: "POST",
			url: "abstraction/core/scripts/php/files.php",
			data: query,
			success: function(data) {
				if (data == "Warning: You must be logged in to edit files.")
					abstraction.restoreSession();
				else if (typeof callback == 'function')
					callback(data);
			}
		});
	}
	// Method which creates the sidebars to which windows can be appended
	//Abstraction.prototype.createSidebars = function() {
	//	this.leftbar = new Sidebar(this.parent, "left");
	//	this.rightbar = new Sidebar(this.parent, "right");
	//}
	// Method which creates the abstraction window taskbar
	Abstraction.prototype.createTaskbar = function() {
		var abstraction = this,
			dropupTimer;
		
		var dropup = new ui.Menu({
			newDoc: {
				content: 'New Document',
				click: function() {
					new ui.Popup({
						title: 'Name Document',
						id: 'nameFilePopup',
						content: "<form id='nameFileForm'><fieldset style=\"margin: 10px;\"><label for=\"nameFile\">Enter a name for your new file:</label><input class=\"text_input\" name=\"nameFile\" id=\"nameFile\" type=\"text\" /><select id=\"fileExtensionSelect\"><option value=\"css\">.css</option><option value=\"html\">.html</option><option value=\"js\">.js</option><option value=\"pl\">.pl</option><option value=\"php\">.php</option><option value=\"txt\">.txt</option><option value=\"xml\">.xml</option></select><input class=\"button\" id=\"nameFileSubmit\" type=\"submit\" value=\"submit\" /></fieldset></form>",
						position: "average"
					});
					
					// Create submit event for the form and bring the first input into focus
					$("#nameFilePopup").find("form")
						.submit(createDoc)
						.find("input")[0]
							.focus();
					document.getElementById("nameFile").onkeyup = checkExt;
					dropup.$.slideUp();
					
					function createDoc() {
						var newName = document.getElementById("nameFile").value;
							newNameArr = newName.split(".");
						if (newNameArr.length == 1) {
							newExt = document.getElementById("fileExtensionSelect").value;
							newName = newNameArr[0]+'.'+newExt;
						} else
							newExt = newNameArr[1];
						switch (newExt.toLowerCase()) {
							case "html":
							case "htm":
								var content = '<!doctype HTML>\n<html lang="en">\n  <head>\n    <meta charset="utf-8">\n    <title>title</title>\n  </head>\n  <body>\n  </body>\n</html>';
								break;
							default:
								var content = "";
								break;
						}
						//alert('uncomment this text once setFileContents has been reimplemented...');
						abstraction.setFileContents("/"+newName, content, function() {
							//var fileType = getFileType("/"+newName),
							//isHTML = (fileType == 'html' || fileType == 'htm' || fileType == 'php') ? true : false;
							//if (isHTML && documentPreviews.get("/"+newName) == undefined)
							//	new DocumentPreview("/"+newName, abstraction.taskbar);
							//if (sourceEditors.get("/"+newName) == undefined)
							//	new SourceEditor("/"+newName, abstraction.taskbar);
							abstraction.fileManager.update();
						}, false);

						$("#nameFilePopup").fadeOut('fast', function() { $(this).empty().remove(); });
						return false;
					}
					function checkExt() {
						var newName = document.getElementById("nameFile").value;
						newNameArr = newName.split(".");
						if (newNameArr.length > 1)
							document.getElementById("fileExtensionSelect").disabled = "disabled";
						else
							document.getElementById("fileExtensionSelect").disabled = undefined;
					}
				}
			},
			saveDoc: {
				content: 'Save Document',
				click: function() {
					e = window.event || e;    // window.event is for IE
					if (e.stopPropagation)
						e.stopPropagation();  // Standards complient browsers
					else
						e.cancelBubble=true;  // IE
					abstraction.activeState.save();
					dropup.$.slideUp();
				}
			},
			hr1: "<hr/>",
			browser: {
				content: 'Browser'
			},
			hr2: "<hr/>",
			options: {
				content: 'Options',
				styles: 'color: gray;'
			},
			hr3: "<hr/>",
			logout: {
				content: 'Logout',
				click: function() {
					e = window.event || e;    // window.event is for IE
					if (e.stopPropagation)
						e.stopPropagation();  // Standards complient browsers
					else
						e.cancelBubble=true;  // IE
					var loc = window.location;
					window.location.href = loc.href+"?logout";
					//window.location = loc.protocol + '//' + loc.host + loc.pathname + loc.search;
				}
			}
		});
		dropup.$.addClass("abs-dropup-wrapper");
		
		var menu = document.createElement("div");							
			menu.setAttribute("class", "abs-options-menu");					// 		OUTPUT STRUCTURE
			menu.setAttribute("title", "Abstraction Options");
			menu.innerHTML = "<div class='abs-taskbarMenu-icon'></div>";
			menu.appendChild(dropup.fragment);
			$(menu).bind("click", function() {
				dropup.$.slideToggle();
				//dropup.$.css("display", "block");
			})
			.bind("mouseout", function() {
				function getArgs() {
					//alert("sgesg");
					dropup.$.slideUp();
				}
				dropupTimer = setTimeout(getArgs, 1000);
			})
			.bind("mouseover", function() {
				clearTimeout(dropupTimer);
			});
		var allWins = document.createElement("div");					//
			allWins.setAttribute("class", "abs-all-windows");		//	<div class="abs-taskbar-wrapper abs-ui">
			allWins.setAttribute("title", "Toggle Abstraction UI");
			allWins.innerHTML = "<div class='abs-allWindows-icon'></div>";
			$(allWins).bind("click", function() {
				if (abstraction.uiHidden)
					$(".window:not(.abs-documentPreview-ui)").css("display", 'block');
				else
					$(".window:not(.abs-documentPreview-ui)").css("display", 'none');
				abstraction.uiHidden = !abstraction.uiHidden;
				var l = ui.maximizedWindows.length;
				while (l--)
					ui.maximizedWindows[l].maximize(true);
			});
		var databaseManager = document.createElement("div");					//
			databaseManager.setAttribute("title", "Database Manager");
			databaseManager.innerHTML = "<div class='abs-databaseManager-icon'></div>";
			$(databaseManager).hover( function() {
				abstraction.databaseManager.$.addClass("ui-window-highlight");
			}, function() {
				abstraction.databaseManager.$.removeClass("ui-window-highlight");
			});
			$(databaseManager).click( function() {
				if (abstraction.databaseManager.isClosed) {
					abstraction.databaseManager.open();
					abstraction.databaseManager.focus();
				} else if (abstraction.databaseManager === ui.activeWindow || abstraction.databaseManager.isMinimized)
					abstraction.databaseManager.minToggle();
				else
					abstraction.databaseManager.focus();
			});

		var fileManager = document.createElement("div");					//
			fileManager.setAttribute("title", "File Manager");
			fileManager.innerHTML = "<div class='abs-fileManager-icon'></div>";
			$(fileManager).hover( function() {
				abstraction.fileManager.$.addClass("ui-window-highlight");
			}, function() {
				abstraction.fileManager.$.removeClass("ui-window-highlight");
			});
			$(fileManager).click( function() {
				if (abstraction.fileManager.isClosed) {
					abstraction.fileManager.open();
					abstraction.fileManager.focus();
				} else if (abstraction.fileManager === ui.activeWindow || abstraction.fileManager.isMinimized)
					abstraction.fileManager.minToggle();
				else
					abstraction.fileManager.focus();
			});
		var revisionManager = document.createElement("div");					//
			revisionManager.setAttribute("title", "Revision Manager");
			revisionManager.innerHTML = "<div class='abs-revisionManager-icon'></div>";
			$(revisionManager).hover( function() {
				abstraction.revisionManager.$.addClass("ui-window-highlight");
			}, function() {
				abstraction.revisionManager.$.removeClass("ui-window-highlight");
			});
			$(revisionManager).click( function() {
				if (abstraction.revisionManager.isClosed) {
					abstraction.revisionManager.open();
					abstraction.revisionManager.focus();
				} else if (abstraction.revisionManager === ui.activeWindow || abstraction.revisionManager.isMinimized)
					abstraction.revisionManager.minToggle();
				else
					abstraction.revisionManager.focus();
			});
		var sourceOutline = document.createElement("div");					//
			sourceOutline.setAttribute("title", "Document Outline");
			sourceOutline.innerHTML = "<div class='abs-overview-icon'></div>";
			$(sourceOutline).hover( function() {
				abstraction.sourceOutline.$.addClass("ui-window-highlight");
			}, function() {
				abstraction.sourceOutline.$.removeClass("ui-window-highlight");
			});
			$(sourceOutline).click( function() {
				if (abstraction.sourceOutline.isClosed) {
					abstraction.sourceOutline.open();
					abstraction.sourceOutline.focus();
				} else if (abstraction.sourceOutline === ui.activeWindow || abstraction.sourceOutline.isMinimized)
					abstraction.sourceOutline.minToggle();
				else
					abstraction.sourceOutline.focus();
			});
		var options = document.createElement("div");						//		<div class="abs-options">
			options.setAttribute("class", "abs-options");					//			<span class="abs-options-menu"></span>
			options.appendChild(menu);	
			options.appendChild(allWins);										//			<span class="abs-resolution-menu"></span>
			//options.appendChild(databaseManager);
			options.appendChild(fileManager);
			options.appendChild(revisionManager);
			options.appendChild(sourceOutline);
			//options.appendChild(browser);									//		<div class="abs-taskbar"></div>
		var taskbarDiv = document.createElement("div");						//	</div>
			taskbarDiv.setAttribute("class", "abs-taskbar");
		var taskbarBG = document.createElement("div");						//	</div>
			taskbarBG.setAttribute("class", "abs-taskbar-bg");
		$(taskbarDiv).bind('contextmenu', function(e) {
			var newleft, newtop;
			e = window.event || e;    // window.event is for IE
			if (e.stopPropagation)
				e.stopPropagation();  // Standards complient browsers
			else
				e.cancelBubble=true;  // IE
			var target = e.target != null ? e.target : e.srcElement;
			target = $(target).closest("span").data("win");
			//alert($window.height() +' '+ abstraction.contextMenu.$.outerHeight());
			//if (frameDoc.getElementFromPoint)
			//	elem = frameDoc.getElementFromPoint(newleft, newtop);
			//else
			//	elem = frameDoc.elementFromPoint(newleft, newtop);
			if (abstraction.contextMenu.taskbar(target)) {  // Generate the taskbar item's context menu
				//newtop -= 20;
				if (e.pageX != undefined) {
					newleft = e.pageX;
					newtop = $window.height() - abstraction.contextMenu.$.outerHeight() - 25;
				} else {
					newleft = e.clientX;
					newtop = $window.height() - abstraction.contextMenu.$.outerHeight() - 25;
				}
				if (newtop + abstraction.contextMenu.$.outerHeight() > $window.height())  // This keeps the context menu from displaying lower then the bottom of the window
					newtop = $window.height() - abstraction.contextMenu.$.outerHeight();
				abstraction.contextMenu.$
					.css({ display: 'none', left: newleft+'px', top: newtop+'px' })
					.fadeIn("fast");
			}
			e.preventDefault();
			return false;
		});
		var wrapper = document.createElement("div");						
			wrapper.setAttribute("class", "abs-taskbar-wrapper abs-ui");
			wrapper.appendChild(options);
			wrapper.appendChild(taskbarDiv);
		document.body.appendChild(taskbarBG);
		document.body.appendChild(wrapper);
		abstraction.taskbar = new ui.Taskbar(taskbarDiv);
		//$("body").append('<div id="absOptions" class="abs-ui"><span id="absChangeResolution">R</span></div><div id="absTaskbar" class="abs-ui"></div>');
	}
	// Deletes a file or directory on the server
	Abstraction.prototype.deleteFile = function(srcpath, callback) {
		var abstraction = this,
			query = "fn=del&src="+srcpath;
		$.ajax({
			type: "POST",
			url: "abstraction/core/scripts/php/files.php",
			data: query,
			success: function(data) {
				if (data == "Warning: You must be logged in to edit files.")
					abstraction.restoreSession();
				else if (typeof callback == 'function')
					callback(data, srcpath);
			}
		});
	}
	// Function for handling document clicks
	Abstraction.prototype.docClick = function(e) {
		this.contextMenu.close();
	}
	// Get a list of the contents of a directory from the server
	Abstraction.prototype.getDirContents = function(dirpath, callback) {
		var abstraction = this,
		// Send the url of the file to be retreaved to the server via ajax
			query = "fn=dir&path="+dirpath;
		
		$.ajax({
			type: "POST",
			url: "abstraction/core/scripts/php/files.php",
			data: query,
			dataType: 'json',
			success: function(data) {
				if (data == "Warning: You must be logged in to edit files.")
					abstraction.restoreSession();
				else if (typeof callback == 'function')
					callback(data);
			}
		});
	}
	// Method which accesses and retrieves the contents of a file on the server
	Abstraction.prototype.getFileContents = function(url, callback) {
		var abstraction = this,
			options = {
				type: "POST",
				url: "abstraction/core/scripts/php/files.php",
				data: "fn=get&path="+encodeURIComponent(url), // Send the url of the file to be retreaved to the server via ajax
				success: function(data) {
					if (data == "Warning: You must be logged in to edit files.")
						abstraction.restoreSession();
					else if (typeof callback == 'function')
						callback(data);
			}
		}
		$.ajax(options);
	}
	// Retrieves the url path to the abstraction root
	Abstraction.prototype.getRoot = function(callback)	{
		var abstraction = this;
		$.ajax({
			type: "POST",
			url: "abstraction/core/scripts/php/files.php",
			data: "fn=root",
			success: function(data) {
				abstraction.root = data;
				if (typeof callback == 'function')
					callback(data);
			}
		});
	}
	// Get the UI state from the filesystem and apply it to the abstraction editor
	Abstraction.prototype.getUI = function() {
		var abstraction = this;
		abstraction.getFileContents('/desktop/'+uiFile, function(data) {
			data = data.split("|!BREAK!|");
			var windows = {
				'databaseManager': abstraction.databaseManager, 
				'fileManager': abstraction.fileManager,
				'revisionManager': abstraction.revisionManager,
				'sourceOutline': abstraction.sourceOutline
			}
			abstraction.autosave = (data.splice(0,1) == 'true') ? true : false;
			abstraction.protectedMode = (data.splice(0,1) == 'true') ? true : false;
			abstraction.editorsDockable = (data.splice(0,1) == 'true') ? true : false;
			abstraction.previewsDockable = (data.splice(0,1) == 'true') ? true : false;
			var l = data.length-1;
			while (l--) {
				var args = data[l].split(','),
					win = windows[args[0]];
				if (win) {
					win.options({
						left: args[1],
						top: args[2],
						width: args[3],
						height: args[4],
						minimized: args[5],
						maximized: args[6]
					});
					if (win.name == 'fileManager') {
						win.preview = (args[7] == 'false') ? false : true;
						if (win.preview)
							win.$.find('.previewToggle').find('span').attr("class", "abs-menu-check");
						else
							win.$.find('.previewToggle').find('span').attr("class", "abs-menu-blank");
						win.update();
					}
					//alert(args[7]);
					win.checkBounds();
					win.focus();
				} else {
					switch (args[0]) {
						case 'sourceEditor':
							var win = new abstraction.SourceEditor(args[7], abstraction.taskbar, {
								left: args[1],
								top: args[2],
								width: args[3],
								height: args[4],
								minimized: args[5],
								maximized: args[6]
							});
							//if (!args[6])
							//win.checkBounds();
							if (win.isAttached) {
								var i = window.maximizedWindows.length;
								while (i--)
									window.maximizedWindows[i].maximize(true);
							}
							win = null;
							break;
						case 'documentPreview':
							var win = new abstraction.DocumentPreview(args[7], abstraction.taskbar, {
								left: args[1],
								top: args[2],
								width: args[3],
								height: args[4],
								minimized: args[5],
								maximized: args[6]
							});
							//win.bindWorkingDocs();
							//if (!args[6])
							//	win.checkBounds();
							win = null;
							break;
						default:
							break;
					}
				}
			}
			abstraction.uiLoaded = true;
		});
	}
	// Renames a file on the server
	Abstraction.prototype.renameFile = function(srcpath, callback) {
		var abstraction = this,
			oldName = srcpath.split('/'),
			oldPath = '';
		for (var i=0; i<oldName.length-1; i++)
			oldPath += oldName[i]+'/';
		oldName = oldName[oldName.length-1];
		var popupContents = "<form><fieldset style=\"margin: 10px;\"><label for=\"renameFile\">Enter a new name for your file:</label><input class=\"text_input\" name=\"renameFile\" id=\"renameFile\" type=\"text\" value=\""+oldName+"\" /><input class=\"button\" id=\"renameFileSubmit\" type=\"submit\" value=\"submit\" /></fieldset></form>";
		new ui.Popup({
			id: "renameFilePopup",
			content: popupContents,
			title: "Rename Document",
			position: "average"
		});
					
		//document.getElementById("renameFileSubmit").onclick = setName;
		$("#renameFilePopup").find("form")
			.submit(setName)
			.find("input")[0]
				.focus();
					
		function setName() {
			var newName = document.getElementById("renameFile").value;
						
			var query = "fn=rename&src="+srcpath+"&name="+newName;
			$.ajax({
				type: "POST",
				url: "abstraction/core/scripts/php/files.php",
				data: query,
				success: function(data) {
					if (data == "Warning: You must be logged in to edit files.")
						abstraction.restoreSession();
					else if (typeof callback == 'function')
						callback(data, newName, oldPath);
				}
			});

			$("#renameFilePopup").fadeOut('fast', function() { $(this).empty().remove(); });
			return false;
		}
	}
	// Renames a revision on the server
	Abstraction.prototype.renameRevision = function(srcpath, callback) {
		var abstraction = this,
			popupContents = "<form><fieldset style=\"margin: 10px;\"><label for=\"renameRevision\">Enter a new name for your revision:</label><input class=\"text_input\" name=\"renameRevision\" id=\"renameRevision\" type=\"text\" /><input class=\"button\" id=\"renameRevisionSubmit\" type=\"submit\" value=\"submit\" /></fieldset></form>";
		new ui.Popup({
			id: "renameRevisionPopup",
			content: popupContents,
			title: "Rename Revision",
			position: "average"
		});
					
		//document.getElementById("renameRevisionSubmit").onclick = setName;
		$("#renameRevisionPopup").find("form")
			.submit(setName)
			.find("input")[0]
				.focus();
					
		function setName() {
			var newName = document.getElementById("renameRevision").value;
						
			var query = "fn=renamerev&src="+srcpath+"&name="+newName;
			$.ajax({
				type: "POST",
				url: "abstraction/core/scripts/php/files.php",
				data: query,
				success: function(data) {
					if (data == "Warning: You must be logged in to edit files.")
						abstraction.restoreSession();
					else if (typeof callback == 'function')
						callback(data, newName);
				}
			});

			$("#renameRevisionPopup").fadeOut('fast', function() { $(this).empty().remove(); });
			return false;
		}
	}
	// Restores a timed out session seamlessly
	Abstraction.prototype.restoreSession = function(callback) {
		callback = callback || function(){};
		var popupContents = '<div class="abs-login-wrapper"><div class="abs-login-bg"></div><div class="abs-login-logo"></div><p>You have been logged out due to inactivity.  Please log in again:</p><form><fieldset><label for="loginUsername">Username</label><input id="loginUsername" name="loginUsername" type="text" /><br /><label for="loginPassword">Password</label><input id="loginPassword" name="loginPassword" type="password" /><input id="loginSubmit" name="loginSubmit" type="submit" value="Login" /></fieldset></form></div>';
		new ui.Popup({
			id: "restoreSessionPopup",
			content: popupContents,
			title: "Please log back in",
			position: "center"
		});
					
		//document.getElementById("renameRevisionSubmit").onclick = setName;
		$("#restoreSessionPopup")
			.find("form")
				.submit(relog)
				.find("input")[0]
					.focus();
					
		function relog() {
			var username = document.getElementById("loginUsername").value,
				password = document.getElementById("loginPassword").value;
						
			var query = "fn=relog&user="+username+"&pass="+password;
			$.ajax({
				type: "POST",
				url: "abstraction/core/scripts/php/files.php",
				data: query,
				success: callback
			});

			$("#restoreSessionPopup").fadeOut('fast', function() { $(this).empty().remove(); });
			return false;
		}
	}
	// Save the current UI state to the filesystem
	Abstraction.prototype.saveUI = function() {
		if (this.uiLoaded) {
			var abstraction = this,
				output = abstraction.autosave+'|!BREAK!|'+abstraction.protectedMode+'|!BREAK!|'+abstraction.editorsDockable+'|!BREAK!|'+abstraction.previewsDockable+'|!BREAK!|',
				i = abstraction.groupZindex.length;
			while (i--) {
				var group = abstraction.groupZindex[i];
				if (group.name == 'documentState') {
					var l = group.winZindex.length;
					while (l--) {
						var win = group.winZindex[l];
						output += win.name+','+win.left()+','+win.top()+','+win.width()+','+win.height()+','+win.isMinimized+','+win.isMaximized+','+win.file+'|!BREAK!|';
					}
				} else
					output += group.name+','+group.left()+','+group.top()+','+group.width()+','+group.height()+','+group.isMinimized+','+group.isMaximized+','+group.preview+'|!BREAK!|';
			}
			//alert(output);
			abstraction.setFileContents('/desktop/'+uiFile, output, function(){});
		}
	}
	// Method which writes to the contents of a file on the server
	Abstraction.prototype.setFileContents = function(url, content, callback, overwrite) {  // if overwrite is set to false, then it will not overwrite if the document already exists. defaults to true
		var abstraction = this;
		// Send the url of the file to be edited, along with the new content, to the server via ajax
		if (overwrite == false)
			var query = "fn=lset&path="+url+"&content="+encodeURIComponent(content);
		else
			var query = "fn=gset&path="+url+"&content="+encodeURIComponent(content);
		
		$.ajax({
			type: "POST",
			url: "abstraction/core/scripts/php/files.php",
			data: query,
			success: function(data) {
				if (data == "Warning: You must be logged in to edit files.")
					abstraction.restoreSession();
				else if (typeof callback == 'function')
					callback(data);
			}
		});
	}
	Abstraction.prototype.updateGroupFocus = function(win) {
		var i, sl, wl, curGroup, curZ = 0;
		if (win != undefined)
			win.setZindex();
		if (win.state != undefined && win !== this.sourceOutline && win !== this.revisionManager)
			win.state.setZindex();
		sl = this.groupZindex.length;
		for (i=0; i<sl; i++) {
			curZ = ((i+1)*100)*10;
			curGroup = this.groupZindex[i];
			//alert(curGroup.file+" "+curGroup.name);
			if (curGroup.winZindex != undefined) {
				wl = curGroup.winZindex.length;
				for (j=0; j<wl; j++) {
					curZ+=(j+1);
					curGroup.winZindex[j].$.css("z-index", curZ);
				}
			} else
				curGroup.$.css("z-index", curZ);
		}
		this.saveUI();
	}
	return Abstraction;
})();

	//////////////////////////////////////////
	// Global utility methods and functions //
	//////////////////////////////////////////

function isDir(file) {  // Simple boolean check if a file is a directory
	file = file.split('.');
	return (file.length == 1);
}

function getFileType(file, filetype) {  // filetype is an optional arg passed in by the server
	file = file.split('/');
	file = file[file.length-1];
	file = file.split('?', 2);
	file = file[0].split('.');
	var fileExt = file[file.length-1].toLowerCase();
	if (filetype == 'dir')
		return 'dir';
	else
		return fileExt;
}

function cacheSafePath(url) {  // PHP safe cache control string appended to url to prevent caching in the iframe
	var rand = new Date().getTime();
	url = url.split('?', 2);
	return (url.length == 1) ? url[0]+"?cacheControl="+rand : url[0]+"?"+url[1]+"&cacheControl="+rand;
}

function uncacheSafe(url) {  // reverse the cache safe function, removing the control string
	if (url != undefined){
		url = url.split('?cacheControl', 2);
		if (url.length == 1) {
			url = url[0].split('&cacheControl', 2);
		}
		return url[0];
	} else
		return false;
}

function text2html(data) {
	return data
		.replace(/(\n\r|\n|\r)/g, '<br />\n')
		.replace(/\t/g, '&nbsp;&nbsp;&nbsp;&nbsp;');
		//.replace(/\s/g, '&nbsp;');
}

function getKeys(obj) {
   var keys = [];
   for(var key in obj){
      keys.push(key);
   }
   return keys;
}

function dateSortAsc(date1, date2) {
  if (date1 > date2) return 1;
  if (date1 < date2) return -1;
  return 0;
};

function dateSortDesc(date1, date2) {
  if (date1 > date2) return -1;
  if (date1 < date2) return 1;
  return 0;
};

// Function which removes whitespace from markup
jQuery.fn.cleanWhitespace = function() {
    this.contents().filter(function() {
        if (this.nodeType != 3 && this.nodeName != "IFRAME") {  // It breaks if it tries to clean whitespace from the contents of an iframe
            $(this).cleanWhitespace();
            return false;
        } else
            return !/\S/.test(this.nodeValue);
    }).remove();
    return this;
}

// function which formats markup with proper tabbing and line breaks
var cleanDepth = 1;
jQuery.fn.cleanMarkup = function() {
	var lastNode;
   this.contents().each(function() {
        if (this.nodeType == 1) {
	       // cleanStyles(this);
	        if (lastNode != 3) {
				// Generate whitespace
		        var whitespace = '\n',
		        	curDepth = cleanDepth;
		        while (curDepth--)
		        	whitespace += '  ';
				// Insert whitespace before the element
		        $(this).before(document.createTextNode(whitespace));
				// If the current node is not an Iframe, search it's children and clean them too
				if (this.nodeName != "IFRAME") {
					// Recurse to all children
					cleanDepth++;
					$(this).cleanMarkup();
					cleanDepth--;
					// If the last node is an element then insert the whitespace between it and its parent's closing tag
					if ($(this).contents().last().get(0) != undefined && $(this).contents().last().get(0).nodeType == 1)
						$(this).contents().last().after(document.createTextNode(whitespace));
				}
			}
        }
 		lastNode = this.nodeType;
    });
    lastNode = null;
    return this;
}