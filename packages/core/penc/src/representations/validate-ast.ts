import {NodeKinds} from '../ast-nodes';
import {assert, isDebugMode} from '../utils';
import {traverseNode} from './traverse-node';
import {AST, Node, Version} from './versioned-ast';


// TODO: jsdoc...
export function validateAST<K extends Node<V>['kind'], V extends Version>(ast: AST<V>, nodeKinds: NodeKinds<K>) {
    // Only perform these checks in debug mode, otherwise skip them.
    if (!isDebugMode()) return;

    // Ensure only allowed node kinds are present in the representation.
    traverseNode(ast.module, n => assert(nodeKinds.matches(n), `Unexpected node kind '${n.kind}'`));
}
