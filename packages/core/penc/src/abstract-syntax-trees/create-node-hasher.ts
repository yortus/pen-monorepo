import * as objectHash from 'object-hash';
import {assert} from '../utils';
import type {Deref} from './create-expression-dereferencer';
import {allNodeKinds, expressionNodeKinds} from './node-kinds';
import {Node} from './nodes';





// TODO:
// [x] make helper for this
// [x] apply here
// [x] apply to DereferencedNodeKind
// [x] apply to SourceNodeKind
// [x] apply to DesugaredNodeKind
// [x] apply to ResolvedNodeKind
// [x] mostly just values now - should be camelCase?
// [ ] fix runtime error seen during `npm run build`






// TODO: temp testing... move to bottom & doc
type HashableNode = Node extends infer N ? (N extends {kind: HashableNodeKind} ? N : never) : never;
type HashableNodeKind = typeof hashableNodeKinds[any];
const hashableNodeKinds = allNodeKinds.without('LocalBinding', 'LocalMultiBinding', 'LocalReferenceExpression');







// TODO: doc... can't deal with Local* nodes... will throw if any encountered.
export function createNodeHasher(deref: Deref) {
    type Signature = [string, ...unknown[]];
    const signaturesByNode = new Map<HashableNode, Signature>();
    const hashesByNode = new Map<HashableNode, string>();
    return getHashFor;

    function getHashFor(node: HashableNode) {
        let n = node as HashableNode;
        if (hashesByNode.has(n)) return hashesByNode.get(n)!;
        let sig = getSignatureFor(n);
        let hash = objectHash(sig);
        hashesByNode.set(n, hash);
        return hash;
    }

    function getSignatureFor(n: HashableNode): Signature {

        // Check for a memoised result for this node that was computed earlier. If found, return it immediately.
        if (signaturesByNode.has(n)) return signaturesByNode.get(n)!;

        // No signature has been computed for this node yet. Try dereferencing the node so that different references
        // to the same thing are treated as the same thing, and end up with the same signature.
        let derefdNode = expressionNodeKinds.includes(n) ? deref(n) : n; // TODO: fix type...
        if (derefdNode !== n) {
            // The node dereferenced to a different node - memoise and return the signature for the dereferenced node. 
            let derefdSig = getSignatureFor(derefdNode as HashableNode);
            signaturesByNode.set(n, derefdSig);
            return derefdSig;
        }

        // Compute the signature of this node for the first time. This operation is recursive, and possibly cyclic (eg
        // due to dereferencing cyclic references). To avoid an infinite loop, we first store the memo for the signature
        // before computing it. If a cycle occurs, the recursive call will just use the memoised signature object and
        // return immediately.
        let sig = [] as unknown as Signature;
        signaturesByNode.set(n, sig);

        // Declare local shorthand helpers for getting node signatures, and for setting the signature for this node.
        const getSig = (n: Node) => {
            assert(hashableNodeKinds.includes(n));
            return getSignatureFor(n);
        };
        const setSig = (...parts: Signature) => (sig.push(...parts), sig);

        // Recursively compute the signature according to the node type.
        switch (n.kind) {
            case 'AbstractSyntaxTree': {
                let map = new Map<string, Signature>();
                for (let [absPath, module] of n.modulesByAbsPath.entries()) map.set(absPath, getSig(module));
                return setSig('MODMAP', map);
            }
            case 'ApplicationExpression': return setSig('APP', getSig(n.lambda), getSig(n.argument));
            case 'BooleanLiteralExpression': return setSig('LIT', n.value);
            case 'ExtensionExpression': return setSig('EXT', n.extensionPath, n.bindingName);
            case 'FieldExpression': return setSig('FLD', getSig(n.name), getSig(n.value));
            case 'GlobalBinding': return setSig('GB', n.localName, getSig(n.value));
            case 'ListExpression': return setSig('LST', n.elements.map(e => getSig(e)));
            case 'MemberExpression': return setSig('MEM', getSig(n.module), n.bindingName);
            case 'Module': {
                let set = new Set<Signature>();
                for (let binding of n.bindings) set.add(getSig(binding));
                return setSig('MOD', set);
            }
            case 'ModuleExpression': return setSig('MEX', getSig(n.module));
            case 'NotExpression': return setSig('NOT', getSig(n.expression));
            case 'NullLiteralExpression': return setSig('LIT', n.value);
            case 'NumericLiteralExpression': return setSig('LIT', n.value);
            case 'ParenthesisedExpression': return getSig(n.expression);
            case 'QuantifiedExpression': return setSig('QUA', getSig(n.expression), n.quantifier);
            case 'RecordExpression': return setSig('REC', n.fields.map(f => ({n: f.name, v: getSig(f.value)})));
            case 'SelectionExpression': return setSig('SEL', n.expressions.map(e => getSig(e)));
            case 'SequenceExpression': return setSig('SEQ', n.expressions.map(e => getSig(e)));
            case 'StringLiteralExpression': return setSig('STR', n.value, n.abstract, n.concrete);
            default: ((assertNoKindsLeft: never) => { throw new Error(`Unhandled node ${assertNoKindsLeft}`); })(n);
        }
    }
}
