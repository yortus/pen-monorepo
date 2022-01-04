import * as fs from 'fs';
import type {V} from '../../representations';
import {assert} from '../../utils';
import {Emitter, makeEmitter} from './emitter';




// TODO: jsdoc...
export function generateTargetCode(ast: V.AST<400>) {

    // TODO: validate AST... move this to validate-ast.ts
    assert(ast.start.expression.kind === 'Identifier');
    assert(ast.start.expression.name.startsWith('ꐚstart'));




    const emit = makeEmitter();

    // TODO: Emit main exports...
    emit.lines(`
        // ------------------------------ Main exports ------------------------------
        module.exports = {
            parse(strOrBuf) {${/* expects buf to be utf8 encoded */''}
                CREP = Buffer.isBuffer(strOrBuf) ? strOrBuf : Buffer.from(strOrBuf, 'utf8');
                CPOS = 0;
                AREP = [];
                APOS = 0;
                if (!parseValue(parse)) throw new Error('parse failed');
                if (CPOS !== CREP.length) throw new Error('parse didn\\\'t consume entire input');
                return AREP[0];
            },
            print(node, buf) {
                AREP = [node];
                APOS = 0;
                CREP = buf || Buffer.alloc(2 ** 22); // 4MB
                CPOS = 0;
                if (!printValue(print)) throw new Error('print failed');
                if (CPOS > CREP.length) throw new Error('output buffer too small');
                return buf ? CPOS : CREP.toString('utf8', 0, CPOS);
            },
        };
    `);

    // TODO: Emit runtime... penrt.js is copied into the dist/ dir as part of the postbuild script
    emit.down(5).text(`// ------------------------------ Runtime ------------------------------`);
    const RUNTIME_PATH = require.resolve('../../deps/penrt');
    const content = fs.readFileSync(RUNTIME_PATH, 'utf8') + '\n';
    content.split(/[\r\n]+/).filter(line => !!line.trim()).forEach(line => emit.down(1).text(line));

    // TODO: Emit extensions...
    emitIntrinsics(emit, ast);

    // TODO: Emit parse() and print() fns
    emitProgram(emit, ast);

    // All done.
    return emit.down(1).toString();
}


