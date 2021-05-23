// ------------------------------ Main exports ------------------------------
module.exports = {
    parse(strOrBuf) { // expects buf to be utf8 encoded
        CREP = Buffer.isBuffer(strOrBuf) ? strOrBuf : Buffer.from(strOrBuf, 'utf8');
        CPOS = 0;
        AREP = [];
        APOS = 0;
        HAS_IN = HAS_OUT = true;
        if (!parseInner(parse, true)) throw new Error('parse failed');
        if (CPOS !== CREP.length) throw new Error('parse didn\'t consume entire input');
        return AREP[0];
    },
    print(node, buf) {
        AREP = [node];
        APOS = 0;
        CREP = buf || Buffer.alloc(2 ** 22); // 4MB
        CPOS = 0;
        HAS_IN = HAS_OUT = true;
        if (!printInner(print, true)) throw new Error('print failed');
        if (CPOS > CREP.length) throw new Error('output buffer too small');
        return buf ? CPOS : CREP.toString('utf8', 0, CPOS);
    },
};




// ------------------------------ Runtime ------------------------------
"use strict";
function parseList(listItems) {
    return function LST() {
        const [APOSₒ, CPOSₒ] = savepoint();
        if (APOS === 0)
            AREP = [];
        for (const listItem of listItems) {
            if (listItem.kind === 'Element') {
                if (!parseInner(listItem.expr, true))
                    return backtrack(APOSₒ, CPOSₒ);
            }
            else {
                if (!listItem.expr())
                    return backtrack(APOSₒ, CPOSₒ);
            }
        }
        ATYP = LIST;
        return true;
    };
}
function printList(listItems) {
    return function LST() {
        if (ATYP !== LIST)
            return false;
        const [APOSₒ, CPOSₒ] = savepoint(), ATYPₒ = ATYP;
        for (const listItem of listItems) {
            if (listItem.kind === 'Element') {
                if (!printInner(listItem.expr, true))
                    return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
            }
            else {
                ATYP = LIST;
                if (!listItem.expr())
                    return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
            }
        }
        return true;
    };
}
function parseRecord(recordItems) {
    return function RCD() {
        const [APOSₒ, CPOSₒ] = savepoint();
        if (APOS === 0)
            AREP = [];
        const fieldNames = [];
        for (const recordItem of recordItems) {
            if (recordItem.kind === 'Field') {
                let fieldName;
                if (typeof recordItem.name === 'string') {
                    fieldName = recordItem.name;
                }
                else {
                    if (!parseInner(recordItem.name, true))
                        return backtrack(APOSₒ, CPOSₒ);
                    assert(ATYP === STRING);
                    APOS -= 1;
                    fieldName = AREP[APOS];
                }
                if (fieldNames.includes(fieldName))
                    return backtrack(APOSₒ, CPOSₒ);
                if (!parseInner(recordItem.expr, true))
                    return backtrack(APOSₒ, CPOSₒ);
                if (HAS_OUT) {
                    const fieldValue = AREP[--APOS];
                    AREP[APOS++] = fieldName;
                    AREP[APOS++] = fieldValue;
                }
                fieldNames.push(fieldName);
            }
            else {
                const apos = APOS;
                if (!recordItem.expr())
                    return backtrack(APOSₒ, CPOSₒ);
                for (let i = apos; i < APOS; i += 2) {
                    const fieldName = AREP[i];
                    if (fieldNames.includes(fieldName))
                        return backtrack(APOSₒ, CPOSₒ);
                    fieldNames.push(fieldName);
                }
            }
        }
        ATYP = HAS_OUT ? RECORD : NOTHING;
        return true;
    };
}
function printRecord(recordItems) {
    return function RCD() {
        if (ATYP !== RECORD)
            return false;
        const [APOSₒ, CPOSₒ] = savepoint(), ATYPₒ = ATYP;
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
                    if (typeof recordItem.name !== 'string') {
                        APOS = i << 1;
                        if (!printInner(recordItem.name, true))
                            continue;
                    }
                    else {
                        if (propName !== recordItem.name)
                            continue;
                    }
                    APOS = (i << 1) + 1;
                    if (!printInner(recordItem.expr, true))
                        continue;
                    bitmask += propBit;
                    continue outerLoop;
                }
                return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
            }
            else {
                APOS = bitmask;
                ATYP = RECORD;
                if (!recordItem.expr())
                    return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
                bitmask = APOS;
            }
        }
        APOS = bitmask;
        return true;
    };
}
function isRule(_x) {
    return true;
}
function isGeneric(_x) {
    return true;
}
function isModule(_x) {
    return true;
}
let AREP;
let APOS;
let ATYP;
let CREP;
let CPOS;
let HAS_IN;
let HAS_OUT;
const [NOTHING, SCALAR, STRING, LIST, RECORD] = [0, 1, 2, 4, 8];
const savepoint = () => [APOS, CPOS];
const backtrack = (APOSₒ, CPOSₒ, ATYPₒ) => (APOS = APOSₒ, CPOS = CPOSₒ, ATYP = ATYPₒ !== null && ATYPₒ !== void 0 ? ATYPₒ : NOTHING, false);
const theScalarArray = [];
const theBuffer = Buffer.alloc(2 ** 10);
function emitScalar(value) {
    if (HAS_OUT) {
        if (APOS === 0)
            AREP = theScalarArray;
        AREP[APOS++] = value;
    }
    ATYP = HAS_OUT ? SCALAR : NOTHING;
}
function emitByte(value) {
    if (HAS_OUT) {
        if (APOS === 0)
            AREP = theBuffer;
        AREP[APOS++] = value;
    }
    ATYP = HAS_OUT ? STRING : NOTHING;
}
function emitBytes(...values) {
    if (HAS_OUT) {
        if (APOS === 0)
            AREP = theBuffer;
        for (let i = 0; i < values.length; ++i)
            AREP[APOS++] = values[i];
    }
    ATYP = HAS_OUT ? STRING : NOTHING;
}
function parseInner(rule, mustProduce) {
    const [AREPₒ, APOSₒ] = [AREP, APOS];
    AREP = undefined;
    APOS = 0;
    if (!rule())
        return AREP = AREPₒ, APOS = APOSₒ, false;
    if (ATYP === NOTHING)
        return AREP = AREPₒ, APOS = APOSₒ, mustProduce;
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
                AREP.length === APOS;
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
    const apos = APOS;
    AREP = AREPₒ, APOS = APOSₒ, ATYP = ATYPₒ;
    if (!result)
        return false;
    if (atyp === RECORD) {
        const keyCount = value.length >> 1;
        if (keyCount > 0 && (apos !== -1 >>> (32 - keyCount)))
            return false;
    }
    else {
        if (apos !== value.length)
            return false;
    }
    APOS += 1;
    return true;
}
function assert(value) {
    if (!value)
        throw new Error(`Assertion failed`);
}




