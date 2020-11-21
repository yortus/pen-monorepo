const definitions =
[
  {
    kind: "Definition",
    definitionId: 0,
    moduleId: "@@root",
    localName: "@compile_test",
    value: {
      kind: "Module",
      moduleId: "@compile_test",
    },
  },
  {
    kind: "Definition",
    definitionId: 1,
    moduleId: "@@root",
    localName: "@compile_test_modexpr",
    value: {
      kind: "Module",
      moduleId: "@compile_test_modexpr",
    },
  },
  {
    kind: "Definition",
    definitionId: 2,
    moduleId: "@@root",
    localName: "@compile_test_modexpr2",
    value: {
      kind: "Module",
      moduleId: "@compile_test_modexpr2",
    },
  },
  {
    kind: "Definition",
    definitionId: 3,
    moduleId: "@@root",
    localName: "@std",
    value: {
      kind: "Module",
      moduleId: "@std",
    },
  },
  {
    kind: "Definition",
    definitionId: 4,
    moduleId: "@compile_test",
    localName: "std",
    value: {
      kind: "Reference",
      definitionId: 3,
    },
  },
  {
    kind: "Definition",
    definitionId: 5,
    moduleId: "@compile_test",
    localName: "digits",
    value: {
      kind: "Reference",
      definitionId: 1,
    },
  },
  {
    kind: "Definition",
    definitionId: 6,
    moduleId: "@compile_test",
    localName: "des",
    value: {
      kind: "Reference",
      definitionId: 11,
    },
  },
  {
    kind: "Definition",
    definitionId: 7,
    moduleId: "@compile_test",
    localName: "ref",
    value: {
      kind: "Reference",
      definitionId: 6,
    },
  },
  {
    kind: "Definition",
    definitionId: 8,
    moduleId: "@compile_test",
    localName: "mem",
    value: {
      kind: "Reference",
      definitionId: 12,
    },
  },
  {
    kind: "Definition",
    definitionId: 9,
    moduleId: "@compile_test",
    localName: "xxx",
    value: {
      kind: "Reference",
      definitionId: 2,
    },
  },
  {
    kind: "Definition",
    definitionId: 10,
    moduleId: "@compile_test",
    localName: "yyy",
    value: {
      kind: "Reference",
      definitionId: 12,
    },
  },
  {
    kind: "Definition",
    definitionId: 11,
    moduleId: "@compile_test_modexpr",
    localName: "one",
    value: {
      kind: "ParenthesisedExpression",
      expression: {
        kind: "NumericLiteral",
        value: 1,
      },
    },
  },
  {
    kind: "Definition",
    definitionId: 12,
    moduleId: "@compile_test_modexpr",
    localName: "two",
    value: {
      kind: "NumericLiteral",
      value: 2,
    },
  },
  {
    kind: "Definition",
    definitionId: 13,
    moduleId: "@compile_test_modexpr",
    localName: "outer",
    value: {
      kind: "Reference",
      definitionId: 8,
    },
  },
  {
    kind: "Definition",
    definitionId: 14,
    moduleId: "@compile_test_modexpr2",
    localName: "d",
    value: {
      kind: "Reference",
      definitionId: 5,
    },
  },
  {
    kind: "Definition",
    definitionId: 15,
    moduleId: "@std",
    localName: "char",
    value: {
      kind: "Intrinsic",
      name: "char",
      path: "V:/projects/oss/pen-monorepo/packages/core/penc/dist/deps/std.pen.js",
    },
  },
  {
    kind: "Definition",
    definitionId: 16,
    moduleId: "@std",
    localName: "f64",
    value: {
      kind: "Intrinsic",
      name: "f64",
      path: "V:/projects/oss/pen-monorepo/packages/core/penc/dist/deps/std.pen.js",
    },
  },
  {
    kind: "Definition",
    definitionId: 17,
    moduleId: "@std",
    localName: "i32",
    value: {
      kind: "Intrinsic",
      name: "i32",
      path: "V:/projects/oss/pen-monorepo/packages/core/penc/dist/deps/std.pen.js",
    },
  },
  {
    kind: "Definition",
    definitionId: 18,
    moduleId: "@std",
    localName: "memoise",
    value: {
      kind: "Intrinsic",
      name: "memoise",
      path: "V:/projects/oss/pen-monorepo/packages/core/penc/dist/deps/std.pen.js",
    },
  },
];

const refExprs =
[
    {
      name: "digits",
      moduleId: "file://V:\\projects\\oss\\pen-monorepo\\packages\\test-suite\\fixtures\\pen-src\\compile-test.pen",
      ref: {
        kind: "Reference",
        definitionId: 0,
      },
    },
    {
      name: "des",
      moduleId: "file://V:\\projects\\oss\\pen-monorepo\\packages\\test-suite\\fixtures\\pen-src\\compile-test.pen",
      ref: {
        kind: "Reference",
        definitionId: 1,
      },
    },
    {
      name: "digits",
      moduleId: "file://V:\\projects\\oss\\pen-monorepo\\packages\\test-suite\\fixtures\\pen-src\\compile-test.pen",
      ref: {
        kind: "Reference",
        definitionId: 0,
      },
    },
  ];

