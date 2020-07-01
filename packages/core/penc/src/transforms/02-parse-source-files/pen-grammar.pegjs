{
    let sourceFile = options.sourceFile || {};
    sourceFile.imports = sourceFile.imports || {};
    let nextId = options.nextId || (() => ++counter);
    let counter = -1;
}


// ====================   Files and Modules   ====================
File
    = __   module:Module   __   END_OF_FILE
    { return module; }

Module
    = bindings:BindingList
    { return {kind: 'Module', id: nextId(), bindings}; }


// ====================   Bindings   ====================
BindingList
    = !","   head:Binding?   tail:((__   ",")?   __   Binding)*   (__   ",")?
    { return (head ? [head] : []).concat(tail.map(el => el[2])); }

Binding
    = SimpleBinding
    / DestructuredBinding

SimpleBinding
    = ex:(EXPORT   __)?   name:IDENTIFIER   __   "="   __   value:Expression
    { return Object.assign({kind: 'SimpleBinding', id: nextId(), name, value}, ex ? {exported: true} : {}); }

DestructuredBinding
    = ex:(EXPORT   __)?   names:DestructuredBindingNameList   __   "="   __   value:Expression
    { return Object.assign({kind: 'DestructuredBinding', id: nextId(), names, value}, ex ? {exported: true} : {}); }

DestructuredBindingNameList
    = "{"   __   !","   head:DestructuredBindingName?   tail:((__   ",")?   __   DestructuredBindingName)*   (__   ",")?   __   "}"
    { return (head ? [head] : []).concat(tail.map(el => el[2])); }

DestructuredBindingName
    = name:IDENTIFIER   alias:(__   AS   __   IDENTIFIER)?
    { return Object.assign({name}, alias ? {alias: alias[3]} : {}); }


// ====================   Expressions   ====================
/*
    PRECEDENCE 1 (LOWEST)
        SelectionExpression         a | b      | a | b | c

    PRECEDENCE 2
        SequenceExpression          a b      a  b c                                                                     NB: whitespace between terms, else is application

    PRECEDENCE 3
        NotExpression               !a   !a(b)   !a.b   !{a: b}

    PRECEDENCE 4
        QuantifiedExpression        a?   a(b)?   a.b?   {a: b}?

    PRECEDENCE 5
        ApplicationExpression       a(b)   (a)b   a'blah'   a{b=c}                                                      NB: no whitespace between terms, else is sequence
        BindingLookupExpression      a.b   a.b   (a b).e   {foo=f}.foo                                                  NB: no whitespace between terms, may relax later

    PRECEDENCE 6 (HIGHEST):
        ---DISABLED FOR NOW--> LambdaExpression          a => a a   (a, b) => a b   () => "blah"                        NB: lhs is just a Pattern!
        RecordExpression            {a: b   c: d   e: f}   {a: b}   {}
        FieldExpression             {[a]: b}
        ModuleExpression            {export a=b c=d e=f}   {a=b}
        ListExpression              [a, b, c]   [a]   []
        NullLiteralExpression       null
        BooleanLiteralExpression    false   true
        StringLiteralExpression     "foo"   'a string!'   `a`
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
    = NotExpression
    / Precedence4OrHigher

Precedence4OrHigher
    = QuantifiedExpression
    / Precedence5OrHigher

Precedence5OrHigher
    = ApplicationOrBindingLookupExpression
    / Precedence6OrHigher

Precedence6OrHigher
    = PrimaryExpression

PrimaryExpression
    // = LambdaExpression
    = RecordExpression
    / FieldExpression
    / ModuleExpression
    / ListExpression
    / ParenthesisedExpression
    / ImportExpression
    / NullLiteralExpression
    / BooleanLiteralExpression
    / StringLiteralExpression
    / NumericLiteralExpression
    / ReferenceExpression

SelectionExpression
    = ("|"   __)?   head:Precedence2OrHigher   tail:(__   "|"   __   Precedence2OrHigher)+
    { return {kind: 'SelectionExpression', id: nextId(), expressions: [head].concat(tail.map(el => el[3]))}; }

SequenceExpression
    = head:Precedence3OrHigher   tail:(/*MANDATORY*/ WHITESPACE   Precedence3OrHigher   !(__   "="   !">")   !(__   ":"))+
    { return {kind: 'SequenceExpression', id: nextId(), expressions: [head].concat(tail.map(el => el[1]))}; }

NotExpression
    = "!"   __   expression:Precedence4OrHigher
    { return {kind: 'NotExpression', id: nextId(), expression}; }

QuantifiedExpression
    = expression:Precedence5OrHigher   __   quantifier:("?" / "*")
    { return {kind: 'QuantifiedExpression', id: nextId(), expression, quantifier}; }

ApplicationOrBindingLookupExpression
    = head:Precedence6OrHigher   tail:(/* NO WHITESPACE */   BindingNameLookup / ApplicationArgument)+
    {
        return tail.reduce(
            (lhs, rhs) => (rhs.name
                ? {kind: 'BindingLookupExpression', id: nextId(), module: lhs, bindingName: rhs.name}
                : {kind: 'ApplicationExpression', id: nextId(), lambda: lhs, argument: rhs.arg}
            ),
            head
        );
    }

BindingNameLookup
    = "."   /* NO WHITESPACE */   name:IDENTIFIER
    { return {name}; }

ApplicationArgument
    = arg:Precedence6OrHigher
    { return {arg}; }

