var LJSiteHandler = AbstractSiteHandler.extend({
	init: function(controller) {
		this._super(controller, "http://*.livejournal.com/*");
		this.addControl("action_delay_1", "< ① min", this, this.filterCommentsWithDelay, 1);
		this.addControl("action_delay_3", "< ③ min", this, this.filterCommentsWithDelay, 3);
		this.addControl("action_delay_5", "< ⑤ min", this, this.filterCommentsWithDelay, 5);
		this.addControl("action_quick_comments_30", "☃𝌆 30 sec", this, this.filterTooQuickCommentes, 30);
		this.addControl("action_quick_comments_60", "☃𝌆 60 sec", this, this.filterTooQuickCommentes, 60);
		this.addControl("action_quick_comments_sum_30", "∑☃𝌆 30 sec", this, this.filterTooQuickCommentesSum, 30);
		this.addControl("action_quick_comments_sum_60", "∑☃𝌆 60 sec", this, this.filterTooQuickCommentesSum, 60);
		//this.addControl("action_save_selected", "⬆Save", this, this.saveChanges);
	},
	selectionChanged: function () {
		$("#action_save_selected").text("⬆Save " + ((this.suspects.length>0)?this.suspects.length:""));
	},
	saveChanges: function () {
		var comments = this.extractCommentsFromJSON();
		var listOfProfiles = [];
		_.each(comments, function (comment) {
			if (_.contains(this.suspects, comment.uname)){
				if (!_.contains(listOfProfiles, comment.username[0].journal_url)){
					listOfProfiles.push(comment.username[0].journal_url);	
				}
			}
		}, this);
		this.controller.addBotToRepoBatch(listOfProfiles);
	},
	filterCommentsWithDelay: function (delay) {
		console.log("filtering comments with delay " + delay + " minute(s)");
		//get publication date
		//filter comments under delay
		var allUsers = this.extractCommentsFromJSON();

		var publicationTime = $(".b-singlepost-author-date").text();
		var date = new Date(publicationTime);
		console.log("publication date:" + date);
		
		//FIXME synchronizing comments and article time zones (the time zone of publication time is uknown)
		//as start time taked the first comment time
		var firstCommentTime = new Date(allUsers[0].ctime_ts * 1000);
		date = firstCommentTime.setMinutes(firstCommentTime.getMinutes() + delay);

		//apply delay
		console.log("publication date with delay:" + date);

		var filtered = _.filter(allUsers, function(val){
			return (val.ctime_ts * 1000) < date; 
		});

		//mark filtered comments
		var list = $('a[class="i-ljuser-username"]');
		this.suspects = [];
		_.each(filtered, function (val) {
			//$('a[href="' + val.username[0].journal_url + '"]').parent().parent().css('background-color', 'yellow');
			if (!_.contains(this.suspects, val.uname)){
				this.suspects.push(val.uname);
			}
		}, this);
		console.log("list of suspects:" + this.suspects);
		this.markSelectedUsers(this.suspects);
		return false;
	},
	filterTooQuickCommentes: function (delay) {
		var commentsMap = this.buildUsersGroups();
		this.suspects = [];
		//calculate elapsed time for comments 
		for(var uname in commentsMap) {
			var ctime_ts = commentsMap[uname];
			if (ctime_ts.length > 1){
				var sum = 0;
				var lastComment = ctime_ts[0];
				for (var i = 1; i < ctime_ts.length; i++){
					sum += ctime_ts[i] - lastComment;
	                if ((ctime_ts[i] - lastComment) < delay){
            			if (!_.contains(this.suspects, uname)){
	                		this.suspects.push(uname);
	                	}
	                	break; //bot detected?
	                }
					lastComment = ctime_ts[i];
				}
			}
		};
		console.log("list of suspects:" + this.suspects);
		this.markSelectedUsers(this.suspects);
	},
	filterTooQuickCommentesSum: function (delay) {
		var commentsMap = this.buildUsersGroups();
		this.suspects = [];
		//calculate elapsed time for comments 
		for(var uname in commentsMap) {
			var ctime_ts = commentsMap[uname];
			if (ctime_ts.length > 1){
				var sum = 0;
				var lastComment = ctime_ts[0];
				for (var i = 0; i < ctime_ts.length; i++){
					sum += ctime_ts[i] - lastComment;
					lastComment = ctime_ts[i];
				}
				if ((sum/ctime_ts.length) < delay){
					if (!_.contains(this.suspects, uname)){
		                this.suspects.push(uname);
					}
				}
			}
		};
		console.log("list of suspects:" + this.suspects);
		this.markSelectedUsers(this.suspects);
	},
	extractCommentsFromJSON: function () {
		var json = $('script[id="comments_json"]').text();
		var allUsers = JSON.parse(json);

		for (var i = 0; i < allUsers.length; i++){
			var name = allUsers[i].uname;
			if (allUsers[i].username != undefined){
				var journal_url = allUsers[i].username[0].journal_url;
			}
		}
		return allUsers;
	},
	buildUsersGroups: function () {
		var commentsMap = [];
		var allUsers = this.extractCommentsFromJSON();

		//grouping comments by user
		_.each (allUsers, function (val) {
			if (isNaN(val.uname)){
				if (commentsMap[val.uname] == undefined){
					commentsMap[val.uname] = [];
				}
				commentsMap[val.uname].push(val.ctime_ts);
			}
		});

		//sorting map entries
		for(var uname in commentsMap) {
			commentsMap[uname].sort();
		};

		return commentsMap;
	},
	markSelectedUsers: function (users) {
		var comments = this.extractCommentsFromJSON();
		_.each(comments, function (comment) {
			if (_.contains(users, comment.uname)){
				$('a[href="' + comment.username[0].journal_url + '"]').css('background-color', 'yellow');	
			}
		});
		this.selectionChanged();
	}
});