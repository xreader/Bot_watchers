function RemoteRpository (controller, repository, owner) {

	this.controller = controller;
	this.owner = owner;
	this.repository = repository;
	this.github = undefined;
	this.repo = undefined;
	this.remoteIndex = 'botindex.txt';

	this.getGitHub = function () {
		if (this.github == undefined) {
			this.github = new Github({
			  username: "xreader",
			  password: "demogen22",
			  auth: "basic"
			});
		}
		return this.github;
	};

	this.getRepo = function () {
		this.getGitHub();
		if (this.repo == undefined){
			this.repo =this.getGitHub().getRepo("xreader", this.repository);
		}
		return this.repo;
	};


	this.getBotIndex = function () {
		return this.botindex;
	};

	this.setBotIndex = function (botindex) {
		this.botindex = botindex;
	};

	this.remove = function (profileUrl) {
		var botindex = this.getBotIndex();
		var idx = botindex.indexOf(profileUrl);
		if (idx >= 0){
			botindex.splice(idx, 1);
			this.setBotIndex(botindex);
			return true;
		}
		return false;
	};

	this.add = function (profileUrl) {
		var botindex = this.getBotIndex();
		if (botindex == undefined){
			botindex = [];
		}
		if (!_.contains(botindex, profileUrl)){
			botindex.push(profileUrl);
			this.setBotIndex(botindex);
		}
		return true;
	};

	this.read = function (successCallBack, errorCallBack) {
		var ref = this;
		this.getRepo().read('master', this.remoteIndex, function(err, data) {
			if (err != null){
				console.log("ERROR:" + err);
				errorCallBack(err);
			} else {
				console.log("File content:" + data);
				var botindex = JSON.parse(data);
				ref.setBotIndex(botindex);
				successCallBack();
			}
		});
	};

	this.loadDefinition = function (successCallBack, errorCallBack) {
		var url = 'https://raw.github.com/' + this.owner + '/' + this.repository + '/master/' + this.remoteIndex;
		console.log("loading definition from:" + url);
		var ref = this;
		$.getJSON(url, function(data) {
			console.log("loaded definition:" + JSON.stringify(data));
			ref.setBotIndex(data);
			successCallBack(data);
		}).error(function (jqXHR, textStatus, errorThrown) {
			errorCallBack(errorThrown);
		});
	};

	this.save = function (successCallBack, errorCallBack) {
		var message = 'saving index ...';
		this.getRepo().write('master', this.remoteIndex, JSON.stringify(this.getBotIndex(), null, " "), message, function(err) {
			if (err != null){
				errorCallBack(err);
			}else{
				successCallBack();	
			}
		});
	};
}