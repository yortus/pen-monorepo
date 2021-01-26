const ast3 = {
  version: 200,
  module: {
    kind: "Module",
    bindings: {
      start: {
        kind: "SequenceExpression",
        expressions: [
          {
            kind: "Identifier",
            name: "x",
          },
          {
            kind: "Identifier",
            name: "x2",
          },
          {
            kind: "Identifier",
            name: "x",
          },
        ],
      },
      x: {
        kind: "StringLiteral",
        value: "outer x",
        concrete: false,
        abstract: false,
      },
      x2: {
        kind: "StringLiteral",
        value: "inner x",
        concrete: false,
        abstract: false,
      },
    },
  },
}
