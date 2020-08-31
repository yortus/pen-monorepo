// TODO: doc...
export type Symbol = ScopeSymbol | NameSymbol;


/** Corresponds to a scope (ie a module or extension) in the source code. */
export interface ScopeSymbol {
    kind: 'ScopeSymbol';
    scopeName: string;
    localNames: Map<string, NameSymbol>;
}


/** Corresponds to a identifier name in the source code. */
export interface NameSymbol {
    kind: 'NameSymbol';
    globalName: string;
    scope: ScopeSymbol;
    localName: string;
}


// TODO: doc...
export class SymbolTable {

    constructor() {
        this.allSymbolsByGlobalName = new Map();
        this.parentScopes = new Map();
    }

    // TODO: doc... also creates a symbol for the scope in the parent scope.
    createScope(parent?: ScopeSymbol): ScopeSymbol {
        // TODO: must ensure this synthetic scope name never clashes with any program-defined identifiers.
        let scopeName = `𝕊${this.parentScopes.size}`;
        let scopeSymbol: ScopeSymbol = {kind: 'ScopeSymbol', scopeName, localNames: new Map()};
        this.allSymbolsByGlobalName.set(scopeName, scopeSymbol);
        this.parentScopes.set(scopeSymbol, parent ?? 'none');
        return scopeSymbol;
    }

    createName(localName: string, scope: ScopeSymbol): NameSymbol {
        // ensure not already defined in this scope
        if (scope.localNames.has(localName)) throw new Error(`Symbol '${localName}' is already defined.`);
        let globalName = `${scope.scopeName}_${localName}`; // TODO: temp... fix this...
        let symbol: Symbol = {kind: 'NameSymbol', globalName, localName, scope};
        scope.localNames.set(localName, symbol);
        this.allSymbolsByGlobalName.set(globalName, symbol);
        return symbol;
    }

    lookupName(localName: string, scope: ScopeSymbol): NameSymbol {
        if (scope.localNames.has(localName)) return scope.localNames.get(localName)!;
        let parentScope = this.parentScopes.get(scope)!;
        if (parentScope !== 'none') return this.lookupName(localName, parentScope);
        throw new Error(`Symbol '${localName}' is not defined.`);
    }

    private allSymbolsByGlobalName: Map<string, Symbol>;

    private parentScopes: Map<ScopeSymbol, ScopeSymbol | 'none'>;
}
