
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
let IREP;
let IPOS = 0;
let OREP;
let OPOS = 0;
let ATYP = 0;
const [NOTHING, SCALAR, STRING_CHARS, LIST_ELEMENTS, RECORD_FIELDS] = [0, 1, 2, 4, 8];
const internalBuffer = Buffer.alloc(2 ** 16);
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
                internalBuffer[i] = OREP[OPOSₒ + i];
            value = internalBuffer.toString('utf8', 0, len);
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
        const len = internalBuffer.write(value, 0, undefined, 'utf8');
        IREP = internalBuffer.slice(0, len);
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
};




// ------------------------------ Program ------------------------------
const parseStartRule = createStartRule('parse');
const printStartRule = createStartRule('print');
function createStartRule(mode) {

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
                const IPOSₒ = IPOS, OPOSₒ = OPOS, ATYPₒ = ATYP;
                OREP[OPOS++] = "type";
                if (!parseValue(ꐚaddᱻ1)) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                OREP[OPOS++] = "lhs";
                if (!parseValue(ꐚexpr)) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                OREP[OPOS++] = "rhs";
                if (!parseValue(ꐚaddᱻ2)) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                ATYP |= RECORD_FIELDS;
                return true;
            },
            infer: function RCD() {
                const OPOSₒ = OPOS;
                OREP[OPOS++] = "type";
                parseValue(ꐚaddᱻ1.infer);
                OREP[OPOS++] = "lhs";
                parseValue(ꐚexpr.infer);
                OREP[OPOS++] = "rhs";
                parseValue(ꐚaddᱻ2.infer);
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
                for (i = 0, IPOS = 1; (bitmask & (1 << i)) !== 0 && propList[i << 1] !== "type"; ++i, IPOS += 2) ;
                if (i >= propCount) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!printValue(ꐚaddᱻ1)) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                bitmask += (1 << i);
                for (i = 0, IPOS = 1; (bitmask & (1 << i)) !== 0 && propList[i << 1] !== "lhs"; ++i, IPOS += 2) ;
                if (i >= propCount) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!printValue(ꐚexpr)) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                bitmask += (1 << i);
                for (i = 0, IPOS = 1; (bitmask & (1 << i)) !== 0 && propList[i << 1] !== "rhs"; ++i, IPOS += 2) ;
                if (i >= propCount) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!printValue(ꐚaddᱻ2)) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                bitmask += (1 << i);
                IPOS = bitmask;
                return true;
            },
            infer: function RCD() {
                ꐚaddᱻ1.infer();
                ꐚexpr.infer();
                ꐚaddᱻ2.infer();
                return true;
            },
        },
    });

    // StringLiteral
    const ꐚaddᱻ1 = createRule(mode, {
        parse: {
            full: function STR() {
                OREP[OPOS++] = 0x61;
                OREP[OPOS++] = 0x64;
                OREP[OPOS++] = 0x64;
                ATYP |= STRING_CHARS;
                return true;
            },
            infer: function STR() {
                OREP[OPOS++] = 0x61;
                OREP[OPOS++] = 0x64;
                OREP[OPOS++] = 0x64;
                ATYP |= STRING_CHARS;
                return true;
            },
        },
        print: {
            full: function STR() {
                if (ATYP !== STRING_CHARS) return false;
                if (IPOS + 3 > IREP.length) return false;
                if (IREP[IPOS + 0] !== 0x61) return false;
                if (IREP[IPOS + 1] !== 0x64) return false;
                if (IREP[IPOS + 2] !== 0x64) return false;
                IPOS += 3;
                return true;
            },
            infer: function STR() {
                return true;
            },
        },
        constant: "add",
    });

    // SequenceExpression
    const ꐚaddᱻ2 = createRule(mode, {
        parse: {
            full: function SEQ() {
                const IPOSₒ = IPOS, OPOSₒ = OPOS, ATYPₒ = ATYP;
                if (!ꐚaddᱻ3()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚterm()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                return true;
            },
            infer: () => {
                ꐚaddᱻ3.infer();
                ꐚterm.infer();
                return true;
            },
        },
        print: {
            full: function SEQ() {
                const IPOSₒ = IPOS, OPOSₒ = OPOS, ATYPₒ = ATYP;
                if (!ꐚaddᱻ3()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚterm()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                return true;
            },
            infer: () => {
                ꐚaddᱻ3.infer();
                ꐚterm.infer();
                return true;
            },
        },
    });

    // ByteExpression
    const ꐚaddᱻ3 = createRule(mode, {
        parse: {
            full: function BYT() {
                let cc;
                if (IPOS >= IREP.length) return false;
                cc = IREP[IPOS];
                if (cc !== 0x2b) return false;
                IPOS += 1;
                return true;
            },
            infer: () => true,
        },
        print: {
            full: function BYT() {
                let cc;
                cc = 0x2b;
                OREP[OPOS++] = cc;
                return true;
            },
            infer: () => {
                OREP[OPOS++] = 0x2b;
                return true;
            },
        },
    });

    // RecordExpression
    const ꐚsub = createRule(mode, {
        parse: {
            full: function RCD() {
                const IPOSₒ = IPOS, OPOSₒ = OPOS, ATYPₒ = ATYP;
                OREP[OPOS++] = "type";
                if (!parseValue(ꐚsubᱻ1)) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                OREP[OPOS++] = "lhs";
                if (!parseValue(ꐚexpr)) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                OREP[OPOS++] = "rhs";
                if (!parseValue(ꐚsubᱻ2)) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                ATYP |= RECORD_FIELDS;
                return true;
            },
            infer: function RCD() {
                const OPOSₒ = OPOS;
                OREP[OPOS++] = "type";
                parseValue(ꐚsubᱻ1.infer);
                OREP[OPOS++] = "lhs";
                parseValue(ꐚexpr.infer);
                OREP[OPOS++] = "rhs";
                parseValue(ꐚsubᱻ2.infer);
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
                for (i = 0, IPOS = 1; (bitmask & (1 << i)) !== 0 && propList[i << 1] !== "type"; ++i, IPOS += 2) ;
                if (i >= propCount) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!printValue(ꐚsubᱻ1)) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                bitmask += (1 << i);
                for (i = 0, IPOS = 1; (bitmask & (1 << i)) !== 0 && propList[i << 1] !== "lhs"; ++i, IPOS += 2) ;
                if (i >= propCount) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!printValue(ꐚexpr)) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                bitmask += (1 << i);
                for (i = 0, IPOS = 1; (bitmask & (1 << i)) !== 0 && propList[i << 1] !== "rhs"; ++i, IPOS += 2) ;
                if (i >= propCount) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!printValue(ꐚsubᱻ2)) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                bitmask += (1 << i);
                IPOS = bitmask;
                return true;
            },
            infer: function RCD() {
                ꐚsubᱻ1.infer();
                ꐚexpr.infer();
                ꐚsubᱻ2.infer();
                return true;
            },
        },
    });

    // StringLiteral
    const ꐚsubᱻ1 = createRule(mode, {
        parse: {
            full: function STR() {
                OREP[OPOS++] = 0x73;
                OREP[OPOS++] = 0x75;
                OREP[OPOS++] = 0x62;
                ATYP |= STRING_CHARS;
                return true;
            },
            infer: function STR() {
                OREP[OPOS++] = 0x73;
                OREP[OPOS++] = 0x75;
                OREP[OPOS++] = 0x62;
                ATYP |= STRING_CHARS;
                return true;
            },
        },
        print: {
            full: function STR() {
                if (ATYP !== STRING_CHARS) return false;
                if (IPOS + 3 > IREP.length) return false;
                if (IREP[IPOS + 0] !== 0x73) return false;
                if (IREP[IPOS + 1] !== 0x75) return false;
                if (IREP[IPOS + 2] !== 0x62) return false;
                IPOS += 3;
                return true;
            },
            infer: function STR() {
                return true;
            },
        },
        constant: "sub",
    });

    // SequenceExpression
    const ꐚsubᱻ2 = createRule(mode, {
        parse: {
            full: function SEQ() {
                const IPOSₒ = IPOS, OPOSₒ = OPOS, ATYPₒ = ATYP;
                if (!ꐚsubᱻ3()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚterm()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                return true;
            },
            infer: () => {
                ꐚsubᱻ3.infer();
                ꐚterm.infer();
                return true;
            },
        },
        print: {
            full: function SEQ() {
                const IPOSₒ = IPOS, OPOSₒ = OPOS, ATYPₒ = ATYP;
                if (!ꐚsubᱻ3()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚterm()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                return true;
            },
            infer: () => {
                ꐚsubᱻ3.infer();
                ꐚterm.infer();
                return true;
            },
        },
    });

    // ByteExpression
    const ꐚsubᱻ3 = createRule(mode, {
        parse: {
            full: function BYT() {
                let cc;
                if (IPOS >= IREP.length) return false;
                cc = IREP[IPOS];
                if (cc !== 0x2d) return false;
                IPOS += 1;
                return true;
            },
            infer: () => true,
        },
        print: {
            full: function BYT() {
                let cc;
                cc = 0x2d;
                OREP[OPOS++] = cc;
                return true;
            },
            infer: () => {
                OREP[OPOS++] = 0x2d;
                return true;
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
                const IPOSₒ = IPOS, OPOSₒ = OPOS, ATYPₒ = ATYP;
                if (!parseValue(ꐚmulᱻ1)) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                assert(typeof OREP[OPOS - 1] === 'string');
                if (!parseValue(ꐚmulᱻ3)) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                OREP[OPOS++] = "lhs";
                if (!parseValue(ꐚterm)) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!parseValue(ꐚmulᱻ5)) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                assert(typeof OREP[OPOS - 1] === 'string');
                if (!parseValue(ꐚmulᱻ7)) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                ATYP |= RECORD_FIELDS;
                return true;
            },
            infer: function RCD() {
                const OPOSₒ = OPOS;
                parseValue(ꐚmulᱻ1.infer);
                assert(typeof OREP[OPOS - 1] === 'string');
                parseValue(ꐚmulᱻ3.infer);
                OREP[OPOS++] = "lhs";
                parseValue(ꐚterm.infer);
                parseValue(ꐚmulᱻ5.infer);
                assert(typeof OREP[OPOS - 1] === 'string');
                parseValue(ꐚmulᱻ7.infer);
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
                if (i >= propCount || !printValue(ꐚmulᱻ1)) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!printValue(ꐚmulᱻ3)) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                bitmask += (1 << i);
                for (i = 0, IPOS = 1; (bitmask & (1 << i)) !== 0 && propList[i << 1] !== "lhs"; ++i, IPOS += 2) ;
                if (i >= propCount) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!printValue(ꐚterm)) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                bitmask += (1 << i);
                for (i = IPOS = 0; (bitmask & (1 << i)) !== 0; ++i, IPOS += 2) ;
                if (i >= propCount || !printValue(ꐚmulᱻ5)) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!printValue(ꐚmulᱻ7)) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                bitmask += (1 << i);
                IPOS = bitmask;
                return true;
            },
            infer: function RCD() {
                ꐚmulᱻ1.infer();
                ꐚmulᱻ3.infer();
                ꐚterm.infer();
                ꐚmulᱻ5.infer();
                ꐚmulᱻ7.infer();
                return true;
            },
        },
    });

    // ApplicationExpression
    const ꐚmulᱻ1 = lazy(() => ꐚab(ꐚmulᱻ2));

    // StringLiteral
    const ꐚmulᱻ2 = createRule(mode, {
        parse: {
            full: function STR() {
                if (IPOS + 4 > IREP.length) return false;
                if (IREP[IPOS + 0] !== 0x74) return false;
                if (IREP[IPOS + 1] !== 0x79) return false;
                if (IREP[IPOS + 2] !== 0x70) return false;
                if (IREP[IPOS + 3] !== 0x65) return false;
                IPOS += 4;
                OREP[OPOS++] = 0x74;
                OREP[OPOS++] = 0x79;
                OREP[OPOS++] = 0x70;
                OREP[OPOS++] = 0x65;
                ATYP |= STRING_CHARS;
                return true;
            },
            infer: function STR() {
                OREP[OPOS++] = 0x74;
                OREP[OPOS++] = 0x79;
                OREP[OPOS++] = 0x70;
                OREP[OPOS++] = 0x65;
                ATYP |= STRING_CHARS;
                return true;
            },
        },
        print: {
            full: function STR() {
                if (ATYP !== STRING_CHARS) return false;
                if (IPOS + 4 > IREP.length) return false;
                if (IREP[IPOS + 0] !== 0x74) return false;
                if (IREP[IPOS + 1] !== 0x79) return false;
                if (IREP[IPOS + 2] !== 0x70) return false;
                if (IREP[IPOS + 3] !== 0x65) return false;
                IPOS += 4;
                OREP[OPOS++] = 0x74;
                OREP[OPOS++] = 0x79;
                OREP[OPOS++] = 0x70;
                OREP[OPOS++] = 0x65;
                return true;
            },
            infer: function STR() {
                OREP[OPOS++] = 0x74;
                OREP[OPOS++] = 0x79;
                OREP[OPOS++] = 0x70;
                OREP[OPOS++] = 0x65;
                return true;
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
                if (IPOS + 3 > IREP.length) return false;
                if (IREP[IPOS + 0] !== 0x6d) return false;
                if (IREP[IPOS + 1] !== 0x75) return false;
                if (IREP[IPOS + 2] !== 0x6c) return false;
                IPOS += 3;
                OREP[OPOS++] = 0x6d;
                OREP[OPOS++] = 0x75;
                OREP[OPOS++] = 0x6c;
                ATYP |= STRING_CHARS;
                return true;
            },
            infer: function STR() {
                OREP[OPOS++] = 0x6d;
                OREP[OPOS++] = 0x75;
                OREP[OPOS++] = 0x6c;
                ATYP |= STRING_CHARS;
                return true;
            },
        },
        print: {
            full: function STR() {
                if (ATYP !== STRING_CHARS) return false;
                if (IPOS + 3 > IREP.length) return false;
                if (IREP[IPOS + 0] !== 0x6d) return false;
                if (IREP[IPOS + 1] !== 0x75) return false;
                if (IREP[IPOS + 2] !== 0x6c) return false;
                IPOS += 3;
                OREP[OPOS++] = 0x6d;
                OREP[OPOS++] = 0x75;
                OREP[OPOS++] = 0x6c;
                return true;
            },
            infer: function STR() {
                OREP[OPOS++] = 0x6d;
                OREP[OPOS++] = 0x75;
                OREP[OPOS++] = 0x6c;
                return true;
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
                if (IPOS + 3 > IREP.length) return false;
                if (IREP[IPOS + 0] !== 0x72) return false;
                if (IREP[IPOS + 1] !== 0x68) return false;
                if (IREP[IPOS + 2] !== 0x73) return false;
                IPOS += 3;
                OREP[OPOS++] = 0x72;
                OREP[OPOS++] = 0x68;
                OREP[OPOS++] = 0x73;
                ATYP |= STRING_CHARS;
                return true;
            },
            infer: function STR() {
                OREP[OPOS++] = 0x72;
                OREP[OPOS++] = 0x68;
                OREP[OPOS++] = 0x73;
                ATYP |= STRING_CHARS;
                return true;
            },
        },
        print: {
            full: function STR() {
                if (ATYP !== STRING_CHARS) return false;
                if (IPOS + 3 > IREP.length) return false;
                if (IREP[IPOS + 0] !== 0x72) return false;
                if (IREP[IPOS + 1] !== 0x68) return false;
                if (IREP[IPOS + 2] !== 0x73) return false;
                IPOS += 3;
                OREP[OPOS++] = 0x72;
                OREP[OPOS++] = 0x68;
                OREP[OPOS++] = 0x73;
                return true;
            },
            infer: function STR() {
                OREP[OPOS++] = 0x72;
                OREP[OPOS++] = 0x68;
                OREP[OPOS++] = 0x73;
                return true;
            },
        },
        constant: "rhs",
    });

    // SequenceExpression
    const ꐚmulᱻ7 = createRule(mode, {
        parse: {
            full: function SEQ() {
                const IPOSₒ = IPOS, OPOSₒ = OPOS, ATYPₒ = ATYP;
                if (!ꐚmulᱻ8()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚfactor()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                return true;
            },
            infer: () => {
                ꐚmulᱻ8.infer();
                ꐚfactor.infer();
                return true;
            },
        },
        print: {
            full: function SEQ() {
                const IPOSₒ = IPOS, OPOSₒ = OPOS, ATYPₒ = ATYP;
                if (!ꐚmulᱻ8()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚfactor()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                return true;
            },
            infer: () => {
                ꐚmulᱻ8.infer();
                ꐚfactor.infer();
                return true;
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
                if (IPOS >= IREP.length) return false;
                cc = IREP[IPOS];
                if (cc !== 0x2a) return false;
                IPOS += 1;
                OREP[OPOS++] = cc;
                ATYP |= STRING_CHARS
                return true;
            },
            infer: () => {
                OREP[OPOS++] = 0x2a;
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
                if (cc !== 0x2a) return false;
                IPOS += 1;
                OREP[OPOS++] = cc;
                return true;
            },
            infer: () => {
                OREP[OPOS++] = 0x2a;
                return true;
            },
        },
    });

    // RecordExpression
    const ꐚdiv = createRule(mode, {
        parse: {
            full: function RCD() {
                const IPOSₒ = IPOS, OPOSₒ = OPOS, ATYPₒ = ATYP;
                OREP[OPOS++] = "type";
                if (!parseValue(ꐚdivᱻ1)) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                OREP[OPOS++] = "lhs";
                if (!parseValue(ꐚterm)) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                OREP[OPOS++] = "rhs";
                if (!parseValue(ꐚdivᱻ3)) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                ATYP |= RECORD_FIELDS;
                return true;
            },
            infer: function RCD() {
                const OPOSₒ = OPOS;
                OREP[OPOS++] = "type";
                parseValue(ꐚdivᱻ1.infer);
                OREP[OPOS++] = "lhs";
                parseValue(ꐚterm.infer);
                OREP[OPOS++] = "rhs";
                parseValue(ꐚdivᱻ3.infer);
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
                for (i = 0, IPOS = 1; (bitmask & (1 << i)) !== 0 && propList[i << 1] !== "type"; ++i, IPOS += 2) ;
                if (i >= propCount) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!printValue(ꐚdivᱻ1)) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                bitmask += (1 << i);
                for (i = 0, IPOS = 1; (bitmask & (1 << i)) !== 0 && propList[i << 1] !== "lhs"; ++i, IPOS += 2) ;
                if (i >= propCount) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!printValue(ꐚterm)) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                bitmask += (1 << i);
                for (i = 0, IPOS = 1; (bitmask & (1 << i)) !== 0 && propList[i << 1] !== "rhs"; ++i, IPOS += 2) ;
                if (i >= propCount) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!printValue(ꐚdivᱻ3)) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                bitmask += (1 << i);
                IPOS = bitmask;
                return true;
            },
            infer: function RCD() {
                ꐚdivᱻ1.infer();
                ꐚterm.infer();
                ꐚdivᱻ3.infer();
                return true;
            },
        },
    });

    // ApplicationExpression
    const ꐚdivᱻ1 = lazy(() => ꐚab(ꐚdivᱻ2));

    // StringLiteral
    const ꐚdivᱻ2 = createRule(mode, {
        parse: {
            full: function STR() {
                if (IPOS + 3 > IREP.length) return false;
                if (IREP[IPOS + 0] !== 0x64) return false;
                if (IREP[IPOS + 1] !== 0x69) return false;
                if (IREP[IPOS + 2] !== 0x76) return false;
                IPOS += 3;
                OREP[OPOS++] = 0x64;
                OREP[OPOS++] = 0x69;
                OREP[OPOS++] = 0x76;
                ATYP |= STRING_CHARS;
                return true;
            },
            infer: function STR() {
                OREP[OPOS++] = 0x64;
                OREP[OPOS++] = 0x69;
                OREP[OPOS++] = 0x76;
                ATYP |= STRING_CHARS;
                return true;
            },
        },
        print: {
            full: function STR() {
                if (ATYP !== STRING_CHARS) return false;
                if (IPOS + 3 > IREP.length) return false;
                if (IREP[IPOS + 0] !== 0x64) return false;
                if (IREP[IPOS + 1] !== 0x69) return false;
                if (IREP[IPOS + 2] !== 0x76) return false;
                IPOS += 3;
                OREP[OPOS++] = 0x64;
                OREP[OPOS++] = 0x69;
                OREP[OPOS++] = 0x76;
                return true;
            },
            infer: function STR() {
                OREP[OPOS++] = 0x64;
                OREP[OPOS++] = 0x69;
                OREP[OPOS++] = 0x76;
                return true;
            },
        },
        constant: "div",
    });

    // SequenceExpression
    const ꐚdivᱻ3 = createRule(mode, {
        parse: {
            full: function SEQ() {
                const IPOSₒ = IPOS, OPOSₒ = OPOS, ATYPₒ = ATYP;
                if (!ꐚdivᱻ4()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚfactor()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                return true;
            },
            infer: () => {
                ꐚdivᱻ4.infer();
                ꐚfactor.infer();
                return true;
            },
        },
        print: {
            full: function SEQ() {
                const IPOSₒ = IPOS, OPOSₒ = OPOS, ATYPₒ = ATYP;
                if (!ꐚdivᱻ4()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚfactor()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                return true;
            },
            infer: () => {
                ꐚdivᱻ4.infer();
                ꐚfactor.infer();
                return true;
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
                if (IPOS >= IREP.length) return false;
                cc = IREP[IPOS];
                if (cc !== 0x2f) return false;
                IPOS += 1;
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
                OREP[OPOS++] = cc;
                return true;
            },
            infer: () => {
                OREP[OPOS++] = 0x2f;
                return true;
            },
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

    // BooleanLiteral
    const ꐚsigned = createRule(mode, {
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

    // NumericLiteral
    const ꐚbaseᱻ2 = createRule(mode, {
        parse: {
            full: () => {
                OREP[OPOS++] = 2;
                ATYP |= SCALAR;
                return true;
            },
            infer: () => {
                OREP[OPOS++] = 2;
                ATYP != SCALAR;
                return true;
            },
        },
        print: {
            full: function LIT() {
                if (ATYP !== SCALAR) return false;
                if (IREP[IPOS] !== 2) return false;
                IPOS += 1;
                return true;
            },
            infer: () => true,
        },
        constant: 2,
    });

    // BooleanLiteral
    const ꐚsignedᱻ2 = createRule(mode, {
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

    // BooleanLiteral
    const ꐚsignedᱻ3 = createRule(mode, {
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
                const IPOSₒ = IPOS, OPOSₒ = OPOS, ATYPₒ = ATYP;
                if (!ꐚfactorᱻ2()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚfactorᱻ4()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚfloat()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                return true;
            },
            infer: () => {
                ꐚfactorᱻ2.infer();
                ꐚfactorᱻ4.infer();
                ꐚfloat.infer();
                return true;
            },
        },
        print: {
            full: function SEQ() {
                const IPOSₒ = IPOS, OPOSₒ = OPOS, ATYPₒ = ATYP;
                if (!ꐚfactorᱻ2()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚfactorᱻ4()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚfloat()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                return true;
            },
            infer: () => {
                ꐚfactorᱻ2.infer();
                ꐚfactorᱻ4.infer();
                ꐚfloat.infer();
                return true;
            },
        },
    });

    // NotExpression
    const ꐚfactorᱻ2 = createRule(mode, {
        parse: {
            full: function NOT() {
                const IPOSₒ = IPOS, OPOSₒ = OPOS, ATYPₒ = ATYP;
                const result = !ꐚfactorᱻ3();
                IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ;
                return result;
            },
            infer: () => true,
        },
        print: {
            full: function NOT() {
                const IPOSₒ = IPOS, OPOSₒ = OPOS, ATYPₒ = ATYP;
                const result = !ꐚfactorᱻ3();
                IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ;
                return result;
            },
            infer: () => true,
        },
    });

    // StringLiteral
    const ꐚfactorᱻ3 = createRule(mode, {
        parse: {
            full: function STR() {
                if (IPOS + 2 > IREP.length) return false;
                if (IREP[IPOS + 0] !== 0x30) return false;
                if (IREP[IPOS + 1] !== 0x78) return false;
                IPOS += 2;
                OREP[OPOS++] = 0x30;
                OREP[OPOS++] = 0x78;
                ATYP |= STRING_CHARS;
                return true;
            },
            infer: function STR() {
                OREP[OPOS++] = 0x30;
                OREP[OPOS++] = 0x78;
                ATYP |= STRING_CHARS;
                return true;
            },
        },
        print: {
            full: function STR() {
                if (ATYP !== STRING_CHARS) return false;
                if (IPOS + 2 > IREP.length) return false;
                if (IREP[IPOS + 0] !== 0x30) return false;
                if (IREP[IPOS + 1] !== 0x78) return false;
                IPOS += 2;
                OREP[OPOS++] = 0x30;
                OREP[OPOS++] = 0x78;
                return true;
            },
            infer: function STR() {
                OREP[OPOS++] = 0x30;
                OREP[OPOS++] = 0x78;
                return true;
            },
        },
        constant: "0x",
    });

    // NotExpression
    const ꐚfactorᱻ4 = createRule(mode, {
        parse: {
            full: function NOT() {
                const IPOSₒ = IPOS, OPOSₒ = OPOS, ATYPₒ = ATYP;
                const result = !ꐚfactorᱻ5();
                IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ;
                return result;
            },
            infer: () => true,
        },
        print: {
            full: function NOT() {
                const IPOSₒ = IPOS, OPOSₒ = OPOS, ATYPₒ = ATYP;
                const result = !ꐚfactorᱻ5();
                IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ;
                return result;
            },
            infer: () => true,
        },
    });

    // StringLiteral
    const ꐚfactorᱻ5 = createRule(mode, {
        parse: {
            full: function STR() {
                if (IPOS + 2 > IREP.length) return false;
                if (IREP[IPOS + 0] !== 0x30) return false;
                if (IREP[IPOS + 1] !== 0x62) return false;
                IPOS += 2;
                OREP[OPOS++] = 0x30;
                OREP[OPOS++] = 0x62;
                ATYP |= STRING_CHARS;
                return true;
            },
            infer: function STR() {
                OREP[OPOS++] = 0x30;
                OREP[OPOS++] = 0x62;
                ATYP |= STRING_CHARS;
                return true;
            },
        },
        print: {
            full: function STR() {
                if (ATYP !== STRING_CHARS) return false;
                if (IPOS + 2 > IREP.length) return false;
                if (IREP[IPOS + 0] !== 0x30) return false;
                if (IREP[IPOS + 1] !== 0x62) return false;
                IPOS += 2;
                OREP[OPOS++] = 0x30;
                OREP[OPOS++] = 0x62;
                return true;
            },
            infer: function STR() {
                OREP[OPOS++] = 0x30;
                OREP[OPOS++] = 0x62;
                return true;
            },
        },
        constant: "0b",
    });

    // SequenceExpression
    const ꐚfactorᱻ6 = createRule(mode, {
        parse: {
            full: function SEQ() {
                const IPOSₒ = IPOS, OPOSₒ = OPOS, ATYPₒ = ATYP;
                if (!ꐚfactorᱻ7()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚfactorᱻ9()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                return true;
            },
            infer: () => {
                ꐚfactorᱻ7.infer();
                ꐚfactorᱻ9.infer();
                return true;
            },
        },
        print: {
            full: function SEQ() {
                const IPOSₒ = IPOS, OPOSₒ = OPOS, ATYPₒ = ATYP;
                if (!ꐚfactorᱻ7()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚfactorᱻ9()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                return true;
            },
            infer: () => {
                ꐚfactorᱻ7.infer();
                ꐚfactorᱻ9.infer();
                return true;
            },
        },
    });

    // ApplicationExpression
    const ꐚfactorᱻ7 = lazy(() => ꐚco(ꐚfactorᱻ8));

    // StringLiteral
    const ꐚfactorᱻ8 = createRule(mode, {
        parse: {
            full: function STR() {
                if (IPOS + 2 > IREP.length) return false;
                if (IREP[IPOS + 0] !== 0x30) return false;
                if (IREP[IPOS + 1] !== 0x78) return false;
                IPOS += 2;
                OREP[OPOS++] = 0x30;
                OREP[OPOS++] = 0x78;
                ATYP |= STRING_CHARS;
                return true;
            },
            infer: function STR() {
                OREP[OPOS++] = 0x30;
                OREP[OPOS++] = 0x78;
                ATYP |= STRING_CHARS;
                return true;
            },
        },
        print: {
            full: function STR() {
                if (ATYP !== STRING_CHARS) return false;
                if (IPOS + 2 > IREP.length) return false;
                if (IREP[IPOS + 0] !== 0x30) return false;
                if (IREP[IPOS + 1] !== 0x78) return false;
                IPOS += 2;
                OREP[OPOS++] = 0x30;
                OREP[OPOS++] = 0x78;
                return true;
            },
            infer: function STR() {
                OREP[OPOS++] = 0x30;
                OREP[OPOS++] = 0x78;
                return true;
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
                const IPOSₒ = IPOS, OPOSₒ = OPOS, ATYPₒ = ATYP;
                if (!ꐚfactorᱻ12()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚfactorᱻ14()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                return true;
            },
            infer: () => {
                ꐚfactorᱻ12.infer();
                ꐚfactorᱻ14.infer();
                return true;
            },
        },
        print: {
            full: function SEQ() {
                const IPOSₒ = IPOS, OPOSₒ = OPOS, ATYPₒ = ATYP;
                if (!ꐚfactorᱻ12()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚfactorᱻ14()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                return true;
            },
            infer: () => {
                ꐚfactorᱻ12.infer();
                ꐚfactorᱻ14.infer();
                return true;
            },
        },
    });

    // ApplicationExpression
    const ꐚfactorᱻ12 = lazy(() => ꐚco(ꐚfactorᱻ13));

    // StringLiteral
    const ꐚfactorᱻ13 = createRule(mode, {
        parse: {
            full: function STR() {
                if (IPOS + 2 > IREP.length) return false;
                if (IREP[IPOS + 0] !== 0x30) return false;
                if (IREP[IPOS + 1] !== 0x62) return false;
                IPOS += 2;
                OREP[OPOS++] = 0x30;
                OREP[OPOS++] = 0x62;
                ATYP |= STRING_CHARS;
                return true;
            },
            infer: function STR() {
                OREP[OPOS++] = 0x30;
                OREP[OPOS++] = 0x62;
                ATYP |= STRING_CHARS;
                return true;
            },
        },
        print: {
            full: function STR() {
                if (ATYP !== STRING_CHARS) return false;
                if (IPOS + 2 > IREP.length) return false;
                if (IREP[IPOS + 0] !== 0x30) return false;
                if (IREP[IPOS + 1] !== 0x62) return false;
                IPOS += 2;
                OREP[OPOS++] = 0x30;
                OREP[OPOS++] = 0x62;
                return true;
            },
            infer: function STR() {
                OREP[OPOS++] = 0x30;
                OREP[OPOS++] = 0x62;
                return true;
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
                const IPOSₒ = IPOS, OPOSₒ = OPOS, ATYPₒ = ATYP;
                if (!ꐚfactorᱻ17()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚfactorᱻ19()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                return true;
            },
            infer: () => {
                ꐚfactorᱻ17.infer();
                ꐚfactorᱻ19.infer();
                return true;
            },
        },
        print: {
            full: function SEQ() {
                const IPOSₒ = IPOS, OPOSₒ = OPOS, ATYPₒ = ATYP;
                if (!ꐚfactorᱻ17()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚfactorᱻ19()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                return true;
            },
            infer: () => {
                ꐚfactorᱻ17.infer();
                ꐚfactorᱻ19.infer();
                return true;
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
                if (IPOS >= IREP.length) return false;
                cc = IREP[IPOS];
                if (cc !== 0x69) return false;
                IPOS += 1;
                OREP[OPOS++] = cc;
                ATYP |= STRING_CHARS
                return true;
            },
            infer: () => {
                OREP[OPOS++] = 0x69;
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
                if (cc !== 0x69) return false;
                IPOS += 1;
                OREP[OPOS++] = cc;
                return true;
            },
            infer: () => {
                OREP[OPOS++] = 0x69;
                return true;
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
                const IPOSₒ = IPOS, OPOSₒ = OPOS, ATYPₒ = ATYP;
                if (!ꐚfactorᱻ22()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚexpr()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚfactorᱻ24()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                return true;
            },
            infer: () => {
                ꐚfactorᱻ22.infer();
                ꐚexpr.infer();
                ꐚfactorᱻ24.infer();
                return true;
            },
        },
        print: {
            full: function SEQ() {
                const IPOSₒ = IPOS, OPOSₒ = OPOS, ATYPₒ = ATYP;
                if (!ꐚfactorᱻ22()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚexpr()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚfactorᱻ24()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                return true;
            },
            infer: () => {
                ꐚfactorᱻ22.infer();
                ꐚexpr.infer();
                ꐚfactorᱻ24.infer();
                return true;
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
                if (IPOS >= IREP.length) return false;
                cc = IREP[IPOS];
                if (cc !== 0x28) return false;
                IPOS += 1;
                OREP[OPOS++] = cc;
                ATYP |= STRING_CHARS
                return true;
            },
            infer: () => {
                OREP[OPOS++] = 0x28;
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
                if (cc !== 0x28) return false;
                IPOS += 1;
                OREP[OPOS++] = cc;
                return true;
            },
            infer: () => {
                OREP[OPOS++] = 0x28;
                return true;
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
                if (IPOS >= IREP.length) return false;
                cc = IREP[IPOS];
                if (cc !== 0x29) return false;
                IPOS += 1;
                OREP[OPOS++] = cc;
                ATYP |= STRING_CHARS
                return true;
            },
            infer: () => {
                OREP[OPOS++] = 0x29;
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
                if (cc !== 0x29) return false;
                IPOS += 1;
                OREP[OPOS++] = cc;
                return true;
            },
            infer: () => {
                OREP[OPOS++] = 0x29;
                return true;
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
                full: () => ꐚexprᱻ2.infer(),
                infer: () => ꐚexprᱻ2.infer(),
            },
            print: {
                full: () => {
                    const OPOSₒ = OPOS;
                    const result = ꐚexprᱻ2();
                    OPOS = OPOSₒ;
                    return result;
                },
                infer: () => true,
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
                    const OPOSₒ = OPOS, ATYPₒ = ATYP;
                    const result = ꐚexprᱻ3();
                    OPOS = OPOSₒ, ATYP = ATYPₒ;
                    return result;
                },
                infer: () => true,
            },
            print: {
                full: () => ꐚexprᱻ3.infer(),
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
