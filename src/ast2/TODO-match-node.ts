// import {AstVersion, Node, NodeFromKind, NodeKind} from './type-operators';


// /**
//  * Looks for a property in `handlers` whose key matches the kind of the given `node`, and invokes the
//  * corresponding handler function, passing `node` as an argument. If the `handlers` object does not have
//  * a property matching the given node kind, then the handler for the `default` key is called. Note that
//  * if `handlers` does not provide a property for *every* node kind, then it must provide a `default` handler.
//  * @param node the node for which a matching handler is to be invoked.
//  * @param handlers an object keyed by node kind, whose values are functions that perform an action on a node.
//  * @returns the return value of the invoked handler function.
//  */
// export function matchNode<V extends AstVersion, TR>(node: Node<V>, handlers: MatchEvery<V, TR> | MatchSome<V, TR> | MatchError<V, TR>): TR {
//     let kind: NodeKind = (node as any).kind;
//     if (kind in handlers) return handlers[kind]!(node as any);
//     if ('default' in handlers) return (handlers.default as any)(node);
//     throw new Error(`matchNode: not handler for '${kind}' and no default handler.`);
// }


// // Helper type describing the shape of a handler object that exhaustively covers every node kind.
// type MatchEvery<V extends AstVersion, TR> = {[K in NodeKind]: (n: NodeFromKind<V, K>) => TR};


// // Helper type describing the shape of a handler object that does not have a handler for every node kind.
// type MatchSome<V extends AstVersion, TR> =
//     & {[K in NodeKind]?: (n: NodeFromKind<V, K>) => TR}
//     & {default: (n: Node) => TR};


//     // Helper type to give a build-time hint to consumers about why a `handers` object is invalid.
// // This is a poor man's 'invalid' type. See https://github.com/Microsoft/TypeScript/issues/23689.
// type MatchError<V extends AstVersion, TR> =
//     & {[K in NodeKind]?: (n: NodeFromKind<V, K>) => TR}
//     & {'EVERY node kind -or- SOME node kinds plus "default"': (n: Node) => TR};
