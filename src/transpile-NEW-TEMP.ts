// import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';
import {emitModule} from './emit-module';
import {parse} from './grammar';




export function NEWtranspileToJS(grammar: string) {

    // Generate TypeScript source code for the grammar
    let ast = parse(grammar);
    let stmts = emitModule(ast);
    let decl = ts.createBlock(stmts, true);
    const printer = ts.createPrinter({newLine: ts.NewLineKind.LineFeed});
    const grammarSource = printer.printNode(
        ts.EmitHint.Unspecified,
        decl,
        ts.createSourceFile('main.ts', '', ts.ScriptTarget.ES2015)
    );
    // TODO: temp testing... prevent TS6133
    grammarSource;

    // Fetch all builtin sources
    // const BUILTIN_PATH = path.join(__dirname, '../../in-parts');
    // let builtinFilenames = fs.readdirSync(BUILTIN_PATH).filter(fn => path.extname(fn) === '.ts');
    // let builtinSources = builtinFilenames.map(fn => fs.readFileSync(path.join(BUILTIN_PATH, fn), {encoding: 'utf8'}));

    let options: ts.CompilerOptions = {
        target: ts.ScriptTarget.ES2015,
        module: ts.ModuleKind.UMD,
    };
    let host = createCompilerHost(options, []);
    let program = ts.createProgram({
        host,
        options,
        rootNames: ['main.ts'],
    });




    let emitResult = program.emit();
    let allDiagnostics = ts.getPreEmitDiagnostics(program).concat(emitResult.diagnostics);

    allDiagnostics.forEach(diagnostic => {
        if (diagnostic.file) {
            let {line, character} = diagnostic.file.getLineAndCharacterOfPosition(diagnostic.start!);
            let message = ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n');
            console.log(`${diagnostic.file.fileName} (${line + 1},${character + 1}): ${message}`);
        }
        else {
            console.log(`${ts.flattenDiagnosticMessageText(diagnostic.messageText, '\n')}`);
        }
    });

    return program;

    // // Concatenate all sources
    // let source = [grammarSource, ...builtinSources].join('\n\n\n\n');

    // // TODO: temp testing... write back to disk for inspection
    // fs.writeFileSync(path.join(process.cwd(), 'output.ts'), source, {encoding: 'utf8'});
    // process.exit(0);

    // let out = ts.transpileModule(source, {
    //     compilerOptions: {
    //         target: ts.ScriptTarget.ES2015,
    //     },
    // });

    // // TODO: temp testing... what have we so far?
    // out;
    // grammar;

}




function createCompilerHost(options: ts.CompilerOptions, moduleSearchLocations: string[]): ts.CompilerHost {
    return {
        getSourceFile,
        getDefaultLibFileName: () => 'lib.d.ts',
        writeFile: (fileName, content) => ts.sys.writeFile(fileName, content),
        getCurrentDirectory: () => ts.sys.getCurrentDirectory(),
        getDirectories: paath => ts.sys.getDirectories(paath),
        getCanonicalFileName: fileName =>
            ts.sys.useCaseSensitiveFileNames ? fileName : fileName.toLowerCase(),
        getNewLine: () => ts.sys.newLine,
        useCaseSensitiveFileNames: () => ts.sys.useCaseSensitiveFileNames,
        fileExists,
        readFile,
        resolveModuleNames,
    };

    function getSourceFile(fileName: string, languageVersion: ts.ScriptTarget, _onError?: (message: string) => void) {
        // (1) this gets called first with filename := "main.ts" (then with "lib.d.ts")
        const sourceText = ts.sys.readFile(fileName);
        return sourceText !== undefined
            ? ts.createSourceFile(fileName, sourceText, languageVersion)
            : undefined;
    }

    function fileExists(fileName: string): boolean {
        return ts.sys.fileExists(fileName);
    }

    function readFile(fileName: string): string | undefined {
          return ts.sys.readFile(fileName);
    }

    function resolveModuleNames(moduleNames: string[], containingFile: string): ts.ResolvedModule[] {
        // (2) this didn't get called at all (perhaps because there were no relative paths?)
        const resolvedModules: ts.ResolvedModule[] = [];
        for (const moduleName of moduleNames) {
            // try to use standard resolution
            let result = ts.resolveModuleName(moduleName, containingFile, options, {
                fileExists,
                readFile,
            });
            if (result.resolvedModule) {
                resolvedModules.push(result.resolvedModule);
            } else {
                // check fallback locations, for simplicity assume that module at location
                // should be represented by '.d.ts' file
                for (const location of moduleSearchLocations) {
                    const modulePath = path.join(location, moduleName + ".d.ts");
                    if (fileExists(modulePath)) {
                        resolvedModules.push({ resolvedFileName: modulePath });
                    }
                }
            }
        }
        return resolvedModules;
    }
}
