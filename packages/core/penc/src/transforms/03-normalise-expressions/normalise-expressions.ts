import {allNodeKinds, Expression, Identifier} from '../../ast-nodes';
import {AST, validateAST} from '../../representations';
import {assert, mapObj} from '../../utils';
import {createDereferencer} from './create-dereferencer';
import {createNodeHasher} from './create-node-hasher';


// TODO: jsdoc...
// - turns every subexpression into a separate name/value binding in the single module
// - deduplicates all expressions/subexpressions
export function normaliseExpressions(ast: AST): AST {
    validateAST(ast, inputNodeKinds);

    // TODO: doc...
    const {bindings} = ast.module;
    const deref = createDereferencer(bindings);
    const getHashFor = createNodeHasher(deref);

    // Build up a map whose keys are hash codes, and whose values are all the definition names that hash to that code.
    // This will be used later to choose a reasonable name for each distinct definition in the program.
    const namesByHash = Object.entries(bindings).reduce((obj, [name, value]) => {
        assert(inputNodeKinds.matches(value));
        const hash = getHashFor(value);
        obj[hash] ??= [];
        obj[hash].push(name);
        return obj;
    }, {} as Record<string, string[]>);

    // Find the `start` value, and make sure it is an expression.
    const start = bindings['start'];
    assert(start && start.kind !== 'Module'); // TODO: better error message here - `start` must be a Rule or something?

    // Populate the `newBindingsByHash` map.
    const newBindingsByHash = new Map<string, {name: string, value: Expression}>();
    const newGlobalNames = new Set<string>();
    getNewBindingFor(start); // NB: called for side-effect of populating `newBindingsByHash` map.

    // TODO: in debug mode, ensure only allowed node kinds are present in the representation
    //traverseNode(null!, n => assert(definitionMapKinds.matches(n)));

    const newBindings = {} as Record<string, Expression>;
    for (const [_, {name, value}] of newBindingsByHash) newBindings[name] = value;
    ast = {
        module: {
            kind: 'Module',
            bindings: newBindings,
        },
    };
    validateAST(ast, outputNodeKinds);
    return ast;

    // TODO: recursive...
    function getNewBindingFor(expr: Expression, parentName?: string): {name: string, value: Expression} {
        assert(inputNodeKinds.matches(expr));

        // TODO: doc...
        const e = deref(expr);
        const hash = getHashFor(e);
        if (newBindingsByHash.has(hash)) return newBindingsByHash.get(hash)!;

        // TODO: make up a name for the new binding. Use a name from the matching old binding if available.
        const ownName = namesByHash[hash]?.includes('start') ? 'start' : namesByHash[hash]?.[0];

        // TODO: doc... create a defn, register it in the map, then fill it in below
        const newBinding = {
            name: createGlobalName(ownName || `${parentName ?? ''}_e`),
            value: undefined!,
        };
        newBindingsByHash.set(hash, newBinding);

        // Set `newBinding.value` to a new shallow expr, and return `newBinding`.
        switch (e.kind) {
            case 'ApplicationExpression': return setV(e, {generic: ref(e.generic), argument: ref(e.argument)});
            case 'BooleanLiteral': return setV(e);
            case 'FieldExpression': return setV(e, {name: ref(e.name), value: ref(e.value)});
            case 'GenericExpression': throw new Error('Not implemented'); // TODO temp testing fix this...
            case 'Intrinsic': return setV(e);
            case 'ListExpression': return setV(e, {elements: e.elements.map(ref)});
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

        function ref(expr: Expression): Identifier {
            const {name} = getNewBindingFor(expr, ownName || parentName); // recurse
            return {kind: 'Identifier', name};
        }

        function setV<E extends Expression>(expr: E, vals?: Omit<E, 'kind'>) {
            Object.assign(newBinding, {value: {kind: expr.kind, ...(vals || expr)}});
            return newBinding;
        }
    }

    // TODO: dedupe this... copypasta from SymbolTable (previous transform)
    function createGlobalName(name: string): string {
        // Ensure no duplicate globalNames are generated by adding a numeric suffix where necessary.
        let result = name;
        let counter = 1;
        while (newGlobalNames.has(result)) result = `${name}${++counter}`;
        newGlobalNames.add(result);
        return result;
    }
}


/** List of node kinds that may be present in the input AST. */
const inputNodeKinds = allNodeKinds.without(
    'Binding',
    'BindingList',
    'ImportExpression',
    'MemberExpression', // TODO: but this _could_ still be present given extensions, right? Then input===output kinds
    'ModulePattern',
    'ParenthesisedExpression',
);


/** List of node kinds that may be present in the output AST. */
const outputNodeKinds = inputNodeKinds;
