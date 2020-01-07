import {assert} from '../utils';
import {Symbol} from './symbol'; // NB: this type-only import is elided at runtime


export type Scope =
    | GlobalScope
    | ModuleScope
    | FunctionScope;


export interface GlobalScope {
    kind: 'GlobalScope';
    symbols: Map<string, Symbol>; // maps name to symbol info
}


export interface ModuleScope {
    kind: 'ModuleScope';
    parent: Scope;
    symbols: Map<string, Symbol>; // maps name to symbol info
}


export interface FunctionScope {
    kind: 'FunctionScope';
    parent: Scope;
    symbols: Map<string, Symbol>; // maps name to symbol info
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
