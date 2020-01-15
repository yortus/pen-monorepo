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


export class ScopeStack {
    push(kind: 'GlobalScope'): GlobalScope;
    push(kind: 'ModuleScope'): ModuleScope;
    push(kind: 'FunctionScope'): FunctionScope;
    push(scope: Scope): Scope;
    push(scope: 'GlobalScope' | 'ModuleScope' | 'FunctionScope' | Scope) {
        if (typeof scope === 'string') {
            let kind = scope;
            assert(kind !== 'GlobalScope' || this.isEmpty);
            let symbols = new Map<string, Symbol>();
            scope = kind === 'GlobalScope' ? {kind, symbols} : {kind, parent: this.current, symbols} as Scope;
        }
        this.stack.push(scope);
        return scope;
    }

    pop() {
        assert(!this.isEmpty);
        this.stack.pop();
    }

    get current() {
        assert(!this.isEmpty);
        return this.stack[this.stack.length - 1];
    }

    get isEmpty() {
        return this.stack.length === 0;
    }

    private stack: Scope[] = [];
}
