import type {Reference} from '../../abstract-syntax-trees';
import {mapNode} from '../../abstract-syntax-trees';
import type {DefinitionMap, ModuleMap} from '../../representations';
import {assert} from '../../utils';
import {createSymbolTable, ROOT_MODULE_ID} from './symbol-table';


// TODO: jsdoc...
// - takes a collection of modules
// - resolves all identifiers and member lookups
// - outputs a collection of definitions, with References
// - output contains *no* Identifiers or MemberExpressions
export function createDefinitionMap({modulesById, parentModuleIdsByModuleId, startModuleId}: ModuleMap): DefinitionMap {
    const {createScope, define, definitions, lookup} = createSymbolTable();

    // Traverse each module, creating a scope for the module, and one or more definitions for each binding.
    for (const [moduleId, {bindings}] of Object.entries(modulesById)) {
        const parentModuleId = parentModuleIdsByModuleId[moduleId];

        // Create a scope for the module.
        createScope(moduleId, parentModuleId);

        // Create a definition for each local name in the module.
        let bindingReferences = {} as Record<string, Reference>;
        assert(!Array.isArray(bindings)); // TODO: can remove this check? Should always be the Record form here
        for (let name of Object.keys(bindings)) {
            const {definitionId} = define(moduleId, name, bindings[name]);
            bindingReferences[name] = {kind: 'Reference', definitionId};
        }

        // Create a definition for the module itself, since it can also be a referenced directly.
        // TODO: better to make this appear *before* its bindings defns in the defns array?
        // - or just use a map (eg with string keys) instead of ints for defnIds? Why use ints? No reason really except easily unique
        define(ROOT_MODULE_ID, moduleId, {kind: 'Module', bindings: bindingReferences});
    }

    // Resolve all Identifier nodes (except MemberExpression#member - that is resolved next)
    for (let def of Object.values(definitions)) {
        const newValue = mapNode(def.value, rec => ({
            Identifier: ({name}): Reference => {
                const {definitionId} = lookup(def.moduleId, name);
                return {kind: 'Reference', definitionId};
            },
            MemberExpression: mem => {
                const memᐟ = {...mem, module: rec(mem.module)};
                return memᐟ;
            },
        }));
        Object.assign(def, {value: newValue}); // TODO: messy overwrite of readonly prop - better/cleaner way?
    }

    // Resolve all MemberExpression nodes
    for (let def of Object.values(definitions)) {
        const newValue = mapNode(def.value, rec => ({
            MemberExpression: ({module, member}): Reference => {
                let lhs = module;
                while (true) {
                    if (lhs.kind === 'Reference') {
                        lhs = definitions[lhs.definitionId].value;
                    }
                    else if (lhs.kind === 'MemberExpression') {
                        lhs = rec(lhs);
                    }
                    else {
                        break;
                    }
                }
                // Lookup the name in the lhs Module. This lookup is different to an Identifier lookup, in that the name
                // must be local in the lhs Module, whereas Identifier lookups also look through the outer scope chain.
                assert(lhs.kind === 'Module');
                assert(!Array.isArray(lhs.bindings));
                const ref = lhs.bindings[member.name];
                if (!ref) throw new Error(`'${member.name}' is not defined`); // TODO: improve diagnostic message eg line+col
                assert(ref.kind === 'Reference');
                return {...ref};
            },
        }));
        Object.assign(def, {value: newValue}); // TODO: messy overwrite of readonly prop - better/cleaner way?
    }

    // TODO: in debug mode, ensure only allowed node kinds are present in the representation
    // traverseNode(null!, n => assert(definitionMapKinds.matches(n)));

    const startDefinition = lookup(startModuleId, 'start'); // TODO: want different error message if this fails?
    return {
        definitionsById: definitions,
        startDefinitionId: startDefinition.definitionId,
    };
}
