import type {V} from '../../representations';


// TODO: jsdoc...
export function bindingListToBindingMap(bindings: V.BindingList<100>, mapFn: (e: V.Expression<100>) => V.Expression<200>): V.BindingMap<200> {
    const bindingsᐟ = {} as V.BindingMap<200>;
    for (let {left, right} of bindings) {
        if (left.kind === 'Identifier') {
            if (bindingsᐟ.hasOwnProperty(left.name)) {
                // TODO: improve diagnostic message eg line+col
                new Error(`'${left.name}' is already defined`);
            }
            bindingsᐟ[left.name] = mapFn(right);
        }
        else /* left.kind === 'ModulePattern */ {
            for (let {name, alias} of left.names) {
                if (bindingsᐟ.hasOwnProperty(alias || name)) {
                    // TODO: improve diagnostic message eg line+col
                    new Error(`'${alias || name}' is already defined`);
                }
                bindingsᐟ[alias || name] = {
                    kind: 'MemberExpression',
                    module: mapFn(right),
                    member: name,
                };
            }
        }
    }
    return bindingsᐟ;
}
