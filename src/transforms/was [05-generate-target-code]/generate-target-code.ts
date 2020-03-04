import {Expression, Module, Node, Program, SourceFile} from '../../ast-nodes';
import {makeNodeMapper} from '../../utils';
import {SymbolDefinitions} from '../03-create-symbol-definitions';
import {SymbolReferences} from '../04-resolve-symbol-references';
import {Emitter, makeEmitter} from './emitter';
import {identifierFromModuleSpecifier} from './identifier-from-module-specifier';
import {TargetCode} from './target-code';


// TODO: doc...
export function generateTargetCode(program: Program<SymbolDefinitions & SymbolReferences>): TargetCode {
    return emitProgram(program);
}


function emitProgram(program: Program<SymbolDefinitions & SymbolReferences>): TargetCode {
    let targetCode = new Map<SourceFile, string>();
    for (let [, sourceFile] of program.sourceFiles.entries()) {
        let emit = makeEmitter();
        emit.down(2).text(`// ==========  ${sourceFile.path}  ==========`);
        emitSourceFile(emit, sourceFile);

        // // TODO: ...
        // const MODULE_ID = `module1`;
        // emit.nl().nl().text(`// ==========  ${MODULE_ID}  ==========`).nl();
        // emit.text(`function ${MODULE_ID}() {`).nl(+1);
        // emit.text(`if (${MODULE_ID}.cached) return ${MODULE_ID}.cached;`).nl();
        // emit.text(`// TODO: detect circular dependencies...`).nl();
        // emit.nl(-1).text(`}`);
        targetCode.set(sourceFile, emit.toString());
    }
    return targetCode;
}


function emitSourceFile(emit: Emitter, sourceFile: SourceFile<SymbolDefinitions & SymbolReferences>) {
    // TODO: every source file import the PEN standard library
    // TODO: how to ensure it can be loaded? Use rel path and copy file there?
    emit.down(1).text(`//import * as __std from "penlib;"`);

    let modSpecs = Object.keys(sourceFile.imports);
    modSpecs.forEach((modSpec, _i) => {
        let id = identifierFromModuleSpecifier(modSpec);
        // TODO: need to store this modspec->id association somewhere to refer back to it later
        emit.down(1).text(`//import * as ${id} from ${JSON.stringify(modSpec)};`);
    });

    // TODO: initial referencing environment
    emit.down(2).text(`let __lexenv = {} as any; //__std.globalEnv;`);

    // emit.text(`const imports = {`).nl(+1);
    // modSpecs.forEach((moduleId, i) => {
    //     emit.text(`${JSON.stringify(moduleId)}: _${i},`);
    //     if (i < modSpecs.length - 1) emit.nl();
    // });
    // emit.nl(-1).text('};').nl();

    emit.down(2).text('export default ');
    emitModule(emit, sourceFile.module);
    emit.text(';');
}


// TODO: doc... emits an IIFE
function emitModule(emit: Emitter, module: Module<SymbolDefinitions & SymbolReferences>) {

    const symbols = module.meta.scope.symbols;

    emit.down(1).text('// emitting a module...');
    emit.down(1).text(`// DECLARATIONS: ${[...symbols.keys()].join(', ')}`);
    emit.down(1);
    emit.down(1).text('// DEFINITIONS...');




    // emit.text('((() => {').indent();

    // emit.down(1).text(`// Lazily define all bindings in this module.`);
    // emit.down(1).text(`let bindings = {};`);
    // emit.down(1).text(`let outerEnv = __lexenv;`);
    // emit.down(1).text('{').indent();
    // emit.down(1).text(`__lexenv = Object.create(outerEnv);`);
    // for (let {pattern, value} of module.bindings) {
    //     if (pattern.kind === 'ModulePattern') {
    //         assert(value.kind === 'ImportExpression'); // TODO: relax this restriction later... Need different emit...
    //         // TODO: emit...
    //         emit.down(2).text('// TODO: emit for ModulePattern...');
    //     }
    //     else {
    //         // TODO: ensure no clashes with ES names, eg Object, String, etc
    //         emit.down(2).text(`Object.defineProperty(bindings, '${pattern.name}', {`).indent();
    //         emit.down(1).text(`enumerable: true,`);
    //         emit.down(1).text(`configurable: true,`);
    //         emit.down(1).text(`get: () => {`).indent();



    //         emit.down(1).text(`const value = {};`);
    //         emit.down(1).text(`Object.defineProperty(bindings, '${pattern.name}', {enumerable: true, value});`);

    //         emit.down(1).text(`Object.assign(`).indent();
    //         emit.down(1).text(`value,`);
    //         emit.down(1);
    //         emitExpression(emit, value);
    //         emit.text(`,`);
    //         emit.dedent().down(1).text(`);`);
    //         emit.down(1).text(`return value;`);
    //         emit.dedent().down(1).text(`},`);
    //         emit.dedent().down(1).text(`});`);
    //     }
    // }

    // emit.down(2).text(`Object.assign(__lexenv, bindings);`);
    // emit.dedent().down(1).text('}');
    // // emit.down(2).text(`// Enter a new nested lexical referencing environment.`);
    // // emit.down(1).text(`let outerEnv = __lexenv;`);
    // // emit.down(1).text(`__lexenv = Object.assign(Object.create(outerEnv), bindings);`);

    // // emit.down(2).text(`// Restore previous lexical referencing environment before returning.`);
    // // emit.down(1).text(`__lexenv = outerEnv;`);
    // // TODO: export only exported names...

    // emit.down(1).text(`return {bindings} as any;`);
    // emit.dedent().down(1).text('})())');
}


