import {Module} from '../ast';
import {emitNode} from './emit-node';
import {makeEmitter} from './emitter';




export function codegen(ast: Module<'pass2'>): string {
    let emit = makeEmitter();
    emitNode(ast, emit);
    let result = emit.toString();
    return result;
}
