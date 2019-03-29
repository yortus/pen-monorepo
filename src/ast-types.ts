export type File =
    | ForeignModule
    | PenModule;

export interface ForeignModule {
    kind: 'ForeignModule';
    exports: string[];
}

export interface PenModule {
    kind: 'PenModule';
    declarations: PenModuleDeclaration[];
}

export type PenModuleDeclaration =
    | ImportDeclaration
    | ExportDeclaration
    | Definition;

export interface ImportDeclaration {
    kind: 'ImportDeclaration';
    moduleSpecifier: string;
    bindings: Array<{name: string, alias?: string}>;
}

export interface ExportDeclaration {
    kind: 'ExportDeclaration';
    definition: Definition;
}

export interface Definition {
    kind: 'Definition';
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
    kind: 'Selection';
    expressions: Expression[];
}

export interface Sequence {
    kind: 'Sequence';
    expressions: Expression[];
}

export interface Combinator {
    kind: 'Combinator';
    parameters: string[];
    expression: Expression;
}

export interface Application {
    kind: 'Application';
    combinator: Expression;
    arguments: Expression[];
}

export interface Block {
    kind: 'Block';
    definitions: Definition[];
}

export interface Parenthetical {
    kind: 'Parenthetical';
    expression: Expression;
}

export interface RecordLiteral {
    kind: 'RecordLiteral';
    fields: RecordField[];
}

export type RecordField =
    | {kind: 'RecordField', hasComputedName: false, name: string, expression: Expression}
    | {kind: 'RecordField', hasComputedName: true, name: Expression, expression: Expression};

export interface ListLiteral {
    kind: 'ListLiteral';
    elements: Expression[];
}

export interface CharacterRange {
    kind: 'CharacterRange';
    subkind: 'Abstract' | 'Concrete';
    minValue: string;
    maxValue: string;
}

export interface StringLiteral {
    kind: 'StringLiteral';
    subkind: 'Abstract' | 'Concrete';
    value: string;
}

export interface VoidLiteral {
    kind: 'VoidLiteral';
}

export interface Reference {
   kind: 'Reference';
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
