const definitions = {
  std: {
    kind: "Definition",
    definitionId: "std",
    moduleId: "@compile_test",
    localName: "std",
    value: {
      kind: "Reference",
      definitionId: "@std",
    },
  },
  digits: {
    kind: "Definition",
    definitionId: "digits",
    moduleId: "@compile_test",
    localName: "digits",
    value: {
      kind: "Reference",
      definitionId: "@compile_test_modexpr",
    },
  },
  des: {
    kind: "Definition",
    definitionId: "des",
    moduleId: "@compile_test",
    localName: "des",
    value: {
      kind: "Reference",
      definitionId: "one2",
    },
  },
  ref: {
    kind: "Definition",
    definitionId: "ref",
    moduleId: "@compile_test",
    localName: "ref",
    value: {
      kind: "Reference",
      definitionId: "des",
    },
  },
  mem: {
    kind: "Definition",
    definitionId: "mem",
    moduleId: "@compile_test",
    localName: "mem",
    value: {
      kind: "Reference",
      definitionId: "two",
    },
  },
  xxx: {
    kind: "Definition",
    definitionId: "xxx",
    moduleId: "@compile_test",
    localName: "xxx",
    value: {
      kind: "Reference",
      definitionId: "@compile_test_modexpr2",
    },
  },
  start: {
    kind: "Definition",
    definitionId: "start",
    moduleId: "@compile_test",
    localName: "start",
    value: {
      kind: "Reference",
      definitionId: "two",
    },
  },
  one: {
    kind: "Definition",
    definitionId: "one",
    moduleId: "@compile_test",
    localName: "one",
    value: {
      kind: "NumericLiteral",
      value: 1,
    },
  },
  "@compile_test": {
    kind: "Definition",
    definitionId: "@compile_test",
    moduleId: "@@root",
    localName: "@compile_test",
    value: {
      kind: "ModuleStub",
      moduleId: "@compile_test",
      bindingDefinitionIds: {
        std: "std",
        digits: "digits",
        des: "des",
        ref: "ref",
        mem: "mem",
        xxx: "xxx",
        start: "start",
        one: "one",
      },
    },
  },
  one2: {
    kind: "Definition",
    definitionId: "one2",
    moduleId: "@compile_test_modexpr",
    localName: "one",
    value: {
      kind: "ParenthesisedExpression",
      expression: {
        kind: "NumericLiteral",
        value: 1,
      },
    },
  },
  two: {
    kind: "Definition",
    definitionId: "two",
    moduleId: "@compile_test_modexpr",
    localName: "two",
    value: {
      kind: "NumericLiteral",
      value: 2,
    },
  },
  outer: {
    kind: "Definition",
    definitionId: "outer",
    moduleId: "@compile_test_modexpr",
    localName: "outer",
    value: {
      kind: "Reference",
      definitionId: "mem",
    },
  },
  "@compile_test_modexpr": {
    kind: "Definition",
    definitionId: "@compile_test_modexpr",
    moduleId: "@@root",
    localName: "@compile_test_modexpr",
    value: {
      kind: "ModuleStub",
      moduleId: "@compile_test_modexpr",
      bindingDefinitionIds: {
        one: "one2",
        two: "two",
        outer: "outer",
      },
    },
  },
  d: {
    kind: "Definition",
    definitionId: "d",
    moduleId: "@compile_test_modexpr2",
    localName: "d",
    value: {
      kind: "Reference",
      definitionId: "digits",
    },
  },
  "@compile_test_modexpr2": {
    kind: "Definition",
    definitionId: "@compile_test_modexpr2",
    moduleId: "@@root",
    localName: "@compile_test_modexpr2",
    value: {
      kind: "ModuleStub",
      moduleId: "@compile_test_modexpr2",
      bindingDefinitionIds: {
        d: "d",
      },
    },
  },
  char: {
    kind: "Definition",
    definitionId: "char",
    moduleId: "@std",
    localName: "char",
    value: {
      kind: "Intrinsic",
      name: "char",
      path: "V:/projects/oss/pen-monorepo/packages/core/penc/dist/deps/std.pen.js",
    },
  },
  f64: {
    kind: "Definition",
    definitionId: "f64",
    moduleId: "@std",
    localName: "f64",
    value: {
      kind: "Intrinsic",
      name: "f64",
      path: "V:/projects/oss/pen-monorepo/packages/core/penc/dist/deps/std.pen.js",
    },
  },
  i32: {
    kind: "Definition",
    definitionId: "i32",
    moduleId: "@std",
    localName: "i32",
    value: {
      kind: "Intrinsic",
      name: "i32",
      path: "V:/projects/oss/pen-monorepo/packages/core/penc/dist/deps/std.pen.js",
    },
  },
  memoise: {
    kind: "Definition",
    definitionId: "memoise",
    moduleId: "@std",
    localName: "memoise",
    value: {
      kind: "Intrinsic",
      name: "memoise",
      path: "V:/projects/oss/pen-monorepo/packages/core/penc/dist/deps/std.pen.js",
    },
  },
  "@std": {
    kind: "Definition",
    definitionId: "@std",
    moduleId: "@@root",
    localName: "@std",
    value: {
      kind: "ModuleStub",
      moduleId: "@std",
      bindingDefinitionIds: {
        char: "char",
        f64: "f64",
        i32: "i32",
        memoise: "memoise",
      },
    },
  },
};


// TODO: temp remove...
const defnHashes = {
  "9eeb0a22bc1793fe61a2e6553aef5a548f9a4138": [
    "std",
    "@std",
  ],
  "96ba69e232c3b3518eb4b5246c37870bee24efd4": [
    "digits",
    "@compile_test_modexpr",
    "d",
  ],
  "4f911e886363de62f853438ffe7551a126468882": [
    "des",
    "ref",
    "one",
  ],
  "4376da220fd08caa2922f520bf8c1c2ecc56ecc5": [
    "mem",
    "start",
    "two",
    "outer",
  ],
  dfa05b427b12ebe725cde0a214119f3fe7b8a76a: [
    "xxx",
    "@compile_test_modexpr2",
  ],
  dd96b72499b2760742a97ca679a3f818981aaae7: [
    "@compile_test",
  ],
  "353ab31c8ba4571c3aa4c1a4c92889020d9a4a5d": [
    "char",
  ],
  e89816a08be7d42be68caa8e5e41915c4f27faf2: [
    "f64",
  ],
  fe5f68877af329d3ff0e9ebe28aa79f34576a9b3: [
    "i32",
  ],
  f54d9c8d8a9f21c83f6c539160d735eec86e8e85: [
    "memoise",
  ],
};
