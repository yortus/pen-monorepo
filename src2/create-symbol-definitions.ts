// TODO: not great inference... fix:
// - can mis-spell node kinds in property names with no red squggles
// - can return wrong type with no red squiggles (eg prgᐟ.meta does not match {scope: Scope})



import {SymbolDefinitions} from './node-metadata';
import {createScope, Scope} from './node-metadata/scope';
import {createSymbol} from './node-metadata/symbol';
import {Node, Program} from './node-types';
import {assert, makeNodeMapper, mapMap} from './utils';


// TODO: doc...
export function createSymbolDefinitions(program: Program<{}>): Program<SymbolDefinitions> {
    const globalScope = createScope('GlobalScope');
    let currentScope: Scope = globalScope;
    let mapNode = makeNodeMapper<Node<{}>, Node<SymbolDefinitions>>(rec => ({

        // Attach a scope to each Program, Module and FunctionExpression node.
        Program: prg => {
            assert(currentScope === globalScope);
            let prgᐟ = {...prg, sourceFiles: mapMap(prg.sourceFiles, rec), scope: globalScope};
            return prgᐟ;
        },

        Module: mod => {
            assert(currentScope !== undefined);
            let outerScope = currentScope;
            let scope = currentScope = createScope('ModuleScope', currentScope);
            let modᐟ = {...mod, bindings: mod.bindings.map(rec), scope};
            currentScope = outerScope;
            return modᐟ;
        },

        FunctionExpression: fexpr => {
            assert(currentScope !== undefined);
            let outerScope = currentScope;
            let scope = currentScope = createScope('FunctionScope', currentScope);
            let fexprᐟ = {...fexpr, pattern: rec(fexpr.pattern), body: rec(fexpr.body), scope};
            currentScope = outerScope;
            return fexprᐟ;
        },

        // Attach a symbol to each VariablePattern and ModulePatternName node.
        VariablePattern: pat => {
            assert(currentScope !== undefined);
            let symbol = createSymbol('OtherSymbol', pat.name, currentScope);
            let patternᐟ = {...pat, symbol};
            return patternᐟ;
        },

        ModulePatternName: name => {
            assert(currentScope !== undefined);
            let symbol = createSymbol('OtherSymbol', name.alias || name.name, currentScope);
            let nameᐟ = {...name, symbol};
            return nameᐟ;
        },
    }));

    // TODO: do it
    let result = mapNode(program);

    // sanity check - we should be back to the scope we started with here.
    assert(currentScope === globalScope);

    // All done.
    return result;
}
