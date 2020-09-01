import * as objectHash from 'object-hash';
import type {Node} from '../abstract-syntax-trees';
import {assert} from './assert';


export function createNodeHasher(resolve: (e: Node) => Node) {
    type Signature = [string, ...unknown[]];
    const signaturesByNode = new Map<Node, Signature>();
    const hashesByNode = new Map<Node, string>();
    return getHashFor;

    function getHashFor(ex: Node) {
        if (hashesByNode.has(ex)) return hashesByNode.get(ex)!;
        let sig = getSignatureFor(ex);
        let hash = objectHash(sig);
        hashesByNode.set(ex, hash);
        return hash;
    }

    function getSignatureFor(ex: Node): Signature {
        if (signaturesByNode.has(ex)) return signaturesByNode.get(ex)!;
        let e2 = resolve(ex);
        if (e2 !== ex) {
            let sig2 = getSignatureFor(e2);
            signaturesByNode.set(ex, sig2);
            return sig2;
        }
        let sig = [] as unknown as Signature;
        signaturesByNode.set(ex, sig);

        const getSig = getSignatureFor;
        const setSig = (...parts: Signature) => (sig.push(...parts), sig);

        switch (ex.kind) {
            case 'ApplicationExpression': return setSig('APP', getSig(ex.lambda), getSig(ex.argument));
            case 'BooleanLiteralExpression': return setSig('LIT', ex.value);
            case 'ExtensionExpression': return setSig('EXT', ex.extensionPath, ex.bindingName);
            case 'FieldExpression': return setSig('FLD', getSig(ex.name), getSig(ex.value));
            case 'GlobalBinding': return setSig('GB', ex.localName, getSig(ex.value));
            case 'GlobalReferenceExpression': assert(false); // the resolve() logic removed this node kind
            case 'ImportExpression': assert(false); // the resolve() logic removed this node kind
            case 'ListExpression': return setSig('LST', ex.elements.map(e => getSig(e)));
            case 'LocalBinding': return setSig('LB', ex.localName, getSig(ex.value));
            case 'LocalMultiBinding': {
                // TODO: ...
                throw 1;
            }
            case 'LocalReferenceExpression': {
                // TODO: ...
                throw 1;
            }
            case 'MemberExpression': return setSig('MEM', getSig(ex.module), ex.bindingName);
            case 'Module': {
                let set = new Set<Signature>();
                for (let binding of ex.bindings) set.add(getSig(binding));
                return setSig('MOD', set);
            }
            case 'ModuleExpression': return setSig('MEX', getSig(ex.module));
            case 'ModuleMap': {
                // TODO: ...
                throw 1;
            }
            case 'NotExpression': return setSig('NOT', getSig(ex.expression));
            case 'NullLiteralExpression': return setSig('LIT', ex.value);
            case 'NumericLiteralExpression': return setSig('LIT', ex.value);
            case 'ParenthesisedExpression': return getSig(ex.expression);
            case 'QuantifiedExpression': return setSig('QUA', getSig(ex.expression), ex.quantifier);
            case 'RecordExpression': return setSig('REC', ex.fields.map(f => ({n: f.name, v: getSig(f.value)})));
            case 'SelectionExpression': return setSig('SEL', ex.expressions.map(e => getSig(e)));
            case 'SequenceExpression': return setSig('SEQ', ex.expressions.map(e => getSig(e)));
            case 'StringLiteralExpression': return setSig('STR', ex.value, ex.abstract, ex.concrete);
            default: ((assertNoKindsLeft: never) => { throw new Error(`Unhandled node ${assertNoKindsLeft}`); })(ex);
        }
    }
}
