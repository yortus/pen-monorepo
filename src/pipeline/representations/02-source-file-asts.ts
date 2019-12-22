import {AbsPath} from '../../ast-utils';
import * as Prev from './01-source-file-graph';


// ====================   Node types by category   ====================
export type Node =
    | TopLevel
    | Binding
    | Pattern
    | Expression
    | Other;


type TopLevel =
    | Module<{Binding: Binding}>
    | Program<{Module: Module<{Binding: Binding}>}>
    | SourceFile<{Module: Module<{Binding: Binding}>}>;


export type Binding =
    | InternalBinding<{Expression: Expression, Pattern: Pattern}>
    | ExportedBinding<{Expression: Expression, Pattern: Pattern}>;


export type Pattern =
    | ModulePattern
    | VariablePattern;


export type Expression =
    | ApplicationExpression<{Expression: Expression}>
    | CharacterExpression
    | FunctionExpression<{Expression: Expression, Pattern: Pattern}>
    | ImportExpression
    | LabelExpression
    | ListExpression<{Expression: Expression}>
    | ModuleExpression<{Module: Module<{Binding: Binding}>}>
    | RecordExpression<{Expression: Expression}>
    | ReferenceExpression
    | SelectionExpression<{Expression: Expression}>
    | SequenceExpression<{Expression: Expression}>
    | StaticMemberExpression<{Expression: Expression}>
    | StringExpression;


type Other =
    | DynamicField<{Expression: Expression}>
    | ModulePatternName
    | StaticField<{Expression: Expression}>;


// ====================   Top-level nodes   ====================
export interface Program<V extends {Module: any}> extends Prev.Program {
    readonly sourceFiles: ReadonlyMap<AbsPath, SourceFile<V>>;
}


export interface SourceFile<V extends {Module: any}> extends Prev.SourceFile {
    module: V['Module'];
}


export interface Module<V extends {Binding: any}> {
    readonly kind: 'Module';
    readonly bindings: ReadonlyArray<V['Binding']>;
}


// ====================   Binding nodes   ====================
export interface ExportedBinding<V extends {Expression: any, Pattern: any}> {
    readonly kind: 'Binding';
    readonly pattern: V['Pattern'];
    readonly value: V['Expression'];
    readonly exported: true;
}

export interface InternalBinding<V extends {Expression: any, Pattern: any}> {
    readonly kind: 'Binding';
    readonly pattern: V['Pattern'];
    readonly value: V['Expression'];
    readonly exported?: false;
}


// ====================   Pattern nodes   ====================
export interface ModulePattern {
    readonly kind: 'ModulePattern';
    readonly names: ReadonlyArray<ModulePatternName>;
}


export interface VariablePattern {
    readonly kind: 'VariablePattern';
    readonly name: string;
}


// ====================   Expression nodes   ====================
export interface ApplicationExpression<V extends {Expression: any}> {
    readonly kind: 'ApplicationExpression';
    readonly function: V['Expression'];
    readonly argument: V['Expression'];
}


export interface CharacterExpression {
    readonly kind: 'CharacterExpression';
    readonly minValue: string;
    readonly maxValue: string;
}


export interface FunctionExpression<V extends {Expression: any, Pattern: any}> {
    readonly kind: 'FunctionExpression';
    readonly pattern: V['Pattern'];
    readonly body: V['Expression'];
}


export interface ImportExpression {
    readonly kind: 'ImportExpression';
    readonly moduleSpecifier: string;
    readonly sourceFilePath: AbsPath;
}


export interface LabelExpression {
    readonly kind: 'LabelExpression';
    readonly value: string;
}


export interface ListExpression<V extends {Expression: any}> {
    readonly kind: 'ListExpression';
    readonly elements: ReadonlyArray<V['Expression']>;
}


export interface ModuleExpression<V extends {Module: any}> {
    readonly kind: 'ModuleExpression';
    readonly module: V['Module'];
}


export interface RecordExpression<V extends {Expression: any}> {
    readonly kind: 'RecordExpression';
    readonly fields: ReadonlyArray<StaticField<V> | DynamicField<V>>;
}


export interface ReferenceExpression {
    readonly kind: 'ReferenceExpression';
    readonly name: string;
}


export interface SelectionExpression<V extends {Expression: any}> {
    readonly kind: 'SelectionExpression';
    readonly expressions: ReadonlyArray<V['Expression']>;
}


export interface SequenceExpression<V extends {Expression: any}> {
    readonly kind: 'SequenceExpression';
    readonly expressions: ReadonlyArray<V['Expression']>;
}


export interface StaticMemberExpression<V extends {Expression: any}> {
    readonly kind: 'StaticMemberExpression';
    readonly namespace: V['Expression'];
    readonly name: string;
}


export interface StringExpression {
    readonly kind: 'StringExpression';
    readonly value: string;
}


// ====================   Other nodes   ====================
export interface ModulePatternName {
    readonly kind: 'ModulePatternName';
    readonly name: string;
    readonly alias?: string;
}


export interface DynamicField<V extends {Expression: any}> {
    readonly kind: 'Field';
    readonly name: V['Expression'];
    readonly value: V['Expression'];
    readonly dynamic: true;
}


export interface StaticField<V extends {Expression: any}> {
    readonly kind: 'Field';
    readonly name: string;
    readonly value: V['Expression'];
    readonly dynamic?: false;
}
