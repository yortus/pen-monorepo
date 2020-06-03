import {assert} from './utils';


// TODO: temp testing...
// export type Symbol2 = Root | Module | Extension | Binding;
// export type Scope2 = Root | Module | Extension;
// export interface Root {
//     kind: 'Root';
//     id: string;
// }
// export interface Module {
//     kind: 'Module';
//     id: string;
//     scope: Scope;
// }
// export interface Extension {
//     kind: 'Extension';
//     id: string;
//     scope: Scope;
// }
// export interface Binding {
//     kind: 'Binding';
//     id: string;
//     scope: Scope;
//     nameInSource: string;
//     constant?: {value: unknown};
// }



export interface Symbol {
    id: string;
    kind: 'binding';
    scope: Scope;
    sourceName: string;
    constant?: {value: unknown};
}


export interface Scope {
    id: number;
    kind: 'root' | 'module' | 'extension';
    scopeSymbol: Symbol; // TODO: doc... symbol for this scope, will be in parent scope
    parent?: Scope;
    sourceNames: Map<string, Symbol>; // maps source name to symbol info
}


export class SymbolTable {

    constructor() {
        let rootScope: Scope = {id: 0, kind: 'root', scopeSymbol: undefined!, sourceNames: new Map()};
        this.rootScope = rootScope;
        this.scopes = [rootScope];
        this.symbols = new Map();
    }

    getRootScope() {
        return this.rootScope;
    }

    getAllScopes() {
        return this.scopes;
    }

    // TODO: doc... also creates a symbol for the scope in the parent scope.
    createChildScope(parent: Scope, kind: 'module' | 'extension'): Scope & {parent: Scope} {
        let id = ++this.counter;

        // TODO: must ensure this synthetic scope name never clashes with any program-defined identifiers.
        let sourceName = `${kind === 'module' ? '𝕊' : '𝔼'}${id}`; // TODO: fix this... it's not a name in the source
        let scopeSymbol = this.create(sourceName, parent);
        let childScope = {id, kind, scopeSymbol, parent, children: [], sourceNames: new Map()};
        this.scopes.push(childScope);
        return childScope;
    }

    create(sourceName: string, scope: Scope): Symbol {
        // ensure not already defined in this scope
        if (scope.sourceNames.has(sourceName)) throw new Error(`Symbol '${sourceName}' is already defined.`);
        let id = `symbolId${this.symbols.size}`; // TODO: temp... fix this...
        let symbol: Symbol = {id, kind: 'binding', sourceName, scope};
        scope.sourceNames.set(sourceName, symbol);
        this.symbols.set(id, symbol);
        return symbol;
    }

    lookupBySourceName(sourceName: string, scope: Scope): Symbol {
        if (scope.sourceNames.has(sourceName)) return scope.sourceNames.get(sourceName)!;
        if (scope.parent) return this.lookupBySourceName(sourceName, scope.parent);
        throw new Error(`Symbol '${sourceName}' is not defined.`);
    }

    lookupById(id: string): Symbol {
        let result = this.symbols.get(id);
        assert(result);
        return result;
    }

    private rootScope: Scope;

    private scopes: Scope[];

    private symbols: Map<string, Symbol>;

    private counter = 0;
}
