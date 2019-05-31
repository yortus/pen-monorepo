import {Scope, SymbolInfo} from '../scope';




// ====================   All nodes   ====================
export type Node =
    | Application
    | Block
    | Blockᐟ
    | CharacterRange
    | Combinator
    | Definition
    | Definitionᐟ
    | ForeignModule
    | ImportDeclaration
    | ImportDeclarationᐟ
    | ListLiteral
    | Parenthetical
    | PenModule
    | PenModuleᐟ
    | RecordField
    | RecordLiteral
    | Reference
    | Referenceᐟ
    | Selection
    | Sequence
    | StringLiteral
    | VoidLiteral;




// ====================   Module nodes   ====================
export type Module =
    | ForeignModule
    | PenModule
    | PenModuleᐟ;

export interface ForeignModule {
    readonly kind: 'ForeignModule';
    readonly exports: readonly string[];
}

export interface PenModule {
    readonly kind: 'PenModule';
    readonly declarations: readonly Declaration[];
}

export interface PenModuleᐟ {
    readonly kind: 'PenModuleᐟ';
    readonly declarations: readonly Declaration[];
    readonly scope: Scope;
}




// ====================   Declaration nodes   ====================
export type Declaration =
    | Definition
    | Definitionᐟ
    | ImportDeclaration;

export interface Definition {
    readonly kind: 'Definition';
    readonly name: string;
    readonly expression: Expression;
    readonly isExported: boolean;
}

export interface Definitionᐟ {
    readonly kind: 'Definitionᐟ';
    readonly name: string;
    readonly expression: Expression;
    readonly isExported: boolean;
    readonly symbol: SymbolInfo;
}

export interface ImportDeclaration {
    readonly kind: 'ImportDeclaration';
    readonly moduleSpecifier: string;
    readonly bindings: ReadonlyArray<{
        readonly name: string;
        readonly alias?: string;
    }>;
}

export interface ImportDeclarationᐟ {
    readonly kind: 'ImportDeclarationᐟ';
    readonly moduleSpecifier: string;
    readonly bindings: ReadonlyArray<{
        readonly name: string;
        readonly alias?: string;
        readonly symbol: SymbolInfo;
    }>;
}




// ====================   Expression nodes   ====================
export type Expression =
    | Application
    | Block
    | Blockᐟ
    | CharacterRange
    | Combinator
    | ListLiteral
    | Parenthetical
    | RecordLiteral
    | Reference
    | Referenceᐟ
    | Selection
    | Sequence
    | StringLiteral
    | VoidLiteral;

export interface Application {
    readonly kind: 'Application';
    readonly combinator: Expression;
    readonly arguments: readonly Expression[];
}

export interface Block {
    readonly kind: 'Block';
    readonly definitions: readonly Definition[];
}

export interface Blockᐟ {
    readonly kind: 'Blockᐟ';
    readonly definitions: readonly Definition[];
    readonly scope: Scope;
}

export interface CharacterRange {
    readonly kind: 'CharacterRange';
    readonly subkind: 'Abstract' | 'Concrete';
    readonly minValue: string;
    readonly maxValue: string;
}

export interface Combinator {
    readonly kind: 'Combinator';
    readonly parameters: readonly string[];
    readonly expression: Expression;
}

export interface ListLiteral {
    readonly kind: 'ListLiteral';
    readonly elements: readonly Expression[];
}

export interface Parenthetical {
    readonly kind: 'Parenthetical';
    readonly expression: Expression;
}

export interface RecordLiteral {
    readonly kind: 'RecordLiteral';
    readonly fields: readonly RecordField[];
}

export interface Reference {
    readonly kind: 'Reference';
    readonly name: string;
}

export interface Referenceᐟ {
    readonly kind: 'Referenceᐟ';
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

export interface StringLiteral {
    readonly kind: 'StringLiteral';
    readonly subkind: 'Abstract' | 'Concrete';
    readonly value: string;
}

export interface VoidLiteral {
    readonly kind: 'VoidLiteral';
}




// ====================   Other nodes   ====================
export type RecordField = {
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
