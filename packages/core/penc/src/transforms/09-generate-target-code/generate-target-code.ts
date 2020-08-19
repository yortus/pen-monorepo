// TODO: X_memo emitted names could clash with program ids? Ensure they can't...


import * as fs from 'fs';
import * as AstNodes from '../../ast-nodes';
import {assert} from '../../utils';
import {FlatExpressionList} from '../07-create-flat-expression-list';
import {ResolvedNodeKind} from '../asts';
import {Emitter, makeEmitter} from './emitter';
import {Mode, PARSE, PRINT} from './modes';
import * as modes from './modes';


type Expression = AstNodes.Expression<ResolvedNodeKind>;
type ExtensionExpression = AstNodes.ExtensionExpression;


export interface Program {
    il: FlatExpressionList;
    consts: Record<string, {value: unknown}>;
}


// TODO: doc...
export function generateTargetCode(program: Program) {
    const emit = makeEmitter();

    // TODO: Emit main exports...
    emit.down(0).text(`// ------------------------------ Main exports ------------------------------`);
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

    // TODO: Emit runtime... penrt.js is copied into the dist/ dir as part of the postbuild script
    emit.down(5).text(`// ------------------------------ Runtime ------------------------------`);
    const RUNTIME_PATH = require.resolve('../../deps/penrt');
    let content = fs.readFileSync(RUNTIME_PATH, 'utf8') + '\n';
    content.split(/[\r\n]+/).filter(line => !!line.trim()).forEach(line => emit.down(1).text(line));

    // TODO: Emit extensions...
    emitExtensions(emit, program);

    // TODO: Emit parse() and print() fns
    emitProgram(emit, program, PARSE);
    emitProgram(emit, program, PRINT);

    // All done.
    return emit.down(1).toString();
}


function emitExtensions(emit: Emitter, {il: {flatList}}: Program) {
    let isExtensionExpression = (e: Expression): e is ExtensionExpression => e.kind === 'ExtensionExpression';
    let extExprs = Object.keys(flatList).map(id => flatList[id]).filter(isExtensionExpression);
    let extPaths = extExprs.reduce((set, {extensionPath: p}) => set.add(p), new Set<string>());
    emit.down(5).text(`// ------------------------------ Extensions ------------------------------`);
    emit.down(1).text(`const extensions = {`).indent();
    for (let extPath of extPaths.values()) {
        let content = fs.readFileSync(extPath, 'utf8') + '\n';
        emit.down(1).text(`${JSON.stringify(extPath)}: (() => {`).indent();
        content.split(/[\r\n]+/).filter(line => !!line.trim()).forEach(line => emit.down(1).text(line));
        let refdNames = extExprs.filter(expr => expr.extensionPath === extPath).map(expr => expr.bindingName);
        emit.down(1).text(`return {${refdNames.join(', ')}};`);
        emit.dedent().down(1).text(`})(),`);
    }
    emit.dedent().down(1).text(`};`);
}


function emitProgram(emit: Emitter, program: Program, mode: PARSE | PRINT) {
    let {consts, il: {startName, flatList}} = program;

    // TODO: emit prolog...
    const modeName = mode === PARSE ? 'parse' : 'print';
    emit.down(5).text(`// ------------------------------ ${modeName.toUpperCase()} ------------------------------`);
    emit.down(1).text(`const ${modeName} = (() => {`).indent();

    // Emit extension exports before anything else
    let extExprIds = Object.keys(flatList).filter(name => flatList[name].kind === 'ExtensionExpression');
    if (extExprIds.length > 0) emit.down(2).text(`// ExtensionExpressions`);
    for (let id of extExprIds) {
        let extExpr = flatList[id] as ExtensionExpression;
        emit.down(1).text(`const ${id} = extensions[${JSON.stringify(extExpr.extensionPath)}].${extExpr.bindingName}({mode: ${mode}});`);
    }

    // TODO: emit each expression...
    for (let [name, expr] of Object.entries(flatList)) {
        emitExpression(emit, name, expr, mode);
        if (consts[name] === undefined) continue;
        emitConstant(emit, name, consts[name].value);
    }

    // TODO: emit epilog...
    emit.down(2).text(`return ${startName};`);
    emit.dedent().down(1).text('})();');
}


function emitExpression(emit: Emitter, name: string, expr: Expression, mode: Mode) {
    emit.down(2).text(`// ${expr.kind}`);
    switch (expr.kind) {
        // TODO: No-op cases... explain why for each
        case 'ExtensionExpression': // already handled by emitProgram
        case 'ImportExpression': // TODO: old comment... revise... already handled by emitExtensions
        case 'MemberExpression': // TODO: old comment... revise... can only refer to an extension export, and they have already been emitted
            break;

        case 'ApplicationExpression': {
            assert(expr.lambda.kind === 'ReferenceExpression');
            assert(expr.argument.kind === 'ReferenceExpression');
            // TODO: if lambda refers to an extension export, can safety emit const without fn wrapper (all exts def'd)
            emit.down(1).text(`function ${name}(arg) {`).indent();
            emit.down(1).text(`if (${name}_memo) return ${name}_memo(arg);`);
            emit.down(1).text(`${name}_memo = ${expr.lambda.globalName}(${expr.argument.globalName});`);
            emit.down(1).text(`return ${name}_memo(arg);`);
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
            emit.down(1).text(`name: ${expr.name.globalName},`);
            emit.down(1).text(`value: ${expr.value.globalName},`);
            emit.dedent().down(1).text('});');
            emit.down(1).text(`return ${name}_memo();`);
            emit.dedent().down(1).text(`}`);
            emit.down(1).text(`let ${name}_memo;`);
            break;
        }

        // TODO: implement...
        // case 'LambdaExpression':
        //     break;

        case 'ListExpression': {
            emit.down(1).text(`function ${name}() {`).indent();
            emit.down(1).text(`if (${name}_memo) return ${name}_memo();`);
            emit.down(1).text(`${name}_memo = list({`).indent();
            emit.down(1).text(`mode: ${mode},`);
            emit.down(1).text('elements: [');
            emit.text(`${expr.elements.map(e => e.kind === 'ReferenceExpression' ? e.globalName : '?').join(', ')}`);
            emit.text('],').dedent().down(1).text('})');
            emit.down(1).text(`return ${name}_memo();`);
            emit.dedent().down(1).text(`}`);
            emit.down(1).text(`let ${name}_memo;`);
            break;
        }

        case 'ModuleExpression': {
            emit.down(1).text(`function ${name}(bindingName) {`).indent();
            emit.down(1).text(`switch (bindingName) {`).indent();
            for (let binding of expr.module.bindings) {
                assert(binding.kind === 'GlobalBinding');
                assert(binding.value.kind === 'ReferenceExpression');
                emit.down(1).text(`case '${binding.localName}': return ${binding.value.globalName};`);
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
            emit.down(1).text(`let result = !${expr.expression.globalName}();`);
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
                emit.down(1).text(`if (!${expr.expression.globalName}()) OUT = undefined;`);
            }
            else /* expr.quantifier === '*' */ {
                emit.down(1).text(`let IPₒ = IP;`);
                emit.down(1).text(`let out;`);
                emit.down(1).text(`do {`).indent();
                emit.down(1).text(`if (!${expr.expression.globalName}()) break;`);
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
                    emit.down(1).text(`{name: '${field.name}', value: ${field.value.globalName}},`);
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
            const exprVars = expr.expressions.map(e => { assert(e.kind === 'ReferenceExpression'); return e.globalName; });
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
            const exprVars = expr.expressions.map(e => { assert(e.kind === 'ReferenceExpression'); return e.globalName; });
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
