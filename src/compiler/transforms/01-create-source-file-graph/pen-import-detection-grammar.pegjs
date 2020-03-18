File
    = items:(ImportExpression / Whitespace / StringLiteral / AnyChar)*
    { return items.filter(item => item !== undefined); }

ImportExpression
    = "import"   Whitespace?   modspec:ModuleSpecifier
    { return modspec; }

ModuleSpecifier
    =   "'"   (!"'"   CHARACTER)*   "'"
    { return text().slice(1, -1); }

Whitespace
    = WHITESPACE
    { return undefined; }

StringLiteral
    = '"'   (!'"'   CHARACTER)*   '"'
    { return undefined; }

    / "'"   (!"'"   CHARACTER)*   "'"
    { return undefined; }

AnyChar
    = .
    { return undefined; }

CHARACTER   = "\\" ['"\\]   /   ![\x00-\x1F] .
WHITESPACE  = ([ \t]   /   COMMENT   /   EOL)+
COMMENT     = "//" (!EOL .)*   /   "/*" (!"*/" .)* "*/"
EOL         = "\r\n"   /   "\r"   /   "\n"
