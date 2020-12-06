import {allNodeKinds, Identifier, Module} from '../abstract-syntax-trees';


/** A PEN program expressed as a mapping from module IDs to `Module` AST nodes. */
export interface ModuleMap {
    // TODO: temp testing... this is pretty awkward here, and the two transforms that produce/consume it...
    readonly startExpression: {
        kind: 'MemberExpression',
        module: {
            kind: 'MemberExpression',
            module: Module,
            member: Identifier,
        },
        member: Identifier,
    };
}


/** List of node kinds that may be present in a ModuleMap program representation. */
export const moduleMapKinds = allNodeKinds.without(
    'Binding',
    'Definition',
    'ImportExpression',
    'ModulePattern',
    'Reference',
);
