import * as assert from 'assert';
import {Expression, Node} from './ast';
import {forEachChildNode, matchNode, transformAst} from './ast';
import {Emitter, makeEmitter} from './emitter';
import {parse} from './parse';
import {insert, lookup, makeChildScope} from './scope';




export interface PenSourceCode {code: string; }
export interface JsTargetCode {code: string; }




export function compileToJs(source: PenSourceCode): JsTargetCode {

    // 1. parse source (PEN) input code ==> ast
    let ast = parse(source.code);

    // 2. analyse and check ast

    // 2a. define all symbols within their scopes
    let currentScope = makeChildScope();
    let ast2 = transformAst(ast, {

        Block(block, transformChildren) {
            let scope = currentScope = makeChildScope(currentScope);
            block = {...transformChildren(block), scope};
            currentScope = currentScope.parent!;
            return block;
        },

        Definition(def, transformChildren) {
            let symbol = insert(currentScope, def.name);
            return {...transformChildren(def), symbol};

            // // TODO: fix hardcoded 'Pattern', since not always a Pattern, may be a Combinator. But we don't know yet.
            // //       e.g. if node.expression is a 'Reference', what kind does it refer to? Refs are not resolved yet.
            // //       This seems to be really a type-checking thing (so do a runtime check if no static type checking).
            // const symbol: Symbol = {kind: 'Pattern', name: defn.name, scope: symbolTable.currentScope};
            // symbolTable.insert(symbol);
            // return {...defn, symbol};
        },

        Import(decl) {
            let bindings = decl.bindings.map(binding => {
                let symbol = insert(currentScope, binding.name); // TODO: what about alias?
                return {...binding, symbol};
            });
            return {...decl, bindings};
        },
    });

    // 2b. resolve all references to symbols defined in the first pass
    assert(!currentScope.parent); // sanity check - we should be back at the root scope here
    let ast3 = transformAst(ast2, {

        Block(block, transformChildren) {
            assert(block.scope.parent === currentScope); // sanity check
            currentScope = block.scope;
            block = transformChildren(block);
            currentScope = currentScope.parent!;
            return block;
        },

        Reference(ref) {
            let symbol = lookup(currentScope, ref.name);
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
            emit.text(`let m1 = {`).nl(+1);
            let names = [...block.scope.symbols.keys()];
            names.forEach((name, i) => {
                emit.text(`${name}: {}`);
                if (i < names.length - 1) emit.text(',').nl();
            });
            emit.nl(-1).text(`};`).nl();
            forEachChildNode(block, child => emitNode(child, emit)); // TODO: boilerplate... can automate?
        },
        // CharacterRange: node => {},
        // Combinator: node => {},

        Definition: def => {
            emit.text(`Object.assign(`).nl(+1);
            emit.text(`m1.${def.name},`).nl();
            emitNode(def.expression, emit);
            emit.nl(-1).text(`);`).nl();
        },

        // Import: node => {},
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
            emit.text(ref.name);
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
