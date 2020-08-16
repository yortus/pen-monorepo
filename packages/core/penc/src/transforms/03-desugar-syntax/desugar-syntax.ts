import {MemberExpression, Program, UnresolvedReferenceExpression, UnresolvedSimpleBinding} from '../../ast-nodes';
import {mapAst} from '../../utils';
import {DesugaredNodeKind, SourceNodeKind} from '../asts';


// TODO: doc... after this transform, the following node kinds will no longer be present anywhere in the AST:
// - UnresolvedDestructuredBinding
// - ParenthesisedExpression
export function desugarSyntax(program: Program<SourceNodeKind>): Program<DesugaredNodeKind> {
    let counter = 0;
    return mapAst(program, DesugaredNodeKind, rec => ({

        // Replace each UnresolvedDestructuredBinding with a series of UnresolvedSimpleBindings
        Module: mod => {
            let bindings = [] as Array<UnresolvedSimpleBinding<DesugaredNodeKind>>;
            for (let binding of mod.bindings) {
                if (binding.kind === 'UnresolvedSimpleBinding') {
                    bindings.push(rec(binding));
                }
                else {
                    // Introduce a new simple binding for the RHS.
                    // TODO: ensure no collisions with program names. '$1' etc is ok since '$' isn't allowed in PEN ids.
                    let name = `$${++counter}`;
                    let {names, value, exported} = binding;
                    bindings.push({kind: 'UnresolvedSimpleBinding', name, value: rec(value), exported});

                    // Introduce a simple binding for each name in the LHS
                    for (let {name: bindingName, alias} of names) {
                        let ref: UnresolvedReferenceExpression = {kind: 'UnresolvedReferenceExpression', name};
                        let mem: MemberExpression<DesugaredNodeKind>;
                        mem = {kind: 'MemberExpression', module: ref, bindingName};
                        bindings.push({kind: 'UnresolvedSimpleBinding', name: alias ?? bindingName, value: mem, exported});
                    }
                }
            }

            let modᐟ = {...mod, bindings, abc: 4}; // TODO: remove abc prop after type testing
            return modᐟ;
        },

        // Remove all ParenthesisedExpressions from the AST
        ParenthesisedExpression: par => {
            return rec(par.expression);
        },
    }));
}
