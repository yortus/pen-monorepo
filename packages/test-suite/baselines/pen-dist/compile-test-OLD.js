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
    const start_2 = global.Object.assign(
        arg => foo(arg),
        {default: arg => foo.default(arg)},
    );

    // StringLiteral
    const foo = createRule(mode, {
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
    foo.constant = {value: "foo"};

    // StringLiteral
    const bar = createRule(mode, {
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
    bar.constant = {value: "bar"};

    // Identifier
    const a = global.Object.assign(
        arg => b(arg),
        {default: arg => b.default(arg)},
    );

    // Module
    const expr = (member) => {
        switch (member) {
            case 'foo': return foo;
            case 'bar': return bar;
            case 'a': return a;
            default: return undefined;
        }
    };

    // Identifier
    const a_2 = global.Object.assign(
        arg => b(arg),
        {default: arg => b.default(arg)},
    );

    // StringLiteral
    const b = createRule(mode, {
        parse: function STR() {
            if (CPOS + 2 > CREP.length) return false;
            if (CREP[CPOS + 0] !== 0x62) return false;
            if (CREP[CPOS + 1] !== 0x32) return false;
            CPOS += 2;
            emitBytes(0x62, 0x32);
            return true;
        },
        parseDefault: function STR() {
            emitBytes(0x62, 0x32);
            return true;
        },
        print: function STR() {
            if (AR !== STRING) return false;
            if (APOS + 2 > AREP.length) return false;
            if (AREP[APOS + 0] !== 0x62) return false;
            if (AREP[APOS + 1] !== 0x32) return false;
            APOS += 2;
            CREP[CPOS++] = 0x62;
            CREP[CPOS++] = 0x32;
            return true;
        },
        printDefault: function STR() {
            CREP[CPOS++] = 0x62;
            CREP[CPOS++] = 0x32;
            return true;
        },
    });
    b.constant = {value: "b2"};

    // StringLiteral
    const baz = createRule(mode, {
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
    baz.constant = {value: "baz"};

    // StringLiteral
    const mem = createRule(mode, {
        parse: function STR() {
            if (CPOS + 6 > CREP.length) return false;
            if (CREP[CPOS + 0] !== 0x6d) return false;
            if (CREP[CPOS + 1] !== 0x65) return false;
            if (CREP[CPOS + 2] !== 0x6d) return false;
            if (CREP[CPOS + 3] !== 0x62) return false;
            if (CREP[CPOS + 4] !== 0x65) return false;
            if (CREP[CPOS + 5] !== 0x72) return false;
            CPOS += 6;
            emitBytes(0x6d, 0x65, 0x6d, 0x62, 0x65, 0x72);
            return true;
        },
        parseDefault: function STR() {
            emitBytes(0x6d, 0x65, 0x6d, 0x62, 0x65, 0x72);
            return true;
        },
        print: function STR() {
            if (AR !== STRING) return false;
            if (APOS + 6 > AREP.length) return false;
            if (AREP[APOS + 0] !== 0x6d) return false;
            if (AREP[APOS + 1] !== 0x65) return false;
            if (AREP[APOS + 2] !== 0x6d) return false;
            if (AREP[APOS + 3] !== 0x62) return false;
            if (AREP[APOS + 4] !== 0x65) return false;
            if (AREP[APOS + 5] !== 0x72) return false;
            APOS += 6;
            CREP[CPOS++] = 0x6d;
            CREP[CPOS++] = 0x65;
            CREP[CPOS++] = 0x6d;
            CREP[CPOS++] = 0x62;
            CREP[CPOS++] = 0x65;
            CREP[CPOS++] = 0x72;
            return true;
        },
        printDefault: function STR() {
            CREP[CPOS++] = 0x6d;
            CREP[CPOS++] = 0x65;
            CREP[CPOS++] = 0x6d;
            CREP[CPOS++] = 0x62;
            CREP[CPOS++] = 0x65;
            CREP[CPOS++] = 0x72;
            return true;
        },
    });
    mem.constant = {value: "member"};

    // SelectionExpression
    const modExprMem = createRule(mode, {
        parse: () => {
            if (foo()) return true;
            if (mem()) return true;
            if (baz()) return true;
            return false;
        },
        parseDefault: () => {
            if (foo.default()) return true;
            if (mem.default()) return true;
            if (baz.default()) return true;
            return false;
        },
        print: 'parse',
        printDefault: () => {
            if (foo.default()) return true;
            if (mem.default()) return true;
            if (baz.default()) return true;
            return false;
        },
    });

    // SequenceExpression
    const a_3 = createRule(mode, {
        parse: () => {
            const [APOSₒ, CPOSₒ, AWₒ] = [APOS, CPOS, AW];
            let seqType = NOTHING;
            AW = NOTHING;
            if (!a_3_sub1()) return [APOS, CPOS, AW] = [APOSₒ, CPOSₒ, AWₒ], false;
            seqType |= AW;
            if (!b_2()) return [APOS, CPOS, AW] = [APOSₒ, CPOSₒ, AWₒ], false;
            AW |= seqType;
            return true;
        },
        parseDefault: () => {
            const [APOSₒ, CPOSₒ, AWₒ] = [APOS, CPOS, AW];
            let seqType = NOTHING;
            AW = NOTHING;
            if (!a_3_sub1.default()) return [APOS, CPOS, AW] = [APOSₒ, CPOSₒ, AWₒ], false;
            seqType |= AW;
            if (!b_2.default()) return [APOS, CPOS, AW] = [APOSₒ, CPOSₒ, AWₒ], false;
            AW |= seqType;
            return true;
        },
        print: () => {
            const [APOSₒ, CPOSₒ, ARₒ] = [APOS, CPOS, AR];
            if (!a_3_sub1()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
            if (!b_2()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
            return true;
        },
        printDefault: () => {
            const [APOSₒ, CPOSₒ, ARₒ] = [APOS, CPOS, AR];
            if (!a_3_sub1.default()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
            if (!b_2.default()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
            return true;
        },
    });

    // ByteExpression
    const a_3_sub1 = createRule(mode, {
        parse: function BYT() {
            let cc;
            if (CPOS >= CREP.length) return false;
            cc = CREP[CPOS];
            if (cc !== 0x61) return false;
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
            if (cc !== 0x61) return false;
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

    // Module
    const recA = (member) => {
        switch (member) {
            case 'a': return a_3;
            default: return undefined;
        }
    };

    // SequenceExpression
    const b_2 = createRule(mode, {
        parse: () => {
            const [APOSₒ, CPOSₒ, AWₒ] = [APOS, CPOS, AW];
            let seqType = NOTHING;
            AW = NOTHING;
            if (!b_2_sub1()) return [APOS, CPOS, AW] = [APOSₒ, CPOSₒ, AWₒ], false;
            seqType |= AW;
            if (!a_3()) return [APOS, CPOS, AW] = [APOSₒ, CPOSₒ, AWₒ], false;
            AW |= seqType;
            return true;
        },
        parseDefault: () => {
            const [APOSₒ, CPOSₒ, AWₒ] = [APOS, CPOS, AW];
            let seqType = NOTHING;
            AW = NOTHING;
            if (!b_2_sub1.default()) return [APOS, CPOS, AW] = [APOSₒ, CPOSₒ, AWₒ], false;
            seqType |= AW;
            if (!a_3.default()) return [APOS, CPOS, AW] = [APOSₒ, CPOSₒ, AWₒ], false;
            AW |= seqType;
            return true;
        },
        print: () => {
            const [APOSₒ, CPOSₒ, ARₒ] = [APOS, CPOS, AR];
            if (!b_2_sub1()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
            if (!a_3()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
            return true;
        },
        printDefault: () => {
            const [APOSₒ, CPOSₒ, ARₒ] = [APOS, CPOS, AR];
            if (!b_2_sub1.default()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
            if (!a_3.default()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
            return true;
        },
    });

    // ByteExpression
    const b_2_sub1 = createRule(mode, {
        parse: function BYT() {
            let cc;
            if (CPOS >= CREP.length) return false;
            cc = CREP[CPOS];
            if (cc !== 0x62) return false;
            CPOS += 1;
            emitByte(cc);
            return true;
        },
        parseDefault: function BYT() {
            let cc;
            cc = 0x62;
            emitByte(cc);
            return true;
        },
        print: function BYT() {
            let cc;
            if (AR !== STRING) return false;
            if (APOS >= AREP.length) return false;
            cc = AREP[APOS];
            if (cc !== 0x62) return false;
            APOS += 1;
            CREP[CPOS++] = cc;
            return true;
        },
        printDefault: function BYT() {
            let cc;
            cc = 0x62;
            CREP[CPOS++] = cc;
            return true;
        },
    });

    // Module
    const recB = (member) => {
        switch (member) {
            case 'b': return b_2;
            default: return undefined;
        }
    };

    // Identifier
    const refC = global.Object.assign(
        arg => c1(arg),
        {default: arg => c1.default(arg)},
    );

    // StringLiteral
    const c1 = createRule(mode, {
        parse: function STR() {
            if (CPOS + 2 > CREP.length) return false;
            if (CREP[CPOS + 0] !== 0x63) return false;
            if (CREP[CPOS + 1] !== 0x31) return false;
            CPOS += 2;
            emitBytes(0x63, 0x31);
            return true;
        },
        parseDefault: function STR() {
            emitBytes(0x63, 0x31);
            return true;
        },
        print: function STR() {
            if (AR !== STRING) return false;
            if (APOS + 2 > AREP.length) return false;
            if (AREP[APOS + 0] !== 0x63) return false;
            if (AREP[APOS + 1] !== 0x31) return false;
            APOS += 2;
            CREP[CPOS++] = 0x63;
            CREP[CPOS++] = 0x31;
            return true;
        },
        printDefault: function STR() {
            CREP[CPOS++] = 0x63;
            CREP[CPOS++] = 0x31;
            return true;
        },
    });
    c1.constant = {value: "c1"};

    // StringLiteral
    const c2 = createRule(mode, {
        parse: function STR() {
            if (CPOS + 2 > CREP.length) return false;
            if (CREP[CPOS + 0] !== 0x63) return false;
            if (CREP[CPOS + 1] !== 0x32) return false;
            CPOS += 2;
            emitBytes(0x63, 0x32);
            return true;
        },
        parseDefault: function STR() {
            emitBytes(0x63, 0x32);
            return true;
        },
        print: function STR() {
            if (AR !== STRING) return false;
            if (APOS + 2 > AREP.length) return false;
            if (AREP[APOS + 0] !== 0x63) return false;
            if (AREP[APOS + 1] !== 0x32) return false;
            APOS += 2;
            CREP[CPOS++] = 0x63;
            CREP[CPOS++] = 0x32;
            return true;
        },
        printDefault: function STR() {
            CREP[CPOS++] = 0x63;
            CREP[CPOS++] = 0x32;
            return true;
        },
    });
    c2.constant = {value: "c2"};

    // Identifier
    const ref1 = global.Object.assign(
        arg => c1(arg),
        {default: arg => c1.default(arg)},
    );

    // Identifier
    const ref2 = global.Object.assign(
        arg => c1(arg),
        {default: arg => c1.default(arg)},
    );

    // Identifier
    const ref3 = global.Object.assign(
        arg => c1(arg),
        {default: arg => c1.default(arg)},
    );

    // Module
    const c = (member) => {
        switch (member) {
            case 'c1': return c1;
            case 'c2': return c2;
            case 'ref1': return ref1;
            case 'ref2': return ref2;
            case 'ref3': return ref3;
            default: return undefined;
        }
    };

    // Identifier
    const ref5 = global.Object.assign(
        arg => c1(arg),
        {default: arg => c1.default(arg)},
    );

    // Identifier
    const ref6 = global.Object.assign(
        arg => c1(arg),
        {default: arg => c1.default(arg)},
    );

    // Module
    const defC = (member) => {
        switch (member) {
            case 'c': return c;
            case 'ref5': return ref5;
            case 'ref6': return ref6;
            default: return undefined;
        }
    };

    // Module
    const Ɱ_compile_test_OLD = (member) => {
        switch (member) {
            case 'start': return start_2;
            case 'expr': return expr;
            case 'a': return a_2;
            case 'b': return b;
            case 'baz': return baz;
            case 'modExprMem': return modExprMem;
            case 'recA': return recA;
            case 'recB': return recB;
            case 'refC': return refC;
            case 'defC': return defC;
            default: return undefined;
        }
    };

    return start_2;
}
