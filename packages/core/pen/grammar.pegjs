Start
    = Program

Program
    = WS   bindings:(WS   BindingDeclaration)*   WS   !.
    { return {type: 'Program', bindings: bindings.map(el => el[1])}; }

BindingDeclaration
    = name:ID   WS   EQ   WS   value:Expression
    { return {type: 'BindingDeclaration', name, value}; }

Expression
    = SelectExpression

SelectExpression
    = h:ConcatExpression   t:(WS   PIPE   WS   ConcatExpression)*
    { return t.length > 0 ? {type: 'SelectExpression', alternatives: [h].concat(t.map(el => el[3]))} : h; }

ConcatExpression
    = leading:ConcatLeading?   WS   core:PrimaryExpression   WS   trailing:ConcatTrailing?
    { return leading || trailing ? {type: 'ConcatExpression', leading, core, trailing} : core; }

ConcatLeading
    = items:(WS   PrimaryExpression)*   WS   LANGLE
    { return items.map(item => item[1]); }

ConcatTrailing
    = RANGLE   items:(WS   PrimaryExpression)*
    { return items.map(item => item[1]); }

PrimaryExpression
    = RecordExpression
    / Identifier
    / StringLiteral
    // TODO: StringPattern

RecordExpression
    = LBRACE   WS   h:RecordField   t:(WS   COMMA   WS   RecordField)*   WS   RBRACE
    { return {type: 'RecordExpression', fields: [h].concat(t.map(t => t[3]))}; }

RecordField
   = name:ID   WS   COLON   WS   value:Expression
   { return {type: 'RecordField', name, value}; }

Identifier
    = name:ID   !(WS   EQ)
    { return {type: 'Identifier', name } }

StringLiteral
    = SQUOTE   text:[^'\r\n]*   SQUOTE
    { return {type: 'StringLiteral', value: text.join(''), isAstOnly: true}; }

    / DQUOTE   text:[^"\r\n]*   DQUOTE
    { return {type: 'StringLiteral', value: text.join(''), isAstOnly: false}; }

COLON   = ':'
COMMA   = ','
DQUOTE  = '"'
EQ      = '='
ID      = [_a-z]i   [_a-z0-9]i*   { return text(); }
LANGLE  = '<'
LBRACE  = '{'
LPAREN  = '('
PIPE    = '|'
RANGLE  = '>'
RBRACE  = '}'
RPAREN  = ')'
SQUOTE  = "'"
WS      = [ \t\r\n]*
