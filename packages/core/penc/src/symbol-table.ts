import {assert} from './utils';


// TODO: temp testing...
export type Symbol = Root | Module | Extension | Binding;
export type Scope = Root | Module | Extension;
export interface Root {
    kind: 'Root'; // TODO: CAN WE REMOVE THIS KIND?                                     <================
    id: string;
    scope?: undefined;
    sourceNames: Map<string, Binding>; // maps source name to symbol info
}
export interface Module {
    kind: 'Module';
    id: string;
    scope: Scope;
    sourceNames: Map<string, Binding>; // maps source name to symbol info
}
export interface Extension {
    kind: 'Extension'; // TODO: CAN WE REMOVE THIS KIND?                                <================
    id: string;
    scope: Scope;
    sourceNames: Map<string, Binding>; // maps source name to symbol info
}
export interface Binding {
    kind: 'Binding';
    id: string;
    scope: Scope;
    sourceName: string;
    constant?: {value: unknown};
}


export class SymbolTable {

    constructor() {
        let rootScope: Root = {kind: 'Root', id: ROOT_SCOPE_ID, sourceNames: new Map()};
        this.allSymbolsById = new Map();
        this.allSymbolsById.set(ROOT_SCOPE_ID, rootScope);
    }

    getRootScope(): Scope {
        return this.lookupById(ROOT_SCOPE_ID) as Root;
    }

    getAllScopes(): Scope[] {
        return [...this.allSymbolsById.values()].filter(sym => sym.kind !== 'Binding') as Scope[];
    }

    // TODO: doc... also creates a symbol for the scope in the parent scope.
    createChildScope(kind: 'Module' | 'Extension', parent?: Scope): Module | Extension {
        // TODO: must ensure this synthetic scope name never clashes with any program-defined identifiers.
        let id = `${kind === 'Module' ? '𝕊' : '𝔼'}${++this.counter}`; // TODO: fix this... it's not a name in the src
        let symbol: Module | Extension = {kind, id, scope: parent ?? this.getRootScope(), sourceNames: new Map()};
        this.allSymbolsById.set(id, symbol);
        return symbol;
    }

    create(sourceName: string, scope: Scope): Symbol {
        // ensure not already defined in this scope
        if (scope.sourceNames.has(sourceName)) throw new Error(`Symbol '${sourceName}' is already defined.`);
        let id = `${scope.id}_${sourceName}`; // TODO: temp... fix this...
        let symbol: Symbol = {kind: 'Binding', id, sourceName, scope};
        scope.sourceNames.set(sourceName, symbol);
        this.allSymbolsById.set(id, symbol);
        return symbol;
    }

    lookupBySourceName(sourceName: string, scope: Scope): Symbol {
        if (scope.sourceNames.has(sourceName)) return scope.sourceNames.get(sourceName)!;
        if (scope.scope) return this.lookupBySourceName(sourceName, scope.scope);
        throw new Error(`Symbol '${sourceName}' is not defined.`);
    }

    lookupById(id: string): Symbol {
        let result = this.allSymbolsById.get(id);
        assert(result);
        return result;
    }

    private allSymbolsById: Map<string, Symbol>;

    private counter = 0;
}


// TODO: really need this?
const ROOT_SCOPE_ID = 'ℝ0';
