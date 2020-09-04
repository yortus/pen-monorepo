import type {AbsPath} from '../../utils';
import type {Module} from './module';
import type {NodeKind} from './node-kind';


export type Expression<KS extends NodeKind = NodeKind> = {

    // Top-level nodes
    AbstractSyntaxTree: never,
    Module: never,

    // Binding nodes
    GlobalBinding: never,
    LocalBinding: never,
    LocalMultiBinding: never,

    // Expression nodes
    ApplicationExpression: ApplicationExpression<KS>,
    BooleanLiteralExpression: BooleanLiteralExpression,
    ExtensionExpression: ExtensionExpression,
    FieldExpression: FieldExpression<KS>,
    GlobalReferenceExpression: GlobalReferenceExpression,
    ImportExpression: ImportExpression,
    // LambdaExpression: LambdaExpression<KS>,
    ListExpression: ListExpression<KS>,
    LocalReferenceExpression: LocalReferenceExpression,
    MemberExpression: MemberExpression<KS>,
    ModuleExpression: ModuleExpression<KS>,
    NotExpression: NotExpression<KS>,
    NullLiteralExpression: NullLiteralExpression,
    NumericLiteralExpression: NumericLiteralExpression,
    ParenthesisedExpression: ParenthesisedExpression<KS>,
    QuantifiedExpression: QuantifiedExpression<KS>,
    RecordExpression: RecordExpression<KS>,
    SelectionExpression: SelectionExpression<KS>,
    SequenceExpression: SequenceExpression<KS>,
    StringLiteralExpression: StringLiteralExpression,
}[KS];


export interface ApplicationExpression<KS extends NodeKind = NodeKind> {
    readonly kind: 'ApplicationExpression';
    readonly lambda: Expression<KS>;
    readonly argument: Expression<KS>;
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


export interface FieldExpression<KS extends NodeKind = NodeKind> {
    readonly kind: 'FieldExpression';
    readonly name: Expression<KS>;
    readonly value: Expression<KS>;
}


export interface GlobalReferenceExpression {
    readonly kind: 'GlobalReferenceExpression';
    readonly localName: string;
    readonly globalName: string;
}


export interface ImportExpression {
    readonly kind: 'ImportExpression';
    readonly moduleSpecifier: string;
    readonly sourceFilePath: AbsPath;
}


// export interface LambdaExpression<KS extends AllNodeKinds = AllNodeKinds> {
//     readonly kind: 'LambdaExpression';
//     readonly pattern: Pattern<KS>;
//     readonly body: Expression<KS>;
// }


export interface ListExpression<KS extends NodeKind = NodeKind> {
    readonly kind: 'ListExpression';
    readonly elements: ReadonlyArray<Expression<KS>>;
}


export interface LocalReferenceExpression {
    readonly kind: 'LocalReferenceExpression';
    readonly localName: string;
}


export interface MemberExpression<KS extends NodeKind = NodeKind> {
    readonly kind: 'MemberExpression';
    readonly module: Expression<KS>;
    readonly bindingName: string;
}


export interface ModuleExpression<KS extends NodeKind = NodeKind> {
    readonly kind: 'ModuleExpression';
    readonly module: Module<KS>;
}


export interface NotExpression<KS extends NodeKind = NodeKind> {
    readonly kind: 'NotExpression';
    readonly expression: Expression<KS>;
}


export interface NullLiteralExpression {
    readonly kind: 'NullLiteralExpression';
    readonly value: null;
}


export interface NumericLiteralExpression {
    readonly kind: 'NumericLiteralExpression';
    readonly value: number;
}


export interface ParenthesisedExpression<KS extends NodeKind = NodeKind> {
    readonly kind: 'ParenthesisedExpression';
    readonly expression: Expression<KS>;
}


export interface QuantifiedExpression<KS extends NodeKind = NodeKind> {
    readonly kind: 'QuantifiedExpression';
    readonly expression: Expression<KS>;
    readonly quantifier: '?' | '*';
}


export interface RecordExpression<KS extends NodeKind = NodeKind> {
    readonly kind: 'RecordExpression';
    readonly fields: ReadonlyArray<{
        readonly name: string;
        readonly value: Expression<KS>;
    }>;
}


export interface SelectionExpression<KS extends NodeKind = NodeKind> {
    readonly kind: 'SelectionExpression';
    readonly expressions: ReadonlyArray<Expression<KS>>;
}


export interface SequenceExpression<KS extends NodeKind = NodeKind> {
    readonly kind: 'SequenceExpression';
    readonly expressions: ReadonlyArray<Expression<KS>>;
}


export interface StringLiteralExpression {
    readonly kind: 'StringLiteralExpression';
    readonly value: string;
    readonly concrete: boolean;
    readonly abstract: boolean;
}
