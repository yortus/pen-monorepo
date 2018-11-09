Start
    = Module

Module
    = WS   bindings:(WS   Binding)*   WS   !.
    { return {type: 'Module', bindings: bindings.map(el => el[1])}; }

Binding
    = id:Identifier   WS   EQ   WS   value:Expression
    { return {type: 'Binding', id, value}; }




// NB: precedence is defined here:
Expression = Selection / ExpressionBelowSelection
ExpressionBelowSelection = Sequence / ExpressionBelowSequence
ExpressionBelowSequence = Application / ExpressionBelowApplication
ExpressionBelowApplication = Record / Identifier / StringLiteral / ParenthesizedExpression




Selection
    = h:ExpressionBelowSelection   t:(WS   PIPE   WS   ExpressionBelowSelection)+
    { return {type: 'Selection', expressions: [h].concat(t.map(el => el[3]))}; }

Sequence
    = h:ExpressionBelowSequence   t:(WS   !(Identifier WS EQ)   ExpressionBelowSequence)+
    { return {type: 'Sequence', expressions: [h].concat(t.map(el => el[2]))}; }

Application
    = id:Identifier   WS   LANGLE   WS   args:ApplicationArguments?   WS   RANGLE
    { return {type: 'Application', id, arguments: args || []}; }

ApplicationArguments
    = h:Expression   t:(WS   COMMA   WS   Expression)*
    { return [h].concat(t.map(el => el[3])); }

Record
    = LBRACE   WS   fields:RecordFields?   WS   RBRACE
    { return {type: 'Record', fields: fields || []}; }

RecordFields
    = h:RecordField   t:(WS   COMMA   WS   RecordField)*
    { return [h].concat(t.map(el => el[3])); }

RecordField
    = id:Identifier   WS   COLON   WS   value:Expression
    { return {type: 'RecordField', id, value}; }

Identifier
    = name:IDENT // TODO: don't consume lhs of next binding - put this check in `Sequence`?
    { return {type: 'Identifier', name}; }

StringLiteral
    = SQUOTE   text:[^'\\\r\n]*   SQUOTE
    { return {type: 'StringLiteral', value: text.join(''), onlyIn: 'ast'}; }

    / BTICK   text:[^`\\\r\n]*   BTICK
    { return {type: 'StringLiteral', value: text.join(''), onlyIn: 'text'}; }

ParenthesizedExpression
    = LPAREN   WS   expression:Expression   WS   RPAREN
    { return {type: 'ParenthesizedExpression', expression}; }




// Identifier
//     = name:IDENT   !(WS   EQ)
//     { return {type: 'Identifier', name } }

// NumberLiteral
//     = 'int32'

// AnyChar
//     = DOT
//     { return {type: 'AnyChar'}; }




IDENT   = [_a-z]i   [_a-z0-9]i*   { return text(); }

BTICK   = '`'
COLON   = ':'
COMMA   = ','
// DOT     = '.'
// DQUOTE  = '"'
EQ      = '='
// FSLASH  = '/'
LANGLE  = '<'
LBRACE  = '{'
LPAREN  = '('
// LSQBR   = '['
PIPE    = '|'
// PLUS    = '+'
// QMARK   = '?'
RANGLE  = '>'
RBRACE  = '}'
RPAREN  = ')'
// RSQBR   = ']'
SQUOTE  = "'"
// STAR    = '*'

WS                      = (WS_CHAR / WS_SINGLE_LINE_COMMENT / WS_MULTI_LINE_COMMENT)*
WS_CHAR                 = [ \t\r\n]
WS_SINGLE_LINE_COMMENT  = '//'   (![\r\n] .)*
WS_MULTI_LINE_COMMENT   = '/*'   (!'*/' .)*   '*/'
