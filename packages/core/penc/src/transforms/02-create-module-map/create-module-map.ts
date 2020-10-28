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
            modulesById.set(module.moduleId, module);
        }
        else {
            // The file is a PEN source file. Parse it to generate a Module AST node.
            let module = parsePenSource(sourceText, {sourceFile});
            let parentModuleIds = [module.moduleId];
            modulesById.set(module.moduleId, null!); // set placeholder now to keep map entries in depth-first preorder

            // Hoist any inline module expressions out of the AST and into the top-level module map.
            // This is done by replacing each ModuleExpression node with an equivalent ImportExpression node.
            module = mapNode(module, rec => ({
                ModuleExpression: (mex): ImportExpression => {
                    modulesById.set(mex.module.moduleId, null!); // set placeholder now to keep map entries in depth-first preorder
                    let parentModuleId = parentModuleIds[parentModuleIds.length - 1];
                    parentModuleIds.push(mex.module.moduleId);
                    let {moduleId, bindings} = rec(mex.module);
                    parentModuleIds.pop();
                    let module: Module = {kind: 'Module', moduleId, parentModuleId, bindings};
                    modulesById.set(moduleId, module); // update placeholder to proper value
                    return {kind: 'ImportExpression', moduleSpecifier: moduleId, moduleId};
                },
            }));
            modulesById.set(module.moduleId, module); // update placeholder to proper value
        }
    }
    return {
        modulesById,
        startModuleId: `file://${sourceFileGraph.mainPath}`,
    };
}
