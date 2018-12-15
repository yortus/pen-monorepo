Start
    = Module

Module
    = WS   bindings:(WS   Binding)*   WS   !.
    { return {nodeType: 'Module', bindings: bindings.map(el => el[1])}; }

Binding
    = id:Identifier   WS   EQ   WS   expression:Expression
    { return {nodeType: 'Binding', id, expression}; }




// NB: precedence is defined here:
Expression = Selection / ExpressionBelowSelection
ExpressionBelowSelection = Sequence / ExpressionBelowSequence
ExpressionBelowSequence = Application / ExpressionBelowApplication
ExpressionBelowApplication = Record / Identifier / StringLiteral / ParenthesizedExpression




Selection
    = h:ExpressionBelowSelection   t:(WS   PIPE   WS   ExpressionBelowSelection)+
    { return {nodeType: 'Selection', expressions: [h].concat(t.map(el => el[3]))}; }

Sequence
    = h:ExpressionBelowSequence   t:(WS   !(Identifier WS EQ)   ExpressionBelowSequence)+
    { return {nodeType: 'Sequence', expressions: [h].concat(t.map(el => el[2]))}; }

Application
    = id:Identifier   WS   LANGLE   WS   args:ApplicationArguments?   WS   RANGLE
    { return {nodeType: 'Application', id, arguments: args || []}; }

ApplicationArguments
    = h:Expression   t:(WS   COMMA   WS   Expression)*
    { return [h].concat(t.map(el => el[3])); }

Record
    = LBRACE   WS   fields:RecordFields?   WS   RBRACE
    { return {nodeType: 'Record', fields: fields || []}; }

RecordFields
    = h:RecordField   t:(WS   COMMA   WS   RecordField)*
    { return [h].concat(t.map(el => el[3])); }

RecordField
    = name:Identifier   WS   COLON   WS   value:Expression
    { return {nodeType: 'RecordField', hasComputedName: false, name, value}; }

    / LSQBR name:Expression RSQBR   WS   COLON   WS   value:Expression
    { return {nodeType: 'RecordField', hasComputedName: true, name, value}; }

// TODO: computed field name
// TODO: rest/spread fields (one per record, must come last?)

Identifier
    = name:IDENT // TODO: don't consume lhs of next binding - put this check in `Sequence`?
    { return {nodeType: 'Identifier', name}; }

StringLiteral
    = SQUOTE   text:[^'\\\r\n]*   SQUOTE
    { return {nodeType: 'StringLiteral', variant: 'Abstract', value: text.join('')}; }

    / DQUOTE   text:[^"\\\r\n]*   DQUOTE
    { return {nodeType: 'StringLiteral', variant: 'Uniform', value: text.join('')}; } // TODO: 8-letter synonym?

    / BTICK   text:[^`\\\r\n]*   BTICK
    { return {nodeType: 'StringLiteral', variant: 'Concrete', value: text.join('')}; }

ParenthesizedExpression
    = LPAREN   WS   expression:Expression   WS   RPAREN
    { return {nodeType: 'ParenthesizedExpression', expression}; }




// Identifier
//     = name:IDENT   !(WS   EQ)
//     { return {nodeType: 'Identifier', name } }

// NumberLiteral
//     = 'int32'

// AnyChar
//     = DOT
//     { return {nodeType: 'AnyChar'}; }




IDENT   = [_a-z]i   [_a-z0-9]i*   { return text(); }

BTICK   = '`'
COLON   = ':'
COMMA   = ','
// DOT     = '.'
DQUOTE  = '"'
EQ      = '='
// FSLASH  = '/'
LANGLE  = '<'
LBRACE  = '{'
LPAREN  = '('
LSQBR   = '['
PIPE    = '|'
// PLUS    = '+'
// QMARK   = '?'
RANGLE  = '>'
RBRACE  = '}'
RPAREN  = ')'
RSQBR   = ']'
SQUOTE  = "'"
// STAR    = '*'

WS                      = (WS_CHAR / WS_SINGLE_LINE_COMMENT / WS_MULTI_LINE_COMMENT)*
WS_CHAR                 = [ \t\r\n]
WS_SINGLE_LINE_COMMENT  = '//'   (![\r\n] .)*
WS_MULTI_LINE_COMMENT   = '/*'   (!'*/' .)*   '*/'
