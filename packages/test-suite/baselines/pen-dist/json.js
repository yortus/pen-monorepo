
"use strict";
function booleanLiteral(options) {
    const { value } = options;
    const out = options.outForm === 'ast' ? value : undefined;
    if (options.inForm !== 'ast') {
        return function BOO() { return OUT = out, true; };
    }
    return function BOO() {
        if (IN !== value || IP !== 0)
            return false;
        IP += 1;
        OUT = out;
        return true;
    };
}
function createMainExports(createProgram) {
    const parse = createProgram({ inForm: 'txt', outForm: 'ast' });
    const print = createProgram({ inForm: 'ast', outForm: 'txt' });
    return {
        parse: (text) => {
            setState({ IN: text, IP: 0 });
            if (!parse())
                throw new Error('parse failed');
            if (!isInputFullyConsumed())
                throw new Error(`parse didn't consume entire input`);
            if (OUT === undefined)
                throw new Error(`parse didn't return a value`);
            return OUT;
        },
        print: (node) => {
            setState({ IN: node, IP: 0 });
            if (!print())
                throw new Error('print failed');
            if (!isInputFullyConsumed())
                throw new Error(`print didn't consume entire input`);
            if (OUT === undefined)
                throw new Error(`print didn't return a value`);
            return OUT;
        },
    };
}
function field(options) {
    const { name, value } = options;
    if (options.inForm === 'txt' || options.outForm === 'ast') {
        return function FLD() {
            let stateₒ = getState();
            let obj = {};
            if (!name())
                return false;
            assert(typeof OUT === 'string');
            let propName = OUT;
            if (!value())
                return setState(stateₒ), false;
            assert(OUT !== undefined);
            obj[propName] = OUT;
            OUT = obj;
            return true;
        };
    }
    if (options.inForm === 'ast' || options.outForm === 'txt') {
        return function FLD() {
            if (!isPlainObject(IN))
                return false;
            let stateₒ = getState();
            let text;
            let propNames = Object.keys(IN);
            let propCount = propNames.length;
            assert(propCount <= 32);
            const obj = IN;
            let bitmask = IP;
            for (let i = 0; i < propCount; ++i) {
                let propName = propNames[i];
                const propBit = 1 << i;
                if ((bitmask & propBit) !== 0)
                    continue;
                setState({ IN: propName, IP: 0 });
                if (!name())
                    continue;
                if (IP !== propName.length)
                    continue;
                text = concat(text, OUT);
                setState({ IN: obj[propName], IP: 0 });
                if (!value())
                    continue;
                if (!isInputFullyConsumed())
                    continue;
                text = concat(text, OUT);
                bitmask += propBit;
                setState({ IN: obj, IP: bitmask });
                OUT = text;
                return true;
            }
            setState(stateₒ);
            return false;
        };
    }
    throw new Error(`Unsupported operation '${options.inForm}'->'${options.outForm}'`);
}
function list(options) {
    const { elements } = options;
    const elementsLength = elements.length;
    if (options.inForm === 'txt' || options.outForm === 'ast') {
        return function LST() {
            let stateₒ = getState();
            let arr = [];
            for (let i = 0; i < elementsLength; ++i) {
                if (!elements[i]())
                    return setState(stateₒ), false;
                assert(OUT !== undefined);
                arr.push(OUT);
            }
            OUT = arr;
            return true;
        };
    }
    if (options.inForm === 'ast' || options.outForm === 'txt') {
        return function LST() {
            if (!Array.isArray(IN))
                return false;
            if (IP < 0 || IP + elementsLength > IN.length)
                return false;
            let stateₒ = getState();
            let text;
            const arr = IN;
            const off = IP;
            for (let i = 0; i < elementsLength; ++i) {
                setState({ IN: arr[off + i], IP: 0 });
                if (!elements[i]())
                    return setState(stateₒ), false;
                if (!isInputFullyConsumed())
                    return setState(stateₒ), false;
                text = concat(text, OUT);
            }
            setState({ IN: arr, IP: off + elementsLength });
            OUT = text;
            return true;
        };
    }
    throw new Error(`Unsupported operation '${options.inForm}'->'${options.outForm}'`);
}
function not(options) {
    const { expression } = options;
    return function NOT() {
        let stateₒ = getState();
        let result = !expression();
        setState(stateₒ);
        OUT = undefined;
        return result;
    };
}
function nullLiteral(options) {
    const out = options.outForm === 'ast' ? null : undefined;
    if (options.inForm !== 'ast') {
        return function NUL() { return OUT = out, true; };
    }
    return function NUL() {
        if (IN !== null || IP !== 0)
            return false;
        IP = 1;
        OUT = out;
        return true;
    };
}
function numericLiteral(options) {
    const { value } = options;
    const out = options.outForm === 'ast' ? value : undefined;
    if (options.inForm !== 'ast') {
        return function NUM() { return OUT = out, true; };
    }
    return function NUM() {
        if (IN !== value || IP !== 0)
            return false;
        IP = 1;
        OUT = out;
        return true;
    };
}
function record(options) {
    const { fields } = options;
    if (options.inForm === 'txt' || options.outForm === 'ast') {
        return function RCD() {
            let stateₒ = getState();
            let obj = {};
            for (let field of fields) {
                let propName = field.name;
                if (!field.value())
                    return setState(stateₒ), false;
                assert(OUT !== undefined);
                obj[propName] = OUT;
            }
            OUT = obj;
            return true;
        };
    }
    if (options.inForm === 'ast' || options.outForm === 'txt') {
        return function RCD() {
            if (!isPlainObject(IN))
                return false;
            let stateₒ = getState();
            let text;
            let propNames = Object.keys(IN);
            let propCount = propNames.length;
            assert(propCount <= 32);
            const obj = IN;
            let bitmask = IP;
            for (let field of fields) {
                let i = propNames.indexOf(field.name);
                if (i < 0)
                    return setState(stateₒ), false;
                let propName = propNames[i];
                const propBit = 1 << i;
                if ((bitmask & propBit) !== 0)
                    return setState(stateₒ), false;
                setState({ IN: obj[propName], IP: 0 });
                if (!field.value())
                    return setState(stateₒ), false;
                if (!isInputFullyConsumed())
                    return setState(stateₒ), false;
                text = concat(text, OUT);
                bitmask += propBit;
            }
            setState({ IN: obj, IP: bitmask });
            OUT = text;
            return true;
        };
    }
    throw new Error(`Unsupported operation '${options.inForm}'->'${options.outForm}'`);
}
function stringLiteral(options) {
    const { value } = options;
    const length = value.length;
    const out = options.outForm === 'nil' ? undefined : value;
    const checkInType = options.inForm !== 'txt';
    if (options.inForm === 'nil') {
        return function STR() { return OUT = out, true; };
    }
    return function STR() {
        if (checkInType && typeof IN !== 'string')
            return false;
        if (IP + length > IN.length)
            return false;
        for (let i = 0; i < length; ++i) {
            if (IN.charAt(IP + i) !== value.charAt(i))
                return false;
        }
        IP += length;
        OUT = out;
        return true;
    };
}
let IN;
let IP;
let OUT;
function getState() {
    return { IN, IP };
}
function setState(state) {
    IN = state.IN;
    IP = state.IP;
}
function assert(value) {
    if (!value)
        throw new Error(`Assertion failed`);
}
function concat(a, b) {
    if (a === undefined)
        return b;
    if (b === undefined)
        return a;
    if (typeof a === 'string' && typeof b === 'string')
        return a + b;
    if (Array.isArray(a) && Array.isArray(b))
        return [...a, ...b];
    return Object.assign(Object.assign({}, a), b);
}
function isInputFullyConsumed() {
    if (typeof IN === 'string')
        return IP === IN.length;
    if (Array.isArray(IN))
        return IP === IN.length;
    if (typeof IN === 'object' && IN !== null) {
        let keyCount = Object.keys(IN).length;
        assert(keyCount <= 32);
        if (keyCount === 0)
            return true;
        return IP === -1 >>> (32 - keyCount);
    }
    return IP === 1;
}
function isPlainObject(value) {
    return value !== null && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype;
}
function zeroOrMore(options) {
    const { expression } = options;
    return function O_M() {
        let stateₒ = getState();
        let out;
        while (true) {
            if (!expression())
                break;
            if (IP === stateₒ.IP)
                break;
            out = concat(out, OUT);
        }
        OUT = out;
        return true;
    };
}
function zeroOrOne(options) {
    const { expression } = options;
    return function O_1() {
        if (!expression())
            OUT = undefined;
        return true;
    };
}

