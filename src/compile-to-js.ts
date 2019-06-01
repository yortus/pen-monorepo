import * as assert from 'assert';
import {Blockᐟ, Definitionᐟ, Referenceᐟ, ImportDeclarationᐟ, Node, PenModuleᐟ} from './ast';
import {forEachChildNode, matchNode, transformAst} from './ast';
import {Emitter, makeEmitter} from './emitter';
import {parse} from './parse';
import {newScope} from './scope';




export interface PenSourceCode {code: string; }
export interface JsTargetCode {code: string; }




export function compileToJs(source: PenSourceCode): JsTargetCode {

    // 1. parse source (PEN) input code ==> ast
    let ast = parse(source.code);

    // 2. analyse and check ast

    // 2a. define all symbols within their scopes
    let currentScope = newScope();
    let ast2 = transformAst(ast, {

        Block(block, transformChildren) {
            let scope = currentScope = newScope(currentScope);
            block = transformChildren(block);
            const result: Blockᐟ = {...block, kind: 'Blockᐟ', scope};
            currentScope = currentScope.parent!;
            return result;
        },

        Definition(def, transformChildren) {
            let symbol = currentScope.insert(def.name);
            def = transformChildren(def);
            const result: Definitionᐟ = {...def, kind: 'Definitionᐟ', symbol};
            return result;

            // // TODO: fix hardcoded 'Pattern', since not always a Pattern, may be a Combinator. But we don't know yet.
            // //       e.g. if node.expression is a 'Reference', what kind does it refer to? Refs are not resolved yet.
            // //       This seems to be really a type-checking thing (so do a runtime check if no static type checking).
            // const symbol: Symbol = {kind: 'Pattern', name: defn.name, scope: symbolTable.currentScope};
            // symbolTable.insert(symbol);
            // return {...defn, symbol};
        },

        ImportDeclaration(decl) {
            let bindings = decl.bindings.map(binding => {
                let symbol = currentScope.insert(binding.name); // TODO: what about alias?
                return {...binding, symbol};
            });
            const result: ImportDeclarationᐟ = {...decl, kind: 'ImportDeclarationᐟ', bindings};
            return result;
        },

        PenModule(mod, transformChildren) {
            let scope = currentScope = newScope(currentScope);
            mod = transformChildren(mod);
            const result: PenModuleᐟ = {...mod, kind: 'PenModuleᐟ', scope};
            currentScope = currentScope.parent!;
            return result;
        },
    });

    // 2b. resolve all references to symbols defined in the first pass
    assert(!currentScope.parent); // sanity check - we should be back at the root scope here
    let ast3 = transformAst(ast2, {

        Blockᐟ(block, transformChildren) {
            assert(block.scope.parent === currentScope); // sanity check
            currentScope = block.scope;
            block = transformChildren(block);
            currentScope = currentScope.parent!;
            return block;
        },

        PenModuleᐟ(mod, transformChildren) {
            assert(mod.scope.parent === currentScope); // sanity check
            currentScope = mod.scope;
            mod = transformChildren(mod);
            currentScope = currentScope.parent!;
            return mod;
        },

        Reference(ref) {
            let symbol = currentScope.lookup(ref.name);
            let result: Referenceᐟ = {...ref, kind: 'Referenceᐟ', symbol};
            return result;
        },
    });

    // 3. emit ast ==> target (JS) output code
    let emit = makeEmitter();
    emitNode(ast3, emit);

    // 4. PROFIT
    let target: JsTargetCode = {code: emit.toString()};
    return target;
}





function emitNode(n: Node, emit: Emitter) {
    matchNode(n, {
        Definitionᐟ: def => {
            emit.line().line(`Object.assign(m1.${def.name}, {`).indent();
            emit.line(`/*expr for ${def.name}*/`);
            emit.dedent().line(`});`);
        },

        PenModuleᐟ: mod => {
            emit.line().line(`let m1 = {`).indent();
            for (let name of mod.scope.symbols.keys()) {
                emit.line(`${name}: {},`);
            }
            emit.dedent().line(`};`);
            forEachChildNode(mod, child => emitNode(child, emit)); // TODO: boilerplate... can automate?
        },

        default: node => {
            forEachChildNode(node, child => emitNode(child, emit));
        },
    });
}
