const cheerio = require('cheerio');
const beautify = require('js-beautify').js_beautify;

//Tags that probably won't contain source code
const forbiddenTags = ['script', 'address', 'canvas', 'dd', 'dl', 'fieldset', 'figcaption', 'figure', 'footer', 'form', 'header', 'hgroup', 'hr', 'li', 'nav', 'noscript', 'ol', 'output', 'tfoot', 'ul', 'video', 'i', 'head'];

//Tags that probably don't signify a new line or new paragraph.
const sameLineTags = ['span', 'b', 'h1', 'h2', 'h3', 'h4', 'h5', 'h6'];

//Denotes the weight over which the text will be marked as source code, or an uncertain state.
const isDefinitelyCode = 0.5;
const isMaybeCode = 0.14;
const minimumCodeTagLength = 20;
// const blockStarters = ['{', '(', '[', '/*'];
// const blockEnders = ['}', ')', ']', '*/'];

const symbolWeights = { '{': 8, '}': 8, '[': 6, ']': 6, '(': 4, ')': 4, '=': 6, '.': 3, ',': 1, ';': 4, ':': 2, '>': 4, '<': 4, '\'': 3, '"': 2, '?': 1, '_': 5, '+': 6, '-': 3, '*': 5, '@': 0, '#': 3, '$': 2, '%': 2, '^': 5, '|': 4, '\\': 4, '/': 4 };

const patternWeights = { '===': 20, '=>': 17, '||': 14, '&&': 14, '(!': 16, ');': 12, '},': 13, '//': 12, 'function ': 10, 'const ': 12, 'let ': 9, 'var ': 17, 'break': 8, 'return ': 10, 'if': 4, 'for': 3, 'while': 3, 'switch': 3 };

const patterns = Object.keys(patternWeights);

function getPatternsWeight(text) {
	let cumulativeWeight = 0;

	for (let s of text) {
		cumulativeWeight += (symbolWeights[s] || 0);
	}

	return cumulativeWeight;
}

function getSymbolsWeight(text) {
	let cumulativeWeight = 0;

	for (let pattern of patterns) {
		let reg = new RegExp(regexEscape(pattern), 'g');
		cumulativeWeight += (text.match(reg) || []).length * patternWeights[pattern];
	}

	return cumulativeWeight;
}

function regexEscape(str) {
	return str.replace(/[-\/\\^$*+?.()|[\]{}]/g, '\\$&');
}

function isInArray(arr, elem) {
	return arr.indexOf(elem) >= 0;
}

//TODO: Add camel-case check, detect comments, treat stuff as blocks (especially when a bracket, parentheses or comment block starts and I know until it finishes it will be code.)

//TODO: Put sequence numbering to each element, regardless in which array it falls back.

// function isLineBlockStarter(textLine){
//
// }

//TODO: Refactor so some sort of enum is used.
function isCode(text) {
	const symbolWeight = getSymbolsWeight(text),
		patternWeight = getPatternsWeight(text),
		totalWeight = symbolWeight + patternWeight,
		normalizedWeight = totalWeight / text.length;

	//console.log(`${text} ---> ${normalizedWeight}, ${totalWeight}, ${symbolWeight}, ${patternWeight} \n`);
	if (normalizedWeight > isDefinitelyCode) {
		return 'yes';
	} else if (normalizedWeight > isMaybeCode && normalizedWeight < isDefinitelyCode) {
		return 'maybe';
	}

	return 'no';
}

//TODO: Group elements by block instead of each line separately.
function extractTextInArray(text) {
	return text.split('\n');
}

function removeHtmlCodeIfExists(code){
	if(code.includes('<html>')){
		let startScriptIndex = code.indexOf('<script');
		let endScriptIndex = code.lastIndexOf('</script');

		if(startScriptIndex > -1 && endScriptIndex > -1){
			let scriptClosingTagIndex = code.indexOf('>', startScriptIndex);
			return code.slice(scriptClosingTagIndex + 1, endScriptIndex);
		}
	}

	return code;
}

