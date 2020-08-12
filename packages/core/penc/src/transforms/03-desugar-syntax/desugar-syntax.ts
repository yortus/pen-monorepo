import {MemberExpression, ReferenceExpression, SimpleBinding} from '../../ast-nodes';
import {makeNodeMapper} from '../../utils';
import {DesugaredNodes, DesugaredProgram, SourceNodes, SourceProgram} from '../asts';


// TODO: doc... after this transform, the following node kinds will no longer be present anywhere in the AST:
// - DestructuredBinding
// - ParenthesisedExpression
export function desugarSyntax(program: SourceProgram): DesugaredProgram {
    let counter = 0;
    let mapNode = makeNodeMapper<SourceNodes, DesugaredNodes>();
    return mapNode(program, rec => ({

        // Replace each DestructuredBinding with a series of SimpleBindings
        Module: mod => {
            let bindings = [] as Array<SimpleBinding<DesugaredNodes['kind']>>;
            for (let binding of mod.bindings) {
                if (binding.kind === 'SimpleBinding') {
                    bindings.push(rec(binding));
                }
                else {
                    // Introduce a new simple binding for the RHS.
                    // TODO: ensure no collisions with program names. '$1' etc is ok since '$' isn't allowed in PEN ids.
                    let name = `$${++counter}`;
                    let {names, value, exported} = binding;
                    bindings.push({kind: 'SimpleBinding', name, value: rec(value), exported});

                    // Introduce a simple binding for each name in the LHS
                    for (let {name: bindingName, alias} of names) {
                        let ref: ReferenceExpression = {kind: 'ReferenceExpression', name};
                        let mem: MemberExpression<DesugaredNodes['kind']>;
                        mem = {kind: 'MemberExpression', module: ref, bindingName};
                        bindings.push({kind: 'SimpleBinding', name: alias ?? bindingName, value: mem, exported});
                    }
                }
            }

            let modᐟ = {...mod, bindings, abc: 4}; // TODO: remove abc prop after type testing
            return modᐟ;
        },

        // Remove all ParenthesisedExpressions from the AST
        PreExpression: expr => {
            if (expr.kind === 'ParenthesisedExpression') return expr.expression;
        },
    }));
}
