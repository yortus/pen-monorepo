
// ------------------------------ Main exports ------------------------------
module.exports = {
    parse(strOrBuf) {
        CREP = Buffer.isBuffer(strOrBuf) ? strOrBuf : Buffer.from(strOrBuf, 'utf8');
        CPOS = 0;
        AREP = [];
        APOS = 0;
        if (!parseValue(parse)) throw new Error('parse failed');
        if (CPOS !== CREP.length) throw new Error('parse didn\'t consume entire input');
        return AREP[0];
    },
    print(node, buf) {
        AREP = [node];
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
let AREP = [];
let APOS = 0;
let ATYP = 0;
let CREP = Buffer.alloc(1);
let CPOS = 0;
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
function parseValue(rule) {
    const [AREPₒ, APOSₒ] = [AREP, APOS];
    AREP = undefined;
    APOS = 0;
    if (!rule())
        return AREP = AREPₒ, APOS = APOSₒ, false;
    if (ATYP === NOTHING)
        return AREP = AREPₒ, APOS = APOSₒ, false;
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
            if (Object.keys(obj).length * 2 < APOS)
                throw new Error(`Duplicate labels in record`);
            break;
        default:
            ((atyp) => { throw new Error(`Unhandled abstract type ${atyp}`); })(ATYP);
    }
    AREPₒ[APOSₒ] = value;
    AREP = AREPₒ;
    APOS = APOSₒ + 1;
    return true;
}
function parseInferValue(infer) {
    const [AREPₒ, APOSₒ] = [AREP, APOS];
    AREP = undefined;
    APOS = 0;
    infer();
    if (ATYP === NOTHING)
        return;
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
}
function printValue(rule) {
    const [AREPₒ, APOSₒ, ATYPₒ] = [AREP, APOS, ATYP];
    let value = AREP[APOS];
    let atyp;
    if (value === undefined) {
        return false;
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
    "V:/projects/oss/pen-monorepo/packages/core/penc/dist/deps/experiments.pen.js": (() => {
        "use strict";
        /* @pen exports = {
            unicode
        } */
        // see https://gist.github.com/pascaldekloe/62546103a1576803dade9269ccf76330 for encode/decode algo in js
        function unicode(mode) {
            return function UNI_function(expr) {
                var _a, _b, _c;
                assert(isModule(expr));
                const base = (_a = expr('base')) === null || _a === void 0 ? void 0 : _a.constant;
                const minDigits = (_b = expr('minDigits')) === null || _b === void 0 ? void 0 : _b.constant;
                const maxDigits = (_c = expr('maxDigits')) === null || _c === void 0 ? void 0 : _c.constant;
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

    // Identifier
    const ꐚfloatString = Object.assign(
        arg => ꐚfloatStringᱻ2(arg),
        {infer: arg => ꐚfloatStringᱻ2.infer(arg)},
    );

    // Identifier
    const ꐚunicode = Object.assign(
        arg => ꐚunicodeᱻ2(arg),
        {infer: arg => ꐚunicodeᱻ2.infer(arg)},
    );

    // SequenceExpression
    const ꐚstartᱻ2 = createRule(mode, {
        parse: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ] = [APOS, CPOS];
                let seqType = ATYP = NOTHING;
                if (!ꐚWS()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                seqType |= ATYP;
                if (!ꐚValue()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                seqType |= ATYP;
                if (!ꐚWS()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                ATYP |= seqType;
                return true;
            },
            infer: () => {
                let seqType = ATYP = NOTHING;
                ꐚWS.infer();
                seqType |= ATYP;
                ꐚValue.infer();
                seqType |= ATYP;
                ꐚWS.infer();
                ATYP |= seqType;
            },
        },
        print: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
                if (!ꐚWS()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
                if (!ꐚValue()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
                if (!ꐚWS()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
                return true;
            },
            infer: () => {
                ꐚWS.infer();
                ꐚValue.infer();
                ꐚWS.infer();
            },
        },
    });

    // SelectionExpression
    const ꐚValue = createRule(mode, {
        parse: {
            full: function SEL() { return ꐚFalse() || ꐚNull() || ꐚTrue() || ꐚObject() || ꐚArray() || ꐚNumber() || ꐚString(); },
            infer: () => ꐚFalse.infer(),
        },
        print: {
            full: function SEL() { return ꐚFalse() || ꐚNull() || ꐚTrue() || ꐚObject() || ꐚArray() || ꐚNumber() || ꐚString(); },
            infer: () => ꐚFalse.infer(),
        },
    });

    // SequenceExpression
    const ꐚFalse = createRule(mode, {
        parse: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ] = [APOS, CPOS];
                let seqType = ATYP = NOTHING;
                if (!ꐚFalseᱻ1()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                seqType |= ATYP;
                if (!ꐚFalseᱻ2()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                ATYP |= seqType;
                return true;
            },
            infer: () => {
                let seqType = ATYP = NOTHING;
                ꐚFalseᱻ1.infer();
                seqType |= ATYP;
                ꐚFalseᱻ2.infer();
                ATYP |= seqType;
            },
        },
        print: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
                if (!ꐚFalseᱻ1()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
                if (!ꐚFalseᱻ2()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
                return true;
            },
            infer: () => {
                ꐚFalseᱻ1.infer();
                ꐚFalseᱻ2.infer();
            },
        },
    });

    // StringLiteral
    const ꐚFalseᱻ1 = createRule(mode, {
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
        constant: "false",
    });

    // BooleanLiteral
    const ꐚFalseᱻ2 = createRule(mode, {
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

    // SequenceExpression
    const ꐚNull = createRule(mode, {
        parse: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ] = [APOS, CPOS];
                let seqType = ATYP = NOTHING;
                if (!ꐚNullᱻ1()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                seqType |= ATYP;
                if (!ꐚNullᱻ2()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                ATYP |= seqType;
                return true;
            },
            infer: () => {
                let seqType = ATYP = NOTHING;
                ꐚNullᱻ1.infer();
                seqType |= ATYP;
                ꐚNullᱻ2.infer();
                ATYP |= seqType;
            },
        },
        print: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
                if (!ꐚNullᱻ1()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
                if (!ꐚNullᱻ2()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
                return true;
            },
            infer: () => {
                ꐚNullᱻ1.infer();
                ꐚNullᱻ2.infer();
            },
        },
    });

    // StringLiteral
    const ꐚNullᱻ1 = createRule(mode, {
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
        constant: "null",
    });

    // NullLiteral
    const ꐚNullᱻ2 = createRule(mode, {
        parse: {
            full: () => (emitScalar(null), true),
            infer: () => emitScalar(null),
        },
        print: {
            full: function LIT() {
                if (ATYP !== SCALAR) return false;
                if (AREP[APOS] !== null) return false;
                APOS += 1;
                return true;
            },
            infer: () => {},
        },
        constant: null,
    });

    // SequenceExpression
    const ꐚTrue = createRule(mode, {
        parse: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ] = [APOS, CPOS];
                let seqType = ATYP = NOTHING;
                if (!ꐚTrueᱻ1()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                seqType |= ATYP;
                if (!ꐚTrueᱻ2()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                ATYP |= seqType;
                return true;
            },
            infer: () => {
                let seqType = ATYP = NOTHING;
                ꐚTrueᱻ1.infer();
                seqType |= ATYP;
                ꐚTrueᱻ2.infer();
                ATYP |= seqType;
            },
        },
        print: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
                if (!ꐚTrueᱻ1()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
                if (!ꐚTrueᱻ2()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
                return true;
            },
            infer: () => {
                ꐚTrueᱻ1.infer();
                ꐚTrueᱻ2.infer();
            },
        },
    });

    // StringLiteral
    const ꐚTrueᱻ1 = createRule(mode, {
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
        constant: "true",
    });

    // BooleanLiteral
    const ꐚTrueᱻ2 = createRule(mode, {
        parse: {
            full: () => (emitScalar(true), true),
            infer: () => emitScalar(true),
        },
        print: {
            full: function LIT() {
                if (ATYP !== SCALAR) return false;
                if (AREP[APOS] !== true) return false;
                APOS += 1;
                return true;
            },
            infer: () => {},
        },
        constant: true,
    });

    // SequenceExpression
    const ꐚObject = createRule(mode, {
        parse: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ] = [APOS, CPOS];
                let seqType = ATYP = NOTHING;
                if (!ꐚLBRACE()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                seqType |= ATYP;
                if (!ꐚObjectᱻ1()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                seqType |= ATYP;
                if (!ꐚRBRACE()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                ATYP |= seqType;
                return true;
            },
            infer: () => {
                let seqType = ATYP = NOTHING;
                ꐚLBRACE.infer();
                seqType |= ATYP;
                ꐚObjectᱻ1.infer();
                seqType |= ATYP;
                ꐚRBRACE.infer();
                ATYP |= seqType;
            },
        },
        print: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
                if (!ꐚLBRACE()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
                if (!ꐚObjectᱻ1()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
                if (!ꐚRBRACE()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
                return true;
            },
            infer: () => {
                ꐚLBRACE.infer();
                ꐚObjectᱻ1.infer();
                ꐚRBRACE.infer();
            },
        },
    });

    // SelectionExpression
    const ꐚObjectᱻ1 = createRule(mode, {
        parse: {
            full: function SEL() { return ꐚObjectᱻ2() || ꐚObjectᱻ9(); },
            infer: () => ꐚObjectᱻ2.infer(),
        },
        print: {
            full: function SEL() { return ꐚObjectᱻ2() || ꐚObjectᱻ9(); },
            infer: () => ꐚObjectᱻ2.infer(),
        },
    });

    // SequenceExpression
    const ꐚObjectᱻ2 = createRule(mode, {
        parse: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ] = [APOS, CPOS];
                let seqType = ATYP = NOTHING;
                if (!ꐚObjectᱻ3()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                seqType |= ATYP;
                if (!ꐚObjectᱻ5()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                ATYP |= seqType;
                return true;
            },
            infer: () => {
                let seqType = ATYP = NOTHING;
                ꐚObjectᱻ3.infer();
                seqType |= ATYP;
                ꐚObjectᱻ5.infer();
                ATYP |= seqType;
            },
        },
        print: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
                if (!ꐚObjectᱻ3()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
                if (!ꐚObjectᱻ5()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
                return true;
            },
            infer: () => {
                ꐚObjectᱻ3.infer();
                ꐚObjectᱻ5.infer();
            },
        },
    });

    // RecordExpression
    const ꐚObjectᱻ3 = createRule(mode, {
        parse: {
            full: function RCD() {
                const [APOSₒ, CPOSₒ] = [APOS, CPOS];
                if (APOS === 0) AREP = [];
                if (!parseValue(ꐚString)) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                assert(ATYP === STRING);
                if (!parseValue(ꐚObjectᱻ4)) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                ATYP = RECORD;
                return true;
            },
            infer: function RCD() {
                const APOSₒ = APOS;
                if (APOS === 0) AREP = [];
                parseInferValue(ꐚString.infer);
                assert(ATYP === STRING);
                parseInferValue(ꐚObjectᱻ4.infer);
                ATYP = RECORD;
            },
        },
        print: {
            full: function RCD() {
                if (ATYP !== RECORD) return false;
                const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
                const propList = AREP;
                const propCount = AREP.length >> 1;
                let bitmask = APOS;
                let i;
                for (i = APOS = 0; (bitmask & (1 << i)) !== 0; ++i, APOS += 2) ;
                if (i >= propCount || !printValue(ꐚString)) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
                if (!printValue(ꐚObjectᱻ4)) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
                bitmask += (1 << i);
                APOS = bitmask;
                return true;
            },
            infer: function RCD() {
                if (ATYP !== RECORD && ATYP !== NOTHING) return false;
                printInferValue(ꐚString.infer);
                printInferValue(ꐚObjectᱻ4.infer);
            },
        },
    });

    // SequenceExpression
    const ꐚObjectᱻ4 = createRule(mode, {
        parse: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ] = [APOS, CPOS];
                let seqType = ATYP = NOTHING;
                if (!ꐚCOLON()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                seqType |= ATYP;
                if (!ꐚValue()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                ATYP |= seqType;
                return true;
            },
            infer: () => {
                let seqType = ATYP = NOTHING;
                ꐚCOLON.infer();
                seqType |= ATYP;
                ꐚValue.infer();
                ATYP |= seqType;
            },
        },
        print: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
                if (!ꐚCOLON()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
                if (!ꐚValue()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
                return true;
            },
            infer: () => {
                ꐚCOLON.infer();
                ꐚValue.infer();
            },
        },
    });

    // QuantifiedExpression
    const ꐚObjectᱻ5 = createRule(mode, {
        parse: {
            full: function QUA() {
                let [CPOSᐟ, APOSᐟ] = [CPOS, APOS];
                let seqType = ATYP = NOTHING;
                while (true) {
                    if (!ꐚObjectᱻ6() || CPOS <= CPOSᐟ) break;
                    seqType |= ATYP;
                    CPOSᐟ = CPOS, APOSᐟ = APOS;
                }
                CPOS = CPOSᐟ, APOS = APOSᐟ, ATYP = seqType;
                return true;
            },
            infer: () => (ATYP = NOTHING),
        },
        print: {
            full: function QUA() {
                let [APOSᐟ, CPOSᐟ] = [APOS, CPOS];
                while (true) {
                    if (!ꐚObjectᱻ6() || APOS <= APOSᐟ) break;
                    APOSᐟ = APOS, CPOSᐟ = CPOS;
                }
                APOS = APOSᐟ, CPOS = CPOSᐟ;
                return true;
            },
            infer: () => {},
        },
    });

    // RecordExpression
    const ꐚObjectᱻ6 = createRule(mode, {
        parse: {
            full: function RCD() {
                const [APOSₒ, CPOSₒ] = [APOS, CPOS];
                if (APOS === 0) AREP = [];
                if (!parseValue(ꐚObjectᱻ7)) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                assert(ATYP === STRING);
                if (!parseValue(ꐚObjectᱻ8)) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                ATYP = RECORD;
                return true;
            },
            infer: function RCD() {
                const APOSₒ = APOS;
                if (APOS === 0) AREP = [];
                parseInferValue(ꐚObjectᱻ7.infer);
                assert(ATYP === STRING);
                parseInferValue(ꐚObjectᱻ8.infer);
                ATYP = RECORD;
            },
        },
        print: {
            full: function RCD() {
                if (ATYP !== RECORD) return false;
                const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
                const propList = AREP;
                const propCount = AREP.length >> 1;
                let bitmask = APOS;
                let i;
                for (i = APOS = 0; (bitmask & (1 << i)) !== 0; ++i, APOS += 2) ;
                if (i >= propCount || !printValue(ꐚObjectᱻ7)) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
                if (!printValue(ꐚObjectᱻ8)) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
                bitmask += (1 << i);
                APOS = bitmask;
                return true;
            },
            infer: function RCD() {
                if (ATYP !== RECORD && ATYP !== NOTHING) return false;
                printInferValue(ꐚObjectᱻ7.infer);
                printInferValue(ꐚObjectᱻ8.infer);
            },
        },
    });

    // SequenceExpression
    const ꐚObjectᱻ7 = createRule(mode, {
        parse: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ] = [APOS, CPOS];
                let seqType = ATYP = NOTHING;
                if (!ꐚCOMMA()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                seqType |= ATYP;
                if (!ꐚString()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                ATYP |= seqType;
                return true;
            },
            infer: () => {
                let seqType = ATYP = NOTHING;
                ꐚCOMMA.infer();
                seqType |= ATYP;
                ꐚString.infer();
                ATYP |= seqType;
            },
        },
        print: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
                if (!ꐚCOMMA()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
                if (!ꐚString()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
                return true;
            },
            infer: () => {
                ꐚCOMMA.infer();
                ꐚString.infer();
            },
        },
    });

    // SequenceExpression
    const ꐚObjectᱻ8 = createRule(mode, {
        parse: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ] = [APOS, CPOS];
                let seqType = ATYP = NOTHING;
                if (!ꐚCOLON()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                seqType |= ATYP;
                if (!ꐚValue()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                ATYP |= seqType;
                return true;
            },
            infer: () => {
                let seqType = ATYP = NOTHING;
                ꐚCOLON.infer();
                seqType |= ATYP;
                ꐚValue.infer();
                ATYP |= seqType;
            },
        },
        print: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
                if (!ꐚCOLON()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
                if (!ꐚValue()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
                return true;
            },
            infer: () => {
                ꐚCOLON.infer();
                ꐚValue.infer();
            },
        },
    });

    // RecordExpression
    const ꐚObjectᱻ9 = createRule(mode, {
        parse: {
            full: function RCD() {
                const [APOSₒ, CPOSₒ] = [APOS, CPOS];
                if (APOS === 0) AREP = [];
                ATYP = RECORD;
                return true;
            },
            infer: function RCD() {
                const APOSₒ = APOS;
                if (APOS === 0) AREP = [];
                ATYP = RECORD;
            },
        },
        print: {
            full: function RCD() {
                if (ATYP !== RECORD) return false;
                const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
                const propList = AREP;
                const propCount = AREP.length >> 1;
                let bitmask = APOS;
                let i;
                APOS = bitmask;
                return true;
            },
            infer: function RCD() {
                if (ATYP !== RECORD && ATYP !== NOTHING) return false;
            },
        },
    });

    // SequenceExpression
    const ꐚObject2 = createRule(mode, {
        parse: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ] = [APOS, CPOS];
                let seqType = ATYP = NOTHING;
                if (!ꐚLBRACE()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                seqType |= ATYP;
                if (!ꐚObject2ᱻ1()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                seqType |= ATYP;
                if (!ꐚRBRACE()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                ATYP |= seqType;
                return true;
            },
            infer: () => {
                let seqType = ATYP = NOTHING;
                ꐚLBRACE.infer();
                seqType |= ATYP;
                ꐚObject2ᱻ1.infer();
                seqType |= ATYP;
                ꐚRBRACE.infer();
                ATYP |= seqType;
            },
        },
        print: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
                if (!ꐚLBRACE()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
                if (!ꐚObject2ᱻ1()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
                if (!ꐚRBRACE()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
                return true;
            },
            infer: () => {
                ꐚLBRACE.infer();
                ꐚObject2ᱻ1.infer();
                ꐚRBRACE.infer();
            },
        },
    });

    // SelectionExpression
    const ꐚObject2ᱻ1 = createRule(mode, {
        parse: {
            full: function SEL() { return ꐚProperties() || ꐚObject2ᱻ2(); },
            infer: () => ꐚProperties.infer(),
        },
        print: {
            full: function SEL() { return ꐚProperties() || ꐚObject2ᱻ2(); },
            infer: () => ꐚProperties.infer(),
        },
    });

    // RecordExpression
    const ꐚObject2ᱻ2 = createRule(mode, {
        parse: {
            full: function RCD() {
                const [APOSₒ, CPOSₒ] = [APOS, CPOS];
                if (APOS === 0) AREP = [];
                ATYP = RECORD;
                return true;
            },
            infer: function RCD() {
                const APOSₒ = APOS;
                if (APOS === 0) AREP = [];
                ATYP = RECORD;
            },
        },
        print: {
            full: function RCD() {
                if (ATYP !== RECORD) return false;
                const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
                const propList = AREP;
                const propCount = AREP.length >> 1;
                let bitmask = APOS;
                let i;
                APOS = bitmask;
                return true;
            },
            infer: function RCD() {
                if (ATYP !== RECORD && ATYP !== NOTHING) return false;
            },
        },
    });

    // RecordExpression
    const ꐚProperties = createRule(mode, {
        parse: {
            full: function RCD() {
                const [APOSₒ, CPOSₒ] = [APOS, CPOS];
                if (APOS === 0) AREP = [];
                if (!parseValue(ꐚString)) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                assert(ATYP === STRING);
                if (!parseValue(ꐚPropertiesᱻ1)) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                const apos = APOS;
                if (!ꐚPropertiesᱻ2()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                ATYP = RECORD;
                return true;
            },
            infer: function RCD() {
                const APOSₒ = APOS;
                if (APOS === 0) AREP = [];
                parseInferValue(ꐚString.infer);
                assert(ATYP === STRING);
                parseInferValue(ꐚPropertiesᱻ1.infer);
                const apos = APOS;
                ꐚPropertiesᱻ2.infer();
                ATYP = RECORD;
            },
        },
        print: {
            full: function RCD() {
                if (ATYP !== RECORD) return false;
                const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
                const propList = AREP;
                const propCount = AREP.length >> 1;
                let bitmask = APOS;
                let i;
                for (i = APOS = 0; (bitmask & (1 << i)) !== 0; ++i, APOS += 2) ;
                if (i >= propCount || !printValue(ꐚString)) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
                if (!printValue(ꐚPropertiesᱻ1)) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
                bitmask += (1 << i);
                APOS = bitmask;
                ATYP = RECORD;
                if (!ꐚPropertiesᱻ2()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
                bitmask = APOS;
                APOS = bitmask;
                return true;
            },
            infer: function RCD() {
                if (ATYP !== RECORD && ATYP !== NOTHING) return false;
                printInferValue(ꐚString.infer);
                printInferValue(ꐚPropertiesᱻ1.infer);
                ATYP = RECORD;
                ꐚPropertiesᱻ2.infer();
            },
        },
    });

    // SequenceExpression
    const ꐚPropertiesᱻ1 = createRule(mode, {
        parse: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ] = [APOS, CPOS];
                let seqType = ATYP = NOTHING;
                if (!ꐚCOLON()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                seqType |= ATYP;
                if (!ꐚValue()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                ATYP |= seqType;
                return true;
            },
            infer: () => {
                let seqType = ATYP = NOTHING;
                ꐚCOLON.infer();
                seqType |= ATYP;
                ꐚValue.infer();
                ATYP |= seqType;
            },
        },
        print: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
                if (!ꐚCOLON()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
                if (!ꐚValue()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
                return true;
            },
            infer: () => {
                ꐚCOLON.infer();
                ꐚValue.infer();
            },
        },
    });

    // SelectionExpression
    const ꐚPropertiesᱻ2 = createRule(mode, {
        parse: {
            full: function SEL() { return ꐚPropertiesᱻ3() || ꐚPropertiesᱻ4(); },
            infer: () => ꐚPropertiesᱻ3.infer(),
        },
        print: {
            full: function SEL() { return ꐚPropertiesᱻ3() || ꐚPropertiesᱻ4(); },
            infer: () => ꐚPropertiesᱻ3.infer(),
        },
    });

    // SequenceExpression
    const ꐚPropertiesᱻ3 = createRule(mode, {
        parse: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ] = [APOS, CPOS];
                let seqType = ATYP = NOTHING;
                if (!ꐚCOMMA()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                seqType |= ATYP;
                if (!ꐚProperties()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                ATYP |= seqType;
                return true;
            },
            infer: () => {
                let seqType = ATYP = NOTHING;
                ꐚCOMMA.infer();
                seqType |= ATYP;
                ꐚProperties.infer();
                ATYP |= seqType;
            },
        },
        print: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
                if (!ꐚCOMMA()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
                if (!ꐚProperties()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
                return true;
            },
            infer: () => {
                ꐚCOMMA.infer();
                ꐚProperties.infer();
            },
        },
    });

    // RecordExpression
    const ꐚPropertiesᱻ4 = createRule(mode, {
        parse: {
            full: function RCD() {
                const [APOSₒ, CPOSₒ] = [APOS, CPOS];
                if (APOS === 0) AREP = [];
                ATYP = RECORD;
                return true;
            },
            infer: function RCD() {
                const APOSₒ = APOS;
                if (APOS === 0) AREP = [];
                ATYP = RECORD;
            },
        },
        print: {
            full: function RCD() {
                if (ATYP !== RECORD) return false;
                const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
                const propList = AREP;
                const propCount = AREP.length >> 1;
                let bitmask = APOS;
                let i;
                APOS = bitmask;
                return true;
            },
            infer: function RCD() {
                if (ATYP !== RECORD && ATYP !== NOTHING) return false;
            },
        },
    });

    // SequenceExpression
    const ꐚArray = createRule(mode, {
        parse: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ] = [APOS, CPOS];
                let seqType = ATYP = NOTHING;
                if (!ꐚLBRACKET()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                seqType |= ATYP;
                if (!ꐚArrayᱻ1()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                seqType |= ATYP;
                if (!ꐚRBRACKET()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                ATYP |= seqType;
                return true;
            },
            infer: () => {
                let seqType = ATYP = NOTHING;
                ꐚLBRACKET.infer();
                seqType |= ATYP;
                ꐚArrayᱻ1.infer();
                seqType |= ATYP;
                ꐚRBRACKET.infer();
                ATYP |= seqType;
            },
        },
        print: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
                if (!ꐚLBRACKET()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
                if (!ꐚArrayᱻ1()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
                if (!ꐚRBRACKET()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
                return true;
            },
            infer: () => {
                ꐚLBRACKET.infer();
                ꐚArrayᱻ1.infer();
                ꐚRBRACKET.infer();
            },
        },
    });

    // SelectionExpression
    const ꐚArrayᱻ1 = createRule(mode, {
        parse: {
            full: function SEL() { return ꐚArrayᱻ2() || ꐚArrayᱻ7(); },
            infer: () => ꐚArrayᱻ2.infer(),
        },
        print: {
            full: function SEL() { return ꐚArrayᱻ2() || ꐚArrayᱻ7(); },
            infer: () => ꐚArrayᱻ2.infer(),
        },
    });

    // SequenceExpression
    const ꐚArrayᱻ2 = createRule(mode, {
        parse: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ] = [APOS, CPOS];
                let seqType = ATYP = NOTHING;
                if (!ꐚArrayᱻ3()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                seqType |= ATYP;
                if (!ꐚArrayᱻ4()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                ATYP |= seqType;
                return true;
            },
            infer: () => {
                let seqType = ATYP = NOTHING;
                ꐚArrayᱻ3.infer();
                seqType |= ATYP;
                ꐚArrayᱻ4.infer();
                ATYP |= seqType;
            },
        },
        print: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
                if (!ꐚArrayᱻ3()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
                if (!ꐚArrayᱻ4()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
                return true;
            },
            infer: () => {
                ꐚArrayᱻ3.infer();
                ꐚArrayᱻ4.infer();
            },
        },
    });

    // ListExpression
    const ꐚArrayᱻ3 = createRule(mode, {
        parse: {
            full: function LST() {
                const [APOSₒ, CPOSₒ] = [APOS, CPOS];
                if (APOS === 0) AREP = [];
                if (!parseValue(ꐚValue)) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                ATYP = LIST;
                return true;
            },
            infer: function LST() {
                if (APOS === 0) AREP = [];
                parseInferValue(ꐚValue.infer);
                ATYP = LIST;
            },
        },
        print: {
            full: function LST() {
                if (ATYP !== LIST) return false;
                const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
                if (!printValue(ꐚValue)) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
                return true;
            },
            infer: function LST() {
                if (ATYP !== LIST && ATYP !== NOTHING) return false;
                printInferValue(ꐚValue.infer);
            },
        },
    });

    // QuantifiedExpression
    const ꐚArrayᱻ4 = createRule(mode, {
        parse: {
            full: function QUA() {
                let [CPOSᐟ, APOSᐟ] = [CPOS, APOS];
                let seqType = ATYP = NOTHING;
                while (true) {
                    if (!ꐚArrayᱻ5() || CPOS <= CPOSᐟ) break;
                    seqType |= ATYP;
                    CPOSᐟ = CPOS, APOSᐟ = APOS;
                }
                CPOS = CPOSᐟ, APOS = APOSᐟ, ATYP = seqType;
                return true;
            },
            infer: () => (ATYP = NOTHING),
        },
        print: {
            full: function QUA() {
                let [APOSᐟ, CPOSᐟ] = [APOS, CPOS];
                while (true) {
                    if (!ꐚArrayᱻ5() || APOS <= APOSᐟ) break;
                    APOSᐟ = APOS, CPOSᐟ = CPOS;
                }
                APOS = APOSᐟ, CPOS = CPOSᐟ;
                return true;
            },
            infer: () => {},
        },
    });

    // ListExpression
    const ꐚArrayᱻ5 = createRule(mode, {
        parse: {
            full: function LST() {
                const [APOSₒ, CPOSₒ] = [APOS, CPOS];
                if (APOS === 0) AREP = [];
                if (!parseValue(ꐚArrayᱻ6)) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                ATYP = LIST;
                return true;
            },
            infer: function LST() {
                if (APOS === 0) AREP = [];
                parseInferValue(ꐚArrayᱻ6.infer);
                ATYP = LIST;
            },
        },
        print: {
            full: function LST() {
                if (ATYP !== LIST) return false;
                const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
                if (!printValue(ꐚArrayᱻ6)) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
                return true;
            },
            infer: function LST() {
                if (ATYP !== LIST && ATYP !== NOTHING) return false;
                printInferValue(ꐚArrayᱻ6.infer);
            },
        },
    });

    // SequenceExpression
    const ꐚArrayᱻ6 = createRule(mode, {
        parse: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ] = [APOS, CPOS];
                let seqType = ATYP = NOTHING;
                if (!ꐚCOMMA()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                seqType |= ATYP;
                if (!ꐚValue()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                ATYP |= seqType;
                return true;
            },
            infer: () => {
                let seqType = ATYP = NOTHING;
                ꐚCOMMA.infer();
                seqType |= ATYP;
                ꐚValue.infer();
                ATYP |= seqType;
            },
        },
        print: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
                if (!ꐚCOMMA()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
                if (!ꐚValue()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
                return true;
            },
            infer: () => {
                ꐚCOMMA.infer();
                ꐚValue.infer();
            },
        },
    });

    // ListExpression
    const ꐚArrayᱻ7 = createRule(mode, {
        parse: {
            full: function LST() {
                const [APOSₒ, CPOSₒ] = [APOS, CPOS];
                if (APOS === 0) AREP = [];
                ATYP = LIST;
                return true;
            },
            infer: function LST() {
                if (APOS === 0) AREP = [];
                ATYP = LIST;
            },
        },
        print: {
            full: function LST() {
                if (ATYP !== LIST) return false;
                const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
                return true;
            },
            infer: function LST() {
                if (ATYP !== LIST && ATYP !== NOTHING) return false;
            },
        },
    });

    // SequenceExpression
    const ꐚArray2 = createRule(mode, {
        parse: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ] = [APOS, CPOS];
                let seqType = ATYP = NOTHING;
                if (!ꐚLBRACKET()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                seqType |= ATYP;
                if (!ꐚArray2ᱻ1()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                seqType |= ATYP;
                if (!ꐚRBRACKET()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                ATYP |= seqType;
                return true;
            },
            infer: () => {
                let seqType = ATYP = NOTHING;
                ꐚLBRACKET.infer();
                seqType |= ATYP;
                ꐚArray2ᱻ1.infer();
                seqType |= ATYP;
                ꐚRBRACKET.infer();
                ATYP |= seqType;
            },
        },
        print: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
                if (!ꐚLBRACKET()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
                if (!ꐚArray2ᱻ1()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
                if (!ꐚRBRACKET()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
                return true;
            },
            infer: () => {
                ꐚLBRACKET.infer();
                ꐚArray2ᱻ1.infer();
                ꐚRBRACKET.infer();
            },
        },
    });

    // SelectionExpression
    const ꐚArray2ᱻ1 = createRule(mode, {
        parse: {
            full: function SEL() { return ꐚElements() || ꐚArray2ᱻ2(); },
            infer: () => ꐚElements.infer(),
        },
        print: {
            full: function SEL() { return ꐚElements() || ꐚArray2ᱻ2(); },
            infer: () => ꐚElements.infer(),
        },
    });

    // ListExpression
    const ꐚArray2ᱻ2 = createRule(mode, {
        parse: {
            full: function LST() {
                const [APOSₒ, CPOSₒ] = [APOS, CPOS];
                if (APOS === 0) AREP = [];
                ATYP = LIST;
                return true;
            },
            infer: function LST() {
                if (APOS === 0) AREP = [];
                ATYP = LIST;
            },
        },
        print: {
            full: function LST() {
                if (ATYP !== LIST) return false;
                const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
                return true;
            },
            infer: function LST() {
                if (ATYP !== LIST && ATYP !== NOTHING) return false;
            },
        },
    });

    // ListExpression
    const ꐚElements = createRule(mode, {
        parse: {
            full: function LST() {
                const [APOSₒ, CPOSₒ] = [APOS, CPOS];
                if (APOS === 0) AREP = [];
                if (!parseValue(ꐚValue)) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                if (!ꐚElementsᱻ1()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                ATYP = LIST;
                return true;
            },
            infer: function LST() {
                if (APOS === 0) AREP = [];
                parseInferValue(ꐚValue.infer);
                ꐚElementsᱻ1.infer();
                ATYP = LIST;
            },
        },
        print: {
            full: function LST() {
                if (ATYP !== LIST) return false;
                const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
                if (!printValue(ꐚValue)) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
                ATYP = LIST;
                if (!ꐚElementsᱻ1()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
                return true;
            },
            infer: function LST() {
                if (ATYP !== LIST && ATYP !== NOTHING) return false;
                printInferValue(ꐚValue.infer);
                ATYP = LIST;
                ꐚElementsᱻ1.infer();
            },
        },
    });

    // SelectionExpression
    const ꐚElementsᱻ1 = createRule(mode, {
        parse: {
            full: function SEL() { return ꐚElementsᱻ2() || ꐚElementsᱻ3(); },
            infer: () => ꐚElementsᱻ2.infer(),
        },
        print: {
            full: function SEL() { return ꐚElementsᱻ2() || ꐚElementsᱻ3(); },
            infer: () => ꐚElementsᱻ2.infer(),
        },
    });

    // SequenceExpression
    const ꐚElementsᱻ2 = createRule(mode, {
        parse: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ] = [APOS, CPOS];
                let seqType = ATYP = NOTHING;
                if (!ꐚCOMMA()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                seqType |= ATYP;
                if (!ꐚElements()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                ATYP |= seqType;
                return true;
            },
            infer: () => {
                let seqType = ATYP = NOTHING;
                ꐚCOMMA.infer();
                seqType |= ATYP;
                ꐚElements.infer();
                ATYP |= seqType;
            },
        },
        print: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
                if (!ꐚCOMMA()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
                if (!ꐚElements()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
                return true;
            },
            infer: () => {
                ꐚCOMMA.infer();
                ꐚElements.infer();
            },
        },
    });

    // ListExpression
    const ꐚElementsᱻ3 = createRule(mode, {
        parse: {
            full: function LST() {
                const [APOSₒ, CPOSₒ] = [APOS, CPOS];
                if (APOS === 0) AREP = [];
                ATYP = LIST;
                return true;
            },
            infer: function LST() {
                if (APOS === 0) AREP = [];
                ATYP = LIST;
            },
        },
        print: {
            full: function LST() {
                if (ATYP !== LIST) return false;
                const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
                return true;
            },
            infer: function LST() {
                if (ATYP !== LIST && ATYP !== NOTHING) return false;
            },
        },
    });

    // Identifier
    const ꐚNumber = Object.assign(
        arg => ꐚfloatString(arg),
        {infer: arg => ꐚfloatString.infer(arg)},
    );

    // SequenceExpression
    const ꐚString = createRule(mode, {
        parse: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ] = [APOS, CPOS];
                let seqType = ATYP = NOTHING;
                if (!ꐚDOUBLE_QUOTE()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                seqType |= ATYP;
                if (!ꐚStringᱻ1()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                seqType |= ATYP;
                if (!ꐚDOUBLE_QUOTE()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                ATYP |= seqType;
                return true;
            },
            infer: () => {
                let seqType = ATYP = NOTHING;
                ꐚDOUBLE_QUOTE.infer();
                seqType |= ATYP;
                ꐚStringᱻ1.infer();
                seqType |= ATYP;
                ꐚDOUBLE_QUOTE.infer();
                ATYP |= seqType;
            },
        },
        print: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
                if (!ꐚDOUBLE_QUOTE()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
                if (!ꐚStringᱻ1()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
                if (!ꐚDOUBLE_QUOTE()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
                return true;
            },
            infer: () => {
                ꐚDOUBLE_QUOTE.infer();
                ꐚStringᱻ1.infer();
                ꐚDOUBLE_QUOTE.infer();
            },
        },
    });

    // QuantifiedExpression
    const ꐚStringᱻ1 = createRule(mode, {
        parse: {
            full: function QUA() {
                let [CPOSᐟ, APOSᐟ] = [CPOS, APOS];
                let seqType = ATYP = NOTHING;
                while (true) {
                    if (!ꐚCHAR() || CPOS <= CPOSᐟ) break;
                    seqType |= ATYP;
                    CPOSᐟ = CPOS, APOSᐟ = APOS;
                }
                CPOS = CPOSᐟ, APOS = APOSᐟ, ATYP = seqType;
                return true;
            },
            infer: () => (ATYP = NOTHING),
        },
        print: {
            full: function QUA() {
                let [APOSᐟ, CPOSᐟ] = [APOS, CPOS];
                while (true) {
                    if (!ꐚCHAR() || APOS <= APOSᐟ) break;
                    APOSᐟ = APOS, CPOSᐟ = CPOS;
                }
                APOS = APOSᐟ, CPOS = CPOSᐟ;
                return true;
            },
            infer: () => {},
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

    // NumericLiteral
    const ꐚminDigits = createRule(mode, {
        parse: {
            full: () => (emitScalar(4), true),
            infer: () => emitScalar(4),
        },
        print: {
            full: function LIT() {
                if (ATYP !== SCALAR) return false;
                if (AREP[APOS] !== 4) return false;
                APOS += 1;
                return true;
            },
            infer: () => {},
        },
        constant: 4,
    });

    // NumericLiteral
    const ꐚmaxDigits = createRule(mode, {
        parse: {
            full: () => (emitScalar(4), true),
            infer: () => emitScalar(4),
        },
        print: {
            full: function LIT() {
                if (ATYP !== SCALAR) return false;
                if (AREP[APOS] !== 4) return false;
                APOS += 1;
                return true;
            },
            infer: () => {},
        },
        constant: 4,
    });

    // SelectionExpression
    const ꐚCHAR = createRule(mode, {
        parse: {
            full: function SEL() { return ꐚCHARᱻ1() || ꐚCHARᱻ2() || ꐚCHARᱻ5() || ꐚCHARᱻ9() || ꐚCHARᱻ14() || ꐚCHARᱻ17() || ꐚCHARᱻ20() || ꐚCHARᱻ23() || ꐚCHARᱻ26() || ꐚCHARᱻ29() || ꐚCHARᱻ32() || ꐚCHARᱻ35() || ꐚCHARᱻ38(); },
            infer: () => ꐚCHARᱻ1.infer(),
        },
        print: {
            full: function SEL() { return ꐚCHARᱻ1() || ꐚCHARᱻ2() || ꐚCHARᱻ5() || ꐚCHARᱻ9() || ꐚCHARᱻ14() || ꐚCHARᱻ17() || ꐚCHARᱻ20() || ꐚCHARᱻ23() || ꐚCHARᱻ26() || ꐚCHARᱻ29() || ꐚCHARᱻ32() || ꐚCHARᱻ35() || ꐚCHARᱻ38(); },
            infer: () => ꐚCHARᱻ1.infer(),
        },
    });

    // ByteExpression
    const ꐚCHARᱻ1 = createRule(mode, {
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
            infer: () => {
                CREP[CPOS++] = 0x20;
            },
        },
    });

    // SequenceExpression
    const ꐚCHARᱻ2 = createRule(mode, {
        parse: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ] = [APOS, CPOS];
                let seqType = ATYP = NOTHING;
                if (!ꐚCHARᱻ3()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                seqType |= ATYP;
                if (!ꐚCHARᱻ4()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                ATYP |= seqType;
                return true;
            },
            infer: () => {
                let seqType = ATYP = NOTHING;
                ꐚCHARᱻ3.infer();
                seqType |= ATYP;
                ꐚCHARᱻ4.infer();
                ATYP |= seqType;
            },
        },
        print: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
                if (!ꐚCHARᱻ3()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
                if (!ꐚCHARᱻ4()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
                return true;
            },
            infer: () => {
                ꐚCHARᱻ3.infer();
                ꐚCHARᱻ4.infer();
            },
        },
    });

    // ByteExpression
    const ꐚCHARᱻ3 = createRule(mode, {
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
                if (ATYP !== STRING) return false;
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
    const ꐚCHARᱻ4 = createRule(mode, {
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
                if (ATYP !== STRING) return false;
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
    const ꐚCHARᱻ5 = createRule(mode, {
        parse: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ] = [APOS, CPOS];
                let seqType = ATYP = NOTHING;
                if (!ꐚCHARᱻ6()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                seqType |= ATYP;
                if (!ꐚCHARᱻ7()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                seqType |= ATYP;
                if (!ꐚCHARᱻ8()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                ATYP |= seqType;
                return true;
            },
            infer: () => {
                let seqType = ATYP = NOTHING;
                ꐚCHARᱻ6.infer();
                seqType |= ATYP;
                ꐚCHARᱻ7.infer();
                seqType |= ATYP;
                ꐚCHARᱻ8.infer();
                ATYP |= seqType;
            },
        },
        print: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
                if (!ꐚCHARᱻ6()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
                if (!ꐚCHARᱻ7()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
                if (!ꐚCHARᱻ8()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
                return true;
            },
            infer: () => {
                ꐚCHARᱻ6.infer();
                ꐚCHARᱻ7.infer();
                ꐚCHARᱻ8.infer();
            },
        },
    });

    // ByteExpression
    const ꐚCHARᱻ6 = createRule(mode, {
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
                if (ATYP !== STRING) return false;
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
    const ꐚCHARᱻ7 = createRule(mode, {
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
                if (ATYP !== STRING) return false;
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
    const ꐚCHARᱻ8 = createRule(mode, {
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
                if (ATYP !== STRING) return false;
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
    const ꐚCHARᱻ9 = createRule(mode, {
        parse: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ] = [APOS, CPOS];
                let seqType = ATYP = NOTHING;
                if (!ꐚCHARᱻ10()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                seqType |= ATYP;
                if (!ꐚCHARᱻ11()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                seqType |= ATYP;
                if (!ꐚCHARᱻ12()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                seqType |= ATYP;
                if (!ꐚCHARᱻ13()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                ATYP |= seqType;
                return true;
            },
            infer: () => {
                let seqType = ATYP = NOTHING;
                ꐚCHARᱻ10.infer();
                seqType |= ATYP;
                ꐚCHARᱻ11.infer();
                seqType |= ATYP;
                ꐚCHARᱻ12.infer();
                seqType |= ATYP;
                ꐚCHARᱻ13.infer();
                ATYP |= seqType;
            },
        },
        print: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
                if (!ꐚCHARᱻ10()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
                if (!ꐚCHARᱻ11()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
                if (!ꐚCHARᱻ12()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
                if (!ꐚCHARᱻ13()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
                return true;
            },
            infer: () => {
                ꐚCHARᱻ10.infer();
                ꐚCHARᱻ11.infer();
                ꐚCHARᱻ12.infer();
                ꐚCHARᱻ13.infer();
            },
        },
    });

    // ByteExpression
    const ꐚCHARᱻ10 = createRule(mode, {
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
                if (ATYP !== STRING) return false;
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
    const ꐚCHARᱻ11 = createRule(mode, {
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
                if (ATYP !== STRING) return false;
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
    const ꐚCHARᱻ12 = createRule(mode, {
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
                if (ATYP !== STRING) return false;
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
    const ꐚCHARᱻ13 = createRule(mode, {
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
                if (ATYP !== STRING) return false;
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
    const ꐚCHARᱻ14 = createRule(mode, {
        parse: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ] = [APOS, CPOS];
                let seqType = ATYP = NOTHING;
                if (!ꐚCHARᱻ15()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                seqType |= ATYP;
                if (!ꐚCHARᱻ16()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                ATYP |= seqType;
                return true;
            },
            infer: () => {
                let seqType = ATYP = NOTHING;
                ꐚCHARᱻ15.infer();
                seqType |= ATYP;
                ꐚCHARᱻ16.infer();
                ATYP |= seqType;
            },
        },
        print: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
                if (!ꐚCHARᱻ15()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
                if (!ꐚCHARᱻ16()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
                return true;
            },
            infer: () => {
                ꐚCHARᱻ15.infer();
                ꐚCHARᱻ16.infer();
            },
        },
    });

    // StringLiteral
    const ꐚCHARᱻ15 = createRule(mode, {
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
        constant: "\\\"",
    });

    // ByteExpression
    const ꐚCHARᱻ16 = createRule(mode, {
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
                if (ATYP !== STRING) return false;
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
    const ꐚCHARᱻ17 = createRule(mode, {
        parse: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ] = [APOS, CPOS];
                let seqType = ATYP = NOTHING;
                if (!ꐚCHARᱻ18()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                seqType |= ATYP;
                if (!ꐚCHARᱻ19()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                ATYP |= seqType;
                return true;
            },
            infer: () => {
                let seqType = ATYP = NOTHING;
                ꐚCHARᱻ18.infer();
                seqType |= ATYP;
                ꐚCHARᱻ19.infer();
                ATYP |= seqType;
            },
        },
        print: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
                if (!ꐚCHARᱻ18()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
                if (!ꐚCHARᱻ19()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
                return true;
            },
            infer: () => {
                ꐚCHARᱻ18.infer();
                ꐚCHARᱻ19.infer();
            },
        },
    });

    // StringLiteral
    const ꐚCHARᱻ18 = createRule(mode, {
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
        constant: "\\\\",
    });

    // ByteExpression
    const ꐚCHARᱻ19 = createRule(mode, {
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
                if (ATYP !== STRING) return false;
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
    const ꐚCHARᱻ20 = createRule(mode, {
        parse: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ] = [APOS, CPOS];
                let seqType = ATYP = NOTHING;
                if (!ꐚCHARᱻ21()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                seqType |= ATYP;
                if (!ꐚCHARᱻ22()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                ATYP |= seqType;
                return true;
            },
            infer: () => {
                let seqType = ATYP = NOTHING;
                ꐚCHARᱻ21.infer();
                seqType |= ATYP;
                ꐚCHARᱻ22.infer();
                ATYP |= seqType;
            },
        },
        print: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
                if (!ꐚCHARᱻ21()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
                if (!ꐚCHARᱻ22()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
                return true;
            },
            infer: () => {
                ꐚCHARᱻ21.infer();
                ꐚCHARᱻ22.infer();
            },
        },
    });

    // StringLiteral
    const ꐚCHARᱻ21 = createRule(mode, {
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
        constant: "\\/",
    });

    // ByteExpression
    const ꐚCHARᱻ22 = createRule(mode, {
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
                if (ATYP !== STRING) return false;
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
    const ꐚCHARᱻ23 = createRule(mode, {
        parse: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ] = [APOS, CPOS];
                let seqType = ATYP = NOTHING;
                if (!ꐚCHARᱻ24()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                seqType |= ATYP;
                if (!ꐚCHARᱻ25()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                ATYP |= seqType;
                return true;
            },
            infer: () => {
                let seqType = ATYP = NOTHING;
                ꐚCHARᱻ24.infer();
                seqType |= ATYP;
                ꐚCHARᱻ25.infer();
                ATYP |= seqType;
            },
        },
        print: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
                if (!ꐚCHARᱻ24()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
                if (!ꐚCHARᱻ25()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
                return true;
            },
            infer: () => {
                ꐚCHARᱻ24.infer();
                ꐚCHARᱻ25.infer();
            },
        },
    });

    // StringLiteral
    const ꐚCHARᱻ24 = createRule(mode, {
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
        constant: "\\b",
    });

    // ByteExpression
    const ꐚCHARᱻ25 = createRule(mode, {
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
                if (ATYP !== STRING) return false;
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
    const ꐚCHARᱻ26 = createRule(mode, {
        parse: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ] = [APOS, CPOS];
                let seqType = ATYP = NOTHING;
                if (!ꐚCHARᱻ27()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                seqType |= ATYP;
                if (!ꐚCHARᱻ28()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                ATYP |= seqType;
                return true;
            },
            infer: () => {
                let seqType = ATYP = NOTHING;
                ꐚCHARᱻ27.infer();
                seqType |= ATYP;
                ꐚCHARᱻ28.infer();
                ATYP |= seqType;
            },
        },
        print: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
                if (!ꐚCHARᱻ27()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
                if (!ꐚCHARᱻ28()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
                return true;
            },
            infer: () => {
                ꐚCHARᱻ27.infer();
                ꐚCHARᱻ28.infer();
            },
        },
    });

    // StringLiteral
    const ꐚCHARᱻ27 = createRule(mode, {
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
        constant: "\\f",
    });

    // ByteExpression
    const ꐚCHARᱻ28 = createRule(mode, {
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
                if (ATYP !== STRING) return false;
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
    const ꐚCHARᱻ29 = createRule(mode, {
        parse: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ] = [APOS, CPOS];
                let seqType = ATYP = NOTHING;
                if (!ꐚCHARᱻ30()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                seqType |= ATYP;
                if (!ꐚCHARᱻ31()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                ATYP |= seqType;
                return true;
            },
            infer: () => {
                let seqType = ATYP = NOTHING;
                ꐚCHARᱻ30.infer();
                seqType |= ATYP;
                ꐚCHARᱻ31.infer();
                ATYP |= seqType;
            },
        },
        print: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
                if (!ꐚCHARᱻ30()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
                if (!ꐚCHARᱻ31()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
                return true;
            },
            infer: () => {
                ꐚCHARᱻ30.infer();
                ꐚCHARᱻ31.infer();
            },
        },
    });

    // StringLiteral
    const ꐚCHARᱻ30 = createRule(mode, {
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
        constant: "\\n",
    });

    // ByteExpression
    const ꐚCHARᱻ31 = createRule(mode, {
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
                if (ATYP !== STRING) return false;
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
    const ꐚCHARᱻ32 = createRule(mode, {
        parse: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ] = [APOS, CPOS];
                let seqType = ATYP = NOTHING;
                if (!ꐚCHARᱻ33()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                seqType |= ATYP;
                if (!ꐚCHARᱻ34()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                ATYP |= seqType;
                return true;
            },
            infer: () => {
                let seqType = ATYP = NOTHING;
                ꐚCHARᱻ33.infer();
                seqType |= ATYP;
                ꐚCHARᱻ34.infer();
                ATYP |= seqType;
            },
        },
        print: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
                if (!ꐚCHARᱻ33()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
                if (!ꐚCHARᱻ34()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
                return true;
            },
            infer: () => {
                ꐚCHARᱻ33.infer();
                ꐚCHARᱻ34.infer();
            },
        },
    });

    // StringLiteral
    const ꐚCHARᱻ33 = createRule(mode, {
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
        constant: "\\r",
    });

    // ByteExpression
    const ꐚCHARᱻ34 = createRule(mode, {
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
                if (ATYP !== STRING) return false;
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
    const ꐚCHARᱻ35 = createRule(mode, {
        parse: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ] = [APOS, CPOS];
                let seqType = ATYP = NOTHING;
                if (!ꐚCHARᱻ36()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                seqType |= ATYP;
                if (!ꐚCHARᱻ37()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                ATYP |= seqType;
                return true;
            },
            infer: () => {
                let seqType = ATYP = NOTHING;
                ꐚCHARᱻ36.infer();
                seqType |= ATYP;
                ꐚCHARᱻ37.infer();
                ATYP |= seqType;
            },
        },
        print: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
                if (!ꐚCHARᱻ36()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
                if (!ꐚCHARᱻ37()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
                return true;
            },
            infer: () => {
                ꐚCHARᱻ36.infer();
                ꐚCHARᱻ37.infer();
            },
        },
    });

    // StringLiteral
    const ꐚCHARᱻ36 = createRule(mode, {
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
        constant: "\\t",
    });

    // ByteExpression
    const ꐚCHARᱻ37 = createRule(mode, {
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
                if (ATYP !== STRING) return false;
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
    const ꐚCHARᱻ38 = createRule(mode, {
        parse: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ] = [APOS, CPOS];
                let seqType = ATYP = NOTHING;
                if (!ꐚCHARᱻ39()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                seqType |= ATYP;
                if (!ꐚCHARᱻ40()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                ATYP |= seqType;
                return true;
            },
            infer: () => {
                let seqType = ATYP = NOTHING;
                ꐚCHARᱻ39.infer();
                seqType |= ATYP;
                ꐚCHARᱻ40.infer();
                ATYP |= seqType;
            },
        },
        print: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
                if (!ꐚCHARᱻ39()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
                if (!ꐚCHARᱻ40()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
                return true;
            },
            infer: () => {
                ꐚCHARᱻ39.infer();
                ꐚCHARᱻ40.infer();
            },
        },
    });

    // StringLiteral
    const ꐚCHARᱻ39 = createRule(mode, {
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
        constant: "\\u",
    });

    // ApplicationExpression
    const ꐚCHARᱻ40 = lazy(() => ꐚunicode(ꐚCHARᱻ41));

    // Module
    const ꐚCHARᱻ41 = (member) => {
        switch (member) {
            case 'base': return ꐚbase;
            case 'minDigits': return ꐚminDigits;
            case 'maxDigits': return ꐚmaxDigits;
            default: return undefined;
        }
    };

    // SequenceExpression
    const ꐚLBRACE = createRule(mode, {
        parse: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ] = [APOS, CPOS];
                let seqType = ATYP = NOTHING;
                if (!ꐚWS()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                seqType |= ATYP;
                if (!ꐚLBRACEᱻ1()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                seqType |= ATYP;
                if (!ꐚWS()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                ATYP |= seqType;
                return true;
            },
            infer: () => {
                let seqType = ATYP = NOTHING;
                ꐚWS.infer();
                seqType |= ATYP;
                ꐚLBRACEᱻ1.infer();
                seqType |= ATYP;
                ꐚWS.infer();
                ATYP |= seqType;
            },
        },
        print: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
                if (!ꐚWS()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
                if (!ꐚLBRACEᱻ1()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
                if (!ꐚWS()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
                return true;
            },
            infer: () => {
                ꐚWS.infer();
                ꐚLBRACEᱻ1.infer();
                ꐚWS.infer();
            },
        },
    });

    // ByteExpression
    const ꐚLBRACEᱻ1 = createRule(mode, {
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
    const ꐚRBRACE = createRule(mode, {
        parse: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ] = [APOS, CPOS];
                let seqType = ATYP = NOTHING;
                if (!ꐚWS()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                seqType |= ATYP;
                if (!ꐚRBRACEᱻ1()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                seqType |= ATYP;
                if (!ꐚWS()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                ATYP |= seqType;
                return true;
            },
            infer: () => {
                let seqType = ATYP = NOTHING;
                ꐚWS.infer();
                seqType |= ATYP;
                ꐚRBRACEᱻ1.infer();
                seqType |= ATYP;
                ꐚWS.infer();
                ATYP |= seqType;
            },
        },
        print: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
                if (!ꐚWS()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
                if (!ꐚRBRACEᱻ1()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
                if (!ꐚWS()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
                return true;
            },
            infer: () => {
                ꐚWS.infer();
                ꐚRBRACEᱻ1.infer();
                ꐚWS.infer();
            },
        },
    });

    // ByteExpression
    const ꐚRBRACEᱻ1 = createRule(mode, {
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
    const ꐚLBRACKET = createRule(mode, {
        parse: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ] = [APOS, CPOS];
                let seqType = ATYP = NOTHING;
                if (!ꐚWS()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                seqType |= ATYP;
                if (!ꐚLBRACKETᱻ1()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                seqType |= ATYP;
                if (!ꐚWS()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                ATYP |= seqType;
                return true;
            },
            infer: () => {
                let seqType = ATYP = NOTHING;
                ꐚWS.infer();
                seqType |= ATYP;
                ꐚLBRACKETᱻ1.infer();
                seqType |= ATYP;
                ꐚWS.infer();
                ATYP |= seqType;
            },
        },
        print: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
                if (!ꐚWS()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
                if (!ꐚLBRACKETᱻ1()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
                if (!ꐚWS()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
                return true;
            },
            infer: () => {
                ꐚWS.infer();
                ꐚLBRACKETᱻ1.infer();
                ꐚWS.infer();
            },
        },
    });

    // ByteExpression
    const ꐚLBRACKETᱻ1 = createRule(mode, {
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
    const ꐚRBRACKET = createRule(mode, {
        parse: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ] = [APOS, CPOS];
                let seqType = ATYP = NOTHING;
                if (!ꐚWS()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                seqType |= ATYP;
                if (!ꐚRBRACKETᱻ1()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                seqType |= ATYP;
                if (!ꐚWS()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                ATYP |= seqType;
                return true;
            },
            infer: () => {
                let seqType = ATYP = NOTHING;
                ꐚWS.infer();
                seqType |= ATYP;
                ꐚRBRACKETᱻ1.infer();
                seqType |= ATYP;
                ꐚWS.infer();
                ATYP |= seqType;
            },
        },
        print: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
                if (!ꐚWS()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
                if (!ꐚRBRACKETᱻ1()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
                if (!ꐚWS()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
                return true;
            },
            infer: () => {
                ꐚWS.infer();
                ꐚRBRACKETᱻ1.infer();
                ꐚWS.infer();
            },
        },
    });

    // ByteExpression
    const ꐚRBRACKETᱻ1 = createRule(mode, {
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
    const ꐚCOLON = createRule(mode, {
        parse: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ] = [APOS, CPOS];
                let seqType = ATYP = NOTHING;
                if (!ꐚWS()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                seqType |= ATYP;
                if (!ꐚCOLONᱻ1()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                seqType |= ATYP;
                if (!ꐚWS()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                ATYP |= seqType;
                return true;
            },
            infer: () => {
                let seqType = ATYP = NOTHING;
                ꐚWS.infer();
                seqType |= ATYP;
                ꐚCOLONᱻ1.infer();
                seqType |= ATYP;
                ꐚWS.infer();
                ATYP |= seqType;
            },
        },
        print: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
                if (!ꐚWS()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
                if (!ꐚCOLONᱻ1()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
                if (!ꐚWS()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
                return true;
            },
            infer: () => {
                ꐚWS.infer();
                ꐚCOLONᱻ1.infer();
                ꐚWS.infer();
            },
        },
    });

    // ByteExpression
    const ꐚCOLONᱻ1 = createRule(mode, {
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
    const ꐚCOMMA = createRule(mode, {
        parse: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ] = [APOS, CPOS];
                let seqType = ATYP = NOTHING;
                if (!ꐚWS()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                seqType |= ATYP;
                if (!ꐚCOMMAᱻ1()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                seqType |= ATYP;
                if (!ꐚWS()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                ATYP |= seqType;
                return true;
            },
            infer: () => {
                let seqType = ATYP = NOTHING;
                ꐚWS.infer();
                seqType |= ATYP;
                ꐚCOMMAᱻ1.infer();
                seqType |= ATYP;
                ꐚWS.infer();
                ATYP |= seqType;
            },
        },
        print: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ, ATYPₒ] = [APOS, CPOS, ATYP];
                if (!ꐚWS()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
                if (!ꐚCOMMAᱻ1()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
                if (!ꐚWS()) return [APOS, CPOS, ATYP] = [APOSₒ, CPOSₒ, ATYPₒ], false;
                return true;
            },
            infer: () => {
                ꐚWS.infer();
                ꐚCOMMAᱻ1.infer();
                ꐚWS.infer();
            },
        },
    });

    // ByteExpression
    const ꐚCOMMAᱻ1 = createRule(mode, {
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
    const ꐚDOUBLE_QUOTE = createRule(mode, {
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
    const ꐚWS = createRule(mode, {
        parse: {
            full: function QUA() {
                let [CPOSᐟ, APOSᐟ] = [CPOS, APOS];
                let seqType = ATYP = NOTHING;
                while (true) {
                    if (!ꐚWSᱻ1() || CPOS <= CPOSᐟ) break;
                    seqType |= ATYP;
                    CPOSᐟ = CPOS, APOSᐟ = APOS;
                }
                CPOS = CPOSᐟ, APOS = APOSᐟ, ATYP = seqType;
                return true;
            },
            infer: () => (ATYP = NOTHING),
        },
        print: {
            full: function QUA() {
                let [APOSᐟ, CPOSᐟ] = [APOS, CPOS];
                while (true) {
                    if (!ꐚWSᱻ1() || APOS <= APOSᐟ) break;
                    APOSᐟ = APOS, CPOSᐟ = CPOS;
                }
                APOS = APOSᐟ, CPOS = CPOSᐟ;
                return true;
            },
            infer: () => {},
        },
    });

    // ByteExpression
    const ꐚWSᱻ1 = createRule(mode, {
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
    const ꐚMODːjson = (member) => {
        switch (member) {
            case 'floatString': return ꐚfloatString;
            case 'unicode': return ꐚunicode;
            case 'start': return ꐚstartᱻ2;
            case 'Value': return ꐚValue;
            case 'False': return ꐚFalse;
            case 'Null': return ꐚNull;
            case 'True': return ꐚTrue;
            case 'Object': return ꐚObject;
            case 'Object2': return ꐚObject2;
            case 'Properties': return ꐚProperties;
            case 'Array': return ꐚArray;
            case 'Array2': return ꐚArray2;
            case 'Elements': return ꐚElements;
            case 'Number': return ꐚNumber;
            case 'String': return ꐚString;
            case 'CHAR': return ꐚCHAR;
            case 'LBRACE': return ꐚLBRACE;
            case 'RBRACE': return ꐚRBRACE;
            case 'LBRACKET': return ꐚLBRACKET;
            case 'RBRACKET': return ꐚRBRACKET;
            case 'COLON': return ꐚCOLON;
            case 'COMMA': return ꐚCOMMA;
            case 'DOUBLE_QUOTE': return ꐚDOUBLE_QUOTE;
            case 'WS': return ꐚWS;
            default: return undefined;
        }
    };

    // Intrinsic
    const ꐚfloatStringᱻ2 = extensions["V:/projects/oss/pen-monorepo/packages/core/penc/dist/deps/std.pen.js"].floatString(mode);

    // Intrinsic
    const ꐚintString = extensions["V:/projects/oss/pen-monorepo/packages/core/penc/dist/deps/std.pen.js"].intString(mode);

    // Intrinsic
    const ꐚmemoise = extensions["V:/projects/oss/pen-monorepo/packages/core/penc/dist/deps/std.pen.js"].memoise(mode);

    // Module
    const ꐚMODːstd = (member) => {
        switch (member) {
            case 'floatString': return ꐚfloatStringᱻ2;
            case 'intString': return ꐚintString;
            case 'memoise': return ꐚmemoise;
            default: return undefined;
        }
    };

    // Intrinsic
    const ꐚunicodeᱻ2 = extensions["V:/projects/oss/pen-monorepo/packages/core/penc/dist/deps/experiments.pen.js"].unicode(mode);

    // Module
    const ꐚMODːexperiments = (member) => {
        switch (member) {
            case 'unicode': return ꐚunicodeᱻ2;
            default: return undefined;
        }
    };

    return ꐚstartᱻ2;
}
