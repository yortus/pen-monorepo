import {Symbol} from './symbol-table'; // NB: this type-only import is elided at runtime


export interface Scope {
    id: number;
    kind: 'root' | 'module' | 'extension';
    parent?: Scope;
    children: Scope[];
    symbols: Map<string, Symbol>; // maps source name to symbol info
}


export function createRootScope(): Scope {
    counter = 0; // Reset the counter whenever we are asked to create a root scope, since it must be a different parse.
    return {
        id: 0,
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
