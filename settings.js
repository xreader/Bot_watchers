var Settings = Class.extend ({
	controller: undefined,
	suspects: [],
	//FIXME implemented method let save the settings just for one URL
	//TODO to save the settings global one have to use this approach
	//http://stackoverflow.com/questions/12284952/access-extension-data-on-other-pages
	init: function(controller) {
		this.controller = controller;
	},
	showConfig: function (callback) {
		console.log("show/hide config...");
		if ($(".config_window").length == 0){
			$("body").prepend('<div class="config_window"></div>');
			var left = (window.innerWidth - 200)/2;
			var top = (window.innerHeight - 200)/2;
			var ref = this;
			$(".config_window").css({	'position': 	'fixed',
							'background': 	'#CCC',
							'border': 		'1px solid #ccc',
							'width': 		'164px',
							'z-index': 		'100',
							'left': 		left + 'px',
							'top':          top + 'px',
							'padding':       '20px', 
							'padding-top':       '10px', 
							});

			//controls
			$(".config_window").append('<h2>Settings</h2>');
			$(".config_window").append('<b><input type="checkbox" id="use_advanced_setings" value="advanced">Adwanced</b></br></br>');
			$("#use_advanced_setings").click(this.actionAdvancedSettings);
			$(".config_window").append('<b>Github user</b></br>');
			$(".config_window").append('<b><input type="text" id="github_user"></b></br>');
			$(".config_window").append('<b>Github password</b></br>');
			$(".config_window").append('<b><input type="password" id="github_pwd"></b></br>');
			$(".config_window").append('<button id="config_save_settings">Save</button>');
			$("#config_save_settings").click(function() {
				ref.actionSave ();
				if (callback != undefined) callback();
			});
			$(".config_window").append('<button id="config_cancel_settings">cancel</button>');
			$("#config_cancel_settings").click(function () {
				ref.actionCancel();
				if (callback != undefined) callback();
			});
			this.loadState();
		}else{
			$(".config_window").remove();
		}
		return $(".config_window");
	},
	actionAdvancedSettings: function () {
		if ($("#use_advanced_setings").attr('checked')){
			$("#github_user").attr('disabled', 'disabled');
			$("#github_pwd").attr('disabled', 'disabled');
		} else {
			$("#github_user").removeAttr('disabled');
			$("#github_pwd").removeAttr('disabled');
		}
	},
	actionSave: function () {
		console.log("saving settings...");
		localStorage.setItem("github_user", $("#github_user").val());
		localStorage.setItem("github_pwd", $("#github_pwd").val());
		localStorage.setItem("use_advanced_setings", ($("#use_advanced_setings").attr('checked') == 'checked'));
		showConfig();
	},
	actionCancel: function () {
		console.log("canceling settings...");
		showConfig();
	},
	loadState: function () {
		console.log("loading settings...");
		if (localStorage.getItem("use_advanced_setings")) {
			$("#use_advanced_setings").attr('checked', 'checked');
			$("#github_user").val(localStorage.getItem("github_user"));
			$("#github_pwd").val(localStorage.getItem("github_pwd"));
		} else {
			$("#use_advanced_setings").removeAttr('checked');
		}
	},
	isConfigured: function () {
		return (localStorage.getItem("use_advanced_setings") != null) && (localStorage.getItem("use_advanced_setings") != "null");
	},
	getUser: function () {
		localStorage.getItem("github_user");	
	},
	getPwd: function () {
		localStorage.getItem("github_pwd");	
	}

});