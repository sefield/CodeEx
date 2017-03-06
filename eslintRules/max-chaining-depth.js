/**
 * @fileoverview Rule to enforce the maximum possible depth for chaining.
 * @author Stevche Radevski
 */

"use strict";

//------------------------------------------------------------------------------
// Rule Definition
//------------------------------------------------------------------------------

module.exports = {
    meta: {
        docs: {
            description: "Enforce a maximum depth for method chaining",
            category: "Best Practices",
            recommended: false
        },

        schema: [{
          type: "object",
          properties: {
              maxDepth: {
                  type: "integer",
                  minimum: 0,
                  maximum: 10
              }
          },
          additionalProperties: false
        }]
    },

    create(context) {
        const maxDepth = context.options[0].maxDepth === undefined ? 6 : context.options[0].maxDepth;
        const sourceCode = context.getSourceCode();

        /**
         * Gets the property text of a given MemberExpression node.
         * If the text is multiline, this returns only the first line.
         *
         * @param {ASTNode} node - A MemberExpression node to get.
         * @returns {string} The property text of the node.
         */
        function getPropertyText(node) {
            const prefix = node.computed ? "[" : ".";
            const lines = sourceCode.getText(node.property).split(/\r\n|\r|\n/g);
            const suffix = node.computed && lines.length === 1 ? "]" : "";

            return prefix + lines[0] + suffix;
        }

        return {
            "CallExpression:exit"(node) {
                if (!node.callee || node.callee.type !== "MemberExpression") {
                    return;
                }

                const callee = node.callee;
                let parent = callee.object;
                let depth = 1;

                while (parent && parent.callee) {
                    depth += 1;
                    parent = parent.callee.object;
                }

                if (depth > maxDepth) {
                    context.report({
                        node: callee.property,
                        loc: callee.property.loc.start,
                        message: `Chain has a depth of ${depth} method calls. The maximum allowed is ${maxDepth}`,
                        data: {
                            callee: getPropertyText(callee)
                        }
                    });
                }
            }
        };
    }
};
