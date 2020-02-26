import {Node, Program} from '../../ast-nodes';
import {ScopeStack} from '../../scopes';
import {lookup} from '../../symbols';
import {assert, makeNodeMapper, mapMap} from '../../utils';
import {SymbolDefinitions} from '../03-create-symbol-definitions';
import {SymbolReferences} from './symbol-references';


// TODO: doc...
export function resolveSymbolReferences(program: Program<SymbolDefinitions>) {
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

        // FunctionExpression: fexpr => {
        //     scopes.push(fexpr.meta.scope);
        //     let fexprᐟ = {...fexpr, pattern: rec(fexpr.pattern), body: rec(fexpr.body)};
        //     scopes.pop();
        //     return fexprᐟ;
        // },

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
