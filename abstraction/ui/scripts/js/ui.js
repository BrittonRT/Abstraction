// Abstraction v.1.0 (c) 2008-2011 Britton Reeder-Thompson //
//                  UI Object Definition                   //

// Global shortcuts
var $window = $(window),
	$document = $(document),
	ui;
	
$document.ready(function() {
	ui = new UI();
});
// UI object prototype
var UI = (function() {
	function UI(callback) {
		var ui = this;
		ui.activeWindow;
		ui.windows = [];
		ui.windowClasses = ["window"];
		ui.globalZ = 1000;  // this is the current focus level z-index value
		ui.leftbar = [];
		ui.rightbar = [];
		ui.maximizedWindows = [];
		ui.minimizedWindows = []; // NOT ADDED YET
		ui.mouse = [];
		ui.input = {
			ctrl: false,
			alt: false,
			shift: false,
			mouse: {
				init: function() {
					window.onmousemove = this.calc_position;
				},
				calc_position: function(e) {
					if (!e) var e = window.event;
					if (e.pageX || e.pageY) {	
						ui.input.mouse.posx = e.pageX;
						ui.input.mouse.posy = e.pageY;	
					} else if (e.clientX || e.clientY) {
						ui.input.mouse.posx = e.clientX + document.body.scrollLeft
							+ document.documentElement.scrollLeft;
						ui.input.mouse.posy = e.clientY + document.body.scrollTop
							+ document.documentElement.scrollTop;	
					}
				},
				pos: function(dimension) {
					switch (dimension) {
						default:
							return [this.posx, this.posy];
							break;	
						case "x":
							return this.posx;
							break;		
						case "y":
							return this.posy;
							break;	
					}	
				},
				x: function() {
					return this.posx;		
				},
				y: function() {
					return this.posy;		
				}
			},
			key: {
				init: function() {
					window.onkeydown = this.calc_keydown;
					window.onkeyup = this.calc_keyup;
				},
				down_callbacks: {},
				up_callbacks: {},
				calc_keydown: function(e) {
					if (window.event) {	
						var keychar = e.keyCode;  
					} else if (e.which) {
						var keychar = e.which;  
					}
					var key = String.fromCharCode(keychar);
					var down_callback = ui.input.key.down_callbacks[key];
					if (typeof down_callback == "function") {	
						down_callback();	
					}
					ui.input.key[key] = true;
				},
				calc_keyup: function(e) {
					if (window.event) {	
						var keychar = e.keyCode;
					}
					else if (e.which) {	
						var keychar = e.which;
					}
					var key = String.fromCharCode(keychar);
					var up_callback = ui.input.key.up_callbacks[key];
					if (typeof up_callback == "function") {	
						up_callback();	
					}
					delete ui.input.key[key];
				},
				down: function(keys, callback) {
					if (callback) {
						for (var i in keys) {	
							this.down_callbacks[keys[i].toUpperCase()] = callback;	
						}
						return this;
					} else {
						var output = true;
						
						for (var i in keys) {	
							if (this[keys[i].toUpperCase()] == undefined) {	
								output = false;
								break;	
							}
						}
						return output;	
					}
				},
				up: function(keys, callback) {
					for (var i in keys) {
						this.up_callbacks[keys[i].toUpperCase()] = callback;	
					}
					return this;		
				}	
			}
		};
		ui.input.mouse.init();
		ui.input.key.init();
		ui.globalKeyup = function(e) {
			if (e.keyCode == 16)
				ui.input.shift = false;
			if (e.keyCode == 17)
				ui.input.ctrl = false;
			if (e.keyCode == 81)
				ui.input.alt = false;
		}
		ui.globalKeydown = function(e) {
			if (e.keyCode == 16)
				ui.input.shift = true;
			if (e.keyCode == 17)
				ui.input.ctrl = true;
			if (e.keyCode == 81)
				ui.input.alt = true;
		}
		$window.bind('keyup', ui.globalKeyup);
		$window.bind('keydown', ui.globalKeydown);
		$document.ready( function() {
			$document.bind("mouseup", function(e) {
				ui.activeWindow.stopDrag.call(ui.activeWindow, e);
				ui.activeWindow.stopResize.call(ui.activeWindow, e);
				$(".ui-window-iframeCover").remove();
			});
		});
		// UI.Window object prototype
		ui.Window = (function() {
			function Window() {  // Window object requires at least 1 argument (the 'selector' object)
				var win = this;	          // assign a jquery safe pointer to the 'this' object;
				
				// Window settings and options
				win.activeOptions = {};
				win.draggableOptions = {};
				win.resizableOptions = {};
				win.droppableOptions = {};
				win.mouse = [];
				win.getMousePosition;
				
				win.icon;
				win.handle;				  // The window's draggable handle.
				win.isDragging = false;   // Boolean which tells us if the window is being dragged
				win.isResizing = false;   // ... is being resized
				win.isMinimized = false;  // ... is minimized
				win.isMaximized = false;  // ... is maximized
				win.isAttached = false;   // ... is attached to the sidebar
				win.isClosed = false;
				win.attachedTo;
				win.original = {};		  // Stores information about the selector object before it was modified into a window
				win.status = "idle";
				win.dragTimer;
				win.ready = false;
				win.dockable = true;
				// Window options and argument handling
				//	this must remain at the bottom of the object definition!
				if (arguments.length == 0)
					return false;  // throw an error if no arguments are passed
				for (var i = 0; i < arguments.length; i++) {
					if (typeof arguments[i] == 'object' && typeof arguments[i] !== null && arguments[i]["members"] === undefined && arguments[i].nodeName === undefined)  // Find out if the argument is the options object, but not a taskbar
						win.options(arguments[i]);
					else {
						switch (i) {
							case 0:
								win.selector = arguments[0];  // Argument 1 defaults to the selector object
								win.$ =
								win.jquery = $(win.selector);
								break;
							case 1:
								win.title = arguments[1];	  // Argument 2 defaults to the window title
								break;
							case 2:
								if (arguments[2] != undefined)
									win.addToTaskbar(arguments[2]);   // selector for all taskbars of which this window is a member
								break;
						}
					}
				}
				if (win.selector == undefined)
					return false;  // throw an error if no selector has been passed in
				else if (typeof win.selector != 'string') {
					if (win.$.attr('id') == "")
						win.$.attr('id', "win-id-"+ui.windows.length);
					win.selector = "#"+win.$.attr('id');
				}
				//win.focus();
			}
			Window.prototype.width = function(size) {  // If size is passed in it sets the size of the window, otherwise it returns the current size
				var win = this;
				if (size == undefined)
					return win._width;
				win._width = size;
				if (!win.isMaximized && !win.isAttached)
					win.$.width(win._width);
				return win;
			}
			Window.prototype.height = function(size) {
				var win = this;
				if (size == undefined)
					return win._height;
				win._height = size;
				if (!win.isMaximized)
					win.$.height(win._height);
				return win;
			}
			Window.prototype.left = function(size) {
				var win = this;
				if (size == undefined)
					return win._left;
				win._left = size;
				if (!win.isMaximized)
					win.$.css({
						right: '',
						left: win._left+'px'
					});
				return win;
			}
			Window.prototype.top = function(size) {
				var win = this;
				if (size == undefined)
					return win._top;
				win._top = size;
				if (!win.isMaximized)
					win.$.css({
						bottom: '',
						top: win._top+'px'
					});
				return win;
			}
			Window.prototype.options = function(newOptions) {  // Set the options for the window
				var win = this;
				if (!win.ready) {
					ui.windows.push(win); // append it to the global windows array
					win.ready = true;
				}
				if (newOptions == undefined)
					return win.activeOptions;
				if (win.$ != undefined)
					win.$.draggable('destroy');
				//if ($(win.selector).parent().data('sortable') != 'undefined' && $(win.selector).parent().data('sortable')['widgetName'] == 'sortable')
				//	win.enableForSortable(newOptions);
				//else
					win.setOptions(newOptions);
				//$(win.selector).draggable(draggableOptions);
			}
			Window.prototype.setOptions = function(newOptions) {
				var win = this;
				
				$.extend(win.activeOptions, newOptions);	// the window's options are overidden with passed in options
				if (win.activeOptions['selector'] != undefined) {
					win.selector = win.activeOptions['selector'];
					win.$ =
					win.jquery = $(win.selector);
					// Set the 'original' settings object before making any changes
					if (win.original != {})
						win.original = {
							position: win.$.css("position"),
							top: win.$.css("top"),
							left: win.$.css("left"),
							bottom: win.$.css("bottom"),
							right: win.$.css("right"),
							width: win.$.css("width"),
							height: win.$.css("height"),
							zIndex: win.$.css("z-index")
						};
				}
				win.$parent = win.$.parent();
				win.parent = win.$parent.get(0);
				
				//alert(ui.windows.length+" : "+(ui.windows[ui.windows.length-1] === win));
				if (win.activeOptions['title'] != undefined) {
					win.title = win.activeOptions['title'];
					if (win.taskbar != undefined)
						win.taskbar.refresh();
				}
				if (win.activeOptions['content'] != undefined)
					win.$.html(win.activeOptions['content']);
				if (win.activeOptions['width'] != undefined)
					win.width(win.activeOptions['width']);
				if (win.activeOptions['height'] != undefined)
					win.height(win.activeOptions['height']);
				if (win.activeOptions['left'] != undefined)
					win.left(win.activeOptions['left']);
				if (win.activeOptions['top'] != undefined)
					win.top(win.activeOptions['top']);
				if (win.activeOptions['attachedWidth'] != undefined)
					win.attachedWidth = win.activeOptions['attachedWidth'];
				else
					win.attachedWidth = 200;
				if (win.activeOptions['taskbar'] != undefined)
					if (win.taskbar !== win.activeOptions['taskbar'])
						win.addToTaskbar(win.activeOptions['taskbar']);
				if (win.activeOptions['maximized'] == 'true')
					win.maximize(true);
				if (win.activeOptions['minimized'] == 'true')
					win.minimize(true);
				var containment = "window";
				if (win.activeOptions['containment'] != undefined)
					containment = win.activeOptions['containment'];
					
					
				// Window settings and options
				ui.globalZ++;
				if (!win.$.hasClass("window")) win.$.addClass("window");
				/*
				if (win.isMaximized)
					$(win.selector)
						.css({
							position: "absolute",
							top: 0,
							left: 0,
							zIndex: ui.globalZ
						})
						.data("window", win);
				else
					$(win.selector)
						.css({
							position: "absolute",
							top: win._top,
							left: win._left,
							zIndex: ui.globalZ
						})
						.data("window", win);
						*/
				win.$.data("window", win);
				win.addHandle();
				win.$shadows = addShadows(win.selector);  // This is an external method, so you have to pass in the selector
				win.addJQueryUI();
				
				if (win._width == undefined)
					win._width =  win.$.width();
				if (win._height == undefined)
					win._height =  win.$.height();
				if (win._left == undefined)
					win._left = 0;
				if (win._top == undefined)
					win._top = 0;
			}
			Window.prototype.checkBounds = function(e) {
				var win = this;
				win.parentWidth = win.$parent.width();
				win.parentHeight = win.$parent.height();
				var offset = win.$parent.offset();
				win.parentLeftBound = offset.left;
				win.parentRightBound = offset.left+win.parentWidth;
				win.parentTopBound = offset.top;
				win.parentBottomBound = offset.bottom;
				var newLeft = win.left(),
					newRight = parseInt(newLeft)+parseInt(win.width());
				if (newLeft <= win.parentLeftBound) {
					if (!win.isAttached) {
						win.$.css({
							width: win.attachedWidth,
							height: win.parentHeight-51
						})
						.addClass('ui-leftbar-attached');
						win.left(win.parentLeftBound);
						win.top(win.parentTopBound+20);
						win.isAttached = true;
						if (win.$shadows) {
							win.$shadows.remove();
							win.$shadows = null;
						}
						ui.leftbar[ui.leftbar.length] = win;
						var l = ui.maximizedWindows.length;
						while (l--)
							ui.maximizedWindows[l].maximize(true);
					}
				} else if (newRight >= win.parentRightBound) {
					if (!win.isAttached) {
						win.$.css({
							width: win.attachedWidth,
							height: win.parentHeight-51
						})
						.addClass('ui-rightbar-attached');
						win.left(win.parentRightBound-win.attachedWidth-2);
						win.top(win.parentTopBound+20);
						win.isAttached = true;
						if (win.$shadows) {
							win.$shadows.remove();
							win.$shadows = null;
						}
						ui.rightbar[ui.rightbar.length] = win;
						var l = ui.maximizedWindows.length;
						while (l--)
							ui.maximizedWindows[l].maximize(true);
					}
				}
			}
			Window.prototype.startDrag = function(e) {
				var win = this,
					e = e || window.event,
					mouseLeft = 0,
					mouseTop = 0,
					offset;
				if (e.pageX || e.pageY) {
					mouseLeft = e.pageX;
					mouseTop = e.pageY;
					win.getMousePosition = pageMousePosition;
				} else if (e.clientX || e.clientY) {
					mouseLeft = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
					mouseTop = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
					win.getMousePosition = clientMousePosition;
				}
				win.mouse[0] = mouseLeft-win.left();
				win.mouse[1] = mouseTop-win.top();
				disableSelection(win);
				win.getMousePosition(e);
				win.parentWidth = win.$parent.width();
				win.parentHeight = win.$parent.height();
				offset = win.$parent.offset();
				win.parentLeftBound = offset.left;
				win.parentRightBound = offset.left+win.parentWidth;
				win.parentTopBound = offset.top;
				win.parentBottomBound = offset.bottom;
				$document.bind("mousemove.handle", function(e) { win.drag.call(win, e); });
				//$window.bind("mousemove.handle", win.getMousePosition);
				//win.dragTimer = setInterval(function(e) { win.drag.call(win, e); }, 33);
				if (typeof win.activeOptions["dragstart"] == 'function')
					win.activeOptions["dragstart"].call(win);
			}
			Window.prototype.drag = function(e) {
				var win = this,
					e = e || window.event,
					newLeft, newTop;
				win.getMousePosition(e);
				//$(document.body).append(mouse[0]+" "+mouse[1]+" ||| ");
				newLeft = ui.mouse[0]-win.mouse[0];
				newRight = parseInt(newLeft)+parseInt(win._width);
				newTop = ui.mouse[1]-win.mouse[1];
				if (win.dockable && newLeft <= win.parentLeftBound) {
					if (!win.isAttached) {
						win.$.css({
							width: win.attachedWidth,
							height: win.parentHeight-51
						})
						.addClass('ui-leftbar-attached');
						win.left(win.parentLeftBound);
						win.top(win.parentTopBound+20);
						win.isAttached = true;
						win.$shadows.remove();
						win.$shadows = null;
						ui.leftbar[ui.leftbar.length] = win;
					}
				} else if (win.dockable && newRight >= win.parentRightBound) {
					if (!win.isAttached) {
						win.$.css({
							width: win.attachedWidth,
							height: win.parentHeight-51
						})
						.addClass('ui-rightbar-attached');
						win.left(win.parentRightBound-win.attachedWidth-2);
						win.top(win.parentTopBound+20);
						win.isAttached = true;
						win.$shadows.remove();
						win.$shadows = null;
						ui.rightbar[ui.rightbar.length] = win;
					}
				} else {
					if (win.isAttached) {
						win.isAttached = false;
						win.$.removeClass('ui-leftbar-attached ui-rightbar-attached');
						var l = ui.leftbar.length;
						while (l--)
							if (ui.leftbar[l] === win)
								ui.leftbar.splice(l, 1);
						var l = ui.rightbar.length;
						while (l--)
							if (ui.rightbar[l] === win)
								ui.rightbar.splice(l, 1);
						var l = ui.maximizedWindows.length;
						while (l--)
							ui.maximizedWindows[l].maximize(true);
					}
					win.left(newLeft);
					win.top(newTop);
					win.width(win._width);
					win.height(win._height);
					if (!win.$shadows)
						win.$shadows = addShadows(win.selector);
				}
			}
			Window.prototype.stopDrag = function(e) {
				var win = this,
					e = e || window.event;
				if (win.isAttached) {
					var l = ui.maximizedWindows.length;
					while (l--)
						ui.maximizedWindows[l].maximize(true);
				}
				enableSelection(win);
				$document.unbind("mousemove.handle");
				//clearTimeout(win.dragTimer);
				if (typeof win.activeOptions["dragstop"] == 'function')
					win.activeOptions["dragstop"];
			}
			Window.prototype.startResize = function(e) {
				var win = this,
					e = e || window.event,
					mouseLeft = 0,
					mouseTop = 0;
					
				if (e.pageX || e.pageY) {
					mouseLeft = e.pageX;
					mouseTop = e.pageY;
					win.getMousePosition = pageMousePosition;
				} else if (e.clientX || e.clientY) {
					mouseLeft = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
					mouseTop = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
					win.getMousePosition = clientMousePosition;
				}
				win.mouse[0] = mouseLeft;
				win.mouse[1] = mouseTop;
				
				//disableSelection(win);
				win.getMousePosition(e);
				$document.bind("mousemove.resize", function(e) { win.resize.call(win, e); });
				//$window.bind("mousemove.handle", win.getMousePosition);
				//win.dragTimer = setInterval(function(e) { win.drag.call(win, e); }, 33);
				if (typeof win.activeOptions["resizestart"] == 'function')
					win.activeOptions["resizestart"].call(win);
			}
			Window.prototype.resize = function(e) {
				var win = this,
					e = e || window.event;
				win.getMousePosition(e);
				win.width(parseInt(win.width())+(ui.mouse[0]-win.mouse[0]));
				win.height(parseInt(win.height())+(ui.mouse[1]-win.mouse[1]));
				win.mouse[0] = ui.mouse[0];
				win.mouse[1] = ui.mouse[1];
			}
			Window.prototype.stopResize = function(e) {
				var win = this,
					e = e || window.event;
				//enableSelection(win);
				$document.unbind("mousemove.resize");
				//clearTimeout(win.dragTimer);
				if (typeof win.activeOptions["resizestop"] == 'function')
					win.activeOptions["resizestop"].call(win);
			}
			Window.prototype.addJQueryUI = function() {
				var win = this;
				win.removeJQueryUI();
				//$(document.body).append("akfgakjwf gakwfhawkjh fawkjh fawjkfh ajkwfh awkjfh akjwfh akwjfh akwjfh awjkfh awjkfh kjgahajkg eg");
				
				win.$resizeHandle = $("<div/>")
					.addClass("ui-resizeWindow-se ui-resizeWindow-handle")
					.bind("mousedown.resize", function(e) { win.startResize.call(win, e); win.focus(); return false; })
					.appendTo(win.$);
				win.$
					.bind('mousedown.focus', function() {
						win.focus();
					})
					//.draggable(win.draggableOptions)
					//.resizable(win.resizableOptions)
					//.droppable(droppableOptions)
					.find(".ui-resizeWindow-se")
						.mousedown( function() {
							$(this).css({
								width: '10000px',
								height: '10000px',
								bottom: '-4992px',
								right: '-4992px'
							});
						})
						.mouseup( function() {
							$(this).css({
								width: '15px',
								height: '15px',
								bottom: '0px',
								right: '0px'
							});
						})
					.end().find(".ui-resizeWindow-e")
						.mousedown( function() {
							$(this).css({
								width: '10000px',
								height: '10000px',
								top: '-4992px',
								right: '-4992px'
							});	
						})
						.mouseup( function() {
							$(this).css({
								width: '15px',
								height: '15px',
								top: '0px',
								right: '0px'
							});
						})
					.end().find(".ui-resizeWindow-s, .ui-resizeWindow-sw")
						.mousedown( function() {
							$(this).css({
								width: '10000px',
								height: '10000px',
								bottom: '-4992px',
								left: '-4992px'
							});
						})
						.mouseup( function() {
							$(this).css({
								width: '15px',
								height: '15px',
								bottom: '0px',
								left: '0px'
							});
						});
			}

			Window.prototype.removeJQueryUI = function() {
				this.$
					.unbind("mousedown", this.focus)
					.draggable("destroy")
					.resizable("destroy");
			}

			Window.prototype.addHandle = function() {
				var win = this;
				this.removeHandle();
				if (this.title == undefined) {
					if (this.$.text() != "")
						this.title = this.$.text().substring(0, 20)+"...";
					else
						this.title = "Empty Window";
				}
				var extend = document.createElement('div');
					extend.setAttribute("class", "handle-extend");
					extend.setAttribute("style", "position: absolute; z-index: 10001;");  // this is an invisible div used for tracking the mouse smoothly during drag
				var minimize = document.createElement('span');
					minimize.setAttribute("class", "minimize-window");
					minimize.setAttribute("style", "z-index: 10002;");  // Buttons appear above the handle-extender
					minimize.appendChild(document.createTextNode("-"));
					$(minimize)
						.bind("mousedown", function(e) {
							e = window.event || e;    // window.event is for IE
							if (e.stopPropagation)
								e.stopPropagation();  // Standards complient browsers
							else
								e.cancelBubble=true;  // IE
						})
						.bind("click", function() { win.minToggle(); });
				var maximize = document.createElement('span');
					maximize.setAttribute("class", "maximize-window");
					maximize.setAttribute("style", "z-index: 10002;");  // Buttons appear above the handle-extender
					maximize.appendChild(document.createTextNode("o"));
					$(maximize)
						.bind("mousedown", function(e) {
							e = window.event || e;    // window.event is for IE
							if (e.stopPropagation)
								e.stopPropagation();  // Standards complient browsers
							else
								e.cancelBubble=true;  // IE
						})
						.bind("click", function() { win.maxToggle(); });
				var close = document.createElement('span');
					close.setAttribute("class", "close-window");
					close.setAttribute("style", "z-index: 10002;");
					close.appendChild(document.createTextNode("x"));
					$(close)
						.bind("mousedown", function(e) {
							e = window.event || e;    // window.event is for IE
							if (e.stopPropagation)
								e.stopPropagation();  // Standards complient browsers
							else
								e.cancelBubble=true;  // IE
						})
						.bind("click", function() { win.close(); });
				this.handle = document.createElement('div');
				this.$handle = $(this.handle);
				this.handle.setAttribute("class", "handle win-ui");
				this.handle.setAttribute("style", "z-index: 10001;");  // high z-index to make sure the handle is always on top of the window's content
				this.handle.innerHTML = this.title;
				this.handle.appendChild(extend);
				if (this.activeOptions['menu'] != false && this.activeOptions['menu'] != undefined) {		// Display 'menu' button only if ...
					this.menu = this.activeOptions['menu'];
					this.$.append(this.menu.fragment);
					this.$menu = this.$.find(".ui-menu").last();
					var menu = document.createElement('span');
						menu.setAttribute("class", "open-menu");
						menu.setAttribute("style", "z-index: 10002;");  // Buttons appear above the handle-extender
						menu.appendChild(document.createTextNode("O"));
						$(menu)
							.bind("mousedown", function(e) {
								e = window.event || e;    // window.event is for IE
								if (e.stopPropagation)
									e.stopPropagation();  // Standards complient browsers
								else
									e.cancelBubble=true;  // IE
							})
							.bind("click", function() { win.activeOptions['openmenu'].call(win); });
					this.$handle.prepend(menu);
				}
				if (this.activeOptions['close'] != false)		// Display 'close' button only if the 'close' option is not set to false
					this.handle.appendChild(close);
				if (this.activeOptions['maximize'] != false)		// Display 'minimize' button only if ...
					this.handle.appendChild(maximize);
				if (this.activeOptions['minimize'] != false)		// Display 'minimize' button only if ...
					this.handle.appendChild(minimize);
				this.$handle
					.bind("mousedown.handle", function(e) {
						// Cover all the iframes on the page with div's to prevent them from stealing mouse focus
						var iframes = document.getElementsByTagName("iframe"),
							$frame,
							i = iframes.length,
							iframeCover;
						while (i--) {
							$frame = $(iframes[i]);
							iframeCover = $("<div/>")
								.css({
									position: 'absolute',
									width: $frame.width(),
									height: $frame.height(),
									left: $frame.position().left,
									top: $frame.position().top,
									marginLeft: $frame.css('margin-left'),
									marginTop: $frame.css('margin-top')
								})
								.addClass("ui-window-iframeCover")
								.appendTo($frame.parent());
						}
						win.startDrag.call(win, e);
						win.focus();
						return false;
					})
					.appendTo(this.selector);  // Append to the window
			}
			Window.prototype.removeHandle = function() {
				if (this.$handle)
					this.$handle.empty().remove();
			}
			Window.prototype.openMenu = function() {
				
			}
			Window.prototype.setTitle = function(title) {
				this.title = title;
				this.activeOptions['title'] = title;
				if (this.taskbar != undefined)
					this.taskbar.refresh();
				this.addHandle();
			}
			Window.prototype.attachTo = function(sortable, newOptions) {
				if (newOptions == undefined) newOptions = {};
				this.$.appendTo(sortable);
				this.options(newOptions);
				this.sizeSortableWindows();
			}
			Window.prototype.minToggle = function() {
				if (this.isMinimized)
					this.unminimize();
				else
					this.minimize();
			}
			Window.prototype.minimize = function(noAni) {
				var win = this;
				if (noAni) {
					this.$.css({
						width: 0,
						height: 0,
						top: (this.taskbar == undefined) ? $window.height() : $(this.taskbar.selector).offset().top,
						left: (this.taskbar == undefined) ? 0 : $(this.taskbar.selector).offset().left,
						opacity: 0
					}).addClass("win-ui-minimized");
				} else {
					this.$.animate({
						width: 0,
						height: 0,
						top: (this.taskbar == undefined) ? $window.height() : $(this.taskbar.selector).offset().top,
						left: (this.taskbar == undefined) ? 0 : $(this.taskbar.selector).offset().left,
						opacity: 0
					}, 'fast', function() {
						if (typeof win.activeOptions["minimize"] == 'function')
							win.activeOptions["minimize"].call(win);
					}).addClass("win-ui-minimized");
				}
				if (win.isAttached) {
					win.isAttached = false;
					var l = ui.leftbar.length;
					while (l--)
						if (ui.leftbar[l] === win)
							ui.leftbar.splice(l, 1);
					var l = ui.rightbar.length;
					while (l--)
						if (ui.rightbar[l] === win)
							ui.rightbar.splice(l, 1);
					var l = ui.maximizedWindows.length;
					while (l--)
						ui.maximizedWindows[l].maximize(true);
				}
				this.isMinimized = true;
				this.activeOptions["minimized"] = true;
			}
			Window.prototype.unminimize = function() {
				var win = this;
				if (this.isMaximized) {
					var l = ui.leftbar.length,
						leftbar = 0,
						rightbar = 0;
					while (l--) {
						var newWidth = ui.leftbar[l].$.outerWidth();
						if (newWidth > leftbar && ui.leftbar[l].$.css('display') != 'none')
							leftbar = newWidth;
						//alert(leftbar+" "+window.leftbar[l].file);
					}
					l = ui.rightbar.length;
					while (l--) {
						var newWidth = ui.rightbar[l].$.outerWidth();
						if (newWidth > rightbar && ui.rightbar[l].$.css('display') != 'none')
							rightbar = newWidth;
					}
					this.$.animate({
						width: this.$.parent().width()-leftbar-rightbar-2,
						height: this.$.parent().height()-51,
						top: 20,
						left: leftbar,
						opacity: 1
					}, 'fast', function() {
						win.checkBounds();
						if (typeof win.activeOptions["unminimize"] == 'function')
							win.activeOptions["unminimize"].call(win);
					}).removeClass("win-ui-minimized");
				} else
					$(this.selector).animate({
						width: this._width,
						height: this._height,
						top: this._top,
						left: this._left,
						opacity: 1
					}, 'fast', function() {
						win.checkBounds();
						if (typeof win.activeOptions["unminimize"] == 'function')
							win.activeOptions["unminimize"].call(win);
					}).removeClass("win-ui-minimized");
				this.isMinimized = false;
				this.activeOptions["minimized"] = false;
				this.focus();
			}
			Window.prototype.maxToggle = function() {
				if (this.isMaximized)
					this.unmaximize();
				else
					this.maximize();
			}
			Window.prototype.maximize = function(noAni) {
				var win = this;
				if (win.isAttached) {
					//$(win.selector).animate(
					//{
					//	height: 0,
					//	minHeight: 0
					//}).addClass("win-ui-minimized");    ADD BEHEVIOR FOR MINIMIZING ALL OTHER WINDOWS IN THE SIDEBAR
				} else {
					var leftbar = 0,
						rightbar = 0,
						newWidth,
						newHeight;
					if (!win.isMaximized)
						ui.maximizedWindows[ui.maximizedWindows.length] = win;
					var l = ui.leftbar.length;
					while (l--) {
						newWidth = ui.leftbar[l].$.outerWidth();
						if (newWidth > leftbar && ui.leftbar[l].$.css('display') != 'none' && ui.leftbar[l].isAttached)
							leftbar = newWidth;
					}
					var l = ui.rightbar.length;
					while (l--) {
						newWidth = ui.rightbar[l].$.outerWidth();
						if (newWidth > rightbar && ui.rightbar[l].$.css('display') != 'none' && ui.rightbar[l].isAttached)
							rightbar = newWidth;
					}
					if (noAni)
						win.$.css({
							width: win.$.parent().width()-leftbar-rightbar-2,
							height: win.$.parent().height()-51,
							top: 20,
							left: leftbar
						});
					else
						win.$.animate({
							width: win.$.parent().width()-leftbar-rightbar-2,
							height: win.$.parent().height()-51,
							top: 20,
							left: leftbar
						}, 'fast', function() {
							if (typeof win.activeOptions["maximize"] == 'function')
								win.activeOptions["maximize"].call(win);
						});
					win.$.addClass("win-ui-maximized").find(".shadow").remove();
					win.isMaximized = true;
					win.activeOptions["maximized"] = true;
				}
			}
			Window.prototype.unmaximize = function() {
				var win = this;
				if (win.isAttached) {
					//$(win.selector).animate(
					//{
					//	height: height,
					//	minHeight: 15
					//}).removeClass("win-ui-minimized");
				} else {
					var l = ui.maximizedWindows.length;
					while (l--)
						if (ui.maximizedWindows[l] === win)
							ui.maximizedWindows.splice(l, 1);
						win.$.animate({
							width: win._width,
							height: win._height,
							top: win._top,
							left: win._left
						}, 400, function() {
							if (typeof win.activeOptions["unmaximize"] == 'function')
								win.activeOptions["unmaximize"].call(win);
						}).removeClass("win-ui-maximized");
				}
				win.isMaximized = false;
				win.activeOptions["maximized"] = false;
				addShadows(win.selector);
			}
				
			// Method to add the window to a taskbar
			Window.prototype.addToTaskbar = function(targetTb) {
				targetTb.addMember(this);
				this.taskbar = targetTb;
			}
			Window.prototype.close = function() {
				this.isClosed = true;
				if (typeof this.activeOptions["close"] == 'function')
					this.activeOptions["close"]();
				else
					this.$.fadeOut('fast');
			};
			Window.prototype.open = function() {
				this.isClosed = false;
				this.$.fadeIn();
			}
			Window.prototype.focus = function() {  // Brings window z-index to the top
				if (ui.activeWindow !== this) {
					/*
					ui.globalZ++;
					if (ui.globalZ > 2000) {
						$(".window").each( function() {
							$(this).css("z-index", $(this).css("z-index")-500);
						});
						ui.globalZ = 1500;
					}
					this.$.css("z-index", ui.globalZ);
					*/
					ui.activeWindow = this;
					$(".window, .ui-taskbar > span").removeClass("ui-window-active");
					this.$.addClass("ui-window-active");
					if (this.$taskbarTab)
						this.$taskbarTab.addClass("ui-window-active");
					if (typeof this.activeOptions["focus"] == 'function')
						this.activeOptions["focus"].call(this);
				}
			}
			Window.prototype.disable = function() {
				
			}
			Window.prototype.destroy = function() {
				if (this.taskbar != undefined) this.taskbar.removeMember(this);
				var i = ui.windows.length;
				while (i--)
					if (ui.windows[i] === this) {
						ui.windows.splice(i, 1);
					}
				var l = ui.leftbar.length;
				while (l--)
					if (ui.leftbar[l] === this)
						ui.leftbar.splice(l, 1);
				var l = ui.rightbar.length;
				while (l--)
					if (ui.rightbar[l] === this)
						ui.rightbar.splice(l, 1);
				var i = ui.maximizedWindows.length;
				while (i--)
					if (ui.maximizedWindows[i] === this) {
						ui.maximizedWindows.splice(i, 1);
					}
					//alert(": "+window.windows.length);
				if (ui.activeWindow === this)
					ui.activeWindow = undefined;
				this.activeOptions = {};
				this.$
					.fadeOut('fast', function() {
						$(this).unbind().empty().remove();
					});
			}
			return Window;
		})();

		// UI.Popup object prototype
		ui.Popup = (function(){
			Popup.Inherits(ui.Window);
			function Popup(newOptions) {
				var popup = this,
					popupOptions = {
						parent: document.body,
						id: "popup-id-"+ui.windows.length,
						title: "Alert",
						position: "average"
					},
					windowOptions = {};
				if (typeof newOptions == "string") 
					newOptions = { content: newOptions };
				else if (typeof newOptions != 'object')
					return false;
				$.extend(popupOptions, newOptions);
				windowOptions = {
					selector: "#" + popupOptions.id,
					title: popupOptions.title,
					content: popupOptions.content,
					minimize: false,
					maximize: false,
					close: function() {
						popup.$.fadeOut('fast', function() {
							$(this).empty().remove();
						});
					},
					menu: false
				};
				
				// Logic
				$(popupOptions.parent).append("<div id=\"" + popupOptions.id + "\" class=\"popup window abs-ui\"></div>");
				popup.options(windowOptions);
				popup.$.css({
					minWidth: 20,
					minHeight: 20,
					zIndex: 9000,
					display: 'none'
				});
				var popupWidth = popup.$.width(),
					popupHeight = popup.$.height();
				switch (popupOptions.position) {	
					case "mouse":
						var lPos = ui.input.mouse.x()-$(".left-wrapper").width() + "px";  // Decouple this later
						var tPos = ui.input.mouse.y() + "px";
						break;		
					case "center":
						var lPos = ($window.width() / 2-popupWidth / 2);
						var tPos = ($window.height() / 2-popupWidth / 2);
						break;		
					case "average":
						var clPos = ($window.width() / 2-popupWidth / 2);
						var ctPos = ($window.height() / 2-popupWidth / 2);
						var lPos = ui.input.mouse.x()-$(".left-wrapper").width(); 
						var tPos = ui.input.mouse.y();
						lPos = (lPos + clPos) / 2;
						tPos = (tPos + ctPos) / 2;
						break;	
				}
				popup.left(lPos);
				popup.top(tPos);
				popup.width(popupWidth);
				popup.height(popupHeight);
				popup.open();
			}
			return Popup;
		})();

		ui.Taskbar = (function() {
			function Taskbar(selector) {
				var taskbar = this;             // assign a jquery safe pointer to the 'this' object
				taskbar.selector = selector;
				taskbar.$ =
				taskbar.jquery = $(taskbar.selector);
				taskbar.members = new Array();  // pointers for all the child window objects
				
				// Logic
				if (!taskbar.$.hasClass("ui-taskbar")) taskbar.$.addClass("ui-taskbar");
				//tbar.refresh();
				return taskbar;
			}
			Taskbar.prototype.refresh = function() {
				var taskbar = this;
				taskbar.$.empty();
				for (var i in taskbar.members) {
					var newTab = document.createElement("span");
					newTab.setAttribute("class", i);
					newTab.innerHTML = taskbar.members[i].title;
					taskbar.members[i].taskbarTab = newTab;
					taskbar.members[i].$taskbarTab = $(newTab);
					taskbar.members[i].$taskbarTab.data('win', taskbar.members[i]);
					taskbar.$.get(0).appendChild(newTab);
					$(newTab).hover( function() {
						var curmember = taskbar.members[$(this).attr("class").split(' ')[0]];
						curmember.$.addClass("ui-window-highlight");
					}, function() {
						var curmember = taskbar.members[$(this).attr("class").split(' ')[0]];
						curmember.$.removeClass("ui-window-highlight");
					});
					$(newTab).click( function() {
						var curmember = taskbar.members[$(this).attr("class").split(' ')[0]];
						if (curmember.isClosed) {
							curmember.open();
							curmember.focus();
						} else if (curmember === ui.activeWindow || curmember.isMinimized)
							curmember.minToggle();
						else
							curmember.focus();
					});
				}
			}
			Taskbar.prototype.isMember = function(win) {
				var taskbar = this;
			}
			Taskbar.prototype.addMember = function(win) {
				var taskbar = this;
				taskbar.members.push(win);  // add new member to end of the members array
				taskbar.refresh();
			} 
			Taskbar.prototype.removeMember = function(win) {
				var taskbar = this;
				for (var i=0; i<taskbar.members.length; i++)
				{
					if (taskbar.members[i] == win)
					{
						taskbar.members.splice(i, 1);
						taskbar.refresh();
					}
				}
			}
			return Taskbar;
		})();

		// Menu object is used to generate efficient, css styleable menus from json
		ui.Menu = (function() {
			function Menu(json) {
				// Local variable declaration
				var menu = this;
				
				// Member variable declaration
				//menu.json = json;
				menu.$ = 
				menu.jquery = $(menu.fragment);
				menu.json = json;
				
				// Logic
				menu.set(json);	
			}
			// Call this method to set or change the menu structure/content
			Menu.prototype.set = function(json) {
				var menu = this,
					root = $("<div/>")
						.addClass("ui-menu");
				
				// Logic
				menu.fragment = document.createDocumentFragment();
				menu.fragment.appendChild(root.get(0));
				menu.parse(json, root.get(0));
				menu.$ = 
				menu.jquery = root;
			}
			Menu.prototype.parse = function(json, parent) {
				var menu = this,
					submenu;
					
				// Logic
				for (var i in json) {
					if (typeof json[i] == 'string')
						$(parent).append(json[i]);
					else {
						menu[i] = $("<div/>")
							.addClass(json[i].classes ? json[i].classes+" "+i : i)
							.html((typeof json[i].content == 'function') ? json[i].content() : json[i].content)
							.appendTo(parent)
							.get(0);
						if (json[i].styles) {
							$(menu[i]).attr("style", json[i].styles);
						}	
						if (typeof json[i].click == 'function') {
							$(menu[i]).click(json[i].click);
						}
						if (typeof json[i].mouseover == 'function') {
							$(menu[i]).mouseover(json[i].mouseover);
						}
						if (typeof json[i].mouseout == 'function') {
							$(menu[i]).mouseout(json[i].mouseout);
						}
						//output[output.length] = (typeof json[i].content == 'function') ? json[i].content() : json[i].content;
						if (json[i].children != undefined) {
							submenu = $("<div/>")
								.addClass('ui-submenu')
								.appendTo(menu[i]);
							menu.parse(json[i].children, submenu);
						}
					}
				}
				return menu;  // Return all new meny references created
			}
			// Cleanly unbind all events associated with this menu and then destroy it
			Menu.prototype.destroy = function() {
				var menu = this;
				$(menu.fragment).unbind().empty().remove();
				menu.fragment = null;
				menu.json = null;
			}
			return Menu;
		})();

		// Menu object is used to generate efficient, css styleable menus from json
		ui.Sidebar = (function() {
			function Sidebar(options) {
				// variable declaration
				var sidebar = this,
					defaultOptions = {
						side: 'left',
						parent: document.body,
						width: 250
					}
				this.links = [];
				this.loaded = false;
				// Logic
				if (typeof options == 'object')
					this.options(options);
			}
			Sidebar.prototype.check = function(window) {
				var sidebar = this;
				// Logic
				if (this.side == 'left' && window.$.offset().left) {
					
				}
			}
			Sidebar.prototype.linkWindow = function(window) {
				var sidebar = this;
				// Logic
				this.links[this.links.length] = window;
			}
			Sidebar.prototype.options = function(options) {
				var sidebar = this;
				// Logic
				switch (options.side) {
					case 'left':
						this.side = 'left';
						break;
					case 'right':
						this.side = 'right';
						break;
					default:
						return false;
				}
				this.parent = options.parent;
				this.width = options.width;
				this.loaded = true;
			}
			return Sidebar;
		})();
		
		// UTILITY FUNCTIONS
		function disableSelection(win) {
			if (typeof document.body.onselectstart != "undefined") // IE
				document.body.onselectstart = function() { return false; }
			else if (typeof document.body.style.MozUserSelect != "undefined") { // Firefox
				//var i = window.windows.length;
				//while (--i) {
				//	window.windows[i].$.get(0).style.MozUserSelect = "none";
				//	window.windows[i].handle.style.MozUserSelect = "none";
				//}
					//alert(window.windows[i].state);
				//document.body.style.MozUserSelect = "none";
				win.$handle.find(".handle-extend").css({
					width: '2000px',
					height: '2000px',
					bottom: '-992px',
					right: '-992px'
				});
			} else // Opera, Chrome, Safari
				document.body.onmousedown = function() { return false; }
			document.body.style.cursor = "default";
		}
		function enableSelection(win) {
			win.$handle.find(".handle-extend").css({
				width: '0px',
				height: '0px',
				bottom: '0px',
				right: '0px'
			});
		}
		/*
		function getMousePosition(e) {
			var e = e || window.event,
				mouseLeft = 0,
				mouseTop = 0;
			
			// Logic
			if (e.pageX || e.pageY) {
				mouseLeft = e.pageX;
				mouseTop = e.pageY;
			} else if (e.clientX || e.clientY) {
				mouseLeft = e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft;
				mouseTop = e.clientY + document.body.scrollTop + document.documentElement.scrollTop;
			}
			mouse = [mouseLeft, mouseTop]
		}
		*/
		function pageMousePosition(e) {
			//var e = e || window.event;
			// Logic
			ui.mouse = [e.pageX, e.pageY];
		}
		function clientMousePosition(e) {
			//var e = e || window.event;
			// Logic
			ui.mouse = [e.clientX + document.body.scrollLeft + document.documentElement.scrollLeft, e.clientY + document.body.scrollTop + document.documentElement.scrollTop];
		}

		function addShadows(windows) {  //  Adds shadow images to any element
			var borderSize = 1;
			var distance = -(9 + borderSize);
			
			var html = "<img class=\"shadow\" src=\"abstraction/ui/styles/images/shadow_bottom_405x9.png\" width=\"100%\" height=\"9\" style=\"position: absolute; bottom: " + distance + "px; right: -" + borderSize + "px;\"></img><img class=\"shadow\" src=\"abstraction/ui/styles/images/shadow_right_9x405.png\" height=\"100%\" width=\"9\" style=\"position: absolute; bottom: -" + borderSize + "px; right: " + distance + "px;\"></img><img class=\"shadow\" src=\"abstraction/ui/styles/images/shadow_corner_9x9.png\" height=\"9\" width=\"9\" style=\"position: absolute; bottom: " + distance + "px; right: " + distance + "px;\"></img>";
			
			$(windows).find(".shadow").remove();
			$(windows).append(html);
			return $(windows).find(".shadow");
		}
	}
	return UI;
})();