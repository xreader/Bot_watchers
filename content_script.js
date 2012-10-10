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
		//buildControlBar();
		loadIndex();
	}
}, 2000);

/**
* Checks the profile against the bot definition file
* @return false if user is compromised, true if not
*/
function checkUser (index) {
	//console.log("user?" + index + " >" + $(this).attr("href"));
	//TODO check if user in bot definition file ()
	if (repository.getBotIndex()){
		return (_.contains(repository.getBotIndex(), $(this).attr("href")));
	}
	return true;
}

function errorHandler () {
	console.log("Error handler:" + args);
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
	if(repository.add(profile)){
		repository.save(function () {
			onBotIndexUpdated();
		}, errorHandler);
	}
}

function removeBotFromRepo (profile) {
	if(repository.remove(profile)) {
		repository.save(function () {
			onBotIndexUpdated();
		}, errorHandler);
	}
}

function addBotToRepoBatch (profiles) {
	if (profiles.length > 0){
		_.each(profiles, function (profile) {
			repository.add(profile);
		}, this);
		repository.save(function () {
			onBotIndexUpdated();
		}, errorHandler);
	}
}

/**
* parses the comments tree and checks it against the bot definition file
*
*/
function loadIndex() {
	console.log("processing comments...");
	window.clearInterval(intervalId);

	var selectedIndex = localStorage.getItem("selected_index");
	if (selectedIndex == undefined){
		$.getJSON('https://raw.github.com/xreader/bot-watcher-index/master/definition.json', function(data) {
			console.log("loaded definition:" + JSON.stringify(data));
			var defaultIndex = data.default;
			_.each(data.definitions, function(definition) {
				if (definition.name = dafaultIndex){
					localStorage.setItem("selected_index", JSON.stringify(definition));
					break;
				}
			}, this);
		});
	} else {
		if (selectedIndex.indextype == 'github'){
			repository = new RemoteRpository(this, selectedIndex.url)
		}
		repository.read(onBotIndexUpdated, errorHandler);
	}
}

function getRepository(selectedIndex) {
	if (repository == undefined || repository.repository != selectedIndex.url)
	if (selectedIndex.indextype == 'github'){
		repository = new RemoteRpository(this, selectedIndex.url)
	}
}

function showConfig() {
	settings.showConfig();
}

function onBotIndexUpdated () {
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

