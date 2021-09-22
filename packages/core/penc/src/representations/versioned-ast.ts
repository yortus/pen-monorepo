import type {AbsPath} from '../utils';

// TODO next:
// - [x] two versions of Module with different `bindings` types (RAW=Array<Binding>, N1=Record<string, Expression>)
// - [x] WONTFIX (no need) Module --> File (for RAW files), Namespace (for nested modules)
// - [x] clarify Module/Namespace/Binding terminology
// - [x] support LetExpressions
// - [x] new AST version 300 - after resolution transform, no: LetExpression, FunctionExpression
// - [ ] impl/doc necessary extra rules for v300/post-resolution:
//       - intrinsic functions: cannot take functions as arg(s)    TODO: what would it take to lift this restriction?
// - [ ] simplify special handling/synthesis of 'start' and 'ENTRYPOINT' ids
// - [ ] different node for resolved Identifiers?
// - [ ] Module: support extra type parameter to constrain the type of the bindings (default = Expression)
// - [ ] more AST versions? Rename versions?
// TODO: versions...
// - 100 = as written in the source code; all bindings are BindingLists
// - 200 = no Binding, ImportExpression, ParenthesisedExpression; all bindings are BindingMaps
// - TODO: resolved? flat?
export type Version = 100 | 200 | 300 | 400;


export interface AST<V extends Version = Version> {
    version: V;
    // TODO: jsdoc... special optional 'start' binding? Not doing that now, adding LetExpr syntax instead...
    start: {
        100: Module<V>; // for a single source file (for V100, each source file is in a separate AST)
        200: {
            kind: 'MemberExpression';
            module: {
                kind: 'MemberExpression';
                module: Module<V, Module<V>>; // TODO: doc... one binding per source file, vals are source file asts
                member: string; // TODO: doc... always moduleName of `main` source file (Expected to define `start`)
            };
            member: 'start';
        };
        300: LetExpression<V>;
        400: LetExpression<V>;
    }[V];
}


/** Union of all possible node types that may occur in a PEN AST. */
export type Node<V extends Version = Version> =
    | Expression<V>
    | Pattern<V>
    | Binding<V>
    | Other<V>
;


/** Union of all node types that represent PEN expressions. */
export type Expression<V extends Version = Version> =
    | AbstractExpression<V>
    | ApplicationExpression<V>
    | BooleanLiteral
    | ByteExpression<V>
    | ConcreteExpression<V>
    | FunctionExpression<V>
    | FunctionParameter
    | Identifier
    | Intrinsic
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
    | StringExpression<V>
    | StringLiteral<V>
;


export type Subexpression<V extends Version = Version> = {
    '100-300': Expression<V>; // TODO: try removing LetExpr from V300 subexpr?
    rest: Identifier | FunctionParameter;
}[V extends 100 | 200 | 300 ? '100-300' : 'rest'];


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
    rest: never;
}[V extends 100 ? 100 : 'rest'];


/** Union of all node types not included elsewhere (eg clauses). */
export type Other<V extends Version = Version> =
    | Field<V>
    | Import<V>
    | Splice<V>
;


export interface AbstractExpression<V extends Version> {
    kind: 'AbstractExpression';
    expression: Subexpression<V>;
}


export interface ApplicationExpression<V extends Version> {
    kind: 'ApplicationExpression';
    function: Subexpression<V>;
    argument: Subexpression<V>;
}


export interface BooleanLiteral {
    kind: 'BooleanLiteral';
    value: boolean;
}


export type ByteExpression<V extends Version> = {
    100: never;
    rest: {
        kind: 'ByteExpression';
        subkind: 'A' | 'C' | 'X';
        include: Array<number | [min: number, max: number]>;
        exclude?: Array<number | [min: number, max: number]>;
        default: number;
    };
}[V extends 100 ? 100 : 'rest']


export interface ConcreteExpression<V extends Version> {
    kind: 'ConcreteExpression';
    expression: Subexpression<V>;
}


