// ==UserScript==
// @name         FaceIT match room advanced stats
// @namespace    http://tampermonkey.net/
// @version      0.2
// @description  Shows elo, level and cs go steam hours for each player on match screen.
// @author       Viaceslavas 'fire_bot' Duk
// @match        https://beta.faceit.com/en/csgo/room*
// @grant        none
// ==/UserScript==
/* jshint -W097 */
'use strict';

// You can get your web api key from https://steamcommunity.com/dev/apikey 
var webkey = "YOUR STEAM WEB API KEY GOES HERE";

angular.element(document).ready(function() {
    // NOTE: if anyone knows how to plug in into angularjs controller to $watch when "members" has changed/loaded then
    // we can get rid of setTimeout and all html scraping boilerplate(and maybe 10 get calls?) please let know. Thanks!
    setTimeout(function() { 
        var matchItems = $(".match-team-member");
        $(".match-vs .match-team-member__row .match-team-member__name").each(function(idx, el) { 
            var href = $(el).attr("href");
            if (href) {
                var splitHref = href.split("/");
                var nickIdx = splitHref.length-1;
                if (splitHref[nickIdx]) {
                    $.get("https://api.faceit.com/api/nicknames/" + splitHref[nickIdx], function( data ) {
                        //debugger;
                        var csgoPayload = data['payload']['games']['csgo'];
                        var steamID = csgoPayload['game_id'];
                        var steamURL = "https://api.steampowered.com/IPlayerService/GetOwnedGames/v0001/?key=" + webkey + "&steamid=" + steamID + "&format=json"

                        // Proxy based on https://github.com/afeld/jsonp 
                        $.ajax({   url: "https://jsonp-steamid-proxy.herokuapp.com/?url=" + encodeURIComponent(steamURL),
                                    success: function(data) { draw(data, csgoPayload, matchItems, idx); },
                                    error: function(data) { draw(data, csgoPayload, matchItems, idx); }
                        });
                    });
                }
            }
        });
    }, 3000);
});

var draw = function(data, csgoPayload, matchItems, idx) {
      debugger;
      var hours = "N/A";
      try {
        var games = data.response.games;
        for(var i = 0; i < games.length; i++) {
          var game = games[i];
          if (game.appid === 730) {
            hours = (game.playtime_forever/60).toFixed(1);
          }
        }
      } catch (err) {
    }

    var style = "position: absolute; z-index: 3;right: 34px;bottom: -6px;width: 24px;height: 24px";
    var imgHtml = "<div style='" + style + "'><img src='https://cdn.faceit.com/frontend/75/assets/images/skill-icons/skill_level_" + csgoPayload['csgo_skill_level'] + "_sm.png'/></div>";
    var resultHTML = "<div class='pa-sm btn-block' style='padding-top: 0px !important;'>";
    resultHTML += "<div > ELO: <strong>" + csgoPayload['faceit_csgo_elo'] + "</strong>" +
    " Hours: <strong>" + hours + "</strong></div>";
    resultHTML += "</div>";

    $(matchItems[idx]).find('.match-team-member__avatar').append(imgHtml);
    $(matchItems[idx]).find('.match-team-member__row').append(resultHTML);
};