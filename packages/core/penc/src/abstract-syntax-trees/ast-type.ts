import {Binding, Expression, Node, NodeKind} from './nodes';


const AstBrand = Symbol();
type AstBrand = typeof AstBrand;


// TODO: doc... type-only 'brand' to associate representations with sets of AST node kinds
export interface AstType<NodeKinds extends NodeKind = any> {
    readonly [AstBrand]?: NodeKinds; // TODO: clean up?
}


// TODO: doc...
export type NodeKindsFromAstType<T extends AstType> = T extends AstType<infer NodeKinds> ? NodeKinds : never;


// TODO: doc...
export type NodeFromAstType<T extends AstType, K extends NodeKind | 'Binding' | 'Expression'> = NodeFromNodeKind<
    NodeKindsFromAstType<T>,
    K extends NodeKind ? K :
    K extends 'Expression' ? Expression['kind'] :
    K extends 'Binding' ? Binding['kind'] :
    never
>;


// TODO: doc helper
type NodeFromNodeKind<KS extends NodeKind, K extends NodeKind, N = Node<KS>> = N extends {kind: K} ? N : never;
