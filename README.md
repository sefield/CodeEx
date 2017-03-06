# Code Example Analysis Tool

### Summary
The purpose of the tool was to extract source code examples from StackOverflow Documentation project, extract features from it, and do archetypal analysis to detect patterns in code examples. This project includes the extraction tool and the R code to do the archetypal analysis.

#### Setup:

- Download a local copy of eslint.
- Copy all the rules in the ./eslintRules folder to eslint/lib/rules folder.
- Change local eslint installation directory in FeatureExtract/extractFeatures cliEngine require.
- Change dataFolderUri in main.js to your own file.
- Change configFile uri in FeatureExtract/extractFeatures/getEslintReport to your own location.
- Setup the parameter objects in ./exampleExtractor.js file.

#### Running It:

Go to the project location in terminal, and run:
**node main.js** *{command}*

where command is one of the following:
*runFromScratch*
*extractFeaturesFromExamples*
*formatDataForR*


If you run the *runFromScratch command*, it will crawl the website, collect all url’s, extract all examples from the data source, and extract features from the examples. this will create 2 files, one containing just the example source code, the other one is with extracted features. After that you can run the *formatDataForR* command to generate a csv file to be used in the R script.
The *extractFeaturesFromExamples* command is when you have a file with example source code, and you want to extract the features for it.
