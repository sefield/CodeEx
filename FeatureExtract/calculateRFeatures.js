const escomplex = require('escomplex');

const stylisticIssuesFeatures = ['array-bracket-spacing', 'block-spacing', 'brace-style', 'camelcase', 'comma-spacing', 'computed-property-spacing', 'key-spacing', 'new-cap', 'no-array-constructor', 'no-lonely-if', 'no-multiple-empty-lines'];

const bestPracticeFeatures = ['default-case', 'dot-notation', 'dot-location', 'eqeqeq', 'no-caller', 'no-eval', 'no-empty-function', 'no-lone-blocks', 'no-new-func', 'no-new-wrappers', 'no-redeclare', 'no-self-assign', 'no-self-compare', 'no-useless-escape', 'no-useless-return', 'no-with', 'no-return-assign'];

const variableFeatures = ['no-delete-var', 'no-use-before-define', 'no-unused-vars', 'no-undefined', 'no-undef-init'];

const possibleErrorFeatures = ['no-cond-assign', 'no-dupe-keys', 'no-empty', 'no-unreachable', 'no-extra-boolean-cast', 'no-irregular-whitespace', 'no-unsafe-finally', 'no-constant-condition', 'no-duplicate-case'];

function isValidCode(report){
  let errorObj = {isError: false, source: ''};
  //It is not source code, but just comments
  if(report.errorCount === 0 && report.warningCount === 0){
    errorObj.isError = true;
    errorObj.source = "The example was just comments";
  } else {
    resultsIterator(report.results, (message) => {
      if(!message.ruleId && message.fatal){
        errorObj.isError = true;
        errorObj.source = message.source;
      }
    });
  }

  return errorObj;
}

function calculateLOC(results){
  let loc = resultsAdditionReducer(results, (message) => {
    if(message.ruleId === 'max-lines')
      return parseInt(messageExtractor(message, 'lines long'));

    return 0;
  });

  return loc;
}

function calculateCommentRatio(results){
  let ratio = resultsAdditionReducer(results, (message) => {
    if(message.ruleId === 'max-comment-ratio'){
      return parseFloat(messageExtractor(message, 'ratio.'));
    }

    return 0;
  });

  return ratio;
}

function countExternalReferences(results){
  let referenceSet = new Set();
  resultsIterator(results, (message) => {
      if(message.ruleId === 'no-undef')
        referenceSet.add(messageExtractor(message, 'is not defined'));
    });

  return referenceSet.size;
}

//Lines containing only brackets/braces (when trimmed, smaller than 5 chars) will be ignored;
function calculateAverageLineLength(results){
  let codeContainingLineMinLength = 3;
  let codeContainingLOC = 0;
  let lineLengthSum = resultsAdditionReducer(results, (message) => {
    if(message.ruleId === 'max-len'){
      const trimmed = message.source.trim();
      if(trimmed.length > codeContainingLineMinLength){
        codeContainingLOC += 1;
        return trimmed.length;
      }
      return 0;
    }
    return 0;
  });

  let result = (lineLengthSum / codeContainingLOC) || 0
  return result.toFixed(3);
}

function calculateNumOfIrregularLengthIdentifiers(results){
  let numOfIrregularIdentifiers = resultsAdditionReducer(results, (message) => {
    if(message.ruleId === 'id-length')
      return 1;
    return 0;
  });

  return numOfIrregularIdentifiers;
}

function calculateNumOfStylisticIssues(results){
  return calculateCumulativeEslintIssues(results, stylisticIssuesFeatures);
}

function calculateNumOfBestPracticeIssues(results){
  return calculateCumulativeEslintIssues(results, bestPracticeFeatures);
}

function calculateNumOfVariableIssues(results){
  return calculateCumulativeEslintIssues(results, variableFeatures);
}

function calculateNumOfPossibleErrorIssues(results){
  return calculateCumulativeEslintIssues(results, possibleErrorFeatures);
}

