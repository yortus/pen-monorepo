import type {BindingList, BindingMap, Expression, NORMAL, RAW} from './versioned-ast';


// TODO: jsdoc...
// TODO: fix hacky typing of in/out node versions
export function bindingListToBindingMap(bindings: BindingList<RAW>, mapFn: (e: Expression<RAW>) => Expression<NORMAL>): BindingMap<NORMAL> {
    const bindingsᐟ = {} as BindingMap<NORMAL>;
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
                    member: {kind: 'Identifier', name},
                };
            }
        }
    }
    return bindingsᐟ;
}
