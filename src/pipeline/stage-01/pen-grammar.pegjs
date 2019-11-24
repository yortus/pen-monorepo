// A module has 0..M declarations via 0..N bindings (but only static bindings - check in a later pipeline stage)
// A record has 0..M fields via 0..N bindings
// A tuple has 0..M elements

// A binding has 1 pattern
// A function has 1 pattern
// A binding pattern has several forms and ultimately has 0..M identifiers that add names to the current lexical scope




// TODOs:
// - overall:
//   - distinuish nodes: FieldBinding is not a Binding (ie can't appear wherever a Binding is valid)


// - Record:
//   [x] shorthand when FieldName equals RHS Reference name, eg {Foo} short for {Foo = Foo}
//   [x] need to append "," to these fields, otherwise abbiguous with sequences
//   [x] make commas optional and valid for all fields (even non-shorthand ones) then? ANS: yes
// - Pattern:
//   [ ] rest/spread element for RecordPattern and TuplePattern.
//     - Q: why? show use case...
//   [x] document special '_' identifier. ANS: has its own RESERVED token
//   [x] commas between fields - required or optional or ...? ANS: optional, but significant in some cases
// - Tuple:
//   [x] are parentheses required? ANS: yes, otherwise ambiguous with comma-separated shorthand fields
//   [ ] revisit parens requirement. When ambiguous exactly? Any alternative to make parens optional?
//   [ ] how do tuples map to AST nodes? Esp in 1-tuple case? Arrays always? Or?
// - String:
//   [x] revisit
// - Character:
//   [x] revisit
// - Module:
//   [ ] current syntax is prefix operator notation, should use function application syntax instead? ie module('./foo')
// - Application:
//   [ ] support JSX-lke syntax alternative?
// - Expression nodes in general
//   [ ] revisit prop naming - eg in Function - pattern, expression are not descriptive, they are just the types (should be param(s), body?)




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
    = ExportBinding
    / StaticBinding
    / DynamicBinding
    / ShorthandBinding

ExportBinding
    = EXPORT   __   "="   __   value:Expression
    { return {kind: 'ExportBinding', value}; }

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

FieldPattern // NB: only valid inside a RecordPattern, i.e. this is not valid as a standalone pattern
    = fieldName:IDENTIFIER   alias:(__   AS   __   Pattern)?
    { return {kind: 'FieldPattern', fieldName, pattern: alias ? alias[3] : undefined}; }


// ==========   Expressions   ==========
/*
    PRECEDENCE 1 (LOWEST)
        SelectionExpression         a | b      | a | b | c

    PRECEDENCE 2
        SequenceExpression          a b      a  b c                                                                     NB: whitespace between terms, else is application

    PRECEDENCE 3
        ApplicationExpression       a(b)   (a)b   a'blah'   a(b)                                                        NB: no whitespace between terms, else is sequence
        StaticMemberExpression      a.b   a.b   (a b).e   {foo=f}.foo                                                   NB: no whitespace between terms, may relax later

    PRECEDENCE 4 (HIGHEST):
        FunctionExpression          a => a a   (a, b) => a b   () => "blah"                                             NB: lhs is just a Pattern!
        TupleExpression             (a, b, c)   (a)   ()                                                                NB: parentheses are required for tuples to avoid ambiguity with shorthand bindings in records, eg {a, b}. TODO: revise this
        RecordExpression            {a=b c=d e=f}   {a=b}   {c}   {}
        CharacterExpression         "a-z"   "0-9"
        StringExpression            "foo"   "a string!"
        LabelExpression             'foo'   'bar'
        ReferenceExpression         a   Rule1   MY_FOO_45   x32   __bar
        ThisExpression              this
        ImportExpression            import './foo'   import 'somelib'
*/

Expression
    = Precedence1OrHigher

Precedence1OrHigher
    = SelectionExpression
    / Precedence2OrHigher

Precedence2OrHigher
    = SequenceExpression
    / Precedence3OrHigher

Precedence3OrHigher
    = Precedence3Expression
    / Precedence4OrHigher

Precedence4OrHigher
    = PrimaryExpression

PrimaryExpression
    = FunctionExpression
    / TupleExpression
    / RecordExpression
    / CharacterExpression
    / StringExpression
    / LabelExpression
    / ReferenceExpression
    / ThisExpression
    / ImportExpression

SelectionExpression
    = ("|"   __)?   head:Precedence2OrHigher   tail:(__   "|"   __   Precedence2OrHigher)+
    { return {kind: 'SelectionExpression', expressions: [head].concat(tail.map(el => el[3]))}; }

SequenceExpression
    = head:Precedence3OrHigher   tail:(/* MANDATORY WHITESPACE */   WHITESPACE   Precedence3OrHigher)+
    { return {kind: 'SequenceExpression', expressions: [head].concat(tail.map(el => el[1]))}; }

Precedence3Expression
    = head:Precedence4OrHigher   tail:(/* NO WHITESPACE */   StaticMemberReference / ApplicationArgument)+
    {
        return tail.reduce(
            (lhs, rhs) => (rhs.name
                ? {kind: 'StaticMemberExpression', namespace: lhs, memberName: rhs.name}
                : {kind: 'ApplicationExpression', function: lhs, argument: rhs.arg}
            ),
            head
        );
    }

StaticMemberReference
    = "."   /* NO WHITESPACE */   name:IDENTIFIER
    { return {name}; }

ApplicationArgument
    = arg: Precedence4OrHigher
    { return {arg}; }

FunctionExpression
    = pattern:Pattern   __   "=>"   __   body:Expression
    { return {kind: 'FunctionExpression', pattern, body}; }

TupleExpression
    = "("   __   !","   head:Expression?   tail:(__   ","   __   Expression)*   (__   ",")?   __   ")"
    { return {kind: 'TupleExpression', elements: (head ? [head] : []).concat(tail.map(el => el[3]))}; }

RecordExpression
    = "{"   __   bindings:BindingList   __   "}"
    { return {kind: 'RecordExpression', bindings}; }

CharacterExpression
    = '"'   !["-]   minValue:CHARACTER   "-"   !["-]   maxValue:CHARACTER   '"'
    { return {kind: 'CharacterExpression', minValue, maxValue}; }

StringExpression
    = !CharacterExpression   '"'   (!'"'   CHARACTER)*   '"'
    { return {kind: 'StringExpression', value: text().slice(1, -1)}; }

LabelExpression
    = "'"   (!"'"   CHARACTER)*   "'"
    { return {kind: 'LabelExpression', value: text().slice(1, -1)}; }

ReferenceExpression
    = name:IDENTIFIER   !(__   "="   !">")
    { return {kind: 'ReferenceExpression', name}; }

ThisExpression
    = THIS
    { return {kind: 'ThisExpression'}; }

ImportExpression
    = IMPORT   __   "'"   specifierChars:(!"'"   CHARACTER)*   "'"
    { return {kind: 'ImportExpression', specifier: specifierChars.map(el => el[1]).join('')}; }


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
RESERVED 'RESERVED'     = AS / EXPORT / IMPORT / THIS / UNDERSCORE
AS                      = "as"   !IDENTIFIER_PART   { return text(); }
EXPORT                  = "export"   !IDENTIFIER_PART   { return text(); }
IMPORT                  = "import"   !IDENTIFIER_PART   { return text(); }
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
