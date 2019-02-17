Start
    = File

File
    = PenFile
    / ForeignFile

PenFile
    = WS   Module   WS

ForeignFile
    = !. . // TODO...

Module
    = items:(WS   ModuleItem)*
    { return {type: 'Module', items: items.map(d => d[1])}; }

ModuleItem
    = StartDeclaration
    / BindingDeclaration
    / TypeDeclaration

StartDeclaration
    = !. . // TODO...

BindingDeclaration
    = SingleBindingDeclaration
    / MultiBindingDeclaration

// TODO: exports...
SingleBindingDeclaration
    = id:Identifier   WS   EQUALS   WS   expression:Expression
    { return {type: 'SingleBindingDeclaration', id, expression}; }

// TODO: exports?... renaming...
MultiBindingDeclaration
    = !. . // TODO...


// TODO: exports...
TypeDeclaration
    = !. . // TODO...




// NB: precedence is defined here:
Expression
    = Selection
    / ExpressionBelowSelection

ExpressionBelowSelection
    = Sequence
    / ExpressionBelowSequence

ExpressionBelowSequence
    = Application
    / ExpressionBelowApplication

ExpressionBelowApplication
    = ModuleReference
    / ModuleExpression
    / Record
    / List
    / CharRange
    / AbstractStringLiteral
    / ConcreteStringLiteral
    / VoidLiteral
    / Identifier   !(WS   EQUALS) // NB: an Identifier expression may *not* be followed by '='
    / ParenthesizedExpression


ModuleReference
    = "module"   WS   SQUOTE   moduleId:(!SQUOTE .)+   SQUOTE   // TODO: fix...
    { return {type: 'ModuleReference', moduleId}; }

ModuleExpression
    = "module"   WS   LBRACE   m:Module   WS   RBRACE
    { return m; }




// TODO: not a keyword...
Identifier
    = name:IDENT
    { return {type: 'Identifier', name}; }


// Module = module header modulebody
// ModuleBody = list of declarations
// Declaration = NameBinding
// NameBinding = export? <name> = expr



// Module
//     = WS   bindings:(WS   Binding)*   WS   !.
//     { return {nodeType: 'Module', bindings: bindings.map(el => el[1])}; }

// Binding
//     = id:Identifier   WS   EQ   WS   expression:Expression
//     { return {nodeType: 'Binding', id, expression}; }




// // NB: precedence is defined here:
// Expression = Selection / ExpressionBelowSelection
// ExpressionBelowSelection = Sequence / ExpressionBelowSequence
// ExpressionBelowSequence = Application / ExpressionBelowApplication
// ExpressionBelowApplication = Record / List / CharRange / String / Identifier / ParenthesizedExpression




// Selection
//     = (PIPE   WS)?   h:ExpressionBelowSelection   t:(WS   PIPE   WS   ExpressionBelowSelection)+
//     { return {nodeType: 'Selection', expressions: [h].concat(t.map(el => el[3]))}; }

// Sequence
//     = h:ExpressionBelowSequence   t:(WS   !(Identifier WS EQ)   ExpressionBelowSequence)+
//     { return {nodeType: 'Sequence', expressions: [h].concat(t.map(el => el[2]))}; }

// Application
//     = id:Identifier   WS   LANGLE   WS   args:ApplicationArguments?   WS   RANGLE
//     { return {nodeType: 'Application', id, arguments: args || []}; }

// ApplicationArguments
//     = h:Expression   t:(WS   COMMA   WS   Expression)*
//     { return [h].concat(t.map(el => el[3])); }

// Record
//     = LBRACE   WS   fields:RecordFields?   WS   RBRACE
//     { return {nodeType: 'Record', fields: fields || []}; }

// RecordFields
//     = h:RecordField   t:(WS   COMMA   WS   RecordField)*
//     { return [h].concat(t.map(el => el[3])); }

// RecordField
//     = name:Identifier   WS   COLON   WS   value:Expression
//     { return {nodeType: 'RecordField', hasComputedName: false, name, value}; }

//     / LSQBR name:Expression RSQBR   WS   COLON   WS   value:Expression
//     { return {nodeType: 'RecordField', hasComputedName: true, name, value}; }

