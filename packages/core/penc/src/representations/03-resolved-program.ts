import {AbsPath} from '../utils';
import {ModuleMap, NodeKind} from './nodes';
import {Program} from './program';


export interface ResolvedProgram extends Program<ResolvedNodeKind> {
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
