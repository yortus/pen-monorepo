import {allNodeKinds, Module} from '../abstract-syntax-trees';


// TODO: revise outdated jsdoc...
/** A PEN program expressed as a mapping from module IDs to `Module` AST nodes. */
export interface ModuleMap {
    readonly rootModule: Module;
    readonly startName: string;
}


/** List of node kinds that may be present in a ModuleMap program representation. */
export const moduleMapKinds = allNodeKinds.without(
    'Binding',
    'Definition',
    'ImportExpression',
    'ModulePattern',
    'Reference',
);
