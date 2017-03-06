const calculateRFeatures = require('./FeatureExtract/calculateRFeatures');

function formatFeatureDataForR(jsonData, dataFolderUri) {
	if (!Array.isArray(jsonData))
		jsonData = [jsonData];

	let totalExamples = 0;
	let escomplexFailedExamples = 0;
	let calculatedFeatureArray = jsonData.map((jsonObj) => {
		console.log(`Start formatting for R with ${jsonObj.examplesList.length} examples.`)
		totalExamples += jsonObj.examplesList.length;

		return {
			url: jsonObj.url,
			success: jsonObj.success,
			examplesList: jsonObj.examplesList
				.filter((example) => {
					let errorObj = calculateRFeatures.isValidCode(example.report);
					if (errorObj.isError) {
						console.log('The following code had a parsing error: ' + errorObj.source);
					}
					return !errorObj.isError;
				}).map((example, index) => {
					try {
						const escomplexReport = calculateRFeatures.getEscomplexReport(example.code),
							cyclomaticComplexity = calculateRFeatures.getCyclomaticComplexity(example.report.results),
							loc = calculateRFeatures.calculateLOC(example.report.results),
							commentRatio = calculateRFeatures.calculateCommentRatio(example.report.results),
							halstead = escomplexReport.aggregate.halstead,
							logicalLoc = escomplexReport.aggregate.sloc.logical,
							numOfChainings = calculateRFeatures.calculateNumOfFunctionChainings(example.report.results),
							numOfFunctionCalls = calculateRFeatures.calculateNumOfFunctionCalls(example.report.results),

							halsteadLength = halstead.volume / Math.log2(halstead.vocabulary);
						halsteadDifficulty = halstead.difficulty / halsteadLength,
							halsteadVolume = halstead.volume / halsteadLength,
							halsteadEffort = halstead.effort / halsteadLength,
							halsteadVocabulary = halstead.vocabulary / halsteadLength,
							halsteadBugs = halstead.bugs / halsteadLength,

							iregularLengthIdentifiers = calculateRFeatures.calculateNumOfIrregularLengthIdentifiers(example.report.results) / halsteadLength,
							externalReferences = calculateRFeatures.countExternalReferences(example.report.results) / halsteadLength,
							chainingDensity = numOfChainings / numOfFunctionCalls,
							cyclomaticDensity = cyclomaticComplexity / halsteadLength,

							stylisticIssues = calculateRFeatures.calculateNumOfStylisticIssues(example.report.results) / halsteadLength,
							bestPracticeIssues = calculateRFeatures.calculateNumOfBestPracticeIssues(example.report.results) / halsteadLength,
							variableIssues = calculateRFeatures.calculateNumOfVariableIssues(example.report.results) / halsteadLength,
							possibleErrorIssues = calculateRFeatures.calculateNumOfPossibleErrorIssues(example.report.results) / halsteadLength,

							eslintGenericIssues = stylisticIssues + bestPracticeIssues + variableIssues + possibleErrorIssues;
						return {
							id: jsonObj.url.slice(jsonObj.url.lastIndexOf('/') + 1) + index,
							loc,
							commentRatio,
							avgLineL: calculateRFeatures.calculateAverageLineLength(example.report.results),
							avgNameL: calculateRFeatures.calculateAverageNameLength(example.report.results),
							//avgWords: calculateRFeatures.calculateAverageWordsInDeclaration(example.report.results),
							irrIdL: isFinite(iregularLengthIdentifiers) ? iregularLengthIdentifiers : 0,
							externals: isFinite(externalReferences) ? externalReferences : 0,
							chainingD: isFinite(chainingDensity) ? chainingDensity : 0,
							cyclomaticD: isFinite(cyclomaticDensity) ? cyclomaticDensity : 0,
							hDifficulty: isFinite(halsteadDifficulty) ? halsteadDifficulty : 0,
							//hEffort: isFinite(halsteadEffort) ? halsteadEffort : 0,
							hVocabulary: isFinite(halsteadVocabulary) ? halsteadVocabulary : 0,
							eslintIssues: isFinite(eslintGenericIssues) ? eslintGenericIssues : 0,
						};

					} catch (err) {
						console.log("ESCOMPLEX ERROR!");
						console.log(example.code);
						escomplexFailedExamples += 1;
					}
				}),
		}
	});

	let mergedExampleList = []
	calculatedFeatureArray.forEach((elem) => {
		mergedExampleList = mergedExampleList.concat(elem.examplesList);
	});

	let withoutInvalidExamples = removeInvalidExamples(mergedExampleList);

	console.log(`Total examples for R: ${totalExamples}.`);
	console.log(`Finished formatting for R with ${mergedExampleList.length} examples.`);
	console.log(`escomplex failed examples: ${escomplexFailedExamples}`);
	console.log(`After removing invalid examples: ${withoutInvalidExamples.length}`);
	//console.log(`After removing outliers: ${withoutOutliers.length}`);
	let csvResult = saveJsonAsCsv(withoutInvalidExamples, dataFolderUri);
}

function removeInvalidExamples(exampleList) {
	return exampleList.filter((example) => {
		if (!example)
			return false;
		if (example.loc < 1)
			return false;
		if (example.avgLineL === example.avgNameL)
			return false;
		if (example.cyclomaticD === 0)
			return false;
		return true;
	});
}

function saveJsonAsCsv(jsonObj, dataFolderUri) {
	//If fields is not provided to json2csv, and data is empty, it will throw an error.
	const fields = ['id', 'loc', 'commentRatio', 'avgLineL', 'avgNameL', 'irrIdL', 'externals', 'chainingD', 'cyclomaticD', 'hDifficulty', 'hVocabulary', 'eslintIssues'];


	let result = json2csv({ data: jsonObj, fields });

	fs.writeFile(dataFolderUri + 'csvData.csv', result, (err) => {
		if (err) {
			console.log(`An error occured while saving csv data: ${err}`);
		}
	});
}

exports.formatFeatureDataForR = formatFeatureDataForR;
