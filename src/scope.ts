export interface Scope {

    insert(name: string): SymbolInfo;

    lookup(name: string): SymbolInfo;

    parent?: Scope;

    symbols: Map<string, SymbolInfo>; // maps name to symbol info
}




export interface SymbolInfo {
    name: string;
}




export function newScope(parent?: Scope): Scope {
    let symbols = new Map<string, SymbolInfo>();
    return {
        insert(name) {
            // ensure not already defined in this scope
            if (symbols.has(name)) throw new Error(`Symbol '${name}' is already defined.`);
            let sym: SymbolInfo = {name};
            symbols.set(name, sym);
            return sym;
        },
        lookup(name) {
            if (symbols.has(name)) return symbols.get(name)!;
            if (!parent) throw new Error(`Symbol '${name}' is not defined.`);
            return parent.lookup(name);
        },
        parent,
        symbols,
    };
}
