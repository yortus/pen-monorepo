const sourceFileMap =
{
  sourceFilesByPath: {
    "V:/projects/oss/pen-monorepo/packages/test-suite/fixtures/pen-src/compile-test.pen": {
      kind: "SourceFile",
      path: "V:/projects/oss/pen-monorepo/packages/test-suite/fixtures/pen-src/compile-test.pen",
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
          exported: false,
        },
        {
          kind: "Binding",
          left: {
            kind: "Identifier",
            name: "digits",
          },
          right: {
            kind: "ModuleExpression",
            bindings: [
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
                exported: false,
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
                exported: false,
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
                exported: false,
              },
            ],
          },
          exported: false,
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
          exported: false,
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
          exported: false,
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
          exported: false,
        },
      ],
    },
    "V:/projects/oss/pen-monorepo/packages/core/penc/dist/deps/std.pen.js": {
      kind: "SourceFile",
      path: "V:/projects/oss/pen-monorepo/packages/core/penc/dist/deps/std.pen.js",
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
          exported: true,
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
          exported: true,
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
          exported: true,
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
          exported: true,
        },
      ],
    },
  },
  startPath: "V:/projects/oss/pen-monorepo/packages/test-suite/fixtures/pen-src/compile-test.pen",
};
