
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
    ICONTENT = Buffer.isBuffer(stringOrBuffer) ? stringOrBuffer : Buffer.from(stringOrBuffer, 'utf8');
    IPOINTER = 0;
    OCONTENT = [];
    OPOINTER = 0;
    if (!parseValue(startRule))
        throw new Error('parse failed');
    if (IPOINTER !== ICONTENT.length)
        throw new Error('parse didn\\\'t consume entire input');
    if (OPOINTER !== 1)
        throw new Error('parse didn\\\'t produce a singular value');
    return OCONTENT[0];
}
function print(startRule, value, buffer) {
    ICONTENT = [value];
    IPOINTER = 0;
    const buf = OCONTENT = buffer !== null && buffer !== void 0 ? buffer : Buffer.alloc(2 ** 22);
    OPOINTER = 0;
    if (!printValue(startRule))
        throw new Error('print failed');
    if (OPOINTER > OCONTENT.length)
        throw new Error('output buffer too small');
    return buffer ? OPOINTER : buf.toString('utf8', 0, OPOINTER);
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
let ICONTENT;
let IPOINTER = 0;
let OCONTENT;
let OPOINTER = 0;
let DATATYPE = 0;
const [NOTHING, SCALAR, STRING_CHARS, LIST_ELEMENTS, RECORD_FIELDS] = [0, 1, 2, 4, 8];
function parseValue(rule) {
    const OPOINTERₒ = OPOINTER, DATATYPEₒ = DATATYPE;
    DATATYPE = NOTHING;
    if (!rule())
        return DATATYPE = DATATYPEₒ, false;
    if (DATATYPE === NOTHING)
        return OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
    let value;
    switch (DATATYPE) {
        case SCALAR:
            assert(OPOINTER === OPOINTERₒ + 1);
            value = OCONTENT[OPOINTERₒ];
            break;
        case STRING_CHARS:
            const len = OPOINTER - OPOINTERₒ;
            for (let i = 0; i < len; ++i)
                _internalBuffer[i] = OCONTENT[OPOINTERₒ + i];
            value = _internalBuffer.toString('utf8', 0, len);
            break;
        case LIST_ELEMENTS:
            value = OCONTENT.slice(OPOINTERₒ, OPOINTER);
            break;
        case RECORD_FIELDS:
            const obj = value = {};
            for (let i = OPOINTERₒ; i < OPOINTER; i += 2)
                obj[OCONTENT[i]] = OCONTENT[i + 1];
            if (Object.keys(obj).length * 2 < (OPOINTER - OPOINTERₒ))
                throw new Error(`Duplicate labels in record`);
            break;
        default:
            ((atyp) => { throw new Error(`Unhandled abstract type ${atyp}`); })(DATATYPE);
    }
    OCONTENT[OPOINTERₒ] = value;
    OPOINTER = OPOINTERₒ + 1;
    DATATYPE = DATATYPEₒ;
    return true;
}
function printValue(rule) {
    const IPOINTERₒ = IPOINTER, ICONTENTₒ = ICONTENT, DATATYPEₒ = DATATYPE;
    let value = ICONTENT[IPOINTER];
    let atyp;
    let objKeys;
    if (value === undefined) {
        return false;
    }
    if (value === null || value === true || value === false || typeof value === 'number') {
        DATATYPE = SCALAR;
        const result = rule();
        DATATYPE = DATATYPEₒ;
        assert(IPOINTER === IPOINTERₒ + 1);
        return result;
    }
    if (typeof value === 'string') {
        const len = _internalBuffer.write(value, 0, undefined, 'utf8');
        ICONTENT = _internalBuffer.slice(0, len);
        atyp = DATATYPE = STRING_CHARS;
    }
    else if (Array.isArray(value)) {
        ICONTENT = value;
        atyp = DATATYPE = LIST_ELEMENTS;
    }
    else if (isObject(value)) {
        const arr = ICONTENT = [];
        objKeys = Object.keys(value);
        assert(objKeys.length < 32);
        for (let i = 0; i < objKeys.length; ++i)
            arr.push(objKeys[i], value[objKeys[i]]);
        atyp = DATATYPE = RECORD_FIELDS;
    }
    else {
        throw new Error(`Unsupported value type for value ${value}`);
    }
    IPOINTER = 0;
    let result = rule();
    const ICONTENTᐟ = ICONTENT, IPOINTERᐟ = IPOINTER;
    ICONTENT = ICONTENTₒ, IPOINTER = IPOINTERₒ, DATATYPE = DATATYPEₒ;
    if (!result)
        return false;
    if (atyp === RECORD_FIELDS) {
        const keyCount = objKeys.length;
        if (keyCount > 0 && (IPOINTERᐟ !== -1 >>> (32 - keyCount)))
            return false;
    }
    else {
        if (IPOINTERᐟ !== ICONTENTᐟ.length)
            return false;
    }
    IPOINTER += 1;
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
                        const IPOINTERₒ = IPOINTER, OPOINTERₒ = OPOINTER;
                        const ibuffer = ICONTENT; // ICONTENT is always a Buffer when parsing
                        const EOS = 0;
                        let digitCount = 0;
                        // Parse optional '+' or '-' sign
                        let cc = ibuffer[IPOINTER];
                        if (cc === PLUS_SIGN || cc === MINUS_SIGN) {
                            IPOINTER += 1;
                            cc = IPOINTER < ICONTENT.length ? ibuffer[IPOINTER] : EOS;
                        }
                        // Parse 0..M digits
                        while (true) {
                            if (cc < ZERO_DIGIT || cc > NINE_DIGIT)
                                break;
                            digitCount += 1;
                            IPOINTER += 1;
                            cc = IPOINTER < ICONTENT.length ? ibuffer[IPOINTER] : EOS;
                        }
                        // Parse optional '.'
                        if (cc === DECIMAL_POINT) {
                            IPOINTER += 1;
                            cc = IPOINTER < ICONTENT.length ? ibuffer[IPOINTER] : EOS;
                        }
                        // Parse 0..M digits
                        while (true) {
                            if (cc < ZERO_DIGIT || cc > NINE_DIGIT)
                                break;
                            digitCount += 1;
                            IPOINTER += 1;
                            cc = IPOINTER < ICONTENT.length ? ibuffer[IPOINTER] : EOS;
                        }
                        // Ensure we have parsed at least one significant digit
                        if (digitCount === 0)
                            return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, false;
                        // Parse optional exponent
                        if (cc === UPPERCASE_E || cc === LOWERCASE_E) {
                            IPOINTER += 1;
                            cc = IPOINTER < ICONTENT.length ? ibuffer[IPOINTER] : EOS;
                            // Parse optional '+' or '-' sign
                            if (cc === PLUS_SIGN || cc === MINUS_SIGN) {
                                IPOINTER += 1;
                                cc = IPOINTER < ICONTENT.length ? ibuffer[IPOINTER] : EOS;
                            }
                            // Parse 1..M digits
                            digitCount = 0;
                            while (true) {
                                if (cc < ZERO_DIGIT || cc > NINE_DIGIT)
                                    break;
                                digitCount += 1;
                                IPOINTER += 1;
                                cc = IPOINTER < ICONTENT.length ? ibuffer[IPOINTER] : EOS;
                            }
                            if (digitCount === 0)
                                return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, false;
                        }
                        // There is a syntactically valid float. Delegate parsing to the JS runtime.
                        // Reject the number if it parses to Infinity or Nan.
                        // TODO: the conversion may still be lossy. Provide a non-lossy mode, like `safenum` does?
                        const num = Number.parseFloat(ibuffer.toString('utf8', IPOINTERₒ, IPOINTER));
                        if (!Number.isFinite(num))
                            return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, false;
                        // Success
                        OCONTENT[OPOINTER++] = num;
                        DATATYPE |= SCALAR;
                        return true;
                    },
                    infer: function ISTR() {
                        OCONTENT[OPOINTER++] = 0;
                        DATATYPE |= SCALAR;
                        return true;
                    },
                },
                print: {
                    full: function FSTR() {
                        if (DATATYPE !== SCALAR)
                            return false;
                        const obuffer = OCONTENT; // OCONTENT is always a Buffer when printing
                        const num = ICONTENT[IPOINTER];
                        if (typeof num !== 'number')
                            return false;
                        IPOINTER += 1;
                        // Delegate unparsing to the JS runtime.
                        // TODO: the conversion may not exactly match the original string. Add this to the lossiness list.
                        const out = String(num);
                        // Success
                        OPOINTER += obuffer.write(out, OPOINTER, undefined, 'utf8');
                        return true;
                    },
                    infer: function FSTR() {
                        OCONTENT[OPOINTER++] = ZERO_DIGIT;
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
                            const IPOINTERₒ = IPOINTER, OPOINTERₒ = OPOINTER;
                            const ibuffer = ICONTENT; // ICONTENT is always a Buffer when parsing
                            const ilen = ICONTENT.length;
                            // Parse optional leading '-' sign (if signed)...
                            let MAX_NUM = signed ? 0x7FFFFFFF : 0xFFFFFFFF;
                            let isNegative = false;
                            if (signed && IPOINTER < ilen && ICONTENT[IPOINTER] === HYPHEN) {
                                isNegative = true;
                                MAX_NUM = 0x80000000;
                                IPOINTER += 1;
                            }
                            // ...followed by one or more decimal digits. (NB: no exponents).
                            let num = 0;
                            let digits = 0;
                            while (IPOINTER < ilen) {
                                // Read a digit.
                                let c = ibuffer[IPOINTER];
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
                                    return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, false;
                                // Loop again.
                                IPOINTER += 1;
                                digits += 1;
                            }
                            // Check that we parsed at least one digit.
                            if (digits === 0)
                                return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, false;
                            // Apply the sign.
                            if (isNegative)
                                num = -num;
                            // Success
                            OCONTENT[OPOINTER++] = num;
                            DATATYPE |= SCALAR;
                            return true;
                        },
                        infer: function ISTR() {
                            OCONTENT[OPOINTER++] = 0;
                            DATATYPE |= SCALAR;
                            return true;
                        },
                    },
                    print: {
                        full: function ISTR() {
                            if (DATATYPE !== SCALAR)
                                return false;
                            let num = ICONTENT[IPOINTER];
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
                            IPOINTER += 1;
                            if (isNegative)
                                digits.push(HYPHEN);
                            // Success
                            for (let i = 0; i < digits.length; ++i) {
                                OCONTENT[OPOINTER++] = digits[i];
                            }
                            return true;
                        },
                        infer: function ISTR() {
                            OCONTENT[OPOINTER++] = CHAR_CODES[0];
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
                            const IPOINTERₒ = IPOINTER, OPOINTERₒ = OPOINTER, DATATYPEₒ = DATATYPE;
                            // Check whether the memo table already has an entry for the given initial state.
                            let memos2 = memos.get(ICONTENT);
                            if (memos2 === undefined) {
                                memos2 = new Map();
                                memos.set(ICONTENT, memos2);
                            }
                            let memo = memos2.get(IPOINTER);
                            if (!memo) {
                                // The memo table does *not* have an entry, so this is the first attempt to apply this rule with
                                // this initial state. The first thing we do is create a memo table entry, which is marked as
                                // *unresolved*. All future applications of this rule with the same initial state will find this
                                // memo. If a future application finds the memo still unresolved, then we know we have encountered
                                // left-recursion.
                                memo = { resolved: false, isLeftRecursive: false, result: false, IPOINTERᐟ: IPOINTERₒ, OCONTENTᐞ: [], DATATYPEᐟ: NOTHING };
                                memos2.set(IPOINTER, memo);
                                // Now that the unresolved memo is in place, apply the rule, and resolve the memo with the result.
                                // At this point, any left-recursive paths encountered during application are guaranteed to have
                                // been noted and aborted (see below).
                                if (expr()) { // TODO: fix cast
                                    memo.result = true;
                                    memo.IPOINTERᐟ = IPOINTER;
                                    memo.OCONTENTᐞ = OCONTENT.slice(OPOINTERₒ, OPOINTER);
                                    memo.DATATYPEᐟ = DATATYPE;
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
                                    IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ;
                                    // TODO: break cases for UNPARSING:
                                    // anything --> same thing (covers all string cases, since they can only be same or shorter)
                                    // some node --> some different non-empty node (assert: should never happen!)
                                    if (!expr())
                                        break; // TODO: fix cast
                                    if (IPOINTER <= memo.IPOINTERᐟ)
                                        break;
                                    // TODO: was for unparse... comment above says should never happen...
                                    // if (!isInputFullyConsumed()) break;
                                    memo.IPOINTERᐟ = IPOINTER;
                                    memo.OCONTENTᐞ = OCONTENT.slice(OPOINTERₒ, OPOINTER);
                                    memo.DATATYPEᐟ = DATATYPE;
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
                            DATATYPE = memo.DATATYPEᐟ;
                            OPOINTER = OPOINTERₒ;
                            IPOINTER = memo.IPOINTERᐟ;
                            for (let i = 0; i < memo.OCONTENTᐞ.length; ++i)
                                OCONTENT[OPOINTER++] = memo.OCONTENTᐞ[i];
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
                            const IPOINTERₒ = IPOINTER, OPOINTERₒ = OPOINTER;
                            const ibuffer = ICONTENT; // ICONTENT is always a Buffer when parsing
                            const ilen = ICONTENT.length;
                            const EOS = '';
                            let len = 0;
                            let num = ''; // TODO: fix this - should actually keep count
                            let c = IPOINTER < ilen ? String.fromCharCode(ibuffer[IPOINTER]) : EOS; // TODO: convoluted - simplify whole method
                            while (true) {
                                if (!regex.test(c))
                                    break;
                                num += c;
                                IPOINTER += 1;
                                len += 1;
                                if (len === maxDigits)
                                    break;
                                c = IPOINTER < ilen ? String.fromCharCode(ibuffer[IPOINTER]) : EOS;
                            }
                            if (len < minDigits)
                                return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, false;
                            // tslint:disable-next-line: no-eval
                            const buf = Buffer.from(eval(`"\\u{${num}}"`)); // TODO: hacky... fix when we have a charCode
                            for (let i = 0; i < buf.length; ++i)
                                OCONTENT[OPOINTER++] = buf[i];
                            DATATYPE |= STRING_CHARS;
                            return true;
                        },
                        infer: function UNI() {
                            // TODO: generate default value...
                            throw new Error('unicode parse.infer: Not implemented');
                        },
                    },
                    print: {
                        full: function UNI() {
                            const ilen = ICONTENT.length;
                            if (DATATYPE !== STRING_CHARS || IPOINTER >= ilen)
                                return false;
                            const IPOINTERₒ = IPOINTER, OPOINTERₒ = OPOINTER;
                            const ibuffer = ICONTENT; // ICONTENT is a Buffer when DATATYPE === STRING_CHARS
                            const obuffer = OCONTENT; // OCONTENT is always a Buffer when printing
                            let c = ibuffer[IPOINTER++];
                            if (c < 128) {
                                // no-op
                            }
                            else if (c > 191 && c < 224) {
                                if (IPOINTER >= ilen)
                                    return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, false;
                                c = (c & 31) << 6 | ibuffer[IPOINTER++] & 63;
                            }
                            else if (c > 223 && c < 240) {
                                if (IPOINTER + 1 >= ilen)
                                    return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, false;
                                c = (c & 15) << 12 | (ibuffer[IPOINTER++] & 63) << 6 | ibuffer[IPOINTER++] & 63;
                            }
                            else if (c > 239 && c < 248) {
                                if (IPOINTER + 2 >= ilen)
                                    return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, false;
                                c = (c & 7) << 18 | (ibuffer[IPOINTER++] & 63) << 12 | (ibuffer[IPOINTER++] & 63) << 6 | ibuffer[IPOINTER++] & 63;
                            }
                            else
                                return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, false;
                            const s = c.toString(base).padStart(minDigits, '0');
                            if (s.length > maxDigits)
                                return false;
                            obuffer.write(s, OPOINTER);
                            OPOINTER += s.length;
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
                const IPOINTERₒ = IPOINTER, OPOINTERₒ = OPOINTER, DATATYPEₒ = DATATYPE;
                if (!ꐚWS()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
                if (!ꐚValue()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
                if (!ꐚWS()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
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
                const IPOINTERₒ = IPOINTER, OPOINTERₒ = OPOINTER, DATATYPEₒ = DATATYPE;
                if (!ꐚWS()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
                if (!ꐚValue()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
                if (!ꐚWS()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
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
                const IPOINTERₒ = IPOINTER, OPOINTERₒ = OPOINTER, DATATYPEₒ = DATATYPE;
                if (!ꐚFalseᱻ1()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
                if (!ꐚFalseᱻ2()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
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
                const IPOINTERₒ = IPOINTER, OPOINTERₒ = OPOINTER, DATATYPEₒ = DATATYPE;
                if (!ꐚFalseᱻ1()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
                if (!ꐚFalseᱻ2()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
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
                if (IPOINTER + 5 > ICONTENT.length) return false;
                if (ICONTENT[IPOINTER + 0] !== 0x66) return false;
                if (ICONTENT[IPOINTER + 1] !== 0x61) return false;
                if (ICONTENT[IPOINTER + 2] !== 0x6c) return false;
                if (ICONTENT[IPOINTER + 3] !== 0x73) return false;
                if (ICONTENT[IPOINTER + 4] !== 0x65) return false;
                IPOINTER += 5;
                return true;
            },
            infer: function STR() {
                return true;
            },
        },
        print: {
            full: function STR() {
                OCONTENT[OPOINTER++] = 0x66;
                OCONTENT[OPOINTER++] = 0x61;
                OCONTENT[OPOINTER++] = 0x6c;
                OCONTENT[OPOINTER++] = 0x73;
                OCONTENT[OPOINTER++] = 0x65;
                return true;
            },
            infer: function STR() {
                OCONTENT[OPOINTER++] = 0x66;
                OCONTENT[OPOINTER++] = 0x61;
                OCONTENT[OPOINTER++] = 0x6c;
                OCONTENT[OPOINTER++] = 0x73;
                OCONTENT[OPOINTER++] = 0x65;
                return true;
            },
        },
        constant: "false",
    });

    // BooleanLiteral
    const ꐚFalseᱻ2 = createRule(mode, {
        parse: {
            full: () => {
                OCONTENT[OPOINTER++] = false;
                DATATYPE |= SCALAR;
                return true;
            },
            infer: () => {
                OCONTENT[OPOINTER++] = false;
                DATATYPE != SCALAR;
                return true;
            },
        },
        print: {
            full: function LIT() {
                if (DATATYPE !== SCALAR) return false;
                if (ICONTENT[IPOINTER] !== false) return false;
                IPOINTER += 1;
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
                const IPOINTERₒ = IPOINTER, OPOINTERₒ = OPOINTER, DATATYPEₒ = DATATYPE;
                if (!ꐚNullᱻ1()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
                if (!ꐚNullᱻ2()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
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
                const IPOINTERₒ = IPOINTER, OPOINTERₒ = OPOINTER, DATATYPEₒ = DATATYPE;
                if (!ꐚNullᱻ1()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
                if (!ꐚNullᱻ2()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
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
                if (IPOINTER + 4 > ICONTENT.length) return false;
                if (ICONTENT[IPOINTER + 0] !== 0x6e) return false;
                if (ICONTENT[IPOINTER + 1] !== 0x75) return false;
                if (ICONTENT[IPOINTER + 2] !== 0x6c) return false;
                if (ICONTENT[IPOINTER + 3] !== 0x6c) return false;
                IPOINTER += 4;
                return true;
            },
            infer: function STR() {
                return true;
            },
        },
        print: {
            full: function STR() {
                OCONTENT[OPOINTER++] = 0x6e;
                OCONTENT[OPOINTER++] = 0x75;
                OCONTENT[OPOINTER++] = 0x6c;
                OCONTENT[OPOINTER++] = 0x6c;
                return true;
            },
            infer: function STR() {
                OCONTENT[OPOINTER++] = 0x6e;
                OCONTENT[OPOINTER++] = 0x75;
                OCONTENT[OPOINTER++] = 0x6c;
                OCONTENT[OPOINTER++] = 0x6c;
                return true;
            },
        },
        constant: "null",
    });

    // NullLiteral
    const ꐚNullᱻ2 = createRule(mode, {
        parse: {
            full: () => {
                OCONTENT[OPOINTER++] = null;
                DATATYPE |= SCALAR;
                return true;
            },
            infer: () => {
                OCONTENT[OPOINTER++] = null;
                DATATYPE != SCALAR;
                return true;
            },
        },
        print: {
            full: function LIT() {
                if (DATATYPE !== SCALAR) return false;
                if (ICONTENT[IPOINTER] !== null) return false;
                IPOINTER += 1;
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
                const IPOINTERₒ = IPOINTER, OPOINTERₒ = OPOINTER, DATATYPEₒ = DATATYPE;
                if (!ꐚTrueᱻ1()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
                if (!ꐚTrueᱻ2()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
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
                const IPOINTERₒ = IPOINTER, OPOINTERₒ = OPOINTER, DATATYPEₒ = DATATYPE;
                if (!ꐚTrueᱻ1()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
                if (!ꐚTrueᱻ2()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
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
                if (IPOINTER + 4 > ICONTENT.length) return false;
                if (ICONTENT[IPOINTER + 0] !== 0x74) return false;
                if (ICONTENT[IPOINTER + 1] !== 0x72) return false;
                if (ICONTENT[IPOINTER + 2] !== 0x75) return false;
                if (ICONTENT[IPOINTER + 3] !== 0x65) return false;
                IPOINTER += 4;
                return true;
            },
            infer: function STR() {
                return true;
            },
        },
        print: {
            full: function STR() {
                OCONTENT[OPOINTER++] = 0x74;
                OCONTENT[OPOINTER++] = 0x72;
                OCONTENT[OPOINTER++] = 0x75;
                OCONTENT[OPOINTER++] = 0x65;
                return true;
            },
            infer: function STR() {
                OCONTENT[OPOINTER++] = 0x74;
                OCONTENT[OPOINTER++] = 0x72;
                OCONTENT[OPOINTER++] = 0x75;
                OCONTENT[OPOINTER++] = 0x65;
                return true;
            },
        },
        constant: "true",
    });

    // BooleanLiteral
    const ꐚTrueᱻ2 = createRule(mode, {
        parse: {
            full: () => {
                OCONTENT[OPOINTER++] = true;
                DATATYPE |= SCALAR;
                return true;
            },
            infer: () => {
                OCONTENT[OPOINTER++] = true;
                DATATYPE != SCALAR;
                return true;
            },
        },
        print: {
            full: function LIT() {
                if (DATATYPE !== SCALAR) return false;
                if (ICONTENT[IPOINTER] !== true) return false;
                IPOINTER += 1;
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
                const IPOINTERₒ = IPOINTER, OPOINTERₒ = OPOINTER, DATATYPEₒ = DATATYPE;
                if (!ꐚLBRACE()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
                if (!ꐚObjectᱻ1()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
                if (!ꐚRBRACE()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
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
                const IPOINTERₒ = IPOINTER, OPOINTERₒ = OPOINTER, DATATYPEₒ = DATATYPE;
                if (!ꐚLBRACE()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
                if (!ꐚObjectᱻ1()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
                if (!ꐚRBRACE()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
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
                const IPOINTERₒ = IPOINTER, OPOINTERₒ = OPOINTER, DATATYPEₒ = DATATYPE;
                if (!ꐚObjectᱻ3()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
                if (!ꐚObjectᱻ5()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
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
                const IPOINTERₒ = IPOINTER, OPOINTERₒ = OPOINTER, DATATYPEₒ = DATATYPE;
                if (!ꐚObjectᱻ3()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
                if (!ꐚObjectᱻ5()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
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
                const IPOINTERₒ = IPOINTER, OPOINTERₒ = OPOINTER, DATATYPEₒ = DATATYPE;
                if (!parseValue(ꐚString)) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
                assert(typeof OCONTENT[OPOINTER - 1] === 'string');
                if (!parseValue(ꐚObjectᱻ4)) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
                DATATYPE |= RECORD_FIELDS;
                return true;
            },
            infer: function RCD() {
                const OPOINTERₒ = OPOINTER;
                parseValue(ꐚString.infer);
                assert(typeof OCONTENT[OPOINTER - 1] === 'string');
                parseValue(ꐚObjectᱻ4.infer);
                DATATYPE |= RECORD_FIELDS;
                return true;
            },
        },
        print: {
            full: function RCD() {
                if (DATATYPE !== RECORD_FIELDS) return false;
                const IPOINTERₒ = IPOINTER, OPOINTERₒ = OPOINTER, DATATYPEₒ = DATATYPE;
                const propList = ICONTENT;
                const propCount = ICONTENT.length >> 1;
                let bitmask = IPOINTER;
                let i;
                for (i = IPOINTER = 0; (bitmask & (1 << i)) !== 0; ++i, IPOINTER += 2) ;
                if (i >= propCount || !printValue(ꐚString)) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
                if (!printValue(ꐚObjectᱻ4)) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
                bitmask += (1 << i);
                IPOINTER = bitmask;
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
                const IPOINTERₒ = IPOINTER, OPOINTERₒ = OPOINTER, DATATYPEₒ = DATATYPE;
                if (!ꐚCOLON()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
                if (!ꐚValue()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
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
                const IPOINTERₒ = IPOINTER, OPOINTERₒ = OPOINTER, DATATYPEₒ = DATATYPE;
                if (!ꐚCOLON()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
                if (!ꐚValue()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
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
                let IPOINTERᐟ = IPOINTER, OPOINTERᐟ = OPOINTER;
                while (true) {
                    if (!ꐚObjectᱻ6() || IPOINTER <= IPOINTERᐟ) break;
                    IPOINTERᐟ = IPOINTER, OPOINTERᐟ = OPOINTER;
                }
                IPOINTER = IPOINTERᐟ, OPOINTER = OPOINTERᐟ;
                return true;
            },
            infer: () => true,
        },
        print: {
            full: function QUA() {
                let IPOINTERᐟ = IPOINTER, OPOINTERᐟ = OPOINTER;
                while (true) {
                    if (!ꐚObjectᱻ6() || IPOINTER <= IPOINTERᐟ) break;
                    IPOINTERᐟ = IPOINTER, OPOINTERᐟ = OPOINTER;
                }
                IPOINTER = IPOINTERᐟ, OPOINTER = OPOINTERᐟ;
                return true;
            },
            infer: () => true,
        },
    });

    // RecordExpression
    const ꐚObjectᱻ6 = createRule(mode, {
        parse: {
            full: function RCD() {
                const IPOINTERₒ = IPOINTER, OPOINTERₒ = OPOINTER, DATATYPEₒ = DATATYPE;
                if (!parseValue(ꐚObjectᱻ7)) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
                assert(typeof OCONTENT[OPOINTER - 1] === 'string');
                if (!parseValue(ꐚObjectᱻ8)) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
                DATATYPE |= RECORD_FIELDS;
                return true;
            },
            infer: function RCD() {
                const OPOINTERₒ = OPOINTER;
                parseValue(ꐚObjectᱻ7.infer);
                assert(typeof OCONTENT[OPOINTER - 1] === 'string');
                parseValue(ꐚObjectᱻ8.infer);
                DATATYPE |= RECORD_FIELDS;
                return true;
            },
        },
        print: {
            full: function RCD() {
                if (DATATYPE !== RECORD_FIELDS) return false;
                const IPOINTERₒ = IPOINTER, OPOINTERₒ = OPOINTER, DATATYPEₒ = DATATYPE;
                const propList = ICONTENT;
                const propCount = ICONTENT.length >> 1;
                let bitmask = IPOINTER;
                let i;
                for (i = IPOINTER = 0; (bitmask & (1 << i)) !== 0; ++i, IPOINTER += 2) ;
                if (i >= propCount || !printValue(ꐚObjectᱻ7)) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
                if (!printValue(ꐚObjectᱻ8)) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
                bitmask += (1 << i);
                IPOINTER = bitmask;
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
                const IPOINTERₒ = IPOINTER, OPOINTERₒ = OPOINTER, DATATYPEₒ = DATATYPE;
                if (!ꐚCOMMA()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
                if (!ꐚString()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
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
                const IPOINTERₒ = IPOINTER, OPOINTERₒ = OPOINTER, DATATYPEₒ = DATATYPE;
                if (!ꐚCOMMA()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
                if (!ꐚString()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
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
                const IPOINTERₒ = IPOINTER, OPOINTERₒ = OPOINTER, DATATYPEₒ = DATATYPE;
                if (!ꐚCOLON()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
                if (!ꐚValue()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
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
                const IPOINTERₒ = IPOINTER, OPOINTERₒ = OPOINTER, DATATYPEₒ = DATATYPE;
                if (!ꐚCOLON()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
                if (!ꐚValue()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
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
                const IPOINTERₒ = IPOINTER, OPOINTERₒ = OPOINTER, DATATYPEₒ = DATATYPE;
                DATATYPE |= RECORD_FIELDS;
                return true;
            },
            infer: function RCD() {
                const OPOINTERₒ = OPOINTER;
                DATATYPE |= RECORD_FIELDS;
                return true;
            },
        },
        print: {
            full: function RCD() {
                if (DATATYPE !== RECORD_FIELDS) return false;
                const IPOINTERₒ = IPOINTER, OPOINTERₒ = OPOINTER, DATATYPEₒ = DATATYPE;
                const propList = ICONTENT;
                const propCount = ICONTENT.length >> 1;
                let bitmask = IPOINTER;
                let i;
                IPOINTER = bitmask;
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
                const IPOINTERₒ = IPOINTER, OPOINTERₒ = OPOINTER, DATATYPEₒ = DATATYPE;
                if (!ꐚLBRACE()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
                if (!ꐚObject2ᱻ1()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
                if (!ꐚRBRACE()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
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
                const IPOINTERₒ = IPOINTER, OPOINTERₒ = OPOINTER, DATATYPEₒ = DATATYPE;
                if (!ꐚLBRACE()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
                if (!ꐚObject2ᱻ1()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
                if (!ꐚRBRACE()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
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
                const IPOINTERₒ = IPOINTER, OPOINTERₒ = OPOINTER, DATATYPEₒ = DATATYPE;
                DATATYPE |= RECORD_FIELDS;
                return true;
            },
            infer: function RCD() {
                const OPOINTERₒ = OPOINTER;
                DATATYPE |= RECORD_FIELDS;
                return true;
            },
        },
        print: {
            full: function RCD() {
                if (DATATYPE !== RECORD_FIELDS) return false;
                const IPOINTERₒ = IPOINTER, OPOINTERₒ = OPOINTER, DATATYPEₒ = DATATYPE;
                const propList = ICONTENT;
                const propCount = ICONTENT.length >> 1;
                let bitmask = IPOINTER;
                let i;
                IPOINTER = bitmask;
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
                const IPOINTERₒ = IPOINTER, OPOINTERₒ = OPOINTER, DATATYPEₒ = DATATYPE;
                if (!parseValue(ꐚString)) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
                assert(typeof OCONTENT[OPOINTER - 1] === 'string');
                if (!parseValue(ꐚPropertiesᱻ1)) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
                if (!ꐚPropertiesᱻ2()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
                DATATYPE |= RECORD_FIELDS;
                return true;
            },
            infer: function RCD() {
                const OPOINTERₒ = OPOINTER;
                parseValue(ꐚString.infer);
                assert(typeof OCONTENT[OPOINTER - 1] === 'string');
                parseValue(ꐚPropertiesᱻ1.infer);
                ꐚPropertiesᱻ2.infer();
                DATATYPE |= RECORD_FIELDS;
                return true;
            },
        },
        print: {
            full: function RCD() {
                if (DATATYPE !== RECORD_FIELDS) return false;
                const IPOINTERₒ = IPOINTER, OPOINTERₒ = OPOINTER, DATATYPEₒ = DATATYPE;
                const propList = ICONTENT;
                const propCount = ICONTENT.length >> 1;
                let bitmask = IPOINTER;
                let i;
                for (i = IPOINTER = 0; (bitmask & (1 << i)) !== 0; ++i, IPOINTER += 2) ;
                if (i >= propCount || !printValue(ꐚString)) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
                if (!printValue(ꐚPropertiesᱻ1)) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
                bitmask += (1 << i);
                IPOINTER = bitmask;
                if (!ꐚPropertiesᱻ2()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
                bitmask = IPOINTER;
                IPOINTER = bitmask;
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
                const IPOINTERₒ = IPOINTER, OPOINTERₒ = OPOINTER, DATATYPEₒ = DATATYPE;
                if (!ꐚCOLON()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
                if (!ꐚValue()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
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
                const IPOINTERₒ = IPOINTER, OPOINTERₒ = OPOINTER, DATATYPEₒ = DATATYPE;
                if (!ꐚCOLON()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
                if (!ꐚValue()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
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
                const IPOINTERₒ = IPOINTER, OPOINTERₒ = OPOINTER, DATATYPEₒ = DATATYPE;
                if (!ꐚCOMMA()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
                if (!ꐚProperties()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
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
                const IPOINTERₒ = IPOINTER, OPOINTERₒ = OPOINTER, DATATYPEₒ = DATATYPE;
                if (!ꐚCOMMA()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
                if (!ꐚProperties()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
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
                const IPOINTERₒ = IPOINTER, OPOINTERₒ = OPOINTER, DATATYPEₒ = DATATYPE;
                DATATYPE |= RECORD_FIELDS;
                return true;
            },
            infer: function RCD() {
                const OPOINTERₒ = OPOINTER;
                DATATYPE |= RECORD_FIELDS;
                return true;
            },
        },
        print: {
            full: function RCD() {
                if (DATATYPE !== RECORD_FIELDS) return false;
                const IPOINTERₒ = IPOINTER, OPOINTERₒ = OPOINTER, DATATYPEₒ = DATATYPE;
                const propList = ICONTENT;
                const propCount = ICONTENT.length >> 1;
                let bitmask = IPOINTER;
                let i;
                IPOINTER = bitmask;
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
                const IPOINTERₒ = IPOINTER, OPOINTERₒ = OPOINTER, DATATYPEₒ = DATATYPE;
                if (!ꐚLBRACKET()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
                if (!ꐚArrayᱻ1()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
                if (!ꐚRBRACKET()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
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
                const IPOINTERₒ = IPOINTER, OPOINTERₒ = OPOINTER, DATATYPEₒ = DATATYPE;
                if (!ꐚLBRACKET()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
                if (!ꐚArrayᱻ1()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
                if (!ꐚRBRACKET()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
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
                const IPOINTERₒ = IPOINTER, OPOINTERₒ = OPOINTER, DATATYPEₒ = DATATYPE;
                if (!ꐚArrayᱻ3()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
                if (!ꐚArrayᱻ4()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
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
                const IPOINTERₒ = IPOINTER, OPOINTERₒ = OPOINTER, DATATYPEₒ = DATATYPE;
                if (!ꐚArrayᱻ3()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
                if (!ꐚArrayᱻ4()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
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
                const IPOINTERₒ = IPOINTER, OPOINTERₒ = OPOINTER, DATATYPEₒ = DATATYPE;
                if (!parseValue(ꐚValue)) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
                DATATYPE |= LIST_ELEMENTS;
                return true;
            },
            infer: function LST() {
                parseValue(ꐚValue.infer);
                DATATYPE |= LIST_ELEMENTS;
                return true;
            },
        },
        print: {
            full: function LST() {
                if (DATATYPE !== LIST_ELEMENTS) return false;
                const IPOINTERₒ = IPOINTER, OPOINTERₒ = OPOINTER, DATATYPEₒ = DATATYPE;
                if (!printValue(ꐚValue)) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
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
                let IPOINTERᐟ = IPOINTER, OPOINTERᐟ = OPOINTER;
                while (true) {
                    if (!ꐚArrayᱻ5() || IPOINTER <= IPOINTERᐟ) break;
                    IPOINTERᐟ = IPOINTER, OPOINTERᐟ = OPOINTER;
                }
                IPOINTER = IPOINTERᐟ, OPOINTER = OPOINTERᐟ;
                return true;
            },
            infer: () => true,
        },
        print: {
            full: function QUA() {
                let IPOINTERᐟ = IPOINTER, OPOINTERᐟ = OPOINTER;
                while (true) {
                    if (!ꐚArrayᱻ5() || IPOINTER <= IPOINTERᐟ) break;
                    IPOINTERᐟ = IPOINTER, OPOINTERᐟ = OPOINTER;
                }
                IPOINTER = IPOINTERᐟ, OPOINTER = OPOINTERᐟ;
                return true;
            },
            infer: () => true,
        },
    });

    // ListExpression
    const ꐚArrayᱻ5 = createRule(mode, {
        parse: {
            full: function LST() {
                const IPOINTERₒ = IPOINTER, OPOINTERₒ = OPOINTER, DATATYPEₒ = DATATYPE;
                if (!parseValue(ꐚArrayᱻ6)) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
                DATATYPE |= LIST_ELEMENTS;
                return true;
            },
            infer: function LST() {
                parseValue(ꐚArrayᱻ6.infer);
                DATATYPE |= LIST_ELEMENTS;
                return true;
            },
        },
        print: {
            full: function LST() {
                if (DATATYPE !== LIST_ELEMENTS) return false;
                const IPOINTERₒ = IPOINTER, OPOINTERₒ = OPOINTER, DATATYPEₒ = DATATYPE;
                if (!printValue(ꐚArrayᱻ6)) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
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
                const IPOINTERₒ = IPOINTER, OPOINTERₒ = OPOINTER, DATATYPEₒ = DATATYPE;
                if (!ꐚCOMMA()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
                if (!ꐚValue()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
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
                const IPOINTERₒ = IPOINTER, OPOINTERₒ = OPOINTER, DATATYPEₒ = DATATYPE;
                if (!ꐚCOMMA()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
                if (!ꐚValue()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
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
                const IPOINTERₒ = IPOINTER, OPOINTERₒ = OPOINTER, DATATYPEₒ = DATATYPE;
                DATATYPE |= LIST_ELEMENTS;
                return true;
            },
            infer: function LST() {
                DATATYPE |= LIST_ELEMENTS;
                return true;
            },
        },
        print: {
            full: function LST() {
                if (DATATYPE !== LIST_ELEMENTS) return false;
                const IPOINTERₒ = IPOINTER, OPOINTERₒ = OPOINTER, DATATYPEₒ = DATATYPE;
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
                const IPOINTERₒ = IPOINTER, OPOINTERₒ = OPOINTER, DATATYPEₒ = DATATYPE;
                if (!ꐚLBRACKET()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
                if (!ꐚArray2ᱻ1()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
                if (!ꐚRBRACKET()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
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
                const IPOINTERₒ = IPOINTER, OPOINTERₒ = OPOINTER, DATATYPEₒ = DATATYPE;
                if (!ꐚLBRACKET()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
                if (!ꐚArray2ᱻ1()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
                if (!ꐚRBRACKET()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
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
                const IPOINTERₒ = IPOINTER, OPOINTERₒ = OPOINTER, DATATYPEₒ = DATATYPE;
                DATATYPE |= LIST_ELEMENTS;
                return true;
            },
            infer: function LST() {
                DATATYPE |= LIST_ELEMENTS;
                return true;
            },
        },
        print: {
            full: function LST() {
                if (DATATYPE !== LIST_ELEMENTS) return false;
                const IPOINTERₒ = IPOINTER, OPOINTERₒ = OPOINTER, DATATYPEₒ = DATATYPE;
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
                const IPOINTERₒ = IPOINTER, OPOINTERₒ = OPOINTER, DATATYPEₒ = DATATYPE;
                if (!parseValue(ꐚValue)) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
                if (!ꐚElementsᱻ1()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
                DATATYPE |= LIST_ELEMENTS;
                return true;
            },
            infer: function LST() {
                parseValue(ꐚValue.infer);
                ꐚElementsᱻ1.infer();
                DATATYPE |= LIST_ELEMENTS;
                return true;
            },
        },
        print: {
            full: function LST() {
                if (DATATYPE !== LIST_ELEMENTS) return false;
                const IPOINTERₒ = IPOINTER, OPOINTERₒ = OPOINTER, DATATYPEₒ = DATATYPE;
                if (!printValue(ꐚValue)) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
                if (!ꐚElementsᱻ1()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
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
                const IPOINTERₒ = IPOINTER, OPOINTERₒ = OPOINTER, DATATYPEₒ = DATATYPE;
                if (!ꐚCOMMA()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
                if (!ꐚElements()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
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
                const IPOINTERₒ = IPOINTER, OPOINTERₒ = OPOINTER, DATATYPEₒ = DATATYPE;
                if (!ꐚCOMMA()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
                if (!ꐚElements()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
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
                const IPOINTERₒ = IPOINTER, OPOINTERₒ = OPOINTER, DATATYPEₒ = DATATYPE;
                DATATYPE |= LIST_ELEMENTS;
                return true;
            },
            infer: function LST() {
                DATATYPE |= LIST_ELEMENTS;
                return true;
            },
        },
        print: {
            full: function LST() {
                if (DATATYPE !== LIST_ELEMENTS) return false;
                const IPOINTERₒ = IPOINTER, OPOINTERₒ = OPOINTER, DATATYPEₒ = DATATYPE;
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
                const IPOINTERₒ = IPOINTER, OPOINTERₒ = OPOINTER, DATATYPEₒ = DATATYPE;
                if (!ꐚDOUBLE_QUOTE()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
                if (!ꐚStringᱻ1()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
                if (!ꐚDOUBLE_QUOTE()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
                return true;
            },
            infer: () => {
                ꐚDOUBLE_QUOTE.infer();
                ꐚStringᱻ1.infer();
                ꐚDOUBLE_QUOTE.infer();
                return true;
            },
        },
        print: {
            full: function SEQ() {
                const IPOINTERₒ = IPOINTER, OPOINTERₒ = OPOINTER, DATATYPEₒ = DATATYPE;
                if (!ꐚDOUBLE_QUOTE()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
                if (!ꐚStringᱻ1()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
                if (!ꐚDOUBLE_QUOTE()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
                return true;
            },
            infer: () => {
                ꐚDOUBLE_QUOTE.infer();
                ꐚStringᱻ1.infer();
                ꐚDOUBLE_QUOTE.infer();
                return true;
            },
        },
    });

    // SelectionExpression
    const ꐚStringᱻ1 = createRule(mode, {
        parse: {
            full: function SEL() { return ꐚStringᱻ2() || ꐚStringᱻ4(); },
            infer: () => ꐚStringᱻ2.infer(),
        },
        print: {
            full: function SEL() { return ꐚStringᱻ2() || ꐚStringᱻ4(); },
            infer: () => ꐚStringᱻ2.infer(),
        },
    });

    // SequenceExpression
    const ꐚStringᱻ2 = createRule(mode, {
        parse: {
            full: function SEQ() {
                const IPOINTERₒ = IPOINTER, OPOINTERₒ = OPOINTER, DATATYPEₒ = DATATYPE;
                if (!ꐚCHAR()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
                if (!ꐚStringᱻ3()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
                return true;
            },
            infer: () => {
                ꐚCHAR.infer();
                ꐚStringᱻ3.infer();
                return true;
            },
        },
        print: {
            full: function SEQ() {
                const IPOINTERₒ = IPOINTER, OPOINTERₒ = OPOINTER, DATATYPEₒ = DATATYPE;
                if (!ꐚCHAR()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
                if (!ꐚStringᱻ3()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
                return true;
            },
            infer: () => {
                ꐚCHAR.infer();
                ꐚStringᱻ3.infer();
                return true;
            },
        },
    });

    // QuantifiedExpression
    const ꐚStringᱻ3 = createRule(mode, {
        parse: {
            full: function QUA() {
                let IPOINTERᐟ = IPOINTER, OPOINTERᐟ = OPOINTER;
                while (true) {
                    if (!ꐚCHAR() || IPOINTER <= IPOINTERᐟ) break;
                    IPOINTERᐟ = IPOINTER, OPOINTERᐟ = OPOINTER;
                }
                IPOINTER = IPOINTERᐟ, OPOINTER = OPOINTERᐟ;
                return true;
            },
            infer: () => true,
        },
        print: {
            full: function QUA() {
                let IPOINTERᐟ = IPOINTER, OPOINTERᐟ = OPOINTER;
                while (true) {
                    if (!ꐚCHAR() || IPOINTER <= IPOINTERᐟ) break;
                    IPOINTERᐟ = IPOINTER, OPOINTERᐟ = OPOINTER;
                }
                IPOINTER = IPOINTERᐟ, OPOINTER = OPOINTERᐟ;
                return true;
            },
            infer: () => true,
        },
    });

    // StringLiteral
    const ꐚStringᱻ4 = createRule(mode, {
        parse: {
            full: function STR() {
                if (IPOINTER + 0 > ICONTENT.length) return false;
                IPOINTER += 0;
                DATATYPE |= STRING_CHARS;
                return true;
            },
            infer: function STR() {
                DATATYPE |= STRING_CHARS;
                return true;
            },
        },
        print: {
            full: function STR() {
                if (DATATYPE !== STRING_CHARS) return false;
                if (IPOINTER + 0 > ICONTENT.length) return false;
                IPOINTER += 0;
                return true;
            },
            infer: function STR() {
                return true;
            },
        },
        constant: "",
    });

    // NumericLiteral
    const ꐚbase = createRule(mode, {
        parse: {
            full: () => {
                OCONTENT[OPOINTER++] = 16;
                DATATYPE |= SCALAR;
                return true;
            },
            infer: () => {
                OCONTENT[OPOINTER++] = 16;
                DATATYPE != SCALAR;
                return true;
            },
        },
        print: {
            full: function LIT() {
                if (DATATYPE !== SCALAR) return false;
                if (ICONTENT[IPOINTER] !== 16) return false;
                IPOINTER += 1;
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
                OCONTENT[OPOINTER++] = 4;
                DATATYPE |= SCALAR;
                return true;
            },
            infer: () => {
                OCONTENT[OPOINTER++] = 4;
                DATATYPE != SCALAR;
                return true;
            },
        },
        print: {
            full: function LIT() {
                if (DATATYPE !== SCALAR) return false;
                if (ICONTENT[IPOINTER] !== 4) return false;
                IPOINTER += 1;
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
                OCONTENT[OPOINTER++] = 4;
                DATATYPE |= SCALAR;
                return true;
            },
            infer: () => {
                OCONTENT[OPOINTER++] = 4;
                DATATYPE != SCALAR;
                return true;
            },
        },
        print: {
            full: function LIT() {
                if (DATATYPE !== SCALAR) return false;
                if (ICONTENT[IPOINTER] !== 4) return false;
                IPOINTER += 1;
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
                if (IPOINTER >= ICONTENT.length) return false;
                cc = ICONTENT[IPOINTER];
                if (cc === 0x5c) return false;
                if (cc === 0x22) return false;
                if ((cc < 0x20 || cc > 0x7f)) return false;
                IPOINTER += 1;
                OCONTENT[OPOINTER++] = cc;
                DATATYPE |= STRING_CHARS
                return true;
            },
            infer: () => {
                OCONTENT[OPOINTER++] = 0x20;
                DATATYPE |= STRING_CHARS
                return true;
            },
        },
        print: {
            full: function BYT() {
                let cc;
                if (DATATYPE !== STRING_CHARS) return false;
                if (IPOINTER >= ICONTENT.length) return false;
                cc = ICONTENT[IPOINTER];
                if (cc === 0x5c) return false;
                if (cc === 0x22) return false;
                if ((cc < 0x20 || cc > 0x7f)) return false;
                IPOINTER += 1;
                OCONTENT[OPOINTER++] = cc;
                return true;
            },
            infer: () => {
                OCONTENT[OPOINTER++] = 0x20;
                return true;
            },
        },
    });

    // SequenceExpression
    const ꐚCHARᱻ2 = createRule(mode, {
        parse: {
            full: function SEQ() {
                const IPOINTERₒ = IPOINTER, OPOINTERₒ = OPOINTER, DATATYPEₒ = DATATYPE;
                if (!ꐚCHARᱻ3()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
                if (!ꐚCHARᱻ4()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
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
                const IPOINTERₒ = IPOINTER, OPOINTERₒ = OPOINTER, DATATYPEₒ = DATATYPE;
                if (!ꐚCHARᱻ3()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
                if (!ꐚCHARᱻ4()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
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
                if (IPOINTER >= ICONTENT.length) return false;
                cc = ICONTENT[IPOINTER];
                if ((cc < 0xc0 || cc > 0xdf)) return false;
                IPOINTER += 1;
                OCONTENT[OPOINTER++] = cc;
                DATATYPE |= STRING_CHARS
                return true;
            },
            infer: () => {
                OCONTENT[OPOINTER++] = 0xc0;
                DATATYPE |= STRING_CHARS
                return true;
            },
        },
        print: {
            full: function BYT() {
                let cc;
                if (DATATYPE !== STRING_CHARS) return false;
                if (IPOINTER >= ICONTENT.length) return false;
                cc = ICONTENT[IPOINTER];
                if ((cc < 0xc0 || cc > 0xdf)) return false;
                IPOINTER += 1;
                OCONTENT[OPOINTER++] = cc;
                return true;
            },
            infer: () => {
                OCONTENT[OPOINTER++] = 0xc0;
                return true;
            },
        },
    });

    // ByteExpression
    const ꐚCHARᱻ4 = createRule(mode, {
        parse: {
            full: function BYT() {
                let cc;
                if (IPOINTER >= ICONTENT.length) return false;
                cc = ICONTENT[IPOINTER];
                if ((cc < 0x80 || cc > 0xbf)) return false;
                IPOINTER += 1;
                OCONTENT[OPOINTER++] = cc;
                DATATYPE |= STRING_CHARS
                return true;
            },
            infer: () => {
                OCONTENT[OPOINTER++] = 0x80;
                DATATYPE |= STRING_CHARS
                return true;
            },
        },
        print: {
            full: function BYT() {
                let cc;
                if (DATATYPE !== STRING_CHARS) return false;
                if (IPOINTER >= ICONTENT.length) return false;
                cc = ICONTENT[IPOINTER];
                if ((cc < 0x80 || cc > 0xbf)) return false;
                IPOINTER += 1;
                OCONTENT[OPOINTER++] = cc;
                return true;
            },
            infer: () => {
                OCONTENT[OPOINTER++] = 0x80;
                return true;
            },
        },
    });

    // SequenceExpression
    const ꐚCHARᱻ5 = createRule(mode, {
        parse: {
            full: function SEQ() {
                const IPOINTERₒ = IPOINTER, OPOINTERₒ = OPOINTER, DATATYPEₒ = DATATYPE;
                if (!ꐚCHARᱻ6()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
                if (!ꐚCHARᱻ7()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
                if (!ꐚCHARᱻ8()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
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
                const IPOINTERₒ = IPOINTER, OPOINTERₒ = OPOINTER, DATATYPEₒ = DATATYPE;
                if (!ꐚCHARᱻ6()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
                if (!ꐚCHARᱻ7()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
                if (!ꐚCHARᱻ8()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
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
                if (IPOINTER >= ICONTENT.length) return false;
                cc = ICONTENT[IPOINTER];
                if ((cc < 0xe0 || cc > 0xef)) return false;
                IPOINTER += 1;
                OCONTENT[OPOINTER++] = cc;
                DATATYPE |= STRING_CHARS
                return true;
            },
            infer: () => {
                OCONTENT[OPOINTER++] = 0xe0;
                DATATYPE |= STRING_CHARS
                return true;
            },
        },
        print: {
            full: function BYT() {
                let cc;
                if (DATATYPE !== STRING_CHARS) return false;
                if (IPOINTER >= ICONTENT.length) return false;
                cc = ICONTENT[IPOINTER];
                if ((cc < 0xe0 || cc > 0xef)) return false;
                IPOINTER += 1;
                OCONTENT[OPOINTER++] = cc;
                return true;
            },
            infer: () => {
                OCONTENT[OPOINTER++] = 0xe0;
                return true;
            },
        },
    });

    // ByteExpression
    const ꐚCHARᱻ7 = createRule(mode, {
        parse: {
            full: function BYT() {
                let cc;
                if (IPOINTER >= ICONTENT.length) return false;
                cc = ICONTENT[IPOINTER];
                if ((cc < 0x80 || cc > 0xbf)) return false;
                IPOINTER += 1;
                OCONTENT[OPOINTER++] = cc;
                DATATYPE |= STRING_CHARS
                return true;
            },
            infer: () => {
                OCONTENT[OPOINTER++] = 0x80;
                DATATYPE |= STRING_CHARS
                return true;
            },
        },
        print: {
            full: function BYT() {
                let cc;
                if (DATATYPE !== STRING_CHARS) return false;
                if (IPOINTER >= ICONTENT.length) return false;
                cc = ICONTENT[IPOINTER];
                if ((cc < 0x80 || cc > 0xbf)) return false;
                IPOINTER += 1;
                OCONTENT[OPOINTER++] = cc;
                return true;
            },
            infer: () => {
                OCONTENT[OPOINTER++] = 0x80;
                return true;
            },
        },
    });

    // ByteExpression
    const ꐚCHARᱻ8 = createRule(mode, {
        parse: {
            full: function BYT() {
                let cc;
                if (IPOINTER >= ICONTENT.length) return false;
                cc = ICONTENT[IPOINTER];
                if ((cc < 0x80 || cc > 0xbf)) return false;
                IPOINTER += 1;
                OCONTENT[OPOINTER++] = cc;
                DATATYPE |= STRING_CHARS
                return true;
            },
            infer: () => {
                OCONTENT[OPOINTER++] = 0x80;
                DATATYPE |= STRING_CHARS
                return true;
            },
        },
        print: {
            full: function BYT() {
                let cc;
                if (DATATYPE !== STRING_CHARS) return false;
                if (IPOINTER >= ICONTENT.length) return false;
                cc = ICONTENT[IPOINTER];
                if ((cc < 0x80 || cc > 0xbf)) return false;
                IPOINTER += 1;
                OCONTENT[OPOINTER++] = cc;
                return true;
            },
            infer: () => {
                OCONTENT[OPOINTER++] = 0x80;
                return true;
            },
        },
    });

    // SequenceExpression
    const ꐚCHARᱻ9 = createRule(mode, {
        parse: {
            full: function SEQ() {
                const IPOINTERₒ = IPOINTER, OPOINTERₒ = OPOINTER, DATATYPEₒ = DATATYPE;
                if (!ꐚCHARᱻ10()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
                if (!ꐚCHARᱻ11()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
                if (!ꐚCHARᱻ12()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
                if (!ꐚCHARᱻ13()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
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
                const IPOINTERₒ = IPOINTER, OPOINTERₒ = OPOINTER, DATATYPEₒ = DATATYPE;
                if (!ꐚCHARᱻ10()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
                if (!ꐚCHARᱻ11()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
                if (!ꐚCHARᱻ12()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
                if (!ꐚCHARᱻ13()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
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
                if (IPOINTER >= ICONTENT.length) return false;
                cc = ICONTENT[IPOINTER];
                if ((cc < 0xf0 || cc > 0xf7)) return false;
                IPOINTER += 1;
                OCONTENT[OPOINTER++] = cc;
                DATATYPE |= STRING_CHARS
                return true;
            },
            infer: () => {
                OCONTENT[OPOINTER++] = 0xf0;
                DATATYPE |= STRING_CHARS
                return true;
            },
        },
        print: {
            full: function BYT() {
                let cc;
                if (DATATYPE !== STRING_CHARS) return false;
                if (IPOINTER >= ICONTENT.length) return false;
                cc = ICONTENT[IPOINTER];
                if ((cc < 0xf0 || cc > 0xf7)) return false;
                IPOINTER += 1;
                OCONTENT[OPOINTER++] = cc;
                return true;
            },
            infer: () => {
                OCONTENT[OPOINTER++] = 0xf0;
                return true;
            },
        },
    });

    // ByteExpression
    const ꐚCHARᱻ11 = createRule(mode, {
        parse: {
            full: function BYT() {
                let cc;
                if (IPOINTER >= ICONTENT.length) return false;
                cc = ICONTENT[IPOINTER];
                if ((cc < 0x80 || cc > 0xbf)) return false;
                IPOINTER += 1;
                OCONTENT[OPOINTER++] = cc;
                DATATYPE |= STRING_CHARS
                return true;
            },
            infer: () => {
                OCONTENT[OPOINTER++] = 0x80;
                DATATYPE |= STRING_CHARS
                return true;
            },
        },
        print: {
            full: function BYT() {
                let cc;
                if (DATATYPE !== STRING_CHARS) return false;
                if (IPOINTER >= ICONTENT.length) return false;
                cc = ICONTENT[IPOINTER];
                if ((cc < 0x80 || cc > 0xbf)) return false;
                IPOINTER += 1;
                OCONTENT[OPOINTER++] = cc;
                return true;
            },
            infer: () => {
                OCONTENT[OPOINTER++] = 0x80;
                return true;
            },
        },
    });

    // ByteExpression
    const ꐚCHARᱻ12 = createRule(mode, {
        parse: {
            full: function BYT() {
                let cc;
                if (IPOINTER >= ICONTENT.length) return false;
                cc = ICONTENT[IPOINTER];
                if ((cc < 0x80 || cc > 0xbf)) return false;
                IPOINTER += 1;
                OCONTENT[OPOINTER++] = cc;
                DATATYPE |= STRING_CHARS
                return true;
            },
            infer: () => {
                OCONTENT[OPOINTER++] = 0x80;
                DATATYPE |= STRING_CHARS
                return true;
            },
        },
        print: {
            full: function BYT() {
                let cc;
                if (DATATYPE !== STRING_CHARS) return false;
                if (IPOINTER >= ICONTENT.length) return false;
                cc = ICONTENT[IPOINTER];
                if ((cc < 0x80 || cc > 0xbf)) return false;
                IPOINTER += 1;
                OCONTENT[OPOINTER++] = cc;
                return true;
            },
            infer: () => {
                OCONTENT[OPOINTER++] = 0x80;
                return true;
            },
        },
    });

    // ByteExpression
    const ꐚCHARᱻ13 = createRule(mode, {
        parse: {
            full: function BYT() {
                let cc;
                if (IPOINTER >= ICONTENT.length) return false;
                cc = ICONTENT[IPOINTER];
                if ((cc < 0x80 || cc > 0xbf)) return false;
                IPOINTER += 1;
                OCONTENT[OPOINTER++] = cc;
                DATATYPE |= STRING_CHARS
                return true;
            },
            infer: () => {
                OCONTENT[OPOINTER++] = 0x80;
                DATATYPE |= STRING_CHARS
                return true;
            },
        },
        print: {
            full: function BYT() {
                let cc;
                if (DATATYPE !== STRING_CHARS) return false;
                if (IPOINTER >= ICONTENT.length) return false;
                cc = ICONTENT[IPOINTER];
                if ((cc < 0x80 || cc > 0xbf)) return false;
                IPOINTER += 1;
                OCONTENT[OPOINTER++] = cc;
                return true;
            },
            infer: () => {
                OCONTENT[OPOINTER++] = 0x80;
                return true;
            },
        },
    });

    // SequenceExpression
    const ꐚCHARᱻ14 = createRule(mode, {
        parse: {
            full: function SEQ() {
                const IPOINTERₒ = IPOINTER, OPOINTERₒ = OPOINTER, DATATYPEₒ = DATATYPE;
                if (!ꐚCHARᱻ15()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
                if (!ꐚCHARᱻ16()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
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
                const IPOINTERₒ = IPOINTER, OPOINTERₒ = OPOINTER, DATATYPEₒ = DATATYPE;
                if (!ꐚCHARᱻ15()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
                if (!ꐚCHARᱻ16()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
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
                if (IPOINTER >= ICONTENT.length) return false;
                cc = ICONTENT[IPOINTER];
                if (cc !== 0x5c) return false;
                IPOINTER += 1;
                return true;
            },
            infer: () => true,
        },
        print: {
            full: function BYT() {
                let cc;
                cc = 0x5c;
                OCONTENT[OPOINTER++] = cc;
                return true;
            },
            infer: () => {
                OCONTENT[OPOINTER++] = 0x5c;
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
                const IPOINTERₒ = IPOINTER, OPOINTERₒ = OPOINTER, DATATYPEₒ = DATATYPE;
                if (!ꐚCHARᱻ18()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
                if (!ꐚCHARᱻ19()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
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
                const IPOINTERₒ = IPOINTER, OPOINTERₒ = OPOINTER, DATATYPEₒ = DATATYPE;
                if (!ꐚCHARᱻ18()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
                if (!ꐚCHARᱻ19()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
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
                if (IPOINTER >= ICONTENT.length) return false;
                cc = ICONTENT[IPOINTER];
                if (cc !== 0x22) return false;
                IPOINTER += 1;
                return true;
            },
            infer: () => true,
        },
        print: {
            full: function BYT() {
                let cc;
                cc = 0x22;
                OCONTENT[OPOINTER++] = cc;
                return true;
            },
            infer: () => {
                OCONTENT[OPOINTER++] = 0x22;
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
                OCONTENT[OPOINTER++] = cc;
                DATATYPE |= STRING_CHARS
                return true;
            },
            infer: () => {
                OCONTENT[OPOINTER++] = 0x22;
                DATATYPE |= STRING_CHARS
                return true;
            },
        },
        print: {
            full: function BYT() {
                let cc;
                if (DATATYPE !== STRING_CHARS) return false;
                if (IPOINTER >= ICONTENT.length) return false;
                cc = ICONTENT[IPOINTER];
                if (cc !== 0x22) return false;
                IPOINTER += 1;
                return true;
            },
            infer: () => true,
        },
    });

    // SequenceExpression
    const ꐚCHARᱻ20 = createRule(mode, {
        parse: {
            full: function SEQ() {
                const IPOINTERₒ = IPOINTER, OPOINTERₒ = OPOINTER, DATATYPEₒ = DATATYPE;
                if (!ꐚCHARᱻ21()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
                if (!ꐚCHARᱻ22()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
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
                const IPOINTERₒ = IPOINTER, OPOINTERₒ = OPOINTER, DATATYPEₒ = DATATYPE;
                if (!ꐚCHARᱻ21()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
                if (!ꐚCHARᱻ22()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
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
                if (IPOINTER >= ICONTENT.length) return false;
                cc = ICONTENT[IPOINTER];
                if (cc !== 0x5c) return false;
                IPOINTER += 1;
                return true;
            },
            infer: () => true,
        },
        print: {
            full: function BYT() {
                let cc;
                cc = 0x5c;
                OCONTENT[OPOINTER++] = cc;
                return true;
            },
            infer: () => {
                OCONTENT[OPOINTER++] = 0x5c;
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
                OCONTENT[OPOINTER++] = cc;
                DATATYPE |= STRING_CHARS
                return true;
            },
            infer: () => {
                OCONTENT[OPOINTER++] = 0x5c;
                DATATYPE |= STRING_CHARS
                return true;
            },
        },
        print: {
            full: function BYT() {
                let cc;
                if (DATATYPE !== STRING_CHARS) return false;
                if (IPOINTER >= ICONTENT.length) return false;
                cc = ICONTENT[IPOINTER];
                if (cc !== 0x5c) return false;
                IPOINTER += 1;
                return true;
            },
            infer: () => true,
        },
    });

    // SequenceExpression
    const ꐚCHARᱻ23 = createRule(mode, {
        parse: {
            full: function SEQ() {
                const IPOINTERₒ = IPOINTER, OPOINTERₒ = OPOINTER, DATATYPEₒ = DATATYPE;
                if (!ꐚCHARᱻ24()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
                if (!ꐚCHARᱻ25()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
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
                const IPOINTERₒ = IPOINTER, OPOINTERₒ = OPOINTER, DATATYPEₒ = DATATYPE;
                if (!ꐚCHARᱻ24()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
                if (!ꐚCHARᱻ25()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
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
                if (IPOINTER >= ICONTENT.length) return false;
                cc = ICONTENT[IPOINTER];
                if (cc !== 0x2f) return false;
                IPOINTER += 1;
                return true;
            },
            infer: () => true,
        },
        print: {
            full: function BYT() {
                let cc;
                cc = 0x2f;
                OCONTENT[OPOINTER++] = cc;
                return true;
            },
            infer: () => {
                OCONTENT[OPOINTER++] = 0x2f;
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
                OCONTENT[OPOINTER++] = cc;
                DATATYPE |= STRING_CHARS
                return true;
            },
            infer: () => {
                OCONTENT[OPOINTER++] = 0x2f;
                DATATYPE |= STRING_CHARS
                return true;
            },
        },
        print: {
            full: function BYT() {
                let cc;
                if (DATATYPE !== STRING_CHARS) return false;
                if (IPOINTER >= ICONTENT.length) return false;
                cc = ICONTENT[IPOINTER];
                if (cc !== 0x2f) return false;
                IPOINTER += 1;
                return true;
            },
            infer: () => true,
        },
    });

    // SequenceExpression
    const ꐚCHARᱻ26 = createRule(mode, {
        parse: {
            full: function SEQ() {
                const IPOINTERₒ = IPOINTER, OPOINTERₒ = OPOINTER, DATATYPEₒ = DATATYPE;
                if (!ꐚCHARᱻ27()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
                if (!ꐚCHARᱻ28()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
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
                const IPOINTERₒ = IPOINTER, OPOINTERₒ = OPOINTER, DATATYPEₒ = DATATYPE;
                if (!ꐚCHARᱻ27()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
                if (!ꐚCHARᱻ28()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
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
                if (IPOINTER >= ICONTENT.length) return false;
                cc = ICONTENT[IPOINTER];
                if (cc !== 0x62) return false;
                IPOINTER += 1;
                return true;
            },
            infer: () => true,
        },
        print: {
            full: function BYT() {
                let cc;
                cc = 0x62;
                OCONTENT[OPOINTER++] = cc;
                return true;
            },
            infer: () => {
                OCONTENT[OPOINTER++] = 0x62;
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
                OCONTENT[OPOINTER++] = cc;
                DATATYPE |= STRING_CHARS
                return true;
            },
            infer: () => {
                OCONTENT[OPOINTER++] = 0x08;
                DATATYPE |= STRING_CHARS
                return true;
            },
        },
        print: {
            full: function BYT() {
                let cc;
                if (DATATYPE !== STRING_CHARS) return false;
                if (IPOINTER >= ICONTENT.length) return false;
                cc = ICONTENT[IPOINTER];
                if (cc !== 0x08) return false;
                IPOINTER += 1;
                return true;
            },
            infer: () => true,
        },
    });

    // SequenceExpression
    const ꐚCHARᱻ29 = createRule(mode, {
        parse: {
            full: function SEQ() {
                const IPOINTERₒ = IPOINTER, OPOINTERₒ = OPOINTER, DATATYPEₒ = DATATYPE;
                if (!ꐚCHARᱻ30()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
                if (!ꐚCHARᱻ31()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
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
                const IPOINTERₒ = IPOINTER, OPOINTERₒ = OPOINTER, DATATYPEₒ = DATATYPE;
                if (!ꐚCHARᱻ30()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
                if (!ꐚCHARᱻ31()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
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
                if (IPOINTER >= ICONTENT.length) return false;
                cc = ICONTENT[IPOINTER];
                if (cc !== 0x66) return false;
                IPOINTER += 1;
                return true;
            },
            infer: () => true,
        },
        print: {
            full: function BYT() {
                let cc;
                cc = 0x66;
                OCONTENT[OPOINTER++] = cc;
                return true;
            },
            infer: () => {
                OCONTENT[OPOINTER++] = 0x66;
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
                OCONTENT[OPOINTER++] = cc;
                DATATYPE |= STRING_CHARS
                return true;
            },
            infer: () => {
                OCONTENT[OPOINTER++] = 0x0c;
                DATATYPE |= STRING_CHARS
                return true;
            },
        },
        print: {
            full: function BYT() {
                let cc;
                if (DATATYPE !== STRING_CHARS) return false;
                if (IPOINTER >= ICONTENT.length) return false;
                cc = ICONTENT[IPOINTER];
                if (cc !== 0x0c) return false;
                IPOINTER += 1;
                return true;
            },
            infer: () => true,
        },
    });

    // SequenceExpression
    const ꐚCHARᱻ32 = createRule(mode, {
        parse: {
            full: function SEQ() {
                const IPOINTERₒ = IPOINTER, OPOINTERₒ = OPOINTER, DATATYPEₒ = DATATYPE;
                if (!ꐚCHARᱻ33()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
                if (!ꐚCHARᱻ34()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
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
                const IPOINTERₒ = IPOINTER, OPOINTERₒ = OPOINTER, DATATYPEₒ = DATATYPE;
                if (!ꐚCHARᱻ33()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
                if (!ꐚCHARᱻ34()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
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
                if (IPOINTER >= ICONTENT.length) return false;
                cc = ICONTENT[IPOINTER];
                if (cc !== 0x6e) return false;
                IPOINTER += 1;
                return true;
            },
            infer: () => true,
        },
        print: {
            full: function BYT() {
                let cc;
                cc = 0x6e;
                OCONTENT[OPOINTER++] = cc;
                return true;
            },
            infer: () => {
                OCONTENT[OPOINTER++] = 0x6e;
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
                OCONTENT[OPOINTER++] = cc;
                DATATYPE |= STRING_CHARS
                return true;
            },
            infer: () => {
                OCONTENT[OPOINTER++] = 0x0a;
                DATATYPE |= STRING_CHARS
                return true;
            },
        },
        print: {
            full: function BYT() {
                let cc;
                if (DATATYPE !== STRING_CHARS) return false;
                if (IPOINTER >= ICONTENT.length) return false;
                cc = ICONTENT[IPOINTER];
                if (cc !== 0x0a) return false;
                IPOINTER += 1;
                return true;
            },
            infer: () => true,
        },
    });

    // SequenceExpression
    const ꐚCHARᱻ35 = createRule(mode, {
        parse: {
            full: function SEQ() {
                const IPOINTERₒ = IPOINTER, OPOINTERₒ = OPOINTER, DATATYPEₒ = DATATYPE;
                if (!ꐚCHARᱻ36()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
                if (!ꐚCHARᱻ37()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
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
                const IPOINTERₒ = IPOINTER, OPOINTERₒ = OPOINTER, DATATYPEₒ = DATATYPE;
                if (!ꐚCHARᱻ36()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
                if (!ꐚCHARᱻ37()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
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
                if (IPOINTER >= ICONTENT.length) return false;
                cc = ICONTENT[IPOINTER];
                if (cc !== 0x72) return false;
                IPOINTER += 1;
                return true;
            },
            infer: () => true,
        },
        print: {
            full: function BYT() {
                let cc;
                cc = 0x72;
                OCONTENT[OPOINTER++] = cc;
                return true;
            },
            infer: () => {
                OCONTENT[OPOINTER++] = 0x72;
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
                OCONTENT[OPOINTER++] = cc;
                DATATYPE |= STRING_CHARS
                return true;
            },
            infer: () => {
                OCONTENT[OPOINTER++] = 0x0d;
                DATATYPE |= STRING_CHARS
                return true;
            },
        },
        print: {
            full: function BYT() {
                let cc;
                if (DATATYPE !== STRING_CHARS) return false;
                if (IPOINTER >= ICONTENT.length) return false;
                cc = ICONTENT[IPOINTER];
                if (cc !== 0x0d) return false;
                IPOINTER += 1;
                return true;
            },
            infer: () => true,
        },
    });

    // SequenceExpression
    const ꐚCHARᱻ38 = createRule(mode, {
        parse: {
            full: function SEQ() {
                const IPOINTERₒ = IPOINTER, OPOINTERₒ = OPOINTER, DATATYPEₒ = DATATYPE;
                if (!ꐚCHARᱻ39()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
                if (!ꐚCHARᱻ40()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
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
                const IPOINTERₒ = IPOINTER, OPOINTERₒ = OPOINTER, DATATYPEₒ = DATATYPE;
                if (!ꐚCHARᱻ39()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
                if (!ꐚCHARᱻ40()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
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
                if (IPOINTER >= ICONTENT.length) return false;
                cc = ICONTENT[IPOINTER];
                if (cc !== 0x74) return false;
                IPOINTER += 1;
                return true;
            },
            infer: () => true,
        },
        print: {
            full: function BYT() {
                let cc;
                cc = 0x74;
                OCONTENT[OPOINTER++] = cc;
                return true;
            },
            infer: () => {
                OCONTENT[OPOINTER++] = 0x74;
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
                OCONTENT[OPOINTER++] = cc;
                DATATYPE |= STRING_CHARS
                return true;
            },
            infer: () => {
                OCONTENT[OPOINTER++] = 0x09;
                DATATYPE |= STRING_CHARS
                return true;
            },
        },
        print: {
            full: function BYT() {
                let cc;
                if (DATATYPE !== STRING_CHARS) return false;
                if (IPOINTER >= ICONTENT.length) return false;
                cc = ICONTENT[IPOINTER];
                if (cc !== 0x09) return false;
                IPOINTER += 1;
                return true;
            },
            infer: () => true,
        },
    });

    // SequenceExpression
    const ꐚCHARᱻ41 = createRule(mode, {
        parse: {
            full: function SEQ() {
                const IPOINTERₒ = IPOINTER, OPOINTERₒ = OPOINTER, DATATYPEₒ = DATATYPE;
                if (!ꐚCHARᱻ42()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
                if (!ꐚCHARᱻ43()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
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
                const IPOINTERₒ = IPOINTER, OPOINTERₒ = OPOINTER, DATATYPEₒ = DATATYPE;
                if (!ꐚCHARᱻ42()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
                if (!ꐚCHARᱻ43()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
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
                if (IPOINTER >= ICONTENT.length) return false;
                cc = ICONTENT[IPOINTER];
                if (cc !== 0x75) return false;
                IPOINTER += 1;
                return true;
            },
            infer: () => true,
        },
        print: {
            full: function BYT() {
                let cc;
                cc = 0x75;
                OCONTENT[OPOINTER++] = cc;
                return true;
            },
            infer: () => {
                OCONTENT[OPOINTER++] = 0x75;
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
                const IPOINTERₒ = IPOINTER, OPOINTERₒ = OPOINTER, DATATYPEₒ = DATATYPE;
                if (!ꐚWS()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
                if (!ꐚLBRACEᱻ1()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
                if (!ꐚWS()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
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
                const IPOINTERₒ = IPOINTER, OPOINTERₒ = OPOINTER, DATATYPEₒ = DATATYPE;
                if (!ꐚWS()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
                if (!ꐚLBRACEᱻ1()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
                if (!ꐚWS()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
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
                if (IPOINTER >= ICONTENT.length) return false;
                cc = ICONTENT[IPOINTER];
                if (cc !== 0x7b) return false;
                IPOINTER += 1;
                return true;
            },
            infer: () => true,
        },
        print: {
            full: function BYT() {
                let cc;
                cc = 0x7b;
                OCONTENT[OPOINTER++] = cc;
                return true;
            },
            infer: () => {
                OCONTENT[OPOINTER++] = 0x7b;
                return true;
            },
        },
    });

    // SequenceExpression
    const ꐚRBRACE = createRule(mode, {
        parse: {
            full: function SEQ() {
                const IPOINTERₒ = IPOINTER, OPOINTERₒ = OPOINTER, DATATYPEₒ = DATATYPE;
                if (!ꐚWS()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
                if (!ꐚRBRACEᱻ1()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
                if (!ꐚWS()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
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
                const IPOINTERₒ = IPOINTER, OPOINTERₒ = OPOINTER, DATATYPEₒ = DATATYPE;
                if (!ꐚWS()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
                if (!ꐚRBRACEᱻ1()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
                if (!ꐚWS()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
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
                if (IPOINTER >= ICONTENT.length) return false;
                cc = ICONTENT[IPOINTER];
                if (cc !== 0x7d) return false;
                IPOINTER += 1;
                return true;
            },
            infer: () => true,
        },
        print: {
            full: function BYT() {
                let cc;
                cc = 0x7d;
                OCONTENT[OPOINTER++] = cc;
                return true;
            },
            infer: () => {
                OCONTENT[OPOINTER++] = 0x7d;
                return true;
            },
        },
    });

    // SequenceExpression
    const ꐚLBRACKET = createRule(mode, {
        parse: {
            full: function SEQ() {
                const IPOINTERₒ = IPOINTER, OPOINTERₒ = OPOINTER, DATATYPEₒ = DATATYPE;
                if (!ꐚWS()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
                if (!ꐚLBRACKETᱻ1()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
                if (!ꐚWS()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
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
                const IPOINTERₒ = IPOINTER, OPOINTERₒ = OPOINTER, DATATYPEₒ = DATATYPE;
                if (!ꐚWS()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
                if (!ꐚLBRACKETᱻ1()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
                if (!ꐚWS()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
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
                if (IPOINTER >= ICONTENT.length) return false;
                cc = ICONTENT[IPOINTER];
                if (cc !== 0x5b) return false;
                IPOINTER += 1;
                return true;
            },
            infer: () => true,
        },
        print: {
            full: function BYT() {
                let cc;
                cc = 0x5b;
                OCONTENT[OPOINTER++] = cc;
                return true;
            },
            infer: () => {
                OCONTENT[OPOINTER++] = 0x5b;
                return true;
            },
        },
    });

    // SequenceExpression
    const ꐚRBRACKET = createRule(mode, {
        parse: {
            full: function SEQ() {
                const IPOINTERₒ = IPOINTER, OPOINTERₒ = OPOINTER, DATATYPEₒ = DATATYPE;
                if (!ꐚWS()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
                if (!ꐚRBRACKETᱻ1()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
                if (!ꐚWS()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
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
                const IPOINTERₒ = IPOINTER, OPOINTERₒ = OPOINTER, DATATYPEₒ = DATATYPE;
                if (!ꐚWS()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
                if (!ꐚRBRACKETᱻ1()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
                if (!ꐚWS()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
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
                if (IPOINTER >= ICONTENT.length) return false;
                cc = ICONTENT[IPOINTER];
                if (cc !== 0x5d) return false;
                IPOINTER += 1;
                return true;
            },
            infer: () => true,
        },
        print: {
            full: function BYT() {
                let cc;
                cc = 0x5d;
                OCONTENT[OPOINTER++] = cc;
                return true;
            },
            infer: () => {
                OCONTENT[OPOINTER++] = 0x5d;
                return true;
            },
        },
    });

    // SequenceExpression
    const ꐚCOLON = createRule(mode, {
        parse: {
            full: function SEQ() {
                const IPOINTERₒ = IPOINTER, OPOINTERₒ = OPOINTER, DATATYPEₒ = DATATYPE;
                if (!ꐚWS()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
                if (!ꐚCOLONᱻ1()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
                if (!ꐚWS()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
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
                const IPOINTERₒ = IPOINTER, OPOINTERₒ = OPOINTER, DATATYPEₒ = DATATYPE;
                if (!ꐚWS()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
                if (!ꐚCOLONᱻ1()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
                if (!ꐚWS()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
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
                if (IPOINTER >= ICONTENT.length) return false;
                cc = ICONTENT[IPOINTER];
                if (cc !== 0x3a) return false;
                IPOINTER += 1;
                return true;
            },
            infer: () => true,
        },
        print: {
            full: function BYT() {
                let cc;
                cc = 0x3a;
                OCONTENT[OPOINTER++] = cc;
                return true;
            },
            infer: () => {
                OCONTENT[OPOINTER++] = 0x3a;
                return true;
            },
        },
    });

    // SequenceExpression
    const ꐚCOMMA = createRule(mode, {
        parse: {
            full: function SEQ() {
                const IPOINTERₒ = IPOINTER, OPOINTERₒ = OPOINTER, DATATYPEₒ = DATATYPE;
                if (!ꐚWS()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
                if (!ꐚCOMMAᱻ1()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
                if (!ꐚWS()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
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
                const IPOINTERₒ = IPOINTER, OPOINTERₒ = OPOINTER, DATATYPEₒ = DATATYPE;
                if (!ꐚWS()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
                if (!ꐚCOMMAᱻ1()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
                if (!ꐚWS()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;
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
                if (IPOINTER >= ICONTENT.length) return false;
                cc = ICONTENT[IPOINTER];
                if (cc !== 0x2c) return false;
                IPOINTER += 1;
                return true;
            },
            infer: () => true,
        },
        print: {
            full: function BYT() {
                let cc;
                cc = 0x2c;
                OCONTENT[OPOINTER++] = cc;
                return true;
            },
            infer: () => {
                OCONTENT[OPOINTER++] = 0x2c;
                return true;
            },
        },
    });

    // ByteExpression
    const ꐚDOUBLE_QUOTE = createRule(mode, {
        parse: {
            full: function BYT() {
                let cc;
                if (IPOINTER >= ICONTENT.length) return false;
                cc = ICONTENT[IPOINTER];
                if (cc !== 0x22) return false;
                IPOINTER += 1;
                return true;
            },
            infer: () => true,
        },
        print: {
            full: function BYT() {
                let cc;
                cc = 0x22;
                OCONTENT[OPOINTER++] = cc;
                return true;
            },
            infer: () => {
                OCONTENT[OPOINTER++] = 0x22;
                return true;
            },
        },
    });

    // QuantifiedExpression
    const ꐚWS = createRule(mode, {
        parse: {
            full: function QUA() {
                let IPOINTERᐟ = IPOINTER, OPOINTERᐟ = OPOINTER;
                while (true) {
                    if (!ꐚWSᱻ1() || IPOINTER <= IPOINTERᐟ) break;
                    IPOINTERᐟ = IPOINTER, OPOINTERᐟ = OPOINTER;
                }
                IPOINTER = IPOINTERᐟ, OPOINTER = OPOINTERᐟ;
                return true;
            },
            infer: () => true,
        },
        print: {
            full: function QUA() {
                let IPOINTERᐟ = IPOINTER, OPOINTERᐟ = OPOINTER;
                while (true) {
                    if (!ꐚWSᱻ1() || IPOINTER <= IPOINTERᐟ) break;
                    IPOINTERᐟ = IPOINTER, OPOINTERᐟ = OPOINTER;
                }
                IPOINTER = IPOINTERᐟ, OPOINTER = OPOINTERᐟ;
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
                if (IPOINTER >= ICONTENT.length) return false;
                cc = ICONTENT[IPOINTER];
                if (cc !== 0x20 && cc !== 0x09 && cc !== 0x0a && cc !== 0x0d) return false;
                IPOINTER += 1;
                return true;
            },
            infer: () => true,
        },
        print: {
            full: function BYT() {
                let cc;
                cc = 0x20;
                OCONTENT[OPOINTER++] = cc;
                return true;
            },
            infer: () => {
                OCONTENT[OPOINTER++] = 0x20;
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
