import {traverseNode, V, validateAST} from '../../representations';
import {assert, mapObj} from '../../utils';
import {createNodeHasher} from './create-node-hasher';
import {dereference} from './dereference';


// TODO: jsdoc...
// - turns every subexpression into a separate name/value binding in the single module
// - deduplicates all expressions/subexpressions
export function normaliseExpressions(ast: V.AST<300>): V.AST<300> {
    validateAST(ast);

    // TODO: temp workaround... get _all_ bindings in one map like before, but only for deref... need to fix this
    // - maybe just return allBindings from previous transform, and consume it here?
    // TODO: doc...
    const allBindings = {} as Record<string, V.Expression<300>>;
    traverseNode(ast.start, n => {
        if (n.kind !== 'LetExpression') return;
        for (let [name, value] of Object.entries(n.bindings)) allBindings[name] = value;
    });
    const deref = (id: V.Identifier) => dereference(id, name => allBindings[name]);
    const getHashFor = createNodeHasher(deref);

    // Build up a map whose keys are hash codes, and whose values are all the definition names that hash to that code.
    // This will be used later to choose a reasonable name for each distinct definition in the program.
    const namesByHash = Object.entries(allBindings).reduce((obj, [name, value]) => {
        const hash = getHashFor(value);
        obj[hash] ??= [];
        obj[hash].push(name);
        return obj;
    }, {} as Record<string, string[]>);

    // Find the `start` value, and make sure it is an expression.
    const start = ast.start.expression;
    assert(start && start.kind === 'Identifier'); // TODO: better error message here - `start` must be a Rule or something?

    // Populate the `newBindingsByHash` map.
    const newBindingsByHash = new Map<string, {name: string, value: V.Expression<300>}>();
    const newUniqueNames = new Set<string>();
    getNewBindingFor(start); // NB: called for side-effect of populating `newBindingsByHash` map.

    // TODO: in debug mode, ensure only allowed node kinds are present in the representation
    //traverseNode(null!, n => assert(definitionMapKinds.matches(n)));

    const newBindings = {} as Record<string, V.Expression<300>>;
    for (const [_, {name, value}] of newBindingsByHash) newBindings[name] = value;
    ast = {
        version: 300,
        start: {
            kind: 'LetExpression',
            expression: start,
            bindings: newBindings,
        },
    };
    validateAST(ast);
    return ast;

    // TODO: recursive...
    function getNewBindingFor(expr: V.Expression<300>, parentName?: string): {name: string, value: V.Expression<300>} {
        // TODO: doc...
        const e = expr.kind === 'Identifier' ? deref(expr) : expr;
        const hash = getHashFor(e);
        if (newBindingsByHash.has(hash)) return newBindingsByHash.get(hash)!;

        // TODO: make up a name for the new binding. Use a name from the matching old binding if available.
        const ownName = namesByHash[hash]?.includes('start') ? 'start' : namesByHash[hash]?.[0];

        // TODO: doc... create a defn, register it in the map, then fill it in below
        const newBinding = {
            name: createUniqueName(ownName || `${parentName ?? ''}_e`),
            value: undefined!,
        };
        newBindingsByHash.set(hash, newBinding);

        // Set `newBinding.value` to a new shallow expr, and return `newBinding`.
        switch (e.kind) {
            case 'BooleanLiteral': return setV(e);
            case 'FieldExpression': return setV(e, {name: ref(e.name), value: ref(e.value)});
            
            
            // TODO: special... should not be encountered here, since each genexpr would be a separate context
            case 'GenericExpression': {
                const bodyᐟ: V.LetExpression<300> = {
                    kind: 'LetExpression',
                    expression: ref(e.body.expression),
                    bindings: mapObj(e.body.bindings, ref),
                };
                return setV(e, {param: e.param, body: bodyᐟ});
            }



            case 'GenericParameter': return setV(e);
            case 'InstantiationExpression': return setV(e, {generic: ref(e.generic), argument: ref(e.argument)});
            case 'Intrinsic': return setV(e);
            case 'LetExpression': return setV(e, {expression: ref(e.expression), bindings: mapObj(e.bindings, ref)});
            case 'ListExpression': return setV(e, {elements: e.elements.map(ref)});
            case 'MemberExpression': return setV(e, {module: ref(e.module), member: e.member});
            case 'Module': return setV(e, {bindings: mapObj(e.bindings, ref)});
            case 'NotExpression': return setV(e, {expression: ref(e.expression)});
            case 'NullLiteral': return setV(e);
            case 'NumericLiteral': return setV(e);
            case 'QuantifiedExpression': return setV(e, {expression: ref(e.expression), quantifier: e.quantifier});
            case 'RecordExpression': return setV(e, {fields: e.fields.map(f => ({name: f.name, value: ref(f.value)}))});
            case 'SelectionExpression': return setV(e, {expressions: e.expressions.map(ref)});
            case 'SequenceExpression': return setV(e, {expressions: e.expressions.map(ref)});
            case 'StringLiteral': return setV(e);
            default: ((assertNoKindsLeft: never) => { throw new Error(`Unhandled node ${assertNoKindsLeft}`); })(e);
        }

        function ref(expr: V.Expression<300>): V.Identifier {
            const {name} = getNewBindingFor(expr, ownName || parentName); // recurse
            return {kind: 'Identifier', name};
        }

        function setV<E extends V.Expression<300>>(expr: E, vals?: Omit<E, 'kind'>) {
            Object.assign(newBinding, {value: {kind: expr.kind, ...(vals || expr)}});
            return newBinding;
        }
    }

    // TODO: dedupe this... copypasta from SymbolTable (previous transform)
    function createUniqueName(name: string): string {
        // Ensure no duplicate uniqueNames are generated by adding a numeric suffix where necessary.
        let result = name;
        let counter = 1;
        while (newUniqueNames.has(result)) result = `${name}${++counter}`;
        newUniqueNames.add(result);
        return result;
    }
}
