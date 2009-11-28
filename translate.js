/* Multi-Language Translation Script:
*
*  Automatically translates a webpage (containing text in more than one language) into any single language
*  requested by the user. Particularly useful for sites involving a lot of user-generated content (which
*  might have originally been written in different languages) - e.g. blogs, forums, or other community sites. 
*  Harnesses the Google AJAX Language API to perform translation and language detection.
*
*  Version: 0.2.1 [2009-11-15]
*  Author: Patrick Hathway, OdinLab, University of Reading.
*  For Documentation and Updates: See http://code.google.com/p/multi-language-translation/
*  Licence: MIT License - see http://opensource.org/licenses/mit-license.php for full terms. Also check 
*  the script Documentation for more information, and for details of one important consideration.
*
*  Some minor configuration is required for this script to work on your website. Follow the instructions
*  below, or see the Documentation for full details and examples...   */

/* 1. Specify the 'Base Language' for your website: */

var GL_baseLang = "en";

/* 2. Specify the IDs for all major regions (i.e. HTML elements) in your site that should have their 
*  contents translated. Note that an ID can only be used to identify a single element on a page (for 
*  elements which appear multiple times, use Class Names instead - see below). The script will translate
*  each element separately; any elements that cannot be found on a page will be ignored:   */

var GL_classIds = [
	["navigation"],
	["left_sidebar", ""],
	["right_sidebar", "fr", true],
	["footer"],
];

/* 3. Specify the Class Names of all major regions (i.e. HTML elements) in your site that should have their 
*  their contents translated. Multiple elements may appear on a page with the same class name; the script
*  will locate each occurrance (if present) and translate them separately:   */

var GL_classNames = [
	["entry_baselang"],
	["entry_french", "fr"],
	["entry", "", true],
	["quotes", "de", true],
];

/* The rest of the Script should not be modified; unless you want to alter the functionality!
*  ------------------------------------------------------------------------------------------ */

// Global variables:
var GL_srcContent;             // array containing all content on the page to be translated, split up into chunks
var GL_transContent;           // array containing all chunks which have been translated
var GL_chunksTotal = 0;        // total number of chunks to translate
var GL_curChunk;               // ID of current chunk being translated
var GL_curLang;                // current site language
var GL_errors;                 // array containing details of all errors that occur (if applicable)
var GL_errSrcTxt;              // array containing all source text that causes errors (if applicable)
var GL_miniTransItems = [];    // array containing element IDs/class names which contain minor items to translate

google.load("language", "1");  // load v1 of google ajax language api

// run when page loads
function initialise() {
	addTransMsgs();        // append elements (which will display translation status messages) to page
	buildChunkedContent(); // create a local 'cache' of chunked content to be translated
	getLangCookie();       // find out the current site language (if known)
	getLangs();            // display listbox containing all languages the site can be translated into

	// if the original languages should be shown, end function.
	if(GL_curLang == "orig") {
		return;
	}
	
	// otherwise, start the translation
	startTranslation();
}

// display listbox containing all languages the site can be translated into (so that one can be selected by user)
function getLangs() {
	// create listbox within script so that it won't appear if JavaScript is disabled
	document.getElementById("languagelist").innerHTML = '<select id="language" onchange="changeLang()"></select>' +
	'<div id="langattr"></div>';
	var langItems = document.getElementById("language").options;

	// add option to top of listbox allowing user to view the site in its original (i.e. un-translated) languages
	langItems.add(new Option("Original Languages", "orig", true));

	// loop through list of currently available languages and add each to listbox
	for (var lang in google.language.Languages) {
		// find out the 2 character Google language code
		var langCode = google.language.Languages[lang];
		// convert language string to title case
		var langString = lang.substr(0,1) + lang.substr(1).toLowerCase();
		// improve formatting of 'chinese_simplified' and 'chinese_traditional' language strings
		var tmpLang = langString.split("_");
		langString = tmpLang.join(" - ");

		// check that Google can translate content into the current language
		if ((google.language.isTranslatable(langCode)) && (langCode != "")) {
			// if so, add to listbox and translate, so native speakers of that language can find it
			langItems.add(new Option(langString, langCode));
			miniTranslate(langItems[(langItems.length-1)],langCode);
		}
	}

	document.getElementById("language").value = GL_curLang; // change listbox to display current site language
	google.language.getBranding("langattr");  // display Google attribution below listbox (as required by TOS)
}

