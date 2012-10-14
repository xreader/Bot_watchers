function RemoteRpository (controller) {

	this.controller = controller;
	this.repository = "bot-watcher-index";
	this.github = undefined;
	this.repo = undefined;
	this.remoteIndex = 'botindex.txt';

	this.getGitHub = function () {
		if (this.github == undefined) {
			this.github = new Github({
			  username: localStorage.getItem("github_user"),
			  password: localStorage.getItem("github_pwd"),
			  auth: "basic"
			});
		}
		return this.github;
	};

	this.getRepo = function () {
		this.getGitHub();
		if (this.repo == undefined){
			this.repo =this.getGitHub().getRepo(localStorage.getItem("github_user"), this.repository);
		}
		return this.repo;
	};

/*
	this.getBotIndex = function () {
		return this.botindex;
	};

	this.setBotIndex = function (botindex) {
		this.botindex = botindex;
	};
*/
	this.remove = function (profileUrl) {
		var botindex = controller.getBotIndex();
		var idx = botindex.indexOf(profileUrl);
		if (idx >= 0){
			botindex.splice(idx, 1);
			controller.setBotIndex(botindex);
			return true;
		}
		return false;
	};

	this.add = function (profileUrl) {
		var botindex = controller.getBotIndex();
		if (botindex == undefined){
			botindex = [];
		}
		if (!_.contains(botindex, profileUrl)){
			botindex.push(profileUrl);
			controller.setBotIndex(botindex);
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
				ref.controller.setBotIndex(botindex);
				successCallBack();
			}
		});
	};

	this.save = function (successCallBack, errorCallBack) {
		var message = 'saving index ...';
		this.getRepo().write('master', this.remoteIndex, JSON.stringify(controller.getBotIndex(), null, " "), message, function(err) {
			if (err != null){
				errorCallBack(err);
			}else{
				successCallBack();	
			}
		});
	};
}