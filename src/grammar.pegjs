// ==========   Top-level: files and modules   ==========
start
    = foreignModule
    / penModule

foreignModule
    = (!endOfLine !"@pen" .)*   "@pen"   horizontalWhitespace+   "export"   horizontalWhitespace+   exports:foreignExportList   .*
    { return {type: 'ForeignModule', exports}; }

foreignExportList
    = head:identifier   tail:(horizontalWhitespace*   ","   horizontalWhitespace*   identifier)*
    { return [head].concat(tail.map(el => el[3]));}

penModule
    = decls:(__   penModuleDeclaration)*   __   endOfFile
    { return {type: 'PenModule', declarations: decls.map(el => el[1])}; }

penModuleDeclaration
    = importDeclaration
    / exportDeclaration
    / definition




// ==========   Import declarations   ==========
importDeclaration
    = importKeyword   __   bindings:importBindingList   __   fromKeyword   __   moduleSpecifier:moduleSpecifier
    { return {type: 'ImportDeclaration', moduleSpecifier, bindings}; }

importBindingList
    = head:importBinding   tail:(__   ","   __   importBinding)*
    { return [head].concat(tail.map(el => el[3])); }

importBinding
    = name:identifier   as:(__   asKeyword   __   identifier)?
    { return as ? {name, alias: as[3]} : {name}; }

moduleSpecifier
    = "'"   [^'\r\n]*   "'"   { return text().slice(1, -1); }
    / '"'   [^"\r\n]*   '"'   { return text().slice(1, -1); }




// ==========   Export declarations   ==========
exportDeclaration
    = exportKeyword   __   definition:definition
    { return {type: 'ExportDeclaration', definition}; }




// ==========   Definitions   ==========
definition
    = name:identifier   __   "="   __   expression:expression
    { return {type: 'Definition', name, expression}; }




// ==========   Expressions   ==========
expression
    = selection             // a | b
    / subSelection

subSelection
    = sequence              // a b
    / subSequence

subSequence
    = combinator            // a => b
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
    { return {type: 'Selection', expressions: [head].concat(tail.map(el => el[3]))}; }

sequence
    = head:subSequence   tail:(whitespace   subSequence)+
    { return {type: 'Sequence', expressions: [head].concat(tail.map(el => el[1]))}; }

combinator
    = parameters:combinatorParameterList   __   "=>"   __   expression:expression
    { return {type: 'Combinator', parameters, expression}; }

combinatorParameterList
    = id:identifier
    { return [id]; }

    / "("   __   ")"
    { return []; }

    / "("   __   head:identifier   tail:(__   ","   __   identifier)*   __   ")"
    { return [head].concat(tail.map(el => el[3])); }

application
    = f:(reference / parenthetical)   /* NO WHITESPACE */   args:applicationArgumentList
    { return {type: 'Application', combinator: f.type === 'Parenthetical' ? f.expression : f, arguments: args}; }

applicationArgumentList
    = "("   __   head:expression   tail:(__   ","   __   expression)*   __   ")"
    { return [head].concat(tail.map(el => el[3])); }

    / ex:expression
    { return [ex]; }

block
    = "{"   defs:(__   definition)+   __   "}"
    { return {type: 'Block', definitions: defs.map(el => el[1])}; }

parenthetical
    = "("   __   expression:expression   __   ")"
    { return {type: 'Parenthetical', expression}; }

recordLiteral
    = "{"   __   fields:recordFields?   __   "}"
    { return {type: 'RecordLiteral', fields: fields || []}; }

recordFields
    = head:recordField   tail:(__   ","   __   recordField)*   (__   ",")?
    { return [head].concat(tail.map(el => el[3])); }

recordField
    = name:(identifier / keyword)   __   ":"   __   expression:expression
    { return {type: 'RecordField', hasComputedName: false, name, expression}; }

    / "["   __   name:expression   __   "]"   __   ":"   __   expression:expression
    { return {type: 'RecordField', hasComputedName: true, name, expression}; }

listLiteral
    = "["   __   elements:listElements?   __   "]"
    { return {type: 'ListLiteral', elements: elements || []}; }

listElements
    = head:expression   tail:(__   ","   __   expression)*   (__   ",")?
    { return [head].concat(tail.map(el => el[3])); }

characterRange
    = "'"   !['"-]   minValue:character   "-"   !['"-]   maxValue:character   "'"
    { return {type: 'CharacterRange', kind: 'Abstract', minValue, maxValue}; }

    / '"'   !['"-]   minValue:character   "-"   !['"-]   maxValue:character   '"'
    { return {type: 'CharacterRange', kind: 'Concrete', minValue, maxValue}; }

stringLiteral
    = "'"   (![-']   character)*   "'"
    { return {type: 'StringLiteral', kind: 'Abstract', value: text().slice(1, -1)}; }

    / '"'   (![-"]   character)*   '"'
    { return {type: 'StringLiteral', kind: 'Concrete', value: text().slice(1, -1)}; }

voidLiteral
    = "("   __   ")"
    { return {type: 'VoidLiteral'}; }

reference
    = name:identifier   !(__   "="   !">")
    { return {type: 'Reference', name}; }




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
keyword 'keyword'       = asKeyword / fromKeyword / exportKeyword / importKeyword
asKeyword               = "as"   !identifierPart   { return text(); }
exportKeyword           = "export"   !identifierPart   { return text(); }
fromKeyword             = "from"   !identifierPart   { return text(); }
importKeyword           = "import"   !identifierPart   { return text(); }




// ==========   Whitespace and file markers   ==========
__                      = whitespace?
whitespace 'whitespace' = whitespaceItem+   { return text(); }
whitespaceItem          = singleLineComment / multiLineComment / horizontalWhitespace / endOfLine
singleLineComment       = "//"   (!endOfLine .)*
multiLineComment        = "/*"   (!"*/" .)*   "*/"
horizontalWhitespace    = [ \t]
endOfLine               = "\r\n" / "\r" / "\n"
endOfFile               = !.
