import {AbsPath} from '../utils';
import {ModuleMap, NodeKind} from './nodes';
import {AstType} from './ast-type';


export type SourceProgram = AstType<SourceNodeKinds> & {
    readonly sourceFiles: ModuleMap<SourceNodeKinds>;
    readonly mainPath: AbsPath;
    readonly startGlobalName?: string;
}


type SourceNodeKinds = Exclude<NodeKind,
    | 'GlobalBinding'
    | 'GlobalReferenceExpression'
>;
