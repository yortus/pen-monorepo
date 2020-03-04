import {Program} from '../../ast-nodes';
import {SymbolDefinitions} from '../03-create-symbol-definitions';
import {SymbolReferences} from '../04-resolve-symbol-references';
import {makeEmitter} from './emitter';


// TODO: doc...
export function generateTargetCode(program: Program<SymbolDefinitions & SymbolReferences>) {
    return emitProgram(program);
}


function emitProgram(program: Program<SymbolDefinitions & SymbolReferences>) {
    const emit = makeEmitter();
    const symbolTable = program.meta.symbolTable;

    // TODO: header stuff...
    // TODO: every source file import the PEN standard library
    // TODO: how to ensure it can be loaded? Use rel path and copy file there?
    emit.down(1).text(`//import * as __std from "penlib;"`);
    emit.down(2);

    // Declare all symbols before any are defined.
    symbolTable.forEach(symbol => {
        emit.down(1).text(`const ${symbol.nameInTarget} = {};`);
    });




    for (let [, sourceFile] of program.sourceFiles.entries()) {
        emit.down(2).text(`// ==========  ${sourceFile.path}  ==========`);
//        emitSourceFile(emit, sourceFile);

    }
    return emit.toString();
}


