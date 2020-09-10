import {NodeKind} from './node-kind';


export function createNodeKind<T extends Options>(options: T) {
    let basedOn = options.basedOn ?? NodeKind;
    let include = options.include ?? [];
    let exclude = options.exclude ?? [];
    let add = include.filter(k => !basedOn.includes(k));
    let result = [...basedOn, ...add].filter(k => !exclude.includes(k));

    type B = T['basedOn'] extends Array<infer E> ? E : NodeKind;
    type I = T['include'] extends Array<infer E> ? E : never;
    type E = T['exclude'] extends Array<infer E> ? E : never;
    return result as unknown as Array<Exclude<B | I, E>>;
}


interface Options {
    basedOn?: readonly NodeKind[];
    include?: readonly NodeKind[];
    exclude?: readonly NodeKind[];
}
