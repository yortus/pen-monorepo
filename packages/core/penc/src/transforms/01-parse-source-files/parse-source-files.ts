import * as fs from 'fs';
import {allNodeKinds, BindingList, Identifier, mapNode, Module, moduleFromBindingList, traverseNode} from '../../ast-nodes';
import {AST, validateAST} from '../../representations';
import {AbsPath, assert, isExtension, mapObj, resolveModuleSpecifier} from '../../utils';
import {createModuleNameGenerator} from './create-module-name-generator';
import {parseExtFile, parsePenFile} from './grammars';


/**
 * Creates the AbstractSyntaxTree representation for the PEN program specified by `options.main`. Finds the transitive
 * closure of all source files comprising the program by parsing each source file and analysing each encountered
 * `ImportExpression` to determine whether more source files need to be included in the SourceFileMap representation.
 * @param options.main absolute file path to the main source file for the PEN program.
 */
export function parseSourceFiles(options: {main: AbsPath}): AST {

    // TODO: temp testing... explain each of these
    const sourceFilesByPath: Record<string, BindingList> = {};
    const startPath = resolveModuleSpecifier(options.main);
    const generateModuleName = createModuleNameGenerator();
    const moduleNamesBySourceFilePath: Record<string, string> = {};

    // TODO: temp testing... do basic parse over transitive closure of source files
    const unprocessedPaths = [startPath];
    const processedPaths = new Set<AbsPath>();
    while (unprocessedPaths.length > 0) {
        const sourceFilePath = unprocessedPaths.shift()!;
        if (processedPaths.has(sourceFilePath)) continue;
        processedPaths.add(sourceFilePath);

        // Generate a module name for this source file.
        const moduleName = generateModuleName(sourceFilePath);
        moduleNamesBySourceFilePath[sourceFilePath] = moduleName;

        // Parse this source file.
        const sourceText = fs.readFileSync(sourceFilePath, 'utf8');
        const parse = isExtension(sourceFilePath) ? parseExtFile : parsePenFile;
        const sourceFile = parse(sourceText, {path: sourceFilePath});
        sourceFilesByPath[sourceFilePath] = sourceFile;

        // Visit every ImportExpression, adding the imported path to `unprocessedPaths`.
        traverseNode(sourceFile, n => {
            if (n.kind !== 'ImportExpression') return;
            const importPath = resolveModuleSpecifier(n.moduleSpecifier, sourceFilePath);
            unprocessedPaths.push(importPath);
        });
    }

    // TODO: temp testing... traverse AST again, converting BindingLists-->Modules, and ImportExprs-->Identifiers + remove ParenthesisedExprs
    const sourceFileModules = Object.entries(sourceFilesByPath).reduce(
        (program, [sourceFilePath, sourceFileBindings]) => {
            const moduleName = moduleNamesBySourceFilePath[sourceFilePath];
            const module = mapNode(sourceFileBindings, rec => ({
                BindingList: (bl): Module => {
                    let module = moduleFromBindingList(bl);
                    return {...module, bindings: mapObj(module.bindings, rec)};
                },
                ImportExpression: ({moduleSpecifier}): Identifier => {
                    const path = resolveModuleSpecifier(moduleSpecifier, sourceFilePath);
                    return {kind: 'Identifier', name: moduleNamesBySourceFilePath[path]};
                },
                ParenthesisedExpression: par => rec(par.expression),
            }));
            assert(module.kind === 'Module');
            program[moduleName] = module;
            return program;
        },
        {} as Record<string, Module>
    );

    // TODO: temp testing...
    const ast: AST = {
        module: {
            kind: 'Module',
            bindings: {
                ...sourceFileModules,
                start: {
                    kind: 'MemberExpression',
                    module: {kind: 'Identifier', name: moduleNamesBySourceFilePath[startPath]},
                    member: {kind: 'Identifier', name: 'start'},
                },
            },
        },
    };
    validateAST(ast, outputNodeKinds);
    return ast;
}


/** List of node kinds that may be present in the output AST. */
const outputNodeKinds = allNodeKinds.without(
    'Binding',
    'BindingList',
    'ImportExpression',
    // TODO: was... but LambdaExpr#param may be this kind... 'ModulePattern',
    'ParenthesisedExpression',
);
