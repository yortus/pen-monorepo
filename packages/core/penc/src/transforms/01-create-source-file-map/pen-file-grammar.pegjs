// ====================   Top-level SourceFile node   ====================
SourceFile
    = __   bindings:BindingList   __   END_OF_FILE
    { return {kind: 'SourceFile', path: options.path, bindings}; }


// ====================   Bindings and patterns   ====================
BindingList
    = !","   head:Binding?   tail:((__   ",")?   __   Binding)*   (__   ",")?
    { return (head ? [head] : []).concat(tail.map(el => el[2])); }

Binding
    = left:(Identifier / ModulePattern)   __   "="   __   right:Expression
    { return {kind: 'Binding', left, right}; }

ModulePattern
    = "("   __   !","   head:ModulePatternName?   tail:((__   ",")?   __   ModulePatternName)*   (__   ",")?   __   ")"
    { return {kind: 'ModulePattern', names: (head ? [head] : []).concat(tail.map(el => el[2]))}; }

ModulePatternName
    = name:IDENTIFIER   alias:(__   AS   __   IDENTIFIER)?
    { return Object.assign({name}, alias ? {alias: alias[3]} : {}); }


// ====================   Expressions   ====================
/*
    PRECEDENCE 1 (LOWEST)
        SelectionExpression             a | b      | a | b | c

    PRECEDENCE 2
        SequenceExpression              a b      a  b c                                                                 NB: whitespace between terms, else is application

    PRECEDENCE 3
        NotExpression                   !a   !a(b)   !a.b   !{a: b}

    PRECEDENCE 4
        QuantifiedExpression            a?   a(b)?   a.b?   {a: b}?

    PRECEDENCE 5
        ApplicationExpression           a(b)   (a)b   a'blah'   a(b=c)                                                  NB: no whitespace between terms, else is sequence
        MemberExpression                a.b   a.b   (a b).e   (foo=f).foo                                               NB: no whitespace between terms, may relax later

    PRECEDENCE 6 (HIGHEST):
        ---DISABLED FOR NOW--> LambdaExpression          a => a a   (a, b) => a b   () => "blah"                        NB: lhs is just a Pattern!
        RecordExpression                {a: b   c: d   e: f}   {a: b}   {}
        FieldExpression                 {[a]: b}
        ModuleExpression                (a=b c=d e=f)   (a=b)
        ListExpression                  [a, b, c]   [a]   []
        ParenthesisedExpression         (a)   ({a: b})   (((("foo" "bar"))))
        NullLiteral                     null
        BooleanLiteral                  false   true
        StringLiteral                   "foo"   'a string!'   `a`
        NumericLiteral                  123   3.14   -0.1   5.7e-53
        Identifier                      a   Rule1   MY_FOO_45   x32   __bar
        ImportExpression                import './foo'   import 'somelib'
*/

Expression
    = Precedence1OrHigher

Precedence1OrHigher
    = SelectionExpression

Precedence2OrHigher
    = SequenceExpression

Precedence3OrHigher
    = NotExpression
    / Precedence4OrHigher

Precedence4OrHigher
    = QuantifiedExpression

Precedence5OrHigher
    = ApplicationOrMemberExpression

Precedence6OrHigher
    = PrimaryExpression

PrimaryExpression
    // = LambdaExpression
    = RecordExpression
    / FieldExpression
    / ModuleExpression
    / ListExpression
    / ParenthesisedExpression
    / NullLiteral
    / BooleanLiteral
    / StringLiteral
    / NumericLiteral
    / Identifier
    / ImportExpression

SelectionExpression
    = ("|"   __)?   head:Precedence2OrHigher   tail:(__   "|"   __   Precedence2OrHigher)*
    {
        if (tail.length === 0) return head;
        return {kind: 'SelectionExpression', expressions: [head].concat(tail.map(el => el[3]))};
    }

