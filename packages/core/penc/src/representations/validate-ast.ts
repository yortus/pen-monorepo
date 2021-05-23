import {assert, isDebugMode} from '../utils';
import {traverseNode} from './traverse-node';
import {AST, Version} from './versioned-ast';


// TODO: jsdoc...
export function validateAST(ast: AST<Version>) {
    // Only perform these checks in debug mode, otherwise skip them.
    if (!isDebugMode()) return;

    // Validate AST version.
    if (!allAstVersions.includes(ast.version)) throw new Error(`Unrecognised AST version '${ast.version}'`);

    // Validate each node in the AST.
    traverseNode(ast.start, n => {
        assert(allNodeKinds.includes(n.kind), `Unrecognised node kind '${n.kind}'`)
        if (ast.version === 100) {
            if (n.kind === 'Module' || n.kind === 'LetExpression') {
                assert(Array.isArray(n.bindings), `Expected bindings property to be an array`);
            }
        }

        if (ast.version === 200 || ast.version === 300) {
            if (['Binding', 'ImportExpression', 'ModulePattern', 'ParenthesisedExpression'].includes(n.kind)) {
                throw new Error(`Node kind '${n.kind}' is not permitted in AST v${ast.version}`);
            }
            if (n.kind === 'Module' || n.kind === 'LetExpression') {
                assert(!Array.isArray(n.bindings), `Expected bindings property to be a plain object`);
            }
            if (n.kind === 'GenericExpression') {
                assert(n.body.kind === 'LetExpression');
            }
        }

        // TODO: V300: LetExpr can only appear once at root and once per GenExpr, and nowhere else in AST
    });
}


const allAstVersions = [100, 200, 300, 400];


const allNodeKinds = [
    'Binding',
    'BooleanLiteral',
    'ByteExpression',
    'CodeExpression',
    'Field',
    'Identifier',
    'ImportExpression',
    'InstantiationExpression',
    'Intrinsic',
    'GenericExpression',
    'GenericParameter',
    'LetExpression',
    'ListExpression',
    'MemberExpression',
    'Module',
    'ModulePattern',
    'NotExpression',
    'NullLiteral',
    'NumericLiteral',
    'ParenthesisedExpression',
    'QuantifiedExpression',
    'RecordExpression',
    'SelectionExpression',
    'SequenceExpression',
    'Splice',
    'StringLiteral',
] as const;
