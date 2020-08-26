import {AbsPath} from '../utils';
import {ModuleMap, NodeKind} from './nodes';
import {Ast} from './ast';


export interface ResolvedProgram extends Ast<ResolvedNodeKind> {
    readonly sourceFiles: ModuleMap<ResolvedNodeKind>;
    readonly mainPath: AbsPath;
    readonly startGlobalName?: string;
}


type ResolvedNodeKind = Exclude<NodeKind,
    | 'LocalBinding'
    | 'LocalMultiBinding'
    | 'LocalReferenceExpression'
    | 'ParenthesisedExpression'
>;
