import {Expression, forEachChildNode, matchNode, Node} from '../ast';
import {Emitter} from './emitter';




export function emitNode(node: Node, emit: Emitter) {
    matchNode(node, {
        Application: app => {
            emitCall(app.combinator, app.arguments, emit);
        },

        Block: block => {
            let symbols = [...block.scope.symbols.values()];
            switch (block.scope.kind) {
                case 'Module':
                    symbols.forEach(sym => {
                        if (sym.isImported) return;
                        emit.text(`${sym.isExported ? 'export ' : ''}const ${sym.name} = {};`).nl();
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
                    emit.text(`const exports = {${symbols.filter(s => s.isExported).map(s => s.name).join(', ')}};`);
                    emit.nl();
                    emit.text(`return Object.assign(start, exports);`);
                    emit.nl(-1).text(`})()`);
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
            const MODULE_ID = `module1`;
            emit.nl().nl().text(`// ==========  ${MODULE_ID}  ==========`).nl();
            emit.text(`function ${MODULE_ID}() {`).nl(+1);
            emit.text(`if (${MODULE_ID}.cached) return ${MODULE_ID}.cached;`).nl();
            emit.text(`// TODO: detect circular dependencies...`).nl();
            forEachChildNode(mod, child => emitNode(child, emit)); // TODO: boilerplate... can automate?
            emit.nl(-1).text(`}`);
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

        default: n => {
            // TODO: raise error for unhandled/unexpected node kind...
            emit.text(`<?${n.kind}?>`);
            forEachChildNode(n, child => emitNode(child, emit));
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
