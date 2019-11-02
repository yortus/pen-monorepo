import * as assert from 'assert';
import {Node} from '../ast2';
import {lookup, makeModuleScope, Scope} from '../ast2/scope'; // TODO: rename some of these...


export function resolveReferences(ast: Node<200, 'ModuleDefinition'>): Node<300, 'ModuleDefinition'> {
    let moduleScope = makeModuleScope();
    let currentScope: Scope = moduleScope;

    function rec<N extends Node<200>>(n: N): Node<300, N['kind']>;
    function rec(n: Node<200>): Node<300> {
        switch (n.kind) {
            case 'Block': {
                let restore = currentScope;
                currentScope = n.scope;
                let res = {...n, definitions: n.definitions.map(rec)};
                currentScope = restore;
                return res;
            }

            case 'Reference': {
                let names = [...n.namespaces || [], n.name];
                let fullRef = names.join('.');
                let symbol = lookup(currentScope, names.shift()!);
                for (let name of names) {
                    let nestedSymbol = symbol.members && symbol.members.find(s => s.name === name);
                    if (nestedSymbol && !nestedSymbol.isExported) nestedSymbol = undefined;
                    if (!nestedSymbol) throw new Error(`Symbol '${fullRef}' is not defined.`);
                    symbol = nestedSymbol;
                }
                return {...n, symbol};
            }

            // TODO: the rest are just pass-throughs... can these have 'default' processing?
            case 'Application': return {...n, function: rec(n.function), arguments: n.arguments.map(rec)};
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
            case 'Selection': return {...n, expressions: n.expressions.map(rec)};
            case 'Sequence': return {...n, expressions: n.expressions.map(rec)};
            case 'StringLiteral': return n;
            case 'VoidLiteral': return n;

            // Ensure both statically and at runtime that *every* node type has been handled by the switch cases above.
            default: ((_: never) => { throw new Error(`Internal error: unrecognised node '${n}'`); })(n);
        }
    }

    // TODO: do it
    let result = rec(ast);

    // sanity check - we should be back at the root scope here.
    assert(currentScope === moduleScope);

    // All done.
    return result;
}
