import type {Identifier} from '../../ast-nodes';
import {mapNode} from '../../ast-nodes';
import type {DefinitionMap, AbstractSyntaxTree} from '../../representations';
import {assert, mapObj} from '../../utils';
import {createSymbolTable, Scope} from './symbol-table';


// TODO: jsdoc...
// - takes a single startExpression
// - resolves all identifiers and member lookups
// - outputs a collection of bindings
// - all Identifiers refer to binding names
// - output contains *no* MemberExpressions (well it could actually, via extensions)
export function createDefinitionMap(ast: AbstractSyntaxTree): DefinitionMap {
    const {createScope, define, allSymbols, getScopeFor, lookup} = createSymbolTable();

    // STEP 1: Traverse the AST, creating a scope for each module, and a symbol for each binding name/value pair.
    const rootScope = createScope();
    const surroundingScopes: Scope[] = [];
    mapNode({kind: 'Module', ...ast}, rec => ({ // NB: top-level return value isn't needed, since everything has a symbol by then.
        Module: module => {
            // Create a scope for the module.
            const surroundingScope: Scope | undefined = surroundingScopes[surroundingScopes.length - 1];
            const scope = surroundingScope ? createScope(surroundingScope) : rootScope;

            // Create a symbol for each local name in the module.
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
    for (let symbol of Object.values(allSymbols)) {
        if (symbol.value.kind === 'Module') continue;

        const scope = getScopeFor(symbol);
        const newValue = mapNode(symbol.value, rec => ({
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
        Object.assign(symbol, {value: newValue}); // TODO: messy overwrite of readonly prop - better/cleaner way?
    }

    // STEP 3: Resolve all MemberExpression nodes
    for (let symbol of Object.values(allSymbols)) {
        const newValue = mapNode(symbol.value, rec => ({
            MemberExpression: ({module, member}): Identifier => {
                let lhs = module;
                while (true) {
                    if (lhs.kind === 'Identifier') {
                        lhs = allSymbols[lhs.name].value;
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
        Object.assign(symbol, {value: newValue}); // TODO: messy overwrite of readonly prop - better/cleaner way?
    }

    // TODO: add the special 'start' symbol
    allSymbols['start'] = {
        globalName: 'start',
        value: {kind: 'Identifier', name: lookup(rootScope, 'start').globalName}
    };

    // TODO: in debug mode, ensure only allowed node kinds are present in the representation
    // traverseNode(null!, n => assert(definitionMapKinds.matches(n)));

    const bindings = mapObj(allSymbols, symbol => symbol.value);
    return {bindings} as DefinitionMap;
}
