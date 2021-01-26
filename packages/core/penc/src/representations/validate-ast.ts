import {assert, isDebugMode} from '../utils';
import {traverseNode} from './traverse-node';
import {AST, Version} from './versioned-ast';


// TODO: jsdoc...
export function validateAST<V extends Version>(ast: AST<V>) {
    // Only perform these checks in debug mode, otherwise skip them.
    if (!isDebugMode()) return;

    // Validate AST version.
    if (!allAstVersions.includes(ast.version)) throw new Error(`Unrecognised AST version '${ast.version}'`);

    // Validate each node in the AST.
    traverseNode(ast.module, n => {
        assert(allNodeKinds.includes(n.kind), `Unrecognised node kind '${n.kind}'`)
        if (ast.version === 100) {
            if (n.kind === 'Module' || n.kind === 'LetExpression') {
                assert(Array.isArray(n.bindings), `Expected bindings property to be an array`);
            }
        }
        else if (ast.version === 200) {
            if (['Binding', 'ImportExpression', 'ParenthesisedExpression'].includes(n.kind)) {
                throw new Error(`Node kind '${n.kind}' is not permitted in AST v${ast.version}`);
            }
            if (n.kind === 'Module' || n.kind === 'LetExpression') {
                assert(!Array.isArray(n.bindings), `Expected bindings property to be a plain object`);
            }
        }
        else if (ast.version === 300) {
            if (['Binding', 'ImportExpression', 'ParenthesisedExpression, LetExpression', 'GenericExpression'].includes(n.kind)) {
                throw new Error(`Node kind '${n.kind}' is not permitted in AST v${ast.version}`);
            }
            if (n.kind === 'Module') {
                assert(!Array.isArray(n.bindings), `Expected bindings property to be a plain object`);
            }
        }
    });
}


const allAstVersions = [100, 200, 300];


const allNodeKinds = [
    'Binding',
    'BooleanLiteral',
    'FieldExpression',
    'Identifier',
    'ImportExpression',
    'InstantiationExpression',
    'Intrinsic',
    'GenericExpression',
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
    'StringLiteral',
] as const;
