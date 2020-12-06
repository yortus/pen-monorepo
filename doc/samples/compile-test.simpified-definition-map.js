const simplifiedDefinitionMap = {
  definitionsById: {
    start: {
      kind: "Definition",
      definitionId: "start",
      localName: "-",
      value: {
        kind: "SelectionExpression",
        expressions: [
          {
            kind: "Reference",
            definitionId: "one",
          },
          {
            kind: "Reference",
            definitionId: "one",
          },
          {
            kind: "Reference",
            definitionId: "two",
          },
          {
            kind: "Reference",
            definitionId: "two",
          },
          {
            kind: "Reference",
            definitionId: "digits",
          },
        ],
      },
    },
    one: {
      kind: "Definition",
      definitionId: "one",
      localName: "-",
      value: {
        kind: "NumericLiteral",
        value: 1,
      },
    },
    two: {
      kind: "Definition",
      definitionId: "two",
      localName: "-",
      value: {
        kind: "NumericLiteral",
        value: 2,
      },
    },
    digits: {
      kind: "Definition",
      definitionId: "digits",
      localName: "-",
      value: {
        kind: "Module",
        bindings: {
          one: {
            kind: "Reference",
            definitionId: "one",
          },
          two: {
            kind: "Reference",
            definitionId: "two",
          },
          outer: {
            kind: "Reference",
            definitionId: "two",
          },
        },
      },
    },
  },
  startDefinitionId: "start",
}
