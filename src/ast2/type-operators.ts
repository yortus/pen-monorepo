// TODO: make all nodes DeepReadonly
// Implement:
// - node builder for VB, given node builder for VA
// - getChildNodes for VB, given getChildNodes for VA
// - matchNode for VB, given matchNode for VA
// - transformAst for VA -> VB

// Ast 'class' members:
// - createNode
// - getChildNodes
// - matchNode
// - transformTo / transformFrom (or externalise this?)


import {TotalAstDefinition} from './total-ast-definition';


export type AstVersion = keyof TotalAstDefinition;


export type Node<V extends AstVersion = AstVersion>
    = NodeKind extends infer U ? (U extends keyof Ast<V> ? Ast<V>[U] : never) : never;


export type Expression<V extends AstVersion> = Node<V> extends infer U
    ? (U extends {isExpression: true} ? U : never)
    : never;


export type NodeKind = keyof Ast<AstVersion>;


/** Helper type that resolves to the node type corresponding to the node kind given by `K`. */
export type NodeFromKind<V extends AstVersion, K extends NodeKind>
    = K extends keyof Ast<V> ? Ast<V>[K] : never;

export type KindFromNode<N> = N extends {kind: infer U} ? U extends NodeKind ? U : never : never;

export type AstTransform<V extends AstVersion, Vᐟ extends AstVersion>
    = <K extends NodeKind>(node: NodeFromKind<V, K>) => NodeFromKind<Vᐟ, K>;


// TODO: temp testing...
// type App100 = Ast<100>['ModuleDefinition'];
// type App200 = Ast<200>['ModuleDefinition'];
// type App300 = Ast<300>['ModuleDefinition'];
// let a100!: App100;
// let a200!: App200;
// let a300!: App300;
// a100.block;
// a200.block;
// a300.block;
// let k!: NodeKind;
// let n1!: Node<AstVersion>;
// let n2!: Node<200>;
// if (n1.kind === 'Block') n1.;
// n2.kind;
// let n3!: NodeFromKind<200, 'Block' | 'Reference'>;
// n3.kind;
// if (n3.kind === 'Reference') n3.
// let e1!: Expression<300>;
// e1.kind
// let t1!: AstTransform<200, 300>;
// let u1 = t1(n3);
// u1.kind;


// TODO: helpers...
type Ast<V extends AstVersion, C = CumulativeVersion<V>>
    = UnionToIntersection<C extends AstVersion ? TotalAstDefinition<V>[C] : never>;


type CumulativeVersion<V extends AstVersion> =
    V extends 300 ? 300 | 200 | 100 :
    V extends 200 ? 200 | 100 :
    100;


type UnionToIntersection<U> = (U extends any ? (k: U) => void : never) extends ((k: infer I) => void) ? I : never;
