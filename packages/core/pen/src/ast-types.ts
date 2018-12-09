export interface Module {
    nodeType: 'Module';
    bindings: Binding[];
}

export interface Binding {
    nodeType: 'Binding';
    id: Identifier;
    value: Expression; // TODO: rename value ==> expression
}

export interface Selection {
    nodeType: 'Selection';
    expressions: Expression[];
}

export interface Sequence {
    nodeType: 'Sequence';
    expressions: Expression[];
}

export interface Application {
    nodeType: 'Application';
    id: Identifier;
    arguments: Expression[];
}

export interface Record {
    nodeType: 'Record';
    fields: RecordField[];
}

export interface RecordField {
    nodeType: 'RecordField';
    id: Identifier;
    value: Expression; // TODO: rename value ==> expression
}

export interface Identifier {
    nodeType: 'Identifier';
    name: string;
}

export interface StringLiteral {
    nodeType: 'StringLiteral';
    value: string;
    onlyIn?: 'ast' | 'text'; // TODO: settle on official term for non-dual / non-transcoded
    // TODO: preserve escape sequences? eg raw/cooked props?
    //       how does babel etc handle this in its AST?
}

export interface ParenthesizedExpression {
    nodeType: 'ParenthesizedExpression';
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
