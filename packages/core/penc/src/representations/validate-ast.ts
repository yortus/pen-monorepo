import {Node, NodeKinds, traverseNode} from '../ast-nodes';
import {assert, isDebugMode} from '../utils';
import {AST} from './ast';


// TODO: jsdoc...
export function validateAST<K extends Node['kind']>(ast: AST, nodeKinds: NodeKinds<K>) {
    // Only perform these checks in debug mode, otherwise skip them.
    if (!isDebugMode()) return;

    // Ensure only allowed node kinds are present in the representation.
    traverseNode(ast.module, n => assert(nodeKinds.matches(n), `Unexpected node kind '${n.kind}'`));
}