// ------------------------------ Extensions ------------------------------
const extensions = {
    "V:/projects/oss/pen-monorepo/packages/core/penc/dist/deps/std.pen.js": (() => {
        "use strict";
        /* @pen exports = {
            ascii,
            f64,
            i32,
            memoise,
        } */
        // TODO: doc... has both 'txt' and 'ast' representation
        // TODO: supports only single UTF-16 code units, ie basic multilingual plane. Extend to full unicode support somehow...
        // TODO: optimise 'any char' case better - or is that a whole other primitive now?
        // TODO: optimise all cases better
        function ascii({ mode }) {
            return function ASC_generic(expr) {
                var _a, _b, _c, _d, _e, _f;
                assert(isModule(expr));
                let min = (_c = (_b = (_a = expr('min')) === null || _a === void 0 ? void 0 : _a.constant) === null || _b === void 0 ? void 0 : _b.value) !== null && _c !== void 0 ? _c : 0x00;
                let max = (_f = (_e = (_d = expr('max')) === null || _d === void 0 ? void 0 : _d.constant) === null || _e === void 0 ? void 0 : _e.value) !== null && _f !== void 0 ? _f : 0x7f;
                if (typeof min === 'string' && min.length === 1)
                    min = min.charCodeAt(0);
                if (typeof max === 'string' && max.length === 1)
                    max = max.charCodeAt(0);
                assert(typeof min === 'number' && min >= 0x00 && min <= 0x7f);
                assert(typeof max === 'number' && max >= 0x00 && max <= 0x7f);
                if (mode === 'parse') {
                    return function ASC() {
                        let cc;
                        if (HAS_IN) {
                            if (CPOS >= CREP.length)
                                return false;
                            cc = CREP[CPOS];
                            if (cc < min || cc > max)
                                return false;
                            CPOS += 1;
                        }
                        else {
                            cc = min;
                        }
                        emitByte(cc);
                        return true;
                    };
                }
                else /* mode === 'print' */ {
                    return function ASC() {
                        let cc;
                        if (HAS_IN) {
                            if (ATYP !== STRING)
                                return false;
                            const arep = AREP;
                            if (APOS >= arep.length)
                                return false;
                            cc = arep[APOS];
                            if (cc < min || cc > max)
                                return false;
                            APOS += 1;
                        }
                        else {
                            cc = min;
                        }
                        if (HAS_OUT)
                            CREP[CPOS++] = cc;
                        return true;
                    };
                }
            };
        }
        // TODO: doc... has both 'txt' and 'ast' representation
        function f64({ mode }) {
            if (mode === 'parse') {
                return function F64() {
                    let num = 0;
                    if (HAS_IN) {
                        const [APOSₒ, CPOSₒ] = savepoint();
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
                            return backtrack(APOSₒ, CPOSₒ);
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
                                return backtrack(APOSₒ, CPOSₒ);
                        }
                        // There is a syntactically valid float. Delegate parsing to the JS runtime.
                        // Reject the number if it parses to Infinity or Nan.
                        // TODO: the conversion may still be lossy. Provide a non-lossy mode, like `safenum` does?
                        num = Number.parseFloat(CREP.toString('utf8', CPOSₒ, CPOS));
                        if (!Number.isFinite(num))
                            return backtrack(APOSₒ, CPOSₒ);
                    }
                    // Success
                    emitScalar(num);
                    return true;
                };
            }
            else /* mode === 'print' */ {
                return function F64() {
                    let out = '0';
                    if (HAS_IN) {
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
                    }
                    // Success
                    if (HAS_OUT)
                        CPOS += CREP.write(out, CPOS, undefined, 'utf8');
                    return true;
                };
            }
        }
        // These constants are used by the f64 rule.
        const PLUS_SIGN = '+'.charCodeAt(0);
        const MINUS_SIGN = '-'.charCodeAt(0);
        const DECIMAL_POINT = '.'.charCodeAt(0);
        const ZERO_DIGIT = '0'.charCodeAt(0);
        const NINE_DIGIT = '9'.charCodeAt(0);
        const LOWERCASE_E = 'e'.charCodeAt(0);
        const UPPERCASE_E = 'E'.charCodeAt(0);
        // TODO: doc... has both 'txt' and 'ast' representation
        function i32({ mode }) {
            return function I32_generic(expr) {
                var _a, _b, _c, _d, _e, _f;
                assert(isModule(expr));
                const base = (_c = (_b = (_a = expr('base')) === null || _a === void 0 ? void 0 : _a.constant) === null || _b === void 0 ? void 0 : _b.value) !== null && _c !== void 0 ? _c : 10;
                const signed = (_f = (_e = (_d = expr('signed')) === null || _d === void 0 ? void 0 : _d.constant) === null || _e === void 0 ? void 0 : _e.value) !== null && _f !== void 0 ? _f : true;
                assert(typeof base === 'number' && base >= 2 && base <= 36);
                assert(typeof signed === 'boolean');
                if (mode === 'parse') {
                    return function I32() {
                        let num = 0;
                        if (HAS_IN) {
                            const [APOSₒ, CPOSₒ] = savepoint();
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
                                    return backtrack(APOSₒ, CPOSₒ);
                                // Loop again.
                                CPOS += 1;
                                digits += 1;
                            }
                            // Check that we parsed at least one digit.
                            if (digits === 0)
                                return backtrack(APOSₒ, CPOSₒ);
                            // Apply the sign.
                            if (isNegative)
                                num = -num;
                        }
                        // Success
                        emitScalar(num);
                        return true;
                    };
                }
                else /* mode === 'print' */ {
                    return function I32() {
                        const digits = [];
                        if (HAS_IN) {
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
                        }
                        // Success
                        if (HAS_OUT) {
                            for (let i = 0; i < digits.length; ++i) {
                                CREP[CPOS++] = digits[i];
                            }
                        }
                        return true;
                    };
                }
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
            return function MEM_generic(expr) {
                // TODO: note this never gets cleared between parse/print calls. Would be ideal to be able to clear it somehow.
                const memos = new Map();
                if (mode === 'parse') {
                    return function MEM() {
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
                    };
                }
                else /* mode === 'print' */ {
                    // TODO: the below function is exact copypasta of the above function, with AREP/APOS <-> CREP/CPOS
                    // This is a case where it would be better to have IREP/IPOS+OREP/OPOS and have just one function here.
                    return function MEM() {
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
                    };
                }
            };
        }
        return {ascii, f64, i32, memoise};
    })(),
};