// start the translation
function startTranslation() {
	// show the 'Translating...' block
	document.getElementById("translatemsg").innerHTML = 'Translating... <span id="perc">0%</span>';
	miniTranslate(document.getElementById("translatemsg")); // translate block into site language
	document.getElementById("translatemsg").style.display='block';
	
	// reset global variables
	GL_transContent = []; GL_curChunk = 0; GL_errors = []; GL_errSrcTxt = [];

	// send content to google to be translated...:

	// find out the ID of the destination language
	var curLangNo = document.getElementById("language").selectedIndex;
	var k = 0;

	// loop through all the chunks to be translated, send to google...
	for(var i in GL_srcContent) {
		// find out the source language for the current element to be translated
		var srcLang = GL_srcContent[i][GL_srcContent[i].length - 1];

		for(var j = 0; j < (GL_srcContent[i].length - 1); j++) {
			/* AJAX is used to return translated chunks, so they MAY be returned in any order.
		   	To solve, include current chunk id, destination language + separators at start of each
		   	string. This is a bit of a 'hack', so try to find a better solution! */
			var srcText = curLangNo + "<br />" + k + "<br />" + GL_srcContent[i][j];

			// send current chunk to google translate; when translated, call function translateChunk
			google.language.translate(srcText, srcLang, GL_curLang, translateChunk);
			k++;
		}
	}

	setTimeout("checkTransStatus()", 1000); // run function to check translation status after 1 second
}

// This runs after each chunk has been translated...
function translateChunk(result) {
	// handle translation errors gracefully by storing error details but allowing translation to continue
	if (result.error) {
		GL_errors[GL_errors.length] = result.error.message;
	}
	else {

	/* Translated chunks may be returned in any order, so we need a method to assemble the chunks
	   in the correct order:
	   * Start of each chunk has a destination language id and a chunk id followed by separators.
	   * Separator is a <br /> HTML tag, as these always appear to retain position after translation...
	   * The destination language id is used to ensure the translated text is now in the correct language.
	   * Each chunk is stored in the position of the 'GL_transContent' array corresponding to the current chunk id.
	   * The ids + separators should not be shown, and are discarded from the chunk when it's stored in array.
	*/
	
		// split into array based on separator, so we know the id & destination language of translated chunk
		var transChunk = result.translation.split("<br />");
		// [find out length of substring to chop off from start of chunk]
		var chunkSubStr = 12 + transChunk[0].length + transChunk[1].length;
		// remove whitespace from chunk id & destination language (a problem with some translations)
		transChunk[0] = transChunk[0].replace(/^\s+|\s+$/g,"");
		transChunk[1] = transChunk[1].replace(/^\s+|\s+$/g,"");

		/* If the translated chunk has a different destination language to the current site language, discard
		translation & end function. This may happen if user changes language whilst translation is in progress */
		if(transChunk[0] != document.getElementById("language").selectedIndex) {
			return;
		}

		// store translated chunk in array along with detected source language (if known)
		GL_transContent[transChunk[1]] = new Array(3);
		GL_transContent[transChunk[1]][0] = result.translation.substr(chunkSubStr);
		GL_transContent[transChunk[1]][1] = result.detectedSourceLanguage;
	}

	GL_curChunk++; // increment current chunk ID every time function is called

	// calculate and display percentage of translation completed, based on number of chunks remaining
	var perc = (GL_curChunk / GL_chunksTotal)*100;
	document.getElementById("perc").innerHTML = Math.round(perc) + "%";

	// when all chunks have been translated, run the 'endTranslation' function...
	if(GL_curChunk >= GL_chunksTotal) {
		endTranslation();
	}
}

/* runs once a second whilst translation is in progress, updating contents of all elements that have already
   been completely translated. Also shows 'timeout' messages if translation not completed within 30 seconds... */
