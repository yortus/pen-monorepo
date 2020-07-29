import {AbsPath} from './utils';


// // ====================   Node types by category   ====================
export type Node<M extends Metadata = {}> =
    // Top-level nodes
    | Module<M>
    | Program<M>
    | PenSourceFile<M>
    | ExtensionFile<M>

    // Bindings and Expressions
    | Binding<M>
    | Expression<M>;


export type Binding<M extends Metadata = {}> =
    | SimpleBinding<M>
    | DestructuredBinding<M>;


export type Expression<M extends Metadata = {}> =
    | ApplicationExpression<M>
    | BooleanLiteralExpression<M>
    | FieldExpression<M>
    | ImportExpression<M>
    // | LambdaExpression<M>
    | ListExpression<M>
    | MemberExpression<M>
    | ModuleExpression<M>
    | NotExpression<M>
    | NullLiteralExpression<M>
    | NumericLiteralExpression<M>
    | ParenthesisedExpression<M>
    | QuantifiedExpression<M>
    | RecordExpression<M>
    | ReferenceExpression<M>
    | SelectionExpression<M>
    | SequenceExpression<M>
    | StringLiteralExpression<M>;


// ====================   Top-level nodes   ====================
export interface Program<M extends Metadata = {}> {
    readonly kind: 'Program';
    readonly sourceFiles: ReadonlyMap<AbsPath, PenSourceFile<M> | ExtensionFile<M>>;
    readonly mainPath: AbsPath; // TODO: need check to ensure this maps to pen source, not an extension
    readonly meta: M[this['kind']];
}


export interface PenSourceFile<M extends Metadata = {}> {
    readonly kind: 'PenSourceFile';

    /** The normalised absolute path of the file. */
    readonly path: AbsPath;

    readonly module: Module<M>;
    readonly meta: M[this['kind']];
}


export interface ExtensionFile<M extends Metadata = {}> {
    readonly kind: 'ExtensionFile';

    /** The normalised absolute path of the file. */
    readonly path: AbsPath;

    readonly exportedNames: string[];
    readonly meta: M[this['kind']];
}


export interface Module<M extends Metadata = {}> {
    readonly kind: 'Module';
    readonly bindings: ReadonlyArray<Binding<M>>;
    readonly meta: M[this['kind']];
}


// ====================   Binding nodes   ====================
export interface SimpleBinding<M extends Metadata = {}> {
    readonly kind: 'SimpleBinding';
    readonly name: string;
    readonly value: Expression<M>;
    readonly exported: boolean;
    readonly meta: M[this['kind']];
}


export interface DestructuredBinding<M extends Metadata = {}> {
    readonly kind: 'DestructuredBinding';
    readonly names: ReadonlyArray<{
        readonly name: string;
        readonly alias?: string;
    }>;
    readonly value: Expression<M>;
    readonly exported: boolean;
    readonly meta: M[this['kind']];
}


// // ====================   Expression nodes   ====================
export interface ApplicationExpression<M extends Metadata = {}> {
    readonly kind: 'ApplicationExpression';
    readonly lambda: Expression<M>;
    readonly argument: Expression<M>;
    readonly meta: M[this['kind']];
}


export interface BooleanLiteralExpression<M extends Metadata = {}> {
    readonly kind: 'BooleanLiteralExpression';
    readonly value: boolean;
    readonly meta: M[this['kind']];
}


export interface FieldExpression<M extends Metadata = {}> {
    readonly kind: 'FieldExpression';
    readonly name: Expression<M>;
    readonly value: Expression<M>;
    readonly meta: M[this['kind']];
}


export interface ImportExpression<M extends Metadata = {}> {
    readonly kind: 'ImportExpression';
    readonly moduleSpecifier: string;
    readonly sourceFilePath: AbsPath;
    readonly meta: M[this['kind']];
}


export interface ListExpression<M extends Metadata = {}> {
    readonly kind: 'ListExpression';
    readonly elements: ReadonlyArray<Expression<M>>;
    readonly meta: M[this['kind']];
}


// export interface LambdaExpression<M extends Metadata = {}> {
//     readonly kind: 'LambdaExpression';
//     readonly pattern: Pattern<M>;
//     readonly body: Expression<M>;
//     readonly meta: M[this['kind']];
// }


export interface MemberExpression<M extends Metadata = {}> {
    readonly kind: 'MemberExpression';
    readonly module: Expression<M>;
    readonly bindingName: string;
    readonly meta: M[this['kind']];
}


export interface ModuleExpression<M extends Metadata = {}> {
    readonly kind: 'ModuleExpression';
    readonly module: Module<M>;
    readonly meta: M[this['kind']];
}


export interface NotExpression<M extends Metadata = {}> {
    readonly kind: 'NotExpression';
    readonly expression: Expression<M>;
    readonly meta: M[this['kind']];
}


export interface NullLiteralExpression<M extends Metadata = {}> {
    readonly kind: 'NullLiteralExpression';
    readonly value: null;
    readonly meta: M[this['kind']];
}


export interface NumericLiteralExpression<M extends Metadata = {}> {
    readonly kind: 'NumericLiteralExpression';
    readonly value: number;
    readonly meta: M[this['kind']];
}


export interface ParenthesisedExpression<M extends Metadata = {}> {
    readonly kind: 'ParenthesisedExpression';
    readonly expression: Expression<M>;
    readonly meta: M[this['kind']];
}


export interface QuantifiedExpression<M extends Metadata = {}> {
    readonly kind: 'QuantifiedExpression';
    readonly expression: Expression<M>;
    readonly quantifier: '?' | '*';
    readonly meta: M[this['kind']];
}


export interface RecordExpression<M extends Metadata = {}> {
    readonly kind: 'RecordExpression';
    readonly fields: ReadonlyArray<{
        readonly name: string;
        readonly value: Expression<M>;
    }>;
    readonly meta: M[this['kind']];
}


export interface ReferenceExpression<M extends Metadata = {}> {
    readonly kind: 'ReferenceExpression';
    readonly name: string;
    readonly meta: M[this['kind']];
}


export interface SelectionExpression<M extends Metadata = {}> {
    readonly kind: 'SelectionExpression';
    readonly expressions: ReadonlyArray<Expression<M>>;
    readonly meta: M[this['kind']];
}


export interface SequenceExpression<M extends Metadata = {}> {
    readonly kind: 'SequenceExpression';
    readonly expressions: ReadonlyArray<Expression<M>>;
    readonly meta: M[this['kind']];
}


export interface StringLiteralExpression<M extends Metadata = {}> {
    readonly kind: 'StringLiteralExpression';
    readonly value: string;
    readonly concrete: boolean;
    readonly abstract: boolean;
    readonly meta: M[this['kind']];
}


// Helper type
type Metadata = {[K in Node['kind']]?: {}};
