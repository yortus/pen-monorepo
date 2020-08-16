import {AbsPath} from './utils';


// TODO: temp testing...
export const BindingKind = ['SimpleBinding', 'UnresolvedDestructuredBinding', 'UnresolvedSimpleBinding'] as const;
export type BindingKind = (typeof BindingKind)[any];
export const ExpressionKind = [
    'ApplicationExpression', 'BooleanLiteralExpression', 'ExtensionExpression', 'FieldExpression', 'ImportExpression',
    /*'LambdaExpression', */'ListExpression', 'MemberExpression', 'ModuleExpression', 'NotExpression',
    'NullLiteralExpression', 'NumericLiteralExpression', 'ParenthesisedExpression', 'QuantifiedExpression',
    'RecordExpression', 'ReferenceExpression', 'SelectionExpression', 'SequenceExpression',
    'StringLiteralExpression', 'UnresolvedReferenceExpression',
] as const;
export type ExpressionKind = (typeof ExpressionKind)[any];
export const NodeKind = ['Module', 'Program', ...BindingKind, ...ExpressionKind] as const;
export type NodeKind = (typeof NodeKind)[any];



// ====================   Node types by category   ====================
export type Node<K extends NodeKind = NodeKind> = Filter<K,
    | Binding<K>
    | Expression<K>
    | Module<K>
    | Program<K>
>;


export type Binding<K extends NodeKind = NodeKind> = Filter<K,
    | SimpleBinding<K>
    | UnresolvedDestructuredBinding<K>
    | UnresolvedSimpleBinding<K>
>;


export type Expression<K extends NodeKind = NodeKind> = Filter<K,
    | ApplicationExpression<K>
    | BooleanLiteralExpression
    | ExtensionExpression
    | FieldExpression<K>
    | ImportExpression
    // | LambdaExpression<K>
    | ListExpression<K>
    | MemberExpression<K>
    | ModuleExpression<K>
    | NotExpression<K>
    | NullLiteralExpression
    | NumericLiteralExpression
    | ParenthesisedExpression<K>
    | QuantifiedExpression<K>
    | RecordExpression<K>
    | ReferenceExpression
    | SelectionExpression<K>
    | SequenceExpression<K>
    | StringLiteralExpression
    | UnresolvedReferenceExpression
>;


// ====================   Top-level nodes   ====================
export interface Module<K extends NodeKind = NodeKind> {
    readonly kind: 'Module';
    readonly bindings: ReadonlyArray<Binding<K>>;
    readonly path?: AbsPath;
}


export interface Program<K extends NodeKind = NodeKind> {
    readonly kind: 'Program';
    readonly sourceFiles: ReadonlyMap<AbsPath, Module<K>>;
    readonly mainPath: AbsPath;
    readonly startSymbolId?: string;
}


// ====================   Binding nodes   ====================
export interface SimpleBinding<K extends NodeKind = NodeKind> {
    readonly kind: 'SimpleBinding';
    readonly name: string;
    readonly value: Expression<K>;
    readonly exported: boolean;
    readonly symbolId: string;
}


export interface UnresolvedDestructuredBinding<K extends NodeKind = NodeKind> {
    readonly kind: 'UnresolvedDestructuredBinding';
    readonly names: ReadonlyArray<{
        readonly name: string;
        readonly alias?: string;
    }>;
    readonly value: Expression<K>;
    readonly exported: boolean;
}


export interface UnresolvedSimpleBinding<K extends NodeKind = NodeKind> {
    readonly kind: 'UnresolvedSimpleBinding';
    readonly name: string;
    readonly value: Expression<K>;
    readonly exported: boolean;
}


// ====================   Expression nodes   ====================
export interface ApplicationExpression<K extends NodeKind = NodeKind> {
    readonly kind: 'ApplicationExpression';
    readonly lambda: Expression<K>;
    readonly argument: Expression<K>;
}


export interface BooleanLiteralExpression {
    readonly kind: 'BooleanLiteralExpression';
    readonly value: boolean;
}


export interface ExtensionExpression {
    readonly kind: 'ExtensionExpression';
    readonly extensionPath: AbsPath;
    readonly bindingName: string;
}


export interface FieldExpression<K extends NodeKind = NodeKind> {
    readonly kind: 'FieldExpression';
    readonly name: Expression<K>;
    readonly value: Expression<K>;
}


export interface ImportExpression {
    readonly kind: 'ImportExpression';
    readonly moduleSpecifier: string;
    readonly sourceFilePath: AbsPath;
}


export interface ListExpression<K extends NodeKind = NodeKind> {
    readonly kind: 'ListExpression';
    readonly elements: ReadonlyArray<Expression<K>>;
}


// export interface LambdaExpression<K extends AllNodeKinds = AllNodeKinds> {
//     readonly kind: 'LambdaExpression';
//     readonly pattern: Pattern<K>;
//     readonly body: Expression<K>;
// }


export interface MemberExpression<K extends NodeKind = NodeKind> {
    readonly kind: 'MemberExpression';
    readonly module: Expression<K>;
    readonly bindingName: string;
}


export interface ModuleExpression<K extends NodeKind = NodeKind> {
    readonly kind: 'ModuleExpression';
    readonly module: Module<K>;
}


export interface NotExpression<K extends NodeKind = NodeKind> {
    readonly kind: 'NotExpression';
    readonly expression: Expression<K>;
}


export interface NullLiteralExpression {
    readonly kind: 'NullLiteralExpression';
    readonly value: null;
}


export interface NumericLiteralExpression {
    readonly kind: 'NumericLiteralExpression';
    readonly value: number;
}


export interface ParenthesisedExpression<K extends NodeKind = NodeKind> {
    readonly kind: 'ParenthesisedExpression';
    readonly expression: Expression<K>;
}


export interface QuantifiedExpression<K extends NodeKind = NodeKind> {
    readonly kind: 'QuantifiedExpression';
    readonly expression: Expression<K>;
    readonly quantifier: '?' | '*';
}


export interface RecordExpression<K extends NodeKind = NodeKind> {
    readonly kind: 'RecordExpression';
    readonly fields: ReadonlyArray<{
        readonly name: string;
        readonly value: Expression<K>;
    }>;
}


export interface ReferenceExpression {
    readonly kind: 'ReferenceExpression';
    readonly name: string;
    readonly symbolId: string;
}


export interface SelectionExpression<K extends NodeKind = NodeKind> {
    readonly kind: 'SelectionExpression';
    readonly expressions: ReadonlyArray<Expression<K>>;
}


export interface SequenceExpression<K extends NodeKind = NodeKind> {
    readonly kind: 'SequenceExpression';
    readonly expressions: ReadonlyArray<Expression<K>>;
}


export interface StringLiteralExpression {
    readonly kind: 'StringLiteralExpression';
    readonly value: string;
    readonly concrete: boolean;
    readonly abstract: boolean;
}


export interface UnresolvedReferenceExpression {
    readonly kind: 'UnresolvedReferenceExpression';
    readonly name: string;
}


// TODO: Helper type
type Filter<K extends NodeKind, N> = N extends {kind: K} ? N : never;
