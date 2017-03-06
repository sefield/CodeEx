/**
 * @fileoverview Rule to enforce the maximum ratio between source code lines and comments.
 * @author Stevche Radevski
 */

"use strict";

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

const lodash = require("lodash");
const astUtils = require("../ast-utils");

module.exports = {
    meta: {
        docs: {
            description: "Enforce the maximum ratio between comments and code",
            category: "Best Practices",
            recommended: false
        },

        schema: [{
          type: "object",
          properties: {
              maxRatio: {
                  type: "integer",
                  minimum: 0,
                  maximum: 10
              }
          },
          additionalProperties: false
        }]
    },

    create(context) {
        const maxRatio = context.options[0].maxRatio === undefined ? 0 : context.options[0].maxRatio;
        const sourceCode = context.getSourceCode();

        return {
            "Program:exit"() {
                let lines = sourceCode.lines.map((text, i) => ({ lineNumber: i + 1, text }));
                lines = lines.filter(l => l.text.trim() !== "").length; //Remove blank lines
                const comments = sourceCode.getAllComments().length;

                const commentToLineRatio = comments / lines;
                if (commentToLineRatio >= maxRatio) {
                    context.report({
                        loc: { line: 1, column: 0 },
                        message: "File must have at most {{maxRatio}} ratio. The file has {{commentToLineRatio}} ratio.",
                        data: {
                            maxRatio,
                            commentToLineRatio: commentToLineRatio,
                        }
                    });
                }
            }
        };
    }
};
