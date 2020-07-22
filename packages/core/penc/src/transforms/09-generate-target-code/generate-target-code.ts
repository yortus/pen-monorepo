
// TODO: X_memo emitted names could clash with program ids? Ensure they can't...


import * as fs from 'fs';
import {Expression} from '../../ast-nodes';
import {assert} from '../../utils';
import {Emitter, makeEmitter} from './emitter';
import {Mode, PARSE, PRINT} from './modes';
import * as modes from './modes';


export interface Program {
    il: Record<string, Expression>;
    consts: Record<string, {value: unknown}>;
}


// TODO: doc...
export function generateTargetCode(program: Program) {
    const emit = makeEmitter();

    // TODO: temp testing... emit runtime... penrt.js is copied into the dist/ dir as part of the postbuild script
    const RUNTIME_PATH = require.resolve('../../deps/penrt');
    let content = fs.readFileSync(RUNTIME_PATH, 'utf8') + '\n';
    content.split(/[\r\n]+/).filter(line => !!line.trim()).forEach(line => emit.down(1).text(line));

    // TODO: emit extensions...
    emitExtensions(emit, program);

    // TODO: temp testing... emit parse() fn and print() fn
    emitProgram(emit, program, PARSE);
    emitProgram(emit, program, PRINT);

    // TODO: Emit main exports...
    emit.down(5).text(`// ------------------------------ Main exports ------------------------------`);
    emit.down(1).text(`module.exports = {`).indent();
    for (let mode of [PARSE, PRINT] as const) {
        const fname = mode === PARSE ? 'parse' : 'print';
        const paramName = mode === PARSE ? 'text' : 'node';
        emit.down(1).text(`${fname}(${paramName}) {`).indent();
        emit.down(1).text(`setState({ IN: ${paramName}, IP: 0 });`);
        emit.down(1).text(`if (!${fname}()) throw new Error('${fname} failed');`);
        emit.down(1).text(`if (!isInputFullyConsumed()) throw new Error('${fname} didn\\\'t consume entire input');`);
        emit.down(1).text(`if (OUT === undefined) throw new Error('${fname} didn\\\'t return a value');`);
        emit.down(1).text(`return OUT;`);
        emit.dedent().down(1).text(`},`);
    }
    emit.dedent().down(1).text(`};`);

    // All done.
    return emit.down(1).toString();
}


function emitExtensions(emit: Emitter, {il}: Program) {

    // Filter out extension file entries, and entries that reference definitions in extension files
    let extNames = Object.keys(il).filter(n => il[n].kind === 'ImportExpression');
    let refNames = Object.keys(il).filter(n => {
        let e = il[n];
        if (e.kind !== 'MemberExpression') return false;
        assert(e.module.kind === 'ReferenceExpression');
        return il[e.module.name].kind === 'ImportExpression';
    });

    for (let extName of extNames) {
        let ext = il[extName];
        assert(ext.kind === 'ImportExpression');
        let exportedNames = refNames.map(n => {
            let mem = il[n];
            assert(mem.kind === 'MemberExpression');
            return mem;
        }).filter(mem => {
            assert(mem.module.kind === 'ReferenceExpression');
            let imp = il[mem.module.name];
            assert(imp.kind === 'ImportExpression');
            return mem.module.name === extName;
        }).map(mem => mem.bindingName);

        emit.down(1).text(`const createExtension_${extName} = (() => {`).indent();
        let content = fs.readFileSync(ext.sourceFilePath, 'utf8') + '\n';
        content.split(/[\r\n]+/).filter(line => !!line.trim()).forEach(line => emit.down(1).text(line));
        emit.down(2).text(`return ({mode}) => {`).indent();
        exportedNames.forEach(name => emit.down(1).text(`let _${name} = ${name}({mode});`));
        emit.down(1).text(`return (name) => {`).indent();
        emit.down(1).text(`switch (name) {`).indent();
        exportedNames.forEach(name => emit.down(1).text(`case '${name}': return _${name};`));
        emit.down(1).text(`default: return undefined;`);
        emit.dedent().down(1).text('}');
        emit.dedent().down(1).text('};');
        emit.dedent().down(1).text('};');
        emit.dedent().down(1).text('})();');
    }
}


function emitProgram(emit: Emitter, program: Program, mode: PARSE | PRINT) {
    let {consts, il} = program;

    // TODO: emit prolog...
    const modeName = mode === PARSE ? 'parse' : 'print';
    emit.down(5).text(`// ------------------------------ ${modeName.toUpperCase()} ------------------------------`);
    emit.down(1).text(`const ${modeName} = (() => {`).indent();

    let extNames = Object.keys(il).filter(n => il[n].kind === 'ImportExpression');
    for (let extName of extNames) {
        emit.down(1).text(`const ${extName} = createExtension_${extName}({mode: ${mode}})`);
    }

    for (let [name, expr] of Object.entries(il)) {
        emitExpression(emit, name, expr, mode);
        if (consts[name] === undefined) continue;
        emitConstant(emit, name, consts[name].value);
    }

    // TODO: emit epilog...
    let startName = Object.keys(il)[0]; // TODO: dodgy af... should be an explicit way of finding 'start' expr
    emit.down(2).text(`return ${startName};`);
    emit.dedent().down(1).text('})();');
}


