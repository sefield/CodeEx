// const eslint = require('eslint');
// const cliEngine = eslint.CLIEngine;
const cliEngine = require('../../eslint/lib/cli-engine'); //Has to use a local version of eslint, as there are custom rules not available in eslint.

const minimumExampleCodeLength = 15;

function getEslintReport(code){
	const cli = new cliEngine({useEslintrc: false, configFile: `/Users/sradevski/Documents/My Programming Projects/JSQ/FeatureExtract/featureList.yml`});
	let report = cli.executeOnText(code);

	return report;
}

function isValidExampleCode(code) {
	if(code.length < minimumExampleCodeLength)
		return false;

	return true;
}

function extractFeatures(examplesList){
	let results = [];
	for( let numOfPage = 0 ; numOfPage < examplesList.length; numOfPage++ ){
		let codeReportsForPage = {
			url: examplesList[numOfPage].url,
			success: examplesList[numOfPage].isSuccess,
			examplesList: [],
		};
		if(examplesList[numOfPage].isSuccess){
			for(let numOfExample = 0; numOfExample < examplesList[numOfPage].codeArray.length; numOfExample++){
				let code = String(examplesList[numOfPage].codeArray[numOfExample]);
				if(isValidExampleCode(code)){
					let report = getEslintReport(code);
					//console.log(report);
					codeReportsForPage.examplesList.push({
						code,
						report
					});
				}
			}
		}

		results.push(codeReportsForPage);
	}

	return results;
}

module.exports.extractFeatures = extractFeatures;
