const moduleMap = {
  modulesById: {
    "Ɱ_compile_test": {
      kind: "Module",
      moduleId: "Ɱ_compile_test",
      bindings: {
        std: {
          kind: "Identifier",
          name: "Ɱ_std",
        },
        digits: {
          kind: "Identifier",
          name: "Ɱ_compile_test_modexpr",
        },
        des: {
          kind: "MemberExpression",
          module: {
            kind: "Identifier",
            name: "digits",
          },
          member: {
            kind: "Identifier",
            name: "one",
          },
        },
        ref: {
          kind: "Identifier",
          name: "des",
        },
        mem: {
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
        xxx: {
          kind: "Identifier",
          name: "Ɱ_compile_test_modexpr2",
        },
        one: {
          kind: "NumericLiteral",
          value: 1,
        },
        start: {
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
    },
    "Ɱ_compile_test_modexpr": {
      kind: "Module",
      moduleId: "Ɱ_compile_test_modexpr",
      bindings: {
        one: {
          kind: "ParenthesisedExpression",
          expression: {
            kind: "NumericLiteral",
            value: 1,
          },
        },
        two: {
          kind: "NumericLiteral",
          value: 2,
        },
        outer: {
          kind: "Identifier",
          name: "mem",
        },
      },
    },
    "Ɱ_compile_test_modexpr2": {
      kind: "Module",
      moduleId: "Ɱ_compile_test_modexpr2",
      bindings: {
        d: {
          kind: "Identifier",
          name: "digits",
        },
      },
    },
    "Ɱ_std": {
      kind: "Module",
      moduleId: "Ɱ_std",
      bindings: {
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
      },
    },
  },
  parentModuleIdsByModuleId: {
    "Ɱ_compile_test_modexpr": "Ɱ_compile_test",
    "Ɱ_compile_test_modexpr2": "Ɱ_compile_test",
  },
  startModuleId: "Ɱ_compile_test",
}