function emitExpression(emit: Emitter, expr: Expression<SymbolDefinitions & SymbolReferences>) {
    switch (expr.kind) {
        case 'ApplicationExpression':
            emitCall(emit, expr.function, [expr.argument]);
            return;
        case 'CharacterExpression':
            break; // TODO...
        // case 'FunctionExpression':
        //     break; // TODO...
        case 'ImportExpression':
            break; // TODO...
        case 'LabelExpression':
            break; // TODO...
        case 'ListExpression':
            break; // TODO...
        case 'ModuleExpression':
            //emit.text('(').indent();
            emitModule(emit, expr.module);
            //emit.dedent().down(1).text(')()');
            return;
        case 'ParenthesisedExpression':
            // TODO: emit extra parens?
            emitExpression(emit, expr.expression);
            return;
        case 'RecordExpression':
            break; // TODO...
        case 'ReferenceExpression':
            emit.text(`__lexenv.${expr.name}`);
            return;
        case 'SelectionExpression':
            emitCall(emit, '__std.selection', expr.expressions);
            return;
        case 'SequenceExpression':
            emitCall(emit, '__std.sequence', expr.expressions);
            return;
        case 'StaticMemberExpression':
            emit.text('(');
            emitExpression(emit, expr.namespace);
            emit.text(`).bindings.${expr.memberName}`);
            return;
        case 'StringExpression':
            emit.text(JSON.stringify(expr.value));
            return;
        default:
            throw new Error('Internal Error'); // TODO...
    }
    emit.text('<expression>');
}


// TODO: temp testing...
function emitCall(emit: Emitter, fn: string | Expression<SymbolDefinitions & SymbolReferences>, args: ReadonlyArray<Expression<SymbolDefinitions & SymbolReferences>>) {
    if (typeof fn === 'string') {
        emit.text(fn);
    }
    else {
        emitExpression(emit, fn);
    }
    emit.text(`(`).indent();
    args.forEach((arg, _i) => {
        emit.down(1);
        emitExpression(emit, arg);
        emit.text(',');
    });
    emit.dedent().down(1).text(`)`);
}











// TODO: was... remove...
export function generateTargetCodeOLD(program: Program) {
    let emit = makeEmitter();

    let emitNode = makeNodeMapper<Node, Node>();
    emitNode(program, rec => ({

        ApplicationExpression: (app: any) => {
            emitCall(app.function, [app.argument], rec);
            return app;
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

        // TODO:  ==========   OLD ast - update this to new ast...   ==========
        // Definition: def => {
        //     emit.text(`Object.assign(`).nl(+1);
        //     emit.text(def.name + ',').nl();
        //     rec(def.expression);
        //     emit.nl(-1).text(`);`).nl();
        // },

        ParenthesisedExpression: (par: any) => {
            rec(par.expression);
            return par;
        },

        // TODO: ...
        RecordExpression: (n: any) => n,
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

        ReferenceExpression: (ref: any) => {
            // TODO: ...
            // let namespaces = ref.namespaces ? ref.namespaces.map(ns => `${ns}.exports.`) : [];
            // emit.text(`Reference(${namespaces.join('')}${ref.name})`);
            return ref;
        },

        SelectionExpression: (sel: any) => {
            emitCall('Selection', sel.expressions, rec);
            return sel;
        },

        SequenceExpression: (seq: any) => {
            emitCall('Sequence', seq.expressions, rec);
            return seq;
        },

        StaticMemberExpression: (memb: any) => {
            // TODO: ...
            // let namespaces = ref.namespaces ? ref.namespaces.map(ns => `${ns}.exports.`) : [];
            // emit.text(`Reference(${namespaces.join('')}${ref.name})`);
            return memb;
        },

        StringExpression: (str: any) => {
            // TODO: ...
            emit.text(`StringExpression(${JSON.stringify(str.value)})`);
            return str;
        },

        // TODO: ...
        VariablePattern: (pat: any) => {
            emit.text(`// TODO: VariablePattern for ${pat.name}`);
            return pat;
        },
    } as any));

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
        emit.text(`(`).indent();
        args.forEach((arg, i) => {
            rec(arg);
            if (i < args.length - 1) emit.text(',');
        });
        emit.dedent().text(`)`);
    }
}
