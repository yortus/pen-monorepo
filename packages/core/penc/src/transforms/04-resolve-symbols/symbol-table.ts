import {assert} from '../../utils';


// TODO: doc...
export type Symbol = ScopeSymbol | NameSymbol;


/** Corresponds to a scope (ie a module or extension) in the source code. */
export interface ScopeSymbol {
    kind: 'ScopeSymbol';
    id: string;
    sourceNames: Map<string, NameSymbol>;
}


/** Corresponds to a identifier name in the source code. */
export interface NameSymbol {
    kind: 'NameSymbol';
    id: string;
    scope: ScopeSymbol;
    sourceName: string;
}


// TODO: doc...
export class SymbolTable {

    constructor() {
        this.allSymbolsById = new Map();
        this.parentScopes = new Map();
    }

    // TODO: doc... also creates a symbol for the scope in the parent scope.
    createScope(parent?: ScopeSymbol): ScopeSymbol {
        // TODO: must ensure this synthetic scope name never clashes with any program-defined identifiers.
        let id = `𝕊${this.parentScopes.size}`;
        let scopeSymbol: ScopeSymbol = {kind: 'ScopeSymbol', id, sourceNames: new Map()};
        this.allSymbolsById.set(id, scopeSymbol);
        this.parentScopes.set(scopeSymbol, parent ?? 'none');
        return scopeSymbol;
    }

    createName(sourceName: string, scope: ScopeSymbol): NameSymbol {
        // ensure not already defined in this scope
        if (scope.sourceNames.has(sourceName)) throw new Error(`Symbol '${sourceName}' is already defined.`);
        let id = `${scope.id}_${sourceName}`; // TODO: temp... fix this...
        let symbol: Symbol = {kind: 'NameSymbol', id, sourceName, scope};
        scope.sourceNames.set(sourceName, symbol);
        this.allSymbolsById.set(id, symbol);
        return symbol;
    }

    lookupName(sourceName: string, scope: ScopeSymbol): NameSymbol {
        if (scope.sourceNames.has(sourceName)) return scope.sourceNames.get(sourceName)!;
        let parentScope = this.parentScopes.get(scope)!;
        if (parentScope !== 'none') return this.lookupName(sourceName, parentScope);
        throw new Error(`Symbol '${sourceName}' is not defined.`);
    }

    getSymbolById(id: string): Symbol {
        let result = this.allSymbolsById.get(id);
        assert(result);
        return result;
    }

    private allSymbolsById: Map<string, Symbol>;

    private parentScopes: Map<ScopeSymbol, ScopeSymbol | 'none'>;
}
