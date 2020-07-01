import {BindingLookupExpression, Node, Program, ReferenceExpression, SimpleBinding} from '../../ast-nodes';
import {makeNodeMapper} from '../../utils';
import {Metadata} from './metadata';


// TODO: doc... after this transform, all bindings in the AST will be simple bindings (no more DestructuredBindings)
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
                    let {names, value, exported, meta} = binding;
                    bindings.push({kind: 'SimpleBinding', name, value, exported, meta});

                    // Introduce a simple binding for each name in the LHS
                    for (let {name: bindingName, alias} of names) {
                        let ref: ReferenceExpression<Metadata> = {kind: 'ReferenceExpression', name, meta: {}};
                        let ble: BindingLookupExpression<Metadata>;
                        ble = {kind: 'BindingLookupExpression', module: ref, bindingName, meta: {}};
                        bindings.push({kind: 'SimpleBinding', name: alias ?? bindingName, value: ble, exported, meta});
                    }
                }
            }

            let modᐟ = {...mod, bindings};
            return modᐟ;
        },
    }));

    // All done.
    return result;
}
