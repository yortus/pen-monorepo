import {makeNodeMapper} from '../../../make-node-mapper';
import {SymbolDefinitions} from '../../../node-metadata';
import {ScopeStack} from '../../../node-metadata/scope';
import {createSymbol} from '../../../node-metadata/symbol';
import {Node, Program} from '../../../node-types';
import {assert, mapMap} from '../../../utils';


// TODO: doc...
export function createSymbolDefinitions(program: Program): Program<SymbolDefinitions> {
    const scopes = new ScopeStack();
    const globalScope = scopes.push('GlobalScope');
    let mapNode = makeNodeMapper<Node, Node<SymbolDefinitions>>();
    let result = mapNode(program, rec => ({

        // Attach a scope to each Program, Module and FunctionExpression node.
        Program: prg => {
            assert(scopes.current === globalScope);
            let prgᐟ = {...prg, sourceFiles: mapMap(prg.sourceFiles, rec), meta: {scope: globalScope}};
            return prgᐟ;
        },
        Module: mod => {
            let scope = scopes.push('ModuleScope');
            let modᐟ = {...mod, bindings: mod.bindings.map(rec), meta: {scope}};
            scopes.pop();
            return modᐟ;
        },
        FunctionExpression: fexpr => {
            let scope = scopes.push('FunctionScope');
            let fexprᐟ = {...fexpr, pattern: rec(fexpr.pattern), body: rec(fexpr.body), meta: {scope}};
            scopes.pop();
            return fexprᐟ;
        },

        // Attach a symbol to each VariablePattern and ModulePatternName node.
        VariablePattern: pat => {
            let symbol = createSymbol('OtherSymbol', pat.name, scopes.current);
            let patternᐟ = {...pat, meta: {symbol}};
            return patternᐟ;
        },
        ModulePatternName: name => {
            let symbol = createSymbol('OtherSymbol', name.alias || name.name, scopes.current);
            let nameᐟ = {...name, meta: {symbol}};
            return nameᐟ;
        },
    }));

    // sanity check - we should be back to the scope we started with here.
    assert(scopes.current === globalScope);

    // All done.
    return result;
}
