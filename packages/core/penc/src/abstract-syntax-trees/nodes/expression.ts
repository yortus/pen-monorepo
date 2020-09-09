import type {AbsPath} from '../../utils';
import type {Module} from './module';


export type Expression =
    | ApplicationExpression
    | BooleanLiteralExpression
    | ExtensionExpression
    | FieldExpression
    | GlobalReferenceExpression
    | ImportExpression
    // | LambdaExpression
    | ListExpression
    | LocalReferenceExpression
    | MemberExpression
    | ModuleExpression
    | NotExpression
    | NullLiteralExpression
    | NumericLiteralExpression
    | ParenthesisedExpression
    | QuantifiedExpression
    | RecordExpression
    | SelectionExpression
    | SequenceExpression
    | StringLiteralExpression
;


export interface ApplicationExpression {
    readonly kind: 'ApplicationExpression';
    readonly lambda: Expression;
    readonly argument: Expression;
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


export interface FieldExpression {
    readonly kind: 'FieldExpression';
    readonly name: Expression;
    readonly value: Expression;
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


// export interface LambdaExpression {
//     readonly kind: 'LambdaExpression';
//     readonly pattern: Pattern;
//     readonly body: Expression;
// }


export interface ListExpression {
    readonly kind: 'ListExpression';
    readonly elements: ReadonlyArray<Expression>;
}


export interface LocalReferenceExpression {
    readonly kind: 'LocalReferenceExpression';
    readonly localName: string;
}


export interface MemberExpression {
    readonly kind: 'MemberExpression';
    readonly module: Expression;
    readonly bindingName: string;
}


export interface ModuleExpression {
    readonly kind: 'ModuleExpression';
    readonly module: Module;
}


export interface NotExpression {
    readonly kind: 'NotExpression';
    readonly expression: Expression;
}


export interface NullLiteralExpression {
    readonly kind: 'NullLiteralExpression';
    readonly value: null;
}


export interface NumericLiteralExpression {
    readonly kind: 'NumericLiteralExpression';
    readonly value: number;
}


export interface ParenthesisedExpression {
    readonly kind: 'ParenthesisedExpression';
    readonly expression: Expression;
}


export interface QuantifiedExpression {
    readonly kind: 'QuantifiedExpression';
    readonly expression: Expression;
    readonly quantifier: '?' | '*';
}


export interface RecordExpression {
    readonly kind: 'RecordExpression';
    readonly fields: ReadonlyArray<{
        readonly name: string;
        readonly value: Expression;
    }>;
}


export interface SelectionExpression {
    readonly kind: 'SelectionExpression';
    readonly expressions: ReadonlyArray<Expression>;
}


export interface SequenceExpression {
    readonly kind: 'SequenceExpression';
    readonly expressions: ReadonlyArray<Expression>;
}


export interface StringLiteralExpression {
    readonly kind: 'StringLiteralExpression';
    readonly value: string;
    readonly concrete: boolean;
    readonly abstract: boolean;
}
