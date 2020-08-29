import {Binding, Expression, Node, NodeKind} from './nodes';


const AstBrand = Symbol();
type AstBrand = typeof AstBrand;


// TODO: doc... type-only 'brand' to associate representations with sets of AST node kinds
export interface AstType<NodeKinds extends NodeKind = NodeKind> {
    readonly [AstBrand]?: NodeKinds; // TODO: clean up?
}


// TODO: doc...
export type ExtractNodeKinds<T extends AstType> = T extends AstType<infer NodeKinds> ? NodeKinds : never;


// TODO: doc...
export type ExtractNode<T extends AstType, K extends NodeKind | 'Binding' | 'Expression'> = NodeFromNodeKind<
    ExtractNodeKinds<T>,
    K extends NodeKind ? K :
    K extends 'Expression' ? Expression['kind'] :
    K extends 'Binding' ? Binding['kind'] :
    never
>;


// TODO: doc helper
type NodeFromNodeKind<KS extends NodeKind, K extends NodeKind, N = Node<KS>> = N extends {kind: K} ? N : never;
