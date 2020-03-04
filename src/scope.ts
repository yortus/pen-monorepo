import {Symbol} from './symbol-table'; // NB: this type-only import is elided at runtime


export interface Scope {
    parent?: Scope;
    symbols: Map<string, Symbol>; // maps source name to symbol info
}
