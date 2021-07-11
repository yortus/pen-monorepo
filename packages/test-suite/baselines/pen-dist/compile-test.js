// ------------------------------ Main exports ------------------------------
module.exports = {
    parse(strOrBuf) { // expects buf to be utf8 encoded
        CREP = Buffer.isBuffer(strOrBuf) ? strOrBuf : Buffer.from(strOrBuf, 'utf8');
        CPOS = 0;
        AREP = [];
        APOS = 0;
        if (!parseInner(parse, false)) throw new Error('parse failed');
        if (CPOS !== CREP.length) throw new Error('parse didn\'t consume entire input');
        return AREP[0];
    },
    print(node, buf) {
        AREP = [node];
        APOS = 0;
        CREP = buf || Buffer.alloc(2 ** 22); // 4MB
        CPOS = 0;
        if (!printInner(print, false)) throw new Error('print failed');
        if (CPOS > CREP.length) throw new Error('output buffer too small');
        return buf ? CPOS : CREP.toString('utf8', 0, CPOS);
    },
};




// ------------------------------ Runtime ------------------------------
"use strict";
function createList(mode, listItems) {
    return createRule(mode, {
        parse: {
            full: function LST() {
                const [APOSₒ, CPOSₒ] = [APOS, CPOS];
                if (APOS === 0)
                    AREP = [];
                for (const listItem of listItems) {
                    if (listItem.kind === 'Element') {
                        if (!parseInner(listItem.expr, true))
                            return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                    }
                    else {
                        if (!listItem.expr())
                            return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                    }
                }
                AW = LIST;
                return true;
            },
            infer: function LST() {
                if (APOS === 0)
                    AREP = [];
                for (const listItem of listItems) {
                    if (listItem.kind === 'Element') {
                        parseInferInner(listItem.expr.infer);
                    }
                    else {
                        listItem.expr.infer();
                    }
                }
                AW = LIST;
            },
        },
        print: {
            full: function LST() {
                if (AR !== LIST)
                    return false;
                const [APOSₒ, CPOSₒ, ARₒ] = [APOS, CPOS, AR];
                for (const listItem of listItems) {
                    if (listItem.kind === 'Element') {
                        if (!printInner(listItem.expr, true))
                            return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                    }
                    else {
                        AR = LIST;
                        if (!listItem.expr())
                            return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                    }
                }
                return true;
            },
            infer: function LST() {
                if (AR !== LIST && AR !== NOTHING)
                    return false;
                for (const listItem of listItems) {
                    if (listItem.kind === 'Element') {
                        printInferInner(listItem.expr.infer);
                    }
                    else {
                        AR = LIST;
                        listItem.expr.infer();
                    }
                }
            },
        },
    });
}
function createRecord(mode, recordItems) {
    return createRule(mode, {
        parse: {
            full: function RCD() {
                const [APOSₒ, CPOSₒ] = [APOS, CPOS];
                if (APOS === 0)
                    AREP = [];
                const fieldLabels = [];
                for (const recordItem of recordItems) {
                    if (recordItem.kind === 'Field') {
                        let fieldLabel;
                        if (typeof recordItem.label === 'string') {
                            fieldLabel = recordItem.label;
                        }
                        else {
                            if (!parseInner(recordItem.label, true))
                                return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                            assert(AW === STRING);
                            APOS -= 1;
                            fieldLabel = AREP[APOS];
                        }
                        if (fieldLabels.includes(fieldLabel))
                            return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                        if (!parseInner(recordItem.expr, true))
                            return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                        const fieldValue = AREP[--APOS];
                        AREP[APOS++] = fieldLabel;
                        AREP[APOS++] = fieldValue;
                        fieldLabels.push(fieldLabel);
                    }
                    else {
                        const apos = APOS;
                        if (!recordItem.expr())
                            return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                        for (let i = apos; i < APOS; i += 2) {
                            const fieldLabel = AREP[i];
                            if (fieldLabels.includes(fieldLabel))
                                return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                            fieldLabels.push(fieldLabel);
                        }
                    }
                }
                AW = RECORD;
                return true;
            },
            infer: function RCD() {
                const APOSₒ = APOS;
                if (APOS === 0)
                    AREP = [];
                const fieldLabels = [];
                for (const recordItem of recordItems) {
                    if (recordItem.kind === 'Field') {
                        let fieldLabel;
                        if (typeof recordItem.label === 'string') {
                            fieldLabel = recordItem.label;
                        }
                        else {
                            parseInferInner(recordItem.label.infer);
                            assert(AW === STRING);
                            APOS -= 1;
                            fieldLabel = AREP[APOS];
                        }
                        if (fieldLabels.includes(fieldLabel))
                            return APOS = APOSₒ, false;
                        parseInferInner(recordItem.expr.infer);
                        const fieldValue = AREP[--APOS];
                        AREP[APOS++] = fieldLabel;
                        AREP[APOS++] = fieldValue;
                        fieldLabels.push(fieldLabel);
                    }
                    else {
                        const apos = APOS;
                        recordItem.expr.infer();
                        for (let i = apos; i < APOS; i += 2) {
                            const fieldLabel = AREP[i];
                            if (fieldLabels.includes(fieldLabel))
                                throw new Error(`duplicate field label`);
                            fieldLabels.push(fieldLabel);
                        }
                    }
                }
                AW = RECORD;
            },
        },
        print: {
            full: function RCD() {
                if (AR !== RECORD)
                    return false;
                const [APOSₒ, CPOSₒ, ARₒ] = [APOS, CPOS, AR];
                const propList = AREP;
                const propCount = AREP.length;
                let bitmask = APOS;
                outerLoop: for (const recordItem of recordItems) {
                    if (recordItem.kind === 'Field') {
                        for (let i = 0; i < propCount; ++i) {
                            let propName = propList[i << 1];
                            const propBit = 1 << i;
                            if ((bitmask & propBit) !== 0)
                                continue;
                            if (typeof recordItem.label !== 'string') {
                                APOS = i << 1;
                                if (!printInner(recordItem.label, true))
                                    continue;
                            }
                            else {
                                if (propName !== recordItem.label)
                                    continue;
                            }
                            APOS = (i << 1) + 1;
                            if (!printInner(recordItem.expr, true))
                                continue;
                            bitmask += propBit;
                            continue outerLoop;
                        }
                        return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                    }
                    else {
                        APOS = bitmask;
                        AR = RECORD;
                        if (!recordItem.expr())
                            return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                        bitmask = APOS;
                    }
                }
                APOS = bitmask;
                return true;
            },
            infer: function RCD() {
                if (AR !== RECORD && AR !== NOTHING)
                    return false;
                for (const recordItem of recordItems) {
                    if (recordItem.kind === 'Field') {
                        if (typeof recordItem.label !== 'string') {
                            printInferInner(recordItem.label.infer);
                        }
                        printInferInner(recordItem.expr.infer);
                    }
                    else {
                        AR = RECORD;
                        recordItem.expr.infer();
                    }
                }
            },
        },
    });
}
function isRule(_x) {
    return true;
}
function isFunc(_x) {
    return true;
}
function isModule(_x) {
    return true;
}
function createRule(mode, impls) {
    if (!impls[mode])
        throw new Error(`${mode} object is missing`);
    if (!impls[mode].full)
        throw new Error(`${mode}._ function is missing`);
    if (!impls[mode].infer)
        throw new Error(`${mode}.infer function is missing`);
    const { full, infer } = impls[mode];
    return Object.assign(full, { infer });
}
let AREP = [];
let APOS = 0;
let AW = 0;
let AR = 0;
let CREP = Buffer.alloc(1);
let CPOS = 0;
const [NOTHING, SCALAR, STRING, LIST, RECORD] = [0, 1, 2, 4, 8];
const theScalarArray = [];
const theBuffer = Buffer.alloc(2 ** 10);
function emitScalar(value) {
    if (APOS === 0)
        AREP = theScalarArray;
    AREP[APOS++] = value;
    AW = SCALAR;
}
function emitByte(value) {
    if (APOS === 0)
        AREP = theBuffer;
    AREP[APOS++] = value;
    AW = STRING;
}
function emitBytes(...values) {
    if (APOS === 0)
        AREP = theBuffer;
    for (let i = 0; i < values.length; ++i)
        AREP[APOS++] = values[i];
    AW = STRING;
}
function parseInner(rule, mustProduce) {
    const [AREPₒ, APOSₒ] = [AREP, APOS];
    AREP = undefined;
    APOS = 0;
    if (!rule())
        return AREP = AREPₒ, APOS = APOSₒ, false;
    if (AW === NOTHING)
        return AREP = AREPₒ, APOS = APOSₒ, !mustProduce;
    let value;
    switch (AW) {
        case SCALAR:
            assert(APOS === 1);
            value = AREP[0];
            break;
        case STRING:
            value = AREP.toString('utf8', 0, APOS);
            break;
        case LIST:
            if (AREP.length !== APOS)
                AREP.length = APOS;
            value = AREP;
            break;
        case RECORD:
            const obj = value = {};
            for (let i = 0; i < APOS; i += 2)
                obj[AREP[i]] = AREP[i + 1];
            break;
        default:
            ((aw) => { throw new Error(`Unhandled abstract type ${aw}`); })(AW);
    }
    AREPₒ[APOSₒ] = value;
    AREP = AREPₒ;
    APOS = APOSₒ + 1;
    return true;
}
function parseInferInner(infer) {
    const [AREPₒ, APOSₒ] = [AREP, APOS];
    AREP = undefined;
    APOS = 0;
    infer();
    if (AW === NOTHING)
        return;
    let value;
    switch (AW) {
        case SCALAR:
            assert(APOS === 1);
            value = AREP[0];
            break;
        case STRING:
            value = AREP.toString('utf8', 0, APOS);
            break;
        case LIST:
            if (AREP.length !== APOS)
                AREP.length = APOS;
            value = AREP;
            break;
        case RECORD:
            const obj = value = {};
            for (let i = 0; i < APOS; i += 2)
                obj[AREP[i]] = AREP[i + 1];
            break;
        default:
            ((aw) => { throw new Error(`Unhandled abstract type ${aw}`); })(AW);
    }
    AREPₒ[APOSₒ] = value;
    AREP = AREPₒ;
    APOS = APOSₒ + 1;
}
function printInner(rule, mustConsume) {
    const [AREPₒ, APOSₒ, ARₒ] = [AREP, APOS, AR];
    let value = AREP[APOS];
    let ar;
    if (value === undefined) {
        if (mustConsume)
            return false;
        AR = NOTHING;
        const result = rule();
        AR = ARₒ;
        assert(APOS === APOSₒ);
        return result;
    }
    if (value === null || value === true || value === false || typeof value === 'number') {
        AR = SCALAR;
        const result = rule();
        AR = ARₒ;
        assert(APOS - APOSₒ === 1);
        return result;
    }
    if (typeof value === 'string') {
        AREP = theBuffer.slice(0, theBuffer.write(value, 0));
        ar = AR = STRING;
    }
    else if (Array.isArray(value)) {
        AREP = value;
        ar = AR = LIST;
    }
    else if (typeof value === 'object') {
        const arr = AREP = [];
        const keys = Object.keys(value);
        assert(keys.length < 32);
        for (let i = 0; i < keys.length; ++i)
            arr.push(keys[i], value[keys[i]]);
        value = arr;
        ar = AR = RECORD;
    }
    else {
        throw new Error(`Unsupported value type for value ${value}`);
    }
    APOS = 0;
    let result = rule();
    const [arep, apos] = [AREP, APOS];
    AREP = AREPₒ, APOS = APOSₒ, AR = ARₒ;
    if (!result)
        return false;
    if (ar === RECORD) {
        const keyCount = value.length >> 1;
        if (keyCount > 0 && (apos !== -1 >>> (32 - keyCount)))
            return false;
    }
    else {
        if (apos !== arep.length)
            return false;
    }
    APOS += 1;
    return true;
}
function printInferInner(infer) {
    const ARₒ = AR;
    AR = NOTHING;
    infer();
    AR = ARₒ;
}
function assert(value) {
    if (!value)
        throw new Error(`Assertion failed`);
}
function lazy(init) {
    let f;
    return Object.assign(function LAZ(arg) {
        try {
            return f(arg);
        }
        catch (err) {
            if (!(err instanceof TypeError) || !err.message.includes('f is not a function'))
                throw err;
            f = init();
            return f(arg);
        }
    }, {
        infer(arg) {
            try {
                return f.infer(arg);
            }
            catch (err) {
                f = init();
                return f.infer(arg);
            }
        }
    });
}




