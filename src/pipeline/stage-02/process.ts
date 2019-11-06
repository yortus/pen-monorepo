import * as assert from 'assert';
import {makeNodeMapper} from '../../ast-utils';
import * as V01 from '../stage-01/output-types';
import {Ast, Node} from './output-types';
import {insert, makeModuleScope, makeNestedScope, Scope} from './scope';


// TODO: doc...
export function process(ast: V01.Ast): Ast {
    let moduleScope = makeModuleScope();
    let currentScope: Scope = moduleScope;
    let blockNestingLevel = 0;
    let mapNode = makeNodeMapper<V01.Node, Node>(rec => ({

        Block: block => {
            let restore = {currentScope, blockNestingLevel};
            if (blockNestingLevel > 0) currentScope = makeNestedScope(currentScope);
            blockNestingLevel += 1;
            let blockᐟ = {...block, definitions: block.definitions.map(rec), scope: currentScope};
            ({currentScope, blockNestingLevel} = restore);
            return blockᐟ;
        },

        Definition: def => {
            let symbol = insert(currentScope, def.name);
            symbol.isExported = def.isExported;
            let defᐟ = {...def, expression: rec(def.expression), symbol};
            if (defᐟ.expression.kind === 'Block') {
                symbol.members = [...defᐟ.expression.scope.symbols.values()].filter(s => s.isExported);
            }
            return defᐟ;
        },

        ImportNames: n => {
            assert(currentScope === moduleScope); // sanity check
            let symbols = n.names.map(name => Object.assign(insert(currentScope, name), {isImported: true}));
            return {...n, symbols};
        },

        ImportNamespace: n => {
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
        },

        // TODO: the rest are just pass-throughs... can these have 'default' processing?
        Application: n => ({...n, function: rec(n.function), arguments: n.arguments.map(rec)}),
        CharacterRange: n => n,
        Function: n => ({...n, expression: rec(n.expression)}),
        ListLiteral: n => ({...n, elements: n.elements.map(rec)}),
        ModuleDefinition: n => ({...n, imports: n.imports.map(rec), block: rec(n.block)}),
        Parenthetical: n => ({...n, expression: rec(n.expression)}),
        RecordField: n => ({
            ...n,
            name: typeof n.name === 'string' ? n.name : rec(n.name),
            expression: rec(n.expression),
        }),
        RecordLiteral: n => ({...n, fields: n.fields.map(rec)}),
        Reference: n => n,
        Selection: n => ({...n, expressions: n.expressions.map(rec)}),
        Sequence: n => ({...n, expressions: n.expressions.map(rec)}),
        StringLiteral: n => n,
        VoidLiteral: n => n,
    }));

    // TODO: do it
    let result = mapNode(ast);

    // sanity check - we should be back at the root scope here.
    assert(currentScope === moduleScope);

    // All done.
    return result;
}
