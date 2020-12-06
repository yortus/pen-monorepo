import {Binding, Expression, Identifier, mapNode, Module} from '../../abstract-syntax-trees';
import type {SourceFileMap, ModuleMap} from '../../representations';
import {mapObj, resolveModuleSpecifier} from '../../utils';


// TODO CHANGES:
// - synthesize a single 'root' module
// - give it a 'start' binding
// - add each SourceFile to it as a binding, with names from createModuleIdGenerator
//   - so no more SourceFile nodes in output
// - traverse whole ast and replace each ImportExpression with an Identifier to a binding in the root module
//   - so no more ImportExpression nodes in output
// - return a single MemberExpression representing the whole program (ie rootModule.start)


// TODO: jsdoc...
// - takes a collection of source files
// - converts all nested Modules and ImportExpressions to Identifiers
// - outputs a flat map of all modules, both from SourceFiles and from nested modules
// - output no longer containes _nested_ modules (all modules are top-level in the ModuleMap)
// - output contains _no_ bindings (ie all Modules use the Record<> form of bindings)
export function createModuleMap({sourceFilesByPath, startPath}: SourceFileMap): ModuleMap {

    // TODO: temp testing...
    const genModuleId = createModuleIdGenerator();
    const moduleIdsBySourceFilePath: Record<string, string> = {};
    for (let path of Object.keys(sourceFilesByPath)) {
        moduleIdsBySourceFilePath[path] = genModuleId(path);
    }
    // const rootModule: Module = {
    //     kind: 'Module',
    //     bindings: Object.keys(sourceFilesByPath).map(path => ({
    //         kind: 'Binding',
    //         left: {kind: 'Identifier', name: moduleIdsBySourceFilePath[path]},
    //         right: {kind: 'Module', ...sourceFilesByPath[path]},
    //     })),
    // };
    // const startExpression: Expression = {
    //     kind: 'MemberExpression',
    //     module: {
    //         kind: 'MemberExpression',
    //         module: rootModule,
    //         member: {kind: 'Identifier', name: moduleIdsBySourceFilePath[startPath]},
    //     },
    //     member: {kind: 'Identifier', name: 'start'},
    // };
    






    const modulesById: Record<string, Module> = {};
    const parentModuleIdsByModuleId: Record<string, string> = {};
    for (let [filePath, file] of Object.entries(sourceFilesByPath)) {

        // TODO: temp fix this... next transform depends on parent modules coming before their nested modules
        // when iterating over the KVPs in modulesById... this placeholder guarantees that iteration order.
        // Better to fix transforms to not depend on ordering - should build an order using the parentModuleIdsByModuleId data.
        modulesById[moduleIdsBySourceFilePath[filePath]] = {} as never;

        // Hoist any inline module expressions out of the AST and into the module map.
        // In this process, each nested Module node is replaced with an equivalent Identifier node.
        let parentModuleIds = [moduleIdsBySourceFilePath[filePath]];
        let bindings = file.bindings.map(binding => mapNode(binding, rec => ({
            Module: (modExpr): Identifier => {
                let nestedModuleId = genModuleId(filePath, 'modexpr');
                let parentModuleId = parentModuleIds[parentModuleIds.length - 1];
                parentModuleIdsByModuleId[nestedModuleId] = parentModuleId;
                let nestedModule: Module = {kind: 'Module', bindings: {}};
                modulesById[nestedModuleId] = nestedModule;

                // TODO: recurse...
                parentModuleIds.push(nestedModuleId);
                let bindings = Array.isArray(modExpr.bindings) ? convertBindings(modExpr.bindings) : modExpr.bindings;
                bindings = mapObj(bindings, rec);
                Object.assign(nestedModule, {bindings}); // TODO: nasty rewrite of readonly, fix
                parentModuleIds.pop();

                return {
                    kind: 'Identifier',
                    name: nestedModuleId,
                };
            },

            // TODO: ImportExpression...
            ImportExpression: ({moduleSpecifier}): Identifier => {
                const path = resolveModuleSpecifier(moduleSpecifier, filePath);
                return {
                    kind: 'Identifier',
                    name: moduleIdsBySourceFilePath[path],
                };
            },
        })));

        // Add a module to the module map for the source file itself.
        const module: Module = {kind: 'Module', bindings: convertBindings(bindings)};
        modulesById[moduleIdsBySourceFilePath[filePath]] = module;
    }

    // TODO: in debug mode, ensure only allowed node kinds are present in the representation
    // traverseNode(null!, n => assert(moduleMapKinds.matches(n)));

    return {
        modulesById,
        parentModuleIdsByModuleId,
        startModuleId: moduleIdsBySourceFilePath[startPath],
    };
}


// TODO: temp testing...
function createModuleIdGenerator() {
    const moduleIds: string[] = [];
    return function generateModuleId(modulePath = '', suffix?: string) {
        let name = modulePath
            .split(/\/+|\\+/) // split on segment delimiters / and \
            .map(s => s.substring(0, s.indexOf('.')) || s) // remove extensions
            .reverse() // reverse the order of the segments
            .concat('module') // add a fallback name to guarantee the result is not undefined
            .filter(seg => seg && seg !== 'index') // remove empty and 'index' segments
            .shift()! // take the first segment
            .replace(/^[0-9]+/g, '') // remove leading digits, if any
            .replace(/[^a-zA-Z0-9𝕊]/g, '_'); // replace all non-alphanumeric chars with '_'
    
        // Prefix moduleId with 'Ɱ_' to ensure it cannot clash with program identifiers.
        // TODO: but that could be a valid id in future... ensure *can't* clash
        // Also add the suffix if one was supplied.
        name = `Ɱ_${name}`;
        if (suffix) name = `${name}_${suffix}`;

        // Ensure no duplicate moduleIds are generated by adding a numeric suffix where necessary.
        let result = name;
        let counter = 1;
        while (moduleIds.includes(result)) result = `${name}${++counter}`;
        moduleIds.push(result);
        return result;
    }
}


// TODO: temp testing...
function convertBindings(bindings: readonly Binding[]): {readonly [name: string]: Expression} {
    const result = {} as {[name: string]: Expression};
    for (let {left, right} of bindings) {
        if (left.kind === 'Identifier') {
            if (result.hasOwnProperty(left.name)) {
                // TODO: improve diagnostic message eg line+col
                new Error(`'${left.name}' is already defined`);
            }
            result[left.name] = right;
        }
        else /* left.kind === 'ModulePattern */ {
            for (let {name, alias} of left.names) {
                if (result.hasOwnProperty(alias || name)) {
                    // TODO: improve diagnostic message eg line+col
                    new Error(`'${alias || name}' is already defined`);
                }
                result[alias || name] = {
                    kind: 'MemberExpression',
                    module: right,
                    member: {kind: 'Identifier', name},
                };
            }
        }
    }
    return result;
}
