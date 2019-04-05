import {Scope} from './scope';




export type Symbol =
    | Pattern
    | Combinator;




export interface Pattern {
    kind: 'Pattern';
    name: string;
    scope: Scope;
}

export interface Combinator {
    kind: 'Combinator';
    name: string;
    scope: Scope;
}
