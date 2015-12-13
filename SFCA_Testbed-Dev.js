/////////////////////////////////////////////////////////////////////////////////////////////
//
// Starfleet Commander Advantage - Testbed
// Copyright (c) Robert Leachman
//
// ------------------------------------------------------------------------------------------
//
// This is a Tampermonkey script, tested for use with Chrome.
// (TODO: Expand on this instruction)
//
// Install Chrome, then Tampermonkey, then this script.
//
// ------------------------------------------------------------------------------------------
//
// USAGE:
//
// * Ill-advised, this is the lair of bad ideas.
//
// TODO notes & questions
// - (Refer to Resolve) Passing $ in the object constructor would work, but then would be this.$
//   The point is to have code easily moved to a non-conflicted environment so that's no good.
//   QUESTION: How to handle context to achieve desired result?
// - Sleepsave "No idea why"
//
//
// GOOD IDEAS PILE
// - Should record some notes on future direction here...
//
// DONE
// - Module started
//
// VERSION HISTORY
//
// 0.21 - New editor, same great taste
// 0.19 - Some good hacks
// 0.17 - Seriously shabby
// 0.15 - Getting serious.
// 0.1  - Created module! Back in the saddle in 2015 with a new intent to
//        become a better Javascript programmer.
//
//
// ==UserScript==
// @name         SFCA Testbed-Local
// @namespace    http://your.homepage/
// @version      0.23
// @description  Hacks and stuff for SFC
// @author       Robert Leachman
// @match        http://*.playstarfleet.com/*
// @match        http://*.playstarfleetextreme.com/*
// @require      https://cdnjs.cloudflare.com/ajax/libs/jquery/3.0.0-alpha1/jquery.min.js
// @grant        none
// @grant GM_setValue
// @grant GM_getValue
// @COULDgrant GM_setClipboard
// @COULDgrant unsafeWindow
//
// @COULDinclude      http://*

//
// ==/UserScript==
/////////////////////////////////////////////////////////////////////////////////////////////

/*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*
 *
 *             U S E R S C R I P T  F U N C T I O N S
 *
 *-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*/
// per https://learn.jquery.com/using-jquery-core/avoid-conflicts-other-libraries/
jQuery.noConflict();

// from Dive Into Greasemonkey (2010)
// http://diveintogreasemonkey.org/patterns/add-css.html
function addGlobalStyle(css) {
    var head, style;
    head = document.getElementsByTagName('head')[0];
    if (!head) {
        return;
    }
    style = document.createElement('style');
    style.type = 'text/css';
    style.innerHTML = css;
    head.appendChild(style);
}

// Get parameters from current HREF
// http://www.netlobo.com/url_query_string_javascript.html
function gup(name) {
    name = name.replace(/[\[]/, "\\\[").replace(/[\]]/, "\\\]");
    var regexS = "[\\?&]" + name + "=([^&#]*)";
    var regex = new RegExp(regexS);
    var results = regex.exec(window.location.href);
    if (results == null)
        return "";
    else
        return results[1];
}

//                                               W H A T I S T H I S ????
// their's, so nice...
function get_inner_html(id) {
    //myLog("Looking for: " + id);
    /*
     if($(id)) {
     return parseInt($(id).innerHTML,10);
     }
     */
    var field = document.getElementById(id);
    console.log("content=" + field.innerHTML);
    return parseInt(document.getElementById(id).innerHTML, 10); // bugfix "08 09"
}


// From https://gist.githubusercontent.com/raw/2625891/waitForKeyElements.js
// Hacked to use noConflict jQuery

/*--- waitForKeyElements():  A utility function, for Greasemonkey scripts,
 that detects and handles AJAXed content.

 Usage example:

 waitForKeyElements (
 "div.comments"
 , commentCallbackFunction
 );

 //--- Page-specific function to do what we want when the node is found.
 function commentCallbackFunction (jNode) {
 jNode.text ("This comment changed by waitForKeyElements().");
 }

 IMPORTANT: This function requires your script to have loaded jQuery.
 */
function waitForKeyElements($,
                            selectorTxt, /* Required: The jQuery selector string that
                             specifies the desired element(s).
                             */
                            actionFunction, /* Required: The code to run when elements are
                             found. It is passed a jNode to the matched
                             element.
                             */
                            bWaitOnce, /* Optional: If false, will continue to scan for
                             new elements even after the first match is
                             found.
                             */
                            iframeSelector  /* Optional: If set, identifies the iframe to
                             search.
                             */) {
    var targetNodes, btargetsFound;

    if (typeof iframeSelector == "undefined")
        targetNodes = $(selectorTxt);
    else
        targetNodes = $(iframeSelector).contents()
            .find(selectorTxt);
    if (targetNodes && targetNodes.length > 0) {
        btargetsFound = true;
        /*--- Found target node(s).  Go through each and act if they
         are new.
         */
        targetNodes.each(function () {
            var jThis = $(this);
            var alreadyFound = jThis.data('alreadyFound') || false;

            if (!alreadyFound) {
                //--- Call the payload function.
                var cancelFound = actionFunction($, jThis);
                if (cancelFound)
                    btargetsFound = false;
                else
                    jThis.data('alreadyFound', true);
            }
        });
    }
    else {
        btargetsFound = false;
    }

    //--- Get the timer-control variable for this selector.
    var controlObj = waitForKeyElements.controlObj || {};
    var controlKey = selectorTxt.replace(/[^\w]/g, "_");
    var timeControl = controlObj [controlKey];

    //--- Now set or clear the timer as appropriate.
    if (btargetsFound && bWaitOnce && timeControl) {
        //--- The only condition where we need to clear the timer.
        clearInterval(timeControl);
        delete controlObj [controlKey]
    }
    else {
        //--- Set a timer, if needed.
        if (!timeControl) {
            timeControl = setInterval(function () {
                    waitForKeyElements($,
                        selectorTxt,
                        actionFunction,
                        bWaitOnce,
                        iframeSelector
                    );
                },
                300
            );
            controlObj [controlKey] = timeControl;
        }
    }
    waitForKeyElements.controlObj = controlObj;


}


// still great all these years later...
// http://notetodogself.blogspot.com/2009/08/javascript-insert-table-rows-table-body.html
//    (makes the point that jQuery needs to check a lot of cases we are not concerned about, so use straight JS)
function appendTableRows(node, html) {
    var temp = document.createElement("div");
    var tbody = node.parentNode;
    var nextSib = node.nextSibling;
    temp.innerHTML = "<table><tbody>" + html;
    var rows = temp.firstChild.firstChild.childNodes;
    while (rows.length) {
        tbody.insertBefore(rows[0], nextSib);
    }
}

