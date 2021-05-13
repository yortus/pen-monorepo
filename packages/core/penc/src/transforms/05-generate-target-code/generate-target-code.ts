import * as fs from 'fs';
import type {V} from '../../representations';
import {assert} from '../../utils';
import {Emitter, makeEmitter} from './emitter';




// TODO: is this a representation? Move out...
export interface Program {
    ast: V.AST<400>;
    consts: Record<string, {value: unknown}>;
}


// TODO: jsdoc...
export function generateTargetCode(program: Program) {

    // TODO: validate AST... move this to validate-ast.ts
    assert(program.ast.start.expression.kind === 'Identifier');
    assert(program.ast.start.expression.name.startsWith('start'));




    const emit = makeEmitter();

    // TODO: Emit main exports...
    emit.down(0).text(`// ------------------------------ Main exports ------------------------------`);
    emit.down(1).text(`module.exports = {`).indent();

    emit.down(1).text(`parse(text) {`).indent();
    emit.down(1).text(`CREP = text;`);
    emit.down(1).text(`CPOS = 0;`);
    emit.down(1).text(`AREP = [];`);
    emit.down(1).text(`APOS = 0;`);
    emit.down(1).text(`HAS_IN = HAS_OUT = true;`);
    emit.down(1).text(`if (!parseInner(parse, true)) throw new Error('parse failed');`);
    emit.down(1).text(`if (CPOS !== CREP.length) throw new Error('parse didn\\\'t consume entire input');`);
    emit.down(1).text(`return AREP[0];`);
    emit.dedent().down(1).text(`},`);

    emit.down(1).text(`print(node) {`).indent();
    emit.down(1).text(`AREP = [node];`);
    emit.down(1).text(`APOS = 0;`);
    emit.down(1).text(`CREP = [];`);
    emit.down(1).text(`CPOS = 0;`);
    emit.down(1).text(`HAS_IN = HAS_OUT = true;`);
    emit.down(1).text(`if (!printInner(print)) throw new Error('print failed');`);
    emit.down(1).text(`return CREP.join('');`);
    emit.dedent().down(1).text(`},`);

    emit.dedent().down(1).text(`};`);

    // TODO: Emit runtime... penrt.js is copied into the dist/ dir as part of the postbuild script
    emit.down(5).text(`// ------------------------------ Runtime ------------------------------`);
    const RUNTIME_PATH = require.resolve('../../deps/penrt');
    const content = fs.readFileSync(RUNTIME_PATH, 'utf8') + '\n';
    content.split(/[\r\n]+/).filter(line => !!line.trim()).forEach(line => emit.down(1).text(line));

    // TODO: Emit extensions...
    emitIntrinsics(emit, program);

    // TODO: Emit parse() and print() fns
    emitProgram(emit, program, 'parse');
    emitProgram(emit, program, 'print');

    // All done.
    return emit.down(1).toString();
}