// ------------------------------ Extensions ------------------------------
const extensions = {
};




// ------------------------------ Program ------------------------------
const parse = create('parse');
const print = create('print');
function create(mode) {

    // StringLiteral
    const x = createRule(mode, {
        parse: {
            full: function STR() {
                if (CPOS + 7 > CREP.length) return false;
                if (CREP[CPOS + 0] !== 0x6f) return false;
                if (CREP[CPOS + 1] !== 0x75) return false;
                if (CREP[CPOS + 2] !== 0x74) return false;
                if (CREP[CPOS + 3] !== 0x65) return false;
                if (CREP[CPOS + 4] !== 0x72) return false;
                if (CREP[CPOS + 5] !== 0x20) return false;
                if (CREP[CPOS + 6] !== 0x78) return false;
                CPOS += 7;
                emitBytes(0x6f, 0x75, 0x74, 0x65, 0x72, 0x20, 0x78);
                return true;
            },
            infer: function STR() {
                emitBytes(0x6f, 0x75, 0x74, 0x65, 0x72, 0x20, 0x78);
            },
        },
        print: {
            full: function STR() {
                if (AR !== STRING) return false;
                if (APOS + 7 > AREP.length) return false;
                if (AREP[APOS + 0] !== 0x6f) return false;
                if (AREP[APOS + 1] !== 0x75) return false;
                if (AREP[APOS + 2] !== 0x74) return false;
                if (AREP[APOS + 3] !== 0x65) return false;
                if (AREP[APOS + 4] !== 0x72) return false;
                if (AREP[APOS + 5] !== 0x20) return false;
                if (AREP[APOS + 6] !== 0x78) return false;
                APOS += 7;
                CREP[CPOS++] = 0x6f;
                CREP[CPOS++] = 0x75;
                CREP[CPOS++] = 0x74;
                CREP[CPOS++] = 0x65;
                CREP[CPOS++] = 0x72;
                CREP[CPOS++] = 0x20;
                CREP[CPOS++] = 0x78;
                return true;
            },
            infer: function STR() {
                CREP[CPOS++] = 0x6f;
                CREP[CPOS++] = 0x75;
                CREP[CPOS++] = 0x74;
                CREP[CPOS++] = 0x65;
                CREP[CPOS++] = 0x72;
                CREP[CPOS++] = 0x20;
                CREP[CPOS++] = 0x78;
            },
        },
    });
    x.constant = {value: "outer x"};

    // FunctionExpression
    const REP = (ℙ1) => {

        // MemberExpression
        const a = (arg) => ℙ1("a")(arg);

        // SequenceExpression
        const 𝕊1 = createRule(mode, {
            parse: {
                full: function SEQ() {
                    const [APOSₒ, CPOSₒ] = [APOS, CPOS];
                    let seqType = AW = NOTHING;
                    if (!a()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                    seqType |= AW;
                    if (!x_3()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                    seqType |= AW;
                    if (!a()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                    AW |= seqType;
                    return true;
                },
                infer: () => {
                    let seqType = AW = NOTHING;
                    a.infer();
                    seqType |= AW;
                    x_3.infer();
                    seqType |= AW;
                    a.infer();
                    AW |= seqType;
                },
            },
            print: {
                full: function SEQ() {
                    const [APOSₒ, CPOSₒ, ARₒ] = [APOS, CPOS, AR];
                    if (!a()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                    if (!x_3()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                    if (!a()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                    return true;
                },
                infer: () => {
                    a.infer();
                    x_3.infer();
                    a.infer();
                },
            },
        });

        return 𝕊1;
    };

    // FunctionExpression
    const FUN = (ℙ2) => {

        // FunctionParameter
        const x_2 = global.Object.assign(
            arg => ℙ2(arg),
            {infer: arg => ℙ2.infer(arg)},
        );

        // SequenceExpression
        const 𝕊2 = createRule(mode, {
            parse: {
                full: function SEQ() {
                    const [APOSₒ, CPOSₒ] = [APOS, CPOS];
                    let seqType = AW = NOTHING;
                    if (!x_2()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                    seqType |= AW;
                    if (!x_2()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                    AW |= seqType;
                    return true;
                },
                infer: () => {
                    let seqType = AW = NOTHING;
                    x_2.infer();
                    seqType |= AW;
                    x_2.infer();
                    AW |= seqType;
                },
            },
            print: {
                full: function SEQ() {
                    const [APOSₒ, CPOSₒ, ARₒ] = [APOS, CPOS, AR];
                    if (!x_2()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                    if (!x_2()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                    return true;
                },
                infer: () => {
                    x_2.infer();
                    x_2.infer();
                },
            },
        });

        return 𝕊2;
    };

    // StringLiteral
    const x_3 = createRule(mode, {
        parse: {
            full: function STR() {
                if (CPOS + 7 > CREP.length) return false;
                if (CREP[CPOS + 0] !== 0x69) return false;
                if (CREP[CPOS + 1] !== 0x6e) return false;
                if (CREP[CPOS + 2] !== 0x6e) return false;
                if (CREP[CPOS + 3] !== 0x65) return false;
                if (CREP[CPOS + 4] !== 0x72) return false;
                if (CREP[CPOS + 5] !== 0x20) return false;
                if (CREP[CPOS + 6] !== 0x78) return false;
                CPOS += 7;
                emitBytes(0x69, 0x6e, 0x6e, 0x65, 0x72, 0x20, 0x78);
                return true;
            },
            infer: function STR() {
                emitBytes(0x69, 0x6e, 0x6e, 0x65, 0x72, 0x20, 0x78);
            },
        },
        print: {
            full: function STR() {
                if (AR !== STRING) return false;
                if (APOS + 7 > AREP.length) return false;
                if (AREP[APOS + 0] !== 0x69) return false;
                if (AREP[APOS + 1] !== 0x6e) return false;
                if (AREP[APOS + 2] !== 0x6e) return false;
                if (AREP[APOS + 3] !== 0x65) return false;
                if (AREP[APOS + 4] !== 0x72) return false;
                if (AREP[APOS + 5] !== 0x20) return false;
                if (AREP[APOS + 6] !== 0x78) return false;
                APOS += 7;
                CREP[CPOS++] = 0x69;
                CREP[CPOS++] = 0x6e;
                CREP[CPOS++] = 0x6e;
                CREP[CPOS++] = 0x65;
                CREP[CPOS++] = 0x72;
                CREP[CPOS++] = 0x20;
                CREP[CPOS++] = 0x78;
                return true;
            },
            infer: function STR() {
                CREP[CPOS++] = 0x69;
                CREP[CPOS++] = 0x6e;
                CREP[CPOS++] = 0x6e;
                CREP[CPOS++] = 0x65;
                CREP[CPOS++] = 0x72;
                CREP[CPOS++] = 0x20;
                CREP[CPOS++] = 0x78;
            },
        },
    });
    x_3.constant = {value: "inner x"};

    // NumericLiteral
    const a_2 = createRule(mode, {
        parse: {
            full: () => (emitScalar(42), true),
            infer: () => emitScalar(42),
        },
        print: {
            full: function LIT() {
                if (AR !== SCALAR) return false;
                if (AREP[APOS] !== 42) return false;
                APOS += 1;
                return true;
            },
            infer: () => {},
        },
    });
    a_2.constant = {value: 42};

    // Module
    const nested = (member) => {
        switch (member) {
            case 'REP': return REP;
            case 'FUN': return FUN;
            case 'x': return x_3;
            case 'a': return a_2;
            default: return undefined;
        }
    };

    // StringLiteral
    const lx = createRule(mode, {
        parse: {
            full: function STR() {
                if (CPOS + 7 > CREP.length) return false;
                if (CREP[CPOS + 0] !== 0x69) return false;
                if (CREP[CPOS + 1] !== 0x6e) return false;
                if (CREP[CPOS + 2] !== 0x6e) return false;
                if (CREP[CPOS + 3] !== 0x65) return false;
                if (CREP[CPOS + 4] !== 0x72) return false;
                if (CREP[CPOS + 5] !== 0x20) return false;
                if (CREP[CPOS + 6] !== 0x78) return false;
                CPOS += 7;
                emitBytes(0x69, 0x6e, 0x6e, 0x65, 0x72, 0x20, 0x78);
                return true;
            },
            infer: function STR() {
                emitBytes(0x69, 0x6e, 0x6e, 0x65, 0x72, 0x20, 0x78);
            },
        },
        print: {
            full: function STR() {
                if (AR !== STRING) return false;
                if (APOS + 7 > AREP.length) return false;
                if (AREP[APOS + 0] !== 0x69) return false;
                if (AREP[APOS + 1] !== 0x6e) return false;
                if (AREP[APOS + 2] !== 0x6e) return false;
                if (AREP[APOS + 3] !== 0x65) return false;
                if (AREP[APOS + 4] !== 0x72) return false;
                if (AREP[APOS + 5] !== 0x20) return false;
                if (AREP[APOS + 6] !== 0x78) return false;
                APOS += 7;
                CREP[CPOS++] = 0x69;
                CREP[CPOS++] = 0x6e;
                CREP[CPOS++] = 0x6e;
                CREP[CPOS++] = 0x65;
                CREP[CPOS++] = 0x72;
                CREP[CPOS++] = 0x20;
                CREP[CPOS++] = 0x78;
                return true;
            },
            infer: function STR() {
                CREP[CPOS++] = 0x69;
                CREP[CPOS++] = 0x6e;
                CREP[CPOS++] = 0x6e;
                CREP[CPOS++] = 0x65;
                CREP[CPOS++] = 0x72;
                CREP[CPOS++] = 0x20;
                CREP[CPOS++] = 0x78;
            },
        },
    });
    lx.constant = {value: "inner x"};

    // StringLiteral
    const ly = createRule(mode, {
        parse: {
            full: function STR() {
                if (CPOS + 3 > CREP.length) return false;
                if (CREP[CPOS + 0] !== 0x2a) return false;
                if (CREP[CPOS + 1] !== 0x2a) return false;
                if (CREP[CPOS + 2] !== 0x2a) return false;
                CPOS += 3;
                emitBytes(0x2a, 0x2a, 0x2a);
                return true;
            },
            infer: function STR() {
                emitBytes(0x2a, 0x2a, 0x2a);
            },
        },
        print: {
            full: function STR() {
                if (AR !== STRING) return false;
                if (APOS + 3 > AREP.length) return false;
                if (AREP[APOS + 0] !== 0x2a) return false;
                if (AREP[APOS + 1] !== 0x2a) return false;
                if (AREP[APOS + 2] !== 0x2a) return false;
                APOS += 3;
                CREP[CPOS++] = 0x2a;
                CREP[CPOS++] = 0x2a;
                CREP[CPOS++] = 0x2a;
                return true;
            },
            infer: function STR() {
                CREP[CPOS++] = 0x2a;
                CREP[CPOS++] = 0x2a;
                CREP[CPOS++] = 0x2a;
            },
        },
    });
    ly.constant = {value: "***"};

    // SequenceExpression
    const letexpr = createRule(mode, {
        parse: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ] = [APOS, CPOS];
                let seqType = AW = NOTHING;
                if (!lx()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                seqType |= AW;
                if (!letexpr_sub1()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                seqType |= AW;
                if (!lx()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                AW |= seqType;
                return true;
            },
            infer: () => {
                let seqType = AW = NOTHING;
                lx.infer();
                seqType |= AW;
                letexpr_sub1.infer();
                seqType |= AW;
                lx.infer();
                AW |= seqType;
            },
        },
        print: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ, ARₒ] = [APOS, CPOS, AR];
                if (!lx()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                if (!letexpr_sub1()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                if (!lx()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                return true;
            },
            infer: () => {
                lx.infer();
                letexpr_sub1.infer();
                lx.infer();
            },
        },
    });

    // ByteExpression
    const letexpr_sub1 = createRule(mode, {
        parse: {
            full: function BYT() {
                let cc;
                if (CPOS >= CREP.length) return false;
                cc = CREP[CPOS];
                if (cc !== 0x2d) return false;
                CPOS += 1;
                emitByte(cc);
                return true;
            },
            infer: () => {
                emitByte(0x2d);
            },
        },
        print: {
            full: function BYT() {
                let cc;
                if (AR !== STRING) return false;
                if (APOS >= AREP.length) return false;
                cc = AREP[APOS];
                if (cc !== 0x2d) return false;
                APOS += 1;
                CREP[CPOS++] = cc;
                return true;
            },
            infer: () => {
                CREP[CPOS++] = 0x2d;
            },
        },
    });

    // Identifier
    const a_3 = global.Object.assign(
        arg => x(arg),
        {infer: arg => x.infer(arg)},
    );

    // SelectionExpression
    const start_2 = createRule(mode, {
        parse: {
            full: function SEL() { return start_2_sub1() || letexpr(); },
            infer: () => start_2_sub1.infer(),
        },
        print: {
            full: function SEL() { return start_2_sub1() || letexpr(); },
            infer: () => start_2_sub1.infer(),
        },
    });

    // ApplicationExpression
    const start_2_sub1 = lazy(() => REP(start_2_sub2));

    // Module
    const start_2_sub2 = (member) => {
        switch (member) {
            case 'a': return a_3;
            default: return undefined;
        }
    };

    // Module
    const Ɱ_compile_test = (member) => {
        switch (member) {
            case 'x': return x;
            case 'nested': return nested;
            case 'letexpr': return letexpr;
            case 'start': return start_2;
            default: return undefined;
        }
    };

    return start_2;
}
