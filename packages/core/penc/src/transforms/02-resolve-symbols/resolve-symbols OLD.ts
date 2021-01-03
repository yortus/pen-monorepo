import {allNodeKinds, moduleFromBindingList} from '../../ast-nodes';
import type {Expression, GenericExpression, Identifier, InstantiationExpression, MemberExpression} from '../../ast-nodes';
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

    // TODO: temp testing...
    const resolvedAst = internalResolve({
        gen: {
            kind: 'GenericExpression',
            param: {kind: 'ModulePattern', names: []},
            body: {kind: 'MemberExpression', module: ast.module, member: {kind: 'Identifier', name: 'start'}},
        },
        arg: {kind: 'Module', bindings: {}},
        env: undefined,
    });

    // TODO: add the special 'start' symbol
    // TODO: temp testing...
    assert(resolvedAst.kind === 'Identifier' && resolvedAst.resolved);
    allSymbols['start'] = {globalName: 'start', value: resolvedAst, scope: rootScope};
    ast = {
        module: {kind: 'Module', bindings: mapObj(allSymbols, symbol => symbol.value)},
    };
    validateAST(ast, outputNodeKinds);
    return ast;

    // TODO: temp testing...
    function internalResolve({gen, arg, env}: {gen: GenericExpression, arg: Expression, env?: Scope}) {

        // TODO: step 0 - synthesize a module expression
        const startName = 'ENTRYPOINT'; // TODO: make&use namegen util to ensure no clashes with names in other binding
        const top: MemberExpression = {
            kind: 'MemberExpression',
            module: moduleFromBindingList({
                kind: 'BindingList',
                bindings: [
                    {kind: 'Binding', left: gen.param, right: arg},
                    {kind: 'Binding', left: {kind: 'Identifier', name: startName}, right: gen.body},
                ],
            }),
            member: {kind: 'Identifier', name: startName},
        };

        // STEP 1: Traverse the AST, creating a scope for each module, and a symbol for each binding name/value pair.
        const identifiers = new Map<Identifier, Scope>();
        const memberExprs = [] as MemberExpression[];
        const instantiations = new Map<InstantiationExpression, Scope>();
        const result = mapNode(top, rec => ({ // NB: top-level return value isn't needed, since everything has a symbol by then.
            GenericExpression: gen => {
                return gen; // NB: don't recurse inside
            },
            Identifier: id => {
                if (id.resolved) return id;

                // TODO: explain tracking...
                const idᐟ = {...id};
                assert(env);
                identifiers.set(idᐟ, env);
                return idᐟ;
            },
            InstantiationExpression: inst => {
                // TODO: leave the InstantiationExpression in place until the next step...
                const instᐟ = {...inst, generic: rec(inst.generic), argument: rec(inst.argument)};
                assert(env);
                instantiations.set(instᐟ, env);
                return instᐟ;
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
                    bindings[name] = {kind: 'Identifier', name: globalName, resolved: true};
                }

                // Pop back out to the surrounding scope before returning.
                env = getSurroundingScope(env);
                return {kind: 'Module', bindings};
            },
        }));

        // STEP 2: Resolve all Identifier nodes (except MemberExpression#member - that is resolved in STEP 3)
        for (let [id, scope] of identifiers) {
            const {globalName} = lookup(scope, id.name);
            Object.assign(id, {name: globalName, resolved: true}); // TODO: messy overwrite of readonly prop - better/cleaner way?
        }

        // STEP 3: Resolve all MemberExpression nodes
        for (let mem of memberExprs) {
            let lhs = mem.module;
            while (lhs.kind === 'Identifier' && lhs.resolved) lhs = allSymbols[lhs.name].value; // TODO: could this loop infinitely?
            assert(lhs.kind !== 'MemberExpression'); // TODO: explain... Since nested MemExprs are always resolved before outer ones due to them being added to the array depth-first

            // Lookup the name in the lhs Module. This lookup is different to an Identifier lookup, in that the name
            // must be local in the lhs Module, whereas Identifier lookups also look through the outer scope chain.
            assert(lhs.kind === 'Module');
            const id = lhs.bindings[mem.member.name];
            if (!id) throw new Error(`'${mem.member.name}' is not defined`); // TODO: improve diagnostic message eg line+col
            assert(id.kind === 'Identifier' && id.resolved);
            Object.assign(mem, {module: null, member: null}, id); // TODO: messy overwrite of readonly prop - better/cleaner way?
        }

        // TODO doc:
        // - for each InstantiationExpression `i` encountered in STEP 1 above:
        //   - find the referenced GenericExpression `g`, and the scope `s` in which `g` occurred
        //   - evaluate `g` in `s` with the arg of `i` --> `eval` (ie RECURSE here)
        //   - replace InstantiationExpresion object in-place with `eval`
        for (const [inst, scope] of instantiations) {
            let gen = inst.generic;
            let genScope = scope;
            while (gen.kind === 'Identifier' && gen.resolved) {
                genScope = allSymbols[gen.name].scope;
                gen = allSymbols[gen.name].value; // TODO: could this loop infinitely?
            }
            if (gen.kind === 'Intrinsic') continue; // TODO: explain... will be emitted as a call to the extension fn

            // TODO: doc: `inst.argument` has already been resolved in the scope of the `inst` expression
            assert(gen.kind === 'GenericExpression', `Unexpected node kind '${gen.kind}'`);
            const expr = internalResolve({gen, arg: inst.argument, env: genScope}); // Recurse
            Object.assign(inst, {generic: null, argument: null}, expr);
        }

        return result;
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
    // TODO: was... but GenericExpr#param may be this kind... 'ModulePattern',
    'ParenthesisedExpression',
);
