const moduleMap = {
  modulesById: {
    "@compile_test": {
      kind: "Module",
      moduleId: "@compile_test",
      bindings: [
        {
          kind: "Binding",
          left: {
            kind: "Identifier",
            name: "std",
          },
          right: {
            kind: "Identifier",
            name: "@std",
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
            kind: "Identifier",
            name: "@compile_test_modexpr",
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
        {
          kind: "Binding",
          left: {
            kind: "Identifier",
            name: "xxx",
          },
          right: {
            kind: "Identifier",
            name: "@compile_test_modexpr2",
          },
          exported: false,
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
          exported: false,
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
          exported: false,
        },
      ],
    },
    "@compile_test_modexpr": {
      kind: "Module",
      moduleId: "@compile_test_modexpr",
      parentModuleId: "@compile_test",
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
    "@compile_test_modexpr2": {
      kind: "Module",
      moduleId: "@compile_test_modexpr2",
      parentModuleId: "@compile_test",
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
          exported: false,
        },
      ],
    },
    "@std": {
      kind: "Module",
      moduleId: "@std",
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
  startModuleId: "@compile_test",
}
