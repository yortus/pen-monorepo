import {makeNodeMapper} from '../../../make-node-mapper';
import {SymbolDefinitions, SymbolReferences} from '../../../node-metadata';
import {ScopeStack} from '../../../node-metadata/scope';
import {lookup} from '../../../node-metadata/symbol';
import {Node, Program} from '../../../node-types';
import {assert, mapMap} from '../../../utils';


// TODO: doc...
export function resolveSymbolReferences(program: Program<SymbolDefinitions>): Program<SymbolDefinitions & SymbolReferences> {
    const scopes = new ScopeStack();
    let mapNode = makeNodeMapper<Node<SymbolDefinitions>, Node<SymbolDefinitions & SymbolReferences>>();
    let result = mapNode(program, rec => ({

        // TODO: keep track of the current scope...
        Program: prg => {
            scopes.push(prg.meta.scope);
            let prgᐟ = {...prg, sourceFiles: mapMap(prg.sourceFiles, rec)};
            scopes.pop();
            return prgᐟ;
        },

        Module: mod => {
            scopes.push(mod.meta.scope);
            let modᐟ = {...mod, bindings: mod.bindings.map(rec)};
            scopes.pop();
            return modᐟ;

        },

        FunctionExpression: fexpr => {
            scopes.push(fexpr.meta.scope);
            let fexprᐟ = {...fexpr, pattern: rec(fexpr.pattern), body: rec(fexpr.body)};
            scopes.pop();
            return fexprᐟ;
        },

        // TODO: resolve symbol references...
        ReferenceExpression: ref => {
            let symbol = lookup(scopes.current, ref.name);
            let refᐟ = {...ref, meta: {symbol}};
            return refᐟ;
        },

        // TODO:
        // StaticMemberExpression
        // - lookup sme.memberName inside scope of sme.namespace (recursive)
    }));

    // sanity check - we should be back to the scope we started with here.
    assert(scopes.isEmpty);

    // All done.
    return result;
}
