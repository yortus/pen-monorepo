import {Scope} from './scopes'; // NB: this type-only import is elided at runtime


export type Symbol =
    | ModuleSymbol
    | OtherSymbol;


// TODO: remove ModuleSymbol? never used...
export interface ModuleSymbol {
    kind: 'ModuleSymbol';
    name: string;
}


export interface OtherSymbol {
    kind: 'OtherSymbol';
    name: string;
}


export function createSymbol(kind: 'ModuleSymbol', name: string, scope: Scope): ModuleSymbol;
export function createSymbol(kind: 'OtherSymbol', name: string, scope: Scope): OtherSymbol;
export function createSymbol(kind: Symbol['kind'], name: string, scope: Scope): Symbol {
    // ensure not already defined in this scope
    if (scope.symbols.has(name)) throw new Error(`Symbol '${name}' is already defined.`);
    let sym: Symbol = {kind, name};
    scope.symbols.set(name, sym);
    return sym;
}


export function lookup(scope: Scope, name: string): Symbol {
    if (scope.symbols.has(name)) return scope.symbols.get(name)!;
    if (scope.kind === 'GlobalScope') throw new Error(`Symbol '${name}' is not defined.`);
    return lookup(scope.parent, name);
}
