import {allNodeKinds, NodeKinds} from '../ast-nodes';
import {assert, isDebugMode} from '../utils';
import {traverseNode} from './traverse-node';
import {AST, Version} from './versioned-ast';


// TODO: jsdoc...
export function validateAST<V extends Version>(v: V, ast: AST<V>) {
    // Only perform these checks in debug mode, otherwise skip them.
    if (!isDebugMode()) return;

    let nodeKinds: NodeKinds<any>; // TODO: don't use any type
    if (v === 0) {
        nodeKinds = allNodeKinds;
    }
    else /* v === 1 */ {
        nodeKinds = allNodeKinds.without(
            'Binding',
            'BindingList',
            'ImportExpression',
            // TODO: was... 'MemberExpression', but this _could_ still be present given extensions, right? Then input===output kinds
            // TODO: was... but GenericExpr#param may be this kind... 'ModulePattern',
            'ParenthesisedExpression',
        );

    }

    // Ensure only allowed node kinds are present in the representation.
    traverseNode(ast.module, n => assert(nodeKinds.matches(n), `Unexpected node kind '${n.kind}'`));
}
