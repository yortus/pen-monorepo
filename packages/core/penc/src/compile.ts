// TODO: transform order is important
// - should it be reflected in the export names from './transforms'?
// - not if the param/return types basically dictate the order


import * as fs from 'fs-extra';
import * as path from 'path';
import {CompilerOptions} from './compiler-options';
import {parseSourceFiles} from './transforms';
import {resolveSymbols} from './transforms';
import {normaliseExpressions} from './transforms';
import {resolveConstantValues} from './transforms';
import {generateTargetCode} from './transforms';
import {AbsPath} from './utils';


// TODO: rename...
export interface CompilerResult {

    // TODO: doc...
    parse(text: string): unknown;

    // TODO: doc...
    print(ast: unknown): string;

    // TODO: doc better...
    /** Returns the target code as source. */
    toString(): void;

    // TODO: doc...
    // Path where the output file will be generated. If the file already exists, it will be overwritten.
    // If relative, will be resolved against the CWD.
    // If omitted, will be same as main path but with extension changed to '.js'
    save(filename?: string): void;
}


export function compile(options: CompilerOptions): CompilerResult {

    // Parse and validate compiler options
    const main = AbsPath(path.resolve(options.main));

    // Proceed through all stages in the compiler pipeline.
    const ast1 = parseSourceFiles({main});
    const ast2 = resolveSymbols(ast1);
    const ast3 = normaliseExpressions(ast2);
    const consts = resolveConstantValues(ast3);
    const targetCode = generateTargetCode({ast: ast3, consts});
    const evalTarget = (): typeof target => target = eval(`(function (module) {\n${targetCode}\n})()`);
    let target: {parse(text: string): unknown, print(ast: unknown): string};
    return {
        parse: text => (target || evalTarget()).parse(text),
        print: ast => (target || evalTarget()).print(ast),
        toString: () => targetCode,
        save(filename) {
            // write the target code to the output file path. Creating containing dirs if necessary.
            const outFile = filename || main.substr(0, main.length - path.extname(main).length) + '.js';
            if (main === outFile) throw new Error(`output would overwrite input`);
            const outFilePath = path.resolve(outFile);
            fs.ensureDirSync(path.dirname(outFilePath));
            fs.writeFileSync(outFilePath, targetCode);
        },
    };
}
