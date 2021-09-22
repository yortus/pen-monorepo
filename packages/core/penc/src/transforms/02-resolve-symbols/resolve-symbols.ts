import {makeNodeMapper, V, validateAST} from '../../representations';
import {assert, mapObj} from '../../utils';
import {createSymbolTable, Scope, Symbol} from './symbol-table';


// TODO: jsdoc...
// - resolves all identifiers (output ast Identifiers all refer to globally-unique names in LetExpr bindings)
// - resolves member lookups where possible (can't resolve member access of intrinsics or function params)
export function resolveSymbols(ast: V.AST<200>): V.AST<300> {
    validateAST(ast);
    const allSymbols = {} as Record<string, Symbol>;
    const outerClosures = [] as Array<Record<string, Symbol>>;
    let currentClosure = {} as Record<string, Symbol>;
    function pushClosure() {
        outerClosures.push(currentClosure);
        currentClosure = {};
    }
    function popClosure() {
        assert(outerClosures.length > 0);
        currentClosure = outerClosures.pop()!;
    }
    const {rootScope} = createSymbolTable({
        onInsert: symbol => {
            allSymbols[symbol.uniqueName] = symbol;
            currentClosure[symbol.uniqueName] = symbol;
        },
    });

    // STEP 1: Traverse the AST, creating a scope for each module/letexpr/funexpr, and a symbol for each binding name/value pair.
    let env = rootScope;
    const identifiers = new Map<V.Identifier, Scope>();
    const memberExprs = [] as V.MemberExpression<300>[];
    const startᐟ = mapNode(ast.start, rec => ({
        FunctionExpression: ({param, body}): V.FunctionExpression<300> => {

            // Create a closure and nested scope for this function expression.
            pushClosure();
            env = env.createNestedScope();

            // Traverse the body expression in the new scope, then revert to the surrounding scope and closure.
            const bodyᐟ = rec(body);
            const allSymbolsInClosure = currentClosure;
            env = env.surroundingScope;
            popClosure();

            // TODO: explain...
            return {
                kind: 'FunctionExpression',
                param,
                body: {
                    kind: 'LetExpression',
                    expression: bodyᐟ,
                    bindings: mapObj(allSymbolsInClosure, symbol => symbol.value),
                },
            };
        },
        Identifier: id => {
            // Collect every Identifier encountered during the traversal, to be resolved in step 2.
            const idᐟ: V.Identifier = {...id};
            identifiers.set(idᐟ, env);
            return idᐟ;
        },
        LetExpression: le => {
            // Create a nested scope for this let expression.
            env = env.createNestedScope();

            // Create a symbol for each local name in the let expression.
            for (const [name, expr] of Object.entries(le.bindings)) {
                env.insert(name, rec(expr));
            }

            // Recursively resolve the main expression in the nested scope.
            const expression = rec(le.expression);

            // Pop back out to the surrounding scope before returning.
            env = env.surroundingScope;
            return expression;
        },
        MemberExpression: mem => {
            // Collect every MemberExpression encountered during the traversal, to be resolved in step 3.
            const memᐟ: V.MemberExpression<300> = {...mem, module: rec(mem.module)};
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
                bindings[name] = {kind: 'Identifier', name: uniqueName};
            }

            // Pop back out to the surrounding scope before returning.
            env = env.surroundingScope;
            return {kind: 'Module', imports: [], bindings};
        },
    }));

    // STEP 2: Resolve all Identifier nodes
    for (let [id, scope] of identifiers) {
        const {uniqueName} = scope.lookup(id.name);
        Object.assign(id, {name: uniqueName}); // TODO: messy overwrite of readonly prop - better/cleaner way?
    }

    // STEP 3: Resolve MemberExpression nodes where possible
    for (let mem of memberExprs) {
        let lhs = mem.module;
        while (lhs.kind === 'Identifier') lhs = allSymbols[lhs.name].value; // TODO: could this loop infinitely?
        assert(lhs.kind !== 'MemberExpression'); // TODO: explain... Since nested MemExprs are always resolved before outer ones due to them being added to the array depth-first

        // If the lhs is a module, we can statically resolve the member expression. Otherwise, leave it as-is.
        if (lhs.kind === 'Module') {
            // Lookup the name in the lhs Module. This lookup is different to an Identifier lookup, in that the name
            // must be local in the lhs Module, whereas Identifier lookups also look through the outer scope chain.
            const id = lhs.bindings[mem.member];
            if (!id) throw new Error(`'${mem.member}' is not defined`); // TODO: improve diagnostic message eg line+col
            assert(id.kind === 'Identifier');
            Object.assign(mem, {module: null, member: null}, id); // TODO: messy overwrite of readonly prop - better/cleaner way?
        }
    }

    // TODO: temp testing...
    assert(startᐟ.kind === 'Identifier');
    const astᐟ: V.AST<300> = {
        version: 300,
        start: {
            kind: 'LetExpression',
            expression: startᐟ,
            bindings: mapObj(currentClosure, symbol => symbol.value),
        },
    };

    // TODO: doc/validate/type: the ast now has one LetExpr at the root and one per FunExpr, and nowhere else

    validateAST(astᐟ);
    return astᐟ;
}


// TODO: temp testing...
const mapNode = makeNodeMapper<200, 300>();
