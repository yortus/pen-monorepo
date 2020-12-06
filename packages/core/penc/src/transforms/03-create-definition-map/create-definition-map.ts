import type {Reference} from '../../abstract-syntax-trees';
import {mapNode} from '../../abstract-syntax-trees';
import type {DefinitionMap, ModuleMap} from '../../representations';
import {assert} from '../../utils';
import {createSymbolTable, Scope} from './symbol-table';


// TODO: jsdoc...
// - takes a single startExpression
// - resolves all identifiers and member lookups
// - outputs a collection of definitions, with References
// - output contains *no* Identifiers or MemberExpressions
export function createDefinitionMap({startExpression}: ModuleMap): DefinitionMap {
    const {createScope, define, definitions, getScopeFor, lookup} = createSymbolTable();

    // Traverse the AST, creating a scope for each module, and a definition for each binding name/value pair.
    const rootScope = createScope();
    const surroundingScopes: Scope[] = [];
    const rootModule = mapNode(startExpression.module.module, rec => ({
        Module: module => {
            // Create a scope for the module.
            const surroundingScope: Scope | undefined = surroundingScopes[surroundingScopes.length - 1];
            const scope = surroundingScope ? createScope(surroundingScope) : rootScope;

            // Create a definition for each local name in the module.
            assert(!Array.isArray(module.bindings));
            let bindings = {} as Record<string, Reference>;
            surroundingScopes.push(scope);
            for (const [name, expr] of Object.entries(module.bindings)) {
                const {definitionId} = define(scope, name, rec(expr));
                bindings[name] = {kind: 'Reference', definitionId};
            }
            surroundingScopes.pop();
            return {kind: 'Module', bindings};
        },
    }));
    assert(rootModule.kind === 'Module'); // TODO: need this? remove?

    // Resolve all Identifier nodes (except MemberExpression#member - that is resolved next)
    for (let def of Object.values(definitions)) {
        const scope = getScopeFor(def);
        const newValue = mapNode(def.value, rec => ({
            Identifier: ({name}): Reference => {
                const {definitionId} = lookup(scope, name);
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

    // TODO: this is mega awkward unclear extra work due to the ModuleMap type - would be better if that just returned something that made this simpler?
    const startModuleDefn = lookup(rootScope, startExpression.module.member.name);
    assert(startModuleDefn.value.kind === 'Module');
    assert(!Array.isArray(startModuleDefn.value.bindings));
    const startRef = startModuleDefn.value.bindings[startExpression.member.name];
    assert(startRef.kind === 'Reference');
    const startDefinitionId = startRef.definitionId;

    return {
        definitionsById: definitions,
        startDefinitionId,
    };
}
