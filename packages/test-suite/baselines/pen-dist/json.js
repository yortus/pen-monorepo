// ------------------------------ Main exports ------------------------------
module.exports = {
    parse(strOrBuf) { // expects buf to be utf8 encoded
        CREP = Buffer.isBuffer(strOrBuf) ? strOrBuf : Buffer.from(strOrBuf, 'utf8');
        CPOS = 0;
        AREP = [];
        APOS = 0;
        if (!parseInner(parse, true)) throw new Error('parse failed');
        if (CPOS !== CREP.length) throw new Error('parse didn\'t consume entire input');
        return AREP[0];
    },
    print(node, buf) {
        AREP = [node];
        APOS = 0;
        CREP = buf || Buffer.alloc(2 ** 22); // 4MB
        CPOS = 0;
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
        const fieldLabels = [];
        for (const recordItem of recordItems) {
            if (recordItem.kind === 'Field') {
                let fieldLabel;
                if (typeof recordItem.label === 'string') {
                    fieldLabel = recordItem.label;
                }
                else {
                    if (!parseInner(recordItem.label, true))
                        return backtrack(APOSₒ, CPOSₒ);
                    assert(ATYP === STRING);
                    APOS -= 1;
                    fieldLabel = AREP[APOS];
                }
                if (fieldLabels.includes(fieldLabel))
                    return backtrack(APOSₒ, CPOSₒ);
                if (!parseInner(recordItem.expr, true))
                    return backtrack(APOSₒ, CPOSₒ);
                const fieldValue = AREP[--APOS];
                AREP[APOS++] = fieldLabel;
                AREP[APOS++] = fieldValue;
                fieldLabels.push(fieldLabel);
            }
            else {
                const apos = APOS;
                if (!recordItem.expr())
                    return backtrack(APOSₒ, CPOSₒ);
                for (let i = apos; i < APOS; i += 2) {
                    const fieldLabel = AREP[i];
                    if (fieldLabels.includes(fieldLabel))
                        return backtrack(APOSₒ, CPOSₒ);
                    fieldLabels.push(fieldLabel);
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
function isFunc(_x) {
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
const [NOTHING, SCALAR, STRING, LIST, RECORD] = [0, 1, 2, 4, 8];
const savepoint = () => [APOS, CPOS];
const backtrack = (APOSₒ, CPOSₒ, ATYPₒ) => (APOS = APOSₒ, CPOS = CPOSₒ, ATYP = ATYPₒ !== null && ATYPₒ !== void 0 ? ATYPₒ : NOTHING, false);
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
function assert(value) {
    if (!value)
        throw new Error(`Assertion failed`);
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
            if (mode === 'parse') {
                return function FSTR() {
                    let num = 0;
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
                    // Success
                    emitScalar(num);
                    return true;
                };
            }
            else /* mode === 'print' */ {
                return function FSTR() {
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
                };
            }
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
                if (mode === 'parse') {
                    return function ISTR() {
                        let num = 0;
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
                        // Success
                        emitScalar(num);
                        return true;
                    };
                }
                else /* mode === 'print' */ {
                    return function ISTR() {
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
            return function MEM_function(expr) {
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
                if (mode === 'parse') {
                    return function UNI() {
                        // TODO: respect VOID AREP/CREP...
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
                        emitBytes(...Buffer.from(eval(`"\\u{${num}}"`)).values()); // TODO: hacky... fix when we have a charCode
                        return true;
                    };
                }
                else /* mode === 'print' */ {
                    return function UNI() {
                        // TODO: respect VOID AREP/CREP...
                        if (ATYP !== STRING)
                            return false;
                        const [APOSₒ, CPOSₒ] = savepoint();
                        const bytes = AREP;
                        let c = bytes[APOS++];
                        if (c < 128) {
                            // no-op
                        }
                        else if (c > 191 && c < 224) {
                            if (APOS >= bytes.length)
                                return backtrack(APOSₒ, CPOSₒ);
                            c = (c & 31) << 6 | bytes[APOS++] & 63;
                        }
                        else if (c > 223 && c < 240) {
                            if (APOS + 1 >= bytes.length)
                                return backtrack(APOSₒ, CPOSₒ);
                            c = (c & 15) << 12 | (bytes[APOS++] & 63) << 6 | bytes[APOS++] & 63;
                        }
                        else if (c > 239 && c < 248) {
                            if (APOS + 2 >= bytes.length)
                                return backtrack(APOSₒ, CPOSₒ);
                            c = (c & 7) << 18 | (bytes[APOS++] & 63) << 12 | (bytes[APOS++] & 63) << 6 | bytes[APOS++] & 63;
                        }
                        else
                            return backtrack(APOSₒ, CPOSₒ);
                        const s = c.toString(base).padStart(minDigits, '0');
                        if (s.length > maxDigits)
                            return false;
                        CREP.write(s, CPOS);
                        CPOS += s.length;
                        return true;
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
    const floatString_2 = extensions["V:/projects/oss/pen-monorepo/packages/core/penc/dist/deps/std.pen.js"].floatString({mode: 'parse'});
    const intString = extensions["V:/projects/oss/pen-monorepo/packages/core/penc/dist/deps/std.pen.js"].intString({mode: 'parse'});
    const memoise = extensions["V:/projects/oss/pen-monorepo/packages/core/penc/dist/deps/std.pen.js"].memoise({mode: 'parse'});
    const unicode_2 = extensions["V:/projects/oss/pen-monorepo/packages/core/penc/dist/deps/experiments.pen.js"].unicode({mode: 'parse'});

    // Identifier
    function floatString(arg) {
        return floatString_2(arg);
    }

    // Identifier
    function unicode(arg) {
        return unicode_2(arg);
    }

    // SequenceExpression
    function start_2() {
        const [APOSₒ, CPOSₒ] = savepoint(), ATYPₒ = ATYP;
        let seqType = NOTHING;
        ATYP = NOTHING;
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
        const [APOSₒ, CPOSₒ] = savepoint(), ATYPₒ = ATYP;
        let seqType = NOTHING;
        ATYP = NOTHING;
        if (!False_sub1()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        seqType |= ATYP;
        if (!False_sub2()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        ATYP |= seqType;
        return true;
    }

    // StringLiteral
    function False_sub1() {
        if (CPOS + 5 > CREP.length) return false;
        if (CREP[CPOS + 0] !== 0x66) return false;
        if (CREP[CPOS + 1] !== 0x61) return false;
        if (CREP[CPOS + 2] !== 0x6c) return false;
        if (CREP[CPOS + 3] !== 0x73) return false;
        if (CREP[CPOS + 4] !== 0x65) return false;
        CPOS += 5;
        return true;
    }
    False_sub1.constant = {value: "false"};

    // BooleanLiteral
    function False_sub2() {
        emitScalar(false);
        return true;
    }
    False_sub2.constant = {value: false};

    // SequenceExpression
    function Null() {
        const [APOSₒ, CPOSₒ] = savepoint(), ATYPₒ = ATYP;
        let seqType = NOTHING;
        ATYP = NOTHING;
        if (!Null_sub1()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        seqType |= ATYP;
        if (!Null_sub2()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        ATYP |= seqType;
        return true;
    }

    // StringLiteral
    function Null_sub1() {
        if (CPOS + 4 > CREP.length) return false;
        if (CREP[CPOS + 0] !== 0x6e) return false;
        if (CREP[CPOS + 1] !== 0x75) return false;
        if (CREP[CPOS + 2] !== 0x6c) return false;
        if (CREP[CPOS + 3] !== 0x6c) return false;
        CPOS += 4;
        return true;
    }
    Null_sub1.constant = {value: "null"};

    // NullLiteral
    function Null_sub2() {
        emitScalar(null);
        return true;
    }
    Null_sub2.constant = {value: null};

    // SequenceExpression
    function True() {
        const [APOSₒ, CPOSₒ] = savepoint(), ATYPₒ = ATYP;
        let seqType = NOTHING;
        ATYP = NOTHING;
        if (!True_sub1()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        seqType |= ATYP;
        if (!True_sub2()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        ATYP |= seqType;
        return true;
    }

    // StringLiteral
    function True_sub1() {
        if (CPOS + 4 > CREP.length) return false;
        if (CREP[CPOS + 0] !== 0x74) return false;
        if (CREP[CPOS + 1] !== 0x72) return false;
        if (CREP[CPOS + 2] !== 0x75) return false;
        if (CREP[CPOS + 3] !== 0x65) return false;
        CPOS += 4;
        return true;
    }
    True_sub1.constant = {value: "true"};

    // BooleanLiteral
    function True_sub2() {
        emitScalar(true);
        return true;
    }
    True_sub2.constant = {value: true};

    // SequenceExpression
    function Object() {
        const [APOSₒ, CPOSₒ] = savepoint(), ATYPₒ = ATYP;
        let seqType = NOTHING;
        ATYP = NOTHING;
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
        if (Object_sub2()) return true;
        if (Object_sub9()) return true;
        return false;
    }

    // SequenceExpression
    function Object_sub2() {
        const [APOSₒ, CPOSₒ] = savepoint(), ATYPₒ = ATYP;
        let seqType = NOTHING;
        ATYP = NOTHING;
        if (!Object_sub3()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        seqType |= ATYP;
        if (!Object_sub5()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        ATYP |= seqType;
        return true;
    }

    // RecordExpression
    let Object_sub3ₘ;
    function Object_sub3(arg) {
        try {
            return Object_sub3ₘ(arg);
        }
        catch (err) {
            if (!(err instanceof TypeError) || !err.message.includes('Object_sub3ₘ is not a function')) throw err;
            Object_sub3ₘ = parseRecord([
                {
                    kind: 'Field',
                    label: String,
                    expr: Object_sub4
                },
            ]);
            return Object_sub3ₘ(arg);
        }
    }

    // SequenceExpression
    function Object_sub4() {
        const [APOSₒ, CPOSₒ] = savepoint(), ATYPₒ = ATYP;
        let seqType = NOTHING;
        ATYP = NOTHING;
        if (!COLON()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        seqType |= ATYP;
        if (!Value()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        ATYP |= seqType;
        return true;
    }

    // QuantifiedExpression
    function Object_sub5() {
        let [CPOSᐟ, APOSᐟ] = [CPOS, APOS];
        do {
            if (!Object_sub6()) break;
            if (CPOS <= CPOSᐟ) break;
            CPOSᐟ = CPOS, APOSᐟ = APOS;
        } while (true);
        CPOS = CPOSᐟ, APOS = APOSᐟ;
        return true;
    }

    // RecordExpression
    let Object_sub6ₘ;
    function Object_sub6(arg) {
        try {
            return Object_sub6ₘ(arg);
        }
        catch (err) {
            if (!(err instanceof TypeError) || !err.message.includes('Object_sub6ₘ is not a function')) throw err;
            Object_sub6ₘ = parseRecord([
                {
                    kind: 'Field',
                    label: Object_sub7,
                    expr: Object_sub8
                },
            ]);
            return Object_sub6ₘ(arg);
        }
    }

    // SequenceExpression
    function Object_sub7() {
        const [APOSₒ, CPOSₒ] = savepoint(), ATYPₒ = ATYP;
        let seqType = NOTHING;
        ATYP = NOTHING;
        if (!COMMA()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        seqType |= ATYP;
        if (!String()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        ATYP |= seqType;
        return true;
    }

    // SequenceExpression
    function Object_sub8() {
        const [APOSₒ, CPOSₒ] = savepoint(), ATYPₒ = ATYP;
        let seqType = NOTHING;
        ATYP = NOTHING;
        if (!COLON()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        seqType |= ATYP;
        if (!Value()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        ATYP |= seqType;
        return true;
    }

    // RecordExpression
    let Object_sub9ₘ;
    function Object_sub9(arg) {
        try {
            return Object_sub9ₘ(arg);
        }
        catch (err) {
            if (!(err instanceof TypeError) || !err.message.includes('Object_sub9ₘ is not a function')) throw err;
            Object_sub9ₘ = parseRecord([]);
            return Object_sub9ₘ(arg);
        }
    }

    // SequenceExpression
    function Object2() {
        const [APOSₒ, CPOSₒ] = savepoint(), ATYPₒ = ATYP;
        let seqType = NOTHING;
        ATYP = NOTHING;
        if (!LBRACE()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        seqType |= ATYP;
        if (!Object2_sub1()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        seqType |= ATYP;
        if (!RBRACE()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        ATYP |= seqType;
        return true;
    }

    // SelectionExpression
    function Object2_sub1() {
        if (Properties()) return true;
        if (Object2_sub2()) return true;
        return false;
    }

    // RecordExpression
    let Object2_sub2ₘ;
    function Object2_sub2(arg) {
        try {
            return Object2_sub2ₘ(arg);
        }
        catch (err) {
            if (!(err instanceof TypeError) || !err.message.includes('Object2_sub2ₘ is not a function')) throw err;
            Object2_sub2ₘ = parseRecord([]);
            return Object2_sub2ₘ(arg);
        }
    }

    // RecordExpression
    let Propertiesₘ;
    function Properties(arg) {
        try {
            return Propertiesₘ(arg);
        }
        catch (err) {
            if (!(err instanceof TypeError) || !err.message.includes('Propertiesₘ is not a function')) throw err;
            Propertiesₘ = parseRecord([
                {
                    kind: 'Field',
                    label: String,
                    expr: Properties_sub1
                },
                {
                    kind: 'Splice',
                    label: undefined,
                    expr: Properties_sub2
                },
            ]);
            return Propertiesₘ(arg);
        }
    }

    // SequenceExpression
    function Properties_sub1() {
        const [APOSₒ, CPOSₒ] = savepoint(), ATYPₒ = ATYP;
        let seqType = NOTHING;
        ATYP = NOTHING;
        if (!COLON()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        seqType |= ATYP;
        if (!Value()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        ATYP |= seqType;
        return true;
    }

    // SelectionExpression
    function Properties_sub2() {
        if (Properties_sub3()) return true;
        if (Properties_sub4()) return true;
        return false;
    }

    // SequenceExpression
    function Properties_sub3() {
        const [APOSₒ, CPOSₒ] = savepoint(), ATYPₒ = ATYP;
        let seqType = NOTHING;
        ATYP = NOTHING;
        if (!COMMA()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        seqType |= ATYP;
        if (!Properties()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        ATYP |= seqType;
        return true;
    }

    // RecordExpression
    let Properties_sub4ₘ;
    function Properties_sub4(arg) {
        try {
            return Properties_sub4ₘ(arg);
        }
        catch (err) {
            if (!(err instanceof TypeError) || !err.message.includes('Properties_sub4ₘ is not a function')) throw err;
            Properties_sub4ₘ = parseRecord([]);
            return Properties_sub4ₘ(arg);
        }
    }

    // SequenceExpression
    function Array() {
        const [APOSₒ, CPOSₒ] = savepoint(), ATYPₒ = ATYP;
        let seqType = NOTHING;
        ATYP = NOTHING;
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
        if (Array_sub2()) return true;
        if (Array_sub7()) return true;
        return false;
    }

    // SequenceExpression
    function Array_sub2() {
        const [APOSₒ, CPOSₒ] = savepoint(), ATYPₒ = ATYP;
        let seqType = NOTHING;
        ATYP = NOTHING;
        if (!Array_sub3()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        seqType |= ATYP;
        if (!Array_sub4()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        ATYP |= seqType;
        return true;
    }

    // ListExpression
    let Array_sub3ₘ;
    function Array_sub3(arg) {
        try {
            return Array_sub3ₘ(arg);
        }
        catch (err) {
            if (!(err instanceof TypeError) || !err.message.includes('Array_sub3ₘ is not a function')) throw err;
            Array_sub3ₘ = parseList([
                {
                    kind: 'Element',
                    expr: Value
                },
            ]);
            return Array_sub3ₘ(arg);
        }
    }

    // QuantifiedExpression
    function Array_sub4() {
        let [CPOSᐟ, APOSᐟ] = [CPOS, APOS];
        do {
            if (!Array_sub5()) break;
            if (CPOS <= CPOSᐟ) break;
            CPOSᐟ = CPOS, APOSᐟ = APOS;
        } while (true);
        CPOS = CPOSᐟ, APOS = APOSᐟ;
        return true;
    }

    // ListExpression
    let Array_sub5ₘ;
    function Array_sub5(arg) {
        try {
            return Array_sub5ₘ(arg);
        }
        catch (err) {
            if (!(err instanceof TypeError) || !err.message.includes('Array_sub5ₘ is not a function')) throw err;
            Array_sub5ₘ = parseList([
                {
                    kind: 'Element',
                    expr: Array_sub6
                },
            ]);
            return Array_sub5ₘ(arg);
        }
    }

    // SequenceExpression
    function Array_sub6() {
        const [APOSₒ, CPOSₒ] = savepoint(), ATYPₒ = ATYP;
        let seqType = NOTHING;
        ATYP = NOTHING;
        if (!COMMA()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        seqType |= ATYP;
        if (!Value()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        ATYP |= seqType;
        return true;
    }

    // ListExpression
    let Array_sub7ₘ;
    function Array_sub7(arg) {
        try {
            return Array_sub7ₘ(arg);
        }
        catch (err) {
            if (!(err instanceof TypeError) || !err.message.includes('Array_sub7ₘ is not a function')) throw err;
            Array_sub7ₘ = parseList([]);
            return Array_sub7ₘ(arg);
        }
    }

    // SequenceExpression
    function Array2() {
        const [APOSₒ, CPOSₒ] = savepoint(), ATYPₒ = ATYP;
        let seqType = NOTHING;
        ATYP = NOTHING;
        if (!LBRACKET()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        seqType |= ATYP;
        if (!Array2_sub1()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        seqType |= ATYP;
        if (!RBRACKET()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        ATYP |= seqType;
        return true;
    }

    // SelectionExpression
    function Array2_sub1() {
        if (Elements()) return true;
        if (Array2_sub2()) return true;
        return false;
    }

    // ListExpression
    let Array2_sub2ₘ;
    function Array2_sub2(arg) {
        try {
            return Array2_sub2ₘ(arg);
        }
        catch (err) {
            if (!(err instanceof TypeError) || !err.message.includes('Array2_sub2ₘ is not a function')) throw err;
            Array2_sub2ₘ = parseList([]);
            return Array2_sub2ₘ(arg);
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
        const [APOSₒ, CPOSₒ] = savepoint(), ATYPₒ = ATYP;
        let seqType = NOTHING;
        ATYP = NOTHING;
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
        return floatString(arg);
    }

    // SequenceExpression
    function String() {
        const [APOSₒ, CPOSₒ] = savepoint(), ATYPₒ = ATYP;
        let seqType = NOTHING;
        ATYP = NOTHING;
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
    function base() {
        emitScalar(16);
        return true;
    }
    base.constant = {value: 16};

    // NumericLiteral
    function minDigits() {
        emitScalar(4);
        return true;
    }
    minDigits.constant = {value: 4};

    // NumericLiteral
    function maxDigits() {
        emitScalar(4);
        return true;
    }
    maxDigits.constant = {value: 4};

    // SelectionExpression
    function CHAR() {
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
    }

    // ByteExpression
    function CHAR_sub1() {
        let cc;
        if (CPOS >= CREP.length) return false;
        cc = CREP[CPOS];
        if (cc === 0x5c) return false;
        if (cc === 0x22) return false;
        if ((cc < 0x20 || cc > 0x7f)) return false;
        CPOS += 1;
        emitByte(cc);
        return true;
    }

    // SequenceExpression
    function CHAR_sub2() {
        const [APOSₒ, CPOSₒ] = savepoint(), ATYPₒ = ATYP;
        let seqType = NOTHING;
        ATYP = NOTHING;
        if (!CHAR_sub3()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        seqType |= ATYP;
        if (!CHAR_sub4()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        ATYP |= seqType;
        return true;
    }

    // ByteExpression
    function CHAR_sub3() {
        let cc;
        if (CPOS >= CREP.length) return false;
        cc = CREP[CPOS];
        if ((cc < 0xc0 || cc > 0xdf)) return false;
        CPOS += 1;
        emitByte(cc);
        return true;
    }

    // ByteExpression
    function CHAR_sub4() {
        let cc;
        if (CPOS >= CREP.length) return false;
        cc = CREP[CPOS];
        if ((cc < 0x80 || cc > 0xbf)) return false;
        CPOS += 1;
        emitByte(cc);
        return true;
    }

    // SequenceExpression
    function CHAR_sub5() {
        const [APOSₒ, CPOSₒ] = savepoint(), ATYPₒ = ATYP;
        let seqType = NOTHING;
        ATYP = NOTHING;
        if (!CHAR_sub6()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        seqType |= ATYP;
        if (!CHAR_sub7()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        seqType |= ATYP;
        if (!CHAR_sub8()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        ATYP |= seqType;
        return true;
    }

    // ByteExpression
    function CHAR_sub6() {
        let cc;
        if (CPOS >= CREP.length) return false;
        cc = CREP[CPOS];
        if ((cc < 0xe0 || cc > 0xef)) return false;
        CPOS += 1;
        emitByte(cc);
        return true;
    }

    // ByteExpression
    function CHAR_sub7() {
        let cc;
        if (CPOS >= CREP.length) return false;
        cc = CREP[CPOS];
        if ((cc < 0x80 || cc > 0xbf)) return false;
        CPOS += 1;
        emitByte(cc);
        return true;
    }

    // ByteExpression
    function CHAR_sub8() {
        let cc;
        if (CPOS >= CREP.length) return false;
        cc = CREP[CPOS];
        if ((cc < 0x80 || cc > 0xbf)) return false;
        CPOS += 1;
        emitByte(cc);
        return true;
    }

    // SequenceExpression
    function CHAR_sub9() {
        const [APOSₒ, CPOSₒ] = savepoint(), ATYPₒ = ATYP;
        let seqType = NOTHING;
        ATYP = NOTHING;
        if (!CHAR_sub10()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        seqType |= ATYP;
        if (!CHAR_sub11()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        seqType |= ATYP;
        if (!CHAR_sub12()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        seqType |= ATYP;
        if (!CHAR_sub13()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        ATYP |= seqType;
        return true;
    }

    // ByteExpression
    function CHAR_sub10() {
        let cc;
        if (CPOS >= CREP.length) return false;
        cc = CREP[CPOS];
        if ((cc < 0xf0 || cc > 0xf7)) return false;
        CPOS += 1;
        emitByte(cc);
        return true;
    }

    // ByteExpression
    function CHAR_sub11() {
        let cc;
        if (CPOS >= CREP.length) return false;
        cc = CREP[CPOS];
        if ((cc < 0x80 || cc > 0xbf)) return false;
        CPOS += 1;
        emitByte(cc);
        return true;
    }

    // ByteExpression
    function CHAR_sub12() {
        let cc;
        if (CPOS >= CREP.length) return false;
        cc = CREP[CPOS];
        if ((cc < 0x80 || cc > 0xbf)) return false;
        CPOS += 1;
        emitByte(cc);
        return true;
    }

    // ByteExpression
    function CHAR_sub13() {
        let cc;
        if (CPOS >= CREP.length) return false;
        cc = CREP[CPOS];
        if ((cc < 0x80 || cc > 0xbf)) return false;
        CPOS += 1;
        emitByte(cc);
        return true;
    }

    // SequenceExpression
    function CHAR_sub14() {
        const [APOSₒ, CPOSₒ] = savepoint(), ATYPₒ = ATYP;
        let seqType = NOTHING;
        ATYP = NOTHING;
        if (!CHAR_sub15()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        seqType |= ATYP;
        if (!CHAR_sub16()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        ATYP |= seqType;
        return true;
    }

    // StringLiteral
    function CHAR_sub15() {
        if (CPOS + 2 > CREP.length) return false;
        if (CREP[CPOS + 0] !== 0x5c) return false;
        if (CREP[CPOS + 1] !== 0x22) return false;
        CPOS += 2;
        return true;
    }
    CHAR_sub15.constant = {value: "\\\""};

    // ByteExpression
    function CHAR_sub16() {
        let cc;
        cc = 0x22;
        emitByte(cc);
        return true;
    }

    // SequenceExpression
    function CHAR_sub17() {
        const [APOSₒ, CPOSₒ] = savepoint(), ATYPₒ = ATYP;
        let seqType = NOTHING;
        ATYP = NOTHING;
        if (!CHAR_sub18()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        seqType |= ATYP;
        if (!CHAR_sub19()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        ATYP |= seqType;
        return true;
    }

    // StringLiteral
    function CHAR_sub18() {
        if (CPOS + 2 > CREP.length) return false;
        if (CREP[CPOS + 0] !== 0x5c) return false;
        if (CREP[CPOS + 1] !== 0x5c) return false;
        CPOS += 2;
        return true;
    }
    CHAR_sub18.constant = {value: "\\\\"};

    // ByteExpression
    function CHAR_sub19() {
        let cc;
        cc = 0x5c;
        emitByte(cc);
        return true;
    }

    // SequenceExpression
    function CHAR_sub20() {
        const [APOSₒ, CPOSₒ] = savepoint(), ATYPₒ = ATYP;
        let seqType = NOTHING;
        ATYP = NOTHING;
        if (!CHAR_sub21()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        seqType |= ATYP;
        if (!CHAR_sub22()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        ATYP |= seqType;
        return true;
    }

    // StringLiteral
    function CHAR_sub21() {
        if (CPOS + 2 > CREP.length) return false;
        if (CREP[CPOS + 0] !== 0x5c) return false;
        if (CREP[CPOS + 1] !== 0x2f) return false;
        CPOS += 2;
        return true;
    }
    CHAR_sub21.constant = {value: "\\/"};

    // ByteExpression
    function CHAR_sub22() {
        let cc;
        cc = 0x2f;
        emitByte(cc);
        return true;
    }

    // SequenceExpression
    function CHAR_sub23() {
        const [APOSₒ, CPOSₒ] = savepoint(), ATYPₒ = ATYP;
        let seqType = NOTHING;
        ATYP = NOTHING;
        if (!CHAR_sub24()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        seqType |= ATYP;
        if (!CHAR_sub25()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        ATYP |= seqType;
        return true;
    }

    // StringLiteral
    function CHAR_sub24() {
        if (CPOS + 2 > CREP.length) return false;
        if (CREP[CPOS + 0] !== 0x5c) return false;
        if (CREP[CPOS + 1] !== 0x62) return false;
        CPOS += 2;
        return true;
    }
    CHAR_sub24.constant = {value: "\\b"};

    // ByteExpression
    function CHAR_sub25() {
        let cc;
        cc = 0x08;
        emitByte(cc);
        return true;
    }

    // SequenceExpression
    function CHAR_sub26() {
        const [APOSₒ, CPOSₒ] = savepoint(), ATYPₒ = ATYP;
        let seqType = NOTHING;
        ATYP = NOTHING;
        if (!CHAR_sub27()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        seqType |= ATYP;
        if (!CHAR_sub28()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        ATYP |= seqType;
        return true;
    }

    // StringLiteral
    function CHAR_sub27() {
        if (CPOS + 2 > CREP.length) return false;
        if (CREP[CPOS + 0] !== 0x5c) return false;
        if (CREP[CPOS + 1] !== 0x66) return false;
        CPOS += 2;
        return true;
    }
    CHAR_sub27.constant = {value: "\\f"};

    // ByteExpression
    function CHAR_sub28() {
        let cc;
        cc = 0x0c;
        emitByte(cc);
        return true;
    }

    // SequenceExpression
    function CHAR_sub29() {
        const [APOSₒ, CPOSₒ] = savepoint(), ATYPₒ = ATYP;
        let seqType = NOTHING;
        ATYP = NOTHING;
        if (!CHAR_sub30()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        seqType |= ATYP;
        if (!CHAR_sub31()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        ATYP |= seqType;
        return true;
    }

    // StringLiteral
    function CHAR_sub30() {
        if (CPOS + 2 > CREP.length) return false;
        if (CREP[CPOS + 0] !== 0x5c) return false;
        if (CREP[CPOS + 1] !== 0x6e) return false;
        CPOS += 2;
        return true;
    }
    CHAR_sub30.constant = {value: "\\n"};

    // ByteExpression
    function CHAR_sub31() {
        let cc;
        cc = 0x0a;
        emitByte(cc);
        return true;
    }

    // SequenceExpression
    function CHAR_sub32() {
        const [APOSₒ, CPOSₒ] = savepoint(), ATYPₒ = ATYP;
        let seqType = NOTHING;
        ATYP = NOTHING;
        if (!CHAR_sub33()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        seqType |= ATYP;
        if (!CHAR_sub34()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        ATYP |= seqType;
        return true;
    }

    // StringLiteral
    function CHAR_sub33() {
        if (CPOS + 2 > CREP.length) return false;
        if (CREP[CPOS + 0] !== 0x5c) return false;
        if (CREP[CPOS + 1] !== 0x72) return false;
        CPOS += 2;
        return true;
    }
    CHAR_sub33.constant = {value: "\\r"};

    // ByteExpression
    function CHAR_sub34() {
        let cc;
        cc = 0x0d;
        emitByte(cc);
        return true;
    }

    // SequenceExpression
    function CHAR_sub35() {
        const [APOSₒ, CPOSₒ] = savepoint(), ATYPₒ = ATYP;
        let seqType = NOTHING;
        ATYP = NOTHING;
        if (!CHAR_sub36()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        seqType |= ATYP;
        if (!CHAR_sub37()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        ATYP |= seqType;
        return true;
    }

    // StringLiteral
    function CHAR_sub36() {
        if (CPOS + 2 > CREP.length) return false;
        if (CREP[CPOS + 0] !== 0x5c) return false;
        if (CREP[CPOS + 1] !== 0x74) return false;
        CPOS += 2;
        return true;
    }
    CHAR_sub36.constant = {value: "\\t"};

    // ByteExpression
    function CHAR_sub37() {
        let cc;
        cc = 0x09;
        emitByte(cc);
        return true;
    }

    // SequenceExpression
    function CHAR_sub38() {
        const [APOSₒ, CPOSₒ] = savepoint(), ATYPₒ = ATYP;
        let seqType = NOTHING;
        ATYP = NOTHING;
        if (!CHAR_sub39()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        seqType |= ATYP;
        if (!CHAR_sub40()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        ATYP |= seqType;
        return true;
    }

    // StringLiteral
    function CHAR_sub39() {
        if (CPOS + 2 > CREP.length) return false;
        if (CREP[CPOS + 0] !== 0x5c) return false;
        if (CREP[CPOS + 1] !== 0x75) return false;
        CPOS += 2;
        return true;
    }
    CHAR_sub39.constant = {value: "\\u"};

    // ApplicationExpression
    let CHAR_sub40ₘ;
    function CHAR_sub40(arg) {
        try {
            return CHAR_sub40ₘ(arg);
        }
        catch (err) {
            if (!(err instanceof TypeError) || !err.message.includes('CHAR_sub40ₘ is not a function')) throw err;
            CHAR_sub40ₘ = unicode(CHAR_sub41);
            return CHAR_sub40ₘ(arg);
        }
    }

    // Module
    function CHAR_sub41(member) {
        switch (member) {
            case 'base': return base;
            case 'minDigits': return minDigits;
            case 'maxDigits': return maxDigits;
            default: return undefined;
        }
    }

    // SequenceExpression
    function LBRACE() {
        const [APOSₒ, CPOSₒ] = savepoint(), ATYPₒ = ATYP;
        let seqType = NOTHING;
        ATYP = NOTHING;
        if (!WS()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        seqType |= ATYP;
        if (!LBRACE_sub1()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        seqType |= ATYP;
        if (!WS()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        ATYP |= seqType;
        return true;
    }

    // ByteExpression
    function LBRACE_sub1() {
        let cc;
        if (CPOS >= CREP.length) return false;
        cc = CREP[CPOS];
        if (cc !== 0x7b) return false;
        CPOS += 1;
        return true;
    }

    // SequenceExpression
    function RBRACE() {
        const [APOSₒ, CPOSₒ] = savepoint(), ATYPₒ = ATYP;
        let seqType = NOTHING;
        ATYP = NOTHING;
        if (!WS()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        seqType |= ATYP;
        if (!RBRACE_sub1()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        seqType |= ATYP;
        if (!WS()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        ATYP |= seqType;
        return true;
    }

    // ByteExpression
    function RBRACE_sub1() {
        let cc;
        if (CPOS >= CREP.length) return false;
        cc = CREP[CPOS];
        if (cc !== 0x7d) return false;
        CPOS += 1;
        return true;
    }

    // SequenceExpression
    function LBRACKET() {
        const [APOSₒ, CPOSₒ] = savepoint(), ATYPₒ = ATYP;
        let seqType = NOTHING;
        ATYP = NOTHING;
        if (!WS()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        seqType |= ATYP;
        if (!LBRACKET_sub1()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        seqType |= ATYP;
        if (!WS()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        ATYP |= seqType;
        return true;
    }

    // ByteExpression
    function LBRACKET_sub1() {
        let cc;
        if (CPOS >= CREP.length) return false;
        cc = CREP[CPOS];
        if (cc !== 0x5b) return false;
        CPOS += 1;
        return true;
    }

    // SequenceExpression
    function RBRACKET() {
        const [APOSₒ, CPOSₒ] = savepoint(), ATYPₒ = ATYP;
        let seqType = NOTHING;
        ATYP = NOTHING;
        if (!WS()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        seqType |= ATYP;
        if (!RBRACKET_sub1()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        seqType |= ATYP;
        if (!WS()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        ATYP |= seqType;
        return true;
    }

    // ByteExpression
    function RBRACKET_sub1() {
        let cc;
        if (CPOS >= CREP.length) return false;
        cc = CREP[CPOS];
        if (cc !== 0x5d) return false;
        CPOS += 1;
        return true;
    }

    // SequenceExpression
    function COLON() {
        const [APOSₒ, CPOSₒ] = savepoint(), ATYPₒ = ATYP;
        let seqType = NOTHING;
        ATYP = NOTHING;
        if (!WS()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        seqType |= ATYP;
        if (!COLON_sub1()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        seqType |= ATYP;
        if (!WS()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        ATYP |= seqType;
        return true;
    }

    // ByteExpression
    function COLON_sub1() {
        let cc;
        if (CPOS >= CREP.length) return false;
        cc = CREP[CPOS];
        if (cc !== 0x3a) return false;
        CPOS += 1;
        return true;
    }

    // SequenceExpression
    function COMMA() {
        const [APOSₒ, CPOSₒ] = savepoint(), ATYPₒ = ATYP;
        let seqType = NOTHING;
        ATYP = NOTHING;
        if (!WS()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        seqType |= ATYP;
        if (!COMMA_sub1()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        seqType |= ATYP;
        if (!WS()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        ATYP |= seqType;
        return true;
    }

    // ByteExpression
    function COMMA_sub1() {
        let cc;
        if (CPOS >= CREP.length) return false;
        cc = CREP[CPOS];
        if (cc !== 0x2c) return false;
        CPOS += 1;
        return true;
    }

    // ByteExpression
    function DOUBLE_QUOTE() {
        let cc;
        if (CPOS >= CREP.length) return false;
        cc = CREP[CPOS];
        if (cc !== 0x22) return false;
        CPOS += 1;
        return true;
    }

    // QuantifiedExpression
    function WS() {
        let [CPOSᐟ, APOSᐟ] = [CPOS, APOS];
        do {
            if (!WS_sub1()) break;
            if (CPOS <= CPOSᐟ) break;
            CPOSᐟ = CPOS, APOSᐟ = APOS;
        } while (true);
        CPOS = CPOSᐟ, APOS = APOSᐟ;
        return true;
    }

    // ByteExpression
    function WS_sub1() {
        let cc;
        if (CPOS >= CREP.length) return false;
        cc = CREP[CPOS];
        if (cc !== 0x20 && cc !== 0x09 && cc !== 0x0a && cc !== 0x0d) return false;
        CPOS += 1;
        return true;
    }

    // Module
    function Ɱ_json(member) {
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
    }

    // Intrinsic

    // Intrinsic

    // Intrinsic

    // Module
    function Ɱ_std(member) {
        switch (member) {
            case 'floatString': return floatString_2;
            case 'intString': return intString;
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
    const floatString_2 = extensions["V:/projects/oss/pen-monorepo/packages/core/penc/dist/deps/std.pen.js"].floatString({mode: 'print'});
    const intString = extensions["V:/projects/oss/pen-monorepo/packages/core/penc/dist/deps/std.pen.js"].intString({mode: 'print'});
    const memoise = extensions["V:/projects/oss/pen-monorepo/packages/core/penc/dist/deps/std.pen.js"].memoise({mode: 'print'});
    const unicode_2 = extensions["V:/projects/oss/pen-monorepo/packages/core/penc/dist/deps/experiments.pen.js"].unicode({mode: 'print'});

    // Identifier
    function floatString(arg) {
        return floatString_2(arg);
    }

    // Identifier
    function unicode(arg) {
        return unicode_2(arg);
    }

    // SequenceExpression
    function start_2() {
        const [APOSₒ, CPOSₒ] = savepoint(), ATYPₒ = ATYP;
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
        const [APOSₒ, CPOSₒ] = savepoint(), ATYPₒ = ATYP;
        if (!False_sub1()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        if (!False_sub2()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        return true;
    }

    // StringLiteral
    function False_sub1() {
        CREP[CPOS++] = 0x66;
        CREP[CPOS++] = 0x61;
        CREP[CPOS++] = 0x6c;
        CREP[CPOS++] = 0x73;
        CREP[CPOS++] = 0x65;
        return true;
    }
    False_sub1.constant = {value: "false"};

    // BooleanLiteral
    function False_sub2() {
        if (ATYP !== SCALAR) return false;
        if (AREP[APOS] !== false) return false;
        APOS += 1;
        return true;
    }
    False_sub2.constant = {value: false};

    // SequenceExpression
    function Null() {
        const [APOSₒ, CPOSₒ] = savepoint(), ATYPₒ = ATYP;
        if (!Null_sub1()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        if (!Null_sub2()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        return true;
    }

    // StringLiteral
    function Null_sub1() {
        CREP[CPOS++] = 0x6e;
        CREP[CPOS++] = 0x75;
        CREP[CPOS++] = 0x6c;
        CREP[CPOS++] = 0x6c;
        return true;
    }
    Null_sub1.constant = {value: "null"};

    // NullLiteral
    function Null_sub2() {
        if (ATYP !== SCALAR) return false;
        if (AREP[APOS] !== null) return false;
        APOS += 1;
        return true;
    }
    Null_sub2.constant = {value: null};

    // SequenceExpression
    function True() {
        const [APOSₒ, CPOSₒ] = savepoint(), ATYPₒ = ATYP;
        if (!True_sub1()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        if (!True_sub2()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        return true;
    }

    // StringLiteral
    function True_sub1() {
        CREP[CPOS++] = 0x74;
        CREP[CPOS++] = 0x72;
        CREP[CPOS++] = 0x75;
        CREP[CPOS++] = 0x65;
        return true;
    }
    True_sub1.constant = {value: "true"};

    // BooleanLiteral
    function True_sub2() {
        if (ATYP !== SCALAR) return false;
        if (AREP[APOS] !== true) return false;
        APOS += 1;
        return true;
    }
    True_sub2.constant = {value: true};

    // SequenceExpression
    function Object() {
        const [APOSₒ, CPOSₒ] = savepoint(), ATYPₒ = ATYP;
        if (!LBRACE()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        if (!Object_sub1()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        if (!RBRACE()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        return true;
    }

    // SelectionExpression
    function Object_sub1() {
        if (Object_sub2()) return true;
        if (Object_sub9()) return true;
        return false;
    }

    // SequenceExpression
    function Object_sub2() {
        const [APOSₒ, CPOSₒ] = savepoint(), ATYPₒ = ATYP;
        if (!Object_sub3()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        if (!Object_sub5()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        return true;
    }

    // RecordExpression
    let Object_sub3ₘ;
    function Object_sub3(arg) {
        try {
            return Object_sub3ₘ(arg);
        }
        catch (err) {
            if (!(err instanceof TypeError) || !err.message.includes('Object_sub3ₘ is not a function')) throw err;
            Object_sub3ₘ = printRecord([
                {
                    kind: 'Field',
                    label: String,
                    expr: Object_sub4
                },
            ]);
            return Object_sub3ₘ(arg);
        }
    }

    // SequenceExpression
    function Object_sub4() {
        const [APOSₒ, CPOSₒ] = savepoint(), ATYPₒ = ATYP;
        if (!COLON()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        if (!Value()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        return true;
    }

    // QuantifiedExpression
    function Object_sub5() {
        let [APOSᐟ, CPOSᐟ] = [APOS, CPOS];
        do {
            if (!Object_sub6()) break;
            if (APOS <= APOSᐟ) break;
            APOSᐟ = APOS, CPOSᐟ = CPOS;
        } while (true);
        APOS = APOSᐟ, CPOS = CPOSᐟ;
        return true;
    }

    // RecordExpression
    let Object_sub6ₘ;
    function Object_sub6(arg) {
        try {
            return Object_sub6ₘ(arg);
        }
        catch (err) {
            if (!(err instanceof TypeError) || !err.message.includes('Object_sub6ₘ is not a function')) throw err;
            Object_sub6ₘ = printRecord([
                {
                    kind: 'Field',
                    label: Object_sub7,
                    expr: Object_sub8
                },
            ]);
            return Object_sub6ₘ(arg);
        }
    }

    // SequenceExpression
    function Object_sub7() {
        const [APOSₒ, CPOSₒ] = savepoint(), ATYPₒ = ATYP;
        if (!COMMA()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        if (!String()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        return true;
    }

    // SequenceExpression
    function Object_sub8() {
        const [APOSₒ, CPOSₒ] = savepoint(), ATYPₒ = ATYP;
        if (!COLON()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        if (!Value()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        return true;
    }

    // RecordExpression
    let Object_sub9ₘ;
    function Object_sub9(arg) {
        try {
            return Object_sub9ₘ(arg);
        }
        catch (err) {
            if (!(err instanceof TypeError) || !err.message.includes('Object_sub9ₘ is not a function')) throw err;
            Object_sub9ₘ = printRecord([]);
            return Object_sub9ₘ(arg);
        }
    }

    // SequenceExpression
    function Object2() {
        const [APOSₒ, CPOSₒ] = savepoint(), ATYPₒ = ATYP;
        if (!LBRACE()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        if (!Object2_sub1()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        if (!RBRACE()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        return true;
    }

    // SelectionExpression
    function Object2_sub1() {
        if (Properties()) return true;
        if (Object2_sub2()) return true;
        return false;
    }

    // RecordExpression
    let Object2_sub2ₘ;
    function Object2_sub2(arg) {
        try {
            return Object2_sub2ₘ(arg);
        }
        catch (err) {
            if (!(err instanceof TypeError) || !err.message.includes('Object2_sub2ₘ is not a function')) throw err;
            Object2_sub2ₘ = printRecord([]);
            return Object2_sub2ₘ(arg);
        }
    }

    // RecordExpression
    let Propertiesₘ;
    function Properties(arg) {
        try {
            return Propertiesₘ(arg);
        }
        catch (err) {
            if (!(err instanceof TypeError) || !err.message.includes('Propertiesₘ is not a function')) throw err;
            Propertiesₘ = printRecord([
                {
                    kind: 'Field',
                    label: String,
                    expr: Properties_sub1
                },
                {
                    kind: 'Splice',
                    label: undefined,
                    expr: Properties_sub2
                },
            ]);
            return Propertiesₘ(arg);
        }
    }

    // SequenceExpression
    function Properties_sub1() {
        const [APOSₒ, CPOSₒ] = savepoint(), ATYPₒ = ATYP;
        if (!COLON()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        if (!Value()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        return true;
    }

    // SelectionExpression
    function Properties_sub2() {
        if (Properties_sub3()) return true;
        if (Properties_sub4()) return true;
        return false;
    }

    // SequenceExpression
    function Properties_sub3() {
        const [APOSₒ, CPOSₒ] = savepoint(), ATYPₒ = ATYP;
        if (!COMMA()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        if (!Properties()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        return true;
    }

    // RecordExpression
    let Properties_sub4ₘ;
    function Properties_sub4(arg) {
        try {
            return Properties_sub4ₘ(arg);
        }
        catch (err) {
            if (!(err instanceof TypeError) || !err.message.includes('Properties_sub4ₘ is not a function')) throw err;
            Properties_sub4ₘ = printRecord([]);
            return Properties_sub4ₘ(arg);
        }
    }

    // SequenceExpression
    function Array() {
        const [APOSₒ, CPOSₒ] = savepoint(), ATYPₒ = ATYP;
        if (!LBRACKET()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        if (!Array_sub1()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        if (!RBRACKET()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        return true;
    }

    // SelectionExpression
    function Array_sub1() {
        if (Array_sub2()) return true;
        if (Array_sub7()) return true;
        return false;
    }

    // SequenceExpression
    function Array_sub2() {
        const [APOSₒ, CPOSₒ] = savepoint(), ATYPₒ = ATYP;
        if (!Array_sub3()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        if (!Array_sub4()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        return true;
    }

    // ListExpression
    let Array_sub3ₘ;
    function Array_sub3(arg) {
        try {
            return Array_sub3ₘ(arg);
        }
        catch (err) {
            if (!(err instanceof TypeError) || !err.message.includes('Array_sub3ₘ is not a function')) throw err;
            Array_sub3ₘ = printList([
                {
                    kind: 'Element',
                    expr: Value
                },
            ]);
            return Array_sub3ₘ(arg);
        }
    }

    // QuantifiedExpression
    function Array_sub4() {
        let [APOSᐟ, CPOSᐟ] = [APOS, CPOS];
        do {
            if (!Array_sub5()) break;
            if (APOS <= APOSᐟ) break;
            APOSᐟ = APOS, CPOSᐟ = CPOS;
        } while (true);
        APOS = APOSᐟ, CPOS = CPOSᐟ;
        return true;
    }

    // ListExpression
    let Array_sub5ₘ;
    function Array_sub5(arg) {
        try {
            return Array_sub5ₘ(arg);
        }
        catch (err) {
            if (!(err instanceof TypeError) || !err.message.includes('Array_sub5ₘ is not a function')) throw err;
            Array_sub5ₘ = printList([
                {
                    kind: 'Element',
                    expr: Array_sub6
                },
            ]);
            return Array_sub5ₘ(arg);
        }
    }

    // SequenceExpression
    function Array_sub6() {
        const [APOSₒ, CPOSₒ] = savepoint(), ATYPₒ = ATYP;
        if (!COMMA()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        if (!Value()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        return true;
    }

    // ListExpression
    let Array_sub7ₘ;
    function Array_sub7(arg) {
        try {
            return Array_sub7ₘ(arg);
        }
        catch (err) {
            if (!(err instanceof TypeError) || !err.message.includes('Array_sub7ₘ is not a function')) throw err;
            Array_sub7ₘ = printList([]);
            return Array_sub7ₘ(arg);
        }
    }

    // SequenceExpression
    function Array2() {
        const [APOSₒ, CPOSₒ] = savepoint(), ATYPₒ = ATYP;
        if (!LBRACKET()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        if (!Array2_sub1()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        if (!RBRACKET()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        return true;
    }

    // SelectionExpression
    function Array2_sub1() {
        if (Elements()) return true;
        if (Array2_sub2()) return true;
        return false;
    }

    // ListExpression
    let Array2_sub2ₘ;
    function Array2_sub2(arg) {
        try {
            return Array2_sub2ₘ(arg);
        }
        catch (err) {
            if (!(err instanceof TypeError) || !err.message.includes('Array2_sub2ₘ is not a function')) throw err;
            Array2_sub2ₘ = printList([]);
            return Array2_sub2ₘ(arg);
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
        const [APOSₒ, CPOSₒ] = savepoint(), ATYPₒ = ATYP;
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
        return floatString(arg);
    }

    // SequenceExpression
    function String() {
        const [APOSₒ, CPOSₒ] = savepoint(), ATYPₒ = ATYP;
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
    function base() {
        if (ATYP !== SCALAR) return false;
        if (AREP[APOS] !== 16) return false;
        APOS += 1;
        return true;
    }
    base.constant = {value: 16};

    // NumericLiteral
    function minDigits() {
        if (ATYP !== SCALAR) return false;
        if (AREP[APOS] !== 4) return false;
        APOS += 1;
        return true;
    }
    minDigits.constant = {value: 4};

    // NumericLiteral
    function maxDigits() {
        if (ATYP !== SCALAR) return false;
        if (AREP[APOS] !== 4) return false;
        APOS += 1;
        return true;
    }
    maxDigits.constant = {value: 4};

    // SelectionExpression
    function CHAR() {
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
    }

    // ByteExpression
    function CHAR_sub1() {
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
    }

    // SequenceExpression
    function CHAR_sub2() {
        const [APOSₒ, CPOSₒ] = savepoint(), ATYPₒ = ATYP;
        if (!CHAR_sub3()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        if (!CHAR_sub4()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        return true;
    }

    // ByteExpression
    function CHAR_sub3() {
        let cc;
        if (ATYP !== STRING) return false;
        if (APOS >= AREP.length) return false;
        cc = AREP[APOS];
        if ((cc < 0xc0 || cc > 0xdf)) return false;
        APOS += 1;
        CREP[CPOS++] = cc;
        return true;
    }

    // ByteExpression
    function CHAR_sub4() {
        let cc;
        if (ATYP !== STRING) return false;
        if (APOS >= AREP.length) return false;
        cc = AREP[APOS];
        if ((cc < 0x80 || cc > 0xbf)) return false;
        APOS += 1;
        CREP[CPOS++] = cc;
        return true;
    }

    // SequenceExpression
    function CHAR_sub5() {
        const [APOSₒ, CPOSₒ] = savepoint(), ATYPₒ = ATYP;
        if (!CHAR_sub6()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        if (!CHAR_sub7()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        if (!CHAR_sub8()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        return true;
    }

    // ByteExpression
    function CHAR_sub6() {
        let cc;
        if (ATYP !== STRING) return false;
        if (APOS >= AREP.length) return false;
        cc = AREP[APOS];
        if ((cc < 0xe0 || cc > 0xef)) return false;
        APOS += 1;
        CREP[CPOS++] = cc;
        return true;
    }

    // ByteExpression
    function CHAR_sub7() {
        let cc;
        if (ATYP !== STRING) return false;
        if (APOS >= AREP.length) return false;
        cc = AREP[APOS];
        if ((cc < 0x80 || cc > 0xbf)) return false;
        APOS += 1;
        CREP[CPOS++] = cc;
        return true;
    }

    // ByteExpression
    function CHAR_sub8() {
        let cc;
        if (ATYP !== STRING) return false;
        if (APOS >= AREP.length) return false;
        cc = AREP[APOS];
        if ((cc < 0x80 || cc > 0xbf)) return false;
        APOS += 1;
        CREP[CPOS++] = cc;
        return true;
    }

    // SequenceExpression
    function CHAR_sub9() {
        const [APOSₒ, CPOSₒ] = savepoint(), ATYPₒ = ATYP;
        if (!CHAR_sub10()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        if (!CHAR_sub11()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        if (!CHAR_sub12()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        if (!CHAR_sub13()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        return true;
    }

    // ByteExpression
    function CHAR_sub10() {
        let cc;
        if (ATYP !== STRING) return false;
        if (APOS >= AREP.length) return false;
        cc = AREP[APOS];
        if ((cc < 0xf0 || cc > 0xf7)) return false;
        APOS += 1;
        CREP[CPOS++] = cc;
        return true;
    }

    // ByteExpression
    function CHAR_sub11() {
        let cc;
        if (ATYP !== STRING) return false;
        if (APOS >= AREP.length) return false;
        cc = AREP[APOS];
        if ((cc < 0x80 || cc > 0xbf)) return false;
        APOS += 1;
        CREP[CPOS++] = cc;
        return true;
    }

    // ByteExpression
    function CHAR_sub12() {
        let cc;
        if (ATYP !== STRING) return false;
        if (APOS >= AREP.length) return false;
        cc = AREP[APOS];
        if ((cc < 0x80 || cc > 0xbf)) return false;
        APOS += 1;
        CREP[CPOS++] = cc;
        return true;
    }

    // ByteExpression
    function CHAR_sub13() {
        let cc;
        if (ATYP !== STRING) return false;
        if (APOS >= AREP.length) return false;
        cc = AREP[APOS];
        if ((cc < 0x80 || cc > 0xbf)) return false;
        APOS += 1;
        CREP[CPOS++] = cc;
        return true;
    }

    // SequenceExpression
    function CHAR_sub14() {
        const [APOSₒ, CPOSₒ] = savepoint(), ATYPₒ = ATYP;
        if (!CHAR_sub15()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        if (!CHAR_sub16()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        return true;
    }

    // StringLiteral
    function CHAR_sub15() {
        CREP[CPOS++] = 0x5c;
        CREP[CPOS++] = 0x22;
        return true;
    }
    CHAR_sub15.constant = {value: "\\\""};

    // ByteExpression
    function CHAR_sub16() {
        let cc;
        if (ATYP !== STRING) return false;
        if (APOS >= AREP.length) return false;
        cc = AREP[APOS];
        if (cc !== 0x22) return false;
        APOS += 1;
        return true;
    }

    // SequenceExpression
    function CHAR_sub17() {
        const [APOSₒ, CPOSₒ] = savepoint(), ATYPₒ = ATYP;
        if (!CHAR_sub18()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        if (!CHAR_sub19()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        return true;
    }

    // StringLiteral
    function CHAR_sub18() {
        CREP[CPOS++] = 0x5c;
        CREP[CPOS++] = 0x5c;
        return true;
    }
    CHAR_sub18.constant = {value: "\\\\"};

    // ByteExpression
    function CHAR_sub19() {
        let cc;
        if (ATYP !== STRING) return false;
        if (APOS >= AREP.length) return false;
        cc = AREP[APOS];
        if (cc !== 0x5c) return false;
        APOS += 1;
        return true;
    }

    // SequenceExpression
    function CHAR_sub20() {
        const [APOSₒ, CPOSₒ] = savepoint(), ATYPₒ = ATYP;
        if (!CHAR_sub21()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        if (!CHAR_sub22()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        return true;
    }

    // StringLiteral
    function CHAR_sub21() {
        CREP[CPOS++] = 0x5c;
        CREP[CPOS++] = 0x2f;
        return true;
    }
    CHAR_sub21.constant = {value: "\\/"};

    // ByteExpression
    function CHAR_sub22() {
        let cc;
        if (ATYP !== STRING) return false;
        if (APOS >= AREP.length) return false;
        cc = AREP[APOS];
        if (cc !== 0x2f) return false;
        APOS += 1;
        return true;
    }

    // SequenceExpression
    function CHAR_sub23() {
        const [APOSₒ, CPOSₒ] = savepoint(), ATYPₒ = ATYP;
        if (!CHAR_sub24()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        if (!CHAR_sub25()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        return true;
    }

    // StringLiteral
    function CHAR_sub24() {
        CREP[CPOS++] = 0x5c;
        CREP[CPOS++] = 0x62;
        return true;
    }
    CHAR_sub24.constant = {value: "\\b"};

    // ByteExpression
    function CHAR_sub25() {
        let cc;
        if (ATYP !== STRING) return false;
        if (APOS >= AREP.length) return false;
        cc = AREP[APOS];
        if (cc !== 0x08) return false;
        APOS += 1;
        return true;
    }

    // SequenceExpression
    function CHAR_sub26() {
        const [APOSₒ, CPOSₒ] = savepoint(), ATYPₒ = ATYP;
        if (!CHAR_sub27()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        if (!CHAR_sub28()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        return true;
    }

    // StringLiteral
    function CHAR_sub27() {
        CREP[CPOS++] = 0x5c;
        CREP[CPOS++] = 0x66;
        return true;
    }
    CHAR_sub27.constant = {value: "\\f"};

    // ByteExpression
    function CHAR_sub28() {
        let cc;
        if (ATYP !== STRING) return false;
        if (APOS >= AREP.length) return false;
        cc = AREP[APOS];
        if (cc !== 0x0c) return false;
        APOS += 1;
        return true;
    }

    // SequenceExpression
    function CHAR_sub29() {
        const [APOSₒ, CPOSₒ] = savepoint(), ATYPₒ = ATYP;
        if (!CHAR_sub30()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        if (!CHAR_sub31()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        return true;
    }

    // StringLiteral
    function CHAR_sub30() {
        CREP[CPOS++] = 0x5c;
        CREP[CPOS++] = 0x6e;
        return true;
    }
    CHAR_sub30.constant = {value: "\\n"};

    // ByteExpression
    function CHAR_sub31() {
        let cc;
        if (ATYP !== STRING) return false;
        if (APOS >= AREP.length) return false;
        cc = AREP[APOS];
        if (cc !== 0x0a) return false;
        APOS += 1;
        return true;
    }

    // SequenceExpression
    function CHAR_sub32() {
        const [APOSₒ, CPOSₒ] = savepoint(), ATYPₒ = ATYP;
        if (!CHAR_sub33()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        if (!CHAR_sub34()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        return true;
    }

    // StringLiteral
    function CHAR_sub33() {
        CREP[CPOS++] = 0x5c;
        CREP[CPOS++] = 0x72;
        return true;
    }
    CHAR_sub33.constant = {value: "\\r"};

    // ByteExpression
    function CHAR_sub34() {
        let cc;
        if (ATYP !== STRING) return false;
        if (APOS >= AREP.length) return false;
        cc = AREP[APOS];
        if (cc !== 0x0d) return false;
        APOS += 1;
        return true;
    }

    // SequenceExpression
    function CHAR_sub35() {
        const [APOSₒ, CPOSₒ] = savepoint(), ATYPₒ = ATYP;
        if (!CHAR_sub36()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        if (!CHAR_sub37()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        return true;
    }

    // StringLiteral
    function CHAR_sub36() {
        CREP[CPOS++] = 0x5c;
        CREP[CPOS++] = 0x74;
        return true;
    }
    CHAR_sub36.constant = {value: "\\t"};

    // ByteExpression
    function CHAR_sub37() {
        let cc;
        if (ATYP !== STRING) return false;
        if (APOS >= AREP.length) return false;
        cc = AREP[APOS];
        if (cc !== 0x09) return false;
        APOS += 1;
        return true;
    }

    // SequenceExpression
    function CHAR_sub38() {
        const [APOSₒ, CPOSₒ] = savepoint(), ATYPₒ = ATYP;
        if (!CHAR_sub39()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        if (!CHAR_sub40()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        return true;
    }

    // StringLiteral
    function CHAR_sub39() {
        CREP[CPOS++] = 0x5c;
        CREP[CPOS++] = 0x75;
        return true;
    }
    CHAR_sub39.constant = {value: "\\u"};

    // ApplicationExpression
    let CHAR_sub40ₘ;
    function CHAR_sub40(arg) {
        try {
            return CHAR_sub40ₘ(arg);
        }
        catch (err) {
            if (!(err instanceof TypeError) || !err.message.includes('CHAR_sub40ₘ is not a function')) throw err;
            CHAR_sub40ₘ = unicode(CHAR_sub41);
            return CHAR_sub40ₘ(arg);
        }
    }

    // Module
    function CHAR_sub41(member) {
        switch (member) {
            case 'base': return base;
            case 'minDigits': return minDigits;
            case 'maxDigits': return maxDigits;
            default: return undefined;
        }
    }

    // SequenceExpression
    function LBRACE() {
        const [APOSₒ, CPOSₒ] = savepoint(), ATYPₒ = ATYP;
        if (!WS()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        if (!LBRACE_sub1()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        if (!WS()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        return true;
    }

    // ByteExpression
    function LBRACE_sub1() {
        let cc;
        cc = 0x7b;
        CREP[CPOS++] = cc;
        return true;
    }

    // SequenceExpression
    function RBRACE() {
        const [APOSₒ, CPOSₒ] = savepoint(), ATYPₒ = ATYP;
        if (!WS()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        if (!RBRACE_sub1()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        if (!WS()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        return true;
    }

    // ByteExpression
    function RBRACE_sub1() {
        let cc;
        cc = 0x7d;
        CREP[CPOS++] = cc;
        return true;
    }

    // SequenceExpression
    function LBRACKET() {
        const [APOSₒ, CPOSₒ] = savepoint(), ATYPₒ = ATYP;
        if (!WS()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        if (!LBRACKET_sub1()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        if (!WS()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        return true;
    }

    // ByteExpression
    function LBRACKET_sub1() {
        let cc;
        cc = 0x5b;
        CREP[CPOS++] = cc;
        return true;
    }

    // SequenceExpression
    function RBRACKET() {
        const [APOSₒ, CPOSₒ] = savepoint(), ATYPₒ = ATYP;
        if (!WS()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        if (!RBRACKET_sub1()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        if (!WS()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        return true;
    }

    // ByteExpression
    function RBRACKET_sub1() {
        let cc;
        cc = 0x5d;
        CREP[CPOS++] = cc;
        return true;
    }

    // SequenceExpression
    function COLON() {
        const [APOSₒ, CPOSₒ] = savepoint(), ATYPₒ = ATYP;
        if (!WS()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        if (!COLON_sub1()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        if (!WS()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        return true;
    }

    // ByteExpression
    function COLON_sub1() {
        let cc;
        cc = 0x3a;
        CREP[CPOS++] = cc;
        return true;
    }

    // SequenceExpression
    function COMMA() {
        const [APOSₒ, CPOSₒ] = savepoint(), ATYPₒ = ATYP;
        if (!WS()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        if (!COMMA_sub1()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        if (!WS()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        return true;
    }

    // ByteExpression
    function COMMA_sub1() {
        let cc;
        cc = 0x2c;
        CREP[CPOS++] = cc;
        return true;
    }

    // ByteExpression
    function DOUBLE_QUOTE() {
        let cc;
        cc = 0x22;
        CREP[CPOS++] = cc;
        return true;
    }

    // QuantifiedExpression
    function WS() {
        let [APOSᐟ, CPOSᐟ] = [APOS, CPOS];
        do {
            if (!WS_sub1()) break;
            if (APOS <= APOSᐟ) break;
            APOSᐟ = APOS, CPOSᐟ = CPOS;
        } while (true);
        APOS = APOSᐟ, CPOS = CPOSᐟ;
        return true;
    }

    // ByteExpression
    function WS_sub1() {
        let cc;
        cc = 0x20;
        CREP[CPOS++] = cc;
        return true;
    }

    // Module
    function Ɱ_json(member) {
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
    }

    // Intrinsic

    // Intrinsic

    // Intrinsic

    // Module
    function Ɱ_std(member) {
        switch (member) {
            case 'floatString': return floatString_2;
            case 'intString': return intString;
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
