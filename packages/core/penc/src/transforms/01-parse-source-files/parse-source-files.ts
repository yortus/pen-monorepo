import * as fs from 'fs';
import {makeNodeMapper, normaliseModule, traverseNode, V, validateAST} from '../../representations';
import {AbsPath, assert, isExtension, resolveModuleSpecifier} from '../../utils';
import {createModuleNameGenerator} from './create-module-name-generator';
import {parseExtFile, parsePenFile} from './grammars';


/**
 * Creates the AbstractSyntaxTree representation for the PEN program specified by `options.main`. Finds the transitive
 * closure of all source files comprising the program by parsing each source file and analysing each encountered
 * `ImportExpression` to determine whether more source files need to be included in the SourceFileMap representation.
 * @param options.main absolute file path to the main source file for the PEN program.
 */
export function parseSourceFiles(options: {main: AbsPath} | {text: string}): V.AST<V.NORMAL> {
    const INLINE_MAIN = AbsPath('text://inline');
    const main = 'main' in options ? options.main : INLINE_MAIN;
    const mainText = 'text' in options ? options.text : '';

    // TODO: temp testing... explain each of these
    const sourceFilesByPath: Record<string, V.Module<V.RAW>> = {};
    const startPath = main === INLINE_MAIN ? INLINE_MAIN : resolveModuleSpecifier(main);
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
        const sourceText = sourceFilePath === INLINE_MAIN ? mainText : fs.readFileSync(sourceFilePath, 'utf8');
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
                ImportExpression: ({moduleSpecifier}): V.Identifier => {
                    const path = resolveModuleSpecifier(moduleSpecifier, sourceFilePath);
                    return {kind: 'Identifier', name: moduleNamesBySourceFilePath[path]};
                },
                Module: mod => {
                    let modᐟ = normaliseModule(mod, rec);
                    return modᐟ;
                },
                ParenthesisedExpression: par => rec(par.expression),
            }));
            assert(module.kind === 'Module');
            program[moduleName] = module;
            return program;
        },
        {} as Record<string, V.Module<V.NORMAL>>
    );

    // TODO: temp testing...
    const ast: V.AST<V.NORMAL> = {
        version: V.NORMAL,
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
    validateAST(ast);
    return ast;
}


// TODO: temp testing...
const mapNode = makeNodeMapper<V.RAW, V.NORMAL>();
