import {parse} from './grammar';




export * from './ast-types';




export function test(grammar: string) {
    let ast = parse(grammar);
    return ast;
}