//Extract source code and what may be source code to appropriate arrays from text.
function extractSourceCodeToArray(text, isAllCode) {
	let lines = extractTextInArray(text),
		wasPreviousCode = false,
		unformattedCodeArray = [],
		codeArray = [],
		textArray = [],
		uncertainCodeArray = [];

	for (let line of lines) {
		//If it contains characters other than whitespace.
		if (/\S/.test(line)) {
			let state = isCode(line);
			if (state === 'yes' || isAllCode) {
				//If previous line was code, it is probably the same code block.
				if (wasPreviousCode) {
					unformattedCodeArray[unformattedCodeArray.length - 1] = unformattedCodeArray[unformattedCodeArray.length - 1] + '\n ' + line;
				} else {
					unformattedCodeArray[unformattedCodeArray.length] = line;
				}
				wasPreviousCode = true;
			} else if (state === 'maybe') {
				uncertainCodeArray[uncertainCodeArray.length] = line;
				wasPreviousCode = false;
			} else {
				textArray[textArray.length] = line;
				wasPreviousCode = false;
			}
		}
	}

	unformattedCodeArray.forEach((elem) => {
		let formattedElem;
		formattedElem = removeHtmlCodeIfExists(elem);
		//formattedElem = beautify(formattedElem);
		codeArray.push(formattedElem);
	});

	return { codeArray, uncertainCodeArray, textArray };
}

//Remove all tags that probably won't contain any source code or text related to source code.
function cleanupHtml($, rootSelector, additionalTagsToRemove) {
	let allTagsToRemove = [forbiddenTags, ...additionalTagsToRemove];
	$(rootSelector).children('*').each((index, elem) => {
		if (isInArray(allTagsToRemove, elem.name)){
			$(elem).remove();
		}
	});
}

//Remove the html tags, so only text and code remains.
function removeTagsFromHtml($, rootSelector) {
	let noTagsHtml = '';

	function traverseChildren(element) {
		let content = element.contents();

		if (content.length > 0) {
			content.each((index, elem) => {
				if (elem.nodeType === 3) {
					noTagsHtml += elem.data;
				} else if (elem.nodeType === 1) {
					traverseChildren($(elem));
				}
			});
		} else {
			noTagsHtml += $(element).text();
			if (!isInArray(sameLineTags, element.name)) {
				noTagsHtml += '\n ';
			}
		}
	}

	traverseChildren($(rootSelector));
	return noTagsHtml;
}

function mergeData(data){
	let mergedResults = {
		codeArray: [],
		uncertainCodeArray: [],
		textArray: []
	};

	data.forEach((elem) => {
		mergedResults.codeArray.push(...elem.codeArray);
		mergedResults.uncertainCodeArray.push(...elem.uncertainCodeArray);
		mergedResults.textArray.push(...elem.textArray);
	});
	return mergedResults;
}

//The entry point of the module that gets html and returns an array of code snippets that were found.
function handleHtmlPage(html, { selector = 'body', isAllCode = false, additionalTagsToRemove = [] } = {}) {
	let $ = cheerio.load(html);
	let results = [];
	let elemOfInterest = $(selector);
	//The root selector passed to the function doesn't exist on the page.
	if (elemOfInterest.length <= 0) {
		return { codeArray: [], uncertainCodeArray: [], textArray: [] };
	}

	elemOfInterest.each((index, elem) => {
		//Remove tags that are very short (probably just a variable reference in explanation text)
		if($(elem).text().length < minimumCodeTagLength){
			$(elem).remove();
			console.log($(elem).text() + ' was removed.');
		}
		else{
		//Remove tags that probably don't contain any code
			cleanupHtml($, elem, additionalTagsToRemove);
			//Remove tags and only leave content.
			let htmlText = removeTagsFromHtml($, elem);
			//Separate the content into code, text, and uncertain.
			results.push(extractSourceCodeToArray(htmlText, isAllCode));
		}
	});

	//Return the merged data for each selector on the page.
	return mergeData(results);
}

module.exports.handleHtmlPage = handleHtmlPage;
