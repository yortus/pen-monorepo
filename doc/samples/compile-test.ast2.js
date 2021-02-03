const ast2 = {
  version: 300,
  start: {
    kind: "LetExpression",
    expression: {
      kind: "Identifier",
      module: null,
      member: null,
      name: "start_2",
    },
    bindings: {
      x: {
        kind: "StringLiteral",
        value: "outer x",
        concrete: false,
        abstract: false,
      },
      REP: {
        kind: "GenericExpression",
        param: "ℙ1",
        body: {
          kind: "LetExpression",
          expression: {
            kind: "SequenceExpression",
            expressions: [
              {
                kind: "Identifier",
                name: "a",
              },
              {
                kind: "Identifier",
                name: "x_3",
              },
              {
                kind: "Identifier",
                name: "a",
              },
            ],
          },
          bindings: {
            a: {
              kind: "MemberExpression",
              module: {
                kind: "GenericParameter",
                name: "ℙ1",
              },
              member: "a",
            },
          },
        },
      },
      GEN: {
        kind: "GenericExpression",
        param: "ℙ2",
        body: {
          kind: "LetExpression",
          expression: {
            kind: "SequenceExpression",
            expressions: [
              {
                kind: "Identifier",
                name: "x_2",
              },
              {
                kind: "Identifier",
                name: "x_2",
              },
            ],
          },
          bindings: {
            x_2: {
              kind: "GenericParameter",
              name: "ℙ2",
            },
          },
        },
      },
      x_3: {
        kind: "StringLiteral",
        value: "inner x",
        concrete: false,
        abstract: false,
      },
      a_2: {
        kind: "NumericLiteral",
        value: 42,
      },
      nested: {
        kind: "Module",
        bindings: {
          REP: {
            kind: "Identifier",
            name: "REP",
          },
          GEN: {
            kind: "Identifier",
            name: "GEN",
          },
          x: {
            kind: "Identifier",
            name: "x_3",
          },
          a: {
            kind: "Identifier",
            name: "a_2",
          },
        },
      },
      lx: {
        kind: "StringLiteral",
        value: "inner x",
        concrete: false,
        abstract: false,
      },
      ly: {
        kind: "StringLiteral",
        value: "***",
        concrete: false,
        abstract: false,
      },
      letexpr: {
        kind: "SequenceExpression",
        expressions: [
          {
            kind: "Identifier",
            name: "lx",
          },
          {
            kind: "StringLiteral",
            value: "-",
            concrete: false,
            abstract: false,
          },
          {
            kind: "Identifier",
            name: "lx",
          },
        ],
      },
      a_3: {
        kind: "Identifier",
        name: "x",
      },
      start_2: {
        kind: "SelectionExpression",
        expressions: [
          {
            kind: "InstantiationExpression",
            generic: {
              kind: "Identifier",
              module: null,
              member: null,
              name: "REP",
            },
            argument: {
              kind: "Module",
              bindings: {
                a: {
                  kind: "Identifier",
                  name: "a_3",
                },
              },
            },
          },
          {
            kind: "Identifier",
            name: "letexpr",
          },
        ],
      },
      "Ɱ_compile_test": {
        kind: "Module",
        bindings: {
          x: {
            kind: "Identifier",
            name: "x",
          },
          nested: {
            kind: "Identifier",
            name: "nested",
          },
          letexpr: {
            kind: "Identifier",
            name: "letexpr",
          },
          start: {
            kind: "Identifier",
            name: "start_2",
          },
        },
      },
    },
  },
}
