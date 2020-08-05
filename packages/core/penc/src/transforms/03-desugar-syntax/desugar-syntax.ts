import {MemberExpression, Node, Program, ReferenceExpression, SimpleBinding} from '../../ast-nodes';
import {makeNodeMapper} from '../../utils';
import {Metadata} from './metadata';


// TODO: doc... after this transform, the following node kinds will no longer be present anywhere in the AST:
// - DestructuredBinding
// - ParenthesisedExpression
export function desugarSyntax(program: Program) {
    let counter = 0;
    let mapNode = makeNodeMapper<Node, Node<Metadata>>();
    let result = mapNode(program, rec => ({

        // Replace each DestructuredBinding with a series of SimpleBindings
        Module: mod => {
            let bindings = [] as Array<SimpleBinding<Metadata>>;
            for (let binding of mod.bindings.map(rec)) {
                if (binding.kind === 'SimpleBinding') {
                    bindings.push(binding);
                }
                else {
                    // Introduce a new simple binding for the RHS.
                    // TODO: ensure no collisions with program names. '$1' etc is ok since '$' isn't allowed in PEN ids.
                    let name = `$${++counter}`;
                    let {names, value, exported} = binding;
                    bindings.push({kind: 'SimpleBinding', name, value, exported});

                    // Introduce a simple binding for each name in the LHS
                    for (let {name: bindingName, alias} of names) {
                        let ref: ReferenceExpression = {kind: 'ReferenceExpression', name};
                        let mem: MemberExpression<Metadata>;
                        mem = {kind: 'MemberExpression', module: ref, bindingName};
                        bindings.push({kind: 'SimpleBinding', name: alias ?? bindingName, value: mem, exported});
                    }
                }
            }

            let modᐟ = {...mod, bindings};
            return modᐟ;
        },

        // TODO: temp testing...
        ParenthesisedExpression: par => {
            // TODO: make a new util to replace ast nodes? `makeNodeMapper` doesn't typecheck when replacing a node
            // with a different kind node like done below, however it works fine at runtime. It's safe here since any
            // place a ParenthesisedExpression may appear, any other Expression kind may appear. But the cast is ugly.
            return rec(par.expression) as any;
        },
    }));

    // All done.
    return result;
}