function calculateNumOfFunctionChainings(results){
  let depthArray = [];
  resultsIterator(results, (message) => {
    if(message.ruleId === 'max-chaining-depth'){
      let curDepth = parseInt(messageExtractor(message, 'method calls'));
      let exprIndex = depthArray.findIndex((expr) => expr.source === message.source);
      if(exprIndex === -1){
        depthArray.push({source: message.source, depth: curDepth});
      } else {
        if(depthArray[exprIndex].depth < curDepth)
          depthArray[exprIndex].depth = curDepth;
      }
    }
  });

  const depthSum = depthArray.reduce((agr, elem) => {
    return agr + elem.depth;
  }, 0);

  return depthSum;
}

function calculateAverageWordsInDeclaration(results){
  let avgWords = resultsAdditionReducer(results, (message) => {
    if(message.ruleId === 'max-words-in-declaration')
      return parseFloat(messageExtractor(message, 'words long.'));

    return 0;
  });

  return avgWords;
}

function calculateAverageNameLength(results){
  let avgLength = resultsAdditionReducer(results, (message) => {
    if(message.ruleId === 'max-words-in-declaration')
      return parseFloat(messageExtractor(message, 'characters'));

    return 0;
  });

  return avgLength;
}

function calculateNumOfFunctionCalls(results){
  let numOfCalls = resultsAdditionReducer(results, (message) => {
    if(message.ruleId === 'max-function-calls')
      return parseFloat(messageExtractor(message, 'method calls'));

    return 0;
  });

  return numOfCalls;
}

//It returns the accumulative complexity for all functions defined in the example (including arrow functions and closures).
function getCyclomaticComplexity(results){
  let complexity = resultsAdditionReducer(results, (message) => {
    if(message.ruleId === 'complexity')
      return parseInt(messageExtractor(message, '.'));

    return 0;
  }) + 1; //Workaround to set it start from 1.

  return complexity;
}

function getEscomplexReport(sourceCode){
  return escomplex.analyse(sourceCode);
}

// ************* INTERMEDIATE HELPER FUNCTIONS *************
function calculateCumulativeEslintIssues(results, arrayToUse){
  let numOfIssues = resultsAdditionReducer(results, (message) => {
    if(arrayToUse.includes(message.ruleId))
      return 1;
    return 0;
  });

  return numOfIssues;
}

// ************* HELPER FUNCTIONS *************
function messageExtractor(message, followingText, startDelimiter = ' '){
  const endIndex = message.message.lastIndexOf(followingText);
  const startIndex = message.message.lastIndexOf(' ', endIndex - 2) + 1;
  return message.message.slice(startIndex, endIndex).trim();
}


function resultsIterator(results, callback){
  results.forEach((result) => result.messages.forEach((message) => callback(message)));
}

function resultsAdditionReducer(results, callback){
  return results.reduce((acc, curResult) => {
    return acc + curResult.messages.reduce((acc, curMessage) => {
      return acc + callback(curMessage)
    }, 0);
  }, 0);
}

module.exports.isValidCode = isValidCode;
module.exports.countExternalReferences = countExternalReferences;
module.exports.calculateLOC = calculateLOC;
module.exports.calculateCommentRatio = calculateCommentRatio;
module.exports.calculateAverageLineLength = calculateAverageLineLength;
module.exports.calculateNumOfIrregularLengthIdentifiers = calculateNumOfIrregularLengthIdentifiers;
module.exports.getCyclomaticComplexity = getCyclomaticComplexity;
module.exports.calculateNumOfStylisticIssues = calculateNumOfStylisticIssues;
module.exports.calculateNumOfBestPracticeIssues = calculateNumOfBestPracticeIssues;
module.exports.calculateNumOfVariableIssues = calculateNumOfVariableIssues;
module.exports.calculateNumOfPossibleErrorIssues = calculateNumOfPossibleErrorIssues;
module.exports.calculateNumOfFunctionChainings = calculateNumOfFunctionChainings;
module.exports.calculateAverageWordsInDeclaration = calculateAverageWordsInDeclaration;
module.exports.calculateAverageNameLength = calculateAverageNameLength;
module.exports.calculateNumOfFunctionCalls = calculateNumOfFunctionCalls;
module.exports.getEscomplexReport = getEscomplexReport;
