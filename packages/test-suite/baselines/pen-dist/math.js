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
    const ascii = extensions["V:/projects/oss/pen-monorepo/packages/core/penc/dist/deps/std.pen.js"].ascii({mode: 'parse'});
    const f64_2 = extensions["V:/projects/oss/pen-monorepo/packages/core/penc/dist/deps/std.pen.js"].f64({mode: 'parse'});
    const i32_2 = extensions["V:/projects/oss/pen-monorepo/packages/core/penc/dist/deps/std.pen.js"].i32({mode: 'parse'});
    const memoise_2 = extensions["V:/projects/oss/pen-monorepo/packages/core/penc/dist/deps/std.pen.js"].memoise({mode: 'parse'});

    // Identifier
    function memoise(arg) {
        return memoise_2(arg);
    }

    // Identifier
    function f64(arg) {
        return f64_2(arg);
    }

    // Identifier
    function i32(arg) {
        return i32_2(arg);
    }

    // Identifier
    function start_2(arg) {
        return expr(arg);
    }

    // InstantiationExpression
    let exprₘ;
    function expr(arg) {
        try {
            return exprₘ(arg);
        }
        catch (err) {
            if (!(err instanceof TypeError) || !err.message.includes('exprₘ is not a function')) throw err;
            exprₘ = memoise(expr_sub1);
            return exprₘ(arg);
        }
    }

    // SelectionExpression
    function expr_sub1() {
        if (add()) return true;
        if (sub()) return true;
        if (term()) return true;
        return false;
    }

    // RecordExpression
    let addₘ;
    function add(arg) {
        try {
            return addₘ(arg);
        }
        catch (err) {
            if (!(err instanceof TypeError) || !err.message.includes('addₘ is not a function')) throw err;
            addₘ = parseRecord([
                {
                    kind: 'Field',
                    name: "type",
                    expr: add_sub1
                },
                {
                    kind: 'Field',
                    name: "lhs",
                    expr: expr
                },
                {
                    kind: 'Field',
                    name: "rhs",
                    expr: add_sub2
                },
            ]);
            return addₘ(arg);
        }
    }

    // StringLiteral
    function add_sub1() {
        emitBytes(0x61, 0x64, 0x64);
        return true;
    }
    add_sub1.constant = {value: "add"};

    // SequenceExpression
    function add_sub2() {
        const [APOSₒ, CPOSₒ] = savepoint(), ATYPₒ = ATYP;
        let seqType = NOTHING;
        if (!add_sub3()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        seqType |= ATYP;
        if (!term()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        ATYP |= seqType;
        return true;
    }

    // CodeExpression
    function add_sub3() {
        const HAS_OUTₒ = HAS_OUT;
        HAS_OUT = false;
        const result = add_sub4();
        HAS_OUT = HAS_OUTₒ;
        ATYP = NOTHING;
        return result;
    }

    // ByteExpression
    function add_sub4() {
        let cc;
        if (HAS_IN) {
            if (CPOS >= CREP.length) return false;
            cc = CREP[CPOS];
            if (cc !== 0x2b) return false;
            CPOS += 1;
        }
        else {
            cc = 0x2b;
        }
        emitByte(cc);
        return true;
    }

    // RecordExpression
    let subₘ;
    function sub(arg) {
        try {
            return subₘ(arg);
        }
        catch (err) {
            if (!(err instanceof TypeError) || !err.message.includes('subₘ is not a function')) throw err;
            subₘ = parseRecord([
                {
                    kind: 'Field',
                    name: "type",
                    expr: sub_sub1
                },
                {
                    kind: 'Field',
                    name: "lhs",
                    expr: expr
                },
                {
                    kind: 'Field',
                    name: "rhs",
                    expr: sub_sub2
                },
            ]);
            return subₘ(arg);
        }
    }

    // StringLiteral
    function sub_sub1() {
        emitBytes(0x73, 0x75, 0x62);
        return true;
    }
    sub_sub1.constant = {value: "sub"};

    // SequenceExpression
    function sub_sub2() {
        const [APOSₒ, CPOSₒ] = savepoint(), ATYPₒ = ATYP;
        let seqType = NOTHING;
        if (!sub_sub3()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        seqType |= ATYP;
        if (!term()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        ATYP |= seqType;
        return true;
    }

    // CodeExpression
    function sub_sub3() {
        const HAS_OUTₒ = HAS_OUT;
        HAS_OUT = false;
        const result = sub_sub4();
        HAS_OUT = HAS_OUTₒ;
        ATYP = NOTHING;
        return result;
    }

    // ByteExpression
    function sub_sub4() {
        let cc;
        if (HAS_IN) {
            if (CPOS >= CREP.length) return false;
            cc = CREP[CPOS];
            if (cc !== 0x2d) return false;
            CPOS += 1;
        }
        else {
            cc = 0x2d;
        }
        emitByte(cc);
        return true;
    }

    // InstantiationExpression
    let termₘ;
    function term(arg) {
        try {
            return termₘ(arg);
        }
        catch (err) {
            if (!(err instanceof TypeError) || !err.message.includes('termₘ is not a function')) throw err;
            termₘ = memoise(term_sub1);
            return termₘ(arg);
        }
    }

    // SelectionExpression
    function term_sub1() {
        if (mul()) return true;
        if (div()) return true;
        if (factor()) return true;
        return false;
    }

    // RecordExpression
    let mulₘ;
    function mul(arg) {
        try {
            return mulₘ(arg);
        }
        catch (err) {
            if (!(err instanceof TypeError) || !err.message.includes('mulₘ is not a function')) throw err;
            mulₘ = parseRecord([
                {
                    kind: 'Field',
                    name: mul_sub1,
                    expr: mul_sub2
                },
                {
                    kind: 'Field',
                    name: "lhs",
                    expr: term
                },
                {
                    kind: 'Field',
                    name: mul_sub3,
                    expr: mul_sub4
                },
            ]);
            return mulₘ(arg);
        }
    }

    // StringLiteral
    function mul_sub1() {
        emitBytes(0x74, 0x79, 0x70, 0x65);
        return true;
    }
    mul_sub1.constant = {value: "type"};

    // StringLiteral
    function mul_sub2() {
        emitBytes(0x6d, 0x75, 0x6c);
        return true;
    }
    mul_sub2.constant = {value: "mul"};

    // StringLiteral
    function mul_sub3() {
        emitBytes(0x72, 0x68, 0x73);
        return true;
    }
    mul_sub3.constant = {value: "rhs"};

    // SequenceExpression
    function mul_sub4() {
        const [APOSₒ, CPOSₒ] = savepoint(), ATYPₒ = ATYP;
        let seqType = NOTHING;
        if (!mul_sub5()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        seqType |= ATYP;
        if (!factor()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        ATYP |= seqType;
        return true;
    }

    // CodeExpression
    function mul_sub5() {
        const HAS_OUTₒ = HAS_OUT;
        HAS_OUT = false;
        const result = mul_sub6();
        HAS_OUT = HAS_OUTₒ;
        ATYP = NOTHING;
        return result;
    }

    // ByteExpression
    function mul_sub6() {
        let cc;
        if (HAS_IN) {
            if (CPOS >= CREP.length) return false;
            cc = CREP[CPOS];
            if (cc !== 0x2a) return false;
            CPOS += 1;
        }
        else {
            cc = 0x2a;
        }
        emitByte(cc);
        return true;
    }

    // RecordExpression
    let divₘ;
    function div(arg) {
        try {
            return divₘ(arg);
        }
        catch (err) {
            if (!(err instanceof TypeError) || !err.message.includes('divₘ is not a function')) throw err;
            divₘ = parseRecord([
                {
                    kind: 'Field',
                    name: "type",
                    expr: div_sub1
                },
                {
                    kind: 'Field',
                    name: "lhs",
                    expr: term
                },
                {
                    kind: 'Field',
                    name: "rhs",
                    expr: div_sub2
                },
            ]);
            return divₘ(arg);
        }
    }

    // StringLiteral
    function div_sub1() {
        emitBytes(0x64, 0x69, 0x76);
        return true;
    }
    div_sub1.constant = {value: "div"};

    // SequenceExpression
    function div_sub2() {
        const [APOSₒ, CPOSₒ] = savepoint(), ATYPₒ = ATYP;
        let seqType = NOTHING;
        if (!div_sub3()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        seqType |= ATYP;
        if (!factor()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        ATYP |= seqType;
        return true;
    }

    // CodeExpression
    function div_sub3() {
        const HAS_OUTₒ = HAS_OUT;
        HAS_OUT = false;
        const result = div_sub4();
        HAS_OUT = HAS_OUTₒ;
        ATYP = NOTHING;
        return result;
    }

    // ByteExpression
    function div_sub4() {
        let cc;
        if (HAS_IN) {
            if (CPOS >= CREP.length) return false;
            cc = CREP[CPOS];
            if (cc !== 0x2f) return false;
            CPOS += 1;
        }
        else {
            cc = 0x2f;
        }
        emitByte(cc);
        return true;
    }

    // NumericLiteral
    function base() {
        emitScalar(16);
        return true;
    }
    base.constant = {value: 16};

    // BooleanLiteral
    function signed() {
        emitScalar(false);
        return true;
    }
    signed.constant = {value: false};

    // NumericLiteral
    function base_2() {
        emitScalar(2);
        return true;
    }
    base_2.constant = {value: 2};

    // BooleanLiteral
    function signed_2() {
        emitScalar(false);
        return true;
    }
    signed_2.constant = {value: false};

    // BooleanLiteral
    function signed_3() {
        emitScalar(false);
        return true;
    }
    signed_3.constant = {value: false};

    // SelectionExpression
    function factor() {
        if (factor_sub1()) return true;
        if (factor_sub6()) return true;
        if (factor_sub11()) return true;
        if (factor_sub16()) return true;
        if (factor_sub21()) return true;
        return false;
    }

    // SequenceExpression
    function factor_sub1() {
        const [APOSₒ, CPOSₒ] = savepoint(), ATYPₒ = ATYP;
        let seqType = NOTHING;
        if (!factor_sub2()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        seqType |= ATYP;
        if (!factor_sub4()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        seqType |= ATYP;
        if (!f64()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        ATYP |= seqType;
        return true;
    }

    // NotExpression
    function factor_sub2() {
        const [APOSₒ, CPOSₒ] = savepoint(), ATYPₒ = ATYP;
        const result = !factor_sub3();
        backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        ATYP = NOTHING;
        return result;
    }

    // StringLiteral
    function factor_sub3() {
        if (HAS_IN) {
            if (CPOS + 2 > CREP.length) return false;
            if (CREP[CPOS + 0] !== 0x30) return false;
            if (CREP[CPOS + 1] !== 0x78) return false;
            CPOS += 2;
        }
        emitBytes(0x30, 0x78);
        return true;
    }
    factor_sub3.constant = {value: "0x"};

    // NotExpression
    function factor_sub4() {
        const [APOSₒ, CPOSₒ] = savepoint(), ATYPₒ = ATYP;
        const result = !factor_sub5();
        backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        ATYP = NOTHING;
        return result;
    }

    // StringLiteral
    function factor_sub5() {
        if (HAS_IN) {
            if (CPOS + 2 > CREP.length) return false;
            if (CREP[CPOS + 0] !== 0x30) return false;
            if (CREP[CPOS + 1] !== 0x62) return false;
            CPOS += 2;
        }
        emitBytes(0x30, 0x62);
        return true;
    }
    factor_sub5.constant = {value: "0b"};

    // SequenceExpression
    function factor_sub6() {
        const [APOSₒ, CPOSₒ] = savepoint(), ATYPₒ = ATYP;
        let seqType = NOTHING;
        if (!factor_sub7()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        seqType |= ATYP;
        if (!factor_sub9()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        ATYP |= seqType;
        return true;
    }

    // CodeExpression
    function factor_sub7() {
        const HAS_OUTₒ = HAS_OUT;
        HAS_OUT = false;
        const result = factor_sub8();
        HAS_OUT = HAS_OUTₒ;
        ATYP = NOTHING;
        return result;
    }

    // StringLiteral
    function factor_sub8() {
        if (HAS_IN) {
            if (CPOS + 2 > CREP.length) return false;
            if (CREP[CPOS + 0] !== 0x30) return false;
            if (CREP[CPOS + 1] !== 0x78) return false;
            CPOS += 2;
        }
        emitBytes(0x30, 0x78);
        return true;
    }
    factor_sub8.constant = {value: "0x"};

    // InstantiationExpression
    let factor_sub9ₘ;
    function factor_sub9(arg) {
        try {
            return factor_sub9ₘ(arg);
        }
        catch (err) {
            if (!(err instanceof TypeError) || !err.message.includes('factor_sub9ₘ is not a function')) throw err;
            factor_sub9ₘ = i32(factor_sub10);
            return factor_sub9ₘ(arg);
        }
    }

    // Module
    function factor_sub10(member) {
        switch (member) {
            case 'base': return base;
            case 'signed': return signed;
            default: return undefined;
        }
    }

    // SequenceExpression
    function factor_sub11() {
        const [APOSₒ, CPOSₒ] = savepoint(), ATYPₒ = ATYP;
        let seqType = NOTHING;
        if (!factor_sub12()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        seqType |= ATYP;
        if (!factor_sub14()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        ATYP |= seqType;
        return true;
    }

    // CodeExpression
    function factor_sub12() {
        const HAS_OUTₒ = HAS_OUT;
        HAS_OUT = false;
        const result = factor_sub13();
        HAS_OUT = HAS_OUTₒ;
        ATYP = NOTHING;
        return result;
    }

    // StringLiteral
    function factor_sub13() {
        if (HAS_IN) {
            if (CPOS + 2 > CREP.length) return false;
            if (CREP[CPOS + 0] !== 0x30) return false;
            if (CREP[CPOS + 1] !== 0x62) return false;
            CPOS += 2;
        }
        emitBytes(0x30, 0x62);
        return true;
    }
    factor_sub13.constant = {value: "0b"};

    // InstantiationExpression
    let factor_sub14ₘ;
    function factor_sub14(arg) {
        try {
            return factor_sub14ₘ(arg);
        }
        catch (err) {
            if (!(err instanceof TypeError) || !err.message.includes('factor_sub14ₘ is not a function')) throw err;
            factor_sub14ₘ = i32(factor_sub15);
            return factor_sub14ₘ(arg);
        }
    }

    // Module
    function factor_sub15(member) {
        switch (member) {
            case 'base': return base_2;
            case 'signed': return signed_2;
            default: return undefined;
        }
    }

    // SequenceExpression
    function factor_sub16() {
        const [APOSₒ, CPOSₒ] = savepoint(), ATYPₒ = ATYP;
        let seqType = NOTHING;
        if (!factor_sub17()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        seqType |= ATYP;
        if (!factor_sub19()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        ATYP |= seqType;
        return true;
    }

    // CodeExpression
    function factor_sub17() {
        const HAS_OUTₒ = HAS_OUT;
        HAS_OUT = false;
        const result = factor_sub18();
        HAS_OUT = HAS_OUTₒ;
        ATYP = NOTHING;
        return result;
    }

    // ByteExpression
    function factor_sub18() {
        let cc;
        if (HAS_IN) {
            if (CPOS >= CREP.length) return false;
            cc = CREP[CPOS];
            if (cc !== 0x69) return false;
            CPOS += 1;
        }
        else {
            cc = 0x69;
        }
        emitByte(cc);
        return true;
    }

    // InstantiationExpression
    let factor_sub19ₘ;
    function factor_sub19(arg) {
        try {
            return factor_sub19ₘ(arg);
        }
        catch (err) {
            if (!(err instanceof TypeError) || !err.message.includes('factor_sub19ₘ is not a function')) throw err;
            factor_sub19ₘ = i32(factor_sub20);
            return factor_sub19ₘ(arg);
        }
    }

    // Module
    function factor_sub20(member) {
        switch (member) {
            case 'signed': return signed_3;
            default: return undefined;
        }
    }

    // SequenceExpression
    function factor_sub21() {
        const [APOSₒ, CPOSₒ] = savepoint(), ATYPₒ = ATYP;
        let seqType = NOTHING;
        if (!factor_sub22()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        seqType |= ATYP;
        if (!expr()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        seqType |= ATYP;
        if (!factor_sub24()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        ATYP |= seqType;
        return true;
    }

    // CodeExpression
    function factor_sub22() {
        const HAS_OUTₒ = HAS_OUT;
        HAS_OUT = false;
        const result = factor_sub23();
        HAS_OUT = HAS_OUTₒ;
        ATYP = NOTHING;
        return result;
    }

    // ByteExpression
    function factor_sub23() {
        let cc;
        if (HAS_IN) {
            if (CPOS >= CREP.length) return false;
            cc = CREP[CPOS];
            if (cc !== 0x28) return false;
            CPOS += 1;
        }
        else {
            cc = 0x28;
        }
        emitByte(cc);
        return true;
    }

    // CodeExpression
    function factor_sub24() {
        const HAS_OUTₒ = HAS_OUT;
        HAS_OUT = false;
        const result = factor_sub25();
        HAS_OUT = HAS_OUTₒ;
        ATYP = NOTHING;
        return result;
    }

    // ByteExpression
    function factor_sub25() {
        let cc;
        if (HAS_IN) {
            if (CPOS >= CREP.length) return false;
            cc = CREP[CPOS];
            if (cc !== 0x29) return false;
            CPOS += 1;
        }
        else {
            cc = 0x29;
        }
        emitByte(cc);
        return true;
    }

    // Module
    function Ɱ_math(member) {
        switch (member) {
            case 'memoise': return memoise;
            case 'f64': return f64;
            case 'i32': return i32;
            case 'start': return start_2;
            case 'expr': return expr;
            case 'add': return add;
            case 'sub': return sub;
            case 'term': return term;
            case 'mul': return mul;
            case 'div': return div;
            case 'factor': return factor;
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
            case 'ascii': return ascii;
            case 'f64': return f64_2;
            case 'i32': return i32_2;
            case 'memoise': return memoise_2;
            default: return undefined;
        }
    }

    return start_2;
})();




// ------------------------------ PRINT ------------------------------
const print = (() => {

    // Intrinsic
    const ascii = extensions["V:/projects/oss/pen-monorepo/packages/core/penc/dist/deps/std.pen.js"].ascii({mode: 'print'});
    const f64_2 = extensions["V:/projects/oss/pen-monorepo/packages/core/penc/dist/deps/std.pen.js"].f64({mode: 'print'});
    const i32_2 = extensions["V:/projects/oss/pen-monorepo/packages/core/penc/dist/deps/std.pen.js"].i32({mode: 'print'});
    const memoise_2 = extensions["V:/projects/oss/pen-monorepo/packages/core/penc/dist/deps/std.pen.js"].memoise({mode: 'print'});

    // Identifier
    function memoise(arg) {
        return memoise_2(arg);
    }

    // Identifier
    function f64(arg) {
        return f64_2(arg);
    }

    // Identifier
    function i32(arg) {
        return i32_2(arg);
    }

    // Identifier
    function start_2(arg) {
        return expr(arg);
    }

    // InstantiationExpression
    let exprₘ;
    function expr(arg) {
        try {
            return exprₘ(arg);
        }
        catch (err) {
            if (!(err instanceof TypeError) || !err.message.includes('exprₘ is not a function')) throw err;
            exprₘ = memoise(expr_sub1);
            return exprₘ(arg);
        }
    }

    // SelectionExpression
    function expr_sub1() {
        if (add()) return true;
        if (sub()) return true;
        if (term()) return true;
        return false;
    }

    // RecordExpression
    let addₘ;
    function add(arg) {
        try {
            return addₘ(arg);
        }
        catch (err) {
            if (!(err instanceof TypeError) || !err.message.includes('addₘ is not a function')) throw err;
            addₘ = printRecord([
                {
                    kind: 'Field',
                    name: "type",
                    expr: add_sub1
                },
                {
                    kind: 'Field',
                    name: "lhs",
                    expr: expr
                },
                {
                    kind: 'Field',
                    name: "rhs",
                    expr: add_sub2
                },
            ]);
            return addₘ(arg);
        }
    }

    // StringLiteral
    function add_sub1() {
        if (HAS_IN) {
            if (ATYP !== STRING) return false;
            if (APOS + 3 > AREP.length) return false;
            if (AREP[APOS + 0] !== 0x61) return false;
            if (AREP[APOS + 1] !== 0x64) return false;
            if (AREP[APOS + 2] !== 0x64) return false;
            APOS += 3;
        }
        return true;
    }
    add_sub1.constant = {value: "add"};

    // SequenceExpression
    function add_sub2() {
        const [APOSₒ, CPOSₒ] = savepoint(), ATYPₒ = ATYP;
        if (!add_sub3()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        if (!term()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        return true;
    }

    // CodeExpression
    function add_sub3() {
        const HAS_INₒ = HAS_IN;
        HAS_IN = false;
        const result = add_sub4();
        HAS_IN = HAS_INₒ;
        return result;
    }

    // ByteExpression
    function add_sub4() {
        let cc;
        if (HAS_IN) {
            if (ATYP !== STRING) return false;
            if (APOS >= AREP.length) return false;
            cc = AREP[APOS];
            if (cc !== 0x2b) return false;
            APOS += 1;
        }
        else {
            cc = 0x2b;
        }
        if (HAS_OUT) CREP[CPOS++] = cc;
        return true;
    }

    // RecordExpression
    let subₘ;
    function sub(arg) {
        try {
            return subₘ(arg);
        }
        catch (err) {
            if (!(err instanceof TypeError) || !err.message.includes('subₘ is not a function')) throw err;
            subₘ = printRecord([
                {
                    kind: 'Field',
                    name: "type",
                    expr: sub_sub1
                },
                {
                    kind: 'Field',
                    name: "lhs",
                    expr: expr
                },
                {
                    kind: 'Field',
                    name: "rhs",
                    expr: sub_sub2
                },
            ]);
            return subₘ(arg);
        }
    }

    // StringLiteral
    function sub_sub1() {
        if (HAS_IN) {
            if (ATYP !== STRING) return false;
            if (APOS + 3 > AREP.length) return false;
            if (AREP[APOS + 0] !== 0x73) return false;
            if (AREP[APOS + 1] !== 0x75) return false;
            if (AREP[APOS + 2] !== 0x62) return false;
            APOS += 3;
        }
        return true;
    }
    sub_sub1.constant = {value: "sub"};

    // SequenceExpression
    function sub_sub2() {
        const [APOSₒ, CPOSₒ] = savepoint(), ATYPₒ = ATYP;
        if (!sub_sub3()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        if (!term()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        return true;
    }

    // CodeExpression
    function sub_sub3() {
        const HAS_INₒ = HAS_IN;
        HAS_IN = false;
        const result = sub_sub4();
        HAS_IN = HAS_INₒ;
        return result;
    }

    // ByteExpression
    function sub_sub4() {
        let cc;
        if (HAS_IN) {
            if (ATYP !== STRING) return false;
            if (APOS >= AREP.length) return false;
            cc = AREP[APOS];
            if (cc !== 0x2d) return false;
            APOS += 1;
        }
        else {
            cc = 0x2d;
        }
        if (HAS_OUT) CREP[CPOS++] = cc;
        return true;
    }

    // InstantiationExpression
    let termₘ;
    function term(arg) {
        try {
            return termₘ(arg);
        }
        catch (err) {
            if (!(err instanceof TypeError) || !err.message.includes('termₘ is not a function')) throw err;
            termₘ = memoise(term_sub1);
            return termₘ(arg);
        }
    }

    // SelectionExpression
    function term_sub1() {
        if (mul()) return true;
        if (div()) return true;
        if (factor()) return true;
        return false;
    }

    // RecordExpression
    let mulₘ;
    function mul(arg) {
        try {
            return mulₘ(arg);
        }
        catch (err) {
            if (!(err instanceof TypeError) || !err.message.includes('mulₘ is not a function')) throw err;
            mulₘ = printRecord([
                {
                    kind: 'Field',
                    name: mul_sub1,
                    expr: mul_sub2
                },
                {
                    kind: 'Field',
                    name: "lhs",
                    expr: term
                },
                {
                    kind: 'Field',
                    name: mul_sub3,
                    expr: mul_sub4
                },
            ]);
            return mulₘ(arg);
        }
    }

    // StringLiteral
    function mul_sub1() {
        if (HAS_IN) {
            if (ATYP !== STRING) return false;
            if (APOS + 4 > AREP.length) return false;
            if (AREP[APOS + 0] !== 0x74) return false;
            if (AREP[APOS + 1] !== 0x79) return false;
            if (AREP[APOS + 2] !== 0x70) return false;
            if (AREP[APOS + 3] !== 0x65) return false;
            APOS += 4;
        }
        return true;
    }
    mul_sub1.constant = {value: "type"};

    // StringLiteral
    function mul_sub2() {
        if (HAS_IN) {
            if (ATYP !== STRING) return false;
            if (APOS + 3 > AREP.length) return false;
            if (AREP[APOS + 0] !== 0x6d) return false;
            if (AREP[APOS + 1] !== 0x75) return false;
            if (AREP[APOS + 2] !== 0x6c) return false;
            APOS += 3;
        }
        return true;
    }
    mul_sub2.constant = {value: "mul"};

    // StringLiteral
    function mul_sub3() {
        if (HAS_IN) {
            if (ATYP !== STRING) return false;
            if (APOS + 3 > AREP.length) return false;
            if (AREP[APOS + 0] !== 0x72) return false;
            if (AREP[APOS + 1] !== 0x68) return false;
            if (AREP[APOS + 2] !== 0x73) return false;
            APOS += 3;
        }
        return true;
    }
    mul_sub3.constant = {value: "rhs"};

    // SequenceExpression
    function mul_sub4() {
        const [APOSₒ, CPOSₒ] = savepoint(), ATYPₒ = ATYP;
        if (!mul_sub5()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        if (!factor()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        return true;
    }

    // CodeExpression
    function mul_sub5() {
        const HAS_INₒ = HAS_IN;
        HAS_IN = false;
        const result = mul_sub6();
        HAS_IN = HAS_INₒ;
        return result;
    }

    // ByteExpression
    function mul_sub6() {
        let cc;
        if (HAS_IN) {
            if (ATYP !== STRING) return false;
            if (APOS >= AREP.length) return false;
            cc = AREP[APOS];
            if (cc !== 0x2a) return false;
            APOS += 1;
        }
        else {
            cc = 0x2a;
        }
        if (HAS_OUT) CREP[CPOS++] = cc;
        return true;
    }

    // RecordExpression
    let divₘ;
    function div(arg) {
        try {
            return divₘ(arg);
        }
        catch (err) {
            if (!(err instanceof TypeError) || !err.message.includes('divₘ is not a function')) throw err;
            divₘ = printRecord([
                {
                    kind: 'Field',
                    name: "type",
                    expr: div_sub1
                },
                {
                    kind: 'Field',
                    name: "lhs",
                    expr: term
                },
                {
                    kind: 'Field',
                    name: "rhs",
                    expr: div_sub2
                },
            ]);
            return divₘ(arg);
        }
    }

    // StringLiteral
    function div_sub1() {
        if (HAS_IN) {
            if (ATYP !== STRING) return false;
            if (APOS + 3 > AREP.length) return false;
            if (AREP[APOS + 0] !== 0x64) return false;
            if (AREP[APOS + 1] !== 0x69) return false;
            if (AREP[APOS + 2] !== 0x76) return false;
            APOS += 3;
        }
        return true;
    }
    div_sub1.constant = {value: "div"};

    // SequenceExpression
    function div_sub2() {
        const [APOSₒ, CPOSₒ] = savepoint(), ATYPₒ = ATYP;
        if (!div_sub3()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        if (!factor()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        return true;
    }

    // CodeExpression
    function div_sub3() {
        const HAS_INₒ = HAS_IN;
        HAS_IN = false;
        const result = div_sub4();
        HAS_IN = HAS_INₒ;
        return result;
    }

    // ByteExpression
    function div_sub4() {
        let cc;
        if (HAS_IN) {
            if (ATYP !== STRING) return false;
            if (APOS >= AREP.length) return false;
            cc = AREP[APOS];
            if (cc !== 0x2f) return false;
            APOS += 1;
        }
        else {
            cc = 0x2f;
        }
        if (HAS_OUT) CREP[CPOS++] = cc;
        return true;
    }

    // NumericLiteral
    function base() {
        if (HAS_IN) {
            if (ATYP !== SCALAR) return false;
            if (AREP[APOS] !== 16) return false;
            APOS += 1;
        }
        return true;
    }
    base.constant = {value: 16};

    // BooleanLiteral
    function signed() {
        if (HAS_IN) {
            if (ATYP !== SCALAR) return false;
            if (AREP[APOS] !== false) return false;
            APOS += 1;
        }
        return true;
    }
    signed.constant = {value: false};

    // NumericLiteral
    function base_2() {
        if (HAS_IN) {
            if (ATYP !== SCALAR) return false;
            if (AREP[APOS] !== 2) return false;
            APOS += 1;
        }
        return true;
    }
    base_2.constant = {value: 2};

    // BooleanLiteral
    function signed_2() {
        if (HAS_IN) {
            if (ATYP !== SCALAR) return false;
            if (AREP[APOS] !== false) return false;
            APOS += 1;
        }
        return true;
    }
    signed_2.constant = {value: false};

    // BooleanLiteral
    function signed_3() {
        if (HAS_IN) {
            if (ATYP !== SCALAR) return false;
            if (AREP[APOS] !== false) return false;
            APOS += 1;
        }
        return true;
    }
    signed_3.constant = {value: false};

    // SelectionExpression
    function factor() {
        if (factor_sub1()) return true;
        if (factor_sub6()) return true;
        if (factor_sub11()) return true;
        if (factor_sub16()) return true;
        if (factor_sub21()) return true;
        return false;
    }

    // SequenceExpression
    function factor_sub1() {
        const [APOSₒ, CPOSₒ] = savepoint(), ATYPₒ = ATYP;
        if (!factor_sub2()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        if (!factor_sub4()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        if (!f64()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        return true;
    }

    // NotExpression
    function factor_sub2() {
        const [APOSₒ, CPOSₒ] = savepoint(), ATYPₒ = ATYP;
        const result = !factor_sub3();
        backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        return result;
    }

    // StringLiteral
    function factor_sub3() {
        if (HAS_IN) {
            if (ATYP !== STRING) return false;
            if (APOS + 2 > AREP.length) return false;
            if (AREP[APOS + 0] !== 0x30) return false;
            if (AREP[APOS + 1] !== 0x78) return false;
            APOS += 2;
        }
        if (HAS_OUT) {
            CREP[CPOS++] = 0x30;
            CREP[CPOS++] = 0x78;
        }
        return true;
    }
    factor_sub3.constant = {value: "0x"};

    // NotExpression
    function factor_sub4() {
        const [APOSₒ, CPOSₒ] = savepoint(), ATYPₒ = ATYP;
        const result = !factor_sub5();
        backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        return result;
    }

    // StringLiteral
    function factor_sub5() {
        if (HAS_IN) {
            if (ATYP !== STRING) return false;
            if (APOS + 2 > AREP.length) return false;
            if (AREP[APOS + 0] !== 0x30) return false;
            if (AREP[APOS + 1] !== 0x62) return false;
            APOS += 2;
        }
        if (HAS_OUT) {
            CREP[CPOS++] = 0x30;
            CREP[CPOS++] = 0x62;
        }
        return true;
    }
    factor_sub5.constant = {value: "0b"};

    // SequenceExpression
    function factor_sub6() {
        const [APOSₒ, CPOSₒ] = savepoint(), ATYPₒ = ATYP;
        if (!factor_sub7()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        if (!factor_sub9()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        return true;
    }

    // CodeExpression
    function factor_sub7() {
        const HAS_INₒ = HAS_IN;
        HAS_IN = false;
        const result = factor_sub8();
        HAS_IN = HAS_INₒ;
        return result;
    }

    // StringLiteral
    function factor_sub8() {
        if (HAS_IN) {
            if (ATYP !== STRING) return false;
            if (APOS + 2 > AREP.length) return false;
            if (AREP[APOS + 0] !== 0x30) return false;
            if (AREP[APOS + 1] !== 0x78) return false;
            APOS += 2;
        }
        if (HAS_OUT) {
            CREP[CPOS++] = 0x30;
            CREP[CPOS++] = 0x78;
        }
        return true;
    }
    factor_sub8.constant = {value: "0x"};

    // InstantiationExpression
    let factor_sub9ₘ;
    function factor_sub9(arg) {
        try {
            return factor_sub9ₘ(arg);
        }
        catch (err) {
            if (!(err instanceof TypeError) || !err.message.includes('factor_sub9ₘ is not a function')) throw err;
            factor_sub9ₘ = i32(factor_sub10);
            return factor_sub9ₘ(arg);
        }
    }

    // Module
    function factor_sub10(member) {
        switch (member) {
            case 'base': return base;
            case 'signed': return signed;
            default: return undefined;
        }
    }

    // SequenceExpression
    function factor_sub11() {
        const [APOSₒ, CPOSₒ] = savepoint(), ATYPₒ = ATYP;
        if (!factor_sub12()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        if (!factor_sub14()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        return true;
    }

    // CodeExpression
    function factor_sub12() {
        const HAS_INₒ = HAS_IN;
        HAS_IN = false;
        const result = factor_sub13();
        HAS_IN = HAS_INₒ;
        return result;
    }

    // StringLiteral
    function factor_sub13() {
        if (HAS_IN) {
            if (ATYP !== STRING) return false;
            if (APOS + 2 > AREP.length) return false;
            if (AREP[APOS + 0] !== 0x30) return false;
            if (AREP[APOS + 1] !== 0x62) return false;
            APOS += 2;
        }
        if (HAS_OUT) {
            CREP[CPOS++] = 0x30;
            CREP[CPOS++] = 0x62;
        }
        return true;
    }
    factor_sub13.constant = {value: "0b"};

    // InstantiationExpression
    let factor_sub14ₘ;
    function factor_sub14(arg) {
        try {
            return factor_sub14ₘ(arg);
        }
        catch (err) {
            if (!(err instanceof TypeError) || !err.message.includes('factor_sub14ₘ is not a function')) throw err;
            factor_sub14ₘ = i32(factor_sub15);
            return factor_sub14ₘ(arg);
        }
    }

    // Module
    function factor_sub15(member) {
        switch (member) {
            case 'base': return base_2;
            case 'signed': return signed_2;
            default: return undefined;
        }
    }

    // SequenceExpression
    function factor_sub16() {
        const [APOSₒ, CPOSₒ] = savepoint(), ATYPₒ = ATYP;
        if (!factor_sub17()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        if (!factor_sub19()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        return true;
    }

    // CodeExpression
    function factor_sub17() {
        const HAS_INₒ = HAS_IN;
        HAS_IN = false;
        const result = factor_sub18();
        HAS_IN = HAS_INₒ;
        return result;
    }

    // ByteExpression
    function factor_sub18() {
        let cc;
        if (HAS_IN) {
            if (ATYP !== STRING) return false;
            if (APOS >= AREP.length) return false;
            cc = AREP[APOS];
            if (cc !== 0x69) return false;
            APOS += 1;
        }
        else {
            cc = 0x69;
        }
        if (HAS_OUT) CREP[CPOS++] = cc;
        return true;
    }

    // InstantiationExpression
    let factor_sub19ₘ;
    function factor_sub19(arg) {
        try {
            return factor_sub19ₘ(arg);
        }
        catch (err) {
            if (!(err instanceof TypeError) || !err.message.includes('factor_sub19ₘ is not a function')) throw err;
            factor_sub19ₘ = i32(factor_sub20);
            return factor_sub19ₘ(arg);
        }
    }

    // Module
    function factor_sub20(member) {
        switch (member) {
            case 'signed': return signed_3;
            default: return undefined;
        }
    }

    // SequenceExpression
    function factor_sub21() {
        const [APOSₒ, CPOSₒ] = savepoint(), ATYPₒ = ATYP;
        if (!factor_sub22()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        if (!expr()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        if (!factor_sub24()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        return true;
    }

    // CodeExpression
    function factor_sub22() {
        const HAS_INₒ = HAS_IN;
        HAS_IN = false;
        const result = factor_sub23();
        HAS_IN = HAS_INₒ;
        return result;
    }

    // ByteExpression
    function factor_sub23() {
        let cc;
        if (HAS_IN) {
            if (ATYP !== STRING) return false;
            if (APOS >= AREP.length) return false;
            cc = AREP[APOS];
            if (cc !== 0x28) return false;
            APOS += 1;
        }
        else {
            cc = 0x28;
        }
        if (HAS_OUT) CREP[CPOS++] = cc;
        return true;
    }

    // CodeExpression
    function factor_sub24() {
        const HAS_INₒ = HAS_IN;
        HAS_IN = false;
        const result = factor_sub25();
        HAS_IN = HAS_INₒ;
        return result;
    }

    // ByteExpression
    function factor_sub25() {
        let cc;
        if (HAS_IN) {
            if (ATYP !== STRING) return false;
            if (APOS >= AREP.length) return false;
            cc = AREP[APOS];
            if (cc !== 0x29) return false;
            APOS += 1;
        }
        else {
            cc = 0x29;
        }
        if (HAS_OUT) CREP[CPOS++] = cc;
        return true;
    }

    // Module
    function Ɱ_math(member) {
        switch (member) {
            case 'memoise': return memoise;
            case 'f64': return f64;
            case 'i32': return i32;
            case 'start': return start_2;
            case 'expr': return expr;
            case 'add': return add;
            case 'sub': return sub;
            case 'term': return term;
            case 'mul': return mul;
            case 'div': return div;
            case 'factor': return factor;
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
            case 'ascii': return ascii;
            case 'f64': return f64_2;
            case 'i32': return i32_2;
            case 'memoise': return memoise_2;
            default: return undefined;
        }
    }

    return start_2;
})();
