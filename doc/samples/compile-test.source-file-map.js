const sourceFileMap = {
  sourceFilesByPath: {
    "V:/projects/oss/pen-monorepo/packages/test-suite/fixtures/pen-src/compile-test.pen": {
      bindings: [
        {
          kind: "Binding",
          left: {
            kind: "Identifier",
            name: "std",
          },
          right: {
            kind: "ImportExpression",
            moduleSpecifier: "std",
          },
        },
        {
          kind: "Binding",
          left: {
            kind: "Identifier",
            name: "digits",
          },
          right: {
            kind: "Module",
            bindings: [
              {
                kind: "Binding",
                left: {
                  kind: "Identifier",
                  name: "one",
                },
                right: {
                  kind: "ParenthesisedExpression",
                  expression: {
                    kind: "NumericLiteral",
                    value: 1,
                  },
                },
              },
              {
                kind: "Binding",
                left: {
                  kind: "Identifier",
                  name: "two",
                },
                right: {
                  kind: "NumericLiteral",
                  value: 2,
                },
              },
              {
                kind: "Binding",
                left: {
                  kind: "Identifier",
                  name: "outer",
                },
                right: {
                  kind: "Identifier",
                  name: "mem",
                },
              },
            ],
          },
        },
        {
          kind: "Binding",
          left: {
            kind: "ModulePattern",
            names: [
              {
                name: "one",
                alias: "des",
              },
            ],
          },
          right: {
            kind: "Identifier",
            name: "digits",
          },
        },
        {
          kind: "Binding",
          left: {
            kind: "Identifier",
            name: "ref",
          },
          right: {
            kind: "Identifier",
            name: "des",
          },
        },
        {
          kind: "Binding",
          left: {
            kind: "Identifier",
            name: "mem",
          },
          right: {
            kind: "MemberExpression",
            module: {
              kind: "Identifier",
              name: "digits",
            },
            member: {
              kind: "Identifier",
              name: "two",
            },
          },
        },
        {
          kind: "Binding",
          left: {
            kind: "Identifier",
            name: "xxx",
          },
          right: {
            kind: "Module",
            bindings: [
              {
                kind: "Binding",
                left: {
                  kind: "Identifier",
                  name: "d",
                },
                right: {
                  kind: "Identifier",
                  name: "digits",
                },
              },
            ],
          },
        },
        {
          kind: "Binding",
          left: {
            kind: "Identifier",
            name: "one",
          },
          right: {
            kind: "NumericLiteral",
            value: 1,
          },
        },
        {
          kind: "Binding",
          left: {
            kind: "Identifier",
            name: "start",
          },
          right: {
            kind: "SelectionExpression",
            expressions: [
              {
                kind: "Identifier",
                name: "one",
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
                kind: "MemberExpression",
                module: {
                  kind: "MemberExpression",
                  module: {
                    kind: "Identifier",
                    name: "xxx",
                  },
                  member: {
                    kind: "Identifier",
                    name: "d",
                  },
                },
                member: {
                  kind: "Identifier",
                  name: "two",
                },
              },
              {
                kind: "Identifier",
                name: "digits",
              },
            ],
          },
        },
      ],
    },
    "V:/projects/oss/pen-monorepo/packages/core/penc/dist/deps/std.pen.js": {
      bindings: [
        {
          kind: "Binding",
          left: {
            kind: "Identifier",
            name: "char",
          },
          right: {
            kind: "Intrinsic",
            name: "char",
            path: "V:/projects/oss/pen-monorepo/packages/core/penc/dist/deps/std.pen.js",
          },
        },
        {
          kind: "Binding",
          left: {
            kind: "Identifier",
            name: "f64",
          },
          right: {
            kind: "Intrinsic",
            name: "f64",
            path: "V:/projects/oss/pen-monorepo/packages/core/penc/dist/deps/std.pen.js",
          },
        },
        {
          kind: "Binding",
          left: {
            kind: "Identifier",
            name: "i32",
          },
          right: {
            kind: "Intrinsic",
            name: "i32",
            path: "V:/projects/oss/pen-monorepo/packages/core/penc/dist/deps/std.pen.js",
          },
        },
        {
          kind: "Binding",
          left: {
            kind: "Identifier",
            name: "memoise",
          },
          right: {
            kind: "Intrinsic",
            name: "memoise",
            path: "V:/projects/oss/pen-monorepo/packages/core/penc/dist/deps/std.pen.js",
          },
        },
      ],
    },
  },
  startPath: "V:/projects/oss/pen-monorepo/packages/test-suite/fixtures/pen-src/compile-test.pen",
}
