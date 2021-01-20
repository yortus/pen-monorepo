import type {BindingList, Expression, Module, NORMAL, RAW} from './versioned-ast';


// TODO: jsdoc...
// TODO: fix hacky typing of in/out node versions
export function moduleFromBindingList({bindings}: BindingList<RAW>, mapFn: (e: Expression<RAW>) => Expression<NORMAL>): Module<NORMAL> {
    const bindingsObject = {} as {[name: string]: Expression<NORMAL>};
    for (let {left, right} of bindings) {
        if (left.kind === 'Identifier') {
            if (bindingsObject.hasOwnProperty(left.name)) {
                // TODO: improve diagnostic message eg line+col
                new Error(`'${left.name}' is already defined`);
            }
            bindingsObject[left.name] = mapFn(right);
        }
        else /* left.kind === 'ModulePattern */ {
            for (let {name, alias} of left.names) {
                if (bindingsObject.hasOwnProperty(alias || name)) {
                    // TODO: improve diagnostic message eg line+col
                    new Error(`'${alias || name}' is already defined`);
                }
                bindingsObject[alias || name] = {
                    kind: 'MemberExpression',
                    module: mapFn(right),
                    member: {kind: 'Identifier', name},
                };
            }
        }
    }
    return {kind: 'Module', bindings: bindingsObject};
}
