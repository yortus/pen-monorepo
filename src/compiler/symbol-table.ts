import {Scope} from './scope'; // NB: this type-only import is elided at runtime
import {assert} from './utils';


export interface Symbol {
    id: number;
    name: string;
    scope: Scope;
}


export class SymbolTable {

    create(name: string, scope: Scope): Symbol {
        // ensure not already defined in this scope
        if (scope.symbols.has(name)) throw new Error(`Symbol '${name}' is already defined.`);
        let id = this.symbols.length;
        let symbol: Symbol = {id, name, scope};
        scope.symbols.set(name, symbol);
        this.symbols.push(symbol);
        return symbol;
    }

    lookup(id: number): Symbol;
    lookup(name: string, scope: Scope): Symbol;
    lookup(idOrName: number | string, scope?: Scope): Symbol {
        if (typeof idOrName === 'number') return this.symbols[idOrName];
        assert(scope !== undefined);
        if (scope.symbols.has(idOrName)) return scope.symbols.get(idOrName)!;
        if (scope.parent) return this.lookup(idOrName, scope.parent);
        throw new Error(`Symbol '${idOrName}' is not defined.`);
    }

    forEach(cb: (symbol: Symbol, index: number) => void) {
        this.symbols.forEach(cb);
    }

    private symbols: Symbol[] = [];
}
