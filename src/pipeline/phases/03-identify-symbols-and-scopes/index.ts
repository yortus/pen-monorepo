import {makeNodeMapper, mapMap} from '../../../ast-utils';
import * as Prev from '../../representations/02-source-file-asts';
import {Binding, Node, Program, Scope} from '../../representations/03-symbols-and-scopes';
import {insert, makeModuleScope, makeRecordScope} from './scope';


// TODO: doc...
export function identifySymbolsAndScopes(program: Prev.Program<{Binding: Prev.Binding}>): Program<{Binding: Binding}> {
    let currentScope: Scope | undefined;
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

        // Create a new scope for each module and record
        Module: mod => {
            assert(currentScope === undefined);
            currentScope = makeModuleScope();
            let modᐟ = {...mod, bindings: mod.bindings.map(rec), scope: currentScope};
            currentScope = undefined;
            return modᐟ;
        },

        RecordExpression: record => {
            let outerScope = currentScope;
            assert(currentScope !== undefined);
            currentScope = makeRecordScope(currentScope);
            let recordᐟ = {...record, bindings: record.bindings.map(rec), scope: currentScope};
            currentScope = outerScope;
            return recordᐟ;
        },

        // TODO: temp testing...
        VariablePattern: pattern => {
            assert(currentScope !== undefined);
            let symbol = insert(currentScope, pattern.name);
            let patternᐟ = {...pattern, symbol};
            return patternᐟ;
        },


        // Lookup a child
        // Introduce a symbol for each shorthand binding, variable pattern, and field pattern

        // Definition: def => {
        //     let symbol = insert(currentScope, def.name);
        //     symbol.isExported = def.isExported;
        //     let defᐟ = {...def, expression: rec(def.expression), symbol};
        //     if (defᐟ.expression.kind === 'Block') {
        //         symbol.members = [...defᐟ.expression.scope.symbols.values()].filter(s => s.isExported);
        //     }
        //     return defᐟ;
        // },

        // ImportNames: n => {
        //     assert(currentScope === moduleScope); // sanity check
        //     let symbols = n.names.map(name => Object.assign(insert(currentScope, name), {isImported: true}));
        //     return {...n, symbols};
        // },

        // ImportNamespace: n => {
        //     assert(currentScope === moduleScope); // sanity check
        //     let symbol = insert(currentScope, n.namespace); // TODO: what about alias?
        //     symbol.isImported = true;

        //     // TODO: temp testing... hardcode some 'pen' exports for testing...
        //     if (n.moduleSpecifier === 'pen') {
        //         symbol.members = [
        //             {name: 'i32', isExported: true},
        //             {name: 'Memoize', isExported: true},
        //         ];
        //     }

        //     return {...n, symbol};
        // },

        // TODO: the rest are just pass-throughs... can these have 'default' processing?
        ApplicationExpression: n => ({...n, function: rec(n.function), argument: rec(n.argument)}),
        CharacterExpression: n => n,
        DynamicBinding: n => ({...n, name: rec(n.name), value: rec(n.value)}),
        ExportBinding: n => ({...n, value: rec(n.value)}),
        FieldPattern: n => ({...n, pattern: n.pattern ? rec(n.pattern) : undefined}),
        FunctionExpression: n => ({...n, pattern: rec(n.pattern), body: rec(n.body)}),
        ImportExpression: n => n,
        LabelExpression: n => n,
        Program: n => ({...n, sourceFiles: mapMap(n.sourceFiles, rec)}),
        RecordPattern: n => ({...n, fields: n.fields.map(rec)}),
        ReferenceExpression: n => n,
        SelectionExpression: n => ({...n, expressions: n.expressions.map(rec)}),
        SequenceExpression: n => ({...n, expressions: n.expressions.map(rec)}),
        SourceFile: n => ({...n, module: rec(n.module)}),
        StaticBinding: n => ({...n, pattern: rec(n.pattern), value: rec(n.value)}),
        StaticMemberExpression: n => ({...n, namespace: rec(n.namespace)}),
        StringExpression: n => n,
        ThisExpression: n => n,
        TupleExpression: n => ({...n, elements: n.elements.map(rec)}),
        TuplePattern: n => ({...n, elements: n.elements.map(rec)}),
        WildcardPattern: n => n,
    }));

    // TODO: do it
    let result = mapNode(program);

    // sanity check - we should be back to the scope we started with here.
    assert(currentScope === undefined);

    // All done.
    return result;
}


// Helper function
function assert<T>(x: T): asserts x {
    if (!x) throw new Error(`Assertion failed`);
}
