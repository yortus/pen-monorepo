import {Node} from '../ast2';
import {emitNode} from './emit-node';
import {makeEmitter} from './emitter';




export function codegen(ast: Node<300, 'ModuleDefinition'>): string {
    let emit = makeEmitter();
    emitNode(ast, emit);
    let result = emit.toString();
    return result;
}
