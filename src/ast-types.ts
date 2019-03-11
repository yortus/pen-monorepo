export type File =
    | ForeignModule
    | PenModule;

export interface ForeignModule {
    type: 'ForeignModule';
    exports: string[];
}

export interface PenModule {
    type: 'PenModule';
    declarations: PenModuleDeclaration[];
}

export type PenModuleDeclaration =
    | ImportDeclaration
    | ExportDeclaration
    | Definition;

export interface ImportDeclaration {
    type: 'ImportDeclaration';
    moduleSpecifier: string;
    bindings: Array<{name: string, alias?: string}>;
}

export interface ExportDeclaration {
    type: 'ExportDeclaration';
    definition: Definition;
}

export interface Definition {
    type: 'Definition';
    name: string;
    expression: Expression;
}

export type Expression =
    | Selection
    | Sequence
    | Combinator
    | Application
    | Block
    | Parenthetical
    | RecordLiteral
    | ListLiteral
    | CharacterRange
    | StringLiteral
    | VoidLiteral
    | Reference;

export interface Selection {
    type: 'Selection';
    expressions: Expression[];
}

export interface Sequence {
    type: 'Sequence';
    expressions: Expression[];
}

export interface Combinator {
    type: 'Combinator';
    parameters: string[];
    expression: Expression;
}

export interface Application {
    type: 'Application';
    combinator: Expression;
    arguments: Expression[];
}

export interface Block {
    type: 'Block';
    definitions: Definition[];
}

export interface Parenthetical {
    type: 'Parenthetical';
    expression: Expression;
}

export interface RecordLiteral {
    type: 'RecordLiteral';
    fields: RecordField[];
}

export type RecordField =
    | {type: 'RecordField', hasComputedName: false, name: string, expression: Expression}
    | {type: 'RecordField', hasComputedName: true, name: Expression, expression: Expression};

export interface ListLiteral {
    type: 'ListLiteral';
    elements: Expression[];
}

export interface CharacterRange {
    type: 'CharacterRange';
    kind: 'Abstract' | 'Concrete';
    minValue: string;
    maxValue: string;
}

export interface StringLiteral {
    type: 'StringLiteral';
    kind: 'Abstract' | 'Concrete';
    value: string;
}

export interface VoidLiteral {
    type: 'VoidLiteral';
}

export interface Reference {
   type: 'Reference';
   name: string;
}




export type Node =
    | ForeignModule
    | PenModule
    | ImportDeclaration
    | ExportDeclaration
    | Definition
    | Selection
    | Sequence
    | Combinator
    | Application
    | Block
    | Parenthetical
    | RecordLiteral
    | RecordField
    | ListLiteral
    | CharacterRange
    | StringLiteral
    | VoidLiteral
    | Reference;
