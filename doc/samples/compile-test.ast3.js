const ast3 = {
  version: 300,
  start: {
    kind: "MemberExpression",
    module: {
      kind: "Module",
      bindings: {
        start: {
          kind: "SelectionExpression",
          expressions: [
            {
              kind: "Identifier",
              name: "start_e",
            },
            {
              kind: "Identifier",
              name: "letexpr",
            },
          ],
        },
        start_e: {
          kind: "SequenceExpression",
          expressions: [
            {
              kind: "Identifier",
              name: "x",
            },
            {
              kind: "Identifier",
              name: "x_2",
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
        x_2: {
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
              name: "x_2",
            },
            {
              kind: "Identifier",
              name: "letexpr_e",
            },
            {
              kind: "Identifier",
              name: "x_2",
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
    member: "start",
  },
}
