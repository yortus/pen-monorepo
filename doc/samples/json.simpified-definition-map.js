const simplifiedDefinitionMap = {
  definitionsById: {
    start: {
      kind: "Definition",
      definitionId: "start",
      moduleId: "-",
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
      moduleId: "-",
      localName: "-",
      value: {
        kind: "QuantifiedExpression",
        expression: {
          kind: "Reference",
          definitionId: "e",
        },
        quantifier: "*",
      },
    },
    e: {
      kind: "Definition",
      definitionId: "e",
      moduleId: "-",
      localName: "-",
      value: {
        kind: "SelectionExpression",
        expressions: [
          {
            kind: "Reference",
            definitionId: "e2",
          },
          {
            kind: "Reference",
            definitionId: "e3",
          },
          {
            kind: "Reference",
            definitionId: "e4",
          },
          {
            kind: "Reference",
            definitionId: "e5",
          },
        ],
      },
    },
    e2: {
      kind: "Definition",
      definitionId: "e2",
      moduleId: "-",
      localName: "-",
      value: {
        kind: "StringLiteral",
        value: " ",
        concrete: true,
        abstract: false,
      },
    },
    e3: {
      kind: "Definition",
      definitionId: "e3",
      moduleId: "-",
      localName: "-",
      value: {
        kind: "StringLiteral",
        value: "\t",
        concrete: true,
        abstract: false,
      },
    },
    e4: {
      kind: "Definition",
      definitionId: "e4",
      moduleId: "-",
      localName: "-",
      value: {
        kind: "StringLiteral",
        value: "\n",
        concrete: true,
        abstract: false,
      },
    },
    e5: {
      kind: "Definition",
      definitionId: "e5",
      moduleId: "-",
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
      moduleId: "-",
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
      moduleId: "-",
      localName: "-",
      value: {
        kind: "SequenceExpression",
        expressions: [
          {
            kind: "Reference",
            definitionId: "e6",
          },
          {
            kind: "Reference",
            definitionId: "e7",
          },
        ],
      },
    },
    e6: {
      kind: "Definition",
      definitionId: "e6",
      moduleId: "-",
      localName: "-",
      value: {
        kind: "StringLiteral",
        value: "false",
        concrete: true,
        abstract: false,
      },
    },
    e7: {
      kind: "Definition",
      definitionId: "e7",
      moduleId: "-",
      localName: "-",
      value: {
        kind: "BooleanLiteral",
        value: false,
      },
    },
    Null: {
      kind: "Definition",
      definitionId: "Null",
      moduleId: "-",
      localName: "-",
      value: {
        kind: "SequenceExpression",
        expressions: [
          {
            kind: "Reference",
            definitionId: "e8",
          },
          {
            kind: "Reference",
            definitionId: "e9",
          },
        ],
      },
    },
    e8: {
      kind: "Definition",
      definitionId: "e8",
      moduleId: "-",
      localName: "-",
      value: {
        kind: "StringLiteral",
        value: "null",
        concrete: true,
        abstract: false,
      },
    },
    e9: {
      kind: "Definition",
      definitionId: "e9",
      moduleId: "-",
      localName: "-",
      value: {
        kind: "NullLiteral",
        value: null,
      },
    },
    True: {
      kind: "Definition",
      definitionId: "True",
      moduleId: "-",
      localName: "-",
      value: {
        kind: "SequenceExpression",
        expressions: [
          {
            kind: "Reference",
            definitionId: "e10",
          },
          {
            kind: "Reference",
            definitionId: "e11",
          },
        ],
      },
    },
    e10: {
      kind: "Definition",
      definitionId: "e10",
      moduleId: "-",
      localName: "-",
      value: {
        kind: "StringLiteral",
        value: "true",
        concrete: true,
        abstract: false,
      },
    },
    e11: {
      kind: "Definition",
      definitionId: "e11",
      moduleId: "-",
      localName: "-",
      value: {
        kind: "BooleanLiteral",
        value: true,
      },
    },
    Object: {
      kind: "Definition",
      definitionId: "Object",
      moduleId: "-",
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
            definitionId: "e13",
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
      moduleId: "-",
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
            definitionId: "e12",
          },
          {
            kind: "Reference",
            definitionId: "WS",
          },
        ],
      },
    },
    e12: {
      kind: "Definition",
      definitionId: "e12",
      moduleId: "-",
      localName: "-",
      value: {
        kind: "StringLiteral",
        value: "{",
        concrete: true,
        abstract: false,
      },
    },
    e13: {
      kind: "Definition",
      definitionId: "e13",
      moduleId: "-",
      localName: "-",
      value: {
        kind: "SelectionExpression",
        expressions: [
          {
            kind: "Reference",
            definitionId: "e14",
          },
          {
            kind: "Reference",
            definitionId: "e54",
          },
        ],
      },
    },
    e14: {
      kind: "Definition",
      definitionId: "e14",
      moduleId: "-",
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
            definitionId: "e51",
          },
        ],
      },
    },
    Property: {
      kind: "Definition",
      definitionId: "Property",
      moduleId: "-",
      localName: "-",
      value: {
        kind: "FieldExpression",
        name: {
          kind: "Reference",
          definitionId: "String",
        },
        value: {
          kind: "Reference",
          definitionId: "e49",
        },
      },
    },
    String: {
      kind: "Definition",
      definitionId: "String",
      moduleId: "-",
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
            definitionId: "e15",
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
      moduleId: "-",
      localName: "-",
      value: {
        kind: "StringLiteral",
        value: "\"",
        concrete: true,
        abstract: false,
      },
    },
    e15: {
      kind: "Definition",
      definitionId: "e15",
      moduleId: "-",
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
      moduleId: "-",
      localName: "-",
      value: {
        kind: "SelectionExpression",
        expressions: [
          {
            kind: "Reference",
            definitionId: "e16",
          },
          {
            kind: "Reference",
            definitionId: "e22",
          },
          {
            kind: "Reference",
            definitionId: "e25",
          },
          {
            kind: "Reference",
            definitionId: "e28",
          },
          {
            kind: "Reference",
            definitionId: "e31",
          },
          {
            kind: "Reference",
            definitionId: "e34",
          },
          {
            kind: "Reference",
            definitionId: "e37",
          },
          {
            kind: "Reference",
            definitionId: "e40",
          },
          {
            kind: "Reference",
            definitionId: "e43",
          },
          {
            kind: "Reference",
            definitionId: "e46",
          },
        ],
      },
    },
    e16: {
      kind: "Definition",
      definitionId: "e16",
      moduleId: "-",
      localName: "-",
      value: {
        kind: "SequenceExpression",
        expressions: [
          {
            kind: "Reference",
            definitionId: "e17",
          },
          {
            kind: "Reference",
            definitionId: "e19",
          },
          {
            kind: "Reference",
            definitionId: "e21",
          },
        ],
      },
    },
    e17: {
      kind: "Definition",
      definitionId: "e17",
      moduleId: "-",
      localName: "-",
      value: {
        kind: "NotExpression",
        expression: {
          kind: "Reference",
          definitionId: "e18",
        },
      },
    },
    e18: {
      kind: "Definition",
      definitionId: "e18",
      moduleId: "-",
      localName: "-",
      value: {
        kind: "StringLiteral",
        value: "\\",
        concrete: false,
        abstract: false,
      },
    },
    e19: {
      kind: "Definition",
      definitionId: "e19",
      moduleId: "-",
      localName: "-",
      value: {
        kind: "NotExpression",
        expression: {
          kind: "Reference",
          definitionId: "e20",
        },
      },
    },
    e20: {
      kind: "Definition",
      definitionId: "e20",
      moduleId: "-",
      localName: "-",
      value: {
        kind: "StringLiteral",
        value: "\"",
        concrete: false,
        abstract: false,
      },
    },
    e21: {
      kind: "Definition",
      definitionId: "e21",
      moduleId: "-",
      localName: "-",
      value: {
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
    },
    char: {
      kind: "Definition",
      definitionId: "char",
      moduleId: "-",
      localName: "-",
      value: {
        kind: "Intrinsic",
        name: "char",
        path: "V:/projects/oss/pen-monorepo/packages/core/penc/dist/deps/std.pen.js",
      },
    },
    "@json_modexpr": {
      kind: "Definition",
      definitionId: "@json_modexpr",
      moduleId: "-",
      localName: "-",
      value: {
        kind: "ModuleStub",
        moduleId: "@json_modexpr",
        bindingDefinitionIds: {
          min: "min",
          max: "max",
        },
      },
    },
    min: {
      kind: "Definition",
      definitionId: "min",
      moduleId: "-",
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
      moduleId: "-",
      localName: "-",
      value: {
        kind: "StringLiteral",
        value: "￿",
        concrete: false,
        abstract: false,
      },
    },
    e22: {
      kind: "Definition",
      definitionId: "e22",
      moduleId: "-",
      localName: "-",
      value: {
        kind: "SequenceExpression",
        expressions: [
          {
            kind: "Reference",
            definitionId: "e23",
          },
          {
            kind: "Reference",
            definitionId: "e24",
          },
        ],
      },
    },
    e23: {
      kind: "Definition",
      definitionId: "e23",
      moduleId: "-",
      localName: "-",
      value: {
        kind: "StringLiteral",
        value: "\\\"",
        concrete: true,
        abstract: false,
      },
    },
    e24: {
      kind: "Definition",
      definitionId: "e24",
      moduleId: "-",
      localName: "-",
      value: {
        kind: "StringLiteral",
        value: "\"",
        concrete: false,
        abstract: true,
      },
    },
    e25: {
      kind: "Definition",
      definitionId: "e25",
      moduleId: "-",
      localName: "-",
      value: {
        kind: "SequenceExpression",
        expressions: [
          {
            kind: "Reference",
            definitionId: "e26",
          },
          {
            kind: "Reference",
            definitionId: "e27",
          },
        ],
      },
    },
    e26: {
      kind: "Definition",
      definitionId: "e26",
      moduleId: "-",
      localName: "-",
      value: {
        kind: "StringLiteral",
        value: "\\\\",
        concrete: true,
        abstract: false,
      },
    },
    e27: {
      kind: "Definition",
      definitionId: "e27",
      moduleId: "-",
      localName: "-",
      value: {
        kind: "StringLiteral",
        value: "\\",
        concrete: false,
        abstract: true,
      },
    },
    e28: {
      kind: "Definition",
      definitionId: "e28",
      moduleId: "-",
      localName: "-",
      value: {
        kind: "SequenceExpression",
        expressions: [
          {
            kind: "Reference",
            definitionId: "e29",
          },
          {
            kind: "Reference",
            definitionId: "e30",
          },
        ],
      },
    },
    e29: {
      kind: "Definition",
      definitionId: "e29",
      moduleId: "-",
      localName: "-",
      value: {
        kind: "StringLiteral",
        value: "\\/",
        concrete: true,
        abstract: false,
      },
    },
    e30: {
      kind: "Definition",
      definitionId: "e30",
      moduleId: "-",
      localName: "-",
      value: {
        kind: "StringLiteral",
        value: "/",
        concrete: false,
        abstract: true,
      },
    },
    e31: {
      kind: "Definition",
      definitionId: "e31",
      moduleId: "-",
      localName: "-",
      value: {
        kind: "SequenceExpression",
        expressions: [
          {
            kind: "Reference",
            definitionId: "e32",
          },
          {
            kind: "Reference",
            definitionId: "e33",
          },
        ],
      },
    },
    e32: {
      kind: "Definition",
      definitionId: "e32",
      moduleId: "-",
      localName: "-",
      value: {
        kind: "StringLiteral",
        value: "\\b",
        concrete: true,
        abstract: false,
      },
    },
    e33: {
      kind: "Definition",
      definitionId: "e33",
      moduleId: "-",
      localName: "-",
      value: {
        kind: "StringLiteral",
        value: "\b",
        concrete: false,
        abstract: true,
      },
    },
    e34: {
      kind: "Definition",
      definitionId: "e34",
      moduleId: "-",
      localName: "-",
      value: {
        kind: "SequenceExpression",
        expressions: [
          {
            kind: "Reference",
            definitionId: "e35",
          },
          {
            kind: "Reference",
            definitionId: "e36",
          },
        ],
      },
    },
    e35: {
      kind: "Definition",
      definitionId: "e35",
      moduleId: "-",
      localName: "-",
      value: {
        kind: "StringLiteral",
        value: "\\f",
        concrete: true,
        abstract: false,
      },
    },
    e36: {
      kind: "Definition",
      definitionId: "e36",
      moduleId: "-",
      localName: "-",
      value: {
        kind: "StringLiteral",
        value: "\f",
        concrete: false,
        abstract: true,
      },
    },
    e37: {
      kind: "Definition",
      definitionId: "e37",
      moduleId: "-",
      localName: "-",
      value: {
        kind: "SequenceExpression",
        expressions: [
          {
            kind: "Reference",
            definitionId: "e38",
          },
          {
            kind: "Reference",
            definitionId: "e39",
          },
        ],
      },
    },
    e38: {
      kind: "Definition",
      definitionId: "e38",
      moduleId: "-",
      localName: "-",
      value: {
        kind: "StringLiteral",
        value: "\\n",
        concrete: true,
        abstract: false,
      },
    },
    e39: {
      kind: "Definition",
      definitionId: "e39",
      moduleId: "-",
      localName: "-",
      value: {
        kind: "StringLiteral",
        value: "\n",
        concrete: false,
        abstract: true,
      },
    },
    e40: {
      kind: "Definition",
      definitionId: "e40",
      moduleId: "-",
      localName: "-",
      value: {
        kind: "SequenceExpression",
        expressions: [
          {
            kind: "Reference",
            definitionId: "e41",
          },
          {
            kind: "Reference",
            definitionId: "e42",
          },
        ],
      },
    },
    e41: {
      kind: "Definition",
      definitionId: "e41",
      moduleId: "-",
      localName: "-",
      value: {
        kind: "StringLiteral",
        value: "\\r",
        concrete: true,
        abstract: false,
      },
    },
    e42: {
      kind: "Definition",
      definitionId: "e42",
      moduleId: "-",
      localName: "-",
      value: {
        kind: "StringLiteral",
        value: "\r",
        concrete: false,
        abstract: true,
      },
    },
    e43: {
      kind: "Definition",
      definitionId: "e43",
      moduleId: "-",
      localName: "-",
      value: {
        kind: "SequenceExpression",
        expressions: [
          {
            kind: "Reference",
            definitionId: "e44",
          },
          {
            kind: "Reference",
            definitionId: "e45",
          },
        ],
      },
    },
    e44: {
      kind: "Definition",
      definitionId: "e44",
      moduleId: "-",
      localName: "-",
      value: {
        kind: "StringLiteral",
        value: "\\t",
        concrete: true,
        abstract: false,
      },
    },
    e45: {
      kind: "Definition",
      definitionId: "e45",
      moduleId: "-",
      localName: "-",
      value: {
        kind: "StringLiteral",
        value: "\t",
        concrete: false,
        abstract: true,
      },
    },
    e46: {
      kind: "Definition",
      definitionId: "e46",
      moduleId: "-",
      localName: "-",
      value: {
        kind: "SequenceExpression",
        expressions: [
          {
            kind: "Reference",
            definitionId: "e47",
          },
          {
            kind: "Reference",
            definitionId: "e48",
          },
        ],
      },
    },
    e47: {
      kind: "Definition",
      definitionId: "e47",
      moduleId: "-",
      localName: "-",
      value: {
        kind: "StringLiteral",
        value: "\\u",
        concrete: true,
        abstract: false,
      },
    },
    e48: {
      kind: "Definition",
      definitionId: "e48",
      moduleId: "-",
      localName: "-",
      value: {
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
    },
    unicode: {
      kind: "Definition",
      definitionId: "unicode",
      moduleId: "-",
      localName: "-",
      value: {
        kind: "Intrinsic",
        name: "unicode",
        path: "V:/projects/oss/pen-monorepo/packages/core/penc/dist/deps/experiments.pen.js",
      },
    },
    "@json_modexpr2": {
      kind: "Definition",
      definitionId: "@json_modexpr2",
      moduleId: "-",
      localName: "-",
      value: {
        kind: "ModuleStub",
        moduleId: "@json_modexpr2",
        bindingDefinitionIds: {
          base: "base",
          minDigits: "minDigits",
          maxDigits: "minDigits",
        },
      },
    },
    base: {
      kind: "Definition",
      definitionId: "base",
      moduleId: "-",
      localName: "-",
      value: {
        kind: "NumericLiteral",
        value: 16,
      },
    },
    minDigits: {
      kind: "Definition",
      definitionId: "minDigits",
      moduleId: "-",
      localName: "-",
      value: {
        kind: "NumericLiteral",
        value: 4,
      },
    },
    e49: {
      kind: "Definition",
      definitionId: "e49",
      moduleId: "-",
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
      moduleId: "-",
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
            definitionId: "e50",
          },
          {
            kind: "Reference",
            definitionId: "WS",
          },
        ],
      },
    },
    e50: {
      kind: "Definition",
      definitionId: "e50",
      moduleId: "-",
      localName: "-",
      value: {
        kind: "StringLiteral",
        value: ":",
        concrete: true,
        abstract: false,
      },
    },
    e51: {
      kind: "Definition",
      definitionId: "e51",
      moduleId: "-",
      localName: "-",
      value: {
        kind: "QuantifiedExpression",
        expression: {
          kind: "Reference",
          definitionId: "e52",
        },
        quantifier: "*",
      },
    },
    e52: {
      kind: "Definition",
      definitionId: "e52",
      moduleId: "-",
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
      moduleId: "-",
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
            definitionId: "e53",
          },
          {
            kind: "Reference",
            definitionId: "WS",
          },
        ],
      },
    },
    e53: {
      kind: "Definition",
      definitionId: "e53",
      moduleId: "-",
      localName: "-",
      value: {
        kind: "StringLiteral",
        value: ",",
        concrete: true,
        abstract: false,
      },
    },
    e54: {
      kind: "Definition",
      definitionId: "e54",
      moduleId: "-",
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
      moduleId: "-",
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
            definitionId: "e55",
          },
          {
            kind: "Reference",
            definitionId: "WS",
          },
        ],
      },
    },
    e55: {
      kind: "Definition",
      definitionId: "e55",
      moduleId: "-",
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
      moduleId: "-",
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
            definitionId: "e57",
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
      moduleId: "-",
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
            definitionId: "e56",
          },
          {
            kind: "Reference",
            definitionId: "WS",
          },
        ],
      },
    },
    e56: {
      kind: "Definition",
      definitionId: "e56",
      moduleId: "-",
      localName: "-",
      value: {
        kind: "StringLiteral",
        value: "[",
        concrete: true,
        abstract: false,
      },
    },
    e57: {
      kind: "Definition",
      definitionId: "e57",
      moduleId: "-",
      localName: "-",
      value: {
        kind: "SelectionExpression",
        expressions: [
          {
            kind: "Reference",
            definitionId: "e58",
          },
          {
            kind: "Reference",
            definitionId: "e61",
          },
        ],
      },
    },
    e58: {
      kind: "Definition",
      definitionId: "e58",
      moduleId: "-",
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
            definitionId: "e59",
          },
        ],
      },
    },
    Element: {
      kind: "Definition",
      definitionId: "Element",
      moduleId: "-",
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
    e59: {
      kind: "Definition",
      definitionId: "e59",
      moduleId: "-",
      localName: "-",
      value: {
        kind: "QuantifiedExpression",
        expression: {
          kind: "Reference",
          definitionId: "e60",
        },
        quantifier: "*",
      },
    },
    e60: {
      kind: "Definition",
      definitionId: "e60",
      moduleId: "-",
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
    e61: {
      kind: "Definition",
      definitionId: "e61",
      moduleId: "-",
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
      moduleId: "-",
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
            definitionId: "e62",
          },
          {
            kind: "Reference",
            definitionId: "WS",
          },
        ],
      },
    },
    e62: {
      kind: "Definition",
      definitionId: "e62",
      moduleId: "-",
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
      moduleId: "-",
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
