const ast2 = {
  module: {
    kind: "Module",
    bindings: {
      char: {
        kind: "Identifier",
        name: "char2",
      },
      f64: {
        kind: "Identifier",
        name: "f642",
      },
      unicode: {
        kind: "Identifier",
        name: "unicode2",
      },
      start2: {
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
                kind: "InstantiationExpression",
                generic: {
                  kind: "Identifier",
                  name: "char",
                },
                argument: {
                  kind: "Module",
                  bindings: {
                    min: {
                      kind: "Identifier",
                      name: "min",
                    },
                    max: {
                      kind: "Identifier",
                      name: "max",
                    },
                  },
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
                kind: "InstantiationExpression",
                generic: {
                  kind: "Identifier",
                  name: "unicode",
                },
                argument: {
                  kind: "Module",
                  bindings: {
                    base: {
                      kind: "Identifier",
                      name: "base",
                    },
                    minDigits: {
                      kind: "Identifier",
                      name: "minDigits",
                    },
                    maxDigits: {
                      kind: "Identifier",
                      name: "maxDigits",
                    },
                  },
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
        quantifier: "*",
      },
      "Ɱ_json": {
        kind: "Module",
        bindings: {
          char: {
            kind: "Identifier",
            name: "char",
          },
          f64: {
            kind: "Identifier",
            name: "f64",
          },
          unicode: {
            kind: "Identifier",
            name: "unicode",
          },
          start: {
            kind: "Identifier",
            name: "start2",
          },
          Value: {
            kind: "Identifier",
            name: "Value",
          },
          False: {
            kind: "Identifier",
            name: "False",
          },
          Null: {
            kind: "Identifier",
            name: "Null",
          },
          True: {
            kind: "Identifier",
            name: "True",
          },
          Object: {
            kind: "Identifier",
            name: "Object",
          },
          Property: {
            kind: "Identifier",
            name: "Property",
          },
          Array: {
            kind: "Identifier",
            name: "Array",
          },
          Element: {
            kind: "Identifier",
            name: "Element",
          },
          Number: {
            kind: "Identifier",
            name: "Number",
          },
          String: {
            kind: "Identifier",
            name: "String",
          },
          CHAR: {
            kind: "Identifier",
            name: "CHAR",
          },
          LBRACE: {
            kind: "Identifier",
            name: "LBRACE",
          },
          RBRACE: {
            kind: "Identifier",
            name: "RBRACE",
          },
          LBRACKET: {
            kind: "Identifier",
            name: "LBRACKET",
          },
          RBRACKET: {
            kind: "Identifier",
            name: "RBRACKET",
          },
          COLON: {
            kind: "Identifier",
            name: "COLON",
          },
          COMMA: {
            kind: "Identifier",
            name: "COMMA",
          },
          DOUBLE_QUOTE: {
            kind: "Identifier",
            name: "DOUBLE_QUOTE",
          },
          WS: {
            kind: "Identifier",
            name: "WS",
          },
        },
      },
      char2: {
        kind: "Intrinsic",
        name: "char",
        path: "V:/projects/oss/pen-monorepo/packages/core/penc/dist/deps/std.pen.js",
      },
      f642: {
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
      "Ɱ_std": {
        kind: "Module",
        bindings: {
          char: {
            kind: "Identifier",
            name: "char2",
          },
          f64: {
            kind: "Identifier",
            name: "f642",
          },
          i32: {
            kind: "Identifier",
            name: "i32",
          },
          memoise: {
            kind: "Identifier",
            name: "memoise",
          },
        },
      },
      unicode2: {
        kind: "Intrinsic",
        name: "unicode",
        path: "V:/projects/oss/pen-monorepo/packages/core/penc/dist/deps/experiments.pen.js",
      },
      "Ɱ_experiments": {
        kind: "Module",
        bindings: {
          unicode: {
            kind: "Identifier",
            name: "unicode2",
          },
        },
      },
      start3: {
        kind: "Identifier",
        name: "start2",
      },
      start: {
        kind: "Identifier",
        name: "start3",
      },
    },
  },
}
