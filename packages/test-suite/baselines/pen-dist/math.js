
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
};




// ------------------------------ Program ------------------------------
const parse = create('parse');
const print = create('print');
function create(mode) {

    // Intrinsic
    const floatString = extensions["V:/projects/oss/pen-monorepo/packages/core/penc/dist/deps/std.pen.js"].floatString({mode});
    const intString = extensions["V:/projects/oss/pen-monorepo/packages/core/penc/dist/deps/std.pen.js"].intString({mode});
    const memoise_2 = extensions["V:/projects/oss/pen-monorepo/packages/core/penc/dist/deps/std.pen.js"].memoise({mode});

    // Identifier
    const memoise = global.Object.assign(
        arg => memoise_2(arg),
        {infer: arg => memoise_2.infer(arg)},
    );

    // Identifier
    const float = global.Object.assign(
        arg => floatString(arg),
        {infer: arg => floatString.infer(arg)},
    );

    // Identifier
    const int = global.Object.assign(
        arg => intString(arg),
        {infer: arg => intString.infer(arg)},
    );

    // Identifier
    const start_2 = global.Object.assign(
        arg => expr(arg),
        {infer: arg => expr.infer(arg)},
    );

    // ApplicationExpression
    const expr = lazy(() => memoise(expr_sub1));

    // SelectionExpression
    const expr_sub1 = createRule(mode, {
        parse: {
            full: function SEL() { return add() || sub() || term(); },
            infer: () => add.infer(),
        },
        print: {
            full: function SEL() { return add() || sub() || term(); },
            infer: () => add.infer(),
        },
    });

    // RecordExpression
    const add = lazy(() => createRecord(mode, [
        {kind: 'Field', label: "type", expr: add_sub1},
        {kind: 'Field', label: "lhs", expr: expr},
        {kind: 'Field', label: "rhs", expr: add_sub3},
    ]));

    // ApplicationExpression
    const add_sub1 = lazy(() => ab(add_sub2));

    // StringLiteral
    const add_sub2 = createRule(mode, {
        parse: {
            full: function STR() {
                if (CPOS + 3 > CREP.length) return false;
                if (CREP[CPOS + 0] !== 0x61) return false;
                if (CREP[CPOS + 1] !== 0x64) return false;
                if (CREP[CPOS + 2] !== 0x64) return false;
                CPOS += 3;
                emitBytes(0x61, 0x64, 0x64);
                return true;
            },
            infer: function STR() {
                emitBytes(0x61, 0x64, 0x64);
            },
        },
        print: {
            full: function STR() {
                if (AR !== STRING) return false;
                if (APOS + 3 > AREP.length) return false;
                if (AREP[APOS + 0] !== 0x61) return false;
                if (AREP[APOS + 1] !== 0x64) return false;
                if (AREP[APOS + 2] !== 0x64) return false;
                APOS += 3;
                CREP[CPOS++] = 0x61;
                CREP[CPOS++] = 0x64;
                CREP[CPOS++] = 0x64;
                return true;
            },
            infer: function STR() {
                CREP[CPOS++] = 0x61;
                CREP[CPOS++] = 0x64;
                CREP[CPOS++] = 0x64;
            },
        },
    });
    add_sub2.constant = {value: "add"};

    // SequenceExpression
    const add_sub3 = createRule(mode, {
        parse: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ] = [APOS, CPOS];
                let seqType = AW = NOTHING;
                if (!add_sub4()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                seqType |= AW;
                if (!term()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                AW |= seqType;
                return true;
            },
            infer: () => {
                let seqType = AW = NOTHING;
                add_sub4.infer();
                seqType |= AW;
                term.infer();
                AW |= seqType;
            },
        },
        print: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ, ARₒ] = [APOS, CPOS, AR];
                if (!add_sub4()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                if (!term()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                return true;
            },
            infer: () => {
                add_sub4.infer();
                term.infer();
            },
        },
    });

    // ApplicationExpression
    const add_sub4 = lazy(() => co(add_sub5));

    // ByteExpression
    const add_sub5 = createRule(mode, {
        parse: {
            full: function BYT() {
                let cc;
                if (CPOS >= CREP.length) return false;
                cc = CREP[CPOS];
                if (cc !== 0x2b) return false;
                CPOS += 1;
                emitByte(cc);
                return true;
            },
            infer: () => {
                emitByte(0x2b);
            },
        },
        print: {
            full: function BYT() {
                let cc;
                if (AR !== STRING) return false;
                if (APOS >= AREP.length) return false;
                cc = AREP[APOS];
                if (cc !== 0x2b) return false;
                APOS += 1;
                CREP[CPOS++] = cc;
                return true;
            },
            infer: () => {
                CREP[CPOS++] = 0x2b;
            },
        },
    });

    // RecordExpression
    const sub = lazy(() => createRecord(mode, [
        {kind: 'Field', label: "type", expr: sub_sub1},
        {kind: 'Field', label: "lhs", expr: expr},
        {kind: 'Field', label: "rhs", expr: sub_sub3},
    ]));

    // ApplicationExpression
    const sub_sub1 = lazy(() => ab(sub_sub2));

    // StringLiteral
    const sub_sub2 = createRule(mode, {
        parse: {
            full: function STR() {
                if (CPOS + 3 > CREP.length) return false;
                if (CREP[CPOS + 0] !== 0x73) return false;
                if (CREP[CPOS + 1] !== 0x75) return false;
                if (CREP[CPOS + 2] !== 0x62) return false;
                CPOS += 3;
                emitBytes(0x73, 0x75, 0x62);
                return true;
            },
            infer: function STR() {
                emitBytes(0x73, 0x75, 0x62);
            },
        },
        print: {
            full: function STR() {
                if (AR !== STRING) return false;
                if (APOS + 3 > AREP.length) return false;
                if (AREP[APOS + 0] !== 0x73) return false;
                if (AREP[APOS + 1] !== 0x75) return false;
                if (AREP[APOS + 2] !== 0x62) return false;
                APOS += 3;
                CREP[CPOS++] = 0x73;
                CREP[CPOS++] = 0x75;
                CREP[CPOS++] = 0x62;
                return true;
            },
            infer: function STR() {
                CREP[CPOS++] = 0x73;
                CREP[CPOS++] = 0x75;
                CREP[CPOS++] = 0x62;
            },
        },
    });
    sub_sub2.constant = {value: "sub"};

    // SequenceExpression
    const sub_sub3 = createRule(mode, {
        parse: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ] = [APOS, CPOS];
                let seqType = AW = NOTHING;
                if (!sub_sub4()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                seqType |= AW;
                if (!term()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                AW |= seqType;
                return true;
            },
            infer: () => {
                let seqType = AW = NOTHING;
                sub_sub4.infer();
                seqType |= AW;
                term.infer();
                AW |= seqType;
            },
        },
        print: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ, ARₒ] = [APOS, CPOS, AR];
                if (!sub_sub4()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                if (!term()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                return true;
            },
            infer: () => {
                sub_sub4.infer();
                term.infer();
            },
        },
    });

    // ApplicationExpression
    const sub_sub4 = lazy(() => co(sub_sub5));

    // ByteExpression
    const sub_sub5 = createRule(mode, {
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

    // ApplicationExpression
    const term = lazy(() => memoise(term_sub1));

    // SelectionExpression
    const term_sub1 = createRule(mode, {
        parse: {
            full: function SEL() { return mul() || div() || factor(); },
            infer: () => mul.infer(),
        },
        print: {
            full: function SEL() { return mul() || div() || factor(); },
            infer: () => mul.infer(),
        },
    });

    // RecordExpression
    const mul = lazy(() => createRecord(mode, [
        {kind: 'Field', label: mul_sub1, expr: mul_sub3},
        {kind: 'Field', label: "lhs", expr: term},
        {kind: 'Field', label: mul_sub5, expr: mul_sub7},
    ]));

    // ApplicationExpression
    const mul_sub1 = lazy(() => ab(mul_sub2));

    // StringLiteral
    const mul_sub2 = createRule(mode, {
        parse: {
            full: function STR() {
                if (CPOS + 4 > CREP.length) return false;
                if (CREP[CPOS + 0] !== 0x74) return false;
                if (CREP[CPOS + 1] !== 0x79) return false;
                if (CREP[CPOS + 2] !== 0x70) return false;
                if (CREP[CPOS + 3] !== 0x65) return false;
                CPOS += 4;
                emitBytes(0x74, 0x79, 0x70, 0x65);
                return true;
            },
            infer: function STR() {
                emitBytes(0x74, 0x79, 0x70, 0x65);
            },
        },
        print: {
            full: function STR() {
                if (AR !== STRING) return false;
                if (APOS + 4 > AREP.length) return false;
                if (AREP[APOS + 0] !== 0x74) return false;
                if (AREP[APOS + 1] !== 0x79) return false;
                if (AREP[APOS + 2] !== 0x70) return false;
                if (AREP[APOS + 3] !== 0x65) return false;
                APOS += 4;
                CREP[CPOS++] = 0x74;
                CREP[CPOS++] = 0x79;
                CREP[CPOS++] = 0x70;
                CREP[CPOS++] = 0x65;
                return true;
            },
            infer: function STR() {
                CREP[CPOS++] = 0x74;
                CREP[CPOS++] = 0x79;
                CREP[CPOS++] = 0x70;
                CREP[CPOS++] = 0x65;
            },
        },
    });
    mul_sub2.constant = {value: "type"};

    // ApplicationExpression
    const mul_sub3 = lazy(() => ab(mul_sub4));

    // StringLiteral
    const mul_sub4 = createRule(mode, {
        parse: {
            full: function STR() {
                if (CPOS + 3 > CREP.length) return false;
                if (CREP[CPOS + 0] !== 0x6d) return false;
                if (CREP[CPOS + 1] !== 0x75) return false;
                if (CREP[CPOS + 2] !== 0x6c) return false;
                CPOS += 3;
                emitBytes(0x6d, 0x75, 0x6c);
                return true;
            },
            infer: function STR() {
                emitBytes(0x6d, 0x75, 0x6c);
            },
        },
        print: {
            full: function STR() {
                if (AR !== STRING) return false;
                if (APOS + 3 > AREP.length) return false;
                if (AREP[APOS + 0] !== 0x6d) return false;
                if (AREP[APOS + 1] !== 0x75) return false;
                if (AREP[APOS + 2] !== 0x6c) return false;
                APOS += 3;
                CREP[CPOS++] = 0x6d;
                CREP[CPOS++] = 0x75;
                CREP[CPOS++] = 0x6c;
                return true;
            },
            infer: function STR() {
                CREP[CPOS++] = 0x6d;
                CREP[CPOS++] = 0x75;
                CREP[CPOS++] = 0x6c;
            },
        },
    });
    mul_sub4.constant = {value: "mul"};

    // ApplicationExpression
    const mul_sub5 = lazy(() => ab(mul_sub6));

    // StringLiteral
    const mul_sub6 = createRule(mode, {
        parse: {
            full: function STR() {
                if (CPOS + 3 > CREP.length) return false;
                if (CREP[CPOS + 0] !== 0x72) return false;
                if (CREP[CPOS + 1] !== 0x68) return false;
                if (CREP[CPOS + 2] !== 0x73) return false;
                CPOS += 3;
                emitBytes(0x72, 0x68, 0x73);
                return true;
            },
            infer: function STR() {
                emitBytes(0x72, 0x68, 0x73);
            },
        },
        print: {
            full: function STR() {
                if (AR !== STRING) return false;
                if (APOS + 3 > AREP.length) return false;
                if (AREP[APOS + 0] !== 0x72) return false;
                if (AREP[APOS + 1] !== 0x68) return false;
                if (AREP[APOS + 2] !== 0x73) return false;
                APOS += 3;
                CREP[CPOS++] = 0x72;
                CREP[CPOS++] = 0x68;
                CREP[CPOS++] = 0x73;
                return true;
            },
            infer: function STR() {
                CREP[CPOS++] = 0x72;
                CREP[CPOS++] = 0x68;
                CREP[CPOS++] = 0x73;
            },
        },
    });
    mul_sub6.constant = {value: "rhs"};

    // SequenceExpression
    const mul_sub7 = createRule(mode, {
        parse: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ] = [APOS, CPOS];
                let seqType = AW = NOTHING;
                if (!mul_sub8()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                seqType |= AW;
                if (!factor()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                AW |= seqType;
                return true;
            },
            infer: () => {
                let seqType = AW = NOTHING;
                mul_sub8.infer();
                seqType |= AW;
                factor.infer();
                AW |= seqType;
            },
        },
        print: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ, ARₒ] = [APOS, CPOS, AR];
                if (!mul_sub8()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                if (!factor()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                return true;
            },
            infer: () => {
                mul_sub8.infer();
                factor.infer();
            },
        },
    });

    // ApplicationExpression
    const mul_sub8 = lazy(() => co(mul_sub9));

    // ByteExpression
    const mul_sub9 = createRule(mode, {
        parse: {
            full: function BYT() {
                let cc;
                if (CPOS >= CREP.length) return false;
                cc = CREP[CPOS];
                if (cc !== 0x2a) return false;
                CPOS += 1;
                emitByte(cc);
                return true;
            },
            infer: () => {
                emitByte(0x2a);
            },
        },
        print: {
            full: function BYT() {
                let cc;
                if (AR !== STRING) return false;
                if (APOS >= AREP.length) return false;
                cc = AREP[APOS];
                if (cc !== 0x2a) return false;
                APOS += 1;
                CREP[CPOS++] = cc;
                return true;
            },
            infer: () => {
                CREP[CPOS++] = 0x2a;
            },
        },
    });

    // RecordExpression
    const div = lazy(() => createRecord(mode, [
        {kind: 'Field', label: "type", expr: div_sub1},
        {kind: 'Field', label: "lhs", expr: term},
        {kind: 'Field', label: "rhs", expr: div_sub3},
    ]));

    // ApplicationExpression
    const div_sub1 = lazy(() => ab(div_sub2));

    // StringLiteral
    const div_sub2 = createRule(mode, {
        parse: {
            full: function STR() {
                if (CPOS + 3 > CREP.length) return false;
                if (CREP[CPOS + 0] !== 0x64) return false;
                if (CREP[CPOS + 1] !== 0x69) return false;
                if (CREP[CPOS + 2] !== 0x76) return false;
                CPOS += 3;
                emitBytes(0x64, 0x69, 0x76);
                return true;
            },
            infer: function STR() {
                emitBytes(0x64, 0x69, 0x76);
            },
        },
        print: {
            full: function STR() {
                if (AR !== STRING) return false;
                if (APOS + 3 > AREP.length) return false;
                if (AREP[APOS + 0] !== 0x64) return false;
                if (AREP[APOS + 1] !== 0x69) return false;
                if (AREP[APOS + 2] !== 0x76) return false;
                APOS += 3;
                CREP[CPOS++] = 0x64;
                CREP[CPOS++] = 0x69;
                CREP[CPOS++] = 0x76;
                return true;
            },
            infer: function STR() {
                CREP[CPOS++] = 0x64;
                CREP[CPOS++] = 0x69;
                CREP[CPOS++] = 0x76;
            },
        },
    });
    div_sub2.constant = {value: "div"};

    // SequenceExpression
    const div_sub3 = createRule(mode, {
        parse: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ] = [APOS, CPOS];
                let seqType = AW = NOTHING;
                if (!div_sub4()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                seqType |= AW;
                if (!factor()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                AW |= seqType;
                return true;
            },
            infer: () => {
                let seqType = AW = NOTHING;
                div_sub4.infer();
                seqType |= AW;
                factor.infer();
                AW |= seqType;
            },
        },
        print: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ, ARₒ] = [APOS, CPOS, AR];
                if (!div_sub4()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                if (!factor()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                return true;
            },
            infer: () => {
                div_sub4.infer();
                factor.infer();
            },
        },
    });

    // ApplicationExpression
    const div_sub4 = lazy(() => co(div_sub5));

    // ByteExpression
    const div_sub5 = createRule(mode, {
        parse: {
            full: function BYT() {
                let cc;
                if (CPOS >= CREP.length) return false;
                cc = CREP[CPOS];
                if (cc !== 0x2f) return false;
                CPOS += 1;
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
                CREP[CPOS++] = cc;
                return true;
            },
            infer: () => {
                CREP[CPOS++] = 0x2f;
            },
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

    // BooleanLiteral
    const signed = createRule(mode, {
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
    signed.constant = {value: false};

    // NumericLiteral
    const base_2 = createRule(mode, {
        parse: {
            full: () => (emitScalar(2), true),
            infer: () => emitScalar(2),
        },
        print: {
            full: function LIT() {
                if (AR !== SCALAR) return false;
                if (AREP[APOS] !== 2) return false;
                APOS += 1;
                return true;
            },
            infer: () => {},
        },
    });
    base_2.constant = {value: 2};

    // BooleanLiteral
    const signed_2 = createRule(mode, {
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
    signed_2.constant = {value: false};

    // BooleanLiteral
    const signed_3 = createRule(mode, {
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
    signed_3.constant = {value: false};

    // SelectionExpression
    const factor = createRule(mode, {
        parse: {
            full: function SEL() { return factor_sub1() || factor_sub6() || factor_sub11() || factor_sub16() || factor_sub21(); },
            infer: () => factor_sub1.infer(),
        },
        print: {
            full: function SEL() { return factor_sub1() || factor_sub6() || factor_sub11() || factor_sub16() || factor_sub21(); },
            infer: () => factor_sub1.infer(),
        },
    });

    // SequenceExpression
    const factor_sub1 = createRule(mode, {
        parse: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ] = [APOS, CPOS];
                let seqType = AW = NOTHING;
                if (!factor_sub2()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                seqType |= AW;
                if (!factor_sub4()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                seqType |= AW;
                if (!float()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                AW |= seqType;
                return true;
            },
            infer: () => {
                let seqType = AW = NOTHING;
                factor_sub2.infer();
                seqType |= AW;
                factor_sub4.infer();
                seqType |= AW;
                float.infer();
                AW |= seqType;
            },
        },
        print: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ, ARₒ] = [APOS, CPOS, AR];
                if (!factor_sub2()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                if (!factor_sub4()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                if (!float()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                return true;
            },
            infer: () => {
                factor_sub2.infer();
                factor_sub4.infer();
                float.infer();
            },
        },
    });

    // NotExpression
    const factor_sub2 = createRule(mode, {
        parse: {
            full: function NOT() {
                const [APOSₒ, CPOSₒ, AWₒ] = [APOS, CPOS, AW];
                const result = !factor_sub3();
                [APOS, CPOS, AW] = [APOSₒ, CPOSₒ, NOTHING];
                return result;
            },
            infer: () => (AW = NOTHING),
        },
        print: {
            full: function NOT() {
                const [APOSₒ, CPOSₒ, ARₒ] = [APOS, CPOS, AR];
                const result = !factor_sub3();
                [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ];
                return result;
            },
            infer: () => {},
        },
    });

    // StringLiteral
    const factor_sub3 = createRule(mode, {
        parse: {
            full: function STR() {
                if (CPOS + 2 > CREP.length) return false;
                if (CREP[CPOS + 0] !== 0x30) return false;
                if (CREP[CPOS + 1] !== 0x78) return false;
                CPOS += 2;
                emitBytes(0x30, 0x78);
                return true;
            },
            infer: function STR() {
                emitBytes(0x30, 0x78);
            },
        },
        print: {
            full: function STR() {
                if (AR !== STRING) return false;
                if (APOS + 2 > AREP.length) return false;
                if (AREP[APOS + 0] !== 0x30) return false;
                if (AREP[APOS + 1] !== 0x78) return false;
                APOS += 2;
                CREP[CPOS++] = 0x30;
                CREP[CPOS++] = 0x78;
                return true;
            },
            infer: function STR() {
                CREP[CPOS++] = 0x30;
                CREP[CPOS++] = 0x78;
            },
        },
    });
    factor_sub3.constant = {value: "0x"};

    // NotExpression
    const factor_sub4 = createRule(mode, {
        parse: {
            full: function NOT() {
                const [APOSₒ, CPOSₒ, AWₒ] = [APOS, CPOS, AW];
                const result = !factor_sub5();
                [APOS, CPOS, AW] = [APOSₒ, CPOSₒ, NOTHING];
                return result;
            },
            infer: () => (AW = NOTHING),
        },
        print: {
            full: function NOT() {
                const [APOSₒ, CPOSₒ, ARₒ] = [APOS, CPOS, AR];
                const result = !factor_sub5();
                [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ];
                return result;
            },
            infer: () => {},
        },
    });

    // StringLiteral
    const factor_sub5 = createRule(mode, {
        parse: {
            full: function STR() {
                if (CPOS + 2 > CREP.length) return false;
                if (CREP[CPOS + 0] !== 0x30) return false;
                if (CREP[CPOS + 1] !== 0x62) return false;
                CPOS += 2;
                emitBytes(0x30, 0x62);
                return true;
            },
            infer: function STR() {
                emitBytes(0x30, 0x62);
            },
        },
        print: {
            full: function STR() {
                if (AR !== STRING) return false;
                if (APOS + 2 > AREP.length) return false;
                if (AREP[APOS + 0] !== 0x30) return false;
                if (AREP[APOS + 1] !== 0x62) return false;
                APOS += 2;
                CREP[CPOS++] = 0x30;
                CREP[CPOS++] = 0x62;
                return true;
            },
            infer: function STR() {
                CREP[CPOS++] = 0x30;
                CREP[CPOS++] = 0x62;
            },
        },
    });
    factor_sub5.constant = {value: "0b"};

    // SequenceExpression
    const factor_sub6 = createRule(mode, {
        parse: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ] = [APOS, CPOS];
                let seqType = AW = NOTHING;
                if (!factor_sub7()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                seqType |= AW;
                if (!factor_sub9()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                AW |= seqType;
                return true;
            },
            infer: () => {
                let seqType = AW = NOTHING;
                factor_sub7.infer();
                seqType |= AW;
                factor_sub9.infer();
                AW |= seqType;
            },
        },
        print: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ, ARₒ] = [APOS, CPOS, AR];
                if (!factor_sub7()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                if (!factor_sub9()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                return true;
            },
            infer: () => {
                factor_sub7.infer();
                factor_sub9.infer();
            },
        },
    });

    // ApplicationExpression
    const factor_sub7 = lazy(() => co(factor_sub8));

    // StringLiteral
    const factor_sub8 = createRule(mode, {
        parse: {
            full: function STR() {
                if (CPOS + 2 > CREP.length) return false;
                if (CREP[CPOS + 0] !== 0x30) return false;
                if (CREP[CPOS + 1] !== 0x78) return false;
                CPOS += 2;
                emitBytes(0x30, 0x78);
                return true;
            },
            infer: function STR() {
                emitBytes(0x30, 0x78);
            },
        },
        print: {
            full: function STR() {
                if (AR !== STRING) return false;
                if (APOS + 2 > AREP.length) return false;
                if (AREP[APOS + 0] !== 0x30) return false;
                if (AREP[APOS + 1] !== 0x78) return false;
                APOS += 2;
                CREP[CPOS++] = 0x30;
                CREP[CPOS++] = 0x78;
                return true;
            },
            infer: function STR() {
                CREP[CPOS++] = 0x30;
                CREP[CPOS++] = 0x78;
            },
        },
    });
    factor_sub8.constant = {value: "0x"};

    // ApplicationExpression
    const factor_sub9 = lazy(() => int(factor_sub10));

    // Module
    const factor_sub10 = (member) => {
        switch (member) {
            case 'base': return base;
            case 'signed': return signed;
            default: return undefined;
        }
    };

    // SequenceExpression
    const factor_sub11 = createRule(mode, {
        parse: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ] = [APOS, CPOS];
                let seqType = AW = NOTHING;
                if (!factor_sub12()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                seqType |= AW;
                if (!factor_sub14()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                AW |= seqType;
                return true;
            },
            infer: () => {
                let seqType = AW = NOTHING;
                factor_sub12.infer();
                seqType |= AW;
                factor_sub14.infer();
                AW |= seqType;
            },
        },
        print: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ, ARₒ] = [APOS, CPOS, AR];
                if (!factor_sub12()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                if (!factor_sub14()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                return true;
            },
            infer: () => {
                factor_sub12.infer();
                factor_sub14.infer();
            },
        },
    });

    // ApplicationExpression
    const factor_sub12 = lazy(() => co(factor_sub13));

    // StringLiteral
    const factor_sub13 = createRule(mode, {
        parse: {
            full: function STR() {
                if (CPOS + 2 > CREP.length) return false;
                if (CREP[CPOS + 0] !== 0x30) return false;
                if (CREP[CPOS + 1] !== 0x62) return false;
                CPOS += 2;
                emitBytes(0x30, 0x62);
                return true;
            },
            infer: function STR() {
                emitBytes(0x30, 0x62);
            },
        },
        print: {
            full: function STR() {
                if (AR !== STRING) return false;
                if (APOS + 2 > AREP.length) return false;
                if (AREP[APOS + 0] !== 0x30) return false;
                if (AREP[APOS + 1] !== 0x62) return false;
                APOS += 2;
                CREP[CPOS++] = 0x30;
                CREP[CPOS++] = 0x62;
                return true;
            },
            infer: function STR() {
                CREP[CPOS++] = 0x30;
                CREP[CPOS++] = 0x62;
            },
        },
    });
    factor_sub13.constant = {value: "0b"};

    // ApplicationExpression
    const factor_sub14 = lazy(() => int(factor_sub15));

    // Module
    const factor_sub15 = (member) => {
        switch (member) {
            case 'base': return base_2;
            case 'signed': return signed_2;
            default: return undefined;
        }
    };

    // SequenceExpression
    const factor_sub16 = createRule(mode, {
        parse: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ] = [APOS, CPOS];
                let seqType = AW = NOTHING;
                if (!factor_sub17()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                seqType |= AW;
                if (!factor_sub19()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                AW |= seqType;
                return true;
            },
            infer: () => {
                let seqType = AW = NOTHING;
                factor_sub17.infer();
                seqType |= AW;
                factor_sub19.infer();
                AW |= seqType;
            },
        },
        print: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ, ARₒ] = [APOS, CPOS, AR];
                if (!factor_sub17()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                if (!factor_sub19()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                return true;
            },
            infer: () => {
                factor_sub17.infer();
                factor_sub19.infer();
            },
        },
    });

    // ApplicationExpression
    const factor_sub17 = lazy(() => co(factor_sub18));

    // ByteExpression
    const factor_sub18 = createRule(mode, {
        parse: {
            full: function BYT() {
                let cc;
                if (CPOS >= CREP.length) return false;
                cc = CREP[CPOS];
                if (cc !== 0x69) return false;
                CPOS += 1;
                emitByte(cc);
                return true;
            },
            infer: () => {
                emitByte(0x69);
            },
        },
        print: {
            full: function BYT() {
                let cc;
                if (AR !== STRING) return false;
                if (APOS >= AREP.length) return false;
                cc = AREP[APOS];
                if (cc !== 0x69) return false;
                APOS += 1;
                CREP[CPOS++] = cc;
                return true;
            },
            infer: () => {
                CREP[CPOS++] = 0x69;
            },
        },
    });

    // ApplicationExpression
    const factor_sub19 = lazy(() => int(factor_sub20));

    // Module
    const factor_sub20 = (member) => {
        switch (member) {
            case 'signed': return signed_3;
            default: return undefined;
        }
    };

    // SequenceExpression
    const factor_sub21 = createRule(mode, {
        parse: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ] = [APOS, CPOS];
                let seqType = AW = NOTHING;
                if (!factor_sub22()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                seqType |= AW;
                if (!expr()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                seqType |= AW;
                if (!factor_sub24()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                AW |= seqType;
                return true;
            },
            infer: () => {
                let seqType = AW = NOTHING;
                factor_sub22.infer();
                seqType |= AW;
                expr.infer();
                seqType |= AW;
                factor_sub24.infer();
                AW |= seqType;
            },
        },
        print: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ, ARₒ] = [APOS, CPOS, AR];
                if (!factor_sub22()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                if (!expr()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                if (!factor_sub24()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                return true;
            },
            infer: () => {
                factor_sub22.infer();
                expr.infer();
                factor_sub24.infer();
            },
        },
    });

    // ApplicationExpression
    const factor_sub22 = lazy(() => co(factor_sub23));

    // ByteExpression
    const factor_sub23 = createRule(mode, {
        parse: {
            full: function BYT() {
                let cc;
                if (CPOS >= CREP.length) return false;
                cc = CREP[CPOS];
                if (cc !== 0x28) return false;
                CPOS += 1;
                emitByte(cc);
                return true;
            },
            infer: () => {
                emitByte(0x28);
            },
        },
        print: {
            full: function BYT() {
                let cc;
                if (AR !== STRING) return false;
                if (APOS >= AREP.length) return false;
                cc = AREP[APOS];
                if (cc !== 0x28) return false;
                APOS += 1;
                CREP[CPOS++] = cc;
                return true;
            },
            infer: () => {
                CREP[CPOS++] = 0x28;
            },
        },
    });

    // ApplicationExpression
    const factor_sub24 = lazy(() => co(factor_sub25));

    // ByteExpression
    const factor_sub25 = createRule(mode, {
        parse: {
            full: function BYT() {
                let cc;
                if (CPOS >= CREP.length) return false;
                cc = CREP[CPOS];
                if (cc !== 0x29) return false;
                CPOS += 1;
                emitByte(cc);
                return true;
            },
            infer: () => {
                emitByte(0x29);
            },
        },
        print: {
            full: function BYT() {
                let cc;
                if (AR !== STRING) return false;
                if (APOS >= AREP.length) return false;
                cc = AREP[APOS];
                if (cc !== 0x29) return false;
                APOS += 1;
                CREP[CPOS++] = cc;
                return true;
            },
            infer: () => {
                CREP[CPOS++] = 0x29;
            },
        },
    });

    // FunctionExpression
    const ab = (ℙ1) => {

        // FunctionParameter
        const expr_2 = global.Object.assign(
            arg => ℙ1(arg),
            {infer: arg => ℙ1.infer(arg)},
        );

        // AbstractExpression
        const 𝕊1 = createRule(mode, {
            parse: {
                full: () => (expr_2.infer(), true),
                infer: () => expr_2.infer(),
            },
            print: {
                full: () => {
                    const CPOSₒ = CPOS;
                    const result = expr_2();
                    CPOS = CPOSₒ;
                    return result;
                },
                infer: () => {},
            },
        });

        return 𝕊1;
    };

    // FunctionExpression
    const co = (ℙ2) => {

        // FunctionParameter
        const expr_3 = global.Object.assign(
            arg => ℙ2(arg),
            {infer: arg => ℙ2.infer(arg)},
        );

        // ConcreteExpression
        const 𝕊2 = createRule(mode, {
            parse: {
                full: () => {
                    const [APOSₒ, AREPₒ] = [APOS, AREP];
                    const result = expr_3();
                    APOS = APOSₒ, AREP = AREPₒ, AW = NOTHING;
                    return result;
                },
                infer: () => (AW = NOTHING),
            },
            print: {
                full: () => (expr_3.infer(), true),
                infer: () => expr_3.infer(),
            },
        });

        return 𝕊2;
    };

    // Module
    const Ɱ_math = (member) => {
        switch (member) {
            case 'memoise': return memoise;
            case 'float': return float;
            case 'int': return int;
            case 'start': return start_2;
            case 'expr': return expr;
            case 'add': return add;
            case 'sub': return sub;
            case 'term': return term;
            case 'mul': return mul;
            case 'div': return div;
            case 'factor': return factor;
            case 'ab': return ab;
            case 'co': return co;
            default: return undefined;
        }
    };

    // Module
    const Ɱ_std = (member) => {
        switch (member) {
            case 'floatString': return floatString;
            case 'intString': return intString;
            case 'memoise': return memoise_2;
            default: return undefined;
        }
    };

    return start_2;
}
