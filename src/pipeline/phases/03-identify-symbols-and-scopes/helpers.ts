import {ModuleScope, RecordScope, Scope, SymbolInfo} from '../../representations/03-symbols-and-scopes';


export function insert(scope: Scope, name: string): SymbolInfo {
    // ensure not already defined in this scope
    if (scope.symbols.has(name)) throw new Error(`Symbol '${name}' is already defined.`);
    let sym: SymbolInfo = {name};
    scope.symbols.set(name, sym);
    return sym;
}


export function lookup(scope: Scope, name: string): SymbolInfo {
    if (scope.symbols.has(name)) return scope.symbols.get(name)!;
    if (scope.kind !== 'RecordScope') throw new Error(`Symbol '${name}' is not defined.`);
    return lookup(scope.parent, name);
}


export function makeModuleScope(): ModuleScope {
    let symbols = new Map<string, SymbolInfo>();
    return  {kind: 'ModuleScope', symbols};
}


export function makeRecordScope(parent: Scope): RecordScope {
    let symbols = new Map<string, SymbolInfo>();
    return {kind: 'RecordScope', parent, symbols};
}
