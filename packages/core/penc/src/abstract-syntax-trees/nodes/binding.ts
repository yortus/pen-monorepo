import type {Expression} from './expression';
import type {NodeKind} from './node-kind';


export type Binding<KS extends NodeKind = NodeKind> = {

    // Top-level nodes
    AbstractSyntaxTree: never,
    Module: never,

    // Binding nodes
    GlobalBinding: GlobalBinding<KS>,
    LocalBinding: LocalBinding<KS>,
    LocalMultiBinding: LocalMultiBinding<KS>,

    // Expression nodes
    ApplicationExpression: never,
    BooleanLiteralExpression: never,
    ExtensionExpression: never,
    FieldExpression: never,
    GlobalReferenceExpression: never,
    ImportExpression: never,
    // LambdaExpression: never,
    ListExpression: never,
    LocalReferenceExpression: never,
    MemberExpression: never,
    ModuleExpression: never,
    NotExpression: never,
    NullLiteralExpression: never,
    NumericLiteralExpression: never,
    ParenthesisedExpression: never,
    QuantifiedExpression: never,
    RecordExpression: never,
    SelectionExpression: never,
    SequenceExpression: never,
    StringLiteralExpression: never,
}[KS];


export interface GlobalBinding<KS extends NodeKind = NodeKind> {
    readonly kind: 'GlobalBinding';
    readonly localName: string;
    readonly globalName: string;
    readonly value: Expression<KS>;
    readonly exported: boolean;
}


export interface LocalBinding<KS extends NodeKind = NodeKind> {
    readonly kind: 'LocalBinding';
    readonly localName: string;
    readonly value: Expression<KS>;
    readonly exported: boolean;
}


export interface LocalMultiBinding<KS extends NodeKind = NodeKind> {
    readonly kind: 'LocalMultiBinding';
    readonly names: ReadonlyArray<{
        readonly name: string;
        readonly alias?: string;
    }>;
    readonly value: Expression<KS>;
    readonly exported: boolean;
}
