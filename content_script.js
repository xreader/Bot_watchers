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
	console.log("Error handler:" + err.request.responseText);
	if (err.error = 401){
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
	if (!settings.isConfigured()){
		settings.showConfig(function () {
			console.log("config window closed");
		});
	}
	loadIndex();	
}
/**
* parses the comments tree and checks it against the bot definition file
*
*/
function loadIndex() {
	console.log("processing comments...");

	var selectedIndex = undefined; //JSON.parse(localStorage.getItem("selected_index"));
	if (selectedIndex == undefined) {
		$.getJSON('https://raw.github.com/xreader/bot-watchers-indexes/master/definition.json', function(data) {
			console.log("loaded definition:" + JSON.stringify(data));
			var defaultIndex = data.default;
			_.each(data.definitions, function(definition) {
				if (definition.name = defaultIndex){
					localStorage.setItem("selected_index", JSON.stringify(definition));
					loadDefinition(definition.author, definition.repository, onBotIndexUpdated, errorHandler);
				}
			}, this);
		});
	} else {
		loadDefinition(selectedIndex.author, selectedIndex.repository, onBotIndexUpdated, errorHandler);
	}
}

function getRepository() {
	if (repository == undefined){
		if (definition.indextype == 'github'){
			repository = new RemoteRpository(this, definition.repository, definition.author)
		}
	}
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

			var selectedIndex = JSON.parse(localStorage.getItem("selected_index"));
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
			popup.append('<button id="action_select_definition">Save</button>');
			$("#action_select_definition").click( function () {
				var selectedIndex = $("#list_avalaible_indexes").val();
				console.log ("selected definition:" + selectedIndex);
				popup.hide();
			});
	});	

}

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