// I wanted an elegant solution and feel like I found it, but it's controversial //TODO: write my own, simple way
//  http://stackoverflow.com/questions/1767246/javascript-check-if-string-begins-with-something
String.prototype.beginsWith = function (string) {
    return (this.indexOf(string) === 0);
};


/*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*
 *
 * MY FUNCTIONS:
 *
 *-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*/
// Display a nice status or error message box
function emitNotification($, quickLink) {
    var messageBox = document.createElement("div");
    messageBox.setAttribute('class', 'notice');
    messageBox.innerHTML = quickLink;

    $(messageBox).appendTo('#flash_messages');
}

// Display a nice status or error message box
function emitStatusMessage(message, bGold) {

    // CSS NEEDS HELP!

    var messageBox = document.createElement("div");
    if (bGold)
        messageBox.setAttribute('class', 'myStatusBox');
    else
        messageBox.setAttribute('class', 'myLessFancyStatusBox');
    messageBox.innerHTML = message;
    //var nav=document.getElementById("sticky_notices");
    var nav = document.getElementById("user_planets");
    nav.parentNode.insert(messageBox, nav.nextSibling);
}

function getCookie(cname) {
    var name = cname + "=";
    var ca = document.cookie.split(';');
    for (var i = 0; i < ca.length; i++) {
        var c = ca[i];
        while (c.charAt(0) == ' ') c = c.substring(1);
        if (c.indexOf(name) == 0) return c.substring(name.length, c.length);
    }
    return "";
}

// Extend the base function to provide separation between the differnet versions...
function myGMsetValue(param, value) {
    var uni = window.location.href.split('.')[0].split('/')[2];
    //console.log('Setting '+uni+'-'+param+'='+value);
    GM_setValue(uni + '-' + param, value);
}

function myGMgetValue(param, def) {
    var uni = window.location.href.split('.')[0].split('/')[2];
    var needDefault = "NoSuchValueStoredHere";
    //console.log('fetching '+uni+'-'+param);
    var val = GM_getValue(uni + '-' + param, needDefault);
    if (val == needDefault)
        return def;
    else
        return val;
}

function addMyCSS_testbed() {
    // Status messages...
    //console.log("ADD CSS");

    var myCSS = "";
    myCSS = ".myStatusBox {";
    myCSS += "line-height: 30px;";
    //myCSS += "color: #FF9219;";
    //myCSS += "background-image:url(/images/starfleet/layout/transparent_grey_bg.png);";
    //myCSS += "border:1px solid #006C82;";
    myCSS += "padding:5px;";
    myCSS += " margin-bottom:3em;";
    myCSS += "vertical-align: top;";
    myCSS += "}";
    myCSS += ".myLessFancyStatusBox {";
    myCSS += "color: white;";
    //myCSS += "background-image:url(/images/starfleet/layout/transparent_grey_bg.png);";
    myCSS += "border:1px solid #006C82;";
    myCSS += "padding:10px;";
    myCSS += " margin-bottom:1em;";
    // TODO: looking good, but I didn't consider the above...
    myCSS += "height: 100px;";
    myCSS += "margin-top: 7px;";
    myCSS += "width: 728px;";
    myCSS += "}";

    myCSS += "#header .sub_nav .nav_item {";
    myCSS += "padding: 10px 6px !important;"
    myCSS += "}";
    //myCSS += ".nav_item.image {";
    //myCSS += "padding: 0px 0px !important;"
    //myCSS += "}";


    myCSS += '#myStuff {';
    //myCSS += 'background-image: url(/images/starfleet/layout/transparent_grey_bg.png);';
    myCSS += 'border: 1px solid yellow;';
    myCSS += 'margin-left: -10px;';
    myCSS += 'margin-bottom: 5px;';
    myCSS += 'padding: 10px 10px 10px 20px;';
    myCSS += '}';

    myCSS += '.redfont {';
    myCSS += 'color:red !important;';
    myCSS += '}';

    myCSS += '#content #overview_table .sufficient,';
    myCSS += '#header .resources .row.sufficient {;'
    myCSS += '    color: green;';
    myCSS += '}';

    addGlobalStyle(myCSS);
}

function hideTop() {
    // using CSS not $().hide() so to affect the screen before document ready

    var myCSS = "";
    //myCSS += 'div.resources.starfleet.eradeon {';
    myCSS += '#resources_table {';
    myCSS += '    display: none;';
    myCSS += '}';

    myCSS += 'div.navigation_bar {';
    myCSS += '    display: none;';
    myCSS += '}';

    myCSS += '#planet_sub_nav {';
    myCSS += '    display: none;';
    myCSS += '}';

    addGlobalStyle(myCSS);

}

function showTop() {
    // having injected style CSS the only way to alter it is to inject more :( //TODO: research another way?

    var myCSS = "";
    // Before StyleBot it was pretty simple:
    myCSS += '#resources_table {';
    myCSS += '    display: block;';
    myCSS += '}';

    myCSS += 'div.navigation_bar {';
    myCSS += '    display: block;';
    myCSS += '}';

    myCSS += '#planet_sub_nav {';
    myCSS += '    display: block;';
    myCSS += '}';

    // Stylebot demands a bit more:
    //myCSS += 'div.resources.starfleet.eradeon {';
    myCSS += '#resources_table.starfleet {';
    myCSS += '    display: block !important;';
    myCSS += '}';

    myCSS += 'div.navigation_bar {';
    myCSS += '    display: block !important;';
    myCSS += '}';

    // For overriding StyleBot
    myCSS += '#the_nav_bar {';
    myCSS += '    display: block !important;';
    myCSS += '}';

    //myCSS += 'div.sub_nav {';
    myCSS += 'div#planet_sub_nav.sub_nav {';
    myCSS += '    display: block !important;';
    myCSS += '}';

    myCSS += ".myLessFancyStatusBox {";
    myCSS += '    display: none;';
    myCSS += '}';

    addGlobalStyle(myCSS);

}


// Display BOJ message on Profile screen
function insertProfileHeader($) {
    emitNotification($, 'Starfleet Commander Advantage -  Testbed (version ' + GM_info.script.version + '): ACTIVE!');
}

function myAttachIt(theFunction) {

    var script = document.createElement("script");
    script.type = "application/javascript";

    //anonymous function, fires on load:
    //script.textContent = "(" + myScript + ")();";

    //we just want it available for later:
    script.textContent = theFunction;

    document.body.appendChild(script);
}

