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
        parse: function LST() {
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
        parseDefault: function LST() {
            const APOSₒ = APOS;
            if (APOS === 0)
                AREP = [];
            for (const listItem of listItems) {
                if (listItem.kind === 'Element') {
                    if (!parseInner(listItem.expr.default, true))
                        return APOS = APOSₒ, false;
                }
                else {
                    if (!listItem.expr.default())
                        return APOS = APOSₒ, false;
                }
            }
            AW = LIST;
            return true;
        },
        print: function LST() {
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
        printDefault: function LST() {
            if (AR !== LIST && AR !== NOTHING)
                return false;
            const [APOSₒ, CPOSₒ, ARₒ] = [APOS, CPOS, AR];
            for (const listItem of listItems) {
                if (listItem.kind === 'Element') {
                    if (!printDefaultInner(listItem.expr.default))
                        return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                }
                else {
                    AR = LIST;
                    if (!listItem.expr.default())
                        return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                }
            }
            return true;
        },
    });
}
function createRecord(mode, recordItems) {
    return createRule(mode, {
        parse: function RCD() {
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
        parseDefault: function RCD() {
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
                        if (!parseInner(recordItem.label.default, true))
                            return APOS = APOSₒ, false;
                        assert(AW === STRING);
                        APOS -= 1;
                        fieldLabel = AREP[APOS];
                    }
                    if (fieldLabels.includes(fieldLabel))
                        return APOS = APOSₒ, false;
                    if (!parseInner(recordItem.expr.default, true))
                        return APOS = APOSₒ, false;
                    const fieldValue = AREP[--APOS];
                    AREP[APOS++] = fieldLabel;
                    AREP[APOS++] = fieldValue;
                    fieldLabels.push(fieldLabel);
                }
                else {
                    const apos = APOS;
                    if (!recordItem.expr.default())
                        return APOS = APOSₒ, false;
                    for (let i = apos; i < APOS; i += 2) {
                        const fieldLabel = AREP[i];
                        if (fieldLabels.includes(fieldLabel))
                            return APOS = APOSₒ, false;
                        fieldLabels.push(fieldLabel);
                    }
                }
            }
            AW = RECORD;
            return true;
        },
        print: function RCD() {
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
        printDefault: function RCD() {
            if (AR !== RECORD && AR !== NOTHING)
                return false;
            const [APOSₒ, CPOSₒ, ARₒ] = [APOS, CPOS, AR];
            for (const recordItem of recordItems) {
                if (recordItem.kind === 'Field') {
                    if (typeof recordItem.label !== 'string') {
                        if (!printDefaultInner(recordItem.label))
                            return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                    }
                    if (!printDefaultInner(recordItem.expr))
                        return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                }
                else {
                    AR = RECORD;
                    if (!recordItem.expr())
                        return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                }
            }
            return true;
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
    if (!impls.parse)
        throw new Error(`parse method is missing`);
    if (!impls.parseDefault)
        throw new Error(`parseDefault method is missing`);
    if (!impls.print)
        throw new Error(`print method is missing`);
    if (!impls.printDefault)
        throw new Error(`printDefault method is missing`);
    const impl = mode === 'parse' ? impls.parse : impls.print === 'parse' ? impls.parse : impls.print;
    let dflt = mode === 'parse' ? impls.parseDefault : impls.printDefault;
    if (dflt === 'print')
        dflt = impls.print;
    if (dflt === 'parse')
        dflt = impls.parse;
    return Object.assign(impl, { default: Object.assign(dflt, { default: dflt }) });
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
function printDefaultInner(rule) {
    const ARₒ = AR;
    AR = NOTHING;
    const result = rule();
    AR = ARₒ;
    return result;
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
        default(arg) {
            try {
                return f.default(arg);
            }
            catch (err) {
                f = init();
                return f.default(arg);
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

    // Identifier
    const foo = global.Object.assign(
        arg => f(arg),
        {default: arg => f.default(arg)},
    );

    // Identifier
    const bar = global.Object.assign(
        arg => b_2(arg),
        {default: arg => b_2.default(arg)},
    );

    // Identifier
    const baz = global.Object.assign(
        arg => baz_2(arg),
        {default: arg => baz_2.default(arg)},
    );

    // Identifier
    const start_2 = global.Object.assign(
        arg => result(arg),
        {default: arg => result.default(arg)},
    );

    // ByteExpression
    const digit = createRule(mode, {
        parse: function BYT() {
            let cc;
            if (CPOS >= CREP.length) return false;
            cc = CREP[CPOS];
            if ((cc < 0x30 || cc > 0x39)) return false;
            CPOS += 1;
            emitByte(cc);
            return true;
        },
        parseDefault: function BYT() {
            let cc;
            cc = 0x30;
            emitByte(cc);
            return true;
        },
        print: function BYT() {
            let cc;
            if (AR !== STRING) return false;
            if (APOS >= AREP.length) return false;
            cc = AREP[APOS];
            if ((cc < 0x30 || cc > 0x39)) return false;
            APOS += 1;
            CREP[CPOS++] = cc;
            return true;
        },
        printDefault: function BYT() {
            let cc;
            cc = 0x30;
            CREP[CPOS++] = cc;
            return true;
        },
    });

    // ByteExpression
    const alpha = createRule(mode, {
        parse: function BYT() {
            let cc;
            if (CPOS >= CREP.length) return false;
            cc = CREP[CPOS];
            if ((cc < 0x61 || cc > 0x7a) && (cc < 0x41 || cc > 0x5a)) return false;
            CPOS += 1;
            emitByte(cc);
            return true;
        },
        parseDefault: function BYT() {
            let cc;
            cc = 0x61;
            emitByte(cc);
            return true;
        },
        print: function BYT() {
            let cc;
            if (AR !== STRING) return false;
            if (APOS >= AREP.length) return false;
            cc = AREP[APOS];
            if ((cc < 0x61 || cc > 0x7a) && (cc < 0x41 || cc > 0x5a)) return false;
            APOS += 1;
            CREP[CPOS++] = cc;
            return true;
        },
        printDefault: function BYT() {
            let cc;
            cc = 0x61;
            CREP[CPOS++] = cc;
            return true;
        },
    });

    // SequenceExpression
    const result = createRule(mode, {
        parse: () => {
            const [APOSₒ, CPOSₒ] = [APOS, CPOS];
            let seqType = AW = NOTHING;
            if (!foo()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
            seqType |= AW;
            if (!result_sub1()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
            AW |= seqType;
            return true;
        },
        parseDefault: () => {
            const [APOSₒ, CPOSₒ] = [APOS, CPOS];
            let seqType = AW = NOTHING;
            if (!foo.default()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
            seqType |= AW;
            if (!result_sub1.default()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
            AW |= seqType;
            return true;
        },
        print: () => {
            const [APOSₒ, CPOSₒ, ARₒ] = [APOS, CPOS, AR];
            if (!foo()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
            if (!result_sub1()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
            return true;
        },
        printDefault: () => {
            const [APOSₒ, CPOSₒ, ARₒ] = [APOS, CPOS, AR];
            if (!foo.default()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
            if (!result_sub1.default()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
            return true;
        },
    });

    // SequenceExpression
    const result_sub1 = createRule(mode, {
        parse: () => {
            const [APOSₒ, CPOSₒ] = [APOS, CPOS];
            let seqType = AW = NOTHING;
            if (!bar()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
            seqType |= AW;
            if (!baz()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
            AW |= seqType;
            return true;
        },
        parseDefault: () => {
            const [APOSₒ, CPOSₒ] = [APOS, CPOS];
            let seqType = AW = NOTHING;
            if (!bar.default()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
            seqType |= AW;
            if (!baz.default()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
            AW |= seqType;
            return true;
        },
        print: () => {
            const [APOSₒ, CPOSₒ, ARₒ] = [APOS, CPOS, AR];
            if (!bar()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
            if (!baz()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
            return true;
        },
        printDefault: () => {
            const [APOSₒ, CPOSₒ, ARₒ] = [APOS, CPOS, AR];
            if (!bar.default()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
            if (!baz.default()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
            return true;
        },
    });

    // ListExpression
    const myList = lazy(() => createList(mode, [
        {kind: 'Element', expr: digit},
        {kind: 'Element', expr: myList_sub1},
        {kind: 'Element', expr: myList_sub2},
    ]));

    // SequenceExpression
    const myList_sub1 = createRule(mode, {
        parse: () => {
            const [APOSₒ, CPOSₒ] = [APOS, CPOS];
            let seqType = AW = NOTHING;
            if (!digit()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
            seqType |= AW;
            if (!digit()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
            AW |= seqType;
            return true;
        },
        parseDefault: () => {
            const [APOSₒ, CPOSₒ] = [APOS, CPOS];
            let seqType = AW = NOTHING;
            if (!digit.default()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
            seqType |= AW;
            if (!digit.default()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
            AW |= seqType;
            return true;
        },
        print: () => {
            const [APOSₒ, CPOSₒ, ARₒ] = [APOS, CPOS, AR];
            if (!digit()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
            if (!digit()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
            return true;
        },
        printDefault: () => {
            const [APOSₒ, CPOSₒ, ARₒ] = [APOS, CPOS, AR];
            if (!digit.default()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
            if (!digit.default()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
            return true;
        },
    });

    // SequenceExpression
    const myList_sub2 = createRule(mode, {
        parse: () => {
            const [APOSₒ, CPOSₒ] = [APOS, CPOS];
            let seqType = AW = NOTHING;
            if (!digit()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
            seqType |= AW;
            if (!digit()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
            seqType |= AW;
            if (!digit()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
            AW |= seqType;
            return true;
        },
        parseDefault: () => {
            const [APOSₒ, CPOSₒ] = [APOS, CPOS];
            let seqType = AW = NOTHING;
            if (!digit.default()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
            seqType |= AW;
            if (!digit.default()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
            seqType |= AW;
            if (!digit.default()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
            AW |= seqType;
            return true;
        },
        print: () => {
            const [APOSₒ, CPOSₒ, ARₒ] = [APOS, CPOS, AR];
            if (!digit()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
            if (!digit()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
            if (!digit()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
            return true;
        },
        printDefault: () => {
            const [APOSₒ, CPOSₒ, ARₒ] = [APOS, CPOS, AR];
            if (!digit.default()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
            if (!digit.default()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
            if (!digit.default()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
            return true;
        },
    });

    // StringLiteral
    const b = createRule(mode, {
        parse: function STR() {
            emitBytes(0x62, 0x20, 0x74, 0x68, 0x69, 0x6e, 0x67);
            return true;
        },
        parseDefault: function STR() {
            emitBytes(0x62, 0x20, 0x74, 0x68, 0x69, 0x6e, 0x67);
            return true;
        },
        print: function STR() {
            if (AR !== STRING) return false;
            if (APOS + 7 > AREP.length) return false;
            if (AREP[APOS + 0] !== 0x62) return false;
            if (AREP[APOS + 1] !== 0x20) return false;
            if (AREP[APOS + 2] !== 0x74) return false;
            if (AREP[APOS + 3] !== 0x68) return false;
            if (AREP[APOS + 4] !== 0x69) return false;
            if (AREP[APOS + 5] !== 0x6e) return false;
            if (AREP[APOS + 6] !== 0x67) return false;
            APOS += 7;
            return true;
        },
        printDefault: function STR() {
            CREP[CPOS++] = 0x62;
            CREP[CPOS++] = 0x20;
            CREP[CPOS++] = 0x74;
            CREP[CPOS++] = 0x68;
            CREP[CPOS++] = 0x69;
            CREP[CPOS++] = 0x6e;
            CREP[CPOS++] = 0x67;
            return true;
        },
    });
    b.constant = {value: "b thing"};

    // StringLiteral
    const d = createRule(mode, {
        parse: function STR() {
            emitBytes(0x64, 0x20, 0x74, 0x68, 0x69, 0x6e, 0x67);
            return true;
        },
        parseDefault: function STR() {
            emitBytes(0x64, 0x20, 0x74, 0x68, 0x69, 0x6e, 0x67);
            return true;
        },
        print: function STR() {
            if (AR !== STRING) return false;
            if (APOS + 7 > AREP.length) return false;
            if (AREP[APOS + 0] !== 0x64) return false;
            if (AREP[APOS + 1] !== 0x20) return false;
            if (AREP[APOS + 2] !== 0x74) return false;
            if (AREP[APOS + 3] !== 0x68) return false;
            if (AREP[APOS + 4] !== 0x69) return false;
            if (AREP[APOS + 5] !== 0x6e) return false;
            if (AREP[APOS + 6] !== 0x67) return false;
            APOS += 7;
            return true;
        },
        printDefault: function STR() {
            CREP[CPOS++] = 0x64;
            CREP[CPOS++] = 0x20;
            CREP[CPOS++] = 0x74;
            CREP[CPOS++] = 0x68;
            CREP[CPOS++] = 0x69;
            CREP[CPOS++] = 0x6e;
            CREP[CPOS++] = 0x67;
            return true;
        },
    });
    d.constant = {value: "d thing"};

    // Module
    const rec = (member) => {
        switch (member) {
            case 'b': return b;
            case 'd': return d;
            default: return undefined;
        }
    };

    // Identifier
    const r2 = global.Object.assign(
        arg => rec(arg),
        {default: arg => rec.default(arg)},
    );

    // Identifier
    const r2d = global.Object.assign(
        arg => d(arg),
        {default: arg => d.default(arg)},
    );

    // Module
    const Ɱ_import_graph = (member) => {
        switch (member) {
            case 'foo': return foo;
            case 'bar': return bar;
            case 'baz': return baz;
            case 'start': return start_2;
            case 'digit': return digit;
            case 'alpha': return alpha;
            case 'result': return result;
            case 'myList': return myList;
            case 'rec': return rec;
            case 'r2': return r2;
            case 'r2d': return r2d;
            default: return undefined;
        }
    };

    // StringLiteral
    const f = createRule(mode, {
        parse: function STR() {
            if (CPOS + 3 > CREP.length) return false;
            if (CREP[CPOS + 0] !== 0x66) return false;
            if (CREP[CPOS + 1] !== 0x6f) return false;
            if (CREP[CPOS + 2] !== 0x6f) return false;
            CPOS += 3;
            emitBytes(0x66, 0x6f, 0x6f);
            return true;
        },
        parseDefault: function STR() {
            emitBytes(0x66, 0x6f, 0x6f);
            return true;
        },
        print: function STR() {
            if (AR !== STRING) return false;
            if (APOS + 3 > AREP.length) return false;
            if (AREP[APOS + 0] !== 0x66) return false;
            if (AREP[APOS + 1] !== 0x6f) return false;
            if (AREP[APOS + 2] !== 0x6f) return false;
            APOS += 3;
            CREP[CPOS++] = 0x66;
            CREP[CPOS++] = 0x6f;
            CREP[CPOS++] = 0x6f;
            return true;
        },
        printDefault: function STR() {
            CREP[CPOS++] = 0x66;
            CREP[CPOS++] = 0x6f;
            CREP[CPOS++] = 0x6f;
            return true;
        },
    });
    f.constant = {value: "foo"};

    // StringLiteral
    const b_2 = createRule(mode, {
        parse: function STR() {
            if (CPOS + 3 > CREP.length) return false;
            if (CREP[CPOS + 0] !== 0x62) return false;
            if (CREP[CPOS + 1] !== 0x61) return false;
            if (CREP[CPOS + 2] !== 0x72) return false;
            CPOS += 3;
            emitBytes(0x62, 0x61, 0x72);
            return true;
        },
        parseDefault: function STR() {
            emitBytes(0x62, 0x61, 0x72);
            return true;
        },
        print: function STR() {
            if (AR !== STRING) return false;
            if (APOS + 3 > AREP.length) return false;
            if (AREP[APOS + 0] !== 0x62) return false;
            if (AREP[APOS + 1] !== 0x61) return false;
            if (AREP[APOS + 2] !== 0x72) return false;
            APOS += 3;
            CREP[CPOS++] = 0x62;
            CREP[CPOS++] = 0x61;
            CREP[CPOS++] = 0x72;
            return true;
        },
        printDefault: function STR() {
            CREP[CPOS++] = 0x62;
            CREP[CPOS++] = 0x61;
            CREP[CPOS++] = 0x72;
            return true;
        },
    });
    b_2.constant = {value: "bar"};

    // StringLiteral
    const baz_2 = createRule(mode, {
        parse: function STR() {
            if (CPOS + 3 > CREP.length) return false;
            if (CREP[CPOS + 0] !== 0x62) return false;
            if (CREP[CPOS + 1] !== 0x61) return false;
            if (CREP[CPOS + 2] !== 0x7a) return false;
            CPOS += 3;
            emitBytes(0x62, 0x61, 0x7a);
            return true;
        },
        parseDefault: function STR() {
            emitBytes(0x62, 0x61, 0x7a);
            return true;
        },
        print: function STR() {
            if (AR !== STRING) return false;
            if (APOS + 3 > AREP.length) return false;
            if (AREP[APOS + 0] !== 0x62) return false;
            if (AREP[APOS + 1] !== 0x61) return false;
            if (AREP[APOS + 2] !== 0x7a) return false;
            APOS += 3;
            CREP[CPOS++] = 0x62;
            CREP[CPOS++] = 0x61;
            CREP[CPOS++] = 0x7a;
            return true;
        },
        printDefault: function STR() {
            CREP[CPOS++] = 0x62;
            CREP[CPOS++] = 0x61;
            CREP[CPOS++] = 0x7a;
            return true;
        },
    });
    baz_2.constant = {value: "baz"};

    // Module
    const Ɱ_a = (member) => {
        switch (member) {
            case 'f': return f;
            case 'b': return b_2;
            case 'baz': return baz_2;
            default: return undefined;
        }
    };

    // Module
    const Ɱ_b = (member) => {
        switch (member) {
            default: return undefined;
        }
    };

    // Module
    const Ɱ_c = (member) => {
        switch (member) {
            default: return undefined;
        }
    };

    // Module
    const Ɱ_d = (member) => {
        switch (member) {
            default: return undefined;
        }
    };

    // Identifier
    const util1 = global.Object.assign(
        arg => Ɱ_util1(arg),
        {default: arg => Ɱ_util1.default(arg)},
    );

    // Identifier
    const util2 = global.Object.assign(
        arg => Ɱ_util2(arg),
        {default: arg => Ɱ_util2.default(arg)},
    );

    // Module
    const util = (member) => {
        switch (member) {
            case 'util1': return util1;
            case 'util2': return util2;
            default: return undefined;
        }
    };

    // Module
    const Ɱ_util = (member) => {
        switch (member) {
            case 'util': return util;
            default: return undefined;
        }
    };

    // StringLiteral
    const util1_2 = createRule(mode, {
        parse: function STR() {
            if (CPOS + 5 > CREP.length) return false;
            if (CREP[CPOS + 0] !== 0x75) return false;
            if (CREP[CPOS + 1] !== 0x74) return false;
            if (CREP[CPOS + 2] !== 0x69) return false;
            if (CREP[CPOS + 3] !== 0x6c) return false;
            if (CREP[CPOS + 4] !== 0x31) return false;
            CPOS += 5;
            emitBytes(0x75, 0x74, 0x69, 0x6c, 0x31);
            return true;
        },
        parseDefault: function STR() {
            emitBytes(0x75, 0x74, 0x69, 0x6c, 0x31);
            return true;
        },
        print: function STR() {
            if (AR !== STRING) return false;
            if (APOS + 5 > AREP.length) return false;
            if (AREP[APOS + 0] !== 0x75) return false;
            if (AREP[APOS + 1] !== 0x74) return false;
            if (AREP[APOS + 2] !== 0x69) return false;
            if (AREP[APOS + 3] !== 0x6c) return false;
            if (AREP[APOS + 4] !== 0x31) return false;
            APOS += 5;
            CREP[CPOS++] = 0x75;
            CREP[CPOS++] = 0x74;
            CREP[CPOS++] = 0x69;
            CREP[CPOS++] = 0x6c;
            CREP[CPOS++] = 0x31;
            return true;
        },
        printDefault: function STR() {
            CREP[CPOS++] = 0x75;
            CREP[CPOS++] = 0x74;
            CREP[CPOS++] = 0x69;
            CREP[CPOS++] = 0x6c;
            CREP[CPOS++] = 0x31;
            return true;
        },
    });
    util1_2.constant = {value: "util1"};

    // Module
    const Ɱ_util1 = (member) => {
        switch (member) {
            case 'util1': return util1_2;
            default: return undefined;
        }
    };

    // StringLiteral
    const util2_2 = createRule(mode, {
        parse: function STR() {
            if (CPOS + 5 > CREP.length) return false;
            if (CREP[CPOS + 0] !== 0x75) return false;
            if (CREP[CPOS + 1] !== 0x74) return false;
            if (CREP[CPOS + 2] !== 0x69) return false;
            if (CREP[CPOS + 3] !== 0x6c) return false;
            if (CREP[CPOS + 4] !== 0x32) return false;
            CPOS += 5;
            emitBytes(0x75, 0x74, 0x69, 0x6c, 0x32);
            return true;
        },
        parseDefault: function STR() {
            emitBytes(0x75, 0x74, 0x69, 0x6c, 0x32);
            return true;
        },
        print: function STR() {
            if (AR !== STRING) return false;
            if (APOS + 5 > AREP.length) return false;
            if (AREP[APOS + 0] !== 0x75) return false;
            if (AREP[APOS + 1] !== 0x74) return false;
            if (AREP[APOS + 2] !== 0x69) return false;
            if (AREP[APOS + 3] !== 0x6c) return false;
            if (AREP[APOS + 4] !== 0x32) return false;
            APOS += 5;
            CREP[CPOS++] = 0x75;
            CREP[CPOS++] = 0x74;
            CREP[CPOS++] = 0x69;
            CREP[CPOS++] = 0x6c;
            CREP[CPOS++] = 0x32;
            return true;
        },
        printDefault: function STR() {
            CREP[CPOS++] = 0x75;
            CREP[CPOS++] = 0x74;
            CREP[CPOS++] = 0x69;
            CREP[CPOS++] = 0x6c;
            CREP[CPOS++] = 0x32;
            return true;
        },
    });
    util2_2.constant = {value: "util2"};

    // Module
    const Ɱ_util2 = (member) => {
        switch (member) {
            case 'util2': return util2_2;
            default: return undefined;
        }
    };

    return start_2;
}
