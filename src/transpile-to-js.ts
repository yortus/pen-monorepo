import * as fs from 'fs';
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
        ts.createSourceFile('main', '', ts.ScriptTarget.ES2015)
    );

    // Fetch all builtin sources
    const BUILTIN_PATH = path.join(__dirname, '../../in-parts');
    let builtinFilenames = fs.readdirSync(BUILTIN_PATH).filter(fn => path.extname(fn) === '.ts');
    let builtinSources = builtinFilenames.map(fn => fs.readFileSync(path.join(BUILTIN_PATH, fn), {encoding: 'utf8'}));

    // Concatenate all sources
    let source = [grammarSource, ...builtinSources].join('\n\n\n\n');

    // TODO: temp testing... write back to disk for inspection
    fs.writeFileSync(path.join(process.cwd(), 'output.ts'), source, {encoding: 'utf8'});
    process.exit(0);

    let out = ts.transpileModule(source, {
        compilerOptions: {
            target: ts.ScriptTarget.ES2015,
        },
    });

    // TODO: temp testing... what have we so far?
    out;
    grammar;

}




export function transpileToJS(grammar: string) {
    let ast = parse(grammar);
    let moduleStmts = emitModule(ast);

    let parseTemplate = ts.createSourceFile(
        'parse.ts',
        // TODO: awkward mapping from /dist/commonjs back to /src. Fix this.
        fs.readFileSync(path.join(__dirname, '../../src/templates/parse-function.ts'), 'utf8'),
        ts.ScriptTarget.ES2015,
        /*setParentNodes */ true
    );

    let unparseTemplate = ts.createSourceFile(
        'unparse.ts',
        // TODO: awkward mapping from /dist/commonjs back to /src. Fix this.
        fs.readFileSync(path.join(__dirname, '../../src/templates/unparse-function.ts'), 'utf8'),
        ts.ScriptTarget.ES2015,
        /*setParentNodes */ true
    );

    instantiateTemplate(parseTemplate, moduleStmts);
    instantiateTemplate(unparseTemplate, moduleStmts);
    return {
        parse: generateCode(parseTemplate),
        unparse: generateCode(unparseTemplate),
    };
}




function instantiateTemplate(parseTemplateSourceFile: ts.SourceFile, placeholderReplacement: ts.Statement[]) {
    let placeholder = findPlaceholderNode(parseTemplateSourceFile);
    placeholder.block.statements = ts.createNodeArray([
        ...placeholder.block.statements.slice(0, placeholder.index),
        ...placeholderReplacement,
        ...placeholder.block.statements.slice(placeholder.index + 1),
    ]);
}




function findPlaceholderNode(template: ts.Node) {
    let result = ts.forEachChild(template, function visit(child): ts.Statement | undefined {
        if (ts.isLabeledStatement(child) && child.label.text === 'placeholder') return child;
        return ts.forEachChild(child, visit);
    });
    if (!result || !ts.isBlock(result.parent)) {
        throw new Error(`Internal error: placholder is missing or incorrectly placed in template`);
    }

    let block = result.parent;
    let index =  block.statements.indexOf(result);
    return {block, index};
}




function generateCode(typeScriptSourceFile: ts.SourceFile) {
    const printer = ts.createPrinter({newLine: ts.NewLineKind.LineFeed});
    const typeScriptSource = printer.printNode(ts.EmitHint.Unspecified, typeScriptSourceFile, typeScriptSourceFile);
    const javaScriptOutput = ts.transpileModule(typeScriptSource, {
        reportDiagnostics: true,
        compilerOptions: {
            module: ts.ModuleKind.CommonJS,
            target: ts.ScriptTarget.ES2016,
        },
    });

    return {
        typeScriptSource,
        javaScriptSource: javaScriptOutput.outputText,
        diagnostics: javaScriptOutput.diagnostics || [],
    };
}
