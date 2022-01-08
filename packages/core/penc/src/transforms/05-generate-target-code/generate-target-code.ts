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
            parse(stringOrBuffer) {${/* expects buffer to be utf8 encoded */''}
                return parse(parseStartRule, stringOrBuffer);
            },
            print(value, buffer) {
                return print(printStartRule, value, buffer);
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
    emit.down(1).text(`const parseStartRule = createStartRule('parse');`);
    emit.down(1).text(`const printStartRule = createStartRule('print');`);
    emit.down(1).text(`function createStartRule(mode) {`).indent();

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
                    full: () => ${expr.expression.name}.infer(),
                    infer: () => ${expr.expression.name}.infer(),
                },
                print: {
                    full: () => {
                        const OPOINTERₒ = OPOINTER;
                        const result = ${expr.expression.name}();
                        OPOINTER = OPOINTERₒ;
                        return result;
                    },
                    infer: () => true,
                },
            `);
            break;
        }

        case 'BooleanLiteral':
        case 'NullLiteral':
        case 'NumericLiteral': {
            emit.lines(`
                parse: {
                    full: () => {
                        OCONTENT[OPOINTER++] = ${JSON.stringify(expr.value)};
                        DATATYPE |= SCALAR;
                        return true;
                    },
                    infer: () => {
                        OCONTENT[OPOINTER++] = ${JSON.stringify(expr.value)};
                        DATATYPE != SCALAR;
                        return true;
                    },
                },
                print: {
                    full: function LIT() {
                        if (DATATYPE !== SCALAR) return false;
                        if (ICONTENT[IPOINTER] !== ${JSON.stringify(expr.value)}) return false; ${/* TODO: need to ensure IPOINTER<ILEN too, also elsewhere similar... */''}
                        IPOINTER += 1;
                        return true;
                    },
                    infer: () => true,
                },
                constant: ${JSON.stringify(expr.value)},
            `);
            break;
        }

        case 'ByteExpression': {
            for (const mode of ['parse', 'print'] as const) {
                const hasInput = mode === 'parse' ? expr.subkind !== 'A' : mode === 'print' ? expr.subkind !== 'C' : false;
                const hasOutput = mode === 'parse' ? expr.subkind !== 'C' : mode === 'print' ? expr.subkind !== 'A' : true;
                emit.down(1).text(`${mode}: {`).indent();
                emit.down(1).text(`full: function BYT() {`).indent();
                emit.down(1).text(`let cc;`);
                if (hasInput) {
                    if (mode === 'print') emit.down(1).text(`if (DATATYPE !== STRING_CHARS) return false;`);
                    emit.down(1).text(`if (IPOINTER >= ICONTENT.length) return false;`);
                    emit.down(1).text(`cc = ICONTENT[IPOINTER];`);
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
                    emit.down(1).text(`IPOINTER += 1;`);
                }
                else {
                    emit.down(1).text(`cc = 0x${expr.default.toString(16).padStart(2, '0')};`);
                }
                if (hasOutput) {
                    emit.down(1).text(`OCONTENT[OPOINTER++] = cc;`);
                    if (mode === 'parse') emit.down(1).text(`DATATYPE |= STRING_CHARS`);
                }
                emit.down(1).text(`return true;`);
                emit.dedent().down(1).text(`},`);
                if (!hasOutput) {
                    emit.down(1).text(`infer: () => true,`);
                }
                else {
                    emit.down(1).text(`infer: () => {`).indent();
                    emit.down(1).text(`OCONTENT[OPOINTER++] = 0x${expr.default.toString(16).padStart(2, '0')};`);
                    if (mode === 'parse') emit.down(1).text(`DATATYPE |= STRING_CHARS`);
                    emit.down(1).text(`return true;`);
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
                        const OPOINTERₒ = OPOINTER, DATATYPEₒ = DATATYPE;
                        const result = ${expr.expression.name}();
                        OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ;
                        return result;
                    },
                    infer: () => true,
                },
                print: {
                    full: () => ${expr.expression.name}.infer(),
                    infer: () => ${expr.expression.name}.infer(),
                },
            `);
            break;
        }

        case 'ListExpression': {
            emit.lines(`
                parse: {
                    full: function LST() {
                        const IPOINTERₒ = IPOINTER, OPOINTERₒ = OPOINTER, DATATYPEₒ = DATATYPE;
                        ${expr.items
                            .map(item => item.kind === 'Splice'
                                ? `if (!${item.expression.name}()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;`
                                : `if (!parseValue(${item.name})) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;`)
                            .join('\n')
                        }
                        DATATYPE |= LIST_ELEMENTS;
                        return true;
                    },
                    infer: function LST() {
                        ${expr.items
                            .map(item => item.kind === 'Splice'
                                ? `${item.expression.name}.infer();`
                                : `parseValue(${item.name}.infer);`)
                            .join('\n')
                        }
                        DATATYPE |= LIST_ELEMENTS;
                        return true;
                    },
                },
                print: {
                    full: function LST() {
                        if (DATATYPE !== LIST_ELEMENTS) return false;
                        const IPOINTERₒ = IPOINTER, OPOINTERₒ = OPOINTER, DATATYPEₒ = DATATYPE;
                        ${expr.items
                            .map(item => item.kind === 'Splice'
                                ? `if (!${item.expression.name}()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;`
                                : `if (!printValue(${item.name})) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;`)
                            .join('\n')
                        }
                        return true;
                    },
                    infer: function LST() {
                        ${expr.items
                            .map(item => item.kind === 'Splice'
                                ? `${item.expression.name}.infer();`
                                : `${item.name}.infer();`)
                            .join('\n')
                        }
                        return true;
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
                            const IPOINTERₒ = IPOINTER, OPOINTERₒ = OPOINTER, DATATYPEₒ = DATATYPE;
                            const result = !${expr.expression.name}();
                            IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ;
                            return result;
                        },
                        infer: () => true,
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
                    emit.lines(`${expr.expression.name}();`);
                }
                else /* expr.quantifier === '*' */ {
                    emit.down(1).text(`let IPOINTERᐟ = IPOINTER, OPOINTERᐟ = OPOINTER;`);
                    emit.down(1).text(`while (true) {`).indent();
                    emit.down(1).text(`if (!${expr.expression.name}() || IPOINTER <= IPOINTERᐟ) break;`);
                    emit.down(1).text(`IPOINTERᐟ = IPOINTER, OPOINTERᐟ = OPOINTER;`);
                    emit.dedent().down(1).text(`}`);
                    emit.down(1).text(`IPOINTER = IPOINTERᐟ, OPOINTER = OPOINTERᐟ;`);
                }
                emit.down(1).text(`return true;`);
                emit.dedent().down(1).text('},');
                emit.down(1).text(`infer: () => true,`);
                emit.dedent().down(1).text('},');
            }
            break;
        }

        case 'RecordExpression': {
            // TODO: restore the duplication detection logic below (`fieldLabels` checks)
            emit.lines(`
                parse: {
                    full: function RCD() {
                        const IPOINTERₒ = IPOINTER, OPOINTERₒ = OPOINTER, DATATYPEₒ = DATATYPE;
                        ${expr.items.map(item => `
                            ${item.kind === 'Field' ? `
                                ${/* Parse field label */ ''}
                                ${typeof item.label === 'string' ? `
                                    OCONTENT[OPOINTER++] = ${JSON.stringify(item.label)};
                                ` : `
                                    if (!parseValue(${item.label.name})) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
                                    assert(typeof OCONTENT[OPOINTER - 1] === 'string');
                                `}

                                ${/* Parse field value */''}
                                if (!parseValue(${item.expression.name})) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
                            ` : /* item.kind === 'Splice' */ `
                                if (!${item.expression.name}()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
                            `}
                        `).join('\n')}
                        DATATYPE |= RECORD_FIELDS;
                        return true;
                    },
                    infer: function RCD() {
                        const OPOINTERₒ = OPOINTER;
                        ${expr.items.map(item => `
                            ${item.kind === 'Field' ? `
                                ${/* Parse field label */''}
                                ${typeof item.label === 'string' ? `
                                OCONTENT[OPOINTER++] = ${JSON.stringify(item.label)};
                                ` : `
                                    parseValue(${item.label.name}.infer);
                                    assert(typeof OCONTENT[OPOINTER - 1] === 'string');
                                `}

                                ${/* Parse field value */ ''}
                                parseValue(${item.expression.name}.infer);
                            ` : /* item.kind === 'Splice' */ `
                                ${item.expression.name}.infer();
                            `}
                        `).join('\n')}
                        DATATYPE |= RECORD_FIELDS;
                        return true;
                    },
                },
                print: {
                    full: function RCD() {
                        if (DATATYPE !== RECORD_FIELDS) return false;
                        const IPOINTERₒ = IPOINTER, OPOINTERₒ = OPOINTER, DATATYPEₒ = DATATYPE;
                        const propList = ICONTENT;
                        const propCount = ICONTENT.length >> 1;
                        let bitmask = IPOINTER;
                        let i;
                        ${expr.items.map(item => `
                            ${item.kind === 'Field' ? `
                                ${/* Print field label */ ''}
                                ${typeof item.label === 'string' ? `
                                    for (i = 0, IPOINTER = 1; (bitmask & (1 << i)) !== 0 && propList[i << 1] !== ${JSON.stringify(item.label)}; ++i, IPOINTER += 2) ;
                                    if (i >= propCount) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
                                ` : `
                                    for (i = IPOINTER = 0; (bitmask & (1 << i)) !== 0; ++i, IPOINTER += 2) ;
                                    if (i >= propCount || !printValue(${item.label.name})) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
                                `}
        
                                ${/* Print field value */ ''}
                                if (!printValue(${item.expression.name})) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
                                bitmask += (1 << i);
                            ` : /* item.kind === 'Splice' */ `
                                IPOINTER = bitmask;
                                if (!${item.expression.name}()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
                                bitmask = IPOINTER;
                            `}
                        `).join('\n')}
                        IPOINTER = bitmask;
                        return true;
                    },
                    infer: function RCD() {
                        ${expr.items.map(item => `
                            ${item.kind === 'Field' ? `
                                ${/* Print field label */ ''}
                                ${typeof item.label === 'string' ? '' : `${item.label.name}.infer();`}
        
                                ${/* Print field value */ ''}
                                ${item.expression.name}.infer();
                            ` : /* item.kind === 'Splice' */ `
                                ${item.expression.name}.infer();
                            `}
                        `).join('\n')}
                        return true;
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
                        infer: () => ${arity ? `${exprVars[0]}.infer()` : 'true'},
                    },
                `);
            }
            break;
        }

        case 'SequenceExpression': {
            const exprVars = expr.expressions.map(e => e.name);
            for (const mode of ['parse', 'print'] as const) {
                emit.lines(`
                    ${mode}: {
                        full: function SEQ() {
                            const IPOINTERₒ = IPOINTER, OPOINTERₒ = OPOINTER, DATATYPEₒ = DATATYPE;
                            ${exprVars
                                .map(ev => `if (!${ev}()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;`)
                                .join('\n')
                            }
                            return true;
                        },
                        infer: () => {
                            ${exprVars.map(ev => `${ev}.infer();`).join('\n')}
                            return true;
                        },
                    },
                `);
            }
            break;
        }

        case 'StringLiteral': {
            const bytes = [...Buffer.from(expr.value).values()].map(b => `0x${b.toString(16).padStart(2, '0')}`);
            for (const mode of ['parse', 'print'] as const) {
                const hasInput = mode === 'parse' ? expr.subkind !== 'A' : mode === 'print' ? expr.subkind !== 'C' : false;
                const hasOutput = mode === 'parse' ? expr.subkind !== 'C' : mode === 'print' ? expr.subkind !== 'A' : true;
                emit.down(1).text(`${mode}: {`).indent();
                emit.down(1).text(`full: function STR() {`).indent();
                if (hasInput) {
                    if (mode === 'print') emit.down(1).text(`if (DATATYPE !== STRING_CHARS) return false;`);
                    emit.down(1).text(`if (IPOINTER + ${bytes.length} > ICONTENT.length) return false;`);
                    for (let i = 0; i < bytes.length; ++i) {
                        emit.down(1).text(`if (ICONTENT[IPOINTER + ${i}] !== ${bytes[i]}) return false;`);
                    }
                    emit.down(1).text(`IPOINTER += ${bytes.length};`);
                }
                if (hasOutput) {
                    for (const byte of bytes) emit.down(1).text(`OCONTENT[OPOINTER++] = ${byte};`);
                    if (mode === 'parse') emit.down(1).text(`DATATYPE |= STRING_CHARS;`);
                }
                emit.down(1).text(`return true;`);
                emit.dedent().down(1).text('},');
                emit.down(1).text(`infer: function STR() {`).indent();
                if (hasOutput) {
                    for (const byte of bytes) emit.down(1).text(`OCONTENT[OPOINTER++] = ${byte};`);
                    if (mode === 'parse') emit.down(1).text(`DATATYPE |= STRING_CHARS;`);
                }
                emit.down(1).text(`return true;`);
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
