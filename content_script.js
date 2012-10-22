var repository;
var siteHandler;
var settings = new Settings(this);
/**
 * waiting until the comments are loaded
*/
var intervalId = window.setInterval(function() {
	var list = $('a[class="i-ljuser-username"]');
	console.log("loaded comments:" + list.length);
	if (list.length > 1){
		//TODO check url and initialise suitable handler
		siteHandler = new LJSiteHandler(this);
		onCommentsLoaded();
	}
}, 2000);

/**
* Checks the profile against the bot definition file
* @return false if user is compromised, true if not
*/
function checkUser (index) {
	if (getBotIndex()){
		return (_.contains(getBotIndex(), $(this).attr("href")));
	}
	return true;
}

function errorHandler (err) {
	console.log("Error handler:" + (err.request==undefined?err:err.request.responseText));
	if (err.error == 401){
		showConfig(function () {
			repository = undefined;
		});
	}
}

function markAsBot () {
	console.log("marking the user as bot..." + $(this).attr("data"));
	addBotToRepo ($(this).attr("data"));
	return false;
}

function unmarkAsNot () {
	console.log("removing the user from the bot list..." + $(this).attr("data"));
	removeBotFromRepo($(this).attr("data"));
	return false;
}

function addBotToRepo (profile) {
	if(getRepository().add(profile)){
		getRepository().save(function () {
			onBotIndexUpdated();
		}, errorHandler);
	}
}

function removeBotFromRepo (profile) {
	if(getRepository().remove(profile)) {
		getRepository().save(function () {
			onBotIndexUpdated();
		}, errorHandler);
	}
}

function addBotToRepoBatch (profiles) {
	if (profiles.length > 0){
		_.each(profiles, function (profile) {
			getRepository().add(profile);
		}, this);
		getRepository().save(function () {
			onBotIndexUpdated();
		}, errorHandler);
	}
}

function onCommentsLoaded () {
	window.clearInterval(intervalId);
	settings.preloadsettings( function () {
		if (!settings.isConfigured) {
			settings.showConfig(function () {
				console.log("config window closed");
				initRepository();
				loadIndex();
			});
		} else {
			initRepository();
			loadIndex();
		}
	});
}
/**
* parses the comments tree and checks it against the bot definition file
*
*/
function loadIndex() {
	console.log("processing comments...");
	var selectedIndex = this.settings.selectedIndex; //JSON.parse(localStorage.getItem("selected_index"));
	if (selectedIndex == undefined) {
		$.getJSON('https://raw.github.com/xreader/bot-watchers-indexes/master/definition.json', function(data) {
			console.log("loaded definition:" + JSON.stringify(data));
			var defaultIndex = data.default;
			_.each(data.definitions, function(definition) {
				if (definition.name == defaultIndex){
					settings.setValue("selected_index", JSON.stringify(definition));
					getRepository().loadDefinition(definition.author, definition.repository, 'botindex.txt', onBotIndexUpdated, errorHandler);
				}
			}, this);
		});
	} else {
		getRepository().loadDefinition(selectedIndex.author, selectedIndex.repository, 'botindex.txt', onBotIndexUpdated, errorHandler);
	}
}

function getRepository() {
	if (repository == undefined){
		alert ("ERROR: definition is not configured!");
	}
	return repository;
}

function initRepository() {
	repository = new RemoteRpository(this, this.settings.user, this.settings.password);
	repository.user = this.settings.user;
	repository.password = this.settings.password;
	return repository;
}

function showConfig() {
	settings.showConfig();
}

