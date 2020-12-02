import type {Definition, Expression, Reference} from '../../abstract-syntax-trees';
import {DefinitionMap, definitionMapKinds} from '../../representations';
import {assert, mapObj} from '../../utils';
import {createDereferencer} from './create-dereferencer';
import {createNodeHasher} from './create-node-hasher';


// TODO: doc...
export function simplifyDefinitionMap({definitionsById, startDefinitionId}: DefinitionMap): DefinitionMap {

    // TODO: doc...
    const deref = createDereferencer(definitionsById);
    const getHashFor = createNodeHasher(deref);

    // Build up a map whose keys are hash codes, and whose values are all the definition names that hash to that code.
    // This will be used later to choose a reasonable name for each distinct definition in the program.
    const namesByHash = Object.values(definitionsById).reduce((obj, def) => {
        // TODO: temp testing...
        const node = def.value;
        assert(definitionMapKinds.matches(node));
        const hash = getHashFor(node);
        obj[hash] ??= [];
        obj[hash].push(def.localName);
        return obj;
    }, {} as Record<string, string[]>);

    // Find the `start` value, and make sure it is an expression.
    const start = definitionsById[startDefinitionId]?.value;
    assert(start && start.kind !== 'Module'); // TODO: better error message here - `start` must be a Rule or something?

    // Populate the `newDefinitionsByHash` map.
    const newDefinitionsByHash = new Map<string, Definition>();
    const newDefinitionIds = new Set<string>();
    const startDefn = getNewDefinitionFor(start); // NB: called for side-effect of populating `newDefinitionsByHash` map.

    // TODO: in debug mode, ensure only allowed node kinds are present in the representation
    //traverseNode(null!, n => assert(definitionMapKinds.matches(n)));

    definitionsById = {};
    for (const [_, defn] of newDefinitionsByHash) definitionsById[defn.definitionId] = defn;
    return {
        definitionsById,
        startDefinitionId: startDefn.definitionId,
    };

    // TODO: recursive...
    function getNewDefinitionFor(expr: Expression, parentDefnName?: string): Definition {
        assert(definitionMapKinds.matches(expr));

        // TODO: doc...
        const e = deref(expr);
        const hash = getHashFor(e);
        if (newDefinitionsByHash.has(hash)) return newDefinitionsByHash.get(hash)!;

        // TODO: make up a name for the new defn. Use a name from the matching old defn if available
        const ownName = namesByHash[hash]?.[0];

        // TODO: doc... create a defn, register it in the map, then fill it in below
        const newDefinition: Definition = {
            kind: 'Definition',
            definitionId: createDefinitionId(ownName || `${parentDefnName ?? ''}_e`),
            moduleId: '-', // TODO: fix...
            localName: '-', // TODO: fix...
            value: undefined!,
        };
        newDefinitionsByHash.set(hash, newDefinition);

        // Set `newDefinition.value` to a new shallow expr, and return `newDefinition`.
        switch (e.kind) {
            case 'ApplicationExpression': return setV(e, {lambda: ref(e.lambda), argument: ref(e.argument)});
            case 'BooleanLiteral': return setV(e);
            case 'FieldExpression': return setV(e, {name: ref(e.name), value: ref(e.value)});
            case 'Intrinsic': return setV(e);
            case 'LambdaExpression': throw new Error('Not implemented'); // TODO temp testing fix this...
            case 'ListExpression': return setV(e, {elements: e.elements.map(ref)});
            case 'Module': return assert(!Array.isArray(e.bindings)), setV(e, {bindings: mapObj(e.bindings, ref)});
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

        function ref(expr: Expression): Reference {
            const {definitionId} = getNewDefinitionFor(expr, ownName || parentDefnName); // recurse
            return {kind: 'Reference', definitionId};
        }

        function setV<E extends Expression>(expr: E, vals?: Omit<E, 'kind'>) {
            Object.assign(newDefinition, {value: {kind: expr.kind, ...(vals || expr)}});
            return newDefinition;
        }
    }

    function createDefinitionId(name: string): string {
        // Ensure no duplicate definitionIds are generated by adding a numeric suffix where necessary.
        let result = name;
        let counter = 1;
        while (newDefinitionIds.has(result)) result = `${name}${++counter}`;
        newDefinitionIds.add(result);
        return result;
    }
}
