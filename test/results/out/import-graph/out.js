
let std;

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
    },
};

const 𝕊9 = {
    kind: 'module',
    bindings: {
        util: {},
    },
};

const 𝕊10 = {
    kind: 'module',
    bindings: {
        util1: {},
        util2: {},
    },
};

const 𝕊11 = {
    kind: 'module',
    bindings: {
        util1: {},
    },
};

const 𝕊12 = {
    kind: 'module',
    bindings: {
        util2: {},
    },
};

// -------------------- V:\oss\penc\test\results\in\import-graph\index.pen --------------------

{
    let rhs = 𝕊4;
    Object.assign(𝕊2.bindings.foo, std.bindingLookup(rhs, 'f'));
    Object.assign(𝕊2.bindings.bar, std.bindingLookup(rhs, 'b'));
    Object.assign(𝕊2.bindings.baz, std.bindingLookup(rhs, 'baz'));
}

Object.assign(
    𝕊2.bindings.digit,
    std.charRange("0", "9")
);

Object.assign(
    𝕊2.bindings.alpha,
    std.selection(
        std.charRange("a", "z"),
        std.charRange("A", "Z")
    )
);

Object.assign(
    𝕊2.bindings.myList,
    std.list([
        std.reference(𝕊2, 'digit'),
        std.sequence(
            std.reference(𝕊2, 'digit'),
            std.reference(𝕊2, 'digit')
        ),
        std.sequence(
            std.reference(𝕊2, 'digit'),
            std.reference(𝕊2, 'digit'),
            std.reference(𝕊2, 'digit')
        ),
    ])
);

Object.assign(
    𝕊2.bindings.rec,
    𝕊3
);

Object.assign(
    𝕊2.bindings.r2,
    std.reference(𝕊2, 'rec')
);

Object.assign(
    𝕊2.bindings.r2d,
    std.bindingLookup(
        std.reference(𝕊2, 'rec'),
        'd'
    )
);

Object.assign(
    𝕊3.bindings.b,
    std.label("b thing")
);

Object.assign(
    𝕊3.bindings.d,
    std.label("d thing")
);

// -------------------- V:\oss\penc\test\results\in\import-graph\a.pen --------------------

// -------------------- V:\oss\penc\test\results\in\import-graph\b.pen --------------------

// -------------------- V:\oss\penc\test\results\in\import-graph\c.pen --------------------

// -------------------- V:\oss\penc\test\results\in\import-graph\d.pen --------------------

// -------------------- V:\oss\penc\penlib\penlib.pen --------------------

// -------------------- V:\oss\penc\test\results\in\import-graph\util\index.pen --------------------

Object.assign(
    𝕊9.bindings.util,
    𝕊10
);

Object.assign(
    𝕊10.bindings.util1,
    𝕊11
);

Object.assign(
    𝕊10.bindings.util2,
    𝕊12
);

// -------------------- V:\oss\penc\test\results\in\import-graph\util\util1.pen --------------------

Object.assign(
    𝕊11.bindings.util1,
    std.string("util1")
);

// -------------------- V:\oss\penc\test\results\in\import-graph\util\util2 --------------------

Object.assign(
    𝕊12.bindings.util2,
    std.string("util2")
);