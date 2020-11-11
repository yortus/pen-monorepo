const fileMap =
{
    filesByPath: {
      "V:\\projects\\oss\\pen-monorepo\\packages\\test-suite\\fixtures\\pen-src\\compile-test.pen": {
        kind: "File",
        path: "V:\\projects\\oss\\pen-monorepo\\packages\\test-suite\\fixtures\\pen-src\\compile-test.pen",
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
              path: "V:\\projects\\oss\\pen-monorepo\\packages\\core\\penc\\dist\\deps\\std.pen.js",
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
      "V:\\projects\\oss\\pen-monorepo\\packages\\core\\penc\\dist\\deps\\std.pen.js": {
        kind: "File",
        path: "V:\\projects\\oss\\pen-monorepo\\packages\\core\\penc\\dist\\deps\\std.pen.js",
        bindings: [
          {
            kind: "Binding",
            left: {
              kind: "Identifier",
              name: "char",
            },
            right: {
              kind: "ExtensionExpression",
              extensionPath: "V:\\projects\\oss\\pen-monorepo\\packages\\core\\penc\\dist\\deps\\std.pen.js",
              bindingName: "char",
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
              kind: "ExtensionExpression",
              extensionPath: "V:\\projects\\oss\\pen-monorepo\\packages\\core\\penc\\dist\\deps\\std.pen.js",
              bindingName: "f64",
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
              kind: "ExtensionExpression",
              extensionPath: "V:\\projects\\oss\\pen-monorepo\\packages\\core\\penc\\dist\\deps\\std.pen.js",
              bindingName: "i32",
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
              kind: "ExtensionExpression",
              extensionPath: "V:\\projects\\oss\\pen-monorepo\\packages\\core\\penc\\dist\\deps\\std.pen.js",
              bindingName: "memoise",
            },
            exported: true,
          },
        ],
      },
    },
    startPath: "V:\\projects\\oss\\pen-monorepo\\packages\\test-suite\\fixtures\\pen-src\\compile-test.pen",
  };
