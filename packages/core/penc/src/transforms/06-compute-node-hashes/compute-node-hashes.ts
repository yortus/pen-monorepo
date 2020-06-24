import {Node, Program} from '../../ast-nodes';
import {mapMap} from '../../utils';
import {Metadata} from './metadata';


// TODO: doc...
export function computeNodeHashes(program: Program<Metadata>) {

    let hashableValues = new Map<Node<Metadata>, Record<string, unknown>>();
    traverseAstDepthFirst(program, n => hashableValues.set(n, {}));

    // TODO: next steps:
    // 2. Object.assign props into the hashableValue of every node (another traversal, just for side-effects, ie visit)
    // 3. mapMap from hashableValues to hashes using object-hash
    // 4. add the map of node hashes to program.meta.nodeHashes (new meta prop)

    return program;
}


// // TODO: doc...
// function getHashableValue(n: Node<Metadata>): void {
//     const rec = getHashableValue;
//     switch (n.kind) {
//         // case 'ApplicationExpression': return rec(n.lambda), rec(n.argument), undefined;
//         // case 'Binding': return rec(n.pattern), rec(n.value), undefined;
//         // case 'BindingLookupExpression': return rec(n.module), undefined;
//         // case 'BooleanLiteralExpression': return;
//         // case 'ExtensionFile': return;
//         // case 'FieldExpression': return rec(n.name), rec(n.value), undefined;
//         // case 'ImportExpression': return;
//         // // case 'LambdaExpression': TODO: ...
//         // case 'ListExpression': return n.elements.forEach(rec), undefined;
//         // case 'Module': return n.bindings.forEach(rec), undefined;
//         // case 'ModuleExpression': return rec(n.module), undefined;
//         // case 'ModulePattern': return n.names.forEach(rec), undefined;
//         // case 'ModulePatternName': return;
//         // case 'NotExpression': return rec(n.expression), undefined;
//         case 'NullLiteralExpression': return null;
//         // case 'NumericLiteralExpression': return;
//         // case 'ParenthesisedExpression': return rec(n.expression), undefined;
//         // case 'PenSourceFile': return rec(n.module), undefined;
//         // case 'Program': return mapMap(n.sourceFiles, rec), undefined;
//         // case 'QuantifiedExpression': return rec(n.expression), undefined;
//         // case 'RecordExpression': return n.fields.forEach(rec), undefined;
//         // case 'ReferenceExpression': return;
//         // case 'SelectionExpression': return n.expressions.forEach(rec), undefined;
//         // case 'SequenceExpression': return n.expressions.forEach(rec), undefined;
//         // case 'StaticField': return rec(n.value), undefined;
//         // case 'StringLiteralExpression': return;
//         // case 'VariablePattern': return;
//         // default: ((assertNoKindsLeft: never) => { throw new Error(`Unhandled node ${assertNoKindsLeft}`); })(n);
//     }

//     // TODO: ...
// }


// TODO: doc...
function traverseAstDepthFirst(program: Program<Metadata>, cb: (n: Node<Metadata>) => void): void {
    rec(program);
    function rec(n: Node<Metadata>): void {
        switch (n.kind) {
            case 'ApplicationExpression': return rec(n.lambda), rec(n.argument), cb(n);
            case 'Binding': return rec(n.pattern), rec(n.value), cb(n);
            case 'BindingLookupExpression': return rec(n.module), cb(n);
            case 'BooleanLiteralExpression': return cb(n);
            case 'ExtensionFile': return cb(n);
            case 'FieldExpression': return rec(n.name), rec(n.value), cb(n);
            case 'ImportExpression': return cb(n);
            // case 'LambdaExpression': TODO: ...
            case 'ListExpression': return n.elements.forEach(rec), cb(n);
            case 'Module': return n.bindings.forEach(rec), cb(n);
            case 'ModuleExpression': return rec(n.module), cb(n);
            case 'ModulePattern': return n.names.forEach(rec), cb(n);
            case 'ModulePatternName': return cb(n);
            case 'NotExpression': return rec(n.expression), cb(n);
            case 'NullLiteralExpression': return cb(n);
            case 'NumericLiteralExpression': return cb(n);
            case 'ParenthesisedExpression': return rec(n.expression), cb(n);
            case 'PenSourceFile': return rec(n.module), cb(n);
            case 'Program': return mapMap(n.sourceFiles, rec), cb(n);
            case 'QuantifiedExpression': return rec(n.expression), cb(n);
            case 'RecordExpression': return n.fields.forEach(rec), cb(n);
            case 'ReferenceExpression': return cb(n);
            case 'SelectionExpression': return n.expressions.forEach(rec), cb(n);
            case 'SequenceExpression': return n.expressions.forEach(rec), cb(n);
            case 'StaticField': return rec(n.value), cb(n);
            case 'StringLiteralExpression': return cb(n);
            case 'VariablePattern': return cb(n);
            default: ((assertNoKindsLeft: never) => { throw new Error(`Unhandled node ${assertNoKindsLeft}`); })(n);
        }
    }
}
