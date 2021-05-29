import * as objectHash from 'object-hash';
import {V} from '../../representations';
import {mapObj} from '../../utils';
import {dereference} from './dereference';


// TODO: review this outdated jsdoc comment...
// TODO: doc... maintains internal cache for perf - create one hasher for an entire AST
/**
 * Returns a function that returns a hash value for any given Expression node.
 * The same hash value is returned for most logically equivalent nodes, that is, nodes that may be substituted for one
 * another without changing the semantics of the AST. For example, a Identifier expression and the expression it
 * refers to will have the same hash value. This allows the AST to be simplified without changing it semantically.
 * @param deref function to be used to dereference expressions (see createExpressionDereferencer).
 */
export function createNodeHasher() {
    type Signature = [string, ...unknown[]];
    const signaturesByNode = new Map<V.Expression<400>, Signature>();
    const hashesByNode = new Map<V.Expression<400>, string>();

    return function getHashFor(node: V.Expression<400>, lookup: (name: string) => V.Expression<400>) {
        if (hashesByNode.has(node)) return hashesByNode.get(node)!;
        const sig = getSignatureFor(node, lookup);
        const hash = objectHash(sig);
        hashesByNode.set(node, hash);
        return hash;
    }

    /**
     * Computes a 'signature' object for the given node, from which a hash value may be easily derived.
     * Logically equivalent nodes will end up with equivalent signatures that produce the same hash. 
     */
    function getSignatureFor(n: V.Expression<400>, lookup: (name: string) => V.Expression<400>): Signature {

        // Check for a memoised result for this node that was computed earlier. If found, return it immediately.
        if (signaturesByNode.has(n)) return signaturesByNode.get(n)!;

        // No signature has been computed for this node yet.
        // If the node is an Identifier, get the signature of its target expression, and set that as the signature
        // of the Identifier node. This ensures every Identifier node has the same hash as the node it refers to.
        if (n.kind === 'Identifier') {
            const sig = getSignatureFor(dereference(n, lookup), lookup);
            signaturesByNode.set(n, sig);
            return sig;
        }

        // Compute the signature of this node for the first time. This operation is recursive, and possibly cyclic (eg
        // due to dereferencing cyclic references). To avoid an infinite loop, we first store the memo for the signature
        // before computing it. If a cycle occurs, the recursive call will just use the memoised signature object and
        // return immediately.
        const sig = [] as unknown as Signature;
        signaturesByNode.set(n, sig);

        // Declare local shorthand helpers for getting node signatures, and for setting the signature for this node.
        const getSig = (n: V.Expression<400>) => getSignatureFor(n, lookup)
        const setSig = (...parts: Signature) => (sig.push(...parts), sig);

        // Recursively compute the signature according to the node type.
        switch (n.kind) {
            case 'BooleanLiteral': return setSig('LITERAL', n.value);
            case 'ByteExpression': return setSig('BYTE', n.include, n.exclude, n.default); // TODO: sort/normalise inc/exc arrays so equiv ones will have the same signature
            case 'CodeExpression': return setSig('CODE', getSig(n.expression));
            case 'GenericExpression': return setSig('GENEXPR', getSig(n.body));
            case 'GenericParameter': return setSig('GENPARAM', n.name);
            case 'InstantiationExpression': return setSig('INSTEXPR', getSig(n.generic), getSig(n.argument));
            case 'Intrinsic': return setSig('INTRINSIC', n.name, n.path);
            case 'LetExpression': return setSig('LETEXPR', getSig(n.expression), mapObj(n.bindings, getSig));
            case 'ListExpression': return setSig('LIST', n.items.map(i => i.kind === 'Splice'
                ? {k: i.kind, e: getSig(i.expression)}
                : getSig(i)
            ));
            case 'MemberExpression': return setSig('MEMBER', getSig(n.module), n.member);
            case 'Module': return setSig('MODULE', mapObj(n.bindings, getSig));
            case 'NilExpression': return setSig('NIL');
            case 'NotExpression': return setSig('NOT', getSig(n.expression));
            case 'NullLiteral': return setSig('LITERAL', n.value);
            case 'NumericLiteral': return setSig('LITERAL', n.value);
            case 'QuantifiedExpression': return setSig('QUANT', getSig(n.expression), n.quantifier);
            case 'PipeExpression': return setSig('PIPE', n.expressions.map(e => getSig(e)));
            case 'RecordExpression': return setSig('RECORD', n.items.map(i => i.kind === 'Splice'
                ? {k: i.kind, e: getSig(i.expression)}
                : {k: i.kind, n: typeof i.name === 'string' ? i.name : getSig(i.name), e: getSig(i.expression)}
            ));
            case 'SelectionExpression': return setSig('SEL', n.expressions.map(e => getSig(e)));
            case 'SequenceExpression': return setSig('SEQ', n.expressions.map(e => getSig(e)));
            case 'StringLiteral': return setSig('LITERAL', n.value, n.isAbstract);
            default: ((n: never) => { throw new Error(`Unhandled node kind ${(n as any).kind}`); })(n);
        }
    }
}
