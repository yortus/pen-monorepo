// ====================   Top-level SourceFile node   ====================
SourceFile
    = __   bindings:BindingList   __   END_OF_FILE
    { return {kind: 'Module', bindings}; }


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
        QuantifiedExpression            a?   a(b)*   a.b?   {a: b}*

    PRECEDENCE 5
        ApplicationExpression           a(b)   (a)b   a'blah'   a(b=c)                                                  NB: no whitespace between terms, else is sequence
        MemberExpression                a.b   a.b   (a b).e   (foo=f).foo                                               NB: no whitespace between terms, may relax later

    PRECEDENCE 6 (HIGHEST):
        FunctionExpression              a -> a a   (a, b) -> a b   () -> "blah"                                         NB: param is just like Binding#left
        RecordExpression                {a: b   c: d   e: f}   {a: b}   {}   {[a]: b, ...c, ...d, e: f}
        Module                          (a=b c=d e=f)   (a=b)
        LetExpression                   (-> a b a=1 b=2)
        ParenthesisedExpression         (a)   ({a: b})   (((("foo" "bar"))))
        ListExpression                  [a, b, c]   [a]   []   [a, ...b, ...c, d]
        StringExpression                "abc"   'a{rule}b'   `a\x42c`   "[\0-255\x0-7f{a}]"   'abc-\(32-127)-def'
        NullLiteral                     null
        BooleanLiteral                  false   true
        NumericLiteral                  123   3.14   -0.1   5.7e-53   0x0   0xff   0x00BADDAD
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
    = FunctionExpression
    / RecordExpression
    / Module
    / LetExpression
    / ParenthesisedExpression
    / ListExpression
    / StringExpression
    / NullLiteral
    / BooleanLiteral
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
    = head:Precedence3OrHigher   tail:(/*MANDATORY*/ WHITESPACE   Precedence3OrHigher   !(__   "=")   !(__   ":"))*
    {
        if (tail.length === 0) return head;
        return {kind: 'SequenceExpression', expressions: [head].concat(tail.map(el => el[1]))};
    }

NotExpression
    = "!"   __   expression:Precedence3OrHigher
    { return {kind: 'NotExpression', expression}; }

QuantifiedExpression
    = q:(("?" / "*")   __)? expression:Precedence5OrHigher
    {
        if (!q) return expression;
        return {kind: 'QuantifiedExpression', expression, quantifier: q[1]};
    }

ApplicationOrMemberExpression
    = head:Precedence6OrHigher   tail:(/* NO WHITESPACE */   MemberLookup / ApplicationArgument)*
    {
        if (tail.length === 0) return head;
        return tail.reduce(
            (lhs, rhs) => (rhs.name
                ? {kind: 'MemberExpression', module: lhs, member: rhs.name}
                : {kind: 'ApplicationExpression', function: lhs, argument: rhs.arg}
            ),
            head
        );
    }

MemberLookup
    = "."   /* NO WHITESPACE */   name:IDENTIFIER
    { return {name}; }

ApplicationArgument
    = arg:Precedence6OrHigher
    { return {arg}; }

FunctionExpression
    = param:(Identifier / ModulePattern)   __   "->"   __   body:Expression
    { return {kind: 'FunctionExpression', param, body}; }

RecordExpression
    = "{"   __   items:RecordItems   __   "}"
    {
        const names = new Set();
        for (const item of items) {
            if (item.kind !== 'RecordField' || typeof item.name !== 'string') continue;
            if (names.has(item.name)) return error(`Duplicate field name '${name}'`);
            names.add(item.name);
        }
        return {kind: 'RecordExpression', items};
    }

Module
    = "("   __   bindings:BindingList   __   ")"
    { return {kind: 'Module', bindings}; }

LetExpression
    = "("   __   "->"   __   expression:Expression   (__   ",")?   __   bindings:BindingList   __   ")"
    { return {kind: 'LetExpression', expression, bindings}; }

ParenthesisedExpression
    = "("   __   expression:Expression   __   ")"
    { return {kind: 'ParenthesisedExpression', expression}; }

ListExpression
    = "["   __   items:ListItems   __   "]"
    { return {kind: 'ListExpression', items}; }

