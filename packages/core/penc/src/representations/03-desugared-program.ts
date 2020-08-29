import {AbsPath} from '../utils';
import {AstType, ModuleMap, NodeKind} from '../abstract-syntax-trees';


export type DesugaredProgram = AstType<DesugaredNodeKinds> & {
    readonly sourceFiles: ModuleMap<DesugaredNodeKinds>;
    readonly mainPath: AbsPath;
    readonly startGlobalName?: string;
}


type DesugaredNodeKinds = Exclude<NodeKind,
    | 'GlobalBinding'
    | 'GlobalReferenceExpression'
    | 'LocalMultiBinding'
    | 'ParenthesisedExpression'
>;
