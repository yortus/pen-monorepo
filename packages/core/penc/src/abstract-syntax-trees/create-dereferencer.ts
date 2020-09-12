import {assert} from '../utils';
import type {AbstractSyntaxTree, Expression, GlobalBinding, GlobalReferenceExpression, MemberExpression, Module} from './nodes';
import {traverseAst} from './traverse-ast';


/**
 * Returns a function that can follow references from a given node to the node it refers to within the same AST.
 * Only certain node types can be dereferenced, namely GlobalReferenceExpression and MemberExpression. Dereferencing
 * other expression nodes will return the given node unchanged.
 * NB: Some reference/member expressions cannot be statically dereferenced. This is a current implementation limitation.
 * @param ast the AST containing all possible nodes that may be dereferencing targets.
 */
export function createDereferencer(ast: AbstractSyntaxTree) {

    // Make a flat list of every GlobalBinding in the entire program. This will be needed for dereferencing ref exprs.
    const allBindings = [] as GlobalBinding[];
    traverseAst(ast as AbstractSyntaxTree, n => n.kind === 'GlobalBinding' ? allBindings.push(n) : 0);

    // Return the dereference function closed over the given AST.
    return deref as DereferenceFunction;

    // The dereference function, closed over the given AST.
    function deref(expr: Expression): Expression {
        let seen = [expr];
        while (true) {
            // LocalReferenceExpression is not allowed for `expr`, as per jsdoc on DereferenceFunction.
            assert(expr.kind !== 'LocalReferenceExpression');

            // If `expr` is a reference or member expression, try to resolve to its target expression.
            let tgt: Expression | undefined;
            if (expr.kind === 'GlobalReferenceExpression') {
                // Global references can always be resolved to their target node (which may be another deref'able node).
                tgt = resolveReference(expr);
            }
            else if (expr.kind === 'MemberExpression') {
                // Member expressions _may_ have an identifiable target node, but not always.
                tgt = resolveMember(expr);
            }

            // If the target expression for `expr` could not be determined, return `expr` unchanged.
            if (tgt === undefined) return expr;

            // If `expr` resolved to a target expression that isn't a ref|mem expression, return the target expression.
            if (tgt.kind !== 'GlobalReferenceExpression' && tgt.kind !== 'MemberExpression') return tgt;

            // If the target expression is still a ref|mem expression, keep iterating, but prevent an infinite loop.
            if (seen.includes(tgt)) {
                // TODO: improve diagnostic message, eg line/col ref
                let name = tgt.kind === 'GlobalReferenceExpression' ? tgt.globalName : tgt.bindingName;
                throw new Error(`'${name}' is circularly defined`);
            }
            seen.push(tgt);
            expr = tgt;
        }
    }

    /** Find the value expression referenced by `ref`. */
    function resolveReference(ref: GlobalReferenceExpression): Expression {
        let result = allBindings.find(n => n.globalName === ref.globalName);
        assert(result);
        return result.value;
    }

    /**
     * Find the value expression referenced by `module`.`bindingName`, if possible, otherwise return `undefined`.
     * Some lookups always succeed, such as when `module` is a module expression. Other lookups always fail, such
     * as when `module` is an application expression, or an import expression referencing an extension file.
     */
    function resolveMember(mem: MemberExpression): Expression | undefined {
        let moduleExpr = deref(mem.module);
        let module: Module;
        switch (moduleExpr.kind) {
            // TODO: case 'ApplicationExpression': ...
            case 'ImportExpression': {
                module = ast.modulesByAbsPath.get(moduleExpr.sourceFilePath)!;
                break;
            }
            case 'ModuleExpression': {
                module = moduleExpr.module;
                break;
            }
            default:
                return undefined;
        }

        // Do a static lookup of the expression bound to the name `bindingName` in the module `module`.
        let binding = module.bindings.find(b => {
            assert(b.kind === 'GlobalBinding');
            return b.localName === mem.bindingName;
        });
        assert(binding);
        return binding.value;
    }
}


/**
 * A function that returns the result of _dereferencing_ the expression node `expr`. If `expr` is a global reference
 * or member expression, then the returned node will be the node `expr` refers to in the same AST, if it can be
 * statically determined. In all other cases, `expr` is returned unchanged.
 * NB: LocalReferenceExpression nodes cannot be dereferenced, and will throw an error if encountered.
 * NB2: the result of dereferencing an expression is guaranteed to never be a global reference or import expression.
 */
export interface DereferenceFunction {
    <E extends Expression>(expr: E): E extends {kind: 'GlobalReferenceExpression' | 'ImportExpression'} ? never : E;
}
