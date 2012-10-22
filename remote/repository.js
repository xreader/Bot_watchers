function RemoteRpository (controller, user, password) {

	this.controller = controller;
	this.definitionsRepositoryAuthor = "xreader";
	this.repository = "bot-watcher-index";
	this.repositoryMapName = "bot-watchers-indexes";
	this.github = undefined;
	this.repo = undefined;
	this.remoteIndex = 'botindex.txt';
	this.user = user;
	this.password = password;
	this.interval = undefined;

	this.getGitHub = function () {
		if (this.github == undefined) {
			this.github = new Github({
			  username: this.user,
			  password: this.password,
			  auth: "basic"
			});
		}
		return this.github;
	};

	this.getRepo = function () {
		this.getGitHub();
		if (this.repo == undefined){
			this.repo =this.getGitHub().getRepo(this.user, this.repository);
		}
		return this.repo;
	};

	/**
	* removes the provided profile from the bot index
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

	/**
	* adds new profile to the bot index
	*/
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

	/**
	* reads the index file from repository
	*/
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

	/**
	* updates the index in the repository
	*/
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

	/**
	* crete a copy of repository containing the list of definitions,
	* adds new definition to the list and initializes the pull request
	* to add new definition to the main list
	*/
	this.fork = function (user,repoName,callBack) {
		console.log ("forking..." + user + ":" + repoName)
		var repo = this.getGitHub().getRepo(user, repoName);
		//checking every 1 sec if fork completed
		var timeout = 5000;
		var me = this;
		this.interval = setInterval (function () {
			console.log ("is fork completed?");
			//assuming the README.md always exists
			timeout -= 1000;
 			me.readContents(this.settings.user, repoName, "README.md", function (err, contents) {
 				if (err == null){
					clearInterval(me.interval);
					console.log ("DONE!");
					callBack(null);
 				}

 				if (timeout < 0) {
 					console.log ("Timeout: ");
 					callBack("No answer! timeout:" + timeout);
 				}
			});
		}, 1000);
		var path = "/repos/" + user + "/" + repoName + "/forks";
		repo.fork(function(err, content) {
			if (err == null) {
				console.log ("fork ... DONE!");
				//clearInterval(me.interval);	
				//callBack(null);
			} else {
				console.log ("error:" + err.request.responseText);	
			}
		});
	};

	//forking the bot index repository
	this.forkBotIndexRepository = function (repository, callBack) {
		console.log ("forkBotIndexRepository:" + repository);
		this.fork(this.definitionsRepositoryAuthor, repository, function (err) {
			callBack(err);
		});
	}

	/**
	*	adds new definition to forked repository and inits new pull request
	*/
	this.applyNewIndex = function (myIndex, callBack) {
		console.log ("applyNewIndex:" + myIndex);
		var me = this;
		this.loadDefinition(this.controller.settings.user, this.repositoryMapName, "definition.json", 
			function (contents) {
				console.log ("definitio loaded");
				var repo = me.getGitHub().getRepo(me.controller.settings.user, me.repositoryMapName);
				var definitionMap = contents;
				definitionMap.definitions.push (myIndex);

				console.log ("updating forked definitions");
				var message = "adding new index " + myIndex.name;
				console.log ("commiting to definition.json");
				repo.write('master', "definition.json", JSON.stringify(definitionMap, null, " "), message, function(err) {
					if (err == null){
						console.log ("DONE!");
						callBack(null);
					} else {
						console.log ("ERROR: something went wrong!");
						callBack(err);
					}
				});
			}, 
			function (err){
				console.log ("failed to load definition:" + err);
				if (err == null) {
					callBack (err);
				}
			}
		);								
	}

	/**
	*	inits new pull request to add new definition to main repo
	*/
	this.createPullRequestForDefinition = function (myIndex, callBack) {
		console.log ("creating pull request...");
		var pull = {
		  title: "new definition by " + this.user,
		  body: "This pull request contains new bot index definition",
		  base: "master",
		  head: this.user + ":" + "master",
		};
		//one have to write to the main repository
		var mainrepo = this.getGitHub().getRepo(this.definitionsRepositoryAuthor, this.repositoryMapName);
		var ref = this;
		console.log ("createPullRequest:" + JSON.stringify(pull));
		mainrepo.createPullRequest(pull, function(err, pullRequest) {
			if (err == null) {
				console.log ("DONE!" + pullRequest);
				ref.controller.settings.setValue("selected_index", JSON.stringify(myIndex));
			} else {
				console.log ("ERROR: " + err);
			}
			if (callBack != undefined) {
				callBack (err, pullRequest);
			}
		});
	};

	this.loadDefinition = function (owner, repository, path, successCallBack, errorCallBack) {
		var url = 'https://raw.github.com/' + owner + '/' + repository + '/master/' + path;
		console.log("loading definition from:" + url);
		var ref = this;
		$.getJSON(url, function(data) {
			console.log("loaded definition:" + JSON.stringify(data));
			ref.controller.setBotIndex(data);
			successCallBack(data);
		}).error(function (jqXHR, textStatus, errorThrown) {
			errorCallBack(errorThrown);
		});
	};

	this.readContents = function (repositoryOwner, repositoryName, pathToContent, callBack) {
		console.log ("readContents:" + repositoryOwner + ":" + repositoryName + ":" + pathToContent);
		var repo = this.getGitHub().getRepo(repositoryOwner, repositoryName);
		repo.contents(pathToContent, function (err, contents) {
			callBack (err, contents);
		});
	};
}