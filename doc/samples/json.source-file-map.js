const sourceFileMap = {
  sourceFilesByPath: {
    "V:/projects/oss/pen-monorepo/packages/test-suite/fixtures/pen-src/json.pen": {
      kind: "SourceFile",
      path: "V:/projects/oss/pen-monorepo/packages/test-suite/fixtures/pen-src/json.pen",
      bindings: [
        {
          kind: "Binding",
          left: {
            kind: "ModulePattern",
            names: [
              {
                name: "char",
              },
              {
                name: "f64",
              },
            ],
          },
          right: {
            kind: "ImportExpression",
            moduleSpecifier: "std",
          },
        },
        {
          kind: "Binding",
          left: {
            kind: "ModulePattern",
            names: [
              {
                name: "unicode",
              },
            ],
          },
          right: {
            kind: "ImportExpression",
            moduleSpecifier: "experiments",
          },
        },
        {
          kind: "Binding",
          left: {
            kind: "Identifier",
            name: "start",
          },
          right: {
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
        },
        {
          kind: "Binding",
          left: {
            kind: "Identifier",
            name: "Value",
          },
          right: {
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
        },
        {
          kind: "Binding",
          left: {
            kind: "Identifier",
            name: "False",
          },
          right: {
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
        },
        {
          kind: "Binding",
          left: {
            kind: "Identifier",
            name: "Null",
          },
          right: {
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
        },
        {
          kind: "Binding",
          left: {
            kind: "Identifier",
            name: "True",
          },
          right: {
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
        },
        {
          kind: "Binding",
          left: {
            kind: "Identifier",
            name: "Object",
          },
          right: {
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
        },
        {
          kind: "Binding",
          left: {
            kind: "Identifier",
            name: "Property",
          },
          right: {
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
        },
        {
          kind: "Binding",
          left: {
            kind: "Identifier",
            name: "Array",
          },
          right: {
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
        },
        {
          kind: "Binding",
          left: {
            kind: "Identifier",
            name: "Element",
          },
          right: {
            kind: "ListExpression",
            elements: [
              {
                kind: "Identifier",
                name: "Value",
              },
            ],
          },
        },
        {
          kind: "Binding",
          left: {
            kind: "Identifier",
            name: "Number",
          },
          right: {
            kind: "Identifier",
            name: "f64",
          },
        },
        {
          kind: "Binding",
          left: {
            kind: "Identifier",
            name: "String",
          },
          right: {
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
        },
        {
          kind: "Binding",
          left: {
            kind: "Identifier",
            name: "CHAR",
          },
          right: {
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
                      kind: "ModuleExpression",
                      bindings: [
                        {
                          kind: "Binding",
                          left: {
                            kind: "Identifier",
                            name: "min",
                          },
                          right: {
                            kind: "StringLiteral",
                            value: " ",
                            concrete: false,
                            abstract: false,
                          },
                        },
                        {
                          kind: "Binding",
                          left: {
                            kind: "Identifier",
                            name: "max",
                          },
                          right: {
                            kind: "StringLiteral",
                            value: "￿",
                            concrete: false,
                            abstract: false,
                          },
                        },
                      ],
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
                      kind: "ModuleExpression",
                      bindings: [
                        {
                          kind: "Binding",
                          left: {
                            kind: "Identifier",
                            name: "base",
                          },
                          right: {
                            kind: "NumericLiteral",
                            value: 16,
                          },
                        },
                        {
                          kind: "Binding",
                          left: {
                            kind: "Identifier",
                            name: "minDigits",
                          },
                          right: {
                            kind: "NumericLiteral",
                            value: 4,
                          },
                        },
                        {
                          kind: "Binding",
                          left: {
                            kind: "Identifier",
                            name: "maxDigits",
                          },
                          right: {
                            kind: "NumericLiteral",
                            value: 4,
                          },
                        },
                      ],
                    },
                  },
                ],
              },
            ],
          },
        },
        {
          kind: "Binding",
          left: {
            kind: "Identifier",
            name: "LBRACE",
          },
          right: {
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
        },
        {
          kind: "Binding",
          left: {
            kind: "Identifier",
            name: "RBRACE",
          },
          right: {
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
        },
        {
          kind: "Binding",
          left: {
            kind: "Identifier",
            name: "LBRACKET",
          },
          right: {
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
        },
        {
          kind: "Binding",
          left: {
            kind: "Identifier",
            name: "RBRACKET",
          },
          right: {
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
        },
        {
          kind: "Binding",
          left: {
            kind: "Identifier",
            name: "COLON",
          },
          right: {
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
        },
        {
          kind: "Binding",
          left: {
            kind: "Identifier",
            name: "COMMA",
          },
          right: {
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
        },
        {
          kind: "Binding",
          left: {
            kind: "Identifier",
            name: "DOUBLE_QUOTE",
          },
          right: {
            kind: "StringLiteral",
            value: "\"",
            concrete: true,
            abstract: false,
          },
        },
        {
          kind: "Binding",
          left: {
            kind: "Identifier",
            name: "WS",
          },
          right: {
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
      ],
    },
    "V:/projects/oss/pen-monorepo/packages/core/penc/dist/deps/std.pen.js": {
      kind: "SourceFile",
      path: "V:/projects/oss/pen-monorepo/packages/core/penc/dist/deps/std.pen.js",
      bindings: [
        {
          kind: "Binding",
          left: {
            kind: "Identifier",
            name: "char",
          },
          right: {
            kind: "Intrinsic",
            name: "char",
            path: "V:/projects/oss/pen-monorepo/packages/core/penc/dist/deps/std.pen.js",
          },
        },
        {
          kind: "Binding",
          left: {
            kind: "Identifier",
            name: "f64",
          },
          right: {
            kind: "Intrinsic",
            name: "f64",
            path: "V:/projects/oss/pen-monorepo/packages/core/penc/dist/deps/std.pen.js",
          },
        },
        {
          kind: "Binding",
          left: {
            kind: "Identifier",
            name: "i32",
          },
          right: {
            kind: "Intrinsic",
            name: "i32",
            path: "V:/projects/oss/pen-monorepo/packages/core/penc/dist/deps/std.pen.js",
          },
        },
        {
          kind: "Binding",
          left: {
            kind: "Identifier",
            name: "memoise",
          },
          right: {
            kind: "Intrinsic",
            name: "memoise",
            path: "V:/projects/oss/pen-monorepo/packages/core/penc/dist/deps/std.pen.js",
          },
        },
      ],
    },
    "V:/projects/oss/pen-monorepo/packages/core/penc/dist/deps/experiments.pen.js": {
      kind: "SourceFile",
      path: "V:/projects/oss/pen-monorepo/packages/core/penc/dist/deps/experiments.pen.js",
      bindings: [
        {
          kind: "Binding",
          left: {
            kind: "Identifier",
            name: "unicode",
          },
          right: {
            kind: "Intrinsic",
            name: "unicode",
            path: "V:/projects/oss/pen-monorepo/packages/core/penc/dist/deps/experiments.pen.js",
          },
        },
      ],
    },
  },
  startPath: "V:/projects/oss/pen-monorepo/packages/test-suite/fixtures/pen-src/json.pen",
}
