import {ExtractNode, AbstractSyntaxTree, Node, NodeKind, traverseAst} from '../abstract-syntax-trees';
import {assert} from '../utils';


// TODO: jsdoc...
// - return value is *never* an LocalReferenceExpression or an ImportExpression
// - TODO: can we impl these such that the 'resolve symbol refs' transform can be removed?
export function createNodeDereferencer<KS extends DereferenceableNodeKind>(ast: AbstractSyntaxTree<KS>) {

    // TODO: ...
    // Make a flat list of every GlobalBinding in the entire program.
    const allBindings = [] as GlobalBinding[];
    traverseAst(ast as unknown as DereferenceableAst, n => n.kind === 'GlobalBinding' ? allBindings.push(n) : 0);

    // TODO: ... better typing? generic?
    return deref as (node: Node) => Node<Exclude<NodeKind, 'GlobalReferenceExpression' | 'ImportExpression'>>;

    // TODO: jsdoc...
    function deref(node: Node): Node {
        let seen = [node];
        while (true) {
            // If `expr` is a reference or member expression, try to resolve to its target expression.
            let tgt = node.kind === 'GlobalReferenceExpression' ? resolveReference(node)
                : node.kind === 'MemberExpression' ? resolveMember(node)
                : undefined;

            // If the target expression for `expr` could not be determined, return `expr` unchanged.
            if (tgt === undefined) return node;

            // If `expr` resolved to a target expression that isn't a ref|mem expression, return the target expression.
            if (tgt.kind !== 'GlobalReferenceExpression' && tgt.kind !== 'MemberExpression') return tgt;

            // If the target expression is still a ref|mem expression, keep iterating, but prevent an infinite loop.
            if (seen.includes(tgt)) {
                // TODO: improve diagnostic message, eg line/col ref
                let name = tgt.kind === 'GlobalReferenceExpression' ? tgt.globalName : tgt.bindingName;
                throw new Error(`'${name}' is circularly defined`);
            }
            seen.push(tgt);
            node = tgt;
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


// TODO: temp testing...
type DereferenceableNodeKind = Exclude<NodeKind, 'LocalBinding' | 'LocalMultiBinding' | 'LocalReferenceExpression'>;
type DereferenceableAst = AbstractSyntaxTree<DereferenceableNodeKind>;
//type DereferencedNode<N extends DereferenceableNodeKind> = N extends {kind: 'GlobalReferenceExpression' | 'ImportExpression'} ? never : N;
type Expression = ExtractNode<AbstractSyntaxTree, 'Expression'>;
type GlobalBinding = ExtractNode<AbstractSyntaxTree, 'GlobalBinding'>;
type GlobalReferenceExpression = ExtractNode<AbstractSyntaxTree, 'GlobalReferenceExpression'>;
type MemberExpression = ExtractNode<AbstractSyntaxTree, 'MemberExpression'>;
type Module = ExtractNode<AbstractSyntaxTree, 'Module'>;
