import * as assert from 'assert';
import {Blockᐟ, Definitionᐟ, Referenceᐟ, ImportDeclarationᐟ, transformAst} from './ast';
import {parse} from './parse';
//import {symbolTable} from './symbols';
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

        Reference(ref) {
            let symbol = currentScope.lookup(ref.name);
            let result: Referenceᐟ = {...ref, kind: 'Referenceᐟ', symbol};
            return result;
        },
    });
    [] = [ast3];

    // 3. emit ast ==> target (JS) output code

    // 4. PROFIT
    let target: JsTargetCode = {code: [].join('\n')};
    return target;
}












// function indent() { prefix += '    '; }
// function dedent() { prefix = prefix.slice(4); }
// function emit(...lines: string[]) {
//     for (let line of lines) output.push(`${prefix}${line}`);
// }
// let prefix = '';
// let output = [] as string[];
