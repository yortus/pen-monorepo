import {AbsPath} from '../utils';
import {AstType, ModuleMap, NodeKind} from '../abstract-syntax-trees';


export type ResolvedProgram = AstType<ResolvedNodeKinds> & {
    readonly sourceFiles: ModuleMap<ResolvedNodeKinds>;
    readonly mainPath: AbsPath;
    readonly startGlobalName: string;
}


type ResolvedNodeKinds = Exclude<NodeKind,
    | 'LocalBinding'
    | 'LocalMultiBinding'
    | 'LocalReferenceExpression'
    | 'ParenthesisedExpression'
>;
