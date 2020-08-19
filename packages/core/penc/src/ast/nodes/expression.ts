import {Module, NodeKind} from '../../ast-nodes';
import {AbsPath} from '../../utils';
import {FilterKinds} from './util';


export type Expression<KS extends NodeKind = NodeKind> = FilterKinds<KS,
    | ApplicationExpression<KS>
    | BooleanLiteralExpression
    | ExtensionExpression
    | FieldExpression<KS>
    | ImportExpression
    // | LambdaExpression<KS>
    | ListExpression<KS>
    | MemberExpression<KS>
    | ModuleExpression<KS>
    | NotExpression<KS>
    | NullLiteralExpression
    | NumericLiteralExpression
    | ParenthesisedExpression<KS>
    | QuantifiedExpression<KS>
    | RecordExpression<KS>
    | ReferenceExpression
    | SelectionExpression<KS>
    | SequenceExpression<KS>
    | StringLiteralExpression
    | UnresolvedReferenceExpression
>;


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


export interface ImportExpression {
    readonly kind: 'ImportExpression';
    readonly moduleSpecifier: string;
    readonly sourceFilePath: AbsPath;
}


export interface ListExpression<KS extends NodeKind = NodeKind> {
    readonly kind: 'ListExpression';
    readonly elements: ReadonlyArray<Expression<KS>>;
}


// export interface LambdaExpression<KS extends AllNodeKinds = AllNodeKinds> {
//     readonly kind: 'LambdaExpression';
//     readonly pattern: Pattern<KS>;
//     readonly body: Expression<KS>;
// }


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


export interface ReferenceExpression {
    readonly kind: 'ReferenceExpression';
    readonly globalName: string;
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


export interface UnresolvedReferenceExpression {
    readonly kind: 'UnresolvedReferenceExpression';
    readonly localName: string;
}
