import * as Prev from './02-source-file-asts';


// ====================   Scopes and Symbols   ====================
export type Scope = ModuleScope | NestedScope;


export interface ModuleScope {
    kind: 'ModuleScope';
    symbols: Map<string, SymbolInfo>; // maps name to symbol info
}


export interface NestedScope { // TODO: rename RecordScope
    kind: 'NestedScope';
    parent: Scope;
    symbols: Map<string, SymbolInfo>; // maps name to symbol info
}


export interface SymbolInfo {
    // TODO: review all members...
    // name: string;
    // isImported?: boolean;
    // isExported?: boolean;
    // members?: SymbolInfo[];
}


// ====================   Node types by category   ====================
export type Node =
    | Binding
    | Expression
    | Pattern
    | Other;


export type Binding =
    | Prev.DynamicBinding<{Expression: Expression}>
    | Prev.ExportBinding<{Expression: Expression}>
    | Prev.ShorthandBinding
    | Prev.StaticBinding<{Expression: Expression, Pattern: Pattern}>;


export type Pattern =
    | Prev.RecordPattern<{Pattern: Pattern}>
    | Prev.TuplePattern<{Pattern: Pattern}>
    | Prev.VariablePattern
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


export type Other =
    | Prev.FieldPattern<{Pattern: Pattern}>
    | Module<{Binding: Binding}>
    | Program
    | SourceFile;


// ====================   Modified Nodes   ====================
export interface Program extends Prev.Program {
    files: SourceFile[];
    main: SourceFile;
}


export interface SourceFile extends Prev.SourceFile {
    module: Module<{Binding: Binding}>;
}


export interface Module<V extends {Binding: any}> extends Prev.Module<V> {
    readonly scope: Scope;
}


export interface RecordExpression<V extends {Binding: any}> extends Prev.RecordExpression<V> {
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
} from './02-source-file-asts';
