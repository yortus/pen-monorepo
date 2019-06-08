import {Scope, SymbolInfo} from '../scope';




// ====================   All nodes   ====================
export type Node =
    | Application
    | Block
    | CharacterRange
    | Combinator
    | Definition
    | ImportNames
    | ImportNamespace
    | ListLiteral
    | ModuleDeclaration
    | ModuleDefinition
    | Parenthetical
    | RecordField
    | RecordLiteral
    | Reference
    | Selection
    | Sequence
    | StringLiteral
    | VoidLiteral;




// ====================   Module nodes   ====================
export type Module =
    | ModuleDeclaration
    | ModuleDefinition;

export interface ModuleDeclaration {
    readonly kind: 'ModuleDeclaration';
    readonly exports: readonly string[];
}
    
export interface ModuleDefinition {
    readonly kind: 'ModuleDefinition';
    readonly imports: ReadonlyArray<ImportNames | ImportNamespace>;
    readonly block: Block;
}




// ====================   Definition nodes   ====================
export interface Definition { // TODO: rename RuleDefinition -or- BindingDefinition -or- NameDefinition
    readonly kind: 'Definition';
    readonly name: string;
    readonly expression: Expression;
    readonly isExported: boolean;
    readonly symbol: SymbolInfo;
}




// ====================   Expression nodes   ====================
export type Expression =
    | Application
    | Block
    | CharacterRange
    | Combinator
    | ListLiteral
    | Parenthetical
    | RecordLiteral
    | Reference
    | Selection
    | Sequence
    | StringLiteral
    | VoidLiteral;

export interface Application {
    readonly kind: 'Application';
    readonly combinator: Expression; // rename: function?
    readonly arguments: readonly Expression[];
}

export interface Block {
    readonly kind: 'Block';
    readonly definitions: readonly Definition[];
    readonly scope: Scope;
}

export interface CharacterRange { // rename: CharRange
    readonly kind: 'CharacterRange';
    readonly subkind: 'Abstract' | 'Concrete';
    readonly minValue: string;
    readonly maxValue: string;
}

export interface Combinator { // rename: function definition? lambda?
    readonly kind: 'Combinator';
    readonly parameters: readonly string[];
    readonly expression: Expression;
}

export interface ListLiteral { // rename: List
    readonly kind: 'ListLiteral';
    readonly elements: readonly Expression[];
}

export interface Parenthetical {
    readonly kind: 'Parenthetical';
    readonly expression: Expression;
}

export interface RecordLiteral { // rename: Record
    readonly kind: 'RecordLiteral';
    readonly fields: readonly RecordField[];
}

export interface Reference { // TODO: rename RuleReference -or- BindingReference -or- NameReference
    readonly kind: 'Reference';
    readonly namespaces?: readonly [string, ...string[]];
    readonly name: string;
    readonly symbol: SymbolInfo;
}

export interface Selection {
    readonly kind: 'Selection';
    readonly expressions: readonly Expression[];
}

export interface Sequence {
    readonly kind: 'Sequence';
    readonly expressions: readonly Expression[];
}

export interface StringLiteral { // rename: String
    readonly kind: 'StringLiteral';
    readonly subkind: 'Abstract' | 'Concrete';
    readonly value: string;
}

export interface VoidLiteral { // rename: Void
    readonly kind: 'VoidLiteral';
}




// ====================   Other nodes   ====================
export interface ImportNames {
    readonly kind: 'ImportNames';
    readonly moduleSpecifier: string;
    readonly names: readonly string[];
    readonly symbols: readonly SymbolInfo[];
}

export interface ImportNamespace {
    readonly kind: 'ImportNamespace';
    readonly moduleSpecifier: string;
    readonly namespace: string;
    readonly symbol: SymbolInfo;
}

export type RecordField = { // rename: Field
    readonly kind: 'RecordField';
    readonly hasComputedName: false;
    readonly name: string;
    readonly expression: Expression;
} | {
    readonly kind: 'RecordField';
    readonly hasComputedName: true;
    readonly name: Expression;
    readonly expression: Expression;
};
