import type {AbsPath} from '../../utils';
import type {Binding} from './binding';
import type {Pattern} from './pattern';


/** Union of all node types that represent PEN expressions. */
export type Expression =
    | BindingList
    | BooleanLiteral
    | FieldExpression
    | Identifier
    | ImportExpression
    | InstantiationExpression
    | Intrinsic
    | GenericExpression
    | ListExpression
    | MemberExpression
    | Module
    | NotExpression
    | NullLiteral
    | NumericLiteral
    | ParenthesisedExpression
    | QuantifiedExpression
    | RecordExpression
    | SelectionExpression
    | SequenceExpression
    | StringLiteral
;


export interface BindingList {
    readonly kind: 'BindingList';
    readonly bindings: ReadonlyArray<Binding>;
}


export interface BooleanLiteral {
    readonly kind: 'BooleanLiteral';
    readonly value: boolean;
}


export interface FieldExpression {
    readonly kind: 'FieldExpression';
    readonly name: Expression;
    readonly value: Expression;
}


export interface Identifier {
    readonly kind: 'Identifier';
    readonly name: string;
    readonly resolved?: boolean;
}


export interface ImportExpression {
    readonly kind: 'ImportExpression';
    readonly moduleSpecifier: string;
}


export interface InstantiationExpression {
    readonly kind: 'InstantiationExpression';
    readonly generic: Expression;
    readonly argument: Expression;
}


export interface Intrinsic {
    readonly kind: 'Intrinsic';
    readonly name: string;
    readonly path: AbsPath;
}


export interface GenericExpression {
    readonly kind: 'GenericExpression';
    readonly param: Identifier | Pattern;
    readonly body: Expression;
}


export interface ListExpression {
    readonly kind: 'ListExpression';
    readonly elements: ReadonlyArray<Expression>;
}


export interface MemberExpression {
    readonly kind: 'MemberExpression';
    readonly module: Expression;
    readonly member: Identifier;
}


export interface Module {
    readonly kind: 'Module';
    readonly bindings: Readonly<Record<string, Expression>>; // TODO: doc special optional 'start' binding
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
