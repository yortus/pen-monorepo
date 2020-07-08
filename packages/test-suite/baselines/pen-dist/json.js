
"use strict";
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
            if (objectToString.call(IN) !== '[object Object]')
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
            if (objectToString.call(IN) !== '[object Object]')
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
    let type = objectToString.call(a);
    if (type !== objectToString.call(b))
        throw new Error(`Internal error: invalid sequence`);
    if (type === '[object String]')
        return a + b;
    if (type === '[object Array]')
        return [...a, ...b];
    if (type === '[object Object]')
        return Object.assign(Object.assign({}, a), b);
    throw new Error(`Internal error: invalid sequence`);
}
function isInputFullyConsumed() {
    let type = objectToString.call(IN);
    if (type === '[object String]')
        return IP === IN.length;
    if (type === '[object Array]')
        return IP === IN.length;
    if (type === '[object Object]') {
        let keyCount = Object.keys(IN).length;
        assert(keyCount <= 32);
        if (keyCount === 0)
            return true;
        return IP === -1 >>> (32 - keyCount);
    }
    return IP === 1;
}
const objectToString = Object.prototype.toString;
function zeroOrMore({ expression }) {
    return function O_M() {
        let IPₒ = IP;
        let out;
        do {
            if (!expression())
                break;
            if (IP === IPₒ)
                break;
            out = concat(out, OUT);
        } while (true);
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

    // -------------------- json.pen --------------------

    const 𝕊0 = (name) => {
        switch (name) {
            case '$1': return 𝕊0_$1;
            case 'char': return 𝕊0_char;
            case 'f64': return 𝕊0_f64;
            case '$2': return 𝕊0_$2;
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

    const 𝕊0_$1 = (arg) => {
        if (!𝕊0_$1_memo) 𝕊0_$1_memo = 𝕊3;
        return 𝕊0_$1_memo(arg);
    };
    let 𝕊0_$1_memo;

    const 𝕊0_char = (arg) => {
        if (!𝕊0_char_memo) 𝕊0_char_memo = 𝕊0('$1')('char');
        return 𝕊0_char_memo(arg);
    };
    let 𝕊0_char_memo;

    const 𝕊0_f64 = (arg) => {
        if (!𝕊0_f64_memo) 𝕊0_f64_memo = 𝕊0('$1')('f64');
        return 𝕊0_f64_memo(arg);
    };
    let 𝕊0_f64_memo;

    const 𝕊0_$2 = (arg) => {
        if (!𝕊0_$2_memo) 𝕊0_$2_memo = 𝕊4;
        return 𝕊0_$2_memo(arg);
    };
    let 𝕊0_$2_memo;

    const 𝕊0_unicode = (arg) => {
        if (!𝕊0_unicode_memo) 𝕊0_unicode_memo = 𝕊0('$2')('unicode');
        return 𝕊0_unicode_memo(arg);
    };
    let 𝕊0_unicode_memo;

    const 𝕊0_start = (arg) => {
        if (!𝕊0_start_memo) 𝕊0_start_memo = (() => {
            const t226 = 𝕊0('WS');
            const t227 = 𝕊0('Value');
            const t228 = 𝕊0('WS');
            return function SEQ() {
                let stateₒ = getState();
                let out;
                if (t226()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t227()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t228()) out = concat(out, OUT); else return setState(stateₒ), false;
                OUT = out;
                return true;
            };
        })();
        return 𝕊0_start_memo(arg);
    };
    let 𝕊0_start_memo;

    const 𝕊0_Value = (arg) => {
        if (!𝕊0_Value_memo) 𝕊0_Value_memo = (() => {
            const t229 = 𝕊0('False');
            const t230 = 𝕊0('Null');
            const t231 = 𝕊0('True');
            const t232 = 𝕊0('Object');
            const t233 = 𝕊0('Array');
            const t234 = 𝕊0('Number');
            const t235 = 𝕊0('String');
            return function SEL() {
                if (t229()) return true;
                if (t230()) return true;
                if (t231()) return true;
                if (t232()) return true;
                if (t233()) return true;
                if (t234()) return true;
                if (t235()) return true;
                return false;
            };
        })();
        return 𝕊0_Value_memo(arg);
    };
    let 𝕊0_Value_memo;

    const 𝕊0_False = (arg) => {
        if (!𝕊0_False_memo) 𝕊0_False_memo = (() => {
            const t236 = function STR() {
                if (IP + 5 > IN.length) return false;
                if (IN.charCodeAt(IP + 0) !== 102) return false;
                if (IN.charCodeAt(IP + 1) !== 97) return false;
                if (IN.charCodeAt(IP + 2) !== 108) return false;
                if (IN.charCodeAt(IP + 3) !== 115) return false;
                if (IN.charCodeAt(IP + 4) !== 101) return false;
                IP += 5;
                OUT = undefined;
                return true;
            };
            const t237 = function BOO() {
                OUT = false;
                return true;
            };
            return function SEQ() {
                let stateₒ = getState();
                let out;
                if (t236()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t237()) out = concat(out, OUT); else return setState(stateₒ), false;
                OUT = out;
                return true;
            };
        })();
        return 𝕊0_False_memo(arg);
    };
    let 𝕊0_False_memo;

    const 𝕊0_Null = (arg) => {
        if (!𝕊0_Null_memo) 𝕊0_Null_memo = (() => {
            const t238 = function STR() {
                if (IP + 4 > IN.length) return false;
                if (IN.charCodeAt(IP + 0) !== 110) return false;
                if (IN.charCodeAt(IP + 1) !== 117) return false;
                if (IN.charCodeAt(IP + 2) !== 108) return false;
                if (IN.charCodeAt(IP + 3) !== 108) return false;
                IP += 4;
                OUT = undefined;
                return true;
            };
            const t239 = function NUL() {
                OUT = null;
                return true;
            };
            return function SEQ() {
                let stateₒ = getState();
                let out;
                if (t238()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t239()) out = concat(out, OUT); else return setState(stateₒ), false;
                OUT = out;
                return true;
            };
        })();
        return 𝕊0_Null_memo(arg);
    };
    let 𝕊0_Null_memo;

    const 𝕊0_True = (arg) => {
        if (!𝕊0_True_memo) 𝕊0_True_memo = (() => {
            const t240 = function STR() {
                if (IP + 4 > IN.length) return false;
                if (IN.charCodeAt(IP + 0) !== 116) return false;
                if (IN.charCodeAt(IP + 1) !== 114) return false;
                if (IN.charCodeAt(IP + 2) !== 117) return false;
                if (IN.charCodeAt(IP + 3) !== 101) return false;
                IP += 4;
                OUT = undefined;
                return true;
            };
            const t241 = function BOO() {
                OUT = true;
                return true;
            };
            return function SEQ() {
                let stateₒ = getState();
                let out;
                if (t240()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t241()) out = concat(out, OUT); else return setState(stateₒ), false;
                OUT = out;
                return true;
            };
        })();
        return 𝕊0_True_memo(arg);
    };
    let 𝕊0_True_memo;

    const 𝕊0_Object = (arg) => {
        if (!𝕊0_Object_memo) 𝕊0_Object_memo = (() => {
            const t242 = 𝕊0('LBRACE');
            const t243 = (() => {
                const t245 = (() => {
                    const t247 = 𝕊0('Property');
                    const t248 = zeroOrMore({
                        mode: 6,
                        expression: (() => {
                            const t249 = 𝕊0('COMMA');
                            const t250 = 𝕊0('Property');
                            return function SEQ() {
                                let stateₒ = getState();
                                let out;
                                if (t249()) out = concat(out, OUT); else return setState(stateₒ), false;
                                if (t250()) out = concat(out, OUT); else return setState(stateₒ), false;
                                OUT = out;
                                return true;
                            };
                        })(),
                    });
                    return function SEQ() {
                        let stateₒ = getState();
                        let out;
                        if (t247()) out = concat(out, OUT); else return setState(stateₒ), false;
                        if (t248()) out = concat(out, OUT); else return setState(stateₒ), false;
                        OUT = out;
                        return true;
                    };
                })();
                const t246 = record({
                    mode: 6,
                    fields: [],
                });
                return function SEL() {
                    if (t245()) return true;
                    if (t246()) return true;
                    return false;
                };
            })();
            const t244 = 𝕊0('RBRACE');
            return function SEQ() {
                let stateₒ = getState();
                let out;
                if (t242()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t243()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t244()) out = concat(out, OUT); else return setState(stateₒ), false;
                OUT = out;
                return true;
            };
        })();
        return 𝕊0_Object_memo(arg);
    };
    let 𝕊0_Object_memo;

    const 𝕊0_Property = (arg) => {
        if (!𝕊0_Property_memo) 𝕊0_Property_memo = field({
            mode: 6,
            name: 𝕊0('String'),
            value: (() => {
                const t251 = 𝕊0('COLON');
                const t252 = 𝕊0('Value');
                return function SEQ() {
                    let stateₒ = getState();
                    let out;
                    if (t251()) out = concat(out, OUT); else return setState(stateₒ), false;
                    if (t252()) out = concat(out, OUT); else return setState(stateₒ), false;
                    OUT = out;
                    return true;
                };
            })(),
        });
        return 𝕊0_Property_memo(arg);
    };
    let 𝕊0_Property_memo;

    const 𝕊0_Array = (arg) => {
        if (!𝕊0_Array_memo) 𝕊0_Array_memo = (() => {
            const t253 = 𝕊0('LBRACKET');
            const t254 = (() => {
                const t256 = (() => {
                    const t258 = 𝕊0('Element');
                    const t259 = zeroOrMore({
                        mode: 6,
                        expression: (() => {
                            const t260 = 𝕊0('COMMA');
                            const t261 = 𝕊0('Element');
                            return function SEQ() {
                                let stateₒ = getState();
                                let out;
                                if (t260()) out = concat(out, OUT); else return setState(stateₒ), false;
                                if (t261()) out = concat(out, OUT); else return setState(stateₒ), false;
                                OUT = out;
                                return true;
                            };
                        })(),
                    });
                    return function SEQ() {
                        let stateₒ = getState();
                        let out;
                        if (t258()) out = concat(out, OUT); else return setState(stateₒ), false;
                        if (t259()) out = concat(out, OUT); else return setState(stateₒ), false;
                        OUT = out;
                        return true;
                    };
                })();
                const t257 = list({
                    mode: 6,
                    elements: [],
                });
                return function SEL() {
                    if (t256()) return true;
                    if (t257()) return true;
                    return false;
                };
            })();
            const t255 = 𝕊0('RBRACKET');
            return function SEQ() {
                let stateₒ = getState();
                let out;
                if (t253()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t254()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t255()) out = concat(out, OUT); else return setState(stateₒ), false;
                OUT = out;
                return true;
            };
        })();
        return 𝕊0_Array_memo(arg);
    };
    let 𝕊0_Array_memo;

    const 𝕊0_Element = (arg) => {
        if (!𝕊0_Element_memo) 𝕊0_Element_memo = list({
            mode: 6,
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
            const t262 = 𝕊0('DOUBLE_QUOTE');
            const t263 = zeroOrMore({
                mode: 6,
                expression: 𝕊0('CHAR'),
            });
            const t264 = 𝕊0('DOUBLE_QUOTE');
            return function SEQ() {
                let stateₒ = getState();
                let out;
                if (t262()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t263()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t264()) out = concat(out, OUT); else return setState(stateₒ), false;
                OUT = out;
                return true;
            };
        })();
        return 𝕊0_String_memo(arg);
    };
    let 𝕊0_String_memo;

    const 𝕊0_CHAR = (arg) => {
        if (!𝕊0_CHAR_memo) 𝕊0_CHAR_memo = (() => {
            const t265 = (() => {
                const t275 = (() => {
                    const t278 = function STR() {
                        if (IP + 1 > IN.length) return false;
                        if (IN.charCodeAt(IP + 0) !== 92) return false;
                        IP += 1;
                        OUT = "\\";
                        return true;
                    };
                    return function NOT() {
                        let stateₒ = getState();
                        let result = !t278();
                        setState(stateₒ);
                        OUT = undefined;
                        return result;
                    };
                })();
                const t276 = (() => {
                    const t279 = function STR() {
                        if (IP + 1 > IN.length) return false;
                        if (IN.charCodeAt(IP + 0) !== 34) return false;
                        IP += 1;
                        OUT = "\"";
                        return true;
                    };
                    return function NOT() {
                        let stateₒ = getState();
                        let result = !t279();
                        setState(stateₒ);
                        OUT = undefined;
                        return result;
                    };
                })();
                const t277 = (𝕊0('char'))(𝕊1);
                return function SEQ() {
                    let stateₒ = getState();
                    let out;
                    if (t275()) out = concat(out, OUT); else return setState(stateₒ), false;
                    if (t276()) out = concat(out, OUT); else return setState(stateₒ), false;
                    if (t277()) out = concat(out, OUT); else return setState(stateₒ), false;
                    OUT = out;
                    return true;
                };
            })();
            const t266 = (() => {
                const t280 = function STR() {
                    if (IP + 2 > IN.length) return false;
                    if (IN.charCodeAt(IP + 0) !== 92) return false;
                    if (IN.charCodeAt(IP + 1) !== 34) return false;
                    IP += 2;
                    OUT = undefined;
                    return true;
                };
                const t281 = function STR() {
                    OUT = "\"";
                    return true;
                };
                return function SEQ() {
                    let stateₒ = getState();
                    let out;
                    if (t280()) out = concat(out, OUT); else return setState(stateₒ), false;
                    if (t281()) out = concat(out, OUT); else return setState(stateₒ), false;
                    OUT = out;
                    return true;
                };
            })();
            const t267 = (() => {
                const t282 = function STR() {
                    if (IP + 2 > IN.length) return false;
                    if (IN.charCodeAt(IP + 0) !== 92) return false;
                    if (IN.charCodeAt(IP + 1) !== 92) return false;
                    IP += 2;
                    OUT = undefined;
                    return true;
                };
                const t283 = function STR() {
                    OUT = "\\";
                    return true;
                };
                return function SEQ() {
                    let stateₒ = getState();
                    let out;
                    if (t282()) out = concat(out, OUT); else return setState(stateₒ), false;
                    if (t283()) out = concat(out, OUT); else return setState(stateₒ), false;
                    OUT = out;
                    return true;
                };
            })();
            const t268 = (() => {
                const t284 = function STR() {
                    if (IP + 2 > IN.length) return false;
                    if (IN.charCodeAt(IP + 0) !== 92) return false;
                    if (IN.charCodeAt(IP + 1) !== 47) return false;
                    IP += 2;
                    OUT = undefined;
                    return true;
                };
                const t285 = function STR() {
                    OUT = "/";
                    return true;
                };
                return function SEQ() {
                    let stateₒ = getState();
                    let out;
                    if (t284()) out = concat(out, OUT); else return setState(stateₒ), false;
                    if (t285()) out = concat(out, OUT); else return setState(stateₒ), false;
                    OUT = out;
                    return true;
                };
            })();
            const t269 = (() => {
                const t286 = function STR() {
                    if (IP + 2 > IN.length) return false;
                    if (IN.charCodeAt(IP + 0) !== 92) return false;
                    if (IN.charCodeAt(IP + 1) !== 98) return false;
                    IP += 2;
                    OUT = undefined;
                    return true;
                };
                const t287 = function STR() {
                    OUT = "\b";
                    return true;
                };
                return function SEQ() {
                    let stateₒ = getState();
                    let out;
                    if (t286()) out = concat(out, OUT); else return setState(stateₒ), false;
                    if (t287()) out = concat(out, OUT); else return setState(stateₒ), false;
                    OUT = out;
                    return true;
                };
            })();
            const t270 = (() => {
                const t288 = function STR() {
                    if (IP + 2 > IN.length) return false;
                    if (IN.charCodeAt(IP + 0) !== 92) return false;
                    if (IN.charCodeAt(IP + 1) !== 102) return false;
                    IP += 2;
                    OUT = undefined;
                    return true;
                };
                const t289 = function STR() {
                    OUT = "\f";
                    return true;
                };
                return function SEQ() {
                    let stateₒ = getState();
                    let out;
                    if (t288()) out = concat(out, OUT); else return setState(stateₒ), false;
                    if (t289()) out = concat(out, OUT); else return setState(stateₒ), false;
                    OUT = out;
                    return true;
                };
            })();
            const t271 = (() => {
                const t290 = function STR() {
                    if (IP + 2 > IN.length) return false;
                    if (IN.charCodeAt(IP + 0) !== 92) return false;
                    if (IN.charCodeAt(IP + 1) !== 110) return false;
                    IP += 2;
                    OUT = undefined;
                    return true;
                };
                const t291 = function STR() {
                    OUT = "\n";
                    return true;
                };
                return function SEQ() {
                    let stateₒ = getState();
                    let out;
                    if (t290()) out = concat(out, OUT); else return setState(stateₒ), false;
                    if (t291()) out = concat(out, OUT); else return setState(stateₒ), false;
                    OUT = out;
                    return true;
                };
            })();
            const t272 = (() => {
                const t292 = function STR() {
                    if (IP + 2 > IN.length) return false;
                    if (IN.charCodeAt(IP + 0) !== 92) return false;
                    if (IN.charCodeAt(IP + 1) !== 114) return false;
                    IP += 2;
                    OUT = undefined;
                    return true;
                };
                const t293 = function STR() {
                    OUT = "\r";
                    return true;
                };
                return function SEQ() {
                    let stateₒ = getState();
                    let out;
                    if (t292()) out = concat(out, OUT); else return setState(stateₒ), false;
                    if (t293()) out = concat(out, OUT); else return setState(stateₒ), false;
                    OUT = out;
                    return true;
                };
            })();
            const t273 = (() => {
                const t294 = function STR() {
                    if (IP + 2 > IN.length) return false;
                    if (IN.charCodeAt(IP + 0) !== 92) return false;
                    if (IN.charCodeAt(IP + 1) !== 116) return false;
                    IP += 2;
                    OUT = undefined;
                    return true;
                };
                const t295 = function STR() {
                    OUT = "\t";
                    return true;
                };
                return function SEQ() {
                    let stateₒ = getState();
                    let out;
                    if (t294()) out = concat(out, OUT); else return setState(stateₒ), false;
                    if (t295()) out = concat(out, OUT); else return setState(stateₒ), false;
                    OUT = out;
                    return true;
                };
            })();
            const t274 = (() => {
                const t296 = function STR() {
                    if (IP + 2 > IN.length) return false;
                    if (IN.charCodeAt(IP + 0) !== 92) return false;
                    if (IN.charCodeAt(IP + 1) !== 117) return false;
                    IP += 2;
                    OUT = undefined;
                    return true;
                };
                const t297 = (𝕊0('unicode'))(𝕊2);
                return function SEQ() {
                    let stateₒ = getState();
                    let out;
                    if (t296()) out = concat(out, OUT); else return setState(stateₒ), false;
                    if (t297()) out = concat(out, OUT); else return setState(stateₒ), false;
                    OUT = out;
                    return true;
                };
            })();
            return function SEL() {
                if (t265()) return true;
                if (t266()) return true;
                if (t267()) return true;
                if (t268()) return true;
                if (t269()) return true;
                if (t270()) return true;
                if (t271()) return true;
                if (t272()) return true;
                if (t273()) return true;
                if (t274()) return true;
                return false;
            };
        })();
        return 𝕊0_CHAR_memo(arg);
    };
    let 𝕊0_CHAR_memo;

    const 𝕊1 = (name) => {
        switch (name) {
            case 'min': return 𝕊1_min;
            case 'max': return 𝕊1_max;
            default: return undefined;
        }
    };

    const 𝕊1_min = (arg) => {
        if (!𝕊1_min_memo) 𝕊1_min_memo = function STR() {
            if (IP + 1 > IN.length) return false;
            if (IN.charCodeAt(IP + 0) !== 32) return false;
            IP += 1;
            OUT = " ";
            return true;
        };
        return 𝕊1_min_memo(arg);
    };
    let 𝕊1_min_memo;

    const 𝕊1_max = (arg) => {
        if (!𝕊1_max_memo) 𝕊1_max_memo = function STR() {
            if (IP + 1 > IN.length) return false;
            if (IN.charCodeAt(IP + 0) !== 65535) return false;
            IP += 1;
            OUT = "￿";
            return true;
        };
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
        if (!𝕊2_base_memo) 𝕊2_base_memo = function NUM() {
            OUT = 16;
            return true;
        };
        return 𝕊2_base_memo(arg);
    };
    let 𝕊2_base_memo;

    const 𝕊2_minDigits = (arg) => {
        if (!𝕊2_minDigits_memo) 𝕊2_minDigits_memo = function NUM() {
            OUT = 4;
            return true;
        };
        return 𝕊2_minDigits_memo(arg);
    };
    let 𝕊2_minDigits_memo;

    const 𝕊2_maxDigits = (arg) => {
        if (!𝕊2_maxDigits_memo) 𝕊2_maxDigits_memo = function NUM() {
            OUT = 4;
            return true;
        };
        return 𝕊2_maxDigits_memo(arg);
    };
    let 𝕊2_maxDigits_memo;

    const 𝕊0_LBRACE = (arg) => {
        if (!𝕊0_LBRACE_memo) 𝕊0_LBRACE_memo = (() => {
            const t298 = 𝕊0('WS');
            const t299 = function STR() {
                if (IP + 1 > IN.length) return false;
                if (IN.charCodeAt(IP + 0) !== 123) return false;
                IP += 1;
                OUT = undefined;
                return true;
            };
            const t300 = 𝕊0('WS');
            return function SEQ() {
                let stateₒ = getState();
                let out;
                if (t298()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t299()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t300()) out = concat(out, OUT); else return setState(stateₒ), false;
                OUT = out;
                return true;
            };
        })();
        return 𝕊0_LBRACE_memo(arg);
    };
    let 𝕊0_LBRACE_memo;

    const 𝕊0_RBRACE = (arg) => {
        if (!𝕊0_RBRACE_memo) 𝕊0_RBRACE_memo = (() => {
            const t301 = 𝕊0('WS');
            const t302 = function STR() {
                if (IP + 1 > IN.length) return false;
                if (IN.charCodeAt(IP + 0) !== 125) return false;
                IP += 1;
                OUT = undefined;
                return true;
            };
            const t303 = 𝕊0('WS');
            return function SEQ() {
                let stateₒ = getState();
                let out;
                if (t301()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t302()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t303()) out = concat(out, OUT); else return setState(stateₒ), false;
                OUT = out;
                return true;
            };
        })();
        return 𝕊0_RBRACE_memo(arg);
    };
    let 𝕊0_RBRACE_memo;

    const 𝕊0_LBRACKET = (arg) => {
        if (!𝕊0_LBRACKET_memo) 𝕊0_LBRACKET_memo = (() => {
            const t304 = 𝕊0('WS');
            const t305 = function STR() {
                if (IP + 1 > IN.length) return false;
                if (IN.charCodeAt(IP + 0) !== 91) return false;
                IP += 1;
                OUT = undefined;
                return true;
            };
            const t306 = 𝕊0('WS');
            return function SEQ() {
                let stateₒ = getState();
                let out;
                if (t304()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t305()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t306()) out = concat(out, OUT); else return setState(stateₒ), false;
                OUT = out;
                return true;
            };
        })();
        return 𝕊0_LBRACKET_memo(arg);
    };
    let 𝕊0_LBRACKET_memo;

    const 𝕊0_RBRACKET = (arg) => {
        if (!𝕊0_RBRACKET_memo) 𝕊0_RBRACKET_memo = (() => {
            const t307 = 𝕊0('WS');
            const t308 = function STR() {
                if (IP + 1 > IN.length) return false;
                if (IN.charCodeAt(IP + 0) !== 93) return false;
                IP += 1;
                OUT = undefined;
                return true;
            };
            const t309 = 𝕊0('WS');
            return function SEQ() {
                let stateₒ = getState();
                let out;
                if (t307()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t308()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t309()) out = concat(out, OUT); else return setState(stateₒ), false;
                OUT = out;
                return true;
            };
        })();
        return 𝕊0_RBRACKET_memo(arg);
    };
    let 𝕊0_RBRACKET_memo;

    const 𝕊0_COLON = (arg) => {
        if (!𝕊0_COLON_memo) 𝕊0_COLON_memo = (() => {
            const t310 = 𝕊0('WS');
            const t311 = function STR() {
                if (IP + 1 > IN.length) return false;
                if (IN.charCodeAt(IP + 0) !== 58) return false;
                IP += 1;
                OUT = undefined;
                return true;
            };
            const t312 = 𝕊0('WS');
            return function SEQ() {
                let stateₒ = getState();
                let out;
                if (t310()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t311()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t312()) out = concat(out, OUT); else return setState(stateₒ), false;
                OUT = out;
                return true;
            };
        })();
        return 𝕊0_COLON_memo(arg);
    };
    let 𝕊0_COLON_memo;

    const 𝕊0_COMMA = (arg) => {
        if (!𝕊0_COMMA_memo) 𝕊0_COMMA_memo = (() => {
            const t313 = 𝕊0('WS');
            const t314 = function STR() {
                if (IP + 1 > IN.length) return false;
                if (IN.charCodeAt(IP + 0) !== 44) return false;
                IP += 1;
                OUT = undefined;
                return true;
            };
            const t315 = 𝕊0('WS');
            return function SEQ() {
                let stateₒ = getState();
                let out;
                if (t313()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t314()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t315()) out = concat(out, OUT); else return setState(stateₒ), false;
                OUT = out;
                return true;
            };
        })();
        return 𝕊0_COMMA_memo(arg);
    };
    let 𝕊0_COMMA_memo;

    const 𝕊0_DOUBLE_QUOTE = (arg) => {
        if (!𝕊0_DOUBLE_QUOTE_memo) 𝕊0_DOUBLE_QUOTE_memo = function STR() {
            if (IP + 1 > IN.length) return false;
            if (IN.charCodeAt(IP + 0) !== 34) return false;
            IP += 1;
            OUT = undefined;
            return true;
        };
        return 𝕊0_DOUBLE_QUOTE_memo(arg);
    };
    let 𝕊0_DOUBLE_QUOTE_memo;

    const 𝕊0_WS = (arg) => {
        if (!𝕊0_WS_memo) 𝕊0_WS_memo = zeroOrMore({
            mode: 6,
            expression: (() => {
                const t316 = function STR() {
                    if (IP + 1 > IN.length) return false;
                    if (IN.charCodeAt(IP + 0) !== 32) return false;
                    IP += 1;
                    OUT = undefined;
                    return true;
                };
                const t317 = function STR() {
                    if (IP + 1 > IN.length) return false;
                    if (IN.charCodeAt(IP + 0) !== 9) return false;
                    IP += 1;
                    OUT = undefined;
                    return true;
                };
                const t318 = function STR() {
                    if (IP + 1 > IN.length) return false;
                    if (IN.charCodeAt(IP + 0) !== 10) return false;
                    IP += 1;
                    OUT = undefined;
                    return true;
                };
                const t319 = function STR() {
                    if (IP + 1 > IN.length) return false;
                    if (IN.charCodeAt(IP + 0) !== 13) return false;
                    IP += 1;
                    OUT = undefined;
                    return true;
                };
                return function SEL() {
                    if (t316()) return true;
                    if (t317()) return true;
                    if (t318()) return true;
                    if (t319()) return true;
                    return false;
                };
            })(),
        });
        return 𝕊0_WS_memo(arg);
    };
    let 𝕊0_WS_memo;

    const 𝕊3 = createExtension𝕊3({mode: 6});

    const 𝕊4 = createExtension𝕊4({mode: 6});

    // -------------------- Compile-time constants --------------------
    𝕊1('min').constant = {value: " "};
    𝕊1('max').constant = {value: "￿"};
    𝕊2('base').constant = {value: 16};
    𝕊2('minDigits').constant = {value: 4};
    𝕊2('maxDigits').constant = {value: 4};
    𝕊0('DOUBLE_QUOTE').constant = {value: "\""};

    return 𝕊0('start');
})();




// --------------------------------------------------------------------------------
const print = (() => {

    // -------------------- json.pen --------------------

    const 𝕊0 = (name) => {
        switch (name) {
            case '$1': return 𝕊0_$1;
            case 'char': return 𝕊0_char;
            case 'f64': return 𝕊0_f64;
            case '$2': return 𝕊0_$2;
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

    const 𝕊0_$1 = (arg) => {
        if (!𝕊0_$1_memo) 𝕊0_$1_memo = 𝕊3;
        return 𝕊0_$1_memo(arg);
    };
    let 𝕊0_$1_memo;

    const 𝕊0_char = (arg) => {
        if (!𝕊0_char_memo) 𝕊0_char_memo = 𝕊0('$1')('char');
        return 𝕊0_char_memo(arg);
    };
    let 𝕊0_char_memo;

    const 𝕊0_f64 = (arg) => {
        if (!𝕊0_f64_memo) 𝕊0_f64_memo = 𝕊0('$1')('f64');
        return 𝕊0_f64_memo(arg);
    };
    let 𝕊0_f64_memo;

    const 𝕊0_$2 = (arg) => {
        if (!𝕊0_$2_memo) 𝕊0_$2_memo = 𝕊4;
        return 𝕊0_$2_memo(arg);
    };
    let 𝕊0_$2_memo;

    const 𝕊0_unicode = (arg) => {
        if (!𝕊0_unicode_memo) 𝕊0_unicode_memo = 𝕊0('$2')('unicode');
        return 𝕊0_unicode_memo(arg);
    };
    let 𝕊0_unicode_memo;

    const 𝕊0_start = (arg) => {
        if (!𝕊0_start_memo) 𝕊0_start_memo = (() => {
            const t320 = 𝕊0('WS');
            const t321 = 𝕊0('Value');
            const t322 = 𝕊0('WS');
            return function SEQ() {
                let stateₒ = getState();
                let out;
                if (t320()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t321()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t322()) out = concat(out, OUT); else return setState(stateₒ), false;
                OUT = out;
                return true;
            };
        })();
        return 𝕊0_start_memo(arg);
    };
    let 𝕊0_start_memo;

    const 𝕊0_Value = (arg) => {
        if (!𝕊0_Value_memo) 𝕊0_Value_memo = (() => {
            const t323 = 𝕊0('False');
            const t324 = 𝕊0('Null');
            const t325 = 𝕊0('True');
            const t326 = 𝕊0('Object');
            const t327 = 𝕊0('Array');
            const t328 = 𝕊0('Number');
            const t329 = 𝕊0('String');
            return function SEL() {
                if (t323()) return true;
                if (t324()) return true;
                if (t325()) return true;
                if (t326()) return true;
                if (t327()) return true;
                if (t328()) return true;
                if (t329()) return true;
                return false;
            };
        })();
        return 𝕊0_Value_memo(arg);
    };
    let 𝕊0_Value_memo;

    const 𝕊0_False = (arg) => {
        if (!𝕊0_False_memo) 𝕊0_False_memo = (() => {
            const t330 = function STR() {
                OUT = "false";
                return true;
            };
            const t331 = function BOO() {
                if (IN !== false || IP !== 0) return false;
                IP += 1;
                OUT = undefined;
                return true;
            };
            return function SEQ() {
                let stateₒ = getState();
                let out;
                if (t330()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t331()) out = concat(out, OUT); else return setState(stateₒ), false;
                OUT = out;
                return true;
            };
        })();
        return 𝕊0_False_memo(arg);
    };
    let 𝕊0_False_memo;

    const 𝕊0_Null = (arg) => {
        if (!𝕊0_Null_memo) 𝕊0_Null_memo = (() => {
            const t332 = function STR() {
                OUT = "null";
                return true;
            };
            const t333 = function NUL() {
                if (IN !== null || IP !== 0) return false;
                IP += 1;
                OUT = undefined;
                return true;
            };
            return function SEQ() {
                let stateₒ = getState();
                let out;
                if (t332()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t333()) out = concat(out, OUT); else return setState(stateₒ), false;
                OUT = out;
                return true;
            };
        })();
        return 𝕊0_Null_memo(arg);
    };
    let 𝕊0_Null_memo;

    const 𝕊0_True = (arg) => {
        if (!𝕊0_True_memo) 𝕊0_True_memo = (() => {
            const t334 = function STR() {
                OUT = "true";
                return true;
            };
            const t335 = function BOO() {
                if (IN !== true || IP !== 0) return false;
                IP += 1;
                OUT = undefined;
                return true;
            };
            return function SEQ() {
                let stateₒ = getState();
                let out;
                if (t334()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t335()) out = concat(out, OUT); else return setState(stateₒ), false;
                OUT = out;
                return true;
            };
        })();
        return 𝕊0_True_memo(arg);
    };
    let 𝕊0_True_memo;

    const 𝕊0_Object = (arg) => {
        if (!𝕊0_Object_memo) 𝕊0_Object_memo = (() => {
            const t336 = 𝕊0('LBRACE');
            const t337 = (() => {
                const t339 = (() => {
                    const t341 = 𝕊0('Property');
                    const t342 = zeroOrMore({
                        mode: 7,
                        expression: (() => {
                            const t343 = 𝕊0('COMMA');
                            const t344 = 𝕊0('Property');
                            return function SEQ() {
                                let stateₒ = getState();
                                let out;
                                if (t343()) out = concat(out, OUT); else return setState(stateₒ), false;
                                if (t344()) out = concat(out, OUT); else return setState(stateₒ), false;
                                OUT = out;
                                return true;
                            };
                        })(),
                    });
                    return function SEQ() {
                        let stateₒ = getState();
                        let out;
                        if (t341()) out = concat(out, OUT); else return setState(stateₒ), false;
                        if (t342()) out = concat(out, OUT); else return setState(stateₒ), false;
                        OUT = out;
                        return true;
                    };
                })();
                const t340 = record({
                    mode: 7,
                    fields: [],
                });
                return function SEL() {
                    if (t339()) return true;
                    if (t340()) return true;
                    return false;
                };
            })();
            const t338 = 𝕊0('RBRACE');
            return function SEQ() {
                let stateₒ = getState();
                let out;
                if (t336()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t337()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t338()) out = concat(out, OUT); else return setState(stateₒ), false;
                OUT = out;
                return true;
            };
        })();
        return 𝕊0_Object_memo(arg);
    };
    let 𝕊0_Object_memo;

    const 𝕊0_Property = (arg) => {
        if (!𝕊0_Property_memo) 𝕊0_Property_memo = field({
            mode: 7,
            name: 𝕊0('String'),
            value: (() => {
                const t345 = 𝕊0('COLON');
                const t346 = 𝕊0('Value');
                return function SEQ() {
                    let stateₒ = getState();
                    let out;
                    if (t345()) out = concat(out, OUT); else return setState(stateₒ), false;
                    if (t346()) out = concat(out, OUT); else return setState(stateₒ), false;
                    OUT = out;
                    return true;
                };
            })(),
        });
        return 𝕊0_Property_memo(arg);
    };
    let 𝕊0_Property_memo;

    const 𝕊0_Array = (arg) => {
        if (!𝕊0_Array_memo) 𝕊0_Array_memo = (() => {
            const t347 = 𝕊0('LBRACKET');
            const t348 = (() => {
                const t350 = (() => {
                    const t352 = 𝕊0('Element');
                    const t353 = zeroOrMore({
                        mode: 7,
                        expression: (() => {
                            const t354 = 𝕊0('COMMA');
                            const t355 = 𝕊0('Element');
                            return function SEQ() {
                                let stateₒ = getState();
                                let out;
                                if (t354()) out = concat(out, OUT); else return setState(stateₒ), false;
                                if (t355()) out = concat(out, OUT); else return setState(stateₒ), false;
                                OUT = out;
                                return true;
                            };
                        })(),
                    });
                    return function SEQ() {
                        let stateₒ = getState();
                        let out;
                        if (t352()) out = concat(out, OUT); else return setState(stateₒ), false;
                        if (t353()) out = concat(out, OUT); else return setState(stateₒ), false;
                        OUT = out;
                        return true;
                    };
                })();
                const t351 = list({
                    mode: 7,
                    elements: [],
                });
                return function SEL() {
                    if (t350()) return true;
                    if (t351()) return true;
                    return false;
                };
            })();
            const t349 = 𝕊0('RBRACKET');
            return function SEQ() {
                let stateₒ = getState();
                let out;
                if (t347()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t348()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t349()) out = concat(out, OUT); else return setState(stateₒ), false;
                OUT = out;
                return true;
            };
        })();
        return 𝕊0_Array_memo(arg);
    };
    let 𝕊0_Array_memo;

    const 𝕊0_Element = (arg) => {
        if (!𝕊0_Element_memo) 𝕊0_Element_memo = list({
            mode: 7,
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
            const t356 = 𝕊0('DOUBLE_QUOTE');
            const t357 = zeroOrMore({
                mode: 7,
                expression: 𝕊0('CHAR'),
            });
            const t358 = 𝕊0('DOUBLE_QUOTE');
            return function SEQ() {
                let stateₒ = getState();
                let out;
                if (t356()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t357()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t358()) out = concat(out, OUT); else return setState(stateₒ), false;
                OUT = out;
                return true;
            };
        })();
        return 𝕊0_String_memo(arg);
    };
    let 𝕊0_String_memo;

    const 𝕊0_CHAR = (arg) => {
        if (!𝕊0_CHAR_memo) 𝕊0_CHAR_memo = (() => {
            const t359 = (() => {
                const t369 = (() => {
                    const t372 = function STR() {
                        if (typeof IN !== 'string') return false;
                        if (IP + 1 > IN.length) return false;
                        if (IN.charCodeAt(IP + 0) !== 92) return false;
                        IP += 1;
                        OUT = "\\";
                        return true;
                    };
                    return function NOT() {
                        let stateₒ = getState();
                        let result = !t372();
                        setState(stateₒ);
                        OUT = undefined;
                        return result;
                    };
                })();
                const t370 = (() => {
                    const t373 = function STR() {
                        if (typeof IN !== 'string') return false;
                        if (IP + 1 > IN.length) return false;
                        if (IN.charCodeAt(IP + 0) !== 34) return false;
                        IP += 1;
                        OUT = "\"";
                        return true;
                    };
                    return function NOT() {
                        let stateₒ = getState();
                        let result = !t373();
                        setState(stateₒ);
                        OUT = undefined;
                        return result;
                    };
                })();
                const t371 = (𝕊0('char'))(𝕊1);
                return function SEQ() {
                    let stateₒ = getState();
                    let out;
                    if (t369()) out = concat(out, OUT); else return setState(stateₒ), false;
                    if (t370()) out = concat(out, OUT); else return setState(stateₒ), false;
                    if (t371()) out = concat(out, OUT); else return setState(stateₒ), false;
                    OUT = out;
                    return true;
                };
            })();
            const t360 = (() => {
                const t374 = function STR() {
                    OUT = "\\\"";
                    return true;
                };
                const t375 = function STR() {
                    if (typeof IN !== 'string') return false;
                    if (IP + 1 > IN.length) return false;
                    if (IN.charCodeAt(IP + 0) !== 34) return false;
                    IP += 1;
                    OUT = undefined;
                    return true;
                };
                return function SEQ() {
                    let stateₒ = getState();
                    let out;
                    if (t374()) out = concat(out, OUT); else return setState(stateₒ), false;
                    if (t375()) out = concat(out, OUT); else return setState(stateₒ), false;
                    OUT = out;
                    return true;
                };
            })();
            const t361 = (() => {
                const t376 = function STR() {
                    OUT = "\\\\";
                    return true;
                };
                const t377 = function STR() {
                    if (typeof IN !== 'string') return false;
                    if (IP + 1 > IN.length) return false;
                    if (IN.charCodeAt(IP + 0) !== 92) return false;
                    IP += 1;
                    OUT = undefined;
                    return true;
                };
                return function SEQ() {
                    let stateₒ = getState();
                    let out;
                    if (t376()) out = concat(out, OUT); else return setState(stateₒ), false;
                    if (t377()) out = concat(out, OUT); else return setState(stateₒ), false;
                    OUT = out;
                    return true;
                };
            })();
            const t362 = (() => {
                const t378 = function STR() {
                    OUT = "\\/";
                    return true;
                };
                const t379 = function STR() {
                    if (typeof IN !== 'string') return false;
                    if (IP + 1 > IN.length) return false;
                    if (IN.charCodeAt(IP + 0) !== 47) return false;
                    IP += 1;
                    OUT = undefined;
                    return true;
                };
                return function SEQ() {
                    let stateₒ = getState();
                    let out;
                    if (t378()) out = concat(out, OUT); else return setState(stateₒ), false;
                    if (t379()) out = concat(out, OUT); else return setState(stateₒ), false;
                    OUT = out;
                    return true;
                };
            })();
            const t363 = (() => {
                const t380 = function STR() {
                    OUT = "\\b";
                    return true;
                };
                const t381 = function STR() {
                    if (typeof IN !== 'string') return false;
                    if (IP + 1 > IN.length) return false;
                    if (IN.charCodeAt(IP + 0) !== 8) return false;
                    IP += 1;
                    OUT = undefined;
                    return true;
                };
                return function SEQ() {
                    let stateₒ = getState();
                    let out;
                    if (t380()) out = concat(out, OUT); else return setState(stateₒ), false;
                    if (t381()) out = concat(out, OUT); else return setState(stateₒ), false;
                    OUT = out;
                    return true;
                };
            })();
            const t364 = (() => {
                const t382 = function STR() {
                    OUT = "\\f";
                    return true;
                };
                const t383 = function STR() {
                    if (typeof IN !== 'string') return false;
                    if (IP + 1 > IN.length) return false;
                    if (IN.charCodeAt(IP + 0) !== 12) return false;
                    IP += 1;
                    OUT = undefined;
                    return true;
                };
                return function SEQ() {
                    let stateₒ = getState();
                    let out;
                    if (t382()) out = concat(out, OUT); else return setState(stateₒ), false;
                    if (t383()) out = concat(out, OUT); else return setState(stateₒ), false;
                    OUT = out;
                    return true;
                };
            })();
            const t365 = (() => {
                const t384 = function STR() {
                    OUT = "\\n";
                    return true;
                };
                const t385 = function STR() {
                    if (typeof IN !== 'string') return false;
                    if (IP + 1 > IN.length) return false;
                    if (IN.charCodeAt(IP + 0) !== 10) return false;
                    IP += 1;
                    OUT = undefined;
                    return true;
                };
                return function SEQ() {
                    let stateₒ = getState();
                    let out;
                    if (t384()) out = concat(out, OUT); else return setState(stateₒ), false;
                    if (t385()) out = concat(out, OUT); else return setState(stateₒ), false;
                    OUT = out;
                    return true;
                };
            })();
            const t366 = (() => {
                const t386 = function STR() {
                    OUT = "\\r";
                    return true;
                };
                const t387 = function STR() {
                    if (typeof IN !== 'string') return false;
                    if (IP + 1 > IN.length) return false;
                    if (IN.charCodeAt(IP + 0) !== 13) return false;
                    IP += 1;
                    OUT = undefined;
                    return true;
                };
                return function SEQ() {
                    let stateₒ = getState();
                    let out;
                    if (t386()) out = concat(out, OUT); else return setState(stateₒ), false;
                    if (t387()) out = concat(out, OUT); else return setState(stateₒ), false;
                    OUT = out;
                    return true;
                };
            })();
            const t367 = (() => {
                const t388 = function STR() {
                    OUT = "\\t";
                    return true;
                };
                const t389 = function STR() {
                    if (typeof IN !== 'string') return false;
                    if (IP + 1 > IN.length) return false;
                    if (IN.charCodeAt(IP + 0) !== 9) return false;
                    IP += 1;
                    OUT = undefined;
                    return true;
                };
                return function SEQ() {
                    let stateₒ = getState();
                    let out;
                    if (t388()) out = concat(out, OUT); else return setState(stateₒ), false;
                    if (t389()) out = concat(out, OUT); else return setState(stateₒ), false;
                    OUT = out;
                    return true;
                };
            })();
            const t368 = (() => {
                const t390 = function STR() {
                    OUT = "\\u";
                    return true;
                };
                const t391 = (𝕊0('unicode'))(𝕊2);
                return function SEQ() {
                    let stateₒ = getState();
                    let out;
                    if (t390()) out = concat(out, OUT); else return setState(stateₒ), false;
                    if (t391()) out = concat(out, OUT); else return setState(stateₒ), false;
                    OUT = out;
                    return true;
                };
            })();
            return function SEL() {
                if (t359()) return true;
                if (t360()) return true;
                if (t361()) return true;
                if (t362()) return true;
                if (t363()) return true;
                if (t364()) return true;
                if (t365()) return true;
                if (t366()) return true;
                if (t367()) return true;
                if (t368()) return true;
                return false;
            };
        })();
        return 𝕊0_CHAR_memo(arg);
    };
    let 𝕊0_CHAR_memo;

    const 𝕊1 = (name) => {
        switch (name) {
            case 'min': return 𝕊1_min;
            case 'max': return 𝕊1_max;
            default: return undefined;
        }
    };

    const 𝕊1_min = (arg) => {
        if (!𝕊1_min_memo) 𝕊1_min_memo = function STR() {
            if (typeof IN !== 'string') return false;
            if (IP + 1 > IN.length) return false;
            if (IN.charCodeAt(IP + 0) !== 32) return false;
            IP += 1;
            OUT = " ";
            return true;
        };
        return 𝕊1_min_memo(arg);
    };
    let 𝕊1_min_memo;

    const 𝕊1_max = (arg) => {
        if (!𝕊1_max_memo) 𝕊1_max_memo = function STR() {
            if (typeof IN !== 'string') return false;
            if (IP + 1 > IN.length) return false;
            if (IN.charCodeAt(IP + 0) !== 65535) return false;
            IP += 1;
            OUT = "￿";
            return true;
        };
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
        if (!𝕊2_base_memo) 𝕊2_base_memo = function NUM() {
            if (IN !== 16 || IP !== 0) return false;
            IP += 1;
            OUT = undefined;
            return true;
        };
        return 𝕊2_base_memo(arg);
    };
    let 𝕊2_base_memo;

    const 𝕊2_minDigits = (arg) => {
        if (!𝕊2_minDigits_memo) 𝕊2_minDigits_memo = function NUM() {
            if (IN !== 4 || IP !== 0) return false;
            IP += 1;
            OUT = undefined;
            return true;
        };
        return 𝕊2_minDigits_memo(arg);
    };
    let 𝕊2_minDigits_memo;

    const 𝕊2_maxDigits = (arg) => {
        if (!𝕊2_maxDigits_memo) 𝕊2_maxDigits_memo = function NUM() {
            if (IN !== 4 || IP !== 0) return false;
            IP += 1;
            OUT = undefined;
            return true;
        };
        return 𝕊2_maxDigits_memo(arg);
    };
    let 𝕊2_maxDigits_memo;

    const 𝕊0_LBRACE = (arg) => {
        if (!𝕊0_LBRACE_memo) 𝕊0_LBRACE_memo = (() => {
            const t392 = 𝕊0('WS');
            const t393 = function STR() {
                OUT = "{";
                return true;
            };
            const t394 = 𝕊0('WS');
            return function SEQ() {
                let stateₒ = getState();
                let out;
                if (t392()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t393()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t394()) out = concat(out, OUT); else return setState(stateₒ), false;
                OUT = out;
                return true;
            };
        })();
        return 𝕊0_LBRACE_memo(arg);
    };
    let 𝕊0_LBRACE_memo;

    const 𝕊0_RBRACE = (arg) => {
        if (!𝕊0_RBRACE_memo) 𝕊0_RBRACE_memo = (() => {
            const t395 = 𝕊0('WS');
            const t396 = function STR() {
                OUT = "}";
                return true;
            };
            const t397 = 𝕊0('WS');
            return function SEQ() {
                let stateₒ = getState();
                let out;
                if (t395()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t396()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t397()) out = concat(out, OUT); else return setState(stateₒ), false;
                OUT = out;
                return true;
            };
        })();
        return 𝕊0_RBRACE_memo(arg);
    };
    let 𝕊0_RBRACE_memo;

    const 𝕊0_LBRACKET = (arg) => {
        if (!𝕊0_LBRACKET_memo) 𝕊0_LBRACKET_memo = (() => {
            const t398 = 𝕊0('WS');
            const t399 = function STR() {
                OUT = "[";
                return true;
            };
            const t400 = 𝕊0('WS');
            return function SEQ() {
                let stateₒ = getState();
                let out;
                if (t398()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t399()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t400()) out = concat(out, OUT); else return setState(stateₒ), false;
                OUT = out;
                return true;
            };
        })();
        return 𝕊0_LBRACKET_memo(arg);
    };
    let 𝕊0_LBRACKET_memo;

    const 𝕊0_RBRACKET = (arg) => {
        if (!𝕊0_RBRACKET_memo) 𝕊0_RBRACKET_memo = (() => {
            const t401 = 𝕊0('WS');
            const t402 = function STR() {
                OUT = "]";
                return true;
            };
            const t403 = 𝕊0('WS');
            return function SEQ() {
                let stateₒ = getState();
                let out;
                if (t401()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t402()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t403()) out = concat(out, OUT); else return setState(stateₒ), false;
                OUT = out;
                return true;
            };
        })();
        return 𝕊0_RBRACKET_memo(arg);
    };
    let 𝕊0_RBRACKET_memo;

    const 𝕊0_COLON = (arg) => {
        if (!𝕊0_COLON_memo) 𝕊0_COLON_memo = (() => {
            const t404 = 𝕊0('WS');
            const t405 = function STR() {
                OUT = ":";
                return true;
            };
            const t406 = 𝕊0('WS');
            return function SEQ() {
                let stateₒ = getState();
                let out;
                if (t404()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t405()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t406()) out = concat(out, OUT); else return setState(stateₒ), false;
                OUT = out;
                return true;
            };
        })();
        return 𝕊0_COLON_memo(arg);
    };
    let 𝕊0_COLON_memo;

    const 𝕊0_COMMA = (arg) => {
        if (!𝕊0_COMMA_memo) 𝕊0_COMMA_memo = (() => {
            const t407 = 𝕊0('WS');
            const t408 = function STR() {
                OUT = ",";
                return true;
            };
            const t409 = 𝕊0('WS');
            return function SEQ() {
                let stateₒ = getState();
                let out;
                if (t407()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t408()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t409()) out = concat(out, OUT); else return setState(stateₒ), false;
                OUT = out;
                return true;
            };
        })();
        return 𝕊0_COMMA_memo(arg);
    };
    let 𝕊0_COMMA_memo;

    const 𝕊0_DOUBLE_QUOTE = (arg) => {
        if (!𝕊0_DOUBLE_QUOTE_memo) 𝕊0_DOUBLE_QUOTE_memo = function STR() {
            OUT = "\"";
            return true;
        };
        return 𝕊0_DOUBLE_QUOTE_memo(arg);
    };
    let 𝕊0_DOUBLE_QUOTE_memo;

    const 𝕊0_WS = (arg) => {
        if (!𝕊0_WS_memo) 𝕊0_WS_memo = zeroOrMore({
            mode: 7,
            expression: (() => {
                const t410 = function STR() {
                    OUT = " ";
                    return true;
                };
                const t411 = function STR() {
                    OUT = "\t";
                    return true;
                };
                const t412 = function STR() {
                    OUT = "\n";
                    return true;
                };
                const t413 = function STR() {
                    OUT = "\r";
                    return true;
                };
                return function SEL() {
                    if (t410()) return true;
                    if (t411()) return true;
                    if (t412()) return true;
                    if (t413()) return true;
                    return false;
                };
            })(),
        });
        return 𝕊0_WS_memo(arg);
    };
    let 𝕊0_WS_memo;

    const 𝕊3 = createExtension𝕊3({mode: 7});

    const 𝕊4 = createExtension𝕊4({mode: 7});

    // -------------------- Compile-time constants --------------------
    𝕊1('min').constant = {value: " "};
    𝕊1('max').constant = {value: "￿"};
    𝕊2('base').constant = {value: 16};
    𝕊2('minDigits').constant = {value: 4};
    𝕊2('maxDigits').constant = {value: 4};
    𝕊0('DOUBLE_QUOTE').constant = {value: "\""};

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
