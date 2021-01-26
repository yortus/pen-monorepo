const ast3 = {
  version: 300,
  module: {
    kind: "Module",
    bindings: {
      start: {
        kind: "SelectionExpression",
        expressions: [
          {
            kind: "Identifier",
            name: "ENTRYPOINT2",
          },
          {
            kind: "Identifier",
            name: "letexpr",
          },
        ],
      },
      ENTRYPOINT2: {
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
      letexpr: {
        kind: "SequenceExpression",
        expressions: [
          {
            kind: "Identifier",
            name: "x2",
          },
          {
            kind: "Identifier",
            name: "letexpr_e",
          },
          {
            kind: "Identifier",
            name: "x2",
          },
        ],
      },
      letexpr_e: {
        kind: "StringLiteral",
        value: "-",
        concrete: false,
        abstract: false,
      },
    },
  },
}
