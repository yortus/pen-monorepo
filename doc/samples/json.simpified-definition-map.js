const simplifiedDefinitionMap = {
  definitionsById: {
    start: {
      kind: "Definition",
      definitionId: "start",
      localName: "-",
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
    WS: {
      kind: "Definition",
      definitionId: "WS",
      localName: "-",
      value: {
        kind: "QuantifiedExpression",
        expression: {
          kind: "Reference",
          definitionId: "WS_e",
        },
        quantifier: "*",
      },
    },
    WS_e: {
      kind: "Definition",
      definitionId: "WS_e",
      localName: "-",
      value: {
        kind: "SelectionExpression",
        expressions: [
          {
            kind: "Reference",
            definitionId: "WS_e2",
          },
          {
            kind: "Reference",
            definitionId: "WS_e3",
          },
          {
            kind: "Reference",
            definitionId: "WS_e4",
          },
          {
            kind: "Reference",
            definitionId: "WS_e5",
          },
        ],
      },
    },
    WS_e2: {
      kind: "Definition",
      definitionId: "WS_e2",
      localName: "-",
      value: {
        kind: "StringLiteral",
        value: " ",
        concrete: true,
        abstract: false,
      },
    },
    WS_e3: {
      kind: "Definition",
      definitionId: "WS_e3",
      localName: "-",
      value: {
        kind: "StringLiteral",
        value: "\t",
        concrete: true,
        abstract: false,
      },
    },
    WS_e4: {
      kind: "Definition",
      definitionId: "WS_e4",
      localName: "-",
      value: {
        kind: "StringLiteral",
        value: "\n",
        concrete: true,
        abstract: false,
      },
    },
    WS_e5: {
      kind: "Definition",
      definitionId: "WS_e5",
      localName: "-",
      value: {
        kind: "StringLiteral",
        value: "\r",
        concrete: true,
        abstract: false,
      },
    },
    Value: {
      kind: "Definition",
      definitionId: "Value",
      localName: "-",
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
            definitionId: "f64",
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
      localName: "-",
      value: {
        kind: "SequenceExpression",
        expressions: [
          {
            kind: "Reference",
            definitionId: "False_e",
          },
          {
            kind: "Reference",
            definitionId: "False_e2",
          },
        ],
      },
    },
    False_e: {
      kind: "Definition",
      definitionId: "False_e",
      localName: "-",
      value: {
        kind: "StringLiteral",
        value: "false",
        concrete: true,
        abstract: false,
      },
    },
    False_e2: {
      kind: "Definition",
      definitionId: "False_e2",
      localName: "-",
      value: {
        kind: "BooleanLiteral",
        value: false,
      },
    },
    Null: {
      kind: "Definition",
      definitionId: "Null",
      localName: "-",
      value: {
        kind: "SequenceExpression",
        expressions: [
          {
            kind: "Reference",
            definitionId: "Null_e",
          },
          {
            kind: "Reference",
            definitionId: "Null_e2",
          },
        ],
      },
    },
    Null_e: {
      kind: "Definition",
      definitionId: "Null_e",
      localName: "-",
      value: {
        kind: "StringLiteral",
        value: "null",
        concrete: true,
        abstract: false,
      },
    },
    Null_e2: {
      kind: "Definition",
      definitionId: "Null_e2",
      localName: "-",
      value: {
        kind: "NullLiteral",
        value: null,
      },
    },
    True: {
      kind: "Definition",
      definitionId: "True",
      localName: "-",
      value: {
        kind: "SequenceExpression",
        expressions: [
          {
            kind: "Reference",
            definitionId: "True_e",
          },
          {
            kind: "Reference",
            definitionId: "True_e2",
          },
        ],
      },
    },
    True_e: {
      kind: "Definition",
      definitionId: "True_e",
      localName: "-",
      value: {
        kind: "StringLiteral",
        value: "true",
        concrete: true,
        abstract: false,
      },
    },
    True_e2: {
      kind: "Definition",
      definitionId: "True_e2",
      localName: "-",
      value: {
        kind: "BooleanLiteral",
        value: true,
      },
    },
    Object: {
      kind: "Definition",
      definitionId: "Object",
      localName: "-",
      value: {
        kind: "SequenceExpression",
        expressions: [
          {
            kind: "Reference",
            definitionId: "LBRACE",
          },
          {
            kind: "Reference",
            definitionId: "Object_e",
          },
          {
            kind: "Reference",
            definitionId: "RBRACE",
          },
        ],
      },
    },
    LBRACE: {
      kind: "Definition",
      definitionId: "LBRACE",
      localName: "-",
      value: {
        kind: "SequenceExpression",
        expressions: [
          {
            kind: "Reference",
            definitionId: "WS",
          },
          {
            kind: "Reference",
            definitionId: "LBRACE_e",
          },
          {
            kind: "Reference",
            definitionId: "WS",
          },
        ],
      },
    },
    LBRACE_e: {
      kind: "Definition",
      definitionId: "LBRACE_e",
      localName: "-",
      value: {
        kind: "StringLiteral",
        value: "{",
        concrete: true,
        abstract: false,
      },
    },
    Object_e: {
      kind: "Definition",
      definitionId: "Object_e",
      localName: "-",
      value: {
        kind: "SelectionExpression",
        expressions: [
          {
            kind: "Reference",
            definitionId: "Object_e2",
          },
          {
            kind: "Reference",
            definitionId: "Object_e5",
          },
        ],
      },
    },
    Object_e2: {
      kind: "Definition",
      definitionId: "Object_e2",
      localName: "-",
      value: {
        kind: "SequenceExpression",
        expressions: [
          {
            kind: "Reference",
            definitionId: "Property",
          },
          {
            kind: "Reference",
            definitionId: "Object_e3",
          },
        ],
      },
    },
    Property: {
      kind: "Definition",
      definitionId: "Property",
      localName: "-",
      value: {
        kind: "FieldExpression",
        name: {
          kind: "Reference",
          definitionId: "String",
        },
        value: {
          kind: "Reference",
          definitionId: "Property_e",
        },
      },
    },
    String: {
      kind: "Definition",
      definitionId: "String",
      localName: "-",
      value: {
        kind: "SequenceExpression",
        expressions: [
          {
            kind: "Reference",
            definitionId: "DOUBLE_QUOTE",
          },
          {
            kind: "Reference",
            definitionId: "String_e",
          },
          {
            kind: "Reference",
            definitionId: "DOUBLE_QUOTE",
          },
        ],
      },
    },
    DOUBLE_QUOTE: {
      kind: "Definition",
      definitionId: "DOUBLE_QUOTE",
      localName: "-",
      value: {
        kind: "StringLiteral",
        value: "\"",
        concrete: true,
        abstract: false,
      },
    },
    String_e: {
      kind: "Definition",
      definitionId: "String_e",
      localName: "-",
      value: {
        kind: "QuantifiedExpression",
        expression: {
          kind: "Reference",
          definitionId: "CHAR",
        },
        quantifier: "*",
      },
    },
    CHAR: {
      kind: "Definition",
      definitionId: "CHAR",
      localName: "-",
      value: {
        kind: "SelectionExpression",
        expressions: [
          {
            kind: "Reference",
            definitionId: "CHAR_e",
          },
          {
            kind: "Reference",
            definitionId: "CHAR_e8",
          },
          {
            kind: "Reference",
            definitionId: "CHAR_e11",
          },
          {
            kind: "Reference",
            definitionId: "CHAR_e14",
          },
          {
            kind: "Reference",
            definitionId: "CHAR_e17",
          },
          {
            kind: "Reference",
            definitionId: "CHAR_e20",
          },
          {
            kind: "Reference",
            definitionId: "CHAR_e23",
          },
          {
            kind: "Reference",
            definitionId: "CHAR_e26",
          },
          {
            kind: "Reference",
            definitionId: "CHAR_e29",
          },
          {
            kind: "Reference",
            definitionId: "CHAR_e32",
          },
        ],
      },
    },
    CHAR_e: {
      kind: "Definition",
      definitionId: "CHAR_e",
      localName: "-",
      value: {
        kind: "SequenceExpression",
        expressions: [
          {
            kind: "Reference",
            definitionId: "CHAR_e2",
          },
          {
            kind: "Reference",
            definitionId: "CHAR_e4",
          },
          {
            kind: "Reference",
            definitionId: "CHAR_e6",
          },
        ],
      },
    },
    CHAR_e2: {
      kind: "Definition",
      definitionId: "CHAR_e2",
      localName: "-",
      value: {
        kind: "NotExpression",
        expression: {
          kind: "Reference",
          definitionId: "CHAR_e3",
        },
      },
    },
    CHAR_e3: {
      kind: "Definition",
      definitionId: "CHAR_e3",
      localName: "-",
      value: {
        kind: "StringLiteral",
        value: "\\",
        concrete: false,
        abstract: false,
      },
    },
    CHAR_e4: {
      kind: "Definition",
      definitionId: "CHAR_e4",
      localName: "-",
      value: {
        kind: "NotExpression",
        expression: {
          kind: "Reference",
          definitionId: "CHAR_e5",
        },
      },
    },
    CHAR_e5: {
      kind: "Definition",
      definitionId: "CHAR_e5",
      localName: "-",
      value: {
        kind: "StringLiteral",
        value: "\"",
        concrete: false,
        abstract: false,
      },
    },
    CHAR_e6: {
      kind: "Definition",
      definitionId: "CHAR_e6",
      localName: "-",
      value: {
        kind: "ApplicationExpression",
        lambda: {
          kind: "Reference",
          definitionId: "char",
        },
        argument: {
          kind: "Reference",
          definitionId: "CHAR_e7",
        },
      },
    },
    char: {
      kind: "Definition",
      definitionId: "char",
      localName: "-",
      value: {
        kind: "Intrinsic",
        name: "char",
        path: "V:/projects/oss/pen-monorepo/packages/core/penc/dist/deps/std.pen.js",
      },
    },
    CHAR_e7: {
      kind: "Definition",
      definitionId: "CHAR_e7",
      localName: "-",
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
    min: {
      kind: "Definition",
      definitionId: "min",
      localName: "-",
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
      localName: "-",
      value: {
        kind: "StringLiteral",
        value: "￿",
        concrete: false,
        abstract: false,
      },
    },
    CHAR_e8: {
      kind: "Definition",
      definitionId: "CHAR_e8",
      localName: "-",
      value: {
        kind: "SequenceExpression",
        expressions: [
          {
            kind: "Reference",
            definitionId: "CHAR_e9",
          },
          {
            kind: "Reference",
            definitionId: "CHAR_e10",
          },
        ],
      },
    },
    CHAR_e9: {
      kind: "Definition",
      definitionId: "CHAR_e9",
      localName: "-",
      value: {
        kind: "StringLiteral",
        value: "\\\"",
        concrete: true,
        abstract: false,
      },
    },
    CHAR_e10: {
      kind: "Definition",
      definitionId: "CHAR_e10",
      localName: "-",
      value: {
        kind: "StringLiteral",
        value: "\"",
        concrete: false,
        abstract: true,
      },
    },
    CHAR_e11: {
      kind: "Definition",
      definitionId: "CHAR_e11",
      localName: "-",
      value: {
        kind: "SequenceExpression",
        expressions: [
          {
            kind: "Reference",
            definitionId: "CHAR_e12",
          },
          {
            kind: "Reference",
            definitionId: "CHAR_e13",
          },
        ],
      },
    },
    CHAR_e12: {
      kind: "Definition",
      definitionId: "CHAR_e12",
      localName: "-",
      value: {
        kind: "StringLiteral",
        value: "\\\\",
        concrete: true,
        abstract: false,
      },
    },
    CHAR_e13: {
      kind: "Definition",
      definitionId: "CHAR_e13",
      localName: "-",
      value: {
        kind: "StringLiteral",
        value: "\\",
        concrete: false,
        abstract: true,
      },
    },
    CHAR_e14: {
      kind: "Definition",
      definitionId: "CHAR_e14",
      localName: "-",
      value: {
        kind: "SequenceExpression",
        expressions: [
          {
            kind: "Reference",
            definitionId: "CHAR_e15",
          },
          {
            kind: "Reference",
            definitionId: "CHAR_e16",
          },
        ],
      },
    },
    CHAR_e15: {
      kind: "Definition",
      definitionId: "CHAR_e15",
      localName: "-",
      value: {
        kind: "StringLiteral",
        value: "\\/",
        concrete: true,
        abstract: false,
      },
    },
    CHAR_e16: {
      kind: "Definition",
      definitionId: "CHAR_e16",
      localName: "-",
      value: {
        kind: "StringLiteral",
        value: "/",
        concrete: false,
        abstract: true,
      },
    },
    CHAR_e17: {
      kind: "Definition",
      definitionId: "CHAR_e17",
      localName: "-",
      value: {
        kind: "SequenceExpression",
        expressions: [
          {
            kind: "Reference",
            definitionId: "CHAR_e18",
          },
          {
            kind: "Reference",
            definitionId: "CHAR_e19",
          },
        ],
      },
    },
    CHAR_e18: {
      kind: "Definition",
      definitionId: "CHAR_e18",
      localName: "-",
      value: {
        kind: "StringLiteral",
        value: "\\b",
        concrete: true,
        abstract: false,
      },
    },
    CHAR_e19: {
      kind: "Definition",
      definitionId: "CHAR_e19",
      localName: "-",
      value: {
        kind: "StringLiteral",
        value: "\b",
        concrete: false,
        abstract: true,
      },
    },
    CHAR_e20: {
      kind: "Definition",
      definitionId: "CHAR_e20",
      localName: "-",
      value: {
        kind: "SequenceExpression",
        expressions: [
          {
            kind: "Reference",
            definitionId: "CHAR_e21",
          },
          {
            kind: "Reference",
            definitionId: "CHAR_e22",
          },
        ],
      },
    },
    CHAR_e21: {
      kind: "Definition",
      definitionId: "CHAR_e21",
      localName: "-",
      value: {
        kind: "StringLiteral",
        value: "\\f",
        concrete: true,
        abstract: false,
      },
    },
    CHAR_e22: {
      kind: "Definition",
      definitionId: "CHAR_e22",
      localName: "-",
      value: {
        kind: "StringLiteral",
        value: "\f",
        concrete: false,
        abstract: true,
      },
    },
    CHAR_e23: {
      kind: "Definition",
      definitionId: "CHAR_e23",
      localName: "-",
      value: {
        kind: "SequenceExpression",
        expressions: [
          {
            kind: "Reference",
            definitionId: "CHAR_e24",
          },
          {
            kind: "Reference",
            definitionId: "CHAR_e25",
          },
        ],
      },
    },
    CHAR_e24: {
      kind: "Definition",
      definitionId: "CHAR_e24",
      localName: "-",
      value: {
        kind: "StringLiteral",
        value: "\\n",
        concrete: true,
        abstract: false,
      },
    },
    CHAR_e25: {
      kind: "Definition",
      definitionId: "CHAR_e25",
      localName: "-",
      value: {
        kind: "StringLiteral",
        value: "\n",
        concrete: false,
        abstract: true,
      },
    },
    CHAR_e26: {
      kind: "Definition",
      definitionId: "CHAR_e26",
      localName: "-",
      value: {
        kind: "SequenceExpression",
        expressions: [
          {
            kind: "Reference",
            definitionId: "CHAR_e27",
          },
          {
            kind: "Reference",
            definitionId: "CHAR_e28",
          },
        ],
      },
    },
    CHAR_e27: {
      kind: "Definition",
      definitionId: "CHAR_e27",
      localName: "-",
      value: {
        kind: "StringLiteral",
        value: "\\r",
        concrete: true,
        abstract: false,
      },
    },
    CHAR_e28: {
      kind: "Definition",
      definitionId: "CHAR_e28",
      localName: "-",
      value: {
        kind: "StringLiteral",
        value: "\r",
        concrete: false,
        abstract: true,
      },
    },
    CHAR_e29: {
      kind: "Definition",
      definitionId: "CHAR_e29",
      localName: "-",
      value: {
        kind: "SequenceExpression",
        expressions: [
          {
            kind: "Reference",
            definitionId: "CHAR_e30",
          },
          {
            kind: "Reference",
            definitionId: "CHAR_e31",
          },
        ],
      },
    },
    CHAR_e30: {
      kind: "Definition",
      definitionId: "CHAR_e30",
      localName: "-",
      value: {
        kind: "StringLiteral",
        value: "\\t",
        concrete: true,
        abstract: false,
      },
    },
    CHAR_e31: {
      kind: "Definition",
      definitionId: "CHAR_e31",
      localName: "-",
      value: {
        kind: "StringLiteral",
        value: "\t",
        concrete: false,
        abstract: true,
      },
    },
    CHAR_e32: {
      kind: "Definition",
      definitionId: "CHAR_e32",
      localName: "-",
      value: {
        kind: "SequenceExpression",
        expressions: [
          {
            kind: "Reference",
            definitionId: "CHAR_e33",
          },
          {
            kind: "Reference",
            definitionId: "CHAR_e34",
          },
        ],
      },
    },
    CHAR_e33: {
      kind: "Definition",
      definitionId: "CHAR_e33",
      localName: "-",
      value: {
        kind: "StringLiteral",
        value: "\\u",
        concrete: true,
        abstract: false,
      },
    },
    CHAR_e34: {
      kind: "Definition",
      definitionId: "CHAR_e34",
      localName: "-",
      value: {
        kind: "ApplicationExpression",
        lambda: {
          kind: "Reference",
          definitionId: "unicode",
        },
        argument: {
          kind: "Reference",
          definitionId: "CHAR_e35",
        },
      },
    },
    unicode: {
      kind: "Definition",
      definitionId: "unicode",
      localName: "-",
      value: {
        kind: "Intrinsic",
        name: "unicode",
        path: "V:/projects/oss/pen-monorepo/packages/core/penc/dist/deps/experiments.pen.js",
      },
    },
    CHAR_e35: {
      kind: "Definition",
      definitionId: "CHAR_e35",
      localName: "-",
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
            definitionId: "minDigits",
          },
        },
      },
    },
    base: {
      kind: "Definition",
      definitionId: "base",
      localName: "-",
      value: {
        kind: "NumericLiteral",
        value: 16,
      },
    },
    minDigits: {
      kind: "Definition",
      definitionId: "minDigits",
      localName: "-",
      value: {
        kind: "NumericLiteral",
        value: 4,
      },
    },
    Property_e: {
      kind: "Definition",
      definitionId: "Property_e",
      localName: "-",
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
    COLON: {
      kind: "Definition",
      definitionId: "COLON",
      localName: "-",
      value: {
        kind: "SequenceExpression",
        expressions: [
          {
            kind: "Reference",
            definitionId: "WS",
          },
          {
            kind: "Reference",
            definitionId: "COLON_e",
          },
          {
            kind: "Reference",
            definitionId: "WS",
          },
        ],
      },
    },
    COLON_e: {
      kind: "Definition",
      definitionId: "COLON_e",
      localName: "-",
      value: {
        kind: "StringLiteral",
        value: ":",
        concrete: true,
        abstract: false,
      },
    },
    Object_e3: {
      kind: "Definition",
      definitionId: "Object_e3",
      localName: "-",
      value: {
        kind: "QuantifiedExpression",
        expression: {
          kind: "Reference",
          definitionId: "Object_e4",
        },
        quantifier: "*",
      },
    },
    Object_e4: {
      kind: "Definition",
      definitionId: "Object_e4",
      localName: "-",
      value: {
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
    COMMA: {
      kind: "Definition",
      definitionId: "COMMA",
      localName: "-",
      value: {
        kind: "SequenceExpression",
        expressions: [
          {
            kind: "Reference",
            definitionId: "WS",
          },
          {
            kind: "Reference",
            definitionId: "COMMA_e",
          },
          {
            kind: "Reference",
            definitionId: "WS",
          },
        ],
      },
    },
    COMMA_e: {
      kind: "Definition",
      definitionId: "COMMA_e",
      localName: "-",
      value: {
        kind: "StringLiteral",
        value: ",",
        concrete: true,
        abstract: false,
      },
    },
    Object_e5: {
      kind: "Definition",
      definitionId: "Object_e5",
      localName: "-",
      value: {
        kind: "RecordExpression",
        fields: [
        ],
      },
    },
    RBRACE: {
      kind: "Definition",
      definitionId: "RBRACE",
      localName: "-",
      value: {
        kind: "SequenceExpression",
        expressions: [
          {
            kind: "Reference",
            definitionId: "WS",
          },
          {
            kind: "Reference",
            definitionId: "RBRACE_e",
          },
          {
            kind: "Reference",
            definitionId: "WS",
          },
        ],
      },
    },
    RBRACE_e: {
      kind: "Definition",
      definitionId: "RBRACE_e",
      localName: "-",
      value: {
        kind: "StringLiteral",
        value: "}",
        concrete: true,
        abstract: false,
      },
    },
    Array: {
      kind: "Definition",
      definitionId: "Array",
      localName: "-",
      value: {
        kind: "SequenceExpression",
        expressions: [
          {
            kind: "Reference",
            definitionId: "LBRACKET",
          },
          {
            kind: "Reference",
            definitionId: "Array_e",
          },
          {
            kind: "Reference",
            definitionId: "RBRACKET",
          },
        ],
      },
    },
    LBRACKET: {
      kind: "Definition",
      definitionId: "LBRACKET",
      localName: "-",
      value: {
        kind: "SequenceExpression",
        expressions: [
          {
            kind: "Reference",
            definitionId: "WS",
          },
          {
            kind: "Reference",
            definitionId: "LBRACKET_e",
          },
          {
            kind: "Reference",
            definitionId: "WS",
          },
        ],
      },
    },
    LBRACKET_e: {
      kind: "Definition",
      definitionId: "LBRACKET_e",
      localName: "-",
      value: {
        kind: "StringLiteral",
        value: "[",
        concrete: true,
        abstract: false,
      },
    },
    Array_e: {
      kind: "Definition",
      definitionId: "Array_e",
      localName: "-",
      value: {
        kind: "SelectionExpression",
        expressions: [
          {
            kind: "Reference",
            definitionId: "Array_e2",
          },
          {
            kind: "Reference",
            definitionId: "Array_e5",
          },
        ],
      },
    },
    Array_e2: {
      kind: "Definition",
      definitionId: "Array_e2",
      localName: "-",
      value: {
        kind: "SequenceExpression",
        expressions: [
          {
            kind: "Reference",
            definitionId: "Element",
          },
          {
            kind: "Reference",
            definitionId: "Array_e3",
          },
        ],
      },
    },
    Element: {
      kind: "Definition",
      definitionId: "Element",
      localName: "-",
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
    Array_e3: {
      kind: "Definition",
      definitionId: "Array_e3",
      localName: "-",
      value: {
        kind: "QuantifiedExpression",
        expression: {
          kind: "Reference",
          definitionId: "Array_e4",
        },
        quantifier: "*",
      },
    },
    Array_e4: {
      kind: "Definition",
      definitionId: "Array_e4",
      localName: "-",
      value: {
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
    Array_e5: {
      kind: "Definition",
      definitionId: "Array_e5",
      localName: "-",
      value: {
        kind: "ListExpression",
        elements: [
        ],
      },
    },
    RBRACKET: {
      kind: "Definition",
      definitionId: "RBRACKET",
      localName: "-",
      value: {
        kind: "SequenceExpression",
        expressions: [
          {
            kind: "Reference",
            definitionId: "WS",
          },
          {
            kind: "Reference",
            definitionId: "RBRACKET_e",
          },
          {
            kind: "Reference",
            definitionId: "WS",
          },
        ],
      },
    },
    RBRACKET_e: {
      kind: "Definition",
      definitionId: "RBRACKET_e",
      localName: "-",
      value: {
        kind: "StringLiteral",
        value: "]",
        concrete: true,
        abstract: false,
      },
    },
    f64: {
      kind: "Definition",
      definitionId: "f64",
      localName: "-",
      value: {
        kind: "Intrinsic",
        name: "f64",
        path: "V:/projects/oss/pen-monorepo/packages/core/penc/dist/deps/std.pen.js",
      },
    },
  },
  startDefinitionId: "start",
}
