import {assert, isDebugMode} from '../utils';
import {traverseNode} from './traverse-node';
import {AST, Node, NORMAL, RAW, Version} from './versioned-ast';


// TODO: jsdoc...
export function validateAST<V extends Version>(ast: AST<V>) {
    // Only perform these checks in debug mode, otherwise skip them.
    if (!isDebugMode()) return;

    const excludedNodeKinds = [] as Array<Node['kind']>;
    if (ast.version === RAW) {
        excludedNodeKinds.push(
            'Module',
            // TODO: others?
        );
    }
    else if (ast.version === NORMAL) {
        excludedNodeKinds.push(
            'Binding',
            'BindingList',
            'ImportExpression',
            // TODO: was... 'MemberExpression', but this _could_ still be present given extensions, right? Then input===output kinds
            // TODO: was... but GenericExpr#param may be this kind... 'ModulePattern',
            'ParenthesisedExpression',
        );
    }
    else {
        throw new Error(`Unrecognised AST version '${ast.version}'`);
    }

    // Ensure only allowed node kinds are present in the representation.
    traverseNode(ast.module, n => assert(!excludedNodeKinds.includes(n.kind), `Unexpected node kind '${n.kind}'`));
}
