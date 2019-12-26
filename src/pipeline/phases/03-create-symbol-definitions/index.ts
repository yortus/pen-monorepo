import {assert, makeNodeMapper, mapMap} from '../../../utils';
import * as Prev from '../../representations/02-source-file-asts';
import {Binding, Module, Node, Program} from '../../representations/03-symbol-definitions';
import {createScope, insert, Scope} from '../../scopes-and-symbols';


// TODO: doc...
export function createSymbolDefinitions(program: Prev.Program<{Module: Prev.Module<{Binding: Prev.Binding}>}>): Program<{Module: Module<{Binding: Binding}>}> {
    const globalScope = createScope('GlobalScope');
    let currentScope: Scope = globalScope;
    let mapNode = makeNodeMapper<Prev.Node, Node>(rec => ({

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
            let symbol = insert(currentScope, pat.name);
            let patternᐟ = {...pat, symbol};
            return patternᐟ;
        },

        ModulePatternName: name => {
            assert(currentScope !== undefined);
            let symbol = insert(currentScope, name.alias || name.name);
            let nameᐟ = {...name, symbol};
            return nameᐟ;
        },

        // TODO: the rest are just pass-throughs... can these have 'default' processing?
        ApplicationExpression: n => ({...n, function: rec(n.function), argument: rec(n.argument)}),
        Binding: n => ({...n, pattern: rec(n.pattern), value: rec(n.value)}),
        CharacterExpression: n => n,
        Field: n => n.dynamic ? ({...n, name: rec(n.name), value: rec(n.value)}) : ({...n, value: rec(n.value)}),
        ImportExpression: n => n,
        LabelExpression: n => n,
        ListExpression: n => ({...n, elements: n.elements.map(rec)}),
        ModuleExpression: n => ({...n, module: rec(n.module)}),
        ModulePattern: n => ({...n, names: n.names.map(rec)}),
        RecordExpression: n => ({...n, fields: n.fields.map(rec)}),
        ReferenceExpression: n => n,
        SelectionExpression: n => ({...n, expressions: n.expressions.map(rec)}),
        SequenceExpression: n => ({...n, expressions: n.expressions.map(rec)}),
        SourceFile: n => ({...n, module: rec(n.module)}),
        StaticMemberExpression: n => ({...n, namespace: rec(n.namespace)}),
        StringExpression: n => n,
    }));

    // TODO: do it
    let result = mapNode(program);

    // sanity check - we should be back to the scope we started with here.
    assert(currentScope === globalScope);

    // All done.
    return result;
}