function checkTransStatus() {
	// 'static' member variables to keep track of how many times function has run, as well as current language:
	if((typeof checkTransStatus.chkStatusCount == 'undefined') || (checkTransStatus.curTransLang != GL_curLang)) {
		// reset variables if not defined yet, or if site language has changed since last function call
        	checkTransStatus.chkStatusCount = 0;
		checkTransStatus.curTransLang = GL_curLang;
	}

	// if translation is now complete, end function.
	if(GL_curChunk >= GL_chunksTotal) {
		return;
	}
	
	checkTransStatus.chkStatusCount++; // increment Translation Status counter

	// Store the list of languages in case they are replaced during translation
	var langList = document.getElementById("languagelist").innerHTML;

	var curElement; var curTransChunk = 0; var curClass = 0;

	// loop through all element IDs (as specified at script top), searching for ones with completed translations
	for(var i in GL_classIds) {
		curElement = document.getElementById(GL_classIds[i][0]); // find out current element

		// if current element ID exists on the page, replace contents with translated chunks
		if(curElement != null) {
			// assemble and display translated chunks for current element
			curTransChunk = unpackTransChunks(curTransChunk,curClass,curElement,false);
			curClass++; // move to next element ID
		}
	}

	// Get all elements on the page, so that ones with the specified class names can be located
	var allElements = document.getElementsByTagName("*");
	// loop through all element class names (as specified at script top), searching for completed translations
	for(var i in GL_classNames) {
		// loop through all elements, so that any with the current class name can be identified
		for(var j = 0; j < allElements.length; j++) {
			if(allElements[j].className == GL_classNames[i][0]) {
				// assemble and display translated chunks for current element
				curTransChunk = unpackTransChunks(curTransChunk,curClass,allElements[j],false);
				curClass++; // move to next element Class Name
			}
		}
	}

	// if listbox containing all languages has been removed as a result of translation, display it again
	if(document.getElementById("languagelist").innerHTML == "") {
		document.getElementById("languagelist").innerHTML = langList;
		document.getElementById("language").value = GL_curLang; // change listbox to show current language
	}

	/* if translation still isn't complete after 30 seconds, update translation message. Note: there is no
	   need to halt the current translation completely, but we will allow user to restart it if desired! */
	if(checkTransStatus.chkStatusCount == 30) {
		// calculate and display percentage of translation completed, based on number of chunks remaining
		var perc = Math.round((GL_curChunk / GL_chunksTotal)*100) + "%";
		// update translation status message
		document.getElementById("translatemsg").innerHTML = 'Translating (Slowly!)... ' +
		'<span id="perc">' + perc + '</span> - <a href="javascript:refresh()">Retry</a>';
		miniTranslate(document.getElementById("translatemsg")); // translate block into site language
	}

	setTimeout("checkTransStatus()", 1000); // check translation status again after another second
}

// runs after all translations have been completed; displaying the results on screen in place of previous content
function endTranslation() {
	var curElement;
	var curTransChunk = 0; var curClass = 0;

	// loop through all element IDs (as specified at script top), replacing current contents with translations
	for(var i in GL_classIds) {
		curElement = document.getElementById(GL_classIds[i][0]); // find out current element

		// if current element ID exists on the page, replace contents with translated chunks
		if(curElement != null) {
			// assemble and display translated chunks for current element
			curTransChunk = unpackTransChunks(curTransChunk,curClass,curElement,true,GL_classIds[i]);
			curClass++; // move to next element ID
		}
	}

	// Get all elements on the page, so that ones with the specified class names can be located
	var allElements = document.getElementsByTagName("*");
	// loop through all element class names (as specified at script top), so contents can be replaced by translations
	for(var i in GL_classNames) {
		// loop through all elements, so that any with the current class name can be identified
		for(var j = 0; j < allElements.length; j++) {
			if(allElements[j].className == GL_classNames[i][0]) {
				// assemble and display translated chunks for current element
				curTransChunk = unpackTransChunks(curTransChunk,curClass,allElements[j],true,GL_classNames[i]);
				curClass++; // move to next element Class Name
			}
		}
	}

	// Perform translations of all content added by the script (e.g. language strings and error messages)
	transAddedText();

	// Re-create listbox containing all languages, in case it has been removed as a result of translation
	getLangs();

	// translate the 'Original Languages' listbox item to equivalent in current site language
	miniTranslate(document.getElementById("language").options[0],GL_curLang,"Original Languages");
	
	// if any errors occured during translation, display warning message at top of screen and end function 
	if(GL_errors.length != 0) {
		document.getElementById("translatemsg").innerHTML = GL_errors.length + ' Problems(s) Occurred During Translation: ' +
		'<a href="javascript:refresh()">Retry</a> - <a href="javascript:showErrDetails()">Details</a> - ' +
		'<a href="javascript:hideTransMsg()">Hide</a>';
		miniTranslate(document.getElementById("translatemsg")); // translate warning message into current site language
		return;
	}

	hideTransMsg(); // otherwise, hide 'Translating...' message
}

