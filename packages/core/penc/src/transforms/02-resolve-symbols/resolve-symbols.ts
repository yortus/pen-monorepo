import {bindingListToBindingMap, makeNodeMapper, V, validateAST} from '../../representations';
import {assert, mapObj} from '../../utils';
import {createSymbolTable, Scope} from './symbol-table';


// TODO: jsdoc...
// - resolves all identifiers and member lookups
// - outputs the program as a single module (ie flat list of bindings)
// - all Identifiers refer to binding names in the single module
// - output contains *no* MemberExpressions (well it could actually, via extensions)
export function resolveSymbols(ast: V.AST<V.NORMAL>): V.AST<V.NORMAL> {
    validateAST(ast);
    const {allSymbols, rootScope} = createSymbolTable();

    // TODO: temp testing...
    const resolvedAst = internalResolve({
        gen: {
            kind: 'GenericExpression',
            param: {kind: 'ModulePattern', names: []},
            body: {kind: 'MemberExpression', module: ast.module, member: {kind: 'Identifier', name: 'start'}},
        },
        arg: {kind: 'Module', bindings: {}},
        env: rootScope,
    });

    // TODO: add the special 'start' symbol
    // TODO: temp testing...
    assert(resolvedAst.kind === 'Identifier' && resolvedAst.resolved);
    allSymbols['start'] = {globalName: 'start', value: resolvedAst, scope: rootScope};
    ast = {
        version: V.NORMAL,
        module: {kind: 'Module', bindings: mapObj(allSymbols, symbol => symbol.value)},
    };
    validateAST(ast);
    return ast;

    // TODO: temp testing...
    function internalResolve({gen, arg, env}: {gen: V.GenericExpression<V.NORMAL>, arg: V.Expression<V.NORMAL>, env: Scope}) {

        // TODO: step 0 - synthesize a MemberExpression and a module
        const startName = 'ENTRYPOINT'; // TODO: make&use namegen util to ensure no clashes with names in other binding
        const top: V.MemberExpression<V.NORMAL> = {
            kind: 'MemberExpression',
            module: {
                kind: 'Module',
                bindings: bindingListToBindingMap([
                    // TODO: remove cast after fixing typing
                    {kind: 'Binding', left: gen.param, right: arg as any},
                    {kind: 'Binding', left: {kind: 'Identifier', name: startName}, right: gen.body},
                ], x => x as any), // TODO: remove cast after fixing typing
            },
            member: {kind: 'Identifier', name: startName},
        };

        // STEP 1: Traverse the AST, creating a scope for each module, and a symbol for each binding name/value pair.
        const identifiers = new Map<V.Identifier, Scope>();
        const memberExprs = [] as V.MemberExpression<V.NORMAL>[];
        const instantiations = new Map<V.InstantiationExpression<V.NORMAL>, Scope>();
        const result = mapNode(top, rec => ({ // NB: top-level return value isn't needed, since everything has a symbol by then.
            GenericExpression: gen => {
                return gen; // NB: don't recurse inside
            },
            Identifier: id => {
                if (id.resolved) return id;
                // TODO: explain tracking...
                const idᐟ = {...id};
                identifiers.set(idᐟ, env);
                return idᐟ;
            },
            InstantiationExpression: inst => {
                // TODO: leave the InstantiationExpression in place until the next step...
                const instᐟ = {...inst, generic: rec(inst.generic), argument: rec(inst.argument)};
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
                // Create a nested scope for this module.
                env = env.createNestedScope();

                // Create a symbol for each local name in the module.
                let bindings = {} as Record<string, V.Identifier>;
                for (const [name, expr] of Object.entries(module.bindings)) {
                    const {globalName} = env.insert(name, rec(expr));
                    bindings[name] = {kind: 'Identifier', name: globalName, resolved: true};
                }

                // Pop back out to the surrounding scope before returning.
                env = env.surroundingScope;
                return {kind: 'Module', bindings};
            },
        }));

        // STEP 2: Resolve all Identifier nodes (except MemberExpression#member - that is resolved in STEP 3)
        for (let [id, scope] of identifiers) {
            const {globalName} = scope.lookup(id.name);
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


// TODO: temp testing...
const mapNode = makeNodeMapper<V.NORMAL, V.NORMAL>();
