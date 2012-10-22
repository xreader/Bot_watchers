var Settings = Class.extend ({
	controller: undefined,
	suspects: [],
	user: undefined,
	password: undefined,
	isConfigured: null,
	selectedIndex: undefined,
	use_advanced_setings: undefined,
	//FIXME implemented method let save the settings just for one URL
	//TODO to save the settings global one have to use this approach
	//http://stackoverflow.com/questions/12284952/access-extension-data-on-other-pages
	init: function(controller) {
		this.controller = controller;
		this.addPropertyChangeListener (function (key, namespace, value) {
			if (key == "github_user"){
				this.user = value.newValue;
			} else if (key == "github_pwd"){
				this.password = value.newValue;
			} else if (key == "use_advanced_setings"){
				this.isConfigured = ((value.newValue != null) && (value.newValue != "null"));
				this.use_advanced_setings = value.newValue;
			} else if (key == "selected_index") {
				this.selectedIndex = JSON.parse(value.newValue);
			}
		});
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
			$(".config_window").append('<b><input type="checkbox" id="use_advanced_setings" value="advanced">Advanced</b></br></br>');
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
			this.updateUI();
		}else{
			$(".config_window").remove();
		}
		return $(".config_window");
	},
	actionAdvancedSettings: function () {
		if (!$("#use_advanced_setings").attr('checked')){
			$("#github_user").attr('disabled', 'disabled');
			$("#github_pwd").attr('disabled', 'disabled');
		} else {
			$("#github_user").removeAttr('disabled');
			$("#github_pwd").removeAttr('disabled');
		}
	},
	actionSave: function () {
		console.log("saving settings...");
		this.setValue("github_user", $("#github_user").val());
		this.setValue("github_pwd", $("#github_pwd").val());
		this.setValue("use_advanced_setings", ($("#use_advanced_setings").attr('checked') == 'checked'));
		showConfig();
	},
	actionCancel: function () {
		console.log("canceling settings...");
		showConfig();
	},
	getValue: function (key, callBack) {
		chrome.storage.local.get(key, function (items) {
			callBack(items[key]);
		});
	},
	setValue: function (key, value) {
		var obj = {};
		obj[key] = value;
		chrome.storage.local.set(obj);
	},
	addPropertyChangeListener: function (propertyChanged) {
		chrome.storage.onChanged.addListener(function(changes, namespace) {
			for (key in changes) {
				var storageChange = changes[key];
				console.log('Storage key "%s" in namespace "%s" changed. ' +
					'Old value was "%s", new value is "%s".',
					key,
					namespace,
					storageChange.oldValue,
					storageChange.newValue);
				propertyChanged(key, namespace, storageChange);
			}
		});
	},
	updateUI: function (callBack) {
		console.log("loading settings...");
		if (this.use_advanced_setings){
			$("#github_user").removeAttr('disabled');
			$("#github_pwd").removeAttr('disabled');
			$("#use_advanced_setings").attr('checked', 'checked');
			$("#github_user").val(this.user);
			$("#github_pwd").val(this.password);
		} else {
			$("#use_advanced_setings").removeAttr('checked');
			$("#github_user").val("");
			$("#github_pwd").val("");
			$("#github_user").attr('disabled', 'disabled');
			$("#github_pwd").attr('disabled', 'disabled');
		}
		if (callBack != undefined){
			callBack();
		}
	},
	preloadsettings: function (callBack, keys) {
		if (keys == undefined) {
			console.log("preloading settings...");
			keys = ["use_advanced_setings", "github_user", "github_pwd", "selected_index"];
			this.preloadsettings(callBack, keys);
		} else {
			if (keys.length == 0) {
				console.log("DONE!");
				callBack();
			} else {
				var key = keys.shift();
				var ref = this;
				this.getValue(key, function (val) {
					console.log ("settings:" + key + "=" + val);
					if (key == "github_user"){
						ref.user = val;
					} else if (key == "github_pwd"){
						ref.password = val;
					} else if (key == "use_advanced_setings"){
						ref.isConfigured = ((val != null) && (val != "null"));
						ref.use_advanced_setings = val;
					} else if (key == "selected_index") {
						ref.selectedIndex = (val!=undefined?JSON.parse(val):undefined);
					}
					ref.preloadsettings(callBack, keys);

				});
			}
		}
	}, 
	isConfigured: function () {
		return this.isConfigured;
	},
	getUser: function () {
		return this.user;	
	},
	getPwd: function () {
		return this.password;	
	}

});