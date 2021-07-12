
// ------------------------------ Main exports ------------------------------
module.exports = {
    parse(strOrBuf) {
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
                        if (typeof recordItem.label === 'string') {
                            AREP[APOS++] = recordItem.label;
                        }
                        else {
                            if (!parseInner(recordItem.label, true))
                                return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                            assert(AW === STRING);
                        }
                        if (fieldLabels.includes(AREP[APOS - 1]))
                            return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                        fieldLabels.push(AREP[APOS - 1]);
                        if (!parseInner(recordItem.expr, true))
                            return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
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
                        if (typeof recordItem.label === 'string') {
                            AREP[APOS++] = recordItem.label;
                        }
                        else {
                            parseInferInner(recordItem.label.infer);
                            assert(AW === STRING);
                        }
                        if (fieldLabels.includes(AREP[APOS - 1]))
                            return APOS = APOSₒ, false;
                        fieldLabels.push(AREP[APOS - 1]);
                        parseInferInner(recordItem.expr.infer);
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
                const propCount = AREP.length >> 1;
                let bitmask = APOS;
                let i;
                for (const recordItem of recordItems) {
                    if (recordItem.kind === 'Field') {
                        if (typeof recordItem.label === 'string') {
                            for (i = 0, APOS = 1; (bitmask & (1 << i)) !== 0 && recordItem.label !== propList[i << 1]; ++i, APOS += 2)
                                ;
                            if (i >= propCount)
                                return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                        }
                        else {
                            for (i = APOS = 0; (bitmask & (1 << i)) !== 0; ++i, APOS += 2)
                                ;
                            if (i >= propCount || !printInner(recordItem.label, true))
                                return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                        }
                        if (!printInner(recordItem.expr, true))
                            return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                        bitmask += (1 << i);
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
                        if (typeof recordItem.label !== 'string')
                            printInferInner(recordItem.label.infer);
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
            if (Object.keys(obj).length * 2 < APOS)
                throw new Error(`Duplicate labels in record`);
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
    "V:/projects/oss/pen-monorepo/packages/core/penc/dist/deps/std.pen.js": (() => {
        "use strict";
        /* @pen exports = {
            floatString,
            intString,
            memoise,
        } */
        // TODO: doc... has both 'txt' and 'ast' representation
        // TODO: revise/document range and precision of floats that can be parsed/printed by this rule
        function floatString({ mode }) {
            return createRule(mode, {
                parse: {
                    full: function FSTR() {
                        let num = 0;
                        const [APOSₒ, CPOSₒ] = [APOS, CPOS];
                        const LEN = CREP.length;
                        const EOS = 0;
                        let digitCount = 0;
                        // Parse optional '+' or '-' sign
                        let cc = CREP[CPOS];
                        if (cc === PLUS_SIGN || cc === MINUS_SIGN) {
                            CPOS += 1;
                            cc = CPOS < LEN ? CREP[CPOS] : EOS;
                        }
                        // Parse 0..M digits
                        while (true) {
                            if (cc < ZERO_DIGIT || cc > NINE_DIGIT)
                                break;
                            digitCount += 1;
                            CPOS += 1;
                            cc = CPOS < LEN ? CREP[CPOS] : EOS;
                        }
                        // Parse optional '.'
                        if (cc === DECIMAL_POINT) {
                            CPOS += 1;
                            cc = CPOS < LEN ? CREP[CPOS] : EOS;
                        }
                        // Parse 0..M digits
                        while (true) {
                            if (cc < ZERO_DIGIT || cc > NINE_DIGIT)
                                break;
                            digitCount += 1;
                            CPOS += 1;
                            cc = CPOS < LEN ? CREP[CPOS] : EOS;
                        }
                        // Ensure we have parsed at least one significant digit
                        if (digitCount === 0)
                            return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                        // Parse optional exponent
                        if (cc === UPPERCASE_E || cc === LOWERCASE_E) {
                            CPOS += 1;
                            cc = CPOS < LEN ? CREP[CPOS] : EOS;
                            // Parse optional '+' or '-' sign
                            if (cc === PLUS_SIGN || cc === MINUS_SIGN) {
                                CPOS += 1;
                                cc = CPOS < LEN ? CREP[CPOS] : EOS;
                            }
                            // Parse 1..M digits
                            digitCount = 0;
                            while (true) {
                                if (cc < ZERO_DIGIT || cc > NINE_DIGIT)
                                    break;
                                digitCount += 1;
                                CPOS += 1;
                                cc = CPOS < LEN ? CREP[CPOS] : EOS;
                            }
                            if (digitCount === 0)
                                return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                        }
                        // There is a syntactically valid float. Delegate parsing to the JS runtime.
                        // Reject the number if it parses to Infinity or Nan.
                        // TODO: the conversion may still be lossy. Provide a non-lossy mode, like `safenum` does?
                        num = Number.parseFloat(CREP.toString('utf8', CPOSₒ, CPOS));
                        if (!Number.isFinite(num))
                            return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                        // Success
                        emitScalar(num);
                        return true;
                    },
                    infer: function ISTR() {
                        emitScalar(0);
                    },
                },
                print: {
                    full: function FSTR() {
                        let out = '0';
                        // Ensure N is a number.
                        if (AR !== SCALAR)
                            return false;
                        let num = AREP[APOS];
                        if (typeof num !== 'number')
                            return false;
                        APOS += 1;
                        // Delegate unparsing to the JS runtime.
                        // TODO: the conversion may not exactly match the original string. Add this to the lossiness list.
                        out = String(num);
                        // Success
                        CPOS += CREP.write(out, CPOS, undefined, 'utf8');
                        return true;
                    },
                    infer: function FSTR() {
                        CREP[CPOS++] = ZERO_DIGIT;
                    },
                },
            });
        }
        // These constants are used by the floatString rule.
        const PLUS_SIGN = '+'.charCodeAt(0);
        const MINUS_SIGN = '-'.charCodeAt(0);
        const DECIMAL_POINT = '.'.charCodeAt(0);
        const ZERO_DIGIT = '0'.charCodeAt(0);
        const NINE_DIGIT = '9'.charCodeAt(0);
        const LOWERCASE_E = 'e'.charCodeAt(0);
        const UPPERCASE_E = 'E'.charCodeAt(0);
        // TODO: doc... has both 'txt' and 'ast' representation
        // TODO: revise/document range of ints that can be parsed/printed by this rule
        function intString({ mode }) {
            return function ISTR_function(expr) {
                var _a, _b, _c, _d, _e, _f;
                assert(isModule(expr));
                const base = (_c = (_b = (_a = expr('base')) === null || _a === void 0 ? void 0 : _a.constant) === null || _b === void 0 ? void 0 : _b.value) !== null && _c !== void 0 ? _c : 10;
                const signed = (_f = (_e = (_d = expr('signed')) === null || _d === void 0 ? void 0 : _d.constant) === null || _e === void 0 ? void 0 : _e.value) !== null && _f !== void 0 ? _f : true;
                assert(typeof base === 'number' && base >= 2 && base <= 36);
                assert(typeof signed === 'boolean');
                return createRule(mode, {
                    parse: {
                        full: function ISTR() {
                            let num = 0;
                            const [APOSₒ, CPOSₒ] = [APOS, CPOS];
                            // Parse optional leading '-' sign (if signed)...
                            let MAX_NUM = signed ? 0x7FFFFFFF : 0xFFFFFFFF;
                            let isNegative = false;
                            if (signed && CPOS < CREP.length && CREP[CPOS] === HYPHEN) {
                                isNegative = true;
                                MAX_NUM = 0x80000000;
                                CPOS += 1;
                            }
                            // ...followed by one or more decimal digits. (NB: no exponents).
                            let digits = 0;
                            while (CPOS < CREP.length) {
                                // Read a digit.
                                let c = CREP[CPOS];
                                if (c >= 256)
                                    break;
                                const digitValue = DIGIT_VALUES[c];
                                if (digitValue >= base)
                                    break;
                                // Update parsed number.
                                num *= base;
                                num += digitValue;
                                // Check for overflow.
                                if (num > MAX_NUM)
                                    return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                                // Loop again.
                                CPOS += 1;
                                digits += 1;
                            }
                            // Check that we parsed at least one digit.
                            if (digits === 0)
                                return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                            // Apply the sign.
                            if (isNegative)
                                num = -num;
                            // Success
                            emitScalar(num);
                            return true;
                        },
                        infer: function ISTR() {
                            emitScalar(0);
                        },
                    },
                    print: {
                        full: function ISTR() {
                            const digits = [];
                            if (AR !== SCALAR)
                                return false;
                            let num = AREP[APOS];
                            if (typeof num !== 'number')
                                return false;
                            // Determine the number's sign and ensure it is in range.
                            let isNegative = false;
                            let MAX_NUM = 0x7FFFFFFF;
                            if (num < 0) {
                                if (!signed)
                                    return false;
                                isNegative = true;
                                num = -num;
                                MAX_NUM = 0x80000000;
                            }
                            if (num > MAX_NUM)
                                return false;
                            // Extract the digits.
                            while (true) {
                                const d = num % base;
                                num = (num / base) | 0;
                                digits.push(CHAR_CODES[d]);
                                if (num === 0)
                                    break;
                            }
                            // Compute the final string.
                            APOS += 1;
                            if (isNegative)
                                digits.push(HYPHEN);
                            // Success
                            for (let i = 0; i < digits.length; ++i) {
                                CREP[CPOS++] = digits[i];
                            }
                            return true;
                        },
                        infer: function ISTR() {
                            CREP[CPOS++] = CHAR_CODES[0];
                        },
                    },
                });
            };
        }
        // TODO: doc...
        // use this for bases between 2-36. Get the charCode, ensure < 256, look up DIGIT_VALUES[code], ensure < BASE
        // NB: the number 80 is not special, it's just greater than 36 which makes it a sentinel for 'not a digit'.
        const DIGIT_VALUES = [
            80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80,
            80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80,
            80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80,
            0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 80, 80, 80, 80, 80, 80,
            80, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24,
            25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 80, 80, 80, 80, 80,
            80, 10, 11, 12, 13, 14, 15, 16, 17, 18, 19, 20, 21, 22, 23, 24,
            25, 26, 27, 28, 29, 30, 31, 32, 33, 34, 35, 80, 80, 80, 80, 80,
            80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80,
            80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80,
            80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80,
            80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80,
            80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80,
            80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80,
            80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80,
            80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, // f0-ff
        ];
        // TODO: doc...
        const CHAR_CODES = [
            0x30, 0x31, 0x32, 0x33, 0x34, 0x35, 0x36, 0x37,
            0x38, 0x39, 0x41, 0x42, 0x43, 0x44, 0x45, 0x46,
            0x47, 0x48, 0x49, 0x4a, 0x4b, 0x4c, 0x4d, 0x4e,
            0x4f, 0x50, 0x51, 0x52, 0x53, 0x54, 0x55, 0x56,
            0x57, 0x58, 0x59, 0x5a, // 32-35    WXYZ
        ];
        const HYPHEN = 0x2d;
        function memoise({ mode }) {
            return function MEM_function(expr) {
                // TODO: note this never gets cleared between parse/print calls. Would be ideal to be able to clear it somehow.
                const memos = new Map();
                return createRule(mode, {
                    parse: {
                        full: function MEM() {
                            const APOSₒ = APOS, CPOSₒ = CPOS;
                            // Check whether the memo table already has an entry for the given initial state.
                            let memos2 = memos.get(CREP);
                            if (memos2 === undefined) {
                                memos2 = new Map();
                                memos.set(CREP, memos2);
                            }
                            let memo = memos2.get(CPOS);
                            if (!memo) {
                                // The memo table does *not* have an entry, so this is the first attempt to apply this rule with
                                // this initial state. The first thing we do is create a memo table entry, which is marked as
                                // *unresolved*. All future applications of this rule with the same initial state will find this
                                // memo. If a future application finds the memo still unresolved, then we know we have encountered
                                // left-recursion.
                                memo = { resolved: false, isLeftRecursive: false, result: false, IPOSᐟ: CPOSₒ, OREPᐞ: [], ATYPᐟ: NOTHING };
                                memos2.set(CPOS, memo);
                                // Now that the unresolved memo is in place, apply the rule, and resolve the memo with the result.
                                // At this point, any left-recursive paths encountered during application are guaranteed to have
                                // been noted and aborted (see below).
                                if (expr()) { // TODO: fix cast
                                    memo.result = true;
                                    memo.IPOSᐟ = CPOS;
                                    memo.OREPᐞ = AREP.slice(APOSₒ, APOS);
                                    memo.ATYPᐟ = AW;
                                }
                                memo.resolved = true;
                                // If we did *not* encounter left-recursion, then we have simple memoisation, and the result is
                                // final.
                                if (!memo.isLeftRecursive) {
                                    // No-op. Fall through to exit code.
                                }
                                // If we get here, then the above application of the rule invoked itself left-recursively, but we
                                // aborted the left-recursive paths (see below). That means that the result is either failure, or
                                // success via a non-left-recursive path through the rule. We now iterate, repeatedly re-applying
                                // the same rule with the same initial state. We continue to iterate as long as the application
                                // succeeds and consumes more input than the previous iteration did, in which case we update the
                                // memo with the new result. We thus 'grow' the result, stopping when application either fails or
                                // does not consume more input, at which point we take the result of the previous iteration as
                                // final.
                                while (memo.result === true) {
                                    APOS = APOSₒ, CPOS = CPOSₒ;
                                    // TODO: break cases for UNPARSING:
                                    // anything --> same thing (covers all string cases, since they can only be same or shorter)
                                    // some node --> some different non-empty node (assert: should never happen!)
                                    if (!expr())
                                        break; // TODO: fix cast
                                    if (CPOS <= memo.IPOSᐟ)
                                        break;
                                    // TODO: was for unparse... comment above says should never happen...
                                    // if (!isInputFullyConsumed()) break;
                                    memo.IPOSᐟ = CPOS;
                                    memo.OREPᐞ = AREP.slice(APOSₒ, APOS);
                                    memo.ATYPᐟ = AW;
                                }
                            }
                            else if (!memo.resolved) {
                                // If we get here, then we have already applied the rule with this initial state, but not yet
                                // resolved it. That means we must have entered a left-recursive path of the rule. All we do here is
                                // note that the rule application encountered left-recursion, and return with failure. This means
                                // that the initial application of the rule for this initial state can only possibly succeed along a
                                // non-left-recursive path. More importantly, it means the parser will never loop endlessly on
                                // left-recursive rules.
                                memo.isLeftRecursive = true;
                                return false;
                            }
                            // We have a resolved memo, so the result of the rule application for the given initial state has
                            // already been computed. Return it from the memo.
                            AW = memo.ATYPᐟ;
                            AREP !== null && AREP !== void 0 ? AREP : (AREP = AW === STRING ? theBuffer : []);
                            APOS = APOSₒ;
                            CPOS = memo.IPOSᐟ;
                            for (let i = 0; i < memo.OREPᐞ.length; ++i) {
                                AREP[APOS++] = memo.OREPᐞ[i];
                            }
                            return memo.result;
                        },
                        infer: function MEM() {
                            // TODO: implement...
                            throw new Error('memoise parseDefault: Not implemented');
                        },
                    },
                    print: {
                        full: function MEM() {
                            const [APOSₒ, CPOSₒ] = [APOS, CPOS];
                            // Check whether the memo table already has an entry for the given initial state.
                            let memos2 = memos.get(AREP);
                            if (memos2 === undefined) {
                                memos2 = new Map();
                                memos.set(AREP, memos2);
                            }
                            let memo = memos2.get(APOS);
                            if (!memo) {
                                // The memo table does *not* have an entry, so this is the first attempt to apply this rule with
                                // this initial state. The first thing we do is create a memo table entry, which is marked as
                                // *unresolved*. All future applications of this rule with the same initial state will find this
                                // memo. If a future application finds the memo still unresolved, then we know we have encountered
                                // left-recursion.
                                memo = { resolved: false, isLeftRecursive: false, result: false, IPOSᐟ: APOSₒ, OREPᐞ: [], ATYPᐟ: NOTHING };
                                memos2.set(APOS, memo);
                                // Now that the unresolved memo is in place, apply the rule, and resolve the memo with the result.
                                // At this point, any left-recursive paths encountered during application are guaranteed to have
                                // been noted and aborted (see below).
                                if (expr()) { // TODO: fix cast
                                    memo.result = true;
                                    memo.IPOSᐟ = APOS;
                                    memo.OREPᐞ = Uint8Array.prototype.slice.call(CREP, CPOSₒ, CPOS);
                                    memo.ATYPᐟ = AR;
                                }
                                memo.resolved = true;
                                // If we did *not* encounter left-recursion, then we have simple memoisation, and the result is
                                // final.
                                if (!memo.isLeftRecursive) {
                                    // No-op. Fall through to exit code.
                                }
                                // If we get here, then the above application of the rule invoked itself left-recursively, but we
                                // aborted the left-recursive paths (see below). That means that the result is either failure, or
                                // success via a non-left-recursive path through the rule. We now iterate, repeatedly re-applying
                                // the same rule with the same initial state. We continue to iterate as long as the application
                                // succeeds and consumes more input than the previous iteration did, in which case we update the
                                // memo with the new result. We thus 'grow' the result, stopping when application either fails or
                                // does not consume more input, at which point we take the result of the previous iteration as
                                // final.
                                while (memo.result === true) {
                                    APOS = APOSₒ;
                                    CPOS = CPOSₒ;
                                    // TODO: break cases for UNPARSING:
                                    // anything --> same thing (covers all string cases, since they can only be same or shorter)
                                    // some node --> some different non-empty node (assert: should never happen!)
                                    if (!expr())
                                        break; // TODO: fix cast
                                    if (APOS <= memo.IPOSᐟ)
                                        break;
                                    // TODO: was for unparse... comment above says should never happen...
                                    // if (!isInputFullyConsumed()) break;
                                    memo.IPOSᐟ = APOS;
                                    memo.OREPᐞ = Uint8Array.prototype.slice.call(CREP, CPOSₒ, CPOS);
                                    memo.ATYPᐟ = AR;
                                }
                            }
                            else if (!memo.resolved) {
                                // If we get here, then we have already applied the rule with this initial state, but not yet
                                // resolved it. That means we must have entered a left-recursive path of the rule. All we do here is
                                // note that the rule application encountered left-recursion, and return with failure. This means
                                // that the initial application of the rule for this initial state can only possibly succeed along a
                                // non-left-recursive path. More importantly, it means the parser will never loop endlessly on
                                // left-recursive rules.
                                memo.isLeftRecursive = true;
                                return false;
                            }
                            // We have a resolved memo, so the result of the rule application for the given initial state has
                            // already been computed. Return it from the memo.
                            APOS = memo.IPOSᐟ;
                            CPOS = CPOSₒ;
                            CPOS += memo.OREPᐞ.copy(CREP, CPOS);
                            AR = memo.ATYPᐟ;
                            return memo.result;
                        },
                        infer: function MEM() {
                            // TODO: implement...
                            throw new Error('memoise printDefault: Not implemented');
                        },
                    },
                });
            };
        }
        return {floatString, intString, memoise};
    })(),
    "V:/projects/oss/pen-monorepo/packages/core/penc/dist/deps/experiments.pen.js": (() => {
        "use strict";
        /* @pen exports = {
            unicode
        } */
        // see https://gist.github.com/pascaldekloe/62546103a1576803dade9269ccf76330 for encode/decode algo in js
        function unicode({ mode }) {
            return function UNI_function(expr) {
                var _a, _b, _c, _d, _e, _f;
                assert(isModule(expr));
                const base = (_b = (_a = expr('base')) === null || _a === void 0 ? void 0 : _a.constant) === null || _b === void 0 ? void 0 : _b.value;
                const minDigits = (_d = (_c = expr('minDigits')) === null || _c === void 0 ? void 0 : _c.constant) === null || _d === void 0 ? void 0 : _d.value;
                const maxDigits = (_f = (_e = expr('maxDigits')) === null || _e === void 0 ? void 0 : _e.constant) === null || _f === void 0 ? void 0 : _f.value;
                assert(typeof base === 'number' && base >= 2 && base <= 36);
                assert(typeof minDigits === 'number' && minDigits >= 1 && minDigits <= 8);
                assert(typeof maxDigits === 'number' && maxDigits >= minDigits && maxDigits <= 8);
                // Construct a regex to match the digits
                const pattern = `[0-${base < 10 ? base - 1 : 9}${base > 10 ? `a-${String.fromCharCode('a'.charCodeAt(0) + base - 11)}` : ''}]`;
                const regex = RegExp(pattern, 'i');
                return createRule(mode, {
                    parse: {
                        full: function UNI() {
                            const [APOSₒ, CPOSₒ] = [APOS, CPOS];
                            const LEN = CREP.length;
                            const EOS = '';
                            let len = 0;
                            let num = ''; // TODO: fix this - should actually keep count
                            let c = CPOS < LEN ? String.fromCharCode(CREP[CPOS]) : EOS; // TODO: convoluted - simplify whole method
                            while (true) {
                                if (!regex.test(c))
                                    break;
                                num += c;
                                CPOS += 1;
                                len += 1;
                                if (len === maxDigits)
                                    break;
                                c = CPOS < LEN ? String.fromCharCode(CREP[CPOS]) : EOS;
                            }
                            if (len < minDigits)
                                return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                            // tslint:disable-next-line: no-eval
                            emitBytes(...Buffer.from(eval(`"\\u{${num}}"`)).values()); // TODO: hacky... fix when we have a charCode
                            return true;
                        },
                        infer: function UNI() {
                            // TODO: generate default value...
                            throw new Error('unicode parseDefault: Not implemented');
                        },
                    },
                    print: {
                        full: function UNI() {
                            // TODO: respect VOID AREP/CREP...
                            if (AR !== STRING)
                                return false;
                            const [APOSₒ, CPOSₒ] = [APOS, CPOS];
                            const bytes = AREP;
                            let c = bytes[APOS++];
                            if (c < 128) {
                                // no-op
                            }
                            else if (c > 191 && c < 224) {
                                if (APOS >= bytes.length)
                                    return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                                c = (c & 31) << 6 | bytes[APOS++] & 63;
                            }
                            else if (c > 223 && c < 240) {
                                if (APOS + 1 >= bytes.length)
                                    return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                                c = (c & 15) << 12 | (bytes[APOS++] & 63) << 6 | bytes[APOS++] & 63;
                            }
                            else if (c > 239 && c < 248) {
                                if (APOS + 2 >= bytes.length)
                                    return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                                c = (c & 7) << 18 | (bytes[APOS++] & 63) << 12 | (bytes[APOS++] & 63) << 6 | bytes[APOS++] & 63;
                            }
                            else
                                return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                            const s = c.toString(base).padStart(minDigits, '0');
                            if (s.length > maxDigits)
                                return false;
                            CREP.write(s, CPOS);
                            CPOS += s.length;
                            return true;
                        },
                        infer: function UNI() {
                            // TODO: generate default value...
                            throw new Error('unicode printDefault: Not implemented');
                        },
                    },
                });
            };
        }
        return {unicode};
    })(),
};




// ------------------------------ Program ------------------------------
const parse = create('parse');
const print = create('print');
function create(mode) {

    // Intrinsic
    const floatString_2 = extensions["V:/projects/oss/pen-monorepo/packages/core/penc/dist/deps/std.pen.js"].floatString({mode});
    const intString = extensions["V:/projects/oss/pen-monorepo/packages/core/penc/dist/deps/std.pen.js"].intString({mode});
    const memoise = extensions["V:/projects/oss/pen-monorepo/packages/core/penc/dist/deps/std.pen.js"].memoise({mode});
    const unicode_2 = extensions["V:/projects/oss/pen-monorepo/packages/core/penc/dist/deps/experiments.pen.js"].unicode({mode});

    // Identifier
    const floatString = global.Object.assign(
        arg => floatString_2(arg),
        {infer: arg => floatString_2.infer(arg)},
    );

    // Identifier
    const unicode = global.Object.assign(
        arg => unicode_2(arg),
        {infer: arg => unicode_2.infer(arg)},
    );

    // SequenceExpression
    const start_2 = createRule(mode, {
        parse: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ] = [APOS, CPOS];
                let seqType = AW = NOTHING;
                if (!WS()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                seqType |= AW;
                if (!Value()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                seqType |= AW;
                if (!WS()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                AW |= seqType;
                return true;
            },
            infer: () => {
                let seqType = AW = NOTHING;
                WS.infer();
                seqType |= AW;
                Value.infer();
                seqType |= AW;
                WS.infer();
                AW |= seqType;
            },
        },
        print: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ, ARₒ] = [APOS, CPOS, AR];
                if (!WS()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                if (!Value()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                if (!WS()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                return true;
            },
            infer: () => {
                WS.infer();
                Value.infer();
                WS.infer();
            },
        },
    });

    // SelectionExpression
    const Value = createRule(mode, {
        parse: {
            full: function SEL() { return False() || Null() || True() || Object() || Array() || Number() || String(); },
            infer: () => False.infer(),
        },
        print: {
            full: function SEL() { return False() || Null() || True() || Object() || Array() || Number() || String(); },
            infer: () => False.infer(),
        },
    });

    // SequenceExpression
    const False = createRule(mode, {
        parse: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ] = [APOS, CPOS];
                let seqType = AW = NOTHING;
                if (!False_sub1()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                seqType |= AW;
                if (!False_sub2()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                AW |= seqType;
                return true;
            },
            infer: () => {
                let seqType = AW = NOTHING;
                False_sub1.infer();
                seqType |= AW;
                False_sub2.infer();
                AW |= seqType;
            },
        },
        print: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ, ARₒ] = [APOS, CPOS, AR];
                if (!False_sub1()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                if (!False_sub2()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                return true;
            },
            infer: () => {
                False_sub1.infer();
                False_sub2.infer();
            },
        },
    });

    // StringLiteral
    const False_sub1 = createRule(mode, {
        parse: {
            full: function STR() {
                if (CPOS + 5 > CREP.length) return false;
                if (CREP[CPOS + 0] !== 0x66) return false;
                if (CREP[CPOS + 1] !== 0x61) return false;
                if (CREP[CPOS + 2] !== 0x6c) return false;
                if (CREP[CPOS + 3] !== 0x73) return false;
                if (CREP[CPOS + 4] !== 0x65) return false;
                CPOS += 5;
                return true;
            },
            infer: function STR() {
            },
        },
        print: {
            full: function STR() {
                CREP[CPOS++] = 0x66;
                CREP[CPOS++] = 0x61;
                CREP[CPOS++] = 0x6c;
                CREP[CPOS++] = 0x73;
                CREP[CPOS++] = 0x65;
                return true;
            },
            infer: function STR() {
                CREP[CPOS++] = 0x66;
                CREP[CPOS++] = 0x61;
                CREP[CPOS++] = 0x6c;
                CREP[CPOS++] = 0x73;
                CREP[CPOS++] = 0x65;
            },
        },
    });
    False_sub1.constant = {value: "false"};

    // BooleanLiteral
    const False_sub2 = createRule(mode, {
        parse: {
            full: () => (emitScalar(false), true),
            infer: () => emitScalar(false),
        },
        print: {
            full: function LIT() {
                if (AR !== SCALAR) return false;
                if (AREP[APOS] !== false) return false;
                APOS += 1;
                return true;
            },
            infer: () => {},
        },
    });
    False_sub2.constant = {value: false};

    // SequenceExpression
    const Null = createRule(mode, {
        parse: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ] = [APOS, CPOS];
                let seqType = AW = NOTHING;
                if (!Null_sub1()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                seqType |= AW;
                if (!Null_sub2()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                AW |= seqType;
                return true;
            },
            infer: () => {
                let seqType = AW = NOTHING;
                Null_sub1.infer();
                seqType |= AW;
                Null_sub2.infer();
                AW |= seqType;
            },
        },
        print: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ, ARₒ] = [APOS, CPOS, AR];
                if (!Null_sub1()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                if (!Null_sub2()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                return true;
            },
            infer: () => {
                Null_sub1.infer();
                Null_sub2.infer();
            },
        },
    });

    // StringLiteral
    const Null_sub1 = createRule(mode, {
        parse: {
            full: function STR() {
                if (CPOS + 4 > CREP.length) return false;
                if (CREP[CPOS + 0] !== 0x6e) return false;
                if (CREP[CPOS + 1] !== 0x75) return false;
                if (CREP[CPOS + 2] !== 0x6c) return false;
                if (CREP[CPOS + 3] !== 0x6c) return false;
                CPOS += 4;
                return true;
            },
            infer: function STR() {
            },
        },
        print: {
            full: function STR() {
                CREP[CPOS++] = 0x6e;
                CREP[CPOS++] = 0x75;
                CREP[CPOS++] = 0x6c;
                CREP[CPOS++] = 0x6c;
                return true;
            },
            infer: function STR() {
                CREP[CPOS++] = 0x6e;
                CREP[CPOS++] = 0x75;
                CREP[CPOS++] = 0x6c;
                CREP[CPOS++] = 0x6c;
            },
        },
    });
    Null_sub1.constant = {value: "null"};

    // NullLiteral
    const Null_sub2 = createRule(mode, {
        parse: {
            full: () => (emitScalar(null), true),
            infer: () => emitScalar(null),
        },
        print: {
            full: function LIT() {
                if (AR !== SCALAR) return false;
                if (AREP[APOS] !== null) return false;
                APOS += 1;
                return true;
            },
            infer: () => {},
        },
    });
    Null_sub2.constant = {value: null};

    // SequenceExpression
    const True = createRule(mode, {
        parse: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ] = [APOS, CPOS];
                let seqType = AW = NOTHING;
                if (!True_sub1()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                seqType |= AW;
                if (!True_sub2()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                AW |= seqType;
                return true;
            },
            infer: () => {
                let seqType = AW = NOTHING;
                True_sub1.infer();
                seqType |= AW;
                True_sub2.infer();
                AW |= seqType;
            },
        },
        print: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ, ARₒ] = [APOS, CPOS, AR];
                if (!True_sub1()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                if (!True_sub2()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                return true;
            },
            infer: () => {
                True_sub1.infer();
                True_sub2.infer();
            },
        },
    });

    // StringLiteral
    const True_sub1 = createRule(mode, {
        parse: {
            full: function STR() {
                if (CPOS + 4 > CREP.length) return false;
                if (CREP[CPOS + 0] !== 0x74) return false;
                if (CREP[CPOS + 1] !== 0x72) return false;
                if (CREP[CPOS + 2] !== 0x75) return false;
                if (CREP[CPOS + 3] !== 0x65) return false;
                CPOS += 4;
                return true;
            },
            infer: function STR() {
            },
        },
        print: {
            full: function STR() {
                CREP[CPOS++] = 0x74;
                CREP[CPOS++] = 0x72;
                CREP[CPOS++] = 0x75;
                CREP[CPOS++] = 0x65;
                return true;
            },
            infer: function STR() {
                CREP[CPOS++] = 0x74;
                CREP[CPOS++] = 0x72;
                CREP[CPOS++] = 0x75;
                CREP[CPOS++] = 0x65;
            },
        },
    });
    True_sub1.constant = {value: "true"};

    // BooleanLiteral
    const True_sub2 = createRule(mode, {
        parse: {
            full: () => (emitScalar(true), true),
            infer: () => emitScalar(true),
        },
        print: {
            full: function LIT() {
                if (AR !== SCALAR) return false;
                if (AREP[APOS] !== true) return false;
                APOS += 1;
                return true;
            },
            infer: () => {},
        },
    });
    True_sub2.constant = {value: true};

    // SequenceExpression
    const Object = createRule(mode, {
        parse: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ] = [APOS, CPOS];
                let seqType = AW = NOTHING;
                if (!LBRACE()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                seqType |= AW;
                if (!Object_sub1()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                seqType |= AW;
                if (!RBRACE()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                AW |= seqType;
                return true;
            },
            infer: () => {
                let seqType = AW = NOTHING;
                LBRACE.infer();
                seqType |= AW;
                Object_sub1.infer();
                seqType |= AW;
                RBRACE.infer();
                AW |= seqType;
            },
        },
        print: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ, ARₒ] = [APOS, CPOS, AR];
                if (!LBRACE()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                if (!Object_sub1()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                if (!RBRACE()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                return true;
            },
            infer: () => {
                LBRACE.infer();
                Object_sub1.infer();
                RBRACE.infer();
            },
        },
    });

    // SelectionExpression
    const Object_sub1 = createRule(mode, {
        parse: {
            full: function SEL() { return Object_sub2() || Object_sub9(); },
            infer: () => Object_sub2.infer(),
        },
        print: {
            full: function SEL() { return Object_sub2() || Object_sub9(); },
            infer: () => Object_sub2.infer(),
        },
    });

    // SequenceExpression
    const Object_sub2 = createRule(mode, {
        parse: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ] = [APOS, CPOS];
                let seqType = AW = NOTHING;
                if (!Object_sub3()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                seqType |= AW;
                if (!Object_sub5()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                AW |= seqType;
                return true;
            },
            infer: () => {
                let seqType = AW = NOTHING;
                Object_sub3.infer();
                seqType |= AW;
                Object_sub5.infer();
                AW |= seqType;
            },
        },
        print: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ, ARₒ] = [APOS, CPOS, AR];
                if (!Object_sub3()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                if (!Object_sub5()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                return true;
            },
            infer: () => {
                Object_sub3.infer();
                Object_sub5.infer();
            },
        },
    });

    // RecordExpression
    const Object_sub3 = createRule(mode, {
        parse: {
            full: function RCD() {
                const [APOSₒ, CPOSₒ] = [APOS, CPOS];
                if (APOS === 0) AREP = [];
                if (!parseInner(String, true)) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                assert(AW === STRING);
                if (!parseInner(Object_sub4, true)) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                AW = RECORD;
                return true;
            },
            infer: function RCD() {
                const APOSₒ = APOS;
                if (APOS === 0) AREP = [];
                parseInferInner(String.infer);
                assert(AW === STRING);
                parseInferInner(Object_sub4.infer);
                AW = RECORD;
            },
        },
        print: {
            full: function RCD() {
                if (AR !== RECORD) return false;
                const [APOSₒ, CPOSₒ, ARₒ] = [APOS, CPOS, AR];
                const propList = AREP;
                const propCount = AREP.length >> 1;
                let bitmask = APOS;
                let i;
                for (i = APOS = 0; (bitmask & (1 << i)) !== 0; ++i, APOS += 2) ;
                if (i >= propCount || !printInner(String, true)) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                if (!printInner(Object_sub4, true)) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                bitmask += (1 << i);
                APOS = bitmask;
                return true;
            },
            infer: function RCD() {
                if (AR !== RECORD && AR !== NOTHING) return false;
                printInferInner(String.infer);
                printInferInner(Object_sub4.infer);
            },
        },
    });

    // SequenceExpression
    const Object_sub4 = createRule(mode, {
        parse: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ] = [APOS, CPOS];
                let seqType = AW = NOTHING;
                if (!COLON()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                seqType |= AW;
                if (!Value()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                AW |= seqType;
                return true;
            },
            infer: () => {
                let seqType = AW = NOTHING;
                COLON.infer();
                seqType |= AW;
                Value.infer();
                AW |= seqType;
            },
        },
        print: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ, ARₒ] = [APOS, CPOS, AR];
                if (!COLON()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                if (!Value()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                return true;
            },
            infer: () => {
                COLON.infer();
                Value.infer();
            },
        },
    });

    // QuantifiedExpression
    const Object_sub5 = createRule(mode, {
        parse: {
            full: function QUA() {
                let [CPOSᐟ, APOSᐟ] = [CPOS, APOS];
                let seqType = AW = NOTHING;
                while (true) {
                    if (!Object_sub6() || CPOS <= CPOSᐟ) break;
                    seqType |= AW;
                    CPOSᐟ = CPOS, APOSᐟ = APOS;
                }
                CPOS = CPOSᐟ, APOS = APOSᐟ, AW = seqType;
                return true;
            },
            infer: () => (AW = NOTHING),
        },
        print: {
            full: function QUA() {
                let [APOSᐟ, CPOSᐟ] = [APOS, CPOS];
                while (true) {
                    if (!Object_sub6() || APOS <= APOSᐟ) break;
                    APOSᐟ = APOS, CPOSᐟ = CPOS;
                }
                APOS = APOSᐟ, CPOS = CPOSᐟ;
                return true;
            },
            infer: () => {},
        },
    });

    // RecordExpression
    const Object_sub6 = createRule(mode, {
        parse: {
            full: function RCD() {
                const [APOSₒ, CPOSₒ] = [APOS, CPOS];
                if (APOS === 0) AREP = [];
                if (!parseInner(Object_sub7, true)) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                assert(AW === STRING);
                if (!parseInner(Object_sub8, true)) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                AW = RECORD;
                return true;
            },
            infer: function RCD() {
                const APOSₒ = APOS;
                if (APOS === 0) AREP = [];
                parseInferInner(Object_sub7.infer);
                assert(AW === STRING);
                parseInferInner(Object_sub8.infer);
                AW = RECORD;
            },
        },
        print: {
            full: function RCD() {
                if (AR !== RECORD) return false;
                const [APOSₒ, CPOSₒ, ARₒ] = [APOS, CPOS, AR];
                const propList = AREP;
                const propCount = AREP.length >> 1;
                let bitmask = APOS;
                let i;
                for (i = APOS = 0; (bitmask & (1 << i)) !== 0; ++i, APOS += 2) ;
                if (i >= propCount || !printInner(Object_sub7, true)) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                if (!printInner(Object_sub8, true)) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                bitmask += (1 << i);
                APOS = bitmask;
                return true;
            },
            infer: function RCD() {
                if (AR !== RECORD && AR !== NOTHING) return false;
                printInferInner(Object_sub7.infer);
                printInferInner(Object_sub8.infer);
            },
        },
    });

    // SequenceExpression
    const Object_sub7 = createRule(mode, {
        parse: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ] = [APOS, CPOS];
                let seqType = AW = NOTHING;
                if (!COMMA()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                seqType |= AW;
                if (!String()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                AW |= seqType;
                return true;
            },
            infer: () => {
                let seqType = AW = NOTHING;
                COMMA.infer();
                seqType |= AW;
                String.infer();
                AW |= seqType;
            },
        },
        print: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ, ARₒ] = [APOS, CPOS, AR];
                if (!COMMA()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                if (!String()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                return true;
            },
            infer: () => {
                COMMA.infer();
                String.infer();
            },
        },
    });

    // SequenceExpression
    const Object_sub8 = createRule(mode, {
        parse: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ] = [APOS, CPOS];
                let seqType = AW = NOTHING;
                if (!COLON()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                seqType |= AW;
                if (!Value()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                AW |= seqType;
                return true;
            },
            infer: () => {
                let seqType = AW = NOTHING;
                COLON.infer();
                seqType |= AW;
                Value.infer();
                AW |= seqType;
            },
        },
        print: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ, ARₒ] = [APOS, CPOS, AR];
                if (!COLON()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                if (!Value()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                return true;
            },
            infer: () => {
                COLON.infer();
                Value.infer();
            },
        },
    });

    // RecordExpression
    const Object_sub9 = createRule(mode, {
        parse: {
            full: function RCD() {
                const [APOSₒ, CPOSₒ] = [APOS, CPOS];
                if (APOS === 0) AREP = [];
                AW = RECORD;
                return true;
            },
            infer: function RCD() {
                const APOSₒ = APOS;
                if (APOS === 0) AREP = [];
                AW = RECORD;
            },
        },
        print: {
            full: function RCD() {
                if (AR !== RECORD) return false;
                const [APOSₒ, CPOSₒ, ARₒ] = [APOS, CPOS, AR];
                const propList = AREP;
                const propCount = AREP.length >> 1;
                let bitmask = APOS;
                let i;
                APOS = bitmask;
                return true;
            },
            infer: function RCD() {
                if (AR !== RECORD && AR !== NOTHING) return false;
            },
        },
    });

    // SequenceExpression
    const Object2 = createRule(mode, {
        parse: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ] = [APOS, CPOS];
                let seqType = AW = NOTHING;
                if (!LBRACE()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                seqType |= AW;
                if (!Object2_sub1()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                seqType |= AW;
                if (!RBRACE()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                AW |= seqType;
                return true;
            },
            infer: () => {
                let seqType = AW = NOTHING;
                LBRACE.infer();
                seqType |= AW;
                Object2_sub1.infer();
                seqType |= AW;
                RBRACE.infer();
                AW |= seqType;
            },
        },
        print: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ, ARₒ] = [APOS, CPOS, AR];
                if (!LBRACE()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                if (!Object2_sub1()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                if (!RBRACE()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                return true;
            },
            infer: () => {
                LBRACE.infer();
                Object2_sub1.infer();
                RBRACE.infer();
            },
        },
    });

    // SelectionExpression
    const Object2_sub1 = createRule(mode, {
        parse: {
            full: function SEL() { return Properties() || Object2_sub2(); },
            infer: () => Properties.infer(),
        },
        print: {
            full: function SEL() { return Properties() || Object2_sub2(); },
            infer: () => Properties.infer(),
        },
    });

    // RecordExpression
    const Object2_sub2 = createRule(mode, {
        parse: {
            full: function RCD() {
                const [APOSₒ, CPOSₒ] = [APOS, CPOS];
                if (APOS === 0) AREP = [];
                AW = RECORD;
                return true;
            },
            infer: function RCD() {
                const APOSₒ = APOS;
                if (APOS === 0) AREP = [];
                AW = RECORD;
            },
        },
        print: {
            full: function RCD() {
                if (AR !== RECORD) return false;
                const [APOSₒ, CPOSₒ, ARₒ] = [APOS, CPOS, AR];
                const propList = AREP;
                const propCount = AREP.length >> 1;
                let bitmask = APOS;
                let i;
                APOS = bitmask;
                return true;
            },
            infer: function RCD() {
                if (AR !== RECORD && AR !== NOTHING) return false;
            },
        },
    });

    // RecordExpression
    const Properties = createRule(mode, {
        parse: {
            full: function RCD() {
                const [APOSₒ, CPOSₒ] = [APOS, CPOS];
                if (APOS === 0) AREP = [];
                if (!parseInner(String, true)) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                assert(AW === STRING);
                if (!parseInner(Properties_sub1, true)) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                const apos = APOS;
                if (!Properties_sub2()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                AW = RECORD;
                return true;
            },
            infer: function RCD() {
                const APOSₒ = APOS;
                if (APOS === 0) AREP = [];
                parseInferInner(String.infer);
                assert(AW === STRING);
                parseInferInner(Properties_sub1.infer);
                const apos = APOS;
                Properties_sub2.infer();
                AW = RECORD;
            },
        },
        print: {
            full: function RCD() {
                if (AR !== RECORD) return false;
                const [APOSₒ, CPOSₒ, ARₒ] = [APOS, CPOS, AR];
                const propList = AREP;
                const propCount = AREP.length >> 1;
                let bitmask = APOS;
                let i;
                for (i = APOS = 0; (bitmask & (1 << i)) !== 0; ++i, APOS += 2) ;
                if (i >= propCount || !printInner(String, true)) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                if (!printInner(Properties_sub1, true)) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                bitmask += (1 << i);
                APOS = bitmask;
                AR = RECORD;
                if (!Properties_sub2()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                bitmask = APOS;
                APOS = bitmask;
                return true;
            },
            infer: function RCD() {
                if (AR !== RECORD && AR !== NOTHING) return false;
                printInferInner(String.infer);
                printInferInner(Properties_sub1.infer);
                AR = RECORD;
                Properties_sub2.infer();
            },
        },
    });

    // SequenceExpression
    const Properties_sub1 = createRule(mode, {
        parse: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ] = [APOS, CPOS];
                let seqType = AW = NOTHING;
                if (!COLON()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                seqType |= AW;
                if (!Value()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                AW |= seqType;
                return true;
            },
            infer: () => {
                let seqType = AW = NOTHING;
                COLON.infer();
                seqType |= AW;
                Value.infer();
                AW |= seqType;
            },
        },
        print: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ, ARₒ] = [APOS, CPOS, AR];
                if (!COLON()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                if (!Value()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                return true;
            },
            infer: () => {
                COLON.infer();
                Value.infer();
            },
        },
    });

    // SelectionExpression
    const Properties_sub2 = createRule(mode, {
        parse: {
            full: function SEL() { return Properties_sub3() || Properties_sub4(); },
            infer: () => Properties_sub3.infer(),
        },
        print: {
            full: function SEL() { return Properties_sub3() || Properties_sub4(); },
            infer: () => Properties_sub3.infer(),
        },
    });

    // SequenceExpression
    const Properties_sub3 = createRule(mode, {
        parse: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ] = [APOS, CPOS];
                let seqType = AW = NOTHING;
                if (!COMMA()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                seqType |= AW;
                if (!Properties()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                AW |= seqType;
                return true;
            },
            infer: () => {
                let seqType = AW = NOTHING;
                COMMA.infer();
                seqType |= AW;
                Properties.infer();
                AW |= seqType;
            },
        },
        print: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ, ARₒ] = [APOS, CPOS, AR];
                if (!COMMA()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                if (!Properties()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                return true;
            },
            infer: () => {
                COMMA.infer();
                Properties.infer();
            },
        },
    });

    // RecordExpression
    const Properties_sub4 = createRule(mode, {
        parse: {
            full: function RCD() {
                const [APOSₒ, CPOSₒ] = [APOS, CPOS];
                if (APOS === 0) AREP = [];
                AW = RECORD;
                return true;
            },
            infer: function RCD() {
                const APOSₒ = APOS;
                if (APOS === 0) AREP = [];
                AW = RECORD;
            },
        },
        print: {
            full: function RCD() {
                if (AR !== RECORD) return false;
                const [APOSₒ, CPOSₒ, ARₒ] = [APOS, CPOS, AR];
                const propList = AREP;
                const propCount = AREP.length >> 1;
                let bitmask = APOS;
                let i;
                APOS = bitmask;
                return true;
            },
            infer: function RCD() {
                if (AR !== RECORD && AR !== NOTHING) return false;
            },
        },
    });

    // SequenceExpression
    const Array = createRule(mode, {
        parse: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ] = [APOS, CPOS];
                let seqType = AW = NOTHING;
                if (!LBRACKET()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                seqType |= AW;
                if (!Array_sub1()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                seqType |= AW;
                if (!RBRACKET()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                AW |= seqType;
                return true;
            },
            infer: () => {
                let seqType = AW = NOTHING;
                LBRACKET.infer();
                seqType |= AW;
                Array_sub1.infer();
                seqType |= AW;
                RBRACKET.infer();
                AW |= seqType;
            },
        },
        print: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ, ARₒ] = [APOS, CPOS, AR];
                if (!LBRACKET()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                if (!Array_sub1()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                if (!RBRACKET()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                return true;
            },
            infer: () => {
                LBRACKET.infer();
                Array_sub1.infer();
                RBRACKET.infer();
            },
        },
    });

    // SelectionExpression
    const Array_sub1 = createRule(mode, {
        parse: {
            full: function SEL() { return Array_sub2() || Array_sub7(); },
            infer: () => Array_sub2.infer(),
        },
        print: {
            full: function SEL() { return Array_sub2() || Array_sub7(); },
            infer: () => Array_sub2.infer(),
        },
    });

    // SequenceExpression
    const Array_sub2 = createRule(mode, {
        parse: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ] = [APOS, CPOS];
                let seqType = AW = NOTHING;
                if (!Array_sub3()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                seqType |= AW;
                if (!Array_sub4()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                AW |= seqType;
                return true;
            },
            infer: () => {
                let seqType = AW = NOTHING;
                Array_sub3.infer();
                seqType |= AW;
                Array_sub4.infer();
                AW |= seqType;
            },
        },
        print: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ, ARₒ] = [APOS, CPOS, AR];
                if (!Array_sub3()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                if (!Array_sub4()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                return true;
            },
            infer: () => {
                Array_sub3.infer();
                Array_sub4.infer();
            },
        },
    });

    // ListExpression
    const Array_sub3 = createRule(mode, {
        parse: {
            full: function LST() {
                const [APOSₒ, CPOSₒ] = [APOS, CPOS];
                if (APOS === 0) AREP = [];
                if (!parseInner(Value, true)) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                AW = LIST;
                return true;
            },
            infer: function LST() {
                if (APOS === 0) AREP = [];
                parseInferInner(Value.infer);
                AW = LIST;
            },
        },
        print: {
            full: function LST() {
                if (AR !== LIST) return false;
                const [APOSₒ, CPOSₒ, ARₒ] = [APOS, CPOS, AR];
                if (!printInner(Value, true)) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                return true;
            },
            infer: function LST() {
                if (AR !== LIST && AR !== NOTHING) return false;
                printInferInner(Value.infer);
            },
        },
    });

    // QuantifiedExpression
    const Array_sub4 = createRule(mode, {
        parse: {
            full: function QUA() {
                let [CPOSᐟ, APOSᐟ] = [CPOS, APOS];
                let seqType = AW = NOTHING;
                while (true) {
                    if (!Array_sub5() || CPOS <= CPOSᐟ) break;
                    seqType |= AW;
                    CPOSᐟ = CPOS, APOSᐟ = APOS;
                }
                CPOS = CPOSᐟ, APOS = APOSᐟ, AW = seqType;
                return true;
            },
            infer: () => (AW = NOTHING),
        },
        print: {
            full: function QUA() {
                let [APOSᐟ, CPOSᐟ] = [APOS, CPOS];
                while (true) {
                    if (!Array_sub5() || APOS <= APOSᐟ) break;
                    APOSᐟ = APOS, CPOSᐟ = CPOS;
                }
                APOS = APOSᐟ, CPOS = CPOSᐟ;
                return true;
            },
            infer: () => {},
        },
    });

    // ListExpression
    const Array_sub5 = createRule(mode, {
        parse: {
            full: function LST() {
                const [APOSₒ, CPOSₒ] = [APOS, CPOS];
                if (APOS === 0) AREP = [];
                if (!parseInner(Array_sub6, true)) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                AW = LIST;
                return true;
            },
            infer: function LST() {
                if (APOS === 0) AREP = [];
                parseInferInner(Array_sub6.infer);
                AW = LIST;
            },
        },
        print: {
            full: function LST() {
                if (AR !== LIST) return false;
                const [APOSₒ, CPOSₒ, ARₒ] = [APOS, CPOS, AR];
                if (!printInner(Array_sub6, true)) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                return true;
            },
            infer: function LST() {
                if (AR !== LIST && AR !== NOTHING) return false;
                printInferInner(Array_sub6.infer);
            },
        },
    });

    // SequenceExpression
    const Array_sub6 = createRule(mode, {
        parse: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ] = [APOS, CPOS];
                let seqType = AW = NOTHING;
                if (!COMMA()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                seqType |= AW;
                if (!Value()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                AW |= seqType;
                return true;
            },
            infer: () => {
                let seqType = AW = NOTHING;
                COMMA.infer();
                seqType |= AW;
                Value.infer();
                AW |= seqType;
            },
        },
        print: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ, ARₒ] = [APOS, CPOS, AR];
                if (!COMMA()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                if (!Value()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                return true;
            },
            infer: () => {
                COMMA.infer();
                Value.infer();
            },
        },
    });

    // ListExpression
    const Array_sub7 = createRule(mode, {
        parse: {
            full: function LST() {
                const [APOSₒ, CPOSₒ] = [APOS, CPOS];
                if (APOS === 0) AREP = [];
                AW = LIST;
                return true;
            },
            infer: function LST() {
                if (APOS === 0) AREP = [];
                AW = LIST;
            },
        },
        print: {
            full: function LST() {
                if (AR !== LIST) return false;
                const [APOSₒ, CPOSₒ, ARₒ] = [APOS, CPOS, AR];
                return true;
            },
            infer: function LST() {
                if (AR !== LIST && AR !== NOTHING) return false;
            },
        },
    });

    // SequenceExpression
    const Array2 = createRule(mode, {
        parse: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ] = [APOS, CPOS];
                let seqType = AW = NOTHING;
                if (!LBRACKET()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                seqType |= AW;
                if (!Array2_sub1()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                seqType |= AW;
                if (!RBRACKET()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                AW |= seqType;
                return true;
            },
            infer: () => {
                let seqType = AW = NOTHING;
                LBRACKET.infer();
                seqType |= AW;
                Array2_sub1.infer();
                seqType |= AW;
                RBRACKET.infer();
                AW |= seqType;
            },
        },
        print: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ, ARₒ] = [APOS, CPOS, AR];
                if (!LBRACKET()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                if (!Array2_sub1()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                if (!RBRACKET()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                return true;
            },
            infer: () => {
                LBRACKET.infer();
                Array2_sub1.infer();
                RBRACKET.infer();
            },
        },
    });

    // SelectionExpression
    const Array2_sub1 = createRule(mode, {
        parse: {
            full: function SEL() { return Elements() || Array2_sub2(); },
            infer: () => Elements.infer(),
        },
        print: {
            full: function SEL() { return Elements() || Array2_sub2(); },
            infer: () => Elements.infer(),
        },
    });

    // ListExpression
    const Array2_sub2 = createRule(mode, {
        parse: {
            full: function LST() {
                const [APOSₒ, CPOSₒ] = [APOS, CPOS];
                if (APOS === 0) AREP = [];
                AW = LIST;
                return true;
            },
            infer: function LST() {
                if (APOS === 0) AREP = [];
                AW = LIST;
            },
        },
        print: {
            full: function LST() {
                if (AR !== LIST) return false;
                const [APOSₒ, CPOSₒ, ARₒ] = [APOS, CPOS, AR];
                return true;
            },
            infer: function LST() {
                if (AR !== LIST && AR !== NOTHING) return false;
            },
        },
    });

    // ListExpression
    const Elements = createRule(mode, {
        parse: {
            full: function LST() {
                const [APOSₒ, CPOSₒ] = [APOS, CPOS];
                if (APOS === 0) AREP = [];
                if (!parseInner(Value, true)) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                if (!Elements_sub1()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                AW = LIST;
                return true;
            },
            infer: function LST() {
                if (APOS === 0) AREP = [];
                parseInferInner(Value.infer);
                Elements_sub1.infer();
                AW = LIST;
            },
        },
        print: {
            full: function LST() {
                if (AR !== LIST) return false;
                const [APOSₒ, CPOSₒ, ARₒ] = [APOS, CPOS, AR];
                if (!printInner(Value, true)) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                AR = LIST;
                if (!Elements_sub1()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                return true;
            },
            infer: function LST() {
                if (AR !== LIST && AR !== NOTHING) return false;
                printInferInner(Value.infer);
                AR = LIST;
                Elements_sub1.infer();
            },
        },
    });

    // SelectionExpression
    const Elements_sub1 = createRule(mode, {
        parse: {
            full: function SEL() { return Elements_sub2() || Elements_sub3(); },
            infer: () => Elements_sub2.infer(),
        },
        print: {
            full: function SEL() { return Elements_sub2() || Elements_sub3(); },
            infer: () => Elements_sub2.infer(),
        },
    });

    // SequenceExpression
    const Elements_sub2 = createRule(mode, {
        parse: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ] = [APOS, CPOS];
                let seqType = AW = NOTHING;
                if (!COMMA()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                seqType |= AW;
                if (!Elements()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                AW |= seqType;
                return true;
            },
            infer: () => {
                let seqType = AW = NOTHING;
                COMMA.infer();
                seqType |= AW;
                Elements.infer();
                AW |= seqType;
            },
        },
        print: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ, ARₒ] = [APOS, CPOS, AR];
                if (!COMMA()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                if (!Elements()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                return true;
            },
            infer: () => {
                COMMA.infer();
                Elements.infer();
            },
        },
    });

    // ListExpression
    const Elements_sub3 = createRule(mode, {
        parse: {
            full: function LST() {
                const [APOSₒ, CPOSₒ] = [APOS, CPOS];
                if (APOS === 0) AREP = [];
                AW = LIST;
                return true;
            },
            infer: function LST() {
                if (APOS === 0) AREP = [];
                AW = LIST;
            },
        },
        print: {
            full: function LST() {
                if (AR !== LIST) return false;
                const [APOSₒ, CPOSₒ, ARₒ] = [APOS, CPOS, AR];
                return true;
            },
            infer: function LST() {
                if (AR !== LIST && AR !== NOTHING) return false;
            },
        },
    });

    // Identifier
    const Number = global.Object.assign(
        arg => floatString(arg),
        {infer: arg => floatString.infer(arg)},
    );

    // SequenceExpression
    const String = createRule(mode, {
        parse: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ] = [APOS, CPOS];
                let seqType = AW = NOTHING;
                if (!DOUBLE_QUOTE()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                seqType |= AW;
                if (!String_sub1()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                seqType |= AW;
                if (!DOUBLE_QUOTE()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                AW |= seqType;
                return true;
            },
            infer: () => {
                let seqType = AW = NOTHING;
                DOUBLE_QUOTE.infer();
                seqType |= AW;
                String_sub1.infer();
                seqType |= AW;
                DOUBLE_QUOTE.infer();
                AW |= seqType;
            },
        },
        print: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ, ARₒ] = [APOS, CPOS, AR];
                if (!DOUBLE_QUOTE()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                if (!String_sub1()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                if (!DOUBLE_QUOTE()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                return true;
            },
            infer: () => {
                DOUBLE_QUOTE.infer();
                String_sub1.infer();
                DOUBLE_QUOTE.infer();
            },
        },
    });

    // QuantifiedExpression
    const String_sub1 = createRule(mode, {
        parse: {
            full: function QUA() {
                let [CPOSᐟ, APOSᐟ] = [CPOS, APOS];
                let seqType = AW = NOTHING;
                while (true) {
                    if (!CHAR() || CPOS <= CPOSᐟ) break;
                    seqType |= AW;
                    CPOSᐟ = CPOS, APOSᐟ = APOS;
                }
                CPOS = CPOSᐟ, APOS = APOSᐟ, AW = seqType;
                return true;
            },
            infer: () => (AW = NOTHING),
        },
        print: {
            full: function QUA() {
                let [APOSᐟ, CPOSᐟ] = [APOS, CPOS];
                while (true) {
                    if (!CHAR() || APOS <= APOSᐟ) break;
                    APOSᐟ = APOS, CPOSᐟ = CPOS;
                }
                APOS = APOSᐟ, CPOS = CPOSᐟ;
                return true;
            },
            infer: () => {},
        },
    });

    // NumericLiteral
    const base = createRule(mode, {
        parse: {
            full: () => (emitScalar(16), true),
            infer: () => emitScalar(16),
        },
        print: {
            full: function LIT() {
                if (AR !== SCALAR) return false;
                if (AREP[APOS] !== 16) return false;
                APOS += 1;
                return true;
            },
            infer: () => {},
        },
    });
    base.constant = {value: 16};

    // NumericLiteral
    const minDigits = createRule(mode, {
        parse: {
            full: () => (emitScalar(4), true),
            infer: () => emitScalar(4),
        },
        print: {
            full: function LIT() {
                if (AR !== SCALAR) return false;
                if (AREP[APOS] !== 4) return false;
                APOS += 1;
                return true;
            },
            infer: () => {},
        },
    });
    minDigits.constant = {value: 4};

    // NumericLiteral
    const maxDigits = createRule(mode, {
        parse: {
            full: () => (emitScalar(4), true),
            infer: () => emitScalar(4),
        },
        print: {
            full: function LIT() {
                if (AR !== SCALAR) return false;
                if (AREP[APOS] !== 4) return false;
                APOS += 1;
                return true;
            },
            infer: () => {},
        },
    });
    maxDigits.constant = {value: 4};

    // SelectionExpression
    const CHAR = createRule(mode, {
        parse: {
            full: function SEL() { return CHAR_sub1() || CHAR_sub2() || CHAR_sub5() || CHAR_sub9() || CHAR_sub14() || CHAR_sub17() || CHAR_sub20() || CHAR_sub23() || CHAR_sub26() || CHAR_sub29() || CHAR_sub32() || CHAR_sub35() || CHAR_sub38(); },
            infer: () => CHAR_sub1.infer(),
        },
        print: {
            full: function SEL() { return CHAR_sub1() || CHAR_sub2() || CHAR_sub5() || CHAR_sub9() || CHAR_sub14() || CHAR_sub17() || CHAR_sub20() || CHAR_sub23() || CHAR_sub26() || CHAR_sub29() || CHAR_sub32() || CHAR_sub35() || CHAR_sub38(); },
            infer: () => CHAR_sub1.infer(),
        },
    });

    // ByteExpression
    const CHAR_sub1 = createRule(mode, {
        parse: {
            full: function BYT() {
                let cc;
                if (CPOS >= CREP.length) return false;
                cc = CREP[CPOS];
                if (cc === 0x5c) return false;
                if (cc === 0x22) return false;
                if ((cc < 0x20 || cc > 0x7f)) return false;
                CPOS += 1;
                emitByte(cc);
                return true;
            },
            infer: () => {
                emitByte(0x20);
            },
        },
        print: {
            full: function BYT() {
                let cc;
                if (AR !== STRING) return false;
                if (APOS >= AREP.length) return false;
                cc = AREP[APOS];
                if (cc === 0x5c) return false;
                if (cc === 0x22) return false;
                if ((cc < 0x20 || cc > 0x7f)) return false;
                APOS += 1;
                CREP[CPOS++] = cc;
                return true;
            },
            infer: () => {
                CREP[CPOS++] = 0x20;
            },
        },
    });

    // SequenceExpression
    const CHAR_sub2 = createRule(mode, {
        parse: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ] = [APOS, CPOS];
                let seqType = AW = NOTHING;
                if (!CHAR_sub3()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                seqType |= AW;
                if (!CHAR_sub4()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                AW |= seqType;
                return true;
            },
            infer: () => {
                let seqType = AW = NOTHING;
                CHAR_sub3.infer();
                seqType |= AW;
                CHAR_sub4.infer();
                AW |= seqType;
            },
        },
        print: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ, ARₒ] = [APOS, CPOS, AR];
                if (!CHAR_sub3()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                if (!CHAR_sub4()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                return true;
            },
            infer: () => {
                CHAR_sub3.infer();
                CHAR_sub4.infer();
            },
        },
    });

    // ByteExpression
    const CHAR_sub3 = createRule(mode, {
        parse: {
            full: function BYT() {
                let cc;
                if (CPOS >= CREP.length) return false;
                cc = CREP[CPOS];
                if ((cc < 0xc0 || cc > 0xdf)) return false;
                CPOS += 1;
                emitByte(cc);
                return true;
            },
            infer: () => {
                emitByte(0xc0);
            },
        },
        print: {
            full: function BYT() {
                let cc;
                if (AR !== STRING) return false;
                if (APOS >= AREP.length) return false;
                cc = AREP[APOS];
                if ((cc < 0xc0 || cc > 0xdf)) return false;
                APOS += 1;
                CREP[CPOS++] = cc;
                return true;
            },
            infer: () => {
                CREP[CPOS++] = 0xc0;
            },
        },
    });

    // ByteExpression
    const CHAR_sub4 = createRule(mode, {
        parse: {
            full: function BYT() {
                let cc;
                if (CPOS >= CREP.length) return false;
                cc = CREP[CPOS];
                if ((cc < 0x80 || cc > 0xbf)) return false;
                CPOS += 1;
                emitByte(cc);
                return true;
            },
            infer: () => {
                emitByte(0x80);
            },
        },
        print: {
            full: function BYT() {
                let cc;
                if (AR !== STRING) return false;
                if (APOS >= AREP.length) return false;
                cc = AREP[APOS];
                if ((cc < 0x80 || cc > 0xbf)) return false;
                APOS += 1;
                CREP[CPOS++] = cc;
                return true;
            },
            infer: () => {
                CREP[CPOS++] = 0x80;
            },
        },
    });

    // SequenceExpression
    const CHAR_sub5 = createRule(mode, {
        parse: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ] = [APOS, CPOS];
                let seqType = AW = NOTHING;
                if (!CHAR_sub6()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                seqType |= AW;
                if (!CHAR_sub7()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                seqType |= AW;
                if (!CHAR_sub8()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                AW |= seqType;
                return true;
            },
            infer: () => {
                let seqType = AW = NOTHING;
                CHAR_sub6.infer();
                seqType |= AW;
                CHAR_sub7.infer();
                seqType |= AW;
                CHAR_sub8.infer();
                AW |= seqType;
            },
        },
        print: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ, ARₒ] = [APOS, CPOS, AR];
                if (!CHAR_sub6()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                if (!CHAR_sub7()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                if (!CHAR_sub8()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                return true;
            },
            infer: () => {
                CHAR_sub6.infer();
                CHAR_sub7.infer();
                CHAR_sub8.infer();
            },
        },
    });

    // ByteExpression
    const CHAR_sub6 = createRule(mode, {
        parse: {
            full: function BYT() {
                let cc;
                if (CPOS >= CREP.length) return false;
                cc = CREP[CPOS];
                if ((cc < 0xe0 || cc > 0xef)) return false;
                CPOS += 1;
                emitByte(cc);
                return true;
            },
            infer: () => {
                emitByte(0xe0);
            },
        },
        print: {
            full: function BYT() {
                let cc;
                if (AR !== STRING) return false;
                if (APOS >= AREP.length) return false;
                cc = AREP[APOS];
                if ((cc < 0xe0 || cc > 0xef)) return false;
                APOS += 1;
                CREP[CPOS++] = cc;
                return true;
            },
            infer: () => {
                CREP[CPOS++] = 0xe0;
            },
        },
    });

    // ByteExpression
    const CHAR_sub7 = createRule(mode, {
        parse: {
            full: function BYT() {
                let cc;
                if (CPOS >= CREP.length) return false;
                cc = CREP[CPOS];
                if ((cc < 0x80 || cc > 0xbf)) return false;
                CPOS += 1;
                emitByte(cc);
                return true;
            },
            infer: () => {
                emitByte(0x80);
            },
        },
        print: {
            full: function BYT() {
                let cc;
                if (AR !== STRING) return false;
                if (APOS >= AREP.length) return false;
                cc = AREP[APOS];
                if ((cc < 0x80 || cc > 0xbf)) return false;
                APOS += 1;
                CREP[CPOS++] = cc;
                return true;
            },
            infer: () => {
                CREP[CPOS++] = 0x80;
            },
        },
    });

    // ByteExpression
    const CHAR_sub8 = createRule(mode, {
        parse: {
            full: function BYT() {
                let cc;
                if (CPOS >= CREP.length) return false;
                cc = CREP[CPOS];
                if ((cc < 0x80 || cc > 0xbf)) return false;
                CPOS += 1;
                emitByte(cc);
                return true;
            },
            infer: () => {
                emitByte(0x80);
            },
        },
        print: {
            full: function BYT() {
                let cc;
                if (AR !== STRING) return false;
                if (APOS >= AREP.length) return false;
                cc = AREP[APOS];
                if ((cc < 0x80 || cc > 0xbf)) return false;
                APOS += 1;
                CREP[CPOS++] = cc;
                return true;
            },
            infer: () => {
                CREP[CPOS++] = 0x80;
            },
        },
    });

    // SequenceExpression
    const CHAR_sub9 = createRule(mode, {
        parse: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ] = [APOS, CPOS];
                let seqType = AW = NOTHING;
                if (!CHAR_sub10()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                seqType |= AW;
                if (!CHAR_sub11()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                seqType |= AW;
                if (!CHAR_sub12()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                seqType |= AW;
                if (!CHAR_sub13()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                AW |= seqType;
                return true;
            },
            infer: () => {
                let seqType = AW = NOTHING;
                CHAR_sub10.infer();
                seqType |= AW;
                CHAR_sub11.infer();
                seqType |= AW;
                CHAR_sub12.infer();
                seqType |= AW;
                CHAR_sub13.infer();
                AW |= seqType;
            },
        },
        print: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ, ARₒ] = [APOS, CPOS, AR];
                if (!CHAR_sub10()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                if (!CHAR_sub11()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                if (!CHAR_sub12()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                if (!CHAR_sub13()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                return true;
            },
            infer: () => {
                CHAR_sub10.infer();
                CHAR_sub11.infer();
                CHAR_sub12.infer();
                CHAR_sub13.infer();
            },
        },
    });

    // ByteExpression
    const CHAR_sub10 = createRule(mode, {
        parse: {
            full: function BYT() {
                let cc;
                if (CPOS >= CREP.length) return false;
                cc = CREP[CPOS];
                if ((cc < 0xf0 || cc > 0xf7)) return false;
                CPOS += 1;
                emitByte(cc);
                return true;
            },
            infer: () => {
                emitByte(0xf0);
            },
        },
        print: {
            full: function BYT() {
                let cc;
                if (AR !== STRING) return false;
                if (APOS >= AREP.length) return false;
                cc = AREP[APOS];
                if ((cc < 0xf0 || cc > 0xf7)) return false;
                APOS += 1;
                CREP[CPOS++] = cc;
                return true;
            },
            infer: () => {
                CREP[CPOS++] = 0xf0;
            },
        },
    });

    // ByteExpression
    const CHAR_sub11 = createRule(mode, {
        parse: {
            full: function BYT() {
                let cc;
                if (CPOS >= CREP.length) return false;
                cc = CREP[CPOS];
                if ((cc < 0x80 || cc > 0xbf)) return false;
                CPOS += 1;
                emitByte(cc);
                return true;
            },
            infer: () => {
                emitByte(0x80);
            },
        },
        print: {
            full: function BYT() {
                let cc;
                if (AR !== STRING) return false;
                if (APOS >= AREP.length) return false;
                cc = AREP[APOS];
                if ((cc < 0x80 || cc > 0xbf)) return false;
                APOS += 1;
                CREP[CPOS++] = cc;
                return true;
            },
            infer: () => {
                CREP[CPOS++] = 0x80;
            },
        },
    });

    // ByteExpression
    const CHAR_sub12 = createRule(mode, {
        parse: {
            full: function BYT() {
                let cc;
                if (CPOS >= CREP.length) return false;
                cc = CREP[CPOS];
                if ((cc < 0x80 || cc > 0xbf)) return false;
                CPOS += 1;
                emitByte(cc);
                return true;
            },
            infer: () => {
                emitByte(0x80);
            },
        },
        print: {
            full: function BYT() {
                let cc;
                if (AR !== STRING) return false;
                if (APOS >= AREP.length) return false;
                cc = AREP[APOS];
                if ((cc < 0x80 || cc > 0xbf)) return false;
                APOS += 1;
                CREP[CPOS++] = cc;
                return true;
            },
            infer: () => {
                CREP[CPOS++] = 0x80;
            },
        },
    });

    // ByteExpression
    const CHAR_sub13 = createRule(mode, {
        parse: {
            full: function BYT() {
                let cc;
                if (CPOS >= CREP.length) return false;
                cc = CREP[CPOS];
                if ((cc < 0x80 || cc > 0xbf)) return false;
                CPOS += 1;
                emitByte(cc);
                return true;
            },
            infer: () => {
                emitByte(0x80);
            },
        },
        print: {
            full: function BYT() {
                let cc;
                if (AR !== STRING) return false;
                if (APOS >= AREP.length) return false;
                cc = AREP[APOS];
                if ((cc < 0x80 || cc > 0xbf)) return false;
                APOS += 1;
                CREP[CPOS++] = cc;
                return true;
            },
            infer: () => {
                CREP[CPOS++] = 0x80;
            },
        },
    });

    // SequenceExpression
    const CHAR_sub14 = createRule(mode, {
        parse: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ] = [APOS, CPOS];
                let seqType = AW = NOTHING;
                if (!CHAR_sub15()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                seqType |= AW;
                if (!CHAR_sub16()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                AW |= seqType;
                return true;
            },
            infer: () => {
                let seqType = AW = NOTHING;
                CHAR_sub15.infer();
                seqType |= AW;
                CHAR_sub16.infer();
                AW |= seqType;
            },
        },
        print: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ, ARₒ] = [APOS, CPOS, AR];
                if (!CHAR_sub15()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                if (!CHAR_sub16()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                return true;
            },
            infer: () => {
                CHAR_sub15.infer();
                CHAR_sub16.infer();
            },
        },
    });

    // StringLiteral
    const CHAR_sub15 = createRule(mode, {
        parse: {
            full: function STR() {
                if (CPOS + 2 > CREP.length) return false;
                if (CREP[CPOS + 0] !== 0x5c) return false;
                if (CREP[CPOS + 1] !== 0x22) return false;
                CPOS += 2;
                return true;
            },
            infer: function STR() {
            },
        },
        print: {
            full: function STR() {
                CREP[CPOS++] = 0x5c;
                CREP[CPOS++] = 0x22;
                return true;
            },
            infer: function STR() {
                CREP[CPOS++] = 0x5c;
                CREP[CPOS++] = 0x22;
            },
        },
    });
    CHAR_sub15.constant = {value: "\\\""};

    // ByteExpression
    const CHAR_sub16 = createRule(mode, {
        parse: {
            full: function BYT() {
                let cc;
                cc = 0x22;
                emitByte(cc);
                return true;
            },
            infer: () => {
                emitByte(0x22);
            },
        },
        print: {
            full: function BYT() {
                let cc;
                if (AR !== STRING) return false;
                if (APOS >= AREP.length) return false;
                cc = AREP[APOS];
                if (cc !== 0x22) return false;
                APOS += 1;
                return true;
            },
            infer: () => {},
        },
    });

    // SequenceExpression
    const CHAR_sub17 = createRule(mode, {
        parse: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ] = [APOS, CPOS];
                let seqType = AW = NOTHING;
                if (!CHAR_sub18()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                seqType |= AW;
                if (!CHAR_sub19()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                AW |= seqType;
                return true;
            },
            infer: () => {
                let seqType = AW = NOTHING;
                CHAR_sub18.infer();
                seqType |= AW;
                CHAR_sub19.infer();
                AW |= seqType;
            },
        },
        print: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ, ARₒ] = [APOS, CPOS, AR];
                if (!CHAR_sub18()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                if (!CHAR_sub19()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                return true;
            },
            infer: () => {
                CHAR_sub18.infer();
                CHAR_sub19.infer();
            },
        },
    });

    // StringLiteral
    const CHAR_sub18 = createRule(mode, {
        parse: {
            full: function STR() {
                if (CPOS + 2 > CREP.length) return false;
                if (CREP[CPOS + 0] !== 0x5c) return false;
                if (CREP[CPOS + 1] !== 0x5c) return false;
                CPOS += 2;
                return true;
            },
            infer: function STR() {
            },
        },
        print: {
            full: function STR() {
                CREP[CPOS++] = 0x5c;
                CREP[CPOS++] = 0x5c;
                return true;
            },
            infer: function STR() {
                CREP[CPOS++] = 0x5c;
                CREP[CPOS++] = 0x5c;
            },
        },
    });
    CHAR_sub18.constant = {value: "\\\\"};

    // ByteExpression
    const CHAR_sub19 = createRule(mode, {
        parse: {
            full: function BYT() {
                let cc;
                cc = 0x5c;
                emitByte(cc);
                return true;
            },
            infer: () => {
                emitByte(0x5c);
            },
        },
        print: {
            full: function BYT() {
                let cc;
                if (AR !== STRING) return false;
                if (APOS >= AREP.length) return false;
                cc = AREP[APOS];
                if (cc !== 0x5c) return false;
                APOS += 1;
                return true;
            },
            infer: () => {},
        },
    });

    // SequenceExpression
    const CHAR_sub20 = createRule(mode, {
        parse: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ] = [APOS, CPOS];
                let seqType = AW = NOTHING;
                if (!CHAR_sub21()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                seqType |= AW;
                if (!CHAR_sub22()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                AW |= seqType;
                return true;
            },
            infer: () => {
                let seqType = AW = NOTHING;
                CHAR_sub21.infer();
                seqType |= AW;
                CHAR_sub22.infer();
                AW |= seqType;
            },
        },
        print: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ, ARₒ] = [APOS, CPOS, AR];
                if (!CHAR_sub21()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                if (!CHAR_sub22()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                return true;
            },
            infer: () => {
                CHAR_sub21.infer();
                CHAR_sub22.infer();
            },
        },
    });

    // StringLiteral
    const CHAR_sub21 = createRule(mode, {
        parse: {
            full: function STR() {
                if (CPOS + 2 > CREP.length) return false;
                if (CREP[CPOS + 0] !== 0x5c) return false;
                if (CREP[CPOS + 1] !== 0x2f) return false;
                CPOS += 2;
                return true;
            },
            infer: function STR() {
            },
        },
        print: {
            full: function STR() {
                CREP[CPOS++] = 0x5c;
                CREP[CPOS++] = 0x2f;
                return true;
            },
            infer: function STR() {
                CREP[CPOS++] = 0x5c;
                CREP[CPOS++] = 0x2f;
            },
        },
    });
    CHAR_sub21.constant = {value: "\\/"};

    // ByteExpression
    const CHAR_sub22 = createRule(mode, {
        parse: {
            full: function BYT() {
                let cc;
                cc = 0x2f;
                emitByte(cc);
                return true;
            },
            infer: () => {
                emitByte(0x2f);
            },
        },
        print: {
            full: function BYT() {
                let cc;
                if (AR !== STRING) return false;
                if (APOS >= AREP.length) return false;
                cc = AREP[APOS];
                if (cc !== 0x2f) return false;
                APOS += 1;
                return true;
            },
            infer: () => {},
        },
    });

    // SequenceExpression
    const CHAR_sub23 = createRule(mode, {
        parse: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ] = [APOS, CPOS];
                let seqType = AW = NOTHING;
                if (!CHAR_sub24()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                seqType |= AW;
                if (!CHAR_sub25()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                AW |= seqType;
                return true;
            },
            infer: () => {
                let seqType = AW = NOTHING;
                CHAR_sub24.infer();
                seqType |= AW;
                CHAR_sub25.infer();
                AW |= seqType;
            },
        },
        print: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ, ARₒ] = [APOS, CPOS, AR];
                if (!CHAR_sub24()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                if (!CHAR_sub25()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                return true;
            },
            infer: () => {
                CHAR_sub24.infer();
                CHAR_sub25.infer();
            },
        },
    });

    // StringLiteral
    const CHAR_sub24 = createRule(mode, {
        parse: {
            full: function STR() {
                if (CPOS + 2 > CREP.length) return false;
                if (CREP[CPOS + 0] !== 0x5c) return false;
                if (CREP[CPOS + 1] !== 0x62) return false;
                CPOS += 2;
                return true;
            },
            infer: function STR() {
            },
        },
        print: {
            full: function STR() {
                CREP[CPOS++] = 0x5c;
                CREP[CPOS++] = 0x62;
                return true;
            },
            infer: function STR() {
                CREP[CPOS++] = 0x5c;
                CREP[CPOS++] = 0x62;
            },
        },
    });
    CHAR_sub24.constant = {value: "\\b"};

    // ByteExpression
    const CHAR_sub25 = createRule(mode, {
        parse: {
            full: function BYT() {
                let cc;
                cc = 0x08;
                emitByte(cc);
                return true;
            },
            infer: () => {
                emitByte(0x08);
            },
        },
        print: {
            full: function BYT() {
                let cc;
                if (AR !== STRING) return false;
                if (APOS >= AREP.length) return false;
                cc = AREP[APOS];
                if (cc !== 0x08) return false;
                APOS += 1;
                return true;
            },
            infer: () => {},
        },
    });

    // SequenceExpression
    const CHAR_sub26 = createRule(mode, {
        parse: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ] = [APOS, CPOS];
                let seqType = AW = NOTHING;
                if (!CHAR_sub27()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                seqType |= AW;
                if (!CHAR_sub28()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                AW |= seqType;
                return true;
            },
            infer: () => {
                let seqType = AW = NOTHING;
                CHAR_sub27.infer();
                seqType |= AW;
                CHAR_sub28.infer();
                AW |= seqType;
            },
        },
        print: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ, ARₒ] = [APOS, CPOS, AR];
                if (!CHAR_sub27()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                if (!CHAR_sub28()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                return true;
            },
            infer: () => {
                CHAR_sub27.infer();
                CHAR_sub28.infer();
            },
        },
    });

    // StringLiteral
    const CHAR_sub27 = createRule(mode, {
        parse: {
            full: function STR() {
                if (CPOS + 2 > CREP.length) return false;
                if (CREP[CPOS + 0] !== 0x5c) return false;
                if (CREP[CPOS + 1] !== 0x66) return false;
                CPOS += 2;
                return true;
            },
            infer: function STR() {
            },
        },
        print: {
            full: function STR() {
                CREP[CPOS++] = 0x5c;
                CREP[CPOS++] = 0x66;
                return true;
            },
            infer: function STR() {
                CREP[CPOS++] = 0x5c;
                CREP[CPOS++] = 0x66;
            },
        },
    });
    CHAR_sub27.constant = {value: "\\f"};

    // ByteExpression
    const CHAR_sub28 = createRule(mode, {
        parse: {
            full: function BYT() {
                let cc;
                cc = 0x0c;
                emitByte(cc);
                return true;
            },
            infer: () => {
                emitByte(0x0c);
            },
        },
        print: {
            full: function BYT() {
                let cc;
                if (AR !== STRING) return false;
                if (APOS >= AREP.length) return false;
                cc = AREP[APOS];
                if (cc !== 0x0c) return false;
                APOS += 1;
                return true;
            },
            infer: () => {},
        },
    });

    // SequenceExpression
    const CHAR_sub29 = createRule(mode, {
        parse: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ] = [APOS, CPOS];
                let seqType = AW = NOTHING;
                if (!CHAR_sub30()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                seqType |= AW;
                if (!CHAR_sub31()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                AW |= seqType;
                return true;
            },
            infer: () => {
                let seqType = AW = NOTHING;
                CHAR_sub30.infer();
                seqType |= AW;
                CHAR_sub31.infer();
                AW |= seqType;
            },
        },
        print: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ, ARₒ] = [APOS, CPOS, AR];
                if (!CHAR_sub30()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                if (!CHAR_sub31()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                return true;
            },
            infer: () => {
                CHAR_sub30.infer();
                CHAR_sub31.infer();
            },
        },
    });

    // StringLiteral
    const CHAR_sub30 = createRule(mode, {
        parse: {
            full: function STR() {
                if (CPOS + 2 > CREP.length) return false;
                if (CREP[CPOS + 0] !== 0x5c) return false;
                if (CREP[CPOS + 1] !== 0x6e) return false;
                CPOS += 2;
                return true;
            },
            infer: function STR() {
            },
        },
        print: {
            full: function STR() {
                CREP[CPOS++] = 0x5c;
                CREP[CPOS++] = 0x6e;
                return true;
            },
            infer: function STR() {
                CREP[CPOS++] = 0x5c;
                CREP[CPOS++] = 0x6e;
            },
        },
    });
    CHAR_sub30.constant = {value: "\\n"};

    // ByteExpression
    const CHAR_sub31 = createRule(mode, {
        parse: {
            full: function BYT() {
                let cc;
                cc = 0x0a;
                emitByte(cc);
                return true;
            },
            infer: () => {
                emitByte(0x0a);
            },
        },
        print: {
            full: function BYT() {
                let cc;
                if (AR !== STRING) return false;
                if (APOS >= AREP.length) return false;
                cc = AREP[APOS];
                if (cc !== 0x0a) return false;
                APOS += 1;
                return true;
            },
            infer: () => {},
        },
    });

    // SequenceExpression
    const CHAR_sub32 = createRule(mode, {
        parse: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ] = [APOS, CPOS];
                let seqType = AW = NOTHING;
                if (!CHAR_sub33()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                seqType |= AW;
                if (!CHAR_sub34()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                AW |= seqType;
                return true;
            },
            infer: () => {
                let seqType = AW = NOTHING;
                CHAR_sub33.infer();
                seqType |= AW;
                CHAR_sub34.infer();
                AW |= seqType;
            },
        },
        print: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ, ARₒ] = [APOS, CPOS, AR];
                if (!CHAR_sub33()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                if (!CHAR_sub34()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                return true;
            },
            infer: () => {
                CHAR_sub33.infer();
                CHAR_sub34.infer();
            },
        },
    });

    // StringLiteral
    const CHAR_sub33 = createRule(mode, {
        parse: {
            full: function STR() {
                if (CPOS + 2 > CREP.length) return false;
                if (CREP[CPOS + 0] !== 0x5c) return false;
                if (CREP[CPOS + 1] !== 0x72) return false;
                CPOS += 2;
                return true;
            },
            infer: function STR() {
            },
        },
        print: {
            full: function STR() {
                CREP[CPOS++] = 0x5c;
                CREP[CPOS++] = 0x72;
                return true;
            },
            infer: function STR() {
                CREP[CPOS++] = 0x5c;
                CREP[CPOS++] = 0x72;
            },
        },
    });
    CHAR_sub33.constant = {value: "\\r"};

    // ByteExpression
    const CHAR_sub34 = createRule(mode, {
        parse: {
            full: function BYT() {
                let cc;
                cc = 0x0d;
                emitByte(cc);
                return true;
            },
            infer: () => {
                emitByte(0x0d);
            },
        },
        print: {
            full: function BYT() {
                let cc;
                if (AR !== STRING) return false;
                if (APOS >= AREP.length) return false;
                cc = AREP[APOS];
                if (cc !== 0x0d) return false;
                APOS += 1;
                return true;
            },
            infer: () => {},
        },
    });

    // SequenceExpression
    const CHAR_sub35 = createRule(mode, {
        parse: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ] = [APOS, CPOS];
                let seqType = AW = NOTHING;
                if (!CHAR_sub36()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                seqType |= AW;
                if (!CHAR_sub37()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                AW |= seqType;
                return true;
            },
            infer: () => {
                let seqType = AW = NOTHING;
                CHAR_sub36.infer();
                seqType |= AW;
                CHAR_sub37.infer();
                AW |= seqType;
            },
        },
        print: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ, ARₒ] = [APOS, CPOS, AR];
                if (!CHAR_sub36()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                if (!CHAR_sub37()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                return true;
            },
            infer: () => {
                CHAR_sub36.infer();
                CHAR_sub37.infer();
            },
        },
    });

    // StringLiteral
    const CHAR_sub36 = createRule(mode, {
        parse: {
            full: function STR() {
                if (CPOS + 2 > CREP.length) return false;
                if (CREP[CPOS + 0] !== 0x5c) return false;
                if (CREP[CPOS + 1] !== 0x74) return false;
                CPOS += 2;
                return true;
            },
            infer: function STR() {
            },
        },
        print: {
            full: function STR() {
                CREP[CPOS++] = 0x5c;
                CREP[CPOS++] = 0x74;
                return true;
            },
            infer: function STR() {
                CREP[CPOS++] = 0x5c;
                CREP[CPOS++] = 0x74;
            },
        },
    });
    CHAR_sub36.constant = {value: "\\t"};

    // ByteExpression
    const CHAR_sub37 = createRule(mode, {
        parse: {
            full: function BYT() {
                let cc;
                cc = 0x09;
                emitByte(cc);
                return true;
            },
            infer: () => {
                emitByte(0x09);
            },
        },
        print: {
            full: function BYT() {
                let cc;
                if (AR !== STRING) return false;
                if (APOS >= AREP.length) return false;
                cc = AREP[APOS];
                if (cc !== 0x09) return false;
                APOS += 1;
                return true;
            },
            infer: () => {},
        },
    });

    // SequenceExpression
    const CHAR_sub38 = createRule(mode, {
        parse: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ] = [APOS, CPOS];
                let seqType = AW = NOTHING;
                if (!CHAR_sub39()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                seqType |= AW;
                if (!CHAR_sub40()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                AW |= seqType;
                return true;
            },
            infer: () => {
                let seqType = AW = NOTHING;
                CHAR_sub39.infer();
                seqType |= AW;
                CHAR_sub40.infer();
                AW |= seqType;
            },
        },
        print: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ, ARₒ] = [APOS, CPOS, AR];
                if (!CHAR_sub39()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                if (!CHAR_sub40()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                return true;
            },
            infer: () => {
                CHAR_sub39.infer();
                CHAR_sub40.infer();
            },
        },
    });

    // StringLiteral
    const CHAR_sub39 = createRule(mode, {
        parse: {
            full: function STR() {
                if (CPOS + 2 > CREP.length) return false;
                if (CREP[CPOS + 0] !== 0x5c) return false;
                if (CREP[CPOS + 1] !== 0x75) return false;
                CPOS += 2;
                return true;
            },
            infer: function STR() {
            },
        },
        print: {
            full: function STR() {
                CREP[CPOS++] = 0x5c;
                CREP[CPOS++] = 0x75;
                return true;
            },
            infer: function STR() {
                CREP[CPOS++] = 0x5c;
                CREP[CPOS++] = 0x75;
            },
        },
    });
    CHAR_sub39.constant = {value: "\\u"};

    // ApplicationExpression
    const CHAR_sub40 = lazy(() => unicode(CHAR_sub41));

    // Module
    const CHAR_sub41 = (member) => {
        switch (member) {
            case 'base': return base;
            case 'minDigits': return minDigits;
            case 'maxDigits': return maxDigits;
            default: return undefined;
        }
    };

    // SequenceExpression
    const LBRACE = createRule(mode, {
        parse: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ] = [APOS, CPOS];
                let seqType = AW = NOTHING;
                if (!WS()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                seqType |= AW;
                if (!LBRACE_sub1()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                seqType |= AW;
                if (!WS()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                AW |= seqType;
                return true;
            },
            infer: () => {
                let seqType = AW = NOTHING;
                WS.infer();
                seqType |= AW;
                LBRACE_sub1.infer();
                seqType |= AW;
                WS.infer();
                AW |= seqType;
            },
        },
        print: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ, ARₒ] = [APOS, CPOS, AR];
                if (!WS()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                if (!LBRACE_sub1()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                if (!WS()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                return true;
            },
            infer: () => {
                WS.infer();
                LBRACE_sub1.infer();
                WS.infer();
            },
        },
    });

    // ByteExpression
    const LBRACE_sub1 = createRule(mode, {
        parse: {
            full: function BYT() {
                let cc;
                if (CPOS >= CREP.length) return false;
                cc = CREP[CPOS];
                if (cc !== 0x7b) return false;
                CPOS += 1;
                return true;
            },
            infer: () => {},
        },
        print: {
            full: function BYT() {
                let cc;
                cc = 0x7b;
                CREP[CPOS++] = cc;
                return true;
            },
            infer: () => {
                CREP[CPOS++] = 0x7b;
            },
        },
    });

    // SequenceExpression
    const RBRACE = createRule(mode, {
        parse: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ] = [APOS, CPOS];
                let seqType = AW = NOTHING;
                if (!WS()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                seqType |= AW;
                if (!RBRACE_sub1()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                seqType |= AW;
                if (!WS()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                AW |= seqType;
                return true;
            },
            infer: () => {
                let seqType = AW = NOTHING;
                WS.infer();
                seqType |= AW;
                RBRACE_sub1.infer();
                seqType |= AW;
                WS.infer();
                AW |= seqType;
            },
        },
        print: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ, ARₒ] = [APOS, CPOS, AR];
                if (!WS()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                if (!RBRACE_sub1()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                if (!WS()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                return true;
            },
            infer: () => {
                WS.infer();
                RBRACE_sub1.infer();
                WS.infer();
            },
        },
    });

    // ByteExpression
    const RBRACE_sub1 = createRule(mode, {
        parse: {
            full: function BYT() {
                let cc;
                if (CPOS >= CREP.length) return false;
                cc = CREP[CPOS];
                if (cc !== 0x7d) return false;
                CPOS += 1;
                return true;
            },
            infer: () => {},
        },
        print: {
            full: function BYT() {
                let cc;
                cc = 0x7d;
                CREP[CPOS++] = cc;
                return true;
            },
            infer: () => {
                CREP[CPOS++] = 0x7d;
            },
        },
    });

    // SequenceExpression
    const LBRACKET = createRule(mode, {
        parse: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ] = [APOS, CPOS];
                let seqType = AW = NOTHING;
                if (!WS()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                seqType |= AW;
                if (!LBRACKET_sub1()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                seqType |= AW;
                if (!WS()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                AW |= seqType;
                return true;
            },
            infer: () => {
                let seqType = AW = NOTHING;
                WS.infer();
                seqType |= AW;
                LBRACKET_sub1.infer();
                seqType |= AW;
                WS.infer();
                AW |= seqType;
            },
        },
        print: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ, ARₒ] = [APOS, CPOS, AR];
                if (!WS()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                if (!LBRACKET_sub1()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                if (!WS()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                return true;
            },
            infer: () => {
                WS.infer();
                LBRACKET_sub1.infer();
                WS.infer();
            },
        },
    });

    // ByteExpression
    const LBRACKET_sub1 = createRule(mode, {
        parse: {
            full: function BYT() {
                let cc;
                if (CPOS >= CREP.length) return false;
                cc = CREP[CPOS];
                if (cc !== 0x5b) return false;
                CPOS += 1;
                return true;
            },
            infer: () => {},
        },
        print: {
            full: function BYT() {
                let cc;
                cc = 0x5b;
                CREP[CPOS++] = cc;
                return true;
            },
            infer: () => {
                CREP[CPOS++] = 0x5b;
            },
        },
    });

    // SequenceExpression
    const RBRACKET = createRule(mode, {
        parse: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ] = [APOS, CPOS];
                let seqType = AW = NOTHING;
                if (!WS()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                seqType |= AW;
                if (!RBRACKET_sub1()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                seqType |= AW;
                if (!WS()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                AW |= seqType;
                return true;
            },
            infer: () => {
                let seqType = AW = NOTHING;
                WS.infer();
                seqType |= AW;
                RBRACKET_sub1.infer();
                seqType |= AW;
                WS.infer();
                AW |= seqType;
            },
        },
        print: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ, ARₒ] = [APOS, CPOS, AR];
                if (!WS()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                if (!RBRACKET_sub1()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                if (!WS()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                return true;
            },
            infer: () => {
                WS.infer();
                RBRACKET_sub1.infer();
                WS.infer();
            },
        },
    });

    // ByteExpression
    const RBRACKET_sub1 = createRule(mode, {
        parse: {
            full: function BYT() {
                let cc;
                if (CPOS >= CREP.length) return false;
                cc = CREP[CPOS];
                if (cc !== 0x5d) return false;
                CPOS += 1;
                return true;
            },
            infer: () => {},
        },
        print: {
            full: function BYT() {
                let cc;
                cc = 0x5d;
                CREP[CPOS++] = cc;
                return true;
            },
            infer: () => {
                CREP[CPOS++] = 0x5d;
            },
        },
    });

    // SequenceExpression
    const COLON = createRule(mode, {
        parse: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ] = [APOS, CPOS];
                let seqType = AW = NOTHING;
                if (!WS()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                seqType |= AW;
                if (!COLON_sub1()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                seqType |= AW;
                if (!WS()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                AW |= seqType;
                return true;
            },
            infer: () => {
                let seqType = AW = NOTHING;
                WS.infer();
                seqType |= AW;
                COLON_sub1.infer();
                seqType |= AW;
                WS.infer();
                AW |= seqType;
            },
        },
        print: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ, ARₒ] = [APOS, CPOS, AR];
                if (!WS()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                if (!COLON_sub1()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                if (!WS()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                return true;
            },
            infer: () => {
                WS.infer();
                COLON_sub1.infer();
                WS.infer();
            },
        },
    });

    // ByteExpression
    const COLON_sub1 = createRule(mode, {
        parse: {
            full: function BYT() {
                let cc;
                if (CPOS >= CREP.length) return false;
                cc = CREP[CPOS];
                if (cc !== 0x3a) return false;
                CPOS += 1;
                return true;
            },
            infer: () => {},
        },
        print: {
            full: function BYT() {
                let cc;
                cc = 0x3a;
                CREP[CPOS++] = cc;
                return true;
            },
            infer: () => {
                CREP[CPOS++] = 0x3a;
            },
        },
    });

    // SequenceExpression
    const COMMA = createRule(mode, {
        parse: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ] = [APOS, CPOS];
                let seqType = AW = NOTHING;
                if (!WS()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                seqType |= AW;
                if (!COMMA_sub1()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                seqType |= AW;
                if (!WS()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                AW |= seqType;
                return true;
            },
            infer: () => {
                let seqType = AW = NOTHING;
                WS.infer();
                seqType |= AW;
                COMMA_sub1.infer();
                seqType |= AW;
                WS.infer();
                AW |= seqType;
            },
        },
        print: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ, ARₒ] = [APOS, CPOS, AR];
                if (!WS()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                if (!COMMA_sub1()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                if (!WS()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                return true;
            },
            infer: () => {
                WS.infer();
                COMMA_sub1.infer();
                WS.infer();
            },
        },
    });

    // ByteExpression
    const COMMA_sub1 = createRule(mode, {
        parse: {
            full: function BYT() {
                let cc;
                if (CPOS >= CREP.length) return false;
                cc = CREP[CPOS];
                if (cc !== 0x2c) return false;
                CPOS += 1;
                return true;
            },
            infer: () => {},
        },
        print: {
            full: function BYT() {
                let cc;
                cc = 0x2c;
                CREP[CPOS++] = cc;
                return true;
            },
            infer: () => {
                CREP[CPOS++] = 0x2c;
            },
        },
    });

    // ByteExpression
    const DOUBLE_QUOTE = createRule(mode, {
        parse: {
            full: function BYT() {
                let cc;
                if (CPOS >= CREP.length) return false;
                cc = CREP[CPOS];
                if (cc !== 0x22) return false;
                CPOS += 1;
                return true;
            },
            infer: () => {},
        },
        print: {
            full: function BYT() {
                let cc;
                cc = 0x22;
                CREP[CPOS++] = cc;
                return true;
            },
            infer: () => {
                CREP[CPOS++] = 0x22;
            },
        },
    });

    // QuantifiedExpression
    const WS = createRule(mode, {
        parse: {
            full: function QUA() {
                let [CPOSᐟ, APOSᐟ] = [CPOS, APOS];
                let seqType = AW = NOTHING;
                while (true) {
                    if (!WS_sub1() || CPOS <= CPOSᐟ) break;
                    seqType |= AW;
                    CPOSᐟ = CPOS, APOSᐟ = APOS;
                }
                CPOS = CPOSᐟ, APOS = APOSᐟ, AW = seqType;
                return true;
            },
            infer: () => (AW = NOTHING),
        },
        print: {
            full: function QUA() {
                let [APOSᐟ, CPOSᐟ] = [APOS, CPOS];
                while (true) {
                    if (!WS_sub1() || APOS <= APOSᐟ) break;
                    APOSᐟ = APOS, CPOSᐟ = CPOS;
                }
                APOS = APOSᐟ, CPOS = CPOSᐟ;
                return true;
            },
            infer: () => {},
        },
    });

    // ByteExpression
    const WS_sub1 = createRule(mode, {
        parse: {
            full: function BYT() {
                let cc;
                if (CPOS >= CREP.length) return false;
                cc = CREP[CPOS];
                if (cc !== 0x20 && cc !== 0x09 && cc !== 0x0a && cc !== 0x0d) return false;
                CPOS += 1;
                return true;
            },
            infer: () => {},
        },
        print: {
            full: function BYT() {
                let cc;
                cc = 0x20;
                CREP[CPOS++] = cc;
                return true;
            },
            infer: () => {
                CREP[CPOS++] = 0x20;
            },
        },
    });

    // Module
    const Ɱ_json = (member) => {
        switch (member) {
            case 'floatString': return floatString;
            case 'unicode': return unicode;
            case 'start': return start_2;
            case 'Value': return Value;
            case 'False': return False;
            case 'Null': return Null;
            case 'True': return True;
            case 'Object': return Object;
            case 'Object2': return Object2;
            case 'Properties': return Properties;
            case 'Array': return Array;
            case 'Array2': return Array2;
            case 'Elements': return Elements;
            case 'Number': return Number;
            case 'String': return String;
            case 'CHAR': return CHAR;
            case 'LBRACE': return LBRACE;
            case 'RBRACE': return RBRACE;
            case 'LBRACKET': return LBRACKET;
            case 'RBRACKET': return RBRACKET;
            case 'COLON': return COLON;
            case 'COMMA': return COMMA;
            case 'DOUBLE_QUOTE': return DOUBLE_QUOTE;
            case 'WS': return WS;
            default: return undefined;
        }
    };

    // Module
    const Ɱ_std = (member) => {
        switch (member) {
            case 'floatString': return floatString_2;
            case 'intString': return intString;
            case 'memoise': return memoise;
            default: return undefined;
        }
    };

    // Module
    const Ɱ_experiments = (member) => {
        switch (member) {
            case 'unicode': return unicode_2;
            default: return undefined;
        }
    };

    return start_2;
}
