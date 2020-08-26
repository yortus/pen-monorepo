import {Expression, Node, NodeKind} from './nodes';
import {Ast} from './ast';


// TODO: temp testing........
export * from './nodes';
export {Ast} from './ast';
export {SourceFileGraph, SourceFileInfo} from './01-source-file-graph';
export {SourceProgram} from './02-source-program';
export {DesugaredProgram} from './03-desugared-program';
export {ResolvedProgram} from './04-resolved-program';


// TODO: temp testing........
export type NodeKindsFromAst<T extends Ast> = T extends Ast<infer NodeKinds> ? NodeKinds : never;
export type NodeFromAst<T extends Ast, K extends NodeKind | 'Expression'> = NodeFromNodeKind<
    NodeKindsFromAst<T>,
    K extends NodeKind ? K :
    K extends 'Expression' ? Expression['kind'] :
    never
>;


type NodeFromNodeKind<KS extends NodeKind, K extends NodeKind, N = Node<KS>> = N extends {kind: K} ? N : never;
















