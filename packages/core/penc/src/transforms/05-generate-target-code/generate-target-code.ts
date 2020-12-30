import * as fs from 'fs';
import type {Expression, Intrinsic} from '../../ast-nodes';
import type {AST} from '../../representations';
import {assert} from '../../utils';
import {Emitter, makeEmitter} from './emitter';
import {Mode, PARSE, PRINT} from './modes';
import * as modes from './modes';




// TODO: is this a representation? Move out...
export interface Program {
    ast: AST;
    consts: Record<string, {value: unknown}>;
}


// TODO: jsdoc...
export function generateTargetCode(program: Program) {
    const emit = makeEmitter();

    // TODO: Emit main exports...
    emit.down(0).text(`// ------------------------------ Main exports ------------------------------`);
    emit.down(1).text(`module.exports = {`).indent();
    for (const mode of [PARSE, PRINT] as const) {
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

    // TODO: Emit runtime... penrt.js is copied into the dist/ dir as part of the postbuild script
    emit.down(5).text(`// ------------------------------ Runtime ------------------------------`);
    const RUNTIME_PATH = require.resolve('../../deps/penrt');
    const content = fs.readFileSync(RUNTIME_PATH, 'utf8') + '\n';
    content.split(/[\r\n]+/).filter(line => !!line.trim()).forEach(line => emit.down(1).text(line));

    // TODO: Emit extensions...
    emitIntrinsics(emit, program);

    // TODO: Emit parse() and print() fns
    emitProgram(emit, program, PARSE);
    emitProgram(emit, program, PRINT);

    // All done.
    return emit.down(1).toString();
}


function emitIntrinsics(emit: Emitter, {ast}: Program) {
    const {bindings} = ast.module;
    const isIntrinsic = (e: Expression): e is Intrinsic => e.kind === 'Intrinsic';
    const extExprs = Object.keys(bindings).map(id => bindings[id]).filter(isIntrinsic);
    const extPaths = extExprs.reduce((set, {path: p}) => set.add(p), new Set<string>());
    emit.down(5).text(`// ------------------------------ Extensions ------------------------------`);
    emit.down(1).text(`const extensions = {`).indent();
    for (const extPath of extPaths.values()) {
        const content = fs.readFileSync(extPath, 'utf8') + '\n';
        emit.down(1).text(`${JSON.stringify(extPath)}: (() => {`).indent();
        content.split(/[\r\n]+/).filter(line => !!line.trim()).forEach(line => emit.down(1).text(line));
        const refdNames = extExprs.filter(expr => expr.path === extPath).map(expr => expr.name);
        emit.down(1).text(`return {${refdNames.join(', ')}};`);
        emit.dedent().down(1).text(`})(),`);
    }
    emit.dedent().down(1).text(`};`);
}


function emitProgram(emit: Emitter, program: Program, mode: PARSE | PRINT) {
    const {consts, ast} = program;
    const {bindings} = ast.module;

    // TODO: emit prolog...
    const modeName = mode === PARSE ? 'parse' : 'print';
    emit.down(5).text(`// ------------------------------ ${modeName.toUpperCase()} ------------------------------`);
    emit.down(1).text(`const ${modeName} = (() => {`).indent();

    // Emit extension exports before anything else
    const extExprIds = Object.keys(bindings).filter(name => bindings[name].kind === 'Intrinsic');
    if (extExprIds.length > 0) emit.down(2).text(`// Intrinsic`);
    for (const id of extExprIds) {
        const extExpr = bindings[id] as Intrinsic;
        emit.down(1).text(`const ${id} = extensions[${JSON.stringify(extExpr.path)}].${extExpr.name}({mode: ${mode}});`);
    }

    // TODO: emit each expression...
    for (const [name, value] of Object.entries(bindings)) {
        emitExpression(emit, name, value, mode);
        if (consts[name] === undefined) continue;
        emitConstant(emit, name, consts[name].value);
    }

    // TODO: emit epilog...
    emit.down(2).text(`return start;`);
    emit.dedent().down(1).text('})();');
}


function emitExpression(emit: Emitter, name: string, expr: Expression, mode: Mode) {
    // Should never see a GlobalReferenceExpression here.
    // TODO: jsdoc this and make it part of fn signature? Any other kinds to assert in/out
    assert(expr.kind !== 'Identifier');

    emit.down(2).text(`// ${expr.kind}`);
    switch (expr.kind) {
        // TODO: No-op cases... explain why for each
        case 'ImportExpression': // TODO: old comment... revise... already handled by emitIntrinsics
        case 'Intrinsic': // already handled by emitProgram
        case 'MemberExpression': // TODO: old comment... revise... can only refer to an extension export, and they have already been emitted
            break;

        case 'BooleanLiteral':
        case 'NullLiteral':
        case 'NumericLiteral': {
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
            assert(expr.name.kind === 'Identifier');
            assert(expr.value.kind === 'Identifier');
            emit.down(1).text(`function ${name}() {`).indent();
            emit.down(1).text(`return ${modes.isParse(mode) ? 'parseField' : 'printField'}`);
            emit.text(`(${expr.name.name}, ${expr.value.name});`);
            emit.dedent().down(1).text(`}`);
            break;
        }

        // TODO: implement...
        // case 'GenericExpression':
        //     break;

        case 'InstantiationExpression': {
            // TODO: will need a way to ensure no clashes with other identifiers once ids are relaxed to allow wider use of
            // unicode chars (grammar and SymTab currently only allow [A-Za-z0-9_] ids and scope names)
            const MEMO_SUFFIX = 'ₘ';

            assert(expr.generic.kind === 'Identifier');
            assert(expr.argument.kind === 'Identifier');
            emit.down(1).text(`let ${name}${MEMO_SUFFIX};`);
            emit.down(1).text(`function ${name}(arg) {`).indent();
            emit.down(1).text('try {').indent();
            emit.down(1).text(`return ${name}${MEMO_SUFFIX}(arg);`);
            emit.dedent().down(1).text('}').down(1).text('catch (err) {').indent();
            emit.down(1).text(`if (!(err instanceof TypeError) || !err.message.includes('${name}${MEMO_SUFFIX} is not a function')) throw err;`);
            emit.down(1).text(`${name}${MEMO_SUFFIX} = ${expr.generic.name}(${expr.argument.name});`);
            emit.down(1).text(`return ${name}${MEMO_SUFFIX}(arg);`);
            emit.dedent().down(1).text(`}`);
            emit.dedent().down(1).text(`}`);
            break;
        }

        case 'ListExpression': {
            const elements = expr.elements.map(element => {
                assert(element.kind === 'Identifier');
                return element.name;
            });
            emit.down(1).text(`function ${name}() {`).indent();
            emit.down(1).text(`return ${modes.isParse(mode) ? 'parseList' : 'printList'}([${elements.join(', ')}]);`);
            emit.dedent().down(1).text(`}`);
            break;
        }

        case 'Module': {
            emit.down(1).text(`function ${name}(member) {`).indent();
            emit.down(1).text(`switch (member) {`).indent();
            for (const [name, ref] of Object.entries(expr.bindings)) {
                assert(ref.kind === 'Identifier');
                emit.down(1).text(`case '${name}': return ${ref.name};`);
            }
            emit.down(1).text(`default: return undefined;`);
            emit.dedent().down(1).text(`}`);
            emit.dedent().down(1).text(`}`);
            break;
        }

        case 'NotExpression': {
            assert(expr.expression.kind === 'Identifier');
            emit.down(1).text(`function ${name}() {`).indent();
            emit.down(1).text(`const stateₒ = getState();`);
            emit.down(1).text(`const result = !${expr.expression.name}();`);
            emit.down(1).text(`setState(stateₒ);`);
            emit.down(1).text(`OUT = undefined;`);
            emit.down(1).text(`return result;`);
            emit.dedent().down(1).text(`}`);
            break;
        }

        case 'QuantifiedExpression': {
            assert(expr.expression.kind === 'Identifier');
            emit.down(1).text(`function ${name}() {`).indent();
            if (expr.quantifier === '?') {
                emit.down(1).text(`if (!${expr.expression.name}()) OUT = undefined;`);
            }
            else /* expr.quantifier === '*' */ {
                emit.down(1).text(`const IPₒ = IP;`);
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
            const fields = expr.fields.map(field => {
                assert(field.value.kind === 'Identifier');
                return `{name: '${field.name}', value: ${field.value.name}},`;
            });
            emit.down(1).text(`function ${name}() {`).indent();
            emit.down(1).text(`return ${modes.isParse(mode) ? 'parseRecord' : 'printRecord'}([`);
            if (fields.length > 0) {
                emit.indent();
                for (const field of fields) emit.down(1).text(field);
                emit.dedent().down(1);
            }
            emit.text(`]);`);
            emit.dedent().down(1).text(`}`);
            break;
        }

        case 'SelectionExpression': {
            const arity = expr.expressions.length;
            const exprVars = expr.expressions.map(e => { assert(e.kind === 'Identifier'); return e.name; });
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
            const exprVars = expr.expressions.map(e => { assert(e.kind === 'Identifier'); return e.name; });
            emit.down(1).text(`function ${name}() {`).indent();
            emit.down(1).text('const stateₒ = getState();');
            emit.down(1).text('let out;');
            for (let i = 0; i < arity; ++i) {
                emit.down(1).text(`if (${exprVars[i]}()) out = concat(out, OUT); else return setState(stateₒ), false;`);
            }
            emit.down(1).text('OUT = out;');
            emit.down(1).text('return true;');
            emit.dedent().down(1).text('}');
            break;
        }

        case 'StringLiteral': {
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
            // TODO: add exhaustiveness check...
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
