import * as fs from 'fs';
import {BindingList, Identifier, mapNode, Module, traverseNode} from '../../ast-nodes';
import {AbstractSyntaxTree, abstractSyntaxTreeNodeKinds} from '../../representations';
import {AbsPath, assert, isDebugMode, isExtension, mapObj, resolveModuleSpecifier} from '../../utils';
import {parseExtFile, parsePenFile} from './grammars';
import {convertBindingListToModule, createModuleNameGenerator} from './utils';


/**
 * Creates the AbstractSyntaxTree representation for the PEN program specified by `options.main`. Finds the transitive
 * closure of all source files comprising the program by parsing each source file and analysing each encountered
 * `ImportExpression` to determine whether more source files need to be included in the SourceFileMap representation.
 * @param options.main absolute file path to the main source file for the PEN program.
 */
export function parseSourceFiles(options: {main: AbsPath}): AbstractSyntaxTree {

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

    // TODO: temp testing... traverse AST again, converting BindingLists-->Modules, and ImportExprs-->Indetifiers + remove ParenthesisedExprs
    const sourceFileModules = Object.entries(sourceFilesByPath).reduce(
        (program, [sourceFilePath, {bindings: sourceFileBindings}]) => {
            const bindings = sourceFileBindings.map(binding => mapNode(binding, rec => ({
                BindingList: (bindingList): Module => {
                    let module = convertBindingListToModule(bindingList.bindings);
                    return {...module, bindings: mapObj(module.bindings, rec)};
                },
                ImportExpression: ({moduleSpecifier}): Identifier => {
                    const path = resolveModuleSpecifier(moduleSpecifier, sourceFilePath);
                    return {kind: 'Identifier', name: moduleNamesBySourceFilePath[path]};
                },
                ParenthesisedExpression: par => rec(par.expression),
            })));
            const moduleName = moduleNamesBySourceFilePath[sourceFilePath];
            program[moduleName] = convertBindingListToModule(bindings);
            return program;
        },
        {} as Record<string, Module>
    );

    // TODO: temp testing...
    const ast: AbstractSyntaxTree = {
        bindings: {
            ...sourceFileModules,
            start: {
                kind: 'MemberExpression',
                module: {kind: 'Identifier', name: moduleNamesBySourceFilePath[startPath]},
                member: {kind: 'Identifier', name: 'start'},
            },
        },
    };

    // In debug mode, ensure only allowed node kinds are present in the representation.
    if (isDebugMode()) {
        for (let n of Object.values(ast.bindings)) {
            traverseNode(n, n => assert(abstractSyntaxTreeNodeKinds.matches(n)));
        }
    }

    return ast;
}
