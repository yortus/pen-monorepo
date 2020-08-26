import {AbsPath} from '../utils';
import {ModuleMap, NodeKind} from './nodes';
import {Ast} from './ast';


export interface SourceProgram extends Ast<SourceNodeKind> {
    readonly sourceFiles: ModuleMap<SourceNodeKind>;
    readonly mainPath: AbsPath;
    readonly startGlobalName?: string;
}


type SourceNodeKind = Exclude<NodeKind,
    | 'GlobalBinding'
    | 'GlobalReferenceExpression'
>;