// List
//     = LSQBR   WS   elements:ListElements?   WS   RSQBR
//     { return {nodeType: 'List', elements: elements || []}; }

// ListElements
//     = h:ListElement   t:(WS   COMMA   WS   ListElement)*
//     { return [h].concat(t.map(el => el[3])); }

// ListElement
//     = value:Expression
//     { return {nodeType: 'ListElement', value}; }

// CharRange
//     = SQUOTE   !SQUOTE   min:Character   SQUOTE   WS   DOT   DOT   WS   SQUOTE   !SQUOTE   max:Character   SQUOTE
//     { return {nodeType: 'CharacterRange', variant: 'Abstract', min, max}; }

//     / DQUOTE   !DQUOTE   min:Character   DQUOTE   WS   DOT   DOT   WS   DQUOTE   !DQUOTE   max:Character   DQUOTE
//     { return {nodeType: 'CharacterRange', variant: 'Uniform', min, max}; }

//     / BTICK   !BTICK   min:Character   BTICK   WS   DOT   DOT   WS   BTICK   !BTICK   max:Character   BTICK
//     { return {nodeType: 'CharacterRange', variant: 'Concrete', min, max}; }

// String
//     = SQUOTE   cs:(!SQUOTE   Character)*   SQUOTE
//     { return {nodeType: 'StringLiteral', variant: 'Abstract', value: cs.map(c => c[1]).join('')}; }

//     / DQUOTE   cs:(!DQUOTE   Character)*   DQUOTE
//     { return {nodeType: 'StringLiteral', variant: 'Uniform', value: cs.map(c => c[1]).join('')}; }

//     / BTICK   cs:(!BTICK   Character)*   BTICK
//     { return {nodeType: 'StringLiteral', variant: 'Concrete', value: cs.map(c => c[1]).join('')}; }

// Character
//     = !CTRL   !BSLASH   .   { return text(); }
//     / BSLASH   c:["'`\\/bfnrt]   { return JSON.parse(`"${text()}"`); } // TODO: could be more permissive here, like JS...
//     / BSLASH   "x"   d:(HEXDIGIT   HEXDIGIT)   { return JSON.parse(`"\\u00${d.join('')}"`); }
//     / BSLASH   "u"   HEXDIGIT   HEXDIGIT   HEXDIGIT   HEXDIGIT   { return JSON.parse(`"${text()}"`); }

// Identifier
//     = name:IDENT // TODO: don't consume lhs of next binding - put this check in `Sequence`?
//     { return {nodeType: 'Identifier', name}; }

// ParenthesizedExpression
//     = LPAREN   WS   expression:Expression   WS   RPAREN
//     { return {nodeType: 'ParenthesizedExpression', expression}; }




// // Identifier
// //     = name:IDENT   !(WS   EQ)
// //     { return {nodeType: 'Identifier', name } }

// // NumberLiteral
// //     = 'int32'

// // AnyChar
// //     = DOT
// //     { return {nodeType: 'AnyChar'}; }




IDENT   = [_a-z]i   [_a-z0-9]i*   { return text(); }

// BSLASH  = '\\'
// BTICK   = '`'
// COLON   = ':'
// COMMA   = ','
// CTRL    = [\x00-\x1F]
// DOT     = '.'
DQUOTE  = '"'
EQUALS  = '='
// // FSLASH  = '/'
// HEXDIGIT= [0-9a-fA-F]
// LANGLE  = '<'
LBRACE  = '{'
// LPAREN  = '('
// LSQBR   = '['
// PIPE    = '|'
// // PLUS    = '+'
// // QMARK   = '?'
// RANGLE  = '>'
RBRACE  = '}'
// RPAREN  = ')'
// RSQBR   = ']'
SQUOTE  = "'"
// // STAR    = '*'

WS                      = WS_ITEM*
WS_ITEM                 = WS_CHAR / WS_SINGLE_LINE_COMMENT / WS_MULTI_LINE_COMMENT
WS_CHAR                 = [ \t\r\n]
WS_SINGLE_LINE_COMMENT  = '//'   (![\r\n] .)*
WS_MULTI_LINE_COMMENT   = '/*'   (!'*/' .)*   '*/'