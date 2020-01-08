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
    push(kind: 'ModuleScope'): ModuleScope;
    push(kind: 'FunctionScope'): FunctionScope;
    push(kind: 'ModuleScope' | 'FunctionScope') {
        let newScope = {kind, parent: this.current, symbols: new Map()};
        this.stack.push(newScope);
        return newScope;
    }

    pop() {
        assert(this.stack.length > 0);
        this.stack.pop();
    }

    get current() {
        assert(this.stack.length > 0);
        return this.stack[this.stack.length - 1];
    }

    private stack: Scope[] = [{kind: 'GlobalScope', symbols: new Map()}];
}
