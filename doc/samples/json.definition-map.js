const definitionMap = {
  definitionsById: {
    char: {
      kind: "Definition",
      definitionId: "char",
      moduleId: "Ɱ_json",
      localName: "char",
      value: {
        kind: "Reference",
        definitionId: "char2",
      },
    },
    f64: {
      kind: "Definition",
      definitionId: "f64",
      moduleId: "Ɱ_json",
      localName: "f64",
      value: {
        kind: "Reference",
        definitionId: "f642",
      },
    },
    unicode: {
      kind: "Definition",
      definitionId: "unicode",
      moduleId: "Ɱ_json",
      localName: "unicode",
      value: {
        kind: "Reference",
        definitionId: "unicode2",
      },
    },
    start: {
      kind: "Definition",
      definitionId: "start",
      moduleId: "Ɱ_json",
      localName: "start",
      value: {
        kind: "SequenceExpression",
        expressions: [
          {
            kind: "Reference",
            definitionId: "WS",
          },
          {
            kind: "Reference",
            definitionId: "Value",
          },
          {
            kind: "Reference",
            definitionId: "WS",
          },
        ],
      },
    },
    Value: {
      kind: "Definition",
      definitionId: "Value",
      moduleId: "Ɱ_json",
      localName: "Value",
      value: {
        kind: "SelectionExpression",
        expressions: [
          {
            kind: "Reference",
            definitionId: "False",
          },
          {
            kind: "Reference",
            definitionId: "Null",
          },
          {
            kind: "Reference",
            definitionId: "True",
          },
          {
            kind: "Reference",
            definitionId: "Object",
          },
          {
            kind: "Reference",
            definitionId: "Array",
          },
          {
            kind: "Reference",
            definitionId: "Number",
          },
          {
            kind: "Reference",
            definitionId: "String",
          },
        ],
      },
    },
    False: {
      kind: "Definition",
      definitionId: "False",
      moduleId: "Ɱ_json",
      localName: "False",
      value: {
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
    Null: {
      kind: "Definition",
      definitionId: "Null",
      moduleId: "Ɱ_json",
      localName: "Null",
      value: {
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
    True: {
      kind: "Definition",
      definitionId: "True",
      moduleId: "Ɱ_json",
      localName: "True",
      value: {
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
    Object: {
      kind: "Definition",
      definitionId: "Object",
      moduleId: "Ɱ_json",
      localName: "Object",
      value: {
        kind: "SequenceExpression",
        expressions: [
          {
            kind: "Reference",
            definitionId: "LBRACE",
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
                      kind: "Reference",
                      definitionId: "Property",
                    },
                    {
                      kind: "QuantifiedExpression",
                      expression: {
                        kind: "ParenthesisedExpression",
                        expression: {
                          kind: "SequenceExpression",
                          expressions: [
                            {
                              kind: "Reference",
                              definitionId: "COMMA",
                            },
                            {
                              kind: "Reference",
                              definitionId: "Property",
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
            kind: "Reference",
            definitionId: "RBRACE",
          },
        ],
      },
    },
    Property: {
      kind: "Definition",
      definitionId: "Property",
      moduleId: "Ɱ_json",
      localName: "Property",
      value: {
        kind: "FieldExpression",
        name: {
          kind: "Reference",
          definitionId: "String",
        },
        value: {
          kind: "SequenceExpression",
          expressions: [
            {
              kind: "Reference",
              definitionId: "COLON",
            },
            {
              kind: "Reference",
              definitionId: "Value",
            },
          ],
        },
      },
    },
    Array: {
      kind: "Definition",
      definitionId: "Array",
      moduleId: "Ɱ_json",
      localName: "Array",
      value: {
        kind: "SequenceExpression",
        expressions: [
          {
            kind: "Reference",
            definitionId: "LBRACKET",
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
                      kind: "Reference",
                      definitionId: "Element",
                    },
                    {
                      kind: "QuantifiedExpression",
                      expression: {
                        kind: "ParenthesisedExpression",
                        expression: {
                          kind: "SequenceExpression",
                          expressions: [
                            {
                              kind: "Reference",
                              definitionId: "COMMA",
                            },
                            {
                              kind: "Reference",
                              definitionId: "Element",
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
            kind: "Reference",
            definitionId: "RBRACKET",
          },
        ],
      },
    },
    Element: {
      kind: "Definition",
      definitionId: "Element",
      moduleId: "Ɱ_json",
      localName: "Element",
      value: {
        kind: "ListExpression",
        elements: [
          {
            kind: "Reference",
            definitionId: "Value",
          },
        ],
      },
    },
    Number: {
      kind: "Definition",
      definitionId: "Number",
      moduleId: "Ɱ_json",
      localName: "Number",
      value: {
        kind: "Reference",
        definitionId: "f64",
      },
    },
    String: {
      kind: "Definition",
      definitionId: "String",
      moduleId: "Ɱ_json",
      localName: "String",
      value: {
        kind: "SequenceExpression",
        expressions: [
          {
            kind: "Reference",
            definitionId: "DOUBLE_QUOTE",
          },
          {
            kind: "QuantifiedExpression",
            expression: {
              kind: "Reference",
              definitionId: "CHAR",
            },
            quantifier: "*",
          },
          {
            kind: "Reference",
            definitionId: "DOUBLE_QUOTE",
          },
        ],
      },
    },
    CHAR: {
      kind: "Definition",
      definitionId: "CHAR",
      moduleId: "Ɱ_json",
      localName: "CHAR",
      value: {
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
                  kind: "Reference",
                  definitionId: "char",
                },
                argument: {
                  kind: "Reference",
                  definitionId: "Ɱ_json_modexpr",
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
                  kind: "Reference",
                  definitionId: "unicode",
                },
                argument: {
                  kind: "Reference",
                  definitionId: "Ɱ_json_modexpr2",
                },
              },
            ],
          },
        ],
      },
    },
    LBRACE: {
      kind: "Definition",
      definitionId: "LBRACE",
      moduleId: "Ɱ_json",
      localName: "LBRACE",
      value: {
        kind: "SequenceExpression",
        expressions: [
          {
            kind: "Reference",
            definitionId: "WS",
          },
          {
            kind: "StringLiteral",
            value: "{",
            concrete: true,
            abstract: false,
          },
          {
            kind: "Reference",
            definitionId: "WS",
          },
        ],
      },
    },
    RBRACE: {
      kind: "Definition",
      definitionId: "RBRACE",
      moduleId: "Ɱ_json",
      localName: "RBRACE",
      value: {
        kind: "SequenceExpression",
        expressions: [
          {
            kind: "Reference",
            definitionId: "WS",
          },
          {
            kind: "StringLiteral",
            value: "}",
            concrete: true,
            abstract: false,
          },
          {
            kind: "Reference",
            definitionId: "WS",
          },
        ],
      },
    },
    LBRACKET: {
      kind: "Definition",
      definitionId: "LBRACKET",
      moduleId: "Ɱ_json",
      localName: "LBRACKET",
      value: {
        kind: "SequenceExpression",
        expressions: [
          {
            kind: "Reference",
            definitionId: "WS",
          },
          {
            kind: "StringLiteral",
            value: "[",
            concrete: true,
            abstract: false,
          },
          {
            kind: "Reference",
            definitionId: "WS",
          },
        ],
      },
    },
    RBRACKET: {
      kind: "Definition",
      definitionId: "RBRACKET",
      moduleId: "Ɱ_json",
      localName: "RBRACKET",
      value: {
        kind: "SequenceExpression",
        expressions: [
          {
            kind: "Reference",
            definitionId: "WS",
          },
          {
            kind: "StringLiteral",
            value: "]",
            concrete: true,
            abstract: false,
          },
          {
            kind: "Reference",
            definitionId: "WS",
          },
        ],
      },
    },
    COLON: {
      kind: "Definition",
      definitionId: "COLON",
      moduleId: "Ɱ_json",
      localName: "COLON",
      value: {
        kind: "SequenceExpression",
        expressions: [
          {
            kind: "Reference",
            definitionId: "WS",
          },
          {
            kind: "StringLiteral",
            value: ":",
            concrete: true,
            abstract: false,
          },
          {
            kind: "Reference",
            definitionId: "WS",
          },
        ],
      },
    },
    COMMA: {
      kind: "Definition",
      definitionId: "COMMA",
      moduleId: "Ɱ_json",
      localName: "COMMA",
      value: {
        kind: "SequenceExpression",
        expressions: [
          {
            kind: "Reference",
            definitionId: "WS",
          },
          {
            kind: "StringLiteral",
            value: ",",
            concrete: true,
            abstract: false,
          },
          {
            kind: "Reference",
            definitionId: "WS",
          },
        ],
      },
    },
    DOUBLE_QUOTE: {
      kind: "Definition",
      definitionId: "DOUBLE_QUOTE",
      moduleId: "Ɱ_json",
      localName: "DOUBLE_QUOTE",
      value: {
        kind: "StringLiteral",
        value: "\"",
        concrete: true,
        abstract: false,
      },
    },
    WS: {
      kind: "Definition",
      definitionId: "WS",
      moduleId: "Ɱ_json",
      localName: "WS",
      value: {
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
    "Ɱ_json": {
      kind: "Definition",
      definitionId: "Ɱ_json",
      moduleId: "Ɱ__root",
      localName: "Ɱ_json",
      value: {
        kind: "Module",
        bindings: {
          char: {
            kind: "Reference",
            definitionId: "char",
          },
          f64: {
            kind: "Reference",
            definitionId: "f64",
          },
          unicode: {
            kind: "Reference",
            definitionId: "unicode",
          },
          start: {
            kind: "Reference",
            definitionId: "start",
          },
          Value: {
            kind: "Reference",
            definitionId: "Value",
          },
          False: {
            kind: "Reference",
            definitionId: "False",
          },
          Null: {
            kind: "Reference",
            definitionId: "Null",
          },
          True: {
            kind: "Reference",
            definitionId: "True",
          },
          Object: {
            kind: "Reference",
            definitionId: "Object",
          },
          Property: {
            kind: "Reference",
            definitionId: "Property",
          },
          Array: {
            kind: "Reference",
            definitionId: "Array",
          },
          Element: {
            kind: "Reference",
            definitionId: "Element",
          },
          Number: {
            kind: "Reference",
            definitionId: "Number",
          },
          String: {
            kind: "Reference",
            definitionId: "String",
          },
          CHAR: {
            kind: "Reference",
            definitionId: "CHAR",
          },
          LBRACE: {
            kind: "Reference",
            definitionId: "LBRACE",
          },
          RBRACE: {
            kind: "Reference",
            definitionId: "RBRACE",
          },
          LBRACKET: {
            kind: "Reference",
            definitionId: "LBRACKET",
          },
          RBRACKET: {
            kind: "Reference",
            definitionId: "RBRACKET",
          },
          COLON: {
            kind: "Reference",
            definitionId: "COLON",
          },
          COMMA: {
            kind: "Reference",
            definitionId: "COMMA",
          },
          DOUBLE_QUOTE: {
            kind: "Reference",
            definitionId: "DOUBLE_QUOTE",
          },
          WS: {
            kind: "Reference",
            definitionId: "WS",
          },
        },
      },
    },
    min: {
      kind: "Definition",
      definitionId: "min",
      moduleId: "Ɱ_json_modexpr",
      localName: "min",
      value: {
        kind: "StringLiteral",
        value: " ",
        concrete: false,
        abstract: false,
      },
    },
    max: {
      kind: "Definition",
      definitionId: "max",
      moduleId: "Ɱ_json_modexpr",
      localName: "max",
      value: {
        kind: "StringLiteral",
        value: "￿",
        concrete: false,
        abstract: false,
      },
    },
    "Ɱ_json_modexpr": {
      kind: "Definition",
      definitionId: "Ɱ_json_modexpr",
      moduleId: "Ɱ__root",
      localName: "Ɱ_json_modexpr",
      value: {
        kind: "Module",
        bindings: {
          min: {
            kind: "Reference",
            definitionId: "min",
          },
          max: {
            kind: "Reference",
            definitionId: "max",
          },
        },
      },
    },
    base: {
      kind: "Definition",
      definitionId: "base",
      moduleId: "Ɱ_json_modexpr2",
      localName: "base",
      value: {
        kind: "NumericLiteral",
        value: 16,
      },
    },
    minDigits: {
      kind: "Definition",
      definitionId: "minDigits",
      moduleId: "Ɱ_json_modexpr2",
      localName: "minDigits",
      value: {
        kind: "NumericLiteral",
        value: 4,
      },
    },
    maxDigits: {
      kind: "Definition",
      definitionId: "maxDigits",
      moduleId: "Ɱ_json_modexpr2",
      localName: "maxDigits",
      value: {
        kind: "NumericLiteral",
        value: 4,
      },
    },
    "Ɱ_json_modexpr2": {
      kind: "Definition",
      definitionId: "Ɱ_json_modexpr2",
      moduleId: "Ɱ__root",
      localName: "Ɱ_json_modexpr2",
      value: {
        kind: "Module",
        bindings: {
          base: {
            kind: "Reference",
            definitionId: "base",
          },
          minDigits: {
            kind: "Reference",
            definitionId: "minDigits",
          },
          maxDigits: {
            kind: "Reference",
            definitionId: "maxDigits",
          },
        },
      },
    },
    char2: {
      kind: "Definition",
      definitionId: "char2",
      moduleId: "Ɱ_std",
      localName: "char",
      value: {
        kind: "Intrinsic",
        name: "char",
        path: "V:/projects/oss/pen-monorepo/packages/core/penc/dist/deps/std.pen.js",
      },
    },
    f642: {
      kind: "Definition",
      definitionId: "f642",
      moduleId: "Ɱ_std",
      localName: "f64",
      value: {
        kind: "Intrinsic",
        name: "f64",
        path: "V:/projects/oss/pen-monorepo/packages/core/penc/dist/deps/std.pen.js",
      },
    },
    i32: {
      kind: "Definition",
      definitionId: "i32",
      moduleId: "Ɱ_std",
      localName: "i32",
      value: {
        kind: "Intrinsic",
        name: "i32",
        path: "V:/projects/oss/pen-monorepo/packages/core/penc/dist/deps/std.pen.js",
      },
    },
    memoise: {
      kind: "Definition",
      definitionId: "memoise",
      moduleId: "Ɱ_std",
      localName: "memoise",
      value: {
        kind: "Intrinsic",
        name: "memoise",
        path: "V:/projects/oss/pen-monorepo/packages/core/penc/dist/deps/std.pen.js",
      },
    },
    "Ɱ_std": {
      kind: "Definition",
      definitionId: "Ɱ_std",
      moduleId: "Ɱ__root",
      localName: "Ɱ_std",
      value: {
        kind: "Module",
        bindings: {
          char: {
            kind: "Reference",
            definitionId: "char2",
          },
          f64: {
            kind: "Reference",
            definitionId: "f642",
          },
          i32: {
            kind: "Reference",
            definitionId: "i32",
          },
          memoise: {
            kind: "Reference",
            definitionId: "memoise",
          },
        },
      },
    },
    unicode2: {
      kind: "Definition",
      definitionId: "unicode2",
      moduleId: "Ɱ_experiments",
      localName: "unicode",
      value: {
        kind: "Intrinsic",
        name: "unicode",
        path: "V:/projects/oss/pen-monorepo/packages/core/penc/dist/deps/experiments.pen.js",
      },
    },
    "Ɱ_experiments": {
      kind: "Definition",
      definitionId: "Ɱ_experiments",
      moduleId: "Ɱ__root",
      localName: "Ɱ_experiments",
      value: {
        kind: "Module",
        bindings: {
          unicode: {
            kind: "Reference",
            definitionId: "unicode2",
          },
        },
      },
    },
  },
  startDefinitionId: "start",
}
