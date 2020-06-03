import {assert} from './utils';


// TODO: temp testing...
export type Symbol = Module | Binding; // TODO: keep this union? best name?

export type Scope = Module; // TODO: remove - just use one name, but which?

export interface Module { // TODO: rename? Scope?
    kind: 'Module';
    id: string;
    sourceNames: Map<string, Binding>; // maps source name to symbol info
}
export interface Binding {
    kind: 'Binding';
    id: string;
    scope: Module; // TODO: rename this prop?
    sourceName: string;
    constant?: {value: unknown};
}


export class SymbolTable {

    constructor() {
        this.allSymbolsById = new Map();
        this.parentScopes = new Map();
    }

    // TODO: doc... also creates a symbol for the scope in the parent scope.
    createScope(parent?: Module): Module {
        // TODO: must ensure this synthetic scope name never clashes with any program-defined identifiers.
        let id = `𝕊${this.parentScopes.size}`;
        let scopeSymbol: Module = {kind: 'Module', id, sourceNames: new Map()};
        this.allSymbolsById.set(id, scopeSymbol);
        this.parentScopes.set(scopeSymbol, parent ?? 'none');
        return scopeSymbol;
    }

    createBinding(sourceName: string, scope: Module): Symbol {
        // ensure not already defined in this scope
        if (scope.sourceNames.has(sourceName)) throw new Error(`Symbol '${sourceName}' is already defined.`);
        let id = `${scope.id}_${sourceName}`; // TODO: temp... fix this...
        let symbol: Symbol = {kind: 'Binding', id, sourceName, scope};
        scope.sourceNames.set(sourceName, symbol);
        this.allSymbolsById.set(id, symbol);
        return symbol;
    }

    lookupBinding(sourceName: string, scope: Module): Binding {
        if (scope.sourceNames.has(sourceName)) return scope.sourceNames.get(sourceName)!;
        let parentScope = this.parentScopes.get(scope)!;
        if (parentScope !== 'none') return this.lookupBinding(sourceName, parentScope);
        throw new Error(`Symbol '${sourceName}' is not defined.`);
    }

    lookupSymbol(id: string): Symbol {
        let result = this.allSymbolsById.get(id);
        assert(result);
        return result;
    }

    private allSymbolsById: Map<string, Symbol>;

    private parentScopes: Map<Module, Module | 'none'>;
}
