import {AbstractSyntaxTree, Binding, Expression, Node, NodeKind} from './nodes';


// TODO: doc...
export type ExtractNode<T extends AbstractSyntaxTree, K extends NodeKind | 'Binding' | 'Expression' = NodeKind> = NodeFromNodeKind<
    ExtractNodeKinds<T>,
    K extends NodeKind ? K :
    K extends 'Expression' ? Expression['kind'] :
    K extends 'Binding' ? Binding['kind'] :
    never
>;


// TODO: doc helper
type NodeFromNodeKind<KS extends NodeKind, K extends NodeKind, N = Node<KS>> = N extends {kind: K} ? N : never;


// TODO: doc helper
type ExtractNodeKinds<T extends AbstractSyntaxTree> = T extends AbstractSyntaxTree<infer NodeKinds> ? NodeKinds : never;
