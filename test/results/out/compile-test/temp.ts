
declare let reference: any;
declare let bindingLookup: any;
declare let sequence: any;
declare let selection: any;

const 𝕊2 = {
    kind: 'module',
    bindings: {
        start: {},
        expr: {},
        foo1: {},
        bar: {},
        quux: {},
        a: {},
        b: {},
        baz: {},
        modExprMem: {},
        recA: {},
        recB: {},
        refC: {},
        defC: {},
    },
};

const 𝕊3 = {
    kind: 'module',
    bindings: {
        foo: {},
        bar: {},
        a: {},
    },
};

const 𝕊4 = {
    kind: 'module',
    bindings: {
        mem: {},
    },
};

const 𝕊5 = {
    kind: 'module',
    bindings: {
        a: {},
    },
};

const 𝕊6 = {
    kind: 'module',
    bindings: {
        b: {},
    },
};

const 𝕊7 = {
    kind: 'module',
    bindings: {
        c: {},
        ref5: {},
        ref6: {},
    },
};

const 𝕊8 = {
    kind: 'module',
    bindings: {
        c1: {},
        c2: {},
        ref1: {},
        ref2: {},
        ref3: {},
    },
};

Object.assign(
    reference(𝕊2, 'start'),
    bindingLookup(
        reference(𝕊2, 'expr'),
        'foo'
    )
);

Object.assign(
    reference(𝕊2, 'expr'),
    𝕊3
);

// TODO: emit for ModulePattern...

Object.assign(
    reference(𝕊2, 'a'),
    reference(𝕊2, 'b')
);

Object.assign(
    reference(𝕊2, 'b'),
    "b2"
);

Object.assign(
    reference(𝕊2, 'baz'),
    "baz"
);

Object.assign(
    reference(𝕊2, 'modExprMem'),
    selection(
        bindingLookup(
            reference(𝕊2, 'expr'),
            'foo'
        ),
        bindingLookup(
            𝕊4,
            'mem'
        ),
        reference(𝕊2, 'baz'),
    )
);

Object.assign(
    reference(𝕊2, 'recA'),
    𝕊5
);

Object.assign(
    reference(𝕊2, 'recB'),
    𝕊6
);

Object.assign(
    reference(𝕊2, 'refC'),
    bindingLookup(
        bindingLookup(
            reference(𝕊2, 'defC'),
            'c'
        ),
        'c1'
    )
);

Object.assign(
    reference(𝕊2, 'defC'),
    𝕊7
);

Object.assign(
    reference(𝕊3, 'foo'),
    "foo"
);

Object.assign(
    reference(𝕊3, 'bar'),
    "bar"
);

Object.assign(
    reference(𝕊3, 'a'),
    reference(𝕊2, 'b')
);

Object.assign(
    reference(𝕊4, 'mem'),
    "member"
);

Object.assign(
    reference(𝕊5, 'a'),
    bindingLookup(
        reference(𝕊2, 'recB'),
        'b'
    )
);

Object.assign(
    reference(𝕊6, 'b'),
    bindingLookup(
        reference(𝕊2, 'recA'),
        'a'
    )
);

Object.assign(
    reference(𝕊7, 'c'),
    𝕊8
);

Object.assign(
    reference(𝕊7, 'ref5'),
    bindingLookup(
        reference(𝕊7, 'c'),
        'c1'
    )
);

Object.assign(
    reference(𝕊7, 'ref6'),
    bindingLookup(
        bindingLookup(
            reference(𝕊2, 'defC'),
            'c'
        ),
        'c1'
    )
);

Object.assign(
    reference(𝕊8, 'c1'),
    "c1"
);

Object.assign(
    reference(𝕊8, 'c2'),
    "c2"
);

Object.assign(
    reference(𝕊8, 'ref1'),
    reference(𝕊8, 'c1')
);

Object.assign(
    reference(𝕊8, 'ref2'),
    bindingLookup(
        reference(𝕊7, 'c'),
        'c1'
    )
);

Object.assign(
    reference(𝕊8, 'ref3'),
    bindingLookup(
        bindingLookup(
            reference(𝕊2, 'defC'),
            'c'
        ),
        'c1'
    )
);