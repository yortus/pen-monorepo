import * as objectHash from 'object-hash';
import {expressionNodeKinds, Node} from '../../abstract-syntax-trees';
import {definitionMapKinds} from '../../representations';
import {assert} from '../../utils';
import type {DereferenceFunction} from './create-dereferencer';


// TODO: review this outdated jsdoc comment...
// TODO: review hashable node kinds too... should be all Expression subkinds plus Module?
/**
 * Returns a function that returns a hash value for any given node. Any node kind may be hashed except the Local* kinds.
 * The same hash value is returned for most logically equivalent nodes, that is, nodes that may be substituted for one
 * another without changing the semantics of the AST. For example, a reference expression and the expression it
 * refers to will have the same hash value. This allows the AST to be simplified without changing it semantically.
 * @param deref function to be used to dereference expressions (see createExpressionDereferencer).
 */
export function createNodeHasher(deref: DereferenceFunction) {
    type Signature = [string, ...unknown[]];
    const signaturesByNode = new Map<HashableNode, Signature>();
    const hashesByNode = new Map<HashableNode, string>();

    return function getHashFor(node: HashableNode) {
        const n = node as HashableNode;
        if (hashesByNode.has(n)) return hashesByNode.get(n)!;
        const sig = getSignatureFor(n);
        const hash = objectHash(sig);
        hashesByNode.set(n, hash);
        return hash;
    }

    /**
     * Computes a 'signature' object for the given node, from which a hash value may be easily derived.
     * Logically equivalent nodes will end up with signatures that produce the same hash. 
     */
    function getSignatureFor(n: HashableNode): Signature {

        // Check for a memoised result for this node that was computed earlier. If found, return it immediately.
        if (signaturesByNode.has(n)) return signaturesByNode.get(n)!;

        // No signature has been computed for this node yet. Try dereferencing the node so that different references
        // to the same thing are treated as the same thing, and end up with the same signature.
        const derefdNode = expressionNodeKinds.matches(n) ? deref(n) : n; // TODO: fix type...
        if (derefdNode !== n) {
            // The node dereferenced to a different node - memoise and return the signature for the dereferenced node. 
            const derefdSig = getSignatureFor(derefdNode as HashableNode);
            signaturesByNode.set(n, derefdSig);
            return derefdSig;
        }

        // Compute the signature of this node for the first time. This operation is recursive, and possibly cyclic (eg
        // due to dereferencing cyclic references). To avoid an infinite loop, we first store the memo for the signature
        // before computing it. If a cycle occurs, the recursive call will just use the memoised signature object and
        // return immediately.
        const sig = [] as unknown as Signature;
        signaturesByNode.set(n, sig);

        // Declare local shorthand helpers for getting node signatures, and for setting the signature for this node.
        const getSig = (n: Node) => {
            assert(hashableNodeKinds.matches(n));
            return getSignatureFor(n);
        };
        const setSig = (...parts: Signature) => (sig.push(...parts), sig);

        // Recursively compute the signature according to the node type.
        switch (n.kind) {
            case 'ApplicationExpression': return setSig('APP', getSig(n.lambda), getSig(n.argument));
            case 'BooleanLiteral': return setSig('LIT', n.value);
            case 'FieldExpression': return setSig('FLD', getSig(n.name), getSig(n.value));
            case 'Intrinsic': return setSig('INT', n.name, n.path);
            case 'ListExpression': return setSig('LST', n.elements.map(e => getSig(e)));
            case 'ModuleStub': {
                let sig = Object.keys(n.bindingDefinitionIds).reduce((obj, name) => {
                    obj[name] = getSig({kind: 'Reference', definitionId: n.bindingDefinitionIds[name]});
                    return obj;
                }, {} as Record<string, Signature>);
                return setSig('MOD', sig);
            }
            case 'NotExpression': return setSig('NOT', getSig(n.expression));
            case 'NullLiteral': return setSig('LIT', n.value);
            case 'NumericLiteral': return setSig('LIT', n.value);
            case 'QuantifiedExpression': return setSig('QUA', getSig(n.expression), n.quantifier);
            case 'RecordExpression': return setSig('REC', n.fields.map(f => ({n: f.name, v: getSig(f.value)})));
            case 'SelectionExpression': return setSig('SEL', n.expressions.map(e => getSig(e)));
            case 'SequenceExpression': return setSig('SEQ', n.expressions.map(e => getSig(e)));
            case 'StringLiteral': return setSig('STR', n.value, n.abstract, n.concrete);
            default: ((n: never) => { throw new Error(`Unhandled node kind ${(n as any).kind}`); })(n);
        }
    }
}


// Helper type: union of all nodes that support hashing. Includes all nodes except Local* nodes.
type HashableNode = Node extends infer N ? (N extends {kind: HashableNodeKind} ? N : never) : never;


// Helper type: union of all node kinds that support hashing. Includes all node kinds except 'Local*'.
type HashableNodeKind = typeof hashableNodeKinds[any];


// Helper array of all node kinds that support hashing.
const hashableNodeKinds = definitionMapKinds.without('Definition');
