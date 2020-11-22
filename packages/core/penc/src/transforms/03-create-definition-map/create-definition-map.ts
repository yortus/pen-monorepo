import type {Binding, Expression, MemberExpression, Module, Reference} from '../../abstract-syntax-trees';
import {mapNode, traverseNode} from '../../abstract-syntax-trees';
import {DefinitionMap, definitionMapKinds, ModuleMap} from '../../representations';
import {assert} from '../../utils';
import {createDereferencer} from './create-dereferencer';
import {createNodeHasher} from './create-node-hasher';
import {createSymbolTable} from './symbol-table';


// TODO: doc... after this transform, the following node kinds will no longer be present anywhere in the AST:
// - LocalMultiBinding
export function createDefinitionMap({modulesById}: ModuleMap): DefinitionMap {
    const {createScope, define, definitions, lookup} = createSymbolTable();

    // Define a root scope.
    const ROOT_MODULE_ID = '@@root'; // TODO: ensure can never clash with any identifier name or moduleId
    createScope(ROOT_MODULE_ID);

    // Traverse each module, creating a scope for the module, and one or more definitions for each binding.
    for (let {moduleId, parentModuleId, bindings} of Object.values(modulesById)) {
        // Create a scope for the module.
        createScope(moduleId, parentModuleId ?? ROOT_MODULE_ID);

        // Create a definition for each local name in the module.
        let newBindings: Binding[] = [];
        for (let {left, right, exported} of bindings) {
            // For a simple `name = value` binding, create a single definition.
            if (left.kind === 'Identifier') {
                const {definitionId} = define(left.name, moduleId, right);
                newBindings.push({kind: 'Binding', left, right: {kind: 'Reference', definitionId}, exported});
            }

            // For a destructured `{a, b} = module` binding, create a definition for each name in the lhs.
            else /* left.kind === 'ModulePattern' */ {
                for (let {name, alias} of left.names) {
                    let expr: MemberExpression = {
                        kind: 'MemberExpression',
                        module: right,
                        member: {kind: 'Identifier', name},
                    };
                    const {definitionId} = define(alias ?? name, moduleId, expr);
                    newBindings.push({
                        kind: 'Binding',
                        left: {kind: 'Identifier', name},
                        right: {kind: 'Reference', definitionId},
                        exported,
                    });
                }
            }
        }

        // Create a definition for the module itself.
        // TODO: better to make this appear *before* its bindings defns in the defns array?
        // - or just use a map (eg with string keys) instead of ints for defnIds? Why use ints? No reason really except easily unique
        define(moduleId, ROOT_MODULE_ID, {kind: 'Module', moduleId, parentModuleId, bindings: newBindings});
    }

    // Resolve all Identifier nodes (except MemberExpression#member - that is resolved next)
    for (let def of definitions) {
        // TODO: messy special treatment of 'module' defns... cleaner way?
        if (def.value.kind === 'Module') continue;

        const newValue = mapNode(def.value, rec => ({
            Identifier: ({name}): Reference => {
                const {definitionId} = lookup(name, def.moduleId);
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
    for (let def of definitions) {
        // TODO: messy special treatment of 'module' defns... cleaner way?
        if (def.value.kind === 'Module') continue;

        const newValue = mapNode(def.value, rec => ({
            MemberExpression: ({module, member}): Reference => {
                let lhs: Expression | Module = module;
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
                assert(lhs.kind === 'Module');
                const {definitionId} = lookup(member.name, lhs.moduleId);
                return {kind: 'Reference', definitionId};
            },
        }));
        Object.assign(def, {value: newValue}); // TODO: messy overwrite of readonly prop - better/cleaner way?
    }


    // CHECKPOINT:
    // - there are no more Identifier* or MemberExpression nodes in definitions (* EXCEPT... see next comment)
    // - some references may point to Module nodes. Eg as arg of ApplicationExpression


    // TODO: allowed node kinds says there should be no Module or Identifier node kinds in the definitionMap.
    // - we still have Module nodes, and they can be referenced from expressions (eg std, xxx in compile-test)
    // - we still have Identifier nodes, but only in the Binding#left within Module nodes


    const deref = createDereferencer(definitions);
    const hashNode = createNodeHasher(deref);

    const defnHashes = definitions.reduce((obj, def) => {
        // TODO: temp testing...
        const node = def.value;
        assert(node.kind !== 'Identifier');
        assert(node.kind !== 'ModuleExpression');
        const hash = hashNode(node);
        obj[hash] ??= [];
        obj[hash].push(def.localName);
        return obj;
    }, {} as Record<string, string[]>);
    [] = [defnHashes];




    // TODO: temp testing... get this working
    if (1 + 1 !== 2) {
        traverseNode(null!, n => assert(definitionMapKinds.matches(n)));
    }

    if (1 !== 1 + 1) return null!;

    return null!; /*{
        definitions,
        startSomething: '????',
    };*/
}
