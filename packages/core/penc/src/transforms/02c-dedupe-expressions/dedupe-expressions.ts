import {makeNodeMapper, V, validateAST} from '../../representations';
import {assert, mapObj} from '../../utils';


// TODO: this transform is WIP and currently is a no-op. It's purely an optimisation anyway, so can be completed later.

// TODO: jsdoc...
// - based on the old 'normaliseExpressions' transform
//   - see https://github.com/yortus/pen-monorepo/blob/fa604457dd84201a7f71618bc132f4a85a365ea9/packages/core/penc/src/transforms/03-normalise-expressions/normalise-expressions.ts
//   - that transform combined deduping with flattening, this one only does deduping
// - summary: if multiple bindings have semantically equivalent RHSs, then they are reduced to a single deduped binding
//   - all Identifiers referencing any of these bindings are updated to reference the single deduped binding
//   - bindings may be hoisted in the process, eg two sibling genexprs containing an equivalent binding will have the
//       new deduped binding hoisted so it is in scope for both genexprs
export function dedupeExpressions(ast: V.AST<400>): V.AST<400> {
    validateAST(ast);

    // TODO: ... STEP 1...
    const identifiers = new Map<string, V.Identifier>();
    const letExprs = [] as V.LetExpression<400>[];
    const startᐟ = mapNode(ast.start, rec => ({

        Identifier: id => {
            // Collect every Identifier encountered during the traversal, to be resolved in step 2.
            const idᐟ: V.Identifier = {...id};
            identifiers.set(id.name, idᐟ);
            return idᐟ;
        },

        LetExpression: (le) => {
            const expression = rec(le.expression);
            assert(expression.kind === 'Identifier' || expression.kind === 'GenericParameter');
            const bindings = mapObj(le.bindings, rec)

            // TODO: hash each binding

            const leᐟ: V.LetExpression<400> = {...le, expression, bindings};
            letExprs.push(leᐟ);
            return leᐟ;
        },



    }));

    // TODO: STEP 2...




    // TODO: ...
    assert(startᐟ.kind === 'LetExpression');
    const astᐟ: V.AST<400> = {
        version: 400,
        start: startᐟ,
    };
    validateAST(astᐟ);
    return astᐟ;
}


// TODO: temp testing...
const mapNode = makeNodeMapper<400, 400>();
