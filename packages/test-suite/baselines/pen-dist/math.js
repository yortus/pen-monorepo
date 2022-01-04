
// ------------------------------ Main exports ------------------------------
module.exports = {
    parse(strOrBuf) {
        CREP = Buffer.isBuffer(strOrBuf) ? strOrBuf : Buffer.from(strOrBuf, 'utf8');
        CPOS = 0;
        APOS = 0;
        if (!parseValue(parse)) throw new Error('parse failed');
        if (CPOS !== CREP.length) throw new Error('parse didn\'t consume entire input');
        if (APOS !== 1) throw new Error('parse didn\'t produce a singular value');
        return VALUES[0];
    },
    print(node, buf) {
        AREP = [node]; // TODO: we must use a new AREP array per print call, otehrwise the MEMO rule has invalid cached memos across print calls. Fix!!
        APOS = 0;
        CREP = buf || Buffer.alloc(2 ** 22); // 4MB
        CPOS = 0;
        if (!printValue(print)) throw new Error('print failed');
        if (CPOS > CREP.length) throw new Error('output buffer too small');
        return buf ? CPOS : CREP.toString('utf8', 0, CPOS);
    },
};




// ------------------------------ Runtime ------------------------------
"use strict";
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
        throw new Error(`${mode}.full function is missing`);
    if (!impls[mode].infer)
        throw new Error(`${mode}.infer function is missing`);
    const { full, infer } = impls[mode];
    const result = Object.assign(full, { infer });
    if (impls.hasOwnProperty('constant'))
        result.constant = impls.constant;
    return result;
}
let AREP;
let APOS = 0;
let ATYP = 0;
let CREP = Buffer.alloc(1);
let CPOS = 0;
const [NOTHING, SCALAR, STRING_CHARS, LIST_ELEMENTS, RECORD_FIELDS] = [0, 1, 2, 4, 8];
const OCTETS = Buffer.alloc(2 ** 16);
const VALUES = [];
function emitScalar(value) {
    VALUES[APOS++] = value;
    ATYP = SCALAR;
}
function emitByte(value) {
    OCTETS[APOS++] = value;
    ATYP = STRING_CHARS;
}
function emitBytes(...values) {
    for (let i = 0; i < values.length; ++i)
        OCTETS[APOS++] = values[i];
    ATYP = STRING_CHARS;
}
function parseValue(rule) {
    const APOSₒ = APOS;
    if (!rule())
        return APOS = APOSₒ, false;
    if (ATYP === NOTHING)
        return APOS = APOSₒ, false;
    let value;
    switch (ATYP) {
        case SCALAR:
            assert(APOS === APOSₒ + 1);
            value = VALUES[APOSₒ];
            break;
        case STRING_CHARS:
            value = OCTETS.toString('utf8', APOSₒ, APOS);
            break;
        case LIST_ELEMENTS:
            value = VALUES.slice(APOSₒ, APOS);
            break;
        case RECORD_FIELDS:
            const obj = value = {};
            for (let i = APOSₒ; i < APOS; i += 2)
                obj[VALUES[i]] = VALUES[i + 1];
            if (Object.keys(obj).length * 2 < (APOS - APOSₒ))
                throw new Error(`Duplicate labels in record`);
            break;
        default:
            ((atyp) => { throw new Error(`Unhandled abstract type ${atyp}`); })(ATYP);
    }
    VALUES[APOSₒ] = value;
    APOS = APOSₒ + 1;
    return true;
}
function parseInferValue(infer) {
    const APOSₒ = APOS;
    infer();
    if (ATYP === NOTHING)
        return;
    let value;
    switch (ATYP) {
        case SCALAR:
            assert(APOS === APOSₒ + 1);
            value = VALUES[APOSₒ];
            break;
        case STRING_CHARS:
            value = OCTETS.toString('utf8', APOSₒ, APOS);
            break;
        case LIST_ELEMENTS:
            value = VALUES.slice(APOSₒ, APOS);
            break;
        case RECORD_FIELDS:
            const obj = value = {};
            for (let i = APOSₒ; i < APOS; i += 2)
                obj[VALUES[i]] = VALUES[i + 1];
            break;
        default:
            ((atyp) => { throw new Error(`Unhandled abstract type ${atyp}`); })(ATYP);
    }
    VALUES[APOSₒ] = value;
    APOS = APOSₒ + 1;
}
function printValue(rule) {
    const APOSₒ = APOS, AREPₒ = AREP, ATYPₒ = ATYP;
    let value = AREP[APOS];
    let atyp;
    if (value === undefined) {
        return false;
    }
    if (value === null || value === true || value === false || typeof value === 'number') {
        ATYP = SCALAR;
        const result = rule();
        ATYP = ATYPₒ;
        assert(APOS === APOSₒ + 1);
        return result;
    }
    if (typeof value === 'string') {
        AREP = OCTETS.slice(0, OCTETS.write(value, 0));
        atyp = ATYP = STRING_CHARS;
    }
    else if (Array.isArray(value)) {
        AREP = value;
        atyp = ATYP = LIST_ELEMENTS;
    }
    else if (typeof value === 'object') {
        const arr = AREP = [];
        const keys = Object.keys(value);
        assert(keys.length < 32);
        for (let i = 0; i < keys.length; ++i)
            arr.push(keys[i], value[keys[i]]);
        value = arr;
        atyp = ATYP = RECORD_FIELDS;
    }
    else {
        throw new Error(`Unsupported value type for value ${value}`);
    }
    APOS = 0;
    let result = rule();
    const arep = AREP, apos = APOS;
    AREP = AREPₒ, APOS = APOSₒ, ATYP = ATYPₒ;
    if (!result)
        return false;
    if (atyp === RECORD_FIELDS) {
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
function printInferValue(infer) {
    const ATYPₒ = ATYP;
    ATYP = NOTHING;
    infer();
    ATYP = ATYPₒ;
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
        function floatString(mode) {
            return createRule(mode, {
                parse: {
                    full: function FSTR() {
                        let num = 0;
                        const APOSₒ = APOS, CPOSₒ = CPOS;
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
                            return APOS = APOSₒ, CPOS = CPOSₒ, false;
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
                                return APOS = APOSₒ, CPOS = CPOSₒ, false;
                        }
                        // There is a syntactically valid float. Delegate parsing to the JS runtime.
                        // Reject the number if it parses to Infinity or Nan.
                        // TODO: the conversion may still be lossy. Provide a non-lossy mode, like `safenum` does?
                        num = Number.parseFloat(CREP.toString('utf8', CPOSₒ, CPOS));
                        if (!Number.isFinite(num))
                            return APOS = APOSₒ, CPOS = CPOSₒ, false;
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
        function intString(mode) {
            return function ISTR_function(expr) {
                var _a, _b, _c, _d;
                assert(isModule(expr));
                const base = (_b = (_a = expr('base')) === null || _a === void 0 ? void 0 : _a.constant) !== null && _b !== void 0 ? _b : 10;
                const signed = (_d = (_c = expr('signed')) === null || _c === void 0 ? void 0 : _c.constant) !== null && _d !== void 0 ? _d : true;
                assert(typeof base === 'number' && base >= 2 && base <= 36);
                assert(typeof signed === 'boolean');
                return createRule(mode, {
                    parse: {
                        full: function ISTR() {
                            let num = 0;
                            const APOSₒ = APOS, CPOSₒ = CPOS;
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
                                    return APOS = APOSₒ, CPOS = CPOSₒ, false;
                                // Loop again.
                                CPOS += 1;
                                digits += 1;
                            }
                            // Check that we parsed at least one digit.
                            if (digits === 0)
                                return APOS = APOSₒ, CPOS = CPOSₒ, false;
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
        function memoise(mode) {
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
                                    memo.OREPᐞ = (ATYP === STRING_CHARS ? OCTETS : VALUES).slice(APOSₒ, APOS);
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
                                    memo.OREPᐞ = (ATYP === STRING_CHARS ? OCTETS : VALUES).slice(APOSₒ, APOS);
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
                            const arep = (ATYP === STRING_CHARS ? OCTETS : VALUES);
                            APOS = APOSₒ;
                            CPOS = memo.IPOSᐟ;
                            for (let i = 0; i < memo.OREPᐞ.length; ++i) {
                                arep[APOS++] = memo.OREPᐞ[i];
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
                            const APOSₒ = APOS, CPOSₒ = CPOS;
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

    // Identifier
    const ꐚmemoise = Object.assign(
        arg => ꐚmemoiseᱻ2(arg),
        {infer: arg => ꐚmemoiseᱻ2.infer(arg)},
    );

    // Identifier
    const ꐚfloat = Object.assign(
        arg => ꐚfloatString(arg),
        {infer: arg => ꐚfloatString.infer(arg)},
    );

    // Identifier
    const ꐚint = Object.assign(
        arg => ꐚintString(arg),
        {infer: arg => ꐚintString.infer(arg)},
    );

    // Identifier
    const ꐚstartᱻ2 = Object.assign(
        arg => ꐚexpr(arg),
        {infer: arg => ꐚexpr.infer(arg)},
    );

    // ApplicationExpression
    const ꐚexpr = lazy(() => ꐚmemoise(ꐚexprᱻ1));

    // SelectionExpression
    const ꐚexprᱻ1 = createRule(mode, {
        parse: {
            full: function SEL() { return ꐚadd() || ꐚsub() || ꐚterm(); },
            infer: () => ꐚadd.infer(),
        },
        print: {
            full: function SEL() { return ꐚadd() || ꐚsub() || ꐚterm(); },
            infer: () => ꐚadd.infer(),
        },
    });

    // RecordExpression
    const ꐚadd = createRule(mode, {
        parse: {
            full: function RCD() {
                const APOSₒ = APOS, CPOSₒ = CPOS;
                VALUES[APOS++] = "type";
                if (!parseValue(ꐚaddᱻ1)) return APOS = APOSₒ, CPOS = CPOSₒ, false;
                VALUES[APOS++] = "lhs";
                if (!parseValue(ꐚexpr)) return APOS = APOSₒ, CPOS = CPOSₒ, false;
                VALUES[APOS++] = "rhs";
                if (!parseValue(ꐚaddᱻ2)) return APOS = APOSₒ, CPOS = CPOSₒ, false;
                ATYP = RECORD_FIELDS;
                return true;
            },
            infer: function RCD() {
                const APOSₒ = APOS;
                VALUES[APOS++] = "type";
                parseInferValue(ꐚaddᱻ1.infer);
                VALUES[APOS++] = "lhs";
                parseInferValue(ꐚexpr.infer);
                VALUES[APOS++] = "rhs";
                parseInferValue(ꐚaddᱻ2.infer);
                ATYP = RECORD_FIELDS;
            },
        },
        print: {
            full: function RCD() {
                if (ATYP !== RECORD_FIELDS) return false;
                const APOSₒ = APOS, CPOSₒ = CPOS, ATYPₒ = ATYP;
                const propList = AREP;
                const propCount = AREP.length >> 1;
                let bitmask = APOS;
                let i;
                for (i = 0, APOS = 1; (bitmask & (1 << i)) !== 0 && propList[i << 1] !== "type"; ++i, APOS += 2) ;
                if (i >= propCount) return APOS = APOSₒ, CPOS = CPOSₒ, ATYP = ATYPₒ, false;
                if (!printValue(ꐚaddᱻ1)) return APOS = APOSₒ, CPOS = CPOSₒ, ATYP = ATYPₒ, false;
                bitmask += (1 << i);
                for (i = 0, APOS = 1; (bitmask & (1 << i)) !== 0 && propList[i << 1] !== "lhs"; ++i, APOS += 2) ;
                if (i >= propCount) return APOS = APOSₒ, CPOS = CPOSₒ, ATYP = ATYPₒ, false;
                if (!printValue(ꐚexpr)) return APOS = APOSₒ, CPOS = CPOSₒ, ATYP = ATYPₒ, false;
                bitmask += (1 << i);
                for (i = 0, APOS = 1; (bitmask & (1 << i)) !== 0 && propList[i << 1] !== "rhs"; ++i, APOS += 2) ;
                if (i >= propCount) return APOS = APOSₒ, CPOS = CPOSₒ, ATYP = ATYPₒ, false;
                if (!printValue(ꐚaddᱻ2)) return APOS = APOSₒ, CPOS = CPOSₒ, ATYP = ATYPₒ, false;
                bitmask += (1 << i);
                APOS = bitmask;
                return true;
            },
            infer: function RCD() {
                if (ATYP !== RECORD_FIELDS && ATYP !== NOTHING) return false;
                printInferValue(ꐚaddᱻ1.infer);
                printInferValue(ꐚexpr.infer);
                printInferValue(ꐚaddᱻ2.infer);
            },
        },
    });

    // StringLiteral
    const ꐚaddᱻ1 = createRule(mode, {
        parse: {
            full: function STR() {
                emitBytes(0x61, 0x64, 0x64);
                return true;
            },
            infer: function STR() {
                emitBytes(0x61, 0x64, 0x64);
            },
        },
        print: {
            full: function STR() {
                if (ATYP !== STRING_CHARS) return false;
                if (APOS + 3 > AREP.length) return false;
                if (AREP[APOS + 0] !== 0x61) return false;
                if (AREP[APOS + 1] !== 0x64) return false;
                if (AREP[APOS + 2] !== 0x64) return false;
                APOS += 3;
                return true;
            },
            infer: function STR() {
            },
        },
        constant: "add",
    });

    // SequenceExpression
    const ꐚaddᱻ2 = createRule(mode, {
        parse: {
            full: function SEQ() {
                const APOSₒ = APOS, CPOSₒ = CPOS;
                let seqType = ATYP = NOTHING;
                if (!ꐚaddᱻ3()) return APOS = APOSₒ, CPOS = CPOSₒ, false;
                seqType |= ATYP;
                if (!ꐚterm()) return APOS = APOSₒ, CPOS = CPOSₒ, false;
                ATYP |= seqType;
                return true;
            },
            infer: () => {
                let seqType = ATYP = NOTHING;
                ꐚaddᱻ3.infer();
                seqType |= ATYP;
                ꐚterm.infer();
                ATYP |= seqType;
            },
        },
        print: {
            full: function SEQ() {
                const APOSₒ = APOS, CPOSₒ = CPOS, ATYPₒ = ATYP;
                if (!ꐚaddᱻ3()) return APOS = APOSₒ, CPOS = CPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚterm()) return APOS = APOSₒ, CPOS = CPOSₒ, ATYP = ATYPₒ, false;
                return true;
            },
            infer: () => {
                ꐚaddᱻ3.infer();
                ꐚterm.infer();
            },
        },
    });

    // ByteExpression
    const ꐚaddᱻ3 = createRule(mode, {
        parse: {
            full: function BYT() {
                let cc;
                if (CPOS >= CREP.length) return false;
                cc = CREP[CPOS];
                if (cc !== 0x2b) return false;
                CPOS += 1;
                return true;
            },
            infer: () => {},
        },
        print: {
            full: function BYT() {
                let cc;
                cc = 0x2b;
                CREP[CPOS++] = cc;
                return true;
            },
            infer: () => {
                CREP[CPOS++] = 0x2b;
            },
        },
    });

    // RecordExpression
    const ꐚsub = createRule(mode, {
        parse: {
            full: function RCD() {
                const APOSₒ = APOS, CPOSₒ = CPOS;
                VALUES[APOS++] = "type";
                if (!parseValue(ꐚsubᱻ1)) return APOS = APOSₒ, CPOS = CPOSₒ, false;
                VALUES[APOS++] = "lhs";
                if (!parseValue(ꐚexpr)) return APOS = APOSₒ, CPOS = CPOSₒ, false;
                VALUES[APOS++] = "rhs";
                if (!parseValue(ꐚsubᱻ2)) return APOS = APOSₒ, CPOS = CPOSₒ, false;
                ATYP = RECORD_FIELDS;
                return true;
            },
            infer: function RCD() {
                const APOSₒ = APOS;
                VALUES[APOS++] = "type";
                parseInferValue(ꐚsubᱻ1.infer);
                VALUES[APOS++] = "lhs";
                parseInferValue(ꐚexpr.infer);
                VALUES[APOS++] = "rhs";
                parseInferValue(ꐚsubᱻ2.infer);
                ATYP = RECORD_FIELDS;
            },
        },
        print: {
            full: function RCD() {
                if (ATYP !== RECORD_FIELDS) return false;
                const APOSₒ = APOS, CPOSₒ = CPOS, ATYPₒ = ATYP;
                const propList = AREP;
                const propCount = AREP.length >> 1;
                let bitmask = APOS;
                let i;
                for (i = 0, APOS = 1; (bitmask & (1 << i)) !== 0 && propList[i << 1] !== "type"; ++i, APOS += 2) ;
                if (i >= propCount) return APOS = APOSₒ, CPOS = CPOSₒ, ATYP = ATYPₒ, false;
                if (!printValue(ꐚsubᱻ1)) return APOS = APOSₒ, CPOS = CPOSₒ, ATYP = ATYPₒ, false;
                bitmask += (1 << i);
                for (i = 0, APOS = 1; (bitmask & (1 << i)) !== 0 && propList[i << 1] !== "lhs"; ++i, APOS += 2) ;
                if (i >= propCount) return APOS = APOSₒ, CPOS = CPOSₒ, ATYP = ATYPₒ, false;
                if (!printValue(ꐚexpr)) return APOS = APOSₒ, CPOS = CPOSₒ, ATYP = ATYPₒ, false;
                bitmask += (1 << i);
                for (i = 0, APOS = 1; (bitmask & (1 << i)) !== 0 && propList[i << 1] !== "rhs"; ++i, APOS += 2) ;
                if (i >= propCount) return APOS = APOSₒ, CPOS = CPOSₒ, ATYP = ATYPₒ, false;
                if (!printValue(ꐚsubᱻ2)) return APOS = APOSₒ, CPOS = CPOSₒ, ATYP = ATYPₒ, false;
                bitmask += (1 << i);
                APOS = bitmask;
                return true;
            },
            infer: function RCD() {
                if (ATYP !== RECORD_FIELDS && ATYP !== NOTHING) return false;
                printInferValue(ꐚsubᱻ1.infer);
                printInferValue(ꐚexpr.infer);
                printInferValue(ꐚsubᱻ2.infer);
            },
        },
    });

    // StringLiteral
    const ꐚsubᱻ1 = createRule(mode, {
        parse: {
            full: function STR() {
                emitBytes(0x73, 0x75, 0x62);
                return true;
            },
            infer: function STR() {
                emitBytes(0x73, 0x75, 0x62);
            },
        },
        print: {
            full: function STR() {
                if (ATYP !== STRING_CHARS) return false;
                if (APOS + 3 > AREP.length) return false;
                if (AREP[APOS + 0] !== 0x73) return false;
                if (AREP[APOS + 1] !== 0x75) return false;
                if (AREP[APOS + 2] !== 0x62) return false;
                APOS += 3;
                return true;
            },
            infer: function STR() {
            },
        },
        constant: "sub",
    });

    // SequenceExpression
    const ꐚsubᱻ2 = createRule(mode, {
        parse: {
            full: function SEQ() {
                const APOSₒ = APOS, CPOSₒ = CPOS;
                let seqType = ATYP = NOTHING;
                if (!ꐚsubᱻ3()) return APOS = APOSₒ, CPOS = CPOSₒ, false;
                seqType |= ATYP;
                if (!ꐚterm()) return APOS = APOSₒ, CPOS = CPOSₒ, false;
                ATYP |= seqType;
                return true;
            },
            infer: () => {
                let seqType = ATYP = NOTHING;
                ꐚsubᱻ3.infer();
                seqType |= ATYP;
                ꐚterm.infer();
                ATYP |= seqType;
            },
        },
        print: {
            full: function SEQ() {
                const APOSₒ = APOS, CPOSₒ = CPOS, ATYPₒ = ATYP;
                if (!ꐚsubᱻ3()) return APOS = APOSₒ, CPOS = CPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚterm()) return APOS = APOSₒ, CPOS = CPOSₒ, ATYP = ATYPₒ, false;
                return true;
            },
            infer: () => {
                ꐚsubᱻ3.infer();
                ꐚterm.infer();
            },
        },
    });

    // ByteExpression
    const ꐚsubᱻ3 = createRule(mode, {
        parse: {
            full: function BYT() {
                let cc;
                if (CPOS >= CREP.length) return false;
                cc = CREP[CPOS];
                if (cc !== 0x2d) return false;
                CPOS += 1;
                return true;
            },
            infer: () => {},
        },
        print: {
            full: function BYT() {
                let cc;
                cc = 0x2d;
                CREP[CPOS++] = cc;
                return true;
            },
            infer: () => {
                CREP[CPOS++] = 0x2d;
            },
        },
    });

    // ApplicationExpression
    const ꐚterm = lazy(() => ꐚmemoise(ꐚtermᱻ1));

    // SelectionExpression
    const ꐚtermᱻ1 = createRule(mode, {
        parse: {
            full: function SEL() { return ꐚmul() || ꐚdiv() || ꐚfactor(); },
            infer: () => ꐚmul.infer(),
        },
        print: {
            full: function SEL() { return ꐚmul() || ꐚdiv() || ꐚfactor(); },
            infer: () => ꐚmul.infer(),
        },
    });

    // RecordExpression
    const ꐚmul = createRule(mode, {
        parse: {
            full: function RCD() {
                const APOSₒ = APOS, CPOSₒ = CPOS;
                if (!parseValue(ꐚmulᱻ1)) return APOS = APOSₒ, CPOS = CPOSₒ, false;
                assert(ATYP === STRING_CHARS);
                if (!parseValue(ꐚmulᱻ3)) return APOS = APOSₒ, CPOS = CPOSₒ, false;
                VALUES[APOS++] = "lhs";
                if (!parseValue(ꐚterm)) return APOS = APOSₒ, CPOS = CPOSₒ, false;
                if (!parseValue(ꐚmulᱻ5)) return APOS = APOSₒ, CPOS = CPOSₒ, false;
                assert(ATYP === STRING_CHARS);
                if (!parseValue(ꐚmulᱻ7)) return APOS = APOSₒ, CPOS = CPOSₒ, false;
                ATYP = RECORD_FIELDS;
                return true;
            },
            infer: function RCD() {
                const APOSₒ = APOS;
                parseInferValue(ꐚmulᱻ1.infer);
                assert(ATYP === STRING_CHARS);
                parseInferValue(ꐚmulᱻ3.infer);
                VALUES[APOS++] = "lhs";
                parseInferValue(ꐚterm.infer);
                parseInferValue(ꐚmulᱻ5.infer);
                assert(ATYP === STRING_CHARS);
                parseInferValue(ꐚmulᱻ7.infer);
                ATYP = RECORD_FIELDS;
            },
        },
        print: {
            full: function RCD() {
                if (ATYP !== RECORD_FIELDS) return false;
                const APOSₒ = APOS, CPOSₒ = CPOS, ATYPₒ = ATYP;
                const propList = AREP;
                const propCount = AREP.length >> 1;
                let bitmask = APOS;
                let i;
                for (i = APOS = 0; (bitmask & (1 << i)) !== 0; ++i, APOS += 2) ;
                if (i >= propCount || !printValue(ꐚmulᱻ1)) return APOS = APOSₒ, CPOS = CPOSₒ, ATYP = ATYPₒ, false;
                if (!printValue(ꐚmulᱻ3)) return APOS = APOSₒ, CPOS = CPOSₒ, ATYP = ATYPₒ, false;
                bitmask += (1 << i);
                for (i = 0, APOS = 1; (bitmask & (1 << i)) !== 0 && propList[i << 1] !== "lhs"; ++i, APOS += 2) ;
                if (i >= propCount) return APOS = APOSₒ, CPOS = CPOSₒ, ATYP = ATYPₒ, false;
                if (!printValue(ꐚterm)) return APOS = APOSₒ, CPOS = CPOSₒ, ATYP = ATYPₒ, false;
                bitmask += (1 << i);
                for (i = APOS = 0; (bitmask & (1 << i)) !== 0; ++i, APOS += 2) ;
                if (i >= propCount || !printValue(ꐚmulᱻ5)) return APOS = APOSₒ, CPOS = CPOSₒ, ATYP = ATYPₒ, false;
                if (!printValue(ꐚmulᱻ7)) return APOS = APOSₒ, CPOS = CPOSₒ, ATYP = ATYPₒ, false;
                bitmask += (1 << i);
                APOS = bitmask;
                return true;
            },
            infer: function RCD() {
                if (ATYP !== RECORD_FIELDS && ATYP !== NOTHING) return false;
                printInferValue(ꐚmulᱻ1.infer);
                printInferValue(ꐚmulᱻ3.infer);
                printInferValue(ꐚterm.infer);
                printInferValue(ꐚmulᱻ5.infer);
                printInferValue(ꐚmulᱻ7.infer);
            },
        },
    });

    // ApplicationExpression
    const ꐚmulᱻ1 = lazy(() => ꐚab(ꐚmulᱻ2));

    // StringLiteral
    const ꐚmulᱻ2 = createRule(mode, {
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
                if (ATYP !== STRING_CHARS) return false;
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
        constant: "type",
    });

    // ApplicationExpression
    const ꐚmulᱻ3 = lazy(() => ꐚab(ꐚmulᱻ4));

    // StringLiteral
    const ꐚmulᱻ4 = createRule(mode, {
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
                if (ATYP !== STRING_CHARS) return false;
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
        constant: "mul",
    });

    // ApplicationExpression
    const ꐚmulᱻ5 = lazy(() => ꐚab(ꐚmulᱻ6));

    // StringLiteral
    const ꐚmulᱻ6 = createRule(mode, {
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
                if (ATYP !== STRING_CHARS) return false;
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
        constant: "rhs",
    });

    // SequenceExpression
    const ꐚmulᱻ7 = createRule(mode, {
        parse: {
            full: function SEQ() {
                const APOSₒ = APOS, CPOSₒ = CPOS;
                let seqType = ATYP = NOTHING;
                if (!ꐚmulᱻ8()) return APOS = APOSₒ, CPOS = CPOSₒ, false;
                seqType |= ATYP;
                if (!ꐚfactor()) return APOS = APOSₒ, CPOS = CPOSₒ, false;
                ATYP |= seqType;
                return true;
            },
            infer: () => {
                let seqType = ATYP = NOTHING;
                ꐚmulᱻ8.infer();
                seqType |= ATYP;
                ꐚfactor.infer();
                ATYP |= seqType;
            },
        },
        print: {
            full: function SEQ() {
                const APOSₒ = APOS, CPOSₒ = CPOS, ATYPₒ = ATYP;
                if (!ꐚmulᱻ8()) return APOS = APOSₒ, CPOS = CPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚfactor()) return APOS = APOSₒ, CPOS = CPOSₒ, ATYP = ATYPₒ, false;
                return true;
            },
            infer: () => {
                ꐚmulᱻ8.infer();
                ꐚfactor.infer();
            },
        },
    });

    // ApplicationExpression
    const ꐚmulᱻ8 = lazy(() => ꐚco(ꐚmulᱻ9));

    // ByteExpression
    const ꐚmulᱻ9 = createRule(mode, {
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
                if (ATYP !== STRING_CHARS) return false;
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
    const ꐚdiv = createRule(mode, {
        parse: {
            full: function RCD() {
                const APOSₒ = APOS, CPOSₒ = CPOS;
                VALUES[APOS++] = "type";
                if (!parseValue(ꐚdivᱻ1)) return APOS = APOSₒ, CPOS = CPOSₒ, false;
                VALUES[APOS++] = "lhs";
                if (!parseValue(ꐚterm)) return APOS = APOSₒ, CPOS = CPOSₒ, false;
                VALUES[APOS++] = "rhs";
                if (!parseValue(ꐚdivᱻ3)) return APOS = APOSₒ, CPOS = CPOSₒ, false;
                ATYP = RECORD_FIELDS;
                return true;
            },
            infer: function RCD() {
                const APOSₒ = APOS;
                VALUES[APOS++] = "type";
                parseInferValue(ꐚdivᱻ1.infer);
                VALUES[APOS++] = "lhs";
                parseInferValue(ꐚterm.infer);
                VALUES[APOS++] = "rhs";
                parseInferValue(ꐚdivᱻ3.infer);
                ATYP = RECORD_FIELDS;
            },
        },
        print: {
            full: function RCD() {
                if (ATYP !== RECORD_FIELDS) return false;
                const APOSₒ = APOS, CPOSₒ = CPOS, ATYPₒ = ATYP;
                const propList = AREP;
                const propCount = AREP.length >> 1;
                let bitmask = APOS;
                let i;
                for (i = 0, APOS = 1; (bitmask & (1 << i)) !== 0 && propList[i << 1] !== "type"; ++i, APOS += 2) ;
                if (i >= propCount) return APOS = APOSₒ, CPOS = CPOSₒ, ATYP = ATYPₒ, false;
                if (!printValue(ꐚdivᱻ1)) return APOS = APOSₒ, CPOS = CPOSₒ, ATYP = ATYPₒ, false;
                bitmask += (1 << i);
                for (i = 0, APOS = 1; (bitmask & (1 << i)) !== 0 && propList[i << 1] !== "lhs"; ++i, APOS += 2) ;
                if (i >= propCount) return APOS = APOSₒ, CPOS = CPOSₒ, ATYP = ATYPₒ, false;
                if (!printValue(ꐚterm)) return APOS = APOSₒ, CPOS = CPOSₒ, ATYP = ATYPₒ, false;
                bitmask += (1 << i);
                for (i = 0, APOS = 1; (bitmask & (1 << i)) !== 0 && propList[i << 1] !== "rhs"; ++i, APOS += 2) ;
                if (i >= propCount) return APOS = APOSₒ, CPOS = CPOSₒ, ATYP = ATYPₒ, false;
                if (!printValue(ꐚdivᱻ3)) return APOS = APOSₒ, CPOS = CPOSₒ, ATYP = ATYPₒ, false;
                bitmask += (1 << i);
                APOS = bitmask;
                return true;
            },
            infer: function RCD() {
                if (ATYP !== RECORD_FIELDS && ATYP !== NOTHING) return false;
                printInferValue(ꐚdivᱻ1.infer);
                printInferValue(ꐚterm.infer);
                printInferValue(ꐚdivᱻ3.infer);
            },
        },
    });

    // ApplicationExpression
    const ꐚdivᱻ1 = lazy(() => ꐚab(ꐚdivᱻ2));

    // StringLiteral
    const ꐚdivᱻ2 = createRule(mode, {
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
                if (ATYP !== STRING_CHARS) return false;
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
        constant: "div",
    });

    // SequenceExpression
    const ꐚdivᱻ3 = createRule(mode, {
        parse: {
            full: function SEQ() {
                const APOSₒ = APOS, CPOSₒ = CPOS;
                let seqType = ATYP = NOTHING;
                if (!ꐚdivᱻ4()) return APOS = APOSₒ, CPOS = CPOSₒ, false;
                seqType |= ATYP;
                if (!ꐚfactor()) return APOS = APOSₒ, CPOS = CPOSₒ, false;
                ATYP |= seqType;
                return true;
            },
            infer: () => {
                let seqType = ATYP = NOTHING;
                ꐚdivᱻ4.infer();
                seqType |= ATYP;
                ꐚfactor.infer();
                ATYP |= seqType;
            },
        },
        print: {
            full: function SEQ() {
                const APOSₒ = APOS, CPOSₒ = CPOS, ATYPₒ = ATYP;
                if (!ꐚdivᱻ4()) return APOS = APOSₒ, CPOS = CPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚfactor()) return APOS = APOSₒ, CPOS = CPOSₒ, ATYP = ATYPₒ, false;
                return true;
            },
            infer: () => {
                ꐚdivᱻ4.infer();
                ꐚfactor.infer();
            },
        },
    });

    // ApplicationExpression
    const ꐚdivᱻ4 = lazy(() => ꐚco(ꐚdivᱻ5));

    // ByteExpression
    const ꐚdivᱻ5 = createRule(mode, {
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
                if (ATYP !== STRING_CHARS) return false;
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
    const ꐚbase = createRule(mode, {
        parse: {
            full: () => (emitScalar(16), true),
            infer: () => emitScalar(16),
        },
        print: {
            full: function LIT() {
                if (ATYP !== SCALAR) return false;
                if (AREP[APOS] !== 16) return false;
                APOS += 1;
                return true;
            },
            infer: () => {},
        },
        constant: 16,
    });

    // BooleanLiteral
    const ꐚsigned = createRule(mode, {
        parse: {
            full: () => (emitScalar(false), true),
            infer: () => emitScalar(false),
        },
        print: {
            full: function LIT() {
                if (ATYP !== SCALAR) return false;
                if (AREP[APOS] !== false) return false;
                APOS += 1;
                return true;
            },
            infer: () => {},
        },
        constant: false,
    });

    // NumericLiteral
    const ꐚbaseᱻ2 = createRule(mode, {
        parse: {
            full: () => (emitScalar(2), true),
            infer: () => emitScalar(2),
        },
        print: {
            full: function LIT() {
                if (ATYP !== SCALAR) return false;
                if (AREP[APOS] !== 2) return false;
                APOS += 1;
                return true;
            },
            infer: () => {},
        },
        constant: 2,
    });

    // BooleanLiteral
    const ꐚsignedᱻ2 = createRule(mode, {
        parse: {
            full: () => (emitScalar(false), true),
            infer: () => emitScalar(false),
        },
        print: {
            full: function LIT() {
                if (ATYP !== SCALAR) return false;
                if (AREP[APOS] !== false) return false;
                APOS += 1;
                return true;
            },
            infer: () => {},
        },
        constant: false,
    });

    // BooleanLiteral
    const ꐚsignedᱻ3 = createRule(mode, {
        parse: {
            full: () => (emitScalar(false), true),
            infer: () => emitScalar(false),
        },
        print: {
            full: function LIT() {
                if (ATYP !== SCALAR) return false;
                if (AREP[APOS] !== false) return false;
                APOS += 1;
                return true;
            },
            infer: () => {},
        },
        constant: false,
    });

    // SelectionExpression
    const ꐚfactor = createRule(mode, {
        parse: {
            full: function SEL() { return ꐚfactorᱻ1() || ꐚfactorᱻ6() || ꐚfactorᱻ11() || ꐚfactorᱻ16() || ꐚfactorᱻ21(); },
            infer: () => ꐚfactorᱻ1.infer(),
        },
        print: {
            full: function SEL() { return ꐚfactorᱻ1() || ꐚfactorᱻ6() || ꐚfactorᱻ11() || ꐚfactorᱻ16() || ꐚfactorᱻ21(); },
            infer: () => ꐚfactorᱻ1.infer(),
        },
    });

    // SequenceExpression
    const ꐚfactorᱻ1 = createRule(mode, {
        parse: {
            full: function SEQ() {
                const APOSₒ = APOS, CPOSₒ = CPOS;
                let seqType = ATYP = NOTHING;
                if (!ꐚfactorᱻ2()) return APOS = APOSₒ, CPOS = CPOSₒ, false;
                seqType |= ATYP;
                if (!ꐚfactorᱻ4()) return APOS = APOSₒ, CPOS = CPOSₒ, false;
                seqType |= ATYP;
                if (!ꐚfloat()) return APOS = APOSₒ, CPOS = CPOSₒ, false;
                ATYP |= seqType;
                return true;
            },
            infer: () => {
                let seqType = ATYP = NOTHING;
                ꐚfactorᱻ2.infer();
                seqType |= ATYP;
                ꐚfactorᱻ4.infer();
                seqType |= ATYP;
                ꐚfloat.infer();
                ATYP |= seqType;
            },
        },
        print: {
            full: function SEQ() {
                const APOSₒ = APOS, CPOSₒ = CPOS, ATYPₒ = ATYP;
                if (!ꐚfactorᱻ2()) return APOS = APOSₒ, CPOS = CPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚfactorᱻ4()) return APOS = APOSₒ, CPOS = CPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚfloat()) return APOS = APOSₒ, CPOS = CPOSₒ, ATYP = ATYPₒ, false;
                return true;
            },
            infer: () => {
                ꐚfactorᱻ2.infer();
                ꐚfactorᱻ4.infer();
                ꐚfloat.infer();
            },
        },
    });

    // NotExpression
    const ꐚfactorᱻ2 = createRule(mode, {
        parse: {
            full: function NOT() {
                const APOSₒ = APOS, CPOSₒ = CPOS, ATYPₒ = ATYP;
                const result = !ꐚfactorᱻ3();
                APOS = APOSₒ, CPOS = CPOSₒ, ATYP = NOTHING;
                return result;
            },
            infer: () => (ATYP = NOTHING),
        },
        print: {
            full: function NOT() {
                const APOSₒ = APOS, CPOSₒ = CPOS, ATYPₒ = ATYP;
                const result = !ꐚfactorᱻ3();
                APOS = APOSₒ, CPOS = CPOSₒ, ATYP = ATYPₒ;
                return result;
            },
            infer: () => {},
        },
    });

    // StringLiteral
    const ꐚfactorᱻ3 = createRule(mode, {
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
                if (ATYP !== STRING_CHARS) return false;
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
        constant: "0x",
    });

    // NotExpression
    const ꐚfactorᱻ4 = createRule(mode, {
        parse: {
            full: function NOT() {
                const APOSₒ = APOS, CPOSₒ = CPOS, ATYPₒ = ATYP;
                const result = !ꐚfactorᱻ5();
                APOS = APOSₒ, CPOS = CPOSₒ, ATYP = NOTHING;
                return result;
            },
            infer: () => (ATYP = NOTHING),
        },
        print: {
            full: function NOT() {
                const APOSₒ = APOS, CPOSₒ = CPOS, ATYPₒ = ATYP;
                const result = !ꐚfactorᱻ5();
                APOS = APOSₒ, CPOS = CPOSₒ, ATYP = ATYPₒ;
                return result;
            },
            infer: () => {},
        },
    });

    // StringLiteral
    const ꐚfactorᱻ5 = createRule(mode, {
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
                if (ATYP !== STRING_CHARS) return false;
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
        constant: "0b",
    });

    // SequenceExpression
    const ꐚfactorᱻ6 = createRule(mode, {
        parse: {
            full: function SEQ() {
                const APOSₒ = APOS, CPOSₒ = CPOS;
                let seqType = ATYP = NOTHING;
                if (!ꐚfactorᱻ7()) return APOS = APOSₒ, CPOS = CPOSₒ, false;
                seqType |= ATYP;
                if (!ꐚfactorᱻ9()) return APOS = APOSₒ, CPOS = CPOSₒ, false;
                ATYP |= seqType;
                return true;
            },
            infer: () => {
                let seqType = ATYP = NOTHING;
                ꐚfactorᱻ7.infer();
                seqType |= ATYP;
                ꐚfactorᱻ9.infer();
                ATYP |= seqType;
            },
        },
        print: {
            full: function SEQ() {
                const APOSₒ = APOS, CPOSₒ = CPOS, ATYPₒ = ATYP;
                if (!ꐚfactorᱻ7()) return APOS = APOSₒ, CPOS = CPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚfactorᱻ9()) return APOS = APOSₒ, CPOS = CPOSₒ, ATYP = ATYPₒ, false;
                return true;
            },
            infer: () => {
                ꐚfactorᱻ7.infer();
                ꐚfactorᱻ9.infer();
            },
        },
    });

    // ApplicationExpression
    const ꐚfactorᱻ7 = lazy(() => ꐚco(ꐚfactorᱻ8));

    // StringLiteral
    const ꐚfactorᱻ8 = createRule(mode, {
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
                if (ATYP !== STRING_CHARS) return false;
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
        constant: "0x",
    });

    // ApplicationExpression
    const ꐚfactorᱻ9 = lazy(() => ꐚint(ꐚfactorᱻ10));

    // Module
    const ꐚfactorᱻ10 = (member) => {
        switch (member) {
            case 'base': return ꐚbase;
            case 'signed': return ꐚsigned;
            default: return undefined;
        }
    };

    // SequenceExpression
    const ꐚfactorᱻ11 = createRule(mode, {
        parse: {
            full: function SEQ() {
                const APOSₒ = APOS, CPOSₒ = CPOS;
                let seqType = ATYP = NOTHING;
                if (!ꐚfactorᱻ12()) return APOS = APOSₒ, CPOS = CPOSₒ, false;
                seqType |= ATYP;
                if (!ꐚfactorᱻ14()) return APOS = APOSₒ, CPOS = CPOSₒ, false;
                ATYP |= seqType;
                return true;
            },
            infer: () => {
                let seqType = ATYP = NOTHING;
                ꐚfactorᱻ12.infer();
                seqType |= ATYP;
                ꐚfactorᱻ14.infer();
                ATYP |= seqType;
            },
        },
        print: {
            full: function SEQ() {
                const APOSₒ = APOS, CPOSₒ = CPOS, ATYPₒ = ATYP;
                if (!ꐚfactorᱻ12()) return APOS = APOSₒ, CPOS = CPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚfactorᱻ14()) return APOS = APOSₒ, CPOS = CPOSₒ, ATYP = ATYPₒ, false;
                return true;
            },
            infer: () => {
                ꐚfactorᱻ12.infer();
                ꐚfactorᱻ14.infer();
            },
        },
    });

    // ApplicationExpression
    const ꐚfactorᱻ12 = lazy(() => ꐚco(ꐚfactorᱻ13));

    // StringLiteral
    const ꐚfactorᱻ13 = createRule(mode, {
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
                if (ATYP !== STRING_CHARS) return false;
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
        constant: "0b",
    });

    // ApplicationExpression
    const ꐚfactorᱻ14 = lazy(() => ꐚint(ꐚfactorᱻ15));

    // Module
    const ꐚfactorᱻ15 = (member) => {
        switch (member) {
            case 'base': return ꐚbaseᱻ2;
            case 'signed': return ꐚsignedᱻ2;
            default: return undefined;
        }
    };

    // SequenceExpression
    const ꐚfactorᱻ16 = createRule(mode, {
        parse: {
            full: function SEQ() {
                const APOSₒ = APOS, CPOSₒ = CPOS;
                let seqType = ATYP = NOTHING;
                if (!ꐚfactorᱻ17()) return APOS = APOSₒ, CPOS = CPOSₒ, false;
                seqType |= ATYP;
                if (!ꐚfactorᱻ19()) return APOS = APOSₒ, CPOS = CPOSₒ, false;
                ATYP |= seqType;
                return true;
            },
            infer: () => {
                let seqType = ATYP = NOTHING;
                ꐚfactorᱻ17.infer();
                seqType |= ATYP;
                ꐚfactorᱻ19.infer();
                ATYP |= seqType;
            },
        },
        print: {
            full: function SEQ() {
                const APOSₒ = APOS, CPOSₒ = CPOS, ATYPₒ = ATYP;
                if (!ꐚfactorᱻ17()) return APOS = APOSₒ, CPOS = CPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚfactorᱻ19()) return APOS = APOSₒ, CPOS = CPOSₒ, ATYP = ATYPₒ, false;
                return true;
            },
            infer: () => {
                ꐚfactorᱻ17.infer();
                ꐚfactorᱻ19.infer();
            },
        },
    });

    // ApplicationExpression
    const ꐚfactorᱻ17 = lazy(() => ꐚco(ꐚfactorᱻ18));

    // ByteExpression
    const ꐚfactorᱻ18 = createRule(mode, {
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
                if (ATYP !== STRING_CHARS) return false;
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
    const ꐚfactorᱻ19 = lazy(() => ꐚint(ꐚfactorᱻ20));

    // Module
    const ꐚfactorᱻ20 = (member) => {
        switch (member) {
            case 'signed': return ꐚsignedᱻ3;
            default: return undefined;
        }
    };

    // SequenceExpression
    const ꐚfactorᱻ21 = createRule(mode, {
        parse: {
            full: function SEQ() {
                const APOSₒ = APOS, CPOSₒ = CPOS;
                let seqType = ATYP = NOTHING;
                if (!ꐚfactorᱻ22()) return APOS = APOSₒ, CPOS = CPOSₒ, false;
                seqType |= ATYP;
                if (!ꐚexpr()) return APOS = APOSₒ, CPOS = CPOSₒ, false;
                seqType |= ATYP;
                if (!ꐚfactorᱻ24()) return APOS = APOSₒ, CPOS = CPOSₒ, false;
                ATYP |= seqType;
                return true;
            },
            infer: () => {
                let seqType = ATYP = NOTHING;
                ꐚfactorᱻ22.infer();
                seqType |= ATYP;
                ꐚexpr.infer();
                seqType |= ATYP;
                ꐚfactorᱻ24.infer();
                ATYP |= seqType;
            },
        },
        print: {
            full: function SEQ() {
                const APOSₒ = APOS, CPOSₒ = CPOS, ATYPₒ = ATYP;
                if (!ꐚfactorᱻ22()) return APOS = APOSₒ, CPOS = CPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚexpr()) return APOS = APOSₒ, CPOS = CPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚfactorᱻ24()) return APOS = APOSₒ, CPOS = CPOSₒ, ATYP = ATYPₒ, false;
                return true;
            },
            infer: () => {
                ꐚfactorᱻ22.infer();
                ꐚexpr.infer();
                ꐚfactorᱻ24.infer();
            },
        },
    });

    // ApplicationExpression
    const ꐚfactorᱻ22 = lazy(() => ꐚco(ꐚfactorᱻ23));

    // ByteExpression
    const ꐚfactorᱻ23 = createRule(mode, {
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
                if (ATYP !== STRING_CHARS) return false;
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
    const ꐚfactorᱻ24 = lazy(() => ꐚco(ꐚfactorᱻ25));

    // ByteExpression
    const ꐚfactorᱻ25 = createRule(mode, {
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
                if (ATYP !== STRING_CHARS) return false;
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
    const ꐚab = (PARAMː1) => {

        // FunctionParameter
        const ꐚexprᱻ2 = Object.assign(
            arg => PARAMː1(arg),
            {infer: arg => PARAMː1.infer(arg)},
        );

        // AbstractExpression
        const ꐚLET = createRule(mode, {
            parse: {
                full: () => (ꐚexprᱻ2.infer(), true),
                infer: () => ꐚexprᱻ2.infer(),
            },
            print: {
                full: () => {
                    const CPOSₒ = CPOS;
                    const result = ꐚexprᱻ2();
                    CPOS = CPOSₒ;
                    return result;
                },
                infer: () => {},
            },
        });

        return ꐚLET;
    };

    // FunctionExpression
    const ꐚco = (PARAMː2) => {

        // FunctionParameter
        const ꐚexprᱻ3 = Object.assign(
            arg => PARAMː2(arg),
            {infer: arg => PARAMː2.infer(arg)},
        );

        // ConcreteExpression
        const ꐚLET = createRule(mode, {
            parse: {
                full: () => {
                    const APOSₒ = APOS;
                    const result = ꐚexprᱻ3();
                    APOS = APOSₒ, ATYP = NOTHING;
                    return result;
                },
                infer: () => (ATYP = NOTHING),
            },
            print: {
                full: () => (ꐚexprᱻ3.infer(), true),
                infer: () => ꐚexprᱻ3.infer(),
            },
        });

        return ꐚLET;
    };

    // Module
    const ꐚMODːmath = (member) => {
        switch (member) {
            case 'memoise': return ꐚmemoise;
            case 'float': return ꐚfloat;
            case 'int': return ꐚint;
            case 'start': return ꐚstartᱻ2;
            case 'expr': return ꐚexpr;
            case 'add': return ꐚadd;
            case 'sub': return ꐚsub;
            case 'term': return ꐚterm;
            case 'mul': return ꐚmul;
            case 'div': return ꐚdiv;
            case 'factor': return ꐚfactor;
            case 'ab': return ꐚab;
            case 'co': return ꐚco;
            default: return undefined;
        }
    };

    // Intrinsic
    const ꐚfloatString = extensions["V:/projects/oss/pen-monorepo/packages/core/penc/dist/deps/std.pen.js"].floatString(mode);

    // Intrinsic
    const ꐚintString = extensions["V:/projects/oss/pen-monorepo/packages/core/penc/dist/deps/std.pen.js"].intString(mode);

    // Intrinsic
    const ꐚmemoiseᱻ2 = extensions["V:/projects/oss/pen-monorepo/packages/core/penc/dist/deps/std.pen.js"].memoise(mode);

    // Module
    const ꐚMODːstd = (member) => {
        switch (member) {
            case 'floatString': return ꐚfloatString;
            case 'intString': return ꐚintString;
            case 'memoise': return ꐚmemoiseᱻ2;
            default: return undefined;
        }
    };

    return ꐚstartᱻ2;
}
