// ====================   Top-level SourceFile node   ====================
SourceFile
    = exportedNames:ExportedNames
    {
        return {
            kind: 'BindingList',
            bindings: exportedNames.map(name => ({
                kind: 'Binding',
                left: {kind: 'Identifier', name},
                right: {kind: 'Intrinsic', name, path: options.path},
            })),
        };
    }


// ====================   Exported names   ====================
ExportedNames
    = items:(SkippedChars   ManifestComment)*   SkippedChars?   EOF
    { return items.reduce((list, item) => list.concat(item[1]), []); }

SkippedChars
    = ((!"/"   .) / (!ManifestMarker   .))*   {}

ManifestComment
    = ManifestMarker   WS   "exports"   WS   "="   WS   list:ExportList   WS   "*/"   { return list; }

ManifestMarker
    = "/*"   WS   "@pen"

ExportList
    = "{"   WS   head:ID   tail:(WS   ","   WS   ID)*   WS   ","?   WS   "}"
    { return [head].concat(tail.map(el => el[3])); }

EOF = !.
ID  = [a-zA-Z_][a-zA-Z0-9_]*   { return text(); }
WS  = [ \t\r\n]*   {}