function emitExpression(emit: Emitter, name: string, expr: Expression, mode: Mode) {
    [] = [emit, name, mode];
    emit.down(2).text(`// ${expr.kind}`);
    switch (expr.kind) {
        case 'ApplicationExpression': {
            assert(expr.lambda.kind === 'ReferenceExpression');
            assert(expr.argument.kind === 'ReferenceExpression');
            // TODO: if lambda refers to an extension export, can safety emit const without fn wrapper (all exts def'd)
            emit.down(1).text(`function ${name}() {`).indent();
            emit.down(1).text(`if (${name}_memo) return ${name}_memo();`);
            emit.down(1).text(`${name}_memo = ${expr.lambda.name}(${expr.argument.name});`);
            emit.down(1).text(`return ${name}_memo();`);
            emit.dedent().down(1).text(`}`);
            emit.down(1).text(`let ${name}_memo;`);
            break;
        }

        case 'BooleanLiteralExpression':
        case 'NullLiteralExpression':
        case 'NumericLiteralExpression': {
            const outText = modes.isParse(mode) && modes.hasOutput(mode) ? JSON.stringify(expr.value) : 'undefined';
            emit.down(1).text(`function ${name}() {`).indent();
            if (modes.isPrint(mode) && modes.hasInput(mode)) {
                emit.down(1).text(`if (IN !== ${JSON.stringify(expr.value)} || IP !== 0) return false;`);
                emit.down(1).text(`IP += 1;`);
            }
            emit.down(1).text(`OUT = ${outText};`);
            emit.down(1).text(`return true;`);
            emit.dedent().down(1).text('}');
            break;
        }

        case 'FieldExpression': {
            assert(expr.name.kind === 'ReferenceExpression');
            assert(expr.value.kind === 'ReferenceExpression');
            emit.down(1).text(`function ${name}() {`).indent();
            emit.down(1).text(`if (${name}_memo) return ${name}_memo();`);
            emit.down(1).text(`${name}_memo = field({`).indent();
            emit.down(1).text(`mode: ${mode},`);
            emit.down(1).text(`name: ${expr.name.name},`);
            emit.down(1).text(`value: ${expr.value.name},`);
            emit.dedent().down(1).text('});');
            emit.down(1).text(`return ${name}_memo();`);
            emit.dedent().down(1).text(`}`);
            emit.down(1).text(`let ${name}_memo;`);
            break;
        }

        case 'ImportExpression':
            // No-op - already handled by emitExtensions
            break;

        // TODO: implement...
        // case 'LambdaExpression':
        //     break;

        case 'ListExpression': {
            emit.down(1).text(`function ${name}() {`).indent();
            emit.down(1).text(`if (${name}_memo) return ${name}_memo();`);
            emit.down(1).text(`${name}_memo = list({`).indent();
            emit.down(1).text(`mode: ${mode},`);
            emit.down(1).text('elements: [');
            emit.text(`${expr.elements.map(e => e.kind === 'ReferenceExpression' ? e.name : '?').join(', ')}`);
            emit.text('],').dedent().down(1).text('})');
            emit.down(1).text(`return ${name}_memo();`);
            emit.dedent().down(1).text(`}`);
            emit.down(1).text(`let ${name}_memo;`);
            break;
        }

        case 'MemberExpression': {
            assert(expr.module.kind === 'ReferenceExpression');
            emit.down(1).text(`function ${name}() {`).indent();
            emit.down(1).text(`if (${name}_memo) return ${name}_memo();`);
            emit.down(1).text(`${name}_memo = ${expr.module.name}('${expr.bindingName}');`);
            emit.down(1).text(`return ${name}_memo();`);
            emit.dedent().down(1).text(`}`);
            emit.down(1).text(`let ${name}_memo;`);
            break;
        }

        case 'ModuleExpression': {
            emit.down(1).text(`function ${name}(bindingName) {`).indent();
            emit.down(1).text(`switch (bindingName) {`).indent();
            for (let binding of expr.module.bindings) {
                assert(binding.kind === 'SimpleBinding');
                assert(binding.value.kind === 'ReferenceExpression');
                emit.down(1).text(`case '${binding.name}': return ${binding.value.name};`);
            }
            emit.down(1).text(`default: return undefined;`);
            emit.dedent().down(1).text(`}`);
            emit.dedent().down(1).text(`}`);
            break;
        }

        case 'NotExpression': {
            assert(expr.expression.kind === 'ReferenceExpression');
            emit.down(1).text(`function ${name}() {`).indent();
            emit.down(1).text(`let stateₒ = getState();`);
            emit.down(1).text(`let result = !${expr.expression.name}();`);
            emit.down(1).text(`setState(stateₒ);`);
            emit.down(1).text(`OUT = undefined;`);
            emit.down(1).text(`return result;`);
            emit.dedent().down(1).text(`}`);
            break;
        }

        case 'QuantifiedExpression': {
            assert(expr.expression.kind === 'ReferenceExpression');
            emit.down(1).text(`function ${name}() {`).indent();
            if (expr.quantifier === '?') {
                emit.down(1).text(`if (!${expr.expression.name}()) OUT = undefined;`);
            }
            else /* expr.quantifier === '*' */ {
                emit.down(1).text(`let IPₒ = IP;`);
                emit.down(1).text(`let out;`);
                emit.down(1).text(`do {`).indent();
                emit.down(1).text(`if (!${expr.expression.name}()) break;`);
                emit.down(1).text(`if (IP === IPₒ) break;`);
                emit.down(1).text(`out = concat(out, OUT);`);
                emit.dedent().down(1).text(`} while (true);`);
                emit.down(1).text(`OUT = out;`);
            }
            emit.down(1).text(`return true;`);
            emit.dedent().down(1).text('}');
            break;
        }

        case 'RecordExpression': {
            emit.down(1).text(`function ${name}() {`).indent();
            emit.down(1).text(`if (${name}_memo) return ${name}_memo();`);
            emit.down(1).text(`${name}_memo = record({`).indent();
            emit.down(1).text(`mode: ${mode},`);
            emit.down(1).text('fields: [');
            if (expr.fields.length > 0) {
                emit.indent();
                for (let field of expr.fields) {
                    assert(field.value.kind === 'ReferenceExpression');
                    emit.down(1).text(`{name: '${field.name}', value: ${field.value.name}},`);
                }
                emit.dedent().down(1);
            }
            emit.text('],').dedent().down(1).text('})');
            emit.down(1).text(`return ${name}_memo();`);
            emit.dedent().down(1).text(`}`);
            emit.down(1).text(`let ${name}_memo;`);
            break;
        }

        case 'ReferenceExpression':
            assert(false); // Should never see a ReferenceExpression here.

        case 'SelectionExpression': {
            const arity = expr.expressions.length;
            const exprVars = expr.expressions.map(e => { assert(e.kind === 'ReferenceExpression'); return e.name; });
            emit.down(1).text(`function ${name}() {`).indent();
            for (let i = 0; i < arity; ++i) {
                emit.down(1).text(`if (${exprVars[i]}()) return true;`);
            }
            emit.down(1).text('return false;');
            emit.dedent().down(1).text('}');
            break;
        }

        case 'SequenceExpression': {
            const arity = expr.expressions.length;
            const exprVars = expr.expressions.map(e => { assert(e.kind === 'ReferenceExpression'); return e.name; });
            emit.down(1).text(`function ${name}() {`).indent();
            emit.down(1).text('let stateₒ = getState();');
            emit.down(1).text('let out;');
            for (let i = 0; i < arity; ++i) {
                emit.down(1).text(`if (${exprVars[i]}()) out = concat(out, OUT); else return setState(stateₒ), false;`);
            }
            emit.down(1).text('OUT = out;');
            emit.down(1).text('return true;');
            emit.dedent().down(1).text('}');
            break;
        }

        case 'StringLiteralExpression': {
            const localMode = (mode & ~(expr.abstract ? 4 : expr.concrete ? 2 : 0)) as Mode;
            emit.down(1).text(`function ${name}() {`).indent();
            if (modes.hasInput(localMode)) {
                if (modes.isPrint(localMode)) emit.down(1).text(`if (typeof IN !== 'string') return false;`);
                emit.down(1).text(`if (IP + ${expr.value.length} > IN.length) return false;`);
                for (let i = 0; i < expr.value.length; ++i) {
                    emit.down(1).text(`if (IN.charCodeAt(IP + ${i}) !== ${expr.value.charCodeAt(i)}) return false;`);
                }
                emit.down(1).text(`IP += ${expr.value.length};`);
            }
            emit.down(1).text(`OUT = ${modes.hasOutput(localMode) ? JSON.stringify(expr.value) : 'undefined'};`);
            emit.down(1).text(`return true;`);
            emit.dedent().down(1).text('}');
            break;
        }

        default:
            emit.down(1).text(`// NOT HANDLED: ${name}`);
            // TODO: was... restore...
            // throw new Error('Internal Error'); // TODO...
    }
}


// TODO: helper function
function emitConstant(emit: Emitter, name: string, value: unknown) {
    emit.down(1).text(`${name}.constant = {value: `);
    if (typeof value === 'number' || typeof value === 'boolean' || value === null) {
        emit.text(String(value));
    }
    else if (typeof value === 'string') {
        emit.text(JSON.stringify(value));
    }
    else {
        // TODO: revisit when more const types exist
        throw new Error(`Unsupported constant type '${typeof value}'`);
    }
    emit.text(`};`);
}
