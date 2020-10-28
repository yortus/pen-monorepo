import {allNodeKinds, Module} from '../abstract-syntax-trees';


/** Initial AST of a PEN program. */
export interface SourceProgram {
    readonly kind: 'SourceProgram';
    readonly modulesById: ReadonlyMap<string, Module>;
    readonly startModuleId: string;
}


/** List of node kinds that may be present in a SourceProgram AST. */
export const sourceNodeKinds = allNodeKinds.without(
    'Definition',
    'ModuleExpression',
    'ReferenceExpression',
);
