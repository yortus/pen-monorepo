import {decorateAst} from './ast';
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
    let ast2 = decorateAst(ast, {

        Block(block, visitChildren) {
            let scope = currentScope = newScope(currentScope);
            block = visitChildren(block);
            const result = {...block, scope};
            currentScope = currentScope.parent!;
            return result;
        },

        Definition(def, visitChildren) {
            let symbol = currentScope.insert(def.name);
            def = visitChildren(def);
            const result = {...def, symbol};
            return result;

            // // TODO: fix hardcoded 'Pattern', since not always a Pattern, may be a Combinator. But we don't know yet.
            // //       e.g. if node.expression is a 'Reference', what kind does it refer to? Refs are not resolved yet.
            // //       This seems to be really a type-checking thing (so do a runtime check if no static type checking).
            // const symbol: Symbol = {kind: 'Pattern', name: defn.name, scope: symbolTable.currentScope};
            // symbolTable.insert(symbol);
            // return {...defn, symbol};
        },
    });
    [] = [ast2];

    // 2b. resolve all references to symbols defined in the first pass
    let ast3 = decorateAst(ast2, {

    //     Reference(ref) {
    //         let result = {...ref};
    //         return result;
    //     },
    });

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
