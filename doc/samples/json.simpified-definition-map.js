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
          definitionId: "WS_e",
        },
        quantifier: "*",
      },
    },
    WS_e: {
      kind: "Definition",
      definitionId: "WS_e",
      moduleId: "-",
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
      moduleId: "-",
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
      moduleId: "-",
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
      moduleId: "-",
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
      moduleId: "-",
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
      moduleId: "-",
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
      moduleId: "-",
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
      moduleId: "-",
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
      moduleId: "-",
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
            definitionId: "Object_e3",
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
          definitionId: "Property_e",
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
      moduleId: "-",
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
            definitionId: "CHAR_e",
          },
          {
            kind: "Reference",
            definitionId: "CHAR_e7",
          },
          {
            kind: "Reference",
            definitionId: "CHAR_e10",
          },
          {
            kind: "Reference",
            definitionId: "CHAR_e13",
          },
          {
            kind: "Reference",
            definitionId: "CHAR_e16",
          },
          {
            kind: "Reference",
            definitionId: "CHAR_e19",
          },
          {
            kind: "Reference",
            definitionId: "CHAR_e22",
          },
          {
            kind: "Reference",
            definitionId: "CHAR_e25",
          },
          {
            kind: "Reference",
            definitionId: "CHAR_e28",
          },
          {
            kind: "Reference",
            definitionId: "CHAR_e31",
          },
        ],
      },
    },
    CHAR_e: {
      kind: "Definition",
      definitionId: "CHAR_e",
      moduleId: "-",
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
      moduleId: "-",
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
      moduleId: "-",
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
      moduleId: "-",
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
      moduleId: "-",
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
          definitionId: "Ɱ_json_modexpr",
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
    "Ɱ_json_modexpr": {
      kind: "Definition",
      definitionId: "Ɱ_json_modexpr",
      moduleId: "-",
      localName: "-",
      value: {
        kind: "ModuleStub",
        moduleId: "Ɱ_json_modexpr",
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
    CHAR_e7: {
      kind: "Definition",
      definitionId: "CHAR_e7",
      moduleId: "-",
      localName: "-",
      value: {
        kind: "SequenceExpression",
        expressions: [
          {
            kind: "Reference",
            definitionId: "CHAR_e8",
          },
          {
            kind: "Reference",
            definitionId: "CHAR_e9",
          },
        ],
      },
    },
    CHAR_e8: {
      kind: "Definition",
      definitionId: "CHAR_e8",
      moduleId: "-",
      localName: "-",
      value: {
        kind: "StringLiteral",
        value: "\\\"",
        concrete: true,
        abstract: false,
      },
    },
    CHAR_e9: {
      kind: "Definition",
      definitionId: "CHAR_e9",
      moduleId: "-",
      localName: "-",
      value: {
        kind: "StringLiteral",
        value: "\"",
        concrete: false,
        abstract: true,
      },
    },
    CHAR_e10: {
      kind: "Definition",
      definitionId: "CHAR_e10",
      moduleId: "-",
      localName: "-",
      value: {
        kind: "SequenceExpression",
        expressions: [
          {
            kind: "Reference",
            definitionId: "CHAR_e11",
          },
          {
            kind: "Reference",
            definitionId: "CHAR_e12",
          },
        ],
      },
    },
    CHAR_e11: {
      kind: "Definition",
      definitionId: "CHAR_e11",
      moduleId: "-",
      localName: "-",
      value: {
        kind: "StringLiteral",
        value: "\\\\",
        concrete: true,
        abstract: false,
      },
    },
    CHAR_e12: {
      kind: "Definition",
      definitionId: "CHAR_e12",
      moduleId: "-",
      localName: "-",
      value: {
        kind: "StringLiteral",
        value: "\\",
        concrete: false,
        abstract: true,
      },
    },
    CHAR_e13: {
      kind: "Definition",
      definitionId: "CHAR_e13",
      moduleId: "-",
      localName: "-",
      value: {
        kind: "SequenceExpression",
        expressions: [
          {
            kind: "Reference",
            definitionId: "CHAR_e14",
          },
          {
            kind: "Reference",
            definitionId: "CHAR_e15",
          },
        ],
      },
    },
    CHAR_e14: {
      kind: "Definition",
      definitionId: "CHAR_e14",
      moduleId: "-",
      localName: "-",
      value: {
        kind: "StringLiteral",
        value: "\\/",
        concrete: true,
        abstract: false,
      },
    },
    CHAR_e15: {
      kind: "Definition",
      definitionId: "CHAR_e15",
      moduleId: "-",
      localName: "-",
      value: {
        kind: "StringLiteral",
        value: "/",
        concrete: false,
        abstract: true,
      },
    },
    CHAR_e16: {
      kind: "Definition",
      definitionId: "CHAR_e16",
      moduleId: "-",
      localName: "-",
      value: {
        kind: "SequenceExpression",
        expressions: [
          {
            kind: "Reference",
            definitionId: "CHAR_e17",
          },
          {
            kind: "Reference",
            definitionId: "CHAR_e18",
          },
        ],
      },
    },
    CHAR_e17: {
      kind: "Definition",
      definitionId: "CHAR_e17",
      moduleId: "-",
      localName: "-",
      value: {
        kind: "StringLiteral",
        value: "\\b",
        concrete: true,
        abstract: false,
      },
    },
    CHAR_e18: {
      kind: "Definition",
      definitionId: "CHAR_e18",
      moduleId: "-",
      localName: "-",
      value: {
        kind: "StringLiteral",
        value: "\b",
        concrete: false,
        abstract: true,
      },
    },
    CHAR_e19: {
      kind: "Definition",
      definitionId: "CHAR_e19",
      moduleId: "-",
      localName: "-",
      value: {
        kind: "SequenceExpression",
        expressions: [
          {
            kind: "Reference",
            definitionId: "CHAR_e20",
          },
          {
            kind: "Reference",
            definitionId: "CHAR_e21",
          },
        ],
      },
    },
    CHAR_e20: {
      kind: "Definition",
      definitionId: "CHAR_e20",
      moduleId: "-",
      localName: "-",
      value: {
        kind: "StringLiteral",
        value: "\\f",
        concrete: true,
        abstract: false,
      },
    },
    CHAR_e21: {
      kind: "Definition",
      definitionId: "CHAR_e21",
      moduleId: "-",
      localName: "-",
      value: {
        kind: "StringLiteral",
        value: "\f",
        concrete: false,
        abstract: true,
      },
    },
    CHAR_e22: {
      kind: "Definition",
      definitionId: "CHAR_e22",
      moduleId: "-",
      localName: "-",
      value: {
        kind: "SequenceExpression",
        expressions: [
          {
            kind: "Reference",
            definitionId: "CHAR_e23",
          },
          {
            kind: "Reference",
            definitionId: "CHAR_e24",
          },
        ],
      },
    },
    CHAR_e23: {
      kind: "Definition",
      definitionId: "CHAR_e23",
      moduleId: "-",
      localName: "-",
      value: {
        kind: "StringLiteral",
        value: "\\n",
        concrete: true,
        abstract: false,
      },
    },
    CHAR_e24: {
      kind: "Definition",
      definitionId: "CHAR_e24",
      moduleId: "-",
      localName: "-",
      value: {
        kind: "StringLiteral",
        value: "\n",
        concrete: false,
        abstract: true,
      },
    },
    CHAR_e25: {
      kind: "Definition",
      definitionId: "CHAR_e25",
      moduleId: "-",
      localName: "-",
      value: {
        kind: "SequenceExpression",
        expressions: [
          {
            kind: "Reference",
            definitionId: "CHAR_e26",
          },
          {
            kind: "Reference",
            definitionId: "CHAR_e27",
          },
        ],
      },
    },
    CHAR_e26: {
      kind: "Definition",
      definitionId: "CHAR_e26",
      moduleId: "-",
      localName: "-",
      value: {
        kind: "StringLiteral",
        value: "\\r",
        concrete: true,
        abstract: false,
      },
    },
    CHAR_e27: {
      kind: "Definition",
      definitionId: "CHAR_e27",
      moduleId: "-",
      localName: "-",
      value: {
        kind: "StringLiteral",
        value: "\r",
        concrete: false,
        abstract: true,
      },
    },
    CHAR_e28: {
      kind: "Definition",
      definitionId: "CHAR_e28",
      moduleId: "-",
      localName: "-",
      value: {
        kind: "SequenceExpression",
        expressions: [
          {
            kind: "Reference",
            definitionId: "CHAR_e29",
          },
          {
            kind: "Reference",
            definitionId: "CHAR_e30",
          },
        ],
      },
    },
    CHAR_e29: {
      kind: "Definition",
      definitionId: "CHAR_e29",
      moduleId: "-",
      localName: "-",
      value: {
        kind: "StringLiteral",
        value: "\\t",
        concrete: true,
        abstract: false,
      },
    },
    CHAR_e30: {
      kind: "Definition",
      definitionId: "CHAR_e30",
      moduleId: "-",
      localName: "-",
      value: {
        kind: "StringLiteral",
        value: "\t",
        concrete: false,
        abstract: true,
      },
    },
    CHAR_e31: {
      kind: "Definition",
      definitionId: "CHAR_e31",
      moduleId: "-",
      localName: "-",
      value: {
        kind: "SequenceExpression",
        expressions: [
          {
            kind: "Reference",
            definitionId: "CHAR_e32",
          },
          {
            kind: "Reference",
            definitionId: "CHAR_e33",
          },
        ],
      },
    },
    CHAR_e32: {
      kind: "Definition",
      definitionId: "CHAR_e32",
      moduleId: "-",
      localName: "-",
      value: {
        kind: "StringLiteral",
        value: "\\u",
        concrete: true,
        abstract: false,
      },
    },
    CHAR_e33: {
      kind: "Definition",
      definitionId: "CHAR_e33",
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
          definitionId: "Ɱ_json_modexpr2",
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
    "Ɱ_json_modexpr2": {
      kind: "Definition",
      definitionId: "Ɱ_json_modexpr2",
      moduleId: "-",
      localName: "-",
      value: {
        kind: "ModuleStub",
        moduleId: "Ɱ_json_modexpr2",
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
    Property_e: {
      kind: "Definition",
      definitionId: "Property_e",
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
      moduleId: "-",
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
      moduleId: "-",
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
      moduleId: "-",
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
      moduleId: "-",
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
      moduleId: "-",
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
            definitionId: "Array_e3",
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
    Array_e3: {
      kind: "Definition",
      definitionId: "Array_e3",
      moduleId: "-",
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
    Array_e5: {
      kind: "Definition",
      definitionId: "Array_e5",
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
