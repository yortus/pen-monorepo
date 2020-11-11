import type {AbsPath} from '../../utils';
import type {Binding} from './binding';


/** Union of all node types that represent PEN expressions. */
export type Expression =
    | ApplicationExpression
    | BooleanLiteral
    | FieldExpression
    | Identifier
    | ImportExpression
    | Intrinsic
    // | LambdaExpression
    | ListExpression
    | MemberExpression
    | ModuleExpression
    | NotExpression
    | NullLiteral
    | NumericLiteral
    | ParenthesisedExpression
    | QuantifiedExpression
    | RecordExpression
    | Reference
    | SelectionExpression
    | SequenceExpression
    | StringLiteral
;


export interface ApplicationExpression {
    readonly kind: 'ApplicationExpression';
    readonly lambda: Expression;
    readonly argument: Expression;
}


export interface BooleanLiteral {
    readonly kind: 'BooleanLiteral';
    readonly value: boolean;
}


export interface Intrinsic {
    readonly kind: 'Intrinsic';
    readonly name: string;
    readonly path: AbsPath;
}


export interface FieldExpression {
    readonly kind: 'FieldExpression';
    readonly name: Expression;
    readonly value: Expression;
}


export interface Identifier {
    readonly kind: 'Identifier';
    readonly name: string;
}


export interface ImportExpression {
    readonly kind: 'ImportExpression';
    readonly path: AbsPath;
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


export interface MemberExpression {
    readonly kind: 'MemberExpression';
    readonly module: Expression;
    readonly member: Identifier;
}


export interface ModuleExpression {
    readonly kind: 'ModuleExpression';
    readonly bindings: ReadonlyArray<Binding>;
}


export interface NotExpression {
    readonly kind: 'NotExpression';
    readonly expression: Expression;
}


export interface NullLiteral {
    readonly kind: 'NullLiteral';
    readonly value: null;
}


export interface NumericLiteral {
    readonly kind: 'NumericLiteral';
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


export interface Reference {
    readonly kind: 'Reference';
    readonly definitionId: number;
}


export interface SelectionExpression {
    readonly kind: 'SelectionExpression';
    readonly expressions: ReadonlyArray<Expression>;
}


export interface SequenceExpression {
    readonly kind: 'SequenceExpression';
    readonly expressions: ReadonlyArray<Expression>;
}


export interface StringLiteral {
    readonly kind: 'StringLiteral';
    readonly value: string;
    readonly concrete: boolean;
    readonly abstract: boolean;
}
