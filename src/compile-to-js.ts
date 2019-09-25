import {analyse} from './analysis';
import {codegen} from './codegen';




export interface PenSourceCode {code: string; }
export interface JsTargetCode {code: string; }




export function compileToJs(source: PenSourceCode): JsTargetCode {

    // Generate an AST from the source code.
    let ast = analyse(source.code);

    // Emit target (JS) output code from the AST.
    let output = codegen(ast);

    // 4. PROFIT
    let target: JsTargetCode = {code: output};
    return target;
}
