import type {AbsPath} from '../utils';

// TODO next:
// - [x] two versions of Module with different `bindings` types (RAW=Array<Binding>, N1=Record<string, Expression>)
// - [x] WONTFIX (no need) Module --> File (for RAW files), Namespace (for nested modules)
// - [x] clarify Module/Namespace/Binding terminology
// - [x] support LetExpressions
// - [x] new AST version 300 - after resolution transform, no: LetExpression, GenericExpression
// - [ ] impl/doc necessary extra rules for v300/post-resolution:
//       - intrinsic generics: cannot take generics as arg(s)    TODO: what would it take to lift this restriction?
// - [ ] simplify special handling/synthesis of 'start' and 'ENTRYPOINT' ids
// - [ ] different node for resolved Identifiers?
// - [ ] Module: support extra type parameter to constrain the type of the bindings (default = Expression)
// - [ ] more AST versions? Rename versions?
// TODO: versions...
// - 100 = as written in the source code; all bindings are BindingLists
// - 200 = no Binding, ImportExpression, ParenthesisedExpression; all bindings are BindingMaps
// - TODO: resolved? flat?
export type Version = 100 | 200 | 300;


export interface AST<V extends Version = Version> {
    version: V;
    // TODO: jsdoc... special optional 'start' binding? Not doing that now, adding LetExpr syntax instead...
    module: Module<V>;
}


/** Union of all possible node types that may occur in a PEN AST. */
export type Node<V extends Version = Version> =
    | Expression<V>
    | Pattern<V>
    | Binding<V>
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
    | LetExpression<V>
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


/** Union of all node types that bind names to expressions. */
export type Pattern<V extends Version = Version> =
    | ModulePattern<V>
;


export type Binding<V extends Version> = {
    100: {
        kind: 'Binding';
        left: Identifier | Pattern<V>;
        right: Expression<V>;
    };
    200: never;
    300: never;
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
    // TODO:
    // unbound?: boolean; // or isParam?: boolean
    // - affects hashing - these are hashed by name not value (nominal)
    //   - this supports hoisting expressions out of genbody scopes where possible
    //   - this ensures expressions that differ only by this identifier don't get the same hash code
}


export type ImportExpression<V extends Version> = {
    100: {
        kind: 'ImportExpression';
        moduleSpecifier: string;
    };
    200: never;
    300: never;
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


export type GenericExpression<V extends Version> = {
    [x: string]: {
        kind: 'GenericExpression';
        param: Identifier | Pattern<V>;
        body: Expression<V>;
    };
    300: never;
}[V];


export type LetExpression<V extends Version> = {
    [x: string]: {
        kind: 'LetExpression';
        expression: Expression<V>;
        bindings: {
            100: BindingList<V>;
            200: BindingMap<V>;
            300: never;
        }[V];
    };
    300: never;
}[V];


export interface ListExpression<V extends Version> {
    kind: 'ListExpression';
    elements: Array<Expression<V>>;
}


export interface MemberExpression<V extends Version> {
    kind: 'MemberExpression';
    module: Expression<V>;
    member: string;
}


export interface Module<V extends Version> {
    kind: 'Module';
    bindings: {
        100: BindingList<V>;
        200: BindingMap<V>;
        300: BindingMap<V>;
    }[V];
}


export type ModulePattern<V extends Version> = {
    100: {
        kind: 'ModulePattern';
        names: Array<{
            name: string;
            alias?: string;
        }>;
    };
    200: never;
    300: never;
}[V];


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
    100: {
        kind: 'ParenthesisedExpression';
        expression: Expression<V>;
    };
    200: never;
    300: never;
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


export type BindingList<V extends Version> = Array<Binding<V>>;
export type BindingMap<V extends Version> = Record<string, Expression<V>>;