function showDefinitionSelector () {
	$.getJSON('https://raw.github.com/xreader/bot-watchers-indexes/master/definition.json', function(data) {
		console.log("loaded definition:" + JSON.stringify(data));

		//create popup
		var popup = new JSPopUp("definition_selector", null, null, 600);	
		popup.create("<h2>Список доступных индексов</h2>");
		popup.append('<select id="list_avalaible_indexes" size="10"></select></br>');

		var selectedIndex = settings.selectedIndex;
		var defaultIndex = data.default;
		if (selectedIndex != undefined){
			defaultIndex = selectedIndex.name;
		}
		var defaultIndex = data.default;
		_.each(data.definitions, function(definition) {
			$("#list_avalaible_indexes").append('<option value="' 
				+ definition.name + '" ' + (definition.name == defaultIndex?'selected="selected"':"") + '">' 
				+ definition.name 
				+ ' by(' + definition.author + ' ) '
				+ definition.description
				+ '</option>');
		}, this);
		popup.append('<button id="action_create_new_definition">New</button>');
		$("#action_create_new_definition").click( function () {
			createNewIndexRepository ();
		});
		popup.append('<button id="action_select_definition">Select</button>');
		$("#action_select_definition").click( function () {
			var selectedIndex = $("#list_avalaible_indexes").val();
			console.log ("selected definition:" + selectedIndex);
			popup.hide();
		});
	});	
}

//forking bot index and index maps repositories
function createNewIndexRepository () {
	var name=prompt("Please enter index name","");
	if (name!=null && name!=""){
		var description=prompt("Please enter index description","");
		if (description!=null && description!=""){
			var repository = getRepository();
			//forking repository the definitions repository
			repository.fork(repository.definitionsRepositoryAuthor, repository.repositoryMapName, function (err) {
				if (err == null) {
					var myIndex = this.settings.selectedIndex;
					myIndex.name = name,
					myIndex.author = this.settings.user,
					myIndex.indextype = "github",
					myIndex.description = description,
					myIndex.repository = repository.repository;

					//adding new index to the forked repository and create pull request
					repository.applyNewIndex(myIndex, function (err) {
						if (err == null) {
							repository.createPullRequestForDefinition(myIndex, function (err) {
								if (err == null) {
									console.log ("DONE");
									//forking the bot index repository
									repository.forkBotIndexRepository(myIndex.repository, function (err) {
										if (err == null) {
											this.setBotIndex ([]);
											repository.save(function () {
												settings.setValue("selected_index", JSON.stringify (myIndex));
												//set the value directly cause the call is asynchrone
												settings.selectedIndex = myIndex;	
												repository.loadDefinition(settings.selectedIndex.author, settings.selectedIndex.repository, repository.remoteIndex ,onBotIndexUpdated, errorHandler);
											}, function (err) {
												console.log ("ERROR:" + err);
											});
										} else {
											console.log ("ERROR:" + err);
										}
									});
								} //END of IF
							});
						} else {
							console.log ("failed to applay new index to the map:" + err.request.responseText);
						}
					});
				}
			});
		}
	}
}

/*
function loadDefinition (owner, repository, successCallBack, errorCallBack) {
	var url = 'https://raw.github.com/' + owner + '/' + repository + '/master/botindex.txt';
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
*/

function onBotIndexUpdated () {
	console.log("index updated...");
	var list = $('a[class="i-ljuser-username"]');
	siteHandler.suspects = [];
	siteHandler.selectionChanged();
	//mark filtered users red
	var compromised = $(list).filter(checkUser);
	compromised.css('background-color', 'red');
	$("span #custom_controls").remove();
	_.each(list, function(val) {
		if (compromised.index(val) < 0){
			$(val).append("<span id='custom_controls'><button class='mark_as_bot' data='" + $(val).attr("href") + "'>add</button></span>")
		}
	});
	_.each(compromised , function(val) {
		$(val).append("<span id='custom_controls'><button class='unmark_as_bot' data='" + $(val).attr("href") + "'>remove</button></span>")
	});
	$('.mark_as_bot').click(markAsBot);
	$('.unmark_as_bot').click(unmarkAsNot);
	console.log("DONE!");
}

function getBotIndex () {
		return this.botindex;
	};

function setBotIndex (botindex) {
		this.botindex = botindex;
};