// assemble and display translated chunks for current element on page
function unpackTransChunks(curTransChunk,curClassNum,curElement,transComplete,curClass) {
	// 'static' member variable to keep track of how many times function has run
	if(typeof unpackTransChunks.curLinkId == 'undefined') {
		// reset curLinkId variable if not defined yet - it's used to identify the correct 'show source text' link
        	unpackTransChunks.curLinkId = 0;
	} unpackTransChunks.curLinkId++; var j = unpackTransChunks.curLinkId; // increment current link id, j is an alias

	var curContent = ""; // reset translated contents of current element
	var initTransChunk = curTransChunk; // store initial chunk id of current element

	// loop through all translated chunks, assembling all translated content for current element
	for(var i = 0; i < (GL_srcContent[curClassNum].length - 1); i++) {
		// if current chunk does not exist, translation is not complete or errors occurred
		if((GL_transContent[curTransChunk] == null) && (transComplete == false)) {
			break; // stop looping through chunks if full translation has not yet been completed
		} else if((GL_transContent[curTransChunk] == null) && (transComplete == true)) {
			// if full translation IS complete, show warning message and a link to show source text (in red)
			curContent += '<div style="color: red;" id="srctxt' + j + '">[<span class="transerrtxt">' +
			'<em style="text-transform: uppercase;">THIS SECTION COULD NOT BE TRANSLATED</em> - '+
			'<a id="srctxtlnk' + j + '" href="javascript:showSrcTxt(' + j + ',' + curClassNum + ',' + (i+1) + 
			')">View Source Text [+]</a></span><span id="srctxtbracket' + j + '">]</span></div>';
			GL_errSrcTxt[GL_errSrcTxt.length] = GL_srcContent[curClassNum][i]; // store affected source text
			unpackTransChunks.curLinkId++; j = unpackTransChunks.curLinkId; // increment current link id		
		} else {
			// otherwise append current translated chunk to translated content string
			curContent += GL_transContent[curTransChunk][0];
		}
		curTransChunk++; // move to next chunk
	}

	// if translation is complete, replace contents of current element with translated text
	if(transComplete == true) {
		curElement.innerHTML = curContent;
		// append a language string to bottom of current element if desired
		getLangString(curElement,curClass,initTransChunk,(GL_srcContent[curClassNum].length - 1),j,curClassNum);
	// otherwise, check if all translated chunks for current element were assembled
	} else if((i == (GL_srcContent[curClassNum].length - 1)) && (GL_transContent[initTransChunk][2] != true))	{			
		// if so (and current element translation is not yet marked as complete), replace contents with translation
		curElement.innerHTML = curContent;
		GL_transContent[initTransChunk][2] = true; // mark current element translation as complete
	}

	return curTransChunk; // return current chunk id to calling function
}

// If required, find and append a string containing the Source Language to the bottom of the specified element
function getLangString(curElement,curClass,curTransChunk,transChunksLen,j,curClassNum) {
	
	var detectedLang = "";

	// if the current element does not need a language string appended, end function
	if(curClass[2] != true) {
		return;
	}

	// if source language for current element has already been manually specified, set this as detected language
	if(curClass[1] != "") {
		detectedLang = curClass[1];
	}
	// otherwise find out language based on the detected source languages for translated chunks in current element 
	else {
		detectedLang = findDetectedLang(curTransChunk,transChunksLen);
	}

	// if detected language is same as site language, there is no need to display language string, so end function
	if(detectedLang == GL_curLang){
			return;
	}

	// convert the Google language code into a string containing the source language name.
	for(var l in google.language.Languages) {
		if(google.language.Languages[l] == detectedLang) {
			// convert language string into title case
			var srcLangString = l.substr(0,1) + l.substr(1).toLowerCase();
			break; // stop loop (don't need to continue searching for languages)
		}
	}
	// if language cannot be found in list of supported languages, set language to 'unknown'
	if(typeof srcLangString == "undefined") {
		srcLangString = "an unknown language";
	}

	// append language string to current element...
	curElement.innerHTML += '<div style="color: green;" id="srctxt' + j + '">[<span class="langstring" ' +
	'style="font-family: arial, sans-serif; font-size: 11px;"><em>Automatic translation from ' + srcLangString + 
	': ' +  google.language.getBranding().innerHTML + '</em> - <a id="srctxtlnk' + j + '" href="javascript:showSrcTxt(' + 
	j + ',' + curClassNum + ',0)">View Source Text [+]</a></span><span id="srctxtbracket' + j + '">]</span></div>';
}

