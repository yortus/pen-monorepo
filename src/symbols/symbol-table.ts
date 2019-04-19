import {Scope} from './scope';
import {Symbol} from './symbol-types';




// TODO: jsdoc...
export let currentScope: Scope = {id: 0, symbols: []};




// TODO: jsdoc...
export function insert(symbol: Symbol) {
    // Guard against duplicate definitions of the same name in the current scope.
    if (currentScope.symbols.some(sym => sym.name === symbol.name)) {
        throw new Error(`The name '${symbol.name}' is already defined in the current scope.`);
    }

    // Define the given symbol in the current scope.
    currentScope.symbols.push(symbol);
}




// TODO: jsdoc...
export function lookup(name: string): Symbol {
    let scope = currentScope;
    while (true) {
        let resolved = scope.symbols.find(sym => sym.name === name);
        if (resolved) return resolved;
        if (!scope.parent) throw new Error(`The name '${name}' could not be resolved.`);
        scope = scope.parent;
    }
}




// TODO: jsdoc...
export function enterScope() {
    let newScope: Scope = {id: ++nextScopeId, parent: currentScope, symbols: []};
    currentScope = newScope;
}




// TODO: jsdoc...
export function leaveScope() {
    if (!currentScope.parent) throw new Error(`Internal error: cannot leave global scope`);
    currentScope = currentScope.parent;
}




// TODO: doc helper...
let nextScopeId = 0;
