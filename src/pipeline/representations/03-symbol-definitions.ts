import {Scope, Symbol} from '../scopes-and-symbols';
import * as Prev from './02-source-file-asts';


// ====================   Node types by category   ====================
export type Node =
    | TopLevel
    | Binding
    | Expression
    | Pattern
    | Other;


type TopLevel =
    | Module<{Binding: Binding}>
    | Program<{Module: Module<{Binding: Binding}>}>
    | Prev.SourceFile<{Module: Module<{Binding: Binding}>}>;

export type Binding =
    | Prev.InternalBinding<{Expression: Expression, Pattern: Pattern}>
    | Prev.ExportedBinding<{Expression: Expression, Pattern: Pattern}>;


export type Pattern =
    | ModulePattern
    | VariablePattern;


export type Expression =
    | Prev.ApplicationExpression<{Expression: Expression}>
    | Prev.CharacterExpression
    | FunctionExpression<{Expression: Expression, Pattern: Pattern}>
    | Prev.ImportExpression
    | Prev.LabelExpression
    | Prev.ListExpression<{Expression: Expression}>
    | Prev.ModuleExpression<{Module: Module<{Binding: Binding}>}>
    | Prev.RecordExpression<{Expression: Expression}>
    | Prev.ReferenceExpression
    | Prev.SelectionExpression<{Expression: Expression}>
    | Prev.SequenceExpression<{Expression: Expression}>
    | Prev.StaticMemberExpression<{Expression: Expression}>
    | Prev.StringExpression;


type Other =
    | Prev.DynamicField<{Expression: Expression}>
    | ModulePatternName
    | Prev.StaticField<{Expression: Expression}>;


// ====================   Modified Nodes   ====================
export interface Program<V extends {Module: any}> extends Prev.Program<V> {
    readonly scope: Scope;
}


export interface Module<V extends {Binding: any}> extends Prev.Module<V> {
    readonly scope: Scope;
}


export interface FunctionExpression<V extends {Expression: any, Pattern: any}> extends Prev.FunctionExpression<V> {
    readonly scope: Scope;
}


export interface VariablePattern extends Prev.VariablePattern {
    readonly symbol: Symbol;
}


export interface ModulePattern extends Prev.ModulePattern {
    readonly names: ReadonlyArray<ModulePatternName>;
}


export interface ModulePatternName extends Prev.ModulePatternName {
    readonly symbol: Symbol;
}


// ====================   Unmodified Nodes   ====================
export {
    ApplicationExpression,
    CharacterExpression,
    DynamicField,
    ExportedBinding,
    ImportExpression,
    InternalBinding,
    LabelExpression,
    ListExpression,
    ModuleExpression,
    RecordExpression,
    ReferenceExpression,
    SelectionExpression,
    SequenceExpression,
    SourceFile,
    StaticField,
    StaticMemberExpression,
    StringExpression,
} from './02-source-file-asts';