function emitIntrinsics(emit: Emitter, {ast}: Program) {
    const {bindings} = ast.start;
    const isIntrinsic = (e: V.Expression<400>): e is V.Intrinsic => e.kind === 'Intrinsic';
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


function emitProgram(emit: Emitter, program: Program, mode: 'parse' | 'print') {
    const {consts, ast} = program;
    const {bindings} = ast.start;

    // TODO: emit prolog...
    emit.down(5).text(`// ------------------------------ ${mode.toUpperCase()} ------------------------------`);
    emit.down(1).text(`const ${mode} = (() => {`).indent();

    // TODO: emit top-level bindings
    emitBindings(emit, bindings, consts, mode);

    // TODO: emit epilog...
    assert(program.ast.start.expression.kind === 'Identifier');
    emit.down(2).text(`return ${program.ast.start.expression.name};`);
    emit.dedent().down(1).text('})();');
}


function emitBindings(emit: Emitter, bindings: V.BindingMap<400>, consts: Record<string, {value: unknown}>, mode: 'parse' | 'print') {

    // Emit extension exports before anything else (if any)
    const extExprIds = Object.keys(bindings).filter(name => bindings[name].kind === 'Intrinsic');
    if (extExprIds.length > 0) emit.down(2).text(`// Intrinsic`);
    for (const id of extExprIds) {
        const extExpr = bindings[id] as V.Intrinsic;
        emit.down(1).text(`const ${id} = extensions[${JSON.stringify(extExpr.path)}].${extExpr.name}({mode: '${mode}'});`);
    }

    // TODO: emit each binding...
    for (const [name, value] of Object.entries(bindings)) {
        emitBinding(emit, name, value, consts, mode);
        if (consts[name] === undefined) continue;
        emitConstant(emit, name, consts[name].value);
    }
}


function emitBinding(emit: Emitter, name: string, expr: V.Expression<400>, consts: Record<string, {value: unknown}>, mode: 'parse' | 'print') {
    // TODO: old... was... maybe restore?
    // Should never see an Identifier here.
    // TODO: jsdoc this and make it part of fn signature? Any other kinds to assert in/out?
    // assert(expr.kind !== 'Identifier');

    emit.down(2).text(`// ${expr.kind}`);
    switch (expr.kind) {
        // TODO: No-op cases... explain why for each
        case 'Intrinsic': // already handled by emitProgram
            break;

        // TODO:
        case 'MemberExpression':  {
            emit.down(1).text(`function ${name}(arg) {`).indent();
            emit.down(1).text(`return ${expr.module.name}(${JSON.stringify(expr.member)})(arg);`);
            emit.dedent().down(1).text('}');
            break;
        }

        case 'BooleanLiteral':
        case 'NullLiteral':
        case 'NumericLiteral': {
            const outText = mode === 'parse' ? JSON.stringify(expr.value) : 'undefined';
            emit.down(1).text(`function ${name}() {`).indent();
            if (mode === 'print') {
                emit.down(1).text(`if (HAS_IN) {`).indent();
                emit.down(1).text(`if (IN !== ${JSON.stringify(expr.value)} || IP !== 0) return false;`);
                emit.down(1).text(`IP += 1;`);
                emit.dedent().down(1).text(`}`);
            }
            emit.down(1).text(`OUT = HAS_OUT ? ${outText} : undefined;`);
            emit.down(1).text(`return true;`);
            emit.dedent().down(1).text('}');
            break;
        }

        case 'CodeExpression': {
            emit.down(1).text(`function ${name}() {`).indent();
            if (mode === 'parse') {
                emit.down(1).text(`const HAS_OUTₒ = HAS_OUT;`);
                emit.down(1).text(`HAS_OUT = false;`);
                emit.down(1).text(`const result = ${expr.expression.name}();`);
                emit.down(1).text(`HAS_OUT = HAS_OUTₒ;`);
                emit.down(1).text(`return result;`);
            }
            else /* mode === 'print' */ {
                emit.down(1).text(`const HAS_INₒ = HAS_IN;`);
                emit.down(1).text(`HAS_IN = false;`);
                emit.down(1).text(`const result = ${expr.expression.name}();`);
                emit.down(1).text(`HAS_IN = HAS_INₒ;`);
                emit.down(1).text(`return result;`);
            }
            emit.dedent().down(1).text(`}`);
            break;
        }

        // TODO: ...
        case 'GenericExpression': {
            emit.down(1).text(`function ${name}(${expr.param}) {`).indent();
            emitBindings(emit, expr.body.bindings, consts, mode);
            emit.down(2).text(`return ${expr.body.expression.name};`);
            emit.dedent().down(1).text(`}`);
            break;
        }

        // TODO: ...
        case 'GenericParameter':
        case 'Identifier': {
            emit.down(1).text(`function ${name}(arg) {`).indent();
            emit.down(1).text(`return ${expr.name}(arg);`);
            emit.dedent().down(1).text(`}`);
            break;
        }

        case 'InstantiationExpression': {
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
            emit.down(1).text(`let ${name}${MEMO_SUFFIX};`);
            emit.down(1).text(`function ${name}(arg) {`).indent();
            emit.down(1).text('try {').indent();
            emit.down(1).text(`return ${name}${MEMO_SUFFIX}(arg);`);
            emit.dedent().down(1).text('}').down(1).text('catch (err) {').indent();
            emit.down(1).text(`if (!(err instanceof TypeError) || !err.message.includes('${name}${MEMO_SUFFIX} is not a function')) throw err;`);
            emit.down(1).text(`${name}${MEMO_SUFFIX} = ${mode}List([`);
            emit.indent();
            for (const item of expr.items) {
                emit.down(1).text(`{
                    kind: '${item.kind === 'Splice' ? 'Splice' : 'Element'}',
                    expr: ${item.kind === 'Splice' ? item.expression.name : item.name}
                },`);
            }
            emit.dedent();
            if (expr.items.length > 0) emit.down(1);
            emit.text(`]);`);
            emit.down(1).text(`return ${name}${MEMO_SUFFIX}(arg);`);
            emit.dedent().down(1).text(`}`);
            emit.dedent().down(1).text(`}`);
            break;
        }

        case 'Module': {
            emit.down(1).text(`function ${name}(member) {`).indent();
            emit.down(1).text(`switch (member) {`).indent();
            for (const [name, ref] of Object.entries(expr.bindings)) {
                emit.down(1).text(`case '${name}': return ${ref.name};`);
            }
            emit.down(1).text(`default: return undefined;`);
            emit.dedent().down(1).text(`}`);
            emit.dedent().down(1).text(`}`);
            break;
        }

        case 'NotExpression': {
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
            emit.down(1).text(`function ${name}() {`).indent();
            if (expr.quantifier === '?') {
                // TODO: update...
                emit.down(1).text(`if (!${expr.expression.name}()) OUT = undefined;`);
            }
            else /* expr.quantifier === '*' */ {
                // TODO: update...
                const [_IREP, IPOS] = mode === 'parse' ? ['CREP', 'CPOS'] : ['AREP', 'APOS'];
                const [_OREP, _OPOS] = mode === 'parse' ? ['AREP', 'APOS'] : ['CREP', 'CPOS'];
                emit.down(1).text(`const ${IPOS}ₒ = ${IPOS};`);
                emit.down(1).text(`do {`).indent();
                emit.down(1).text(`if (!${expr.expression.name}()) break;`);
                emit.down(1).text(`if (${IPOS} === ${IPOS}ₒ) break;`);
                emit.dedent().down(1).text(`} while (true);`);
            }
            emit.down(1).text(`return true;`);
            emit.dedent().down(1).text('}');
            break;
        }

        case 'RecordExpression': {
            emit.down(1).text(`let ${name}${MEMO_SUFFIX};`);
            emit.down(1).text(`function ${name}(arg) {`).indent();
            emit.down(1).text('try {').indent();
            emit.down(1).text(`return ${name}${MEMO_SUFFIX}(arg);`);
            emit.dedent().down(1).text('}').down(1).text('catch (err) {').indent();
            emit.down(1).text(`if (!(err instanceof TypeError) || !err.message.includes('${name}${MEMO_SUFFIX} is not a function')) throw err;`);
            emit.down(1).text(`${name}${MEMO_SUFFIX} = ${mode}Record([`);
            emit.indent();
            for (const item of expr.items) {
                emit.down(1).text(`{
                    kind: '${item.kind}',
                    name: ${item.kind === 'Splice'
                        ? 'undefined'
                        : typeof item.name === 'string' ? JSON.stringify(item.name) : item.name.name},
                    expr: ${item.kind === 'Field' ? item.expression.name : item.expression.name}
                },`);
            }
            emit.dedent();
            if (expr.items.length > 0) emit.down(1);
            emit.text(`]);`);
            emit.down(1).text(`return ${name}${MEMO_SUFFIX}(arg);`);
            emit.dedent().down(1).text(`}`);
            emit.dedent().down(1).text(`}`);
            break;
        }

        case 'SelectionExpression': {
            const arity = expr.expressions.length;
            const exprVars = expr.expressions.map(e => e.name);
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
            const exprVars = expr.expressions.map(e => e.name);
            emit.down(1).text(`function ${name}() {`).indent();
            emit.down(1).text('const [APOSₒ, CPOSₒ, ATYPₒ] = savepoint();');
            for (let i = 0; i < arity; ++i) {
                emit.down(1).text(`if (!${exprVars[i]}()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);`);
            }
            emit.down(1).text('return true;');
            emit.dedent().down(1).text('}');
            break;
        }

        case 'StringAbstract': { // AST literal
            const outText = mode === 'parse' ? JSON.stringify(expr.value) : 'undefined';
            emit.down(1).text(`function ${name}() {`).indent();
            if (mode === 'print') {
                emit.down(1).text(`if (HAS_IN) {`).indent();
                emit.down(1).text(`if (typeof IN !== 'string') return false;`);
                emit.down(1).text(`if (IP + ${expr.value.length} > IN.length) return false;`);
                for (let i = 0; i < expr.value.length; ++i) {
                    emit.down(1).text(`if (IN.charCodeAt(IP + ${i}) !== ${expr.value.charCodeAt(i)}) return false;`);
                }
                emit.down(1).text(`IP += ${expr.value.length};`);
                emit.dedent().down(1).text(`}`);
            }
            emit.down(1).text(`OUT = HAS_OUT ? ${outText} : undefined;`);
            emit.down(1).text(`return true;`);
            emit.dedent().down(1).text('}');
            break;
        }

        case 'StringUniversal': { // Code parse from bytestream to string
            const [IREP, IPOS] = mode === 'parse' ? ['CREP', 'CPOS'] : ['AREP', 'APOS'];
            const [OREP, OPOS] = mode === 'parse' ? ['AREP', 'APOS'] : ['CREP', 'CPOS'];
            emit.down(1).text(`function ${name}() {`).indent();
            emit.down(1).text(`if (HAS_IN) {`).indent();
            if (mode === 'print') emit.down(1).text(`if (ATYP !== STRING) return false;`);
            emit.down(1).text(`if (${IPOS} + ${expr.value.length} > ${IREP}.length) return false;`);
            for (let i = 0; i < expr.value.length; ++i) {
                emit.down(1).text(`if (${IREP}.charCodeAt(${IPOS} + ${i}) !== ${expr.value.charCodeAt(i)}) return false;`);
            }
            emit.down(1).text(`${IPOS} += ${expr.value.length};`);
            emit.dedent().down(1).text(`}`);
            emit.down(1).text(`if (HAS_OUT) ${OREP}[${OPOS}++] = ${JSON.stringify(expr.value)};`);
            if (mode === 'parse') emit.down(1).text(`ATYP = STRING;`);
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

// TODO: will need a way to ensure no clashes with other identifiers once ids are relaxed to allow wider use of
// unicode chars (grammar and SymTab currently only allow [A-Za-z0-9_] ids and scope names)
const MEMO_SUFFIX = 'ₘ';


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
