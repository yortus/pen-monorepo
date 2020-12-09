import type {BindingList, Expression, Module} from '../../abstract-syntax-trees';


// TODO: jsdoc...
export function convertBindingListToModule(bindingList: BindingList): Module {
    const bindings = {} as {[name: string]: Expression};
    for (let {left, right} of bindingList.bindings) {
        if (left.kind === 'Identifier') {
            if (bindings.hasOwnProperty(left.name)) {
                // TODO: improve diagnostic message eg line+col
                new Error(`'${left.name}' is already defined`);
            }
            bindings[left.name] = right;
        }
        else /* left.kind === 'ModulePattern */ {
            for (let {name, alias} of left.names) {
                if (bindings.hasOwnProperty(alias || name)) {
                    // TODO: improve diagnostic message eg line+col
                    new Error(`'${alias || name}' is already defined`);
                }
                bindings[alias || name] = {
                    kind: 'MemberExpression',
                    module: right,
                    member: {kind: 'Identifier', name},
                };
            }
        }
    }
    return {kind: 'Module', bindings};
}