// find out the most common detected language for all translated chunks in current element, to appear in language string
function findDetectedLang(curTransChunk,transChunksLen) {
	var chunkLangs = []; langCounter = 0;

	// loop through all translated chunks in current element
	for(var i = 0; i < transChunksLen; i++) {
		// bugfix: set detected language to 'undefined' if an error occurred during translation... 
		if(GL_transContent[curTransChunk] == null) {
			GL_transContent[curTransChunk] = new Array(2);
			GL_transContent[curTransChunk][1] = "undefined";	
		}
		// loop through array of detected languages to see if current chunk has an existing detected language
		for(var j = 0; j < chunkLangs.length; j++) {
			if(chunkLangs[j][0] == GL_transContent[curTransChunk][1]) {
				// if so, increment counter containing the total number of chunks with that language
				chunkLangs[j][1]++;
				break; // halt loop
			}
		}
		// if current chunk has a language not yet detected, add it to end of detected languages array
		if(j == chunkLangs.length) {
			chunkLangs[j] = new Array(2);
			chunkLangs[j][0] = GL_transContent[curTransChunk][1]; // name of detected language
			chunkLangs[j][1] = 1; // total number of chunks with that language
		}
		curTransChunk++; // move to next chunk
	}

	/* once array has been created containing all detected languages in current element, loop through it
	to find the most common detected language - language string should contain this */
	for(i in chunkLangs) {
		if(chunkLangs[i][1] > langCounter) {
			/* if current language was detected more times than all previous languages, store language
			and number of times detected - so that next language can be compared against this total */
			var detectedLang = chunkLangs[i][0];
			langCounter = chunkLangs[i][1];
		}		
	}
	
	return detectedLang; // return the most common detected language
}

// Auto-translate all text added previously by the script (including language strings and error messages)
function transAddedText() {
	var allElements = document.getElementsByTagName("*"); // get all elements on page, so relevant ones can be translated
	var foundElements = [];

	// loop through all elements to find any of class 'langstring' or 'transerrtxt' 
	for(var i=0;i<allElements.length;i++) {
		if((allElements[i].className == "langstring") || (allElements[i].className == "transerrtxt")) {
			foundElements[foundElements.length] = allElements[i];
		}
	}

	// translate all located elements (runs separately from above code to prevent infinite loop as items are translated)
	for(i in foundElements) {
		miniTranslate(foundElements[i]); // translate current element
	}
}

/* this function runs before any translation takes place, and creates a local 'cache' of all content to be translated (in chunks)
   - meaning the content can be submitted to Google more rapidly, and the resulting translations can then be sorted reliably */
function buildChunkedContent() {
	var curElement; GL_srcContent = []; var j = 0;

	/* loop through all applicable element IDs (as specified at script top), converting the contents of each into chunks,
	   and storing each chunk in an array */
	for(var i in GL_classIds) {
		curElement = document.getElementById(GL_classIds[i][0]); // find out current element
		// check that element actually exists on the page - if not, ignore it
		if(curElement != null) {
			GL_srcContent[j] = createChunks(curElement); // separate the content of current element into chunks
			GL_chunksTotal += GL_srcContent[j].length;   // store a running total of the number of chunks created

			// if a Source Language is not specified for current element, store Base Language in array instead
			if(GL_classIds[i].length == 1) {
				GL_srcContent[j][GL_srcContent[j].length] = GL_baseLang;
			} else {
				// otherwise store the specified language (or a blank string if this is to be auto-detected)
				GL_srcContent[j][GL_srcContent[j].length] = GL_classIds[i][1];
			}
			j++;
		}
	}

	// get all elements on page, so that the ones specified can be located
	var allElements = document.getElementsByTagName("*");
	// loop through all applicable element IDs (as specified at script top), converting into chunks and storing in array
	for(var i in GL_classNames) {
		// find all elements which have the current class name
		for(var k in allElements) { 
			if(allElements[k].className == GL_classNames[i][0]) {
				// separate the content of current element into chunks
				GL_srcContent[j] = createChunks(allElements[k]);
				// store a running total of the number of chunks created
				GL_chunksTotal += GL_srcContent[j].length;

				// if a Source Language is not specified for current element, store Base Language in array
				if(GL_classNames[i].length == 1) {
					GL_srcContent[j][GL_srcContent[j].length] = GL_baseLang;
				} else {
					// otherwise store specified language (or a blank string if auto-detected)
					GL_srcContent[j][GL_srcContent[j].length] = GL_classNames[i][1];
				}
				j++;
			}
		}
	}
}

