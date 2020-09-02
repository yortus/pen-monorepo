// import {AstType, ExtractNode, AbstractSyntaxTree, NodeKind, traverseAst} from '../abstract-syntax-trees';
// import {assert} from '../utils';


// // TODO: temp testing...
// type DereferenceableNodeKind = Exclude<NodeKind, 'LocalBinding' | 'LocalMultiBinding' | 'LocalReferenceExpression'>;
// type DereferenceableNode = ExtractNode<AstType<DereferenceableNodeKind>>;
// type DereferencedNode<N extends DereferenceableNodeKind> = N extends {kind: 'GlobalReferenceExpression' | 'ImportExpression'} ? never : N;
// type Expression = ExtractNode<AstType<DereferenceableNodeKind>, 'Expression'>;
// type GlobalBinding = ExtractNode<AstType<DereferenceableNodeKind>, 'GlobalBinding'>;
// type GlobalReferenceExpression = ExtractNode<AstType<DereferenceableNodeKind>, 'GlobalReferenceExpression'>;
// type MemberExpression = ExtractNode<AstType<DereferenceableNodeKind>, 'MemberExpression'>;
// type Module = ExtractNode<AstType<DereferenceableNodeKind>, 'Module'>;



// // TODO: jsdoc...
// // - return value is *never* an LocalReferenceExpression or an ImportExpression
// // - TODO: can we impl these such that the 'resolve symbol refs' transform can be removed?
// export function createNodeDereferencer(ast: AbstractSyntaxTree<DereferenceableNodeKind>) {


//     // TODO: ...
//     // Make a flat list of every GlobalBinding in the entire program.
//     const allBindings = [] as GlobalBinding[];
//     traverseAst(ast, n => n.kind === 'GlobalBinding' ? allBindings.push(n) : 0);

//     return deref;

//     // TODO: jsdoc...
//     function deref<N extends DereferenceableNode>(node: N): DereferencedNode<N['kind']> {
//         let seen = [node];
//         while (true) {
//             // If `expr` is a reference or member expression, try to resolve to its target expression.
//             let tgt = node.kind === 'GlobalReferenceExpression' ? resolveReference(node)
//                 : node.kind === 'MemberExpression' ? resolveMember(node)
//                 : undefined;

//             // If the target expression for `expr` could not be determined, return `expr` unchanged.
//             if (tgt === undefined) return node;

//             // If `expr` resolved to a target expression that isn't a Ref/Mem expression, return the target expression.
//             if (tgt.kind !== 'GlobalReferenceExpression' && tgt.kind !== 'MemberExpression') return tgt;

//             // If the target expression is still a Ref/Mem expression, keep iterating, but prevent an infinite loop.
//             if (seen.includes(tgt)) {
//                 // TODO: improve diagnostic message, eg line/col ref
//                 let name = tgt.kind === 'GlobalReferenceExpression' ? tgt.globalName : tgt.bindingName;
//                 throw new Error(`'${name}' is circularly defined`);
//             }
//             seen.push(tgt);
//             node = tgt;
//         }
//     }

//     /** Find the value expression referenced by `ref`. */
//     function resolveReference(ref: GlobalReferenceExpression): Expression {
//         let result = allBindings.find(n => n.globalName === ref.globalName);
//         assert(result);
//         return result.value;
//     }

//     /**
//      * Find the value expression referenced by `module`.`bindingName`, if possible, otherwise return `undefined`.
//      * Some lookups always succeed, such as when `module` is a module expression. Other lookups always fail, such
//      * as when `module` is an application expression, or an import expression referencing an extension file.
//      */
//     function resolveMember(mem: MemberExpression): Expression | undefined {
//         let moduleExpr = deref(mem.module);
//         let module: Module;
//         switch (moduleExpr.kind) {
//             // TODO: case 'ApplicationExpression': ...
//             case 'ImportExpression': {
//                 module = program.sourceFiles.byAbsPath.get(moduleExpr.sourceFilePath)!;
//                 break;
//             }
//             case 'ModuleExpression': {
//                 module = moduleExpr.module;
//                 break;
//             }
//             default:
//                 return undefined;
//         }

//         // Do a static lookup of the expression bound to the name `bindingName` in the module `module`.
//         let binding = module.bindings.find(b => b.localName === mem.bindingName);
//         assert(binding);
//         return binding.value;
//     }
// }
