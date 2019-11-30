import * as V01 from '../stage-01/output-types';
import * as V02 from '../stage-02/output-types';
import {SymbolInfo} from '../stage-02/scope';


export type Ast = V02.ModuleDefinition<Expression>;


export type Node =
    | V02.Definition<Expression>
    | Expression
    | V02.ImportNames
    | V02.ImportNamespace
    | V02.ModuleDefinition<Expression>
    | V01.RecordField<Expression>;


export type Expression =
    | V01.Application<Expression>
    | V02.Block<Expression>
    | V01.CharacterRange
    | V01.Function<Expression>
    | V01.ListLiteral<Expression>
    | V01.Parenthetical<Expression>
    | V01.RecordLiteral<Expression>
    | Reference
    | V01.Selection<Expression>
    | V01.Sequence<Expression>
    | V01.StringLiteral
    | V01.VoidLiteral;


export interface Reference extends V01.Reference {
    readonly symbol: SymbolInfo;
}