StringExpression
    = "`"   items:StringItems   "`"
    { return {kind: 'StringExpression', subkind: 'A', items}; }

    / "'"   items:StringItems   "'"
    { return {kind: 'StringExpression', subkind: 'C', items}; }

    / '"'   items:StringItems   '"'
    { return {kind: 'StringExpression', subkind: 'X', items}; }

NullLiteral
    = NULL   { return {kind: 'NullLiteral', value: null}; }

BooleanLiteral
    = TRUE   { return {kind: 'BooleanLiteral', value: true}; }
    / FALSE   { return {kind: 'BooleanLiteral', value: false}; }

NumericLiteral
    = value:(DecimalLiteral / HexIntegerLiteral)
    { return {kind: 'NumericLiteral', value}; }

Identifier
    = name:IDENTIFIER
    { return {kind: 'Identifier', name}; }

ImportExpression
    = IMPORT   __   "'"   specifierChars:(!"'"   CHARACTER)*   "'"
    {
        const moduleSpecifier = specifierChars.map(el => el[1]).join('');
        return {kind: 'ImportExpression', moduleSpecifier};
    }


// ====================   Clauses (eg record/list/string parts)   ====================
RecordItems
    = !","   head:RecordItem?   tail:((__   ",")?   __   RecordItem)*   (__   ",")?
    { return (head ? [head] : []).concat(tail.map(el => el[2])); }

RecordItem
    = Splice

    / "["   __   name:Expression   __   "]"   __   ":"   __   expression:Expression
    { return {kind: 'Field', name, expression}; }

    / name:IDENTIFIER   __   ":"   __   expression:Expression
    { return {kind: 'Field', name, expression}; }

ListItems
    = !","   head:ListItem?   tail:((__   ",")?   __   ListItem)*   (__   ",")?
    { return (head ? [head] : []).concat(tail.map(el => el[2])); }

ListItem
    = Splice / Expression

Splice
    = "..."   __   expression:Expression
    { return {kind: 'Splice', expression}; }

StringItems
    = items:StringItem*

StringItem
    = chars:CHARACTER+   { return chars.join(''); }
    / "{"   expr:Expression   "}"   { return expr; }
    / "\\(x"   value:ByteRangeHex   ")"   { return value; }
    / "\\x"   value:ByteRangeHex   { return value; }
    / "\\("   value:ByteRangeDec   ")"   { return value; }
    / "\\"   value:ByteRangeDec   { return value; }

ByteRangeDec
    = min:([0-9]+   {return parseInt(text(), 10)})   max:("-"   ([0-9]+   {return parseInt(text(), 10)}))?
    { max = max ? max[1] : min; if (min > max || max > 255) error(`invalid byte range: ${min}-${max}`); else return [min, max]; }

ByteRangeHex
    = min:(HEX_DIGIT+   {return parseInt(text(), 16)})   max:("-"   (HEX_DIGIT+   {return parseInt(text(), 16)}))?
    { max = max ? max[1] : min; if (min > max || max > 255) error(`invalid byte range: ${min}-${max}`); else return [min, max]; }


// ====================   Numeric literal parts   ====================
DecimalLiteral
    = !"0x"   [+-]?   ([0-9]+ ("." [0-9]*)?   /   "." [0-9]+)   ExponentPart?   ![a-zA-Z]
    {
        // TODO: also ensure exact representation, aka safenum?
        const n = parseFloat(text());
        if (!Number.isFinite(n)) error('cannot represent numeric literal');
        return n;
    }

ExponentPart
    = [eE]   [+-]?   [0-9]+

HexIntegerLiteral
    = "0x"    HEX_DIGIT+   ![a-zA-Z]
    {
        // TODO: also ensure exact representation, aka safenum?
        const n = parseInt(text());
        if (!Number.isFinite(n)) error('cannot represent numeric literal');
        return n;
    }


// ====================   Literal characters and escape sequences   ====================
CHARACTER
    = ![\x00-\x1F]   ![\\'"`{]   .   { return text(); }
    / "\\"   c:[bfnrtv'"`{\\]   { return eval(`"${text()}"`); }
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