/* Web browsers (and Google) limit the amount of text translated per request, so split contents of current element into chunks.
   The aim is to achieve this whilst maintaining the translation integrity */
function createChunks(srcContent) {	
	var chars = 1000; // number of characters to allow per chunk.

	/* We do NOT want the content inside any HTML tag to be split between chunks (as this could cause 
	rendering problems), so create 2 arrays storing tags and textual content of current div separately */
	var tags = srcContent.innerHTML.match(/<.*?>/g);
	var text = srcContent.innerHTML.split(/<.*?>/g);
	if(tags == null) {
		tags = new Array();} // handle content containing no tags

	var curchar = 0; var tagnum = 0; var textnum = 0; var contTotal = tags.length + text.length;
	// create an array containing content to be chunked, with tags + text separately re-assembled (in order)
	var content = new Array(contTotal);
	// loop through content of current div
	for(var i=0; i < contTotal; i++) {
		// if current position in content is the start of a tag char, add appropriate tag to content array
		if(srcContent.innerHTML.substr(curchar,1) == "<") {
			content[i] = tags[tagnum];
			curchar += tags[tagnum].length;
			tagnum++;
		// if it is a text string, add the corresponding text to the curent element in content array
		} else {
			content[i] = text[textnum];
			curchar += text[textnum].length;
			textnum++;
		}
	}

	// Create the chunks - don't split either tags or words (to ensure as high translation quality as possible)
	var chunks = []; var curChunk = 0;
	chunks[0]="";
	for (i = 0; i<contTotal; i++) {
		// if next content item (tag or textual) won't exceed length of current chunk, add it to chunk
		if((chunks[curChunk].length + content[i].length) < chars) {
			chunks[curChunk] += content[i];
		} else {
			// otherwise, proceed to next chunk.
			curChunk++;
			// add the entire content item to this chunk if possible (to ensure better translation)
			if(content[i].length < chars) {
				chunks[curChunk] = content[i];
			}
			else {
				// only split further in rare cases where text length exceeds maximum chunk size
				var curPos = 0;
				do {
					// retrieve the maximum amount of text that can fit in this chunk
					var subContent = content[i].substr(curPos,chars);
					// find out how many words are in this substring
					var words = subContent.split(" ");
					// chop off final word, so words aren't split up between chunks
					var lastWordPos = subContent.length - words[(words.length-1)].length;
					if(subContent.length < chars) { // [bugfix: prevent word cut-off on final iteration]
						lastWordPos = subContent.length}
					chunks[curChunk] = subContent.substr(0,lastWordPos); // store in chunk
					curChunk++; // remainder of text will go in next chunk
					curPos+=lastWordPos; // store current position in text, for further processing
				} while(subContent.length >= chars); // repeat until all this text has been chunked
				curChunk--; // because there may still be space in the current chunk!
			}
		}
	}		
	
	return chunks; // return chunked content to calling function...
}

// Append elements to page (will be used to display translation messages), and specify their css styles.
function addTransMsgs() {
	// add element to page which will contain translation messages
	var transCont = document.createElement("div");
	document.body.appendChild(transCont);
	
	// add element to container created above - this will display the translation messages
	var translateMsg = document.createElement("div");
	translateMsg.id = "translatemsg";
	transCont.appendChild(translateMsg);

	// define visual styles for translation messages displayed on screen
	translateMsg.style.backgroundColor = "silver";
	translateMsg.style.border = "3px green solid";
	translateMsg.style.padding = "5px";
	translateMsg.style.fontSize = "large";
	translateMsg.style.fontWeight = "bold";
	translateMsg.style.textAlign = "left";
	translateMsg.style.color = "black";

	// more translation message styles (these should not need editing!)
	translateMsg.style.left = "-50%";
	translateMsg.style.position = "relative";
	translateMsg.style.display = "none";
	
	// define the styles for the container element
	transCont.style.left = "50%";
	transCont.style.zIndex = "1000";
	if(!(/MSIE 6/i.test(navigator.userAgent))) {
		// styles for all browsers except IE6
		transCont.style.position = "fixed";
		transCont.style.top = "0px";
	}
	else {
		// styles for IE6
		transCont.style.position = "absolute";
		transCont.style.setExpression("top", "(i = document.documentElement.scrollTop ? document.documentElement.scrollTop : document.body.scrollTop) + 'px'");
	}
}

