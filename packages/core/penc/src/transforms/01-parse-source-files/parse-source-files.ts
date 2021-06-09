import * as fs from 'fs';
import {makeNodeMapper, traverseNode, V, validateAST} from '../../representations';
import {AbsPath, assert, isExtension, resolveModuleSpecifier} from '../../utils';
import {bindingListToBindingMap} from './binding-list-to-binding-map';
import {createModuleNameGenerator} from './create-module-name-generator';
import {parseExtFile, parsePenFile} from './grammars';


/**
 * Creates the AbstractSyntaxTree representation for the PEN program specified by `options.main`. Finds the transitive
 * closure of all source files comprising the program by parsing each source file and analysing each encountered
 * `ImportExpression` to determine whether more source files need to be included in the SourceFileMap representation.
 * @param options.main absolute file path to the main source file for the PEN program.
 */
export function parseSourceFiles(options: {main: AbsPath} | {text: string}): V.AST<200> {
    const INLINE_MAIN = AbsPath('text://inline');
    const main = 'main' in options ? options.main : INLINE_MAIN;
    const mainText = 'text' in options ? options.text : '';

    // TODO: temp testing... explain each of these
    const sourceFileModulesByPath: Record<string, V.Module<100>> = {};
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
        const sourceFileModule = parse(sourceText, {path: sourceFilePath});
        validateAST({version: 100, start: sourceFileModule});
        sourceFileModulesByPath[sourceFilePath] = sourceFileModule;

        // Visit every ImportExpression, adding the imported path to `unprocessedPaths`.
        traverseNode(sourceFileModule, n => {
            if (n.kind !== 'ImportExpression') return;
            const importPath = resolveModuleSpecifier(n.moduleSpecifier, sourceFilePath);
            unprocessedPaths.push(importPath);
        });
    }

    // TODO: temp testing... traverse AST again...
    let functionParameterCounter = 0;
    const sourceFileModulesByModuleName = Object.entries(sourceFileModulesByPath).reduce(
        (acc, [sourceFilePath, sourceFileModule]) => {
            const moduleName = moduleNamesBySourceFilePath[sourceFilePath];
            const moduleNode = mapNode(sourceFileModule, rec => ({

                // for all FunctionExpression#param: replace Identifer|Pattern --> string
                FunctionExpression: ({param, body}): V.FunctionExpression<200> => {
                    // Use parameter names like 'ℙnnn' to ensure no clash with program identifiers.
                    // TODO: but that could be a valid id in future... ensure *can't* clash
                    // TODO: doc... param name also must be unique across all funexprs in the program
                    const paramName = `ℙ${++functionParameterCounter}`;
                    return {
                        kind: 'FunctionExpression',
                        param: paramName,
                        body: {
                            kind: 'LetExpression',
                            expression: rec(body),
                            bindings: bindingListToBindingMap([{
                                kind: 'Binding',
                                left: param,
                                right: {kind: 'FunctionParameter', name: paramName}
                            }], rec),
                        },
                    };
                },

                // for all ImportExpression: replace ImportExpression --> Identifier
                ImportExpression: ({moduleSpecifier}): V.Identifier => {
                    const path = resolveModuleSpecifier(moduleSpecifier, sourceFilePath);
                    return {kind: 'Identifier', name: moduleNamesBySourceFilePath[path]};
                },

                // for all LetExpression#bindings: replace BindingList --> BindingMap
                LetExpression: (le): V.LetExpression<200> => ({
                    kind: 'LetExpression',
                    expression: rec(le.expression),
                    bindings: bindingListToBindingMap(le.bindings, rec),
                }),

                // for all Module#bindings: replace BindingList --> BindingMap
                Module: (mod): V.Module<200> => ({
                    kind: 'Module',
                    bindings: bindingListToBindingMap(mod.bindings, rec),
                }),

                // for all ParenthesisedExpression: remove parens
                ParenthesisedExpression: par => rec(par.expression),

                // for all StringExpression: convert to Sequence of StringLiteral/ByteExpression/Expression
                StringExpression: ({subkind, items}) => {
                    const expressions = items.map(item => {
                        if (typeof item === 'string') {
                            const expr: V.StringLiteral<200> = {kind: 'StringLiteral', subkind, value: item};
                            return expr;
                        }
                        else if (Array.isArray(item)) {
                            const [min, max] = item;
                            const expr: V.ByteExpression<200> = {kind: 'ByteExpression', subkind, include: [min === max ? min : [min, max]], default: item[0]};
                            return expr;
                        }
                        else {
                            return rec(item);
                        }
                    });
                    return expressions.length === 1 ? expressions[0] : {kind: 'SequenceExpression', expressions};
                },
            }));
            assert(moduleNode.kind === 'Module');
            acc[moduleName] = moduleNode;
            return acc;
        },
        {} as Record<string, V.Module<200>>
    );

    // TODO: temp testing...
    const mainModuleName = moduleNamesBySourceFilePath[startPath];
    const ast: V.AST<200> = {
        version: 200,
        start: {
            kind: 'MemberExpression',
            module: {
                kind: 'MemberExpression',
                module: {
                    kind: 'Module',
                    bindings: sourceFileModulesByModuleName,
                },
                member: mainModuleName,
            },
            member: 'start',
        },
    };

    // TODO: doc/validate/type: important that 'main' module remains a module and not xformed into a LetExpr here, since
    //       another source file may import it and its bindings. If it was a LetExpr, the bindings would be inaccessible

    validateAST(ast);
    return ast;
}


// TODO: temp testing...
const mapNode = makeNodeMapper<100, 200>();
