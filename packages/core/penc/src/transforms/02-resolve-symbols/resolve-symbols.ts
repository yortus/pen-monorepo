import {makeNodeMapper, V, validateAST} from '../../representations';
import {assert, mapObj} from '../../utils';
import {createSymbolTable, Scope, Symbol} from './symbol-table';


// TODO: jsdoc...
// - resolves all identifiers and member lookups
// - outputs the program as a single module (ie flat list of bindings)
// - all Identifiers refer to binding names in the single module
// - output contains *no* MemberExpressions (well it could actually, via extensions)
export function resolveSymbols(ast: V.AST<200>): V.AST<300> {
    validateAST(ast);
    const allSymbols = {} as Record<string, Symbol>;
    let closureCounter = 0;
    let currentClosureId = `GLOBALS`;
    const symbolsByClosureId = {} as Record<string, Record<string, Symbol>>;
    const {rootScope} = createSymbolTable({
        onInsert: symbol => {
            allSymbols[symbol.uniqueName] = symbol;
            symbolsByClosureId[currentClosureId] ??= {};
            symbolsByClosureId[currentClosureId][symbol.uniqueName] = symbol;
        },
    });

    // TODO: temp testing...
    let resolved = internalResolve({
        gen: {
            kind: 'GenericExpression',
            param: 'DUMMY', // TODO: this param is never referenced, so name doesn't matter. Remove it somehow?
            body: ast.start,
        },
        arg: {kind: 'Module', bindings: {}},
        env: rootScope,
    });

    // TODO: temp testing...
    assert(resolved.kind === 'Identifier' && resolved.unique);
    allSymbols['start'] = {uniqueName: 'start', value: resolved, scope: rootScope};
    const astᐟ: V.AST<300> = {
        version: 300,
        start: {
            kind: 'MemberExpression',
            module: {
                kind: 'Module',
                bindings: mapObj(allSymbols, symbol => symbol.value) as V.BindingMap<300>,
            },
            member: 'start',
        },
    };
    validateAST(astᐟ);
    return astᐟ;

    // TODO: temp testing...
    function internalResolve({gen, arg, env}: {gen: V.GenericExpression<200>, arg: V.Expression<200>, env: Scope}) {

        // TODO: step 0 - synthesize a LetExpression
        const top: V.LetExpression<200> = {
            kind: 'LetExpression',
            expression: gen.body,
            bindings: {[gen.param]: arg},
        };

        // STEP 1: Traverse the AST, creating a scope for each module, and a symbol for each binding name/value pair.
        const identifiers = new Map<V.Identifier, Scope>();
        const memberExprs = [] as V.MemberExpression<200>[];
        const instantiations = new Map<V.InstantiationExpression<200>, Scope>();
        const result = mapNode(top, rec => ({
            GenericExpression: ({param, body}): V.GenericExpression<200> => {

                // Create a closure and nested scope for this generic expression.
                const surroundingClosureId = currentClosureId;
                currentClosureId = 'C' + String(++closureCounter).padStart(6, '0');
                env = env.createNestedScope();

                // Create a symbol for the generic parameter, whose value is specially marked as a 'placeholder'.
                let placeholder: V.Identifier = {kind: 'Identifier', name: '', placeholder: true};
                const {uniqueName} = env.insert(param, placeholder);
                Object.assign(placeholder, {name: uniqueName}); // TODO: cleaner way than in-place update?

                // Traverse the body expression in the new scope, then revert to the surrounding scope before returning.
                body = rec(body);
                env = env.surroundingScope;
                currentClosureId = surroundingClosureId;
                return {kind: 'GenericExpression', param, body};
            },
            Identifier: id => {
                if (id.unique) return id;
                // TODO: explain tracking...
                // Collect every Identifier encountered during the traversal, to be resolved in step 2.
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
            LetExpression: le => {
                // Create a nested scope for this let expression.
                env = env.createNestedScope();

                // Create a symbol for each local name in the let expression.
                const bindings = {} as Record<string, V.Identifier>;
                for (const [name, expr] of Object.entries(le.bindings)) {
                    const {uniqueName} = env.insert(name, rec(expr));
                    bindings[name] = {kind: 'Identifier', name: uniqueName, unique: true};
                }

                // Recursively resolve the main expression in the nested scope.
                const expression = rec(le.expression);

                // Pop back out to the surrounding scope before returning.
                env = env.surroundingScope;
                return expression;
            },
            MemberExpression: mem => {
                // TODO: explain tracking...
                // Collect every MemberExpression encountered during the traversal, to be resolved in step 3.
                const memᐟ = {...mem, module: rec(mem.module)};
                memberExprs.push(memᐟ);
                return memᐟ;
            },
            Module: module => {
                // Create a nested scope for this module.
                env = env.createNestedScope();

                // Create a symbol for each local name in the module.
                const bindings = {} as Record<string, V.Identifier>;
                for (const [name, expr] of Object.entries(module.bindings)) {
                    const {uniqueName} = env.insert(name, rec(expr));
                    bindings[name] = {kind: 'Identifier', name: uniqueName, unique: true};
                }

                // Pop back out to the surrounding scope before returning.
                env = env.surroundingScope;
                return {kind: 'Module', bindings};
            },
        }));

        // STEP 2: Resolve all Identifier nodes
        for (let [id, scope] of identifiers) {
            const {uniqueName} = scope.lookup(id.name);
            Object.assign(id, {name: uniqueName, unique: true}); // TODO: messy overwrite of readonly prop - better/cleaner way?
        }

        // STEP 3: Resolve MemberExpression nodes where possible
        for (let mem of memberExprs) {
            let lhs = mem.module;
            while (lhs.kind === 'Identifier' && lhs.unique && !lhs.placeholder) lhs = allSymbols[lhs.name].value; // TODO: could this loop infinitely?
            assert(lhs.kind !== 'MemberExpression'); // TODO: explain... Since nested MemExprs are always resolved before outer ones due to them being added to the array depth-first

            // If the lhs is a module, we can statically resolve the member expression. Otherwise, leave it as-is.
            if (lhs.kind === 'Module') {
                // Lookup the name in the lhs Module. This lookup is different to an Identifier lookup, in that the name
                // must be local in the lhs Module, whereas Identifier lookups also look through the outer scope chain.
                const id = lhs.bindings[mem.member];
                if (!id) throw new Error(`'${mem.member}' is not defined`); // TODO: improve diagnostic message eg line+col
                assert(id.kind === 'Identifier' && id.unique && !id.placeholder);
                Object.assign(mem, {module: null, member: null}, id); // TODO: messy overwrite of readonly prop - better/cleaner way?
            }
        }

        return result;
    }
}


// TODO: temp testing...
const mapNode = makeNodeMapper<200, 200>();
