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
    eval(): {
        parse(text: string): unknown;
        print(ast: unknown): string;
    };

    // TODO: doc...
    // Path where the output file will be generated. If the file already exists, it will be overwritten.
    // If relative, will be resolved against the CWD.
    // If omitted, will be same as main path but with extension changed to '.js'
    save(filename?: string): void;

    // TODO: doc better...
    /** Returns the target code as source. */
    toString(): void;
}


export function compile(options: CompilerOptions): CompilerResult {

    // Parse and validate compiler options
    const main = options.main ? AbsPath(path.resolve(options.main)) : undefined;
    const source = options.source || '';
    if ((!main && !source) ||  (main && source)) {
        // TODO: improve diagnostic message
        throw new Error(`Must specify either main or source, but not both`);
    }

    // Proceed through all stages in the compiler pipeline.
    const ast1 = parseSourceFiles(main ? {main} : {text: source});
    const ast2 = resolveSymbols(ast1);
    const ast3 = normaliseExpressions(ast2);
    const consts = resolveConstantValues(ast3);
    const targetCode = generateTargetCode({ast: ast3, consts});
    return {
        eval() {
            let module = {} as {exports: ReturnType<CompilerResult['eval']>};
            eval(`(function (module) {\n${targetCode}\n})(module)`);
            return module.exports;
        },
        save(filename) {
            // write the target code to the output file path. Creating containing dirs if necessary.
            if (!filename) {
                if (!main) throw new Error(`Must specify a filename for the output file.`);
                filename = main.substr(0, main.length - path.extname(main).length) + '.js';
            }
            if (main === filename) throw new Error(`output would overwrite input`);
            const outFilePath = path.resolve(filename);
            fs.ensureDirSync(path.dirname(outFilePath));
            fs.writeFileSync(outFilePath, targetCode);
        },
        toString: () => targetCode,
    };
}
