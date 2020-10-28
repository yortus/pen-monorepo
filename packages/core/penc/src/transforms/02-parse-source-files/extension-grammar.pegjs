{
    let sourceFile = options.sourceFile || {};
    let extensionPath = sourceFile.path || '???';
    let moduleId = `file://${extensionPath}`;
}


// ====================   Top-level file module   ====================
FileModule
    = exportedNames:ExportedNames
    {
        let bindings = exportedNames.map(name => ({
            kind: 'Binding',
            pattern: {kind: 'NamePattern', name},
            value: {kind: 'ExtensionExpression', extensionPath, bindingName: name},
            exported: true,
        }));
        return {kind: 'Module', id: moduleId, bindings}
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
