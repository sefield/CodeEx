/**
 * @fileoverview Rule to enforce the maximum average number of words in declarations
 * @author Stevche Radevski
 */

"use strict";

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

module.exports = {
	meta: {
		docs: {
			description: "Enforce a maximum average number of words in declarations",
			category: "Best Practices",
			recommended: false
		},

		schema: [{
			type: "object",
			properties: {
				maxWords: {
						type: "integer",
						minimum: 0,
						maximum: 10
				}
			},
			additionalProperties: false
		}]
	},

	create(context) {

		const maxWords = context.options[0].maxWords === undefined ? 6 : context.options[0].maxWords;
		const sourceCode = context.getSourceCode();
		const properties = "never";

		//--------------------------------------------------------------------------
		// Helpers
		//--------------------------------------------------------------------------

		// contains reported nodes to avoid reporting twice on destructuring with shorthand notation
		const reported = [];
		const ALLOWED_PARENT_TYPES = new Set(["CallExpression", "NewExpression"]);

		function isUnderscored(name) {
			// if there's an underscore, it might be A_CONSTANT, which is okay
			return name.indexOf("_") > -1 && name !== name.toUpperCase();
		}

		function report(node) {
			if (reported.indexOf(node.name) < 0) {
				reported.push(node.name);
				//context.report(node, "Identifier '{{name}}' is not in camel case.", { name: node.name });
			}
		}

		function wordsInName(name){
			if(isUnderscored(name)){
				return name.split('_').length;
			}
			//Separates camelCase to words and returns the num of words. It also handles iLoveHTML, Separator, and other cases.
			return name.replace(/([A-Z]+)/g, " $1").replace(/([A-Z][a-z])/g, "$1").split(' ').length;
		}
		//FunctionDeclaration, VariableDeclarator, ClassDeclaration, ModuleSpecifier, ImportSpecifier, ExportSpecifier
		return {
			Identifier(node) {
				//Leading and trailing underscores are commonly used to flag
				//private/protected identifiers, strip them
				const name = node.name.replace(/^_+|_+$/g, ""),
					effectiveParent = (node.parent.type === "MemberExpression") ? node.parent.parent : node.parent;

				// MemberExpressions get special rules
				if (node.parent.type === "MemberExpression") {
					return;

					// // Always report underscored object names
					// if (node.parent.object.type === "Identifier" && node.parent.object.name === node.name) {
					// 	report(node);
					//
					// // Report AssignmentExpressions only if they are the left side of the assignment
					// } else if (effectiveParent.type === "AssignmentExpression" && (effectiveParent.right.type !== "MemberExpression" || effectiveParent.left.type === "MemberExpression" && effectiveParent.left.property.name === node.name)) {
					// 	report(node);
					// }

				// Properties have their own rules
				} else if (node.parent.type === "Property") {
					return;
					// if (!ALLOWED_PARENT_TYPES.has(effectiveParent.type)) {
					// 	report(node);
					// }
				// Check if it's an import specifier
				} else if (["ImportSpecifier", "ImportNamespaceSpecifier", "ImportDefaultSpecifier"].indexOf(node.parent.type) >= 0) {
					// Report only if the local imported identifier is underscored
					if (node.parent.local && node.parent.local.name === node.name) {
						report(node);
					}

				// Report anything that is underscored that isn't a CallExpression
				} else if (!ALLOWED_PARENT_TYPES.has(effectiveParent.type)) {
					report(node);
				}
			},

			"Program:exit"() {
				let sumOfWords = reported.reduce((agr, elem) => {
					return agr + wordsInName(elem);
				}, 0);
				let averageWords = sumOfWords / reported.length;
				let averageLength = reported.reduce((agr, elem) => {
					return agr + elem.length
				}, 0) / reported.length;

				if(averageWords > maxWords){
					context.report({
							loc: { line: 1, column: 0 },
							message: "File must be have at most {{maxWords}} words on average. It's {{actual}} words long. The average name length is {{nameLength}} characters",
							data: {
									maxWords,
									actual: averageWords.toFixed(2),
									nameLength: averageLength.toFixed(2),
							}
					});
				}
			}
		};
	}
};
