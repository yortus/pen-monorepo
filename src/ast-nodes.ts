import {AbsPath} from './utils';


// // ====================   Node types by category   ====================
export type Node<M extends Metadata = {}> =
    // Top-level nodes
    | Module<M>
    | Program<M>
    | SourceFile<M>

    // Bindings, Patterns, and Expressions
    | Binding<M>
    | Pattern<M>
    | Expression<M>

    // Other nodes
    | DynamicField<M>
    | ModulePatternName<M>
    | StaticField<M>;


export type Binding<M extends Metadata = {}> =
    | InternalBinding<M>
    | ExportedBinding<M>;


export type Pattern<M extends Metadata = {}> =
    | ModulePattern<M>
    | VariablePattern<M>;


export type Expression<M extends Metadata = {}> =
    | ApplicationExpression<M>
    | CharacterExpression<M>
    | FunctionExpression<M>
    | ImportExpression<M>
    | LabelExpression<M>
    | ListExpression<M>
    | ModuleExpression<M>
    | ParenthesisedExpression<M>
    | RecordExpression<M>
    | ReferenceExpression<M>
    | SelectionExpression<M>
    | SequenceExpression<M>
    | StaticMemberExpression<M>
    | StringExpression<M>;


// ====================   Top-level nodes   ====================
export interface Program<M extends Metadata = {}> {
    readonly kind: 'Program';
    readonly sourceFiles: ReadonlyMap<AbsPath, SourceFile<M>>;
    readonly mainPath: AbsPath;
    readonly meta: M[this['kind']];
}


export interface SourceFile<M extends Metadata = {}> {
    readonly kind: 'SourceFile';

    /** The source file's normalised absolute path. */
    readonly path: AbsPath;

    /**
     * A map with one entry for each import expression in this source file. The keys are the imported module
     * specifiers, exactly as they appear in the source text. The values are the normalised absolute paths of
     * the corresponding imported SourceFiles.
     */
    readonly imports: {[moduleSpecifier: string]: AbsPath};

    readonly module: Module<M>;
    readonly meta: M[this['kind']];
}


export interface Module<M extends Metadata = {}> {
    readonly kind: 'Module';
    readonly bindings: ReadonlyArray<Binding<M>>;
    readonly meta: M[this['kind']];
}


// ====================   Binding nodes   ====================
export interface ExportedBinding<M extends Metadata = {}> {
    readonly kind: 'Binding';
    readonly pattern: Pattern<M>;
    readonly value: Expression<M>;
    readonly exported: true;
    readonly meta: M[this['kind']];
}

export interface InternalBinding<M extends Metadata = {}> {
    readonly kind: 'Binding';
    readonly pattern: Pattern<M>;
    readonly value: Expression<M>;
    readonly exported?: false;
    readonly meta: M[this['kind']];
}


// ====================   Pattern nodes   ====================
export interface ModulePattern<M extends Metadata = {}> {
    readonly kind: 'ModulePattern';
    readonly names: ReadonlyArray<ModulePatternName<M>>;
    readonly meta: M[this['kind']];
}


export interface VariablePattern<M extends Metadata = {}> {
    readonly kind: 'VariablePattern';
    readonly name: string;
    readonly meta: M[this['kind']];
}


// // ====================   Expression nodes   ====================
export interface ApplicationExpression<M extends Metadata = {}> {
    readonly kind: 'ApplicationExpression';
    readonly function: Expression<M>;
    readonly argument: Expression<M>;
    readonly meta: M[this['kind']];
}


export interface CharacterExpression<M extends Metadata = {}> {
    readonly kind: 'CharacterExpression';
    readonly minValue: string;
    readonly maxValue: string;
    readonly meta: M[this['kind']];
}


export interface FunctionExpression<M extends Metadata = {}> {
    readonly kind: 'FunctionExpression';
    readonly pattern: Pattern<M>;
    readonly body: Expression<M>;
    readonly meta: M[this['kind']];
}


export interface ImportExpression<M extends Metadata = {}> {
    readonly kind: 'ImportExpression';
    readonly moduleSpecifier: string;
    readonly sourceFilePath: AbsPath;
    readonly meta: M[this['kind']];
}


export interface LabelExpression<M extends Metadata = {}> {
    readonly kind: 'LabelExpression';
    readonly value: string;
    readonly meta: M[this['kind']];
}


export interface ListExpression<M extends Metadata = {}> {
    readonly kind: 'ListExpression';
    readonly elements: ReadonlyArray<Expression<M>>;
    readonly meta: M[this['kind']];
}


export interface ModuleExpression<M extends Metadata = {}> {
    readonly kind: 'ModuleExpression';
    readonly module: Module<M>;
    readonly meta: M[this['kind']];
}


export interface ParenthesisedExpression<M extends Metadata = {}> {
    readonly kind: 'ParenthesisedExpression';
    readonly expression: Expression<M>;
    readonly meta: M[this['kind']];
}


export interface RecordExpression<M extends Metadata = {}> {
    readonly kind: 'RecordExpression';
    readonly fields: ReadonlyArray<StaticField<M> | DynamicField<M>>;
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


export interface StaticMemberExpression<M extends Metadata = {}> {
    readonly kind: 'StaticMemberExpression';
    readonly namespace: Expression<M>;
    readonly memberName: string; // TODO: rename to bindingName or just name? The term 'member' isn't used anywhere else
    readonly meta: M[this['kind']];
}


export interface StringExpression<M extends Metadata = {}> {
    readonly kind: 'StringExpression';
    readonly value: string;
    readonly meta: M[this['kind']];
}


// // ====================   Other nodes   ====================
export interface DynamicField<M extends Metadata = {}> {
    readonly kind: 'DynamicField';
    readonly name: Expression<M>;
    readonly value: Expression<M>;
    readonly meta: M[this['kind']];
}


export interface ModulePatternName<M extends Metadata = {}> {
    readonly kind: 'ModulePatternName';
    readonly name: string;
    readonly alias?: string;
    readonly meta: M[this['kind']];
}


export interface StaticField<M extends Metadata = {}> {
    readonly kind: 'StaticField';
    readonly name: string;
    readonly value: Expression<M>;
    readonly meta: M[this['kind']];
}


// Helper type
type Metadata = {[K in Node['kind']]?: {}};
