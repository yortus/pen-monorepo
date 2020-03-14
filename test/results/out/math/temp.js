
let NOT_IMPLEMENTED;
let reference;
let bindingLookup;
let sequence;
let selection;
let record;

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

// TODO: emit for ModulePattern...

Object.assign(
    reference(𝕊2, 'math'),
    reference(𝕊2, 'expr')
);

Object.assign(
    reference(𝕊2, 'expr'),
    reference(𝕊2, 'Memoize')(
        selection(
            reference(𝕊2, 'add'),
            reference(𝕊2, 'sub'),
            reference(𝕊2, 'term')
        )
    )
);

Object.assign(
    reference(𝕊2, 'add'),
    record([
        {
            hasComputedName: false,
            name: 'type',
            value: NOT_IMPLEMENTED('LabelExpression'),
        },
        {
            hasComputedName: false,
            name: 'lhs',
            value: reference(𝕊2, 'expr'),
        },
        {
            hasComputedName: false,
            name: 'rhs',
            value: sequence(
                "+",
                reference(𝕊2, 'term')
            ),
        },
    ])
);

Object.assign(
    reference(𝕊2, 'sub'),
    record([
        {
            hasComputedName: false,
            name: 'type',
            value: NOT_IMPLEMENTED('LabelExpression'),
        },
        {
            hasComputedName: false,
            name: 'lhs',
            value: reference(𝕊2, 'expr'),
        },
        {
            hasComputedName: false,
            name: 'rhs',
            value: sequence(
                "\\-",
                reference(𝕊2, 'term')
            ),
        },
    ])
);

Object.assign(
    reference(𝕊2, 'term'),
    reference(𝕊2, 'Memoize')(
        selection(
            reference(𝕊2, 'mul'),
            reference(𝕊2, 'div'),
            reference(𝕊2, 'factor')
        )
    )
);

Object.assign(
    reference(𝕊2, 'mul'),
    record([
        {
            hasComputedName: false,
            name: 'type',
            value: NOT_IMPLEMENTED('LabelExpression'),
        },
        {
            hasComputedName: false,
            name: 'lhs',
            value: reference(𝕊2, 'term'),
        },
        {
            hasComputedName: false,
            name: 'rhs',
            value: sequence(
                "*",
                reference(𝕊2, 'factor')
            ),
        },
    ])
);

Object.assign(
    reference(𝕊2, 'div'),
    record([
        {
            hasComputedName: false,
            name: 'type',
            value: NOT_IMPLEMENTED('LabelExpression'),
        },
        {
            hasComputedName: false,
            name: 'lhs',
            value: reference(𝕊2, 'term'),
        },
        {
            hasComputedName: false,
            name: 'rhs',
            value: sequence(
                "/",
                reference(𝕊2, 'factor')
            ),
        },
    ])
);

Object.assign(
    reference(𝕊2, 'factor'),
    selection(
        reference(𝕊2, 'i32'),
        sequence(
            "(",
            reference(𝕊2, 'expr'),
            ")"
        )
    )
);