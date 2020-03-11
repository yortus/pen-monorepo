
import * as std from "penlib;"



const 𝕊2 = {
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
};

const 𝕊3 = {
    foo: {},
    bar: {},
    a: {},
};

const 𝕊4 = {
    mem: {},
};

const 𝕊5 = {
    a: {},
};

const 𝕊6 = {
    b: {},
};

const 𝕊7 = {
    c: {},
    ref5: {},
    ref6: {},
};

const 𝕊8 = {
    c1: {},
    c2: {},
    ref1: {},
    ref2: {},
    ref3: {},
};

Object.assign(
    𝕊2.start,
    (𝕊2.expr).foo
);

Object.assign(
    𝕊2.expr,
    𝕊3
);

// TODO: emit for ModulePattern...

Object.assign(
    𝕊2.a,
    𝕊2.b
);

Object.assign(
    𝕊2.b,
    "b2"
);

Object.assign(
    𝕊2.baz,
    "baz"
);

Object.assign(
    𝕊2.modExprMem,
    std.selection(
        (𝕊2.expr).foo,
        (𝕊4).mem,
        𝕊2.baz,
    )
);

Object.assign(
    𝕊2.recA,
    𝕊5
);

Object.assign(
    𝕊2.recB,
    𝕊6
);

Object.assign(
    𝕊2.refC,
    ((𝕊2.defC).c).c1
);

Object.assign(
    𝕊2.defC,
    𝕊7
);

Object.assign(
    𝕊3.foo,
    "foo"
);

Object.assign(
    𝕊3.bar,
    "bar"
);

Object.assign(
    𝕊3.a,
    𝕊2.b
);

Object.assign(
    𝕊4.mem,
    "member"
);

Object.assign(
    𝕊5.a,
    (𝕊2.recB).b
);

Object.assign(
    𝕊6.b,
    (𝕊2.recA).a
);

Object.assign(
    𝕊7.c,
    𝕊8
);

Object.assign(
    𝕊7.ref5,
    (𝕊7.c).c1
);

Object.assign(
    𝕊7.ref6,
    ((𝕊2.defC).c).c1
);

Object.assign(
    𝕊8.c1,
    "c1"
);

Object.assign(
    𝕊8.c2,
    "c2"
);

Object.assign(
    𝕊8.ref1,
    𝕊8.c1
);

Object.assign(
    𝕊8.ref2,
    (𝕊7.c).c1
);

Object.assign(
    𝕊8.ref3,
    ((𝕊2.defC).c).c1
);