function emitIntrinsics(emit: Emitter, ast: V.AST<400>) {
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


function emitProgram(emit: Emitter, ast: V.AST<400>) {
    const {bindings} = ast.start;

    // TODO: emit prolog...
    emit.down(5).text(`// ------------------------------ Program ------------------------------`);
    emit.down(1).text(`const parse = create('parse');`);
    emit.down(1).text(`const print = create('print');`);
    emit.down(1).text(`function create(mode) {`).indent();

    // TODO: emit top-level bindings
    emitBindings(emit, bindings);

    // TODO: emit epilog...
    emit.down(2).text(`return ${ast.start.expression.name};`);
    emit.dedent().down(1).text('}');
}


function emitBindings(emit: Emitter, bindings: V.BindingMap<400>) {
    for (const [name, value] of Object.entries(bindings)) {
        emitBinding(emit, name, value);
    }
}


function emitBinding(emit: Emitter, name: string, expr: V.Expression<400>) {
    emit.down(2).text(`// ${expr.kind}`);

    // Emit expressions that may not be Rules
    switch (expr.kind) {
        case 'ApplicationExpression': {
            emit.lines(`const ${name} = lazy(() => ${expr.function.name}(${expr.argument.name}));`);
            return;
        }

        case 'FunctionExpression': {
            emit.down(1).text(`const ${name} = (${expr.param}) => {`).indent();
            emitBindings(emit, expr.body.bindings);
            emit.down(2).text(`return ${expr.body.expression.name};`);
            emit.dedent().down(1).text(`};`);
            return;
        }

        case 'FunctionParameter':
        case 'Identifier': {
            emit.lines(`
                const ${name} = Object.assign(
                    arg => ${expr.name}(arg),
                    {infer: arg => ${expr.name}.infer(arg)},
                );
            `);
            return;
        }

        case 'Intrinsic': {
            emit.lines(`const ${name} = extensions[${JSON.stringify(expr.path)}].${expr.name}(mode);`);
            return;
        }

        case 'MemberExpression':  {
            emit.lines(`const ${name} = (arg) => ${expr.module.name}(${JSON.stringify(expr.member)})(arg);`);
            return;
        }

        case 'Module': {
            emit.lines(`
                const ${name} = (member) => {
                    switch (member) {
                        ${Object.entries(expr.bindings)
                            .map(([name, ref]) => `case '${name}': return ${ref.name};`)
                            .join('\n')
                        }
                        default: return undefined;
                    }
                };
            `);
            return;
        }
    }

    // Emit all other expressions (these are all definitely Rules).
    emit.down(1).text(`const ${name} = createRule(mode, {`).indent();
    switch (expr.kind) {
        case 'AbstractExpression': {
            emit.lines(`
                parse: {
                    full: () => (${expr.expression.name}.infer(), true),
                    infer: () => ${expr.expression.name}.infer(),
                },
                print: {
                    full: () => {
                        const CPOSₒ = CPOS;
                        const result = ${expr.expression.name}();
                        CPOS = CPOSₒ;
                        return result;
                    },
                    infer: () => {},
                },
            `);
            break;
        }

        case 'BooleanLiteral':
        case 'NullLiteral':
        case 'NumericLiteral': {
            emit.lines(`
                parse: {
                    full: () => (emitScalar(${JSON.stringify(expr.value)}), true),
                    infer: () => emitScalar(${JSON.stringify(expr.value)}),
                },
                print: {
                    full: function LIT() {
                        if (ATYP !== SCALAR) return false;
                        if (AREP[APOS] !== ${JSON.stringify(expr.value)}) return false; ${/* TODO: need to ensure APOS<ALEN too, also elsewhere similar... */''}
                        APOS += 1;
                        return true;
                    },
                    infer: () => {},
                },
                constant: ${JSON.stringify(expr.value)},
            `);
            break;
        }

        case 'ByteExpression': {
            for (const mode of ['parse', 'print'] as const) {
                const hasInput = mode === 'parse' ? expr.subkind !== 'A' : mode === 'print' ? expr.subkind !== 'C' : false;
                const hasOutput = mode === 'parse' ? expr.subkind !== 'C' : mode === 'print' ? expr.subkind !== 'A' : true;
                const [IREP, IPOS] = mode === 'parse' ? ['CREP', 'CPOS'] : ['AREP', 'APOS'];
                emit.down(1).text(`${mode}: {`).indent();
                emit.down(1).text(`full: function BYT() {`).indent();
                emit.down(1).text(`let cc;`);
                if (hasInput) {
                    if (mode === 'print') emit.down(1).text(`if (ATYP !== STRING_CHARS) return false;`);
                    emit.down(1).text(`if (${IPOS} >= ${IREP}.length) return false;`);
                    emit.down(1).text(`cc = ${IREP}[${IPOS}];`);
                    for (const excl of expr.exclude || []) {
                        const [lo, hi, isRange] = Array.isArray(excl) ? [...excl, true] : [excl, -1, false];
                        const min = `0x${lo.toString(16).padStart(2, '0')}`;
                        const max = `0x${hi.toString(16).padStart(2, '0')}`;
                        const cond = isRange ? `cc >= ${min} && cc <= ${max}` : `cc === ${min}`;
                        emit.down(1).text(`if (${cond}) return false;`);
                    }
                    const include = expr.include.length === 0 ? [0x00, 0xff] : expr.include;
                    const cond = include.map(incl => {
                        const [lo, hi, isRange] = Array.isArray(incl) ? [...incl, true] : [incl, -1, false];
                        const min = `0x${lo.toString(16).padStart(2, '0')}`;
                        const max = `0x${hi.toString(16).padStart(2, '0')}`;
                        return isRange ? `(cc < ${min} || cc > ${max})` : `cc !== ${min}`;
                    }).join(' && ');
                    emit.down(1).text(`if (${cond}) return false;`);
                    emit.down(1).text(`${IPOS} += 1;`);
                }
                else {
                    emit.down(1).text(`cc = 0x${expr.default.toString(16).padStart(2, '0')};`);
                }
                if (hasOutput) {
                    emit.down(1).text(mode === 'parse' ? `emitByte(cc);` : `CREP[CPOS++] = cc;`);
                }
                emit.down(1).text(`return true;`);
                emit.dedent().down(1).text(`},`);
                if (!hasOutput) {
                    emit.down(1).text(`infer: () => {},`);
                }
                else {
                    emit.down(1).text(`infer: () => {`).indent();
                    const pre = mode === 'parse' ? 'emitByte(' : 'CREP[CPOS++] = ';
                    const post = mode === 'parse' ? ');' : ';';
                    emit.down(1).text(`${pre}0x${expr.default.toString(16).padStart(2, '0')}${post}`);
                    emit.dedent().down(1).text('},');
                }
                emit.dedent().down(1).text('},');
            }
            break;
        }

        case 'ConcreteExpression': {
            emit.lines(`
                parse: {
                    full: () => {
                        const [APOSₒ, AREPₒ] = [APOS, AREP];
                        const result = ${expr.expression.name}();
                        APOS = APOSₒ, AREP = AREPₒ, ATYP = NOTHING;
                        return result;
                    },
                    infer: () => (ATYP = NOTHING),
                },
                print: {
                    full: () => (${expr.expression.name}.infer(), true),
                    infer: () => ${expr.expression.name}.infer(),
                },
            `);
            break;
        }

        case 'ListExpression': {
            emit.lines(`
                parse: {
                    full: function LST() {
                        const [APOSₒ, CPOSₒ] = [APOS, CPOS];
                        if (APOS === 0) AREP = [];
                        ${expr.items
                            .map(item => item.kind === 'Splice'
                                ? `if (!${item.expression.name}()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;`
                                : `if (!parseValue(${item.name})) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;`)
                            .join('\n')
                        }
                        ATYP = LIST_ELEMENTS;
                        return true;
                    },
                    infer: function LST() {
                        if (APOS === 0) AREP = [];
                        ${expr.items
                            .map(item => item.kind === 'Splice'
                                ? `${item.expression.name}.infer();`
                                : `parseInferValue(${item.name}.infer);`)
                            .join('\n')
                        }
                        ATYP = LIST_ELEMENTS;
                    },
                },
                print: {
                    full: function LST() {
                        if (ATYP !== LIST_ELEMENTS) return false;
                        const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
                        ${expr.items
                            .map(item => item.kind === 'Splice'
                                ? `ATYP = LIST_ELEMENTS;\nif (!${item.expression.name}()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;`
                                : `if (!printValue(${item.name})) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;`)
                            .join('\n')
                        }
                        return true;
                    },
                    infer: function LST() {
                        if (ATYP !== LIST_ELEMENTS && ATYP !== NOTHING) return false;
                        ${expr.items
                            .map(item => item.kind === 'Splice'
                                ? `ATYP = LIST_ELEMENTS;\n${item.expression.name}.infer();`
                                : `printInferValue(${item.name}.infer);`)
                            .join('\n')
                        }
                    },
                },
            `);
            break;
        }

        case 'NotExpression': {
            // TODO: infer always succeeds, both for `not x` and `not not x`. Seems logically inconsistent. Implications? Alternatives?
            for (const mode of ['parse', 'print'] as const) {
                emit.lines(`
                    ${mode}: {
                        full: function NOT() {
                            const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
                            const result = !${expr.expression.name}();
                            [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ${mode === 'parse' ? 'NOTHING' : `ATYPₒ`}];
                            return result;
                        },
                        infer: () => ${mode === 'parse' ? '(ATYP = NOTHING)' : '{}'},
                    },
                `);
            }
            break;
        }

        case 'QuantifiedExpression': {
            for (const mode of ['parse', 'print'] as const) {
                emit.down(1).text(`${mode}: {`).indent();
                emit.down(1).text(`full: function QUA() {`).indent();
                if (expr.quantifier === '?') {
                    const call = `${expr.expression.name}()`;
                    emit.lines(mode === 'parse' ? `if (!${call}) ATYP = NOTHING;` : `${call};`);
                }
                else /* expr.quantifier === '*' */ {
                    const IPOS = mode === 'parse' ? 'CPOS' : 'APOS';
                    const OPOS = mode === 'parse' ? 'APOS' : 'CPOS';
                    emit.down(1).text(`let [${IPOS}ᐟ, ${OPOS}ᐟ] = [${IPOS}, ${OPOS}];`);
                    if (mode === 'parse') emit.down(1).text(`let seqType = ATYP = NOTHING;`);
                    emit.down(1).text(`while (true) {`).indent();
                    emit.down(1).text(`if (!${expr.expression.name}() || ${IPOS} <= ${IPOS}ᐟ) break;`);
                    if (mode === 'parse') emit.down(1).text(`seqType |= ATYP;`);
                    emit.down(1).text(`${IPOS}ᐟ = ${IPOS}, ${OPOS}ᐟ = ${OPOS};`);
                    emit.dedent().down(1).text(`}`);
                    emit.down(1).text(`${IPOS} = ${IPOS}ᐟ, ${OPOS} = ${OPOS}ᐟ${mode === 'parse' ? ', ATYP = seqType' : ''};`);
                }
                emit.down(1).text(`return true;`);
                emit.dedent().down(1).text('},');
                emit.down(1).text(`infer: () => ${mode === 'parse' ? '(ATYP = NOTHING)' : '{}'},`);
                emit.dedent().down(1).text('},');
            }
            break;
        }

        case 'RecordExpression': {
            // TODO: restore the duplication detection logic below (`fieldLabels` checks)
            emit.lines(`
                parse: {
                    full: function RCD() {
                        const [APOSₒ, CPOSₒ] = [APOS, CPOS];
                        if (APOS === 0) AREP = [];
                        ${expr.items.map(item => `
                            ${item.kind === 'Field' ? `
                                ${/* Parse field label */ ''}
                                ${typeof item.label === 'string' ? `
                                    AREP[APOS++] = ${JSON.stringify(item.label)};
                                ` : `
                                    if (!parseValue(${item.label.name})) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                                    assert(ATYP === STRING_CHARS);
                                `}

                                ${/* Parse field value */''}
                                if (!parseValue(${item.expression.name})) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                            ` : /* item.kind === 'Splice' */ `
                                const apos = APOS;
                                if (!${item.expression.name}()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                            `}
                        `).join('\n')}
                        ATYP = RECORD_FIELDS;
                        return true;
                    },
                    infer: function RCD() {
                        const APOSₒ = APOS;
                        if (APOS === 0) AREP = [];
                        ${expr.items.map(item => `
                            ${item.kind === 'Field' ? `
                                ${/* Parse field label */''}
                                ${typeof item.label === 'string' ? `
                                    AREP[APOS++] = ${JSON.stringify(item.label)};
                                ` : `
                                    parseInferValue(${item.label.name}.infer);
                                    assert(ATYP === STRING_CHARS);
                                `}

                                ${/* Parse field value */ ''}
                                parseInferValue(${item.expression.name}.infer);
                            ` : /* item.kind === 'Splice' */ `
                                const apos = APOS;
                                ${item.expression.name}.infer();
                            `}
                        `).join('\n')}
                        ATYP = RECORD_FIELDS;
                    },
                },
                print: {
                    full: function RCD() {
                        if (ATYP !== RECORD_FIELDS) return false;
                        const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
                        const propList = AREP;
                        const propCount = AREP.length >> 1;
                        let bitmask = APOS;
                        let i;
                        ${expr.items.map(item => `
                            ${item.kind === 'Field' ? `
                                ${/* Print field label */ ''}
                                ${typeof item.label === 'string' ? `
                                    for (i = 0, APOS = 1; (bitmask & (1 << i)) !== 0 && propList[i << 1] !== ${JSON.stringify(item.label)}; ++i, APOS += 2) ;
                                    if (i >= propCount) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
                                ` : `
                                    for (i = APOS = 0; (bitmask & (1 << i)) !== 0; ++i, APOS += 2) ;
                                    if (i >= propCount || !printValue(${item.label.name})) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
                                `}
        
                                ${/* Print field value */ ''}
                                if (!printValue(${item.expression.name})) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
                                bitmask += (1 << i);
                            ` : /* item.kind === 'Splice' */ `
                                APOS = bitmask;
                                ATYP = RECORD_FIELDS;
                                if (!${item.expression.name}()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
                                bitmask = APOS;
                            `}
                        `).join('\n')}
                        APOS = bitmask;
                        return true;
                    },
                    infer: function RCD() {
                        if (ATYP !== RECORD_FIELDS && ATYP !== NOTHING) return false;
                        ${expr.items.map(item => `
                            ${item.kind === 'Field' ? `
                                ${/* Print field label */ ''}
                                ${typeof item.label === 'string' ? '' : `printInferValue(${item.label.name}.infer);`}
        
                                ${/* Print field value */ ''}
                                printInferValue(${item.expression.name}.infer);
                            ` : /* item.kind === 'Splice' */ `
                                ATYP = RECORD_FIELDS;
                                ${item.expression.name}.infer();
                            `}
                        `).join('\n')}
                    },
                },
            `);
            break;
        }

        case 'SelectionExpression': {
            const arity = expr.expressions.length;
            const exprVars = expr.expressions.map(e => e.name);
            for (const mode of ['parse', 'print'] as const) {
                emit.lines(`
                    ${mode}: {
                        full: function SEL() { return ${exprVars.map(n => `${n}()`).join(' || ') || 'false'}; },
                        infer: () => ${arity ? `${exprVars[0]}.infer()` : mode === 'parse' ? '(ATYP = NOTHING)' : '{}'},
                    },
                `);
            }
            break;
        }

        case 'SequenceExpression': {
            const arity = expr.expressions.length;
            const exprVars = expr.expressions.map(e => e.name);
            emit.lines(`
                parse: {
                    full: function SEQ() {
                        const [APOSₒ, CPOSₒ] = [APOS, CPOS];
                        let seqType = ATYP = NOTHING;
                        ${exprVars
                            .map((ev, i) => `
                                if (!${ev}()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                                ${i < arity - 1 ? 'seqType |= ATYP;' : 'ATYP |= seqType;'}
                            `)
                            .join('\n')
                        }
                        return true;
                    },
                    infer: () => {
                        let seqType = ATYP = NOTHING;
                        ${exprVars
                            .map((ev, i) => `
                                ${ev}.infer();
                                ${i < arity - 1 ? 'seqType |= ATYP;' : 'ATYP |= seqType;'}
                            `)
                            .join('\n')
                        }
                    },
                },
                print: {
                    full: function SEQ() {
                        const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
                        ${exprVars.map(ev => `if (!${ev}()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;`).join('\n')}
                        return true;
                    },
                    infer: () => {
                        ${exprVars.map(ev => `${ev}.infer();`).join('\n')}
                    },
                },
            `);
            break;
        }

        case 'StringLiteral': {
            const bytes = [...Buffer.from(expr.value).values()].map(b => `0x${b.toString(16).padStart(2, '0')}`);
            for (const mode of ['parse', 'print'] as const) {
                const hasInput = mode === 'parse' ? expr.subkind !== 'A' : mode === 'print' ? expr.subkind !== 'C' : false;
                const hasOutput = mode === 'parse' ? expr.subkind !== 'C' : mode === 'print' ? expr.subkind !== 'A' : true;
                const [IREP, IPOS] = mode === 'parse' ? ['CREP', 'CPOS'] : ['AREP', 'APOS'];
                emit.down(1).text(`${mode}: {`).indent();
                emit.down(1).text(`full: function STR() {`).indent();
                if (hasInput) {
                    if (mode === 'print') emit.down(1).text(`if (ATYP !== STRING_CHARS) return false;`);
                    emit.down(1).text(`if (${IPOS} + ${bytes.length} > ${IREP}.length) return false;`);
                    for (let i = 0; i < bytes.length; ++i) {
                        emit.down(1).text(`if (${IREP}[${IPOS} + ${i}] !== ${bytes[i]}) return false;`);
                    }
                    emit.down(1).text(`${IPOS} += ${bytes.length};`);
                }
                if (hasOutput) {
                    if (mode === 'parse') {
                        emit.down(1).text(bytes.length === 1 ? `emitByte(${bytes[0]});` : `emitBytes(${bytes.join(', ')});`);
                    }
                    else {
                        for (let i = 0; i < bytes.length; ++i) emit.down(1).text(`CREP[CPOS++] = ${bytes[i]};`);
                    }
                }
                emit.down(1).text(`return true;`);
                emit.dedent().down(1).text('},');
                emit.down(1).text(`infer: function STR() {`).indent();
                if (hasOutput) {
                    if (mode === 'parse') {
                        emit.down(1).text(bytes.length === 1 ? `emitByte(${bytes[0]});` : `emitBytes(${bytes.join(', ')});`);
                    }
                    else {
                        for (let i = 0; i < bytes.length; ++i) emit.down(1).text(`CREP[CPOS++] = ${bytes[i]};`);
                    }
                }
                emit.dedent().down(1).text('},');
                emit.dedent().down(1).text('},');
            }
            emit.down(1).text(`constant: ${JSON.stringify(expr.value)},`);
            break;
        }

        default:
            // TODO: add exhaustiveness check...
            emit.down(1).text(`// NOT HANDLED: ${name}`);
            // TODO: was... restore...
            // throw new Error('Internal Error'); // TODO...
    }
    emit.dedent().down(1).text(`});`);
}
