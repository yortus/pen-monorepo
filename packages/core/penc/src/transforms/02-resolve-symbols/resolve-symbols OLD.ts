import {allNodeKinds, Identifier, MemberExpression} from '../../ast-nodes';
import {mapNode} from '../../ast-nodes';
import {AST, validateAST} from '../../representations';
import {assert, mapObj} from '../../utils';
import {createSymbolTable, Scope} from './symbol-table';


// TODO: jsdoc...
// - resolves all identifiers and member lookups
// - outputs the program as a single module (ie flat list of bindings)
// - all Identifiers refer to binding names in the single module
// - output contains *no* MemberExpressions (well it could actually, via extensions)
export function resolveSymbols(ast: AST): AST {
    validateAST(ast, inputNodeKinds);
    const {createScope, define, allSymbols, getSurroundingScope, lookup} = createSymbolTable();
    const rootScope = createScope();

    // STEP 1: Traverse the AST, creating a scope for each module, and a symbol for each binding name/value pair.
    let env: Scope | undefined;
    // TODO: temp testing...
    const identifiers = new Map<Identifier, Scope>();
    const memberExprs = [] as MemberExpression[]; 
    mapNode(ast.module, rec => ({ // NB: top-level return value isn't needed, since everything has a symbol by then.
        Identifier: id => {
            // TODO: explain tracking...
            assert(env);
            identifiers.set(id, env);
            return id;
        },
        MemberExpression: mem => {
            // TODO: explain tracking...
            const memᐟ = {...mem, module: rec(mem.module)}; // TODO: explain why: don't visit `member` for now
            memberExprs.push(memᐟ);
            return memᐟ;
        },
        Module: module => {
            // Create a scope for the module, or use `rootScope` if this is _the_ top-level module.
            env = env ? createScope(env) : rootScope;

            // Create a symbol for each local name in the module.
            let bindings = {} as Record<string, Identifier>;
            for (const [name, expr] of Object.entries(module.bindings)) {
                const {globalName} = define(env, name, rec(expr));
                bindings[name] = {kind: 'Identifier', name: globalName};
            }

            // Pop back out to the surrounding scope before returning.
            env = getSurroundingScope(env);
            return {kind: 'Module', bindings};
        },
    }));

    // STEP 2: Resolve all Identifier nodes (except MemberExpression#member - that is resolved in STEP 3)
    for (let [id, scope] of identifiers) {
        const {globalName} = lookup(scope, id.name);
        Object.assign(id, {name: globalName}); // TODO: messy overwrite of readonly prop - better/cleaner way?
    }

    // STEP 3: Resolve all MemberExpression nodes
    for (let mem of memberExprs) {
        let lhs = mem.module;
        while (lhs.kind === 'Identifier') lhs = allSymbols[lhs.name].value; // TODO: could this loop infinitely?
        assert(lhs.kind !== 'MemberExpression'); // TODO: explain... Since nested MemExprs are always resolved before outer ones due to them being added to the array depth-first

        // Lookup the name in the lhs Module. This lookup is different to an Identifier lookup, in that the name
        // must be local in the lhs Module, whereas Identifier lookups also look through the outer scope chain.
        assert(lhs.kind === 'Module');
        const id = lhs.bindings[mem.member.name];
        if (!id) throw new Error(`'${mem.member.name}' is not defined`); // TODO: improve diagnostic message eg line+col
        assert(id.kind === 'Identifier');
        Object.assign(mem, id); // TODO: messy overwrite of readonly prop - better/cleaner way?
    }

    // TODO: add the special 'start' symbol
    allSymbols['start'] = {
        globalName: 'start',
        value: {kind: 'Identifier', name: lookup(rootScope, 'start').globalName},
        scope: rootScope,
    };

    ast = {
        module: {
            kind: 'Module',
            bindings: mapObj(allSymbols, symbol => symbol.value),
        },
    };
    validateAST(ast, outputNodeKinds);
    return ast;
}


/** List of node kinds that may be present in the input AST. */
const inputNodeKinds = allNodeKinds.without(
    'Binding',
    'BindingList',
    'ImportExpression',
    'ModulePattern',
    'ParenthesisedExpression',
);


/** List of node kinds that may be present in the output AST. */
const outputNodeKinds = allNodeKinds.without(
    'Binding',
    'BindingList',
    'ImportExpression',
    'MemberExpression', // TODO: but this _could_ still be present given extensions, right? Then input===output kinds
    'ModulePattern',
    'ParenthesisedExpression',
);
