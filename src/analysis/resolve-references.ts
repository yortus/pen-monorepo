import * as assert from 'assert';
// import {ModuleDefinition, transformAst} from '../ast';
// import {lookup, makeModuleScope, Scope} from '../ast'; // TODO: rename some of these...




// export function resolveReferences(ast: ModuleDefinition<'pass2'>) {
//     let moduleScope = makeModuleScope();
//     let currentScope: Scope = moduleScope;
//     let result = transformAst(ast, {

//         Block(block, transformChildren) {
//             let restore = currentScope;
//             currentScope = block.scope;
//             block = transformChildren(block);
//             currentScope = restore;
//             return block;
//         },

//         Reference(ref) {
//             let names = [...ref.namespaces || [], ref.name];
//             let fullRef = names.join('.');
//             let symbol = lookup(currentScope, names.shift()!);
//             for (let name of names) {
//                 let nestedSymbol = symbol.members && symbol.members.find(s => s.name === name);
//                 if (nestedSymbol && !nestedSymbol.isExported) nestedSymbol = undefined;
//                 if (!nestedSymbol) throw new Error(`Symbol '${fullRef}' is not defined.`);
//                 symbol = nestedSymbol;
//             }
//             return {...ref, symbol};
//         },
//     });

//     // sanity check - we should be back at the root scope here.
//     assert(currentScope === moduleScope);

//     // All done.
//     return result;
// }









import {makeAnnotatorFunction} from '../ast2/make-annotator-function';
import {lookup, makeModuleScope, Scope} from '../ast2/scope'; // TODO: rename some of these...
import {NodeFromKind} from '../ast2/type-operators';


export function resolveReferences2(ast: NodeFromKind<200, 'ModuleDefinition'>) {
    let moduleScope = makeModuleScope();
    let currentScope: Scope = moduleScope;

    let annotate = makeAnnotatorFunction<200, 300>(rec => ({

        Block: block => {
            let restore = currentScope;
            currentScope = block.scope;
            let result = {...block, definitions: block.definitions.map(rec)};
            currentScope = restore;
            return result;
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

        // All other node kinds are recursively shallow cloned
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
            name: n.hasComputedName ? rec(n.name) : n.name as any,
            expression: rec(n.expression),
        }),
        RecordLiteral: n => ({...n, fields: n.fields.map(rec)}),
        Selection: n => ({...n, expressions: n.expressions.map(rec)}),
        Sequence: n => ({...n, expressions: n.expressions.map(rec)}),
        StringLiteral: n => n,
        VoidLiteral: n => n,
    }));

    let res = annotate(ast);

    // sanity check - we should be back at the root scope here.
    assert(currentScope === moduleScope);

    // All done.
    return res;
}
