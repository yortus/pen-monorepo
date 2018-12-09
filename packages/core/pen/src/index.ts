import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';
// import {StringLiteral} from './ast-types';
import {emitModule} from './emit-module';
import {parse} from './grammar';
// import {visitEachChild} from './visit-each-child';




export * from './ast-types';




export function getParser(grammar: string) {
    let ast = parse(grammar);
    let moduleStmts = emitModule(ast);

    // Parse a file
    let sourceFile = ts.createSourceFile(
        'test.ts',
        fs.readFileSync(path.join(__dirname, '../templates/parse-function.ts'), 'utf8'),
        ts.ScriptTarget.ES2015,
        /*setParentNodes */ true
    );

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

    let placeholder = findPlaceholderNode(sourceFile);
    placeholder.block.statements = ts.createNodeArray([
        ...placeholder.block.statements.slice(0, placeholder.index),
        ...moduleStmts,
        ...placeholder.block.statements.slice(placeholder.index + 1),
    ]);

    const resultFile = ts.createSourceFile(
        'parse.ts',
        '',
        ts.ScriptTarget.Latest,
        /*setParentNodes*/ false,
        ts.ScriptKind.TS
    );
    const printer = ts.createPrinter({newLine: ts.NewLineKind.LineFeed});
    const typeScriptSource = printer.printNode(ts.EmitHint.Unspecified, sourceFile, resultFile);


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
