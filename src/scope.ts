export type Scope = ModuleScope | NestedScope;

export interface ModuleScope {
    kind: 'Module';
    symbols: Map<string, SymbolInfo>; // maps name to symbol info
}

export interface NestedScope {
    kind: 'Nested';
    parent: Scope;
    symbols: Map<string, SymbolInfo>; // maps name to symbol info
}




export interface SymbolInfo {
    name: string;
    isImported?: boolean;
    isExported?: boolean;
}




export function insert(scope: Scope, name: string): SymbolInfo {
    // ensure not already defined in this scope
    if (scope.symbols.has(name)) throw new Error(`Symbol '${name}' is already defined.`);
    let sym: SymbolInfo = {name};
    scope.symbols.set(name, sym);
    return sym;
}




export function lookup(scope: Scope, name: string): SymbolInfo {
    if (scope.symbols.has(name)) return scope.symbols.get(name)!;
    if (scope.kind !== 'Nested') throw new Error(`Symbol '${name}' is not defined.`);
    return lookup(scope.parent, name);
}




export function makeModuleScope(): ModuleScope {
    let symbols = new Map<string, SymbolInfo>();
    return  {kind: 'Module', symbols};
}




export function makeNestedScope(parent: Scope): NestedScope {
    let symbols = new Map<string, SymbolInfo>();
    return {kind: 'Nested', parent, symbols};
}
