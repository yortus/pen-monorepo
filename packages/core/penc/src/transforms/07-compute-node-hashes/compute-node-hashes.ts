import {Expression, Node, Program, ReferenceExpression} from '../../ast-nodes';
import {assert, traverseDepthFirst} from '../../utils';
import {Metadata} from './metadata';


// TODO: doc...
export function computeNodeHashes(program: Program<Metadata>) {
    type Signature = {$: unknown[] | {ref: Node<Metadata>, bindingName?: string}};
    let signatures = new Map<Node<Metadata>, Signature>();
    traverseDepthFirst(program, n => signatures.set(n, {$: []}));
    const sigFor = (node: Node<Metadata>) => signatures.get(node)!;
    const allNodes = [...signatures.keys()];

    // TODO: next steps:
    // 2. Object.assign props into the signature obj of every node (another traversal, just for side-effects, ie visit)
    for (let [node, sig] of signatures.entries()) {
        Object.assign(sig, computeSignatureFor(node));
    }


    // Replace {ref: ...} values in the signatures map, until the map stabilises
    let isStable = false;
    while (!isStable) {
        isStable = true;
        for (let [_, sig] of signatures) {
            if (Array.isArray(sig.$) || sig.$.bindingName) continue; // only handle direct refs in this loop
            Object.assign(sig, sigFor(sig.$.ref));
            isStable = false;
        }
    }

    // Replace {ref: ..., bindingName: ...} values in the signatures map, until the map stabilises
    isStable = false;
    while (!isStable) {
        isStable = true;
        for (let [_, sig] of signatures) {
            if (Array.isArray(sig.$)) continue; // only handle direct refs in this loop

            // TODO: ... a bit like findReferencedNode
            // - can 'see through' some node kinds (eg Module), but not others (eg ApplicationExpression)
            // switch (ref.kind) {
            //     case ''
            // }
            switch (sig.$.ref.kind) {
                case 'ReferenceExpression':
                    let refdExpr = findReferencedExpression(sig.$.ref);
                    console.log(`=====>   REF1: ${refdExpr.kind}.${sig.$.bindingName}`);
                    break;
                default:
                    console.log(`=====>   REF2: ${sig.$.ref.kind}.${sig.$.bindingName}`);
                }
        }
    }




    // TODO:
    // 3. mapMap from sigs to hashes using object-hash
    // 4. add the map of node hashes to program.meta.nodeHashes (new meta prop)









    // TODO: temp testing... remove...
    const bnds = [] as number[];
    for (let i = 0; i < allNodes.length; ++i) {
        if (allNodes[i].kind === 'SimpleBinding'
            //|| allNodes[i].kind === 'DestructuredBinding'
        ) {
            bnds.push(i);
        }
    }




    return program;


    // TODO: doc...
    function computeSignatureFor(n: Node<Metadata>): Signature {
        switch (n.kind) {

            // Simple nodes
            case 'BooleanLiteralExpression': return {$: ['LIT', n.value]};
            case 'ExtensionFile': return {$: ['EXF', n.path]};
            case 'NullLiteralExpression': return {$: ['LIT', n.value]};
            case 'NumericLiteralExpression': return {$: ['LIT', n.value]};
            case 'StringLiteralExpression': return {$: ['STR', n.value, n.abstract, n.concrete]};
            case 'Program': return {$: ['PRG']}; // special case - only one of these

            // Compound nodes
            case 'ApplicationExpression': return {$: ['APP', sigFor(n.lambda), sigFor(n.argument)]};
            case 'FieldExpression': return {$: ['FLD', sigFor(n.name), sigFor(n.value)]};
            // case 'LambdaExpression': TODO: ...
            case 'ListExpression': return {$: ['LST', n.elements.map(e => sigFor(e))]};
            case 'Module': {
                // Ensure binding order doesn't affect hash value
                let obj = {} as Record<string, unknown>;
                for (let binding of n.bindings) {
                    assert(binding.kind === 'SimpleBinding');
                    obj[binding.name] = sigFor(binding.value);
                }
                return {$: ['MOD', obj]};
            }
            case 'NotExpression': return {$: ['NOT', sigFor(n.expression)]};
            case 'QuantifiedExpression': return {$: ['QUA', sigFor(n.expression), n.quantifier]};
            case 'RecordExpression': return {$: ['REC', n.fields.map(f => ({n: f.name, v: sigFor(f.value)}))]};
            case 'SelectionExpression': return {$: ['SEL', n.expressions.map(e => sigFor(e))]};
            case 'SequenceExpression': return {$: ['SEQ', n.expressions.map(e => sigFor(e))]};

            // Aliasing nodes (ie nodes that *directly* create graph cycles)
            case 'BindingLookupExpression': return {$: {ref: n.module, bindingName: n.bindingName}};
            case 'ImportExpression': return {$: {ref: program.sourceFiles.get(n.sourceFilePath)!}};
            case 'ModuleExpression': return {$: {ref: n.module}};
            case 'PenSourceFile': return {$: {ref: n.module}};
            case 'ReferenceExpression': return {$: {ref: findReferencedExpression(n)}};
            case 'SimpleBinding': return {$: {ref: n.value}};

            // All kinds handled. Should never reach here.
            case 'DestructuredBinding': throw 0;
            case 'ParenthesisedExpression': throw 0;
            default: ((assertNoKindsLeft: never) => { throw new Error(`Unhandled node ${assertNoKindsLeft}`); })(n);
        }
    }

    function findReferencedExpression(ref: ReferenceExpression<Metadata>): Expression<Metadata> {
        let symbolId = ref.meta.symbolId;
        let result = allNodes.find(n => n.kind === 'SimpleBinding' && n.meta.symbolId === symbolId);
        assert(result && result.kind === 'SimpleBinding');
        return result.value;
    }
}
