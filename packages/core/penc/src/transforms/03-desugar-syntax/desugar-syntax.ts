import {LocalBinding, LocalReferenceExpression, MemberExpression} from '../../ast-nodes';
import {Program} from '../../representations';
import {mapAst} from '../../utils';
import {DesugaredNodeKind, SourceNodeKind} from '../asts';


// TODO: doc... after this transform, the following node kinds will no longer be present anywhere in the AST:
// - LocalMultiBinding
// - ParenthesisedExpression
export function desugarSyntax(program: Program<SourceNodeKind>): Program<DesugaredNodeKind> {
    let counter = 0;
    let moduleMapᐟ = mapAst(program.sourceFiles, DesugaredNodeKind, rec => ({

        // Replace each LocalMultiBinding with a series of LocalBindings
        Module: mod => {
            let bindings = [] as Array<LocalBinding<DesugaredNodeKind>>;
            for (let binding of mod.bindings) {
                if (binding.kind === 'LocalBinding') {
                    bindings.push(rec(binding));
                }
                else {
                    // Introduce a new local binding for the RHS.
                    // TODO: ensure no collisions with program names. '$1' etc is ok since '$' isn't allowed in PEN ids.
                    let localName = `$${++counter}`;
                    let {names, value, exported} = binding;
                    bindings.push({kind: 'LocalBinding', localName, value: rec(value), exported});

                    // Introduce a local binding for each name in the LHS
                    for (let {name: bindingName, alias} of names) {
                        let ref: LocalReferenceExpression = {kind: 'LocalReferenceExpression', localName};
                        let mem: MemberExpression<DesugaredNodeKind>;
                        mem = {kind: 'MemberExpression', module: ref, bindingName};
                        bindings.push({kind: 'LocalBinding', localName: alias ?? bindingName, value: mem, exported});
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
    return {...program, sourceFiles: moduleMapᐟ};
}
