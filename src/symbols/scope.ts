import {Symbol} from './symbol-types';




// TODO: jsdoc...
export interface Scope {
    id: number;
    parent?: Scope;
    symbols: Symbol[];
}
