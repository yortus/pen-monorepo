import {assert} from '../../../ast-utils';
import {FunctionScope, GlobalScope, ModuleScope, Scope, Symbol} from '../../representations/03-symbols-and-scopes';


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
