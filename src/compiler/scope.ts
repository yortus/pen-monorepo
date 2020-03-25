import {Symbol} from './symbol-table'; // NB: this type-only import is elided at runtime


export interface Scope {
    id: number;
    parent?: Scope;
    children: Scope[];
    symbols: Map<string, Symbol>; // maps source name to symbol info
}


export function createRootScope(): Scope {
    return {id: ++counter, children: [], symbols: new Map()};
}


export function createChildScope(parent: Scope): Scope & {parent: Scope} {
    let childScope = {id: ++counter, parent, children: [], symbols: new Map()};
    parent.children.push(childScope);
    return childScope;
}


export const STD_SCOPE: Scope = {id: -1, children: [], symbols: new Map()};


let counter = 0;
