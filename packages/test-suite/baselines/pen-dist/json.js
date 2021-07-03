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
            ATYP = LIST;
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
            ATYP = LIST;
            return true;
        },
        print: function LST() {
            if (ATYP !== LIST)
                return false;
            const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
            for (const listItem of listItems) {
                if (listItem.kind === 'Element') {
                    if (!printInner(listItem.expr, true))
                        return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
                }
                else {
                    ATYP = LIST;
                    if (!listItem.expr())
                        return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
                }
            }
            return true;
        },
        printDefault: function LST() {
            if (ATYP !== LIST && ATYP !== NOTHING)
                return false;
            const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
            for (const listItem of listItems) {
                if (listItem.kind === 'Element') {
                    if (!printDefaultInner(listItem.expr.default))
                        return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
                }
                else {
                    ATYP = LIST;
                    if (!listItem.expr.default())
                        return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
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
                        assert(ATYP === STRING);
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
            ATYP = RECORD;
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
                        assert(ATYP === STRING);
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
            ATYP = RECORD;
            return true;
        },
        print: function RCD() {
            if (ATYP !== RECORD)
                return false;
            const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
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
                    return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
                }
                else {
                    APOS = bitmask;
                    ATYP = RECORD;
                    if (!recordItem.expr())
                        return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
                    bitmask = APOS;
                }
            }
            APOS = bitmask;
            return true;
        },
        printDefault: function RCD() {
            if (ATYP !== RECORD && ATYP !== NOTHING)
                return false;
            const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
            for (const recordItem of recordItems) {
                if (recordItem.kind === 'Field') {
                    if (typeof recordItem.label !== 'string') {
                        if (!printDefaultInner(recordItem.label))
                            return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
                    }
                    if (!printDefaultInner(recordItem.expr))
                        return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
                }
                else {
                    ATYP = RECORD;
                    if (!recordItem.expr())
                        return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
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
let AREP;
let APOS;
let ATYP;
let CREP;
let CPOS;
const [NOTHING, SCALAR, STRING, LIST, RECORD] = [0, 1, 2, 4, 8];
const theScalarArray = [];
const theBuffer = Buffer.alloc(2 ** 10);
function emitScalar(value) {
    if (APOS === 0)
        AREP = theScalarArray;
    AREP[APOS++] = value;
    ATYP = SCALAR;
}
function emitByte(value) {
    if (APOS === 0)
        AREP = theBuffer;
    AREP[APOS++] = value;
    ATYP = STRING;
}
function emitBytes(...values) {
    if (APOS === 0)
        AREP = theBuffer;
    for (let i = 0; i < values.length; ++i)
        AREP[APOS++] = values[i];
    ATYP = STRING;
}
function parseInner(rule, mustProduce) {
    const [AREPₒ, APOSₒ] = [AREP, APOS];
    AREP = undefined;
    APOS = 0;
    if (!rule())
        return AREP = AREPₒ, APOS = APOSₒ, false;
    if (ATYP === NOTHING)
        return AREP = AREPₒ, APOS = APOSₒ, !mustProduce;
    let value;
    switch (ATYP) {
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
            ((atyp) => { throw new Error(`Unhandled abstract type ${atyp}`); })(ATYP);
    }
    AREPₒ[APOSₒ] = value;
    AREP = AREPₒ;
    APOS = APOSₒ + 1;
    return true;
}
function printInner(rule, mustConsume) {
    const [AREPₒ, APOSₒ, ATYPₒ] = [AREP, APOS, ATYP];
    let value = AREP[APOS];
    let atyp;
    if (value === undefined) {
        if (mustConsume)
            return false;
        ATYP = NOTHING;
        const result = rule();
        ATYP = ATYPₒ;
        assert(APOS === APOSₒ);
        return result;
    }
    if (value === null || value === true || value === false || typeof value === 'number') {
        ATYP = SCALAR;
        const result = rule();
        ATYP = ATYPₒ;
        assert(APOS - APOSₒ === 1);
        return result;
    }
    if (typeof value === 'string') {
        AREP = theBuffer.slice(0, theBuffer.write(value, 0));
        atyp = ATYP = STRING;
    }
    else if (Array.isArray(value)) {
        AREP = value;
        atyp = ATYP = LIST;
    }
    else if (typeof value === 'object') {
        const arr = AREP = [];
        const keys = Object.keys(value);
        assert(keys.length < 32);
        for (let i = 0; i < keys.length; ++i)
            arr.push(keys[i], value[keys[i]]);
        value = arr;
        atyp = ATYP = RECORD;
    }
    else {
        throw new Error(`Unsupported value type for value ${value}`);
    }
    APOS = 0;
    let result = rule();
    const [arep, apos] = [AREP, APOS];
    AREP = AREPₒ, APOS = APOSₒ, ATYP = ATYPₒ;
    if (!result)
        return false;
    if (atyp === RECORD) {
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
    const ATYPₒ = ATYP;
    ATYP = NOTHING;
    const result = rule();
    ATYP = ATYPₒ;
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
                parse: function FSTR() {
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
                parseDefault: function ISTR() {
                    emitScalar(0);
                    return true;
                },
                print: function FSTR() {
                    let out = '0';
                    // Ensure N is a number.
                    if (ATYP !== SCALAR)
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
                printDefault: function FSTR() {
                    CREP[CPOS++] = ZERO_DIGIT;
                    return true;
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
                    parse: function ISTR() {
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
                    parseDefault: function ISTR() {
                        emitScalar(0);
                        return true;
                    },
                    print: function ISTR() {
                        const digits = [];
                        if (ATYP !== SCALAR)
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
                    printDefault: function ISTR() {
                        CREP[CPOS++] = CHAR_CODES[0];
                        return true;
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
                    parse: function MEM() {
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
                                memo.ATYPᐟ = ATYP;
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
                                memo.ATYPᐟ = ATYP;
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
                        ATYP = memo.ATYPᐟ;
                        AREP !== null && AREP !== void 0 ? AREP : (AREP = ATYP === STRING ? theBuffer : []);
                        APOS = APOSₒ;
                        CPOS = memo.IPOSᐟ;
                        for (let i = 0; i < memo.OREPᐞ.length; ++i) {
                            AREP[APOS++] = memo.OREPᐞ[i];
                        }
                        return memo.result;
                    },
                    parseDefault: function MEM() {
                        // TODO: implement...
                        throw new Error('memoise parseDefault: Not implemented');
                    },
                    print: function MEM() {
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
                                memo.ATYPᐟ = ATYP;
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
                                memo.ATYPᐟ = ATYP;
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
                        ATYP = memo.ATYPᐟ;
                        return memo.result;
                    },
                    printDefault: function MEM() {
                        // TODO: implement...
                        throw new Error('memoise printDefault: Not implemented');
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
                    parse: function UNI() {
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
                    parseDefault: function UNI() {
                        // TODO: generate default value...
                        throw new Error('unicode parseDefault: Not implemented');
                    },
                    print: function UNI() {
                        // TODO: respect VOID AREP/CREP...
                        if (ATYP !== STRING)
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
                    printDefault: function UNI() {
                        // TODO: generate default value...
                        throw new Error('unicode printDefault: Not implemented');
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
        {default: arg => floatString_2.default(arg)},
    );

    // Identifier
    const unicode = global.Object.assign(
        arg => unicode_2(arg),
        {default: arg => unicode_2.default(arg)},
    );

    // SequenceExpression
    const start_2 = createRule(mode, {
        parse: () => {
            const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
            let seqType = NOTHING;
            ATYP = NOTHING;
            if (!WS()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            seqType |= ATYP;
            if (!Value()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            seqType |= ATYP;
            if (!WS()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            ATYP |= seqType;
            return true;
        },
        parseDefault: () => {
            const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
            let seqType = NOTHING;
            ATYP = NOTHING;
            if (!WS.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            seqType |= ATYP;
            if (!Value.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            seqType |= ATYP;
            if (!WS.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            ATYP |= seqType;
            return true;
        },
        print: () => {
            const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
            if (!WS()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            if (!Value()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            if (!WS()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            return true;
        },
        printDefault: () => {
            const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
            if (!WS.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            if (!Value.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            if (!WS.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            return true;
        },
    });

    // SelectionExpression
    const Value = createRule(mode, {
        parse: () => {
            if (False()) return true;
            if (Null()) return true;
            if (True()) return true;
            if (Object()) return true;
            if (Array()) return true;
            if (Number()) return true;
            if (String()) return true;
            return false;
        },
        parseDefault: () => {
            if (False.default()) return true;
            if (Null.default()) return true;
            if (True.default()) return true;
            if (Object.default()) return true;
            if (Array.default()) return true;
            if (Number.default()) return true;
            if (String.default()) return true;
            return false;
        },
        print: 'parse',
        printDefault: () => {
            if (False.default()) return true;
            if (Null.default()) return true;
            if (True.default()) return true;
            if (Object.default()) return true;
            if (Array.default()) return true;
            if (Number.default()) return true;
            if (String.default()) return true;
            return false;
        },
    });

    // SequenceExpression
    const False = createRule(mode, {
        parse: () => {
            const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
            let seqType = NOTHING;
            ATYP = NOTHING;
            if (!False_sub1()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            seqType |= ATYP;
            if (!False_sub2()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            ATYP |= seqType;
            return true;
        },
        parseDefault: () => {
            const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
            let seqType = NOTHING;
            ATYP = NOTHING;
            if (!False_sub1.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            seqType |= ATYP;
            if (!False_sub2.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            ATYP |= seqType;
            return true;
        },
        print: () => {
            const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
            if (!False_sub1()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            if (!False_sub2()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            return true;
        },
        printDefault: () => {
            const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
            if (!False_sub1.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            if (!False_sub2.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            return true;
        },
    });

    // StringLiteral
    const False_sub1 = createRule(mode, {
        parse: function STR() {
            if (CPOS + 5 > CREP.length) return false;
            if (CREP[CPOS + 0] !== 0x66) return false;
            if (CREP[CPOS + 1] !== 0x61) return false;
            if (CREP[CPOS + 2] !== 0x6c) return false;
            if (CREP[CPOS + 3] !== 0x73) return false;
            if (CREP[CPOS + 4] !== 0x65) return false;
            CPOS += 5;
            return true;
        },
        parseDefault: function STR() {
            emitBytes(0x66, 0x61, 0x6c, 0x73, 0x65);
            return true;
        },
        print: function STR() {
            CREP[CPOS++] = 0x66;
            CREP[CPOS++] = 0x61;
            CREP[CPOS++] = 0x6c;
            CREP[CPOS++] = 0x73;
            CREP[CPOS++] = 0x65;
            return true;
        },
        printDefault: function STR() {
            CREP[CPOS++] = 0x66;
            CREP[CPOS++] = 0x61;
            CREP[CPOS++] = 0x6c;
            CREP[CPOS++] = 0x73;
            CREP[CPOS++] = 0x65;
            return true;
        },
    });
    False_sub1.constant = {value: "false"};

    // BooleanLiteral
    const False_sub2 = createRule(mode, {
        parse: function LIT() {
            emitScalar(false);
            return true;
        },
        parseDefault: 'parse',
        print: function LIT() {
            if (ATYP !== SCALAR) return false;
            if (AREP[APOS] !== false) return false;
            APOS += 1;
            return true;
        },
        printDefault: function LIT() { return true; },
    });
    False_sub2.constant = {value: false};

    // SequenceExpression
    const Null = createRule(mode, {
        parse: () => {
            const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
            let seqType = NOTHING;
            ATYP = NOTHING;
            if (!Null_sub1()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            seqType |= ATYP;
            if (!Null_sub2()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            ATYP |= seqType;
            return true;
        },
        parseDefault: () => {
            const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
            let seqType = NOTHING;
            ATYP = NOTHING;
            if (!Null_sub1.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            seqType |= ATYP;
            if (!Null_sub2.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            ATYP |= seqType;
            return true;
        },
        print: () => {
            const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
            if (!Null_sub1()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            if (!Null_sub2()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            return true;
        },
        printDefault: () => {
            const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
            if (!Null_sub1.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            if (!Null_sub2.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            return true;
        },
    });

    // StringLiteral
    const Null_sub1 = createRule(mode, {
        parse: function STR() {
            if (CPOS + 4 > CREP.length) return false;
            if (CREP[CPOS + 0] !== 0x6e) return false;
            if (CREP[CPOS + 1] !== 0x75) return false;
            if (CREP[CPOS + 2] !== 0x6c) return false;
            if (CREP[CPOS + 3] !== 0x6c) return false;
            CPOS += 4;
            return true;
        },
        parseDefault: function STR() {
            emitBytes(0x6e, 0x75, 0x6c, 0x6c);
            return true;
        },
        print: function STR() {
            CREP[CPOS++] = 0x6e;
            CREP[CPOS++] = 0x75;
            CREP[CPOS++] = 0x6c;
            CREP[CPOS++] = 0x6c;
            return true;
        },
        printDefault: function STR() {
            CREP[CPOS++] = 0x6e;
            CREP[CPOS++] = 0x75;
            CREP[CPOS++] = 0x6c;
            CREP[CPOS++] = 0x6c;
            return true;
        },
    });
    Null_sub1.constant = {value: "null"};

    // NullLiteral
    const Null_sub2 = createRule(mode, {
        parse: function LIT() {
            emitScalar(null);
            return true;
        },
        parseDefault: 'parse',
        print: function LIT() {
            if (ATYP !== SCALAR) return false;
            if (AREP[APOS] !== null) return false;
            APOS += 1;
            return true;
        },
        printDefault: function LIT() { return true; },
    });
    Null_sub2.constant = {value: null};

    // SequenceExpression
    const True = createRule(mode, {
        parse: () => {
            const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
            let seqType = NOTHING;
            ATYP = NOTHING;
            if (!True_sub1()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            seqType |= ATYP;
            if (!True_sub2()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            ATYP |= seqType;
            return true;
        },
        parseDefault: () => {
            const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
            let seqType = NOTHING;
            ATYP = NOTHING;
            if (!True_sub1.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            seqType |= ATYP;
            if (!True_sub2.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            ATYP |= seqType;
            return true;
        },
        print: () => {
            const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
            if (!True_sub1()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            if (!True_sub2()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            return true;
        },
        printDefault: () => {
            const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
            if (!True_sub1.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            if (!True_sub2.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            return true;
        },
    });

    // StringLiteral
    const True_sub1 = createRule(mode, {
        parse: function STR() {
            if (CPOS + 4 > CREP.length) return false;
            if (CREP[CPOS + 0] !== 0x74) return false;
            if (CREP[CPOS + 1] !== 0x72) return false;
            if (CREP[CPOS + 2] !== 0x75) return false;
            if (CREP[CPOS + 3] !== 0x65) return false;
            CPOS += 4;
            return true;
        },
        parseDefault: function STR() {
            emitBytes(0x74, 0x72, 0x75, 0x65);
            return true;
        },
        print: function STR() {
            CREP[CPOS++] = 0x74;
            CREP[CPOS++] = 0x72;
            CREP[CPOS++] = 0x75;
            CREP[CPOS++] = 0x65;
            return true;
        },
        printDefault: function STR() {
            CREP[CPOS++] = 0x74;
            CREP[CPOS++] = 0x72;
            CREP[CPOS++] = 0x75;
            CREP[CPOS++] = 0x65;
            return true;
        },
    });
    True_sub1.constant = {value: "true"};

    // BooleanLiteral
    const True_sub2 = createRule(mode, {
        parse: function LIT() {
            emitScalar(true);
            return true;
        },
        parseDefault: 'parse',
        print: function LIT() {
            if (ATYP !== SCALAR) return false;
            if (AREP[APOS] !== true) return false;
            APOS += 1;
            return true;
        },
        printDefault: function LIT() { return true; },
    });
    True_sub2.constant = {value: true};

    // SequenceExpression
    const Object = createRule(mode, {
        parse: () => {
            const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
            let seqType = NOTHING;
            ATYP = NOTHING;
            if (!LBRACE()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            seqType |= ATYP;
            if (!Object_sub1()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            seqType |= ATYP;
            if (!RBRACE()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            ATYP |= seqType;
            return true;
        },
        parseDefault: () => {
            const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
            let seqType = NOTHING;
            ATYP = NOTHING;
            if (!LBRACE.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            seqType |= ATYP;
            if (!Object_sub1.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            seqType |= ATYP;
            if (!RBRACE.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            ATYP |= seqType;
            return true;
        },
        print: () => {
            const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
            if (!LBRACE()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            if (!Object_sub1()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            if (!RBRACE()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            return true;
        },
        printDefault: () => {
            const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
            if (!LBRACE.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            if (!Object_sub1.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            if (!RBRACE.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            return true;
        },
    });

    // SelectionExpression
    const Object_sub1 = createRule(mode, {
        parse: () => {
            if (Object_sub2()) return true;
            if (Object_sub9()) return true;
            return false;
        },
        parseDefault: () => {
            if (Object_sub2.default()) return true;
            if (Object_sub9.default()) return true;
            return false;
        },
        print: 'parse',
        printDefault: () => {
            if (Object_sub2.default()) return true;
            if (Object_sub9.default()) return true;
            return false;
        },
    });

    // SequenceExpression
    const Object_sub2 = createRule(mode, {
        parse: () => {
            const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
            let seqType = NOTHING;
            ATYP = NOTHING;
            if (!Object_sub3()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            seqType |= ATYP;
            if (!Object_sub5()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            ATYP |= seqType;
            return true;
        },
        parseDefault: () => {
            const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
            let seqType = NOTHING;
            ATYP = NOTHING;
            if (!Object_sub3.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            seqType |= ATYP;
            if (!Object_sub5.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            ATYP |= seqType;
            return true;
        },
        print: () => {
            const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
            if (!Object_sub3()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            if (!Object_sub5()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            return true;
        },
        printDefault: () => {
            const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
            if (!Object_sub3.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            if (!Object_sub5.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            return true;
        },
    });

    // RecordExpression
    const Object_sub3 = lazy(() => createRecord(mode, [
        {kind: 'Field', label: String, expr: Object_sub4},
    ]));

    // SequenceExpression
    const Object_sub4 = createRule(mode, {
        parse: () => {
            const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
            let seqType = NOTHING;
            ATYP = NOTHING;
            if (!COLON()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            seqType |= ATYP;
            if (!Value()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            ATYP |= seqType;
            return true;
        },
        parseDefault: () => {
            const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
            let seqType = NOTHING;
            ATYP = NOTHING;
            if (!COLON.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            seqType |= ATYP;
            if (!Value.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            ATYP |= seqType;
            return true;
        },
        print: () => {
            const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
            if (!COLON()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            if (!Value()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            return true;
        },
        printDefault: () => {
            const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
            if (!COLON.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            if (!Value.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            return true;
        },
    });

    // QuantifiedExpression
    const Object_sub5 = createRule(mode, {
        parse: () => {
            let [CPOSᐟ, APOSᐟ] = [CPOS, APOS];
            do {
                if (!Object_sub6()) break;
                if (CPOS <= CPOSᐟ) break;
                CPOSᐟ = CPOS, APOSᐟ = APOS;
            } while (true);
            CPOS = CPOSᐟ, APOS = APOSᐟ;
            return true;
        },
        print: () => {
            let [APOSᐟ, CPOSᐟ] = [APOS, CPOS];
            do {
                if (!Object_sub6()) break;
                if (APOS <= APOSᐟ) break;
                APOSᐟ = APOS, CPOSᐟ = CPOS;
            } while (true);
            APOS = APOSᐟ, CPOS = CPOSᐟ;
            return true;
        },
        parseDefault: () => true,
        printDefault: () => true,
    });

    // RecordExpression
    const Object_sub6 = lazy(() => createRecord(mode, [
        {kind: 'Field', label: Object_sub7, expr: Object_sub8},
    ]));

    // SequenceExpression
    const Object_sub7 = createRule(mode, {
        parse: () => {
            const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
            let seqType = NOTHING;
            ATYP = NOTHING;
            if (!COMMA()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            seqType |= ATYP;
            if (!String()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            ATYP |= seqType;
            return true;
        },
        parseDefault: () => {
            const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
            let seqType = NOTHING;
            ATYP = NOTHING;
            if (!COMMA.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            seqType |= ATYP;
            if (!String.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            ATYP |= seqType;
            return true;
        },
        print: () => {
            const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
            if (!COMMA()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            if (!String()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            return true;
        },
        printDefault: () => {
            const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
            if (!COMMA.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            if (!String.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            return true;
        },
    });

    // SequenceExpression
    const Object_sub8 = createRule(mode, {
        parse: () => {
            const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
            let seqType = NOTHING;
            ATYP = NOTHING;
            if (!COLON()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            seqType |= ATYP;
            if (!Value()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            ATYP |= seqType;
            return true;
        },
        parseDefault: () => {
            const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
            let seqType = NOTHING;
            ATYP = NOTHING;
            if (!COLON.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            seqType |= ATYP;
            if (!Value.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            ATYP |= seqType;
            return true;
        },
        print: () => {
            const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
            if (!COLON()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            if (!Value()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            return true;
        },
        printDefault: () => {
            const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
            if (!COLON.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            if (!Value.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            return true;
        },
    });

    // RecordExpression
    const Object_sub9 = lazy(() => createRecord(mode, []));

    // SequenceExpression
    const Object2 = createRule(mode, {
        parse: () => {
            const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
            let seqType = NOTHING;
            ATYP = NOTHING;
            if (!LBRACE()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            seqType |= ATYP;
            if (!Object2_sub1()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            seqType |= ATYP;
            if (!RBRACE()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            ATYP |= seqType;
            return true;
        },
        parseDefault: () => {
            const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
            let seqType = NOTHING;
            ATYP = NOTHING;
            if (!LBRACE.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            seqType |= ATYP;
            if (!Object2_sub1.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            seqType |= ATYP;
            if (!RBRACE.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            ATYP |= seqType;
            return true;
        },
        print: () => {
            const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
            if (!LBRACE()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            if (!Object2_sub1()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            if (!RBRACE()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            return true;
        },
        printDefault: () => {
            const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
            if (!LBRACE.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            if (!Object2_sub1.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            if (!RBRACE.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            return true;
        },
    });

    // SelectionExpression
    const Object2_sub1 = createRule(mode, {
        parse: () => {
            if (Properties()) return true;
            if (Object2_sub2()) return true;
            return false;
        },
        parseDefault: () => {
            if (Properties.default()) return true;
            if (Object2_sub2.default()) return true;
            return false;
        },
        print: 'parse',
        printDefault: () => {
            if (Properties.default()) return true;
            if (Object2_sub2.default()) return true;
            return false;
        },
    });

    // RecordExpression
    const Object2_sub2 = lazy(() => createRecord(mode, []));

    // RecordExpression
    const Properties = lazy(() => createRecord(mode, [
        {kind: 'Field', label: String, expr: Properties_sub1},
        {kind: 'Splice', label: undefined, expr: Properties_sub2},
    ]));

    // SequenceExpression
    const Properties_sub1 = createRule(mode, {
        parse: () => {
            const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
            let seqType = NOTHING;
            ATYP = NOTHING;
            if (!COLON()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            seqType |= ATYP;
            if (!Value()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            ATYP |= seqType;
            return true;
        },
        parseDefault: () => {
            const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
            let seqType = NOTHING;
            ATYP = NOTHING;
            if (!COLON.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            seqType |= ATYP;
            if (!Value.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            ATYP |= seqType;
            return true;
        },
        print: () => {
            const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
            if (!COLON()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            if (!Value()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            return true;
        },
        printDefault: () => {
            const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
            if (!COLON.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            if (!Value.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            return true;
        },
    });

    // SelectionExpression
    const Properties_sub2 = createRule(mode, {
        parse: () => {
            if (Properties_sub3()) return true;
            if (Properties_sub4()) return true;
            return false;
        },
        parseDefault: () => {
            if (Properties_sub3.default()) return true;
            if (Properties_sub4.default()) return true;
            return false;
        },
        print: 'parse',
        printDefault: () => {
            if (Properties_sub3.default()) return true;
            if (Properties_sub4.default()) return true;
            return false;
        },
    });

    // SequenceExpression
    const Properties_sub3 = createRule(mode, {
        parse: () => {
            const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
            let seqType = NOTHING;
            ATYP = NOTHING;
            if (!COMMA()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            seqType |= ATYP;
            if (!Properties()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            ATYP |= seqType;
            return true;
        },
        parseDefault: () => {
            const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
            let seqType = NOTHING;
            ATYP = NOTHING;
            if (!COMMA.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            seqType |= ATYP;
            if (!Properties.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            ATYP |= seqType;
            return true;
        },
        print: () => {
            const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
            if (!COMMA()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            if (!Properties()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            return true;
        },
        printDefault: () => {
            const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
            if (!COMMA.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            if (!Properties.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            return true;
        },
    });

    // RecordExpression
    const Properties_sub4 = lazy(() => createRecord(mode, []));

    // SequenceExpression
    const Array = createRule(mode, {
        parse: () => {
            const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
            let seqType = NOTHING;
            ATYP = NOTHING;
            if (!LBRACKET()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            seqType |= ATYP;
            if (!Array_sub1()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            seqType |= ATYP;
            if (!RBRACKET()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            ATYP |= seqType;
            return true;
        },
        parseDefault: () => {
            const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
            let seqType = NOTHING;
            ATYP = NOTHING;
            if (!LBRACKET.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            seqType |= ATYP;
            if (!Array_sub1.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            seqType |= ATYP;
            if (!RBRACKET.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            ATYP |= seqType;
            return true;
        },
        print: () => {
            const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
            if (!LBRACKET()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            if (!Array_sub1()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            if (!RBRACKET()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            return true;
        },
        printDefault: () => {
            const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
            if (!LBRACKET.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            if (!Array_sub1.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            if (!RBRACKET.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            return true;
        },
    });

    // SelectionExpression
    const Array_sub1 = createRule(mode, {
        parse: () => {
            if (Array_sub2()) return true;
            if (Array_sub7()) return true;
            return false;
        },
        parseDefault: () => {
            if (Array_sub2.default()) return true;
            if (Array_sub7.default()) return true;
            return false;
        },
        print: 'parse',
        printDefault: () => {
            if (Array_sub2.default()) return true;
            if (Array_sub7.default()) return true;
            return false;
        },
    });

    // SequenceExpression
    const Array_sub2 = createRule(mode, {
        parse: () => {
            const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
            let seqType = NOTHING;
            ATYP = NOTHING;
            if (!Array_sub3()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            seqType |= ATYP;
            if (!Array_sub4()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            ATYP |= seqType;
            return true;
        },
        parseDefault: () => {
            const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
            let seqType = NOTHING;
            ATYP = NOTHING;
            if (!Array_sub3.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            seqType |= ATYP;
            if (!Array_sub4.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            ATYP |= seqType;
            return true;
        },
        print: () => {
            const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
            if (!Array_sub3()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            if (!Array_sub4()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            return true;
        },
        printDefault: () => {
            const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
            if (!Array_sub3.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            if (!Array_sub4.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            return true;
        },
    });

    // ListExpression
    const Array_sub3 = lazy(() => createList(mode, [
        {kind: 'Element', expr: Value},
    ]));

    // QuantifiedExpression
    const Array_sub4 = createRule(mode, {
        parse: () => {
            let [CPOSᐟ, APOSᐟ] = [CPOS, APOS];
            do {
                if (!Array_sub5()) break;
                if (CPOS <= CPOSᐟ) break;
                CPOSᐟ = CPOS, APOSᐟ = APOS;
            } while (true);
            CPOS = CPOSᐟ, APOS = APOSᐟ;
            return true;
        },
        print: () => {
            let [APOSᐟ, CPOSᐟ] = [APOS, CPOS];
            do {
                if (!Array_sub5()) break;
                if (APOS <= APOSᐟ) break;
                APOSᐟ = APOS, CPOSᐟ = CPOS;
            } while (true);
            APOS = APOSᐟ, CPOS = CPOSᐟ;
            return true;
        },
        parseDefault: () => true,
        printDefault: () => true,
    });

    // ListExpression
    const Array_sub5 = lazy(() => createList(mode, [
        {kind: 'Element', expr: Array_sub6},
    ]));

    // SequenceExpression
    const Array_sub6 = createRule(mode, {
        parse: () => {
            const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
            let seqType = NOTHING;
            ATYP = NOTHING;
            if (!COMMA()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            seqType |= ATYP;
            if (!Value()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            ATYP |= seqType;
            return true;
        },
        parseDefault: () => {
            const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
            let seqType = NOTHING;
            ATYP = NOTHING;
            if (!COMMA.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            seqType |= ATYP;
            if (!Value.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            ATYP |= seqType;
            return true;
        },
        print: () => {
            const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
            if (!COMMA()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            if (!Value()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            return true;
        },
        printDefault: () => {
            const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
            if (!COMMA.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            if (!Value.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            return true;
        },
    });

    // ListExpression
    const Array_sub7 = lazy(() => createList(mode, []));

    // SequenceExpression
    const Array2 = createRule(mode, {
        parse: () => {
            const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
            let seqType = NOTHING;
            ATYP = NOTHING;
            if (!LBRACKET()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            seqType |= ATYP;
            if (!Array2_sub1()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            seqType |= ATYP;
            if (!RBRACKET()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            ATYP |= seqType;
            return true;
        },
        parseDefault: () => {
            const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
            let seqType = NOTHING;
            ATYP = NOTHING;
            if (!LBRACKET.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            seqType |= ATYP;
            if (!Array2_sub1.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            seqType |= ATYP;
            if (!RBRACKET.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            ATYP |= seqType;
            return true;
        },
        print: () => {
            const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
            if (!LBRACKET()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            if (!Array2_sub1()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            if (!RBRACKET()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            return true;
        },
        printDefault: () => {
            const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
            if (!LBRACKET.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            if (!Array2_sub1.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            if (!RBRACKET.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            return true;
        },
    });

    // SelectionExpression
    const Array2_sub1 = createRule(mode, {
        parse: () => {
            if (Elements()) return true;
            if (Array2_sub2()) return true;
            return false;
        },
        parseDefault: () => {
            if (Elements.default()) return true;
            if (Array2_sub2.default()) return true;
            return false;
        },
        print: 'parse',
        printDefault: () => {
            if (Elements.default()) return true;
            if (Array2_sub2.default()) return true;
            return false;
        },
    });

    // ListExpression
    const Array2_sub2 = lazy(() => createList(mode, []));

    // ListExpression
    const Elements = lazy(() => createList(mode, [
        {kind: 'Element', expr: Value},
        {kind: 'Splice', expr: Elements_sub1},
    ]));

    // SelectionExpression
    const Elements_sub1 = createRule(mode, {
        parse: () => {
            if (Elements_sub2()) return true;
            if (Elements_sub3()) return true;
            return false;
        },
        parseDefault: () => {
            if (Elements_sub2.default()) return true;
            if (Elements_sub3.default()) return true;
            return false;
        },
        print: 'parse',
        printDefault: () => {
            if (Elements_sub2.default()) return true;
            if (Elements_sub3.default()) return true;
            return false;
        },
    });

    // SequenceExpression
    const Elements_sub2 = createRule(mode, {
        parse: () => {
            const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
            let seqType = NOTHING;
            ATYP = NOTHING;
            if (!COMMA()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            seqType |= ATYP;
            if (!Elements()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            ATYP |= seqType;
            return true;
        },
        parseDefault: () => {
            const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
            let seqType = NOTHING;
            ATYP = NOTHING;
            if (!COMMA.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            seqType |= ATYP;
            if (!Elements.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            ATYP |= seqType;
            return true;
        },
        print: () => {
            const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
            if (!COMMA()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            if (!Elements()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            return true;
        },
        printDefault: () => {
            const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
            if (!COMMA.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            if (!Elements.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            return true;
        },
    });

    // ListExpression
    const Elements_sub3 = lazy(() => createList(mode, []));

    // Identifier
    const Number = global.Object.assign(
        arg => floatString(arg),
        {default: arg => floatString.default(arg)},
    );

    // SequenceExpression
    const String = createRule(mode, {
        parse: () => {
            const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
            let seqType = NOTHING;
            ATYP = NOTHING;
            if (!DOUBLE_QUOTE()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            seqType |= ATYP;
            if (!String_sub1()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            seqType |= ATYP;
            if (!DOUBLE_QUOTE()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            ATYP |= seqType;
            return true;
        },
        parseDefault: () => {
            const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
            let seqType = NOTHING;
            ATYP = NOTHING;
            if (!DOUBLE_QUOTE.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            seqType |= ATYP;
            if (!String_sub1.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            seqType |= ATYP;
            if (!DOUBLE_QUOTE.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            ATYP |= seqType;
            return true;
        },
        print: () => {
            const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
            if (!DOUBLE_QUOTE()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            if (!String_sub1()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            if (!DOUBLE_QUOTE()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            return true;
        },
        printDefault: () => {
            const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
            if (!DOUBLE_QUOTE.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            if (!String_sub1.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            if (!DOUBLE_QUOTE.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            return true;
        },
    });

    // QuantifiedExpression
    const String_sub1 = createRule(mode, {
        parse: () => {
            let [CPOSᐟ, APOSᐟ] = [CPOS, APOS];
            do {
                if (!CHAR()) break;
                if (CPOS <= CPOSᐟ) break;
                CPOSᐟ = CPOS, APOSᐟ = APOS;
            } while (true);
            CPOS = CPOSᐟ, APOS = APOSᐟ;
            return true;
        },
        print: () => {
            let [APOSᐟ, CPOSᐟ] = [APOS, CPOS];
            do {
                if (!CHAR()) break;
                if (APOS <= APOSᐟ) break;
                APOSᐟ = APOS, CPOSᐟ = CPOS;
            } while (true);
            APOS = APOSᐟ, CPOS = CPOSᐟ;
            return true;
        },
        parseDefault: () => true,
        printDefault: () => true,
    });

    // NumericLiteral
    const base = createRule(mode, {
        parse: function LIT() {
            emitScalar(16);
            return true;
        },
        parseDefault: 'parse',
        print: function LIT() {
            if (ATYP !== SCALAR) return false;
            if (AREP[APOS] !== 16) return false;
            APOS += 1;
            return true;
        },
        printDefault: function LIT() { return true; },
    });
    base.constant = {value: 16};

    // NumericLiteral
    const minDigits = createRule(mode, {
        parse: function LIT() {
            emitScalar(4);
            return true;
        },
        parseDefault: 'parse',
        print: function LIT() {
            if (ATYP !== SCALAR) return false;
            if (AREP[APOS] !== 4) return false;
            APOS += 1;
            return true;
        },
        printDefault: function LIT() { return true; },
    });
    minDigits.constant = {value: 4};

    // NumericLiteral
    const maxDigits = createRule(mode, {
        parse: function LIT() {
            emitScalar(4);
            return true;
        },
        parseDefault: 'parse',
        print: function LIT() {
            if (ATYP !== SCALAR) return false;
            if (AREP[APOS] !== 4) return false;
            APOS += 1;
            return true;
        },
        printDefault: function LIT() { return true; },
    });
    maxDigits.constant = {value: 4};

    // SelectionExpression
    const CHAR = createRule(mode, {
        parse: () => {
            if (CHAR_sub1()) return true;
            if (CHAR_sub2()) return true;
            if (CHAR_sub5()) return true;
            if (CHAR_sub9()) return true;
            if (CHAR_sub14()) return true;
            if (CHAR_sub17()) return true;
            if (CHAR_sub20()) return true;
            if (CHAR_sub23()) return true;
            if (CHAR_sub26()) return true;
            if (CHAR_sub29()) return true;
            if (CHAR_sub32()) return true;
            if (CHAR_sub35()) return true;
            if (CHAR_sub38()) return true;
            return false;
        },
        parseDefault: () => {
            if (CHAR_sub1.default()) return true;
            if (CHAR_sub2.default()) return true;
            if (CHAR_sub5.default()) return true;
            if (CHAR_sub9.default()) return true;
            if (CHAR_sub14.default()) return true;
            if (CHAR_sub17.default()) return true;
            if (CHAR_sub20.default()) return true;
            if (CHAR_sub23.default()) return true;
            if (CHAR_sub26.default()) return true;
            if (CHAR_sub29.default()) return true;
            if (CHAR_sub32.default()) return true;
            if (CHAR_sub35.default()) return true;
            if (CHAR_sub38.default()) return true;
            return false;
        },
        print: 'parse',
        printDefault: () => {
            if (CHAR_sub1.default()) return true;
            if (CHAR_sub2.default()) return true;
            if (CHAR_sub5.default()) return true;
            if (CHAR_sub9.default()) return true;
            if (CHAR_sub14.default()) return true;
            if (CHAR_sub17.default()) return true;
            if (CHAR_sub20.default()) return true;
            if (CHAR_sub23.default()) return true;
            if (CHAR_sub26.default()) return true;
            if (CHAR_sub29.default()) return true;
            if (CHAR_sub32.default()) return true;
            if (CHAR_sub35.default()) return true;
            if (CHAR_sub38.default()) return true;
            return false;
        },
    });

    // ByteExpression
    const CHAR_sub1 = createRule(mode, {
        parse: function BYT() {
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
        parseDefault: function BYT() {
            let cc;
            cc = 0x20;
            emitByte(cc);
            return true;
        },
        print: function BYT() {
            let cc;
            if (ATYP !== STRING) return false;
            if (APOS >= AREP.length) return false;
            cc = AREP[APOS];
            if (cc === 0x5c) return false;
            if (cc === 0x22) return false;
            if ((cc < 0x20 || cc > 0x7f)) return false;
            APOS += 1;
            CREP[CPOS++] = cc;
            return true;
        },
        printDefault: function BYT() {
            let cc;
            cc = 0x20;
            CREP[CPOS++] = cc;
            return true;
        },
    });

    // SequenceExpression
    const CHAR_sub2 = createRule(mode, {
        parse: () => {
            const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
            let seqType = NOTHING;
            ATYP = NOTHING;
            if (!CHAR_sub3()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            seqType |= ATYP;
            if (!CHAR_sub4()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            ATYP |= seqType;
            return true;
        },
        parseDefault: () => {
            const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
            let seqType = NOTHING;
            ATYP = NOTHING;
            if (!CHAR_sub3.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            seqType |= ATYP;
            if (!CHAR_sub4.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            ATYP |= seqType;
            return true;
        },
        print: () => {
            const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
            if (!CHAR_sub3()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            if (!CHAR_sub4()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            return true;
        },
        printDefault: () => {
            const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
            if (!CHAR_sub3.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            if (!CHAR_sub4.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            return true;
        },
    });

    // ByteExpression
    const CHAR_sub3 = createRule(mode, {
        parse: function BYT() {
            let cc;
            if (CPOS >= CREP.length) return false;
            cc = CREP[CPOS];
            if ((cc < 0xc0 || cc > 0xdf)) return false;
            CPOS += 1;
            emitByte(cc);
            return true;
        },
        parseDefault: function BYT() {
            let cc;
            cc = 0xc0;
            emitByte(cc);
            return true;
        },
        print: function BYT() {
            let cc;
            if (ATYP !== STRING) return false;
            if (APOS >= AREP.length) return false;
            cc = AREP[APOS];
            if ((cc < 0xc0 || cc > 0xdf)) return false;
            APOS += 1;
            CREP[CPOS++] = cc;
            return true;
        },
        printDefault: function BYT() {
            let cc;
            cc = 0xc0;
            CREP[CPOS++] = cc;
            return true;
        },
    });

    // ByteExpression
    const CHAR_sub4 = createRule(mode, {
        parse: function BYT() {
            let cc;
            if (CPOS >= CREP.length) return false;
            cc = CREP[CPOS];
            if ((cc < 0x80 || cc > 0xbf)) return false;
            CPOS += 1;
            emitByte(cc);
            return true;
        },
        parseDefault: function BYT() {
            let cc;
            cc = 0x80;
            emitByte(cc);
            return true;
        },
        print: function BYT() {
            let cc;
            if (ATYP !== STRING) return false;
            if (APOS >= AREP.length) return false;
            cc = AREP[APOS];
            if ((cc < 0x80 || cc > 0xbf)) return false;
            APOS += 1;
            CREP[CPOS++] = cc;
            return true;
        },
        printDefault: function BYT() {
            let cc;
            cc = 0x80;
            CREP[CPOS++] = cc;
            return true;
        },
    });

    // SequenceExpression
    const CHAR_sub5 = createRule(mode, {
        parse: () => {
            const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
            let seqType = NOTHING;
            ATYP = NOTHING;
            if (!CHAR_sub6()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            seqType |= ATYP;
            if (!CHAR_sub7()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            seqType |= ATYP;
            if (!CHAR_sub8()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            ATYP |= seqType;
            return true;
        },
        parseDefault: () => {
            const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
            let seqType = NOTHING;
            ATYP = NOTHING;
            if (!CHAR_sub6.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            seqType |= ATYP;
            if (!CHAR_sub7.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            seqType |= ATYP;
            if (!CHAR_sub8.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            ATYP |= seqType;
            return true;
        },
        print: () => {
            const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
            if (!CHAR_sub6()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            if (!CHAR_sub7()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            if (!CHAR_sub8()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            return true;
        },
        printDefault: () => {
            const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
            if (!CHAR_sub6.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            if (!CHAR_sub7.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            if (!CHAR_sub8.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            return true;
        },
    });

    // ByteExpression
    const CHAR_sub6 = createRule(mode, {
        parse: function BYT() {
            let cc;
            if (CPOS >= CREP.length) return false;
            cc = CREP[CPOS];
            if ((cc < 0xe0 || cc > 0xef)) return false;
            CPOS += 1;
            emitByte(cc);
            return true;
        },
        parseDefault: function BYT() {
            let cc;
            cc = 0xe0;
            emitByte(cc);
            return true;
        },
        print: function BYT() {
            let cc;
            if (ATYP !== STRING) return false;
            if (APOS >= AREP.length) return false;
            cc = AREP[APOS];
            if ((cc < 0xe0 || cc > 0xef)) return false;
            APOS += 1;
            CREP[CPOS++] = cc;
            return true;
        },
        printDefault: function BYT() {
            let cc;
            cc = 0xe0;
            CREP[CPOS++] = cc;
            return true;
        },
    });

    // ByteExpression
    const CHAR_sub7 = createRule(mode, {
        parse: function BYT() {
            let cc;
            if (CPOS >= CREP.length) return false;
            cc = CREP[CPOS];
            if ((cc < 0x80 || cc > 0xbf)) return false;
            CPOS += 1;
            emitByte(cc);
            return true;
        },
        parseDefault: function BYT() {
            let cc;
            cc = 0x80;
            emitByte(cc);
            return true;
        },
        print: function BYT() {
            let cc;
            if (ATYP !== STRING) return false;
            if (APOS >= AREP.length) return false;
            cc = AREP[APOS];
            if ((cc < 0x80 || cc > 0xbf)) return false;
            APOS += 1;
            CREP[CPOS++] = cc;
            return true;
        },
        printDefault: function BYT() {
            let cc;
            cc = 0x80;
            CREP[CPOS++] = cc;
            return true;
        },
    });

    // ByteExpression
    const CHAR_sub8 = createRule(mode, {
        parse: function BYT() {
            let cc;
            if (CPOS >= CREP.length) return false;
            cc = CREP[CPOS];
            if ((cc < 0x80 || cc > 0xbf)) return false;
            CPOS += 1;
            emitByte(cc);
            return true;
        },
        parseDefault: function BYT() {
            let cc;
            cc = 0x80;
            emitByte(cc);
            return true;
        },
        print: function BYT() {
            let cc;
            if (ATYP !== STRING) return false;
            if (APOS >= AREP.length) return false;
            cc = AREP[APOS];
            if ((cc < 0x80 || cc > 0xbf)) return false;
            APOS += 1;
            CREP[CPOS++] = cc;
            return true;
        },
        printDefault: function BYT() {
            let cc;
            cc = 0x80;
            CREP[CPOS++] = cc;
            return true;
        },
    });

    // SequenceExpression
    const CHAR_sub9 = createRule(mode, {
        parse: () => {
            const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
            let seqType = NOTHING;
            ATYP = NOTHING;
            if (!CHAR_sub10()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            seqType |= ATYP;
            if (!CHAR_sub11()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            seqType |= ATYP;
            if (!CHAR_sub12()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            seqType |= ATYP;
            if (!CHAR_sub13()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            ATYP |= seqType;
            return true;
        },
        parseDefault: () => {
            const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
            let seqType = NOTHING;
            ATYP = NOTHING;
            if (!CHAR_sub10.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            seqType |= ATYP;
            if (!CHAR_sub11.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            seqType |= ATYP;
            if (!CHAR_sub12.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            seqType |= ATYP;
            if (!CHAR_sub13.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            ATYP |= seqType;
            return true;
        },
        print: () => {
            const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
            if (!CHAR_sub10()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            if (!CHAR_sub11()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            if (!CHAR_sub12()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            if (!CHAR_sub13()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            return true;
        },
        printDefault: () => {
            const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
            if (!CHAR_sub10.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            if (!CHAR_sub11.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            if (!CHAR_sub12.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            if (!CHAR_sub13.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            return true;
        },
    });

    // ByteExpression
    const CHAR_sub10 = createRule(mode, {
        parse: function BYT() {
            let cc;
            if (CPOS >= CREP.length) return false;
            cc = CREP[CPOS];
            if ((cc < 0xf0 || cc > 0xf7)) return false;
            CPOS += 1;
            emitByte(cc);
            return true;
        },
        parseDefault: function BYT() {
            let cc;
            cc = 0xf0;
            emitByte(cc);
            return true;
        },
        print: function BYT() {
            let cc;
            if (ATYP !== STRING) return false;
            if (APOS >= AREP.length) return false;
            cc = AREP[APOS];
            if ((cc < 0xf0 || cc > 0xf7)) return false;
            APOS += 1;
            CREP[CPOS++] = cc;
            return true;
        },
        printDefault: function BYT() {
            let cc;
            cc = 0xf0;
            CREP[CPOS++] = cc;
            return true;
        },
    });

    // ByteExpression
    const CHAR_sub11 = createRule(mode, {
        parse: function BYT() {
            let cc;
            if (CPOS >= CREP.length) return false;
            cc = CREP[CPOS];
            if ((cc < 0x80 || cc > 0xbf)) return false;
            CPOS += 1;
            emitByte(cc);
            return true;
        },
        parseDefault: function BYT() {
            let cc;
            cc = 0x80;
            emitByte(cc);
            return true;
        },
        print: function BYT() {
            let cc;
            if (ATYP !== STRING) return false;
            if (APOS >= AREP.length) return false;
            cc = AREP[APOS];
            if ((cc < 0x80 || cc > 0xbf)) return false;
            APOS += 1;
            CREP[CPOS++] = cc;
            return true;
        },
        printDefault: function BYT() {
            let cc;
            cc = 0x80;
            CREP[CPOS++] = cc;
            return true;
        },
    });

    // ByteExpression
    const CHAR_sub12 = createRule(mode, {
        parse: function BYT() {
            let cc;
            if (CPOS >= CREP.length) return false;
            cc = CREP[CPOS];
            if ((cc < 0x80 || cc > 0xbf)) return false;
            CPOS += 1;
            emitByte(cc);
            return true;
        },
        parseDefault: function BYT() {
            let cc;
            cc = 0x80;
            emitByte(cc);
            return true;
        },
        print: function BYT() {
            let cc;
            if (ATYP !== STRING) return false;
            if (APOS >= AREP.length) return false;
            cc = AREP[APOS];
            if ((cc < 0x80 || cc > 0xbf)) return false;
            APOS += 1;
            CREP[CPOS++] = cc;
            return true;
        },
        printDefault: function BYT() {
            let cc;
            cc = 0x80;
            CREP[CPOS++] = cc;
            return true;
        },
    });

    // ByteExpression
    const CHAR_sub13 = createRule(mode, {
        parse: function BYT() {
            let cc;
            if (CPOS >= CREP.length) return false;
            cc = CREP[CPOS];
            if ((cc < 0x80 || cc > 0xbf)) return false;
            CPOS += 1;
            emitByte(cc);
            return true;
        },
        parseDefault: function BYT() {
            let cc;
            cc = 0x80;
            emitByte(cc);
            return true;
        },
        print: function BYT() {
            let cc;
            if (ATYP !== STRING) return false;
            if (APOS >= AREP.length) return false;
            cc = AREP[APOS];
            if ((cc < 0x80 || cc > 0xbf)) return false;
            APOS += 1;
            CREP[CPOS++] = cc;
            return true;
        },
        printDefault: function BYT() {
            let cc;
            cc = 0x80;
            CREP[CPOS++] = cc;
            return true;
        },
    });

    // SequenceExpression
    const CHAR_sub14 = createRule(mode, {
        parse: () => {
            const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
            let seqType = NOTHING;
            ATYP = NOTHING;
            if (!CHAR_sub15()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            seqType |= ATYP;
            if (!CHAR_sub16()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            ATYP |= seqType;
            return true;
        },
        parseDefault: () => {
            const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
            let seqType = NOTHING;
            ATYP = NOTHING;
            if (!CHAR_sub15.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            seqType |= ATYP;
            if (!CHAR_sub16.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            ATYP |= seqType;
            return true;
        },
        print: () => {
            const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
            if (!CHAR_sub15()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            if (!CHAR_sub16()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            return true;
        },
        printDefault: () => {
            const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
            if (!CHAR_sub15.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            if (!CHAR_sub16.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            return true;
        },
    });

    // StringLiteral
    const CHAR_sub15 = createRule(mode, {
        parse: function STR() {
            if (CPOS + 2 > CREP.length) return false;
            if (CREP[CPOS + 0] !== 0x5c) return false;
            if (CREP[CPOS + 1] !== 0x22) return false;
            CPOS += 2;
            return true;
        },
        parseDefault: function STR() {
            emitBytes(0x5c, 0x22);
            return true;
        },
        print: function STR() {
            CREP[CPOS++] = 0x5c;
            CREP[CPOS++] = 0x22;
            return true;
        },
        printDefault: function STR() {
            CREP[CPOS++] = 0x5c;
            CREP[CPOS++] = 0x22;
            return true;
        },
    });
    CHAR_sub15.constant = {value: "\\\""};

    // ByteExpression
    const CHAR_sub16 = createRule(mode, {
        parse: function BYT() {
            let cc;
            cc = 0x22;
            emitByte(cc);
            return true;
        },
        parseDefault: function BYT() {
            let cc;
            cc = 0x22;
            emitByte(cc);
            return true;
        },
        print: function BYT() {
            let cc;
            if (ATYP !== STRING) return false;
            if (APOS >= AREP.length) return false;
            cc = AREP[APOS];
            if (cc !== 0x22) return false;
            APOS += 1;
            return true;
        },
        printDefault: function BYT() {
            let cc;
            cc = 0x22;
            CREP[CPOS++] = cc;
            return true;
        },
    });

    // SequenceExpression
    const CHAR_sub17 = createRule(mode, {
        parse: () => {
            const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
            let seqType = NOTHING;
            ATYP = NOTHING;
            if (!CHAR_sub18()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            seqType |= ATYP;
            if (!CHAR_sub19()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            ATYP |= seqType;
            return true;
        },
        parseDefault: () => {
            const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
            let seqType = NOTHING;
            ATYP = NOTHING;
            if (!CHAR_sub18.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            seqType |= ATYP;
            if (!CHAR_sub19.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            ATYP |= seqType;
            return true;
        },
        print: () => {
            const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
            if (!CHAR_sub18()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            if (!CHAR_sub19()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            return true;
        },
        printDefault: () => {
            const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
            if (!CHAR_sub18.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            if (!CHAR_sub19.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            return true;
        },
    });

    // StringLiteral
    const CHAR_sub18 = createRule(mode, {
        parse: function STR() {
            if (CPOS + 2 > CREP.length) return false;
            if (CREP[CPOS + 0] !== 0x5c) return false;
            if (CREP[CPOS + 1] !== 0x5c) return false;
            CPOS += 2;
            return true;
        },
        parseDefault: function STR() {
            emitBytes(0x5c, 0x5c);
            return true;
        },
        print: function STR() {
            CREP[CPOS++] = 0x5c;
            CREP[CPOS++] = 0x5c;
            return true;
        },
        printDefault: function STR() {
            CREP[CPOS++] = 0x5c;
            CREP[CPOS++] = 0x5c;
            return true;
        },
    });
    CHAR_sub18.constant = {value: "\\\\"};

    // ByteExpression
    const CHAR_sub19 = createRule(mode, {
        parse: function BYT() {
            let cc;
            cc = 0x5c;
            emitByte(cc);
            return true;
        },
        parseDefault: function BYT() {
            let cc;
            cc = 0x5c;
            emitByte(cc);
            return true;
        },
        print: function BYT() {
            let cc;
            if (ATYP !== STRING) return false;
            if (APOS >= AREP.length) return false;
            cc = AREP[APOS];
            if (cc !== 0x5c) return false;
            APOS += 1;
            return true;
        },
        printDefault: function BYT() {
            let cc;
            cc = 0x5c;
            CREP[CPOS++] = cc;
            return true;
        },
    });

    // SequenceExpression
    const CHAR_sub20 = createRule(mode, {
        parse: () => {
            const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
            let seqType = NOTHING;
            ATYP = NOTHING;
            if (!CHAR_sub21()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            seqType |= ATYP;
            if (!CHAR_sub22()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            ATYP |= seqType;
            return true;
        },
        parseDefault: () => {
            const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
            let seqType = NOTHING;
            ATYP = NOTHING;
            if (!CHAR_sub21.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            seqType |= ATYP;
            if (!CHAR_sub22.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            ATYP |= seqType;
            return true;
        },
        print: () => {
            const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
            if (!CHAR_sub21()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            if (!CHAR_sub22()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            return true;
        },
        printDefault: () => {
            const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
            if (!CHAR_sub21.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            if (!CHAR_sub22.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            return true;
        },
    });

    // StringLiteral
    const CHAR_sub21 = createRule(mode, {
        parse: function STR() {
            if (CPOS + 2 > CREP.length) return false;
            if (CREP[CPOS + 0] !== 0x5c) return false;
            if (CREP[CPOS + 1] !== 0x2f) return false;
            CPOS += 2;
            return true;
        },
        parseDefault: function STR() {
            emitBytes(0x5c, 0x2f);
            return true;
        },
        print: function STR() {
            CREP[CPOS++] = 0x5c;
            CREP[CPOS++] = 0x2f;
            return true;
        },
        printDefault: function STR() {
            CREP[CPOS++] = 0x5c;
            CREP[CPOS++] = 0x2f;
            return true;
        },
    });
    CHAR_sub21.constant = {value: "\\/"};

    // ByteExpression
    const CHAR_sub22 = createRule(mode, {
        parse: function BYT() {
            let cc;
            cc = 0x2f;
            emitByte(cc);
            return true;
        },
        parseDefault: function BYT() {
            let cc;
            cc = 0x2f;
            emitByte(cc);
            return true;
        },
        print: function BYT() {
            let cc;
            if (ATYP !== STRING) return false;
            if (APOS >= AREP.length) return false;
            cc = AREP[APOS];
            if (cc !== 0x2f) return false;
            APOS += 1;
            return true;
        },
        printDefault: function BYT() {
            let cc;
            cc = 0x2f;
            CREP[CPOS++] = cc;
            return true;
        },
    });

    // SequenceExpression
    const CHAR_sub23 = createRule(mode, {
        parse: () => {
            const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
            let seqType = NOTHING;
            ATYP = NOTHING;
            if (!CHAR_sub24()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            seqType |= ATYP;
            if (!CHAR_sub25()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            ATYP |= seqType;
            return true;
        },
        parseDefault: () => {
            const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
            let seqType = NOTHING;
            ATYP = NOTHING;
            if (!CHAR_sub24.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            seqType |= ATYP;
            if (!CHAR_sub25.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            ATYP |= seqType;
            return true;
        },
        print: () => {
            const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
            if (!CHAR_sub24()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            if (!CHAR_sub25()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            return true;
        },
        printDefault: () => {
            const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
            if (!CHAR_sub24.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            if (!CHAR_sub25.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            return true;
        },
    });

    // StringLiteral
    const CHAR_sub24 = createRule(mode, {
        parse: function STR() {
            if (CPOS + 2 > CREP.length) return false;
            if (CREP[CPOS + 0] !== 0x5c) return false;
            if (CREP[CPOS + 1] !== 0x62) return false;
            CPOS += 2;
            return true;
        },
        parseDefault: function STR() {
            emitBytes(0x5c, 0x62);
            return true;
        },
        print: function STR() {
            CREP[CPOS++] = 0x5c;
            CREP[CPOS++] = 0x62;
            return true;
        },
        printDefault: function STR() {
            CREP[CPOS++] = 0x5c;
            CREP[CPOS++] = 0x62;
            return true;
        },
    });
    CHAR_sub24.constant = {value: "\\b"};

    // ByteExpression
    const CHAR_sub25 = createRule(mode, {
        parse: function BYT() {
            let cc;
            cc = 0x08;
            emitByte(cc);
            return true;
        },
        parseDefault: function BYT() {
            let cc;
            cc = 0x08;
            emitByte(cc);
            return true;
        },
        print: function BYT() {
            let cc;
            if (ATYP !== STRING) return false;
            if (APOS >= AREP.length) return false;
            cc = AREP[APOS];
            if (cc !== 0x08) return false;
            APOS += 1;
            return true;
        },
        printDefault: function BYT() {
            let cc;
            cc = 0x08;
            CREP[CPOS++] = cc;
            return true;
        },
    });

    // SequenceExpression
    const CHAR_sub26 = createRule(mode, {
        parse: () => {
            const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
            let seqType = NOTHING;
            ATYP = NOTHING;
            if (!CHAR_sub27()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            seqType |= ATYP;
            if (!CHAR_sub28()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            ATYP |= seqType;
            return true;
        },
        parseDefault: () => {
            const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
            let seqType = NOTHING;
            ATYP = NOTHING;
            if (!CHAR_sub27.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            seqType |= ATYP;
            if (!CHAR_sub28.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            ATYP |= seqType;
            return true;
        },
        print: () => {
            const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
            if (!CHAR_sub27()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            if (!CHAR_sub28()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            return true;
        },
        printDefault: () => {
            const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
            if (!CHAR_sub27.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            if (!CHAR_sub28.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            return true;
        },
    });

    // StringLiteral
    const CHAR_sub27 = createRule(mode, {
        parse: function STR() {
            if (CPOS + 2 > CREP.length) return false;
            if (CREP[CPOS + 0] !== 0x5c) return false;
            if (CREP[CPOS + 1] !== 0x66) return false;
            CPOS += 2;
            return true;
        },
        parseDefault: function STR() {
            emitBytes(0x5c, 0x66);
            return true;
        },
        print: function STR() {
            CREP[CPOS++] = 0x5c;
            CREP[CPOS++] = 0x66;
            return true;
        },
        printDefault: function STR() {
            CREP[CPOS++] = 0x5c;
            CREP[CPOS++] = 0x66;
            return true;
        },
    });
    CHAR_sub27.constant = {value: "\\f"};

    // ByteExpression
    const CHAR_sub28 = createRule(mode, {
        parse: function BYT() {
            let cc;
            cc = 0x0c;
            emitByte(cc);
            return true;
        },
        parseDefault: function BYT() {
            let cc;
            cc = 0x0c;
            emitByte(cc);
            return true;
        },
        print: function BYT() {
            let cc;
            if (ATYP !== STRING) return false;
            if (APOS >= AREP.length) return false;
            cc = AREP[APOS];
            if (cc !== 0x0c) return false;
            APOS += 1;
            return true;
        },
        printDefault: function BYT() {
            let cc;
            cc = 0x0c;
            CREP[CPOS++] = cc;
            return true;
        },
    });

    // SequenceExpression
    const CHAR_sub29 = createRule(mode, {
        parse: () => {
            const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
            let seqType = NOTHING;
            ATYP = NOTHING;
            if (!CHAR_sub30()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            seqType |= ATYP;
            if (!CHAR_sub31()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            ATYP |= seqType;
            return true;
        },
        parseDefault: () => {
            const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
            let seqType = NOTHING;
            ATYP = NOTHING;
            if (!CHAR_sub30.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            seqType |= ATYP;
            if (!CHAR_sub31.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            ATYP |= seqType;
            return true;
        },
        print: () => {
            const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
            if (!CHAR_sub30()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            if (!CHAR_sub31()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            return true;
        },
        printDefault: () => {
            const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
            if (!CHAR_sub30.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            if (!CHAR_sub31.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            return true;
        },
    });

    // StringLiteral
    const CHAR_sub30 = createRule(mode, {
        parse: function STR() {
            if (CPOS + 2 > CREP.length) return false;
            if (CREP[CPOS + 0] !== 0x5c) return false;
            if (CREP[CPOS + 1] !== 0x6e) return false;
            CPOS += 2;
            return true;
        },
        parseDefault: function STR() {
            emitBytes(0x5c, 0x6e);
            return true;
        },
        print: function STR() {
            CREP[CPOS++] = 0x5c;
            CREP[CPOS++] = 0x6e;
            return true;
        },
        printDefault: function STR() {
            CREP[CPOS++] = 0x5c;
            CREP[CPOS++] = 0x6e;
            return true;
        },
    });
    CHAR_sub30.constant = {value: "\\n"};

    // ByteExpression
    const CHAR_sub31 = createRule(mode, {
        parse: function BYT() {
            let cc;
            cc = 0x0a;
            emitByte(cc);
            return true;
        },
        parseDefault: function BYT() {
            let cc;
            cc = 0x0a;
            emitByte(cc);
            return true;
        },
        print: function BYT() {
            let cc;
            if (ATYP !== STRING) return false;
            if (APOS >= AREP.length) return false;
            cc = AREP[APOS];
            if (cc !== 0x0a) return false;
            APOS += 1;
            return true;
        },
        printDefault: function BYT() {
            let cc;
            cc = 0x0a;
            CREP[CPOS++] = cc;
            return true;
        },
    });

    // SequenceExpression
    const CHAR_sub32 = createRule(mode, {
        parse: () => {
            const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
            let seqType = NOTHING;
            ATYP = NOTHING;
            if (!CHAR_sub33()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            seqType |= ATYP;
            if (!CHAR_sub34()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            ATYP |= seqType;
            return true;
        },
        parseDefault: () => {
            const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
            let seqType = NOTHING;
            ATYP = NOTHING;
            if (!CHAR_sub33.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            seqType |= ATYP;
            if (!CHAR_sub34.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            ATYP |= seqType;
            return true;
        },
        print: () => {
            const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
            if (!CHAR_sub33()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            if (!CHAR_sub34()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            return true;
        },
        printDefault: () => {
            const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
            if (!CHAR_sub33.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            if (!CHAR_sub34.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            return true;
        },
    });

    // StringLiteral
    const CHAR_sub33 = createRule(mode, {
        parse: function STR() {
            if (CPOS + 2 > CREP.length) return false;
            if (CREP[CPOS + 0] !== 0x5c) return false;
            if (CREP[CPOS + 1] !== 0x72) return false;
            CPOS += 2;
            return true;
        },
        parseDefault: function STR() {
            emitBytes(0x5c, 0x72);
            return true;
        },
        print: function STR() {
            CREP[CPOS++] = 0x5c;
            CREP[CPOS++] = 0x72;
            return true;
        },
        printDefault: function STR() {
            CREP[CPOS++] = 0x5c;
            CREP[CPOS++] = 0x72;
            return true;
        },
    });
    CHAR_sub33.constant = {value: "\\r"};

    // ByteExpression
    const CHAR_sub34 = createRule(mode, {
        parse: function BYT() {
            let cc;
            cc = 0x0d;
            emitByte(cc);
            return true;
        },
        parseDefault: function BYT() {
            let cc;
            cc = 0x0d;
            emitByte(cc);
            return true;
        },
        print: function BYT() {
            let cc;
            if (ATYP !== STRING) return false;
            if (APOS >= AREP.length) return false;
            cc = AREP[APOS];
            if (cc !== 0x0d) return false;
            APOS += 1;
            return true;
        },
        printDefault: function BYT() {
            let cc;
            cc = 0x0d;
            CREP[CPOS++] = cc;
            return true;
        },
    });

    // SequenceExpression
    const CHAR_sub35 = createRule(mode, {
        parse: () => {
            const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
            let seqType = NOTHING;
            ATYP = NOTHING;
            if (!CHAR_sub36()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            seqType |= ATYP;
            if (!CHAR_sub37()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            ATYP |= seqType;
            return true;
        },
        parseDefault: () => {
            const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
            let seqType = NOTHING;
            ATYP = NOTHING;
            if (!CHAR_sub36.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            seqType |= ATYP;
            if (!CHAR_sub37.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            ATYP |= seqType;
            return true;
        },
        print: () => {
            const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
            if (!CHAR_sub36()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            if (!CHAR_sub37()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            return true;
        },
        printDefault: () => {
            const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
            if (!CHAR_sub36.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            if (!CHAR_sub37.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            return true;
        },
    });

    // StringLiteral
    const CHAR_sub36 = createRule(mode, {
        parse: function STR() {
            if (CPOS + 2 > CREP.length) return false;
            if (CREP[CPOS + 0] !== 0x5c) return false;
            if (CREP[CPOS + 1] !== 0x74) return false;
            CPOS += 2;
            return true;
        },
        parseDefault: function STR() {
            emitBytes(0x5c, 0x74);
            return true;
        },
        print: function STR() {
            CREP[CPOS++] = 0x5c;
            CREP[CPOS++] = 0x74;
            return true;
        },
        printDefault: function STR() {
            CREP[CPOS++] = 0x5c;
            CREP[CPOS++] = 0x74;
            return true;
        },
    });
    CHAR_sub36.constant = {value: "\\t"};

    // ByteExpression
    const CHAR_sub37 = createRule(mode, {
        parse: function BYT() {
            let cc;
            cc = 0x09;
            emitByte(cc);
            return true;
        },
        parseDefault: function BYT() {
            let cc;
            cc = 0x09;
            emitByte(cc);
            return true;
        },
        print: function BYT() {
            let cc;
            if (ATYP !== STRING) return false;
            if (APOS >= AREP.length) return false;
            cc = AREP[APOS];
            if (cc !== 0x09) return false;
            APOS += 1;
            return true;
        },
        printDefault: function BYT() {
            let cc;
            cc = 0x09;
            CREP[CPOS++] = cc;
            return true;
        },
    });

    // SequenceExpression
    const CHAR_sub38 = createRule(mode, {
        parse: () => {
            const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
            let seqType = NOTHING;
            ATYP = NOTHING;
            if (!CHAR_sub39()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            seqType |= ATYP;
            if (!CHAR_sub40()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            ATYP |= seqType;
            return true;
        },
        parseDefault: () => {
            const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
            let seqType = NOTHING;
            ATYP = NOTHING;
            if (!CHAR_sub39.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            seqType |= ATYP;
            if (!CHAR_sub40.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            ATYP |= seqType;
            return true;
        },
        print: () => {
            const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
            if (!CHAR_sub39()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            if (!CHAR_sub40()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            return true;
        },
        printDefault: () => {
            const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
            if (!CHAR_sub39.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            if (!CHAR_sub40.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            return true;
        },
    });

    // StringLiteral
    const CHAR_sub39 = createRule(mode, {
        parse: function STR() {
            if (CPOS + 2 > CREP.length) return false;
            if (CREP[CPOS + 0] !== 0x5c) return false;
            if (CREP[CPOS + 1] !== 0x75) return false;
            CPOS += 2;
            return true;
        },
        parseDefault: function STR() {
            emitBytes(0x5c, 0x75);
            return true;
        },
        print: function STR() {
            CREP[CPOS++] = 0x5c;
            CREP[CPOS++] = 0x75;
            return true;
        },
        printDefault: function STR() {
            CREP[CPOS++] = 0x5c;
            CREP[CPOS++] = 0x75;
            return true;
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
        parse: () => {
            const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
            let seqType = NOTHING;
            ATYP = NOTHING;
            if (!WS()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            seqType |= ATYP;
            if (!LBRACE_sub1()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            seqType |= ATYP;
            if (!WS()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            ATYP |= seqType;
            return true;
        },
        parseDefault: () => {
            const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
            let seqType = NOTHING;
            ATYP = NOTHING;
            if (!WS.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            seqType |= ATYP;
            if (!LBRACE_sub1.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            seqType |= ATYP;
            if (!WS.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            ATYP |= seqType;
            return true;
        },
        print: () => {
            const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
            if (!WS()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            if (!LBRACE_sub1()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            if (!WS()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            return true;
        },
        printDefault: () => {
            const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
            if (!WS.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            if (!LBRACE_sub1.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            if (!WS.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            return true;
        },
    });

    // ByteExpression
    const LBRACE_sub1 = createRule(mode, {
        parse: function BYT() {
            let cc;
            if (CPOS >= CREP.length) return false;
            cc = CREP[CPOS];
            if (cc !== 0x7b) return false;
            CPOS += 1;
            return true;
        },
        parseDefault: function BYT() {
            let cc;
            cc = 0x7b;
            emitByte(cc);
            return true;
        },
        print: function BYT() {
            let cc;
            cc = 0x7b;
            CREP[CPOS++] = cc;
            return true;
        },
        printDefault: function BYT() {
            let cc;
            cc = 0x7b;
            CREP[CPOS++] = cc;
            return true;
        },
    });

    // SequenceExpression
    const RBRACE = createRule(mode, {
        parse: () => {
            const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
            let seqType = NOTHING;
            ATYP = NOTHING;
            if (!WS()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            seqType |= ATYP;
            if (!RBRACE_sub1()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            seqType |= ATYP;
            if (!WS()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            ATYP |= seqType;
            return true;
        },
        parseDefault: () => {
            const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
            let seqType = NOTHING;
            ATYP = NOTHING;
            if (!WS.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            seqType |= ATYP;
            if (!RBRACE_sub1.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            seqType |= ATYP;
            if (!WS.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            ATYP |= seqType;
            return true;
        },
        print: () => {
            const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
            if (!WS()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            if (!RBRACE_sub1()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            if (!WS()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            return true;
        },
        printDefault: () => {
            const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
            if (!WS.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            if (!RBRACE_sub1.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            if (!WS.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            return true;
        },
    });

    // ByteExpression
    const RBRACE_sub1 = createRule(mode, {
        parse: function BYT() {
            let cc;
            if (CPOS >= CREP.length) return false;
            cc = CREP[CPOS];
            if (cc !== 0x7d) return false;
            CPOS += 1;
            return true;
        },
        parseDefault: function BYT() {
            let cc;
            cc = 0x7d;
            emitByte(cc);
            return true;
        },
        print: function BYT() {
            let cc;
            cc = 0x7d;
            CREP[CPOS++] = cc;
            return true;
        },
        printDefault: function BYT() {
            let cc;
            cc = 0x7d;
            CREP[CPOS++] = cc;
            return true;
        },
    });

    // SequenceExpression
    const LBRACKET = createRule(mode, {
        parse: () => {
            const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
            let seqType = NOTHING;
            ATYP = NOTHING;
            if (!WS()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            seqType |= ATYP;
            if (!LBRACKET_sub1()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            seqType |= ATYP;
            if (!WS()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            ATYP |= seqType;
            return true;
        },
        parseDefault: () => {
            const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
            let seqType = NOTHING;
            ATYP = NOTHING;
            if (!WS.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            seqType |= ATYP;
            if (!LBRACKET_sub1.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            seqType |= ATYP;
            if (!WS.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            ATYP |= seqType;
            return true;
        },
        print: () => {
            const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
            if (!WS()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            if (!LBRACKET_sub1()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            if (!WS()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            return true;
        },
        printDefault: () => {
            const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
            if (!WS.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            if (!LBRACKET_sub1.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            if (!WS.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            return true;
        },
    });

    // ByteExpression
    const LBRACKET_sub1 = createRule(mode, {
        parse: function BYT() {
            let cc;
            if (CPOS >= CREP.length) return false;
            cc = CREP[CPOS];
            if (cc !== 0x5b) return false;
            CPOS += 1;
            return true;
        },
        parseDefault: function BYT() {
            let cc;
            cc = 0x5b;
            emitByte(cc);
            return true;
        },
        print: function BYT() {
            let cc;
            cc = 0x5b;
            CREP[CPOS++] = cc;
            return true;
        },
        printDefault: function BYT() {
            let cc;
            cc = 0x5b;
            CREP[CPOS++] = cc;
            return true;
        },
    });

    // SequenceExpression
    const RBRACKET = createRule(mode, {
        parse: () => {
            const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
            let seqType = NOTHING;
            ATYP = NOTHING;
            if (!WS()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            seqType |= ATYP;
            if (!RBRACKET_sub1()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            seqType |= ATYP;
            if (!WS()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            ATYP |= seqType;
            return true;
        },
        parseDefault: () => {
            const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
            let seqType = NOTHING;
            ATYP = NOTHING;
            if (!WS.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            seqType |= ATYP;
            if (!RBRACKET_sub1.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            seqType |= ATYP;
            if (!WS.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            ATYP |= seqType;
            return true;
        },
        print: () => {
            const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
            if (!WS()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            if (!RBRACKET_sub1()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            if (!WS()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            return true;
        },
        printDefault: () => {
            const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
            if (!WS.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            if (!RBRACKET_sub1.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            if (!WS.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            return true;
        },
    });

    // ByteExpression
    const RBRACKET_sub1 = createRule(mode, {
        parse: function BYT() {
            let cc;
            if (CPOS >= CREP.length) return false;
            cc = CREP[CPOS];
            if (cc !== 0x5d) return false;
            CPOS += 1;
            return true;
        },
        parseDefault: function BYT() {
            let cc;
            cc = 0x5d;
            emitByte(cc);
            return true;
        },
        print: function BYT() {
            let cc;
            cc = 0x5d;
            CREP[CPOS++] = cc;
            return true;
        },
        printDefault: function BYT() {
            let cc;
            cc = 0x5d;
            CREP[CPOS++] = cc;
            return true;
        },
    });

    // SequenceExpression
    const COLON = createRule(mode, {
        parse: () => {
            const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
            let seqType = NOTHING;
            ATYP = NOTHING;
            if (!WS()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            seqType |= ATYP;
            if (!COLON_sub1()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            seqType |= ATYP;
            if (!WS()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            ATYP |= seqType;
            return true;
        },
        parseDefault: () => {
            const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
            let seqType = NOTHING;
            ATYP = NOTHING;
            if (!WS.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            seqType |= ATYP;
            if (!COLON_sub1.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            seqType |= ATYP;
            if (!WS.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            ATYP |= seqType;
            return true;
        },
        print: () => {
            const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
            if (!WS()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            if (!COLON_sub1()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            if (!WS()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            return true;
        },
        printDefault: () => {
            const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
            if (!WS.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            if (!COLON_sub1.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            if (!WS.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            return true;
        },
    });

    // ByteExpression
    const COLON_sub1 = createRule(mode, {
        parse: function BYT() {
            let cc;
            if (CPOS >= CREP.length) return false;
            cc = CREP[CPOS];
            if (cc !== 0x3a) return false;
            CPOS += 1;
            return true;
        },
        parseDefault: function BYT() {
            let cc;
            cc = 0x3a;
            emitByte(cc);
            return true;
        },
        print: function BYT() {
            let cc;
            cc = 0x3a;
            CREP[CPOS++] = cc;
            return true;
        },
        printDefault: function BYT() {
            let cc;
            cc = 0x3a;
            CREP[CPOS++] = cc;
            return true;
        },
    });

    // SequenceExpression
    const COMMA = createRule(mode, {
        parse: () => {
            const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
            let seqType = NOTHING;
            ATYP = NOTHING;
            if (!WS()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            seqType |= ATYP;
            if (!COMMA_sub1()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            seqType |= ATYP;
            if (!WS()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            ATYP |= seqType;
            return true;
        },
        parseDefault: () => {
            const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
            let seqType = NOTHING;
            ATYP = NOTHING;
            if (!WS.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            seqType |= ATYP;
            if (!COMMA_sub1.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            seqType |= ATYP;
            if (!WS.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            ATYP |= seqType;
            return true;
        },
        print: () => {
            const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
            if (!WS()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            if (!COMMA_sub1()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            if (!WS()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            return true;
        },
        printDefault: () => {
            const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
            if (!WS.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            if (!COMMA_sub1.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            if (!WS.default()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
            return true;
        },
    });

    // ByteExpression
    const COMMA_sub1 = createRule(mode, {
        parse: function BYT() {
            let cc;
            if (CPOS >= CREP.length) return false;
            cc = CREP[CPOS];
            if (cc !== 0x2c) return false;
            CPOS += 1;
            return true;
        },
        parseDefault: function BYT() {
            let cc;
            cc = 0x2c;
            emitByte(cc);
            return true;
        },
        print: function BYT() {
            let cc;
            cc = 0x2c;
            CREP[CPOS++] = cc;
            return true;
        },
        printDefault: function BYT() {
            let cc;
            cc = 0x2c;
            CREP[CPOS++] = cc;
            return true;
        },
    });

    // ByteExpression
    const DOUBLE_QUOTE = createRule(mode, {
        parse: function BYT() {
            let cc;
            if (CPOS >= CREP.length) return false;
            cc = CREP[CPOS];
            if (cc !== 0x22) return false;
            CPOS += 1;
            return true;
        },
        parseDefault: function BYT() {
            let cc;
            cc = 0x22;
            emitByte(cc);
            return true;
        },
        print: function BYT() {
            let cc;
            cc = 0x22;
            CREP[CPOS++] = cc;
            return true;
        },
        printDefault: function BYT() {
            let cc;
            cc = 0x22;
            CREP[CPOS++] = cc;
            return true;
        },
    });

    // QuantifiedExpression
    const WS = createRule(mode, {
        parse: () => {
            let [CPOSᐟ, APOSᐟ] = [CPOS, APOS];
            do {
                if (!WS_sub1()) break;
                if (CPOS <= CPOSᐟ) break;
                CPOSᐟ = CPOS, APOSᐟ = APOS;
            } while (true);
            CPOS = CPOSᐟ, APOS = APOSᐟ;
            return true;
        },
        print: () => {
            let [APOSᐟ, CPOSᐟ] = [APOS, CPOS];
            do {
                if (!WS_sub1()) break;
                if (APOS <= APOSᐟ) break;
                APOSᐟ = APOS, CPOSᐟ = CPOS;
            } while (true);
            APOS = APOSᐟ, CPOS = CPOSᐟ;
            return true;
        },
        parseDefault: () => true,
        printDefault: () => true,
    });

    // ByteExpression
    const WS_sub1 = createRule(mode, {
        parse: function BYT() {
            let cc;
            if (CPOS >= CREP.length) return false;
            cc = CREP[CPOS];
            if (cc !== 0x20 && cc !== 0x09 && cc !== 0x0a && cc !== 0x0d) return false;
            CPOS += 1;
            return true;
        },
        parseDefault: function BYT() {
            let cc;
            cc = 0x20;
            emitByte(cc);
            return true;
        },
        print: function BYT() {
            let cc;
            cc = 0x20;
            CREP[CPOS++] = cc;
            return true;
        },
        printDefault: function BYT() {
            let cc;
            cc = 0x20;
            CREP[CPOS++] = cc;
            return true;
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
