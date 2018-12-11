import * as fs from 'fs';
import * as path from 'path';
import * as ts from 'typescript';
import {emitModule} from './emit-module';
import {parse} from './grammar';




export function getParser(grammar: string) {
    let ast = parse(grammar);
    let moduleStmts = emitModule(ast);

    let parseTemplate = ts.createSourceFile(
        'parse-template.ts',
        fs.readFileSync(path.join(__dirname, '../templates/parse-function.ts'), 'utf8'),
        ts.ScriptTarget.ES2015,
        /*setParentNodes */ true
    );

    instantiateTemplate(parseTemplate, moduleStmts);
    return generateCode(parseTemplate);
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
