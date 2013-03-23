	// Abstraction v.1.0 (c) 2008-2011 Britton Reeder-Thompson //
	//       Collaborative Editing Module Definition           //

var $window = $(window),
	$document = $(document);

$.extend(abstraction.SourceEditor.prototype, {
	createEditor: function(codemirrorOptions) {
		var sourceEditor = this;
		sourceEditor.mobwriteID = 'absMobwrite-'+sourceEditor.currentDoc.replace(/-/gi, '-1234h1234-').replace(/\//gi, '-1234s1234-').replace(/\./gi, '-1234p1234-');
		mobwrite.debug = true;
		//mobwrite.nullifyAll = true;
		sourceEditor.$.append('<textarea id="'+sourceEditor.mobwriteID+'" style="border: none; margin: 0; padding: 0;"></textarea>');
		sourceEditor.codemirror = mobwrite.shareCodeMirror.create(sourceEditor.mobwriteID, codemirrorOptions);
		sourceEditor.codemirror.sourceEditor = sourceEditor;
	},
	update: function() {
		var sourceEditor = this;
		sourceEditor.content = sourceEditor.state.html('clean');
		sourceEditor.codemirror.setCode(sourceEditor.content);
		setTimeout(function() {
			mobwrite.share(sourceEditor.codemirror);
		}, 1000);
	}
});