import {Scope} from './scope'; // NB: this type-only import is elided at runtime


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
