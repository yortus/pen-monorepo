const ast2 = {
  module: {
    kind: "Module",
    bindings: {
      x: {
        kind: "StringLiteral",
        value: "outer x",
        concrete: false,
        abstract: false,
      },
      REP: {
        kind: "GenericExpression",
        param: {
          kind: "ModulePattern",
          names: [
            {
              name: "a",
            },
          ],
        },
        body: {
          kind: "SequenceExpression",
          expressions: [
            {
              kind: "Identifier",
              name: "a",
            },
            {
              kind: "Identifier",
              name: "x",
            },
            {
              kind: "Identifier",
              name: "a",
            },
          ],
        },
      },
      x2: {
        kind: "StringLiteral",
        value: "inner x",
        concrete: false,
        abstract: false,
      },
      a: {
        kind: "NumericLiteral",
        value: 42,
      },
      nested: {
        kind: "Module",
        bindings: {
          REP: {
            kind: "Identifier",
            name: "REP",
            resolved: true,
          },
          x: {
            kind: "Identifier",
            name: "x2",
            resolved: true,
          },
          a: {
            kind: "Identifier",
            name: "a",
            resolved: true,
          },
        },
      },
      a2: {
        kind: "Identifier",
        name: "x",
        resolved: true,
      },
      start2: {
        kind: "Identifier",
        generic: null,
        argument: null,
        module: null,
        member: null,
        name: "ENTRYPOINT2",
        resolved: true,
      },
      "Ɱ_compile_test": {
        kind: "Module",
        bindings: {
          x: {
            kind: "Identifier",
            name: "x",
            resolved: true,
          },
          nested: {
            kind: "Identifier",
            name: "nested",
            resolved: true,
          },
          start: {
            kind: "Identifier",
            name: "start2",
            resolved: true,
          },
        },
      },
      start3: {
        kind: "Identifier",
        module: null,
        member: null,
        name: "start2",
        resolved: true,
      },
      ENTRYPOINT: {
        kind: "Identifier",
        module: null,
        member: null,
        name: "start3",
        resolved: true,
      },
      a3: {
        kind: "Identifier",
        name: "a2",
        resolved: true,
      },
      a4: {
        kind: "Identifier",
        module: null,
        member: null,
        name: "a3",
        resolved: true,
      },
      ENTRYPOINT2: {
        kind: "SequenceExpression",
        expressions: [
          {
            kind: "Identifier",
            name: "a4",
            resolved: true,
          },
          {
            kind: "Identifier",
            name: "x2",
            resolved: true,
          },
          {
            kind: "Identifier",
            name: "a4",
            resolved: true,
          },
        ],
      },
      start: {
        kind: "Identifier",
        module: null,
        member: null,
        name: "ENTRYPOINT",
        resolved: true,
      },
    },
  },
}
