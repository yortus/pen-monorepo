
// ------------------------------ Main exports ------------------------------
module.exports = {
    parse(stringOrBuffer) {
        return parse(parseStartRule, stringOrBuffer);
    },
    print(value, buffer) {
        return print(printStartRule, value, buffer);
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
function parse(startRule, stringOrBuffer) {
    IREP = Buffer.isBuffer(stringOrBuffer) ? stringOrBuffer : Buffer.from(stringOrBuffer, 'utf8');
    IPOS = 0;
    OREP = [];
    OPOS = 0;
    if (!parseValue(startRule))
        throw new Error('parse failed');
    if (IPOS !== IREP.length)
        throw new Error('parse didn\\\'t consume entire input');
    if (OPOS !== 1)
        throw new Error('parse didn\\\'t produce a singular value');
    return OREP[0];
}
function print(startRule, value, buffer) {
    IREP = [value];
    IPOS = 0;
    const buf = OREP = buffer !== null && buffer !== void 0 ? buffer : Buffer.alloc(2 ** 22);
    OPOS = 0;
    if (!printValue(startRule))
        throw new Error('print failed');
    if (OPOS > OREP.length)
        throw new Error('output buffer too small');
    return buffer ? OPOS : buf.toString('utf8', 0, OPOS);
}
function assert(value, message) {
    if (!value)
        throw new Error(`Assertion failed: ${message !== null && message !== void 0 ? message : 'no further details'}`);
}
function isObject(value) {
    return value !== null && typeof value === 'object';
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
let IREP;
let IPOS = 0;
let OREP;
let OPOS = 0;
let ATYP = 0;
const [NOTHING, SCALAR, STRING_CHARS, LIST_ELEMENTS, RECORD_FIELDS] = [0, 1, 2, 4, 8];
function parseValue(rule) {
    const OPOSₒ = OPOS, ATYPₒ = ATYP;
    ATYP = NOTHING;
    if (!rule())
        return ATYP = ATYPₒ, false;
    if (ATYP === NOTHING)
        return OPOS = OPOSₒ, ATYP = ATYPₒ, false;
    let value;
    switch (ATYP) {
        case SCALAR:
            assert(OPOS === OPOSₒ + 1);
            value = OREP[OPOSₒ];
            break;
        case STRING_CHARS:
            const len = OPOS - OPOSₒ;
            for (let i = 0; i < len; ++i)
                _internalBuffer[i] = OREP[OPOSₒ + i];
            value = _internalBuffer.toString('utf8', 0, len);
            break;
        case LIST_ELEMENTS:
            value = OREP.slice(OPOSₒ, OPOS);
            break;
        case RECORD_FIELDS:
            const obj = value = {};
            for (let i = OPOSₒ; i < OPOS; i += 2)
                obj[OREP[i]] = OREP[i + 1];
            if (Object.keys(obj).length * 2 < (OPOS - OPOSₒ))
                throw new Error(`Duplicate labels in record`);
            break;
        default:
            ((atyp) => { throw new Error(`Unhandled abstract type ${atyp}`); })(ATYP);
    }
    OREP[OPOSₒ] = value;
    OPOS = OPOSₒ + 1;
    ATYP = ATYPₒ;
    return true;
}
function printValue(rule) {
    const IPOSₒ = IPOS, IREPₒ = IREP, ATYPₒ = ATYP;
    let value = IREP[IPOS];
    let atyp;
    let objKeys;
    if (value === undefined) {
        return false;
    }
    if (value === null || value === true || value === false || typeof value === 'number') {
        ATYP = SCALAR;
        const result = rule();
        ATYP = ATYPₒ;
        assert(IPOS === IPOSₒ + 1);
        return result;
    }
    if (typeof value === 'string') {
        const len = _internalBuffer.write(value, 0, undefined, 'utf8');
        IREP = _internalBuffer.slice(0, len);
        atyp = ATYP = STRING_CHARS;
    }
    else if (Array.isArray(value)) {
        IREP = value;
        atyp = ATYP = LIST_ELEMENTS;
    }
    else if (isObject(value)) {
        const arr = IREP = [];
        objKeys = Object.keys(value);
        assert(objKeys.length < 32);
        for (let i = 0; i < objKeys.length; ++i)
            arr.push(objKeys[i], value[objKeys[i]]);
        atyp = ATYP = RECORD_FIELDS;
    }
    else {
        throw new Error(`Unsupported value type for value ${value}`);
    }
    IPOS = 0;
    let result = rule();
    const ipos = IPOS, ilen = IREP.length;
    IREP = IREPₒ, IPOS = IPOSₒ, ATYP = ATYPₒ;
    if (!result)
        return false;
    if (atyp === RECORD_FIELDS) {
        const keyCount = objKeys.length;
        if (keyCount > 0 && (ipos !== -1 >>> (32 - keyCount)))
            return false;
    }
    else {
        if (ipos !== ilen)
            return false;
    }
    IPOS += 1;
    return true;
}
const _internalBuffer = Buffer.alloc(2 ** 16);




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
                        const IPOSₒ = IPOS, OPOSₒ = OPOS;
                        const irep = IREP; // IREP is always a Buffer when parsing
                        const ilen = IREP.length;
                        const EOS = 0;
                        let digitCount = 0;
                        // Parse optional '+' or '-' sign
                        let cc = irep[IPOS];
                        if (cc === PLUS_SIGN || cc === MINUS_SIGN) {
                            IPOS += 1;
                            cc = IPOS < ilen ? irep[IPOS] : EOS;
                        }
                        // Parse 0..M digits
                        while (true) {
                            if (cc < ZERO_DIGIT || cc > NINE_DIGIT)
                                break;
                            digitCount += 1;
                            IPOS += 1;
                            cc = IPOS < ilen ? irep[IPOS] : EOS;
                        }
                        // Parse optional '.'
                        if (cc === DECIMAL_POINT) {
                            IPOS += 1;
                            cc = IPOS < ilen ? irep[IPOS] : EOS;
                        }
                        // Parse 0..M digits
                        while (true) {
                            if (cc < ZERO_DIGIT || cc > NINE_DIGIT)
                                break;
                            digitCount += 1;
                            IPOS += 1;
                            cc = IPOS < ilen ? irep[IPOS] : EOS;
                        }
                        // Ensure we have parsed at least one significant digit
                        if (digitCount === 0)
                            return IPOS = IPOSₒ, OPOS = OPOSₒ, false;
                        // Parse optional exponent
                        if (cc === UPPERCASE_E || cc === LOWERCASE_E) {
                            IPOS += 1;
                            cc = IPOS < ilen ? irep[IPOS] : EOS;
                            // Parse optional '+' or '-' sign
                            if (cc === PLUS_SIGN || cc === MINUS_SIGN) {
                                IPOS += 1;
                                cc = IPOS < ilen ? irep[IPOS] : EOS;
                            }
                            // Parse 1..M digits
                            digitCount = 0;
                            while (true) {
                                if (cc < ZERO_DIGIT || cc > NINE_DIGIT)
                                    break;
                                digitCount += 1;
                                IPOS += 1;
                                cc = IPOS < ilen ? irep[IPOS] : EOS;
                            }
                            if (digitCount === 0)
                                return IPOS = IPOSₒ, OPOS = OPOSₒ, false;
                        }
                        // There is a syntactically valid float. Delegate parsing to the JS runtime.
                        // Reject the number if it parses to Infinity or Nan.
                        // TODO: the conversion may still be lossy. Provide a non-lossy mode, like `safenum` does?
                        const num = Number.parseFloat(irep.toString('utf8', IPOSₒ, IPOS));
                        if (!Number.isFinite(num))
                            return IPOS = IPOSₒ, OPOS = OPOSₒ, false;
                        // Success
                        OREP[OPOS++] = num;
                        ATYP |= SCALAR;
                        return true;
                    },
                    infer: function ISTR() {
                        OREP[OPOS++] = 0;
                        ATYP |= SCALAR;
                        return true;
                    },
                },
                print: {
                    full: function FSTR() {
                        if (ATYP !== SCALAR)
                            return false;
                        const orep = OREP; // OREP is always a Buffer when printing
                        const num = IREP[IPOS];
                        if (typeof num !== 'number')
                            return false;
                        IPOS += 1;
                        // Delegate unparsing to the JS runtime.
                        // TODO: the conversion may not exactly match the original string. Add this to the lossiness list.
                        const out = String(num);
                        // Success
                        OPOS += orep.write(out, OPOS, undefined, 'utf8');
                        return true;
                    },
                    infer: function FSTR() {
                        OREP[OPOS++] = ZERO_DIGIT;
                        return true;
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
                            const IPOSₒ = IPOS, OPOSₒ = OPOS;
                            const irep = IREP; // IREP is always a Buffer when parsing
                            const ilen = IREP.length;
                            // Parse optional leading '-' sign (if signed)...
                            let MAX_NUM = signed ? 0x7FFFFFFF : 0xFFFFFFFF;
                            let isNegative = false;
                            if (signed && IPOS < ilen && IREP[IPOS] === HYPHEN) {
                                isNegative = true;
                                MAX_NUM = 0x80000000;
                                IPOS += 1;
                            }
                            // ...followed by one or more decimal digits. (NB: no exponents).
                            let num = 0;
                            let digits = 0;
                            while (IPOS < ilen) {
                                // Read a digit.
                                let c = irep[IPOS];
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
                                    return IPOS = IPOSₒ, OPOS = OPOSₒ, false;
                                // Loop again.
                                IPOS += 1;
                                digits += 1;
                            }
                            // Check that we parsed at least one digit.
                            if (digits === 0)
                                return IPOS = IPOSₒ, OPOS = OPOSₒ, false;
                            // Apply the sign.
                            if (isNegative)
                                num = -num;
                            // Success
                            OREP[OPOS++] = num;
                            ATYP |= SCALAR;
                            return true;
                        },
                        infer: function ISTR() {
                            OREP[OPOS++] = 0;
                            ATYP |= SCALAR;
                            return true;
                        },
                    },
                    print: {
                        full: function ISTR() {
                            if (ATYP !== SCALAR)
                                return false;
                            let num = IREP[IPOS];
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
                            const digits = [];
                            while (true) {
                                const d = num % base;
                                num = (num / base) | 0;
                                digits.push(CHAR_CODES[d]);
                                if (num === 0)
                                    break;
                            }
                            // Compute the final string.
                            IPOS += 1;
                            if (isNegative)
                                digits.push(HYPHEN);
                            // Success
                            for (let i = 0; i < digits.length; ++i) {
                                OREP[OPOS++] = digits[i];
                            }
                            return true;
                        },
                        infer: function ISTR() {
                            OREP[OPOS++] = CHAR_CODES[0];
                            return true;
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
                            const IPOSₒ = IPOS, OPOSₒ = OPOS, ATYPₒ = ATYP;
                            // Check whether the memo table already has an entry for the given initial state.
                            let memos2 = memos.get(IREP);
                            if (memos2 === undefined) {
                                memos2 = new Map();
                                memos.set(IREP, memos2);
                            }
                            let memo = memos2.get(IPOS);
                            if (!memo) {
                                // The memo table does *not* have an entry, so this is the first attempt to apply this rule with
                                // this initial state. The first thing we do is create a memo table entry, which is marked as
                                // *unresolved*. All future applications of this rule with the same initial state will find this
                                // memo. If a future application finds the memo still unresolved, then we know we have encountered
                                // left-recursion.
                                memo = { resolved: false, isLeftRecursive: false, result: false, IPOSᐟ: IPOSₒ, OREPᐞ: [], ATYPᐟ: NOTHING };
                                memos2.set(IPOS, memo);
                                // Now that the unresolved memo is in place, apply the rule, and resolve the memo with the result.
                                // At this point, any left-recursive paths encountered during application are guaranteed to have
                                // been noted and aborted (see below).
                                if (expr()) { // TODO: fix cast
                                    memo.result = true;
                                    memo.IPOSᐟ = IPOS;
                                    memo.OREPᐞ = OREP.slice(OPOSₒ, OPOS);
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
                                    IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ;
                                    // TODO: break cases for UNPARSING:
                                    // anything --> same thing (covers all string cases, since they can only be same or shorter)
                                    // some node --> some different non-empty node (assert: should never happen!)
                                    if (!expr())
                                        break; // TODO: fix cast
                                    if (IPOS <= memo.IPOSᐟ)
                                        break;
                                    // TODO: was for unparse... comment above says should never happen...
                                    // if (!isInputFullyConsumed()) break;
                                    memo.IPOSᐟ = IPOS;
                                    memo.OREPᐞ = OREP.slice(OPOSₒ, OPOS);
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
                            OPOS = OPOSₒ;
                            IPOS = memo.IPOSᐟ;
                            for (let i = 0; i < memo.OREPᐞ.length; ++i)
                                OREP[OPOS++] = memo.OREPᐞ[i];
                            return memo.result;
                        },
                        infer: function MEM() {
                            // TODO: implement...
                            throw new Error('memoise parse.infer: Not implemented');
                        },
                    },
                    print: {
                        full: function MEM() {
                            // TODO: do we ever want to memoise AST-->test? Eg for left-rec text-->text mappings?
                            // TODO: just pass-thru for now...
                            return expr();
                        },
                        infer: function MEM() {
                            // TODO: implement...
                            throw new Error('memoise print.infer: Not implemented');
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
                            const IPOSₒ = IPOS, OPOSₒ = OPOS;
                            const irep = IREP; // IREP is always a Buffer when parsing
                            const ilen = IREP.length;
                            const EOS = '';
                            let len = 0;
                            let num = ''; // TODO: fix this - should actually keep count
                            let c = IPOS < ilen ? String.fromCharCode(irep[IPOS]) : EOS; // TODO: convoluted - simplify whole method
                            while (true) {
                                if (!regex.test(c))
                                    break;
                                num += c;
                                IPOS += 1;
                                len += 1;
                                if (len === maxDigits)
                                    break;
                                c = IPOS < ilen ? String.fromCharCode(irep[IPOS]) : EOS;
                            }
                            if (len < minDigits)
                                return IPOS = IPOSₒ, OPOS = OPOSₒ, false;
                            // tslint:disable-next-line: no-eval
                            const buf = Buffer.from(eval(`"\\u{${num}}"`)); // TODO: hacky... fix when we have a charCode
                            for (let i = 0; i < buf.length; ++i)
                                OREP[OPOS++] = buf[i];
                            ATYP |= STRING_CHARS;
                            return true;
                        },
                        infer: function UNI() {
                            // TODO: generate default value...
                            throw new Error('unicode parse.infer: Not implemented');
                        },
                    },
                    print: {
                        full: function UNI() {
                            const ilen = IREP.length;
                            if (ATYP !== STRING_CHARS || IPOS >= ilen)
                                return false;
                            const IPOSₒ = IPOS, OPOSₒ = OPOS;
                            const irep = IREP; // IREP is a Buffer when ATYP === STRING_CHARS
                            const orep = OREP; // OREP is always a Buffer when printing
                            let c = irep[IPOS++];
                            if (c < 128) {
                                // no-op
                            }
                            else if (c > 191 && c < 224) {
                                if (IPOS >= ilen)
                                    return IPOS = IPOSₒ, OPOS = OPOSₒ, false;
                                c = (c & 31) << 6 | irep[IPOS++] & 63;
                            }
                            else if (c > 223 && c < 240) {
                                if (IPOS + 1 >= ilen)
                                    return IPOS = IPOSₒ, OPOS = OPOSₒ, false;
                                c = (c & 15) << 12 | (irep[IPOS++] & 63) << 6 | irep[IPOS++] & 63;
                            }
                            else if (c > 239 && c < 248) {
                                if (IPOS + 2 >= ilen)
                                    return IPOS = IPOSₒ, OPOS = OPOSₒ, false;
                                c = (c & 7) << 18 | (irep[IPOS++] & 63) << 12 | (irep[IPOS++] & 63) << 6 | irep[IPOS++] & 63;
                            }
                            else
                                return IPOS = IPOSₒ, OPOS = OPOSₒ, false;
                            const s = c.toString(base).padStart(minDigits, '0');
                            if (s.length > maxDigits)
                                return false;
                            orep.write(s, OPOS);
                            OPOS += s.length;
                            return true;
                        },
                        infer: function UNI() {
                            // TODO: generate default value...
                            throw new Error('unicode print.infer: Not implemented');
                        },
                    },
                });
            };
        }
        return {unicode};
    })(),
};




