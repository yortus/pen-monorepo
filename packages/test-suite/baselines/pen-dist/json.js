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
        const [APOSₒ, CPOSₒ, ATYPₒ] = savepoint();
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
                AREP[APOS - 1] = [fieldName, AREP[APOS - 1]];
                fieldNames.push(fieldName);
            }
            else {
                const apos = APOS;
                if (!recordItem.expr())
                    return backtrack(APOSₒ, CPOSₒ);
                for (let i = apos; i < APOS; ++i) {
                    const fieldName = AREP[i][0];
                    if (fieldNames.includes(fieldName))
                        return backtrack(APOSₒ, CPOSₒ);
                    fieldNames.push(fieldName);
                }
            }
        }
        ATYP = RECORD;
        return true;
    };
}
function printRecord(recordItems) {
    return function RCD() {
        if (ATYP !== RECORD)
            return false;
        const [APOSₒ, CPOSₒ, ATYPₒ] = savepoint();
        const propList = AREP;
        const propCount = AREP.length;
        let bitmask = APOS;
        outerLoop: for (const recordItem of recordItems) {
            if (recordItem.kind === 'Field') {
                for (let i = 0; i < propCount; ++i) {
                    let propName = propList[i][0];
                    const propBit = 1 << i;
                    if ((bitmask & propBit) !== 0)
                        continue;
                    if (typeof recordItem.name !== 'string') {
                        AREP = propList[i];
                        APOS = 0;
                        if (!printInner(recordItem.name, true))
                            continue;
                    }
                    else {
                        if (propName !== recordItem.name)
                            continue;
                    }
                    AREP = propList[i];
                    APOS = 1;
                    if (!printInner(recordItem.expr, true))
                        continue;
                    bitmask += propBit;
                    continue outerLoop;
                }
                AREP = propList;
                return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
            }
            else {
                AREP = propList;
                APOS = bitmask;
                ATYP = RECORD;
                if (!recordItem.expr())
                    return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
                bitmask = APOS;
            }
        }
        AREP = propList;
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
const savepoint = () => [APOS, CPOS, ATYP];
const backtrack = (APOSₒ, CPOSₒ, ATYPₒ) => (APOS = APOSₒ, CPOS = CPOSₒ, ATYP = ATYPₒ !== null && ATYPₒ !== void 0 ? ATYPₒ : NOTHING, false);
function parseInner(rule, mustProduce) {
    const APOSₒ = APOS;
    if (!rule())
        return false;
    switch (ATYP) {
        case NOTHING:
            return mustProduce;
        case SCALAR:
            assert(APOS - APOSₒ === 1);
            return true;
        case STRING:
            if (APOS - APOSₒ > 1) {
                const str = AREP.slice(APOSₒ, APOS).join('');
                AREP[APOSₒ] = str;
                APOS = APOSₒ + 1;
            }
            return true;
        case LIST:
            const lst = AREP.slice(APOSₒ, APOS);
            AREP[APOSₒ] = lst;
            APOS = APOSₒ + 1;
            return true;
        case RECORD:
            const rec = Object.fromEntries(AREP.slice(APOSₒ, APOS));
            AREP[APOSₒ] = rec;
            APOS = APOSₒ + 1;
            return true;
        default:
            ((atyp) => { throw new Error(`Unhandled abstract type ${atyp}`); })(ATYP);
    }
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
        assert(APOS === APOSₒ);
        return result;
    }
    if (value === null || value === true || value === false || typeof value === 'number') {
        ATYP = SCALAR;
        const result = rule();
        assert(APOS - APOSₒ === 1);
        return result;
    }
    if (typeof value === 'string') {
        AREP = value;
        atyp = ATYP = STRING;
    }
    else if (Array.isArray(value)) {
        AREP = value;
        atyp = ATYP = LIST;
    }
    else if (typeof value === 'object') {
        AREP = value = [...Object.entries(value)];
        assert(AREP.length <= 32);
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
        const keyCount = value.length;
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
                        if (HAS_OUT)
                            AREP[APOS++] = String.fromCharCode(cc);
                        ATYP = HAS_OUT ? STRING : NOTHING;
                        return true;
                    };
                }
                else /* mode === 'print' */ {
                    return function ASC() {
                        let cc;
                        if (HAS_IN) {
                            if (ATYP !== STRING)
                                return false;
                            const arep = AREP; // TODO: fix cast
                            if (APOS >= arep.length)
                                return false;
                            cc = arep.charCodeAt(APOS);
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
                    if (HAS_OUT)
                        AREP[APOS++] = num;
                    ATYP = HAS_OUT ? SCALAR : NOTHING;
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
                        if (HAS_OUT)
                            AREP[APOS++] = num;
                        ATYP = HAS_OUT ? SCALAR : NOTHING;
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
                        const [APOSₒ, CPOSₒ] = [APOS, CPOS];
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
                                CPOS = CPOSₒ;
                                APOS = APOSₒ;
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
                        CPOS = memo.IPOSᐟ;
                        APOS = APOSₒ;
                        for (let i = 0; i < memo.OREPᐞ.length; ++i)
                            AREP[APOS++] = memo.OREPᐞ[i];
                        ATYP = memo.ATYPᐟ;
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
    "V:/projects/oss/pen-monorepo/packages/core/penc/dist/deps/experiments.pen.js": (() => {
        "use strict";
        /* @pen exports = {
            unicode
        } */
        function unicode({ mode }) {
            return function UNI_generic(expr) {
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
                if (mode === 'parse') {
                    return function UNI() {
                        // TODO: was... still need equiv?   if (typeof IN !== 'string') return false;
                        const [APOSₒ, CPOSₒ] = savepoint();
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
                            return backtrack(APOSₒ, CPOSₒ);
                        // tslint:disable-next-line: no-eval
                        if (HAS_OUT)
                            AREP[APOS++] = eval(`"\\u{${num}}"`); // TODO: hacky... fix when we have a charCode
                        ATYP = HAS_OUT ? STRING : NOTHING;
                        return true;
                    };
                }
                else /* mode === 'print' */ {
                    return function UNI() {
                        // TODO: implement
                        return false;
                    };
                }
            };
        }
        return {unicode};
    })(),
};




// ------------------------------ PARSE ------------------------------
const parse = (() => {

    // Intrinsic
    const ascii_2 = extensions["V:/projects/oss/pen-monorepo/packages/core/penc/dist/deps/std.pen.js"].ascii({mode: 'parse'});
    const f64_2 = extensions["V:/projects/oss/pen-monorepo/packages/core/penc/dist/deps/std.pen.js"].f64({mode: 'parse'});
    const i32 = extensions["V:/projects/oss/pen-monorepo/packages/core/penc/dist/deps/std.pen.js"].i32({mode: 'parse'});
    const memoise = extensions["V:/projects/oss/pen-monorepo/packages/core/penc/dist/deps/std.pen.js"].memoise({mode: 'parse'});
    const unicode_2 = extensions["V:/projects/oss/pen-monorepo/packages/core/penc/dist/deps/experiments.pen.js"].unicode({mode: 'parse'});

    // Identifier
    function ascii(arg) {
        return ascii_2(arg);
    }

    // Identifier
    function f64(arg) {
        return f64_2(arg);
    }

    // Identifier
    function unicode(arg) {
        return unicode_2(arg);
    }

    // SequenceExpression
    function start_2() {
        const [APOSₒ, CPOSₒ, ATYPₒ] = savepoint();
        let seqType = NOTHING;
        if (!WS()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        seqType |= ATYP;
        if (!Value()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        seqType |= ATYP;
        if (!WS()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        ATYP |= seqType;
        return true;
    }

    // SelectionExpression
    function Value() {
        if (False()) return true;
        if (Null()) return true;
        if (True()) return true;
        if (Object()) return true;
        if (Array()) return true;
        if (Number()) return true;
        if (String()) return true;
        return false;
    }

    // SequenceExpression
    function False() {
        const [APOSₒ, CPOSₒ, ATYPₒ] = savepoint();
        let seqType = NOTHING;
        if (!False_sub1()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        seqType |= ATYP;
        if (!False_sub3()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        ATYP |= seqType;
        return true;
    }

    // CodeExpression
    function False_sub1() {
        const HAS_OUTₒ = HAS_OUT;
        HAS_OUT = false;
        const result = False_sub2();
        HAS_OUT = HAS_OUTₒ;
        ATYP = NOTHING;
        return result;
    }

    // StringUniversal
    function False_sub2() {
        if (HAS_IN) {
            if (CPOS + 5 > CREP.length) return false;
            if (CREP[CPOS + 0] !== 102) return false;
            if (CREP[CPOS + 1] !== 97) return false;
            if (CREP[CPOS + 2] !== 108) return false;
            if (CREP[CPOS + 3] !== 115) return false;
            if (CREP[CPOS + 4] !== 101) return false;
            CPOS += 5;
        }
        if (HAS_OUT) {
            AREP[APOS++] = "false";
        }
        ATYP = HAS_OUT ? STRING : NOTHING;
        return true;
    }
    False_sub2.constant = {value: "false"};

    // BooleanLiteral
    function False_sub3() {
        if (HAS_OUT) AREP[APOS++] = false;
        ATYP = HAS_OUT ? SCALAR : NOTHING;
        return true;
    }
    False_sub3.constant = {value: false};

    // SequenceExpression
    function Null() {
        const [APOSₒ, CPOSₒ, ATYPₒ] = savepoint();
        let seqType = NOTHING;
        if (!Null_sub1()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        seqType |= ATYP;
        if (!Null_sub3()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        ATYP |= seqType;
        return true;
    }

    // CodeExpression
    function Null_sub1() {
        const HAS_OUTₒ = HAS_OUT;
        HAS_OUT = false;
        const result = Null_sub2();
        HAS_OUT = HAS_OUTₒ;
        ATYP = NOTHING;
        return result;
    }

    // StringUniversal
    function Null_sub2() {
        if (HAS_IN) {
            if (CPOS + 4 > CREP.length) return false;
            if (CREP[CPOS + 0] !== 110) return false;
            if (CREP[CPOS + 1] !== 117) return false;
            if (CREP[CPOS + 2] !== 108) return false;
            if (CREP[CPOS + 3] !== 108) return false;
            CPOS += 4;
        }
        if (HAS_OUT) {
            AREP[APOS++] = "null";
        }
        ATYP = HAS_OUT ? STRING : NOTHING;
        return true;
    }
    Null_sub2.constant = {value: "null"};

    // NullLiteral
    function Null_sub3() {
        if (HAS_OUT) AREP[APOS++] = null;
        ATYP = HAS_OUT ? SCALAR : NOTHING;
        return true;
    }
    Null_sub3.constant = {value: null};

    // SequenceExpression
    function True() {
        const [APOSₒ, CPOSₒ, ATYPₒ] = savepoint();
        let seqType = NOTHING;
        if (!True_sub1()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        seqType |= ATYP;
        if (!True_sub3()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        ATYP |= seqType;
        return true;
    }

    // CodeExpression
    function True_sub1() {
        const HAS_OUTₒ = HAS_OUT;
        HAS_OUT = false;
        const result = True_sub2();
        HAS_OUT = HAS_OUTₒ;
        ATYP = NOTHING;
        return result;
    }

    // StringUniversal
    function True_sub2() {
        if (HAS_IN) {
            if (CPOS + 4 > CREP.length) return false;
            if (CREP[CPOS + 0] !== 116) return false;
            if (CREP[CPOS + 1] !== 114) return false;
            if (CREP[CPOS + 2] !== 117) return false;
            if (CREP[CPOS + 3] !== 101) return false;
            CPOS += 4;
        }
        if (HAS_OUT) {
            AREP[APOS++] = "true";
        }
        ATYP = HAS_OUT ? STRING : NOTHING;
        return true;
    }
    True_sub2.constant = {value: "true"};

    // BooleanLiteral
    function True_sub3() {
        if (HAS_OUT) AREP[APOS++] = true;
        ATYP = HAS_OUT ? SCALAR : NOTHING;
        return true;
    }
    True_sub3.constant = {value: true};

    // SequenceExpression
    function Object() {
        const [APOSₒ, CPOSₒ, ATYPₒ] = savepoint();
        let seqType = NOTHING;
        if (!LBRACE()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        seqType |= ATYP;
        if (!Object_sub1()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        seqType |= ATYP;
        if (!RBRACE()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        ATYP |= seqType;
        return true;
    }

    // SelectionExpression
    function Object_sub1() {
        if (Properties()) return true;
        if (Object_sub2()) return true;
        return false;
    }

    // RecordExpression
    let Object_sub2ₘ;
    function Object_sub2(arg) {
        try {
            return Object_sub2ₘ(arg);
        }
        catch (err) {
            if (!(err instanceof TypeError) || !err.message.includes('Object_sub2ₘ is not a function')) throw err;
            Object_sub2ₘ = parseRecord([]);
            return Object_sub2ₘ(arg);
        }
    }

    // SelectionExpression
    function Properties() {
        if (Properties_sub1()) return true;
        if (Property()) return true;
        return false;
    }

    // RecordExpression
    let Properties_sub1ₘ;
    function Properties_sub1(arg) {
        try {
            return Properties_sub1ₘ(arg);
        }
        catch (err) {
            if (!(err instanceof TypeError) || !err.message.includes('Properties_sub1ₘ is not a function')) throw err;
            Properties_sub1ₘ = parseRecord([
                {
                    kind: 'Splice',
                    name: undefined,
                    expr: Property
                },
                {
                    kind: 'Splice',
                    name: undefined,
                    expr: Properties_sub2
                },
            ]);
            return Properties_sub1ₘ(arg);
        }
    }

    // SequenceExpression
    function Properties_sub2() {
        const [APOSₒ, CPOSₒ, ATYPₒ] = savepoint();
        let seqType = NOTHING;
        if (!COMMA()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        seqType |= ATYP;
        if (!Properties()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        ATYP |= seqType;
        return true;
    }

    // RecordExpression
    let Propertyₘ;
    function Property(arg) {
        try {
            return Propertyₘ(arg);
        }
        catch (err) {
            if (!(err instanceof TypeError) || !err.message.includes('Propertyₘ is not a function')) throw err;
            Propertyₘ = parseRecord([
                {
                    kind: 'Field',
                    name: String,
                    expr: Property_sub1
                },
            ]);
            return Propertyₘ(arg);
        }
    }

    // SequenceExpression
    function Property_sub1() {
        const [APOSₒ, CPOSₒ, ATYPₒ] = savepoint();
        let seqType = NOTHING;
        if (!COLON()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        seqType |= ATYP;
        if (!Value()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        ATYP |= seqType;
        return true;
    }

    // SequenceExpression
    function Array() {
        const [APOSₒ, CPOSₒ, ATYPₒ] = savepoint();
        let seqType = NOTHING;
        if (!LBRACKET()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        seqType |= ATYP;
        if (!Array_sub1()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        seqType |= ATYP;
        if (!RBRACKET()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        ATYP |= seqType;
        return true;
    }

    // SelectionExpression
    function Array_sub1() {
        if (Elements()) return true;
        if (Array_sub2()) return true;
        return false;
    }

    // ListExpression
    let Array_sub2ₘ;
    function Array_sub2(arg) {
        try {
            return Array_sub2ₘ(arg);
        }
        catch (err) {
            if (!(err instanceof TypeError) || !err.message.includes('Array_sub2ₘ is not a function')) throw err;
            Array_sub2ₘ = parseList([]);
            return Array_sub2ₘ(arg);
        }
    }

    // ListExpression
    let Elementsₘ;
    function Elements(arg) {
        try {
            return Elementsₘ(arg);
        }
        catch (err) {
            if (!(err instanceof TypeError) || !err.message.includes('Elementsₘ is not a function')) throw err;
            Elementsₘ = parseList([
                {
                    kind: 'Element',
                    expr: Value
                },
                {
                    kind: 'Splice',
                    expr: Elements_sub1
                },
            ]);
            return Elementsₘ(arg);
        }
    }

    // SelectionExpression
    function Elements_sub1() {
        if (Elements_sub2()) return true;
        if (Elements_sub3()) return true;
        return false;
    }

    // SequenceExpression
    function Elements_sub2() {
        const [APOSₒ, CPOSₒ, ATYPₒ] = savepoint();
        let seqType = NOTHING;
        if (!COMMA()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        seqType |= ATYP;
        if (!Elements()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        ATYP |= seqType;
        return true;
    }

    // ListExpression
    let Elements_sub3ₘ;
    function Elements_sub3(arg) {
        try {
            return Elements_sub3ₘ(arg);
        }
        catch (err) {
            if (!(err instanceof TypeError) || !err.message.includes('Elements_sub3ₘ is not a function')) throw err;
            Elements_sub3ₘ = parseList([]);
            return Elements_sub3ₘ(arg);
        }
    }

    // Identifier
    function Number(arg) {
        return f64(arg);
    }

    // SequenceExpression
    function String() {
        const [APOSₒ, CPOSₒ, ATYPₒ] = savepoint();
        let seqType = NOTHING;
        if (!DOUBLE_QUOTE()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        seqType |= ATYP;
        if (!String_sub1()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        seqType |= ATYP;
        if (!DOUBLE_QUOTE()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        ATYP |= seqType;
        return true;
    }

    // QuantifiedExpression
    function String_sub1() {
        let [CPOSᐟ, APOSᐟ] = [CPOS, APOS];
        do {
            if (!CHAR()) break;
            if (CPOS <= CPOSᐟ) break;
            CPOSᐟ = CPOS, APOSᐟ = APOS;
        } while (true);
        CPOS = CPOSᐟ, APOS = APOSᐟ;
        return true;
    }

    // NumericLiteral
    function min() {
        if (HAS_OUT) AREP[APOS++] = 32;
        ATYP = HAS_OUT ? SCALAR : NOTHING;
        return true;
    }
    min.constant = {value: 32};

    // NumericLiteral
    function max() {
        if (HAS_OUT) AREP[APOS++] = 127;
        ATYP = HAS_OUT ? SCALAR : NOTHING;
        return true;
    }
    max.constant = {value: 127};

    // NumericLiteral
    function base() {
        if (HAS_OUT) AREP[APOS++] = 16;
        ATYP = HAS_OUT ? SCALAR : NOTHING;
        return true;
    }
    base.constant = {value: 16};

    // NumericLiteral
    function minDigits() {
        if (HAS_OUT) AREP[APOS++] = 4;
        ATYP = HAS_OUT ? SCALAR : NOTHING;
        return true;
    }
    minDigits.constant = {value: 4};

    // NumericLiteral
    function maxDigits() {
        if (HAS_OUT) AREP[APOS++] = 4;
        ATYP = HAS_OUT ? SCALAR : NOTHING;
        return true;
    }
    maxDigits.constant = {value: 4};

    // SelectionExpression
    function CHAR() {
        if (CHAR_sub1()) return true;
        if (CHAR_sub8()) return true;
        if (CHAR_sub12()) return true;
        if (CHAR_sub16()) return true;
        if (CHAR_sub20()) return true;
        if (CHAR_sub24()) return true;
        if (CHAR_sub28()) return true;
        if (CHAR_sub32()) return true;
        if (CHAR_sub36()) return true;
        if (CHAR_sub40()) return true;
        return false;
    }

    // SequenceExpression
    function CHAR_sub1() {
        const [APOSₒ, CPOSₒ, ATYPₒ] = savepoint();
        let seqType = NOTHING;
        if (!CHAR_sub2()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        seqType |= ATYP;
        if (!CHAR_sub4()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        seqType |= ATYP;
        if (!CHAR_sub6()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        ATYP |= seqType;
        return true;
    }

    // NotExpression
    function CHAR_sub2() {
        const [APOSₒ, CPOSₒ, ATYPₒ] = savepoint();
        const result = !CHAR_sub3();
        backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        ATYP = NOTHING;
        return result;
    }

    // StringUniversal
    function CHAR_sub3() {
        if (HAS_IN) {
            if (CPOS + 1 > CREP.length) return false;
            if (CREP[CPOS + 0] !== 92) return false;
            CPOS += 1;
        }
        if (HAS_OUT) {
            AREP[APOS++] = "\\";
        }
        ATYP = HAS_OUT ? STRING : NOTHING;
        return true;
    }
    CHAR_sub3.constant = {value: "\\"};

    // NotExpression
    function CHAR_sub4() {
        const [APOSₒ, CPOSₒ, ATYPₒ] = savepoint();
        const result = !CHAR_sub5();
        backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        ATYP = NOTHING;
        return result;
    }

    // StringUniversal
    function CHAR_sub5() {
        if (HAS_IN) {
            if (CPOS + 1 > CREP.length) return false;
            if (CREP[CPOS + 0] !== 34) return false;
            CPOS += 1;
        }
        if (HAS_OUT) {
            AREP[APOS++] = "\"";
        }
        ATYP = HAS_OUT ? STRING : NOTHING;
        return true;
    }
    CHAR_sub5.constant = {value: "\""};

    // InstantiationExpression
    let CHAR_sub6ₘ;
    function CHAR_sub6(arg) {
        try {
            return CHAR_sub6ₘ(arg);
        }
        catch (err) {
            if (!(err instanceof TypeError) || !err.message.includes('CHAR_sub6ₘ is not a function')) throw err;
            CHAR_sub6ₘ = ascii(CHAR_sub7);
            return CHAR_sub6ₘ(arg);
        }
    }

    // Module
    function CHAR_sub7(member) {
        switch (member) {
            case 'min': return min;
            case 'max': return max;
            default: return undefined;
        }
    }

    // SequenceExpression
    function CHAR_sub8() {
        const [APOSₒ, CPOSₒ, ATYPₒ] = savepoint();
        let seqType = NOTHING;
        if (!CHAR_sub9()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        seqType |= ATYP;
        if (!CHAR_sub11()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        ATYP |= seqType;
        return true;
    }

    // CodeExpression
    function CHAR_sub9() {
        const HAS_OUTₒ = HAS_OUT;
        HAS_OUT = false;
        const result = CHAR_sub10();
        HAS_OUT = HAS_OUTₒ;
        ATYP = NOTHING;
        return result;
    }

    // StringUniversal
    function CHAR_sub10() {
        if (HAS_IN) {
            if (CPOS + 2 > CREP.length) return false;
            if (CREP[CPOS + 0] !== 92) return false;
            if (CREP[CPOS + 1] !== 34) return false;
            CPOS += 2;
        }
        if (HAS_OUT) {
            AREP[APOS++] = "\\\"";
        }
        ATYP = HAS_OUT ? STRING : NOTHING;
        return true;
    }
    CHAR_sub10.constant = {value: "\\\""};

    // StringAbstract
    function CHAR_sub11() {
        if (HAS_OUT) AREP[APOS++] = "\"";
        ATYP = HAS_OUT ? STRING : NOTHING;
        return true;
    }
    CHAR_sub11.constant = {value: "\""};

    // SequenceExpression
    function CHAR_sub12() {
        const [APOSₒ, CPOSₒ, ATYPₒ] = savepoint();
        let seqType = NOTHING;
        if (!CHAR_sub13()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        seqType |= ATYP;
        if (!CHAR_sub15()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        ATYP |= seqType;
        return true;
    }

    // CodeExpression
    function CHAR_sub13() {
        const HAS_OUTₒ = HAS_OUT;
        HAS_OUT = false;
        const result = CHAR_sub14();
        HAS_OUT = HAS_OUTₒ;
        ATYP = NOTHING;
        return result;
    }

    // StringUniversal
    function CHAR_sub14() {
        if (HAS_IN) {
            if (CPOS + 2 > CREP.length) return false;
            if (CREP[CPOS + 0] !== 92) return false;
            if (CREP[CPOS + 1] !== 92) return false;
            CPOS += 2;
        }
        if (HAS_OUT) {
            AREP[APOS++] = "\\\\";
        }
        ATYP = HAS_OUT ? STRING : NOTHING;
        return true;
    }
    CHAR_sub14.constant = {value: "\\\\"};

    // StringAbstract
    function CHAR_sub15() {
        if (HAS_OUT) AREP[APOS++] = "\\";
        ATYP = HAS_OUT ? STRING : NOTHING;
        return true;
    }
    CHAR_sub15.constant = {value: "\\"};

    // SequenceExpression
    function CHAR_sub16() {
        const [APOSₒ, CPOSₒ, ATYPₒ] = savepoint();
        let seqType = NOTHING;
        if (!CHAR_sub17()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        seqType |= ATYP;
        if (!CHAR_sub19()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        ATYP |= seqType;
        return true;
    }

    // CodeExpression
    function CHAR_sub17() {
        const HAS_OUTₒ = HAS_OUT;
        HAS_OUT = false;
        const result = CHAR_sub18();
        HAS_OUT = HAS_OUTₒ;
        ATYP = NOTHING;
        return result;
    }

    // StringUniversal
    function CHAR_sub18() {
        if (HAS_IN) {
            if (CPOS + 2 > CREP.length) return false;
            if (CREP[CPOS + 0] !== 92) return false;
            if (CREP[CPOS + 1] !== 47) return false;
            CPOS += 2;
        }
        if (HAS_OUT) {
            AREP[APOS++] = "\\/";
        }
        ATYP = HAS_OUT ? STRING : NOTHING;
        return true;
    }
    CHAR_sub18.constant = {value: "\\/"};

    // StringAbstract
    function CHAR_sub19() {
        if (HAS_OUT) AREP[APOS++] = "/";
        ATYP = HAS_OUT ? STRING : NOTHING;
        return true;
    }
    CHAR_sub19.constant = {value: "/"};

    // SequenceExpression
    function CHAR_sub20() {
        const [APOSₒ, CPOSₒ, ATYPₒ] = savepoint();
        let seqType = NOTHING;
        if (!CHAR_sub21()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        seqType |= ATYP;
        if (!CHAR_sub23()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        ATYP |= seqType;
        return true;
    }

    // CodeExpression
    function CHAR_sub21() {
        const HAS_OUTₒ = HAS_OUT;
        HAS_OUT = false;
        const result = CHAR_sub22();
        HAS_OUT = HAS_OUTₒ;
        ATYP = NOTHING;
        return result;
    }

    // StringUniversal
    function CHAR_sub22() {
        if (HAS_IN) {
            if (CPOS + 2 > CREP.length) return false;
            if (CREP[CPOS + 0] !== 92) return false;
            if (CREP[CPOS + 1] !== 98) return false;
            CPOS += 2;
        }
        if (HAS_OUT) {
            AREP[APOS++] = "\\b";
        }
        ATYP = HAS_OUT ? STRING : NOTHING;
        return true;
    }
    CHAR_sub22.constant = {value: "\\b"};

    // StringAbstract
    function CHAR_sub23() {
        if (HAS_OUT) AREP[APOS++] = "\b";
        ATYP = HAS_OUT ? STRING : NOTHING;
        return true;
    }
    CHAR_sub23.constant = {value: "\b"};

    // SequenceExpression
    function CHAR_sub24() {
        const [APOSₒ, CPOSₒ, ATYPₒ] = savepoint();
        let seqType = NOTHING;
        if (!CHAR_sub25()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        seqType |= ATYP;
        if (!CHAR_sub27()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        ATYP |= seqType;
        return true;
    }

    // CodeExpression
    function CHAR_sub25() {
        const HAS_OUTₒ = HAS_OUT;
        HAS_OUT = false;
        const result = CHAR_sub26();
        HAS_OUT = HAS_OUTₒ;
        ATYP = NOTHING;
        return result;
    }

    // StringUniversal
    function CHAR_sub26() {
        if (HAS_IN) {
            if (CPOS + 2 > CREP.length) return false;
            if (CREP[CPOS + 0] !== 92) return false;
            if (CREP[CPOS + 1] !== 102) return false;
            CPOS += 2;
        }
        if (HAS_OUT) {
            AREP[APOS++] = "\\f";
        }
        ATYP = HAS_OUT ? STRING : NOTHING;
        return true;
    }
    CHAR_sub26.constant = {value: "\\f"};

    // StringAbstract
    function CHAR_sub27() {
        if (HAS_OUT) AREP[APOS++] = "\f";
        ATYP = HAS_OUT ? STRING : NOTHING;
        return true;
    }
    CHAR_sub27.constant = {value: "\f"};

    // SequenceExpression
    function CHAR_sub28() {
        const [APOSₒ, CPOSₒ, ATYPₒ] = savepoint();
        let seqType = NOTHING;
        if (!CHAR_sub29()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        seqType |= ATYP;
        if (!CHAR_sub31()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        ATYP |= seqType;
        return true;
    }

    // CodeExpression
    function CHAR_sub29() {
        const HAS_OUTₒ = HAS_OUT;
        HAS_OUT = false;
        const result = CHAR_sub30();
        HAS_OUT = HAS_OUTₒ;
        ATYP = NOTHING;
        return result;
    }

    // StringUniversal
    function CHAR_sub30() {
        if (HAS_IN) {
            if (CPOS + 2 > CREP.length) return false;
            if (CREP[CPOS + 0] !== 92) return false;
            if (CREP[CPOS + 1] !== 110) return false;
            CPOS += 2;
        }
        if (HAS_OUT) {
            AREP[APOS++] = "\\n";
        }
        ATYP = HAS_OUT ? STRING : NOTHING;
        return true;
    }
    CHAR_sub30.constant = {value: "\\n"};

    // StringAbstract
    function CHAR_sub31() {
        if (HAS_OUT) AREP[APOS++] = "\n";
        ATYP = HAS_OUT ? STRING : NOTHING;
        return true;
    }
    CHAR_sub31.constant = {value: "\n"};

    // SequenceExpression
    function CHAR_sub32() {
        const [APOSₒ, CPOSₒ, ATYPₒ] = savepoint();
        let seqType = NOTHING;
        if (!CHAR_sub33()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        seqType |= ATYP;
        if (!CHAR_sub35()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        ATYP |= seqType;
        return true;
    }

    // CodeExpression
    function CHAR_sub33() {
        const HAS_OUTₒ = HAS_OUT;
        HAS_OUT = false;
        const result = CHAR_sub34();
        HAS_OUT = HAS_OUTₒ;
        ATYP = NOTHING;
        return result;
    }

    // StringUniversal
    function CHAR_sub34() {
        if (HAS_IN) {
            if (CPOS + 2 > CREP.length) return false;
            if (CREP[CPOS + 0] !== 92) return false;
            if (CREP[CPOS + 1] !== 114) return false;
            CPOS += 2;
        }
        if (HAS_OUT) {
            AREP[APOS++] = "\\r";
        }
        ATYP = HAS_OUT ? STRING : NOTHING;
        return true;
    }
    CHAR_sub34.constant = {value: "\\r"};

    // StringAbstract
    function CHAR_sub35() {
        if (HAS_OUT) AREP[APOS++] = "\r";
        ATYP = HAS_OUT ? STRING : NOTHING;
        return true;
    }
    CHAR_sub35.constant = {value: "\r"};

    // SequenceExpression
    function CHAR_sub36() {
        const [APOSₒ, CPOSₒ, ATYPₒ] = savepoint();
        let seqType = NOTHING;
        if (!CHAR_sub37()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        seqType |= ATYP;
        if (!CHAR_sub39()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        ATYP |= seqType;
        return true;
    }

    // CodeExpression
    function CHAR_sub37() {
        const HAS_OUTₒ = HAS_OUT;
        HAS_OUT = false;
        const result = CHAR_sub38();
        HAS_OUT = HAS_OUTₒ;
        ATYP = NOTHING;
        return result;
    }

    // StringUniversal
    function CHAR_sub38() {
        if (HAS_IN) {
            if (CPOS + 2 > CREP.length) return false;
            if (CREP[CPOS + 0] !== 92) return false;
            if (CREP[CPOS + 1] !== 116) return false;
            CPOS += 2;
        }
        if (HAS_OUT) {
            AREP[APOS++] = "\\t";
        }
        ATYP = HAS_OUT ? STRING : NOTHING;
        return true;
    }
    CHAR_sub38.constant = {value: "\\t"};

    // StringAbstract
    function CHAR_sub39() {
        if (HAS_OUT) AREP[APOS++] = "\t";
        ATYP = HAS_OUT ? STRING : NOTHING;
        return true;
    }
    CHAR_sub39.constant = {value: "\t"};

    // SequenceExpression
    function CHAR_sub40() {
        const [APOSₒ, CPOSₒ, ATYPₒ] = savepoint();
        let seqType = NOTHING;
        if (!CHAR_sub41()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        seqType |= ATYP;
        if (!CHAR_sub43()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        ATYP |= seqType;
        return true;
    }

    // CodeExpression
    function CHAR_sub41() {
        const HAS_OUTₒ = HAS_OUT;
        HAS_OUT = false;
        const result = CHAR_sub42();
        HAS_OUT = HAS_OUTₒ;
        ATYP = NOTHING;
        return result;
    }

    // StringUniversal
    function CHAR_sub42() {
        if (HAS_IN) {
            if (CPOS + 2 > CREP.length) return false;
            if (CREP[CPOS + 0] !== 92) return false;
            if (CREP[CPOS + 1] !== 117) return false;
            CPOS += 2;
        }
        if (HAS_OUT) {
            AREP[APOS++] = "\\u";
        }
        ATYP = HAS_OUT ? STRING : NOTHING;
        return true;
    }
    CHAR_sub42.constant = {value: "\\u"};

    // InstantiationExpression
    let CHAR_sub43ₘ;
    function CHAR_sub43(arg) {
        try {
            return CHAR_sub43ₘ(arg);
        }
        catch (err) {
            if (!(err instanceof TypeError) || !err.message.includes('CHAR_sub43ₘ is not a function')) throw err;
            CHAR_sub43ₘ = unicode(CHAR_sub44);
            return CHAR_sub43ₘ(arg);
        }
    }

    // Module
    function CHAR_sub44(member) {
        switch (member) {
            case 'base': return base;
            case 'minDigits': return minDigits;
            case 'maxDigits': return maxDigits;
            default: return undefined;
        }
    }

    // SequenceExpression
    function LBRACE() {
        const [APOSₒ, CPOSₒ, ATYPₒ] = savepoint();
        let seqType = NOTHING;
        if (!WS()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        seqType |= ATYP;
        if (!LBRACE_sub1()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        seqType |= ATYP;
        if (!WS()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        ATYP |= seqType;
        return true;
    }

    // CodeExpression
    function LBRACE_sub1() {
        const HAS_OUTₒ = HAS_OUT;
        HAS_OUT = false;
        const result = LBRACE_sub2();
        HAS_OUT = HAS_OUTₒ;
        ATYP = NOTHING;
        return result;
    }

    // StringUniversal
    function LBRACE_sub2() {
        if (HAS_IN) {
            if (CPOS + 1 > CREP.length) return false;
            if (CREP[CPOS + 0] !== 123) return false;
            CPOS += 1;
        }
        if (HAS_OUT) {
            AREP[APOS++] = "{";
        }
        ATYP = HAS_OUT ? STRING : NOTHING;
        return true;
    }
    LBRACE_sub2.constant = {value: "{"};

    // SequenceExpression
    function RBRACE() {
        const [APOSₒ, CPOSₒ, ATYPₒ] = savepoint();
        let seqType = NOTHING;
        if (!WS()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        seqType |= ATYP;
        if (!RBRACE_sub1()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        seqType |= ATYP;
        if (!WS()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        ATYP |= seqType;
        return true;
    }

    // CodeExpression
    function RBRACE_sub1() {
        const HAS_OUTₒ = HAS_OUT;
        HAS_OUT = false;
        const result = RBRACE_sub2();
        HAS_OUT = HAS_OUTₒ;
        ATYP = NOTHING;
        return result;
    }

    // StringUniversal
    function RBRACE_sub2() {
        if (HAS_IN) {
            if (CPOS + 1 > CREP.length) return false;
            if (CREP[CPOS + 0] !== 125) return false;
            CPOS += 1;
        }
        if (HAS_OUT) {
            AREP[APOS++] = "}";
        }
        ATYP = HAS_OUT ? STRING : NOTHING;
        return true;
    }
    RBRACE_sub2.constant = {value: "}"};

    // SequenceExpression
    function LBRACKET() {
        const [APOSₒ, CPOSₒ, ATYPₒ] = savepoint();
        let seqType = NOTHING;
        if (!WS()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        seqType |= ATYP;
        if (!LBRACKET_sub1()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        seqType |= ATYP;
        if (!WS()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        ATYP |= seqType;
        return true;
    }

    // CodeExpression
    function LBRACKET_sub1() {
        const HAS_OUTₒ = HAS_OUT;
        HAS_OUT = false;
        const result = LBRACKET_sub2();
        HAS_OUT = HAS_OUTₒ;
        ATYP = NOTHING;
        return result;
    }

    // StringUniversal
    function LBRACKET_sub2() {
        if (HAS_IN) {
            if (CPOS + 1 > CREP.length) return false;
            if (CREP[CPOS + 0] !== 91) return false;
            CPOS += 1;
        }
        if (HAS_OUT) {
            AREP[APOS++] = "[";
        }
        ATYP = HAS_OUT ? STRING : NOTHING;
        return true;
    }
    LBRACKET_sub2.constant = {value: "["};

    // SequenceExpression
    function RBRACKET() {
        const [APOSₒ, CPOSₒ, ATYPₒ] = savepoint();
        let seqType = NOTHING;
        if (!WS()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        seqType |= ATYP;
        if (!RBRACKET_sub1()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        seqType |= ATYP;
        if (!WS()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        ATYP |= seqType;
        return true;
    }

    // CodeExpression
    function RBRACKET_sub1() {
        const HAS_OUTₒ = HAS_OUT;
        HAS_OUT = false;
        const result = RBRACKET_sub2();
        HAS_OUT = HAS_OUTₒ;
        ATYP = NOTHING;
        return result;
    }

    // StringUniversal
    function RBRACKET_sub2() {
        if (HAS_IN) {
            if (CPOS + 1 > CREP.length) return false;
            if (CREP[CPOS + 0] !== 93) return false;
            CPOS += 1;
        }
        if (HAS_OUT) {
            AREP[APOS++] = "]";
        }
        ATYP = HAS_OUT ? STRING : NOTHING;
        return true;
    }
    RBRACKET_sub2.constant = {value: "]"};

    // SequenceExpression
    function COLON() {
        const [APOSₒ, CPOSₒ, ATYPₒ] = savepoint();
        let seqType = NOTHING;
        if (!WS()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        seqType |= ATYP;
        if (!COLON_sub1()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        seqType |= ATYP;
        if (!WS()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        ATYP |= seqType;
        return true;
    }

    // CodeExpression
    function COLON_sub1() {
        const HAS_OUTₒ = HAS_OUT;
        HAS_OUT = false;
        const result = COLON_sub2();
        HAS_OUT = HAS_OUTₒ;
        ATYP = NOTHING;
        return result;
    }

    // StringUniversal
    function COLON_sub2() {
        if (HAS_IN) {
            if (CPOS + 1 > CREP.length) return false;
            if (CREP[CPOS + 0] !== 58) return false;
            CPOS += 1;
        }
        if (HAS_OUT) {
            AREP[APOS++] = ":";
        }
        ATYP = HAS_OUT ? STRING : NOTHING;
        return true;
    }
    COLON_sub2.constant = {value: ":"};

    // SequenceExpression
    function COMMA() {
        const [APOSₒ, CPOSₒ, ATYPₒ] = savepoint();
        let seqType = NOTHING;
        if (!WS()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        seqType |= ATYP;
        if (!COMMA_sub1()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        seqType |= ATYP;
        if (!WS()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        ATYP |= seqType;
        return true;
    }

    // CodeExpression
    function COMMA_sub1() {
        const HAS_OUTₒ = HAS_OUT;
        HAS_OUT = false;
        const result = COMMA_sub2();
        HAS_OUT = HAS_OUTₒ;
        ATYP = NOTHING;
        return result;
    }

    // StringUniversal
    function COMMA_sub2() {
        if (HAS_IN) {
            if (CPOS + 1 > CREP.length) return false;
            if (CREP[CPOS + 0] !== 44) return false;
            CPOS += 1;
        }
        if (HAS_OUT) {
            AREP[APOS++] = ",";
        }
        ATYP = HAS_OUT ? STRING : NOTHING;
        return true;
    }
    COMMA_sub2.constant = {value: ","};

    // CodeExpression
    function DOUBLE_QUOTE() {
        const HAS_OUTₒ = HAS_OUT;
        HAS_OUT = false;
        const result = DOUBLE_QUOTE_sub1();
        HAS_OUT = HAS_OUTₒ;
        ATYP = NOTHING;
        return result;
    }

    // StringUniversal
    function DOUBLE_QUOTE_sub1() {
        if (HAS_IN) {
            if (CPOS + 1 > CREP.length) return false;
            if (CREP[CPOS + 0] !== 34) return false;
            CPOS += 1;
        }
        if (HAS_OUT) {
            AREP[APOS++] = "\"";
        }
        ATYP = HAS_OUT ? STRING : NOTHING;
        return true;
    }
    DOUBLE_QUOTE_sub1.constant = {value: "\""};

    // CodeExpression
    function WS() {
        const HAS_OUTₒ = HAS_OUT;
        HAS_OUT = false;
        const result = WS_sub1();
        HAS_OUT = HAS_OUTₒ;
        ATYP = NOTHING;
        return result;
    }

    // QuantifiedExpression
    function WS_sub1() {
        let [CPOSᐟ, APOSᐟ] = [CPOS, APOS];
        do {
            if (!WS_sub2()) break;
            if (CPOS <= CPOSᐟ) break;
            CPOSᐟ = CPOS, APOSᐟ = APOS;
        } while (true);
        CPOS = CPOSᐟ, APOS = APOSᐟ;
        return true;
    }

    // SelectionExpression
    function WS_sub2() {
        if (WS_sub3()) return true;
        if (WS_sub4()) return true;
        if (WS_sub5()) return true;
        if (WS_sub6()) return true;
        return false;
    }

    // StringUniversal
    function WS_sub3() {
        if (HAS_IN) {
            if (CPOS + 1 > CREP.length) return false;
            if (CREP[CPOS + 0] !== 32) return false;
            CPOS += 1;
        }
        if (HAS_OUT) {
            AREP[APOS++] = " ";
        }
        ATYP = HAS_OUT ? STRING : NOTHING;
        return true;
    }
    WS_sub3.constant = {value: " "};

    // StringUniversal
    function WS_sub4() {
        if (HAS_IN) {
            if (CPOS + 1 > CREP.length) return false;
            if (CREP[CPOS + 0] !== 9) return false;
            CPOS += 1;
        }
        if (HAS_OUT) {
            AREP[APOS++] = "\t";
        }
        ATYP = HAS_OUT ? STRING : NOTHING;
        return true;
    }
    WS_sub4.constant = {value: "\t"};

    // StringUniversal
    function WS_sub5() {
        if (HAS_IN) {
            if (CPOS + 1 > CREP.length) return false;
            if (CREP[CPOS + 0] !== 10) return false;
            CPOS += 1;
        }
        if (HAS_OUT) {
            AREP[APOS++] = "\n";
        }
        ATYP = HAS_OUT ? STRING : NOTHING;
        return true;
    }
    WS_sub5.constant = {value: "\n"};

    // StringUniversal
    function WS_sub6() {
        if (HAS_IN) {
            if (CPOS + 1 > CREP.length) return false;
            if (CREP[CPOS + 0] !== 13) return false;
            CPOS += 1;
        }
        if (HAS_OUT) {
            AREP[APOS++] = "\r";
        }
        ATYP = HAS_OUT ? STRING : NOTHING;
        return true;
    }
    WS_sub6.constant = {value: "\r"};

    // Module
    function Ɱ_json(member) {
        switch (member) {
            case 'ascii': return ascii;
            case 'f64': return f64;
            case 'unicode': return unicode;
            case 'start': return start_2;
            case 'Value': return Value;
            case 'False': return False;
            case 'Null': return Null;
            case 'True': return True;
            case 'Object': return Object;
            case 'Properties': return Properties;
            case 'Property': return Property;
            case 'Array': return Array;
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
    }

    // Intrinsic

    // Intrinsic

    // Intrinsic

    // Intrinsic

    // Module
    function Ɱ_std(member) {
        switch (member) {
            case 'ascii': return ascii_2;
            case 'f64': return f64_2;
            case 'i32': return i32;
            case 'memoise': return memoise;
            default: return undefined;
        }
    }

    // Intrinsic

    // Module
    function Ɱ_experiments(member) {
        switch (member) {
            case 'unicode': return unicode_2;
            default: return undefined;
        }
    }

    return start_2;
})();




// ------------------------------ PRINT ------------------------------
const print = (() => {

    // Intrinsic
    const ascii_2 = extensions["V:/projects/oss/pen-monorepo/packages/core/penc/dist/deps/std.pen.js"].ascii({mode: 'print'});
    const f64_2 = extensions["V:/projects/oss/pen-monorepo/packages/core/penc/dist/deps/std.pen.js"].f64({mode: 'print'});
    const i32 = extensions["V:/projects/oss/pen-monorepo/packages/core/penc/dist/deps/std.pen.js"].i32({mode: 'print'});
    const memoise = extensions["V:/projects/oss/pen-monorepo/packages/core/penc/dist/deps/std.pen.js"].memoise({mode: 'print'});
    const unicode_2 = extensions["V:/projects/oss/pen-monorepo/packages/core/penc/dist/deps/experiments.pen.js"].unicode({mode: 'print'});

    // Identifier
    function ascii(arg) {
        return ascii_2(arg);
    }

    // Identifier
    function f64(arg) {
        return f64_2(arg);
    }

    // Identifier
    function unicode(arg) {
        return unicode_2(arg);
    }

    // SequenceExpression
    function start_2() {
        const [APOSₒ, CPOSₒ, ATYPₒ] = savepoint();
        if (!WS()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        if (!Value()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        if (!WS()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        return true;
    }

    // SelectionExpression
    function Value() {
        if (False()) return true;
        if (Null()) return true;
        if (True()) return true;
        if (Object()) return true;
        if (Array()) return true;
        if (Number()) return true;
        if (String()) return true;
        return false;
    }

    // SequenceExpression
    function False() {
        const [APOSₒ, CPOSₒ, ATYPₒ] = savepoint();
        if (!False_sub1()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        if (!False_sub3()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        return true;
    }

    // CodeExpression
    function False_sub1() {
        const HAS_INₒ = HAS_IN;
        HAS_IN = false;
        const result = False_sub2();
        HAS_IN = HAS_INₒ;
        return result;
    }

    // StringUniversal
    function False_sub2() {
        if (HAS_IN) {
            if (ATYP !== STRING) return false;
            if (APOS + 5 > AREP.length) return false;
            if (AREP.charCodeAt(APOS + 0) !== 102) return false;
            if (AREP.charCodeAt(APOS + 1) !== 97) return false;
            if (AREP.charCodeAt(APOS + 2) !== 108) return false;
            if (AREP.charCodeAt(APOS + 3) !== 115) return false;
            if (AREP.charCodeAt(APOS + 4) !== 101) return false;
            APOS += 5;
        }
        if (HAS_OUT) {
            CPOS += CREP.write("false", CPOS, undefined, 'utf8');
        }
        return true;
    }
    False_sub2.constant = {value: "false"};

    // BooleanLiteral
    function False_sub3() {
        if (HAS_IN) {
            if (ATYP !== SCALAR) return false;
            if (AREP[APOS] !== false) return false;
            APOS += 1;
        }
        return true;
    }
    False_sub3.constant = {value: false};

    // SequenceExpression
    function Null() {
        const [APOSₒ, CPOSₒ, ATYPₒ] = savepoint();
        if (!Null_sub1()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        if (!Null_sub3()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        return true;
    }

    // CodeExpression
    function Null_sub1() {
        const HAS_INₒ = HAS_IN;
        HAS_IN = false;
        const result = Null_sub2();
        HAS_IN = HAS_INₒ;
        return result;
    }

    // StringUniversal
    function Null_sub2() {
        if (HAS_IN) {
            if (ATYP !== STRING) return false;
            if (APOS + 4 > AREP.length) return false;
            if (AREP.charCodeAt(APOS + 0) !== 110) return false;
            if (AREP.charCodeAt(APOS + 1) !== 117) return false;
            if (AREP.charCodeAt(APOS + 2) !== 108) return false;
            if (AREP.charCodeAt(APOS + 3) !== 108) return false;
            APOS += 4;
        }
        if (HAS_OUT) {
            CPOS += CREP.write("null", CPOS, undefined, 'utf8');
        }
        return true;
    }
    Null_sub2.constant = {value: "null"};

    // NullLiteral
    function Null_sub3() {
        if (HAS_IN) {
            if (ATYP !== SCALAR) return false;
            if (AREP[APOS] !== null) return false;
            APOS += 1;
        }
        return true;
    }
    Null_sub3.constant = {value: null};

    // SequenceExpression
    function True() {
        const [APOSₒ, CPOSₒ, ATYPₒ] = savepoint();
        if (!True_sub1()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        if (!True_sub3()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        return true;
    }

    // CodeExpression
    function True_sub1() {
        const HAS_INₒ = HAS_IN;
        HAS_IN = false;
        const result = True_sub2();
        HAS_IN = HAS_INₒ;
        return result;
    }

    // StringUniversal
    function True_sub2() {
        if (HAS_IN) {
            if (ATYP !== STRING) return false;
            if (APOS + 4 > AREP.length) return false;
            if (AREP.charCodeAt(APOS + 0) !== 116) return false;
            if (AREP.charCodeAt(APOS + 1) !== 114) return false;
            if (AREP.charCodeAt(APOS + 2) !== 117) return false;
            if (AREP.charCodeAt(APOS + 3) !== 101) return false;
            APOS += 4;
        }
        if (HAS_OUT) {
            CPOS += CREP.write("true", CPOS, undefined, 'utf8');
        }
        return true;
    }
    True_sub2.constant = {value: "true"};

    // BooleanLiteral
    function True_sub3() {
        if (HAS_IN) {
            if (ATYP !== SCALAR) return false;
            if (AREP[APOS] !== true) return false;
            APOS += 1;
        }
        return true;
    }
    True_sub3.constant = {value: true};

    // SequenceExpression
    function Object() {
        const [APOSₒ, CPOSₒ, ATYPₒ] = savepoint();
        if (!LBRACE()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        if (!Object_sub1()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        if (!RBRACE()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        return true;
    }

    // SelectionExpression
    function Object_sub1() {
        if (Properties()) return true;
        if (Object_sub2()) return true;
        return false;
    }

    // RecordExpression
    let Object_sub2ₘ;
    function Object_sub2(arg) {
        try {
            return Object_sub2ₘ(arg);
        }
        catch (err) {
            if (!(err instanceof TypeError) || !err.message.includes('Object_sub2ₘ is not a function')) throw err;
            Object_sub2ₘ = printRecord([]);
            return Object_sub2ₘ(arg);
        }
    }

    // SelectionExpression
    function Properties() {
        if (Properties_sub1()) return true;
        if (Property()) return true;
        return false;
    }

    // RecordExpression
    let Properties_sub1ₘ;
    function Properties_sub1(arg) {
        try {
            return Properties_sub1ₘ(arg);
        }
        catch (err) {
            if (!(err instanceof TypeError) || !err.message.includes('Properties_sub1ₘ is not a function')) throw err;
            Properties_sub1ₘ = printRecord([
                {
                    kind: 'Splice',
                    name: undefined,
                    expr: Property
                },
                {
                    kind: 'Splice',
                    name: undefined,
                    expr: Properties_sub2
                },
            ]);
            return Properties_sub1ₘ(arg);
        }
    }

    // SequenceExpression
    function Properties_sub2() {
        const [APOSₒ, CPOSₒ, ATYPₒ] = savepoint();
        if (!COMMA()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        if (!Properties()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        return true;
    }

    // RecordExpression
    let Propertyₘ;
    function Property(arg) {
        try {
            return Propertyₘ(arg);
        }
        catch (err) {
            if (!(err instanceof TypeError) || !err.message.includes('Propertyₘ is not a function')) throw err;
            Propertyₘ = printRecord([
                {
                    kind: 'Field',
                    name: String,
                    expr: Property_sub1
                },
            ]);
            return Propertyₘ(arg);
        }
    }

    // SequenceExpression
    function Property_sub1() {
        const [APOSₒ, CPOSₒ, ATYPₒ] = savepoint();
        if (!COLON()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        if (!Value()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        return true;
    }

    // SequenceExpression
    function Array() {
        const [APOSₒ, CPOSₒ, ATYPₒ] = savepoint();
        if (!LBRACKET()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        if (!Array_sub1()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        if (!RBRACKET()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        return true;
    }

    // SelectionExpression
    function Array_sub1() {
        if (Elements()) return true;
        if (Array_sub2()) return true;
        return false;
    }

    // ListExpression
    let Array_sub2ₘ;
    function Array_sub2(arg) {
        try {
            return Array_sub2ₘ(arg);
        }
        catch (err) {
            if (!(err instanceof TypeError) || !err.message.includes('Array_sub2ₘ is not a function')) throw err;
            Array_sub2ₘ = printList([]);
            return Array_sub2ₘ(arg);
        }
    }

    // ListExpression
    let Elementsₘ;
    function Elements(arg) {
        try {
            return Elementsₘ(arg);
        }
        catch (err) {
            if (!(err instanceof TypeError) || !err.message.includes('Elementsₘ is not a function')) throw err;
            Elementsₘ = printList([
                {
                    kind: 'Element',
                    expr: Value
                },
                {
                    kind: 'Splice',
                    expr: Elements_sub1
                },
            ]);
            return Elementsₘ(arg);
        }
    }

    // SelectionExpression
    function Elements_sub1() {
        if (Elements_sub2()) return true;
        if (Elements_sub3()) return true;
        return false;
    }

    // SequenceExpression
    function Elements_sub2() {
        const [APOSₒ, CPOSₒ, ATYPₒ] = savepoint();
        if (!COMMA()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        if (!Elements()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        return true;
    }

    // ListExpression
    let Elements_sub3ₘ;
    function Elements_sub3(arg) {
        try {
            return Elements_sub3ₘ(arg);
        }
        catch (err) {
            if (!(err instanceof TypeError) || !err.message.includes('Elements_sub3ₘ is not a function')) throw err;
            Elements_sub3ₘ = printList([]);
            return Elements_sub3ₘ(arg);
        }
    }

    // Identifier
    function Number(arg) {
        return f64(arg);
    }

    // SequenceExpression
    function String() {
        const [APOSₒ, CPOSₒ, ATYPₒ] = savepoint();
        if (!DOUBLE_QUOTE()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        if (!String_sub1()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        if (!DOUBLE_QUOTE()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        return true;
    }

    // QuantifiedExpression
    function String_sub1() {
        let [APOSᐟ, CPOSᐟ] = [APOS, CPOS];
        do {
            if (!CHAR()) break;
            if (APOS <= APOSᐟ) break;
            APOSᐟ = APOS, CPOSᐟ = CPOS;
        } while (true);
        APOS = APOSᐟ, CPOS = CPOSᐟ;
        return true;
    }

    // NumericLiteral
    function min() {
        if (HAS_IN) {
            if (ATYP !== SCALAR) return false;
            if (AREP[APOS] !== 32) return false;
            APOS += 1;
        }
        return true;
    }
    min.constant = {value: 32};

    // NumericLiteral
    function max() {
        if (HAS_IN) {
            if (ATYP !== SCALAR) return false;
            if (AREP[APOS] !== 127) return false;
            APOS += 1;
        }
        return true;
    }
    max.constant = {value: 127};

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

    // NumericLiteral
    function minDigits() {
        if (HAS_IN) {
            if (ATYP !== SCALAR) return false;
            if (AREP[APOS] !== 4) return false;
            APOS += 1;
        }
        return true;
    }
    minDigits.constant = {value: 4};

    // NumericLiteral
    function maxDigits() {
        if (HAS_IN) {
            if (ATYP !== SCALAR) return false;
            if (AREP[APOS] !== 4) return false;
            APOS += 1;
        }
        return true;
    }
    maxDigits.constant = {value: 4};

    // SelectionExpression
    function CHAR() {
        if (CHAR_sub1()) return true;
        if (CHAR_sub8()) return true;
        if (CHAR_sub12()) return true;
        if (CHAR_sub16()) return true;
        if (CHAR_sub20()) return true;
        if (CHAR_sub24()) return true;
        if (CHAR_sub28()) return true;
        if (CHAR_sub32()) return true;
        if (CHAR_sub36()) return true;
        if (CHAR_sub40()) return true;
        return false;
    }

    // SequenceExpression
    function CHAR_sub1() {
        const [APOSₒ, CPOSₒ, ATYPₒ] = savepoint();
        if (!CHAR_sub2()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        if (!CHAR_sub4()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        if (!CHAR_sub6()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        return true;
    }

    // NotExpression
    function CHAR_sub2() {
        const [APOSₒ, CPOSₒ, ATYPₒ] = savepoint();
        const result = !CHAR_sub3();
        backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        return result;
    }

    // StringUniversal
    function CHAR_sub3() {
        if (HAS_IN) {
            if (ATYP !== STRING) return false;
            if (APOS + 1 > AREP.length) return false;
            if (AREP.charCodeAt(APOS + 0) !== 92) return false;
            APOS += 1;
        }
        if (HAS_OUT) {
            CPOS += CREP.write("\\", CPOS, undefined, 'utf8');
        }
        return true;
    }
    CHAR_sub3.constant = {value: "\\"};

    // NotExpression
    function CHAR_sub4() {
        const [APOSₒ, CPOSₒ, ATYPₒ] = savepoint();
        const result = !CHAR_sub5();
        backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        return result;
    }

    // StringUniversal
    function CHAR_sub5() {
        if (HAS_IN) {
            if (ATYP !== STRING) return false;
            if (APOS + 1 > AREP.length) return false;
            if (AREP.charCodeAt(APOS + 0) !== 34) return false;
            APOS += 1;
        }
        if (HAS_OUT) {
            CPOS += CREP.write("\"", CPOS, undefined, 'utf8');
        }
        return true;
    }
    CHAR_sub5.constant = {value: "\""};

    // InstantiationExpression
    let CHAR_sub6ₘ;
    function CHAR_sub6(arg) {
        try {
            return CHAR_sub6ₘ(arg);
        }
        catch (err) {
            if (!(err instanceof TypeError) || !err.message.includes('CHAR_sub6ₘ is not a function')) throw err;
            CHAR_sub6ₘ = ascii(CHAR_sub7);
            return CHAR_sub6ₘ(arg);
        }
    }

    // Module
    function CHAR_sub7(member) {
        switch (member) {
            case 'min': return min;
            case 'max': return max;
            default: return undefined;
        }
    }

    // SequenceExpression
    function CHAR_sub8() {
        const [APOSₒ, CPOSₒ, ATYPₒ] = savepoint();
        if (!CHAR_sub9()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        if (!CHAR_sub11()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        return true;
    }

    // CodeExpression
    function CHAR_sub9() {
        const HAS_INₒ = HAS_IN;
        HAS_IN = false;
        const result = CHAR_sub10();
        HAS_IN = HAS_INₒ;
        return result;
    }

    // StringUniversal
    function CHAR_sub10() {
        if (HAS_IN) {
            if (ATYP !== STRING) return false;
            if (APOS + 2 > AREP.length) return false;
            if (AREP.charCodeAt(APOS + 0) !== 92) return false;
            if (AREP.charCodeAt(APOS + 1) !== 34) return false;
            APOS += 2;
        }
        if (HAS_OUT) {
            CPOS += CREP.write("\\\"", CPOS, undefined, 'utf8');
        }
        return true;
    }
    CHAR_sub10.constant = {value: "\\\""};

    // StringAbstract
    function CHAR_sub11() {
        if (HAS_IN) {
            if (ATYP !== STRING) return false;
            if (APOS + 1 > AREP.length) return false;
            if (AREP.charCodeAt(APOS + 0) !== 34) return false;
            APOS += 1;
        }
        return true;
    }
    CHAR_sub11.constant = {value: "\""};

    // SequenceExpression
    function CHAR_sub12() {
        const [APOSₒ, CPOSₒ, ATYPₒ] = savepoint();
        if (!CHAR_sub13()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        if (!CHAR_sub15()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        return true;
    }

    // CodeExpression
    function CHAR_sub13() {
        const HAS_INₒ = HAS_IN;
        HAS_IN = false;
        const result = CHAR_sub14();
        HAS_IN = HAS_INₒ;
        return result;
    }

    // StringUniversal
    function CHAR_sub14() {
        if (HAS_IN) {
            if (ATYP !== STRING) return false;
            if (APOS + 2 > AREP.length) return false;
            if (AREP.charCodeAt(APOS + 0) !== 92) return false;
            if (AREP.charCodeAt(APOS + 1) !== 92) return false;
            APOS += 2;
        }
        if (HAS_OUT) {
            CPOS += CREP.write("\\\\", CPOS, undefined, 'utf8');
        }
        return true;
    }
    CHAR_sub14.constant = {value: "\\\\"};

    // StringAbstract
    function CHAR_sub15() {
        if (HAS_IN) {
            if (ATYP !== STRING) return false;
            if (APOS + 1 > AREP.length) return false;
            if (AREP.charCodeAt(APOS + 0) !== 92) return false;
            APOS += 1;
        }
        return true;
    }
    CHAR_sub15.constant = {value: "\\"};

    // SequenceExpression
    function CHAR_sub16() {
        const [APOSₒ, CPOSₒ, ATYPₒ] = savepoint();
        if (!CHAR_sub17()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        if (!CHAR_sub19()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        return true;
    }

    // CodeExpression
    function CHAR_sub17() {
        const HAS_INₒ = HAS_IN;
        HAS_IN = false;
        const result = CHAR_sub18();
        HAS_IN = HAS_INₒ;
        return result;
    }

    // StringUniversal
    function CHAR_sub18() {
        if (HAS_IN) {
            if (ATYP !== STRING) return false;
            if (APOS + 2 > AREP.length) return false;
            if (AREP.charCodeAt(APOS + 0) !== 92) return false;
            if (AREP.charCodeAt(APOS + 1) !== 47) return false;
            APOS += 2;
        }
        if (HAS_OUT) {
            CPOS += CREP.write("\\/", CPOS, undefined, 'utf8');
        }
        return true;
    }
    CHAR_sub18.constant = {value: "\\/"};

    // StringAbstract
    function CHAR_sub19() {
        if (HAS_IN) {
            if (ATYP !== STRING) return false;
            if (APOS + 1 > AREP.length) return false;
            if (AREP.charCodeAt(APOS + 0) !== 47) return false;
            APOS += 1;
        }
        return true;
    }
    CHAR_sub19.constant = {value: "/"};

    // SequenceExpression
    function CHAR_sub20() {
        const [APOSₒ, CPOSₒ, ATYPₒ] = savepoint();
        if (!CHAR_sub21()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        if (!CHAR_sub23()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        return true;
    }

    // CodeExpression
    function CHAR_sub21() {
        const HAS_INₒ = HAS_IN;
        HAS_IN = false;
        const result = CHAR_sub22();
        HAS_IN = HAS_INₒ;
        return result;
    }

    // StringUniversal
    function CHAR_sub22() {
        if (HAS_IN) {
            if (ATYP !== STRING) return false;
            if (APOS + 2 > AREP.length) return false;
            if (AREP.charCodeAt(APOS + 0) !== 92) return false;
            if (AREP.charCodeAt(APOS + 1) !== 98) return false;
            APOS += 2;
        }
        if (HAS_OUT) {
            CPOS += CREP.write("\\b", CPOS, undefined, 'utf8');
        }
        return true;
    }
    CHAR_sub22.constant = {value: "\\b"};

    // StringAbstract
    function CHAR_sub23() {
        if (HAS_IN) {
            if (ATYP !== STRING) return false;
            if (APOS + 1 > AREP.length) return false;
            if (AREP.charCodeAt(APOS + 0) !== 8) return false;
            APOS += 1;
        }
        return true;
    }
    CHAR_sub23.constant = {value: "\b"};

    // SequenceExpression
    function CHAR_sub24() {
        const [APOSₒ, CPOSₒ, ATYPₒ] = savepoint();
        if (!CHAR_sub25()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        if (!CHAR_sub27()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        return true;
    }

    // CodeExpression
    function CHAR_sub25() {
        const HAS_INₒ = HAS_IN;
        HAS_IN = false;
        const result = CHAR_sub26();
        HAS_IN = HAS_INₒ;
        return result;
    }

    // StringUniversal
    function CHAR_sub26() {
        if (HAS_IN) {
            if (ATYP !== STRING) return false;
            if (APOS + 2 > AREP.length) return false;
            if (AREP.charCodeAt(APOS + 0) !== 92) return false;
            if (AREP.charCodeAt(APOS + 1) !== 102) return false;
            APOS += 2;
        }
        if (HAS_OUT) {
            CPOS += CREP.write("\\f", CPOS, undefined, 'utf8');
        }
        return true;
    }
    CHAR_sub26.constant = {value: "\\f"};

    // StringAbstract
    function CHAR_sub27() {
        if (HAS_IN) {
            if (ATYP !== STRING) return false;
            if (APOS + 1 > AREP.length) return false;
            if (AREP.charCodeAt(APOS + 0) !== 12) return false;
            APOS += 1;
        }
        return true;
    }
    CHAR_sub27.constant = {value: "\f"};

    // SequenceExpression
    function CHAR_sub28() {
        const [APOSₒ, CPOSₒ, ATYPₒ] = savepoint();
        if (!CHAR_sub29()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        if (!CHAR_sub31()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        return true;
    }

    // CodeExpression
    function CHAR_sub29() {
        const HAS_INₒ = HAS_IN;
        HAS_IN = false;
        const result = CHAR_sub30();
        HAS_IN = HAS_INₒ;
        return result;
    }

    // StringUniversal
    function CHAR_sub30() {
        if (HAS_IN) {
            if (ATYP !== STRING) return false;
            if (APOS + 2 > AREP.length) return false;
            if (AREP.charCodeAt(APOS + 0) !== 92) return false;
            if (AREP.charCodeAt(APOS + 1) !== 110) return false;
            APOS += 2;
        }
        if (HAS_OUT) {
            CPOS += CREP.write("\\n", CPOS, undefined, 'utf8');
        }
        return true;
    }
    CHAR_sub30.constant = {value: "\\n"};

    // StringAbstract
    function CHAR_sub31() {
        if (HAS_IN) {
            if (ATYP !== STRING) return false;
            if (APOS + 1 > AREP.length) return false;
            if (AREP.charCodeAt(APOS + 0) !== 10) return false;
            APOS += 1;
        }
        return true;
    }
    CHAR_sub31.constant = {value: "\n"};

    // SequenceExpression
    function CHAR_sub32() {
        const [APOSₒ, CPOSₒ, ATYPₒ] = savepoint();
        if (!CHAR_sub33()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        if (!CHAR_sub35()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        return true;
    }

    // CodeExpression
    function CHAR_sub33() {
        const HAS_INₒ = HAS_IN;
        HAS_IN = false;
        const result = CHAR_sub34();
        HAS_IN = HAS_INₒ;
        return result;
    }

    // StringUniversal
    function CHAR_sub34() {
        if (HAS_IN) {
            if (ATYP !== STRING) return false;
            if (APOS + 2 > AREP.length) return false;
            if (AREP.charCodeAt(APOS + 0) !== 92) return false;
            if (AREP.charCodeAt(APOS + 1) !== 114) return false;
            APOS += 2;
        }
        if (HAS_OUT) {
            CPOS += CREP.write("\\r", CPOS, undefined, 'utf8');
        }
        return true;
    }
    CHAR_sub34.constant = {value: "\\r"};

    // StringAbstract
    function CHAR_sub35() {
        if (HAS_IN) {
            if (ATYP !== STRING) return false;
            if (APOS + 1 > AREP.length) return false;
            if (AREP.charCodeAt(APOS + 0) !== 13) return false;
            APOS += 1;
        }
        return true;
    }
    CHAR_sub35.constant = {value: "\r"};

    // SequenceExpression
    function CHAR_sub36() {
        const [APOSₒ, CPOSₒ, ATYPₒ] = savepoint();
        if (!CHAR_sub37()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        if (!CHAR_sub39()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        return true;
    }

    // CodeExpression
    function CHAR_sub37() {
        const HAS_INₒ = HAS_IN;
        HAS_IN = false;
        const result = CHAR_sub38();
        HAS_IN = HAS_INₒ;
        return result;
    }

    // StringUniversal
    function CHAR_sub38() {
        if (HAS_IN) {
            if (ATYP !== STRING) return false;
            if (APOS + 2 > AREP.length) return false;
            if (AREP.charCodeAt(APOS + 0) !== 92) return false;
            if (AREP.charCodeAt(APOS + 1) !== 116) return false;
            APOS += 2;
        }
        if (HAS_OUT) {
            CPOS += CREP.write("\\t", CPOS, undefined, 'utf8');
        }
        return true;
    }
    CHAR_sub38.constant = {value: "\\t"};

    // StringAbstract
    function CHAR_sub39() {
        if (HAS_IN) {
            if (ATYP !== STRING) return false;
            if (APOS + 1 > AREP.length) return false;
            if (AREP.charCodeAt(APOS + 0) !== 9) return false;
            APOS += 1;
        }
        return true;
    }
    CHAR_sub39.constant = {value: "\t"};

    // SequenceExpression
    function CHAR_sub40() {
        const [APOSₒ, CPOSₒ, ATYPₒ] = savepoint();
        if (!CHAR_sub41()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        if (!CHAR_sub43()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        return true;
    }

    // CodeExpression
    function CHAR_sub41() {
        const HAS_INₒ = HAS_IN;
        HAS_IN = false;
        const result = CHAR_sub42();
        HAS_IN = HAS_INₒ;
        return result;
    }

    // StringUniversal
    function CHAR_sub42() {
        if (HAS_IN) {
            if (ATYP !== STRING) return false;
            if (APOS + 2 > AREP.length) return false;
            if (AREP.charCodeAt(APOS + 0) !== 92) return false;
            if (AREP.charCodeAt(APOS + 1) !== 117) return false;
            APOS += 2;
        }
        if (HAS_OUT) {
            CPOS += CREP.write("\\u", CPOS, undefined, 'utf8');
        }
        return true;
    }
    CHAR_sub42.constant = {value: "\\u"};

    // InstantiationExpression
    let CHAR_sub43ₘ;
    function CHAR_sub43(arg) {
        try {
            return CHAR_sub43ₘ(arg);
        }
        catch (err) {
            if (!(err instanceof TypeError) || !err.message.includes('CHAR_sub43ₘ is not a function')) throw err;
            CHAR_sub43ₘ = unicode(CHAR_sub44);
            return CHAR_sub43ₘ(arg);
        }
    }

    // Module
    function CHAR_sub44(member) {
        switch (member) {
            case 'base': return base;
            case 'minDigits': return minDigits;
            case 'maxDigits': return maxDigits;
            default: return undefined;
        }
    }

    // SequenceExpression
    function LBRACE() {
        const [APOSₒ, CPOSₒ, ATYPₒ] = savepoint();
        if (!WS()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        if (!LBRACE_sub1()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        if (!WS()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        return true;
    }

    // CodeExpression
    function LBRACE_sub1() {
        const HAS_INₒ = HAS_IN;
        HAS_IN = false;
        const result = LBRACE_sub2();
        HAS_IN = HAS_INₒ;
        return result;
    }

    // StringUniversal
    function LBRACE_sub2() {
        if (HAS_IN) {
            if (ATYP !== STRING) return false;
            if (APOS + 1 > AREP.length) return false;
            if (AREP.charCodeAt(APOS + 0) !== 123) return false;
            APOS += 1;
        }
        if (HAS_OUT) {
            CPOS += CREP.write("{", CPOS, undefined, 'utf8');
        }
        return true;
    }
    LBRACE_sub2.constant = {value: "{"};

    // SequenceExpression
    function RBRACE() {
        const [APOSₒ, CPOSₒ, ATYPₒ] = savepoint();
        if (!WS()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        if (!RBRACE_sub1()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        if (!WS()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        return true;
    }

    // CodeExpression
    function RBRACE_sub1() {
        const HAS_INₒ = HAS_IN;
        HAS_IN = false;
        const result = RBRACE_sub2();
        HAS_IN = HAS_INₒ;
        return result;
    }

    // StringUniversal
    function RBRACE_sub2() {
        if (HAS_IN) {
            if (ATYP !== STRING) return false;
            if (APOS + 1 > AREP.length) return false;
            if (AREP.charCodeAt(APOS + 0) !== 125) return false;
            APOS += 1;
        }
        if (HAS_OUT) {
            CPOS += CREP.write("}", CPOS, undefined, 'utf8');
        }
        return true;
    }
    RBRACE_sub2.constant = {value: "}"};

    // SequenceExpression
    function LBRACKET() {
        const [APOSₒ, CPOSₒ, ATYPₒ] = savepoint();
        if (!WS()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        if (!LBRACKET_sub1()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        if (!WS()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        return true;
    }

    // CodeExpression
    function LBRACKET_sub1() {
        const HAS_INₒ = HAS_IN;
        HAS_IN = false;
        const result = LBRACKET_sub2();
        HAS_IN = HAS_INₒ;
        return result;
    }

    // StringUniversal
    function LBRACKET_sub2() {
        if (HAS_IN) {
            if (ATYP !== STRING) return false;
            if (APOS + 1 > AREP.length) return false;
            if (AREP.charCodeAt(APOS + 0) !== 91) return false;
            APOS += 1;
        }
        if (HAS_OUT) {
            CPOS += CREP.write("[", CPOS, undefined, 'utf8');
        }
        return true;
    }
    LBRACKET_sub2.constant = {value: "["};

    // SequenceExpression
    function RBRACKET() {
        const [APOSₒ, CPOSₒ, ATYPₒ] = savepoint();
        if (!WS()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        if (!RBRACKET_sub1()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        if (!WS()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        return true;
    }

    // CodeExpression
    function RBRACKET_sub1() {
        const HAS_INₒ = HAS_IN;
        HAS_IN = false;
        const result = RBRACKET_sub2();
        HAS_IN = HAS_INₒ;
        return result;
    }

    // StringUniversal
    function RBRACKET_sub2() {
        if (HAS_IN) {
            if (ATYP !== STRING) return false;
            if (APOS + 1 > AREP.length) return false;
            if (AREP.charCodeAt(APOS + 0) !== 93) return false;
            APOS += 1;
        }
        if (HAS_OUT) {
            CPOS += CREP.write("]", CPOS, undefined, 'utf8');
        }
        return true;
    }
    RBRACKET_sub2.constant = {value: "]"};

    // SequenceExpression
    function COLON() {
        const [APOSₒ, CPOSₒ, ATYPₒ] = savepoint();
        if (!WS()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        if (!COLON_sub1()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        if (!WS()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        return true;
    }

    // CodeExpression
    function COLON_sub1() {
        const HAS_INₒ = HAS_IN;
        HAS_IN = false;
        const result = COLON_sub2();
        HAS_IN = HAS_INₒ;
        return result;
    }

    // StringUniversal
    function COLON_sub2() {
        if (HAS_IN) {
            if (ATYP !== STRING) return false;
            if (APOS + 1 > AREP.length) return false;
            if (AREP.charCodeAt(APOS + 0) !== 58) return false;
            APOS += 1;
        }
        if (HAS_OUT) {
            CPOS += CREP.write(":", CPOS, undefined, 'utf8');
        }
        return true;
    }
    COLON_sub2.constant = {value: ":"};

    // SequenceExpression
    function COMMA() {
        const [APOSₒ, CPOSₒ, ATYPₒ] = savepoint();
        if (!WS()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        if (!COMMA_sub1()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        if (!WS()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        return true;
    }

    // CodeExpression
    function COMMA_sub1() {
        const HAS_INₒ = HAS_IN;
        HAS_IN = false;
        const result = COMMA_sub2();
        HAS_IN = HAS_INₒ;
        return result;
    }

    // StringUniversal
    function COMMA_sub2() {
        if (HAS_IN) {
            if (ATYP !== STRING) return false;
            if (APOS + 1 > AREP.length) return false;
            if (AREP.charCodeAt(APOS + 0) !== 44) return false;
            APOS += 1;
        }
        if (HAS_OUT) {
            CPOS += CREP.write(",", CPOS, undefined, 'utf8');
        }
        return true;
    }
    COMMA_sub2.constant = {value: ","};

    // CodeExpression
    function DOUBLE_QUOTE() {
        const HAS_INₒ = HAS_IN;
        HAS_IN = false;
        const result = DOUBLE_QUOTE_sub1();
        HAS_IN = HAS_INₒ;
        return result;
    }

    // StringUniversal
    function DOUBLE_QUOTE_sub1() {
        if (HAS_IN) {
            if (ATYP !== STRING) return false;
            if (APOS + 1 > AREP.length) return false;
            if (AREP.charCodeAt(APOS + 0) !== 34) return false;
            APOS += 1;
        }
        if (HAS_OUT) {
            CPOS += CREP.write("\"", CPOS, undefined, 'utf8');
        }
        return true;
    }
    DOUBLE_QUOTE_sub1.constant = {value: "\""};

    // CodeExpression
    function WS() {
        const HAS_INₒ = HAS_IN;
        HAS_IN = false;
        const result = WS_sub1();
        HAS_IN = HAS_INₒ;
        return result;
    }

    // QuantifiedExpression
    function WS_sub1() {
        let [APOSᐟ, CPOSᐟ] = [APOS, CPOS];
        do {
            if (!WS_sub2()) break;
            if (APOS <= APOSᐟ) break;
            APOSᐟ = APOS, CPOSᐟ = CPOS;
        } while (true);
        APOS = APOSᐟ, CPOS = CPOSᐟ;
        return true;
    }

    // SelectionExpression
    function WS_sub2() {
        if (WS_sub3()) return true;
        if (WS_sub4()) return true;
        if (WS_sub5()) return true;
        if (WS_sub6()) return true;
        return false;
    }

    // StringUniversal
    function WS_sub3() {
        if (HAS_IN) {
            if (ATYP !== STRING) return false;
            if (APOS + 1 > AREP.length) return false;
            if (AREP.charCodeAt(APOS + 0) !== 32) return false;
            APOS += 1;
        }
        if (HAS_OUT) {
            CPOS += CREP.write(" ", CPOS, undefined, 'utf8');
        }
        return true;
    }
    WS_sub3.constant = {value: " "};

    // StringUniversal
    function WS_sub4() {
        if (HAS_IN) {
            if (ATYP !== STRING) return false;
            if (APOS + 1 > AREP.length) return false;
            if (AREP.charCodeAt(APOS + 0) !== 9) return false;
            APOS += 1;
        }
        if (HAS_OUT) {
            CPOS += CREP.write("\t", CPOS, undefined, 'utf8');
        }
        return true;
    }
    WS_sub4.constant = {value: "\t"};

    // StringUniversal
    function WS_sub5() {
        if (HAS_IN) {
            if (ATYP !== STRING) return false;
            if (APOS + 1 > AREP.length) return false;
            if (AREP.charCodeAt(APOS + 0) !== 10) return false;
            APOS += 1;
        }
        if (HAS_OUT) {
            CPOS += CREP.write("\n", CPOS, undefined, 'utf8');
        }
        return true;
    }
    WS_sub5.constant = {value: "\n"};

    // StringUniversal
    function WS_sub6() {
        if (HAS_IN) {
            if (ATYP !== STRING) return false;
            if (APOS + 1 > AREP.length) return false;
            if (AREP.charCodeAt(APOS + 0) !== 13) return false;
            APOS += 1;
        }
        if (HAS_OUT) {
            CPOS += CREP.write("\r", CPOS, undefined, 'utf8');
        }
        return true;
    }
    WS_sub6.constant = {value: "\r"};

    // Module
    function Ɱ_json(member) {
        switch (member) {
            case 'ascii': return ascii;
            case 'f64': return f64;
            case 'unicode': return unicode;
            case 'start': return start_2;
            case 'Value': return Value;
            case 'False': return False;
            case 'Null': return Null;
            case 'True': return True;
            case 'Object': return Object;
            case 'Properties': return Properties;
            case 'Property': return Property;
            case 'Array': return Array;
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
    }

    // Intrinsic

    // Intrinsic

    // Intrinsic

    // Intrinsic

    // Module
    function Ɱ_std(member) {
        switch (member) {
            case 'ascii': return ascii_2;
            case 'f64': return f64_2;
            case 'i32': return i32;
            case 'memoise': return memoise;
            default: return undefined;
        }
    }

    // Intrinsic

    // Module
    function Ɱ_experiments(member) {
        switch (member) {
            case 'unicode': return unicode_2;
            default: return undefined;
        }
    }

    return start_2;
})();
