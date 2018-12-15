export interface Module {
    nodeType: 'Module';
    bindings: Binding[];
}

export interface Binding {
    nodeType: 'Binding';
    id: Identifier;
    expression: Expression;
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
    fields: Array<RecordField | RecordSpread>;
}

export type RecordField = {
    nodeType: 'RecordField';
    hasComputedName: false;
    name: Identifier;
    value: Expression;
} | {
    nodeType: 'RecordField';
    hasComputedName: true;
    name: Expression;
    value: Expression;
};

export interface RecordSpread {
    nodeType: 'RecordSpread';
    argument: Expression;
}

export interface Identifier {
    nodeType: 'Identifier';
    name: string;
}

export interface StringLiteral {
    nodeType: 'StringLiteral';
    variant: 'Abstract' | 'Concrete' | 'Uniform';
    value: string;
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
    | RecordSpread
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
