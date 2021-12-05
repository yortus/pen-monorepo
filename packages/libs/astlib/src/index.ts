

// TODO: temp testing example...


import {createAstHelpers, child} from './create-ast-helpers';

const h = createAstHelpers({
    nodes: {
        AddExpr: {
            lhs: child('Expr'),
            rhs: child('Expr'),
        },
        SubExpr: {
            lhs: child('Expr'),
            rhs: child('Expr'),
        },
    },
    categories: {
        AddExpr: 'Expr',
        SubExpr: 'Expr',
    }
});
