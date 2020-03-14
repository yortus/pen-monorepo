
let std;

const 𝕊2 = {
    kind: 'module',
    bindings: {
        Memoize: {},
        i32: {},
        math: {},
        expr: {},
        add: {},
        sub: {},
        term: {},
        mul: {},
        div: {},
        factor: {},
    },
};

{
    let rhs = std.NOT_IMPLEMENTED('ImportExpression');
    Object.assign(𝕊2.bindings.Memoize, std.bindingLookup(rhs, 'Memoize'));
    Object.assign(𝕊2.bindings.i32, std.bindingLookup(rhs, 'i32'));
}

Object.assign(
    𝕊2.bindings.math,
    std.reference(𝕊2, 'expr')
);

Object.assign(
    𝕊2.bindings.expr,
    std.reference(𝕊2, 'Memoize')(
        std.selection(
            std.reference(𝕊2, 'add'),
            std.reference(𝕊2, 'sub'),
            std.reference(𝕊2, 'term')
        )
    )
);

Object.assign(
    𝕊2.bindings.add,
    std.record([
        {
            hasComputedName: false,
            name: 'type',
            value: std.NOT_IMPLEMENTED('LabelExpression'),
        },
        {
            hasComputedName: false,
            name: 'lhs',
            value: std.reference(𝕊2, 'expr'),
        },
        {
            hasComputedName: false,
            name: 'rhs',
            value: std.sequence(
                "+",
                std.reference(𝕊2, 'term')
            ),
        },
    ])
);

Object.assign(
    𝕊2.bindings.sub,
    std.record([
        {
            hasComputedName: false,
            name: 'type',
            value: std.NOT_IMPLEMENTED('LabelExpression'),
        },
        {
            hasComputedName: false,
            name: 'lhs',
            value: std.reference(𝕊2, 'expr'),
        },
        {
            hasComputedName: false,
            name: 'rhs',
            value: std.sequence(
                "\\-",
                std.reference(𝕊2, 'term')
            ),
        },
    ])
);

Object.assign(
    𝕊2.bindings.term,
    std.reference(𝕊2, 'Memoize')(
        std.selection(
            std.reference(𝕊2, 'mul'),
            std.reference(𝕊2, 'div'),
            std.reference(𝕊2, 'factor')
        )
    )
);

Object.assign(
    𝕊2.bindings.mul,
    std.record([
        {
            hasComputedName: false,
            name: 'type',
            value: std.NOT_IMPLEMENTED('LabelExpression'),
        },
        {
            hasComputedName: false,
            name: 'lhs',
            value: std.reference(𝕊2, 'term'),
        },
        {
            hasComputedName: false,
            name: 'rhs',
            value: std.sequence(
                "*",
                std.reference(𝕊2, 'factor')
            ),
        },
    ])
);

Object.assign(
    𝕊2.bindings.div,
    std.record([
        {
            hasComputedName: false,
            name: 'type',
            value: std.NOT_IMPLEMENTED('LabelExpression'),
        },
        {
            hasComputedName: false,
            name: 'lhs',
            value: std.reference(𝕊2, 'term'),
        },
        {
            hasComputedName: false,
            name: 'rhs',
            value: std.sequence(
                "/",
                std.reference(𝕊2, 'factor')
            ),
        },
    ])
);

Object.assign(
    𝕊2.bindings.factor,
    std.selection(
        std.reference(𝕊2, 'i32'),
        std.sequence(
            "(",
            std.reference(𝕊2, 'expr'),
            ")"
        )
    )
);