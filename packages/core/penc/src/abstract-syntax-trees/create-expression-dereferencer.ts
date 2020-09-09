import {assert} from '../utils';
import {NodeKind} from './node-kind';
import type {AbstractSyntaxTree, Expression, GlobalBinding, GlobalReferenceExpression, MemberExpression, Module} from './nodes';
import {traverseAst} from './traverse-ast';




// TODO: temp testing...
//type DereferenceableNodeKind = Exclude<NodeKind, 'LocalBinding' | 'LocalMultiBinding' | 'LocalReferenceExpression'>;
type Deref = <E extends Expression>(expr: E) => E extends {kind: 'GlobalReferenceExpression' | 'ImportExpression'} ? never : E



export type DereferencedNodeKind = Exclude<NodeKind, ExcludedDereferencedNode>;
export const DereferencedNodeKind = NodeKind.filter(k => !ExcludedDereferencedNode.includes(k as any)) as DereferencedNodeKind[];
type ExcludedDereferencedNode = typeof ExcludedDereferencedNode[any];
const ExcludedDereferencedNode = [
    'GlobalReferenceExpression',
    'ImportExpression',
] as const;








// TODO: jsdoc...
// - return value is *never* an LocalReferenceExpression or an ImportExpression
// - TODO: can we impl these such that the 'resolve symbol refs' transform can be removed?

// TODO: _do_ statically enforce DereferenceableNodeKind constraint somehow...
export function createExpressionDereferencer(ast: AbstractSyntaxTree) {

    // TODO: ...
    // Make a flat list of every GlobalBinding in the entire program.
    const allBindings = [] as GlobalBinding[];
    traverseAst(ast as AbstractSyntaxTree, n => n.kind === 'GlobalBinding' ? allBindings.push(n) : 0);

    // TODO: ... better typing? generic?
    return deref as Deref;

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
