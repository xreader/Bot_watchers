var AbstractSiteHandler = Class.extend ({
	urlPattern: "http://*/*",
	controller: undefined,
	suspects: [],
	init: function(controller, urlPattern) {
		this.urlPatern = urlPattern;
		this.controller = controller;
		this.addControl("action_reload_index", "⟳Reload", this, this.reloadIndex);
		this.addControl("action_config", "⟁Config", this, controller.showConfig);
		this.addControl("action_select_definition", "⏚Все списки", this, controller.showDefinitionSelector);
	},
	reloadIndex: function () {
		this.controller.loadIndex();
	},
	getControlBar: function () {
		if ($(".floating-menu").length == 0){
			$("body"). prepend('<div class="floating-menu"></div>')
			$(".floating-menu").css({	'position': 	'fixed',
							'background': 	'#CCC',
							'border': 		'1px solid #ccc',
							'width': 		'64px',
							'z-index': 		'100',
							'bottom': 		'10px',
							'right': 		'15px'
							});
		}
		return $(".floating-menu");
	},
	addControl: function (id, text, scope, callBack, args) {
		$(this.getControlBar()).append('<button id="' + id + '">' + text + '</button></br>');
		$("#" + id).click(function () {
			callBack.apply(scope, [args]);
		});
	}
});