function confirmIfFree($, popup) {
    //console.log(popup.html());
    var isFreeText = /This task will complete in less than five minutes/;

    var isFree = isFreeText.exec(popup.text());
    if (isFree) {
        // I don't like how the form flashes but it's fine for now...
        var stupidConfirm = $('#confirm_popup');
        stupidConfirm.hide();

        var confirm = $(".confirm_button");
        console.log("sel len " + confirm.length);
        var theButton = $('.confirm_button').first();

        // I considered working the HTML as strings, ugh...
        //var popupHTML = popup.html();
        //console.log("HTML: " + popupHTML);

        // Just find the form and submit it
        /***
         * DEV NOTE:
         * This was tricky for me, the form has unique ID numbers:
         *    <form action="/store/buy_speedup/30764191?current_planet=34511&amp;ref_action=index&amp;ref_controller=home"
         *           id="confirm_popup_form_buy_speedup_30764191_178100" method="post">
         * So we search for any form that starts with the ID we need, and submit it.
         ***/
        var theForm = $('[id^=confirm_popup_form]');
        theForm.submit();
    }
}

// displaying the Resources tab, as evidenced by the fields column...
function displayingResources($, fields) {
    console.log(" Research report default...");
    //doResearchReport($);
    toolbarResources($);

    var comments = new Array('First', 'Second', 'Third');


    /*********** FINISH THIS **************
     // now process the rows... or something
     var i = -1;
     $('#overview_table > table > tbody  > tr').each(function () {
        if (i > -1) {
            $this = $(this);
            var theirRow = 'theirRow' + i;
            this.setAttribute('id', theirRow);
            //var value = $this.find(".planet").html();

            var tr = document.getElementById("theirRow" + i); //this is an id of some td in some existing table
            var displayRow = '<tr id="displayRow' + i + '" style="border-top: 0px solid grey"><td>&nbsp;</td><td colspan="4" style="text-align:left"><a href="#">&gt;</a>&nbsp;';
            displayRow += comments[i];
            displayRow += '</td></tr>';


            var inputRow = '<tr id="inputRow' + i + '" style="border-top: 0px solid grey"><td>&nbsp;</td><td colspan="4" style="text-align:left">';

            inputRow += '<textarea id="inField' + i + '" rows="1" cols="70">';
            inputRow += comments[i];
            inputRow += '</textarea>';
            inputRow += '</td></tr>';

            // old-school JS way:
            appendTableRows(tr, displayRow);
            appendTableRows(tr, inputRow);

            var value = $this.html();

            // terrific, except it appends to the end of the current row
            //$(this).append(newRow);
            // well yes, this appends the row to the bottom of the table...
            //$(this).parent().append(newRow);

            //console.log("row " + i + ":" + value );

            if (i > 2)
                return false;
        }
        i++;
    });
     $('#inField0').focus();
     $('#inField0').blur(function () {
        console.log("Lost focus...");
    });
     *************** FINISH *****************/

}


function displayingMines($, tasks) {
    console.log("GOT MINES");
}

function displayingTasks($, tasks) {
    console.log("GOT TASKS");
}
function displayingDefenses($, tasks) {
    console.log("GOT DEFENSES");
}
function displayingShips($, tasks) {
    console.log("GOT SHIPS");
}

function toolbarResources($) {
    var theHTML = '<a href="#" id="researchButton">[Research Report]</a>';
    emitNotification($, theHTML);
    document.getElementById('researchButton').addEventListener('click', function (e) {
        doResearchReport($);
    }, false);
}

function stripCoordsFromPlanetRow($, row) {
    var planet = row.children('td').first();
    var coords = planet.children('div').first().next().find('.coords');
    var theirHTML = coords.html();
    return theirHTML.split('=')[2].split('&')[0]; // for /fleet?current_planet=34287
}

function doResearchReport($) {
    var uni = window.location.href.split('.')[0].split('/')[2];

    var i = -1;
    $('#overview_table > table > tbody  > tr').each(function () {
        if (i > -1) {
            $this = $(this);
            var theirRow = 'theirRow' + i;
            this.setAttribute('id', theirRow);
            //console.log('DEBUG",$this.children('td').first().html());
            if ($this.children('td').first().html() === 'TOTAL:') {
                console.log('total line');
                this.setAttribute('lab_level', 0);
            } else {

                var p = stripCoordsFromPlanetRow($, $this);

                var ore = $this.children('td').first().next();
                var crystal = $this.children('td').first().next().next();
                var hydro = $this.children('td').first().next().next().next();

                var availableOre = parseInt(ore.html().replace(/,/g, ''), 10); // strip commas
                var availableCrystal = parseInt(crystal.html().replace(/,/g, ''), 10);
                var availableHydro = parseInt(hydro.html().replace(/,/g, ''), 10);

                //console.log("DEBUG O/C/H", availableOre, availableCrystal, availableHydro);

                var upgrade = localStorage[uni + '-' + 'researchUpgrade_' + p]; // = loc.oCost + '/' + loc.cCost + '/' + loc.hCost;
                var upgradeOre = upgrade.split('/')[0];
                var upgradeCrystal = upgrade.split('/')[1];
                var upgradeHydro = upgrade.split('/')[2];
                console.log("upgrade", upgradeOre, upgradeCrystal, upgradeHydro);

                //var netOre = availableOre - upgradeOre;
                //ore.html(format( availableOre - upgradeOre ,'.',0));
                ore.html(Math.abs(availableOre - upgradeOre).toLocaleString());
                crystal.html(Math.abs(availableCrystal - upgradeCrystal).toLocaleString());
                hydro.html(Math.abs(availableHydro - upgradeHydro).toLocaleString());

                //<td class="alt ore full">298,236</td>
                //<td class="alt ore almost_full">298,236</td>
                //<td class="alt ore sufficient">639,572</td>
                //<td class="crystal> full">150,071</td>
                //<td class="crystal> sufficient">150,071</td>
                if ((availableOre - upgradeOre) < 0) {
                    console.log("INSUFFICIENT available", availableOre, "upgrade", upgradeOre)
                    ore.attr('class', 'alt ore full');
                } else {
                    console.log("Plenty of ore");
                    ore.attr('class', 'alt ore');
                }
                if ((availableCrystal - upgradeCrystal) < 0) {
                    crystal.attr('class', 'crystal> full');
                } else {
                    crystal.attr('class', 'crystal');
                }
                if ((availableHydro - upgradeHydro) < 0) {
                    hydro.attr('class', 'alt hydrogen full');
                } else {
                    hydro.attr('class', 'alt hydrogen');
                    console.log("Plenty! of hydrogen");
                    console.log("DEBUG I GIVE UP");

                }


                var fields = $this.children('td').last();
                var labLevel = localStorage[uni + '-' + 'research_' + p];
                if (typeof labLevel !== 'string') {
                    labLevel = '?';
                }
                fields.html(labLevel);

                // and mark the row for sorting
                this.setAttribute('lab_level', labLevel);
            }


            /*
             var tr = document.getElementById("theirRow"+i); //this is an id of some td in some existing table
             var displayRow = '<tr id="displayRow' + i + '" style="border-top: 0px solid grey"><td>&nbsp;</td><td colspan="4" style="text-align:left"><a href="#">&gt;</a>&nbsp;';
             displayRow += comments[i];
             displayRow += '</td></tr>';



             var inputRow = '<tr id="inputRow' + i + '" style="border-top: 0px solid grey"><td>&nbsp;</td><td colspan="4" style="text-align:left">';

             inputRow += '<textarea id="inField' + i + '" rows="1" cols="70">';
             inputRow += comments[i];
             inputRow += '</textarea>';
             inputRow += '</td></tr>';

             // old-school JS way:
             appendTableRows(tr, displayRow);
             appendTableRows(tr, inputRow);

             var value = $this.html();

             // terrific, except it appends to the end of the current row
             //$(this).append(newRow);
             // well yes, this appends the row to the bottom of the table...
             //$(this).parent().append(newRow);

             //console.log("row " + i + ":" + value );

             if (i > 2)
             return false;
             */
        } else {
            // fix up the header
            $this = $(this);
            fieldsColumn = $this.children().last().html('Research');
            this.setAttribute('lab_level', 99);
        }
        i++;
    });


    // Sort by research level
    var $table = $('#overview_table > table');

    var rows = $table.find('tr').get();

    rows.sort(function (a, b) {
        var keyA = $(a).attr('lab_level');
        var keyB = $(b).attr('lab_level');

        if (parseInt(keyA, 10) < parseInt(keyB, 10)) return 1;
        if (parseInt(keyA, 10) > parseInt(keyB, 10)) return -1;
        return 0;
    });
    $.each(rows, function (index, row) {
        $table.children('tbody').append(row);
    });

}