// Hide 'Translating...' message (or translation error message) - runs at end of translation, or if user dismisses error message
function hideTransMsg() {
	document.getElementById("translatemsg").innerHTML = "";
	document.getElementById("translatemsg").style.display='none';
}

// if the user clicks on the 'Details' link [after error(s) occurred], show details of all errors on screen
function showErrDetails() {
	// continue to show original error message (but remove 'Details' link)
	document.getElementById("translatemsg").innerHTML = '<span id="transerrmsg1">' + GL_errors.length + 
	' Problems(s) Occurred During Translation: ' + '<a href="javascript:refresh()">Retry</a> - ' +
	'<a href="javascript:hideTransMsg()">Hide</a>... <br /><em>Error(s) Reported:</em></span>' +
	'<ul style="margin: 0px; padding: 0px;" id="transerrlist"></ul>';

	// Loop through array containing details of all errors, and show them as a list on screen
	for(var i in GL_errors) {
		document.getElementById("transerrlist").innerHTML += '<li style="margin-left: 15px;">' + GL_errors[i] + '.</li> ';	
	}

	/* create a textarea - this will show the original source text of all affected sections (as HTML) to aid debugging
	   Note: because translations are returned using AJAX, the affected sections are not NECESSARILY in the same order as
	   the errors reported (though in many cases, they will be!) */
	document.getElementById("translatemsg").innerHTML += '<em id="transerrmsg2">Section(s) Affected:</em><br />' +
	'<textarea id="errsrctxt" rows="8" readonly="readonly" style="width: 99%; background-color: silver; border: 1px gray solid;">' +
	'</textarea>';

	// Loop through Source Text array, appending to textarea.
	for(var i = 0; i < GL_errSrcTxt.length; i++) {
		document.getElementById("errsrctxt").value += "Affected Section " + (i+1) + ":\n" + GL_errSrcTxt[i] + "\n\n";
	}

	// Translate the entire contents of the Translation Errors box (with the exception of the text inside the textarea)
	miniTranslate(document.getElementById("transerrmsg1")); miniTranslate(document.getElementById("transerrlist"));
	miniTranslate(document.getElementById("transerrmsg2"));
}

// function runs when the user clicks on a link to view the original source text for a translated element / chunk
function showSrcTxt(curLinkId,curClassNum,curChunkId) {
	// if the current chunk should be shown only, display chunk on screen
	if((curChunkId-1) != -1) {
		document.getElementById("srctxt"+curLinkId).innerHTML += 
		'<div id="srctxtcontent' + curLinkId + '">'+GL_srcContent[curClassNum][(curChunkId-1)]+']</div>';
	} else {
	// otherwise assemble all chunks for current element, and display on screen
		var srcTxt = "";
		for(var i = 0; i < (GL_srcContent[curClassNum].length - 1); i++) {
			srcTxt +=  GL_srcContent[curClassNum][i];
		}
		document.getElementById("srctxt"+curLinkId).innerHTML += 
		'<div id="srctxtcontent' + curLinkId + '">'+srcTxt+']</div>';
	}	

	// update Source Text link so that when clicked in future, the source text will be hidden instead...
	srcTxtLnk = document.getElementById("srctxtlnk"+curLinkId);
	srcTxtLnk.innerHTML = "Hide Source Text [-]";
	srcTxtLnk.href = 'javascript:hideSrcTxt(' + curLinkId + ',' + curClassNum + ',' + curChunkId + ')';
	miniTranslate(srcTxtLnk); // translate link text
	document.getElementById("srctxtbracket"+curLinkId).innerHTML = ""; // hide bracket after link
}

