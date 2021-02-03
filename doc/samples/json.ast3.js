const ast3 = {
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
      start_2: {
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
      WS: {
        kind: "QuantifiedExpression",
        expression: {
          kind: "Identifier",
          name: "WS_e",
        },
        quantifier: "*",
      },
      WS_e: {
        kind: "SelectionExpression",
        expressions: [
          {
            kind: "Identifier",
            name: "WS_e2",
          },
          {
            kind: "Identifier",
            name: "WS_e3",
          },
          {
            kind: "Identifier",
            name: "WS_e4",
          },
          {
            kind: "Identifier",
            name: "WS_e5",
          },
        ],
      },
      WS_e2: {
        kind: "StringLiteral",
        value: " ",
        concrete: true,
        abstract: false,
      },
      WS_e3: {
        kind: "StringLiteral",
        value: "\t",
        concrete: true,
        abstract: false,
      },
      WS_e4: {
        kind: "StringLiteral",
        value: "\n",
        concrete: true,
        abstract: false,
      },
      WS_e5: {
        kind: "StringLiteral",
        value: "\r",
        concrete: true,
        abstract: false,
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
            name: "f64",
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
            kind: "Identifier",
            name: "False_e",
          },
          {
            kind: "Identifier",
            name: "False_e2",
          },
        ],
      },
      False_e: {
        kind: "StringLiteral",
        value: "false",
        concrete: true,
        abstract: false,
      },
      False_e2: {
        kind: "BooleanLiteral",
        value: false,
      },
      Null: {
        kind: "SequenceExpression",
        expressions: [
          {
            kind: "Identifier",
            name: "Null_e",
          },
          {
            kind: "Identifier",
            name: "Null_e2",
          },
        ],
      },
      Null_e: {
        kind: "StringLiteral",
        value: "null",
        concrete: true,
        abstract: false,
      },
      Null_e2: {
        kind: "NullLiteral",
        value: null,
      },
      True: {
        kind: "SequenceExpression",
        expressions: [
          {
            kind: "Identifier",
            name: "True_e",
          },
          {
            kind: "Identifier",
            name: "True_e2",
          },
        ],
      },
      True_e: {
        kind: "StringLiteral",
        value: "true",
        concrete: true,
        abstract: false,
      },
      True_e2: {
        kind: "BooleanLiteral",
        value: true,
      },
      Object: {
        kind: "SequenceExpression",
        expressions: [
          {
            kind: "Identifier",
            name: "LBRACE",
          },
          {
            kind: "Identifier",
            name: "Object_e",
          },
          {
            kind: "Identifier",
            name: "RBRACE",
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
            kind: "Identifier",
            name: "LBRACE_e",
          },
          {
            kind: "Identifier",
            name: "WS",
          },
        ],
      },
      LBRACE_e: {
        kind: "StringLiteral",
        value: "{",
        concrete: true,
        abstract: false,
      },
      Object_e: {
        kind: "SelectionExpression",
        expressions: [
          {
            kind: "Identifier",
            name: "Object_e2",
          },
          {
            kind: "Identifier",
            name: "Object_e5",
          },
        ],
      },
      Object_e2: {
        kind: "SequenceExpression",
        expressions: [
          {
            kind: "Identifier",
            name: "Property",
          },
          {
            kind: "Identifier",
            name: "Object_e3",
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
          kind: "Identifier",
          name: "Property_e",
        },
      },
      String: {
        kind: "SequenceExpression",
        expressions: [
          {
            kind: "Identifier",
            name: "DOUBLE_QUOTE",
          },
          {
            kind: "Identifier",
            name: "String_e",
          },
          {
            kind: "Identifier",
            name: "DOUBLE_QUOTE",
          },
        ],
      },
      DOUBLE_QUOTE: {
        kind: "StringLiteral",
        value: "\"",
        concrete: true,
        abstract: false,
      },
      String_e: {
        kind: "QuantifiedExpression",
        expression: {
          kind: "Identifier",
          name: "CHAR",
        },
        quantifier: "*",
      },
      CHAR: {
        kind: "SelectionExpression",
        expressions: [
          {
            kind: "Identifier",
            name: "CHAR_e",
          },
          {
            kind: "Identifier",
            name: "CHAR_e8",
          },
          {
            kind: "Identifier",
            name: "CHAR_e11",
          },
          {
            kind: "Identifier",
            name: "CHAR_e14",
          },
          {
            kind: "Identifier",
            name: "CHAR_e17",
          },
          {
            kind: "Identifier",
            name: "CHAR_e20",
          },
          {
            kind: "Identifier",
            name: "CHAR_e23",
          },
          {
            kind: "Identifier",
            name: "CHAR_e26",
          },
          {
            kind: "Identifier",
            name: "CHAR_e29",
          },
          {
            kind: "Identifier",
            name: "CHAR_e32",
          },
        ],
      },
      CHAR_e: {
        kind: "SequenceExpression",
        expressions: [
          {
            kind: "Identifier",
            name: "CHAR_e2",
          },
          {
            kind: "Identifier",
            name: "CHAR_e4",
          },
          {
            kind: "Identifier",
            name: "CHAR_e6",
          },
        ],
      },
      CHAR_e2: {
        kind: "NotExpression",
        expression: {
          kind: "Identifier",
          name: "CHAR_e3",
        },
      },
      CHAR_e3: {
        kind: "StringLiteral",
        value: "\\",
        concrete: false,
        abstract: false,
      },
      CHAR_e4: {
        kind: "NotExpression",
        expression: {
          kind: "Identifier",
          name: "CHAR_e5",
        },
      },
      CHAR_e5: {
        kind: "StringLiteral",
        value: "\"",
        concrete: false,
        abstract: false,
      },
      CHAR_e6: {
        kind: "InstantiationExpression",
        generic: {
          kind: "Identifier",
          name: "char",
        },
        argument: {
          kind: "Identifier",
          name: "CHAR_e7",
        },
      },
      char: {
        kind: "Intrinsic",
        name: "char",
        path: "V:/projects/oss/pen-monorepo/packages/core/penc/dist/deps/std.pen.js",
      },
      CHAR_e7: {
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
      CHAR_e8: {
        kind: "SequenceExpression",
        expressions: [
          {
            kind: "Identifier",
            name: "CHAR_e9",
          },
          {
            kind: "Identifier",
            name: "CHAR_e10",
          },
        ],
      },
      CHAR_e9: {
        kind: "StringLiteral",
        value: "\\\"",
        concrete: true,
        abstract: false,
      },
      CHAR_e10: {
        kind: "StringLiteral",
        value: "\"",
        concrete: false,
        abstract: true,
      },
      CHAR_e11: {
        kind: "SequenceExpression",
        expressions: [
          {
            kind: "Identifier",
            name: "CHAR_e12",
          },
          {
            kind: "Identifier",
            name: "CHAR_e13",
          },
        ],
      },
      CHAR_e12: {
        kind: "StringLiteral",
        value: "\\\\",
        concrete: true,
        abstract: false,
      },
      CHAR_e13: {
        kind: "StringLiteral",
        value: "\\",
        concrete: false,
        abstract: true,
      },
      CHAR_e14: {
        kind: "SequenceExpression",
        expressions: [
          {
            kind: "Identifier",
            name: "CHAR_e15",
          },
          {
            kind: "Identifier",
            name: "CHAR_e16",
          },
        ],
      },
      CHAR_e15: {
        kind: "StringLiteral",
        value: "\\/",
        concrete: true,
        abstract: false,
      },
      CHAR_e16: {
        kind: "StringLiteral",
        value: "/",
        concrete: false,
        abstract: true,
      },
      CHAR_e17: {
        kind: "SequenceExpression",
        expressions: [
          {
            kind: "Identifier",
            name: "CHAR_e18",
          },
          {
            kind: "Identifier",
            name: "CHAR_e19",
          },
        ],
      },
      CHAR_e18: {
        kind: "StringLiteral",
        value: "\\b",
        concrete: true,
        abstract: false,
      },
      CHAR_e19: {
        kind: "StringLiteral",
        value: "\b",
        concrete: false,
        abstract: true,
      },
      CHAR_e20: {
        kind: "SequenceExpression",
        expressions: [
          {
            kind: "Identifier",
            name: "CHAR_e21",
          },
          {
            kind: "Identifier",
            name: "CHAR_e22",
          },
        ],
      },
      CHAR_e21: {
        kind: "StringLiteral",
        value: "\\f",
        concrete: true,
        abstract: false,
      },
      CHAR_e22: {
        kind: "StringLiteral",
        value: "\f",
        concrete: false,
        abstract: true,
      },
      CHAR_e23: {
        kind: "SequenceExpression",
        expressions: [
          {
            kind: "Identifier",
            name: "CHAR_e24",
          },
          {
            kind: "Identifier",
            name: "CHAR_e25",
          },
        ],
      },
      CHAR_e24: {
        kind: "StringLiteral",
        value: "\\n",
        concrete: true,
        abstract: false,
      },
      CHAR_e25: {
        kind: "StringLiteral",
        value: "\n",
        concrete: false,
        abstract: true,
      },
      CHAR_e26: {
        kind: "SequenceExpression",
        expressions: [
          {
            kind: "Identifier",
            name: "CHAR_e27",
          },
          {
            kind: "Identifier",
            name: "CHAR_e28",
          },
        ],
      },
      CHAR_e27: {
        kind: "StringLiteral",
        value: "\\r",
        concrete: true,
        abstract: false,
      },
      CHAR_e28: {
        kind: "StringLiteral",
        value: "\r",
        concrete: false,
        abstract: true,
      },
      CHAR_e29: {
        kind: "SequenceExpression",
        expressions: [
          {
            kind: "Identifier",
            name: "CHAR_e30",
          },
          {
            kind: "Identifier",
            name: "CHAR_e31",
          },
        ],
      },
      CHAR_e30: {
        kind: "StringLiteral",
        value: "\\t",
        concrete: true,
        abstract: false,
      },
      CHAR_e31: {
        kind: "StringLiteral",
        value: "\t",
        concrete: false,
        abstract: true,
      },
      CHAR_e32: {
        kind: "SequenceExpression",
        expressions: [
          {
            kind: "Identifier",
            name: "CHAR_e33",
          },
          {
            kind: "Identifier",
            name: "CHAR_e34",
          },
        ],
      },
      CHAR_e33: {
        kind: "StringLiteral",
        value: "\\u",
        concrete: true,
        abstract: false,
      },
      CHAR_e34: {
        kind: "InstantiationExpression",
        generic: {
          kind: "Identifier",
          name: "unicode",
        },
        argument: {
          kind: "Identifier",
          name: "CHAR_e35",
        },
      },
      unicode: {
        kind: "Intrinsic",
        name: "unicode",
        path: "V:/projects/oss/pen-monorepo/packages/core/penc/dist/deps/experiments.pen.js",
      },
      CHAR_e35: {
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
            name: "minDigits",
          },
        },
      },
      base: {
        kind: "NumericLiteral",
        value: 16,
      },
      minDigits: {
        kind: "NumericLiteral",
        value: 4,
      },
      Property_e: {
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
      COLON: {
        kind: "SequenceExpression",
        expressions: [
          {
            kind: "Identifier",
            name: "WS",
          },
          {
            kind: "Identifier",
            name: "COLON_e",
          },
          {
            kind: "Identifier",
            name: "WS",
          },
        ],
      },
      COLON_e: {
        kind: "StringLiteral",
        value: ":",
        concrete: true,
        abstract: false,
      },
      Object_e3: {
        kind: "QuantifiedExpression",
        expression: {
          kind: "Identifier",
          name: "Object_e4",
        },
        quantifier: "*",
      },
      Object_e4: {
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
      COMMA: {
        kind: "SequenceExpression",
        expressions: [
          {
            kind: "Identifier",
            name: "WS",
          },
          {
            kind: "Identifier",
            name: "COMMA_e",
          },
          {
            kind: "Identifier",
            name: "WS",
          },
        ],
      },
      COMMA_e: {
        kind: "StringLiteral",
        value: ",",
        concrete: true,
        abstract: false,
      },
      Object_e5: {
        kind: "RecordExpression",
        fields: [
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
            kind: "Identifier",
            name: "RBRACE_e",
          },
          {
            kind: "Identifier",
            name: "WS",
          },
        ],
      },
      RBRACE_e: {
        kind: "StringLiteral",
        value: "}",
        concrete: true,
        abstract: false,
      },
      Array: {
        kind: "SequenceExpression",
        expressions: [
          {
            kind: "Identifier",
            name: "LBRACKET",
          },
          {
            kind: "Identifier",
            name: "Array_e",
          },
          {
            kind: "Identifier",
            name: "RBRACKET",
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
            kind: "Identifier",
            name: "LBRACKET_e",
          },
          {
            kind: "Identifier",
            name: "WS",
          },
        ],
      },
      LBRACKET_e: {
        kind: "StringLiteral",
        value: "[",
        concrete: true,
        abstract: false,
      },
      Array_e: {
        kind: "SelectionExpression",
        expressions: [
          {
            kind: "Identifier",
            name: "Array_e2",
          },
          {
            kind: "Identifier",
            name: "Array_e5",
          },
        ],
      },
      Array_e2: {
        kind: "SequenceExpression",
        expressions: [
          {
            kind: "Identifier",
            name: "Element",
          },
          {
            kind: "Identifier",
            name: "Array_e3",
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
      Array_e3: {
        kind: "QuantifiedExpression",
        expression: {
          kind: "Identifier",
          name: "Array_e4",
        },
        quantifier: "*",
      },
      Array_e4: {
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
      Array_e5: {
        kind: "ListExpression",
        elements: [
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
            kind: "Identifier",
            name: "RBRACKET_e",
          },
          {
            kind: "Identifier",
            name: "WS",
          },
        ],
      },
      RBRACKET_e: {
        kind: "StringLiteral",
        value: "]",
        concrete: true,
        abstract: false,
      },
      f64: {
        kind: "Intrinsic",
        name: "f64",
        path: "V:/projects/oss/pen-monorepo/packages/core/penc/dist/deps/std.pen.js",
      },
    },
  },
}
