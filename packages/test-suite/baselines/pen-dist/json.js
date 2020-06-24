
"use strict";
function booleanLiteral({ mode, value }) {
    const out = isParse(mode) && hasAbstractForm(mode) ? value : undefined;
    if (isParse(mode)) {
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
function field({ mode, name, value }) {
    if (isParse(mode)) {
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
    else {
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
}
function list({ mode, elements }) {
    const elementsLength = elements.length;
    if (isParse(mode)) {
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
    else {
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
}
function not({ expression }) {
    return function NOT() {
        let stateₒ = getState();
        let result = !expression();
        setState(stateₒ);
        OUT = undefined;
        return result;
    };
}
function nullLiteral({ mode }) {
    const out = isParse(mode) && hasAbstractForm(mode) ? null : undefined;
    if (isParse(mode)) {
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
function numericLiteral({ mode, value }) {
    const out = isParse(mode) && hasAbstractForm(mode) ? value : undefined;
    if (isParse(mode)) {
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
function record({ mode, fields }) {
    if (isParse(mode)) {
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
    else {
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
}
const PARSE = 6;
const PRINT = 7;
const COVAL = 4;
const COGEN = 5;
const ABGEN = 2;
const ABVAL = 3;
const isParse = (mode) => (mode & 1) === 0;
const isPrint = (mode) => (mode & 1) !== 0;
const hasConcreteForm = (mode) => (mode & 4) !== 0;
const hasAbstractForm = (mode) => (mode & 2) !== 0;
const hasInput = (mode) => isParse(mode) ? hasConcreteForm(mode) : hasAbstractForm(mode);
const hasOutput = (mode) => isParse(mode) ? hasAbstractForm(mode) : hasConcreteForm(mode);
function isRule(_x) {
    return true;
}
function isLambda(_x) {
    return true;
}
function isModule(_x) {
    return true;
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
function zeroOrMore({ expression }) {
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
function zeroOrOne({ expression }) {
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
    function char({ mode }) {
        return function CHA_lambda(expr) {
            var _a, _b, _c, _d, _e, _f;
            assert(isModule(expr));
            let min = (_c = (_b = (_a = expr('min')) === null || _a === void 0 ? void 0 : _a.constant) === null || _b === void 0 ? void 0 : _b.value) !== null && _c !== void 0 ? _c : '\u0000';
            let max = (_f = (_e = (_d = expr('max')) === null || _d === void 0 ? void 0 : _d.constant) === null || _e === void 0 ? void 0 : _e.value) !== null && _f !== void 0 ? _f : '\uFFFF';
            assert(typeof min === 'string' && min.length === 1);
            assert(typeof max === 'string' && max.length === 1);
            let checkRange = min !== '\u0000' || max !== '\uFFFF';
            if (!hasInput(mode)) {
                assert(hasOutput(mode));
                return function CHA() { return OUT = min, true; };
            }
            return function CHA() {
                if (isPrint(mode) && typeof IN !== 'string')
                    return false;
                if (IP < 0 || IP >= IN.length)
                    return false;
                let c = IN.charAt(IP);
                if (checkRange && (c < min || c > max))
                    return false;
                IP += 1;
                OUT = hasOutput(mode) ? c : undefined;
                return true;
            };
        };
    }
    // TODO: doc... has both 'txt' and 'ast' representation
    function f64({ mode }) {
        if (!hasInput(mode)) {
            assert(hasOutput(mode));
            const out = isParse(mode) ? 0 : '0';
            return function F64() { return OUT = out, true; };
        }
        if (isParse(mode)) {
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
                OUT = hasOutput(mode) ? num : undefined;
                return true;
            };
        }
        else /* isPrint */ {
            return function F64() {
                // Ensure N is a number.
                if (typeof IN !== 'number' || IP !== 0)
                    return false;
                // Delegate unparsing to the JS runtime.
                // TODO: the conversion may not exactly match the original string. Add this to the lossiness list.
                OUT = hasOutput(mode) ? String(IN) : undefined;
                IP = 1;
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
        return function I32_lambda(expr) {
            var _a, _b, _c, _d, _e, _f;
            assert(isModule(expr));
            let base = (_c = (_b = (_a = expr('base')) === null || _a === void 0 ? void 0 : _a.constant) === null || _b === void 0 ? void 0 : _b.value) !== null && _c !== void 0 ? _c : 10;
            let signed = (_f = (_e = (_d = expr('signed')) === null || _d === void 0 ? void 0 : _d.constant) === null || _e === void 0 ? void 0 : _e.value) !== null && _f !== void 0 ? _f : true;
            assert(typeof base === 'number' && base >= 2 && base <= 36);
            assert(typeof signed === 'boolean');
            if (!hasInput(mode)) {
                assert(hasOutput(mode));
                const out = isParse(mode) ? 0 : '0';
                return function I32() { return OUT = out, true; };
            }
            if (isParse(mode)) {
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
                    OUT = hasOutput(mode) ? num : undefined;
                    return true;
                };
            }
            else /* isPrint */ {
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
                    OUT = hasOutput(mode) ? String.fromCharCode(...digits.reverse()) : undefined;
                    IP = 1;
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
    function memoise({}) {
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

    return ({mode}) => {
        let _char = char({mode});
        let _f64 = f64({mode});
        let _i32 = i32({mode});
        let _memoise = memoise({mode});
        return (name) => {
            switch(name) {
                case 'char': return _char;
                case 'f64': return _f64;
                case 'i32': return _i32;
                case 'memoise': return _memoise;
                default: return undefined;
            }
        };
    };
})();
const createExtension𝕊4 = (() => {
    "use strict";
    /* @pen exports = {
        unicode
    } */
    function unicode({ mode }) {
        return function UNI_lambda(expr) {
            var _a, _b, _c, _d, _e, _f;
            assert(isModule(expr));
            let base = (_b = (_a = expr('base')) === null || _a === void 0 ? void 0 : _a.constant) === null || _b === void 0 ? void 0 : _b.value;
            let minDigits = (_d = (_c = expr('minDigits')) === null || _c === void 0 ? void 0 : _c.constant) === null || _d === void 0 ? void 0 : _d.value;
            let maxDigits = (_f = (_e = expr('maxDigits')) === null || _e === void 0 ? void 0 : _e.constant) === null || _f === void 0 ? void 0 : _f.value;
            assert(typeof base === 'number' && base >= 2 && base <= 36);
            assert(typeof minDigits === 'number' && minDigits >= 1 && minDigits <= 8);
            assert(typeof maxDigits === 'number' && maxDigits >= minDigits && maxDigits <= 8);
            // Construct a regex to match the digits
            let pattern = `[0-${base < 10 ? base - 1 : 9}${base > 10 ? `a-${String.fromCharCode('a'.charCodeAt(0) + base - 11)}` : ''}]`;
            let regex = RegExp(pattern, 'i');
            if (isParse(mode)) {
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
            else /* isPrint */ {
                return function UNI() {
                    // TODO: implement
                    return false;
                };
            }
        };
    }

    return ({mode}) => {
        let _unicode = unicode({mode});
        return (name) => {
            switch(name) {
                case 'unicode': return _unicode;
                default: return undefined;
            }
        };
    };
})();




// --------------------------------------------------------------------------------
const parse = (() => {
    const mode = 6;

    // -------------------- json.pen --------------------

    const 𝕊0 = (name) => {
        switch (name) {
            case 'char': return 𝕊0_char;
            case 'f64': return 𝕊0_f64;
            case 'unicode': return 𝕊0_unicode;
            case 'start': return 𝕊0_start;
            case 'Value': return 𝕊0_Value;
            case 'False': return 𝕊0_False;
            case 'Null': return 𝕊0_Null;
            case 'True': return 𝕊0_True;
            case 'Object': return 𝕊0_Object;
            case 'Property': return 𝕊0_Property;
            case 'Array': return 𝕊0_Array;
            case 'Element': return 𝕊0_Element;
            case 'Number': return 𝕊0_Number;
            case 'String': return 𝕊0_String;
            case 'CHAR': return 𝕊0_CHAR;
            case 'LBRACE': return 𝕊0_LBRACE;
            case 'RBRACE': return 𝕊0_RBRACE;
            case 'LBRACKET': return 𝕊0_LBRACKET;
            case 'RBRACKET': return 𝕊0_RBRACKET;
            case 'COLON': return 𝕊0_COLON;
            case 'COMMA': return 𝕊0_COMMA;
            case 'DOUBLE_QUOTE': return 𝕊0_DOUBLE_QUOTE;
            case 'WS': return 𝕊0_WS;
            default: return undefined;
        }
    };

    const 𝕊0_char = (arg) => 𝕊3('char')(arg);

    const 𝕊0_f64 = (arg) => 𝕊3('f64')(arg);

    const 𝕊0_unicode = (arg) => 𝕊4('unicode')(arg);

    const 𝕊0_start = (arg) => {
        if (!𝕊0_start_memo) 𝕊0_start_memo = (() => {
            const t318 = 𝕊0('WS');
            const t319 = 𝕊0('Value');
            const t320 = 𝕊0('WS');
            return function SEQ() {
                let stateₒ = getState();
                let out;
                if (t318()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t319()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t320()) out = concat(out, OUT); else return setState(stateₒ), false;
                OUT = out;
                return true;
            }
        })();
        return 𝕊0_start_memo(arg);
    };
    let 𝕊0_start_memo;

    const 𝕊0_Value = (arg) => {
        if (!𝕊0_Value_memo) 𝕊0_Value_memo = (() => {
            const t321 = 𝕊0('False');
            const t322 = 𝕊0('Null');
            const t323 = 𝕊0('True');
            const t324 = 𝕊0('Object');
            const t325 = 𝕊0('Array');
            const t326 = 𝕊0('Number');
            const t327 = 𝕊0('String');
            return function SEL() {
                if (t321()) return true;
                if (t322()) return true;
                if (t323()) return true;
                if (t324()) return true;
                if (t325()) return true;
                if (t326()) return true;
                if (t327()) return true;
                return false;
            }
        })();
        return 𝕊0_Value_memo(arg);
    };
    let 𝕊0_Value_memo;

    const 𝕊0_False = (arg) => {
        if (!𝕊0_False_memo) 𝕊0_False_memo = (() => {
            const t328 = (() => {
                const mode330 = mode & ~2;
                const out = hasOutput(mode330) ? "false" : undefined;
                if (!hasInput(mode330)) return function STR() { OUT = out; return true; }
                return function STR() {
                    if (isPrint(mode330) && typeof IN !== 'string') return false;
                    if (IP + 5 > IN.length) return false;
                    if (IN.charCodeAt(IP + 0) !== 102) return false;
                    if (IN.charCodeAt(IP + 1) !== 97) return false;
                    if (IN.charCodeAt(IP + 2) !== 108) return false;
                    if (IN.charCodeAt(IP + 3) !== 115) return false;
                    if (IN.charCodeAt(IP + 4) !== 101) return false;
                    IP += 5;
                    OUT = out;
                    return true;
                }
            })();
            const t329 = booleanLiteral({mode, value: false});
            return function SEQ() {
                let stateₒ = getState();
                let out;
                if (t328()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t329()) out = concat(out, OUT); else return setState(stateₒ), false;
                OUT = out;
                return true;
            }
        })();
        return 𝕊0_False_memo(arg);
    };
    let 𝕊0_False_memo;

    const 𝕊0_Null = (arg) => {
        if (!𝕊0_Null_memo) 𝕊0_Null_memo = (() => {
            const t331 = (() => {
                const mode333 = mode & ~2;
                const out = hasOutput(mode333) ? "null" : undefined;
                if (!hasInput(mode333)) return function STR() { OUT = out; return true; }
                return function STR() {
                    if (isPrint(mode333) && typeof IN !== 'string') return false;
                    if (IP + 4 > IN.length) return false;
                    if (IN.charCodeAt(IP + 0) !== 110) return false;
                    if (IN.charCodeAt(IP + 1) !== 117) return false;
                    if (IN.charCodeAt(IP + 2) !== 108) return false;
                    if (IN.charCodeAt(IP + 3) !== 108) return false;
                    IP += 4;
                    OUT = out;
                    return true;
                }
            })();
            const t332 = nullLiteral({mode});
            return function SEQ() {
                let stateₒ = getState();
                let out;
                if (t331()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t332()) out = concat(out, OUT); else return setState(stateₒ), false;
                OUT = out;
                return true;
            }
        })();
        return 𝕊0_Null_memo(arg);
    };
    let 𝕊0_Null_memo;

    const 𝕊0_True = (arg) => {
        if (!𝕊0_True_memo) 𝕊0_True_memo = (() => {
            const t334 = (() => {
                const mode336 = mode & ~2;
                const out = hasOutput(mode336) ? "true" : undefined;
                if (!hasInput(mode336)) return function STR() { OUT = out; return true; }
                return function STR() {
                    if (isPrint(mode336) && typeof IN !== 'string') return false;
                    if (IP + 4 > IN.length) return false;
                    if (IN.charCodeAt(IP + 0) !== 116) return false;
                    if (IN.charCodeAt(IP + 1) !== 114) return false;
                    if (IN.charCodeAt(IP + 2) !== 117) return false;
                    if (IN.charCodeAt(IP + 3) !== 101) return false;
                    IP += 4;
                    OUT = out;
                    return true;
                }
            })();
            const t335 = booleanLiteral({mode, value: true});
            return function SEQ() {
                let stateₒ = getState();
                let out;
                if (t334()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t335()) out = concat(out, OUT); else return setState(stateₒ), false;
                OUT = out;
                return true;
            }
        })();
        return 𝕊0_True_memo(arg);
    };
    let 𝕊0_True_memo;

    const 𝕊0_Object = (arg) => {
        if (!𝕊0_Object_memo) 𝕊0_Object_memo = (() => {
            const t337 = 𝕊0('LBRACE');
            const t338 = (() => {
                const t340 = (() => {
                    const t342 = 𝕊0('Property');
                    const t343 = zeroOrMore({
                        mode,
                        expression: (() => {
                            const t344 = 𝕊0('COMMA');
                            const t345 = 𝕊0('Property');
                            return function SEQ() {
                                let stateₒ = getState();
                                let out;
                                if (t344()) out = concat(out, OUT); else return setState(stateₒ), false;
                                if (t345()) out = concat(out, OUT); else return setState(stateₒ), false;
                                OUT = out;
                                return true;
                            }
                        })(),
                    });
                    return function SEQ() {
                        let stateₒ = getState();
                        let out;
                        if (t342()) out = concat(out, OUT); else return setState(stateₒ), false;
                        if (t343()) out = concat(out, OUT); else return setState(stateₒ), false;
                        OUT = out;
                        return true;
                    }
                })();
                const t341 = record({
                    mode,
                    fields: [],
                });
                return function SEL() {
                    if (t340()) return true;
                    if (t341()) return true;
                    return false;
                }
            })();
            const t339 = 𝕊0('RBRACE');
            return function SEQ() {
                let stateₒ = getState();
                let out;
                if (t337()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t338()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t339()) out = concat(out, OUT); else return setState(stateₒ), false;
                OUT = out;
                return true;
            }
        })();
        return 𝕊0_Object_memo(arg);
    };
    let 𝕊0_Object_memo;

    const 𝕊0_Property = (arg) => {
        if (!𝕊0_Property_memo) 𝕊0_Property_memo = field({
            mode,
            name: 𝕊0('String'),
            value: (() => {
                const t346 = 𝕊0('COLON');
                const t347 = 𝕊0('Value');
                return function SEQ() {
                    let stateₒ = getState();
                    let out;
                    if (t346()) out = concat(out, OUT); else return setState(stateₒ), false;
                    if (t347()) out = concat(out, OUT); else return setState(stateₒ), false;
                    OUT = out;
                    return true;
                }
            })(),
        });
        return 𝕊0_Property_memo(arg);
    };
    let 𝕊0_Property_memo;

    const 𝕊0_Array = (arg) => {
        if (!𝕊0_Array_memo) 𝕊0_Array_memo = (() => {
            const t348 = 𝕊0('LBRACKET');
            const t349 = (() => {
                const t351 = (() => {
                    const t353 = 𝕊0('Element');
                    const t354 = zeroOrMore({
                        mode,
                        expression: (() => {
                            const t355 = 𝕊0('COMMA');
                            const t356 = 𝕊0('Element');
                            return function SEQ() {
                                let stateₒ = getState();
                                let out;
                                if (t355()) out = concat(out, OUT); else return setState(stateₒ), false;
                                if (t356()) out = concat(out, OUT); else return setState(stateₒ), false;
                                OUT = out;
                                return true;
                            }
                        })(),
                    });
                    return function SEQ() {
                        let stateₒ = getState();
                        let out;
                        if (t353()) out = concat(out, OUT); else return setState(stateₒ), false;
                        if (t354()) out = concat(out, OUT); else return setState(stateₒ), false;
                        OUT = out;
                        return true;
                    }
                })();
                const t352 = list({
                    mode,
                    elements: [],
                });
                return function SEL() {
                    if (t351()) return true;
                    if (t352()) return true;
                    return false;
                }
            })();
            const t350 = 𝕊0('RBRACKET');
            return function SEQ() {
                let stateₒ = getState();
                let out;
                if (t348()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t349()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t350()) out = concat(out, OUT); else return setState(stateₒ), false;
                OUT = out;
                return true;
            }
        })();
        return 𝕊0_Array_memo(arg);
    };
    let 𝕊0_Array_memo;

    const 𝕊0_Element = (arg) => {
        if (!𝕊0_Element_memo) 𝕊0_Element_memo = list({
            mode,
            elements: [
                𝕊0('Value'),
            ],
        });
        return 𝕊0_Element_memo(arg);
    };
    let 𝕊0_Element_memo;

    const 𝕊0_Number = (arg) => {
        if (!𝕊0_Number_memo) 𝕊0_Number_memo = 𝕊0('f64');
        return 𝕊0_Number_memo(arg);
    };
    let 𝕊0_Number_memo;

    const 𝕊0_String = (arg) => {
        if (!𝕊0_String_memo) 𝕊0_String_memo = (() => {
            const t357 = 𝕊0('DOUBLE_QUOTE');
            const t358 = zeroOrMore({
                mode,
                expression: 𝕊0('CHAR'),
            });
            const t359 = 𝕊0('DOUBLE_QUOTE');
            return function SEQ() {
                let stateₒ = getState();
                let out;
                if (t357()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t358()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t359()) out = concat(out, OUT); else return setState(stateₒ), false;
                OUT = out;
                return true;
            }
        })();
        return 𝕊0_String_memo(arg);
    };
    let 𝕊0_String_memo;

    const 𝕊0_CHAR = (arg) => {
        if (!𝕊0_CHAR_memo) 𝕊0_CHAR_memo = (() => {
            const t360 = (() => {
                const t370 = not({
                    mode,
                    expression: (() => {
                        const mode373 = mode & ~0;
                        const out = hasOutput(mode373) ? "\\" : undefined;
                        if (!hasInput(mode373)) return function STR() { OUT = out; return true; }
                        return function STR() {
                            if (isPrint(mode373) && typeof IN !== 'string') return false;
                            if (IP + 1 > IN.length) return false;
                            if (IN.charCodeAt(IP + 0) !== 92) return false;
                            IP += 1;
                            OUT = out;
                            return true;
                        }
                    })(),
                });
                const t371 = not({
                    mode,
                    expression: (() => {
                        const mode374 = mode & ~0;
                        const out = hasOutput(mode374) ? "\"" : undefined;
                        if (!hasInput(mode374)) return function STR() { OUT = out; return true; }
                        return function STR() {
                            if (isPrint(mode374) && typeof IN !== 'string') return false;
                            if (IP + 1 > IN.length) return false;
                            if (IN.charCodeAt(IP + 0) !== 34) return false;
                            IP += 1;
                            OUT = out;
                            return true;
                        }
                    })(),
                });
                const t372 = (𝕊0('char'))(𝕊1);
                return function SEQ() {
                    let stateₒ = getState();
                    let out;
                    if (t370()) out = concat(out, OUT); else return setState(stateₒ), false;
                    if (t371()) out = concat(out, OUT); else return setState(stateₒ), false;
                    if (t372()) out = concat(out, OUT); else return setState(stateₒ), false;
                    OUT = out;
                    return true;
                }
            })();
            const t361 = (() => {
                const t375 = (() => {
                    const mode377 = mode & ~2;
                    const out = hasOutput(mode377) ? "\\\"" : undefined;
                    if (!hasInput(mode377)) return function STR() { OUT = out; return true; }
                    return function STR() {
                        if (isPrint(mode377) && typeof IN !== 'string') return false;
                        if (IP + 2 > IN.length) return false;
                        if (IN.charCodeAt(IP + 0) !== 92) return false;
                        if (IN.charCodeAt(IP + 1) !== 34) return false;
                        IP += 2;
                        OUT = out;
                        return true;
                    }
                })();
                const t376 = (() => {
                    const mode378 = mode & ~4;
                    const out = hasOutput(mode378) ? "\"" : undefined;
                    if (!hasInput(mode378)) return function STR() { OUT = out; return true; }
                    return function STR() {
                        if (isPrint(mode378) && typeof IN !== 'string') return false;
                        if (IP + 1 > IN.length) return false;
                        if (IN.charCodeAt(IP + 0) !== 34) return false;
                        IP += 1;
                        OUT = out;
                        return true;
                    }
                })();
                return function SEQ() {
                    let stateₒ = getState();
                    let out;
                    if (t375()) out = concat(out, OUT); else return setState(stateₒ), false;
                    if (t376()) out = concat(out, OUT); else return setState(stateₒ), false;
                    OUT = out;
                    return true;
                }
            })();
            const t362 = (() => {
                const t379 = (() => {
                    const mode381 = mode & ~2;
                    const out = hasOutput(mode381) ? "\\\\" : undefined;
                    if (!hasInput(mode381)) return function STR() { OUT = out; return true; }
                    return function STR() {
                        if (isPrint(mode381) && typeof IN !== 'string') return false;
                        if (IP + 2 > IN.length) return false;
                        if (IN.charCodeAt(IP + 0) !== 92) return false;
                        if (IN.charCodeAt(IP + 1) !== 92) return false;
                        IP += 2;
                        OUT = out;
                        return true;
                    }
                })();
                const t380 = (() => {
                    const mode382 = mode & ~4;
                    const out = hasOutput(mode382) ? "\\" : undefined;
                    if (!hasInput(mode382)) return function STR() { OUT = out; return true; }
                    return function STR() {
                        if (isPrint(mode382) && typeof IN !== 'string') return false;
                        if (IP + 1 > IN.length) return false;
                        if (IN.charCodeAt(IP + 0) !== 92) return false;
                        IP += 1;
                        OUT = out;
                        return true;
                    }
                })();
                return function SEQ() {
                    let stateₒ = getState();
                    let out;
                    if (t379()) out = concat(out, OUT); else return setState(stateₒ), false;
                    if (t380()) out = concat(out, OUT); else return setState(stateₒ), false;
                    OUT = out;
                    return true;
                }
            })();
            const t363 = (() => {
                const t383 = (() => {
                    const mode385 = mode & ~2;
                    const out = hasOutput(mode385) ? "\\/" : undefined;
                    if (!hasInput(mode385)) return function STR() { OUT = out; return true; }
                    return function STR() {
                        if (isPrint(mode385) && typeof IN !== 'string') return false;
                        if (IP + 2 > IN.length) return false;
                        if (IN.charCodeAt(IP + 0) !== 92) return false;
                        if (IN.charCodeAt(IP + 1) !== 47) return false;
                        IP += 2;
                        OUT = out;
                        return true;
                    }
                })();
                const t384 = (() => {
                    const mode386 = mode & ~4;
                    const out = hasOutput(mode386) ? "/" : undefined;
                    if (!hasInput(mode386)) return function STR() { OUT = out; return true; }
                    return function STR() {
                        if (isPrint(mode386) && typeof IN !== 'string') return false;
                        if (IP + 1 > IN.length) return false;
                        if (IN.charCodeAt(IP + 0) !== 47) return false;
                        IP += 1;
                        OUT = out;
                        return true;
                    }
                })();
                return function SEQ() {
                    let stateₒ = getState();
                    let out;
                    if (t383()) out = concat(out, OUT); else return setState(stateₒ), false;
                    if (t384()) out = concat(out, OUT); else return setState(stateₒ), false;
                    OUT = out;
                    return true;
                }
            })();
            const t364 = (() => {
                const t387 = (() => {
                    const mode389 = mode & ~2;
                    const out = hasOutput(mode389) ? "\\b" : undefined;
                    if (!hasInput(mode389)) return function STR() { OUT = out; return true; }
                    return function STR() {
                        if (isPrint(mode389) && typeof IN !== 'string') return false;
                        if (IP + 2 > IN.length) return false;
                        if (IN.charCodeAt(IP + 0) !== 92) return false;
                        if (IN.charCodeAt(IP + 1) !== 98) return false;
                        IP += 2;
                        OUT = out;
                        return true;
                    }
                })();
                const t388 = (() => {
                    const mode390 = mode & ~4;
                    const out = hasOutput(mode390) ? "\b" : undefined;
                    if (!hasInput(mode390)) return function STR() { OUT = out; return true; }
                    return function STR() {
                        if (isPrint(mode390) && typeof IN !== 'string') return false;
                        if (IP + 1 > IN.length) return false;
                        if (IN.charCodeAt(IP + 0) !== 8) return false;
                        IP += 1;
                        OUT = out;
                        return true;
                    }
                })();
                return function SEQ() {
                    let stateₒ = getState();
                    let out;
                    if (t387()) out = concat(out, OUT); else return setState(stateₒ), false;
                    if (t388()) out = concat(out, OUT); else return setState(stateₒ), false;
                    OUT = out;
                    return true;
                }
            })();
            const t365 = (() => {
                const t391 = (() => {
                    const mode393 = mode & ~2;
                    const out = hasOutput(mode393) ? "\\f" : undefined;
                    if (!hasInput(mode393)) return function STR() { OUT = out; return true; }
                    return function STR() {
                        if (isPrint(mode393) && typeof IN !== 'string') return false;
                        if (IP + 2 > IN.length) return false;
                        if (IN.charCodeAt(IP + 0) !== 92) return false;
                        if (IN.charCodeAt(IP + 1) !== 102) return false;
                        IP += 2;
                        OUT = out;
                        return true;
                    }
                })();
                const t392 = (() => {
                    const mode394 = mode & ~4;
                    const out = hasOutput(mode394) ? "\f" : undefined;
                    if (!hasInput(mode394)) return function STR() { OUT = out; return true; }
                    return function STR() {
                        if (isPrint(mode394) && typeof IN !== 'string') return false;
                        if (IP + 1 > IN.length) return false;
                        if (IN.charCodeAt(IP + 0) !== 12) return false;
                        IP += 1;
                        OUT = out;
                        return true;
                    }
                })();
                return function SEQ() {
                    let stateₒ = getState();
                    let out;
                    if (t391()) out = concat(out, OUT); else return setState(stateₒ), false;
                    if (t392()) out = concat(out, OUT); else return setState(stateₒ), false;
                    OUT = out;
                    return true;
                }
            })();
            const t366 = (() => {
                const t395 = (() => {
                    const mode397 = mode & ~2;
                    const out = hasOutput(mode397) ? "\\n" : undefined;
                    if (!hasInput(mode397)) return function STR() { OUT = out; return true; }
                    return function STR() {
                        if (isPrint(mode397) && typeof IN !== 'string') return false;
                        if (IP + 2 > IN.length) return false;
                        if (IN.charCodeAt(IP + 0) !== 92) return false;
                        if (IN.charCodeAt(IP + 1) !== 110) return false;
                        IP += 2;
                        OUT = out;
                        return true;
                    }
                })();
                const t396 = (() => {
                    const mode398 = mode & ~4;
                    const out = hasOutput(mode398) ? "\n" : undefined;
                    if (!hasInput(mode398)) return function STR() { OUT = out; return true; }
                    return function STR() {
                        if (isPrint(mode398) && typeof IN !== 'string') return false;
                        if (IP + 1 > IN.length) return false;
                        if (IN.charCodeAt(IP + 0) !== 10) return false;
                        IP += 1;
                        OUT = out;
                        return true;
                    }
                })();
                return function SEQ() {
                    let stateₒ = getState();
                    let out;
                    if (t395()) out = concat(out, OUT); else return setState(stateₒ), false;
                    if (t396()) out = concat(out, OUT); else return setState(stateₒ), false;
                    OUT = out;
                    return true;
                }
            })();
            const t367 = (() => {
                const t399 = (() => {
                    const mode401 = mode & ~2;
                    const out = hasOutput(mode401) ? "\\r" : undefined;
                    if (!hasInput(mode401)) return function STR() { OUT = out; return true; }
                    return function STR() {
                        if (isPrint(mode401) && typeof IN !== 'string') return false;
                        if (IP + 2 > IN.length) return false;
                        if (IN.charCodeAt(IP + 0) !== 92) return false;
                        if (IN.charCodeAt(IP + 1) !== 114) return false;
                        IP += 2;
                        OUT = out;
                        return true;
                    }
                })();
                const t400 = (() => {
                    const mode402 = mode & ~4;
                    const out = hasOutput(mode402) ? "\r" : undefined;
                    if (!hasInput(mode402)) return function STR() { OUT = out; return true; }
                    return function STR() {
                        if (isPrint(mode402) && typeof IN !== 'string') return false;
                        if (IP + 1 > IN.length) return false;
                        if (IN.charCodeAt(IP + 0) !== 13) return false;
                        IP += 1;
                        OUT = out;
                        return true;
                    }
                })();
                return function SEQ() {
                    let stateₒ = getState();
                    let out;
                    if (t399()) out = concat(out, OUT); else return setState(stateₒ), false;
                    if (t400()) out = concat(out, OUT); else return setState(stateₒ), false;
                    OUT = out;
                    return true;
                }
            })();
            const t368 = (() => {
                const t403 = (() => {
                    const mode405 = mode & ~2;
                    const out = hasOutput(mode405) ? "\\t" : undefined;
                    if (!hasInput(mode405)) return function STR() { OUT = out; return true; }
                    return function STR() {
                        if (isPrint(mode405) && typeof IN !== 'string') return false;
                        if (IP + 2 > IN.length) return false;
                        if (IN.charCodeAt(IP + 0) !== 92) return false;
                        if (IN.charCodeAt(IP + 1) !== 116) return false;
                        IP += 2;
                        OUT = out;
                        return true;
                    }
                })();
                const t404 = (() => {
                    const mode406 = mode & ~4;
                    const out = hasOutput(mode406) ? "\t" : undefined;
                    if (!hasInput(mode406)) return function STR() { OUT = out; return true; }
                    return function STR() {
                        if (isPrint(mode406) && typeof IN !== 'string') return false;
                        if (IP + 1 > IN.length) return false;
                        if (IN.charCodeAt(IP + 0) !== 9) return false;
                        IP += 1;
                        OUT = out;
                        return true;
                    }
                })();
                return function SEQ() {
                    let stateₒ = getState();
                    let out;
                    if (t403()) out = concat(out, OUT); else return setState(stateₒ), false;
                    if (t404()) out = concat(out, OUT); else return setState(stateₒ), false;
                    OUT = out;
                    return true;
                }
            })();
            const t369 = (() => {
                const t407 = (() => {
                    const mode409 = mode & ~2;
                    const out = hasOutput(mode409) ? "\\u" : undefined;
                    if (!hasInput(mode409)) return function STR() { OUT = out; return true; }
                    return function STR() {
                        if (isPrint(mode409) && typeof IN !== 'string') return false;
                        if (IP + 2 > IN.length) return false;
                        if (IN.charCodeAt(IP + 0) !== 92) return false;
                        if (IN.charCodeAt(IP + 1) !== 117) return false;
                        IP += 2;
                        OUT = out;
                        return true;
                    }
                })();
                const t408 = (𝕊0('unicode'))(𝕊2);
                return function SEQ() {
                    let stateₒ = getState();
                    let out;
                    if (t407()) out = concat(out, OUT); else return setState(stateₒ), false;
                    if (t408()) out = concat(out, OUT); else return setState(stateₒ), false;
                    OUT = out;
                    return true;
                }
            })();
            return function SEL() {
                if (t360()) return true;
                if (t361()) return true;
                if (t362()) return true;
                if (t363()) return true;
                if (t364()) return true;
                if (t365()) return true;
                if (t366()) return true;
                if (t367()) return true;
                if (t368()) return true;
                if (t369()) return true;
                return false;
            }
        })();
        return 𝕊0_CHAR_memo(arg);
    };
    let 𝕊0_CHAR_memo;

    const 𝕊0_LBRACE = (arg) => {
        if (!𝕊0_LBRACE_memo) 𝕊0_LBRACE_memo = (() => {
            const t410 = 𝕊0('WS');
            const t411 = (() => {
                const mode413 = mode & ~2;
                const out = hasOutput(mode413) ? "{" : undefined;
                if (!hasInput(mode413)) return function STR() { OUT = out; return true; }
                return function STR() {
                    if (isPrint(mode413) && typeof IN !== 'string') return false;
                    if (IP + 1 > IN.length) return false;
                    if (IN.charCodeAt(IP + 0) !== 123) return false;
                    IP += 1;
                    OUT = out;
                    return true;
                }
            })();
            const t412 = 𝕊0('WS');
            return function SEQ() {
                let stateₒ = getState();
                let out;
                if (t410()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t411()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t412()) out = concat(out, OUT); else return setState(stateₒ), false;
                OUT = out;
                return true;
            }
        })();
        return 𝕊0_LBRACE_memo(arg);
    };
    let 𝕊0_LBRACE_memo;

    const 𝕊0_RBRACE = (arg) => {
        if (!𝕊0_RBRACE_memo) 𝕊0_RBRACE_memo = (() => {
            const t414 = 𝕊0('WS');
            const t415 = (() => {
                const mode417 = mode & ~2;
                const out = hasOutput(mode417) ? "}" : undefined;
                if (!hasInput(mode417)) return function STR() { OUT = out; return true; }
                return function STR() {
                    if (isPrint(mode417) && typeof IN !== 'string') return false;
                    if (IP + 1 > IN.length) return false;
                    if (IN.charCodeAt(IP + 0) !== 125) return false;
                    IP += 1;
                    OUT = out;
                    return true;
                }
            })();
            const t416 = 𝕊0('WS');
            return function SEQ() {
                let stateₒ = getState();
                let out;
                if (t414()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t415()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t416()) out = concat(out, OUT); else return setState(stateₒ), false;
                OUT = out;
                return true;
            }
        })();
        return 𝕊0_RBRACE_memo(arg);
    };
    let 𝕊0_RBRACE_memo;

    const 𝕊0_LBRACKET = (arg) => {
        if (!𝕊0_LBRACKET_memo) 𝕊0_LBRACKET_memo = (() => {
            const t418 = 𝕊0('WS');
            const t419 = (() => {
                const mode421 = mode & ~2;
                const out = hasOutput(mode421) ? "[" : undefined;
                if (!hasInput(mode421)) return function STR() { OUT = out; return true; }
                return function STR() {
                    if (isPrint(mode421) && typeof IN !== 'string') return false;
                    if (IP + 1 > IN.length) return false;
                    if (IN.charCodeAt(IP + 0) !== 91) return false;
                    IP += 1;
                    OUT = out;
                    return true;
                }
            })();
            const t420 = 𝕊0('WS');
            return function SEQ() {
                let stateₒ = getState();
                let out;
                if (t418()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t419()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t420()) out = concat(out, OUT); else return setState(stateₒ), false;
                OUT = out;
                return true;
            }
        })();
        return 𝕊0_LBRACKET_memo(arg);
    };
    let 𝕊0_LBRACKET_memo;

    const 𝕊0_RBRACKET = (arg) => {
        if (!𝕊0_RBRACKET_memo) 𝕊0_RBRACKET_memo = (() => {
            const t422 = 𝕊0('WS');
            const t423 = (() => {
                const mode425 = mode & ~2;
                const out = hasOutput(mode425) ? "]" : undefined;
                if (!hasInput(mode425)) return function STR() { OUT = out; return true; }
                return function STR() {
                    if (isPrint(mode425) && typeof IN !== 'string') return false;
                    if (IP + 1 > IN.length) return false;
                    if (IN.charCodeAt(IP + 0) !== 93) return false;
                    IP += 1;
                    OUT = out;
                    return true;
                }
            })();
            const t424 = 𝕊0('WS');
            return function SEQ() {
                let stateₒ = getState();
                let out;
                if (t422()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t423()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t424()) out = concat(out, OUT); else return setState(stateₒ), false;
                OUT = out;
                return true;
            }
        })();
        return 𝕊0_RBRACKET_memo(arg);
    };
    let 𝕊0_RBRACKET_memo;

    const 𝕊0_COLON = (arg) => {
        if (!𝕊0_COLON_memo) 𝕊0_COLON_memo = (() => {
            const t426 = 𝕊0('WS');
            const t427 = (() => {
                const mode429 = mode & ~2;
                const out = hasOutput(mode429) ? ":" : undefined;
                if (!hasInput(mode429)) return function STR() { OUT = out; return true; }
                return function STR() {
                    if (isPrint(mode429) && typeof IN !== 'string') return false;
                    if (IP + 1 > IN.length) return false;
                    if (IN.charCodeAt(IP + 0) !== 58) return false;
                    IP += 1;
                    OUT = out;
                    return true;
                }
            })();
            const t428 = 𝕊0('WS');
            return function SEQ() {
                let stateₒ = getState();
                let out;
                if (t426()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t427()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t428()) out = concat(out, OUT); else return setState(stateₒ), false;
                OUT = out;
                return true;
            }
        })();
        return 𝕊0_COLON_memo(arg);
    };
    let 𝕊0_COLON_memo;

    const 𝕊0_COMMA = (arg) => {
        if (!𝕊0_COMMA_memo) 𝕊0_COMMA_memo = (() => {
            const t430 = 𝕊0('WS');
            const t431 = (() => {
                const mode433 = mode & ~2;
                const out = hasOutput(mode433) ? "," : undefined;
                if (!hasInput(mode433)) return function STR() { OUT = out; return true; }
                return function STR() {
                    if (isPrint(mode433) && typeof IN !== 'string') return false;
                    if (IP + 1 > IN.length) return false;
                    if (IN.charCodeAt(IP + 0) !== 44) return false;
                    IP += 1;
                    OUT = out;
                    return true;
                }
            })();
            const t432 = 𝕊0('WS');
            return function SEQ() {
                let stateₒ = getState();
                let out;
                if (t430()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t431()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t432()) out = concat(out, OUT); else return setState(stateₒ), false;
                OUT = out;
                return true;
            }
        })();
        return 𝕊0_COMMA_memo(arg);
    };
    let 𝕊0_COMMA_memo;

    const 𝕊0_DOUBLE_QUOTE = (arg) => {
        if (!𝕊0_DOUBLE_QUOTE_memo) 𝕊0_DOUBLE_QUOTE_memo = (() => {
            const mode434 = mode & ~2;
            const out = hasOutput(mode434) ? "\"" : undefined;
            if (!hasInput(mode434)) return function STR() { OUT = out; return true; }
            return function STR() {
                if (isPrint(mode434) && typeof IN !== 'string') return false;
                if (IP + 1 > IN.length) return false;
                if (IN.charCodeAt(IP + 0) !== 34) return false;
                IP += 1;
                OUT = out;
                return true;
            }
        })();
        return 𝕊0_DOUBLE_QUOTE_memo(arg);
    };
    let 𝕊0_DOUBLE_QUOTE_memo;

    const 𝕊0_WS = (arg) => {
        if (!𝕊0_WS_memo) 𝕊0_WS_memo = zeroOrMore({
            mode,
            expression: (() => {
                const t435 = (() => {
                    const mode439 = mode & ~2;
                    const out = hasOutput(mode439) ? " " : undefined;
                    if (!hasInput(mode439)) return function STR() { OUT = out; return true; }
                    return function STR() {
                        if (isPrint(mode439) && typeof IN !== 'string') return false;
                        if (IP + 1 > IN.length) return false;
                        if (IN.charCodeAt(IP + 0) !== 32) return false;
                        IP += 1;
                        OUT = out;
                        return true;
                    }
                })();
                const t436 = (() => {
                    const mode440 = mode & ~2;
                    const out = hasOutput(mode440) ? "\t" : undefined;
                    if (!hasInput(mode440)) return function STR() { OUT = out; return true; }
                    return function STR() {
                        if (isPrint(mode440) && typeof IN !== 'string') return false;
                        if (IP + 1 > IN.length) return false;
                        if (IN.charCodeAt(IP + 0) !== 9) return false;
                        IP += 1;
                        OUT = out;
                        return true;
                    }
                })();
                const t437 = (() => {
                    const mode441 = mode & ~2;
                    const out = hasOutput(mode441) ? "\n" : undefined;
                    if (!hasInput(mode441)) return function STR() { OUT = out; return true; }
                    return function STR() {
                        if (isPrint(mode441) && typeof IN !== 'string') return false;
                        if (IP + 1 > IN.length) return false;
                        if (IN.charCodeAt(IP + 0) !== 10) return false;
                        IP += 1;
                        OUT = out;
                        return true;
                    }
                })();
                const t438 = (() => {
                    const mode442 = mode & ~2;
                    const out = hasOutput(mode442) ? "\r" : undefined;
                    if (!hasInput(mode442)) return function STR() { OUT = out; return true; }
                    return function STR() {
                        if (isPrint(mode442) && typeof IN !== 'string') return false;
                        if (IP + 1 > IN.length) return false;
                        if (IN.charCodeAt(IP + 0) !== 13) return false;
                        IP += 1;
                        OUT = out;
                        return true;
                    }
                })();
                return function SEL() {
                    if (t435()) return true;
                    if (t436()) return true;
                    if (t437()) return true;
                    if (t438()) return true;
                    return false;
                }
            })(),
        });
        return 𝕊0_WS_memo(arg);
    };
    let 𝕊0_WS_memo;

    const 𝕊1 = (name) => {
        switch (name) {
            case 'min': return 𝕊1_min;
            case 'max': return 𝕊1_max;
            default: return undefined;
        }
    };

    const 𝕊1_min = (arg) => {
        if (!𝕊1_min_memo) 𝕊1_min_memo = (() => {
            const mode443 = mode & ~0;
            const out = hasOutput(mode443) ? " " : undefined;
            if (!hasInput(mode443)) return function STR() { OUT = out; return true; }
            return function STR() {
                if (isPrint(mode443) && typeof IN !== 'string') return false;
                if (IP + 1 > IN.length) return false;
                if (IN.charCodeAt(IP + 0) !== 32) return false;
                IP += 1;
                OUT = out;
                return true;
            }
        })();
        return 𝕊1_min_memo(arg);
    };
    let 𝕊1_min_memo;

    const 𝕊1_max = (arg) => {
        if (!𝕊1_max_memo) 𝕊1_max_memo = (() => {
            const mode444 = mode & ~0;
            const out = hasOutput(mode444) ? "￿" : undefined;
            if (!hasInput(mode444)) return function STR() { OUT = out; return true; }
            return function STR() {
                if (isPrint(mode444) && typeof IN !== 'string') return false;
                if (IP + 1 > IN.length) return false;
                if (IN.charCodeAt(IP + 0) !== 65535) return false;
                IP += 1;
                OUT = out;
                return true;
            }
        })();
        return 𝕊1_max_memo(arg);
    };
    let 𝕊1_max_memo;

    const 𝕊2 = (name) => {
        switch (name) {
            case 'base': return 𝕊2_base;
            case 'minDigits': return 𝕊2_minDigits;
            case 'maxDigits': return 𝕊2_maxDigits;
            default: return undefined;
        }
    };

    const 𝕊2_base = (arg) => {
        if (!𝕊2_base_memo) 𝕊2_base_memo = numericLiteral({mode, value: 16});
        return 𝕊2_base_memo(arg);
    };
    let 𝕊2_base_memo;

    const 𝕊2_minDigits = (arg) => {
        if (!𝕊2_minDigits_memo) 𝕊2_minDigits_memo = numericLiteral({mode, value: 4});
        return 𝕊2_minDigits_memo(arg);
    };
    let 𝕊2_minDigits_memo;

    const 𝕊2_maxDigits = (arg) => {
        if (!𝕊2_maxDigits_memo) 𝕊2_maxDigits_memo = numericLiteral({mode, value: 4});
        return 𝕊2_maxDigits_memo(arg);
    };
    let 𝕊2_maxDigits_memo;

    const 𝕊3 = createExtension𝕊3({mode});

    const 𝕊4 = createExtension𝕊4({mode});

    // -------------------- Compile-time constants --------------------
    𝕊0('DOUBLE_QUOTE').constant = {value: "\""};
    𝕊1('min').constant = {value: " "};
    𝕊1('max').constant = {value: "￿"};
    𝕊2('base').constant = {value: 16};
    𝕊2('minDigits').constant = {value: 4};
    𝕊2('maxDigits').constant = {value: 4};

    return 𝕊0('start');
})();




// --------------------------------------------------------------------------------
const print = (() => {
    const mode = 7;

    // -------------------- json.pen --------------------

    const 𝕊0 = (name) => {
        switch (name) {
            case 'char': return 𝕊0_char;
            case 'f64': return 𝕊0_f64;
            case 'unicode': return 𝕊0_unicode;
            case 'start': return 𝕊0_start;
            case 'Value': return 𝕊0_Value;
            case 'False': return 𝕊0_False;
            case 'Null': return 𝕊0_Null;
            case 'True': return 𝕊0_True;
            case 'Object': return 𝕊0_Object;
            case 'Property': return 𝕊0_Property;
            case 'Array': return 𝕊0_Array;
            case 'Element': return 𝕊0_Element;
            case 'Number': return 𝕊0_Number;
            case 'String': return 𝕊0_String;
            case 'CHAR': return 𝕊0_CHAR;
            case 'LBRACE': return 𝕊0_LBRACE;
            case 'RBRACE': return 𝕊0_RBRACE;
            case 'LBRACKET': return 𝕊0_LBRACKET;
            case 'RBRACKET': return 𝕊0_RBRACKET;
            case 'COLON': return 𝕊0_COLON;
            case 'COMMA': return 𝕊0_COMMA;
            case 'DOUBLE_QUOTE': return 𝕊0_DOUBLE_QUOTE;
            case 'WS': return 𝕊0_WS;
            default: return undefined;
        }
    };

    const 𝕊0_char = (arg) => 𝕊3('char')(arg);

    const 𝕊0_f64 = (arg) => 𝕊3('f64')(arg);

    const 𝕊0_unicode = (arg) => 𝕊4('unicode')(arg);

    const 𝕊0_start = (arg) => {
        if (!𝕊0_start_memo) 𝕊0_start_memo = (() => {
            const t445 = 𝕊0('WS');
            const t446 = 𝕊0('Value');
            const t447 = 𝕊0('WS');
            return function SEQ() {
                let stateₒ = getState();
                let out;
                if (t445()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t446()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t447()) out = concat(out, OUT); else return setState(stateₒ), false;
                OUT = out;
                return true;
            }
        })();
        return 𝕊0_start_memo(arg);
    };
    let 𝕊0_start_memo;

    const 𝕊0_Value = (arg) => {
        if (!𝕊0_Value_memo) 𝕊0_Value_memo = (() => {
            const t448 = 𝕊0('False');
            const t449 = 𝕊0('Null');
            const t450 = 𝕊0('True');
            const t451 = 𝕊0('Object');
            const t452 = 𝕊0('Array');
            const t453 = 𝕊0('Number');
            const t454 = 𝕊0('String');
            return function SEL() {
                if (t448()) return true;
                if (t449()) return true;
                if (t450()) return true;
                if (t451()) return true;
                if (t452()) return true;
                if (t453()) return true;
                if (t454()) return true;
                return false;
            }
        })();
        return 𝕊0_Value_memo(arg);
    };
    let 𝕊0_Value_memo;

    const 𝕊0_False = (arg) => {
        if (!𝕊0_False_memo) 𝕊0_False_memo = (() => {
            const t455 = (() => {
                const mode457 = mode & ~2;
                const out = hasOutput(mode457) ? "false" : undefined;
                if (!hasInput(mode457)) return function STR() { OUT = out; return true; }
                return function STR() {
                    if (isPrint(mode457) && typeof IN !== 'string') return false;
                    if (IP + 5 > IN.length) return false;
                    if (IN.charCodeAt(IP + 0) !== 102) return false;
                    if (IN.charCodeAt(IP + 1) !== 97) return false;
                    if (IN.charCodeAt(IP + 2) !== 108) return false;
                    if (IN.charCodeAt(IP + 3) !== 115) return false;
                    if (IN.charCodeAt(IP + 4) !== 101) return false;
                    IP += 5;
                    OUT = out;
                    return true;
                }
            })();
            const t456 = booleanLiteral({mode, value: false});
            return function SEQ() {
                let stateₒ = getState();
                let out;
                if (t455()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t456()) out = concat(out, OUT); else return setState(stateₒ), false;
                OUT = out;
                return true;
            }
        })();
        return 𝕊0_False_memo(arg);
    };
    let 𝕊0_False_memo;

    const 𝕊0_Null = (arg) => {
        if (!𝕊0_Null_memo) 𝕊0_Null_memo = (() => {
            const t458 = (() => {
                const mode460 = mode & ~2;
                const out = hasOutput(mode460) ? "null" : undefined;
                if (!hasInput(mode460)) return function STR() { OUT = out; return true; }
                return function STR() {
                    if (isPrint(mode460) && typeof IN !== 'string') return false;
                    if (IP + 4 > IN.length) return false;
                    if (IN.charCodeAt(IP + 0) !== 110) return false;
                    if (IN.charCodeAt(IP + 1) !== 117) return false;
                    if (IN.charCodeAt(IP + 2) !== 108) return false;
                    if (IN.charCodeAt(IP + 3) !== 108) return false;
                    IP += 4;
                    OUT = out;
                    return true;
                }
            })();
            const t459 = nullLiteral({mode});
            return function SEQ() {
                let stateₒ = getState();
                let out;
                if (t458()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t459()) out = concat(out, OUT); else return setState(stateₒ), false;
                OUT = out;
                return true;
            }
        })();
        return 𝕊0_Null_memo(arg);
    };
    let 𝕊0_Null_memo;

    const 𝕊0_True = (arg) => {
        if (!𝕊0_True_memo) 𝕊0_True_memo = (() => {
            const t461 = (() => {
                const mode463 = mode & ~2;
                const out = hasOutput(mode463) ? "true" : undefined;
                if (!hasInput(mode463)) return function STR() { OUT = out; return true; }
                return function STR() {
                    if (isPrint(mode463) && typeof IN !== 'string') return false;
                    if (IP + 4 > IN.length) return false;
                    if (IN.charCodeAt(IP + 0) !== 116) return false;
                    if (IN.charCodeAt(IP + 1) !== 114) return false;
                    if (IN.charCodeAt(IP + 2) !== 117) return false;
                    if (IN.charCodeAt(IP + 3) !== 101) return false;
                    IP += 4;
                    OUT = out;
                    return true;
                }
            })();
            const t462 = booleanLiteral({mode, value: true});
            return function SEQ() {
                let stateₒ = getState();
                let out;
                if (t461()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t462()) out = concat(out, OUT); else return setState(stateₒ), false;
                OUT = out;
                return true;
            }
        })();
        return 𝕊0_True_memo(arg);
    };
    let 𝕊0_True_memo;

    const 𝕊0_Object = (arg) => {
        if (!𝕊0_Object_memo) 𝕊0_Object_memo = (() => {
            const t464 = 𝕊0('LBRACE');
            const t465 = (() => {
                const t467 = (() => {
                    const t469 = 𝕊0('Property');
                    const t470 = zeroOrMore({
                        mode,
                        expression: (() => {
                            const t471 = 𝕊0('COMMA');
                            const t472 = 𝕊0('Property');
                            return function SEQ() {
                                let stateₒ = getState();
                                let out;
                                if (t471()) out = concat(out, OUT); else return setState(stateₒ), false;
                                if (t472()) out = concat(out, OUT); else return setState(stateₒ), false;
                                OUT = out;
                                return true;
                            }
                        })(),
                    });
                    return function SEQ() {
                        let stateₒ = getState();
                        let out;
                        if (t469()) out = concat(out, OUT); else return setState(stateₒ), false;
                        if (t470()) out = concat(out, OUT); else return setState(stateₒ), false;
                        OUT = out;
                        return true;
                    }
                })();
                const t468 = record({
                    mode,
                    fields: [],
                });
                return function SEL() {
                    if (t467()) return true;
                    if (t468()) return true;
                    return false;
                }
            })();
            const t466 = 𝕊0('RBRACE');
            return function SEQ() {
                let stateₒ = getState();
                let out;
                if (t464()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t465()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t466()) out = concat(out, OUT); else return setState(stateₒ), false;
                OUT = out;
                return true;
            }
        })();
        return 𝕊0_Object_memo(arg);
    };
    let 𝕊0_Object_memo;

    const 𝕊0_Property = (arg) => {
        if (!𝕊0_Property_memo) 𝕊0_Property_memo = field({
            mode,
            name: 𝕊0('String'),
            value: (() => {
                const t473 = 𝕊0('COLON');
                const t474 = 𝕊0('Value');
                return function SEQ() {
                    let stateₒ = getState();
                    let out;
                    if (t473()) out = concat(out, OUT); else return setState(stateₒ), false;
                    if (t474()) out = concat(out, OUT); else return setState(stateₒ), false;
                    OUT = out;
                    return true;
                }
            })(),
        });
        return 𝕊0_Property_memo(arg);
    };
    let 𝕊0_Property_memo;

    const 𝕊0_Array = (arg) => {
        if (!𝕊0_Array_memo) 𝕊0_Array_memo = (() => {
            const t475 = 𝕊0('LBRACKET');
            const t476 = (() => {
                const t478 = (() => {
                    const t480 = 𝕊0('Element');
                    const t481 = zeroOrMore({
                        mode,
                        expression: (() => {
                            const t482 = 𝕊0('COMMA');
                            const t483 = 𝕊0('Element');
                            return function SEQ() {
                                let stateₒ = getState();
                                let out;
                                if (t482()) out = concat(out, OUT); else return setState(stateₒ), false;
                                if (t483()) out = concat(out, OUT); else return setState(stateₒ), false;
                                OUT = out;
                                return true;
                            }
                        })(),
                    });
                    return function SEQ() {
                        let stateₒ = getState();
                        let out;
                        if (t480()) out = concat(out, OUT); else return setState(stateₒ), false;
                        if (t481()) out = concat(out, OUT); else return setState(stateₒ), false;
                        OUT = out;
                        return true;
                    }
                })();
                const t479 = list({
                    mode,
                    elements: [],
                });
                return function SEL() {
                    if (t478()) return true;
                    if (t479()) return true;
                    return false;
                }
            })();
            const t477 = 𝕊0('RBRACKET');
            return function SEQ() {
                let stateₒ = getState();
                let out;
                if (t475()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t476()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t477()) out = concat(out, OUT); else return setState(stateₒ), false;
                OUT = out;
                return true;
            }
        })();
        return 𝕊0_Array_memo(arg);
    };
    let 𝕊0_Array_memo;

    const 𝕊0_Element = (arg) => {
        if (!𝕊0_Element_memo) 𝕊0_Element_memo = list({
            mode,
            elements: [
                𝕊0('Value'),
            ],
        });
        return 𝕊0_Element_memo(arg);
    };
    let 𝕊0_Element_memo;

    const 𝕊0_Number = (arg) => {
        if (!𝕊0_Number_memo) 𝕊0_Number_memo = 𝕊0('f64');
        return 𝕊0_Number_memo(arg);
    };
    let 𝕊0_Number_memo;

    const 𝕊0_String = (arg) => {
        if (!𝕊0_String_memo) 𝕊0_String_memo = (() => {
            const t484 = 𝕊0('DOUBLE_QUOTE');
            const t485 = zeroOrMore({
                mode,
                expression: 𝕊0('CHAR'),
            });
            const t486 = 𝕊0('DOUBLE_QUOTE');
            return function SEQ() {
                let stateₒ = getState();
                let out;
                if (t484()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t485()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t486()) out = concat(out, OUT); else return setState(stateₒ), false;
                OUT = out;
                return true;
            }
        })();
        return 𝕊0_String_memo(arg);
    };
    let 𝕊0_String_memo;

    const 𝕊0_CHAR = (arg) => {
        if (!𝕊0_CHAR_memo) 𝕊0_CHAR_memo = (() => {
            const t487 = (() => {
                const t497 = not({
                    mode,
                    expression: (() => {
                        const mode500 = mode & ~0;
                        const out = hasOutput(mode500) ? "\\" : undefined;
                        if (!hasInput(mode500)) return function STR() { OUT = out; return true; }
                        return function STR() {
                            if (isPrint(mode500) && typeof IN !== 'string') return false;
                            if (IP + 1 > IN.length) return false;
                            if (IN.charCodeAt(IP + 0) !== 92) return false;
                            IP += 1;
                            OUT = out;
                            return true;
                        }
                    })(),
                });
                const t498 = not({
                    mode,
                    expression: (() => {
                        const mode501 = mode & ~0;
                        const out = hasOutput(mode501) ? "\"" : undefined;
                        if (!hasInput(mode501)) return function STR() { OUT = out; return true; }
                        return function STR() {
                            if (isPrint(mode501) && typeof IN !== 'string') return false;
                            if (IP + 1 > IN.length) return false;
                            if (IN.charCodeAt(IP + 0) !== 34) return false;
                            IP += 1;
                            OUT = out;
                            return true;
                        }
                    })(),
                });
                const t499 = (𝕊0('char'))(𝕊1);
                return function SEQ() {
                    let stateₒ = getState();
                    let out;
                    if (t497()) out = concat(out, OUT); else return setState(stateₒ), false;
                    if (t498()) out = concat(out, OUT); else return setState(stateₒ), false;
                    if (t499()) out = concat(out, OUT); else return setState(stateₒ), false;
                    OUT = out;
                    return true;
                }
            })();
            const t488 = (() => {
                const t502 = (() => {
                    const mode504 = mode & ~2;
                    const out = hasOutput(mode504) ? "\\\"" : undefined;
                    if (!hasInput(mode504)) return function STR() { OUT = out; return true; }
                    return function STR() {
                        if (isPrint(mode504) && typeof IN !== 'string') return false;
                        if (IP + 2 > IN.length) return false;
                        if (IN.charCodeAt(IP + 0) !== 92) return false;
                        if (IN.charCodeAt(IP + 1) !== 34) return false;
                        IP += 2;
                        OUT = out;
                        return true;
                    }
                })();
                const t503 = (() => {
                    const mode505 = mode & ~4;
                    const out = hasOutput(mode505) ? "\"" : undefined;
                    if (!hasInput(mode505)) return function STR() { OUT = out; return true; }
                    return function STR() {
                        if (isPrint(mode505) && typeof IN !== 'string') return false;
                        if (IP + 1 > IN.length) return false;
                        if (IN.charCodeAt(IP + 0) !== 34) return false;
                        IP += 1;
                        OUT = out;
                        return true;
                    }
                })();
                return function SEQ() {
                    let stateₒ = getState();
                    let out;
                    if (t502()) out = concat(out, OUT); else return setState(stateₒ), false;
                    if (t503()) out = concat(out, OUT); else return setState(stateₒ), false;
                    OUT = out;
                    return true;
                }
            })();
            const t489 = (() => {
                const t506 = (() => {
                    const mode508 = mode & ~2;
                    const out = hasOutput(mode508) ? "\\\\" : undefined;
                    if (!hasInput(mode508)) return function STR() { OUT = out; return true; }
                    return function STR() {
                        if (isPrint(mode508) && typeof IN !== 'string') return false;
                        if (IP + 2 > IN.length) return false;
                        if (IN.charCodeAt(IP + 0) !== 92) return false;
                        if (IN.charCodeAt(IP + 1) !== 92) return false;
                        IP += 2;
                        OUT = out;
                        return true;
                    }
                })();
                const t507 = (() => {
                    const mode509 = mode & ~4;
                    const out = hasOutput(mode509) ? "\\" : undefined;
                    if (!hasInput(mode509)) return function STR() { OUT = out; return true; }
                    return function STR() {
                        if (isPrint(mode509) && typeof IN !== 'string') return false;
                        if (IP + 1 > IN.length) return false;
                        if (IN.charCodeAt(IP + 0) !== 92) return false;
                        IP += 1;
                        OUT = out;
                        return true;
                    }
                })();
                return function SEQ() {
                    let stateₒ = getState();
                    let out;
                    if (t506()) out = concat(out, OUT); else return setState(stateₒ), false;
                    if (t507()) out = concat(out, OUT); else return setState(stateₒ), false;
                    OUT = out;
                    return true;
                }
            })();
            const t490 = (() => {
                const t510 = (() => {
                    const mode512 = mode & ~2;
                    const out = hasOutput(mode512) ? "\\/" : undefined;
                    if (!hasInput(mode512)) return function STR() { OUT = out; return true; }
                    return function STR() {
                        if (isPrint(mode512) && typeof IN !== 'string') return false;
                        if (IP + 2 > IN.length) return false;
                        if (IN.charCodeAt(IP + 0) !== 92) return false;
                        if (IN.charCodeAt(IP + 1) !== 47) return false;
                        IP += 2;
                        OUT = out;
                        return true;
                    }
                })();
                const t511 = (() => {
                    const mode513 = mode & ~4;
                    const out = hasOutput(mode513) ? "/" : undefined;
                    if (!hasInput(mode513)) return function STR() { OUT = out; return true; }
                    return function STR() {
                        if (isPrint(mode513) && typeof IN !== 'string') return false;
                        if (IP + 1 > IN.length) return false;
                        if (IN.charCodeAt(IP + 0) !== 47) return false;
                        IP += 1;
                        OUT = out;
                        return true;
                    }
                })();
                return function SEQ() {
                    let stateₒ = getState();
                    let out;
                    if (t510()) out = concat(out, OUT); else return setState(stateₒ), false;
                    if (t511()) out = concat(out, OUT); else return setState(stateₒ), false;
                    OUT = out;
                    return true;
                }
            })();
            const t491 = (() => {
                const t514 = (() => {
                    const mode516 = mode & ~2;
                    const out = hasOutput(mode516) ? "\\b" : undefined;
                    if (!hasInput(mode516)) return function STR() { OUT = out; return true; }
                    return function STR() {
                        if (isPrint(mode516) && typeof IN !== 'string') return false;
                        if (IP + 2 > IN.length) return false;
                        if (IN.charCodeAt(IP + 0) !== 92) return false;
                        if (IN.charCodeAt(IP + 1) !== 98) return false;
                        IP += 2;
                        OUT = out;
                        return true;
                    }
                })();
                const t515 = (() => {
                    const mode517 = mode & ~4;
                    const out = hasOutput(mode517) ? "\b" : undefined;
                    if (!hasInput(mode517)) return function STR() { OUT = out; return true; }
                    return function STR() {
                        if (isPrint(mode517) && typeof IN !== 'string') return false;
                        if (IP + 1 > IN.length) return false;
                        if (IN.charCodeAt(IP + 0) !== 8) return false;
                        IP += 1;
                        OUT = out;
                        return true;
                    }
                })();
                return function SEQ() {
                    let stateₒ = getState();
                    let out;
                    if (t514()) out = concat(out, OUT); else return setState(stateₒ), false;
                    if (t515()) out = concat(out, OUT); else return setState(stateₒ), false;
                    OUT = out;
                    return true;
                }
            })();
            const t492 = (() => {
                const t518 = (() => {
                    const mode520 = mode & ~2;
                    const out = hasOutput(mode520) ? "\\f" : undefined;
                    if (!hasInput(mode520)) return function STR() { OUT = out; return true; }
                    return function STR() {
                        if (isPrint(mode520) && typeof IN !== 'string') return false;
                        if (IP + 2 > IN.length) return false;
                        if (IN.charCodeAt(IP + 0) !== 92) return false;
                        if (IN.charCodeAt(IP + 1) !== 102) return false;
                        IP += 2;
                        OUT = out;
                        return true;
                    }
                })();
                const t519 = (() => {
                    const mode521 = mode & ~4;
                    const out = hasOutput(mode521) ? "\f" : undefined;
                    if (!hasInput(mode521)) return function STR() { OUT = out; return true; }
                    return function STR() {
                        if (isPrint(mode521) && typeof IN !== 'string') return false;
                        if (IP + 1 > IN.length) return false;
                        if (IN.charCodeAt(IP + 0) !== 12) return false;
                        IP += 1;
                        OUT = out;
                        return true;
                    }
                })();
                return function SEQ() {
                    let stateₒ = getState();
                    let out;
                    if (t518()) out = concat(out, OUT); else return setState(stateₒ), false;
                    if (t519()) out = concat(out, OUT); else return setState(stateₒ), false;
                    OUT = out;
                    return true;
                }
            })();
            const t493 = (() => {
                const t522 = (() => {
                    const mode524 = mode & ~2;
                    const out = hasOutput(mode524) ? "\\n" : undefined;
                    if (!hasInput(mode524)) return function STR() { OUT = out; return true; }
                    return function STR() {
                        if (isPrint(mode524) && typeof IN !== 'string') return false;
                        if (IP + 2 > IN.length) return false;
                        if (IN.charCodeAt(IP + 0) !== 92) return false;
                        if (IN.charCodeAt(IP + 1) !== 110) return false;
                        IP += 2;
                        OUT = out;
                        return true;
                    }
                })();
                const t523 = (() => {
                    const mode525 = mode & ~4;
                    const out = hasOutput(mode525) ? "\n" : undefined;
                    if (!hasInput(mode525)) return function STR() { OUT = out; return true; }
                    return function STR() {
                        if (isPrint(mode525) && typeof IN !== 'string') return false;
                        if (IP + 1 > IN.length) return false;
                        if (IN.charCodeAt(IP + 0) !== 10) return false;
                        IP += 1;
                        OUT = out;
                        return true;
                    }
                })();
                return function SEQ() {
                    let stateₒ = getState();
                    let out;
                    if (t522()) out = concat(out, OUT); else return setState(stateₒ), false;
                    if (t523()) out = concat(out, OUT); else return setState(stateₒ), false;
                    OUT = out;
                    return true;
                }
            })();
            const t494 = (() => {
                const t526 = (() => {
                    const mode528 = mode & ~2;
                    const out = hasOutput(mode528) ? "\\r" : undefined;
                    if (!hasInput(mode528)) return function STR() { OUT = out; return true; }
                    return function STR() {
                        if (isPrint(mode528) && typeof IN !== 'string') return false;
                        if (IP + 2 > IN.length) return false;
                        if (IN.charCodeAt(IP + 0) !== 92) return false;
                        if (IN.charCodeAt(IP + 1) !== 114) return false;
                        IP += 2;
                        OUT = out;
                        return true;
                    }
                })();
                const t527 = (() => {
                    const mode529 = mode & ~4;
                    const out = hasOutput(mode529) ? "\r" : undefined;
                    if (!hasInput(mode529)) return function STR() { OUT = out; return true; }
                    return function STR() {
                        if (isPrint(mode529) && typeof IN !== 'string') return false;
                        if (IP + 1 > IN.length) return false;
                        if (IN.charCodeAt(IP + 0) !== 13) return false;
                        IP += 1;
                        OUT = out;
                        return true;
                    }
                })();
                return function SEQ() {
                    let stateₒ = getState();
                    let out;
                    if (t526()) out = concat(out, OUT); else return setState(stateₒ), false;
                    if (t527()) out = concat(out, OUT); else return setState(stateₒ), false;
                    OUT = out;
                    return true;
                }
            })();
            const t495 = (() => {
                const t530 = (() => {
                    const mode532 = mode & ~2;
                    const out = hasOutput(mode532) ? "\\t" : undefined;
                    if (!hasInput(mode532)) return function STR() { OUT = out; return true; }
                    return function STR() {
                        if (isPrint(mode532) && typeof IN !== 'string') return false;
                        if (IP + 2 > IN.length) return false;
                        if (IN.charCodeAt(IP + 0) !== 92) return false;
                        if (IN.charCodeAt(IP + 1) !== 116) return false;
                        IP += 2;
                        OUT = out;
                        return true;
                    }
                })();
                const t531 = (() => {
                    const mode533 = mode & ~4;
                    const out = hasOutput(mode533) ? "\t" : undefined;
                    if (!hasInput(mode533)) return function STR() { OUT = out; return true; }
                    return function STR() {
                        if (isPrint(mode533) && typeof IN !== 'string') return false;
                        if (IP + 1 > IN.length) return false;
                        if (IN.charCodeAt(IP + 0) !== 9) return false;
                        IP += 1;
                        OUT = out;
                        return true;
                    }
                })();
                return function SEQ() {
                    let stateₒ = getState();
                    let out;
                    if (t530()) out = concat(out, OUT); else return setState(stateₒ), false;
                    if (t531()) out = concat(out, OUT); else return setState(stateₒ), false;
                    OUT = out;
                    return true;
                }
            })();
            const t496 = (() => {
                const t534 = (() => {
                    const mode536 = mode & ~2;
                    const out = hasOutput(mode536) ? "\\u" : undefined;
                    if (!hasInput(mode536)) return function STR() { OUT = out; return true; }
                    return function STR() {
                        if (isPrint(mode536) && typeof IN !== 'string') return false;
                        if (IP + 2 > IN.length) return false;
                        if (IN.charCodeAt(IP + 0) !== 92) return false;
                        if (IN.charCodeAt(IP + 1) !== 117) return false;
                        IP += 2;
                        OUT = out;
                        return true;
                    }
                })();
                const t535 = (𝕊0('unicode'))(𝕊2);
                return function SEQ() {
                    let stateₒ = getState();
                    let out;
                    if (t534()) out = concat(out, OUT); else return setState(stateₒ), false;
                    if (t535()) out = concat(out, OUT); else return setState(stateₒ), false;
                    OUT = out;
                    return true;
                }
            })();
            return function SEL() {
                if (t487()) return true;
                if (t488()) return true;
                if (t489()) return true;
                if (t490()) return true;
                if (t491()) return true;
                if (t492()) return true;
                if (t493()) return true;
                if (t494()) return true;
                if (t495()) return true;
                if (t496()) return true;
                return false;
            }
        })();
        return 𝕊0_CHAR_memo(arg);
    };
    let 𝕊0_CHAR_memo;

    const 𝕊0_LBRACE = (arg) => {
        if (!𝕊0_LBRACE_memo) 𝕊0_LBRACE_memo = (() => {
            const t537 = 𝕊0('WS');
            const t538 = (() => {
                const mode540 = mode & ~2;
                const out = hasOutput(mode540) ? "{" : undefined;
                if (!hasInput(mode540)) return function STR() { OUT = out; return true; }
                return function STR() {
                    if (isPrint(mode540) && typeof IN !== 'string') return false;
                    if (IP + 1 > IN.length) return false;
                    if (IN.charCodeAt(IP + 0) !== 123) return false;
                    IP += 1;
                    OUT = out;
                    return true;
                }
            })();
            const t539 = 𝕊0('WS');
            return function SEQ() {
                let stateₒ = getState();
                let out;
                if (t537()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t538()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t539()) out = concat(out, OUT); else return setState(stateₒ), false;
                OUT = out;
                return true;
            }
        })();
        return 𝕊0_LBRACE_memo(arg);
    };
    let 𝕊0_LBRACE_memo;

    const 𝕊0_RBRACE = (arg) => {
        if (!𝕊0_RBRACE_memo) 𝕊0_RBRACE_memo = (() => {
            const t541 = 𝕊0('WS');
            const t542 = (() => {
                const mode544 = mode & ~2;
                const out = hasOutput(mode544) ? "}" : undefined;
                if (!hasInput(mode544)) return function STR() { OUT = out; return true; }
                return function STR() {
                    if (isPrint(mode544) && typeof IN !== 'string') return false;
                    if (IP + 1 > IN.length) return false;
                    if (IN.charCodeAt(IP + 0) !== 125) return false;
                    IP += 1;
                    OUT = out;
                    return true;
                }
            })();
            const t543 = 𝕊0('WS');
            return function SEQ() {
                let stateₒ = getState();
                let out;
                if (t541()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t542()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t543()) out = concat(out, OUT); else return setState(stateₒ), false;
                OUT = out;
                return true;
            }
        })();
        return 𝕊0_RBRACE_memo(arg);
    };
    let 𝕊0_RBRACE_memo;

    const 𝕊0_LBRACKET = (arg) => {
        if (!𝕊0_LBRACKET_memo) 𝕊0_LBRACKET_memo = (() => {
            const t545 = 𝕊0('WS');
            const t546 = (() => {
                const mode548 = mode & ~2;
                const out = hasOutput(mode548) ? "[" : undefined;
                if (!hasInput(mode548)) return function STR() { OUT = out; return true; }
                return function STR() {
                    if (isPrint(mode548) && typeof IN !== 'string') return false;
                    if (IP + 1 > IN.length) return false;
                    if (IN.charCodeAt(IP + 0) !== 91) return false;
                    IP += 1;
                    OUT = out;
                    return true;
                }
            })();
            const t547 = 𝕊0('WS');
            return function SEQ() {
                let stateₒ = getState();
                let out;
                if (t545()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t546()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t547()) out = concat(out, OUT); else return setState(stateₒ), false;
                OUT = out;
                return true;
            }
        })();
        return 𝕊0_LBRACKET_memo(arg);
    };
    let 𝕊0_LBRACKET_memo;

    const 𝕊0_RBRACKET = (arg) => {
        if (!𝕊0_RBRACKET_memo) 𝕊0_RBRACKET_memo = (() => {
            const t549 = 𝕊0('WS');
            const t550 = (() => {
                const mode552 = mode & ~2;
                const out = hasOutput(mode552) ? "]" : undefined;
                if (!hasInput(mode552)) return function STR() { OUT = out; return true; }
                return function STR() {
                    if (isPrint(mode552) && typeof IN !== 'string') return false;
                    if (IP + 1 > IN.length) return false;
                    if (IN.charCodeAt(IP + 0) !== 93) return false;
                    IP += 1;
                    OUT = out;
                    return true;
                }
            })();
            const t551 = 𝕊0('WS');
            return function SEQ() {
                let stateₒ = getState();
                let out;
                if (t549()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t550()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t551()) out = concat(out, OUT); else return setState(stateₒ), false;
                OUT = out;
                return true;
            }
        })();
        return 𝕊0_RBRACKET_memo(arg);
    };
    let 𝕊0_RBRACKET_memo;

    const 𝕊0_COLON = (arg) => {
        if (!𝕊0_COLON_memo) 𝕊0_COLON_memo = (() => {
            const t553 = 𝕊0('WS');
            const t554 = (() => {
                const mode556 = mode & ~2;
                const out = hasOutput(mode556) ? ":" : undefined;
                if (!hasInput(mode556)) return function STR() { OUT = out; return true; }
                return function STR() {
                    if (isPrint(mode556) && typeof IN !== 'string') return false;
                    if (IP + 1 > IN.length) return false;
                    if (IN.charCodeAt(IP + 0) !== 58) return false;
                    IP += 1;
                    OUT = out;
                    return true;
                }
            })();
            const t555 = 𝕊0('WS');
            return function SEQ() {
                let stateₒ = getState();
                let out;
                if (t553()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t554()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t555()) out = concat(out, OUT); else return setState(stateₒ), false;
                OUT = out;
                return true;
            }
        })();
        return 𝕊0_COLON_memo(arg);
    };
    let 𝕊0_COLON_memo;

    const 𝕊0_COMMA = (arg) => {
        if (!𝕊0_COMMA_memo) 𝕊0_COMMA_memo = (() => {
            const t557 = 𝕊0('WS');
            const t558 = (() => {
                const mode560 = mode & ~2;
                const out = hasOutput(mode560) ? "," : undefined;
                if (!hasInput(mode560)) return function STR() { OUT = out; return true; }
                return function STR() {
                    if (isPrint(mode560) && typeof IN !== 'string') return false;
                    if (IP + 1 > IN.length) return false;
                    if (IN.charCodeAt(IP + 0) !== 44) return false;
                    IP += 1;
                    OUT = out;
                    return true;
                }
            })();
            const t559 = 𝕊0('WS');
            return function SEQ() {
                let stateₒ = getState();
                let out;
                if (t557()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t558()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t559()) out = concat(out, OUT); else return setState(stateₒ), false;
                OUT = out;
                return true;
            }
        })();
        return 𝕊0_COMMA_memo(arg);
    };
    let 𝕊0_COMMA_memo;

    const 𝕊0_DOUBLE_QUOTE = (arg) => {
        if (!𝕊0_DOUBLE_QUOTE_memo) 𝕊0_DOUBLE_QUOTE_memo = (() => {
            const mode561 = mode & ~2;
            const out = hasOutput(mode561) ? "\"" : undefined;
            if (!hasInput(mode561)) return function STR() { OUT = out; return true; }
            return function STR() {
                if (isPrint(mode561) && typeof IN !== 'string') return false;
                if (IP + 1 > IN.length) return false;
                if (IN.charCodeAt(IP + 0) !== 34) return false;
                IP += 1;
                OUT = out;
                return true;
            }
        })();
        return 𝕊0_DOUBLE_QUOTE_memo(arg);
    };
    let 𝕊0_DOUBLE_QUOTE_memo;

    const 𝕊0_WS = (arg) => {
        if (!𝕊0_WS_memo) 𝕊0_WS_memo = zeroOrMore({
            mode,
            expression: (() => {
                const t562 = (() => {
                    const mode566 = mode & ~2;
                    const out = hasOutput(mode566) ? " " : undefined;
                    if (!hasInput(mode566)) return function STR() { OUT = out; return true; }
                    return function STR() {
                        if (isPrint(mode566) && typeof IN !== 'string') return false;
                        if (IP + 1 > IN.length) return false;
                        if (IN.charCodeAt(IP + 0) !== 32) return false;
                        IP += 1;
                        OUT = out;
                        return true;
                    }
                })();
                const t563 = (() => {
                    const mode567 = mode & ~2;
                    const out = hasOutput(mode567) ? "\t" : undefined;
                    if (!hasInput(mode567)) return function STR() { OUT = out; return true; }
                    return function STR() {
                        if (isPrint(mode567) && typeof IN !== 'string') return false;
                        if (IP + 1 > IN.length) return false;
                        if (IN.charCodeAt(IP + 0) !== 9) return false;
                        IP += 1;
                        OUT = out;
                        return true;
                    }
                })();
                const t564 = (() => {
                    const mode568 = mode & ~2;
                    const out = hasOutput(mode568) ? "\n" : undefined;
                    if (!hasInput(mode568)) return function STR() { OUT = out; return true; }
                    return function STR() {
                        if (isPrint(mode568) && typeof IN !== 'string') return false;
                        if (IP + 1 > IN.length) return false;
                        if (IN.charCodeAt(IP + 0) !== 10) return false;
                        IP += 1;
                        OUT = out;
                        return true;
                    }
                })();
                const t565 = (() => {
                    const mode569 = mode & ~2;
                    const out = hasOutput(mode569) ? "\r" : undefined;
                    if (!hasInput(mode569)) return function STR() { OUT = out; return true; }
                    return function STR() {
                        if (isPrint(mode569) && typeof IN !== 'string') return false;
                        if (IP + 1 > IN.length) return false;
                        if (IN.charCodeAt(IP + 0) !== 13) return false;
                        IP += 1;
                        OUT = out;
                        return true;
                    }
                })();
                return function SEL() {
                    if (t562()) return true;
                    if (t563()) return true;
                    if (t564()) return true;
                    if (t565()) return true;
                    return false;
                }
            })(),
        });
        return 𝕊0_WS_memo(arg);
    };
    let 𝕊0_WS_memo;

    const 𝕊1 = (name) => {
        switch (name) {
            case 'min': return 𝕊1_min;
            case 'max': return 𝕊1_max;
            default: return undefined;
        }
    };

    const 𝕊1_min = (arg) => {
        if (!𝕊1_min_memo) 𝕊1_min_memo = (() => {
            const mode570 = mode & ~0;
            const out = hasOutput(mode570) ? " " : undefined;
            if (!hasInput(mode570)) return function STR() { OUT = out; return true; }
            return function STR() {
                if (isPrint(mode570) && typeof IN !== 'string') return false;
                if (IP + 1 > IN.length) return false;
                if (IN.charCodeAt(IP + 0) !== 32) return false;
                IP += 1;
                OUT = out;
                return true;
            }
        })();
        return 𝕊1_min_memo(arg);
    };
    let 𝕊1_min_memo;

    const 𝕊1_max = (arg) => {
        if (!𝕊1_max_memo) 𝕊1_max_memo = (() => {
            const mode571 = mode & ~0;
            const out = hasOutput(mode571) ? "￿" : undefined;
            if (!hasInput(mode571)) return function STR() { OUT = out; return true; }
            return function STR() {
                if (isPrint(mode571) && typeof IN !== 'string') return false;
                if (IP + 1 > IN.length) return false;
                if (IN.charCodeAt(IP + 0) !== 65535) return false;
                IP += 1;
                OUT = out;
                return true;
            }
        })();
        return 𝕊1_max_memo(arg);
    };
    let 𝕊1_max_memo;

    const 𝕊2 = (name) => {
        switch (name) {
            case 'base': return 𝕊2_base;
            case 'minDigits': return 𝕊2_minDigits;
            case 'maxDigits': return 𝕊2_maxDigits;
            default: return undefined;
        }
    };

    const 𝕊2_base = (arg) => {
        if (!𝕊2_base_memo) 𝕊2_base_memo = numericLiteral({mode, value: 16});
        return 𝕊2_base_memo(arg);
    };
    let 𝕊2_base_memo;

    const 𝕊2_minDigits = (arg) => {
        if (!𝕊2_minDigits_memo) 𝕊2_minDigits_memo = numericLiteral({mode, value: 4});
        return 𝕊2_minDigits_memo(arg);
    };
    let 𝕊2_minDigits_memo;

    const 𝕊2_maxDigits = (arg) => {
        if (!𝕊2_maxDigits_memo) 𝕊2_maxDigits_memo = numericLiteral({mode, value: 4});
        return 𝕊2_maxDigits_memo(arg);
    };
    let 𝕊2_maxDigits_memo;

    const 𝕊3 = createExtension𝕊3({mode});

    const 𝕊4 = createExtension𝕊4({mode});

    // -------------------- Compile-time constants --------------------
    𝕊0('DOUBLE_QUOTE').constant = {value: "\""};
    𝕊1('min').constant = {value: " "};
    𝕊1('max').constant = {value: "￿"};
    𝕊2('base').constant = {value: 16};
    𝕊2('minDigits').constant = {value: 4};
    𝕊2('maxDigits').constant = {value: 4};

    return 𝕊0('start');
})();

// -------------------- Main exports --------------------
module.exports = {
    parse(text) {
        setState({ IN: text, IP: 0 });
        if (!parse()) throw new Error('parse failed');
        if (!isInputFullyConsumed()) throw new Error('parse didn\'t consume entire input');
        if (OUT === undefined) throw new Error('parse didn\'t return a value');
        return OUT;
    },
    print(node) {
        setState({ IN: node, IP: 0 });
        if (!print()) throw new Error('print failed');
        if (!isInputFullyConsumed()) throw new Error('print didn\'t consume entire input');
        if (OUT === undefined) throw new Error('print didn\'t return a value');
        return OUT;
    },
};
