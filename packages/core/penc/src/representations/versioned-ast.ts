import type {AbsPath} from '../utils';

// TODO next:
// - [x] two versions of Module with different `bindings` types (RAW=Array<Binding>, N1=Record<string, Expression>)
// - [x] WONTFIX (no need) Module --> File (for RAW files), Namespace (for nested modules)
// - [ ] Module: support extra type parameter to constrain the type of the bindings (default = Expression)
// - [ ] more AST versions? Rename versions?
// TODO: versions...
// - RAW = as written in the source code (no TODO???)
// - V1/NORMAL (no ImportExpression, ParenthesisedExpression, TODO Binding stuff?)
// - TODO: resolved? flat?
export const RAW = 'RAW';
export const NORMAL = 'N1';
export type RAW = typeof RAW;
export type NORMAL = typeof NORMAL;
export type Version = RAW | NORMAL;


export interface AST<V extends Version = Version> {
    version: V;
    // TODO: jsdoc... special optional 'start' binding? Not doing that now, adding LetExpr syntax instead...
    module: Module<V>;
}


/** Union of all possible node types that may occur in a PEN AST. */
export type Node<V extends Version = Version> =
    | Binding<V>
    | Expression<V>
    | Pattern<V>
;


/** Union of all node types that bind names to expressions. */
export type Pattern<V extends Version = Version> =
    | ModulePattern<V>
;


/** Union of all node types that represent PEN expressions. */
export type Expression<V extends Version = Version> =
    | BooleanLiteral
    | FieldExpression<V>
    | Identifier
    | ImportExpression<V>
    | InstantiationExpression<V>
    | Intrinsic
    | GenericExpression<V>
    | ListExpression<V>
    | MemberExpression<V>
    | Module<V>
    | NotExpression<V>
    | NullLiteral
    | NumericLiteral
    | ParenthesisedExpression<V>
    | QuantifiedExpression<V>
    | RecordExpression<V>
    | SelectionExpression<V>
    | SequenceExpression<V>
    | StringLiteral
;


export type Binding<V extends Version> = {
    RAW: {
        kind: 'Binding';
        left: Identifier | Pattern<V>;
        right: Expression<V>;
    };
    N1: never;
}[V];


export interface BooleanLiteral {
    kind: 'BooleanLiteral';
    value: boolean;
}


export interface FieldExpression<V extends Version> {
    kind: 'FieldExpression';
    name: Expression<V>;
    value: Expression<V>;
}


export interface Identifier {
    kind: 'Identifier';
    name: string;
    resolved?: boolean;
}


export type ImportExpression<V extends Version> = {
    RAW: {
        kind: 'ImportExpression';
        moduleSpecifier: string;
    };
    N1: never;
}[V];


export interface InstantiationExpression<V extends Version> {
    kind: 'InstantiationExpression';
    generic: Expression<V>;
    argument: Expression<V>;
}


export interface Intrinsic {
    kind: 'Intrinsic';
    name: string;
    path: AbsPath;
}


export interface GenericExpression<V extends Version> {
    kind: 'GenericExpression';
    param: Identifier | Pattern<V>;
    body: Expression<V>;
}


export interface ListExpression<V extends Version> {
    kind: 'ListExpression';
    elements: Array<Expression<V>>;
}


export interface MemberExpression<V extends Version> {
    kind: 'MemberExpression';
    module: Expression<V>;
    member: Identifier;
}


// TODO: doc special optional 'start' binding? Not doing that now, adding LetExpr syntax instead...
export interface Module<V extends Version> {
    kind: 'Module';
    bindings: {
        RAW: Array<Binding<V>>;
        N1: Record<string, Expression<V>>;
    }[V];
}


export interface ModulePattern<_V> {
    kind: 'ModulePattern';
    names: Array<{
        name: string;
        alias?: string;
    }>;
}


export interface NotExpression<V extends Version> {
    kind: 'NotExpression';
    expression: Expression<V>;
}


export interface NullLiteral {
    kind: 'NullLiteral';
    value: null;
}


export interface NumericLiteral {
    kind: 'NumericLiteral';
    value: number;
}


export type ParenthesisedExpression<V extends Version> = {
    RAW: {
        kind: 'ParenthesisedExpression';
        expression: Expression<V>;
    };
    N1: never;
}[V];


export interface QuantifiedExpression<V extends Version> {
    kind: 'QuantifiedExpression';
    expression: Expression<V>;
    quantifier: '?' | '*';
}


export interface RecordExpression<V extends Version> {
    kind: 'RecordExpression';
    fields: Array<{
        name: string;
        value: Expression<V>;
    }>;
}


export interface SelectionExpression<V extends Version> {
    kind: 'SelectionExpression';
    expressions: Array<Expression<V>>;
}


export interface SequenceExpression<V extends Version> {
    kind: 'SequenceExpression';
    expressions: Array<Expression<V>>;
}


export interface StringLiteral {
    kind: 'StringLiteral';
    value: string;
    concrete: boolean;
    abstract: boolean;
}
