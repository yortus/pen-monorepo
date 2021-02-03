const ast2 = {
  version: 300,
  start: {
    kind: "LetExpression",
    expression: {
      kind: "Identifier",
      module: null,
      member: null,
      name: "start_2",
    },
    bindings: {
      char: {
        kind: "Identifier",
        module: null,
        member: null,
        name: "char_2",
      },
      f64: {
        kind: "Identifier",
        module: null,
        member: null,
        name: "f64_2",
      },
      unicode: {
        kind: "Identifier",
        module: null,
        member: null,
        name: "unicode_2",
      },
      start_2: {
        kind: "SequenceExpression",
        expressions: [
          {
            kind: "Identifier",
            name: "WS",
            unique: true,
          },
          {
            kind: "Identifier",
            name: "Value",
            unique: true,
          },
          {
            kind: "Identifier",
            name: "WS",
            unique: true,
          },
        ],
      },
      Value: {
        kind: "SelectionExpression",
        expressions: [
          {
            kind: "Identifier",
            name: "False",
            unique: true,
          },
          {
            kind: "Identifier",
            name: "Null",
            unique: true,
          },
          {
            kind: "Identifier",
            name: "True",
            unique: true,
          },
          {
            kind: "Identifier",
            name: "Object",
            unique: true,
          },
          {
            kind: "Identifier",
            name: "Array",
            unique: true,
          },
          {
            kind: "Identifier",
            name: "Number",
            unique: true,
          },
          {
            kind: "Identifier",
            name: "String",
            unique: true,
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
            unique: true,
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
                    unique: true,
                  },
                  {
                    kind: "QuantifiedExpression",
                    expression: {
                      kind: "SequenceExpression",
                      expressions: [
                        {
                          kind: "Identifier",
                          name: "COMMA",
                          unique: true,
                        },
                        {
                          kind: "Identifier",
                          name: "Property",
                          unique: true,
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
            unique: true,
          },
        ],
      },
      Property: {
        kind: "FieldExpression",
        name: {
          kind: "Identifier",
          name: "String",
          unique: true,
        },
        value: {
          kind: "SequenceExpression",
          expressions: [
            {
              kind: "Identifier",
              name: "COLON",
              unique: true,
            },
            {
              kind: "Identifier",
              name: "Value",
              unique: true,
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
            unique: true,
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
                    unique: true,
                  },
                  {
                    kind: "QuantifiedExpression",
                    expression: {
                      kind: "SequenceExpression",
                      expressions: [
                        {
                          kind: "Identifier",
                          name: "COMMA",
                          unique: true,
                        },
                        {
                          kind: "Identifier",
                          name: "Element",
                          unique: true,
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
            unique: true,
          },
        ],
      },
      Element: {
        kind: "ListExpression",
        elements: [
          {
            kind: "Identifier",
            name: "Value",
            unique: true,
          },
        ],
      },
      Number: {
        kind: "Identifier",
        name: "f64",
        unique: true,
      },
      String: {
        kind: "SequenceExpression",
        expressions: [
          {
            kind: "Identifier",
            name: "DOUBLE_QUOTE",
            unique: true,
          },
          {
            kind: "QuantifiedExpression",
            expression: {
              kind: "Identifier",
              name: "CHAR",
              unique: true,
            },
            quantifier: "*",
          },
          {
            kind: "Identifier",
            name: "DOUBLE_QUOTE",
            unique: true,
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
                  unique: true,
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
                  unique: true,
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
            unique: true,
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
            unique: true,
          },
        ],
      },
      RBRACE: {
        kind: "SequenceExpression",
        expressions: [
          {
            kind: "Identifier",
            name: "WS",
            unique: true,
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
            unique: true,
          },
        ],
      },
      LBRACKET: {
        kind: "SequenceExpression",
        expressions: [
          {
            kind: "Identifier",
            name: "WS",
            unique: true,
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
            unique: true,
          },
        ],
      },
      RBRACKET: {
        kind: "SequenceExpression",
        expressions: [
          {
            kind: "Identifier",
            name: "WS",
            unique: true,
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
            unique: true,
          },
        ],
      },
      COLON: {
        kind: "SequenceExpression",
        expressions: [
          {
            kind: "Identifier",
            name: "WS",
            unique: true,
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
            unique: true,
          },
        ],
      },
      COMMA: {
        kind: "SequenceExpression",
        expressions: [
          {
            kind: "Identifier",
            name: "WS",
            unique: true,
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
            unique: true,
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
            name: "start_2",
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
      char_2: {
        kind: "Intrinsic",
        name: "char",
        path: "V:/projects/oss/pen-monorepo/packages/core/penc/dist/deps/std.pen.js",
      },
      f64_2: {
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
            name: "char_2",
          },
          f64: {
            kind: "Identifier",
            name: "f64_2",
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
      unicode_2: {
        kind: "Intrinsic",
        name: "unicode",
        path: "V:/projects/oss/pen-monorepo/packages/core/penc/dist/deps/experiments.pen.js",
      },
      "Ɱ_experiments": {
        kind: "Module",
        bindings: {
          unicode: {
            kind: "Identifier",
            name: "unicode_2",
          },
        },
      },
    },
  },
}