export interface Field<V extends Version> {
    kind: 'Field';
    label: string | Subexpression<V>;
    expression: Subexpression<V>;
}


export type FunctionExpression<V extends Version> = {
    100: {
        kind: 'FunctionExpression';
        param: Identifier | Pattern<V>;
        body: Subexpression<V>;
    };
    rest: {
        kind: 'FunctionExpression';
        param: string;
        body: LetExpression<V>;
    };
}[V extends 100 ? 100 : 'rest'];


export interface FunctionParameter {
    kind: 'FunctionParameter';
    name: string;
}


export interface Identifier {
    kind: 'Identifier';
    name: string;
}


export type Import<V extends Version> = {
    100: {
        kind: 'Import';
        moduleSpecifier: string;
        pattern: Identifier | Pattern<V>;
    };
    rest: never;
}[V extends 100 ? 100 : 'rest'];


export interface Intrinsic {
    kind: 'Intrinsic';
    name: string;
    path: AbsPath;
}


export interface LetExpression<V extends Version> {
    kind: 'LetExpression';
    expression: {
        '100-300': Expression<V>;
        rest: Identifier | FunctionParameter;
    }[V extends 100 | 200 | 300 ? '100-300' : 'rest'];
    bindings: {
        100: BindingList<V>;
        rest: BindingMap<V>;
    }[V extends 100 ? 100 : 'rest'];
}


export interface ListExpression<V extends Version> {
    kind: 'ListExpression';
    items: Array<Subexpression<V> | Splice<V>>;
}


export interface MemberExpression<V extends Version> {
    kind: 'MemberExpression';
    module: Subexpression<V>;
    member: string;
}


export interface Module<V extends Version, Value extends Expression<V> = Expression<V>> {
    kind: 'Module';
    imports: {
        100: Array<Import<V>>;
        rest: never[];
    }[V extends 100 ? 100 : 'rest'];
    bindings: {
        100: BindingList<V>;
        200: BindingMap<V, Value>;
        rest: BindingMap<V, Identifier>;
    }[V extends 100 ? 100 : V extends 200 ? 200 : 'rest'];
}


export type ModulePattern<V extends Version> = {
    100: {
        kind: 'ModulePattern';
        names: Array<{
            name: string;
            alias?: string;
        }>;
    };
    rest: never;
}[V extends 100 ? 100 : 'rest'];


export interface NotExpression<V extends Version> {
    kind: 'NotExpression';
    expression: Subexpression<V>;
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
        expression: Subexpression<V>;
    };
    rest: never;
}[V extends 100 ? 100 : 'rest'];


export interface QuantifiedExpression<V extends Version> {
    kind: 'QuantifiedExpression';
    expression: Subexpression<V>;
    quantifier: '?' | '*';
}


export interface RecordExpression<V extends Version> {
    kind: 'RecordExpression';
    items: Array<Field<V> | Splice<V>>;
}


export interface SelectionExpression<V extends Version> {
    kind: 'SelectionExpression';
    expressions: Array<Subexpression<V>>;
}


export interface SequenceExpression<V extends Version> {
    kind: 'SequenceExpression';
    expressions: Array<Subexpression<V>>;
}


export interface Splice<V extends Version> {
    kind: 'Splice';
    expression: Subexpression<V>;
}


export type StringExpression<V extends Version> = {
    100: {
        kind: 'StringExpression';
        subkind: 'A' | 'C' | 'X';
        items: Array<string | [number, number] | Expression<V>>;
    };
    rest: never;
}[V extends 100 ? 100 : 'rest'];


export type StringLiteral<V extends Version> = {
    100: never;
    rest: {
        kind: 'StringLiteral';
        subkind: 'A' | 'C' | 'X';
        value: string;
    };
}[V extends 100 ? 100 : 'rest']


export type BindingList<V extends Version> = Array<Binding<V>>;
export type BindingMap<V extends Version, Value extends Expression<V> = Expression<V>> = Record<string, Value>;
