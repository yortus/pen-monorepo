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
// [ ] not predicate / negative lookahead
// [ ] parenthesised expression
// [ ] leadng/trailing text
// [ ] precondition / postcondition



// TODO: node summary:
// Program
// NameBinding
// CompositeExpr with name bindings
// Selection / Select / Union / Alternation / Option / Choice / Switch / Sum / Enum / Decision / Disjunction / Branch
// Sequence  / Series / Concat / a <b> c / Ordering / Consecution / Conjunction / Succession
// Record & Field
// StringLiteral (ast-only with '' or transcoded with "")
// StringPattern / regex-like




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
    | SelectExpression
    | ConcatExpression
    | RecordExpression
    | Identifier
    | StringLiteral
    | StringPattern;

export interface SelectExpression {
    type: 'SelectExpression';
    alternatives: Expression[];
}

export interface ConcatExpression {
    type: 'ConcatExpression';
    leading: Expression[]; // only strings and/or predicates
    core: Expression;
    trailing: Expression[]; // only strings and/or predicates
}

export interface RecordExpression {
    type: 'RecordExpression';
    fields: RecordField[];
}

export interface RecordField {
    type: 'RecordField';
    name: string;
    value: Expression;
}

export interface Identifier {
    type: 'Identifier';
    name: string;
}

export interface StringLiteral {
    type: 'StringLiteral';
    value: string;
    isAstOnly: boolean;
    // TODO: preserve escape sequences? eg raw/cooked props?
    //       how does babel etc handle this in its AST?
}

export interface StringPattern {
    type: 'StringPattern';
    atoms: Array<QuantifiedText | TextAtom>;
}


export interface QuantifiedText {
    type: 'QuantifiedText';
    value: TextAtom;
    min: number;
    max?: number;
}

export type TextAtom = StringLiteral | CharClass | CharWildcard;

export interface CharClass {
    type: 'CharClass';
    parts: Array<string | [string, string]>;
    // TODO: support isNegated?
}

export interface CharWildcard {
    type: 'CharWildcard';
}