// function runs when the user clicks on a link to hide the original source text for a translated element / chunk
function hideSrcTxt(curLinkId,curClassNum,curChunkId) {
	// remove the element containing the original source text
	srcTxtContent = document.getElementById("srctxtcontent"+curLinkId);
	document.getElementById("srctxt"+curLinkId).removeChild(srcTxtContent);

	// update Source Text link so that when clicked in future, the source text will be shown instead...
	srcTxtLnk = document.getElementById("srctxtlnk"+curLinkId);
	srcTxtLnk.innerHTML = "View Source Text [+]";
	srcTxtLnk.href = 'javascript:showSrcTxt(' + curLinkId + ',' + curClassNum + ',' + curChunkId + ')';
	miniTranslate(srcTxtLnk); // translate link text
	document.getElementById("srctxtbracket"+curLinkId).innerHTML = "]"; // show bracket after link
}

// translate small non crucial items of text into current site language
function miniTranslate(item,destLang,srcText) {
	if(typeof destLang == "undefined") {
		var destLang = GL_curLang; // if the destLang argument was not specified, use the current site language
	}
	if(typeof srcText == "undefined") {
		var srcText = item.innerHTML; // if the srcText argument was not specified, use the current item contents
	}

	// create source text by adding current item ID to start of item text (ID will ensure correct item is translated)
	srcText = GL_miniTransItems.length + "<br />" + srcText;

	// store item to be translated in global array for access by callback function
	GL_miniTransItems[GL_miniTransItems.length]=item;

	google.language.translate(srcText, "en", destLang, function(result) {
        	if (!result.error) {
			// split into array based on separator, so we know the id of translated item
			var transChunk = result.translation.split("<br />");
			// [find out length of substring to chop off from start of item]
			var chunkSubStr = 6 + transChunk[0].length;
			// remove whitespace from item id (a problem with some translations)
			transChunk[0] = transChunk[0].replace(/^\s+|\s+$/g,"");

			// display english source text of translated item (with HTML stripped) if user hovers mouse over it
			var stripHTML = GL_miniTransItems[transChunk[0]].innerHTML.split(/<.*?>/g);
			GL_miniTransItems[transChunk[0]].title = "[" + stripHTML.join("") + "]";

			// translate specified item (stripping the item ID from start of text)
			GL_miniTransItems[transChunk[0]].innerHTML = result.translation.substr(chunkSubStr);
        	}
	});
}

// runs when the user changes the site language
function changeLang() {
	// get the new language requested
	GL_curLang = document.getElementById("language").value;

	// store the requested language in a cookie
	setLangCookie();
	
	// if the original site languages should be shown, refresh the page.
	if(GL_curLang == "orig") {
		refresh();
		return;
	}
	
	// otherwise, start the translation
	startTranslation();
}

// find out the value of the language cookie (if it exists)
function getLangCookie() {
	// retrieve a list of cookies for this page, split into array elements (separated by ; if multiple cookies)
	var getCurLang=document.cookie.split(";");
	// loop through all array elements (i.e. cookies) until one with name 'lang' is found.
	for(var i=0; i < getCurLang.length; i++) {

		// remove whitespace from cookies (a problem if there are multiple cookies)
		var lngCookie = getCurLang[i].replace(/^\s+|\s+$/g,"");

		if(lngCookie.indexOf("lang=") == 0) {
			// find out value of lang
			GL_curLang = lngCookie.substring(5);
		}
	}
	
	// set language to the original site languages if cookie doesn't exist 
	if(typeof GL_curLang == "undefined") {
		GL_curLang = "orig";
	}

	setLangCookie(); // set / renew cookie (to store new expiry date)
}

// create a cookie to store the current site language
function setLangCookie() {
	// expire previous cookie (if it exists)
	document.cookie = "lang=; expires=-1; path=/";

	// cookie will expire after 90 days.
	var expdate = new Date();
	expdate.setTime(expdate.getTime()+7776000000);

	// create the cookie
	document.cookie = "lang=" + GL_curLang + "; expires=" + expdate.toGMTString() + "; path=/";
}

// refresh the current page [runs if the Original Languages option was selected, or if requested by user after error(s)]
function refresh() {
	hideTransMsg();
	window.location.reload(true);
}

// run the 'initialise' function once the page has loaded.
google.setOnLoadCallback(initialise);