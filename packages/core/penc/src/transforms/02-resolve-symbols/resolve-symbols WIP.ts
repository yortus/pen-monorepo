import {allNodeKinds, Expression, Identifier, GenericExpression, moduleFromBindingList} from '../../ast-nodes';
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
    const {createScope, define, allSymbols, getScopeFor, getSurroundingScope, lookup} = createSymbolTable();
    const rootScope = createScope();


    // TODO: temp testing...
    internalResolve({
        fn: {
            kind: 'GenericExpression',
            param: {kind: 'ModulePattern', names: []},
            body: {kind: 'MemberExpression', module: ast.module, member: {kind: 'Identifier', name: 'start'}},
        },
        arg: {kind: 'Module', bindings: {}},
        env: undefined,
    });

    // TODO: add the special 'start' symbol
    allSymbols['start'] = {
        globalName: 'start',
        value: {
            kind: 'Identifier',
            name: lookup(rootScope, 'ENTRYPOINT').globalName, // TODO: fix magic string ENTRYPOINT
        }
    };

    ast = {
        module: {
            kind: 'Module',
            bindings: mapObj(allSymbols, symbol => symbol.value),
        },
    };
    validateAST(ast, outputNodeKinds);
    return ast;


    // TODO: temp testing...
    function internalResolve({fn, arg, env}: {fn: GenericExpression, arg: Expression, env?: Scope}) {

        // TODO: step 0 - synthesize a module expression
        const topMod = moduleFromBindingList({
            kind: 'BindingList',
            bindings: [
                {
                    kind: 'Binding',
                    left: fn.param,
                    right: arg,
                },
                {
                    kind: 'Binding',
                    left: {kind: 'Identifier', name: 'ENTRYPOINT'}, // TODO: make&use namegen util to ensure no clashes with names in other binding
                    right: fn.body,
                },
            ],
        });

        // STEP 1: Traverse the AST, creating a scope for each module, and a symbol for each binding name/value pair.
        /*const topMod2 =*/ mapNode(topMod, rec => ({
            GenericExpression: gen => {
                // TODO: ...
                console.log(`GENERIC!`);
                return gen; // NB: don't recurse inside
            },
            InstantiationExpression: inst => {
                // TODO: leave the InstantiationExpression in place until the next step...
                console.log(`INSTANTIATION!`);
                return {...inst, generic: rec(inst.generic), argument: rec(inst.argument)};
            },
            Module: module => {
                // Create a scope for the module, or use `rootScope` if this is the top-level module.
                env = env ? createScope(env) : rootScope;

                // Create a symbol for each local name in the module.
                let bindings = {} as Record<string, Identifier>;
                for (const [name, expr] of Object.entries(module.bindings)) {
                    const {globalName} = define(env, name, rec(expr));
                    bindings[name] = {kind: 'Identifier', name: globalName};
                }

                // Pop back out to the surrounding scope before returning.
                env = getSurroundingScope(env)!;
                return {kind: 'Module', bindings};
            },
        }));

        // STEP 2: Resolve all Identifier nodes (except MemberExpression#member - that is resolved in STEP 3)
        //!!!
        // BUG: on recursive re-entry here, the shared `allSymbols` var has more than we want to iterate over here
        // - we actually only need to recurse over the input node again, eg `synthMod2`
        // - but we also need to track the scopes again too, same scopes as in STEP 1. How? 
        // const topMod3 = mapNode(topMod2, rec => ({
        //     Identifier: ({name}): Identifier => {
        //         const {globalName} = lookup(scope, name);
        //         return {kind: 'Identifier', name: globalName};
        //     },
        //     MemberExpression: mem => {
        //         const memᐟ = {...mem, module: rec(mem.module)};
        //         return memᐟ;
        //     },
        //     Module: mod => mod, // TODO: explain why skip modules - they are already processed in STEP 1 (all binding vals are Ids whose names are globalNames)
        // }));

        // TODO: was...
        for (let symbol of Object.values(allSymbols)) {
            if (symbol.value.kind === 'Module') continue;

            // TODO: temp testing...
            if (symbol.value.kind === 'GenericExpression') continue;

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

            // TODO: temp testing...
            if (symbol.value.kind === 'GenericExpression') continue;

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


        // // TODO: temp testing...
        // for (let symbol of Object.values(allSymbols)) {
        //     // TODO: temp testing...
        //     if (symbol.value.kind === 'GenericExpression') continue;

        //     const newValue = mapNode(symbol.value, rec => ({
        //         InstantiationExpression: ({generic, argument}) => {
        //             generic = rec(generic);
        //             const arg = rec(argument);
        //             assert(generic.kind === 'Identifier');
        //             const {value: fn} = allSymbols[generic.name];
        //             assert(fn.kind === 'GenericExpression');

        //             // TODO: recurse...
        //             internalResolve({fn, arg, env});

        //             console.log(`CALL2!   func=ID ${generic.name}   arg=${argument.kind}`);
        //             return {kind: 'InstantiationExpression', generic, argument};
        //         },
        //         GenericExpression: func => {
        //             // TODO: ...
        //             console.log(`FUNC!`);
        //             return func; // NB: don't recurse inside
        //         },
        //     }));
        //     Object.assign(symbol, {value: newValue}); // TODO: messy overwrite of readonly prop - better/cleaner way?
        // }




    }
}


/** List of node kinds that may be present in the input AST. */
const inputNodeKinds = allNodeKinds.without(
    'Binding',
    'BindingList',
    'ImportExpression',
    // TODO: was... but GenericExpr#param may be this kind... 'ModulePattern',
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
