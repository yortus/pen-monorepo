const definitions =
[
    {
      kind: "Definition",
      definitionId: 0,
      localName: "digits",
      globalName: undefined,
      expression: {
        kind: "ImportExpression",
        moduleSpecifier: "internal://1",
        moduleId: "internal://1",
      },
    },
    {
      kind: "Definition",
      definitionId: 1,
      localName: "des",
      globalName: undefined,
      expression: {
        kind: "MemberExpression",
        module: {
          kind: "NameExpression",
          name: "digits",
        },
        bindingName: "one",
      },
    },
    {
      kind: "Definition",
      definitionId: 2,
      localName: "ref",
      globalName: undefined,
      expression: {
        kind: "NameExpression",
        name: "des",
      },
    },
    {
      kind: "Definition",
      definitionId: 3,
      localName: "mem",
      globalName: undefined,
      expression: {
        kind: "MemberExpression",
        module: {
          kind: "NameExpression",
          name: "digits",
        },
        bindingName: "two",
      },
    },
    {
      kind: "Definition",
      definitionId: 4,
      localName: "one",
      globalName: undefined,
      expression: {
        kind: "NumericLiteralExpression",
        value: 1,
      },
    },
    {
      kind: "Definition",
      definitionId: 5,
      localName: "two",
      globalName: undefined,
      expression: {
        kind: "NumericLiteralExpression",
        value: 2,
      },
    },
  ];

const refExprs =
[
    {
      name: "digits",
      moduleId: "file://V:\\projects\\oss\\pen-monorepo\\packages\\test-suite\\fixtures\\pen-src\\compile-test.pen",
      ref: {
        kind: "ReferenceExpression",
        definitionId: 0,
      },
    },
    {
      name: "des",
      moduleId: "file://V:\\projects\\oss\\pen-monorepo\\packages\\test-suite\\fixtures\\pen-src\\compile-test.pen",
      ref: {
        kind: "ReferenceExpression",
        definitionId: 1,
      },
    },
    {
      name: "digits",
      moduleId: "file://V:\\projects\\oss\\pen-monorepo\\packages\\test-suite\\fixtures\\pen-src\\compile-test.pen",
      ref: {
        kind: "ReferenceExpression",
        definitionId: 0,
      },
    },
  ];

