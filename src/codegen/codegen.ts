import {ModuleDeclaration, ModuleDefinition} from '../ast';
import {emitNode} from './emit-node';
import {makeEmitter} from './emitter';




export function codegen(ast: ModuleDeclaration | ModuleDefinition): string {
    let emit = makeEmitter();
    emitNode(ast, emit);
    let result = emit.toString();
    return result;
}
