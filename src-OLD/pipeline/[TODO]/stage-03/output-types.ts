import * as V01 from '../stage-01/output-types';
import {Scope, SymbolInfo} from './scope';


// ====================   Main types   ====================
export type Ast = Module;


export type Node =
    | Binding
    | Expression
    | V01.FieldPattern<{Pattern: Pattern}>
    | Module<{Binding: Binding}>
    | Pattern;


export type Binding =
    | V01.DynamicBinding<{Expression: Expression}>
    | V01.ExportBinding<{Expression: Expression}>
    | V01.ShorthandBinding
    | V01.StaticBinding<{Expression: Expression, Pattern: Pattern}>;


export type Pattern =
    | V01.RecordPattern<{Pattern: Pattern}>
    | V01.TuplePattern<{Pattern: Pattern}>
    | V01.VariablePattern
    | V01.WildcardPattern;


export type Expression =
    | V01.ApplicationExpression<{Expression: Expression}>
    | V01.CharacterExpression
    | V01.FunctionExpression<{Expression: Expression, Pattern: Pattern}>
    | V01.ImportExpression
    | V01.LabelExpression
    | RecordExpression<{Binding: Binding}>
    | V01.ReferenceExpression
    | V01.SelectionExpression<{Expression: Expression}>
    | V01.SequenceExpression<{Expression: Expression}>
    | V01.StaticMemberExpression<{Expression: Expression}>
    | V01.StringExpression
    | V01.ThisExpression
    | V01.TupleExpression<{Expression: Expression}>;


// ====================   Modified Nodes   ====================
export interface Module<V extends {Binding: any}> extends V01.Module<V> {
    readonly scope: Scope;
}


export interface RecordExpression<V extends {Binding: any}> extends V01.RecordExpression<V> {
    readonly scope: Scope;
}


// export interface Definition<Expr> extends V01.Definition<Expr> {
//     readonly symbol: SymbolInfo;
// }


// export interface Block<Expr> extends V01.Block<Expr> {
//     readonly definitions: ReadonlyArray<Definition<Expr>>;
//     readonly scope: Scope;
// }


// export interface ImportNames extends V01.ImportNames {
//     readonly symbols: readonly SymbolInfo[];
// }


// export interface ImportNamespace extends V01.ImportNamespace {
//     readonly symbol: SymbolInfo;
// }


// ====================   Unmodified Nodes   ====================
export {
    ApplicationExpression,
    CharacterExpression,
    DynamicBinding,
    ExportBinding,
    FieldPattern,
    FunctionExpression,
    ImportExpression,
    LabelExpression,
    RecordPattern,
    ReferenceExpression,
    SelectionExpression,
    SequenceExpression,
    ShorthandBinding,
    StaticBinding,
    StaticMemberExpression,
    StringExpression,
    ThisExpression,
    TupleExpression,
    TuplePattern,
    VariablePattern,
    WildcardPattern,
} from '../stage-01/output-types';
