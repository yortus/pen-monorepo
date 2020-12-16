const ast2 = {
  module: {
    kind: "Module",
    bindings: {
      std: {
        kind: "Identifier",
        name: "Ɱ_std",
      },
      one: {
        kind: "NumericLiteral",
        value: 1,
      },
      two: {
        kind: "NumericLiteral",
        value: 2,
      },
      outer: {
        kind: "Identifier",
        name: "mem",
      },
      digits: {
        kind: "Module",
        bindings: {
          one: {
            kind: "Identifier",
            name: "one",
          },
          two: {
            kind: "Identifier",
            name: "two",
          },
          outer: {
            kind: "Identifier",
            name: "outer",
          },
        },
      },
      des: {
        kind: "Identifier",
        name: "one",
      },
      ref: {
        kind: "Identifier",
        name: "des",
      },
      mem: {
        kind: "Identifier",
        name: "two",
      },
      d: {
        kind: "Identifier",
        name: "digits",
      },
      xxx: {
        kind: "Module",
        bindings: {
          d: {
            kind: "Identifier",
            name: "d",
          },
        },
      },
      one2: {
        kind: "NumericLiteral",
        value: 1,
      },
      start2: {
        kind: "SelectionExpression",
        expressions: [
          {
            kind: "Identifier",
            name: "one2",
          },
          {
            kind: "Identifier",
            name: "ref",
          },
          {
            kind: "Identifier",
            name: "mem",
          },
          {
            kind: "Identifier",
            name: "two",
          },
          {
            kind: "Identifier",
            name: "digits",
          },
        ],
      },
      "Ɱ_compile_test": {
        kind: "Module",
        bindings: {
          std: {
            kind: "Identifier",
            name: "std",
          },
          digits: {
            kind: "Identifier",
            name: "digits",
          },
          des: {
            kind: "Identifier",
            name: "des",
          },
          ref: {
            kind: "Identifier",
            name: "ref",
          },
          mem: {
            kind: "Identifier",
            name: "mem",
          },
          xxx: {
            kind: "Identifier",
            name: "xxx",
          },
          one: {
            kind: "Identifier",
            name: "one2",
          },
          start: {
            kind: "Identifier",
            name: "start2",
          },
        },
      },
      char: {
        kind: "Intrinsic",
        name: "char",
        path: "V:/projects/oss/pen-monorepo/packages/core/penc/dist/deps/std.pen.js",
      },
      f64: {
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
            name: "char",
          },
          f64: {
            kind: "Identifier",
            name: "f64",
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
