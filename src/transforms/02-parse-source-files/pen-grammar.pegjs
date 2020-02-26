{
    options.sourceFile = options.sourceFile || {};
    options.sourceFile.imports = options.sourceFile.imports || {};
}


// ====================   Files and Modules   ====================
File
    = __   module:Module   __   END_OF_FILE
    { return module; }

Module
    = bindings:BindingList
    { return {kind: 'Module', bindings}; }


// ====================   Bindings   ====================
BindingList
    = !","   head:Binding?   tail:((__   ",")?   __   Binding)*   (__   ",")?
    { return (head ? [head] : []).concat(tail.map(el => el[2])); }

Binding
    = ex:(EXPORT   __)?   pattern:Pattern   __   "="   __   value:Expression
    { return Object.assign({kind: 'Binding', pattern, value}, ex ? {exported: true} : {}); }


// ====================   Patterns   ====================
Pattern
    = VariablePattern
    / ModulePattern

VariablePattern
    = name:IDENTIFIER
    { return {kind: 'VariablePattern', name}; }

ModulePattern
    = "{"   __   !","   head:ModulePatternName?   tail:((__   ",")?   __   ModulePatternName)*   (__   ",")?   __   "}"
    { return {kind: 'ModulePattern', names: (head ? [head] : []).concat(tail.map(el => el[2]))}; }

ModulePatternName // NB: this itself is not a pattern, but a clause of ModulePattern
    = name:IDENTIFIER   alias:(__   AS   __   IDENTIFIER)?
    { return Object.assign({kind: 'ModulePatternName', name}, alias ? {alias: alias[3]} : {}); }


// ====================   Expressions   ====================
/*
    PRECEDENCE 1 (LOWEST)
        SelectionExpression         a | b      | a | b | c

    PRECEDENCE 2
        SequenceExpression          a b      a  b c                                                                     NB: whitespace between terms, else is application

    PRECEDENCE 3
        ApplicationExpression       a(b)   (a)b   a'blah'   a(b)                                                        NB: no whitespace between terms, else is sequence
        StaticMemberExpression      a.b   a.b   (a b).e   {foo=f}.foo                                                   NB: no whitespace between terms, may relax later

    PRECEDENCE 4 (HIGHEST):
        ---DISABLED FOR NOW--> FunctionExpression          a => a a   (a, b) => a b   () => "blah"                                             NB: lhs is just a Pattern!
        RecordExpression            {a: b   c: d   [e]: f}   {a: b}   {}
        ModuleExpression            {export a=b c=d e=f}   {a=b}
        ListExpression              [a, b, c]   [a]   []
        CharacterExpression         "a-z"   "0-9"
        StringExpression            "foo"   "a string!"
        LabelExpression             'foo'   'bar'
        ReferenceExpression         a   Rule1   MY_FOO_45   x32   __bar
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
    // = FunctionExpression
    = RecordExpression
    / ModuleExpression
    / ListExpression
    / ParenthesisedExpression
    / ImportExpression
    / CharacterExpression
    / StringExpression
    / LabelExpression
    / ReferenceExpression

SelectionExpression
    = ("|"   __)?   head:Precedence2OrHigher   tail:(__   "|"   __   Precedence2OrHigher)+
    { return {kind: 'SelectionExpression', expressions: [head].concat(tail.map(el => el[3]))}; }

SequenceExpression
    = head:Precedence3OrHigher   tail:(/*MANDATORY*/ WHITESPACE   Precedence3OrHigher   !(__   "="   !">")   !(__   ":"))+
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
    = arg:Precedence4OrHigher
    { return {arg}; }

// FunctionExpression
//     = pattern:Pattern   __   "=>"   __   body:Expression
//     { return {kind: 'FunctionExpression', pattern, body}; }

RecordExpression
    = "{"   __   fields:FieldList   __   "}"
    { return {kind: 'RecordExpression', fields}; }

ModuleExpression
    = "{"   __   module:Module   __   "}"
    { return {kind: 'ModuleExpression', module}; }

ListExpression
    = "["   __   elements:ElementList   __   "]"
    { return {kind: 'ListExpression', elements}; }

ParenthesisedExpression
    = "("   __   expression:Expression   __   ")"
    { return {kind: 'ParenthesisedExpression', expression}; }

ImportExpression
    = IMPORT   __   "'"   specifierChars:(!"'"   CHARACTER)*   "'"
    {
        let moduleSpecifier = specifierChars.map(el => el[1]).join('');
        let sourceFilePath = options.sourceFile.imports[moduleSpecifier];
        return {kind: 'ImportExpression', moduleSpecifier, sourceFilePath};
    }

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
    = name:IDENTIFIER
    { return {kind: 'ReferenceExpression', name}; }


// ====================   Fields and Elements   ====================
FieldList
    = !","   head:Field?   tail:((__   ",")?   __   Field)*   (__   ",")?
    { return (head ? [head] : []).concat(tail.map(el => el[2])); }

Field
    = StaticField
    / DynamicField

StaticField
    = name:IDENTIFIER   __   ":"   __   value:Expression
    { return {kind: 'StaticField', name, value}; }

DynamicField
    = "["   __   name:Expression   __   "]"   __   ":"   __   value:Expression
    { return {kind: 'DynamicField', name, value}; }

ElementList
    = !","   head:Expression?   tail:((__   ",")?   __   Expression)*   (__   ",")?
    { return (head ? [head] : []).concat(tail.map(el => el[2])); }


// ====================   Literal characters and escape sequences   ====================
CHARACTER
    = ![\x00-\x1F]   !"\\"   .   { return text(); }
    / "\\-"   { return '-'; }
    / "\\"   c:[bfnrtv0'"\\]   { return eval(`"${text()}"`); }
    / "\\x"   d:(HEX_DIGIT   HEX_DIGIT)   { return eval(`"\\u00${d.join('')}"`); }
    / "\\u"   HEX_DIGIT   HEX_DIGIT   HEX_DIGIT   HEX_DIGIT   { return eval(`"${text()}"`); }
    / "\\u{"   d:HEX_DIGIT+   "}"   { return eval(`"${text()}"`); }

HEX_DIGIT = [0-9a-fA-F]


// ====================   Identifiers and Keywords   ====================
IDENTIFIER 'IDENTIFIER' = &IDENTIFIER_START   !RESERVED   IDENTIFIER_START   IDENTIFIER_PART*   { return text(); }
IDENTIFIER_START        = !"__"   [a-zA-Z_]
IDENTIFIER_PART         = [a-zA-Z_0-9]
RESERVED 'RESERVED'     = AS / EXPORT / IMPORT / UNDERSCORE
AS                      = "as"   !IDENTIFIER_PART   { return text(); }
EXPORT                  = "export"   !IDENTIFIER_PART   { return text(); }
IMPORT                  = "import"   !IDENTIFIER_PART   { return text(); }
UNDERSCORE              = "_"   !IDENTIFIER_PART   { return text(); }


// ====================   Whitespace and lexical markers   ====================
__                      = WHITESPACE?
WHITESPACE 'WHITESPACE' = WHITESPACE_ITEM+   { return text(); }
WHITESPACE_ITEM         = SINGLE_LINE_COMMENT / MULTILINE_COMMENT / HORITONTAL_WHITESPACE / END_OF_LINE
SINGLE_LINE_COMMENT     = "//"   (!END_OF_LINE .)*
MULTILINE_COMMENT       = "/*"   (!"*/" .)*   "*/"
HORITONTAL_WHITESPACE   = [ \t]
END_OF_LINE             = "\r\n" / "\r" / "\n"
END_OF_FILE             = !.