// LambdaExpression
//     = pattern:Pattern   __   "=>"   __   body:Expression
//     { return {kind: 'LambdaExpression', pattern, body}; }

RecordExpression
    = "{"   __   fields:StaticFieldList   __   "}"
    { return {kind: 'RecordExpression', id: nextId(), fields}; }

FieldExpression
    = "{"   __   "["   __   name:Expression   __   "]"   __   ":"   __   value:Expression   __   "}"
    { return {kind: 'FieldExpression', id: nextId(), name, value}; }

ModuleExpression
    = "{"   __   module:Module   __   "}"
    { return {kind: 'ModuleExpression', id: nextId(), module}; }

ListExpression
    = "["   __   elements:ElementList   __   "]"
    { return {kind: 'ListExpression', id: nextId(), elements}; }

ParenthesisedExpression
    = "("   __   expression:Expression   __   ")"
    { return {kind: 'ParenthesisedExpression', id: nextId(), expression}; }

ImportExpression
    = IMPORT   __   "'"   specifierChars:(!"'"   CHARACTER)*   "'"
    {
        let modspec = specifierChars.map(el => el[1]).join('');
        let sourceFilePath = sourceFile.imports[modspec];
        return {kind: 'ImportExpression', id: nextId(), moduleSpecifier: modspec, sourceFilePath};
    }

NullLiteralExpression
    = NULL   { return {kind: 'NullLiteralExpression', id: nextId(), value: null}; }

BooleanLiteralExpression
    = TRUE   { return {kind: 'BooleanLiteralExpression', id: nextId(), value: true}; }
    / FALSE   { return {kind: 'BooleanLiteralExpression', id: nextId(), value: false}; }

StringLiteralExpression
    = "'"   chars:(!"'"   CHARACTER)*   "'"
    { return {kind: 'StringLiteralExpression', id: nextId(), value: chars.map(el => el[1]).join(''), concrete: false, abstract: true}; }

    / '"'   chars:(!'"'   CHARACTER)*   '"'
    { return {kind: 'StringLiteralExpression', id: nextId(), value: chars.map(el => el[1]).join(''), concrete: false, abstract: false}; }

    / "`"   chars:(!"`"   CHARACTER)*   "`"
    { return {kind: 'StringLiteralExpression', id: nextId(), value: chars.map(el => el[1]).join(''), concrete: true, abstract: false}; }

NumericLiteralExpression
    = DecimalLiteral
    {
        let n = parseFloat(text());
        if (!Number.isFinite(n)) error('cannot represent numeric literal'); // TODO: also ensure exact representation, aka safenum?
        return {kind: 'NumericLiteralExpression', id: nextId(), value: n}
    }

    // TODO: HexIntegerLiteral

ReferenceExpression
    = name:IDENTIFIER
    { return {kind: 'ReferenceExpression', id: nextId(), name}; }


// ====================   Record/List Parts   ====================
StaticFieldList
    = !","   head:StaticField?   tail:((__   ",")?   __   StaticField)*   (__   ",")?
    { return (head ? [head] : []).concat(tail.map(el => el[2])); }

StaticField
    = name:IDENTIFIER   __   ":"   __   value:Expression
    { return {kind: 'StaticField', id: nextId(), name, value}; }

ElementList
    = !","   head:Expression?   tail:((__   ",")?   __   Expression)*   (__   ",")?
    { return (head ? [head] : []).concat(tail.map(el => el[2])); }


// ====================   Numeric literal parts   ====================
DecimalLiteral
    = [+-]?   [0-9]+   ("."   [0-9]*)?   ExponentPart?   { return text(); }
    / [+-]?   "."   [0-9]+   ExponentPart?   { return text(); }

ExponentPart
    = [eE]   [+-]?   [0-9]+


// ====================   Literal characters and escape sequences   ====================
CHARACTER
    = ![\x00-\x1F]   !"\\"   .   { return text(); }
    / "\\"   c:[bfnrtv0'"\\]   { return eval(`"${text()}"`); }
    / "\\x"   d:(HEX_DIGIT   HEX_DIGIT)   { return eval(`"\\u00${d.join('')}"`); }
    / "\\u"   HEX_DIGIT   HEX_DIGIT   HEX_DIGIT   HEX_DIGIT   { return eval(`"${text()}"`); }
    / "\\u{"   d:HEX_DIGIT+   "}"   { return eval(`"${text()}"`); }

HEX_DIGIT = [0-9a-fA-F]


// ====================   Identifiers and Keywords   ====================
IDENTIFIER 'IDENTIFIER' = &IDENTIFIER_START   !RESERVED   IDENTIFIER_START   IDENTIFIER_PART*   { return text(); }
IDENTIFIER_START        = !"__"   [a-zA-Z_]
IDENTIFIER_PART         = [a-zA-Z_0-9]
RESERVED 'RESERVED'     = AS / EXPORT / FALSE / IMPORT / NULL / TRUE / UNDERSCORE
AS                      = "as"   !IDENTIFIER_PART   { return text(); }
EXPORT                  = "export"   !IDENTIFIER_PART   { return text(); }
FALSE                   = "false"   !IDENTIFIER_PART   { return text(); }
IMPORT                  = "import"   !IDENTIFIER_PART   { return text(); }
NULL                    = "null"   !IDENTIFIER_PART   { return text(); }
TRUE                    = "true"   !IDENTIFIER_PART   { return text(); }
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
