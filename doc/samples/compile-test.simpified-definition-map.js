const simplifiedDefinitionMap = {
  definitionsById: {
    start: {
      kind: "Definition",
      definitionId: "start",
      moduleId: "-",
      localName: "-",
      value: {
        kind: "SelectionExpression",
        expressions: [
          {
            kind: "Reference",
            definitionId: "des",
          },
          {
            kind: "Reference",
            definitionId: "des",
          },
          {
            kind: "Reference",
            definitionId: "mem",
          },
          {
            kind: "Reference",
            definitionId: "mem",
          },
          {
            kind: "Reference",
            definitionId: "digits",
          },
        ],
      },
    },
    des: {
      kind: "Definition",
      definitionId: "des",
      moduleId: "-",
      localName: "-",
      value: {
        kind: "NumericLiteral",
        value: 1,
      },
    },
    mem: {
      kind: "Definition",
      definitionId: "mem",
      moduleId: "-",
      localName: "-",
      value: {
        kind: "NumericLiteral",
        value: 2,
      },
    },
    digits: {
      kind: "Definition",
      definitionId: "digits",
      moduleId: "-",
      localName: "-",
      value: {
        kind: "ModuleStub",
        moduleId: "Ɱ_compile_test_modexpr",
        bindingDefinitionIds: {
          one: "des",
          two: "mem",
          outer: "mem",
        },
      },
    },
  },
  startDefinitionId: "start",
}
