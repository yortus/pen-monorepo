import * as AstNodes from '../../ast-nodes';
import {makeNodeMapper, mapMap} from '../../utils';
import {SymbolDefinitions} from '../03-create-symbol-definitions';
import {SymbolReferences} from '../04-resolve-symbol-references';
import {makeEmitter} from './emitter';


// TODO: temp testing...
type Expression = AstNodes.Expression<SymbolDefinitions & SymbolReferences>;
type Node = AstNodes.Node<SymbolDefinitions & SymbolReferences>;
type Program = AstNodes.Program<SymbolDefinitions & SymbolReferences>;

// TODO: proper name for this...
// TODO: doc...
export function emitSomething(program: Program) {
    let emit = makeEmitter();

    let emitNode = makeNodeMapper<Node, Node>();
    emitNode(program, rec => ({

        ApplicationExpression: app => {
            emitCall(app.function, [app.argument], rec);
            return app;
        },

        // TODO: ...
        Binding: bnd => {
            rec(bnd.pattern);
            rec(bnd.value);
            return bnd;
        },

        // TODO:  ==========   OLD ast - update this to new ast...   ==========
        // Block: block => {
        //     let symbols = [...block.scope.symbols.values()];
        //     switch (block.scope.kind) {
        //         case 'Module':
        //             symbols.forEach(sym => {
        //                 if (sym.isImported) return;
        //                 emit.text(`${sym.isExported ? 'export ' : ''}const ${sym.name} = {};`).nl();
        //             });
        //             rec(...block.definitions);
        //             break;
        //         case 'Nested':
        //             // TODO: use an IIFE
        //             emit.text(`(() => {`).nl(+1);
        //             symbols.forEach(sym => {
        //                 emit.text(`const ${sym.name} = {};`).nl();
        //             });
        //             rec(...block.definitions);
        //             emit.text(`const exports = {${symbols.filter(s => s.isExported).map(s => s.name).join(', ')}};`);
        //             emit.nl();
        //             emit.text(`return Object.assign(start, exports);`);
        //             emit.nl(-1).text(`})()`);
        //             break;
        //     }
        // },

        // TODO: ...
        CharacterExpression: n => n,

        // TODO:  ==========   OLD ast - update this to new ast...   ==========
        // Definition: def => {
        //     emit.text(`Object.assign(`).nl(+1);
        //     emit.text(def.name + ',').nl();
        //     rec(def.expression);
        //     emit.nl(-1).text(`);`).nl();
        // },

        // TODO: ...
        DynamicField: n => n,

        // TODO: ...
        FunctionExpression: n => n,

        // TODO: ...
        ImportExpression: imp => {
            emit.text(` from ${JSON.stringify(imp.moduleSpecifier)};`).nl();
            return imp;
        },

        // TODO: ...
        LabelExpression: n => n,

        // TODO: ...
        ListExpression: n => n,

        Module: mod => {
            // TODO: ...
            const MODULE_ID = `module1`;
            emit.nl().nl().text(`// ==========  ${MODULE_ID}  ==========`).nl();
            emit.text(`function ${MODULE_ID}() {`).nl(+1);
            emit.text(`if (${MODULE_ID}.cached) return ${MODULE_ID}.cached;`).nl();
            emit.text(`// TODO: detect circular dependencies...`).nl();
            mod.bindings.map(rec);
            emit.nl(-1).text(`}`);
            return mod;
        },

        // TODO: ...
        ModuleExpression: n => n,

        // TODO: ...
        ModulePattern: pat => {
            emit.text('import {')
                .text(pat.names.map(n => `${n.name}${n.alias ? ` as ${n.alias}` : ''}`).join(', '))
                .text('}');
            return pat;
        },

        // TODO: ...
        ModulePatternName: () => {
            throw new Error('Internal error: ModulePatternName'); // NB: should be unreachable
        },

        // TODO: ...
        Program: prg => {
            mapMap(prg.sourceFiles, rec);
            return prg;
        },

        // TODO: ...
        RecordExpression: n => n,
        // RecordField: field => {
        //     emit.text(`{`).nl(+1);
        //     emit.text(`computed: ${field.hasComputedName},`).nl().text(`name: `);
        //     if (typeof field.name === 'string') {
        //         // assert(hasComputedName === false)
        //         emit.text(JSON.stringify(field.name));
        //     }
        //     else {
        //         // assert(hasComputedName === true)
        //         rec(field.name);
        //     }
        //     emit.text(`,`).nl().text(`value: `);
        //     rec(field.expression);
        //     emit.nl(-1).text(`}`);
        // },
        // RecordLiteral: record => {
        //     emit.text(`Record([`).nl(+1);
        //     record.fields.forEach((field, i) => {
        //         rec(field);
        //         if (i < record.fields.length - 1) emit.text(',').nl();
        //     });
        //     emit.nl(-1).text(`])`);
        // },

        ReferenceExpression: ref => {
            // TODO: ...
            // let namespaces = ref.namespaces ? ref.namespaces.map(ns => `${ns}.exports.`) : [];
            // emit.text(`Reference(${namespaces.join('')}${ref.name})`);
            return ref;
        },

        SelectionExpression: sel => {
            emitCall('Selection', sel.expressions, rec);
            return sel;
        },

        SequenceExpression: seq => {
            emitCall('Sequence', seq.expressions, rec);
            return seq;
        },

        // TODO: ...
        SourceFile: src => {
            emit.nl().nl().text(`// ==========  ${src.path}  ==========`).nl();
            rec(src.module);
            return src;
        },

        // TODO: ...
        StaticField: n => n,

        StaticMemberExpression: memb => {
            // TODO: ...
            // let namespaces = ref.namespaces ? ref.namespaces.map(ns => `${ns}.exports.`) : [];
            // emit.text(`Reference(${namespaces.join('')}${ref.name})`);
            return memb;
        },

        StringExpression: str => {
            // TODO: ...
            emit.text(`StringExpression(${JSON.stringify(str.value)})`);
            return str;
        },

        // TODO: ...
        VariablePattern: pat => {
            emit.text(`// TODO: VariablePattern for ${pat.name}`).nl();
            return pat;
        },
    }));

    // TODO: temp testing...
    return emit.toString();

    // TODO: temp testing...
    function emitCall(fn: string | Expression, args: ReadonlyArray<Expression>, rec: any) {
        if (typeof fn === 'string') {
            emit.text(fn);
        }
        else {
            rec(fn);
        }
        emit.text(`(`).nl(+1);
        args.forEach((arg, i) => {
            rec(arg);
            if (i < args.length - 1) emit.text(',').nl();
        });
        emit.nl(-1).text(`)`);
    }
}
