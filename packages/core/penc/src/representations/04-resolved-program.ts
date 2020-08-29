import {AbsPath} from '../utils';
import {ModuleMap, NodeKind} from './nodes';
import {AstType} from './ast-type';


export type ResolvedProgram = AstType<ResolvedNodeKinds> & {
    readonly sourceFiles: ModuleMap<ResolvedNodeKinds>;
    readonly mainPath: AbsPath;
    readonly startGlobalName?: string;
}


type ResolvedNodeKinds = Exclude<NodeKind,
    | 'LocalBinding'
    | 'LocalMultiBinding'
    | 'LocalReferenceExpression'
    | 'ParenthesisedExpression'
>;
