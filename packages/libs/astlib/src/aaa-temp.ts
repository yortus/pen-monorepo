import {Anonymize, Narrow} from './util';

export interface CreateAstHelpersOptions {
    updatedNodes: Record<string, unknown>;
    nodeCategories: {readonly [K in string]: readonly string[]}
}

export interface AstHelpers<O extends CreateAstHelpersOptions> {
    types: {
        Node: Anonymize<AllNodes<O>>;
    };
}

export function createAstHelpers<O extends CreateAstHelpersOptions>(_opts: Narrow<O>): AstHelpers<O> {
    throw new Error('Not implemented');
}


const a1 = createAstHelpers({
    updatedNodes: {
        Program: {},
        AddExpr: {
            lhs: '???',
            rhs: '???',
        },
        MulExpr: {
            lhs: '???',
            rhs: '???',
        },
        NotExpr: {
            expr: 'Expression',
        },
    },
    nodeCategories: {
        Special: ['Invalid'],
        Expression: ['AddExpr', 'MulExpr', 'NotExpr'],
    } as const
});

export function test() {
    const n = a1.types.Node;
    switch (n.kind) {
        case 'AddExpr': return n.lhs;
        case 'NotExpr': return n.expr;
        default: n.kind;
    }
}






type AllNodes<O extends CreateAstHelpersOptions> =
    O['updatedNodes'] extends Record<string, unknown>
        ? NodesFromObject<O['updatedNodes']>
        : never;

type NodesFromObject<Obj extends Record<string, unknown>> =
    {[K in keyof Obj]: {kind: K} & Obj[K]}[keyof Obj];
