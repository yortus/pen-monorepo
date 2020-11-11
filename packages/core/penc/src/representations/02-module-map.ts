import {allNodeKinds, Module} from '../abstract-syntax-trees';


/** A PEN program expressed as a map from module IDs to `Module` AST nodes. */
export interface ModuleMap {
    readonly modulesById: Record<string, Module>;
    readonly startModuleId: string;
}


/** List of node kinds that may be present in a ModuleMap AST. */
export const moduleMapKinds = allNodeKinds.without(
    'Definition',
    'ModuleExpression',
    'Reference',
);