function getResearchPosition(planet) {
    var sortResearch = [];

    // Get each planet's level of research from local storage
    var uni = window.location.href.split('.')[0].split('/')[2];
    var resKey = uni + '-' + 'research_';
    for (var key in localStorage) {
        if (key.beginsWith(resKey)) {
            planetResearch = [key, localStorage.getItem(key)];
            sortResearch.push(planetResearch);
        }
    }
    // Sort by research level
    sortResearch.sort(function (val1, val2) {
        v1 = parseInt(val1[1], 10);
        v2 = parseInt(val2[1], 10);

        if (v1 < v2) {
            return 1;
        } else if (v1 > v2) {
            return -1;
        } else {
            return 0
        }
    });

    // Find this planet, determine it's relative lab power against the other planets
    var j = 0;
    while (j < sortResearch.length) {
        if (sortResearch[j][0] === uni + '-research_' + planet) {
            return j + 1; // best is #1 not 0
        }
        j++;
    }
    return '?';
}

function menuInit() {
    var menu = localStorage['SFCA_menu'];
    if (typeof menu == "undefined") {
        localStorage['SFCA_menu'] = 'off';
        menu = 'off';
    }

// If we're showing ours, hide theirs
    if (menu === 'on') {
        hideTop();
    } else {
        /**
         * In the dev lab we use StyleBot to suppress their top menu, so ours shows with no flicker.
         * In this case we have to force it to show up even as StyleBot hides it.
         *
         * In someone else's production environment without StyleBot the following does nothing,
         * and when our menu is shown there is a little bit of flicker. Nothing more to do about it...
         */
        // Must add an id for greater specificity for our force...
        var x = document.getElementsByClassName("navigation_bar");
        x[0].setAttribute("id", "the_nav_bar");
        showTop();
    }

}

function menuDisplay($, thePlanet, additionalItems) {
    var menuToggle = localStorage['SFCA_menu'];
    if (menuToggle == "on") {
        //var myMenu='<a id="buttonToggleMenus">[Full Menu]</a> <a href="/fleet?current_planet='+thePlanet+'">[Fleet]</a>';
        var myMenu = '<a id="buttonToggleMenus">[Full Menu]</a> <a id="buttonGoBuildings">[Buildings]</a> <a id="buttonGoFleet">[Fleet]</a> <a id="buttonGoShipyard">[Shipyard]</a>' +
            ' <a id="buttonBuild">[Build]</a>';
        myMenu += '<br /><br />' + additionalItems;
        emitStatusMessage(myMenu, false);
        $('#buttonToggleMenus').click(function () {
            localStorage['SFCA_menu'] = 'off';
            var x = document.getElementsByClassName("navigation_bar");
            x[0].setAttribute("id", "the_nav_bar");
            showTop();
        });
        $('#buttonGoBuildings').click(function () {
            window.location.href = "/buildings/home?current_planet=" + thePlanet;
        });
        $('#buttonGoFleet').click(function () {
            window.location.href = "/fleet?current_planet=" + thePlanet;
        });
        $('#buttonGoShipyard').click(function () {
            window.location.href = "/buildings/shipyard?current_planet=" + thePlanet;
        });
        $('#buttonBuild').click(function () {
            console.log("build");

            $('#build_amount_2073344062').val(10); // one is fine for the test button...

            disable_ajax_links();

            //new Ajax.Request('/buildings/shipyard/build/950199677?current_planet=' + thePlanet,
            //    {asynchronous:true, evalScripts:true, parameters:Form.Element.serialize('build_amount_950199677')});


            new Ajax.Request('/buildings/shipyard/build/2073344062?current_planet=' + thePlanet,
                {asynchronous: true, evalScripts: true, parameters: Form.Element.serialize('build_amount_2073344062')});
            console.log("built");

        });


    } else {
        emitStatusMessage(additionalItems, true);
    }


    var ourButton = $('<span />').attr('class', 'nav_item').html('<a id="buttonSFCA">SFCA</a>');
    ourButton.prependTo('#planet_sub_nav');
    $('#buttonSFCA').click(function () {
        localStorage['SFCA_menu'] = 'on';

        console.log("TRY HARDER");
        location.reload();
    });


}

