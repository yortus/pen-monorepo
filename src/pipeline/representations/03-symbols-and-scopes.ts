import * as Prev from './02-source-file-asts';


// ====================   Scopes and Symbols   ====================
export type Scope = ModuleScope | RecordScope;


export interface ModuleScope {
    kind: 'ModuleScope';
    symbols: Map<string, Symbol>; // maps name to symbol info
}


export interface RecordScope {
    kind: 'RecordScope';
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
    | Prev.DynamicBinding<{Expression: Expression}>
    | Prev.ExportBinding<{Expression: Expression}>
    | Prev.StaticBinding<{Expression: Expression, Pattern: Pattern}>;


export type Pattern =
    | Prev.RecordPattern<{Pattern: Pattern}>
    | Prev.TuplePattern<{Pattern: Pattern}>
    | VariablePattern
    | Prev.WildcardPattern;


export type Expression =
    | Prev.ApplicationExpression<{Expression: Expression}>
    | Prev.CharacterExpression
    | Prev.FunctionExpression<{Expression: Expression, Pattern: Pattern}>
    | Prev.ImportExpression
    | Prev.LabelExpression
    | RecordExpression<{Binding: Binding}>
    | Prev.ReferenceExpression
    | Prev.SelectionExpression<{Expression: Expression}>
    | Prev.SequenceExpression<{Expression: Expression}>
    | Prev.StaticMemberExpression<{Expression: Expression}>
    | Prev.StringExpression
    | Prev.ThisExpression
    | Prev.TupleExpression<{Expression: Expression}>;


type Other =
    | Prev.FieldPattern<{Pattern: Pattern}>;


// ====================   Modified Nodes   ====================
// TODO: where does symbol table go?
// export interface Program<V extends {Binding: any}> extends Prev.Program<V> {
//     readonly symbols: ReadonlyMap<string, SymbolInfo>;
// }


export interface Module<V extends {Binding: any}> extends Prev.Module<V> {
    readonly scope: Scope;
}


export interface RecordExpression<V extends {Binding: any}> extends Prev.RecordExpression<V> {
    readonly scope: Scope;
}


export interface VariablePattern extends Prev.VariablePattern {
    symbol: Symbol;
}


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
    Program,
    RecordPattern,
    ReferenceExpression,
    SelectionExpression,
    SequenceExpression,
    SourceFile,
    StaticBinding,
    StaticMemberExpression,
    StringExpression,
    ThisExpression,
    TupleExpression,
    TuplePattern,
    WildcardPattern,
} from './02-source-file-asts';
