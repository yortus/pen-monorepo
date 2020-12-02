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
        kind: "Module",
        bindings: {
          one: {
            kind: "Reference",
            definitionId: "des",
          },
          two: {
            kind: "Reference",
            definitionId: "mem",
          },
          outer: {
            kind: "Reference",
            definitionId: "mem",
          },
        },
      },
    },
  },
  startDefinitionId: "start",
}
