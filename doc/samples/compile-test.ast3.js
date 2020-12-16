const ast3 = {
  module: {
    kind: "Module",
    bindings: {
      start: {
        kind: "SelectionExpression",
        expressions: [
          {
            kind: "Identifier",
            name: "one",
          },
          {
            kind: "Identifier",
            name: "one",
          },
          {
            kind: "Identifier",
            name: "two",
          },
          {
            kind: "Identifier",
            name: "two",
          },
          {
            kind: "Identifier",
            name: "digits",
          },
        ],
      },
      one: {
        kind: "NumericLiteral",
        value: 1,
      },
      two: {
        kind: "NumericLiteral",
        value: 2,
      },
      digits: {
        kind: "Module",
        bindings: {
          one: {
            kind: "Identifier",
            name: "one",
          },
          two: {
            kind: "Identifier",
            name: "two",
          },
          outer: {
            kind: "Identifier",
            name: "two",
          },
        },
      },
    },
  },
}
