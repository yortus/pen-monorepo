import {AbsPath} from '../utils';
import {ModuleMap, NodeKind} from './nodes';
import {Program} from './program';


export interface SourceProgram extends Program<SourceNodeKind> {
    readonly kind: 'Program';
    readonly sourceFiles: ModuleMap<SourceNodeKind>;
    readonly mainPath: AbsPath;
    readonly startGlobalName?: string;
}


type SourceNodeKind = Exclude<NodeKind,
    | 'GlobalBinding'
    | 'GlobalReferenceExpression'
>;
