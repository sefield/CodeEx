const request = require('request'),
	htmlParser = require('./htmlParser');

function getExamples(urlList, additionalParams, allExtractedCallback) {
	let examplesList = [];
	urlList.forEach(url => request(url, (err, response, html) => {
		console.log(`${url} request executed.`);
		let curPage = {
			isSuccess: false,
		};

		//If the request is successful
		if (!err && response.statusCode === 200) {

			//This is where the html is separated in the appropriate arrays.
			const handledHtml = htmlParser.handleHtmlPage(html, additionalParams);

			curPage.url = response.request.uri.href;
			curPage.isSuccess = handledHtml !== undefined;
			curPage.codeArray = handledHtml.codeArray;
			curPage.uncertainCodeArray = handledHtml.uncertainCodeArray;
			curPage.textArray = handledHtml.textArray;

			console.log(`${curPage.url} is successful.`);
		}
		examplesList.push(curPage);
		if(examplesList.length === urlList.length){
			allExtractedCallback(examplesList);
		}
	}));
}

module.exports.getExamples = getExamples;
