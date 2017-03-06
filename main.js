const extractFeatures = require('./FeatureExtract/extractFeatures'),
	dataFormatterForR = require('./dataFormatterForR'),
	exampleExtractor = require('./exampleExtractor');
	fs = require('fs'),
	_ = require('lodash'),
	json2csv = require('json2csv');

const dataFolderUri = '/Users/sradevski/Desktop/JSCode/';

function extractFeaturesFromExamples(examplesList, destinationFolder = dataFolderUri) {
	if (destinationFolder === dataFolderUri) {
		console.log(`${examplesList.length} pages mined`);
		saveMetadataToFile(examplesList, true, destinationFolder);
	}

	try {
		let examplesWithReport = extractFeatures.extractFeatures(examplesList);
		console.log(`There are ${examplesList.length} page reports generated`);
		saveMetadataToFile(examplesWithReport, false, destinationFolder);
	} catch (err) {
		console.log(err);
	}
}

function readExamplesFromFile(uri, callback) {
	fs.readFile(uri, 'utf8', function(err, data) {
		if (err) {
			throw err;
		}
		callback(JSON.parse(data), dataFolderUri);
	});
}

//Save file with the same name as the source.
function saveMetadataToFile(data, isRawExamples, destinationFolder) {
	if (isRawExamples) {
		fs.writeFile(destinationFolder + 'minedExamples.json', JSON.stringify(data), (err) => {
			if (err) {
				console.log(`An error occured when saving raw examples: ${err}`);
			}
		});
	} else {
		data.forEach((elem) => {
			console.log(elem.url);
			let fileName = elem.url.slice(elem.url.lastIndexOf('/') + 1);
			fs.writeFile(destinationFolder + 'examplesData/' + fileName + '.json', JSON.stringify(elem), (err) => {
				if (err) {
					console.log(`An error occured while saving reports: ${err}`);
				}
			});
		});

		fs.writeFile(destinationFolder + 'mergedLintedExamples.json', JSON.stringify(data), (err) => {
			if (err) {
				console.log(`An error occured while saving reports: ${err}`);
			}
		});
	}
}

function main(taskId, exampleUri) {
	if (taskId) {
		let uri = dataFolderUri;
		switch (taskId) {
			case 'formatDataForR':
				readExamplesFromFile(uri += exampleUri || 'mergedLintedExamples.json', dataFormatterForR.formatFeatureDataForR);
				break;
			case 'extractFeaturesFromExamples':
				readExamplesFromFile(uri += exampleUri || 'minedExamples.json', extractFeaturesFromExamples);
				break;
			case 'runFromScratch':
				exampleExtractor.extractExamples(extractFeaturesFromExamples);
				break;
			default:
				break;
		}
	}
}

//If called from console, get the file path parameter.
if (require.main === module) {
	main(process.argv[2], process.argv[3]);
} else {
	main();
}
