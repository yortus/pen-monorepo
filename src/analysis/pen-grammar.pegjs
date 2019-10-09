// ==========   Top-level: files and modules   ==========
start
    = ModuleFile

ModuleFile
    = imports:(__   (ImportNamespace / ImportNames))*   __   defs:(__   Definition)+   __   endOfFile
    { return {kind: 'ModuleDefinition', imports: imports.map(el => el[1]), block: {kind: 'Block', definitions: defs.map(el => el[1])}}; }




// ==========   Import declarations   ==========
ImportNamespace
    = importKeyword   __   intoKeyword   __   namespace:identifier   __   fromKeyword   __   moduleSpecifier:ModuleSpecifier
    { return {kind: 'ImportNamespace', moduleSpecifier, namespace}; }

ImportNames
    = importKeyword   __   "{"   __   names:ImportNameList   __   "}"   __   fromKeyword   __   moduleSpecifier:ModuleSpecifier
    { return {kind: 'ImportNames', moduleSpecifier, names}; }

ImportNameList
    = head:identifier   tail:(__   ","   __   identifier)*
    { return [head].concat(tail.map(el => el[3])); }

ModuleSpecifier
    = "'"   [^'\r\n]*   "'"   { return text().slice(1, -1); }
    / '"'   [^"\r\n]*   '"'   { return text().slice(1, -1); }




// ==========   Definitions   ==========
Definition
    = isExported:(exportKeyword   __)?   name:identifier   __   "="   __   expression:Expression
    { return {kind: 'Definition', name, expression, isExported: !!isExported}; }




// ==========   Expressions   ==========
Expression
    = Selection             // a | b
    / SubSelection

SubSelection
    = Sequence              // a b
    / SubSequence

SubSequence
    = Function              // a => b
    / Application           // a(b)
    / Block                 // {a=b c=d start=a}
    / Parenthetical         // (foo bar)
    / RecordLiteral         // {a: b, c: d}
    / ListLiteral           // [a, b, c]
    / CharacterRange        // 'a-z'
    / StringLiteral         // "foo"
    / VoidLiteral           // ()
    / Reference             // a

Selection
    = ("|"   __)?   head:SubSelection   tail:(__   "|"   __   SubSelection)+
    { return {kind: 'Selection', expressions: [head].concat(tail.map(el => el[3]))}; }

Sequence
    = head:SubSequence   tail:(whitespace   SubSequence)+
    { return {kind: 'Sequence', expressions: [head].concat(tail.map(el => el[1]))}; }

Function
    = parameters:FunctionParameterList   __   "=>"   __   expression:Expression
    { return {kind: 'Function', parameters, expression}; }

FunctionParameterList
    = id:identifier
    { return [id]; }

    / "("   __   ")"
    { return []; }

    / "("   __   head:identifier   tail:(__   ","   __   identifier)*   __   ")"
    { return [head].concat(tail.map(el => el[3])); }

Application
    // TODO: allow nested parentheticals eg (((fn))) ?
    = f:(Reference / Parenthetical)   /* NO WHITESPACE */   args:ApplicationArgumentList
    { return {kind: 'Application', function: f.kind === 'Parenthetical' ? f.expression : f, arguments: args}; }

ApplicationArgumentList
    = "("   __   head:Expression   tail:(__   ","   __   Expression)*   __   ")"
    { return [head].concat(tail.map(el => el[3])); }

    / ex:Expression
    { return [ex]; }

Block
    = "{"   defs:(__   Definition)+   __   "}"
    { return {kind: 'Block', definitions: defs.map(el => el[1])}; }

Parenthetical
    = "("   __   expression:Expression   __   ")"
    { return {kind: 'Parenthetical', expression}; }

RecordLiteral
    = "{"   __   fields:RecordFields?   __   "}"
    { return {kind: 'RecordLiteral', fields: fields || []}; }

RecordFields
    = head:RecordField   tail:(__   ","   __   RecordField)*   (__   ",")?
    { return [head].concat(tail.map(el => el[3])); }

RecordField
    = name:(identifier / keyword)   __   ":"   __   expression:Expression
    { return {kind: 'RecordField', hasComputedName: false, name, expression}; }

    / "["   __   name:Expression   __   "]"   __   ":"   __   expression:Expression
    { return {kind: 'RecordField', hasComputedName: true, name, expression}; }

ListLiteral
    = "["   __   elements:ListElements?   __   "]"
    { return {kind: 'ListLiteral', elements: elements || []}; }

ListElements
    = head:Expression   tail:(__   ","   __   Expression)*   (__   ",")?
    { return [head].concat(tail.map(el => el[3])); }

CharacterRange
    = "'"   !['"-]   minValue:character   "-"   !['"-]   maxValue:character   "'"
    { return {kind: 'CharacterRange', subkind: 'Abstract', minValue, maxValue}; }

    / '"'   !['"-]   minValue:character   "-"   !['"-]   maxValue:character   '"'
    { return {kind: 'CharacterRange', subkind: 'Concrete', minValue, maxValue}; }

StringLiteral
    = "'"   (![-']   character)*   "'"
    { return {kind: 'StringLiteral', subkind: 'Abstract', value: text().slice(1, -1)}; }

    / '"'   (![-"]   character)*   '"'
    { return {kind: 'StringLiteral', subkind: 'Concrete', value: text().slice(1, -1)}; }

VoidLiteral
    = "("   __   ")"
    { return {kind: 'VoidLiteral'}; }

Reference
    = namespaces:ReferenceNamespaces?   name:identifier   !(__   "="   !">")
    { return namespaces ? {kind: 'Reference', namespaces, name} : {kind: 'Reference', name}; }

ReferenceNamespaces
    = ids:(identifier   ".")+
    { return ids.map(id => id[0]); }




// ==========   Literal characters and escape sequences   ==========
character
    = ![\x00-\x1F]   !"\\"   .   { return text(); }
    / "\\-"   { return '-'; }
    / "\\"   c:[bfnrtv0'"\\]   { return eval(`"${text()}"`); }
    / "\\x"   d:(hexdigit   hexdigit)   { return eval(`"\\u00${d.join('')}"`); }
    / "\\u"   hexdigit   hexdigit   hexdigit   hexdigit   { return eval(`"${text()}"`); }
    / "\\u{"   d:hexdigit+   "}"   { return eval(`"${text()}"`); }

hexdigit = [0-9a-fA-F]




// ==========   Identifiers and Keywords   ==========
identifier 'identifier' = &identifierStart   !keyword   identifierStart   identifierPart*   { return text(); }
identifierStart         = [a-zA-Z_]
identifierPart          = [a-zA-Z_0-9]
keyword 'keyword'       = asKeyword / fromKeyword / exportKeyword / importKeyword / intoKeyword
asKeyword               = "as"   !identifierPart   { return text(); }
exportKeyword           = "export"   !identifierPart   { return text(); }
fromKeyword             = "from"   !identifierPart   { return text(); }
importKeyword           = "import"   !identifierPart   { return text(); }
intoKeyword             = "into"   !identifierPart   { return text(); }




// ==========   Whitespace and file markers   ==========
__                      = whitespace?
whitespace 'whitespace' = whitespaceItem+   { return text(); }
whitespaceItem          = singleLineComment / multiLineComment / horizontalWhitespace / endOfLine
singleLineComment       = "//"   (!endOfLine .)*
multiLineComment        = "/*"   (!"*/" .)*   "*/"
horizontalWhitespace    = [ \t]
endOfLine               = "\r\n" / "\r" / "\n"
endOfFile               = !.
