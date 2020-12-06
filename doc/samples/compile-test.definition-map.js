const definitionMap = {
  definitionsById: {
    std: {
      kind: "Definition",
      definitionId: "std",
      localName: "std",
      value: {
        kind: "Reference",
        definitionId: "Ɱ_std",
      },
    },
    one: {
      kind: "Definition",
      definitionId: "one",
      localName: "one",
      value: {
        kind: "ParenthesisedExpression",
        expression: {
          kind: "NumericLiteral",
          value: 1,
        },
      },
    },
    two: {
      kind: "Definition",
      definitionId: "two",
      localName: "two",
      value: {
        kind: "NumericLiteral",
        value: 2,
      },
    },
    outer: {
      kind: "Definition",
      definitionId: "outer",
      localName: "outer",
      value: {
        kind: "Reference",
        definitionId: "mem",
      },
    },
    digits: {
      kind: "Definition",
      definitionId: "digits",
      localName: "digits",
      value: {
        kind: "Module",
        bindings: {
          one: {
            kind: "Reference",
            definitionId: "one",
          },
          two: {
            kind: "Reference",
            definitionId: "two",
          },
          outer: {
            kind: "Reference",
            definitionId: "outer",
          },
        },
      },
    },
    des: {
      kind: "Definition",
      definitionId: "des",
      localName: "des",
      value: {
        kind: "Reference",
        definitionId: "one",
      },
    },
    ref: {
      kind: "Definition",
      definitionId: "ref",
      localName: "ref",
      value: {
        kind: "Reference",
        definitionId: "des",
      },
    },
    mem: {
      kind: "Definition",
      definitionId: "mem",
      localName: "mem",
      value: {
        kind: "Reference",
        definitionId: "two",
      },
    },
    d: {
      kind: "Definition",
      definitionId: "d",
      localName: "d",
      value: {
        kind: "Reference",
        definitionId: "digits",
      },
    },
    xxx: {
      kind: "Definition",
      definitionId: "xxx",
      localName: "xxx",
      value: {
        kind: "Module",
        bindings: {
          d: {
            kind: "Reference",
            definitionId: "d",
          },
        },
      },
    },
    one2: {
      kind: "Definition",
      definitionId: "one2",
      localName: "one",
      value: {
        kind: "NumericLiteral",
        value: 1,
      },
    },
    start: {
      kind: "Definition",
      definitionId: "start",
      localName: "start",
      value: {
        kind: "SelectionExpression",
        expressions: [
          {
            kind: "Reference",
            definitionId: "one2",
          },
          {
            kind: "Reference",
            definitionId: "ref",
          },
          {
            kind: "Reference",
            definitionId: "mem",
          },
          {
            kind: "Reference",
            definitionId: "two",
          },
          {
            kind: "Reference",
            definitionId: "digits",
          },
        ],
      },
    },
    "Ɱ_compile_test": {
      kind: "Definition",
      definitionId: "Ɱ_compile_test",
      localName: "Ɱ_compile_test",
      value: {
        kind: "Module",
        bindings: {
          std: {
            kind: "Reference",
            definitionId: "std",
          },
          digits: {
            kind: "Reference",
            definitionId: "digits",
          },
          des: {
            kind: "Reference",
            definitionId: "des",
          },
          ref: {
            kind: "Reference",
            definitionId: "ref",
          },
          mem: {
            kind: "Reference",
            definitionId: "mem",
          },
          xxx: {
            kind: "Reference",
            definitionId: "xxx",
          },
          one: {
            kind: "Reference",
            definitionId: "one2",
          },
          start: {
            kind: "Reference",
            definitionId: "start",
          },
        },
      },
    },
    char: {
      kind: "Definition",
      definitionId: "char",
      localName: "char",
      value: {
        kind: "Intrinsic",
        name: "char",
        path: "V:/projects/oss/pen-monorepo/packages/core/penc/dist/deps/std.pen.js",
      },
    },
    f64: {
      kind: "Definition",
      definitionId: "f64",
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
      localName: "Ɱ_std",
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
  },
  startDefinitionId: "start",
}
