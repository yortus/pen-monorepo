const moduleMap = {
  modulesById: {
    "Ɱ_json": {
      kind: "Module",
      bindings: {
        char: {
          kind: "MemberExpression",
          module: {
            kind: "Identifier",
            name: "Ɱ_std",
          },
          member: {
            kind: "Identifier",
            name: "char",
          },
        },
        f64: {
          kind: "MemberExpression",
          module: {
            kind: "Identifier",
            name: "Ɱ_std",
          },
          member: {
            kind: "Identifier",
            name: "f64",
          },
        },
        unicode: {
          kind: "MemberExpression",
          module: {
            kind: "Identifier",
            name: "Ɱ_experiments",
          },
          member: {
            kind: "Identifier",
            name: "unicode",
          },
        },
        start: {
          kind: "SequenceExpression",
          expressions: [
            {
              kind: "Identifier",
              name: "WS",
            },
            {
              kind: "Identifier",
              name: "Value",
            },
            {
              kind: "Identifier",
              name: "WS",
            },
          ],
        },
        Value: {
          kind: "SelectionExpression",
          expressions: [
            {
              kind: "Identifier",
              name: "False",
            },
            {
              kind: "Identifier",
              name: "Null",
            },
            {
              kind: "Identifier",
              name: "True",
            },
            {
              kind: "Identifier",
              name: "Object",
            },
            {
              kind: "Identifier",
              name: "Array",
            },
            {
              kind: "Identifier",
              name: "Number",
            },
            {
              kind: "Identifier",
              name: "String",
            },
          ],
        },
        False: {
          kind: "SequenceExpression",
          expressions: [
            {
              kind: "StringLiteral",
              value: "false",
              concrete: true,
              abstract: false,
            },
            {
              kind: "BooleanLiteral",
              value: false,
            },
          ],
        },
        Null: {
          kind: "SequenceExpression",
          expressions: [
            {
              kind: "StringLiteral",
              value: "null",
              concrete: true,
              abstract: false,
            },
            {
              kind: "NullLiteral",
              value: null,
            },
          ],
        },
        True: {
          kind: "SequenceExpression",
          expressions: [
            {
              kind: "StringLiteral",
              value: "true",
              concrete: true,
              abstract: false,
            },
            {
              kind: "BooleanLiteral",
              value: true,
            },
          ],
        },
        Object: {
          kind: "SequenceExpression",
          expressions: [
            {
              kind: "Identifier",
              name: "LBRACE",
            },
            {
              kind: "ParenthesisedExpression",
              expression: {
                kind: "SelectionExpression",
                expressions: [
                  {
                    kind: "SequenceExpression",
                    expressions: [
                      {
                        kind: "Identifier",
                        name: "Property",
                      },
                      {
                        kind: "QuantifiedExpression",
                        expression: {
                          kind: "ParenthesisedExpression",
                          expression: {
                            kind: "SequenceExpression",
                            expressions: [
                              {
                                kind: "Identifier",
                                name: "COMMA",
                              },
                              {
                                kind: "Identifier",
                                name: "Property",
                              },
                            ],
                          },
                        },
                        quantifier: "*",
                      },
                    ],
                  },
                  {
                    kind: "RecordExpression",
                    fields: [
                    ],
                  },
                ],
              },
            },
            {
              kind: "Identifier",
              name: "RBRACE",
            },
          ],
        },
        Property: {
          kind: "FieldExpression",
          name: {
            kind: "Identifier",
            name: "String",
          },
          value: {
            kind: "SequenceExpression",
            expressions: [
              {
                kind: "Identifier",
                name: "COLON",
              },
              {
                kind: "Identifier",
                name: "Value",
              },
            ],
          },
        },
        Array: {
          kind: "SequenceExpression",
          expressions: [
            {
              kind: "Identifier",
              name: "LBRACKET",
            },
            {
              kind: "ParenthesisedExpression",
              expression: {
                kind: "SelectionExpression",
                expressions: [
                  {
                    kind: "SequenceExpression",
                    expressions: [
                      {
                        kind: "Identifier",
                        name: "Element",
                      },
                      {
                        kind: "QuantifiedExpression",
                        expression: {
                          kind: "ParenthesisedExpression",
                          expression: {
                            kind: "SequenceExpression",
                            expressions: [
                              {
                                kind: "Identifier",
                                name: "COMMA",
                              },
                              {
                                kind: "Identifier",
                                name: "Element",
                              },
                            ],
                          },
                        },
                        quantifier: "*",
                      },
                    ],
                  },
                  {
                    kind: "ListExpression",
                    elements: [
                    ],
                  },
                ],
              },
            },
            {
              kind: "Identifier",
              name: "RBRACKET",
            },
          ],
        },
        Element: {
          kind: "ListExpression",
          elements: [
            {
              kind: "Identifier",
              name: "Value",
            },
          ],
        },
        Number: {
          kind: "Identifier",
          name: "f64",
        },
        String: {
          kind: "SequenceExpression",
          expressions: [
            {
              kind: "Identifier",
              name: "DOUBLE_QUOTE",
            },
            {
              kind: "QuantifiedExpression",
              expression: {
                kind: "Identifier",
                name: "CHAR",
              },
              quantifier: "*",
            },
            {
              kind: "Identifier",
              name: "DOUBLE_QUOTE",
            },
          ],
        },
        CHAR: {
          kind: "SelectionExpression",
          expressions: [
            {
              kind: "SequenceExpression",
              expressions: [
                {
                  kind: "NotExpression",
                  expression: {
                    kind: "StringLiteral",
                    value: "\\",
                    concrete: false,
                    abstract: false,
                  },
                },
                {
                  kind: "NotExpression",
                  expression: {
                    kind: "StringLiteral",
                    value: "\"",
                    concrete: false,
                    abstract: false,
                  },
                },
                {
                  kind: "ApplicationExpression",
                  lambda: {
                    kind: "Identifier",
                    name: "char",
                  },
                  argument: {
                    kind: "Identifier",
                    name: "Ɱ_json_modexpr",
                  },
                },
              ],
            },
            {
              kind: "SequenceExpression",
              expressions: [
                {
                  kind: "StringLiteral",
                  value: "\\\"",
                  concrete: true,
                  abstract: false,
                },
                {
                  kind: "StringLiteral",
                  value: "\"",
                  concrete: false,
                  abstract: true,
                },
              ],
            },
            {
              kind: "SequenceExpression",
              expressions: [
                {
                  kind: "StringLiteral",
                  value: "\\\\",
                  concrete: true,
                  abstract: false,
                },
                {
                  kind: "StringLiteral",
                  value: "\\",
                  concrete: false,
                  abstract: true,
                },
              ],
            },
            {
              kind: "SequenceExpression",
              expressions: [
                {
                  kind: "StringLiteral",
                  value: "\\/",
                  concrete: true,
                  abstract: false,
                },
                {
                  kind: "StringLiteral",
                  value: "/",
                  concrete: false,
                  abstract: true,
                },
              ],
            },
            {
              kind: "SequenceExpression",
              expressions: [
                {
                  kind: "StringLiteral",
                  value: "\\b",
                  concrete: true,
                  abstract: false,
                },
                {
                  kind: "StringLiteral",
                  value: "\b",
                  concrete: false,
                  abstract: true,
                },
              ],
            },
            {
              kind: "SequenceExpression",
              expressions: [
                {
                  kind: "StringLiteral",
                  value: "\\f",
                  concrete: true,
                  abstract: false,
                },
                {
                  kind: "StringLiteral",
                  value: "\f",
                  concrete: false,
                  abstract: true,
                },
              ],
            },
            {
              kind: "SequenceExpression",
              expressions: [
                {
                  kind: "StringLiteral",
                  value: "\\n",
                  concrete: true,
                  abstract: false,
                },
                {
                  kind: "StringLiteral",
                  value: "\n",
                  concrete: false,
                  abstract: true,
                },
              ],
            },
            {
              kind: "SequenceExpression",
              expressions: [
                {
                  kind: "StringLiteral",
                  value: "\\r",
                  concrete: true,
                  abstract: false,
                },
                {
                  kind: "StringLiteral",
                  value: "\r",
                  concrete: false,
                  abstract: true,
                },
              ],
            },
            {
              kind: "SequenceExpression",
              expressions: [
                {
                  kind: "StringLiteral",
                  value: "\\t",
                  concrete: true,
                  abstract: false,
                },
                {
                  kind: "StringLiteral",
                  value: "\t",
                  concrete: false,
                  abstract: true,
                },
              ],
            },
            {
              kind: "SequenceExpression",
              expressions: [
                {
                  kind: "StringLiteral",
                  value: "\\u",
                  concrete: true,
                  abstract: false,
                },
                {
                  kind: "ApplicationExpression",
                  lambda: {
                    kind: "Identifier",
                    name: "unicode",
                  },
                  argument: {
                    kind: "Identifier",
                    name: "Ɱ_json_modexpr2",
                  },
                },
              ],
            },
          ],
        },
        LBRACE: {
          kind: "SequenceExpression",
          expressions: [
            {
              kind: "Identifier",
              name: "WS",
            },
            {
              kind: "StringLiteral",
              value: "{",
              concrete: true,
              abstract: false,
            },
            {
              kind: "Identifier",
              name: "WS",
            },
          ],
        },
        RBRACE: {
          kind: "SequenceExpression",
          expressions: [
            {
              kind: "Identifier",
              name: "WS",
            },
            {
              kind: "StringLiteral",
              value: "}",
              concrete: true,
              abstract: false,
            },
            {
              kind: "Identifier",
              name: "WS",
            },
          ],
        },
        LBRACKET: {
          kind: "SequenceExpression",
          expressions: [
            {
              kind: "Identifier",
              name: "WS",
            },
            {
              kind: "StringLiteral",
              value: "[",
              concrete: true,
              abstract: false,
            },
            {
              kind: "Identifier",
              name: "WS",
            },
          ],
        },
        RBRACKET: {
          kind: "SequenceExpression",
          expressions: [
            {
              kind: "Identifier",
              name: "WS",
            },
            {
              kind: "StringLiteral",
              value: "]",
              concrete: true,
              abstract: false,
            },
            {
              kind: "Identifier",
              name: "WS",
            },
          ],
        },
        COLON: {
          kind: "SequenceExpression",
          expressions: [
            {
              kind: "Identifier",
              name: "WS",
            },
            {
              kind: "StringLiteral",
              value: ":",
              concrete: true,
              abstract: false,
            },
            {
              kind: "Identifier",
              name: "WS",
            },
          ],
        },
        COMMA: {
          kind: "SequenceExpression",
          expressions: [
            {
              kind: "Identifier",
              name: "WS",
            },
            {
              kind: "StringLiteral",
              value: ",",
              concrete: true,
              abstract: false,
            },
            {
              kind: "Identifier",
              name: "WS",
            },
          ],
        },
        DOUBLE_QUOTE: {
          kind: "StringLiteral",
          value: "\"",
          concrete: true,
          abstract: false,
        },
        WS: {
          kind: "QuantifiedExpression",
          expression: {
            kind: "ParenthesisedExpression",
            expression: {
              kind: "SelectionExpression",
              expressions: [
                {
                  kind: "StringLiteral",
                  value: " ",
                  concrete: true,
                  abstract: false,
                },
                {
                  kind: "StringLiteral",
                  value: "\t",
                  concrete: true,
                  abstract: false,
                },
                {
                  kind: "StringLiteral",
                  value: "\n",
                  concrete: true,
                  abstract: false,
                },
                {
                  kind: "StringLiteral",
                  value: "\r",
                  concrete: true,
                  abstract: false,
                },
              ],
            },
          },
          quantifier: "*",
        },
      },
    },
    "Ɱ_json_modexpr": {
      kind: "Module",
      bindings: {
        min: {
          kind: "StringLiteral",
          value: " ",
          concrete: false,
          abstract: false,
        },
        max: {
          kind: "StringLiteral",
          value: "￿",
          concrete: false,
          abstract: false,
        },
      },
    },
    "Ɱ_json_modexpr2": {
      kind: "Module",
      bindings: {
        base: {
          kind: "NumericLiteral",
          value: 16,
        },
        minDigits: {
          kind: "NumericLiteral",
          value: 4,
        },
        maxDigits: {
          kind: "NumericLiteral",
          value: 4,
        },
      },
    },
    "Ɱ_std": {
      kind: "Module",
      bindings: {
        char: {
          kind: "Intrinsic",
          name: "char",
          path: "V:/projects/oss/pen-monorepo/packages/core/penc/dist/deps/std.pen.js",
        },
        f64: {
          kind: "Intrinsic",
          name: "f64",
          path: "V:/projects/oss/pen-monorepo/packages/core/penc/dist/deps/std.pen.js",
        },
        i32: {
          kind: "Intrinsic",
          name: "i32",
          path: "V:/projects/oss/pen-monorepo/packages/core/penc/dist/deps/std.pen.js",
        },
        memoise: {
          kind: "Intrinsic",
          name: "memoise",
          path: "V:/projects/oss/pen-monorepo/packages/core/penc/dist/deps/std.pen.js",
        },
      },
    },
    "Ɱ_experiments": {
      kind: "Module",
      bindings: {
        unicode: {
          kind: "Intrinsic",
          name: "unicode",
          path: "V:/projects/oss/pen-monorepo/packages/core/penc/dist/deps/experiments.pen.js",
        },
      },
    },
  },
  parentModuleIdsByModuleId: {
    "Ɱ_json_modexpr": "Ɱ_json",
    "Ɱ_json_modexpr2": "Ɱ_json",
  },
  startModuleId: "Ɱ_json",
}