// ------------------------------ Program ------------------------------
const parseStartRule = createStartRule('parse');
const printStartRule = createStartRule('print');
function createStartRule(mode) {

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
                const IPOSₒ = IPOS, OPOSₒ = OPOS, ATYPₒ = ATYP;
                if (!ꐚWS()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚValue()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚWS()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                return true;
            },
            infer: () => {
                ꐚWS.infer();
                ꐚValue.infer();
                ꐚWS.infer();
                return true;
            },
        },
        print: {
            full: function SEQ() {
                const IPOSₒ = IPOS, OPOSₒ = OPOS, ATYPₒ = ATYP;
                if (!ꐚWS()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚValue()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚWS()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                return true;
            },
            infer: () => {
                ꐚWS.infer();
                ꐚValue.infer();
                ꐚWS.infer();
                return true;
            },
        },
    });

    // SelectionExpression
    const ꐚValue = createRule(mode, {
        parse: {
            full: function SEL() { return ꐚString() || ꐚObject() || ꐚArray() || ꐚNumber() || ꐚFalse() || ꐚNull() || ꐚTrue(); },
            infer: () => ꐚString.infer(),
        },
        print: {
            full: function SEL() { return ꐚString() || ꐚObject() || ꐚArray() || ꐚNumber() || ꐚFalse() || ꐚNull() || ꐚTrue(); },
            infer: () => ꐚString.infer(),
        },
    });

    // SequenceExpression
    const ꐚFalse = createRule(mode, {
        parse: {
            full: function SEQ() {
                const IPOSₒ = IPOS, OPOSₒ = OPOS, ATYPₒ = ATYP;
                if (!ꐚFalseᱻ1()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚFalseᱻ2()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                return true;
            },
            infer: () => {
                ꐚFalseᱻ1.infer();
                ꐚFalseᱻ2.infer();
                return true;
            },
        },
        print: {
            full: function SEQ() {
                const IPOSₒ = IPOS, OPOSₒ = OPOS, ATYPₒ = ATYP;
                if (!ꐚFalseᱻ1()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚFalseᱻ2()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                return true;
            },
            infer: () => {
                ꐚFalseᱻ1.infer();
                ꐚFalseᱻ2.infer();
                return true;
            },
        },
    });

    // StringLiteral
    const ꐚFalseᱻ1 = createRule(mode, {
        parse: {
            full: function STR() {
                if (IPOS + 5 > IREP.length) return false;
                if (IREP[IPOS + 0] !== 0x66) return false;
                if (IREP[IPOS + 1] !== 0x61) return false;
                if (IREP[IPOS + 2] !== 0x6c) return false;
                if (IREP[IPOS + 3] !== 0x73) return false;
                if (IREP[IPOS + 4] !== 0x65) return false;
                IPOS += 5;
                return true;
            },
            infer: function STR() {
                return true;
            },
        },
        print: {
            full: function STR() {
                OREP[OPOS++] = 0x66;
                OREP[OPOS++] = 0x61;
                OREP[OPOS++] = 0x6c;
                OREP[OPOS++] = 0x73;
                OREP[OPOS++] = 0x65;
                return true;
            },
            infer: function STR() {
                OREP[OPOS++] = 0x66;
                OREP[OPOS++] = 0x61;
                OREP[OPOS++] = 0x6c;
                OREP[OPOS++] = 0x73;
                OREP[OPOS++] = 0x65;
                return true;
            },
        },
        constant: "false",
    });

    // BooleanLiteral
    const ꐚFalseᱻ2 = createRule(mode, {
        parse: {
            full: () => {
                OREP[OPOS++] = false;
                ATYP |= SCALAR;
                return true;
            },
            infer: () => {
                OREP[OPOS++] = false;
                ATYP != SCALAR;
                return true;
            },
        },
        print: {
            full: function LIT() {
                if (ATYP !== SCALAR) return false;
                if (IREP[IPOS] !== false) return false;
                IPOS += 1;
                return true;
            },
            infer: () => true,
        },
        constant: false,
    });

    // SequenceExpression
    const ꐚNull = createRule(mode, {
        parse: {
            full: function SEQ() {
                const IPOSₒ = IPOS, OPOSₒ = OPOS, ATYPₒ = ATYP;
                if (!ꐚNullᱻ1()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚNullᱻ2()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                return true;
            },
            infer: () => {
                ꐚNullᱻ1.infer();
                ꐚNullᱻ2.infer();
                return true;
            },
        },
        print: {
            full: function SEQ() {
                const IPOSₒ = IPOS, OPOSₒ = OPOS, ATYPₒ = ATYP;
                if (!ꐚNullᱻ1()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚNullᱻ2()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                return true;
            },
            infer: () => {
                ꐚNullᱻ1.infer();
                ꐚNullᱻ2.infer();
                return true;
            },
        },
    });

    // StringLiteral
    const ꐚNullᱻ1 = createRule(mode, {
        parse: {
            full: function STR() {
                if (IPOS + 4 > IREP.length) return false;
                if (IREP[IPOS + 0] !== 0x6e) return false;
                if (IREP[IPOS + 1] !== 0x75) return false;
                if (IREP[IPOS + 2] !== 0x6c) return false;
                if (IREP[IPOS + 3] !== 0x6c) return false;
                IPOS += 4;
                return true;
            },
            infer: function STR() {
                return true;
            },
        },
        print: {
            full: function STR() {
                OREP[OPOS++] = 0x6e;
                OREP[OPOS++] = 0x75;
                OREP[OPOS++] = 0x6c;
                OREP[OPOS++] = 0x6c;
                return true;
            },
            infer: function STR() {
                OREP[OPOS++] = 0x6e;
                OREP[OPOS++] = 0x75;
                OREP[OPOS++] = 0x6c;
                OREP[OPOS++] = 0x6c;
                return true;
            },
        },
        constant: "null",
    });

    // NullLiteral
    const ꐚNullᱻ2 = createRule(mode, {
        parse: {
            full: () => {
                OREP[OPOS++] = null;
                ATYP |= SCALAR;
                return true;
            },
            infer: () => {
                OREP[OPOS++] = null;
                ATYP != SCALAR;
                return true;
            },
        },
        print: {
            full: function LIT() {
                if (ATYP !== SCALAR) return false;
                if (IREP[IPOS] !== null) return false;
                IPOS += 1;
                return true;
            },
            infer: () => true,
        },
        constant: null,
    });

    // SequenceExpression
    const ꐚTrue = createRule(mode, {
        parse: {
            full: function SEQ() {
                const IPOSₒ = IPOS, OPOSₒ = OPOS, ATYPₒ = ATYP;
                if (!ꐚTrueᱻ1()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚTrueᱻ2()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                return true;
            },
            infer: () => {
                ꐚTrueᱻ1.infer();
                ꐚTrueᱻ2.infer();
                return true;
            },
        },
        print: {
            full: function SEQ() {
                const IPOSₒ = IPOS, OPOSₒ = OPOS, ATYPₒ = ATYP;
                if (!ꐚTrueᱻ1()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚTrueᱻ2()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                return true;
            },
            infer: () => {
                ꐚTrueᱻ1.infer();
                ꐚTrueᱻ2.infer();
                return true;
            },
        },
    });

    // StringLiteral
    const ꐚTrueᱻ1 = createRule(mode, {
        parse: {
            full: function STR() {
                if (IPOS + 4 > IREP.length) return false;
                if (IREP[IPOS + 0] !== 0x74) return false;
                if (IREP[IPOS + 1] !== 0x72) return false;
                if (IREP[IPOS + 2] !== 0x75) return false;
                if (IREP[IPOS + 3] !== 0x65) return false;
                IPOS += 4;
                return true;
            },
            infer: function STR() {
                return true;
            },
        },
        print: {
            full: function STR() {
                OREP[OPOS++] = 0x74;
                OREP[OPOS++] = 0x72;
                OREP[OPOS++] = 0x75;
                OREP[OPOS++] = 0x65;
                return true;
            },
            infer: function STR() {
                OREP[OPOS++] = 0x74;
                OREP[OPOS++] = 0x72;
                OREP[OPOS++] = 0x75;
                OREP[OPOS++] = 0x65;
                return true;
            },
        },
        constant: "true",
    });

    // BooleanLiteral
    const ꐚTrueᱻ2 = createRule(mode, {
        parse: {
            full: () => {
                OREP[OPOS++] = true;
                ATYP |= SCALAR;
                return true;
            },
            infer: () => {
                OREP[OPOS++] = true;
                ATYP != SCALAR;
                return true;
            },
        },
        print: {
            full: function LIT() {
                if (ATYP !== SCALAR) return false;
                if (IREP[IPOS] !== true) return false;
                IPOS += 1;
                return true;
            },
            infer: () => true,
        },
        constant: true,
    });

    // SequenceExpression
    const ꐚObject = createRule(mode, {
        parse: {
            full: function SEQ() {
                const IPOSₒ = IPOS, OPOSₒ = OPOS, ATYPₒ = ATYP;
                if (!ꐚLBRACE()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚObjectᱻ1()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚRBRACE()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                return true;
            },
            infer: () => {
                ꐚLBRACE.infer();
                ꐚObjectᱻ1.infer();
                ꐚRBRACE.infer();
                return true;
            },
        },
        print: {
            full: function SEQ() {
                const IPOSₒ = IPOS, OPOSₒ = OPOS, ATYPₒ = ATYP;
                if (!ꐚLBRACE()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚObjectᱻ1()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚRBRACE()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                return true;
            },
            infer: () => {
                ꐚLBRACE.infer();
                ꐚObjectᱻ1.infer();
                ꐚRBRACE.infer();
                return true;
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
                const IPOSₒ = IPOS, OPOSₒ = OPOS, ATYPₒ = ATYP;
                if (!ꐚObjectᱻ3()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚObjectᱻ5()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                return true;
            },
            infer: () => {
                ꐚObjectᱻ3.infer();
                ꐚObjectᱻ5.infer();
                return true;
            },
        },
        print: {
            full: function SEQ() {
                const IPOSₒ = IPOS, OPOSₒ = OPOS, ATYPₒ = ATYP;
                if (!ꐚObjectᱻ3()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚObjectᱻ5()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                return true;
            },
            infer: () => {
                ꐚObjectᱻ3.infer();
                ꐚObjectᱻ5.infer();
                return true;
            },
        },
    });

    // RecordExpression
    const ꐚObjectᱻ3 = createRule(mode, {
        parse: {
            full: function RCD() {
                const IPOSₒ = IPOS, OPOSₒ = OPOS, ATYPₒ = ATYP;
                if (!parseValue(ꐚString)) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                assert(typeof OREP[OPOS - 1] === 'string');
                if (!parseValue(ꐚObjectᱻ4)) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                ATYP |= RECORD_FIELDS;
                return true;
            },
            infer: function RCD() {
                const OPOSₒ = OPOS;
                parseValue(ꐚString.infer);
                assert(typeof OREP[OPOS - 1] === 'string');
                parseValue(ꐚObjectᱻ4.infer);
                ATYP |= RECORD_FIELDS;
                return true;
            },
        },
        print: {
            full: function RCD() {
                if (ATYP !== RECORD_FIELDS) return false;
                const IPOSₒ = IPOS, OPOSₒ = OPOS, ATYPₒ = ATYP;
                const propList = IREP;
                const propCount = IREP.length >> 1;
                let bitmask = IPOS;
                let i;
                for (i = IPOS = 0; (bitmask & (1 << i)) !== 0; ++i, IPOS += 2) ;
                if (i >= propCount || !printValue(ꐚString)) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!printValue(ꐚObjectᱻ4)) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                bitmask += (1 << i);
                IPOS = bitmask;
                return true;
            },
            infer: function RCD() {
                ꐚString.infer();
                ꐚObjectᱻ4.infer();
                return true;
            },
        },
    });

    // SequenceExpression
    const ꐚObjectᱻ4 = createRule(mode, {
        parse: {
            full: function SEQ() {
                const IPOSₒ = IPOS, OPOSₒ = OPOS, ATYPₒ = ATYP;
                if (!ꐚCOLON()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚValue()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                return true;
            },
            infer: () => {
                ꐚCOLON.infer();
                ꐚValue.infer();
                return true;
            },
        },
        print: {
            full: function SEQ() {
                const IPOSₒ = IPOS, OPOSₒ = OPOS, ATYPₒ = ATYP;
                if (!ꐚCOLON()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚValue()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                return true;
            },
            infer: () => {
                ꐚCOLON.infer();
                ꐚValue.infer();
                return true;
            },
        },
    });

    // QuantifiedExpression
    const ꐚObjectᱻ5 = createRule(mode, {
        parse: {
            full: function QUA() {
                let IPOSᐟ = IPOS, OPOSᐟ = OPOS;
                while (true) {
                    if (!ꐚObjectᱻ6() || IPOS <= IPOSᐟ) break;
                    IPOSᐟ = IPOS, OPOSᐟ = OPOS;
                }
                IPOS = IPOSᐟ, OPOS = OPOSᐟ;
                return true;
            },
            infer: () => true,
        },
        print: {
            full: function QUA() {
                let IPOSᐟ = IPOS, OPOSᐟ = OPOS;
                while (true) {
                    if (!ꐚObjectᱻ6() || IPOS <= IPOSᐟ) break;
                    IPOSᐟ = IPOS, OPOSᐟ = OPOS;
                }
                IPOS = IPOSᐟ, OPOS = OPOSᐟ;
                return true;
            },
            infer: () => true,
        },
    });

    // RecordExpression
    const ꐚObjectᱻ6 = createRule(mode, {
        parse: {
            full: function RCD() {
                const IPOSₒ = IPOS, OPOSₒ = OPOS, ATYPₒ = ATYP;
                if (!parseValue(ꐚObjectᱻ7)) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                assert(typeof OREP[OPOS - 1] === 'string');
                if (!parseValue(ꐚObjectᱻ8)) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                ATYP |= RECORD_FIELDS;
                return true;
            },
            infer: function RCD() {
                const OPOSₒ = OPOS;
                parseValue(ꐚObjectᱻ7.infer);
                assert(typeof OREP[OPOS - 1] === 'string');
                parseValue(ꐚObjectᱻ8.infer);
                ATYP |= RECORD_FIELDS;
                return true;
            },
        },
        print: {
            full: function RCD() {
                if (ATYP !== RECORD_FIELDS) return false;
                const IPOSₒ = IPOS, OPOSₒ = OPOS, ATYPₒ = ATYP;
                const propList = IREP;
                const propCount = IREP.length >> 1;
                let bitmask = IPOS;
                let i;
                for (i = IPOS = 0; (bitmask & (1 << i)) !== 0; ++i, IPOS += 2) ;
                if (i >= propCount || !printValue(ꐚObjectᱻ7)) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!printValue(ꐚObjectᱻ8)) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                bitmask += (1 << i);
                IPOS = bitmask;
                return true;
            },
            infer: function RCD() {
                ꐚObjectᱻ7.infer();
                ꐚObjectᱻ8.infer();
                return true;
            },
        },
    });

    // SequenceExpression
    const ꐚObjectᱻ7 = createRule(mode, {
        parse: {
            full: function SEQ() {
                const IPOSₒ = IPOS, OPOSₒ = OPOS, ATYPₒ = ATYP;
                if (!ꐚCOMMA()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚString()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                return true;
            },
            infer: () => {
                ꐚCOMMA.infer();
                ꐚString.infer();
                return true;
            },
        },
        print: {
            full: function SEQ() {
                const IPOSₒ = IPOS, OPOSₒ = OPOS, ATYPₒ = ATYP;
                if (!ꐚCOMMA()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚString()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                return true;
            },
            infer: () => {
                ꐚCOMMA.infer();
                ꐚString.infer();
                return true;
            },
        },
    });

    // SequenceExpression
    const ꐚObjectᱻ8 = createRule(mode, {
        parse: {
            full: function SEQ() {
                const IPOSₒ = IPOS, OPOSₒ = OPOS, ATYPₒ = ATYP;
                if (!ꐚCOLON()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚValue()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                return true;
            },
            infer: () => {
                ꐚCOLON.infer();
                ꐚValue.infer();
                return true;
            },
        },
        print: {
            full: function SEQ() {
                const IPOSₒ = IPOS, OPOSₒ = OPOS, ATYPₒ = ATYP;
                if (!ꐚCOLON()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚValue()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                return true;
            },
            infer: () => {
                ꐚCOLON.infer();
                ꐚValue.infer();
                return true;
            },
        },
    });

    // RecordExpression
    const ꐚObjectᱻ9 = createRule(mode, {
        parse: {
            full: function RCD() {
                const IPOSₒ = IPOS, OPOSₒ = OPOS, ATYPₒ = ATYP;
                ATYP |= RECORD_FIELDS;
                return true;
            },
            infer: function RCD() {
                const OPOSₒ = OPOS;
                ATYP |= RECORD_FIELDS;
                return true;
            },
        },
        print: {
            full: function RCD() {
                if (ATYP !== RECORD_FIELDS) return false;
                const IPOSₒ = IPOS, OPOSₒ = OPOS, ATYPₒ = ATYP;
                const propList = IREP;
                const propCount = IREP.length >> 1;
                let bitmask = IPOS;
                let i;
                IPOS = bitmask;
                return true;
            },
            infer: function RCD() {
                return true;
            },
        },
    });

    // SequenceExpression
    const ꐚObject2 = createRule(mode, {
        parse: {
            full: function SEQ() {
                const IPOSₒ = IPOS, OPOSₒ = OPOS, ATYPₒ = ATYP;
                if (!ꐚLBRACE()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚObject2ᱻ1()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚRBRACE()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                return true;
            },
            infer: () => {
                ꐚLBRACE.infer();
                ꐚObject2ᱻ1.infer();
                ꐚRBRACE.infer();
                return true;
            },
        },
        print: {
            full: function SEQ() {
                const IPOSₒ = IPOS, OPOSₒ = OPOS, ATYPₒ = ATYP;
                if (!ꐚLBRACE()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚObject2ᱻ1()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚRBRACE()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                return true;
            },
            infer: () => {
                ꐚLBRACE.infer();
                ꐚObject2ᱻ1.infer();
                ꐚRBRACE.infer();
                return true;
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
                const IPOSₒ = IPOS, OPOSₒ = OPOS, ATYPₒ = ATYP;
                ATYP |= RECORD_FIELDS;
                return true;
            },
            infer: function RCD() {
                const OPOSₒ = OPOS;
                ATYP |= RECORD_FIELDS;
                return true;
            },
        },
        print: {
            full: function RCD() {
                if (ATYP !== RECORD_FIELDS) return false;
                const IPOSₒ = IPOS, OPOSₒ = OPOS, ATYPₒ = ATYP;
                const propList = IREP;
                const propCount = IREP.length >> 1;
                let bitmask = IPOS;
                let i;
                IPOS = bitmask;
                return true;
            },
            infer: function RCD() {
                return true;
            },
        },
    });

    // RecordExpression
    const ꐚProperties = createRule(mode, {
        parse: {
            full: function RCD() {
                const IPOSₒ = IPOS, OPOSₒ = OPOS, ATYPₒ = ATYP;
                if (!parseValue(ꐚString)) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                assert(typeof OREP[OPOS - 1] === 'string');
                if (!parseValue(ꐚPropertiesᱻ1)) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚPropertiesᱻ2()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                ATYP |= RECORD_FIELDS;
                return true;
            },
            infer: function RCD() {
                const OPOSₒ = OPOS;
                parseValue(ꐚString.infer);
                assert(typeof OREP[OPOS - 1] === 'string');
                parseValue(ꐚPropertiesᱻ1.infer);
                ꐚPropertiesᱻ2.infer();
                ATYP |= RECORD_FIELDS;
                return true;
            },
        },
        print: {
            full: function RCD() {
                if (ATYP !== RECORD_FIELDS) return false;
                const IPOSₒ = IPOS, OPOSₒ = OPOS, ATYPₒ = ATYP;
                const propList = IREP;
                const propCount = IREP.length >> 1;
                let bitmask = IPOS;
                let i;
                for (i = IPOS = 0; (bitmask & (1 << i)) !== 0; ++i, IPOS += 2) ;
                if (i >= propCount || !printValue(ꐚString)) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!printValue(ꐚPropertiesᱻ1)) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                bitmask += (1 << i);
                IPOS = bitmask;
                if (!ꐚPropertiesᱻ2()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                bitmask = IPOS;
                IPOS = bitmask;
                return true;
            },
            infer: function RCD() {
                ꐚString.infer();
                ꐚPropertiesᱻ1.infer();
                ꐚPropertiesᱻ2.infer();
                return true;
            },
        },
    });

    // SequenceExpression
    const ꐚPropertiesᱻ1 = createRule(mode, {
        parse: {
            full: function SEQ() {
                const IPOSₒ = IPOS, OPOSₒ = OPOS, ATYPₒ = ATYP;
                if (!ꐚCOLON()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚValue()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                return true;
            },
            infer: () => {
                ꐚCOLON.infer();
                ꐚValue.infer();
                return true;
            },
        },
        print: {
            full: function SEQ() {
                const IPOSₒ = IPOS, OPOSₒ = OPOS, ATYPₒ = ATYP;
                if (!ꐚCOLON()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚValue()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                return true;
            },
            infer: () => {
                ꐚCOLON.infer();
                ꐚValue.infer();
                return true;
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
                const IPOSₒ = IPOS, OPOSₒ = OPOS, ATYPₒ = ATYP;
                if (!ꐚCOMMA()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚProperties()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                return true;
            },
            infer: () => {
                ꐚCOMMA.infer();
                ꐚProperties.infer();
                return true;
            },
        },
        print: {
            full: function SEQ() {
                const IPOSₒ = IPOS, OPOSₒ = OPOS, ATYPₒ = ATYP;
                if (!ꐚCOMMA()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚProperties()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                return true;
            },
            infer: () => {
                ꐚCOMMA.infer();
                ꐚProperties.infer();
                return true;
            },
        },
    });

    // RecordExpression
    const ꐚPropertiesᱻ4 = createRule(mode, {
        parse: {
            full: function RCD() {
                const IPOSₒ = IPOS, OPOSₒ = OPOS, ATYPₒ = ATYP;
                ATYP |= RECORD_FIELDS;
                return true;
            },
            infer: function RCD() {
                const OPOSₒ = OPOS;
                ATYP |= RECORD_FIELDS;
                return true;
            },
        },
        print: {
            full: function RCD() {
                if (ATYP !== RECORD_FIELDS) return false;
                const IPOSₒ = IPOS, OPOSₒ = OPOS, ATYPₒ = ATYP;
                const propList = IREP;
                const propCount = IREP.length >> 1;
                let bitmask = IPOS;
                let i;
                IPOS = bitmask;
                return true;
            },
            infer: function RCD() {
                return true;
            },
        },
    });

    // SequenceExpression
    const ꐚArray = createRule(mode, {
        parse: {
            full: function SEQ() {
                const IPOSₒ = IPOS, OPOSₒ = OPOS, ATYPₒ = ATYP;
                if (!ꐚLBRACKET()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚArrayᱻ1()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚRBRACKET()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                return true;
            },
            infer: () => {
                ꐚLBRACKET.infer();
                ꐚArrayᱻ1.infer();
                ꐚRBRACKET.infer();
                return true;
            },
        },
        print: {
            full: function SEQ() {
                const IPOSₒ = IPOS, OPOSₒ = OPOS, ATYPₒ = ATYP;
                if (!ꐚLBRACKET()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚArrayᱻ1()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚRBRACKET()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                return true;
            },
            infer: () => {
                ꐚLBRACKET.infer();
                ꐚArrayᱻ1.infer();
                ꐚRBRACKET.infer();
                return true;
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
                const IPOSₒ = IPOS, OPOSₒ = OPOS, ATYPₒ = ATYP;
                if (!ꐚArrayᱻ3()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚArrayᱻ4()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                return true;
            },
            infer: () => {
                ꐚArrayᱻ3.infer();
                ꐚArrayᱻ4.infer();
                return true;
            },
        },
        print: {
            full: function SEQ() {
                const IPOSₒ = IPOS, OPOSₒ = OPOS, ATYPₒ = ATYP;
                if (!ꐚArrayᱻ3()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚArrayᱻ4()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                return true;
            },
            infer: () => {
                ꐚArrayᱻ3.infer();
                ꐚArrayᱻ4.infer();
                return true;
            },
        },
    });

    // ListExpression
    const ꐚArrayᱻ3 = createRule(mode, {
        parse: {
            full: function LST() {
                const IPOSₒ = IPOS, OPOSₒ = OPOS, ATYPₒ = ATYP;
                if (!parseValue(ꐚValue)) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                ATYP |= LIST_ELEMENTS;
                return true;
            },
            infer: function LST() {
                parseValue(ꐚValue.infer);
                ATYP |= LIST_ELEMENTS;
                return true;
            },
        },
        print: {
            full: function LST() {
                if (ATYP !== LIST_ELEMENTS) return false;
                const IPOSₒ = IPOS, OPOSₒ = OPOS, ATYPₒ = ATYP;
                if (!printValue(ꐚValue)) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                return true;
            },
            infer: function LST() {
                ꐚValue.infer();
                return true;
            },
        },
    });

    // QuantifiedExpression
    const ꐚArrayᱻ4 = createRule(mode, {
        parse: {
            full: function QUA() {
                let IPOSᐟ = IPOS, OPOSᐟ = OPOS;
                while (true) {
                    if (!ꐚArrayᱻ5() || IPOS <= IPOSᐟ) break;
                    IPOSᐟ = IPOS, OPOSᐟ = OPOS;
                }
                IPOS = IPOSᐟ, OPOS = OPOSᐟ;
                return true;
            },
            infer: () => true,
        },
        print: {
            full: function QUA() {
                let IPOSᐟ = IPOS, OPOSᐟ = OPOS;
                while (true) {
                    if (!ꐚArrayᱻ5() || IPOS <= IPOSᐟ) break;
                    IPOSᐟ = IPOS, OPOSᐟ = OPOS;
                }
                IPOS = IPOSᐟ, OPOS = OPOSᐟ;
                return true;
            },
            infer: () => true,
        },
    });

    // ListExpression
    const ꐚArrayᱻ5 = createRule(mode, {
        parse: {
            full: function LST() {
                const IPOSₒ = IPOS, OPOSₒ = OPOS, ATYPₒ = ATYP;
                if (!parseValue(ꐚArrayᱻ6)) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                ATYP |= LIST_ELEMENTS;
                return true;
            },
            infer: function LST() {
                parseValue(ꐚArrayᱻ6.infer);
                ATYP |= LIST_ELEMENTS;
                return true;
            },
        },
        print: {
            full: function LST() {
                if (ATYP !== LIST_ELEMENTS) return false;
                const IPOSₒ = IPOS, OPOSₒ = OPOS, ATYPₒ = ATYP;
                if (!printValue(ꐚArrayᱻ6)) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                return true;
            },
            infer: function LST() {
                ꐚArrayᱻ6.infer();
                return true;
            },
        },
    });

    // SequenceExpression
    const ꐚArrayᱻ6 = createRule(mode, {
        parse: {
            full: function SEQ() {
                const IPOSₒ = IPOS, OPOSₒ = OPOS, ATYPₒ = ATYP;
                if (!ꐚCOMMA()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚValue()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                return true;
            },
            infer: () => {
                ꐚCOMMA.infer();
                ꐚValue.infer();
                return true;
            },
        },
        print: {
            full: function SEQ() {
                const IPOSₒ = IPOS, OPOSₒ = OPOS, ATYPₒ = ATYP;
                if (!ꐚCOMMA()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚValue()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                return true;
            },
            infer: () => {
                ꐚCOMMA.infer();
                ꐚValue.infer();
                return true;
            },
        },
    });

    // ListExpression
    const ꐚArrayᱻ7 = createRule(mode, {
        parse: {
            full: function LST() {
                const IPOSₒ = IPOS, OPOSₒ = OPOS, ATYPₒ = ATYP;
                ATYP |= LIST_ELEMENTS;
                return true;
            },
            infer: function LST() {
                ATYP |= LIST_ELEMENTS;
                return true;
            },
        },
        print: {
            full: function LST() {
                if (ATYP !== LIST_ELEMENTS) return false;
                const IPOSₒ = IPOS, OPOSₒ = OPOS, ATYPₒ = ATYP;
                return true;
            },
            infer: function LST() {
                return true;
            },
        },
    });

    // SequenceExpression
    const ꐚArray2 = createRule(mode, {
        parse: {
            full: function SEQ() {
                const IPOSₒ = IPOS, OPOSₒ = OPOS, ATYPₒ = ATYP;
                if (!ꐚLBRACKET()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚArray2ᱻ1()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚRBRACKET()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                return true;
            },
            infer: () => {
                ꐚLBRACKET.infer();
                ꐚArray2ᱻ1.infer();
                ꐚRBRACKET.infer();
                return true;
            },
        },
        print: {
            full: function SEQ() {
                const IPOSₒ = IPOS, OPOSₒ = OPOS, ATYPₒ = ATYP;
                if (!ꐚLBRACKET()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚArray2ᱻ1()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚRBRACKET()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                return true;
            },
            infer: () => {
                ꐚLBRACKET.infer();
                ꐚArray2ᱻ1.infer();
                ꐚRBRACKET.infer();
                return true;
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
                const IPOSₒ = IPOS, OPOSₒ = OPOS, ATYPₒ = ATYP;
                ATYP |= LIST_ELEMENTS;
                return true;
            },
            infer: function LST() {
                ATYP |= LIST_ELEMENTS;
                return true;
            },
        },
        print: {
            full: function LST() {
                if (ATYP !== LIST_ELEMENTS) return false;
                const IPOSₒ = IPOS, OPOSₒ = OPOS, ATYPₒ = ATYP;
                return true;
            },
            infer: function LST() {
                return true;
            },
        },
    });

    // ListExpression
    const ꐚElements = createRule(mode, {
        parse: {
            full: function LST() {
                const IPOSₒ = IPOS, OPOSₒ = OPOS, ATYPₒ = ATYP;
                if (!parseValue(ꐚValue)) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚElementsᱻ1()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                ATYP |= LIST_ELEMENTS;
                return true;
            },
            infer: function LST() {
                parseValue(ꐚValue.infer);
                ꐚElementsᱻ1.infer();
                ATYP |= LIST_ELEMENTS;
                return true;
            },
        },
        print: {
            full: function LST() {
                if (ATYP !== LIST_ELEMENTS) return false;
                const IPOSₒ = IPOS, OPOSₒ = OPOS, ATYPₒ = ATYP;
                if (!printValue(ꐚValue)) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚElementsᱻ1()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                return true;
            },
            infer: function LST() {
                ꐚValue.infer();
                ꐚElementsᱻ1.infer();
                return true;
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
                const IPOSₒ = IPOS, OPOSₒ = OPOS, ATYPₒ = ATYP;
                if (!ꐚCOMMA()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚElements()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                return true;
            },
            infer: () => {
                ꐚCOMMA.infer();
                ꐚElements.infer();
                return true;
            },
        },
        print: {
            full: function SEQ() {
                const IPOSₒ = IPOS, OPOSₒ = OPOS, ATYPₒ = ATYP;
                if (!ꐚCOMMA()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚElements()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                return true;
            },
            infer: () => {
                ꐚCOMMA.infer();
                ꐚElements.infer();
                return true;
            },
        },
    });

    // ListExpression
    const ꐚElementsᱻ3 = createRule(mode, {
        parse: {
            full: function LST() {
                const IPOSₒ = IPOS, OPOSₒ = OPOS, ATYPₒ = ATYP;
                ATYP |= LIST_ELEMENTS;
                return true;
            },
            infer: function LST() {
                ATYP |= LIST_ELEMENTS;
                return true;
            },
        },
        print: {
            full: function LST() {
                if (ATYP !== LIST_ELEMENTS) return false;
                const IPOSₒ = IPOS, OPOSₒ = OPOS, ATYPₒ = ATYP;
                return true;
            },
            infer: function LST() {
                return true;
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
                const IPOSₒ = IPOS, OPOSₒ = OPOS, ATYPₒ = ATYP;
                if (!ꐚDOUBLE_QUOTE()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚCHAR()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚStringᱻ1()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚDOUBLE_QUOTE()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                return true;
            },
            infer: () => {
                ꐚDOUBLE_QUOTE.infer();
                ꐚCHAR.infer();
                ꐚStringᱻ1.infer();
                ꐚDOUBLE_QUOTE.infer();
                return true;
            },
        },
        print: {
            full: function SEQ() {
                const IPOSₒ = IPOS, OPOSₒ = OPOS, ATYPₒ = ATYP;
                if (!ꐚDOUBLE_QUOTE()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚCHAR()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚStringᱻ1()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚDOUBLE_QUOTE()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                return true;
            },
            infer: () => {
                ꐚDOUBLE_QUOTE.infer();
                ꐚCHAR.infer();
                ꐚStringᱻ1.infer();
                ꐚDOUBLE_QUOTE.infer();
                return true;
            },
        },
    });

    // QuantifiedExpression
    const ꐚStringᱻ1 = createRule(mode, {
        parse: {
            full: function QUA() {
                let IPOSᐟ = IPOS, OPOSᐟ = OPOS;
                while (true) {
                    if (!ꐚCHAR() || IPOS <= IPOSᐟ) break;
                    IPOSᐟ = IPOS, OPOSᐟ = OPOS;
                }
                IPOS = IPOSᐟ, OPOS = OPOSᐟ;
                return true;
            },
            infer: () => true,
        },
        print: {
            full: function QUA() {
                let IPOSᐟ = IPOS, OPOSᐟ = OPOS;
                while (true) {
                    if (!ꐚCHAR() || IPOS <= IPOSᐟ) break;
                    IPOSᐟ = IPOS, OPOSᐟ = OPOS;
                }
                IPOS = IPOSᐟ, OPOS = OPOSᐟ;
                return true;
            },
            infer: () => true,
        },
    });

    // NumericLiteral
    const ꐚbase = createRule(mode, {
        parse: {
            full: () => {
                OREP[OPOS++] = 16;
                ATYP |= SCALAR;
                return true;
            },
            infer: () => {
                OREP[OPOS++] = 16;
                ATYP != SCALAR;
                return true;
            },
        },
        print: {
            full: function LIT() {
                if (ATYP !== SCALAR) return false;
                if (IREP[IPOS] !== 16) return false;
                IPOS += 1;
                return true;
            },
            infer: () => true,
        },
        constant: 16,
    });

    // NumericLiteral
    const ꐚminDigits = createRule(mode, {
        parse: {
            full: () => {
                OREP[OPOS++] = 4;
                ATYP |= SCALAR;
                return true;
            },
            infer: () => {
                OREP[OPOS++] = 4;
                ATYP != SCALAR;
                return true;
            },
        },
        print: {
            full: function LIT() {
                if (ATYP !== SCALAR) return false;
                if (IREP[IPOS] !== 4) return false;
                IPOS += 1;
                return true;
            },
            infer: () => true,
        },
        constant: 4,
    });

    // NumericLiteral
    const ꐚmaxDigits = createRule(mode, {
        parse: {
            full: () => {
                OREP[OPOS++] = 4;
                ATYP |= SCALAR;
                return true;
            },
            infer: () => {
                OREP[OPOS++] = 4;
                ATYP != SCALAR;
                return true;
            },
        },
        print: {
            full: function LIT() {
                if (ATYP !== SCALAR) return false;
                if (IREP[IPOS] !== 4) return false;
                IPOS += 1;
                return true;
            },
            infer: () => true,
        },
        constant: 4,
    });

    // SelectionExpression
    const ꐚCHAR = createRule(mode, {
        parse: {
            full: function SEL() { return ꐚCHARᱻ1() || ꐚCHARᱻ2() || ꐚCHARᱻ5() || ꐚCHARᱻ9() || ꐚCHARᱻ14(); },
            infer: () => ꐚCHARᱻ1.infer(),
        },
        print: {
            full: function SEL() { return ꐚCHARᱻ1() || ꐚCHARᱻ2() || ꐚCHARᱻ5() || ꐚCHARᱻ9() || ꐚCHARᱻ14(); },
            infer: () => ꐚCHARᱻ1.infer(),
        },
    });

    // ByteExpression
    const ꐚCHARᱻ1 = createRule(mode, {
        parse: {
            full: function BYT() {
                let cc;
                if (IPOS >= IREP.length) return false;
                cc = IREP[IPOS];
                if (cc === 0x5c) return false;
                if (cc === 0x22) return false;
                if ((cc < 0x20 || cc > 0x7f)) return false;
                IPOS += 1;
                OREP[OPOS++] = cc;
                ATYP |= STRING_CHARS
                return true;
            },
            infer: () => {
                OREP[OPOS++] = 0x20;
                ATYP |= STRING_CHARS
                return true;
            },
        },
        print: {
            full: function BYT() {
                let cc;
                if (ATYP !== STRING_CHARS) return false;
                if (IPOS >= IREP.length) return false;
                cc = IREP[IPOS];
                if (cc === 0x5c) return false;
                if (cc === 0x22) return false;
                if ((cc < 0x20 || cc > 0x7f)) return false;
                IPOS += 1;
                OREP[OPOS++] = cc;
                return true;
            },
            infer: () => {
                OREP[OPOS++] = 0x20;
                return true;
            },
        },
    });

    // SequenceExpression
    const ꐚCHARᱻ2 = createRule(mode, {
        parse: {
            full: function SEQ() {
                const IPOSₒ = IPOS, OPOSₒ = OPOS, ATYPₒ = ATYP;
                if (!ꐚCHARᱻ3()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚCHARᱻ4()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                return true;
            },
            infer: () => {
                ꐚCHARᱻ3.infer();
                ꐚCHARᱻ4.infer();
                return true;
            },
        },
        print: {
            full: function SEQ() {
                const IPOSₒ = IPOS, OPOSₒ = OPOS, ATYPₒ = ATYP;
                if (!ꐚCHARᱻ3()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚCHARᱻ4()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                return true;
            },
            infer: () => {
                ꐚCHARᱻ3.infer();
                ꐚCHARᱻ4.infer();
                return true;
            },
        },
    });

    // ByteExpression
    const ꐚCHARᱻ3 = createRule(mode, {
        parse: {
            full: function BYT() {
                let cc;
                if (IPOS >= IREP.length) return false;
                cc = IREP[IPOS];
                if ((cc < 0xc0 || cc > 0xdf)) return false;
                IPOS += 1;
                OREP[OPOS++] = cc;
                ATYP |= STRING_CHARS
                return true;
            },
            infer: () => {
                OREP[OPOS++] = 0xc0;
                ATYP |= STRING_CHARS
                return true;
            },
        },
        print: {
            full: function BYT() {
                let cc;
                if (ATYP !== STRING_CHARS) return false;
                if (IPOS >= IREP.length) return false;
                cc = IREP[IPOS];
                if ((cc < 0xc0 || cc > 0xdf)) return false;
                IPOS += 1;
                OREP[OPOS++] = cc;
                return true;
            },
            infer: () => {
                OREP[OPOS++] = 0xc0;
                return true;
            },
        },
    });

    // ByteExpression
    const ꐚCHARᱻ4 = createRule(mode, {
        parse: {
            full: function BYT() {
                let cc;
                if (IPOS >= IREP.length) return false;
                cc = IREP[IPOS];
                if ((cc < 0x80 || cc > 0xbf)) return false;
                IPOS += 1;
                OREP[OPOS++] = cc;
                ATYP |= STRING_CHARS
                return true;
            },
            infer: () => {
                OREP[OPOS++] = 0x80;
                ATYP |= STRING_CHARS
                return true;
            },
        },
        print: {
            full: function BYT() {
                let cc;
                if (ATYP !== STRING_CHARS) return false;
                if (IPOS >= IREP.length) return false;
                cc = IREP[IPOS];
                if ((cc < 0x80 || cc > 0xbf)) return false;
                IPOS += 1;
                OREP[OPOS++] = cc;
                return true;
            },
            infer: () => {
                OREP[OPOS++] = 0x80;
                return true;
            },
        },
    });

    // SequenceExpression
    const ꐚCHARᱻ5 = createRule(mode, {
        parse: {
            full: function SEQ() {
                const IPOSₒ = IPOS, OPOSₒ = OPOS, ATYPₒ = ATYP;
                if (!ꐚCHARᱻ6()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚCHARᱻ7()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚCHARᱻ8()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                return true;
            },
            infer: () => {
                ꐚCHARᱻ6.infer();
                ꐚCHARᱻ7.infer();
                ꐚCHARᱻ8.infer();
                return true;
            },
        },
        print: {
            full: function SEQ() {
                const IPOSₒ = IPOS, OPOSₒ = OPOS, ATYPₒ = ATYP;
                if (!ꐚCHARᱻ6()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚCHARᱻ7()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚCHARᱻ8()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                return true;
            },
            infer: () => {
                ꐚCHARᱻ6.infer();
                ꐚCHARᱻ7.infer();
                ꐚCHARᱻ8.infer();
                return true;
            },
        },
    });

    // ByteExpression
    const ꐚCHARᱻ6 = createRule(mode, {
        parse: {
            full: function BYT() {
                let cc;
                if (IPOS >= IREP.length) return false;
                cc = IREP[IPOS];
                if ((cc < 0xe0 || cc > 0xef)) return false;
                IPOS += 1;
                OREP[OPOS++] = cc;
                ATYP |= STRING_CHARS
                return true;
            },
            infer: () => {
                OREP[OPOS++] = 0xe0;
                ATYP |= STRING_CHARS
                return true;
            },
        },
        print: {
            full: function BYT() {
                let cc;
                if (ATYP !== STRING_CHARS) return false;
                if (IPOS >= IREP.length) return false;
                cc = IREP[IPOS];
                if ((cc < 0xe0 || cc > 0xef)) return false;
                IPOS += 1;
                OREP[OPOS++] = cc;
                return true;
            },
            infer: () => {
                OREP[OPOS++] = 0xe0;
                return true;
            },
        },
    });

    // ByteExpression
    const ꐚCHARᱻ7 = createRule(mode, {
        parse: {
            full: function BYT() {
                let cc;
                if (IPOS >= IREP.length) return false;
                cc = IREP[IPOS];
                if ((cc < 0x80 || cc > 0xbf)) return false;
                IPOS += 1;
                OREP[OPOS++] = cc;
                ATYP |= STRING_CHARS
                return true;
            },
            infer: () => {
                OREP[OPOS++] = 0x80;
                ATYP |= STRING_CHARS
                return true;
            },
        },
        print: {
            full: function BYT() {
                let cc;
                if (ATYP !== STRING_CHARS) return false;
                if (IPOS >= IREP.length) return false;
                cc = IREP[IPOS];
                if ((cc < 0x80 || cc > 0xbf)) return false;
                IPOS += 1;
                OREP[OPOS++] = cc;
                return true;
            },
            infer: () => {
                OREP[OPOS++] = 0x80;
                return true;
            },
        },
    });

    // ByteExpression
    const ꐚCHARᱻ8 = createRule(mode, {
        parse: {
            full: function BYT() {
                let cc;
                if (IPOS >= IREP.length) return false;
                cc = IREP[IPOS];
                if ((cc < 0x80 || cc > 0xbf)) return false;
                IPOS += 1;
                OREP[OPOS++] = cc;
                ATYP |= STRING_CHARS
                return true;
            },
            infer: () => {
                OREP[OPOS++] = 0x80;
                ATYP |= STRING_CHARS
                return true;
            },
        },
        print: {
            full: function BYT() {
                let cc;
                if (ATYP !== STRING_CHARS) return false;
                if (IPOS >= IREP.length) return false;
                cc = IREP[IPOS];
                if ((cc < 0x80 || cc > 0xbf)) return false;
                IPOS += 1;
                OREP[OPOS++] = cc;
                return true;
            },
            infer: () => {
                OREP[OPOS++] = 0x80;
                return true;
            },
        },
    });

    // SequenceExpression
    const ꐚCHARᱻ9 = createRule(mode, {
        parse: {
            full: function SEQ() {
                const IPOSₒ = IPOS, OPOSₒ = OPOS, ATYPₒ = ATYP;
                if (!ꐚCHARᱻ10()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚCHARᱻ11()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚCHARᱻ12()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚCHARᱻ13()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                return true;
            },
            infer: () => {
                ꐚCHARᱻ10.infer();
                ꐚCHARᱻ11.infer();
                ꐚCHARᱻ12.infer();
                ꐚCHARᱻ13.infer();
                return true;
            },
        },
        print: {
            full: function SEQ() {
                const IPOSₒ = IPOS, OPOSₒ = OPOS, ATYPₒ = ATYP;
                if (!ꐚCHARᱻ10()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚCHARᱻ11()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚCHARᱻ12()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚCHARᱻ13()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                return true;
            },
            infer: () => {
                ꐚCHARᱻ10.infer();
                ꐚCHARᱻ11.infer();
                ꐚCHARᱻ12.infer();
                ꐚCHARᱻ13.infer();
                return true;
            },
        },
    });

    // ByteExpression
    const ꐚCHARᱻ10 = createRule(mode, {
        parse: {
            full: function BYT() {
                let cc;
                if (IPOS >= IREP.length) return false;
                cc = IREP[IPOS];
                if ((cc < 0xf0 || cc > 0xf7)) return false;
                IPOS += 1;
                OREP[OPOS++] = cc;
                ATYP |= STRING_CHARS
                return true;
            },
            infer: () => {
                OREP[OPOS++] = 0xf0;
                ATYP |= STRING_CHARS
                return true;
            },
        },
        print: {
            full: function BYT() {
                let cc;
                if (ATYP !== STRING_CHARS) return false;
                if (IPOS >= IREP.length) return false;
                cc = IREP[IPOS];
                if ((cc < 0xf0 || cc > 0xf7)) return false;
                IPOS += 1;
                OREP[OPOS++] = cc;
                return true;
            },
            infer: () => {
                OREP[OPOS++] = 0xf0;
                return true;
            },
        },
    });

    // ByteExpression
    const ꐚCHARᱻ11 = createRule(mode, {
        parse: {
            full: function BYT() {
                let cc;
                if (IPOS >= IREP.length) return false;
                cc = IREP[IPOS];
                if ((cc < 0x80 || cc > 0xbf)) return false;
                IPOS += 1;
                OREP[OPOS++] = cc;
                ATYP |= STRING_CHARS
                return true;
            },
            infer: () => {
                OREP[OPOS++] = 0x80;
                ATYP |= STRING_CHARS
                return true;
            },
        },
        print: {
            full: function BYT() {
                let cc;
                if (ATYP !== STRING_CHARS) return false;
                if (IPOS >= IREP.length) return false;
                cc = IREP[IPOS];
                if ((cc < 0x80 || cc > 0xbf)) return false;
                IPOS += 1;
                OREP[OPOS++] = cc;
                return true;
            },
            infer: () => {
                OREP[OPOS++] = 0x80;
                return true;
            },
        },
    });

    // ByteExpression
    const ꐚCHARᱻ12 = createRule(mode, {
        parse: {
            full: function BYT() {
                let cc;
                if (IPOS >= IREP.length) return false;
                cc = IREP[IPOS];
                if ((cc < 0x80 || cc > 0xbf)) return false;
                IPOS += 1;
                OREP[OPOS++] = cc;
                ATYP |= STRING_CHARS
                return true;
            },
            infer: () => {
                OREP[OPOS++] = 0x80;
                ATYP |= STRING_CHARS
                return true;
            },
        },
        print: {
            full: function BYT() {
                let cc;
                if (ATYP !== STRING_CHARS) return false;
                if (IPOS >= IREP.length) return false;
                cc = IREP[IPOS];
                if ((cc < 0x80 || cc > 0xbf)) return false;
                IPOS += 1;
                OREP[OPOS++] = cc;
                return true;
            },
            infer: () => {
                OREP[OPOS++] = 0x80;
                return true;
            },
        },
    });

    // ByteExpression
    const ꐚCHARᱻ13 = createRule(mode, {
        parse: {
            full: function BYT() {
                let cc;
                if (IPOS >= IREP.length) return false;
                cc = IREP[IPOS];
                if ((cc < 0x80 || cc > 0xbf)) return false;
                IPOS += 1;
                OREP[OPOS++] = cc;
                ATYP |= STRING_CHARS
                return true;
            },
            infer: () => {
                OREP[OPOS++] = 0x80;
                ATYP |= STRING_CHARS
                return true;
            },
        },
        print: {
            full: function BYT() {
                let cc;
                if (ATYP !== STRING_CHARS) return false;
                if (IPOS >= IREP.length) return false;
                cc = IREP[IPOS];
                if ((cc < 0x80 || cc > 0xbf)) return false;
                IPOS += 1;
                OREP[OPOS++] = cc;
                return true;
            },
            infer: () => {
                OREP[OPOS++] = 0x80;
                return true;
            },
        },
    });

    // SequenceExpression
    const ꐚCHARᱻ14 = createRule(mode, {
        parse: {
            full: function SEQ() {
                const IPOSₒ = IPOS, OPOSₒ = OPOS, ATYPₒ = ATYP;
                if (!ꐚCHARᱻ15()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚCHARᱻ16()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                return true;
            },
            infer: () => {
                ꐚCHARᱻ15.infer();
                ꐚCHARᱻ16.infer();
                return true;
            },
        },
        print: {
            full: function SEQ() {
                const IPOSₒ = IPOS, OPOSₒ = OPOS, ATYPₒ = ATYP;
                if (!ꐚCHARᱻ15()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚCHARᱻ16()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                return true;
            },
            infer: () => {
                ꐚCHARᱻ15.infer();
                ꐚCHARᱻ16.infer();
                return true;
            },
        },
    });

    // ByteExpression
    const ꐚCHARᱻ15 = createRule(mode, {
        parse: {
            full: function BYT() {
                let cc;
                if (IPOS >= IREP.length) return false;
                cc = IREP[IPOS];
                if (cc !== 0x5c) return false;
                IPOS += 1;
                return true;
            },
            infer: () => true,
        },
        print: {
            full: function BYT() {
                let cc;
                cc = 0x5c;
                OREP[OPOS++] = cc;
                return true;
            },
            infer: () => {
                OREP[OPOS++] = 0x5c;
                return true;
            },
        },
    });

    // SelectionExpression
    const ꐚCHARᱻ16 = createRule(mode, {
        parse: {
            full: function SEL() { return ꐚCHARᱻ17() || ꐚCHARᱻ20() || ꐚCHARᱻ23() || ꐚCHARᱻ26() || ꐚCHARᱻ29() || ꐚCHARᱻ32() || ꐚCHARᱻ35() || ꐚCHARᱻ38() || ꐚCHARᱻ41(); },
            infer: () => ꐚCHARᱻ17.infer(),
        },
        print: {
            full: function SEL() { return ꐚCHARᱻ17() || ꐚCHARᱻ20() || ꐚCHARᱻ23() || ꐚCHARᱻ26() || ꐚCHARᱻ29() || ꐚCHARᱻ32() || ꐚCHARᱻ35() || ꐚCHARᱻ38() || ꐚCHARᱻ41(); },
            infer: () => ꐚCHARᱻ17.infer(),
        },
    });

    // SequenceExpression
    const ꐚCHARᱻ17 = createRule(mode, {
        parse: {
            full: function SEQ() {
                const IPOSₒ = IPOS, OPOSₒ = OPOS, ATYPₒ = ATYP;
                if (!ꐚCHARᱻ18()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚCHARᱻ19()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                return true;
            },
            infer: () => {
                ꐚCHARᱻ18.infer();
                ꐚCHARᱻ19.infer();
                return true;
            },
        },
        print: {
            full: function SEQ() {
                const IPOSₒ = IPOS, OPOSₒ = OPOS, ATYPₒ = ATYP;
                if (!ꐚCHARᱻ18()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚCHARᱻ19()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                return true;
            },
            infer: () => {
                ꐚCHARᱻ18.infer();
                ꐚCHARᱻ19.infer();
                return true;
            },
        },
    });

    // ByteExpression
    const ꐚCHARᱻ18 = createRule(mode, {
        parse: {
            full: function BYT() {
                let cc;
                if (IPOS >= IREP.length) return false;
                cc = IREP[IPOS];
                if (cc !== 0x22) return false;
                IPOS += 1;
                return true;
            },
            infer: () => true,
        },
        print: {
            full: function BYT() {
                let cc;
                cc = 0x22;
                OREP[OPOS++] = cc;
                return true;
            },
            infer: () => {
                OREP[OPOS++] = 0x22;
                return true;
            },
        },
    });

    // ByteExpression
    const ꐚCHARᱻ19 = createRule(mode, {
        parse: {
            full: function BYT() {
                let cc;
                cc = 0x22;
                OREP[OPOS++] = cc;
                ATYP |= STRING_CHARS
                return true;
            },
            infer: () => {
                OREP[OPOS++] = 0x22;
                ATYP |= STRING_CHARS
                return true;
            },
        },
        print: {
            full: function BYT() {
                let cc;
                if (ATYP !== STRING_CHARS) return false;
                if (IPOS >= IREP.length) return false;
                cc = IREP[IPOS];
                if (cc !== 0x22) return false;
                IPOS += 1;
                return true;
            },
            infer: () => true,
        },
    });

    // SequenceExpression
    const ꐚCHARᱻ20 = createRule(mode, {
        parse: {
            full: function SEQ() {
                const IPOSₒ = IPOS, OPOSₒ = OPOS, ATYPₒ = ATYP;
                if (!ꐚCHARᱻ21()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚCHARᱻ22()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                return true;
            },
            infer: () => {
                ꐚCHARᱻ21.infer();
                ꐚCHARᱻ22.infer();
                return true;
            },
        },
        print: {
            full: function SEQ() {
                const IPOSₒ = IPOS, OPOSₒ = OPOS, ATYPₒ = ATYP;
                if (!ꐚCHARᱻ21()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚCHARᱻ22()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                return true;
            },
            infer: () => {
                ꐚCHARᱻ21.infer();
                ꐚCHARᱻ22.infer();
                return true;
            },
        },
    });

    // ByteExpression
    const ꐚCHARᱻ21 = createRule(mode, {
        parse: {
            full: function BYT() {
                let cc;
                if (IPOS >= IREP.length) return false;
                cc = IREP[IPOS];
                if (cc !== 0x5c) return false;
                IPOS += 1;
                return true;
            },
            infer: () => true,
        },
        print: {
            full: function BYT() {
                let cc;
                cc = 0x5c;
                OREP[OPOS++] = cc;
                return true;
            },
            infer: () => {
                OREP[OPOS++] = 0x5c;
                return true;
            },
        },
    });

    // ByteExpression
    const ꐚCHARᱻ22 = createRule(mode, {
        parse: {
            full: function BYT() {
                let cc;
                cc = 0x5c;
                OREP[OPOS++] = cc;
                ATYP |= STRING_CHARS
                return true;
            },
            infer: () => {
                OREP[OPOS++] = 0x5c;
                ATYP |= STRING_CHARS
                return true;
            },
        },
        print: {
            full: function BYT() {
                let cc;
                if (ATYP !== STRING_CHARS) return false;
                if (IPOS >= IREP.length) return false;
                cc = IREP[IPOS];
                if (cc !== 0x5c) return false;
                IPOS += 1;
                return true;
            },
            infer: () => true,
        },
    });

    // SequenceExpression
    const ꐚCHARᱻ23 = createRule(mode, {
        parse: {
            full: function SEQ() {
                const IPOSₒ = IPOS, OPOSₒ = OPOS, ATYPₒ = ATYP;
                if (!ꐚCHARᱻ24()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚCHARᱻ25()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                return true;
            },
            infer: () => {
                ꐚCHARᱻ24.infer();
                ꐚCHARᱻ25.infer();
                return true;
            },
        },
        print: {
            full: function SEQ() {
                const IPOSₒ = IPOS, OPOSₒ = OPOS, ATYPₒ = ATYP;
                if (!ꐚCHARᱻ24()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚCHARᱻ25()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                return true;
            },
            infer: () => {
                ꐚCHARᱻ24.infer();
                ꐚCHARᱻ25.infer();
                return true;
            },
        },
    });

    // ByteExpression
    const ꐚCHARᱻ24 = createRule(mode, {
        parse: {
            full: function BYT() {
                let cc;
                if (IPOS >= IREP.length) return false;
                cc = IREP[IPOS];
                if (cc !== 0x2f) return false;
                IPOS += 1;
                return true;
            },
            infer: () => true,
        },
        print: {
            full: function BYT() {
                let cc;
                cc = 0x2f;
                OREP[OPOS++] = cc;
                return true;
            },
            infer: () => {
                OREP[OPOS++] = 0x2f;
                return true;
            },
        },
    });

    // ByteExpression
    const ꐚCHARᱻ25 = createRule(mode, {
        parse: {
            full: function BYT() {
                let cc;
                cc = 0x2f;
                OREP[OPOS++] = cc;
                ATYP |= STRING_CHARS
                return true;
            },
            infer: () => {
                OREP[OPOS++] = 0x2f;
                ATYP |= STRING_CHARS
                return true;
            },
        },
        print: {
            full: function BYT() {
                let cc;
                if (ATYP !== STRING_CHARS) return false;
                if (IPOS >= IREP.length) return false;
                cc = IREP[IPOS];
                if (cc !== 0x2f) return false;
                IPOS += 1;
                return true;
            },
            infer: () => true,
        },
    });

    // SequenceExpression
    const ꐚCHARᱻ26 = createRule(mode, {
        parse: {
            full: function SEQ() {
                const IPOSₒ = IPOS, OPOSₒ = OPOS, ATYPₒ = ATYP;
                if (!ꐚCHARᱻ27()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚCHARᱻ28()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                return true;
            },
            infer: () => {
                ꐚCHARᱻ27.infer();
                ꐚCHARᱻ28.infer();
                return true;
            },
        },
        print: {
            full: function SEQ() {
                const IPOSₒ = IPOS, OPOSₒ = OPOS, ATYPₒ = ATYP;
                if (!ꐚCHARᱻ27()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚCHARᱻ28()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                return true;
            },
            infer: () => {
                ꐚCHARᱻ27.infer();
                ꐚCHARᱻ28.infer();
                return true;
            },
        },
    });

    // ByteExpression
    const ꐚCHARᱻ27 = createRule(mode, {
        parse: {
            full: function BYT() {
                let cc;
                if (IPOS >= IREP.length) return false;
                cc = IREP[IPOS];
                if (cc !== 0x62) return false;
                IPOS += 1;
                return true;
            },
            infer: () => true,
        },
        print: {
            full: function BYT() {
                let cc;
                cc = 0x62;
                OREP[OPOS++] = cc;
                return true;
            },
            infer: () => {
                OREP[OPOS++] = 0x62;
                return true;
            },
        },
    });

    // ByteExpression
    const ꐚCHARᱻ28 = createRule(mode, {
        parse: {
            full: function BYT() {
                let cc;
                cc = 0x08;
                OREP[OPOS++] = cc;
                ATYP |= STRING_CHARS
                return true;
            },
            infer: () => {
                OREP[OPOS++] = 0x08;
                ATYP |= STRING_CHARS
                return true;
            },
        },
        print: {
            full: function BYT() {
                let cc;
                if (ATYP !== STRING_CHARS) return false;
                if (IPOS >= IREP.length) return false;
                cc = IREP[IPOS];
                if (cc !== 0x08) return false;
                IPOS += 1;
                return true;
            },
            infer: () => true,
        },
    });

    // SequenceExpression
    const ꐚCHARᱻ29 = createRule(mode, {
        parse: {
            full: function SEQ() {
                const IPOSₒ = IPOS, OPOSₒ = OPOS, ATYPₒ = ATYP;
                if (!ꐚCHARᱻ30()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚCHARᱻ31()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                return true;
            },
            infer: () => {
                ꐚCHARᱻ30.infer();
                ꐚCHARᱻ31.infer();
                return true;
            },
        },
        print: {
            full: function SEQ() {
                const IPOSₒ = IPOS, OPOSₒ = OPOS, ATYPₒ = ATYP;
                if (!ꐚCHARᱻ30()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚCHARᱻ31()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                return true;
            },
            infer: () => {
                ꐚCHARᱻ30.infer();
                ꐚCHARᱻ31.infer();
                return true;
            },
        },
    });

    // ByteExpression
    const ꐚCHARᱻ30 = createRule(mode, {
        parse: {
            full: function BYT() {
                let cc;
                if (IPOS >= IREP.length) return false;
                cc = IREP[IPOS];
                if (cc !== 0x66) return false;
                IPOS += 1;
                return true;
            },
            infer: () => true,
        },
        print: {
            full: function BYT() {
                let cc;
                cc = 0x66;
                OREP[OPOS++] = cc;
                return true;
            },
            infer: () => {
                OREP[OPOS++] = 0x66;
                return true;
            },
        },
    });

    // ByteExpression
    const ꐚCHARᱻ31 = createRule(mode, {
        parse: {
            full: function BYT() {
                let cc;
                cc = 0x0c;
                OREP[OPOS++] = cc;
                ATYP |= STRING_CHARS
                return true;
            },
            infer: () => {
                OREP[OPOS++] = 0x0c;
                ATYP |= STRING_CHARS
                return true;
            },
        },
        print: {
            full: function BYT() {
                let cc;
                if (ATYP !== STRING_CHARS) return false;
                if (IPOS >= IREP.length) return false;
                cc = IREP[IPOS];
                if (cc !== 0x0c) return false;
                IPOS += 1;
                return true;
            },
            infer: () => true,
        },
    });

    // SequenceExpression
    const ꐚCHARᱻ32 = createRule(mode, {
        parse: {
            full: function SEQ() {
                const IPOSₒ = IPOS, OPOSₒ = OPOS, ATYPₒ = ATYP;
                if (!ꐚCHARᱻ33()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚCHARᱻ34()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                return true;
            },
            infer: () => {
                ꐚCHARᱻ33.infer();
                ꐚCHARᱻ34.infer();
                return true;
            },
        },
        print: {
            full: function SEQ() {
                const IPOSₒ = IPOS, OPOSₒ = OPOS, ATYPₒ = ATYP;
                if (!ꐚCHARᱻ33()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚCHARᱻ34()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                return true;
            },
            infer: () => {
                ꐚCHARᱻ33.infer();
                ꐚCHARᱻ34.infer();
                return true;
            },
        },
    });

    // ByteExpression
    const ꐚCHARᱻ33 = createRule(mode, {
        parse: {
            full: function BYT() {
                let cc;
                if (IPOS >= IREP.length) return false;
                cc = IREP[IPOS];
                if (cc !== 0x6e) return false;
                IPOS += 1;
                return true;
            },
            infer: () => true,
        },
        print: {
            full: function BYT() {
                let cc;
                cc = 0x6e;
                OREP[OPOS++] = cc;
                return true;
            },
            infer: () => {
                OREP[OPOS++] = 0x6e;
                return true;
            },
        },
    });

    // ByteExpression
    const ꐚCHARᱻ34 = createRule(mode, {
        parse: {
            full: function BYT() {
                let cc;
                cc = 0x0a;
                OREP[OPOS++] = cc;
                ATYP |= STRING_CHARS
                return true;
            },
            infer: () => {
                OREP[OPOS++] = 0x0a;
                ATYP |= STRING_CHARS
                return true;
            },
        },
        print: {
            full: function BYT() {
                let cc;
                if (ATYP !== STRING_CHARS) return false;
                if (IPOS >= IREP.length) return false;
                cc = IREP[IPOS];
                if (cc !== 0x0a) return false;
                IPOS += 1;
                return true;
            },
            infer: () => true,
        },
    });

    // SequenceExpression
    const ꐚCHARᱻ35 = createRule(mode, {
        parse: {
            full: function SEQ() {
                const IPOSₒ = IPOS, OPOSₒ = OPOS, ATYPₒ = ATYP;
                if (!ꐚCHARᱻ36()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚCHARᱻ37()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                return true;
            },
            infer: () => {
                ꐚCHARᱻ36.infer();
                ꐚCHARᱻ37.infer();
                return true;
            },
        },
        print: {
            full: function SEQ() {
                const IPOSₒ = IPOS, OPOSₒ = OPOS, ATYPₒ = ATYP;
                if (!ꐚCHARᱻ36()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚCHARᱻ37()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                return true;
            },
            infer: () => {
                ꐚCHARᱻ36.infer();
                ꐚCHARᱻ37.infer();
                return true;
            },
        },
    });

    // ByteExpression
    const ꐚCHARᱻ36 = createRule(mode, {
        parse: {
            full: function BYT() {
                let cc;
                if (IPOS >= IREP.length) return false;
                cc = IREP[IPOS];
                if (cc !== 0x72) return false;
                IPOS += 1;
                return true;
            },
            infer: () => true,
        },
        print: {
            full: function BYT() {
                let cc;
                cc = 0x72;
                OREP[OPOS++] = cc;
                return true;
            },
            infer: () => {
                OREP[OPOS++] = 0x72;
                return true;
            },
        },
    });

    // ByteExpression
    const ꐚCHARᱻ37 = createRule(mode, {
        parse: {
            full: function BYT() {
                let cc;
                cc = 0x0d;
                OREP[OPOS++] = cc;
                ATYP |= STRING_CHARS
                return true;
            },
            infer: () => {
                OREP[OPOS++] = 0x0d;
                ATYP |= STRING_CHARS
                return true;
            },
        },
        print: {
            full: function BYT() {
                let cc;
                if (ATYP !== STRING_CHARS) return false;
                if (IPOS >= IREP.length) return false;
                cc = IREP[IPOS];
                if (cc !== 0x0d) return false;
                IPOS += 1;
                return true;
            },
            infer: () => true,
        },
    });

    // SequenceExpression
    const ꐚCHARᱻ38 = createRule(mode, {
        parse: {
            full: function SEQ() {
                const IPOSₒ = IPOS, OPOSₒ = OPOS, ATYPₒ = ATYP;
                if (!ꐚCHARᱻ39()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚCHARᱻ40()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                return true;
            },
            infer: () => {
                ꐚCHARᱻ39.infer();
                ꐚCHARᱻ40.infer();
                return true;
            },
        },
        print: {
            full: function SEQ() {
                const IPOSₒ = IPOS, OPOSₒ = OPOS, ATYPₒ = ATYP;
                if (!ꐚCHARᱻ39()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚCHARᱻ40()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                return true;
            },
            infer: () => {
                ꐚCHARᱻ39.infer();
                ꐚCHARᱻ40.infer();
                return true;
            },
        },
    });

    // ByteExpression
    const ꐚCHARᱻ39 = createRule(mode, {
        parse: {
            full: function BYT() {
                let cc;
                if (IPOS >= IREP.length) return false;
                cc = IREP[IPOS];
                if (cc !== 0x74) return false;
                IPOS += 1;
                return true;
            },
            infer: () => true,
        },
        print: {
            full: function BYT() {
                let cc;
                cc = 0x74;
                OREP[OPOS++] = cc;
                return true;
            },
            infer: () => {
                OREP[OPOS++] = 0x74;
                return true;
            },
        },
    });

    // ByteExpression
    const ꐚCHARᱻ40 = createRule(mode, {
        parse: {
            full: function BYT() {
                let cc;
                cc = 0x09;
                OREP[OPOS++] = cc;
                ATYP |= STRING_CHARS
                return true;
            },
            infer: () => {
                OREP[OPOS++] = 0x09;
                ATYP |= STRING_CHARS
                return true;
            },
        },
        print: {
            full: function BYT() {
                let cc;
                if (ATYP !== STRING_CHARS) return false;
                if (IPOS >= IREP.length) return false;
                cc = IREP[IPOS];
                if (cc !== 0x09) return false;
                IPOS += 1;
                return true;
            },
            infer: () => true,
        },
    });

    // SequenceExpression
    const ꐚCHARᱻ41 = createRule(mode, {
        parse: {
            full: function SEQ() {
                const IPOSₒ = IPOS, OPOSₒ = OPOS, ATYPₒ = ATYP;
                if (!ꐚCHARᱻ42()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚCHARᱻ43()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                return true;
            },
            infer: () => {
                ꐚCHARᱻ42.infer();
                ꐚCHARᱻ43.infer();
                return true;
            },
        },
        print: {
            full: function SEQ() {
                const IPOSₒ = IPOS, OPOSₒ = OPOS, ATYPₒ = ATYP;
                if (!ꐚCHARᱻ42()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚCHARᱻ43()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                return true;
            },
            infer: () => {
                ꐚCHARᱻ42.infer();
                ꐚCHARᱻ43.infer();
                return true;
            },
        },
    });

    // ByteExpression
    const ꐚCHARᱻ42 = createRule(mode, {
        parse: {
            full: function BYT() {
                let cc;
                if (IPOS >= IREP.length) return false;
                cc = IREP[IPOS];
                if (cc !== 0x75) return false;
                IPOS += 1;
                return true;
            },
            infer: () => true,
        },
        print: {
            full: function BYT() {
                let cc;
                cc = 0x75;
                OREP[OPOS++] = cc;
                return true;
            },
            infer: () => {
                OREP[OPOS++] = 0x75;
                return true;
            },
        },
    });

    // ApplicationExpression
    const ꐚCHARᱻ43 = lazy(() => ꐚunicode(ꐚCHARᱻ44));

    // Module
    const ꐚCHARᱻ44 = (member) => {
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
                const IPOSₒ = IPOS, OPOSₒ = OPOS, ATYPₒ = ATYP;
                if (!ꐚWS()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚLBRACEᱻ1()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚWS()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                return true;
            },
            infer: () => {
                ꐚWS.infer();
                ꐚLBRACEᱻ1.infer();
                ꐚWS.infer();
                return true;
            },
        },
        print: {
            full: function SEQ() {
                const IPOSₒ = IPOS, OPOSₒ = OPOS, ATYPₒ = ATYP;
                if (!ꐚWS()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚLBRACEᱻ1()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚWS()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                return true;
            },
            infer: () => {
                ꐚWS.infer();
                ꐚLBRACEᱻ1.infer();
                ꐚWS.infer();
                return true;
            },
        },
    });

    // ByteExpression
    const ꐚLBRACEᱻ1 = createRule(mode, {
        parse: {
            full: function BYT() {
                let cc;
                if (IPOS >= IREP.length) return false;
                cc = IREP[IPOS];
                if (cc !== 0x7b) return false;
                IPOS += 1;
                return true;
            },
            infer: () => true,
        },
        print: {
            full: function BYT() {
                let cc;
                cc = 0x7b;
                OREP[OPOS++] = cc;
                return true;
            },
            infer: () => {
                OREP[OPOS++] = 0x7b;
                return true;
            },
        },
    });

    // SequenceExpression
    const ꐚRBRACE = createRule(mode, {
        parse: {
            full: function SEQ() {
                const IPOSₒ = IPOS, OPOSₒ = OPOS, ATYPₒ = ATYP;
                if (!ꐚWS()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚRBRACEᱻ1()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚWS()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                return true;
            },
            infer: () => {
                ꐚWS.infer();
                ꐚRBRACEᱻ1.infer();
                ꐚWS.infer();
                return true;
            },
        },
        print: {
            full: function SEQ() {
                const IPOSₒ = IPOS, OPOSₒ = OPOS, ATYPₒ = ATYP;
                if (!ꐚWS()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚRBRACEᱻ1()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚWS()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                return true;
            },
            infer: () => {
                ꐚWS.infer();
                ꐚRBRACEᱻ1.infer();
                ꐚWS.infer();
                return true;
            },
        },
    });

    // ByteExpression
    const ꐚRBRACEᱻ1 = createRule(mode, {
        parse: {
            full: function BYT() {
                let cc;
                if (IPOS >= IREP.length) return false;
                cc = IREP[IPOS];
                if (cc !== 0x7d) return false;
                IPOS += 1;
                return true;
            },
            infer: () => true,
        },
        print: {
            full: function BYT() {
                let cc;
                cc = 0x7d;
                OREP[OPOS++] = cc;
                return true;
            },
            infer: () => {
                OREP[OPOS++] = 0x7d;
                return true;
            },
        },
    });

    // SequenceExpression
    const ꐚLBRACKET = createRule(mode, {
        parse: {
            full: function SEQ() {
                const IPOSₒ = IPOS, OPOSₒ = OPOS, ATYPₒ = ATYP;
                if (!ꐚWS()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚLBRACKETᱻ1()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚWS()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                return true;
            },
            infer: () => {
                ꐚWS.infer();
                ꐚLBRACKETᱻ1.infer();
                ꐚWS.infer();
                return true;
            },
        },
        print: {
            full: function SEQ() {
                const IPOSₒ = IPOS, OPOSₒ = OPOS, ATYPₒ = ATYP;
                if (!ꐚWS()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚLBRACKETᱻ1()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚWS()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                return true;
            },
            infer: () => {
                ꐚWS.infer();
                ꐚLBRACKETᱻ1.infer();
                ꐚWS.infer();
                return true;
            },
        },
    });

    // ByteExpression
    const ꐚLBRACKETᱻ1 = createRule(mode, {
        parse: {
            full: function BYT() {
                let cc;
                if (IPOS >= IREP.length) return false;
                cc = IREP[IPOS];
                if (cc !== 0x5b) return false;
                IPOS += 1;
                return true;
            },
            infer: () => true,
        },
        print: {
            full: function BYT() {
                let cc;
                cc = 0x5b;
                OREP[OPOS++] = cc;
                return true;
            },
            infer: () => {
                OREP[OPOS++] = 0x5b;
                return true;
            },
        },
    });

    // SequenceExpression
    const ꐚRBRACKET = createRule(mode, {
        parse: {
            full: function SEQ() {
                const IPOSₒ = IPOS, OPOSₒ = OPOS, ATYPₒ = ATYP;
                if (!ꐚWS()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚRBRACKETᱻ1()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚWS()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                return true;
            },
            infer: () => {
                ꐚWS.infer();
                ꐚRBRACKETᱻ1.infer();
                ꐚWS.infer();
                return true;
            },
        },
        print: {
            full: function SEQ() {
                const IPOSₒ = IPOS, OPOSₒ = OPOS, ATYPₒ = ATYP;
                if (!ꐚWS()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚRBRACKETᱻ1()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚWS()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                return true;
            },
            infer: () => {
                ꐚWS.infer();
                ꐚRBRACKETᱻ1.infer();
                ꐚWS.infer();
                return true;
            },
        },
    });

    // ByteExpression
    const ꐚRBRACKETᱻ1 = createRule(mode, {
        parse: {
            full: function BYT() {
                let cc;
                if (IPOS >= IREP.length) return false;
                cc = IREP[IPOS];
                if (cc !== 0x5d) return false;
                IPOS += 1;
                return true;
            },
            infer: () => true,
        },
        print: {
            full: function BYT() {
                let cc;
                cc = 0x5d;
                OREP[OPOS++] = cc;
                return true;
            },
            infer: () => {
                OREP[OPOS++] = 0x5d;
                return true;
            },
        },
    });

    // SequenceExpression
    const ꐚCOLON = createRule(mode, {
        parse: {
            full: function SEQ() {
                const IPOSₒ = IPOS, OPOSₒ = OPOS, ATYPₒ = ATYP;
                if (!ꐚWS()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚCOLONᱻ1()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚWS()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                return true;
            },
            infer: () => {
                ꐚWS.infer();
                ꐚCOLONᱻ1.infer();
                ꐚWS.infer();
                return true;
            },
        },
        print: {
            full: function SEQ() {
                const IPOSₒ = IPOS, OPOSₒ = OPOS, ATYPₒ = ATYP;
                if (!ꐚWS()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚCOLONᱻ1()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚWS()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                return true;
            },
            infer: () => {
                ꐚWS.infer();
                ꐚCOLONᱻ1.infer();
                ꐚWS.infer();
                return true;
            },
        },
    });

    // ByteExpression
    const ꐚCOLONᱻ1 = createRule(mode, {
        parse: {
            full: function BYT() {
                let cc;
                if (IPOS >= IREP.length) return false;
                cc = IREP[IPOS];
                if (cc !== 0x3a) return false;
                IPOS += 1;
                return true;
            },
            infer: () => true,
        },
        print: {
            full: function BYT() {
                let cc;
                cc = 0x3a;
                OREP[OPOS++] = cc;
                return true;
            },
            infer: () => {
                OREP[OPOS++] = 0x3a;
                return true;
            },
        },
    });

    // SequenceExpression
    const ꐚCOMMA = createRule(mode, {
        parse: {
            full: function SEQ() {
                const IPOSₒ = IPOS, OPOSₒ = OPOS, ATYPₒ = ATYP;
                if (!ꐚWS()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚCOMMAᱻ1()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚWS()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                return true;
            },
            infer: () => {
                ꐚWS.infer();
                ꐚCOMMAᱻ1.infer();
                ꐚWS.infer();
                return true;
            },
        },
        print: {
            full: function SEQ() {
                const IPOSₒ = IPOS, OPOSₒ = OPOS, ATYPₒ = ATYP;
                if (!ꐚWS()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚCOMMAᱻ1()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚWS()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                return true;
            },
            infer: () => {
                ꐚWS.infer();
                ꐚCOMMAᱻ1.infer();
                ꐚWS.infer();
                return true;
            },
        },
    });

    // ByteExpression
    const ꐚCOMMAᱻ1 = createRule(mode, {
        parse: {
            full: function BYT() {
                let cc;
                if (IPOS >= IREP.length) return false;
                cc = IREP[IPOS];
                if (cc !== 0x2c) return false;
                IPOS += 1;
                return true;
            },
            infer: () => true,
        },
        print: {
            full: function BYT() {
                let cc;
                cc = 0x2c;
                OREP[OPOS++] = cc;
                return true;
            },
            infer: () => {
                OREP[OPOS++] = 0x2c;
                return true;
            },
        },
    });

    // ByteExpression
    const ꐚDOUBLE_QUOTE = createRule(mode, {
        parse: {
            full: function BYT() {
                let cc;
                if (IPOS >= IREP.length) return false;
                cc = IREP[IPOS];
                if (cc !== 0x22) return false;
                IPOS += 1;
                return true;
            },
            infer: () => true,
        },
        print: {
            full: function BYT() {
                let cc;
                cc = 0x22;
                OREP[OPOS++] = cc;
                return true;
            },
            infer: () => {
                OREP[OPOS++] = 0x22;
                return true;
            },
        },
    });

    // QuantifiedExpression
    const ꐚWS = createRule(mode, {
        parse: {
            full: function QUA() {
                let IPOSᐟ = IPOS, OPOSᐟ = OPOS;
                while (true) {
                    if (!ꐚWSᱻ1() || IPOS <= IPOSᐟ) break;
                    IPOSᐟ = IPOS, OPOSᐟ = OPOS;
                }
                IPOS = IPOSᐟ, OPOS = OPOSᐟ;
                return true;
            },
            infer: () => true,
        },
        print: {
            full: function QUA() {
                let IPOSᐟ = IPOS, OPOSᐟ = OPOS;
                while (true) {
                    if (!ꐚWSᱻ1() || IPOS <= IPOSᐟ) break;
                    IPOSᐟ = IPOS, OPOSᐟ = OPOS;
                }
                IPOS = IPOSᐟ, OPOS = OPOSᐟ;
                return true;
            },
            infer: () => true,
        },
    });

    // ByteExpression
    const ꐚWSᱻ1 = createRule(mode, {
        parse: {
            full: function BYT() {
                let cc;
                if (IPOS >= IREP.length) return false;
                cc = IREP[IPOS];
                if (cc !== 0x20 && cc !== 0x09 && cc !== 0x0a && cc !== 0x0d) return false;
                IPOS += 1;
                return true;
            },
            infer: () => true,
        },
        print: {
            full: function BYT() {
                let cc;
                cc = 0x20;
                OREP[OPOS++] = cc;
                return true;
            },
            infer: () => {
                OREP[OPOS++] = 0x20;
                return true;
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
