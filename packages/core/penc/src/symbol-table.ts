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
    name: string;
    scope: Scope;
    constant?: {value: unknown};
}


export interface Scope {
    id: number;
    kind: 'root' | 'module' | 'extension';
    scopeSymbol: Symbol; // TODO: doc... symbol for this scope, will be in parent scope
    parent?: Scope;
    symbols: Map<string, Symbol>; // maps source name to symbol info
}


export class SymbolTable {

    constructor() {
        let rootScope: Scope = {id: 0, kind: 'root', scopeSymbol: undefined!, symbols: new Map()};
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
        let name = `${kind === 'module' ? '𝕊' : '𝔼'}${id}`;
        let scopeSymbol = this.create(name, parent);
        let childScope = {id, kind, scopeSymbol, parent, children: [], symbols: new Map()};
        this.scopes.push(childScope);
        return childScope;
    }

    create(name: string, scope: Scope): Symbol {
        // ensure not already defined in this scope
        if (scope.symbols.has(name)) throw new Error(`Symbol '${name}' is already defined.`);
        let id = `symbolId${this.symbols.size}`; // TODO: temp... fix this...
        let symbol: Symbol = {id, name, scope};
        scope.symbols.set(name, symbol);
        this.symbols.set(id, symbol);
        return symbol;
    }

    lookupByName(name: string, scope: Scope): Symbol {
        if (scope.symbols.has(name)) return scope.symbols.get(name)!;
        if (scope.parent) return this.lookupByName(name, scope.parent);
        throw new Error(`Symbol '${name}' is not defined.`);
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
