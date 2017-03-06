const cheerio = require('cheerio'),
	request = require('request');


/*
example crawlerParams object:
const crawlerParams = {
	baseUrl: 'http://stackoverflow.com/', //the base url for the website trying to mine.
	startPageUrl: 'documentation/javascript/topics?page=1&tab=popular', //the page to start crawling from.
	nextPageId: '.page-numbers.next', //The html Identifier (css selector) for the button to take you to the next page of links.
	dataPageId: '.doc-topic-link' //The html identifier (css selector) for each link you want to mine on each page (like each topic on stackoverflow documentation).
};
*/

function startCrawler(crawlerParams, minedAllUrlsCallback){
	let urlList = [];
	recursiveCrawling(crawlerParams.startPageUrl);

	function recursiveCrawling(currPage){
		let pageToMine = crawlerParams.baseUrl + currPage;
		console.log(`Next page to mine is: ${pageToMine}\n`);

		request(pageToMine, (err, response, html) => {
			if (!err && response.statusCode === 200) {
				let $ = cheerio.load(html);
				let nextPageLink = $(crawlerParams.nextPageId).parent().attr('href');

				$(crawlerParams.dataPageId).each((index, elem) => {
					urlList.push(crawlerParams.baseUrl + $(elem).attr('href'));
				});

				if(nextPageLink === undefined || nextPageLink.length <= 0){
					console.log(`Mined ${urlList.length} urls in total.\n`);
					minedAllUrlsCallback(urlList);
				}
				else{
					recursiveCrawling(nextPageLink);
				}
			}
			else{
				console.log(`problem occured in mining this page: ${pageToMine}`);
			}
		});
	}
}

exports.startCrawler = startCrawler;
