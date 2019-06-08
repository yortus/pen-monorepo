import * as assert from 'assert';
import {Expression, Node} from './ast';
import {forEachChildNode, matchNode, transformAst} from './ast';
import {Emitter, makeEmitter} from './emitter';
import {parse} from './parse';
import {insert, lookup, makeModuleScope, makeNestedScope, Scope} from './scope';




export interface PenSourceCode {code: string; }
export interface JsTargetCode {code: string; }




export function compileToJs(source: PenSourceCode): JsTargetCode {

    // 1. parse source (PEN) input code ==> ast
    let ast = parse(source.code);

    // 2. analyse and check ast

    // 2a. define all symbols within their scopes
    let moduleScope = makeModuleScope();
    let currentScope: Scope = moduleScope;
    let blockNestingLevel = 0;
    let ast2 = transformAst(ast, {

        Block(block, transformChildren) {
            let restore = {currentScope, blockNestingLevel};
            if (blockNestingLevel > 0) currentScope = makeNestedScope(currentScope);
            blockNestingLevel += 1;
            block = {...transformChildren(block), scope: currentScope};
            ({currentScope, blockNestingLevel} = restore);
            return block;
        },

        Definition(def, transformChildren) {
            let symbol = insert(currentScope, def.name);
            symbol.isExported = def.isExported;
            def = {...transformChildren(def), symbol};
            if (def.expression.kind === 'Block') {
                symbol.members = [...def.expression.scope.symbols.values()].filter(s => s.isExported);
            }
            return def;
        },

        ImportNames(imp) {
            assert(currentScope === moduleScope); // sanity check
            let symbols = imp.names.map(name => Object.assign(insert(currentScope, name), {isImported: true}));
            return {...imp, symbols};
        },

        ImportNamespace(imp) {
            assert(currentScope === moduleScope); // sanity check
            let symbol = insert(currentScope, imp.namespace); // TODO: what about alias?
            symbol.isImported = true;


            // TODO: temp testing... hardcode some 'pen' exports for testing...
            if (imp.moduleSpecifier === 'pen') {
                symbol.members = [
                    {name: 'i32', isExported: true},
                    {name: 'Memoize', isExported: true},
                ];
            }


            return {...imp, symbol};
        },
    });

    // 2b. resolve all references to symbols defined in the first pass
    assert(currentScope === moduleScope); // sanity check - we should be back at the root scope here
    let ast3 = transformAst(ast2, {

        Block(block, transformChildren) {
            let restore = currentScope;
            currentScope = block.scope;
            block = transformChildren(block);
            currentScope = restore;
            return block;
        },

        Reference(ref) {
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
    });

    // 3. emit ast ==> target (JS) output code
    let emit = makeEmitter();
    emitNode(ast3, emit);

    // 4. PROFIT
    let target: JsTargetCode = {code: emit.toString()};
    return target;
}





function emitNode(n: Node, emit: Emitter) {
    matchNode(n, {
        Application: app => {
            emitCall(app.combinator, app.arguments, emit);
        },

        Block: block => {
            let symbols = [...block.scope.symbols.values()];
            switch (block.scope.kind) {
                case 'Module':
                    symbols.forEach(sym => {
                        if (sym.isImported) return;
                        emit.text(`${sym.isExported ? 'export ': ''}const ${sym.name} = {};`).nl();
                    });
                    forEachChildNode(block, child => emitNode(child, emit)); // TODO: boilerplate... can automate?
                    break;
                case 'Nested':
                    // TODO: use an IIFE
                    emit.text(`(() => {`).nl(+1);
                    symbols.forEach(sym => {
                        emit.text(`const ${sym.name} = {};`).nl();
                    });
                    forEachChildNode(block, child => emitNode(child, emit)); // TODO: boilerplate... can automate?
                    emit.text(`const exports = {${symbols.filter(s => s.isExported).map(s => s.name).join(', ')}};`).nl();
                    emit.text(`return Object.assign(start, exports);`);
                    emit.nl(-1).text(`}();`)
                    break;
            }
        },
        // CharacterRange: node => {},
        // Combinator: node => {},

        Definition: def => {
            emit.text(`Object.assign(`).nl(+1);
            emit.text(def.name + ',').nl();
            emitNode(def.expression, emit);
            emit.nl(-1).text(`);`).nl();
        },

        ImportNames: imp => {
            let names = imp.names;
            emit.text(`import {${names.join(', ')}} from ${JSON.stringify(imp.moduleSpecifier)};`).nl();
        },

        ImportNamespace: imp => {
            let name = imp.namespace;
            emit.text(`import * as ${name} from ${JSON.stringify(imp.moduleSpecifier)};`).nl();
        },

        // ListLiteral: node => {},

        ModuleDefinition: mod => {
            emit.text(`==========  MODULE  ==========`).nl();
            forEachChildNode(mod, child => emitNode(child, emit)); // TODO: boilerplate... can automate?
        },

        // ModuleDeclaration: node => {},
        // Parenthetical: node => {},

        RecordField: field => {
            emit.text(`{`).nl(+1);
            emit.text(`computed: ${field.hasComputedName},`).nl().text(`name: `);
            if (field.hasComputedName) {
                emitNode(field.name, emit);
            }
            else {
                emit.text(JSON.stringify(field.name));
            }
            emit.text(`,`).nl().text(`value: `);
            emitNode(field.expression, emit);
            emit.nl(-1).text(`}`);
        },

        RecordLiteral: rec => {
            emit.text(`Record([`).nl(+1);
            rec.fields.forEach((field, i) => {
                emitNode(field, emit);
                if (i < rec.fields.length - 1) emit.text(',').nl();
            });
            emit.nl(-1).text(`])`);
        },

        Reference: ref => {
            let namespaces = ref.namespaces ? ref.namespaces.map(ns => `${ns}.exports.`) : [];
            emit.text(`Reference(${namespaces.join('')}${ref.name})`);
        },

        Selection: sel => {
            emitCall('Selection', sel.expressions, emit);
        },

        Sequence: seq => {
            emitCall('Sequence', seq.expressions, emit);
        },

        StringLiteral: lit => {
            emit.text(`${lit.subkind}StringLiteral(${JSON.stringify(lit.value)})`);
        },

        VoidLiteral: () => {
            emit.text(`Void`);
        },

        default: node => {
            // TODO: raise error for unhandled/unexpected node kind...
            emit.text(`<?${node.kind}?>`);
            forEachChildNode(node, child => emitNode(child, emit));
        },
    });
}




function emitCall(fn: string | Expression, args: readonly Expression[], emit: Emitter) {
    if (typeof fn === 'string') {
        emit.text(fn);
    }
    else {
        emitNode(fn, emit);
    }
    emit.text(`(`).nl(+1);
    args.forEach((arg, i) => {
        emitNode(arg, emit);
        if (i < args.length - 1) emit.text(',').nl();
    });
    emit.nl(-1).text(`)`);
}
