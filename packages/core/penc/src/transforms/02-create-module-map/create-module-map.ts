import * as fs from 'fs';
import {ImportExpression, mapNode, Module} from '../../abstract-syntax-trees';
import type {SourceFileGraph, ModuleMap} from '../../representations';
import {isExtension} from '../../utils';
import {parse as parseExtension} from './extension-grammar';
import {parse as parsePenSource} from './pen-grammar';


// TODO: jsdoc...
export function createModuleMap(sourceFileGraph: SourceFileGraph): ModuleMap {
    const modulesById = new Map<string, Module>();
    for (let sourceFile of sourceFileGraph.sourceFiles.values()) {
        let sourceText = fs.readFileSync(sourceFile.path, 'utf8');
        if (isExtension(sourceFile.path)) {
            // The file is an extension (.pen.js) file. Parse it into a Module node and add it to the module map.
            let module = parseExtension(sourceText, {sourceFile});
            modulesById.set(module.id, module);
        }
        else {
            // The file is a PEN source file. Parse it to generate a Module AST node.
            let module = parsePenSource(sourceText, {sourceFile});

            // Hoist any inline module expressions out of the AST and into the top-level module map.
            // This is done by replacing each ModuleExpression node with an equivalent ImportExpression node.
            module = mapNode(module, rec => ({
                ModuleExpression: ({module}): ImportExpression => {
                    module = rec(module);
                    modulesById.set(module.id, module);
                    return {kind: 'ImportExpression', moduleSpecifier: module.id, moduleId: module.id};
                },
            }));
            modulesById.set(module.id, module);
        }
    }
    return {
        modulesById,
        startModuleId: `file://${sourceFileGraph.mainPath}`,
    };
}
