// ==========   Top-level: files and modules   ==========
// TODO: module declarations:
// - They will have a separate start rule.
// - They are completely ambient (ie no emit). They describe the exports of a module written in the host language.
// - They are differentiated by file extension `.d.pen`. Although is it better to do it another way?
start
    = moduleDefinition

moduleDefinition
    = imports:(__   (importNamespace / importNames))*   __   defs:(__   definition)+   __   endOfFile
    { return {kind: 'ModuleDefinition', imports: imports.map(el => el[1]), block: {kind: 'Block', definitions: defs.map(el => el[1])}}; }




// ==========   Import declarations   ==========
importNamespace
    = importKeyword   __   intoKeyword   __   namespace:identifier   __   fromKeyword   __   moduleSpecifier:moduleSpecifier
    { return {kind: 'ImportNamespace', moduleSpecifier, namespace}; }

importNames
    = importKeyword   __   "{"   __   names:importNameList   __   "}"   __   fromKeyword   __   moduleSpecifier:moduleSpecifier
    { return {kind: 'ImportNames', moduleSpecifier, names}; }

importNameList
    = head:identifier   tail:(__   ","   __   identifier)*
    { return [head].concat(tail.map(el => el[3])); }

moduleSpecifier
    = "'"   [^'\r\n]*   "'"   { return text().slice(1, -1); }
    / '"'   [^"\r\n]*   '"'   { return text().slice(1, -1); }




// ==========   Definitions   ==========
definition
    = isExported:(exportKeyword   __)?   name:identifier   __   "="   __   expression:expression
    { return {kind: 'Definition', name, expression, isExported: !!isExported}; }




// ==========   Expressions   ==========
expression
    = selection             // a | b
    / subSelection

subSelection
    = sequence              // a b
    / subSequence

subSequence
    = function              // a => b
    / application           // a(b)
    / block                 // {a=b c=d start=a}
    / parenthetical         // (foo bar)
    / recordLiteral         // {a: b, c: d}
    / listLiteral           // [a, b, c]
    / characterRange        // 'a-z'
    / stringLiteral         // "foo"
    / voidLiteral           // ()
    / reference             // a

selection
    = ("|"   __)?   head:subSelection   tail:(__   "|"   __   subSelection)+
    { return {kind: 'Selection', expressions: [head].concat(tail.map(el => el[3]))}; }

sequence
    = head:subSequence   tail:(whitespace   subSequence)+
    { return {kind: 'Sequence', expressions: [head].concat(tail.map(el => el[1]))}; }

function
    = parameters:functionParameterList   __   "=>"   __   expression:expression
    { return {kind: 'Function', parameters, expression}; }

functionParameterList
    = id:identifier
    { return [id]; }

    / "("   __   ")"
    { return []; }

    / "("   __   head:identifier   tail:(__   ","   __   identifier)*   __   ")"
    { return [head].concat(tail.map(el => el[3])); }

application
    // TODO: allow nested parentheticals eg (((fn))) ?
    = f:(reference / parenthetical)   /* NO WHITESPACE */   args:applicationArgumentList
    { return {kind: 'Application', function: f.kind === 'Parenthetical' ? f.expression : f, arguments: args}; }

applicationArgumentList
    = "("   __   head:expression   tail:(__   ","   __   expression)*   __   ")"
    { return [head].concat(tail.map(el => el[3])); }

    / ex:expression
    { return [ex]; }

block
    = "{"   defs:(__   definition)+   __   "}"
    { return {kind: 'Block', definitions: defs.map(el => el[1])}; }

parenthetical
    = "("   __   expression:expression   __   ")"
    { return {kind: 'Parenthetical', expression}; }

recordLiteral
    = "{"   __   fields:recordFields?   __   "}"
    { return {kind: 'RecordLiteral', fields: fields || []}; }

recordFields
    = head:recordField   tail:(__   ","   __   recordField)*   (__   ",")?
    { return [head].concat(tail.map(el => el[3])); }

recordField
    = name:(identifier / keyword)   __   ":"   __   expression:expression
    { return {kind: 'RecordField', hasComputedName: false, name, expression}; }

    / "["   __   name:expression   __   "]"   __   ":"   __   expression:expression
    { return {kind: 'RecordField', hasComputedName: true, name, expression}; }

listLiteral
    = "["   __   elements:listElements?   __   "]"
    { return {kind: 'ListLiteral', elements: elements || []}; }

listElements
    = head:expression   tail:(__   ","   __   expression)*   (__   ",")?
    { return [head].concat(tail.map(el => el[3])); }

characterRange
    = "'"   !['"-]   minValue:character   "-"   !['"-]   maxValue:character   "'"
    { return {kind: 'CharacterRange', subkind: 'Abstract', minValue, maxValue}; }

    / '"'   !['"-]   minValue:character   "-"   !['"-]   maxValue:character   '"'
    { return {kind: 'CharacterRange', subkind: 'Concrete', minValue, maxValue}; }

stringLiteral
    = "'"   (![-']   character)*   "'"
    { return {kind: 'StringLiteral', subkind: 'Abstract', value: text().slice(1, -1)}; }

    / '"'   (![-"]   character)*   '"'
    { return {kind: 'StringLiteral', subkind: 'Concrete', value: text().slice(1, -1)}; }

voidLiteral
    = "("   __   ")"
    { return {kind: 'VoidLiteral'}; }

reference
    = namespaces:referenceNamespaces?   name:identifier   !(__   "="   !">")
    { return namespaces ? {kind: 'Reference', namespaces, name} : {kind: 'Reference', name}; }

referenceNamespaces
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
