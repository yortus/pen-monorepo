import * as assert from 'assert';
import {makeNodeMapper} from '../../ast-utils';
import * as V02 from '../stage-02/output-types';
import {lookup, makeModuleScope, Scope} from '../stage-02/scope';
import {Ast, Node} from './output-types';


// TODO: doc...
export function process(ast: V02.Ast): Ast {
    let moduleScope = makeModuleScope();
    let currentScope: Scope = moduleScope;
    let mapNode = makeNodeMapper<V02.Node, Node>(rec => ({

        Block: block => {
            let restore = currentScope;
            currentScope = block.scope;
            let blockᐟ = {...block, definitions: block.definitions.map(rec)};
            currentScope = restore;
            return blockᐟ;
        },

        Reference: ref => {
            let names = [...ref.namespaces || [], ref.name];
            let fullRef = names.join('.');
            let symbol = lookup(currentScope, names.shift()!);
            for (let name of names) {
                let nestedSymbol = symbol.members && symbol.members.find(s => s.name === name);
                if (nestedSymbol && !nestedSymbol.isExported) nestedSymbol = undefined;
                if (!nestedSymbol) throw new Error(`Symbol '${fullRef}' is not defined.`);
                symbol = nestedSymbol;
            }
            return {...ref, symbol};
        },

        // TODO: the rest are just pass-throughs... can these have 'default' processing?
        Application: n => ({...n, function: rec(n.function), arguments: n.arguments.map(rec)}),
        CharacterRange: n => n,
        Definition: n => ({...n, expression: rec(n.expression)}),
        Function: n => ({...n, expression: rec(n.expression)}),
        ImportNames: n => n,
        ImportNamespace: n => n,
        ListLiteral: n => ({...n, elements: n.elements.map(rec)}),
        ModuleDefinition: n => ({...n, imports: n.imports.map(rec), block: rec(n.block)}),
        Parenthetical: n => ({...n, expression: rec(n.expression)}),
        RecordField: n => ({
            ...n,
            name: typeof n.name === 'string' ? n.name : rec(n.name),
            expression: rec(n.expression),
        }),
        RecordLiteral: n => ({...n, fields: n.fields.map(rec)}),
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
