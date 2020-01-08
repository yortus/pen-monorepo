import {CompilerOptions} from './compiler-options';
import {AbsPath} from './utils';


// // ====================   Node types by category   ====================
export type Node<M = {}> =
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


export type Binding<M> =
    | InternalBinding<M>
    | ExportedBinding<M>;


export type Pattern<M> =
    | ModulePattern<M>
    | VariablePattern<M>;


export type Expression<M> =
    | ApplicationExpression<M>
    | CharacterExpression<M>
    | FunctionExpression<M>
    | ImportExpression<M>
    | LabelExpression<M>
    | ListExpression<M>
    | ModuleExpression<M>
    | RecordExpression<M>
    | ReferenceExpression<M>
    | SelectionExpression<M>
    | SequenceExpression<M>
    | StaticMemberExpression<M>
    | StringExpression<M>;


// ====================   Top-level nodes   ====================
export interface Program<M> {
    readonly kind: 'Program';
    readonly compilerOptions: CompilerOptions;
    readonly sourceFiles: ReadonlyMap<AbsPath, SourceFile<M>>;
    readonly mainPath: AbsPath;
    readonly meta: NodeMetadata<M, this['kind']>;
}


export interface SourceFile<M> {
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
    readonly meta: NodeMetadata<M, this['kind']>;
}


export interface Module<M> {
    readonly kind: 'Module';
    readonly bindings: ReadonlyArray<Binding<M>>;
    readonly meta: NodeMetadata<M, this['kind']>;
}


// ====================   Binding nodes   ====================
export interface ExportedBinding<M> {
    readonly kind: 'Binding';
    readonly pattern: Pattern<M>;
    readonly value: Expression<M>;
    readonly exported: true;
    readonly meta: NodeMetadata<M, this['kind']>;
}

export interface InternalBinding<M> {
    readonly kind: 'Binding';
    readonly pattern: Pattern<M>;
    readonly value: Expression<M>;
    readonly exported?: false;
    readonly meta: NodeMetadata<M, this['kind']>;
}


// ====================   Pattern nodes   ====================
export interface ModulePattern<M> {
    readonly kind: 'ModulePattern';
    readonly names: ReadonlyArray<ModulePatternName<M>>;
    readonly meta: NodeMetadata<M, this['kind']>;
}


export interface VariablePattern<M> {
    readonly kind: 'VariablePattern';
    readonly name: string;
    readonly meta: NodeMetadata<M, this['kind']>;
}


// // ====================   Expression nodes   ====================
export interface ApplicationExpression<M> {
    readonly kind: 'ApplicationExpression';
    readonly function: Expression<M>;
    readonly argument: Expression<M>;
    readonly meta: NodeMetadata<M, this['kind']>;
}


export interface CharacterExpression<M> {
    readonly kind: 'CharacterExpression';
    readonly minValue: string;
    readonly maxValue: string;
    readonly meta: NodeMetadata<M, this['kind']>;
}


export interface FunctionExpression<M> {
    readonly kind: 'FunctionExpression';
    readonly pattern: Pattern<M>;
    readonly body: Expression<M>;
    readonly meta: NodeMetadata<M, this['kind']>;
}


export interface ImportExpression<M> {
    readonly kind: 'ImportExpression';
    readonly moduleSpecifier: string;
    readonly sourceFilePath: AbsPath;
    readonly meta: NodeMetadata<M, this['kind']>;
}


export interface LabelExpression<M> {
    readonly kind: 'LabelExpression';
    readonly value: string;
    readonly meta: NodeMetadata<M, this['kind']>;
}


export interface ListExpression<M> {
    readonly kind: 'ListExpression';
    readonly elements: ReadonlyArray<Expression<M>>;
    readonly meta: NodeMetadata<M, this['kind']>;
}


export interface ModuleExpression<M> {
    readonly kind: 'ModuleExpression';
    readonly module: Module<M>;
    readonly meta: NodeMetadata<M, this['kind']>;
}


export interface RecordExpression<M> {
    readonly kind: 'RecordExpression';
    readonly fields: ReadonlyArray<StaticField<M> | DynamicField<M>>;
    readonly meta: NodeMetadata<M, this['kind']>;
}


export interface ReferenceExpression<M> {
    readonly kind: 'ReferenceExpression';
    readonly name: string;
    readonly meta: NodeMetadata<M, this['kind']>;
}


export interface SelectionExpression<M> {
    readonly kind: 'SelectionExpression';
    readonly expressions: ReadonlyArray<Expression<M>>;
    readonly meta: NodeMetadata<M, this['kind']>;
}


export interface SequenceExpression<M> {
    readonly kind: 'SequenceExpression';
    readonly expressions: ReadonlyArray<Expression<M>>;
    readonly meta: NodeMetadata<M, this['kind']>;
}


export interface StaticMemberExpression<M> {
    readonly kind: 'StaticMemberExpression';
    readonly namespace: Expression<M>;
    readonly name: string;
    readonly meta: NodeMetadata<M, this['kind']>;
}


export interface StringExpression<M> {
    readonly kind: 'StringExpression';
    readonly value: string;
    readonly meta: NodeMetadata<M, this['kind']>;
}


// // ====================   Other nodes   ====================
export interface ModulePatternName<M> {
    readonly kind: 'ModulePatternName';
    readonly name: string;
    readonly alias?: string;
    readonly meta: NodeMetadata<M, this['kind']>;
}


export interface DynamicField<M> {
    readonly kind: 'Field';
    readonly name: Expression<M>;
    readonly value: Expression<M>;
    readonly dynamic: true;
    readonly meta: NodeMetadata<M, this['kind']>;
}


export interface StaticField<M> {
    readonly kind: 'Field';
    readonly name: string;
    readonly value: Expression<M>;
    readonly dynamic?: false;
    readonly meta: NodeMetadata<M, this['kind']>;
}


// Helper type
type NodeMetadata<M, K extends Node['kind']> = M extends {[P in K]: infer V} ? V : {};
