export interface Module {
    type: 'Module';
    bindings: Binding[];
}

export interface Binding {
    type: 'Binding';
    id: Identifier;
    value: Expression;
}

export interface Selection {
    type: 'Selection';
    expressions: Expression[];
}

export interface Sequence {
    type: 'Sequence';
    expressions: Expression[];
}

export interface Application {
    type: 'Application';
    id: Identifier;
    arguments: Expression[];
}

export interface Record {
    type: 'Record';
    fields: RecordField[];
}

export interface RecordField {
    type: 'RecordField';
    id: Identifier;
    value: Expression;
}

export interface Identifier {
    type: 'Identifier';
    name: string;
}

export interface StringLiteral {
    type: 'StringLiteral';
    value: string;
    onlyIn?: 'ast' | 'text'; // TODO: settle on official term for non-dual / non-transcoded
    // TODO: preserve escape sequences? eg raw/cooked props?
    //       how does babel etc handle this in its AST?
}

export interface ParenthesizedExpression {
    type: 'ParenthesizedExpression';
    expression: Expression;
}




export type Node =
    | Module
    | Binding
    | Selection
    | Sequence
    | Application
    | Record
    | RecordField
    | Identifier
    | StringLiteral
    | ParenthesizedExpression;

export type Expression =
    | Selection
    | Sequence
    | Application
    | Record
    | Identifier
    | StringLiteral
    | ParenthesizedExpression;
