// A module has 0..M declarations via 0..N bindings (but only static bindings - check in a later pipeline stage)
// A record has 0..M fields via 0..N bindings
// A tuple has 0..M elements

// A binding has 1 pattern
// A function has 1 pattern
// A binding pattern has several forms and ultimately has 0..M identifiers that add names to the current lexical scope




// TODOs:
// - overall:
//   - distinuish nodes: FieldBinding is not a Binding (ie can't appear wherever a Binding is valid)


// - Records:
//   [x] shorthand when FieldName equals RHS Reference name, eg {Foo} short for {Foo = Foo}
//   [x] need to append "," to these fields, otherwise abbiguous with sequences
//   [x] make commas optional and valid for all fields (even non-shorthand ones) then? ANS: yes
// - Patterns:
//   [ ]  rest/spread element for RecordPattern and TuplePattern
//   [x] document special '_' identifier. ANS: has its own RESERVED token
//   [x] commas between fields - required or optional or ...? ANS: optional, but significant in some cases
// - Tuples:
//   [x] are parentheses required? ANS: yes, otherwise ambiguous with comma-separated shorthand fields
// - Strings
//   - revisit
// - CharRanges
//   - revisit
// - Expression nodes in general
//   - revisit prop naming - eg in Function - pattern, expression are not descriptive, they are just the types (should be param(s), body?)




// ==========   Files and Modules   ==========
File
    = __   module:Module   __   END_OF_FILE
    { return module; }

Module  // NB: same as RecordExpression but without the opening/closing braces
    = bindings:BindingList
    { return {kind: 'Module', bindings}; }


// ==========   Bindings and Patterns   ==========
BindingList
    = !","   head:Binding?   tail:((__   ",")?   __   Binding)*   (__   ",")?
    { return (head ? [head] : []).concat(tail.map(el => el[2])); }

Binding
    = StaticBinding
    / DynamicBinding
    / ShorthandBinding

StaticBinding
    = pattern:Pattern   __   "="   __   value:Expression
    { return {kind: 'StaticBinding', pattern, value}; }

DynamicBinding
    = "["   __   name:Expression   __   "]"   __   "="   __   value:Expression
    { return {kind: 'DynamicBinding', name, value}; }

ShorthandBinding
    = name:IDENTIFIER
    { return {kind: 'ShorthandBinding', name}; }

Pattern
    = WildcardPattern
    / VariablePattern
    / TuplePattern
    / RecordPattern
    // TODO: Add more patterns in future...
    //       See eg https://docs.microsoft.com/en-us/dotnet/fsharp/language-reference/pattern-matching

WildcardPattern
    = UNDERSCORE
    { return {kind: 'WildcardPattern'}; }

VariablePattern
    = name:IDENTIFIER
    { return {kind: 'VariablePattern', name}; }

TuplePattern
    = "("   __   !","   head:Pattern?   tail:(__   ","   __   Pattern)*   (__   ",")?   __   ")"
    { return {kind: 'TuplePattern', elements: (head ? [head] : []).concat(tail.map(el => el[3]))}; }

RecordPattern
    = "{"   __   !","   head:FieldPattern?   tail:((__   ",")?   __   FieldPattern)*   (__   ",")?   __   "}"
    { return {kind: 'RecordPattern', fields: (head ? [head] : []).concat(tail.map(el => el[2]))}; }


FieldPattern
    = fieldName:IDENTIFIER   alias:(__   AS   __   Pattern)?
    { return {kind: 'FieldPattern', fieldName, pattern: alias ? alias[3] : undefined}; }


// ==========   Expressions   ==========
Expression
    = Precedence1

Precedence1                 // LOWEST PRECEDENCE
    = SelectionExpression   // a | b      | a | b | c
    / Precedence2

Precedence2
    = SequenceExpression    // a b      a  b                    // NB: whitespace between terms, else is application
    / Precedence3

Precedence3
    = ApplicationExpression // a(b)   (a)b   a'blah'   a(b)(c)  // NB: no whitespace between terms, else is a sequence
    / Precedence4

Precedence4                 // HIGHEST PRECEDENCE
    = FunctionExpression    // a => a a   (a, b) => a b   () => "blah"      NB: lhs is just a BindingPattern!
    / TupleExpression       // (a, b, c)   (a)   ()                         TODO: are parantheses required for tuples?
    / RecordExpression      // {a=b c=d e=f}   {a=b}    {}
    / CharacterExpression   // 'a-z'   "a-z"   '"a-z"'   "'a-z'"
    / StringExpression      // "foo"   'foo'   '"foo"'   "'foo'"
    / ReferenceExpression   // a   a.b   a.b.c
    / ModuleExpression      // module './foo'   module "./bar"   module {export=this a=b c=d}
    / ThisExpression        // this

SelectionExpression
    = ("|"   __)?   head:Precedence2   tail:(__   "|"   __   Precedence2)+
    { return {kind: 'Selection', expressions: [head].concat(tail.map(el => el[3]))}; }