function Goalie($) {
    this.universe = window.location.href.split('.')[0].split('/')[2];
    this.planet = gup('current_planet');
    var activatePlanet = gup('activate_planet');
    if (activatePlanet.length)
        this.planet = activatePlanet;

    // Get the current recommendation. If there isn't any, and we're on the tech screen, establish new goal.
    this.recommendation = localStorage[this.universe + '-' + 'tech_' + this.planet];
    if (typeof this.recommendation == 'undefined') {
        this.recommendation = "Undetermined";
    }

    if ($('.technology.index').length) {
        var recommendedBuild = $('.recommendations').html().split('>')[3].split('<')[0];
        console.log("MAKE '" + recommendedBuild + "'");
        localStorage[this.universe + '-' + 'tech_' + this.planet] = recommendedBuild;
        this.recommendation = recommendedBuild;
    }

    // If we're on the building screen and currently building something, clear any recommendations (and we're done?)
    if ($('.buildings.home.index').length) {
        // If a build is in process, all bets are off for what comes next. Clear the recommendation.
        var upgrade = $("#upgrade_in_progress").html().replace(/\s+/g, ''); // strip whitespace
        if (upgrade.length) {
            this.resetRecommendation($);
        }
    }

    var upgradeOre = 0, upgradeCrystal = 0, upgradeHydro = 0;
    var costRecommendation = "unknown";
    var costs = localStorage[this.universe + '-' + 'techCost_' + this.planet];
    if (typeof costs !== 'undefined') {
        costRecommendation = costs.split('/')[0];
        console.log("costs computed for", costRecommendation);
        upgradeOre = costs.split('/')[1];
        upgradeCrystal = costs.split('/')[2];
        upgradeHydro = costs.split('/')[3];
    }

    //var availableOre = parseInt($("#max_ore").val(), 10);
    var availableOre = parseInt($('#resource_ore').html().replace(/,/g, ''), 10);
    var availableCrystal = parseInt($('#resource_crystal').html().replace(/,/g, ''), 10);
    var availableHydro = parseInt($('#resource_hydrogen').html().replace(/,/g, ''), 10);
    /*
     console.log('ro', resourceOre);
     var availableOre = parseInt($("#max_ore").val(), 10);

     var availableCrystal = parseInt($("#max_crystal").val(), 10);
     var availableHydro = parseInt($("#max_hydrogen").val(), 10);
     console.log('ah', availableHydro);
     */

    var shortOre = availableOre - upgradeOre;
    var shortCrystal = availableCrystal - upgradeCrystal;
    var shortHydro = availableHydro - upgradeHydro;

    (shortOre < 0) ? shortOre *= -1 : shortOre = 0;
    (shortCrystal < 0) ? shortCrystal *= -1 : shortCrystal = 0;
    (shortHydro < 0) ? shortHydro *= -1 : shortHydro = 0;

    this.costedRecommendation = "none";
    if (this.recommendation === costRecommendation) {
        this.costedRecommendation = this.recommendation + ' (ore:' + shortOre + ' crystal:' + shortCrystal + ' hydrogen:' + shortHydro + ')';
        if (shortOre + shortCrystal + shortHydro == 0) {
            // if we are on the tech screen, confirmed good target and sufficent resources, do it!
            if ($('.technology.index').length) {
                this.costedRecommendation = this.recommendation + " - Build!";
                this.setGoalMet($);
            } else {
                // probably fine, but let's reconfirm (need to see the current build target to be sure)
                if (!this.goalMet($)) {
                    this.costedRecommendation = this.recommendation + " - Ready?";
                } else {
                    this.costedRecommendation = this.recommendation + " - Build it!";

                }
            }
        } else {
            this.costedRecommendation = this.recommendation + ' (ore:' + shortOre + ' crystal:' + shortCrystal + ' hydrogen:' + shortHydro + ')';
        }
    } else {
        this.costedRecommendation = this.recommendation + " (" + this.costedRecommendation + ")";
    }
}

Goalie.prototype = {
    constructor: Goalie,
    resetRecommendation: function ($) {
        console.log("Reset goal to building state");
        localStorage.removeItem(this.universe + '-' + 'tech_' + this.planet);
        localStorage.removeItem(this.universe + '-' + 'techCost_' + this.planet);
    },
    getRecommendation: function ($) {
        if (this.costedRecommendation !== 'none') {
            return this.costedRecommendation;
        }
        return this.recommendation;
    },
    getCosts: function ($) {
        var logger = new Logger(this.universe);
        //logger.log('d','Getting costs for '+this.recommendation);

        //if the costs have been flagged, the goal is met, don

        var rec = this.recommendation;
        var uni = this.universe;
        var planet = this.planet;
        $('.row.location').each(function () {
            var loc = new Location($(this));
            if (loc.isNamed(rec)) {
                console.log("found recommendation " + uni + '-' + 'techCost_' + planet);
                localStorage[uni + '-' + 'techCost_' + planet] = rec + '/' + loc.oCost + '/' + loc.cCost + '/' + loc.hCost;
            }
        });
    },
    setGoalMet: function ($) {
        var logger = new Logger(this.universe);
        logger.log('d', 'Getting costs for ' + this.recommendation);

        var rec = this.recommendation;
        var uni = this.universe;
        var planet = this.planet;
        localStorage[uni + '-' + 'techCost_' + planet] = rec + '/' + -999 + '/' + -999 + '/' + -999;
        console.log("TEST GOAL MET", this.goalMet($));
    },
    goalMet: function ($) {
        var costs = localStorage[this.universe + '-' + 'techCost_' + this.planet];
        console.log("DEBUG costs", costs);
        if (typeof costs !== 'undefined') {
            var upgradeOre = costs.split('/')[1];
            console.log("ORE FLAG", upgradeOre);
            return (upgradeOre === '-999');
        }
        return false;
    },
    getGoalLink: function ($) {

    }
};

