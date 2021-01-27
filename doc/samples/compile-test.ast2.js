const ast2 = {
  version: 300,
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
        kind: "Module",
        bindings: {
        },
      },
      x_2: {
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
            name: "x_2",
            resolved: true,
          },
          a: {
            kind: "Identifier",
            name: "a",
            resolved: true,
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
            resolved: true,
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
            resolved: true,
          },
        ],
      },
      a_2: {
        kind: "Identifier",
        name: "x",
        resolved: true,
      },
      start_2: {
        kind: "SelectionExpression",
        expressions: [
          {
            kind: "Identifier",
            generic: null,
            argument: null,
            module: null,
            member: null,
            name: "ENTRYPOINT_2",
            resolved: true,
          },
          {
            kind: "Identifier",
            name: "letexpr",
            resolved: true,
          },
        ],
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
          letexpr: {
            kind: "Identifier",
            name: "letexpr",
            resolved: true,
          },
          start: {
            kind: "Identifier",
            name: "start_2",
            resolved: true,
          },
        },
      },
      start_3: {
        kind: "Identifier",
        module: null,
        member: null,
        name: "start_2",
        resolved: true,
      },
      ENTRYPOINT: {
        kind: "Identifier",
        module: null,
        member: null,
        name: "start_3",
        resolved: true,
      },
      a_3: {
        kind: "Identifier",
        name: "a_2",
        resolved: true,
      },
      a_4: {
        kind: "Identifier",
        module: null,
        member: null,
        name: "a_3",
        resolved: true,
      },
      ENTRYPOINT_2: {
        kind: "SequenceExpression",
        expressions: [
          {
            kind: "Identifier",
            name: "a_4",
            resolved: true,
          },
          {
            kind: "Identifier",
            name: "x_2",
            resolved: true,
          },
          {
            kind: "Identifier",
            name: "a_4",
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
