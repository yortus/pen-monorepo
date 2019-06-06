export interface Scope {
    parent?: Scope;
    symbols: Map<string, SymbolInfo>; // maps name to symbol info
}




export interface SymbolInfo {
    name: string;
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
    if (!scope.parent) throw new Error(`Symbol '${name}' is not defined.`);
    return lookup(scope.parent, name);
}




export function makeChildScope(parent?: Scope): Scope {
    let symbols = new Map<string, SymbolInfo>();
    return {parent, symbols};
}