function Location(e) {
    var locationNameHTML = e.find('.name').html();
    var linkText = /(>)(.*)(<)/;
    var searchName = linkText.exec(locationNameHTML);
    this.name = searchName[2];

    this.buildingNumber = -1;
    var buttonHTML = e.find('.action_link').html();
    //console.log("Bzzt", buttonHTML);
    if (typeof buttonHTML === 'string') {
        buttonHTML = buttonHTML.replace(/\s+/g, '');
        var buildingNumber = /(build\/)(.*)(\?)/;
        var searchNumber = buildingNumber.exec(buttonHTML);
        this.buildingNumber = searchNumber[2];

        // flag the buildings that can't be built
        var enabledButton = /(enabled)(.*?)(>)/;
        var searchEnabled = enabledButton.exec(buttonHTML);
        //console.log("enabled", searchEnabled[2]);
        if (searchEnabled[2] !== '"') {
            this.buildingNumber *= -1;
        }
    }

    /*
     var buttonHTML = e.find('.action_link').html().replace(/\s+/g, '');
     var buildingNumber = /(build\/)(.*)(\?)/;
     var searchNumber = buildingNumber.exec(buttonHTML);
     this.buildingNumber = searchNumber[2];
     */


    // pick it up about here...
    //console.log("LOC name", this.name, "number", this.buildingNumber, this.buildingNumber > 0);


    this.level = 0;
    var level = linkText.exec(e.find('.level').html());
    if (level instanceof Array) {
        this.level = level[0].slice(1, -1);
    }

    this.oCost = this.upgradeCost(e.find('.row.ore.cost').children().first().next().html());
    this.cCost = this.upgradeCost(e.find('.crystal.cost').children().first().next().html());
    this.hCost = this.upgradeCost(e.find('.hydrogen.cost').children().first().next().html());

    //if (this.name === "Ore Mine")
    //    console.log("LOC name", this.name, this.level, this.oCost, this.cCost, this.hCost);

    this.missileSlots = 0;
    this.missileCount = 0;
    this.needMissiles = false;

    if (this.name === "Missile Silo") {
        var rawCounts = e.find('.data.amount').html().replace(/\s+/g, '') + ">";
        this.missileSlots = parseInt(rawCounts.split('>')[4], 10);
        this.missileCount = parseInt(rawCounts.split('>')[1].split('<')[0], 10);
        // ... and while we're at it
        this.needMissiles = (this.missileSlots - this.missileCount > 0);
        //console.log("Missilecounts", this.missileSlots, this.missileCount, this.needMissiles);
    }
}

Location.prototype = {
    constructor: Location,
    isNamed: function (targetName) {
        // real power here, ha ha
        return this.name === targetName;
    },
    upgradeCost: function (costHTML) {
        var cost = costHTML;
        if (typeof cost === 'string') {
            var bigOre = costHTML.split('"')[1];
            if (typeof bigOre === 'string') {
                cost = bigOre;
            }
            return parseInt(cost.replace(/,/g, ''), 10);
        } else
            return -1;
    }
};

function Shipwright() {
    this.universe = window.location.href.split('.')[0].split('/')[2];
    this.planet = gup('current_planet');
    var activatePlanet = gup('activate_planet');
    if (activatePlanet.length)
        this.planet = activatePlanet;
    this.buildState = localStorage[this.universe + '-build'];
}

Shipwright.prototype = {
    constructor: Shipwright,
    getBuildState: function () {
        var logger = new Logger(this.universe);
        logger.log('d', 'build state=' + this.buildState);
        return this.buildState;
    },
    setBuildState: function (newState) {
        var logger = new Logger(this.universe);
        logger.log('d', 'set build state=' + newState);
        localStorage[this.universe + '-build'] = newState;
    },
    buildShip: function ($, shipType, amount) {
        var logger = new Logger(this.universe);
        logger.log('d', 'requested build=' + shipType);

        waitForKeyElements($, "#enqueued", this.buildSuccess);
        waitForKeyElements($, ".error", this.buildError);

        console.log("DEBUG autobuild", this.buildState);

        // Now find the number for the requested type and get it built
        // (since 'this' changes, must save to local and use that)
        var thisPlanet = this.planet;
        var foundShip = false;
        var goodBuild = false;
        $('.row.ship_template').each(function () {
            $this = $(this);
            var id = $this.attr('id').split('_')[1];
            //var name = $(this).closest('name');
            var name = $(this).children().first().next().html().split('>')[2].split('<')[0];
            if (name === shipType) {
                foundShip = true;

                var buttonActive = $(this).find('.enabled').attr('style'); // not styled to be hidden
                if (typeof buttonActive == 'undefined') {
                    goodBuild = true;
                    console.log("Building", shipType, "number", id);

                    $('#build_amount_' + id).val(amount); // in prod make 2 or 3 at a time

                    // fire the build request... if successful we'll get a new div and go to buildSuccess via listener
                    // else maybe we'll go to buildError if it doesn't work
                    disable_ajax_links();
                    new Ajax.Request('/buildings/shipyard/build/' + id + '?current_planet=' + thisPlanet,
                        {
                            asynchronous: true,
                            evalScripts: true,
                            parameters: Form.Element.serialize('build_amount_' + id)
                        });
                }
                return false;
            }
        });
        if (!foundShip) {
            logger.log('e', 'Bad ship type=' + shipType);
        }
        if (!goodBuild) {
            logger.log('d', 'Insufficient resources for build');
            this.buildError($, null, true);
        }


        /**
         $('#build_amount_2073344062').val(1); // in prod make 2 or 3 at a time

         // fire the build request... if successful we'll get a new div and go to didBuild via listener
         // else maybe we'll go to gotError if it doesn't work
         disable_ajax_links();
         new Ajax.Request('/buildings/shipyard/build/2073344062?current_planet=' + this.planet,
         {asynchronous:true, evalScripts:true, parameters:Form.Element.serialize('build_amount_2073344062')});
         */
    },
    buildSuccess: function ($) {
        // Key element found, now "this shipwright" is null, so get what we need
        var universe = window.location.href.split('.')[0].split('/')[2];
        var planet = gup('current_planet');
        var activatePlanet = gup('activate_planet');
        if (activatePlanet.length)
            planet = activatePlanet;
        var buildState = localStorage[this.universe + '-build'];

        var logger = new Logger(universe);
        logger.log('d', 'Did build, state=' + buildState);
        if (buildState === 'carmanor') {
            console.log("DEBUG got carms");
            localStorage[universe + '-build'] = 'built';
            window.location.href = "/fleet?current_planet=" + planet;
        } else {
            console.log('DEBUG testing continues...');
        }
    },
    /**
     * If an error is displayed (from their Ajax) log it, but if from our calcs simply handle the error.
     *
     * @param $ -- jquery
     * @param element -- the triggering element
     * @param anticipated -- our flag, true if we caught an error that otherwise would have set the element
     */
    buildError: function ($, element, anticipated) {
        // Key element found, now "this shipwright" is null, so get what we need
        var universe = window.location.href.split('.')[0].split('/')[2];
        var planet = gup('current_planet');
        var activatePlanet = gup('activate_planet');
        if (activatePlanet.length)
            planet = activatePlanet;
        var buildState = localStorage[this.universe + '-build'];

        var logger = new Logger(universe);
        if (!anticipated) {
            var err = element.html(); //TODO: should tidy this up
            logger.log('e', 'Ship build error! state=' + buildState + ' error=' + err);
        }
        // nothing to do but mark it built anyway and get out
        localStorage[universe + '-build'] = 'built';
        console.log("DEBUG return to fleet...");
        //window.location.href = "/fleet?current_planet=" + this.planet;
    }
};


