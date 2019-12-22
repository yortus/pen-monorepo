import * as Prev from './02-source-file-asts';


// ====================   Scopes and Symbols   ====================
export type Scope = GlobalScope | ModuleScope | FunctionScope;


export interface GlobalScope {
    kind: 'GlobalScope';
    symbols: Map<string, Symbol>; // maps name to symbol info
}


export interface ModuleScope {
    kind: 'ModuleScope';
    parent: Scope;
    symbols: Map<string, Symbol>; // maps name to symbol info
}


export interface FunctionScope {
    kind: 'FunctionScope';
    parent: Scope;
    symbols: Map<string, Symbol>; // maps name to symbol info
}


export interface Symbol {
    name: string;

    // TODO: review these members...
    // isImported?: boolean;
    // isExported?: boolean;
    // members?: SymbolInfo[];
}


// ====================   Node types by category   ====================
export type Node =
    | TopLevel
    | Binding
    | Expression
    | Pattern
    | Other;


type TopLevel =
    | Module<{Binding: Binding}>
    | Prev.Program<{Binding: Binding}>
    | Prev.SourceFile<{Binding: Binding}>;

export type Binding =
    | Prev.InternalBinding<{Expression: Expression, Pattern: Pattern}>
    | Prev.ExportedBinding<{Expression: Expression, Pattern: Pattern}>;


export type Pattern =
    | Prev.ModulePattern
    | VariablePattern;


export type Expression =
    | Prev.ApplicationExpression<{Expression: Expression}>
    | Prev.CharacterExpression
    | Prev.FunctionExpression<{Expression: Expression, Pattern: Pattern}>
    | Prev.ImportExpression
    | Prev.LabelExpression
    | Prev.ListExpression<{Expression: Expression}>
    | Prev.ModuleExpression<{Binding: Binding}>
    | Prev.RecordExpression<{Expression: Expression}>
    | Prev.ReferenceExpression
    | Prev.SelectionExpression<{Expression: Expression}>
    | Prev.SequenceExpression<{Expression: Expression}>
    | Prev.StaticMemberExpression<{Expression: Expression}>
    | Prev.StringExpression;


type Other =
    | Prev.DynamicField<{Expression: Expression}>
    | Prev.ModulePatternName
    | Prev.StaticField<{Expression: Expression}>;


// ====================   Modified Nodes   ====================
// TODO: where does symbol table go?
// export interface Program<V extends {Binding: any}> extends Prev.Program<V> {
//     readonly symbols: ReadonlyMap<string, SymbolInfo>;
// }


export interface Module<V extends {Binding: any}> extends Prev.Module<V> {
    readonly scope: Scope;
}


export interface VariablePattern extends Prev.VariablePattern {
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
    ModuleExpression,
    ModulePattern,
    ModulePatternName,
    Program,
    RecordExpression,
    ReferenceExpression,
    SelectionExpression,
    SequenceExpression,
    SourceFile,
    StaticField,
    StaticMemberExpression,
    StringExpression,
} from './02-source-file-asts';
