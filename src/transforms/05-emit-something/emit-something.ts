import {Expression, Node, Program} from '../../ast-nodes';
import {SymbolDefinitions} from '../03-create-symbol-definitions';
import {SymbolReferences} from '../04-resolve-symbol-references';
import {Emitter, makeEmitter} from './emitter';
import {makeNodeVisitor} from './make-node-visitor';


// TODO: name?
export function emitSomething(program: Program<SymbolDefinitions & SymbolReferences>): string {
    let emit = makeEmitter();
    emitNode(program, emit);
    let result = emit.toString();
    return result;
}


function emitNode(node: Node<SymbolDefinitions & SymbolReferences>, emit: Emitter) {
    const visit = makeNodeVisitor<Node<SymbolDefinitions & SymbolReferences>>(rec => ({

        Application: app => {
            emitCall(app.function, app.arguments, emit);
        },

        Block: block => {
            let symbols = [...block.scope.symbols.values()];
            switch (block.scope.kind) {
                case 'Module':
                    symbols.forEach(sym => {
                        if (sym.isImported) return;
                        emit.text(`${sym.isExported ? 'export ' : ''}const ${sym.name} = {};`).nl();
                    });
                    rec(...block.definitions);
                    break;
                case 'Nested':
                    // TODO: use an IIFE
                    emit.text(`(() => {`).nl(+1);
                    symbols.forEach(sym => {
                        emit.text(`const ${sym.name} = {};`).nl();
                    });
                    rec(...block.definitions);
                    emit.text(`const exports = {${symbols.filter(s => s.isExported).map(s => s.name).join(', ')}};`);
                    emit.nl();
                    emit.text(`return Object.assign(start, exports);`);
                    emit.nl(-1).text(`})()`);
                    break;
            }
        },

        // TODO: ...
        CharacterRange: () => {/***/},

        Definition: def => {
            emit.text(`Object.assign(`).nl(+1);
            emit.text(def.name + ',').nl();
            rec(def.expression);
            emit.nl(-1).text(`);`).nl();
        },

        // TODO: ...
        Function: () => {/***/},

        ImportNames: imp => {
            let names = imp.names;
            emit.text(`import {${names.join(', ')}} from ${JSON.stringify(imp.moduleSpecifier)};`).nl();
        },

        ImportNamespace: imp => {
            let name = imp.namespace;
            emit.text(`import * as ${name} from ${JSON.stringify(imp.moduleSpecifier)};`).nl();
        },

        // TODO: ...
        ListLiteral: () => {/***/},

        ModuleDefinition: mod => {
            const MODULE_ID = `module1`;
            emit.nl().nl().text(`// ==========  ${MODULE_ID}  ==========`).nl();
            emit.text(`function ${MODULE_ID}() {`).nl(+1);
            emit.text(`if (${MODULE_ID}.cached) return ${MODULE_ID}.cached;`).nl();
            emit.text(`// TODO: detect circular dependencies...`).nl();
            rec(...mod.imports, mod.block);
            emit.nl(-1).text(`}`);
        },

        // TODO: ...
        Parenthetical: () => {/***/},

        RecordField: field => {
            emit.text(`{`).nl(+1);
            emit.text(`computed: ${field.hasComputedName},`).nl().text(`name: `);
            if (typeof field.name === 'string') {
                // assert(hasComputedName === false)
                emit.text(JSON.stringify(field.name));
            }
            else {
                // assert(hasComputedName === true)
                rec(field.name);
            }
            emit.text(`,`).nl().text(`value: `);
            rec(field.expression);
            emit.nl(-1).text(`}`);
        },

        RecordLiteral: record => {
            emit.text(`Record([`).nl(+1);
            record.fields.forEach((field, i) => {
                rec(field);
                if (i < record.fields.length - 1) emit.text(',').nl();
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
    }));

    visit(node);
}




function emitCall(fn: string | Expression, args: ReadonlyArray<Expression>, emit: Emitter) {
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
