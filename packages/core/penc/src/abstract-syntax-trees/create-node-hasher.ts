import * as objectHash from 'object-hash';
import type {AstType, ExtractNode, NodeKind} from '../abstract-syntax-trees';
import {assert} from '../utils';


// TODO: doc... can't deal with Local* nodes... will throw if any encountered.
export function createNodeHasher<T extends AstType<HashableNodeKind>>() {
    type HashableNode = ExtractNode<AstType<HashableNodeKind>>;

    // TODO: impl/import this...
    let resolve!: (e: HashableNode) => HashableNode;


    type Signature = [string, ...unknown[]];
    const signaturesByNode = new Map<HashableNode, Signature>();
    const hashesByNode = new Map<HashableNode, string>();
    return getHashFor;

    function getHashFor(node: ExtractNode<T>) {
        let n = node as HashableNode;
        if (hashesByNode.has(n)) return hashesByNode.get(n)!;
        let sig = getSignatureFor(n);
        let hash = objectHash(sig);
        hashesByNode.set(n, hash);
        return hash;
    }

    function getSignatureFor(n: HashableNode): Signature {
        if (signaturesByNode.has(n)) return signaturesByNode.get(n)!;
        let n2 = resolve(n);
        if (n2 !== n) {
            let sig2 = getSignatureFor(n2);
            signaturesByNode.set(n, sig2);
            return sig2;
        }
        let sig = [] as unknown as Signature;
        signaturesByNode.set(n, sig);

        const getSig = getSignatureFor;
        const setSig = (...parts: Signature) => (sig.push(...parts), sig);

        switch (n.kind) {
            case 'ApplicationExpression': return setSig('APP', getSig(n.lambda), getSig(n.argument));
            case 'BooleanLiteralExpression': return setSig('LIT', n.value);
            case 'ExtensionExpression': return setSig('EXT', n.extensionPath, n.bindingName);
            case 'FieldExpression': return setSig('FLD', getSig(n.name), getSig(n.value));
            case 'GlobalBinding': return setSig('GB', n.localName, getSig(n.value));
            case 'GlobalReferenceExpression': assert(false); // the resolve() logic removed this node kind
            case 'ImportExpression': assert(false); // the resolve() logic removed this node kind
            case 'ListExpression': return setSig('LST', n.elements.map(e => getSig(e)));
            case 'MemberExpression': return setSig('MEM', getSig(n.module), n.bindingName);
            case 'Module': {
                let set = new Set<Signature>();
                for (let binding of n.bindings) set.add(getSig(binding));
                return setSig('MOD', set);
            }
            case 'ModuleExpression': return setSig('MEX', getSig(n.module));
            case 'ModuleMap': {
                // TODO: ...
                throw 1;
            }
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


type HashableNodeKind = Exclude<NodeKind, 'LocalBinding' | 'LocalMultiBinding' | 'LocalReferenceExpression'>;
