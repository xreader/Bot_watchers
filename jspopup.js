var JSPopUp = Class.extend({
	init: function (id, top, left, width) {
		this.clazz = id;
		this.top = top;
		this.left = left;
		this.width = width;
	},
	create: function (content, errorCallBack) {
		if ($("." + this.clazz).length > 0){
			this.hide();
			if (errorCallBack != undefined) errorCallBack ("ERROR: call hide before create new instance");
		} else {
			$("body").prepend('<div class="' + this.clazz + '"></div>');
			$("." + this.clazz).css(this.getCss());

			if (content != undefined){
				$("." + this.clazz).append(content);
			}
			return this;
		}
	},
	hide: function () {
		$("." + this.clazz).remove();
	},
	getCss: function () {
		var top, left, width;

		if (this.width == null || isNaN(this.width)){
			width = 200;			
		} else {
			width = this.width;
		}

		if (this.top == null ||isNaN(this.top)){
			top = (window.innerHeight)/4;
		}

		if (this.left == null || isNaN(this.left)){
			left = (window.innerWidth - width)/2;
		}

		var css = {	'position': 	'fixed',
					'background': 	'#CCC',
					'border': 		'1px solid #ccc',
					'width': 		width  + 'px',
					'z-index': 		'100',
					'left': 		left + 'px',
					'top':          top + 'px',
					'padding':       '20px', 
					'padding-top':       '10px', 
				};
		return css;
	},
	append: function (content, errorCallBack) {
		if ($("." + this.clazz).length != 0){
			$("." + this.clazz).append(content);
			return this;
		} else {
			if (errorCallBack != undefined) errorCallBack ("ERROR: popup not exist! First call create function!");
		}
	}
});