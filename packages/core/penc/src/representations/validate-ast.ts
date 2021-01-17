import {assert, isDebugMode} from '../utils';
import {traverseNode} from './traverse-node';
import {UNKNOWN, AST, Node, Version} from './versioned-ast';


// TODO: jsdoc...
export function validateAST<V extends Version>(v: V, ast: AST<V>) {
    // Only perform these checks in debug mode, otherwise skip them.
    if (!isDebugMode()) return;

    const excludedNodeKinds = [] as Array<Node['kind']>;
    if (v === UNKNOWN) {
        // no-op
    }
    else /* v === NORMAL */ {
        excludedNodeKinds.push(
            'Binding',
            'BindingList',
            'ImportExpression',
            // TODO: was... 'MemberExpression', but this _could_ still be present given extensions, right? Then input===output kinds
            // TODO: was... but GenericExpr#param may be this kind... 'ModulePattern',
            'ParenthesisedExpression',
        );

    }

    // Ensure only allowed node kinds are present in the representation.
    traverseNode(ast.module, n => assert(!excludedNodeKinds.includes(n.kind), `Unexpected node kind '${n.kind}'`));
}
