const definitionMap = {
  definitionsById: {
    char: {
      kind: "Definition",
      definitionId: "char",
      moduleId: "@json",
      localName: "char",
      value: {
        kind: "Reference",
        definitionId: "char2",
      },
    },
    f64: {
      kind: "Definition",
      definitionId: "f64",
      moduleId: "@json",
      localName: "f64",
      value: {
        kind: "Reference",
        definitionId: "f642",
      },
    },
    unicode: {
      kind: "Definition",
      definitionId: "unicode",
      moduleId: "@json",
      localName: "unicode",
      value: {
        kind: "Reference",
        definitionId: "unicode2",
      },
    },
    start: {
      kind: "Definition",
      definitionId: "start",
      moduleId: "@json",
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
      moduleId: "@json",
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
      moduleId: "@json",
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
      moduleId: "@json",
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
      moduleId: "@json",
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
      moduleId: "@json",
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
      moduleId: "@json",
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
      moduleId: "@json",
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
      moduleId: "@json",
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
      moduleId: "@json",
      localName: "Number",
      value: {
        kind: "Reference",
        definitionId: "f64",
      },
    },
    String: {
      kind: "Definition",
      definitionId: "String",
      moduleId: "@json",
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
      moduleId: "@json",
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
                  definitionId: "@json_modexpr",
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
                  definitionId: "@json_modexpr2",
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
      moduleId: "@json",
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
      moduleId: "@json",
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
      moduleId: "@json",
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
      moduleId: "@json",
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
      moduleId: "@json",
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
      moduleId: "@json",
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
      moduleId: "@json",
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
      moduleId: "@json",
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
    "@json": {
      kind: "Definition",
      definitionId: "@json",
      moduleId: "@@root",
      localName: "@json",
      value: {
        kind: "ModuleStub",
        moduleId: "@json",
        bindingDefinitionIds: {
          char: "char",
          f64: "f64",
          unicode: "unicode",
          start: "start",
          Value: "Value",
          False: "False",
          Null: "Null",
          True: "True",
          Object: "Object",
          Property: "Property",
          Array: "Array",
          Element: "Element",
          Number: "Number",
          String: "String",
          CHAR: "CHAR",
          LBRACE: "LBRACE",
          RBRACE: "RBRACE",
          LBRACKET: "LBRACKET",
          RBRACKET: "RBRACKET",
          COLON: "COLON",
          COMMA: "COMMA",
          DOUBLE_QUOTE: "DOUBLE_QUOTE",
          WS: "WS",
        },
      },
    },
    min: {
      kind: "Definition",
      definitionId: "min",
      moduleId: "@json_modexpr",
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
      moduleId: "@json_modexpr",
      localName: "max",
      value: {
        kind: "StringLiteral",
        value: "￿",
        concrete: false,
        abstract: false,
      },
    },
    "@json_modexpr": {
      kind: "Definition",
      definitionId: "@json_modexpr",
      moduleId: "@@root",
      localName: "@json_modexpr",
      value: {
        kind: "ModuleStub",
        moduleId: "@json_modexpr",
        bindingDefinitionIds: {
          min: "min",
          max: "max",
        },
      },
    },
    base: {
      kind: "Definition",
      definitionId: "base",
      moduleId: "@json_modexpr2",
      localName: "base",
      value: {
        kind: "NumericLiteral",
        value: 16,
      },
    },
    minDigits: {
      kind: "Definition",
      definitionId: "minDigits",
      moduleId: "@json_modexpr2",
      localName: "minDigits",
      value: {
        kind: "NumericLiteral",
        value: 4,
      },
    },
    maxDigits: {
      kind: "Definition",
      definitionId: "maxDigits",
      moduleId: "@json_modexpr2",
      localName: "maxDigits",
      value: {
        kind: "NumericLiteral",
        value: 4,
      },
    },
    "@json_modexpr2": {
      kind: "Definition",
      definitionId: "@json_modexpr2",
      moduleId: "@@root",
      localName: "@json_modexpr2",
      value: {
        kind: "ModuleStub",
        moduleId: "@json_modexpr2",
        bindingDefinitionIds: {
          base: "base",
          minDigits: "minDigits",
          maxDigits: "maxDigits",
        },
      },
    },
    char2: {
      kind: "Definition",
      definitionId: "char2",
      moduleId: "@std",
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
      moduleId: "@std",
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
      moduleId: "@std",
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
      moduleId: "@std",
      localName: "memoise",
      value: {
        kind: "Intrinsic",
        name: "memoise",
        path: "V:/projects/oss/pen-monorepo/packages/core/penc/dist/deps/std.pen.js",
      },
    },
    "@std": {
      kind: "Definition",
      definitionId: "@std",
      moduleId: "@@root",
      localName: "@std",
      value: {
        kind: "ModuleStub",
        moduleId: "@std",
        bindingDefinitionIds: {
          char: "char2",
          f64: "f642",
          i32: "i32",
          memoise: "memoise",
        },
      },
    },
    unicode2: {
      kind: "Definition",
      definitionId: "unicode2",
      moduleId: "@experiments",
      localName: "unicode",
      value: {
        kind: "Intrinsic",
        name: "unicode",
        path: "V:/projects/oss/pen-monorepo/packages/core/penc/dist/deps/experiments.pen.js",
      },
    },
    "@experiments": {
      kind: "Definition",
      definitionId: "@experiments",
      moduleId: "@@root",
      localName: "@experiments",
      value: {
        kind: "ModuleStub",
        moduleId: "@experiments",
        bindingDefinitionIds: {
          unicode: "unicode2",
        },
      },
    },
  },
  startDefinitionId: "start",
}
