// TODO:
// - BindingPattern: (ie the LHS/LValue of a Binding)
//   - BindingPattern := `{` BindingElement (COMMA BindindElement* `}`
//   - BindingElement := (Identifier EQ)? Identifier (DOT Identifier)*



// A module has 0..M bindings
// A record has 0..M fields
// A tuple has 0..M elements

// A binding has 1 pattern
// A function has 1 pattern
// A binding pattern has several forms and ultimately has 0..M identifiers that add names to the current lexical scope



// ========================>  Where makes sense: M=Module, R=Record, F=Function param
// identifier corresponding to entire bound expr            M, R, F
// names corresponding to tuple positions of bound expr     M, R, F
// names corresponding to field names of bound expr         M, R, F

// 'export' reserved word                                   M
// computed name                                            R




// TODOs:
// - Records:
//   - shorthand when FieldName equals RHS Reference name, eg {Foo} short for {Foo = Foo}
//   - need to append "," to these fields, otherwise abbiguous with sequences
//   - make commas optional and valid for all fields (even non-shorthand ones) then?
// - Patterns:
//   - rest/spread element for RecordPattern and TuplePattern
//   - document special '_' identifier
//   - AliasPattern, c.f. OCaml, F#
//   - commas between fields - required or optional or ...?
// - Tuples:
//   - are parentheses required? ANS: yes, otherwise ambiguous with comma-separated shorthand fields
// - Strings
//   - revisit
// - CharRanges
//   - revisit
// - Expression nodes in general
//   - revisit prop naming - eg in Function - pattern, expression are not descriptive, they are just the types (should be param(s), body?)




// ==========   Top-level: Files and Modules   ==========
File
    = __   module:Module   __   END_OF_FILE
    { return module; }

Module
    = head:Binding?   tail:(__   Binding)*
    { return {kind: 'Module', bindings: (head ? [head] : []).concat(tail.map(el => el[1]))}; }


// ==========   Bindings and Patterns   ==========
Binding
    = pattern:Pattern   __   "="   __   value:Expression
    { return {kind: 'Binding', pattern, value}; }

// TODO: Add more patterns in future
//       See eg https://docs.microsoft.com/en-us/dotnet/fsharp/language-reference/pattern-matching
Pattern
    = WildcardPattern
    / VariablePattern
    / TuplePattern
    / RecordPattern

WildcardPattern
    = UNDERSCORE
    { return {kind: 'WildcardPattern'}; }

VariablePattern
    = name:IDENTIFIER
    { return {kind: 'VariablePattern', name}; }

TuplePattern
    = "("   __   head:Pattern?   tail:(__   ","   __   Pattern)*   __   ")"
    { return {kind: 'TuplePattern', elements: (head ? [head] : []).concat(tail.map(el => el[3]))}; }

RecordPattern
    = "{"   __   fields:PatternFieldList   __   "}"
    { return {kind: 'RecordPattern', fields}; }

PatternFieldList
    = head:PatternField?   tail:(__   ","   __   PatternField)* // TODO: commas optional?
    { return (head ? [head] : []).concat(tail.map(el => el[3])); }

PatternField
    = fieldName:IDENTIFIER   pattern:(__   AS   __   Pattern)?
    { return {kind: 'PatternField', fieldName, pattern: pattern ? pattern[3] : undefined}; }


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
    = "("   __   elements:ElementList   __   ")"
    { return {kind: 'Tuple', elements}; }

ElementList
    = head:Expression?   tail:(__   ","   __   Expression)*   (__   ",")?
    { return (head ? [head] : []).concat(tail.map(el => el[3])); }







RecordExpression
    = "{"   __   fields: FieldList   __   "}"
    { return {kind: 'Record', fields}; }

FieldList
    = head:Field?   tail:((__   ",")?   __   Field)*   (__   ",")?
    { return (head ? [head] : []).concat(tail.map(el => el[2])); }

Field
    = Binding
    / ShorthandBinding
//    / DynamicBinding

ShorthandBinding
    = name:IDENTIFIER
    { return {kind: 'ShorthandBinding', name}; }

// DynamicBinding
//     = Binding





// Field
//     = name:FieldName   __   "="   __   expression:Expression
//     {
//         // TODO: differentiate `name` kinds?
//         return {kind: 'Field', hasComputedName: false, name, expression};
//         return {kind: 'Field', hasComputedName: true, name, expression};
//     }

// // TODO: FieldName/FieldLabel = pattern / computed name
// FieldName
//     = pattern: Pattern
//     { TODO }

//     / "["   __   expression:Expression   __   "]"
//     { TODO }














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
