import * as assert from 'assert';
import {Blockᐟ, Definitionᐟ, Expression, Referenceᐟ, ImportDeclarationᐟ, Node, PenModuleᐟ} from './ast';
import {forEachChildNode, matchNode, transformAst} from './ast';
import {Emitter, makeEmitter} from './emitter';
import {parse} from './parse';
import {newScope} from './scope';




export interface PenSourceCode {code: string; }
export interface JsTargetCode {code: string; }




export function compileToJs(source: PenSourceCode): JsTargetCode {

    // 1. parse source (PEN) input code ==> ast
    let ast = parse(source.code);

    // 2. analyse and check ast

    // 2a. define all symbols within their scopes
    let currentScope = newScope();
    let ast2 = transformAst(ast, {

        Block(block, transformChildren) {
            let scope = currentScope = newScope(currentScope);
            block = transformChildren(block);
            const result: Blockᐟ = {...block, kind: 'Blockᐟ', scope};
            currentScope = currentScope.parent!;
            return result;
        },

        Definition(def, transformChildren) {
            let symbol = currentScope.insert(def.name);
            def = transformChildren(def);
            const result: Definitionᐟ = {...def, kind: 'Definitionᐟ', symbol};
            return result;

            // // TODO: fix hardcoded 'Pattern', since not always a Pattern, may be a Combinator. But we don't know yet.
            // //       e.g. if node.expression is a 'Reference', what kind does it refer to? Refs are not resolved yet.
            // //       This seems to be really a type-checking thing (so do a runtime check if no static type checking).
            // const symbol: Symbol = {kind: 'Pattern', name: defn.name, scope: symbolTable.currentScope};
            // symbolTable.insert(symbol);
            // return {...defn, symbol};
        },

        ImportDeclaration(decl) {
            let bindings = decl.bindings.map(binding => {
                let symbol = currentScope.insert(binding.name); // TODO: what about alias?
                return {...binding, symbol};
            });
            const result: ImportDeclarationᐟ = {...decl, kind: 'ImportDeclarationᐟ', bindings};
            return result;
        },

        PenModule(mod, transformChildren) {
            let scope = currentScope = newScope(currentScope);
            mod = transformChildren(mod);
            const result: PenModuleᐟ = {...mod, kind: 'PenModuleᐟ', scope};
            currentScope = currentScope.parent!;
            return result;
        },
    });

    // 2b. resolve all references to symbols defined in the first pass
    assert(!currentScope.parent); // sanity check - we should be back at the root scope here
    let ast3 = transformAst(ast2, {

        Blockᐟ(block, transformChildren) {
            assert(block.scope.parent === currentScope); // sanity check
            currentScope = block.scope;
            block = transformChildren(block);
            currentScope = currentScope.parent!;
            return block;
        },

        PenModuleᐟ(mod, transformChildren) {
            assert(mod.scope.parent === currentScope); // sanity check
            currentScope = mod.scope;
            mod = transformChildren(mod);
            currentScope = currentScope.parent!;
            return mod;
        },

        Reference(ref) {
            let symbol = currentScope.lookup(ref.name);
            let result: Referenceᐟ = {...ref, kind: 'Referenceᐟ', symbol};
            return result;
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

        // Blockᐟ: node => {},
        // CharacterRange: node => {},
        // Combinator: node => {},

        Definitionᐟ: def => {
            emit.text(`Object.assign(`).nl(+1);
            emit.text(`m1.${def.name},`).nl();
            emitNode(def.expression, emit);
            emit.nl(-1).text(`);`).nl();
        },

        // ForeignModule: node => {},
        // ImportDeclarationᐟ: node => {},
        // ListLiteral: node => {},
        // Parenthetical: node => {},

        PenModuleᐟ: mod => {
            emit.text(`let m1 = {`).nl(+1);
            let names = [...mod.scope.symbols.keys()];
            names.forEach((name, i) => {
                emit.text(`${name}: {}`);
                if (i < names.length - 1) emit.text(',').nl();
            });
            emit.nl(-1).text(`};`).nl();
            forEachChildNode(mod, child => emitNode(child, emit)); // TODO: boilerplate... can automate?
        },

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

        Referenceᐟ: ref => {
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
