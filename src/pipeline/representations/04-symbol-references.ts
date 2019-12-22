import {Symbol} from '../scopes-and-symbols';
import * as Prev from './03-symbol-definitions';


// ====================   Node types by category   ====================
export type Node =
    | TopLevel
    | Binding
    | Expression
    | Pattern
    | Other;


type TopLevel =
    | Prev.Module<{Binding: Binding}>
    | Prev.Program<{Module: Prev.Module<{Binding: Binding}>}>
    | Prev.SourceFile<{Module: Prev.Module<{Binding: Binding}>}>;

export type Binding =
    | Prev.InternalBinding<{Expression: Expression, Pattern: Pattern}>
    | Prev.ExportedBinding<{Expression: Expression, Pattern: Pattern}>;


export type Pattern =
    | Prev.ModulePattern
    | Prev.VariablePattern;


export type Expression =
    | Prev.ApplicationExpression<{Expression: Expression}>
    | Prev.CharacterExpression
    | Prev.FunctionExpression<{Expression: Expression, Pattern: Pattern}>
    | Prev.ImportExpression
    | Prev.LabelExpression
    | Prev.ListExpression<{Expression: Expression}>
    | Prev.ModuleExpression<{Module: Prev.Module<{Binding: Binding}>}>
    | Prev.RecordExpression<{Expression: Expression}>
    | ReferenceExpression
    | Prev.SelectionExpression<{Expression: Expression}>
    | Prev.SequenceExpression<{Expression: Expression}>
    | Prev.StaticMemberExpression<{Expression: Expression}>
    | Prev.StringExpression;


type Other =
    | Prev.DynamicField<{Expression: Expression}>
    | Prev.ModulePatternName
    | Prev.StaticField<{Expression: Expression}>;


// ====================   Modified Nodes   ====================
export interface ReferenceExpression extends Prev.ReferenceExpression {
    readonly symbol: Symbol;
}


// ====================   Unmodified Nodes   ====================
export {
    ApplicationExpression,
    CharacterExpression,
    DynamicField,
    ExportedBinding,
    FunctionExpression,
    ImportExpression,
    InternalBinding,
    LabelExpression,
    ListExpression,
    Module,
    ModuleExpression,
    ModulePattern,
    ModulePatternName,
    Program,
    RecordExpression,
    SelectionExpression,
    SequenceExpression,
    SourceFile,
    StaticField,
    StaticMemberExpression,
    StringExpression,
    VariablePattern,
} from './03-symbol-definitions';
