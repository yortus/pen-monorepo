import * as assert from 'assert';
import {Node} from '../ast2';
import {insert, makeModuleScope, makeNestedScope, Scope} from '../ast2/scope'; // TODO: rename some of these...


export function resolveDefinitions(ast: Node<100, 'ModuleDefinition'>): Node<200, 'ModuleDefinition'> {
    let moduleScope = makeModuleScope();
    let currentScope: Scope = moduleScope;
    let blockNestingLevel = 0;

    function rec<N extends Node<100>>(n: N): Node<200, N['kind']>;
    function rec(n: Node<100>): Node<200> {
        switch (n.kind) {

            case 'Block': {
                let restore = {currentScope, blockNestingLevel};
                if (blockNestingLevel > 0) currentScope = makeNestedScope(currentScope);
                blockNestingLevel += 1;
                let res = {...n, definitions: n.definitions.map(rec), scope: currentScope};
                ({currentScope, blockNestingLevel} = restore);
                return res;
            }

            case 'Definition': {
                let symbol = insert(currentScope, n.name);
                symbol.isExported = n.isExported;
                let res = {...n, expression: rec(n.expression), symbol};
                if (res.expression.kind === 'Block') {
                    symbol.members = [...res.expression.scope.symbols.values()].filter(s => s.isExported);
                }
                return res;
            }

            case 'ImportNames': {
                assert(currentScope === moduleScope); // sanity check
                let symbols = n.names.map(name => Object.assign(insert(currentScope, name), {isImported: true}));
                return {...n, symbols};
            }

            case 'ImportNamespace': {
                assert(currentScope === moduleScope); // sanity check
                let symbol = insert(currentScope, n.namespace); // TODO: what about alias?
                symbol.isImported = true;

                // TODO: temp testing... hardcode some 'pen' exports for testing...
                if (n.moduleSpecifier === 'pen') {
                    symbol.members = [
                        {name: 'i32', isExported: true},
                        {name: 'Memoize', isExported: true},
                    ];
                }

                return {...n, symbol};
            }

            // TODO: the rest are just pass-throughs... can these have 'default' processing?
            case 'Application': return {...n, function: rec(n.function), arguments: n.arguments.map(rec)};
            case 'CharacterRange': return n;
            case 'Function': return {...n, expression: rec(n.expression)};
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

    // TODO: do it
    let result = rec(ast);

    // sanity check - we should be back at the root scope here.
    assert(currentScope === moduleScope);

    // All done.
    return result;
}
