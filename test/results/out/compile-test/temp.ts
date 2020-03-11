
import * as std from "penlib;"


const 𝕊1 = {
    𝕊2: {
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
        𝕊3: {
            foo: {},
            bar: {},
            a: {},
        },
        𝕊4: {
            mem: {},
        },
        𝕊5: {
            a: {},
        },
        𝕊6: {
            b: {},
        },
        𝕊7: {
            c: {},
            ref5: {},
            ref6: {},
            𝕊8: {
                c1: {},
                c2: {},
                ref1: {},
                ref2: {},
                ref3: {},
            },
        },
    },
};
Object.assign(
    𝕊1.𝕊2.start,
    (𝕊1.𝕊2.expr).foo
);
Object.assign(
    𝕊1.𝕊2.expr,
    𝕊1.𝕊2.𝕊3
);

// TODO: emit for ModulePattern...
Object.assign(
    𝕊1.𝕊2.a,
    𝕊1.𝕊2.b
);
Object.assign(
    𝕊1.𝕊2.b,
    "b2"
);
Object.assign(
    𝕊1.𝕊2.baz,
    "baz"
);
Object.assign(
    𝕊1.𝕊2.modExprMem,
    std.selection(
        (𝕊1.𝕊2.expr).foo,
        (𝕊1.𝕊2.𝕊4).mem,
        𝕊1.𝕊2.baz,
    )
);
Object.assign(
    𝕊1.𝕊2.recA,
    𝕊1.𝕊2.𝕊5
);
Object.assign(
    𝕊1.𝕊2.recB,
    𝕊1.𝕊2.𝕊6
);
Object.assign(
    𝕊1.𝕊2.refC,
    ((𝕊1.𝕊2.defC).c).c1
);
Object.assign(
    𝕊1.𝕊2.defC,
    𝕊1.𝕊2.𝕊7
);
Object.assign(
    𝕊1.𝕊2.𝕊3.foo,
    "foo"
);
Object.assign(
    𝕊1.𝕊2.𝕊3.bar,
    "bar"
);
Object.assign(
    𝕊1.𝕊2.𝕊3.a,
    𝕊1.𝕊2.b
);
Object.assign(
    𝕊1.𝕊2.𝕊4.mem,
    "member"
);
Object.assign(
    𝕊1.𝕊2.𝕊5.a,
    (𝕊1.𝕊2.recB).b
);
Object.assign(
    𝕊1.𝕊2.𝕊6.b,
    (𝕊1.𝕊2.recA).a
);
Object.assign(
    𝕊1.𝕊2.𝕊7.c,
    𝕊1.𝕊2.𝕊7.𝕊8
);
Object.assign(
    𝕊1.𝕊2.𝕊7.ref5,
    (𝕊1.𝕊2.𝕊7.c).c1
);
Object.assign(
    𝕊1.𝕊2.𝕊7.ref6,
    ((𝕊1.𝕊2.defC).c).c1
);
Object.assign(
    𝕊1.𝕊2.𝕊7.𝕊8.c1,
    "c1"
);
Object.assign(
    𝕊1.𝕊2.𝕊7.𝕊8.c2,
    "c2"
);
Object.assign(
    𝕊1.𝕊2.𝕊7.𝕊8.ref1,
    𝕊1.𝕊2.𝕊7.𝕊8.c1
);
Object.assign(
    𝕊1.𝕊2.𝕊7.𝕊8.ref2,
    (𝕊1.𝕊2.𝕊7.c).c1
);
Object.assign(
    𝕊1.𝕊2.𝕊7.𝕊8.ref3,
    ((𝕊1.𝕊2.defC).c).c1
);