/**
 * @fileoverview Rule to enforce the maximum function calls within a function.
 * @author Stevche Radevski
 */

"use strict";

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

module.exports = {
    meta: {
        docs: {
            description: "Enforce the maximum function calls within a function",
            category: "Best Practices",
            recommended: false
        },

        schema: [{
          type: "object",
          properties: {
              maxCalls: {
                  type: "integer",
                  minimum: 0,
                  maximum: 1000
              }
          },
          additionalProperties: false
        }]
    },

    create(context) {
        const maxCalls = context.options[0].maxCalls === undefined ? 6 : context.options[0].maxCalls;
        const sourceCode = context.getSourceCode();
        let calls = 0;

        return {
            CallExpression(node) {
              calls += 1;
            },
            "Program:exit"(node){
              if (calls > maxCalls) {
                context.report({
                  node: node,
                  loc: node.loc.start,
                  message: `Chain has ${calls} method calls. The maximum allowed is ${maxCalls}`,
                });
              }
            }
        };
    }
};
