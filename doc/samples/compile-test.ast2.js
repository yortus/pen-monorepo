const ast2 = {
  version: 300,
  start: {
    kind: "MemberExpression",
    module: {
      kind: "Module",
      bindings: {
        DUMMY: {
          kind: "Module",
          bindings: {
          },
        },
        x: {
          kind: "StringLiteral",
          value: "outer x",
          concrete: false,
          abstract: false,
        },
        "ℙ": {
          kind: "Identifier",
          name: "ℙ",
          placeholder: true,
        },
        a: {
          kind: "MemberExpression",
          module: {
            kind: "Identifier",
            name: "ℙ",
            unique: true,
          },
          member: "a",
        },
        REP: {
          kind: "GenericExpression",
          param: "ℙ",
          body: {
            kind: "SequenceExpression",
            expressions: [
              {
                kind: "Identifier",
                name: "a",
                unique: true,
              },
              {
                kind: "Identifier",
                name: "x_2",
                unique: true,
              },
              {
                kind: "Identifier",
                name: "a",
                unique: true,
              },
            ],
          },
        },
        x_2: {
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
              unique: true,
            },
            x: {
              kind: "Identifier",
              name: "x_2",
              unique: true,
            },
            a: {
              kind: "Identifier",
              name: "a_2",
              unique: true,
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
              unique: true,
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
              unique: true,
            },
          ],
        },
        a_3: {
          kind: "Identifier",
          name: "x",
          unique: true,
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
                unique: true,
              },
              argument: {
                kind: "Module",
                bindings: {
                  a: {
                    kind: "Identifier",
                    name: "a_3",
                    unique: true,
                  },
                },
              },
            },
            {
              kind: "Identifier",
              name: "letexpr",
              unique: true,
            },
          ],
        },
        "Ɱ_compile_test": {
          kind: "Module",
          bindings: {
            x: {
              kind: "Identifier",
              name: "x",
              unique: true,
            },
            nested: {
              kind: "Identifier",
              name: "nested",
              unique: true,
            },
            letexpr: {
              kind: "Identifier",
              name: "letexpr",
              unique: true,
            },
            start: {
              kind: "Identifier",
              name: "start_2",
              unique: true,
            },
          },
        },
        start: {
          kind: "Identifier",
          module: null,
          member: null,
          name: "start_2",
          unique: true,
        },
      },
    },
    member: "start",
  },
}
