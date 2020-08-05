import {AbsPath} from './utils';


// ====================   Node types by category   ====================
export type Node<M extends Metadata = {}> =
    // Top-level nodes
    | Module<M>
    | Program<M>

    // Bindings and Expressions
    | Binding<M>
    | Expression<M>;


export type Binding<M extends Metadata = {}> =
    | SimpleBinding<M>
    | DestructuredBinding<M>;


export type Expression<M extends Metadata = {}> =
    | ApplicationExpression<M>
    | BooleanLiteralExpression
    | ExtensionExpression
    | FieldExpression
    | ImportExpression
    // | LambdaExpression<M>
    | ListExpression<M>
    | MemberExpression<M>
    | ModuleExpression<M>
    | NotExpression<M>
    | NullLiteralExpression
    | NumericLiteralExpression
    | ParenthesisedExpression<M>
    | QuantifiedExpression<M>
    | RecordExpression<M>
    | ReferenceExpression
    | SelectionExpression<M>
    | SequenceExpression<M>
    | StringLiteralExpression;


// ====================   Top-level nodes   ====================
export interface Program<M extends Metadata = {}> {
    readonly kind: 'Program';
    readonly sourceFiles: ReadonlyMap<AbsPath, Module<M>>;
    readonly mainPath: AbsPath;
    readonly startSymbolId?: string;
}


export interface Module<M extends Metadata = {}> {
    readonly kind: 'Module';
    readonly bindings: ReadonlyArray<Binding<M>>;
    readonly path?: AbsPath;
}


// ====================   Binding nodes   ====================
export interface SimpleBinding<M extends Metadata = {}> {
    readonly kind: 'SimpleBinding';
    readonly name: string;
    readonly value: Expression<M>;
    readonly exported: boolean;
    readonly symbolId?: string;
}


export interface DestructuredBinding<M extends Metadata = {}> {
    readonly kind: 'DestructuredBinding';
    readonly names: ReadonlyArray<{
        readonly name: string;
        readonly alias?: string;
    }>;
    readonly value: Expression<M>;
    readonly exported: boolean;
}


// // ====================   Expression nodes   ====================
export interface ApplicationExpression<M extends Metadata = {}> {
    readonly kind: 'ApplicationExpression';
    readonly lambda: Expression<M>;
    readonly argument: Expression<M>;
}


export interface BooleanLiteralExpression {
    readonly kind: 'BooleanLiteralExpression';
    readonly value: boolean;
}


export interface ExtensionExpression {
    readonly kind: 'ExtensionExpression';
    readonly extensionPath: AbsPath;
    readonly bindingName: string;
}


export interface FieldExpression<M extends Metadata = {}> {
    readonly kind: 'FieldExpression';
    readonly name: Expression<M>;
    readonly value: Expression<M>;
}


export interface ImportExpression {
    readonly kind: 'ImportExpression';
    readonly moduleSpecifier: string;
    readonly sourceFilePath: AbsPath;
}


export interface ListExpression<M extends Metadata = {}> {
    readonly kind: 'ListExpression';
    readonly elements: ReadonlyArray<Expression<M>>;
}


// export interface LambdaExpression<M extends Metadata = {}> {
//     readonly kind: 'LambdaExpression';
//     readonly pattern: Pattern<M>;
//     readonly body: Expression<M>;
// }


export interface MemberExpression<M extends Metadata = {}> {
    readonly kind: 'MemberExpression';
    readonly module: Expression<M>;
    readonly bindingName: string;
}


export interface ModuleExpression<M extends Metadata = {}> {
    readonly kind: 'ModuleExpression';
    readonly module: Module<M>;
}


export interface NotExpression<M extends Metadata = {}> {
    readonly kind: 'NotExpression';
    readonly expression: Expression<M>;
}


export interface NullLiteralExpression {
    readonly kind: 'NullLiteralExpression';
    readonly value: null;
}


export interface NumericLiteralExpression {
    readonly kind: 'NumericLiteralExpression';
    readonly value: number;
}


export interface ParenthesisedExpression<M extends Metadata = {}> {
    readonly kind: 'ParenthesisedExpression';
    readonly expression: Expression<M>;
}


export interface QuantifiedExpression<M extends Metadata = {}> {
    readonly kind: 'QuantifiedExpression';
    readonly expression: Expression<M>;
    readonly quantifier: '?' | '*';
}


export interface RecordExpression<M extends Metadata = {}> {
    readonly kind: 'RecordExpression';
    readonly fields: ReadonlyArray<{
        readonly name: string;
        readonly value: Expression<M>;
    }>;
}


export interface ReferenceExpression {
    readonly kind: 'ReferenceExpression';
    readonly name: string;
    readonly symbolId?: string;
}


export interface SelectionExpression<M extends Metadata = {}> {
    readonly kind: 'SelectionExpression';
    readonly expressions: ReadonlyArray<Expression<M>>;
}


export interface SequenceExpression<M extends Metadata = {}> {
    readonly kind: 'SequenceExpression';
    readonly expressions: ReadonlyArray<Expression<M>>;
}


export interface StringLiteralExpression {
    readonly kind: 'StringLiteralExpression';
    readonly value: string;
    readonly concrete: boolean;
    readonly abstract: boolean;
}


// Helper type
type Metadata = {[K in Node['kind']]?: {}};
