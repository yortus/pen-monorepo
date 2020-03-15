
let sys;

const 𝕊2 = {
    kind: 'module',
    bindings: {
        foo: {},
        bar: {},
        baz: {},
        digit: {},
        alpha: {},
        myList: {},
        rec: {},
        r2: {},
        r2d: {},
    },
};

const 𝕊3 = {
    kind: 'module',
    bindings: {
        b: {},
        d: {},
    },
};

const 𝕊4 = {
    kind: 'module',
    bindings: {
    },
};

const 𝕊5 = {
    kind: 'module',
    bindings: {
    },
};

const 𝕊6 = {
    kind: 'module',
    bindings: {
    },
};

const 𝕊7 = {
    kind: 'module',
    bindings: {
    },
};

const 𝕊8 = {
    kind: 'module',
    bindings: {
        util: {},
    },
};

const 𝕊9 = {
    kind: 'module',
    bindings: {
        util1: {},
        util2: {},
    },
};

const 𝕊10 = {
    kind: 'module',
    bindings: {
        util1: {},
    },
};

const 𝕊11 = {
    kind: 'module',
    bindings: {
        util2: {},
    },
};

// -------------------- V:\oss\penc\test\results\in\import-graph\index.pen --------------------

{
    let rhs = 𝕊4;
    Object.assign(𝕊2.bindings.foo, sys.bindingLookup(rhs, 'f'));
    Object.assign(𝕊2.bindings.bar, sys.bindingLookup(rhs, 'b'));
    Object.assign(𝕊2.bindings.baz, sys.bindingLookup(rhs, 'baz'));
}

Object.assign(
    𝕊2.bindings.digit,
    sys.charRange("0", "9")
);

Object.assign(
    𝕊2.bindings.alpha,
    sys.selection(
        sys.charRange("a", "z"),
        sys.charRange("A", "Z")
    )
);

Object.assign(
    𝕊2.bindings.myList,
    sys.list([
        sys.reference(𝕊2, 'digit'),
        sys.sequence(
            sys.reference(𝕊2, 'digit'),
            sys.reference(𝕊2, 'digit')
        ),
        sys.sequence(
            sys.reference(𝕊2, 'digit'),
            sys.reference(𝕊2, 'digit'),
            sys.reference(𝕊2, 'digit')
        ),
    ])
);

Object.assign(
    𝕊2.bindings.rec,
    𝕊3
);

Object.assign(
    𝕊2.bindings.r2,
    sys.reference(𝕊2, 'rec')
);

Object.assign(
    𝕊2.bindings.r2d,
    sys.bindingLookup(
        sys.reference(𝕊2, 'rec'),
        'd'
    )
);

Object.assign(
    𝕊3.bindings.b,
    sys.label("b thing")
);

Object.assign(
    𝕊3.bindings.d,
    sys.label("d thing")
);

// -------------------- V:\oss\penc\test\results\in\import-graph\a.pen --------------------

// -------------------- V:\oss\penc\test\results\in\import-graph\b.pen --------------------

// -------------------- V:\oss\penc\test\results\in\import-graph\c.pen --------------------

// -------------------- V:\oss\penc\test\results\in\import-graph\d.pen --------------------

// -------------------- V:\oss\penc\test\results\in\import-graph\util\index.pen --------------------

Object.assign(
    𝕊8.bindings.util,
    𝕊9
);

Object.assign(
    𝕊9.bindings.util1,
    𝕊10
);

Object.assign(
    𝕊9.bindings.util2,
    𝕊11
);

// -------------------- V:\oss\penc\test\results\in\import-graph\util\util1.pen --------------------

Object.assign(
    𝕊10.bindings.util1,
    sys.string("util1")
);

// -------------------- V:\oss\penc\test\results\in\import-graph\util\util2 --------------------

Object.assign(
    𝕊11.bindings.util2,
    sys.string("util2")
);