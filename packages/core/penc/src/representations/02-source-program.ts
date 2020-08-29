import {AbsPath} from '../utils';
import {AstType, ModuleMap, NodeKind} from '../abstract-syntax-trees';


export type SourceProgram = AstType<SourceNodeKinds> & {
    readonly sourceFiles: ModuleMap<SourceNodeKinds>;
    readonly mainPath: AbsPath;
}


type SourceNodeKinds = Exclude<NodeKind,
    | 'GlobalBinding'
    | 'GlobalReferenceExpression'
>;
