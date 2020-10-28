import {AbsPath} from '../utils';
import {allNodeKinds, Module} from '../abstract-syntax-trees';


// TODO:
// - remove AbstractSyntaxTree node kind
// - replace `sourceFiles` below with `modulesByAbsPath: ReadonlyMap<AbsPath, Module>`


/** Initial AST of a PEN program. */
export interface SourceProgram {
    readonly kind: 'SourceProgram';
    readonly modulesByAbsPath: ReadonlyMap<AbsPath, Module>;
    readonly mainPath: AbsPath;
}


/** List of node kinds that may be present in a SourceProgram AST. */
export const sourceNodeKinds = allNodeKinds.without(
    'Definition',
    'ReferenceExpression',
);
