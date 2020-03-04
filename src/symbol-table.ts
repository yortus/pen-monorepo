import {Scope} from './scope'; // NB: this type-only import is elided at runtime
import {assert} from './utils';


export interface Symbol {
    id: number;
    nameInSource: string;
    nameInTarget: string;
}


export class SymbolTable {

    create(nameInSource: string, scope: Scope): Symbol {
        // ensure not already defined in this scope
        if (scope.symbols.has(nameInSource)) throw new Error(`Symbol '${nameInSource}' is already defined.`);
        let id = this.symbols.length;
        let nameInTarget = `__${nameInSource}$_{id}`;
        let symbol: Symbol = {id, nameInSource, nameInTarget};
        scope.symbols.set(nameInSource, symbol);
        this.symbols.push(symbol);
        return symbol;
    }

    lookup(id: number): Symbol;
    lookup(nameInSource: string, scope: Scope): Symbol;
    lookup(idOrName: number | string, scope?: Scope): Symbol {
        if (typeof idOrName === 'number') return this.symbols[idOrName];
        assert(scope !== undefined);
        if (scope.symbols.has(idOrName)) return scope.symbols.get(idOrName)!;
        if (scope.parent) return this.lookup(idOrName, scope.parent);
        throw new Error(`Symbol '${idOrName}' is not defined.`);
    }

    private symbols: Symbol[] = [];
}
