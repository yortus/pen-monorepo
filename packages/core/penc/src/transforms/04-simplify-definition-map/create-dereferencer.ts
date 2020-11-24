import type {Definition, Expression, ModuleStub} from '../../abstract-syntax-trees';


// TODO: review this outdated jsdoc comment...
/**
 * Returns a function that can follow references from a given node to the node it refers to within the same AST.
 * The result of dereferencing a node is computed as follows:
 * - ParenthesisedExpression: deref of the inner expression 
 * - GlobalReferenceExpression: deref of the value of the binding with the same globalName as the reference.
 * - MemberExpression: deref of the value of the binding refered to (TODO: clearer wording?)
 * - any other node kind: the node itself, unchanged.
 * NB: Some reference/member expressions cannot be statically dereferenced. This is a current implementation limitation.
 * @param ast the AST containing all possible nodes that may be dereferencing targets.
 */
export function createDereferencer(definitions: Record<string, Definition>) {

    // Return the dereference function closed over the given AST.
    return deref as DereferenceFunction;

    // The dereference function, closed over the given AST.
    function deref(expr: Expression | ModuleStub): Expression | ModuleStub {
        const seen = [expr];
        while (true) {
            // If `expr` is a par|ref|mem expression, resolve to its target expression.
            if (expr.kind === 'ParenthesisedExpression') {
                expr = expr.expression;
            }
            else if (expr.kind === 'Reference') {
                expr = definitions[expr.definitionId].value;
            }
            else {
                // If `expr` resolved to an expression that isn't a par|ref|mem expression, return it as-is.
                return expr;
            }

            // If `expr` is still a par|ref|mem expression, keep iterating, but prevent an infinite loop.
            if (seen.includes(expr)) {
                // TODO: improve diagnostic message, eg line/col ref
                const name = expr.kind === 'Reference' ? definitions[expr.definitionId].localName : '(?)'; // TODO: fix non-ref case!
                throw new Error(`'${name}' is circularly defined`);
            }
            seen.push(expr);
        }
    }
}


/**
 * A function that returns the result of _dereferencing_ the expression node `expr`. If `expr` is a parenthesised,
 * global reference, or member expression, then the returned node will be the node `expr` refers to in the same AST, if
 * it can be statically determined. In all other cases, `expr` is returned unchanged.
 * NB: Identifier nodes cannot be dereferenced, and will throw an error if encountered.
 * NB2: the result of dereferencing an expression is guaranteed to never be a parenthesised or global reference expr.
 */
export interface DereferenceFunction {
    <E extends Expression | ModuleStub>(expr: E): E extends {kind: 'ParenthesisedExpression' | 'Reference'} ? never : E;
}