SequenceExpression
    = head:Precedence3   tail:(/* NON-OPTIONAL */ WHITESPACE   Precedence3)+
    { return {kind: 'Sequence', expressions: [head].concat(tail.map(el => el[1]))}; }

ApplicationExpression
    = head:Precedence4   tail:(/* NO WHITESPACE */   Precedence4)+
    { return tail.reduce((fn, arg) => ({kind: 'Application', function: fn, argument: arg}), head); }

FunctionExpression
    = pattern:Pattern   __   "=>"   __   body:Expression
    { return {kind: 'Function', pattern, body}; }

TupleExpression
    = "("   __   !","   head:Expression?   tail:(__   ","   __   Expression)*   (__   ",")?   __   ")"
    { return {kind: 'Tuple', elements: (head ? [head] : []).concat(tail.map(el => el[3]))}; }

RecordExpression
    = "{"   __   bindings:BindingList   __   "}"
    { return {kind: 'Record', bindings}; }













CharacterExpression
    = "'"   !['"-]   minValue:CHARACTER   "-"   !['"-]   maxValue:CHARACTER   "'"
    { return {kind: 'CharacterRange', subkind: 'Abstract', minValue, maxValue}; }

    / '"'   !['"-]   minValue:CHARACTER   "-"   !['"-]   maxValue:CHARACTER   '"'
    { return {kind: 'CharacterRange', subkind: 'Concrete', minValue, maxValue}; }







StringExpression
    = "'"   (![-']   CHARACTER)*   "'"
    { return {kind: 'StringLiteral', subkind: 'Abstract', value: text().slice(1, -1)}; }

    / '"'   (![-"]   CHARACTER)*   '"'
    { return {kind: 'StringLiteral', subkind: 'Concrete', value: text().slice(1, -1)}; }


ReferenceExpression
    = namespaces:ReferenceNamespaces?   name:IDENTIFIER   !(__   "="   !">")
    { return namespaces ? {kind: 'Reference', namespaces, name} : {kind: 'Reference', name}; }

ReferenceNamespaces
    = ids:(IDENTIFIER   ".")+
    { return ids.map(id => id[0]); }



// TODO...
ModuleExpression
    = MODULE   __   specifier:MODULE_SPECIFIER
    { return {kind: 'Module', specifier}; }

    / MODULE   __   specifier:MODULE_SPECIFIER // TODO: inline BindingList
    { return {kind: 'Module', module}; }






ThisExpression
    = THIS
    { return {kind: 'This'}; }




// ==========   Module specifiers   ==========
MODULE_SPECIFIER
    = "'"   [^'\r\n]*   "'"   { return text().slice(1, -1); }
    / '"'   [^"\r\n]*   '"'   { return text().slice(1, -1); }


// ==========   Literal characters and escape sequences   ==========
CHARACTER
    = ![\x00-\x1F]   !"\\"   .   { return text(); }
    / "\\-"   { return '-'; }
    / "\\"   c:[bfnrtv0'"\\]   { return eval(`"${text()}"`); }
    / "\\x"   d:(HEX_DIGIT   HEX_DIGIT)   { return eval(`"\\u00${d.join('')}"`); }
    / "\\u"   HEX_DIGIT   HEX_DIGIT   HEX_DIGIT   HEX_DIGIT   { return eval(`"${text()}"`); }
    / "\\u{"   d:HEX_DIGIT+   "}"   { return eval(`"${text()}"`); }

HEX_DIGIT = [0-9a-fA-F]


// ==========   Identifiers and Keywords   ==========
IDENTIFIER 'IDENTIFIER' = &IDENTIFIER_START   !RESERVED   IDENTIFIER_START   IDENTIFIER_PART*   { return text(); }
IDENTIFIER_START        = [a-zA-Z_]
IDENTIFIER_PART         = [a-zA-Z_0-9]
RESERVED 'RESERVED'     = AS / MODULE / THIS / UNDERSCORE
AS                      = "as"   !IDENTIFIER_PART   { return text(); }
MODULE                  = "module"   !IDENTIFIER_PART   { return text(); }
THIS                    = "this"   !IDENTIFIER_PART   { return text(); }
UNDERSCORE              = "_"   !IDENTIFIER_PART   { return text(); }


// ==========   Whitespace and lexical markers   ==========
__                      = WHITESPACE?
WHITESPACE 'WHITESPACE' = WHITESPACE_ITEM+   { return text(); }
WHITESPACE_ITEM         = SINGLE_LINE_COMMENT / MULTILINE_COMMENT / HORITONTAL_WHITESPACE / END_OF_LINE
SINGLE_LINE_COMMENT     = "//"   (!END_OF_LINE .)*
MULTILINE_COMMENT       = "/*"   (!"*/" .)*   "*/"
HORITONTAL_WHITESPACE   = [ \t]
END_OF_LINE             = "\r\n" / "\r" / "\n"
END_OF_FILE             = !.
