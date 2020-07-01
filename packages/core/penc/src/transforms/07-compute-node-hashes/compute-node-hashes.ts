import {Node, Program} from '../../ast-nodes';
import {traverseDepthFirst} from '../../utils';
import {Metadata} from './metadata';


// TODO: doc...
export function computeNodeHashes(program: Program<Metadata>) {
    type Signature = {val: unknown} | {ref: Node<Metadata>};
    let signatures = new Map<Node<Metadata>, Signature>();
    traverseDepthFirst(program, n => signatures.set(n, {} as Signature));
    const sigFor = (node: Node<Metadata>) => signatures.get(node)!;

    // TODO: next steps:
    // 2. Object.assign props into the signature obj of every node (another traversal, just for side-effects, ie visit)
    for (let [node, sig] of signatures.entries()) {
        Object.assign(sig, computeSignatureFor(node));
    }

    // TODO:
    // 3. mapMap from sigs to hashes using object-hash
    // 4. add the map of node hashes to program.meta.nodeHashes (new meta prop)



    // TODO: temp testing... remove...
    const bnds = [] as number[];
    const sigsEntries = [...signatures.entries()];
    for (let i = 0; i < signatures.size; ++i) {
        if (sigsEntries[i][0].kind === 'SimpleBinding' || sigsEntries[i][0].kind === 'DestructuredBinding') {
            bnds.push(i);
        }
    }




    return program;


    // TODO: doc...
    function computeSignatureFor(n: Node<Metadata>): Signature {
        switch (n.kind) {

            // Simple nodes
            case 'BooleanLiteralExpression': return {val: {$: 'LIT', v: n.value}};
            case 'ExtensionFile': return {val: {$: 'EXF', p: n.path}};
            case 'NullLiteralExpression': return {val: {$: 'LIT', v: n.value}};
            case 'NumericLiteralExpression': return {val: {$: 'LIT', v: n.value}};
            case 'StringLiteralExpression': return {val: {$: 'STR', v: n.value, a: n.abstract, c: n.concrete}};
            case 'Program': return {val: {$: 'PRG'}}; // special case - only one of these

            // Compound nodes
            case 'ApplicationExpression': return {val: {$: 'APP', l: sigFor(n.lambda), a: sigFor(n.argument)}};
            case 'FieldExpression': return {val: {$: 'FLD', n: sigFor(n.name), v: sigFor(n.value)}};
            case 'ListExpression': return {val: {$: 'LST', e: n.elements.map(e => sigFor(e))}};
            case 'NotExpression': return {val: {$: 'NOT', e: sigFor(n.expression)}};
            case 'QuantifiedExpression': return {val: {$: 'QUA', e: sigFor(n.expression), q: n.quantifier}};
            case 'RecordExpression': return {val: {$: 'REC', f: n.fields.map(f => ({n: f.name, v: sigFor(f.value)}))}};
            case 'SelectionExpression': return {val: {$: 'SEL', e: n.expressions.map(e => sigFor(e))}};
            case 'SequenceExpression': return {val: {$: 'SEQ', e: n.expressions.map(e => sigFor(e))}};



            // Aliasing nodes (ie nodes that *directly* create graph cycles)
            case 'ModuleExpression': return {ref: n.module};
            case 'ParenthesisedExpression': return {ref: n.expression};
            case 'PenSourceFile': return {ref: n.module};
            case 'SimpleBinding': return {ref: n.value};




            // TODO: Nodes that reference other nodes (ie creating graph cycles)
            // case 'BindingLookupExpression':
            // case 'DestructuredBinding':
            // case 'ImportExpression':
            ///////// // case 'LambdaExpression': TODO: ...


            case 'Module':
                // return {kind: 'MOD', b: n.bindings};
                // TODO!!!
                // - binding order not important
                // - need to 'normalise' - ie:
                //   a) get a flat list of binding names from either VariablePattern or ModulePatternName nodes
                //   b) link each binding name to appropriate rhs signature - either direct, or equiv of BLE


            // case 'ReferenceExpression':





            // TODO: was... restore...
            // default: ((assertNoKindsLeft: never) => { throw new Error(`Unhandled node ${assertNoKindsLeft}`); })(n);
        }

        // TODO: ...
        return {} as any;
    }
}
