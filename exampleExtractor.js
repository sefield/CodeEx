const codeExtractor = require('./CodeExtract/codeExtractor'),
crawler = require('./CodeMiner/crawler');

const extractorParams = {
	selector: '.examples code',
	additionalTagsToRemove: [],
	isAllCode: true
};

const crawlerParams = {
	baseUrl: 'http://stackoverflow.com/',
	startPageUrl: 'documentation/javascript/topics?page=1&tab=popular',
	nextPageId: '.page-numbers.next',
	dataPageId: '.doc-topic-link'
};

function extractExamples(callback){
  crawler.startCrawler(crawlerParams, urlList =>
    codeExtractor.getExamples(urlList, extractorParams, callback));
}

exports.extractExamples = extractExamples;
