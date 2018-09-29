// TODO:
// [x] program
// [x] selection
// [x] name binding
// [ ] record / properties
// [ ] ast-only text
// [ ] source-only text / source-idiom
// [ ] string
//   [ ] char literal
//   [ ] char class incl ranges
//   [ ] repetition
//     [ ] 1..M
//     [ ] 0..M
//   [ ] wildcard '.'
// [ ] not predicate
// [ ] parenthesised expression



export interface Program {
    type: 'Program';
    bindings: BindingDeclaration[];
}

export interface BindingDeclaration {
    type: 'BindingDeclaration';
    name: string;
    value: Expression;
}

export type Expression =
    | SelectionExpression
    | RecordExpression
    | StringExpression;

export interface SelectionExpression {
    type: 'SelectionExpression';
    alternatives: Expression[];
}

export interface RecordExpression {
    type: 'RecordExpression';
    elements: Array<RecordField | SourceIdiom>;
}

export interface RecordField {
    type: 'RecordField';
    name: string;
    value: Expression;
}

export interface SourceIdiom {
    type: 'SourceIdiom';
    value: StringExpression;
}





// Text ~~ String ~~ Char      }- Terminology??
export interface StringExpression {
    type: 'StringExpression';
    concatenands: CharSequence[];
}

type CharSequence =
    | CharLiteral
    | CharClass
    | CharWildcard
    | CharNegation
    | CharRepetition;

export interface CharLiteral {
    type: 'CharLiteral';
    value: string;
    escape?: string;
}

export interface CharClass {
    type: 'CharClass';
    alternatives: Array<CharLiteral | CharRange>;
}

export interface CharRange {
    type: 'CharRange';
    min: CharLiteral;
    max: CharLiteral;
}

export interface CharWildcard {
    type: 'CharWildcard';
}

export interface CharNegation {
    type: 'CharNegation';
    value: CharSequence;
}

export interface CharRepetition {
    type: 'CharRepetition';
    value: CharSequence;
    min: number;
    max: number;
}