// ------------------------------ PARSE ------------------------------
const parse = (() => {

    // Intrinsic
    const ascii_2 = extensions["V:/projects/oss/pen-monorepo/packages/core/penc/dist/deps/std.pen.js"].ascii({mode: 'parse'});
    const f64 = extensions["V:/projects/oss/pen-monorepo/packages/core/penc/dist/deps/std.pen.js"].f64({mode: 'parse'});
    const i32 = extensions["V:/projects/oss/pen-monorepo/packages/core/penc/dist/deps/std.pen.js"].i32({mode: 'parse'});
    const memoise = extensions["V:/projects/oss/pen-monorepo/packages/core/penc/dist/deps/std.pen.js"].memoise({mode: 'parse'});

    // Identifier
    function foo(arg) {
        return f(arg);
    }

    // Identifier
    function bar(arg) {
        return b_2(arg);
    }

    // Identifier
    function baz(arg) {
        return baz_2(arg);
    }

    // Identifier
    function ascii(arg) {
        return ascii_2(arg);
    }

    // Identifier
    function start_2(arg) {
        return result(arg);
    }

    // ByteExpression
    function min() {
        let cc;
        if (HAS_IN) {
            if (CPOS >= CREP.length) return false;
            cc = CREP[CPOS];
            if (cc !== 0x30) return false;
            CPOS += 1;
        }
        else {
            cc = 0x30;
        }
        emitByte(cc);
        return true;
    }

    // ByteExpression
    function max() {
        let cc;
        if (HAS_IN) {
            if (CPOS >= CREP.length) return false;
            cc = CREP[CPOS];
            if (cc !== 0x39) return false;
            CPOS += 1;
        }
        else {
            cc = 0x39;
        }
        emitByte(cc);
        return true;
    }

    // InstantiationExpression
    let digitₘ;
    function digit(arg) {
        try {
            return digitₘ(arg);
        }
        catch (err) {
            if (!(err instanceof TypeError) || !err.message.includes('digitₘ is not a function')) throw err;
            digitₘ = ascii(digit_sub1);
            return digitₘ(arg);
        }
    }

    // Module
    function digit_sub1(member) {
        switch (member) {
            case 'min': return min;
            case 'max': return max;
            default: return undefined;
        }
    }

    // ByteExpression
    function min_2() {
        let cc;
        if (HAS_IN) {
            if (CPOS >= CREP.length) return false;
            cc = CREP[CPOS];
            if (cc !== 0x61) return false;
            CPOS += 1;
        }
        else {
            cc = 0x61;
        }
        emitByte(cc);
        return true;
    }

    // ByteExpression
    function max_2() {
        let cc;
        if (HAS_IN) {
            if (CPOS >= CREP.length) return false;
            cc = CREP[CPOS];
            if (cc !== 0x7a) return false;
            CPOS += 1;
        }
        else {
            cc = 0x7a;
        }
        emitByte(cc);
        return true;
    }

    // ByteExpression
    function min_3() {
        let cc;
        if (HAS_IN) {
            if (CPOS >= CREP.length) return false;
            cc = CREP[CPOS];
            if (cc !== 0x41) return false;
            CPOS += 1;
        }
        else {
            cc = 0x41;
        }
        emitByte(cc);
        return true;
    }

    // ByteExpression
    function max_3() {
        let cc;
        if (HAS_IN) {
            if (CPOS >= CREP.length) return false;
            cc = CREP[CPOS];
            if (cc !== 0x5a) return false;
            CPOS += 1;
        }
        else {
            cc = 0x5a;
        }
        emitByte(cc);
        return true;
    }

    // SelectionExpression
    function alpha() {
        if (alpha_sub1()) return true;
        if (alpha_sub3()) return true;
        return false;
    }

    // InstantiationExpression
    let alpha_sub1ₘ;
    function alpha_sub1(arg) {
        try {
            return alpha_sub1ₘ(arg);
        }
        catch (err) {
            if (!(err instanceof TypeError) || !err.message.includes('alpha_sub1ₘ is not a function')) throw err;
            alpha_sub1ₘ = ascii(alpha_sub2);
            return alpha_sub1ₘ(arg);
        }
    }

    // Module
    function alpha_sub2(member) {
        switch (member) {
            case 'min': return min_2;
            case 'max': return max_2;
            default: return undefined;
        }
    }

    // InstantiationExpression
    let alpha_sub3ₘ;
    function alpha_sub3(arg) {
        try {
            return alpha_sub3ₘ(arg);
        }
        catch (err) {
            if (!(err instanceof TypeError) || !err.message.includes('alpha_sub3ₘ is not a function')) throw err;
            alpha_sub3ₘ = ascii(alpha_sub4);
            return alpha_sub3ₘ(arg);
        }
    }

    // Module
    function alpha_sub4(member) {
        switch (member) {
            case 'min': return min_3;
            case 'max': return max_3;
            default: return undefined;
        }
    }

    // SequenceExpression
    function result() {
        const [APOSₒ, CPOSₒ] = savepoint(), ATYPₒ = ATYP;
        let seqType = NOTHING;
        if (!foo()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        seqType |= ATYP;
        if (!result_sub1()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        ATYP |= seqType;
        return true;
    }

    // SequenceExpression
    function result_sub1() {
        const [APOSₒ, CPOSₒ] = savepoint(), ATYPₒ = ATYP;
        let seqType = NOTHING;
        if (!bar()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        seqType |= ATYP;
        if (!baz()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        ATYP |= seqType;
        return true;
    }

    // ListExpression
    let myListₘ;
    function myList(arg) {
        try {
            return myListₘ(arg);
        }
        catch (err) {
            if (!(err instanceof TypeError) || !err.message.includes('myListₘ is not a function')) throw err;
            myListₘ = parseList([
                {
                    kind: 'Element',
                    expr: digit
                },
                {
                    kind: 'Element',
                    expr: myList_sub1
                },
                {
                    kind: 'Element',
                    expr: myList_sub2
                },
            ]);
            return myListₘ(arg);
        }
    }

    // SequenceExpression
    function myList_sub1() {
        const [APOSₒ, CPOSₒ] = savepoint(), ATYPₒ = ATYP;
        let seqType = NOTHING;
        if (!digit()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        seqType |= ATYP;
        if (!digit()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        ATYP |= seqType;
        return true;
    }

    // SequenceExpression
    function myList_sub2() {
        const [APOSₒ, CPOSₒ] = savepoint(), ATYPₒ = ATYP;
        let seqType = NOTHING;
        if (!digit()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        seqType |= ATYP;
        if (!digit()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        seqType |= ATYP;
        if (!digit()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        ATYP |= seqType;
        return true;
    }

    // StringLiteral
    function b() {
        emitBytes(0x62, 0x20, 0x74, 0x68, 0x69, 0x6e, 0x67);
        return true;
    }
    b.constant = {value: "b thing"};

    // StringLiteral
    function d() {
        emitBytes(0x64, 0x20, 0x74, 0x68, 0x69, 0x6e, 0x67);
        return true;
    }
    d.constant = {value: "d thing"};

    // Module
    function rec(member) {
        switch (member) {
            case 'b': return b;
            case 'd': return d;
            default: return undefined;
        }
    }

    // Identifier
    function r2(arg) {
        return rec(arg);
    }

    // Identifier
    function r2d(arg) {
        return d(arg);
    }

    // Module
    function Ɱ_import_graph(member) {
        switch (member) {
            case 'foo': return foo;
            case 'bar': return bar;
            case 'baz': return baz;
            case 'ascii': return ascii;
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
    }

    // StringLiteral
    function f() {
        if (HAS_IN) {
            if (CPOS + 3 > CREP.length) return false;
            if (CREP[CPOS + 0] !== 0x66) return false;
            if (CREP[CPOS + 1] !== 0x6f) return false;
            if (CREP[CPOS + 2] !== 0x6f) return false;
            CPOS += 3;
        }
        emitBytes(0x66, 0x6f, 0x6f);
        return true;
    }
    f.constant = {value: "foo"};

    // StringLiteral
    function b_2() {
        if (HAS_IN) {
            if (CPOS + 3 > CREP.length) return false;
            if (CREP[CPOS + 0] !== 0x62) return false;
            if (CREP[CPOS + 1] !== 0x61) return false;
            if (CREP[CPOS + 2] !== 0x72) return false;
            CPOS += 3;
        }
        emitBytes(0x62, 0x61, 0x72);
        return true;
    }
    b_2.constant = {value: "bar"};

    // StringLiteral
    function baz_2() {
        if (HAS_IN) {
            if (CPOS + 3 > CREP.length) return false;
            if (CREP[CPOS + 0] !== 0x62) return false;
            if (CREP[CPOS + 1] !== 0x61) return false;
            if (CREP[CPOS + 2] !== 0x7a) return false;
            CPOS += 3;
        }
        emitBytes(0x62, 0x61, 0x7a);
        return true;
    }
    baz_2.constant = {value: "baz"};

    // Module
    function Ɱ_a(member) {
        switch (member) {
            case 'f': return f;
            case 'b': return b_2;
            case 'baz': return baz_2;
            default: return undefined;
        }
    }

    // Module
    function Ɱ_b(member) {
        switch (member) {
            default: return undefined;
        }
    }

    // Intrinsic

    // Intrinsic

    // Intrinsic

    // Intrinsic

    // Module
    function Ɱ_std(member) {
        switch (member) {
            case 'ascii': return ascii_2;
            case 'f64': return f64;
            case 'i32': return i32;
            case 'memoise': return memoise;
            default: return undefined;
        }
    }

    // Module
    function Ɱ_c(member) {
        switch (member) {
            default: return undefined;
        }
    }

    // Module
    function Ɱ_d(member) {
        switch (member) {
            default: return undefined;
        }
    }

    // Identifier
    function util1(arg) {
        return Ɱ_util1(arg);
    }

    // Identifier
    function util2(arg) {
        return Ɱ_util2(arg);
    }

    // Module
    function util(member) {
        switch (member) {
            case 'util1': return util1;
            case 'util2': return util2;
            default: return undefined;
        }
    }

    // Module
    function Ɱ_util(member) {
        switch (member) {
            case 'util': return util;
            default: return undefined;
        }
    }

    // StringLiteral
    function util1_2() {
        if (HAS_IN) {
            if (CPOS + 5 > CREP.length) return false;
            if (CREP[CPOS + 0] !== 0x75) return false;
            if (CREP[CPOS + 1] !== 0x74) return false;
            if (CREP[CPOS + 2] !== 0x69) return false;
            if (CREP[CPOS + 3] !== 0x6c) return false;
            if (CREP[CPOS + 4] !== 0x31) return false;
            CPOS += 5;
        }
        emitBytes(0x75, 0x74, 0x69, 0x6c, 0x31);
        return true;
    }
    util1_2.constant = {value: "util1"};

    // Module
    function Ɱ_util1(member) {
        switch (member) {
            case 'util1': return util1_2;
            default: return undefined;
        }
    }

    // StringLiteral
    function util2_2() {
        if (HAS_IN) {
            if (CPOS + 5 > CREP.length) return false;
            if (CREP[CPOS + 0] !== 0x75) return false;
            if (CREP[CPOS + 1] !== 0x74) return false;
            if (CREP[CPOS + 2] !== 0x69) return false;
            if (CREP[CPOS + 3] !== 0x6c) return false;
            if (CREP[CPOS + 4] !== 0x32) return false;
            CPOS += 5;
        }
        emitBytes(0x75, 0x74, 0x69, 0x6c, 0x32);
        return true;
    }
    util2_2.constant = {value: "util2"};

    // Module
    function Ɱ_util2(member) {
        switch (member) {
            case 'util2': return util2_2;
            default: return undefined;
        }
    }

    return start_2;
})();




// ------------------------------ PRINT ------------------------------
const print = (() => {

    // Intrinsic
    const ascii_2 = extensions["V:/projects/oss/pen-monorepo/packages/core/penc/dist/deps/std.pen.js"].ascii({mode: 'print'});
    const f64 = extensions["V:/projects/oss/pen-monorepo/packages/core/penc/dist/deps/std.pen.js"].f64({mode: 'print'});
    const i32 = extensions["V:/projects/oss/pen-monorepo/packages/core/penc/dist/deps/std.pen.js"].i32({mode: 'print'});
    const memoise = extensions["V:/projects/oss/pen-monorepo/packages/core/penc/dist/deps/std.pen.js"].memoise({mode: 'print'});

    // Identifier
    function foo(arg) {
        return f(arg);
    }

    // Identifier
    function bar(arg) {
        return b_2(arg);
    }

    // Identifier
    function baz(arg) {
        return baz_2(arg);
    }

    // Identifier
    function ascii(arg) {
        return ascii_2(arg);
    }

    // Identifier
    function start_2(arg) {
        return result(arg);
    }

    // ByteExpression
    function min() {
        let cc;
        if (HAS_IN) {
            if (ATYP !== STRING) return false;
            if (APOS >= AREP.length) return false;
            cc = AREP[APOS];
            if (cc !== 0x30) return false;
            APOS += 1;
        }
        else {
            cc = 0x30;
        }
        if (HAS_OUT) CREP[CPOS++] = cc;
        return true;
    }

    // ByteExpression
    function max() {
        let cc;
        if (HAS_IN) {
            if (ATYP !== STRING) return false;
            if (APOS >= AREP.length) return false;
            cc = AREP[APOS];
            if (cc !== 0x39) return false;
            APOS += 1;
        }
        else {
            cc = 0x39;
        }
        if (HAS_OUT) CREP[CPOS++] = cc;
        return true;
    }

    // InstantiationExpression
    let digitₘ;
    function digit(arg) {
        try {
            return digitₘ(arg);
        }
        catch (err) {
            if (!(err instanceof TypeError) || !err.message.includes('digitₘ is not a function')) throw err;
            digitₘ = ascii(digit_sub1);
            return digitₘ(arg);
        }
    }

    // Module
    function digit_sub1(member) {
        switch (member) {
            case 'min': return min;
            case 'max': return max;
            default: return undefined;
        }
    }

    // ByteExpression
    function min_2() {
        let cc;
        if (HAS_IN) {
            if (ATYP !== STRING) return false;
            if (APOS >= AREP.length) return false;
            cc = AREP[APOS];
            if (cc !== 0x61) return false;
            APOS += 1;
        }
        else {
            cc = 0x61;
        }
        if (HAS_OUT) CREP[CPOS++] = cc;
        return true;
    }

    // ByteExpression
    function max_2() {
        let cc;
        if (HAS_IN) {
            if (ATYP !== STRING) return false;
            if (APOS >= AREP.length) return false;
            cc = AREP[APOS];
            if (cc !== 0x7a) return false;
            APOS += 1;
        }
        else {
            cc = 0x7a;
        }
        if (HAS_OUT) CREP[CPOS++] = cc;
        return true;
    }

    // ByteExpression
    function min_3() {
        let cc;
        if (HAS_IN) {
            if (ATYP !== STRING) return false;
            if (APOS >= AREP.length) return false;
            cc = AREP[APOS];
            if (cc !== 0x41) return false;
            APOS += 1;
        }
        else {
            cc = 0x41;
        }
        if (HAS_OUT) CREP[CPOS++] = cc;
        return true;
    }

    // ByteExpression
    function max_3() {
        let cc;
        if (HAS_IN) {
            if (ATYP !== STRING) return false;
            if (APOS >= AREP.length) return false;
            cc = AREP[APOS];
            if (cc !== 0x5a) return false;
            APOS += 1;
        }
        else {
            cc = 0x5a;
        }
        if (HAS_OUT) CREP[CPOS++] = cc;
        return true;
    }

    // SelectionExpression
    function alpha() {
        if (alpha_sub1()) return true;
        if (alpha_sub3()) return true;
        return false;
    }

    // InstantiationExpression
    let alpha_sub1ₘ;
    function alpha_sub1(arg) {
        try {
            return alpha_sub1ₘ(arg);
        }
        catch (err) {
            if (!(err instanceof TypeError) || !err.message.includes('alpha_sub1ₘ is not a function')) throw err;
            alpha_sub1ₘ = ascii(alpha_sub2);
            return alpha_sub1ₘ(arg);
        }
    }

    // Module
    function alpha_sub2(member) {
        switch (member) {
            case 'min': return min_2;
            case 'max': return max_2;
            default: return undefined;
        }
    }

    // InstantiationExpression
    let alpha_sub3ₘ;
    function alpha_sub3(arg) {
        try {
            return alpha_sub3ₘ(arg);
        }
        catch (err) {
            if (!(err instanceof TypeError) || !err.message.includes('alpha_sub3ₘ is not a function')) throw err;
            alpha_sub3ₘ = ascii(alpha_sub4);
            return alpha_sub3ₘ(arg);
        }
    }

    // Module
    function alpha_sub4(member) {
        switch (member) {
            case 'min': return min_3;
            case 'max': return max_3;
            default: return undefined;
        }
    }

    // SequenceExpression
    function result() {
        const [APOSₒ, CPOSₒ] = savepoint(), ATYPₒ = ATYP;
        if (!foo()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        if (!result_sub1()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        return true;
    }

    // SequenceExpression
    function result_sub1() {
        const [APOSₒ, CPOSₒ] = savepoint(), ATYPₒ = ATYP;
        if (!bar()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        if (!baz()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        return true;
    }

    // ListExpression
    let myListₘ;
    function myList(arg) {
        try {
            return myListₘ(arg);
        }
        catch (err) {
            if (!(err instanceof TypeError) || !err.message.includes('myListₘ is not a function')) throw err;
            myListₘ = printList([
                {
                    kind: 'Element',
                    expr: digit
                },
                {
                    kind: 'Element',
                    expr: myList_sub1
                },
                {
                    kind: 'Element',
                    expr: myList_sub2
                },
            ]);
            return myListₘ(arg);
        }
    }

    // SequenceExpression
    function myList_sub1() {
        const [APOSₒ, CPOSₒ] = savepoint(), ATYPₒ = ATYP;
        if (!digit()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        if (!digit()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        return true;
    }

    // SequenceExpression
    function myList_sub2() {
        const [APOSₒ, CPOSₒ] = savepoint(), ATYPₒ = ATYP;
        if (!digit()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        if (!digit()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        if (!digit()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        return true;
    }

    // StringLiteral
    function b() {
        if (HAS_IN) {
            if (ATYP !== STRING) return false;
            if (APOS + 7 > AREP.length) return false;
            if (AREP[APOS + 0] !== 0x62) return false;
            if (AREP[APOS + 1] !== 0x20) return false;
            if (AREP[APOS + 2] !== 0x74) return false;
            if (AREP[APOS + 3] !== 0x68) return false;
            if (AREP[APOS + 4] !== 0x69) return false;
            if (AREP[APOS + 5] !== 0x6e) return false;
            if (AREP[APOS + 6] !== 0x67) return false;
            APOS += 7;
        }
        return true;
    }
    b.constant = {value: "b thing"};

    // StringLiteral
    function d() {
        if (HAS_IN) {
            if (ATYP !== STRING) return false;
            if (APOS + 7 > AREP.length) return false;
            if (AREP[APOS + 0] !== 0x64) return false;
            if (AREP[APOS + 1] !== 0x20) return false;
            if (AREP[APOS + 2] !== 0x74) return false;
            if (AREP[APOS + 3] !== 0x68) return false;
            if (AREP[APOS + 4] !== 0x69) return false;
            if (AREP[APOS + 5] !== 0x6e) return false;
            if (AREP[APOS + 6] !== 0x67) return false;
            APOS += 7;
        }
        return true;
    }
    d.constant = {value: "d thing"};

    // Module
    function rec(member) {
        switch (member) {
            case 'b': return b;
            case 'd': return d;
            default: return undefined;
        }
    }

    // Identifier
    function r2(arg) {
        return rec(arg);
    }

    // Identifier
    function r2d(arg) {
        return d(arg);
    }

    // Module
    function Ɱ_import_graph(member) {
        switch (member) {
            case 'foo': return foo;
            case 'bar': return bar;
            case 'baz': return baz;
            case 'ascii': return ascii;
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
    }

    // StringLiteral
    function f() {
        if (HAS_IN) {
            if (ATYP !== STRING) return false;
            if (APOS + 3 > AREP.length) return false;
            if (AREP[APOS + 0] !== 0x66) return false;
            if (AREP[APOS + 1] !== 0x6f) return false;
            if (AREP[APOS + 2] !== 0x6f) return false;
            APOS += 3;
        }
        if (HAS_OUT) {
            CREP[CPOS++] = 0x66;
            CREP[CPOS++] = 0x6f;
            CREP[CPOS++] = 0x6f;
        }
        return true;
    }
    f.constant = {value: "foo"};

    // StringLiteral
    function b_2() {
        if (HAS_IN) {
            if (ATYP !== STRING) return false;
            if (APOS + 3 > AREP.length) return false;
            if (AREP[APOS + 0] !== 0x62) return false;
            if (AREP[APOS + 1] !== 0x61) return false;
            if (AREP[APOS + 2] !== 0x72) return false;
            APOS += 3;
        }
        if (HAS_OUT) {
            CREP[CPOS++] = 0x62;
            CREP[CPOS++] = 0x61;
            CREP[CPOS++] = 0x72;
        }
        return true;
    }
    b_2.constant = {value: "bar"};

    // StringLiteral
    function baz_2() {
        if (HAS_IN) {
            if (ATYP !== STRING) return false;
            if (APOS + 3 > AREP.length) return false;
            if (AREP[APOS + 0] !== 0x62) return false;
            if (AREP[APOS + 1] !== 0x61) return false;
            if (AREP[APOS + 2] !== 0x7a) return false;
            APOS += 3;
        }
        if (HAS_OUT) {
            CREP[CPOS++] = 0x62;
            CREP[CPOS++] = 0x61;
            CREP[CPOS++] = 0x7a;
        }
        return true;
    }
    baz_2.constant = {value: "baz"};

    // Module
    function Ɱ_a(member) {
        switch (member) {
            case 'f': return f;
            case 'b': return b_2;
            case 'baz': return baz_2;
            default: return undefined;
        }
    }

    // Module
    function Ɱ_b(member) {
        switch (member) {
            default: return undefined;
        }
    }

    // Intrinsic

    // Intrinsic

    // Intrinsic

    // Intrinsic

    // Module
    function Ɱ_std(member) {
        switch (member) {
            case 'ascii': return ascii_2;
            case 'f64': return f64;
            case 'i32': return i32;
            case 'memoise': return memoise;
            default: return undefined;
        }
    }

    // Module
    function Ɱ_c(member) {
        switch (member) {
            default: return undefined;
        }
    }

    // Module
    function Ɱ_d(member) {
        switch (member) {
            default: return undefined;
        }
    }

    // Identifier
    function util1(arg) {
        return Ɱ_util1(arg);
    }

    // Identifier
    function util2(arg) {
        return Ɱ_util2(arg);
    }

    // Module
    function util(member) {
        switch (member) {
            case 'util1': return util1;
            case 'util2': return util2;
            default: return undefined;
        }
    }

    // Module
    function Ɱ_util(member) {
        switch (member) {
            case 'util': return util;
            default: return undefined;
        }
    }

    // StringLiteral
    function util1_2() {
        if (HAS_IN) {
            if (ATYP !== STRING) return false;
            if (APOS + 5 > AREP.length) return false;
            if (AREP[APOS + 0] !== 0x75) return false;
            if (AREP[APOS + 1] !== 0x74) return false;
            if (AREP[APOS + 2] !== 0x69) return false;
            if (AREP[APOS + 3] !== 0x6c) return false;
            if (AREP[APOS + 4] !== 0x31) return false;
            APOS += 5;
        }
        if (HAS_OUT) {
            CREP[CPOS++] = 0x75;
            CREP[CPOS++] = 0x74;
            CREP[CPOS++] = 0x69;
            CREP[CPOS++] = 0x6c;
            CREP[CPOS++] = 0x31;
        }
        return true;
    }
    util1_2.constant = {value: "util1"};

    // Module
    function Ɱ_util1(member) {
        switch (member) {
            case 'util1': return util1_2;
            default: return undefined;
        }
    }

    // StringLiteral
    function util2_2() {
        if (HAS_IN) {
            if (ATYP !== STRING) return false;
            if (APOS + 5 > AREP.length) return false;
            if (AREP[APOS + 0] !== 0x75) return false;
            if (AREP[APOS + 1] !== 0x74) return false;
            if (AREP[APOS + 2] !== 0x69) return false;
            if (AREP[APOS + 3] !== 0x6c) return false;
            if (AREP[APOS + 4] !== 0x32) return false;
            APOS += 5;
        }
        if (HAS_OUT) {
            CREP[CPOS++] = 0x75;
            CREP[CPOS++] = 0x74;
            CREP[CPOS++] = 0x69;
            CREP[CPOS++] = 0x6c;
            CREP[CPOS++] = 0x32;
        }
        return true;
    }
    util2_2.constant = {value: "util2"};

    // Module
    function Ɱ_util2(member) {
        switch (member) {
            case 'util2': return util2_2;
            default: return undefined;
        }
    }

    return start_2;
})();
