// ====================   Main types   ====================
export type Ast = ModuleDefinition<Expression>;


export type Node =
    | Definition<Expression>
    | Expression
    | ImportNames
    | ImportNamespace
    | ModuleDefinition<Expression>
    | RecordField<Expression>;


export type Expression =
    | Application<Expression>
    | Block<Expression>
    | CharacterRange
    | Function<Expression>
    | ListLiteral<Expression>
    | Parenthetical<Expression>
    | RecordLiteral<Expression>
    | Reference
    | Selection<Expression>
    | Sequence<Expression>
    | StringLiteral
    | VoidLiteral;


// ====================   Top-level nodes   ====================
export interface ModuleDefinition<Expr> {
    readonly kind: 'ModuleDefinition';
    readonly imports: ReadonlyArray<ImportNames | ImportNamespace>;
    readonly block: Block<Expr>;
}


// TODO: rename RuleDefinition -or- BindingDefinition -or- NameDefinition
export interface Definition<Expr> {
    readonly kind: 'Definition';
    readonly name: string;
    readonly expression: Expr;
    readonly isExported: boolean;
}


// ====================   Expression nodes   ====================
export interface Application<Expr> {
    readonly kind: 'Application';
    readonly function: Expr;
    readonly arguments: readonly Expr[];
}


export interface Block<Expr> {
    readonly kind: 'Block';
    readonly definitions: ReadonlyArray<Definition<Expr>>;
}


export interface CharacterRange { // TODO: rename: CharRange
    readonly kind: 'CharacterRange';
    readonly subkind: 'Abstract' | 'Concrete';
    readonly minValue: string;
    readonly maxValue: string;
}


export interface Function<Expr> {
    readonly kind: 'Function';
    readonly parameters: readonly string[];
    readonly expression: Expr;
}


export interface ListLiteral<Expr> { // TODO: rename: List
    readonly kind: 'ListLiteral';
    readonly elements: readonly Expr[];
}


export interface Parenthetical<Expr> {
    readonly kind: 'Parenthetical';
    readonly expression: Expr;
}


export interface RecordLiteral<Expr> { // TODO: rename: Record
    readonly kind: 'RecordLiteral';
    readonly fields: ReadonlyArray<RecordField<Expr>>;
}


// TODO: rename RuleReference -or- BindingReference -or- NameReference
export interface Reference {
    readonly kind: 'Reference';
    readonly namespaces?: readonly [string, ...string[]];
    readonly name: string;
}


export interface Selection<Expr> {
    readonly kind: 'Selection';
    readonly expressions: readonly Expr[];
}


export interface Sequence<Expr> {
    readonly kind: 'Sequence';
    readonly expressions: readonly Expr[];
}


export interface StringLiteral { // TODO: rename: String
    readonly kind: 'StringLiteral';
    readonly subkind: 'Abstract' | 'Concrete';
    readonly value: string;
}


export interface VoidLiteral { // TODO: rename: Void
    readonly kind: 'VoidLiteral';
}


// ====================   Other nodes   ====================
export interface ImportNames {
    readonly kind: 'ImportNames';
    readonly moduleSpecifier: string;
    readonly names: readonly string[];
}


export interface ImportNamespace {
    readonly kind: 'ImportNamespace';
    readonly moduleSpecifier: string;
    readonly namespace: string;
}


export interface RecordField<Expr> { // TODO: rename: Field
    readonly kind: 'RecordField';
    readonly hasComputedName: boolean;
    readonly name: string | Expr; // TODO: doc... type is hasComputedName ? Expr : string
    readonly expression: Expr;
}
