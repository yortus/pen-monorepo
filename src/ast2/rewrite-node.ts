import {Node} from './node';


export function rec<N extends Node<100>>(n: N): Node<100, N['kind']>;
export function rec(n: Node<100>): Node<100> {
    switch (n.kind) {
        case 'Application': return {...n, function: rec(n.function), arguments: n.arguments.map(rec)};
        case 'Block': return {...n, definitions: n.definitions.map(rec) };
        case 'CharacterRange': return n;
        case 'Definition': return {...n, expression: rec(n.expression)};
        case 'Function': return {...n, expression: rec(n.expression)};
        case 'ImportNames': return n;
        case 'ImportNamespace': return n;
        case 'ListLiteral': return {...n, elements: n.elements.map(rec)};
        case 'ModuleDefinition': return {...n, imports: n.imports.map(rec), block: rec(n.block)};
        case 'Parenthetical': return {...n, expression: rec(n.expression)};
        case 'RecordField':
            return {
                ...n,
                name: n.hasComputedName ? rec(n.name) : n.name as any,
                expression: rec(n.expression),
            };
        case 'RecordLiteral': return {...n, fields: n.fields.map(rec)};
        case 'Reference': return n;
        case 'Selection': return {...n, expressions: n.expressions.map(rec)};
        case 'Sequence': return {...n, expressions: n.expressions.map(rec)};
        case 'StringLiteral': return n;
        case 'VoidLiteral': return n;

        // Ensure both statically and at runtime that *every* node type has been handled by the switch cases above.
        default: ((_: never) => { throw new Error(`Internal error: unrecognised node '${n}'`); })(n);
    }
}
