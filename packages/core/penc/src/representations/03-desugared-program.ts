import {AbsPath} from '../utils';
import {ModuleMap, NodeKind} from './nodes';
import {Ast} from './ast';


export interface DesugaredProgram extends Ast<DesugaredNodeKind> {
    readonly sourceFiles: ModuleMap<DesugaredNodeKind>;
    readonly mainPath: AbsPath;
    readonly startGlobalName?: string;
}


type DesugaredNodeKind = Exclude<NodeKind,
    | 'GlobalBinding'
    | 'GlobalReferenceExpression'
    | 'LocalMultiBinding'
    | 'ParenthesisedExpression'
>;
