import {makeNodeMapper} from '../../../make-node-mapper';
import {SymbolDefinitions, SymbolReferences} from '../../../node-metadata';
import {Scope} from '../../../node-metadata/scope';
import {lookup} from '../../../node-metadata/symbol';
import {Node, Program} from '../../../node-types';
import {assert, mapMap} from '../../../utils';


// TODO: doc...
export function resolveSymbolReferences(program: Program<SymbolDefinitions>): Program<SymbolDefinitions & SymbolReferences> {
    let currentScope: Scope;
    let mapNode = makeNodeMapper<Node<SymbolDefinitions>, Node<SymbolDefinitions & SymbolReferences>>();
    let result = mapNode(program, rec => ({

        // TODO: keep track of the current scope...
        Program: prg => {
            let outerScope = currentScope;
            currentScope = prg.meta.scope;
            let prgᐟ = {...prg, sourceFiles: mapMap(prg.sourceFiles, rec)};
            currentScope = outerScope;
            return prgᐟ;
        },

        Module: mod => {
            let outerScope = currentScope;
            currentScope = mod.meta.scope;
            let modᐟ = {...mod, bindings: mod.bindings.map(rec)};
            currentScope = outerScope;
            return modᐟ;

        },

        FunctionExpression: fexpr => {
            let outerScope = currentScope;
            currentScope = fexpr.meta.scope;
            let fexprᐟ = {...fexpr, pattern: rec(fexpr.pattern), body: rec(fexpr.body)};
            currentScope = outerScope;
            return fexprᐟ;
        },

        // TODO: resolve symbol references...
        ReferenceExpression: ref => {
            let symbol = lookup(currentScope, ref.name);
            let refᐟ = {...ref, meta: {symbol}};
            return refᐟ;
        },

        // TODO:
        // StaticMemberExpression
        // - lookup sme.memberName inside scope of sme.namespace (recursive)
    }));

    // sanity check - we should be back to the scope we started with here.
    assert(currentScope! === undefined);

    // All done.
    return result;
}
