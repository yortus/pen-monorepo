import type {Identifier} from '../../ast-nodes';
import {mapNode} from '../../ast-nodes';
import type {DefinitionMap, AbstractSyntaxTree} from '../../representations';
import {assert} from '../../utils';
import {createSymbolTable, Scope} from './symbol-table';


// TODO: jsdoc...
// - takes a single startExpression
// - resolves all identifiers and member lookups
// - outputs a collection of definitions, with References
// - output contains *no* Identifiers or MemberExpressions
export function createDefinitionMap(ast: AbstractSyntaxTree): DefinitionMap {
    const {createScope, define, definitions, getScopeFor, lookup} = createSymbolTable();

    // STEP 1: Traverse the AST, creating a scope for each module, and a definition for each binding name/value pair.
    const rootScope = createScope();
    const surroundingScopes: Scope[] = [];
    mapNode({kind: 'Module', ...ast}, rec => ({ // NB: top-level return value isn't needed, since everything has a definition by then.
        Module: module => {
            // Create a scope for the module.
            const surroundingScope: Scope | undefined = surroundingScopes[surroundingScopes.length - 1];
            const scope = surroundingScope ? createScope(surroundingScope) : rootScope;

            // Create a definition for each local name in the module.
            let bindings = {} as Record<string, Identifier>;
            surroundingScopes.push(scope);
            for (const [name, expr] of Object.entries(module.bindings)) {
                const {globalName} = define(scope, name, rec(expr));
                bindings[name] = {kind: 'Identifier', name: globalName};
            }
            surroundingScopes.pop();
            return {kind: 'Module', bindings};
        },
    }));

    // STEP 2: Resolve all Identifier nodes (except MemberExpression#member - that is resolved in STEP 3)
    for (let def of Object.values(definitions)) {
        if (def.value.kind === 'Module') continue;

        const scope = getScopeFor(def);
        const newValue = mapNode(def.value, rec => ({
            Identifier: ({name}): Identifier => {
                const {globalName} = lookup(scope, name);
                return {kind: 'Identifier', name: globalName};
            },
            MemberExpression: mem => {
                const memᐟ = {...mem, module: rec(mem.module)};
                return memᐟ;
            },
            Module: mod => mod, // TODO: explain why skip modules - they are already processed in STEP 1 (all binding vals are Ids whose names are globalNames)
        }));
        Object.assign(def, {value: newValue}); // TODO: messy overwrite of readonly prop - better/cleaner way?
    }

    // STEP 3: Resolve all MemberExpression nodes
    for (let def of Object.values(definitions)) {
        const newValue = mapNode(def.value, rec => ({
            MemberExpression: ({module, member}): Identifier => {
                let lhs = module;
                while (true) {
                    if (lhs.kind === 'Identifier') {
                        lhs = definitions[lhs.name].value;
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
                const id = lhs.bindings[member.name];
                if (!id) throw new Error(`'${member.name}' is not defined`); // TODO: improve diagnostic message eg line+col
                assert(id.kind === 'Identifier');
                return {...id};
            },
        }));
        Object.assign(def, {value: newValue}); // TODO: messy overwrite of readonly prop - better/cleaner way?
    }

    // TODO: add the special 'start' definition
    definitions['start'] = {
        globalName: 'start',
        localName: 'start',
        value: {kind: 'Identifier', name: lookup(rootScope, 'start').globalName}
    };

    // TODO: in debug mode, ensure only allowed node kinds are present in the representation
    // traverseNode(null!, n => assert(definitionMapKinds.matches(n)));

    return {definitions};
}
