



export type Symbol =
    | Pattern
    | Combinator;




export interface Pattern {
    kind: 'Pattern';
    name: string;
}

export interface Combinator {
    kind: 'Combinator';
    name: string;
}
