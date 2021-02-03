const ast1 = {
  version: 200,
  start: {
    kind: "MemberExpression",
    module: {
      kind: "MemberExpression",
      module: {
        kind: "Module",
        bindings: {
          "Ɱ_compile_test": {
            kind: "Module",
            bindings: {
              x: {
                kind: "StringLiteral",
                value: "outer x",
                concrete: false,
                abstract: false,
              },
              nested: {
                kind: "Module",
                bindings: {
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
                            name: "x",
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
                            name: "x",
                          },
                          {
                            kind: "Identifier",
                            name: "x",
                          },
                        ],
                      },
                      bindings: {
                        x: {
                          kind: "GenericParameter",
                          name: "ℙ2",
                        },
                      },
                    },
                  },
                  x: {
                    kind: "StringLiteral",
                    value: "inner x",
                    concrete: false,
                    abstract: false,
                  },
                  a: {
                    kind: "NumericLiteral",
                    value: 42,
                  },
                },
              },
              letexpr: {
                kind: "LetExpression",
                expression: {
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
                bindings: {
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
                },
              },
              start: {
                kind: "SelectionExpression",
                expressions: [
                  {
                    kind: "InstantiationExpression",
                    generic: {
                      kind: "MemberExpression",
                      module: {
                        kind: "Identifier",
                        name: "nested",
                      },
                      member: "REP",
                    },
                    argument: {
                      kind: "Module",
                      bindings: {
                        a: {
                          kind: "Identifier",
                          name: "x",
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
            },
          },
        },
      },
      member: "Ɱ_compile_test",
    },
    member: "start",
  },
}
