// ==UserScript==
// @name         FaceIT match room advanced stats
// @namespace    http://tampermonkey.net/
// @version      0.3
// @description  Shows elo, level and cs go steam hours for each player on match screen.
// @author       Viaceslavas 'fire_bot' Duk
// @match        https://beta.faceit.com/*
// @grant        none
// ==/UserScript==
// CREDIT AND KUDOS TO: PyroZeroX. AngularJS example from: https://gist.github.com/PyroZeroX/9e75b2a205e842b0ecbb
/* jshint -W097 */
'use strict';

// You can get your web api key from https://steamcommunity.com/dev/apikey 
var webkey = "YOUR STEAM WEB API KEY GOES HERE";
         
var drawStats = function(match) {
    if (match != null && match.state != "voting" && $(".custom_stats_field").length != 10) {	// NOTE: maybe hook into angular and change templates for this...
        var factions = match.faction1.slice(0).concat(match.faction2);
 
        $(factions).each(function(index, player) {
            var steamID = player['csgo_id'];
            var steamURL = "https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=" + webkey + "&steamid=" + steamID + "&format=json"

            // Proxy based on https://github.com/afeld/jsonp 
            $.ajax({   url: "https://jsonp-steamid-proxy.herokuapp.com/?url=" + encodeURIComponent(steamURL),
                    success: function(data) { callfaceit(data, player); },
                    error: function(data) { callfaceit(data, player); }
                   });
        });
    }
};

angular.element(document).ready(function() {
	angular.element(document).injector().invoke(function($compile, $location) {
        var thisDocument = angular.element(document).scope();
        thisDocument.location = $location;
        thisDocument.$watch( 'location.url()', function(url) {
            if (url && url.indexOf('en/csgo/room/') > -1) {
                var gameElement = $("section.match-vs");
                var pageDocument = angular.element(gameElement).scope();
                var game = angular.element(gameElement).scope();   
        		
                game.$watch('match', drawStats);
            }
        });
    });
});

var cleanPrevious = function() {
    try {
            $(".custom_skill_level").remove();
            $(".custom_stats_field").remove();
    } catch (err) {};
};

var callfaceit = function(previousData, player) {
	var nickname = player['nickname'];
	$.ajax({   url: "https://api.faceit.com/api/nicknames/" + player['nickname'], 
				success: function(data) { 
					try {
						player = data['payload']['games']['csgo'];
						player['nickname'] = nickname;
						player['hours'] = extractHours(previousData);
					} catch (err) {}
					drawcustomstats(data, player); 
				},
	            error: function(data) { 
	            	player['hours'] = extractHours(previousData);
	            	player['nickname'] = nickname;
	            	drawcustomstats(data, player); 
	            }
	});
};

var extractHours = function(data) {
	var hours = "N/A";
	try {
		var games = data['response']['games'];
		for(var i = 0; i < games.length; i++) {
		  var game = games[i];
		  if (game['appid'] === 730) {
		    hours = (game['playtime_forever']/60).toFixed(1);
		    break;
		  }
		}
	} catch (err) {}
	return hours;
};

var drawcustomstats = function(data, player) {
    var skillLevelImgURL = "https://cdn.faceit.com/frontend/75/assets/images/skill-icons/skill_level_" + player['skill_level_label'] + "_sm.png";
    var skillLevelDiv = $("<div></div>").addClass("custom_skill_level");
    var skillLevelImg = $("<img/>").attr({ src: skillLevelImgURL})
    skillLevelDiv.css({
    			"position": "absolute",
    			"z-index": 3,
    			"right": "34px",
    			"bottom": "-6px",
    			"width": "24px",
    			"height": "24px",
	}).append(skillLevelImg);
    
	var statsContainerDiv = $("<div></div>").addClass('pa-sm')
											.addClass('btn-block')
											.addClass("custom_stats_field")
											.attr('style', 'padding-top: 0px !important');
	var statsDiv = $("<div></div>");
	var eloField = $("<strong></strong>").html(player['faceit_csgo_elo']);
	statsDiv.append("ELO: ");
	statsDiv.append(eloField);
	var hoursField = $("<strong></strong>").html(player['hours']);
	statsDiv.append(" Hours: ")
	statsDiv.append(hoursField);
	statsContainerDiv.append(statsDiv);
	var matchItem = $("a.match-team-member__name strong:contains('" + player['nickname'] + "')").parent().parent().parent().parent();
    	matchItem.find('.match-team-member__avatar').append(skillLevelDiv);
    	matchItem.find('.match-team-member__row').append(statsContainerDiv);
};