/*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*
 *
 *             M A I N L I N E
 *
 *-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*-*/


jQuery(document).ready(function ($) {

    var logger = new Logger();
    //logger.log('d','Testbed version ' + GM_info.script.version);
    console.log('===================================');

    var thePlanet = gup('current_planet');
    var activatePlanet = gup('activate_planet');
    if (activatePlanet.length)
        thePlanet = activatePlanet;

    var uni = window.location.href.split('.')[0].split('/')[2];

    var goalie = new Goalie($);


    //emitNotification("Some important message", true);
    //    addMyCSS();

    // Watch for the confirmation popup message, be prepared to auto-submit it
    // NOTE: the Fleets screen has some sort of hidden popup, not an issue right now but...
    waitForKeyElements($, "#confirm_popup", confirmIfFree);

    waitForKeyElements($, "th.tasks.alt", displayingTasks);
    waitForKeyElements($, "th.defenses.alt", displayingDefenses);
    waitForKeyElements($, "th.fields", displayingResources);
    waitForKeyElements($, "th.hyd.alt", displayingMines);

    // Hide the number of fields used and distracting offer to terraform
    $('#fields').hide();

    /**
     * Testing which screen we're on in the Goalie object constructor just seems wrong //TODO: decide how terrible
     */
    if ($('.technology.index').length) {
        console.log("Tech");
        //goalie.determineRecommendation($);
    }

    /**
     * Provide automation to the shipyard...
     */
    if ($('.buildings.shipyard.index').length) {
        // When the shipyard screen is served and the build state specifies more freight is required, build a Carmanor.
        // The function will eventually return to the fleets screen and with a state of "built".
        var wright = new Shipwright();
        if (wright.getBuildState() === 'carmanor') {
            console.log("Must keep going with shipwright!");
            wright.buildShip($, 'Carmanor Class Cargo', 1);
            //wright.buildShip($, 'Hermes Class Probe', 1);
        } else {
            //wright.buildShip($, 'Athena Class Battleship', 1);
            //wright.buildShip($, 'Hermes Class Probe', 1);
            console.log("nothing built");
        }
    }


    /***
     *  Capture research levels from the building screen...
     */
    if ($('.buildings.home.index').length) {

        /*
         // If a build is in process, all bets are off for what comes next. Clear the recommendation.
         var upgrade = $("#upgrade_in_progress").html().replace(/\s+/g, ''); // strip whitespace
         if (upgrade.length) {
         goalie.resetRecommendation($);
         }
         */

        if (goalie.goalMet($)) {
            logger.log('d', 'ready to build!!');
        } else {
            // capture costs for the next goal
            goalie.getCosts($);
        }

        var add;

        $('.row.location').each(function () {
            var loc = new Location($(this));
            if (loc.isNamed('Research Lab')) {
                localStorage[uni + '-' + 'research_' + thePlanet] = loc.level;
                localStorage[uni + '-' + 'researchUpgrade_' + thePlanet] = loc.oCost + '/' + loc.cCost + '/' + loc.hCost;
                var researchPosition = "#" + getResearchPosition(thePlanet);

                // Display research level and relative position
                add = document.createElement("div");
                add.setAttribute('class', 'research block');
                add.innerHTML = '<span class="resource left">Research lvl</span>' +
                    ' <span class="amount right">' + loc.level + ' ' + researchPosition + '</span>' +
                    ' <div class="clear"></div>';
                $(add).insertBefore('.energy.block');
            } else if (loc.isNamed('Missile Silo')) {

                add = document.createElement("div");
                add.setAttribute('class', 'research block');
                add.innerHTML = '<span class="resource left">Missiles</span>' +
                    '<span class="amount right ' + (loc.needMissiles ? "redfont" : "") + ' ">' +
                    loc.missileCount + ' of ' + loc.missileSlots +
                    '</span><div class="clear"></div>';
                $(add).insertBefore('.energy.block');

            }
        });
    }

    var onFleets = $('#content.fleet.index').length;
    var doingSleep = $('#SFCA_sleep').length;

    if (onFleets && (!doingSleep)) {

        var coords = $('.target_planet');
        if (coords.length) {

            //console.log('hack!!',coords.html());

            /**
             * Dev note: Sort of interesting, had to be sure this routine doesn't fire when doing an auto-sleepsave
             * because their parts include value="current location" when the screen serves, so when we rewrite the
             * section, it replaces our good sleep distances with the default system and planet.
             *
             * Also of course we don't want these control widgets anyway when doing auto-sleep, but it did stop the
             * dev/debug for a short time.
             */

            var part = coords.html().match(/<.+>/g);

            //console.log('LABEL',part[0]); //label
            //console.log('GALAXY',part[1]); // galaxy
            //console.log('SYSTEM',part[2]);
            //console.log('PLANET',part[3]);
            //console.log('TYPE',part[4]);
            coords.html(part[0] +
                '<a class="left_button" href="#" onclick="incrementWidget(\'' + 'galaxy' + '\', -1, 0, null); return false;"><img alt=">" src="/images/starfleet/layout/left_arrow.png?1439250916"></a>' +
                part[1] +
                '<a class="right_button" href="#" onclick="incrementWidget(\'' + 'galaxy' + '\', 1, 0, null); return false;"><img alt=">" src="/images/starfleet/layout/right_arrow.png?1439250916"></a>' +
                '<a class="left_button" href="#" onclick="incrementWidget(\'' + 'solar_system' + '\', -1, 0, null); return false;"><img alt=">" src="/images/starfleet/layout/left_arrow.png?1439250916"></a>' +
                part[2] +
                '<a class="right_button" href="#" onclick="incrementWidget(\'' + 'solar_system' + '\', 1, 0, null); return false;"><img alt=">" src="/images/starfleet/layout/right_arrow.png?1439250916"></a>' +
                '<a class="left_button" href="#" onclick="incrementWidget(\'' + 'planet' + '\', -1, 0, null); return false;"><img alt=">" src="/images/starfleet/layout/left_arrow.png?1439250916"></a>' +
                part[3] +
                '<a class="right_button" href="#" onclick="incrementWidget(\'' + 'planet' + '\', 1, 0, null); return false;"><img alt=">" src="/images/starfleet/layout/right_arrow.png?1439250916"></a>' +
                part[4]);

        }
    }

    // Display BOJ message on Profile screen
    if ($('#content.options.index').length) {
        insertProfileHeader($);
    }

    //emitStatusMessage("GOAL: "+ goalie.getRecommendation($), true);
    var additionalItems = "GOAL: " + goalie.getRecommendation($);

    // <Our menu>
    menuDisplay($, thePlanet, additionalItems);


    /*
     var m = myGMgetValue('sfca_menu', 'false');
     var moduleEnabled = (m === 'true');
     var doToggle = getCookie('set_moduleEnabled_Sleepsave');
     if (doToggle === 'toggle') {
     document.cookie = "set_moduleEnabled_Sleepsave=; expires=Sun, 04 Jul 1976 00:00:00 UTC";
     if (moduleEnabled) {
     myGMsetValue('enabled_Sleepsave', 'false');
     moduleEnabled = false;
     } else {
     myGMsetValue('enabled_Sleepsave', 'true');
     moduleEnabled = true;
     }
     }
     var displayEnabled = 'DISABLED';
     if (moduleEnabled)
     displayEnabled = 'enabled';
     var myVersion = GM_info.script.version;
     console.log('Sleepsave ver', myVersion, displayEnabled);
     */
    // </ourMenu>

    //emitStatusMessage("String",false);


    //var e = document.getElementById("resources_table");
    //e.setAttribute('style', 'display:block');
    //showTop();

    /*
     if ($('#resources_table').length) {
     console.log("COME ON");
     var myCSS ="";
     //myCSS += 'div.resources.starfleet.eradeon {';
     myCSS += '#resources_table {';
     myCSS += '    display: block;';
     myCSS += '}';
     addGlobalStyle(myCSS);
     //$('#resources_table').css('style: display:block !important;');
     }
     */


    /*
     if (e.getAttribute("style") !== "display:block") {
     e.setAttribute('style', 'display:block');
     toggleFleets = 'block';
     } else {
     e.setAttribute('style', 'display:none');
     }



     */


});

