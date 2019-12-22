import {assert} from '../ast-utils';


// ====================   Scopes   ====================
export type Scope = GlobalScope | ModuleScope | FunctionScope;


export interface GlobalScope {
    kind: 'GlobalScope';
    symbols: Map<string, Symbol>; // maps name to symbol info
}


export interface ModuleScope {
    kind: 'ModuleScope';
    parent: Scope;
    symbols: Map<string, Symbol>; // maps name to symbol info
}


export interface FunctionScope {
    kind: 'FunctionScope';
    parent: Scope;
    symbols: Map<string, Symbol>; // maps name to symbol info
}


export function createScope(kind: 'GlobalScope'): GlobalScope;
export function createScope(kind: 'ModuleScope', parent: Scope): ModuleScope;
export function createScope(kind: 'FunctionScope', parent: Scope): FunctionScope;
export function createScope(kind: Scope['kind'], parent?: Scope): Scope {
    let symbols = new Map<string, Symbol>();
    if (kind === 'GlobalScope') {
        assert(parent === undefined);
        return {kind, symbols};
    }
    assert(parent !== undefined);
    return {kind, parent, symbols};
}


// ====================   Symbols   ====================
export interface Symbol {
    name: string;

    // TODO: review these members...
    // isImported?: boolean;
    // isExported?: boolean;
    // members?: SymbolInfo[];
}


export function insert(scope: Scope, name: string): Symbol {
    // ensure not already defined in this scope
    if (scope.symbols.has(name)) throw new Error(`Symbol '${name}' is already defined.`);
    let sym: Symbol = {name};
    scope.symbols.set(name, sym);
    return sym;
}


export function lookup(scope: Scope, name: string): Symbol {
    if (scope.symbols.has(name)) return scope.symbols.get(name)!;
    if (scope.kind === 'GlobalScope') throw new Error(`Symbol '${name}' is not defined.`);
    return lookup(scope.parent, name);
}
