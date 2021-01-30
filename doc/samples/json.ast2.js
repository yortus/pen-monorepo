const ast2 = {
  version: 300,
  start: {
    kind: "MemberExpression",
    module: {
      kind: "Module",
      bindings: {
        DUMMY: {
          kind: "Module",
          bindings: {
          },
        },
        char: {
          kind: "Identifier",
          module: null,
          member: null,
          name: "char_2",
          resolved: true,
        },
        f64: {
          kind: "Identifier",
          module: null,
          member: null,
          name: "f64_2",
          resolved: true,
        },
        unicode: {
          kind: "Identifier",
          module: null,
          member: null,
          name: "unicode_2",
          resolved: true,
        },
        start_2: {
          kind: "SequenceExpression",
          expressions: [
            {
              kind: "Identifier",
              name: "WS",
              resolved: true,
            },
            {
              kind: "Identifier",
              name: "Value",
              resolved: true,
            },
            {
              kind: "Identifier",
              name: "WS",
              resolved: true,
            },
          ],
        },
        Value: {
          kind: "SelectionExpression",
          expressions: [
            {
              kind: "Identifier",
              name: "False",
              resolved: true,
            },
            {
              kind: "Identifier",
              name: "Null",
              resolved: true,
            },
            {
              kind: "Identifier",
              name: "True",
              resolved: true,
            },
            {
              kind: "Identifier",
              name: "Object",
              resolved: true,
            },
            {
              kind: "Identifier",
              name: "Array",
              resolved: true,
            },
            {
              kind: "Identifier",
              name: "Number",
              resolved: true,
            },
            {
              kind: "Identifier",
              name: "String",
              resolved: true,
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
              resolved: true,
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
                      resolved: true,
                    },
                    {
                      kind: "QuantifiedExpression",
                      expression: {
                        kind: "SequenceExpression",
                        expressions: [
                          {
                            kind: "Identifier",
                            name: "COMMA",
                            resolved: true,
                          },
                          {
                            kind: "Identifier",
                            name: "Property",
                            resolved: true,
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
              resolved: true,
            },
          ],
        },
        Property: {
          kind: "FieldExpression",
          name: {
            kind: "Identifier",
            name: "String",
            resolved: true,
          },
          value: {
            kind: "SequenceExpression",
            expressions: [
              {
                kind: "Identifier",
                name: "COLON",
                resolved: true,
              },
              {
                kind: "Identifier",
                name: "Value",
                resolved: true,
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
              resolved: true,
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
                      resolved: true,
                    },
                    {
                      kind: "QuantifiedExpression",
                      expression: {
                        kind: "SequenceExpression",
                        expressions: [
                          {
                            kind: "Identifier",
                            name: "COMMA",
                            resolved: true,
                          },
                          {
                            kind: "Identifier",
                            name: "Element",
                            resolved: true,
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
              resolved: true,
            },
          ],
        },
        Element: {
          kind: "ListExpression",
          elements: [
            {
              kind: "Identifier",
              name: "Value",
              resolved: true,
            },
          ],
        },
        Number: {
          kind: "Identifier",
          name: "f64",
          resolved: true,
        },
        String: {
          kind: "SequenceExpression",
          expressions: [
            {
              kind: "Identifier",
              name: "DOUBLE_QUOTE",
              resolved: true,
            },
            {
              kind: "QuantifiedExpression",
              expression: {
                kind: "Identifier",
                name: "CHAR",
                resolved: true,
              },
              quantifier: "*",
            },
            {
              kind: "Identifier",
              name: "DOUBLE_QUOTE",
              resolved: true,
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
                    resolved: true,
                  },
                  argument: {
                    kind: "Module",
                    bindings: {
                      min: {
                        kind: "Identifier",
                        name: "min",
                        resolved: true,
                      },
                      max: {
                        kind: "Identifier",
                        name: "max",
                        resolved: true,
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
                    resolved: true,
                  },
                  argument: {
                    kind: "Module",
                    bindings: {
                      base: {
                        kind: "Identifier",
                        name: "base",
                        resolved: true,
                      },
                      minDigits: {
                        kind: "Identifier",
                        name: "minDigits",
                        resolved: true,
                      },
                      maxDigits: {
                        kind: "Identifier",
                        name: "maxDigits",
                        resolved: true,
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
              resolved: true,
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
              resolved: true,
            },
          ],
        },
        RBRACE: {
          kind: "SequenceExpression",
          expressions: [
            {
              kind: "Identifier",
              name: "WS",
              resolved: true,
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
              resolved: true,
            },
          ],
        },
        LBRACKET: {
          kind: "SequenceExpression",
          expressions: [
            {
              kind: "Identifier",
              name: "WS",
              resolved: true,
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
              resolved: true,
            },
          ],
        },
        RBRACKET: {
          kind: "SequenceExpression",
          expressions: [
            {
              kind: "Identifier",
              name: "WS",
              resolved: true,
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
              resolved: true,
            },
          ],
        },
        COLON: {
          kind: "SequenceExpression",
          expressions: [
            {
              kind: "Identifier",
              name: "WS",
              resolved: true,
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
              resolved: true,
            },
          ],
        },
        COMMA: {
          kind: "SequenceExpression",
          expressions: [
            {
              kind: "Identifier",
              name: "WS",
              resolved: true,
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
              resolved: true,
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
              resolved: true,
            },
            f64: {
              kind: "Identifier",
              name: "f64",
              resolved: true,
            },
            unicode: {
              kind: "Identifier",
              name: "unicode",
              resolved: true,
            },
            start: {
              kind: "Identifier",
              name: "start_2",
              resolved: true,
            },
            Value: {
              kind: "Identifier",
              name: "Value",
              resolved: true,
            },
            False: {
              kind: "Identifier",
              name: "False",
              resolved: true,
            },
            Null: {
              kind: "Identifier",
              name: "Null",
              resolved: true,
            },
            True: {
              kind: "Identifier",
              name: "True",
              resolved: true,
            },
            Object: {
              kind: "Identifier",
              name: "Object",
              resolved: true,
            },
            Property: {
              kind: "Identifier",
              name: "Property",
              resolved: true,
            },
            Array: {
              kind: "Identifier",
              name: "Array",
              resolved: true,
            },
            Element: {
              kind: "Identifier",
              name: "Element",
              resolved: true,
            },
            Number: {
              kind: "Identifier",
              name: "Number",
              resolved: true,
            },
            String: {
              kind: "Identifier",
              name: "String",
              resolved: true,
            },
            CHAR: {
              kind: "Identifier",
              name: "CHAR",
              resolved: true,
            },
            LBRACE: {
              kind: "Identifier",
              name: "LBRACE",
              resolved: true,
            },
            RBRACE: {
              kind: "Identifier",
              name: "RBRACE",
              resolved: true,
            },
            LBRACKET: {
              kind: "Identifier",
              name: "LBRACKET",
              resolved: true,
            },
            RBRACKET: {
              kind: "Identifier",
              name: "RBRACKET",
              resolved: true,
            },
            COLON: {
              kind: "Identifier",
              name: "COLON",
              resolved: true,
            },
            COMMA: {
              kind: "Identifier",
              name: "COMMA",
              resolved: true,
            },
            DOUBLE_QUOTE: {
              kind: "Identifier",
              name: "DOUBLE_QUOTE",
              resolved: true,
            },
            WS: {
              kind: "Identifier",
              name: "WS",
              resolved: true,
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
              resolved: true,
            },
            f64: {
              kind: "Identifier",
              name: "f64_2",
              resolved: true,
            },
            i32: {
              kind: "Identifier",
              name: "i32",
              resolved: true,
            },
            memoise: {
              kind: "Identifier",
              name: "memoise",
              resolved: true,
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
              resolved: true,
            },
          },
        },
        start: {
          kind: "Identifier",
          module: null,
          member: null,
          name: "start_2",
          resolved: true,
        },
      },
    },
    member: "start",
  },
}
