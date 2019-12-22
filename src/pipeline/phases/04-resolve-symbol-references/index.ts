import {assert, makeNodeMapper, mapMap} from '../../../ast-utils';
import * as Prev from '../../representations/03-symbol-definitions';
import {Binding, Module, Node, Program} from '../../representations/04-symbol-references';
import {lookup, Scope} from '../../scopes-and-symbols';


// TODO: doc...
export function resolveSymbolReferences(program: Prev.Program<{Module: Prev.Module<{Binding: Prev.Binding}>}>): Program<{Module: Module<{Binding: Binding}>}> {
    let currentScope: Scope;
    let mapNode = makeNodeMapper<Prev.Node, Node>(rec => ({

        // TODO: keep track of the current scope...
        Program: prg => {
            let outerScope = currentScope;
            currentScope = prg.scope;
            let prgᐟ = {...prg, sourceFiles: mapMap(prg.sourceFiles, rec)};
            currentScope = outerScope;
            return prgᐟ;
        },

        Module: mod => {
            let outerScope = currentScope;
            currentScope = mod.scope;
            let modᐟ = {...mod, bindings: mod.bindings.map(rec)};
            currentScope = outerScope;
            return modᐟ;

        },

        FunctionExpression: fexpr => {
            let outerScope = currentScope;
            currentScope = fexpr.scope;
            let fexprᐟ = {...fexpr, pattern: rec(fexpr.pattern), body: rec(fexpr.body)};
            currentScope = outerScope;
            return fexprᐟ;
        },

        // TODO: resolve symbol references...
        ReferenceExpression: ref => {
            let symbol = lookup(currentScope, ref.name);
            let refᐟ = {...ref, symbol};
            return refᐟ;
        },

        // TODO:
        // StaticMemberExpression
        // - lookup sme.memberName inside scope of sme.namespace (recursive)



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
        ModulePatternName: n => ({...n}),
        RecordExpression: n => ({...n, fields: n.fields.map(rec)}),
        SelectionExpression: n => ({...n, expressions: n.expressions.map(rec)}),
        SequenceExpression: n => ({...n, expressions: n.expressions.map(rec)}),
        SourceFile: n => ({...n, module: rec(n.module)}),
        StaticMemberExpression: n => ({...n, namespace: rec(n.namespace)}),
        StringExpression: n => n,
        VariablePattern: n => n,
    }));

    // TODO: do it
    let result = mapNode(program);

    // sanity check - we should be back to the scope we started with here.
    assert(currentScope! === undefined);

    // All done.
    return result;
}
