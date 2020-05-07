import {Symbol} from './symbol-table'; // NB: this type-only import is elided at runtime


export interface Scope {
    id: number;
    kind: 'root' | 'module' | 'extension';
    parent?: Scope;
    children: Scope[];
    symbols: Map<string, Symbol>; // maps source name to symbol info
}


export function createRootScope(): Scope {
    return {
        id: ++counter,
        kind: 'root',
        children: [],
        symbols: new Map(),
    };
}


export function createChildScope(parent: Scope, kind: 'module' | 'extension'): Scope & {parent: Scope} {
    let childScope = {id: ++counter, kind, parent, children: [], symbols: new Map()};
    parent.children.push(childScope);
    return childScope;
}


let counter = 0;
