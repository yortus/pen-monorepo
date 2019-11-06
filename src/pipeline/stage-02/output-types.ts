import * as V01 from '../stage-01/output-types';
import {Scope, SymbolInfo} from './scope';


export type Ast = ModuleDefinition<Expression>;


export type Node =
    | Definition<Expression>
    | Expression
    | ImportNames
    | ImportNamespace
    | ModuleDefinition<Expression>
    | V01.RecordField<Expression>;


export type Expression =
    | V01.Application<Expression>
    | Block<Expression>
    | V01.CharacterRange
    | V01.Function<Expression>
    | V01.ListLiteral<Expression>
    | V01.Parenthetical<Expression>
    | V01.RecordLiteral<Expression>
    | V01.Reference
    | V01.Selection<Expression>
    | V01.Sequence<Expression>
    | V01.StringLiteral
    | V01.VoidLiteral;


export interface ModuleDefinition<Expr> extends V01.ModuleDefinition<Expr> {
    readonly imports: ReadonlyArray<ImportNames | ImportNamespace>;
    readonly block: Block<Expr>;
}


export interface Definition<Expr> extends V01.Definition<Expr> {
    readonly symbol: SymbolInfo;
}


export interface Block<Expr> extends V01.Block<Expr> {
    readonly definitions: ReadonlyArray<Definition<Expr>>;
    readonly scope: Scope;
}


export interface ImportNames extends V01.ImportNames {
    readonly symbols: readonly SymbolInfo[];
}


export interface ImportNamespace extends V01.ImportNamespace {
    readonly symbol: SymbolInfo;
}