SequenceExpression
    = head:Precedence3OrHigher   tail:(/*MANDATORY*/ WHITESPACE   Precedence3OrHigher   !(__   "="   !">")   !(__   ":"))*
    {
        if (tail.length === 0) return head;
        return {kind: 'SequenceExpression', expressions: [head].concat(tail.map(el => el[1]))};
    }

NotExpression
    = "!"   __   expression:Precedence4OrHigher
    { return {kind: 'NotExpression', expression}; }

QuantifiedExpression
    = expression:Precedence5OrHigher   q:(__   ("?" / "*"))?
    {
        if (!q) return expression;
        return {kind: 'QuantifiedExpression', expression, quantifier: q[1]};
    }

ApplicationOrMemberExpression
    = head:Precedence6OrHigher   tail:(/* NO WHITESPACE */   MemberLookup / ApplicationArgument)*
    {
        if (tail.length === 0) return head;
        return tail.reduce(
            (lhs, rhs) => (rhs.id
                ? {kind: 'MemberExpression', module: lhs, member: rhs.id}
                : {kind: 'ApplicationExpression', lambda: lhs, argument: rhs.arg}
            ),
            head
        );
    }

MemberLookup
    = "."   /* NO WHITESPACE */   id:Identifier
    { return {id}; }

ApplicationArgument
    = arg:Precedence6OrHigher
    { return {arg}; }

// LambdaExpression
//     = pattern:Pattern   __   "=>"   __   body:Expression
//     { return {kind: 'LambdaExpression', pattern, body}; }

RecordExpression
    = "{"   __   fields:RecordFieldList   __   "}"
    {
        const names = new Set();
        for (const {name} of fields) if (names.has(name)) error(`Duplicate field name '${name}'`); else names.add(name);
        return {kind: 'RecordExpression', fields};
    }

FieldExpression
    = "{"   __   "["   __   name:Expression   __   "]"   __   ":"   __   value:Expression   __   "}"
    { return {kind: 'FieldExpression', name, value}; }

ModuleExpression
    = "("   __   bindings:BindingList   __   ")"
    {
        // TODO: only accept 1..M bindings (not zero)?
        return {kind: 'ModuleExpression', bindings};
    }

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
        return {kind: 'ImportExpression', moduleSpecifier};
    }

NullLiteral
    = NULL   { return {kind: 'NullLiteral', value: null}; }

BooleanLiteral
    = TRUE   { return {kind: 'BooleanLiteral', value: true}; }
    / FALSE   { return {kind: 'BooleanLiteral', value: false}; }

StringLiteral
    = "'"   chars:(!"'"   CHARACTER)*   "'"
    { return {kind: 'StringLiteral', value: chars.map(el => el[1]).join(''), concrete: false, abstract: true}; }

    / '"'   chars:(!'"'   CHARACTER)*   '"'
    { return {kind: 'StringLiteral', value: chars.map(el => el[1]).join(''), concrete: false, abstract: false}; }

    / "`"   chars:(!"`"   CHARACTER)*   "`"
    { return {kind: 'StringLiteral', value: chars.map(el => el[1]).join(''), concrete: true, abstract: false}; }

NumericLiteral
    = DecimalLiteral
    {
        let n = parseFloat(text());
        if (!Number.isFinite(n)) error('cannot represent numeric literal'); // TODO: also ensure exact representation, aka safenum?
        return {kind: 'NumericLiteral', value: n}
    }

    // TODO: HexIntegerLiteral

Identifier
    = name:IDENTIFIER
    { return {kind: 'Identifier', name}; }


// ====================   Record/List Parts   ====================
RecordFieldList
    = !","   head:RecordField?   tail:((__   ",")?   __   RecordField)*   (__   ",")?
    { return (head ? [head] : []).concat(tail.map(el => el[2])); }

RecordField
    = name:IDENTIFIER   __   ":"   __   value:Expression
    { return {name, value}; }

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
RESERVED 'RESERVED'     = AS / FALSE / IMPORT / NULL / TRUE / UNDERSCORE
AS                      = "as"   !IDENTIFIER_PART   { return text(); }
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
