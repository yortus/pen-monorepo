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

    // StringLiteral
    const x = createRule(mode, {
        parse: function STR() {
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
        parseDefault: function STR() {
            emitBytes(0x6f, 0x75, 0x74, 0x65, 0x72, 0x20, 0x78);
            return true;
        },
        print: function STR() {
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
        printDefault: function STR() {
            CREP[CPOS++] = 0x6f;
            CREP[CPOS++] = 0x75;
            CREP[CPOS++] = 0x74;
            CREP[CPOS++] = 0x65;
            CREP[CPOS++] = 0x72;
            CREP[CPOS++] = 0x20;
            CREP[CPOS++] = 0x78;
            return true;
        },
    });
    x.constant = {value: "outer x"};

    // FunctionExpression
    const REP = (ℙ1) => {

        // MemberExpression
        const a = (arg) => ℙ1("a")(arg);

        // SequenceExpression
        const 𝕊1 = createRule(mode, {
            parse: () => {
                const [APOSₒ, CPOSₒ, AWₒ] = [APOS, CPOS, AW];
                let seqType = NOTHING;
                AW = NOTHING;
                if (!a()) return [APOS, CPOS, AW] = [APOSₒ, CPOSₒ, AWₒ], false;
                seqType |= AW;
                if (!x_3()) return [APOS, CPOS, AW] = [APOSₒ, CPOSₒ, AWₒ], false;
                seqType |= AW;
                if (!a()) return [APOS, CPOS, AW] = [APOSₒ, CPOSₒ, AWₒ], false;
                AW |= seqType;
                return true;
            },
            parseDefault: () => {
                const [APOSₒ, CPOSₒ, AWₒ] = [APOS, CPOS, AW];
                let seqType = NOTHING;
                AW = NOTHING;
                if (!a.default()) return [APOS, CPOS, AW] = [APOSₒ, CPOSₒ, AWₒ], false;
                seqType |= AW;
                if (!x_3.default()) return [APOS, CPOS, AW] = [APOSₒ, CPOSₒ, AWₒ], false;
                seqType |= AW;
                if (!a.default()) return [APOS, CPOS, AW] = [APOSₒ, CPOSₒ, AWₒ], false;
                AW |= seqType;
                return true;
            },
            print: () => {
                const [APOSₒ, CPOSₒ, ARₒ] = [APOS, CPOS, AR];
                if (!a()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                if (!x_3()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                if (!a()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                return true;
            },
            printDefault: () => {
                const [APOSₒ, CPOSₒ, ARₒ] = [APOS, CPOS, AR];
                if (!a.default()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                if (!x_3.default()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                if (!a.default()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                return true;
            },
        });

        return 𝕊1;
    };

    // FunctionExpression
    const FUN = (ℙ2) => {

        // FunctionParameter
        const x_2 = global.Object.assign(
            arg => ℙ2(arg),
            {default: arg => ℙ2.default(arg)},
        );

        // SequenceExpression
        const 𝕊2 = createRule(mode, {
            parse: () => {
                const [APOSₒ, CPOSₒ, AWₒ] = [APOS, CPOS, AW];
                let seqType = NOTHING;
                AW = NOTHING;
                if (!x_2()) return [APOS, CPOS, AW] = [APOSₒ, CPOSₒ, AWₒ], false;
                seqType |= AW;
                if (!x_2()) return [APOS, CPOS, AW] = [APOSₒ, CPOSₒ, AWₒ], false;
                AW |= seqType;
                return true;
            },
            parseDefault: () => {
                const [APOSₒ, CPOSₒ, AWₒ] = [APOS, CPOS, AW];
                let seqType = NOTHING;
                AW = NOTHING;
                if (!x_2.default()) return [APOS, CPOS, AW] = [APOSₒ, CPOSₒ, AWₒ], false;
                seqType |= AW;
                if (!x_2.default()) return [APOS, CPOS, AW] = [APOSₒ, CPOSₒ, AWₒ], false;
                AW |= seqType;
                return true;
            },
            print: () => {
                const [APOSₒ, CPOSₒ, ARₒ] = [APOS, CPOS, AR];
                if (!x_2()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                if (!x_2()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                return true;
            },
            printDefault: () => {
                const [APOSₒ, CPOSₒ, ARₒ] = [APOS, CPOS, AR];
                if (!x_2.default()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                if (!x_2.default()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                return true;
            },
        });

        return 𝕊2;
    };

    // StringLiteral
    const x_3 = createRule(mode, {
        parse: function STR() {
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
        parseDefault: function STR() {
            emitBytes(0x69, 0x6e, 0x6e, 0x65, 0x72, 0x20, 0x78);
            return true;
        },
        print: function STR() {
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
        printDefault: function STR() {
            CREP[CPOS++] = 0x69;
            CREP[CPOS++] = 0x6e;
            CREP[CPOS++] = 0x6e;
            CREP[CPOS++] = 0x65;
            CREP[CPOS++] = 0x72;
            CREP[CPOS++] = 0x20;
            CREP[CPOS++] = 0x78;
            return true;
        },
    });
    x_3.constant = {value: "inner x"};

    // NumericLiteral
    const a_2 = createRule(mode, {
        parse: function LIT() {
            emitScalar(42);
            return true;
        },
        parseDefault: 'parse',
        print: function LIT() {
            if (AR !== SCALAR) return false;
            if (AREP[APOS] !== 42) return false;
            APOS += 1;
            return true;
        },
        printDefault: function LIT() { return true; },
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
        parse: function STR() {
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
        parseDefault: function STR() {
            emitBytes(0x69, 0x6e, 0x6e, 0x65, 0x72, 0x20, 0x78);
            return true;
        },
        print: function STR() {
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
        printDefault: function STR() {
            CREP[CPOS++] = 0x69;
            CREP[CPOS++] = 0x6e;
            CREP[CPOS++] = 0x6e;
            CREP[CPOS++] = 0x65;
            CREP[CPOS++] = 0x72;
            CREP[CPOS++] = 0x20;
            CREP[CPOS++] = 0x78;
            return true;
        },
    });
    lx.constant = {value: "inner x"};

    // StringLiteral
    const ly = createRule(mode, {
        parse: function STR() {
            if (CPOS + 3 > CREP.length) return false;
            if (CREP[CPOS + 0] !== 0x2a) return false;
            if (CREP[CPOS + 1] !== 0x2a) return false;
            if (CREP[CPOS + 2] !== 0x2a) return false;
            CPOS += 3;
            emitBytes(0x2a, 0x2a, 0x2a);
            return true;
        },
        parseDefault: function STR() {
            emitBytes(0x2a, 0x2a, 0x2a);
            return true;
        },
        print: function STR() {
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
        printDefault: function STR() {
            CREP[CPOS++] = 0x2a;
            CREP[CPOS++] = 0x2a;
            CREP[CPOS++] = 0x2a;
            return true;
        },
    });
    ly.constant = {value: "***"};

    // SequenceExpression
    const letexpr = createRule(mode, {
        parse: () => {
            const [APOSₒ, CPOSₒ, AWₒ] = [APOS, CPOS, AW];
            let seqType = NOTHING;
            AW = NOTHING;
            if (!lx()) return [APOS, CPOS, AW] = [APOSₒ, CPOSₒ, AWₒ], false;
            seqType |= AW;
            if (!letexpr_sub1()) return [APOS, CPOS, AW] = [APOSₒ, CPOSₒ, AWₒ], false;
            seqType |= AW;
            if (!lx()) return [APOS, CPOS, AW] = [APOSₒ, CPOSₒ, AWₒ], false;
            AW |= seqType;
            return true;
        },
        parseDefault: () => {
            const [APOSₒ, CPOSₒ, AWₒ] = [APOS, CPOS, AW];
            let seqType = NOTHING;
            AW = NOTHING;
            if (!lx.default()) return [APOS, CPOS, AW] = [APOSₒ, CPOSₒ, AWₒ], false;
            seqType |= AW;
            if (!letexpr_sub1.default()) return [APOS, CPOS, AW] = [APOSₒ, CPOSₒ, AWₒ], false;
            seqType |= AW;
            if (!lx.default()) return [APOS, CPOS, AW] = [APOSₒ, CPOSₒ, AWₒ], false;
            AW |= seqType;
            return true;
        },
        print: () => {
            const [APOSₒ, CPOSₒ, ARₒ] = [APOS, CPOS, AR];
            if (!lx()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
            if (!letexpr_sub1()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
            if (!lx()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
            return true;
        },
        printDefault: () => {
            const [APOSₒ, CPOSₒ, ARₒ] = [APOS, CPOS, AR];
            if (!lx.default()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
            if (!letexpr_sub1.default()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
            if (!lx.default()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
            return true;
        },
    });

    // ByteExpression
    const letexpr_sub1 = createRule(mode, {
        parse: function BYT() {
            let cc;
            if (CPOS >= CREP.length) return false;
            cc = CREP[CPOS];
            if (cc !== 0x2d) return false;
            CPOS += 1;
            emitByte(cc);
            return true;
        },
        parseDefault: function BYT() {
            let cc;
            cc = 0x2d;
            emitByte(cc);
            return true;
        },
        print: function BYT() {
            let cc;
            if (AR !== STRING) return false;
            if (APOS >= AREP.length) return false;
            cc = AREP[APOS];
            if (cc !== 0x2d) return false;
            APOS += 1;
            CREP[CPOS++] = cc;
            return true;
        },
        printDefault: function BYT() {
            let cc;
            cc = 0x2d;
            CREP[CPOS++] = cc;
            return true;
        },
    });

    // Identifier
    const a_3 = global.Object.assign(
        arg => x(arg),
        {default: arg => x.default(arg)},
    );

    // SelectionExpression
    const start_2 = createRule(mode, {
        parse: () => {
            if (start_2_sub1()) return true;
            if (letexpr()) return true;
            return false;
        },
        parseDefault: () => {
            if (start_2_sub1.default()) return true;
            if (letexpr.default()) return true;
            return false;
        },
        print: 'parse',
        printDefault: () => {
            if (start_2_sub1.default()) return true;
            if (letexpr.default()) return true;
            return false;
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
