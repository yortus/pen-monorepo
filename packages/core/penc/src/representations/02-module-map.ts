import {allNodeKinds, Module} from '../abstract-syntax-trees';


/** A PEN program expressed as a mapping from module IDs to `Module` AST nodes. */
export interface ModuleMap {
    readonly modulesById: Record<string, Module>;
    readonly startModuleId: string;
}


/** List of node kinds that may be present in a ModuleMap program representation. */
export const moduleMapKinds = allNodeKinds.without(
    'Binding',
    'Definition',
    'ImportExpression',
    'ModuleExpression',
    'ModuleStub',
    'Reference',
    'SourceFile',
);
