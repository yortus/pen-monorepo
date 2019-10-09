// TODO:
// BindingDeclaration: BindingTarget EQUALS BindingSource
//
// BindingTarget (lvalue):
// | export
// | identifier (one binding name)
// | record destructuring pattern (0..M binding names)
//   - just support simple {foo, bar} patterns for now - no aliases, no rests
//   - how does babel/acorn represent these binding LHSes in AST nodes?
//
// BindingSource (rvalue):
// | import
// | expression


import {Scope, SymbolInfo} from './scope';


// ====================   All nodes   ====================
export type Pass = 'pass1' | 'pass2' | 'pass3';

export type Node<P extends Pass> =
    | Application<P>
    | Block<P>
    | CharacterRange
    | Definition<P>
    | Function<P>
    | ImportNames<P>
    | ImportNamespace<P>
    | ListLiteral<P>
    | ModuleDefinition<P>
    | Parenthetical<P>
    | RecordField<P>
    | RecordLiteral<P>
    | Reference<P>
    | Selection<P>
    | Sequence<P>
    | StringLiteral
    | VoidLiteral;


// ====================   Module nodes   ====================
export type Module<P extends Pass> =
    | ModuleDefinition<P>;

export type ModuleDefinition<P extends Pass> = Readonly<{
    kind: 'ModuleDefinition';
    imports: ReadonlyArray<ImportNames<P> | ImportNamespace<P>>;
    block: Block<P>;
}>;


// ====================   Definition nodes   ====================
// TODO: rename RuleDefinition -or- BindingDefinition -or- NameDefinition
export type Definition<P extends Pass> = MultiPassNode<P, {
    pass1: {
        kind: 'Definition';
        name: string;
        expression: Expression<P>;
        isExported: boolean;
    },
    pass2: {
        symbol: SymbolInfo;
    },
}>;


// ====================   Expression nodes   ====================
export type Expression<P extends Pass> =
    | Application<P>
    | Block<P>
    | CharacterRange
    | Function<P>
    | ListLiteral<P>
    | Parenthetical<P>
    | RecordLiteral<P>
    | Reference<P>
    | Selection<P>
    | Sequence<P>
    | StringLiteral
    | VoidLiteral;

export type Application<P extends Pass> = Readonly<{
    kind: 'Application';
    function: Expression<P>; // rename: function?
    arguments: ReadonlyArray<Expression<P>>;
}>;

export type Block<P extends Pass> = MultiPassNode<P, {
    pass1: {
        kind: 'Block';
        definitions: ReadonlyArray<Definition<P>>;
    },
    pass2: {
        scope: Scope;
    },
}>;

export type CharacterRange = Readonly<{ // rename: CharRange
    kind: 'CharacterRange';
    subkind: 'Abstract' | 'Concrete';
    minValue: string;
    maxValue: string;
}>;

export type Function<P extends Pass> = Readonly<{
    kind: 'Function';
    parameters: readonly string[];
    expression: Expression<P>;
}>;

export type ListLiteral<P extends Pass> = Readonly<{ // rename: List
    kind: 'ListLiteral';
    elements: ReadonlyArray<Expression<P>>;
}>;

export type Parenthetical<P extends Pass> = Readonly<{
    kind: 'Parenthetical';
    expression: Expression<P>;
}>;

export type RecordLiteral<P extends Pass> = Readonly<{ // rename: Record
    kind: 'RecordLiteral';
    fields: ReadonlyArray<RecordField<P>>;
}>;

// TODO: rename RuleReference -or- BindingReference -or- NameReference
export type Reference<P extends Pass> = MultiPassNode<P, {
    pass1: {
        kind: 'Reference';
        namespaces?: readonly [string, ...string[]];
        name: string;
    },
    pass2: {
        symbol: SymbolInfo;
    },
}>;

export type Selection<P extends Pass> = Readonly<{
    kind: 'Selection';
    expressions: ReadonlyArray<Expression<P>>;
}>;

export type Sequence<P extends Pass> = Readonly<{
    kind: 'Sequence';
    expressions: ReadonlyArray<Expression<P>>;
}>;

export type StringLiteral = Readonly<{ // rename: String
    kind: 'StringLiteral';
    subkind: 'Abstract' | 'Concrete';
    value: string;
}>;

export type VoidLiteral = Readonly<{ // rename: Void
    kind: 'VoidLiteral';
}>;


// ====================   Other nodes   ====================
export type ImportNames<P extends Pass> = MultiPassNode<P, {
    pass1: {
        kind: 'ImportNames';
        moduleSpecifier: string;
        names: readonly string[];
    },
    pass2: {
        symbols: readonly SymbolInfo[];
    },
}>;

export type ImportNamespace<P extends Pass> = MultiPassNode<P, {
    pass1: {
        kind: 'ImportNamespace';
        moduleSpecifier: string;
        namespace: string;
    }, pass2: {
        symbol: SymbolInfo;
    },
}>;

export type RecordField<P extends Pass> = Readonly<{ // rename: Field
    kind: 'RecordField';
    hasComputedName: false;
    name: string;
    expression: Expression<P>;
}> | Readonly<{
    kind: 'RecordField';
    hasComputedName: true;
    name: Expression<P>;
    expression: Expression<P>;
}>;


// ====================   TODO: helper type...   ====================
type MultiPassNode<P extends Pass, Defn extends {[K in Pass]?: Defn[K]}> = Readonly<
    & (P extends 'pass1' | 'pass2' | 'pass3' ? Defn['pass1'] : unknown)
    & (P extends 'pass2' | 'pass3' ? Defn['pass2'] : unknown)
    & (P extends 'pass3' ? Defn['pass3'] : unknown)
>;
