import {assert, makeNodeMapper, mapMap} from '../../../ast-utils';
import * as Prev from '../../representations/02-source-file-asts';
import {Binding, Node, Program, Scope} from '../../representations/03-symbols-and-scopes';
import {createScope, insert} from './scope';


// TODO: doc...
export function identifySymbolsAndScopes(program: Prev.Program<{Binding: Prev.Binding}>): Program<{Binding: Binding}> {
    let currentScope: Scope = createScope('GlobalScope');
    let mapNode = makeNodeMapper<Prev.Node, Node>(rec => ({

        // TODO: every kind of Binding/Pattern
        // - add a symbol for each introduced static name

        //                     interface ShorthandBinding {
        //                         readonly kind: 'ShorthandBinding';
        //                         readonly name: string;
        //                     }

        //                     interface VariablePattern {
        //                         readonly kind: 'VariablePattern';
        //                         readonly name: string;
        //                     }

        //                     interface FieldPattern<V extends {Pattern: any}> {
        //                         readonly kind: 'FieldPattern';
        //                         readonly fieldName: string;
        //                         readonly pattern?: V['Pattern'];
        //                     }

        // Create a scope for each Module and FunctionExpression.
        Module: mod => {
            let outerScope = currentScope;
            currentScope = createScope('ModuleScope', currentScope);
            let modᐟ = {...mod, bindings: mod.bindings.map(rec), scope: currentScope};
            currentScope = outerScope;
            return modᐟ;
        },

        FunctionExpression: fexpr => {
            let outerScope = currentScope;
            currentScope = createScope('FunctionScope', currentScope);
            let fexprᐟ = {...fexpr, pattern: rec(fexpr.pattern), body: rec(fexpr.body)};
            currentScope = outerScope;
            return fexprᐟ;
        },

        // Create a symbol for each VariablePattern and ModulePatternName.
        // TODO: don't store the symbol ref directly here, but just the symbol id
        // - what is a symbol id?
        // - what does it index into? Where is the symbol table? Or are there several?
        VariablePattern: pat => {
            let symbol = insert(currentScope, pat.name);
            let patternᐟ = {...pat, symbol};
            return patternᐟ;
        },

        ModulePatternName: name => {
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
        Program: n => ({...n, sourceFiles: mapMap(n.sourceFiles, rec)}),
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
    assert(currentScope.kind === 'GlobalScope');

    // All done.
    return result;
}
