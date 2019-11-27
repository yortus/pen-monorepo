// ====================   Main types   ====================
export type Ast = Module<{Binding: Binding}>;


export type Node =
    | Binding
    | Expression
    | FieldPattern<{Pattern: Pattern}>
    | Module<{Binding: Binding}>
    | Pattern;


export type Binding =
    | DynamicBinding<{Expression: Expression}>
    | ExportBinding<{Expression: Expression}>
    | ShorthandBinding
    | StaticBinding<{Expression: Expression, Pattern: Pattern}>;


export type Pattern =
    | RecordPattern<{Pattern: Pattern}>
    | TuplePattern<{Pattern: Pattern}>
    | VariablePattern
    | WildcardPattern;


export type Expression =
    | ApplicationExpression<{Expression: Expression}>
    | CharacterExpression
    | FunctionExpression<{Expression: Expression, Pattern: Pattern}>
    | ImportExpression
    | LabelExpression
    | RecordExpression<{Binding: Binding}>
    | ReferenceExpression
    | SelectionExpression<{Expression: Expression}>
    | SequenceExpression<{Expression: Expression}>
    | StaticMemberExpression<{Expression: Expression}>
    | StringExpression
    | ThisExpression
    | TupleExpression<{Expression: Expression}>;


// ====================   Modules   ====================
export interface Module<V extends {Binding: any}> {
    readonly kind: 'Module';
    readonly bindings: ReadonlyArray<V['Binding']>;
}


// ====================   Bindings   ====================
export interface DynamicBinding<V extends {Expression: any}> {
    readonly kind: 'DynamicBinding';
    readonly name: V['Expression'];
    readonly value: V['Expression'];
}


export interface ExportBinding<V extends {Expression: any}> {
    readonly kind: 'ExportBinding';
    readonly value: V['Expression'];
}


export interface ShorthandBinding {
    readonly kind: 'ShorthandBinding';
    readonly name: string;
}


export interface StaticBinding<V extends {Expression: any, Pattern: any}> {
    readonly kind: 'StaticBinding';
    readonly pattern: V['Pattern'];
    readonly value: V['Expression'];
}


// ====================   Patterns   ====================
export interface RecordPattern<V extends {Pattern: any}> {
    readonly kind: 'RecordPattern';
    readonly fields: ReadonlyArray<FieldPattern<V>>;
}


export interface TuplePattern<V extends {Pattern: any}> {
    readonly kind: 'TuplePattern';
    readonly elements: ReadonlyArray<V['Pattern']>;
}


export interface VariablePattern {
    readonly kind: 'VariablePattern';
    readonly name: string;
}


export interface WildcardPattern {
    readonly kind: 'WildcardPattern';
}


// ====================   Pattern Clauses   ====================
export interface FieldPattern<V extends {Pattern: any}> {
    readonly kind: 'FieldPattern';
    readonly fieldName: string;
    readonly pattern?: V['Pattern'];
}


// ====================   Expressions   ====================
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
}


export interface LabelExpression {
    readonly kind: 'LabelExpression';
    readonly value: string;
}


export interface RecordExpression<V extends {Binding: any}> {
    readonly kind: 'RecordExpression';
    readonly bindings: ReadonlyArray<V['Binding']>;
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


export interface ThisExpression {
    readonly kind: 'ThisExpression';
}


export interface TupleExpression<V extends {Expression: any}> {
    readonly kind: 'TupleExpression';
    readonly elements: ReadonlyArray<V['Expression']>;
}