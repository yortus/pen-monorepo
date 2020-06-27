import {Node, Program} from '../../ast-nodes';
import {traverseDepthFirst} from '../../utils';
import {Metadata} from './metadata';


// TODO: doc...
export function computeNodeHashes(program: Program<Metadata>) {

    let sigs = new Map<Node<Metadata>, Record<string, unknown>>();
    traverseDepthFirst(program, n => sigs.set(n, {}));

    // TODO: next steps:
    // 2. Object.assign props into the signature obj of every node (another traversal, just for side-effects, ie visit)
    for (let [node, sig] of sigs.entries()) {
        Object.assign(sig, getSignatureFor(node));
    }

    // TODO:
    // 3. mapMap from sigs to hashes using object-hash
    // 4. add the map of node hashes to program.meta.nodeHashes (new meta prop)

    return program;


    // TODO: doc...
    function getSignatureFor(n: Node<Metadata>): unknown {
        switch (n.kind) {
            case 'ApplicationExpression': return {kind: 'APP', l: sigs.get(n.lambda), a: sigs.get(n.argument)};
            // case 'Binding': return;
            case 'BindingLookupExpression': return {kind: 'BLE', m: sigs.get(n.module), n: n.bindingName};
            case 'BooleanLiteralExpression': return {kind: 'LIT', value: n.value};
            case 'ExtensionFile': return {kind: 'EXF', p: n.path};
            case 'FieldExpression': return {kind: 'FEX', n: sigs.get(n.name), v: sigs.get(n.value)};
            case 'ImportExpression': return sigs.get(program.sourceFiles.get(n.sourceFilePath)!);
            // // case 'LambdaExpression': TODO: ...
            case 'ListExpression': return {kind: 'LST', e: n.elements.map(e => sigs.get(e))};
            case 'Module':
                // return {kind: 'MOD', b: n.bindings};
                // TODO!!!
                // - binding order not important
                // - need to 'normalise' - ie:
                //   a) get a flat list of binding names from either VariablePattern or ModulePatternName nodes
                //   b) link each binding name to appropriate rhs signature - either direct, or equiv of BLE
                return;
            case 'ModuleExpression': return sigs.get(n.module);
            // case 'ModulePattern': return;
            // case 'ModulePatternName': return;
            case 'NotExpression': return {kind: 'NOT', e: sigs.get(n.expression)};
            case 'NullLiteralExpression': return {kind: 'LIT', value: n.value};
            case 'NumericLiteralExpression': return {kind: 'LIT', value: n.value};
            case 'ParenthesisedExpression': return sigs.get(n);
            case 'PenSourceFile': return sigs.get(n.module);
            case 'Program': return {kind: 'PRG'}; // only one of these
            case 'QuantifiedExpression': return {kind: 'QUA', e: sigs.get(n.expression), q: n.quantifier};
            case 'RecordExpression': return {kind: 'REC', f: n.fields.map(f => sigs.get(f))};
            case 'ReferenceExpression':
                // TODO: must be same hash value as its referent - how to look it up?
                program.meta.symbolTable.getSymbolById(n.meta.symbolId);
                return;
            case 'SelectionExpression': return {kind: 'SEL', e: n.expressions.map(e => sigs.get(e))};
            case 'SequenceExpression': return {kind: 'SEQ', e: n.expressions.map(e => sigs.get(e))};
            case 'StaticField': return {kind: 'STF', n: n.name, v: sigs.get(n.value)};
            case 'StringLiteralExpression': return {kind: 'STR', value: n.value, a: n.abstract, c: n.concrete};
            // case 'VariablePattern': return;
            // default: ((assertNoKindsLeft: never) => { throw new Error(`Unhandled node ${assertNoKindsLeft}`); })(n);
        }

        // TODO: ...
    }
}
