import type {V} from '../../representations';


/**
 * Returns the node referred to by an Identifier node. Steps through references until
 * either a non-Identifier node is found, or a circular reference is detected.
 */
export function dereference(id: V.Identifier, lookup: (name: string) => V.Expression<300>) {
    let expr: V.Expression<300> = id;
    const seen = [] as V.Expression[];
    while (expr.kind === 'Identifier') {

        // Keep track of visited expressions, and abort if the original identifier is circularly defined.
        if (seen.includes(expr)) {
            // TODO: improve diagnostic message, eg line/col ref
            const name = expr.kind === 'Identifier' ? expr.name : '(?)'; // TODO: fix non-ref case!
            throw new Error(`'${name}' is circularly defined`);
        }
        seen.push(expr);

        // Resolve the identifier to its target expression.
        expr = lookup(expr.name);
    }

    // Return the resolved expression, which is definitely not an Identifier.
    return expr;
}