// -------------------- Extensions --------------------
const createExtension𝕊3 = (() => {
    "use strict";
    /* @pen exports = {
        char,
        f64,
        i32,
        memoise,
    } */
    // TODO: doc... has both 'txt' and 'ast' representation
    // TODO: supports only single UTF-16 code units, ie basic multilingual plane. Extend to full unicode support somehow...
    // TODO: optimise 'any char' case better
    // TODO: optimise all cases better
    function char(options) {
        const checkInType = options.inForm !== 'txt';
        return function CHA_lambda(expr) {
            var _a, _b, _c, _d, _e, _f, _g, _h;
            let min = (_d = (_c = (_b = (_a = expr.bindings) === null || _a === void 0 ? void 0 : _a.min) === null || _b === void 0 ? void 0 : _b.constant) === null || _c === void 0 ? void 0 : _c.value) !== null && _d !== void 0 ? _d : '\u0000';
            let max = (_h = (_g = (_f = (_e = expr.bindings) === null || _e === void 0 ? void 0 : _e.max) === null || _f === void 0 ? void 0 : _f.constant) === null || _g === void 0 ? void 0 : _g.value) !== null && _h !== void 0 ? _h : '\uFFFF';
            assert(typeof min === 'string' && min.length === 1);
            assert(typeof max === 'string' && max.length === 1);
            let checkRange = min !== '\u0000' || max !== '\uFFFF';
            if (options.inForm === 'nil') {
                const out = options.outForm === 'nil' ? undefined : min;
                return function CHA() { return OUT = out, true; };
            }
            return function CHA() {
                if (checkInType && typeof IN !== 'string')
                    return false;
                if (IP < 0 || IP >= IN.length)
                    return false;
                let c = IN.charAt(IP);
                if (checkRange && (c < min || c > max))
                    return false;
                IP += 1;
                OUT = options.outForm === 'nil' ? undefined : c;
                return true;
            };
        };
    }
    // TODO: doc... has both 'txt' and 'ast' representation
    function f64(options) {
        if (options.inForm === 'nil') {
            const out = options.outForm === 'nil' ? undefined : 0;
            return function F64() { return OUT = out, true; };
        }
        if (options.inForm === 'txt' || options.outForm === 'ast') {
            return function F64() {
                if (typeof IN !== 'string')
                    return false;
                let stateₒ = getState();
                const LEN = IN.length;
                const EOS = 0;
                let digitCount = 0;
                // Parse optional '+' or '-' sign
                let c = IN.charCodeAt(IP);
                if (c === PLUS_SIGN || c === MINUS_SIGN) {
                    IP += 1;
                    c = IP < LEN ? IN.charCodeAt(IP) : EOS;
                }
                // Parse 0..M digits
                while (true) {
                    if (c < ZERO_DIGIT || c > NINE_DIGIT)
                        break;
                    digitCount += 1;
                    IP += 1;
                    c = IP < LEN ? IN.charCodeAt(IP) : EOS;
                }
                // Parse optional '.'
                if (c === DECIMAL_POINT) {
                    IP += 1;
                    c = IP < LEN ? IN.charCodeAt(IP) : EOS;
                }
                // Parse 0..M digits
                while (true) {
                    if (c < ZERO_DIGIT || c > NINE_DIGIT)
                        break;
                    digitCount += 1;
                    IP += 1;
                    c = IP < LEN ? IN.charCodeAt(IP) : EOS;
                }
                // Ensure we have parsed at least one significant digit
                if (digitCount === 0)
                    return setState(stateₒ), false;
                // Parse optional exponent
                if (c === UPPERCASE_E || c === LOWERCASE_E) {
                    IP += 1;
                    c = IP < LEN ? IN.charCodeAt(IP) : EOS;
                    // Parse optional '+' or '-' sign
                    if (c === PLUS_SIGN || c === MINUS_SIGN) {
                        IP += 1;
                        c = IP < LEN ? IN.charCodeAt(IP) : EOS;
                    }
                    // Parse 1..M digits
                    digitCount = 0;
                    while (true) {
                        if (c < ZERO_DIGIT || c > NINE_DIGIT)
                            break;
                        digitCount += 1;
                        IP += 1;
                        c = IP < LEN ? IN.charCodeAt(IP) : EOS;
                    }
                    if (digitCount === 0)
                        return setState(stateₒ), false;
                }
                // There is a syntactically valid float. Delegate parsing to the JS runtime.
                // Reject the number if it parses to Infinity or Nan.
                // TODO: the conversion may still be lossy. Provide a non-lossy mode, like `safenum` does?
                let num = Number.parseFloat(IN.slice(stateₒ.IP, IP));
                if (!Number.isFinite(num))
                    return setState(stateₒ), false;
                // Success
                OUT = options.outForm === 'nil' ? undefined : num;
                return true;
            };
        }
        if (options.inForm === 'ast' || options.outForm === 'txt') {
            return function F64() {
                // Ensure N is a number.
                if (typeof IN !== 'number' || IP !== 0)
                    return false;
                // Delegate unparsing to the JS runtime.
                // TODO: the conversion may not exactly match the original string. Add this to the lossiness list.
                OUT = options.outForm === 'nil' ? undefined : String(IN);
                IP = 1;
                return true;
            };
        }
        throw new Error(`Unsupported operation '${options.inForm}'->'${options.outForm}'`);
    }
    // These constants are used by the f64 rule.
    const PLUS_SIGN = '+'.charCodeAt(0);
    const MINUS_SIGN = '-'.charCodeAt(0);
    const DECIMAL_POINT = '.'.charCodeAt(0);
    const ZERO_DIGIT = '0'.charCodeAt(0);
    const NINE_DIGIT = '9'.charCodeAt(0);
    const LOWERCASE_E = 'e'.charCodeAt(0);
    const UPPERCASE_E = 'E'.charCodeAt(0);
    // tslint:disable: no-bitwise
    // TODO: doc... has both 'txt' and 'ast' representation
    function i32(options) {
        return function I32_lambda(expr) {
            var _a, _b, _c, _d, _e, _f, _g, _h;
            let base = (_d = (_c = (_b = (_a = expr.bindings) === null || _a === void 0 ? void 0 : _a.base) === null || _b === void 0 ? void 0 : _b.constant) === null || _c === void 0 ? void 0 : _c.value) !== null && _d !== void 0 ? _d : 10;
            let signed = (_h = (_g = (_f = (_e = expr.bindings) === null || _e === void 0 ? void 0 : _e.signed) === null || _f === void 0 ? void 0 : _f.constant) === null || _g === void 0 ? void 0 : _g.value) !== null && _h !== void 0 ? _h : true;
            assert(typeof base === 'number' && base >= 2 && base <= 36);
            assert(typeof signed === 'boolean');
            if (options.inForm === 'nil') {
                const out = options.outForm === 'nil' ? undefined : 0;
                return function I32() { return OUT = out, true; };
            }
            if (options.inForm === 'txt' || options.outForm === 'ast') {
                return function I32() {
                    if (typeof IN !== 'string')
                        return false;
                    let stateₒ = getState();
                    // Parse optional leading '-' sign (if signed)...
                    let MAX_NUM = signed ? 0x7FFFFFFF : 0xFFFFFFFF;
                    let isNegative = false;
                    if (signed && IP < IN.length && IN.charAt(IP) === '-') {
                        isNegative = true;
                        MAX_NUM = 0x80000000;
                        IP += 1;
                    }
                    // ...followed by one or more decimal digits. (NB: no exponents).
                    let num = 0;
                    let digits = 0;
                    while (IP < IN.length) {
                        // Read a digit.
                        let c = IN.charCodeAt(IP);
                        if (c >= 256)
                            break;
                        let digitValue = DIGIT_VALUES[c];
                        if (digitValue >= base)
                            break;
                        // Update parsed number.
                        num *= base;
                        num += digitValue;
                        // Check for overflow.
                        if (num > MAX_NUM)
                            return setState(stateₒ), false;
                        // Loop again.
                        IP += 1;
                        digits += 1;
                    }
                    // Check that we parsed at least one digit.
                    if (digits === 0)
                        return setState(stateₒ), false;
                    // Apply the sign.
                    if (isNegative)
                        num = -num;
                    // Success
                    OUT = options.outForm === 'nil' ? undefined : num;
                    return true;
                };
            }
            if (options.inForm === 'ast' || options.outForm === 'txt') {
                return function I32() {
                    if (typeof IN !== 'number' || IP !== 0)
                        return false;
                    let num = IN;
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
                    let digits = [];
                    while (true) {
                        let d = num % base;
                        num = (num / base) | 0;
                        digits.push(CHAR_CODES[d]);
                        if (num === 0)
                            break;
                    }
                    // Compute the final string.
                    if (isNegative)
                        digits.push(0x2d); // char code for '-'
                    // TODO: is String.fromCharCode(...) performant?
                    OUT = options.outForm === 'nil' ? undefined : String.fromCharCode(...digits.reverse());
                    IP = 1;
                    return true;
                };
            }
            throw new Error(`Unsupported operation '${options.inForm}'->'${options.outForm}'`);
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
        80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80, 80,
    ];
    // TODO: doc...
    const CHAR_CODES = [
        0x30, 0x31, 0x32, 0x33, 0x34, 0x35, 0x36, 0x37,
        0x38, 0x39, 0x41, 0x42, 0x43, 0x44, 0x45, 0x46,
        0x47, 0x48, 0x49, 0x4a, 0x4b, 0x4c, 0x4d, 0x4e,
        0x4f, 0x50, 0x51, 0x52, 0x53, 0x54, 0x55, 0x56,
        0x57, 0x58, 0x59, 0x5a,
    ];
    function memoise(_options) {
        return function MEM_lambda(expr) {
            // TODO: investigate... need to use `text` as part of memo key? Study lifecycle/extent of each `memos` instance.
            const memos = new Map();
            return function MEM() {
                // Check whether the memo table already has an entry for the given initial state.
                let stateₒ = getState();
                let memos2 = memos.get(IN);
                if (memos2 === undefined) {
                    memos2 = new Map();
                    memos.set(IN, memos2);
                }
                let memo = memos2.get(IP);
                if (!memo) {
                    // The memo table does *not* have an entry, so this is the first attempt to apply this rule with
                    // this initial state. The first thing we do is create a memo table entry, which is marked as
                    // *unresolved*. All future applications of this rule with the same initial state will find this
                    // memo. If a future application finds the memo still unresolved, then we know we have encountered
                    // left-recursion.
                    memo = { resolved: false, isLeftRecursive: false, result: false, stateᐟ: stateₒ, OUT: undefined };
                    memos2.set(IP, memo);
                    // Now that the unresolved memo is in place, apply the rule, and resolve the memo with the result.
                    // At this point, any left-recursive paths encountered during application are guaranteed to have
                    // been noted and aborted (see below).
                    if (expr()) { // TODO: fix cast
                        memo.result = true;
                        memo.stateᐟ = getState();
                        memo.OUT = OUT;
                    }
                    memo.resolved = true;
                    // If we did *not* encounter left-recursion, then we have simple memoisation, and the result is
                    // final.
                    if (!memo.isLeftRecursive) {
                        setState(memo.stateᐟ);
                        OUT = memo.OUT;
                        return memo.result;
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
                        setState(stateₒ);
                        // TODO: break cases for UNPARSING:
                        // anything --> same thing (covers all string cases, since they can only be same or shorter)
                        // some node --> some different non-empty node (assert: should never happen!)
                        if (!expr())
                            break; // TODO: fix cast
                        let state = getState();
                        if (state.IP <= memo.stateᐟ.IP)
                            break;
                        // TODO: was for unparse... comment above says should never happen...
                        // if (!isInputFullyConsumed()) break;
                        memo.stateᐟ = state;
                        memo.OUT = OUT;
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
                setState(memo.stateᐟ);
                OUT = memo.OUT;
                return memo.result;
            };
        };
    }

    return (staticOptions) => ({
        bindings: {
            char: char(staticOptions),
            f64: f64(staticOptions),
            i32: i32(staticOptions),
            memoise: memoise(staticOptions),
        }
    });
})();
const createExtension𝕊4 = (() => {
    "use strict";
    /* @pen exports = {
        unicode
    } */
    function unicode(options) {
        return function UNI_lambda(expr) {
            var _a, _b, _c, _d, _e, _f, _g, _h, _j;
            let base = (_c = (_b = (_a = expr.bindings) === null || _a === void 0 ? void 0 : _a.base) === null || _b === void 0 ? void 0 : _b.constant) === null || _c === void 0 ? void 0 : _c.value;
            let minDigits = (_f = (_e = (_d = expr.bindings) === null || _d === void 0 ? void 0 : _d.minDigits) === null || _e === void 0 ? void 0 : _e.constant) === null || _f === void 0 ? void 0 : _f.value;
            let maxDigits = (_j = (_h = (_g = expr.bindings) === null || _g === void 0 ? void 0 : _g.maxDigits) === null || _h === void 0 ? void 0 : _h.constant) === null || _j === void 0 ? void 0 : _j.value;
            assert(typeof base === 'number' && base >= 2 && base <= 36);
            assert(typeof minDigits === 'number' && minDigits >= 1 && minDigits <= 8);
            assert(typeof maxDigits === 'number' && maxDigits >= minDigits && maxDigits <= 8);
            // Construct a regex to match the digits
            let pattern = `[0-${base < 10 ? base - 1 : 9}${base > 10 ? `a-${String.fromCharCode('a'.charCodeAt(0) + base - 11)}` : ''}]`;
            let regex = RegExp(pattern, 'i');
            if (options.inForm === 'txt' || options.outForm === 'ast') {
                return function UNI() {
                    if (typeof IN !== 'string')
                        return false;
                    let stateₒ = getState();
                    const LEN = IN.length;
                    const EOS = '';
                    let len = 0;
                    let num = ''; // TODO: fix this - should actually keep count
                    let c = IP < LEN ? IN.charAt(IP) : EOS;
                    while (true) {
                        if (!regex.test(c))
                            break;
                        num += c;
                        IP += 1;
                        len += 1;
                        if (len === maxDigits)
                            break;
                        c = IP < LEN ? IN.charAt(IP) : EOS;
                    }
                    if (len < minDigits)
                        return setState(stateₒ), false;
                    // tslint:disable-next-line: no-eval
                    OUT = eval(`"\\u{${num}}"`); // TODO: hacky... fix when we have a charCode
                    return true;
                };
            }
            if (options.inForm === 'ast' || options.outForm === 'txt') {
                return function UNI() {
                    // TODO: implement
                    return false;
                };
            }
            throw new Error(`Unsupported operation '${options.inForm}'->'${options.outForm}'`);
        };
    }

    return (staticOptions) => ({
        bindings: {
            unicode: unicode(staticOptions),
        }
    });
})();

function createProgram({inForm, outForm}) {

    const 𝕊0 = {
        bindings: {
            char: 𝕊0_char,
            f64: 𝕊0_f64,
            unicode: 𝕊0_unicode,
            start: 𝕊0_start,
            Value: 𝕊0_Value,
            False: 𝕊0_False,
            Null: 𝕊0_Null,
            True: 𝕊0_True,
            Object: 𝕊0_Object,
            Property: 𝕊0_Property,
            Array: 𝕊0_Array,
            Element: 𝕊0_Element,
            Number: 𝕊0_Number,
            String: 𝕊0_String,
            CHAR: 𝕊0_CHAR,
            LBRACE: 𝕊0_LBRACE,
            RBRACE: 𝕊0_RBRACE,
            LBRACKET: 𝕊0_LBRACKET,
            RBRACKET: 𝕊0_RBRACKET,
            COLON: 𝕊0_COLON,
            COMMA: 𝕊0_COMMA,
            DOUBLE_QUOTE: 𝕊0_DOUBLE_QUOTE,
            WS: 𝕊0_WS,
        },
    };

    const 𝕊1 = {
        bindings: {
            min: 𝕊1_min,
            max: 𝕊1_max,
        },
    };

    const 𝕊2 = {
        bindings: {
            base: 𝕊2_base,
            minDigits: 𝕊2_minDigits,
            maxDigits: 𝕊2_maxDigits,
        },
    };

    const 𝕊3 = createExtension𝕊3({inForm, outForm});

    const 𝕊4 = createExtension𝕊4({inForm, outForm});

    // -------------------- Aliases --------------------
    function 𝕊0_char(arg) { return 𝕊3.bindings.char(arg); }
    function 𝕊0_f64(arg) { return 𝕊3.bindings.f64(arg); }
    function 𝕊0_unicode(arg) { return 𝕊4.bindings.unicode(arg); }
    function 𝕊0_Number(arg) { return 𝕊0.bindings.f64(arg); }

    // -------------------- json.pen --------------------

    function 𝕊0_start() {
        if (!𝕊0_start_memo) 𝕊0_start_memo = (() => {
            let expr0 = 𝕊0.bindings.WS;
            let expr1 = 𝕊0.bindings.Value;
            let expr2 = 𝕊0.bindings.WS;
            return function SEQ() {
                let stateₒ = getState();
                let out;
                if (expr0()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (expr1()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (expr2()) out = concat(out, OUT); else return setState(stateₒ), false;
                OUT = out;
                return true;
            }
        })();
        return 𝕊0_start_memo();
    }
    let 𝕊0_start_memo;

    function 𝕊0_Value() {
        if (!𝕊0_Value_memo) 𝕊0_Value_memo = (() => {
            let expr0 = 𝕊0.bindings.False;
            let expr1 = 𝕊0.bindings.Null;
            let expr2 = 𝕊0.bindings.True;
            let expr3 = 𝕊0.bindings.Object;
            let expr4 = 𝕊0.bindings.Array;
            let expr5 = 𝕊0.bindings.Number;
            let expr6 = 𝕊0.bindings.String;
            return function SEL() {
                if (expr0()) return true;
                if (expr1()) return true;
                if (expr2()) return true;
                if (expr3()) return true;
                if (expr4()) return true;
                if (expr5()) return true;
                if (expr6()) return true;
                return false;
            }
        })();
        return 𝕊0_Value_memo();
    }
    let 𝕊0_Value_memo;

    function 𝕊0_False() {
        if (!𝕊0_False_memo) 𝕊0_False_memo = (() => {
            let expr0 = stringLiteral({
                inForm: inForm !== "txt" ? "nil" : inForm,
                outForm: outForm !== "txt" ? "nil" : outForm,
                value: "false",
            });
            let expr1 = booleanLiteral({inForm, outForm, value: false});
            return function SEQ() {
                let stateₒ = getState();
                let out;
                if (expr0()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (expr1()) out = concat(out, OUT); else return setState(stateₒ), false;
                OUT = out;
                return true;
            }
        })();
        return 𝕊0_False_memo();
    }
    let 𝕊0_False_memo;

    function 𝕊0_Null() {
        if (!𝕊0_Null_memo) 𝕊0_Null_memo = (() => {
            let expr0 = stringLiteral({
                inForm: inForm !== "txt" ? "nil" : inForm,
                outForm: outForm !== "txt" ? "nil" : outForm,
                value: "null",
            });
            let expr1 = nullLiteral({inForm, outForm});
            return function SEQ() {
                let stateₒ = getState();
                let out;
                if (expr0()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (expr1()) out = concat(out, OUT); else return setState(stateₒ), false;
                OUT = out;
                return true;
            }
        })();
        return 𝕊0_Null_memo();
    }
    let 𝕊0_Null_memo;

    function 𝕊0_True() {
        if (!𝕊0_True_memo) 𝕊0_True_memo = (() => {
            let expr0 = stringLiteral({
                inForm: inForm !== "txt" ? "nil" : inForm,
                outForm: outForm !== "txt" ? "nil" : outForm,
                value: "true",
            });
            let expr1 = booleanLiteral({inForm, outForm, value: true});
            return function SEQ() {
                let stateₒ = getState();
                let out;
                if (expr0()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (expr1()) out = concat(out, OUT); else return setState(stateₒ), false;
                OUT = out;
                return true;
            }
        })();
        return 𝕊0_True_memo();
    }
    let 𝕊0_True_memo;

    function 𝕊0_Object() {
        if (!𝕊0_Object_memo) 𝕊0_Object_memo = (() => {
            let expr0 = 𝕊0.bindings.LBRACE;
            let expr1 = (() => {
                let expr0 = (() => {
                    let expr0 = 𝕊0.bindings.Property;
                    let expr1 = zeroOrMore({
                        inForm,
                        outForm,
                        expression: (() => {
                            let expr0 = 𝕊0.bindings.COMMA;
                            let expr1 = 𝕊0.bindings.Property;
                            return function SEQ() {
                                let stateₒ = getState();
                                let out;
                                if (expr0()) out = concat(out, OUT); else return setState(stateₒ), false;
                                if (expr1()) out = concat(out, OUT); else return setState(stateₒ), false;
                                OUT = out;
                                return true;
                            }
                        })(),
                    });
                    return function SEQ() {
                        let stateₒ = getState();
                        let out;
                        if (expr0()) out = concat(out, OUT); else return setState(stateₒ), false;
                        if (expr1()) out = concat(out, OUT); else return setState(stateₒ), false;
                        OUT = out;
                        return true;
                    }
                })();
                let expr1 = record({
                    inForm,
                    outForm,
                    fields: [],
                });
                return function SEL() {
                    if (expr0()) return true;
                    if (expr1()) return true;
                    return false;
                }
            })();
            let expr2 = 𝕊0.bindings.RBRACE;
            return function SEQ() {
                let stateₒ = getState();
                let out;
                if (expr0()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (expr1()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (expr2()) out = concat(out, OUT); else return setState(stateₒ), false;
                OUT = out;
                return true;
            }
        })();
        return 𝕊0_Object_memo();
    }
    let 𝕊0_Object_memo;

    function 𝕊0_Property() {
        if (!𝕊0_Property_memo) 𝕊0_Property_memo = field({
            inForm,
            outForm,
            name: 𝕊0.bindings.String,
            value: (() => {
                let expr0 = 𝕊0.bindings.COLON;
                let expr1 = 𝕊0.bindings.Value;
                return function SEQ() {
                    let stateₒ = getState();
                    let out;
                    if (expr0()) out = concat(out, OUT); else return setState(stateₒ), false;
                    if (expr1()) out = concat(out, OUT); else return setState(stateₒ), false;
                    OUT = out;
                    return true;
                }
            })(),
        });
        return 𝕊0_Property_memo();
    }
    let 𝕊0_Property_memo;

    function 𝕊0_Array() {
        if (!𝕊0_Array_memo) 𝕊0_Array_memo = (() => {
            let expr0 = 𝕊0.bindings.LBRACKET;
            let expr1 = (() => {
                let expr0 = (() => {
                    let expr0 = 𝕊0.bindings.Element;
                    let expr1 = zeroOrMore({
                        inForm,
                        outForm,
                        expression: (() => {
                            let expr0 = 𝕊0.bindings.COMMA;
                            let expr1 = 𝕊0.bindings.Element;
                            return function SEQ() {
                                let stateₒ = getState();
                                let out;
                                if (expr0()) out = concat(out, OUT); else return setState(stateₒ), false;
                                if (expr1()) out = concat(out, OUT); else return setState(stateₒ), false;
                                OUT = out;
                                return true;
                            }
                        })(),
                    });
                    return function SEQ() {
                        let stateₒ = getState();
                        let out;
                        if (expr0()) out = concat(out, OUT); else return setState(stateₒ), false;
                        if (expr1()) out = concat(out, OUT); else return setState(stateₒ), false;
                        OUT = out;
                        return true;
                    }
                })();
                let expr1 = list({
                    inForm,
                    outForm,
                    elements: [],
                });
                return function SEL() {
                    if (expr0()) return true;
                    if (expr1()) return true;
                    return false;
                }
            })();
            let expr2 = 𝕊0.bindings.RBRACKET;
            return function SEQ() {
                let stateₒ = getState();
                let out;
                if (expr0()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (expr1()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (expr2()) out = concat(out, OUT); else return setState(stateₒ), false;
                OUT = out;
                return true;
            }
        })();
        return 𝕊0_Array_memo();
    }
    let 𝕊0_Array_memo;

    function 𝕊0_Element() {
        if (!𝕊0_Element_memo) 𝕊0_Element_memo = list({
            inForm,
            outForm,
            elements: [
                𝕊0.bindings.Value,
            ],
        });
        return 𝕊0_Element_memo();
    }
    let 𝕊0_Element_memo;

    function 𝕊0_String() {
        if (!𝕊0_String_memo) 𝕊0_String_memo = (() => {
            let expr0 = 𝕊0.bindings.DOUBLE_QUOTE;
            let expr1 = zeroOrMore({
                inForm,
                outForm,
                expression: 𝕊0.bindings.CHAR,
            });
            let expr2 = 𝕊0.bindings.DOUBLE_QUOTE;
            return function SEQ() {
                let stateₒ = getState();
                let out;
                if (expr0()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (expr1()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (expr2()) out = concat(out, OUT); else return setState(stateₒ), false;
                OUT = out;
                return true;
            }
        })();
        return 𝕊0_String_memo();
    }
    let 𝕊0_String_memo;

    function 𝕊0_CHAR() {
        if (!𝕊0_CHAR_memo) 𝕊0_CHAR_memo = (() => {
            let expr0 = (() => {
                let expr0 = not({
                    inForm,
                    outForm,
                    expression: stringLiteral({
                        inForm: inForm,
                        outForm: outForm,
                        value: "\\",
                    }),
                });
                let expr1 = not({
                    inForm,
                    outForm,
                    expression: stringLiteral({
                        inForm: inForm,
                        outForm: outForm,
                        value: "\"",
                    }),
                });
                let expr2 = (𝕊0.bindings.char)(𝕊1);
                return function SEQ() {
                    let stateₒ = getState();
                    let out;
                    if (expr0()) out = concat(out, OUT); else return setState(stateₒ), false;
                    if (expr1()) out = concat(out, OUT); else return setState(stateₒ), false;
                    if (expr2()) out = concat(out, OUT); else return setState(stateₒ), false;
                    OUT = out;
                    return true;
                }
            })();
            let expr1 = (() => {
                let expr0 = stringLiteral({
                    inForm: inForm !== "txt" ? "nil" : inForm,
                    outForm: outForm !== "txt" ? "nil" : outForm,
                    value: "\\\"",
                });
                let expr1 = stringLiteral({
                    inForm: inForm !== "ast" ? "nil" : inForm,
                    outForm: outForm !== "ast" ? "nil" : outForm,
                    value: "\"",
                });
                return function SEQ() {
                    let stateₒ = getState();
                    let out;
                    if (expr0()) out = concat(out, OUT); else return setState(stateₒ), false;
                    if (expr1()) out = concat(out, OUT); else return setState(stateₒ), false;
                    OUT = out;
                    return true;
                }
            })();
            let expr2 = (() => {
                let expr0 = stringLiteral({
                    inForm: inForm !== "txt" ? "nil" : inForm,
                    outForm: outForm !== "txt" ? "nil" : outForm,
                    value: "\\\\",
                });
                let expr1 = stringLiteral({
                    inForm: inForm !== "ast" ? "nil" : inForm,
                    outForm: outForm !== "ast" ? "nil" : outForm,
                    value: "\\",
                });
                return function SEQ() {
                    let stateₒ = getState();
                    let out;
                    if (expr0()) out = concat(out, OUT); else return setState(stateₒ), false;
                    if (expr1()) out = concat(out, OUT); else return setState(stateₒ), false;
                    OUT = out;
                    return true;
                }
            })();
            let expr3 = (() => {
                let expr0 = stringLiteral({
                    inForm: inForm !== "txt" ? "nil" : inForm,
                    outForm: outForm !== "txt" ? "nil" : outForm,
                    value: "\\/",
                });
                let expr1 = stringLiteral({
                    inForm: inForm !== "ast" ? "nil" : inForm,
                    outForm: outForm !== "ast" ? "nil" : outForm,
                    value: "/",
                });
                return function SEQ() {
                    let stateₒ = getState();
                    let out;
                    if (expr0()) out = concat(out, OUT); else return setState(stateₒ), false;
                    if (expr1()) out = concat(out, OUT); else return setState(stateₒ), false;
                    OUT = out;
                    return true;
                }
            })();
            let expr4 = (() => {
                let expr0 = stringLiteral({
                    inForm: inForm !== "txt" ? "nil" : inForm,
                    outForm: outForm !== "txt" ? "nil" : outForm,
                    value: "\\b",
                });
                let expr1 = stringLiteral({
                    inForm: inForm !== "ast" ? "nil" : inForm,
                    outForm: outForm !== "ast" ? "nil" : outForm,
                    value: "\b",
                });
                return function SEQ() {
                    let stateₒ = getState();
                    let out;
                    if (expr0()) out = concat(out, OUT); else return setState(stateₒ), false;
                    if (expr1()) out = concat(out, OUT); else return setState(stateₒ), false;
                    OUT = out;
                    return true;
                }
            })();
            let expr5 = (() => {
                let expr0 = stringLiteral({
                    inForm: inForm !== "txt" ? "nil" : inForm,
                    outForm: outForm !== "txt" ? "nil" : outForm,
                    value: "\\f",
                });
                let expr1 = stringLiteral({
                    inForm: inForm !== "ast" ? "nil" : inForm,
                    outForm: outForm !== "ast" ? "nil" : outForm,
                    value: "\f",
                });
                return function SEQ() {
                    let stateₒ = getState();
                    let out;
                    if (expr0()) out = concat(out, OUT); else return setState(stateₒ), false;
                    if (expr1()) out = concat(out, OUT); else return setState(stateₒ), false;
                    OUT = out;
                    return true;
                }
            })();
            let expr6 = (() => {
                let expr0 = stringLiteral({
                    inForm: inForm !== "txt" ? "nil" : inForm,
                    outForm: outForm !== "txt" ? "nil" : outForm,
                    value: "\\n",
                });
                let expr1 = stringLiteral({
                    inForm: inForm !== "ast" ? "nil" : inForm,
                    outForm: outForm !== "ast" ? "nil" : outForm,
                    value: "\n",
                });
                return function SEQ() {
                    let stateₒ = getState();
                    let out;
                    if (expr0()) out = concat(out, OUT); else return setState(stateₒ), false;
                    if (expr1()) out = concat(out, OUT); else return setState(stateₒ), false;
                    OUT = out;
                    return true;
                }
            })();
            let expr7 = (() => {
                let expr0 = stringLiteral({
                    inForm: inForm !== "txt" ? "nil" : inForm,
                    outForm: outForm !== "txt" ? "nil" : outForm,
                    value: "\\r",
                });
                let expr1 = stringLiteral({
                    inForm: inForm !== "ast" ? "nil" : inForm,
                    outForm: outForm !== "ast" ? "nil" : outForm,
                    value: "\r",
                });
                return function SEQ() {
                    let stateₒ = getState();
                    let out;
                    if (expr0()) out = concat(out, OUT); else return setState(stateₒ), false;
                    if (expr1()) out = concat(out, OUT); else return setState(stateₒ), false;
                    OUT = out;
                    return true;
                }
            })();
            let expr8 = (() => {
                let expr0 = stringLiteral({
                    inForm: inForm !== "txt" ? "nil" : inForm,
                    outForm: outForm !== "txt" ? "nil" : outForm,
                    value: "\\t",
                });
                let expr1 = stringLiteral({
                    inForm: inForm !== "ast" ? "nil" : inForm,
                    outForm: outForm !== "ast" ? "nil" : outForm,
                    value: "\t",
                });
                return function SEQ() {
                    let stateₒ = getState();
                    let out;
                    if (expr0()) out = concat(out, OUT); else return setState(stateₒ), false;
                    if (expr1()) out = concat(out, OUT); else return setState(stateₒ), false;
                    OUT = out;
                    return true;
                }
            })();
            let expr9 = (() => {
                let expr0 = stringLiteral({
                    inForm: inForm !== "txt" ? "nil" : inForm,
                    outForm: outForm !== "txt" ? "nil" : outForm,
                    value: "\\u",
                });
                let expr1 = (𝕊0.bindings.unicode)(𝕊2);
                return function SEQ() {
                    let stateₒ = getState();
                    let out;
                    if (expr0()) out = concat(out, OUT); else return setState(stateₒ), false;
                    if (expr1()) out = concat(out, OUT); else return setState(stateₒ), false;
                    OUT = out;
                    return true;
                }
            })();
            return function SEL() {
                if (expr0()) return true;
                if (expr1()) return true;
                if (expr2()) return true;
                if (expr3()) return true;
                if (expr4()) return true;
                if (expr5()) return true;
                if (expr6()) return true;
                if (expr7()) return true;
                if (expr8()) return true;
                if (expr9()) return true;
                return false;
            }
        })();
        return 𝕊0_CHAR_memo();
    }
    let 𝕊0_CHAR_memo;

    function 𝕊0_LBRACE() {
        if (!𝕊0_LBRACE_memo) 𝕊0_LBRACE_memo = (() => {
            let expr0 = 𝕊0.bindings.WS;
            let expr1 = stringLiteral({
                inForm: inForm !== "txt" ? "nil" : inForm,
                outForm: outForm !== "txt" ? "nil" : outForm,
                value: "{",
            });
            let expr2 = 𝕊0.bindings.WS;
            return function SEQ() {
                let stateₒ = getState();
                let out;
                if (expr0()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (expr1()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (expr2()) out = concat(out, OUT); else return setState(stateₒ), false;
                OUT = out;
                return true;
            }
        })();
        return 𝕊0_LBRACE_memo();
    }
    let 𝕊0_LBRACE_memo;

    function 𝕊0_RBRACE() {
        if (!𝕊0_RBRACE_memo) 𝕊0_RBRACE_memo = (() => {
            let expr0 = 𝕊0.bindings.WS;
            let expr1 = stringLiteral({
                inForm: inForm !== "txt" ? "nil" : inForm,
                outForm: outForm !== "txt" ? "nil" : outForm,
                value: "}",
            });
            let expr2 = 𝕊0.bindings.WS;
            return function SEQ() {
                let stateₒ = getState();
                let out;
                if (expr0()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (expr1()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (expr2()) out = concat(out, OUT); else return setState(stateₒ), false;
                OUT = out;
                return true;
            }
        })();
        return 𝕊0_RBRACE_memo();
    }
    let 𝕊0_RBRACE_memo;

    function 𝕊0_LBRACKET() {
        if (!𝕊0_LBRACKET_memo) 𝕊0_LBRACKET_memo = (() => {
            let expr0 = 𝕊0.bindings.WS;
            let expr1 = stringLiteral({
                inForm: inForm !== "txt" ? "nil" : inForm,
                outForm: outForm !== "txt" ? "nil" : outForm,
                value: "[",
            });
            let expr2 = 𝕊0.bindings.WS;
            return function SEQ() {
                let stateₒ = getState();
                let out;
                if (expr0()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (expr1()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (expr2()) out = concat(out, OUT); else return setState(stateₒ), false;
                OUT = out;
                return true;
            }
        })();
        return 𝕊0_LBRACKET_memo();
    }
    let 𝕊0_LBRACKET_memo;

    function 𝕊0_RBRACKET() {
        if (!𝕊0_RBRACKET_memo) 𝕊0_RBRACKET_memo = (() => {
            let expr0 = 𝕊0.bindings.WS;
            let expr1 = stringLiteral({
                inForm: inForm !== "txt" ? "nil" : inForm,
                outForm: outForm !== "txt" ? "nil" : outForm,
                value: "]",
            });
            let expr2 = 𝕊0.bindings.WS;
            return function SEQ() {
                let stateₒ = getState();
                let out;
                if (expr0()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (expr1()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (expr2()) out = concat(out, OUT); else return setState(stateₒ), false;
                OUT = out;
                return true;
            }
        })();
        return 𝕊0_RBRACKET_memo();
    }
    let 𝕊0_RBRACKET_memo;

    function 𝕊0_COLON() {
        if (!𝕊0_COLON_memo) 𝕊0_COLON_memo = (() => {
            let expr0 = 𝕊0.bindings.WS;
            let expr1 = stringLiteral({
                inForm: inForm !== "txt" ? "nil" : inForm,
                outForm: outForm !== "txt" ? "nil" : outForm,
                value: ":",
            });
            let expr2 = 𝕊0.bindings.WS;
            return function SEQ() {
                let stateₒ = getState();
                let out;
                if (expr0()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (expr1()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (expr2()) out = concat(out, OUT); else return setState(stateₒ), false;
                OUT = out;
                return true;
            }
        })();
        return 𝕊0_COLON_memo();
    }
    let 𝕊0_COLON_memo;

    function 𝕊0_COMMA() {
        if (!𝕊0_COMMA_memo) 𝕊0_COMMA_memo = (() => {
            let expr0 = 𝕊0.bindings.WS;
            let expr1 = stringLiteral({
                inForm: inForm !== "txt" ? "nil" : inForm,
                outForm: outForm !== "txt" ? "nil" : outForm,
                value: ",",
            });
            let expr2 = 𝕊0.bindings.WS;
            return function SEQ() {
                let stateₒ = getState();
                let out;
                if (expr0()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (expr1()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (expr2()) out = concat(out, OUT); else return setState(stateₒ), false;
                OUT = out;
                return true;
            }
        })();
        return 𝕊0_COMMA_memo();
    }
    let 𝕊0_COMMA_memo;

    function 𝕊0_DOUBLE_QUOTE() {
        if (!𝕊0_DOUBLE_QUOTE_memo) 𝕊0_DOUBLE_QUOTE_memo = stringLiteral({
            inForm: inForm !== "txt" ? "nil" : inForm,
            outForm: outForm !== "txt" ? "nil" : outForm,
            value: "\"",
        });
        return 𝕊0_DOUBLE_QUOTE_memo();
    }
    let 𝕊0_DOUBLE_QUOTE_memo;

    function 𝕊0_WS() {
        if (!𝕊0_WS_memo) 𝕊0_WS_memo = zeroOrMore({
            inForm,
            outForm,
            expression: (() => {
                let expr0 = stringLiteral({
                    inForm: inForm !== "txt" ? "nil" : inForm,
                    outForm: outForm !== "txt" ? "nil" : outForm,
                    value: " ",
                });
                let expr1 = stringLiteral({
                    inForm: inForm !== "txt" ? "nil" : inForm,
                    outForm: outForm !== "txt" ? "nil" : outForm,
                    value: "\t",
                });
                let expr2 = stringLiteral({
                    inForm: inForm !== "txt" ? "nil" : inForm,
                    outForm: outForm !== "txt" ? "nil" : outForm,
                    value: "\n",
                });
                let expr3 = stringLiteral({
                    inForm: inForm !== "txt" ? "nil" : inForm,
                    outForm: outForm !== "txt" ? "nil" : outForm,
                    value: "\r",
                });
                return function SEL() {
                    if (expr0()) return true;
                    if (expr1()) return true;
                    if (expr2()) return true;
                    if (expr3()) return true;
                    return false;
                }
            })(),
        });
        return 𝕊0_WS_memo();
    }
    let 𝕊0_WS_memo;

    function 𝕊1_min() {
        if (!𝕊1_min_memo) 𝕊1_min_memo = stringLiteral({
            inForm: inForm,
            outForm: outForm,
            value: " ",
        });
        return 𝕊1_min_memo();
    }
    let 𝕊1_min_memo;

    function 𝕊1_max() {
        if (!𝕊1_max_memo) 𝕊1_max_memo = stringLiteral({
            inForm: inForm,
            outForm: outForm,
            value: "￿",
        });
        return 𝕊1_max_memo();
    }
    let 𝕊1_max_memo;

    function 𝕊2_base() {
        if (!𝕊2_base_memo) 𝕊2_base_memo = numericLiteral({inForm, outForm, value: 16});
        return 𝕊2_base_memo();
    }
    let 𝕊2_base_memo;

    function 𝕊2_minDigits() {
        if (!𝕊2_minDigits_memo) 𝕊2_minDigits_memo = numericLiteral({inForm, outForm, value: 4});
        return 𝕊2_minDigits_memo();
    }
    let 𝕊2_minDigits_memo;

    function 𝕊2_maxDigits() {
        if (!𝕊2_maxDigits_memo) 𝕊2_maxDigits_memo = numericLiteral({inForm, outForm, value: 4});
        return 𝕊2_maxDigits_memo();
    }
    let 𝕊2_maxDigits_memo;

    // -------------------- Compile-time constants --------------------
    𝕊0.bindings.DOUBLE_QUOTE.constant = {value: "\""};
    𝕊1.bindings.min.constant = {value: " "};
    𝕊1.bindings.max.constant = {value: "￿"};
    𝕊2.bindings.base.constant = {value: 16};
    𝕊2.bindings.minDigits.constant = {value: 4};
    𝕊2.bindings.maxDigits.constant = {value: 4};

    return 𝕊0.bindings.start;
}

// -------------------- Main exports --------------------
module.exports = createMainExports(createProgram);
