import {assert} from '../utils';
import type {AbstractSyntaxTree, Expression, GlobalBinding, GlobalReferenceExpression, MemberExpression, Module} from './nodes';
import {traverseAst} from './traverse-ast';






/**
 * A function that returns the result of _dereferencing_ the expression node `expr`. If expr is a global reference
 * or member expression, then the returned node will be the node `expr` refers to in the same AST, if it can be
 * statically determined. In all other cases, `expr` is returned unchanged.
 * NB: the result of dereferencing an expression is guaranteed to never be a global reference or import expression.
 */
export type DereferenceFunction = <E extends Expression>(expr: E) => E extends {kind: 'GlobalReferenceExpression' | 'ImportExpression'} ? never : E





// TODO: _do_ statically enforce DereferenceableNodeKind constraint somehow...
//type DereferenceableNodeKind = Exclude<NodeKind, 'LocalBinding' | 'LocalMultiBinding' | 'LocalReferenceExpression'>;









export function createDereferencer(ast: AbstractSyntaxTree) {

    // TODO: ...
    // Make a flat list of every GlobalBinding in the entire program.
    const allBindings = [] as GlobalBinding[];
    traverseAst(ast as AbstractSyntaxTree, n => n.kind === 'GlobalBinding' ? allBindings.push(n) : 0);

    // TODO: ... better typing? generic?
    return deref as DereferenceFunction;

    // TODO: jsdoc...
    function deref(expr: Expression): Expression {
        let seen = [expr];
        while (true) {
            // If `expr` is a reference or member expression, try to resolve to its target expression.
            let tgt = expr.kind === 'GlobalReferenceExpression' ? resolveReference(expr)
                : expr.kind === 'MemberExpression' ? resolveMember(expr)
                : undefined;

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
