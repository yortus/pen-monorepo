import {AbsPath} from '../utils';
import {ModuleMap, NodeKind} from './nodes';
import {AstType} from './ast-type';


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
