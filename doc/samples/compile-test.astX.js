const astX = {
  version: 400,
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
            kind: "Identifier",
            name: "𝕊",
          },
          bindings: {
            a: {
              kind: "MemberExpression",
              module: {
                kind: "Identifier",
                name: "a_sub1",
              },
              member: "a",
            },
            a_sub1: {
              kind: "GenericParameter",
              name: "ℙ1",
            },
            "𝕊": {
              kind: "SequenceExpression",
              expressions: [
                {
                  kind: "Identifier",
                  name: "𝕊_sub1",
                },
                {
                  kind: "Identifier",
                  name: "𝕊_sub2",
                },
                {
                  kind: "Identifier",
                  name: "𝕊_sub3",
                },
              ],
            },
            "𝕊_sub1": {
              kind: "Identifier",
              name: "a",
            },
            "𝕊_sub2": {
              kind: "Identifier",
              name: "x_3",
            },
            "𝕊_sub3": {
              kind: "Identifier",
              name: "a",
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
            kind: "Identifier",
            name: "𝕊",
          },
          bindings: {
            x_2: {
              kind: "GenericParameter",
              name: "ℙ2",
            },
            "𝕊": {
              kind: "SequenceExpression",
              expressions: [
                {
                  kind: "Identifier",
                  name: "𝕊_sub1",
                },
                {
                  kind: "Identifier",
                  name: "𝕊_sub2",
                },
              ],
            },
            "𝕊_sub1": {
              kind: "Identifier",
              name: "x_2",
            },
            "𝕊_sub2": {
              kind: "Identifier",
              name: "x_2",
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
            name: "letexpr_sub1",
          },
          {
            kind: "Identifier",
            name: "letexpr_sub2",
          },
          {
            kind: "Identifier",
            name: "letexpr_sub3",
          },
        ],
      },
      letexpr_sub1: {
        kind: "Identifier",
        name: "lx",
      },
      letexpr_sub2: {
        kind: "StringLiteral",
        value: "-",
        concrete: false,
        abstract: false,
      },
      letexpr_sub3: {
        kind: "Identifier",
        name: "lx",
      },
      a_3: {
        kind: "Identifier",
        name: "x",
      },
      start_2: {
        kind: "SelectionExpression",
        expressions: [
          {
            kind: "Identifier",
            name: "start_2_sub1",
          },
          {
            kind: "Identifier",
            name: "start_2_sub4",
          },
        ],
      },
      start_2_sub1: {
        kind: "InstantiationExpression",
        generic: {
          kind: "Identifier",
          name: "start_2_sub2",
        },
        argument: {
          kind: "Identifier",
          name: "start_2_sub3",
        },
      },
      start_2_sub2: {
        kind: "Identifier",
        module: null,
        member: null,
        name: "REP",
      },
      start_2_sub3: {
        kind: "Module",
        bindings: {
          a: {
            kind: "Identifier",
            name: "a_3",
          },
        },
      },
      start_2_sub4: {
        kind: "Identifier",
        name: "letexpr",
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