//console.log("BOJ Testbed");
addMyCSS_testbed();

// If we're showing ours, hide theirs
menuInit();


/* ADD A NOTE... need to iterate each row, and $this=$(this) doesn't translate well if using noConflict workaround with assigning a new variable name to replace the $ alias.
 $("tr.item").each(function() {
 $this = $(this)
 var value = $this.find("span.value").html();
 var quantity = $this.find("input.quantity").val();
 });
 */



// INSERT after every TD (not TH) row of #overview_table
//<tr><td colspan="5" style="text-align:left"><a href="#">My note.</td></tr>

//myGMsetValue('fintest2', 'did2SetUni');
//var foo = myGMgetValue('fintest1');

/*
 Stupid confirm speedup box:

 <a href="#" onclick="new Ajax.Request('/store/confirm_speedup/30192381?current_planet=34352&amp;ref_action=build&amp;ref_controller=home', {asynchronous:true, evalScripts:true}); return false;">
 <span id="speedup_30192381_credits_per_second" style="display:none;">1.12</span>
 <span id="speedup_30192381" class="speedup">
 Complete now for
 <span id="speedup_30192381_cost" class="speedup_cost free">FREE</span>
 <span id="speedup_30192381_label" style="display: none;">credits</span>
 </span>
 </a>
 */


/*
 Droid screen, need to highlight unassigned:

 <div id="from_worker_selector" class="small worker_selector popup" style="left: 95px; top: 236px;">
 <form action="/buildings/unassigned/transfer?current_planet=34287" method="post">    <input id="location" name="location" type="hidden" value="633925">
 .
 .
 <div class="worker_name">Mine Droid <br> (Unassigned)</div>
 .
 .
 <div class="worker_name">Mine Droid <br> (Hydrogen Synthesizer)</div>
 .
 .

 */

/* TIMERS
 function makeTimer(id, seconds_from_start, seconds_until_end, callback, speedup_free) {
 makeTimer('" + timerID + "', " + calcStart + ", " + calcEnd + ", " + callback + " );";
 */

/* Sticky notice!
 <div id="sticky_notices">

 <div class="notice">
 <span class="notice_icon"></span>
 <div class="close">
 <span class=" ajax_link">
 <span class="active">
 <span class="enabled">
 <a href="#" onclick="disable_ajax_links();; new Ajax.Request('/stickies/close/2?current_planet=34287&amp;klass=GlobalSticky', {asynchronous:true, evalScripts:true, method:'post'}); return false;">close</a>
 </span>

 <span class="disabled" style="display: none;">
 close
 </span>
 </span>

 <span class="waiting" style="display: none;">
 close
 </span>
 </span>

 </div>

 <div class="message">Your feedback is wanted. Help us shape a future Universe for Starfleet Commander by contributing your ideas <a href="http://forum.playstarfleet.com/index.php?topic=23349" target="_blank">here</a>.</div>

 <div class="clear"></div>
 </div>



 </div>


 INCR/DECR TARGET COORDS

 <div class="target_planet">
 <span class="label">Target coordinates:</span>

 //TODO
 <a class="left_button" href="#" onclick="incrementWidget('galaxy', -1, 0, null); return false;"><img alt=">" src="/images/starfleet/layout/left_arrow.png?1439250916"></a>

 <input autocomplete="off" id="galaxy" name="galaxy" onclick="select_field('galaxy');" type="text" value="1">

 //TODO
 <a class="right_button" href="#" onclick="incrementWidget('galaxy', 1, 0, null); return false;"><img alt=">" src="/images/starfleet/layout/right_arrow.png?1439250916"></a>

 <input autocomplete="off" id="solar_system" name="solar_system" onclick="select_field('solar_system');" type="text" value="349">
 <input autocomplete="off" id="planet" name="planet" onclick="select_field('planet');" type="text" value="5">



 <select autocomplete="off" id="planet_type" name="planet_type"><option value="planet" selected="selected">Planet</option>
 <option value="moon">Moon</option></select>
 </div>

 */