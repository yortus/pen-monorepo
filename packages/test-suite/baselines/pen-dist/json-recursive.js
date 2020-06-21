
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
function createMainExports(createProgram) {
    const parse = createProgram({ mode: PARSE });
    const print = createProgram({ mode: PRINT });
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
    // tslint:disable: no-bitwise
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

    // -------------------- json-recursive.pen --------------------

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
            case 'Properties': return 𝕊0_Properties;
            case 'Array': return 𝕊0_Array;
            case 'Elements': return 𝕊0_Elements;
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
            const t64 = 𝕊0('WS');
            const t65 = 𝕊0('Value');
            const t66 = 𝕊0('WS');
            return function SEQ() {
                let stateₒ = getState();
                let out;
                if (t64()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t65()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t66()) out = concat(out, OUT); else return setState(stateₒ), false;
                OUT = out;
                return true;
            }
        })();
        return 𝕊0_start_memo(arg);
    };
    let 𝕊0_start_memo;

    const 𝕊0_Value = (arg) => {
        if (!𝕊0_Value_memo) 𝕊0_Value_memo = (() => {
            const t67 = 𝕊0('False');
            const t68 = 𝕊0('Null');
            const t69 = 𝕊0('True');
            const t70 = 𝕊0('Object');
            const t71 = 𝕊0('Array');
            const t72 = 𝕊0('Number');
            const t73 = 𝕊0('String');
            return function SEL() {
                if (t67()) return true;
                if (t68()) return true;
                if (t69()) return true;
                if (t70()) return true;
                if (t71()) return true;
                if (t72()) return true;
                if (t73()) return true;
                return false;
            }
        })();
        return 𝕊0_Value_memo(arg);
    };
    let 𝕊0_Value_memo;

    const 𝕊0_False = (arg) => {
        if (!𝕊0_False_memo) 𝕊0_False_memo = (() => {
            const t74 = (() => {
                const mode76 = mode & ~2;
                const out = hasOutput(mode76) ? "false" : undefined;
                if (!hasInput(mode76)) return function STR() { OUT = out; return true; }
                return function STR() {
                    if (isPrint(mode76) && typeof IN !== 'string') return false;
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
            const t75 = booleanLiteral({mode, value: false});
            return function SEQ() {
                let stateₒ = getState();
                let out;
                if (t74()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t75()) out = concat(out, OUT); else return setState(stateₒ), false;
                OUT = out;
                return true;
            }
        })();
        return 𝕊0_False_memo(arg);
    };
    let 𝕊0_False_memo;

    const 𝕊0_Null = (arg) => {
        if (!𝕊0_Null_memo) 𝕊0_Null_memo = (() => {
            const t77 = (() => {
                const mode79 = mode & ~2;
                const out = hasOutput(mode79) ? "null" : undefined;
                if (!hasInput(mode79)) return function STR() { OUT = out; return true; }
                return function STR() {
                    if (isPrint(mode79) && typeof IN !== 'string') return false;
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
            const t78 = nullLiteral({mode});
            return function SEQ() {
                let stateₒ = getState();
                let out;
                if (t77()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t78()) out = concat(out, OUT); else return setState(stateₒ), false;
                OUT = out;
                return true;
            }
        })();
        return 𝕊0_Null_memo(arg);
    };
    let 𝕊0_Null_memo;

    const 𝕊0_True = (arg) => {
        if (!𝕊0_True_memo) 𝕊0_True_memo = (() => {
            const t80 = (() => {
                const mode82 = mode & ~2;
                const out = hasOutput(mode82) ? "true" : undefined;
                if (!hasInput(mode82)) return function STR() { OUT = out; return true; }
                return function STR() {
                    if (isPrint(mode82) && typeof IN !== 'string') return false;
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
            const t81 = booleanLiteral({mode, value: true});
            return function SEQ() {
                let stateₒ = getState();
                let out;
                if (t80()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t81()) out = concat(out, OUT); else return setState(stateₒ), false;
                OUT = out;
                return true;
            }
        })();
        return 𝕊0_True_memo(arg);
    };
    let 𝕊0_True_memo;

    const 𝕊0_Object = (arg) => {
        if (!𝕊0_Object_memo) 𝕊0_Object_memo = (() => {
            const t83 = 𝕊0('LBRACE');
            const t84 = (() => {
                const t86 = 𝕊0('Properties');
                const t87 = record({
                    mode,
                    fields: [],
                });
                return function SEL() {
                    if (t86()) return true;
                    if (t87()) return true;
                    return false;
                }
            })();
            const t85 = 𝕊0('RBRACE');
            return function SEQ() {
                let stateₒ = getState();
                let out;
                if (t83()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t84()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t85()) out = concat(out, OUT); else return setState(stateₒ), false;
                OUT = out;
                return true;
            }
        })();
        return 𝕊0_Object_memo(arg);
    };
    let 𝕊0_Object_memo;

    const 𝕊0_Properties = (arg) => {
        if (!𝕊0_Properties_memo) 𝕊0_Properties_memo = (() => {
            const t88 = field({
                mode,
                name: 𝕊0('String'),
                value: (() => {
                    const t90 = 𝕊0('COLON');
                    const t91 = 𝕊0('Value');
                    return function SEQ() {
                        let stateₒ = getState();
                        let out;
                        if (t90()) out = concat(out, OUT); else return setState(stateₒ), false;
                        if (t91()) out = concat(out, OUT); else return setState(stateₒ), false;
                        OUT = out;
                        return true;
                    }
                })(),
            });
            const t89 = zeroOrOne({
                mode,
                expression: (() => {
                    const t92 = 𝕊0('COMMA');
                    const t93 = 𝕊0('Properties');
                    return function SEQ() {
                        let stateₒ = getState();
                        let out;
                        if (t92()) out = concat(out, OUT); else return setState(stateₒ), false;
                        if (t93()) out = concat(out, OUT); else return setState(stateₒ), false;
                        OUT = out;
                        return true;
                    }
                })(),
            });
            return function SEQ() {
                let stateₒ = getState();
                let out;
                if (t88()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t89()) out = concat(out, OUT); else return setState(stateₒ), false;
                OUT = out;
                return true;
            }
        })();
        return 𝕊0_Properties_memo(arg);
    };
    let 𝕊0_Properties_memo;

    const 𝕊0_Array = (arg) => {
        if (!𝕊0_Array_memo) 𝕊0_Array_memo = (() => {
            const t94 = 𝕊0('LBRACKET');
            const t95 = (() => {
                const t97 = 𝕊0('Elements');
                const t98 = list({
                    mode,
                    elements: [],
                });
                return function SEL() {
                    if (t97()) return true;
                    if (t98()) return true;
                    return false;
                }
            })();
            const t96 = 𝕊0('RBRACKET');
            return function SEQ() {
                let stateₒ = getState();
                let out;
                if (t94()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t95()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t96()) out = concat(out, OUT); else return setState(stateₒ), false;
                OUT = out;
                return true;
            }
        })();
        return 𝕊0_Array_memo(arg);
    };
    let 𝕊0_Array_memo;

    const 𝕊0_Elements = (arg) => {
        if (!𝕊0_Elements_memo) 𝕊0_Elements_memo = (() => {
            const t99 = list({
                mode,
                elements: [
                    𝕊0('Value'),
                ],
            });
            const t100 = zeroOrOne({
                mode,
                expression: (() => {
                    const t101 = 𝕊0('COMMA');
                    const t102 = 𝕊0('Elements');
                    return function SEQ() {
                        let stateₒ = getState();
                        let out;
                        if (t101()) out = concat(out, OUT); else return setState(stateₒ), false;
                        if (t102()) out = concat(out, OUT); else return setState(stateₒ), false;
                        OUT = out;
                        return true;
                    }
                })(),
            });
            return function SEQ() {
                let stateₒ = getState();
                let out;
                if (t99()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t100()) out = concat(out, OUT); else return setState(stateₒ), false;
                OUT = out;
                return true;
            }
        })();
        return 𝕊0_Elements_memo(arg);
    };
    let 𝕊0_Elements_memo;

    const 𝕊0_Number = (arg) => {
        if (!𝕊0_Number_memo) 𝕊0_Number_memo = 𝕊0('f64');
        return 𝕊0_Number_memo(arg);
    };
    let 𝕊0_Number_memo;

    const 𝕊0_String = (arg) => {
        if (!𝕊0_String_memo) 𝕊0_String_memo = (() => {
            const t103 = 𝕊0('DOUBLE_QUOTE');
            const t104 = zeroOrMore({
                mode,
                expression: 𝕊0('CHAR'),
            });
            const t105 = 𝕊0('DOUBLE_QUOTE');
            return function SEQ() {
                let stateₒ = getState();
                let out;
                if (t103()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t104()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t105()) out = concat(out, OUT); else return setState(stateₒ), false;
                OUT = out;
                return true;
            }
        })();
        return 𝕊0_String_memo(arg);
    };
    let 𝕊0_String_memo;

    const 𝕊0_CHAR = (arg) => {
        if (!𝕊0_CHAR_memo) 𝕊0_CHAR_memo = (() => {
            const t106 = (() => {
                const t116 = not({
                    mode,
                    expression: (() => {
                        const mode119 = mode & ~0;
                        const out = hasOutput(mode119) ? "\\" : undefined;
                        if (!hasInput(mode119)) return function STR() { OUT = out; return true; }
                        return function STR() {
                            if (isPrint(mode119) && typeof IN !== 'string') return false;
                            if (IP + 1 > IN.length) return false;
                            if (IN.charCodeAt(IP + 0) !== 92) return false;
                            IP += 1;
                            OUT = out;
                            return true;
                        }
                    })(),
                });
                const t117 = not({
                    mode,
                    expression: (() => {
                        const mode120 = mode & ~0;
                        const out = hasOutput(mode120) ? "\"" : undefined;
                        if (!hasInput(mode120)) return function STR() { OUT = out; return true; }
                        return function STR() {
                            if (isPrint(mode120) && typeof IN !== 'string') return false;
                            if (IP + 1 > IN.length) return false;
                            if (IN.charCodeAt(IP + 0) !== 34) return false;
                            IP += 1;
                            OUT = out;
                            return true;
                        }
                    })(),
                });
                const t118 = (𝕊0('char'))(𝕊1);
                return function SEQ() {
                    let stateₒ = getState();
                    let out;
                    if (t116()) out = concat(out, OUT); else return setState(stateₒ), false;
                    if (t117()) out = concat(out, OUT); else return setState(stateₒ), false;
                    if (t118()) out = concat(out, OUT); else return setState(stateₒ), false;
                    OUT = out;
                    return true;
                }
            })();
            const t107 = (() => {
                const t121 = (() => {
                    const mode123 = mode & ~2;
                    const out = hasOutput(mode123) ? "\\\"" : undefined;
                    if (!hasInput(mode123)) return function STR() { OUT = out; return true; }
                    return function STR() {
                        if (isPrint(mode123) && typeof IN !== 'string') return false;
                        if (IP + 2 > IN.length) return false;
                        if (IN.charCodeAt(IP + 0) !== 92) return false;
                        if (IN.charCodeAt(IP + 1) !== 34) return false;
                        IP += 2;
                        OUT = out;
                        return true;
                    }
                })();
                const t122 = (() => {
                    const mode124 = mode & ~4;
                    const out = hasOutput(mode124) ? "\"" : undefined;
                    if (!hasInput(mode124)) return function STR() { OUT = out; return true; }
                    return function STR() {
                        if (isPrint(mode124) && typeof IN !== 'string') return false;
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
                    if (t121()) out = concat(out, OUT); else return setState(stateₒ), false;
                    if (t122()) out = concat(out, OUT); else return setState(stateₒ), false;
                    OUT = out;
                    return true;
                }
            })();
            const t108 = (() => {
                const t125 = (() => {
                    const mode127 = mode & ~2;
                    const out = hasOutput(mode127) ? "\\\\" : undefined;
                    if (!hasInput(mode127)) return function STR() { OUT = out; return true; }
                    return function STR() {
                        if (isPrint(mode127) && typeof IN !== 'string') return false;
                        if (IP + 2 > IN.length) return false;
                        if (IN.charCodeAt(IP + 0) !== 92) return false;
                        if (IN.charCodeAt(IP + 1) !== 92) return false;
                        IP += 2;
                        OUT = out;
                        return true;
                    }
                })();
                const t126 = (() => {
                    const mode128 = mode & ~4;
                    const out = hasOutput(mode128) ? "\\" : undefined;
                    if (!hasInput(mode128)) return function STR() { OUT = out; return true; }
                    return function STR() {
                        if (isPrint(mode128) && typeof IN !== 'string') return false;
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
                    if (t125()) out = concat(out, OUT); else return setState(stateₒ), false;
                    if (t126()) out = concat(out, OUT); else return setState(stateₒ), false;
                    OUT = out;
                    return true;
                }
            })();
            const t109 = (() => {
                const t129 = (() => {
                    const mode131 = mode & ~2;
                    const out = hasOutput(mode131) ? "\\/" : undefined;
                    if (!hasInput(mode131)) return function STR() { OUT = out; return true; }
                    return function STR() {
                        if (isPrint(mode131) && typeof IN !== 'string') return false;
                        if (IP + 2 > IN.length) return false;
                        if (IN.charCodeAt(IP + 0) !== 92) return false;
                        if (IN.charCodeAt(IP + 1) !== 47) return false;
                        IP += 2;
                        OUT = out;
                        return true;
                    }
                })();
                const t130 = (() => {
                    const mode132 = mode & ~4;
                    const out = hasOutput(mode132) ? "/" : undefined;
                    if (!hasInput(mode132)) return function STR() { OUT = out; return true; }
                    return function STR() {
                        if (isPrint(mode132) && typeof IN !== 'string') return false;
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
                    if (t129()) out = concat(out, OUT); else return setState(stateₒ), false;
                    if (t130()) out = concat(out, OUT); else return setState(stateₒ), false;
                    OUT = out;
                    return true;
                }
            })();
            const t110 = (() => {
                const t133 = (() => {
                    const mode135 = mode & ~2;
                    const out = hasOutput(mode135) ? "\\b" : undefined;
                    if (!hasInput(mode135)) return function STR() { OUT = out; return true; }
                    return function STR() {
                        if (isPrint(mode135) && typeof IN !== 'string') return false;
                        if (IP + 2 > IN.length) return false;
                        if (IN.charCodeAt(IP + 0) !== 92) return false;
                        if (IN.charCodeAt(IP + 1) !== 98) return false;
                        IP += 2;
                        OUT = out;
                        return true;
                    }
                })();
                const t134 = (() => {
                    const mode136 = mode & ~4;
                    const out = hasOutput(mode136) ? "\b" : undefined;
                    if (!hasInput(mode136)) return function STR() { OUT = out; return true; }
                    return function STR() {
                        if (isPrint(mode136) && typeof IN !== 'string') return false;
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
                    if (t133()) out = concat(out, OUT); else return setState(stateₒ), false;
                    if (t134()) out = concat(out, OUT); else return setState(stateₒ), false;
                    OUT = out;
                    return true;
                }
            })();
            const t111 = (() => {
                const t137 = (() => {
                    const mode139 = mode & ~2;
                    const out = hasOutput(mode139) ? "\\f" : undefined;
                    if (!hasInput(mode139)) return function STR() { OUT = out; return true; }
                    return function STR() {
                        if (isPrint(mode139) && typeof IN !== 'string') return false;
                        if (IP + 2 > IN.length) return false;
                        if (IN.charCodeAt(IP + 0) !== 92) return false;
                        if (IN.charCodeAt(IP + 1) !== 102) return false;
                        IP += 2;
                        OUT = out;
                        return true;
                    }
                })();
                const t138 = (() => {
                    const mode140 = mode & ~4;
                    const out = hasOutput(mode140) ? "\f" : undefined;
                    if (!hasInput(mode140)) return function STR() { OUT = out; return true; }
                    return function STR() {
                        if (isPrint(mode140) && typeof IN !== 'string') return false;
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
                    if (t137()) out = concat(out, OUT); else return setState(stateₒ), false;
                    if (t138()) out = concat(out, OUT); else return setState(stateₒ), false;
                    OUT = out;
                    return true;
                }
            })();
            const t112 = (() => {
                const t141 = (() => {
                    const mode143 = mode & ~2;
                    const out = hasOutput(mode143) ? "\\n" : undefined;
                    if (!hasInput(mode143)) return function STR() { OUT = out; return true; }
                    return function STR() {
                        if (isPrint(mode143) && typeof IN !== 'string') return false;
                        if (IP + 2 > IN.length) return false;
                        if (IN.charCodeAt(IP + 0) !== 92) return false;
                        if (IN.charCodeAt(IP + 1) !== 110) return false;
                        IP += 2;
                        OUT = out;
                        return true;
                    }
                })();
                const t142 = (() => {
                    const mode144 = mode & ~4;
                    const out = hasOutput(mode144) ? "\n" : undefined;
                    if (!hasInput(mode144)) return function STR() { OUT = out; return true; }
                    return function STR() {
                        if (isPrint(mode144) && typeof IN !== 'string') return false;
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
                    if (t141()) out = concat(out, OUT); else return setState(stateₒ), false;
                    if (t142()) out = concat(out, OUT); else return setState(stateₒ), false;
                    OUT = out;
                    return true;
                }
            })();
            const t113 = (() => {
                const t145 = (() => {
                    const mode147 = mode & ~2;
                    const out = hasOutput(mode147) ? "\\r" : undefined;
                    if (!hasInput(mode147)) return function STR() { OUT = out; return true; }
                    return function STR() {
                        if (isPrint(mode147) && typeof IN !== 'string') return false;
                        if (IP + 2 > IN.length) return false;
                        if (IN.charCodeAt(IP + 0) !== 92) return false;
                        if (IN.charCodeAt(IP + 1) !== 114) return false;
                        IP += 2;
                        OUT = out;
                        return true;
                    }
                })();
                const t146 = (() => {
                    const mode148 = mode & ~4;
                    const out = hasOutput(mode148) ? "\r" : undefined;
                    if (!hasInput(mode148)) return function STR() { OUT = out; return true; }
                    return function STR() {
                        if (isPrint(mode148) && typeof IN !== 'string') return false;
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
                    if (t145()) out = concat(out, OUT); else return setState(stateₒ), false;
                    if (t146()) out = concat(out, OUT); else return setState(stateₒ), false;
                    OUT = out;
                    return true;
                }
            })();
            const t114 = (() => {
                const t149 = (() => {
                    const mode151 = mode & ~2;
                    const out = hasOutput(mode151) ? "\\t" : undefined;
                    if (!hasInput(mode151)) return function STR() { OUT = out; return true; }
                    return function STR() {
                        if (isPrint(mode151) && typeof IN !== 'string') return false;
                        if (IP + 2 > IN.length) return false;
                        if (IN.charCodeAt(IP + 0) !== 92) return false;
                        if (IN.charCodeAt(IP + 1) !== 116) return false;
                        IP += 2;
                        OUT = out;
                        return true;
                    }
                })();
                const t150 = (() => {
                    const mode152 = mode & ~4;
                    const out = hasOutput(mode152) ? "\t" : undefined;
                    if (!hasInput(mode152)) return function STR() { OUT = out; return true; }
                    return function STR() {
                        if (isPrint(mode152) && typeof IN !== 'string') return false;
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
                    if (t149()) out = concat(out, OUT); else return setState(stateₒ), false;
                    if (t150()) out = concat(out, OUT); else return setState(stateₒ), false;
                    OUT = out;
                    return true;
                }
            })();
            const t115 = (() => {
                const t153 = (() => {
                    const mode155 = mode & ~2;
                    const out = hasOutput(mode155) ? "\\u" : undefined;
                    if (!hasInput(mode155)) return function STR() { OUT = out; return true; }
                    return function STR() {
                        if (isPrint(mode155) && typeof IN !== 'string') return false;
                        if (IP + 2 > IN.length) return false;
                        if (IN.charCodeAt(IP + 0) !== 92) return false;
                        if (IN.charCodeAt(IP + 1) !== 117) return false;
                        IP += 2;
                        OUT = out;
                        return true;
                    }
                })();
                const t154 = (𝕊0('unicode'))(𝕊2);
                return function SEQ() {
                    let stateₒ = getState();
                    let out;
                    if (t153()) out = concat(out, OUT); else return setState(stateₒ), false;
                    if (t154()) out = concat(out, OUT); else return setState(stateₒ), false;
                    OUT = out;
                    return true;
                }
            })();
            return function SEL() {
                if (t106()) return true;
                if (t107()) return true;
                if (t108()) return true;
                if (t109()) return true;
                if (t110()) return true;
                if (t111()) return true;
                if (t112()) return true;
                if (t113()) return true;
                if (t114()) return true;
                if (t115()) return true;
                return false;
            }
        })();
        return 𝕊0_CHAR_memo(arg);
    };
    let 𝕊0_CHAR_memo;

    const 𝕊0_LBRACE = (arg) => {
        if (!𝕊0_LBRACE_memo) 𝕊0_LBRACE_memo = (() => {
            const t156 = 𝕊0('WS');
            const t157 = (() => {
                const mode159 = mode & ~2;
                const out = hasOutput(mode159) ? "{" : undefined;
                if (!hasInput(mode159)) return function STR() { OUT = out; return true; }
                return function STR() {
                    if (isPrint(mode159) && typeof IN !== 'string') return false;
                    if (IP + 1 > IN.length) return false;
                    if (IN.charCodeAt(IP + 0) !== 123) return false;
                    IP += 1;
                    OUT = out;
                    return true;
                }
            })();
            const t158 = 𝕊0('WS');
            return function SEQ() {
                let stateₒ = getState();
                let out;
                if (t156()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t157()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t158()) out = concat(out, OUT); else return setState(stateₒ), false;
                OUT = out;
                return true;
            }
        })();
        return 𝕊0_LBRACE_memo(arg);
    };
    let 𝕊0_LBRACE_memo;

    const 𝕊0_RBRACE = (arg) => {
        if (!𝕊0_RBRACE_memo) 𝕊0_RBRACE_memo = (() => {
            const t160 = 𝕊0('WS');
            const t161 = (() => {
                const mode163 = mode & ~2;
                const out = hasOutput(mode163) ? "}" : undefined;
                if (!hasInput(mode163)) return function STR() { OUT = out; return true; }
                return function STR() {
                    if (isPrint(mode163) && typeof IN !== 'string') return false;
                    if (IP + 1 > IN.length) return false;
                    if (IN.charCodeAt(IP + 0) !== 125) return false;
                    IP += 1;
                    OUT = out;
                    return true;
                }
            })();
            const t162 = 𝕊0('WS');
            return function SEQ() {
                let stateₒ = getState();
                let out;
                if (t160()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t161()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t162()) out = concat(out, OUT); else return setState(stateₒ), false;
                OUT = out;
                return true;
            }
        })();
        return 𝕊0_RBRACE_memo(arg);
    };
    let 𝕊0_RBRACE_memo;

    const 𝕊0_LBRACKET = (arg) => {
        if (!𝕊0_LBRACKET_memo) 𝕊0_LBRACKET_memo = (() => {
            const t164 = 𝕊0('WS');
            const t165 = (() => {
                const mode167 = mode & ~2;
                const out = hasOutput(mode167) ? "[" : undefined;
                if (!hasInput(mode167)) return function STR() { OUT = out; return true; }
                return function STR() {
                    if (isPrint(mode167) && typeof IN !== 'string') return false;
                    if (IP + 1 > IN.length) return false;
                    if (IN.charCodeAt(IP + 0) !== 91) return false;
                    IP += 1;
                    OUT = out;
                    return true;
                }
            })();
            const t166 = 𝕊0('WS');
            return function SEQ() {
                let stateₒ = getState();
                let out;
                if (t164()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t165()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t166()) out = concat(out, OUT); else return setState(stateₒ), false;
                OUT = out;
                return true;
            }
        })();
        return 𝕊0_LBRACKET_memo(arg);
    };
    let 𝕊0_LBRACKET_memo;

    const 𝕊0_RBRACKET = (arg) => {
        if (!𝕊0_RBRACKET_memo) 𝕊0_RBRACKET_memo = (() => {
            const t168 = 𝕊0('WS');
            const t169 = (() => {
                const mode171 = mode & ~2;
                const out = hasOutput(mode171) ? "]" : undefined;
                if (!hasInput(mode171)) return function STR() { OUT = out; return true; }
                return function STR() {
                    if (isPrint(mode171) && typeof IN !== 'string') return false;
                    if (IP + 1 > IN.length) return false;
                    if (IN.charCodeAt(IP + 0) !== 93) return false;
                    IP += 1;
                    OUT = out;
                    return true;
                }
            })();
            const t170 = 𝕊0('WS');
            return function SEQ() {
                let stateₒ = getState();
                let out;
                if (t168()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t169()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t170()) out = concat(out, OUT); else return setState(stateₒ), false;
                OUT = out;
                return true;
            }
        })();
        return 𝕊0_RBRACKET_memo(arg);
    };
    let 𝕊0_RBRACKET_memo;

    const 𝕊0_COLON = (arg) => {
        if (!𝕊0_COLON_memo) 𝕊0_COLON_memo = (() => {
            const t172 = 𝕊0('WS');
            const t173 = (() => {
                const mode175 = mode & ~2;
                const out = hasOutput(mode175) ? ":" : undefined;
                if (!hasInput(mode175)) return function STR() { OUT = out; return true; }
                return function STR() {
                    if (isPrint(mode175) && typeof IN !== 'string') return false;
                    if (IP + 1 > IN.length) return false;
                    if (IN.charCodeAt(IP + 0) !== 58) return false;
                    IP += 1;
                    OUT = out;
                    return true;
                }
            })();
            const t174 = 𝕊0('WS');
            return function SEQ() {
                let stateₒ = getState();
                let out;
                if (t172()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t173()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t174()) out = concat(out, OUT); else return setState(stateₒ), false;
                OUT = out;
                return true;
            }
        })();
        return 𝕊0_COLON_memo(arg);
    };
    let 𝕊0_COLON_memo;

    const 𝕊0_COMMA = (arg) => {
        if (!𝕊0_COMMA_memo) 𝕊0_COMMA_memo = (() => {
            const t176 = 𝕊0('WS');
            const t177 = (() => {
                const mode179 = mode & ~2;
                const out = hasOutput(mode179) ? "," : undefined;
                if (!hasInput(mode179)) return function STR() { OUT = out; return true; }
                return function STR() {
                    if (isPrint(mode179) && typeof IN !== 'string') return false;
                    if (IP + 1 > IN.length) return false;
                    if (IN.charCodeAt(IP + 0) !== 44) return false;
                    IP += 1;
                    OUT = out;
                    return true;
                }
            })();
            const t178 = 𝕊0('WS');
            return function SEQ() {
                let stateₒ = getState();
                let out;
                if (t176()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t177()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t178()) out = concat(out, OUT); else return setState(stateₒ), false;
                OUT = out;
                return true;
            }
        })();
        return 𝕊0_COMMA_memo(arg);
    };
    let 𝕊0_COMMA_memo;

    const 𝕊0_DOUBLE_QUOTE = (arg) => {
        if (!𝕊0_DOUBLE_QUOTE_memo) 𝕊0_DOUBLE_QUOTE_memo = (() => {
            const mode180 = mode & ~2;
            const out = hasOutput(mode180) ? "\"" : undefined;
            if (!hasInput(mode180)) return function STR() { OUT = out; return true; }
            return function STR() {
                if (isPrint(mode180) && typeof IN !== 'string') return false;
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
                const t181 = (() => {
                    const mode185 = mode & ~2;
                    const out = hasOutput(mode185) ? " " : undefined;
                    if (!hasInput(mode185)) return function STR() { OUT = out; return true; }
                    return function STR() {
                        if (isPrint(mode185) && typeof IN !== 'string') return false;
                        if (IP + 1 > IN.length) return false;
                        if (IN.charCodeAt(IP + 0) !== 32) return false;
                        IP += 1;
                        OUT = out;
                        return true;
                    }
                })();
                const t182 = (() => {
                    const mode186 = mode & ~2;
                    const out = hasOutput(mode186) ? "\t" : undefined;
                    if (!hasInput(mode186)) return function STR() { OUT = out; return true; }
                    return function STR() {
                        if (isPrint(mode186) && typeof IN !== 'string') return false;
                        if (IP + 1 > IN.length) return false;
                        if (IN.charCodeAt(IP + 0) !== 9) return false;
                        IP += 1;
                        OUT = out;
                        return true;
                    }
                })();
                const t183 = (() => {
                    const mode187 = mode & ~2;
                    const out = hasOutput(mode187) ? "\n" : undefined;
                    if (!hasInput(mode187)) return function STR() { OUT = out; return true; }
                    return function STR() {
                        if (isPrint(mode187) && typeof IN !== 'string') return false;
                        if (IP + 1 > IN.length) return false;
                        if (IN.charCodeAt(IP + 0) !== 10) return false;
                        IP += 1;
                        OUT = out;
                        return true;
                    }
                })();
                const t184 = (() => {
                    const mode188 = mode & ~2;
                    const out = hasOutput(mode188) ? "\r" : undefined;
                    if (!hasInput(mode188)) return function STR() { OUT = out; return true; }
                    return function STR() {
                        if (isPrint(mode188) && typeof IN !== 'string') return false;
                        if (IP + 1 > IN.length) return false;
                        if (IN.charCodeAt(IP + 0) !== 13) return false;
                        IP += 1;
                        OUT = out;
                        return true;
                    }
                })();
                return function SEL() {
                    if (t181()) return true;
                    if (t182()) return true;
                    if (t183()) return true;
                    if (t184()) return true;
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
            const mode189 = mode & ~0;
            const out = hasOutput(mode189) ? " " : undefined;
            if (!hasInput(mode189)) return function STR() { OUT = out; return true; }
            return function STR() {
                if (isPrint(mode189) && typeof IN !== 'string') return false;
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
            const mode190 = mode & ~0;
            const out = hasOutput(mode190) ? "￿" : undefined;
            if (!hasInput(mode190)) return function STR() { OUT = out; return true; }
            return function STR() {
                if (isPrint(mode190) && typeof IN !== 'string') return false;
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

    // -------------------- json-recursive.pen --------------------

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
            case 'Properties': return 𝕊0_Properties;
            case 'Array': return 𝕊0_Array;
            case 'Elements': return 𝕊0_Elements;
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
            const t191 = 𝕊0('WS');
            const t192 = 𝕊0('Value');
            const t193 = 𝕊0('WS');
            return function SEQ() {
                let stateₒ = getState();
                let out;
                if (t191()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t192()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t193()) out = concat(out, OUT); else return setState(stateₒ), false;
                OUT = out;
                return true;
            }
        })();
        return 𝕊0_start_memo(arg);
    };
    let 𝕊0_start_memo;

    const 𝕊0_Value = (arg) => {
        if (!𝕊0_Value_memo) 𝕊0_Value_memo = (() => {
            const t194 = 𝕊0('False');
            const t195 = 𝕊0('Null');
            const t196 = 𝕊0('True');
            const t197 = 𝕊0('Object');
            const t198 = 𝕊0('Array');
            const t199 = 𝕊0('Number');
            const t200 = 𝕊0('String');
            return function SEL() {
                if (t194()) return true;
                if (t195()) return true;
                if (t196()) return true;
                if (t197()) return true;
                if (t198()) return true;
                if (t199()) return true;
                if (t200()) return true;
                return false;
            }
        })();
        return 𝕊0_Value_memo(arg);
    };
    let 𝕊0_Value_memo;

    const 𝕊0_False = (arg) => {
        if (!𝕊0_False_memo) 𝕊0_False_memo = (() => {
            const t201 = (() => {
                const mode203 = mode & ~2;
                const out = hasOutput(mode203) ? "false" : undefined;
                if (!hasInput(mode203)) return function STR() { OUT = out; return true; }
                return function STR() {
                    if (isPrint(mode203) && typeof IN !== 'string') return false;
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
            const t202 = booleanLiteral({mode, value: false});
            return function SEQ() {
                let stateₒ = getState();
                let out;
                if (t201()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t202()) out = concat(out, OUT); else return setState(stateₒ), false;
                OUT = out;
                return true;
            }
        })();
        return 𝕊0_False_memo(arg);
    };
    let 𝕊0_False_memo;

    const 𝕊0_Null = (arg) => {
        if (!𝕊0_Null_memo) 𝕊0_Null_memo = (() => {
            const t204 = (() => {
                const mode206 = mode & ~2;
                const out = hasOutput(mode206) ? "null" : undefined;
                if (!hasInput(mode206)) return function STR() { OUT = out; return true; }
                return function STR() {
                    if (isPrint(mode206) && typeof IN !== 'string') return false;
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
            const t205 = nullLiteral({mode});
            return function SEQ() {
                let stateₒ = getState();
                let out;
                if (t204()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t205()) out = concat(out, OUT); else return setState(stateₒ), false;
                OUT = out;
                return true;
            }
        })();
        return 𝕊0_Null_memo(arg);
    };
    let 𝕊0_Null_memo;

    const 𝕊0_True = (arg) => {
        if (!𝕊0_True_memo) 𝕊0_True_memo = (() => {
            const t207 = (() => {
                const mode209 = mode & ~2;
                const out = hasOutput(mode209) ? "true" : undefined;
                if (!hasInput(mode209)) return function STR() { OUT = out; return true; }
                return function STR() {
                    if (isPrint(mode209) && typeof IN !== 'string') return false;
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
            const t208 = booleanLiteral({mode, value: true});
            return function SEQ() {
                let stateₒ = getState();
                let out;
                if (t207()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t208()) out = concat(out, OUT); else return setState(stateₒ), false;
                OUT = out;
                return true;
            }
        })();
        return 𝕊0_True_memo(arg);
    };
    let 𝕊0_True_memo;

    const 𝕊0_Object = (arg) => {
        if (!𝕊0_Object_memo) 𝕊0_Object_memo = (() => {
            const t210 = 𝕊0('LBRACE');
            const t211 = (() => {
                const t213 = 𝕊0('Properties');
                const t214 = record({
                    mode,
                    fields: [],
                });
                return function SEL() {
                    if (t213()) return true;
                    if (t214()) return true;
                    return false;
                }
            })();
            const t212 = 𝕊0('RBRACE');
            return function SEQ() {
                let stateₒ = getState();
                let out;
                if (t210()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t211()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t212()) out = concat(out, OUT); else return setState(stateₒ), false;
                OUT = out;
                return true;
            }
        })();
        return 𝕊0_Object_memo(arg);
    };
    let 𝕊0_Object_memo;

    const 𝕊0_Properties = (arg) => {
        if (!𝕊0_Properties_memo) 𝕊0_Properties_memo = (() => {
            const t215 = field({
                mode,
                name: 𝕊0('String'),
                value: (() => {
                    const t217 = 𝕊0('COLON');
                    const t218 = 𝕊0('Value');
                    return function SEQ() {
                        let stateₒ = getState();
                        let out;
                        if (t217()) out = concat(out, OUT); else return setState(stateₒ), false;
                        if (t218()) out = concat(out, OUT); else return setState(stateₒ), false;
                        OUT = out;
                        return true;
                    }
                })(),
            });
            const t216 = zeroOrOne({
                mode,
                expression: (() => {
                    const t219 = 𝕊0('COMMA');
                    const t220 = 𝕊0('Properties');
                    return function SEQ() {
                        let stateₒ = getState();
                        let out;
                        if (t219()) out = concat(out, OUT); else return setState(stateₒ), false;
                        if (t220()) out = concat(out, OUT); else return setState(stateₒ), false;
                        OUT = out;
                        return true;
                    }
                })(),
            });
            return function SEQ() {
                let stateₒ = getState();
                let out;
                if (t215()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t216()) out = concat(out, OUT); else return setState(stateₒ), false;
                OUT = out;
                return true;
            }
        })();
        return 𝕊0_Properties_memo(arg);
    };
    let 𝕊0_Properties_memo;

    const 𝕊0_Array = (arg) => {
        if (!𝕊0_Array_memo) 𝕊0_Array_memo = (() => {
            const t221 = 𝕊0('LBRACKET');
            const t222 = (() => {
                const t224 = 𝕊0('Elements');
                const t225 = list({
                    mode,
                    elements: [],
                });
                return function SEL() {
                    if (t224()) return true;
                    if (t225()) return true;
                    return false;
                }
            })();
            const t223 = 𝕊0('RBRACKET');
            return function SEQ() {
                let stateₒ = getState();
                let out;
                if (t221()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t222()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t223()) out = concat(out, OUT); else return setState(stateₒ), false;
                OUT = out;
                return true;
            }
        })();
        return 𝕊0_Array_memo(arg);
    };
    let 𝕊0_Array_memo;

    const 𝕊0_Elements = (arg) => {
        if (!𝕊0_Elements_memo) 𝕊0_Elements_memo = (() => {
            const t226 = list({
                mode,
                elements: [
                    𝕊0('Value'),
                ],
            });
            const t227 = zeroOrOne({
                mode,
                expression: (() => {
                    const t228 = 𝕊0('COMMA');
                    const t229 = 𝕊0('Elements');
                    return function SEQ() {
                        let stateₒ = getState();
                        let out;
                        if (t228()) out = concat(out, OUT); else return setState(stateₒ), false;
                        if (t229()) out = concat(out, OUT); else return setState(stateₒ), false;
                        OUT = out;
                        return true;
                    }
                })(),
            });
            return function SEQ() {
                let stateₒ = getState();
                let out;
                if (t226()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t227()) out = concat(out, OUT); else return setState(stateₒ), false;
                OUT = out;
                return true;
            }
        })();
        return 𝕊0_Elements_memo(arg);
    };
    let 𝕊0_Elements_memo;

    const 𝕊0_Number = (arg) => {
        if (!𝕊0_Number_memo) 𝕊0_Number_memo = 𝕊0('f64');
        return 𝕊0_Number_memo(arg);
    };
    let 𝕊0_Number_memo;

    const 𝕊0_String = (arg) => {
        if (!𝕊0_String_memo) 𝕊0_String_memo = (() => {
            const t230 = 𝕊0('DOUBLE_QUOTE');
            const t231 = zeroOrMore({
                mode,
                expression: 𝕊0('CHAR'),
            });
            const t232 = 𝕊0('DOUBLE_QUOTE');
            return function SEQ() {
                let stateₒ = getState();
                let out;
                if (t230()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t231()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t232()) out = concat(out, OUT); else return setState(stateₒ), false;
                OUT = out;
                return true;
            }
        })();
        return 𝕊0_String_memo(arg);
    };
    let 𝕊0_String_memo;

    const 𝕊0_CHAR = (arg) => {
        if (!𝕊0_CHAR_memo) 𝕊0_CHAR_memo = (() => {
            const t233 = (() => {
                const t243 = not({
                    mode,
                    expression: (() => {
                        const mode246 = mode & ~0;
                        const out = hasOutput(mode246) ? "\\" : undefined;
                        if (!hasInput(mode246)) return function STR() { OUT = out; return true; }
                        return function STR() {
                            if (isPrint(mode246) && typeof IN !== 'string') return false;
                            if (IP + 1 > IN.length) return false;
                            if (IN.charCodeAt(IP + 0) !== 92) return false;
                            IP += 1;
                            OUT = out;
                            return true;
                        }
                    })(),
                });
                const t244 = not({
                    mode,
                    expression: (() => {
                        const mode247 = mode & ~0;
                        const out = hasOutput(mode247) ? "\"" : undefined;
                        if (!hasInput(mode247)) return function STR() { OUT = out; return true; }
                        return function STR() {
                            if (isPrint(mode247) && typeof IN !== 'string') return false;
                            if (IP + 1 > IN.length) return false;
                            if (IN.charCodeAt(IP + 0) !== 34) return false;
                            IP += 1;
                            OUT = out;
                            return true;
                        }
                    })(),
                });
                const t245 = (𝕊0('char'))(𝕊1);
                return function SEQ() {
                    let stateₒ = getState();
                    let out;
                    if (t243()) out = concat(out, OUT); else return setState(stateₒ), false;
                    if (t244()) out = concat(out, OUT); else return setState(stateₒ), false;
                    if (t245()) out = concat(out, OUT); else return setState(stateₒ), false;
                    OUT = out;
                    return true;
                }
            })();
            const t234 = (() => {
                const t248 = (() => {
                    const mode250 = mode & ~2;
                    const out = hasOutput(mode250) ? "\\\"" : undefined;
                    if (!hasInput(mode250)) return function STR() { OUT = out; return true; }
                    return function STR() {
                        if (isPrint(mode250) && typeof IN !== 'string') return false;
                        if (IP + 2 > IN.length) return false;
                        if (IN.charCodeAt(IP + 0) !== 92) return false;
                        if (IN.charCodeAt(IP + 1) !== 34) return false;
                        IP += 2;
                        OUT = out;
                        return true;
                    }
                })();
                const t249 = (() => {
                    const mode251 = mode & ~4;
                    const out = hasOutput(mode251) ? "\"" : undefined;
                    if (!hasInput(mode251)) return function STR() { OUT = out; return true; }
                    return function STR() {
                        if (isPrint(mode251) && typeof IN !== 'string') return false;
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
                    if (t248()) out = concat(out, OUT); else return setState(stateₒ), false;
                    if (t249()) out = concat(out, OUT); else return setState(stateₒ), false;
                    OUT = out;
                    return true;
                }
            })();
            const t235 = (() => {
                const t252 = (() => {
                    const mode254 = mode & ~2;
                    const out = hasOutput(mode254) ? "\\\\" : undefined;
                    if (!hasInput(mode254)) return function STR() { OUT = out; return true; }
                    return function STR() {
                        if (isPrint(mode254) && typeof IN !== 'string') return false;
                        if (IP + 2 > IN.length) return false;
                        if (IN.charCodeAt(IP + 0) !== 92) return false;
                        if (IN.charCodeAt(IP + 1) !== 92) return false;
                        IP += 2;
                        OUT = out;
                        return true;
                    }
                })();
                const t253 = (() => {
                    const mode255 = mode & ~4;
                    const out = hasOutput(mode255) ? "\\" : undefined;
                    if (!hasInput(mode255)) return function STR() { OUT = out; return true; }
                    return function STR() {
                        if (isPrint(mode255) && typeof IN !== 'string') return false;
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
                    if (t252()) out = concat(out, OUT); else return setState(stateₒ), false;
                    if (t253()) out = concat(out, OUT); else return setState(stateₒ), false;
                    OUT = out;
                    return true;
                }
            })();
            const t236 = (() => {
                const t256 = (() => {
                    const mode258 = mode & ~2;
                    const out = hasOutput(mode258) ? "\\/" : undefined;
                    if (!hasInput(mode258)) return function STR() { OUT = out; return true; }
                    return function STR() {
                        if (isPrint(mode258) && typeof IN !== 'string') return false;
                        if (IP + 2 > IN.length) return false;
                        if (IN.charCodeAt(IP + 0) !== 92) return false;
                        if (IN.charCodeAt(IP + 1) !== 47) return false;
                        IP += 2;
                        OUT = out;
                        return true;
                    }
                })();
                const t257 = (() => {
                    const mode259 = mode & ~4;
                    const out = hasOutput(mode259) ? "/" : undefined;
                    if (!hasInput(mode259)) return function STR() { OUT = out; return true; }
                    return function STR() {
                        if (isPrint(mode259) && typeof IN !== 'string') return false;
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
                    if (t256()) out = concat(out, OUT); else return setState(stateₒ), false;
                    if (t257()) out = concat(out, OUT); else return setState(stateₒ), false;
                    OUT = out;
                    return true;
                }
            })();
            const t237 = (() => {
                const t260 = (() => {
                    const mode262 = mode & ~2;
                    const out = hasOutput(mode262) ? "\\b" : undefined;
                    if (!hasInput(mode262)) return function STR() { OUT = out; return true; }
                    return function STR() {
                        if (isPrint(mode262) && typeof IN !== 'string') return false;
                        if (IP + 2 > IN.length) return false;
                        if (IN.charCodeAt(IP + 0) !== 92) return false;
                        if (IN.charCodeAt(IP + 1) !== 98) return false;
                        IP += 2;
                        OUT = out;
                        return true;
                    }
                })();
                const t261 = (() => {
                    const mode263 = mode & ~4;
                    const out = hasOutput(mode263) ? "\b" : undefined;
                    if (!hasInput(mode263)) return function STR() { OUT = out; return true; }
                    return function STR() {
                        if (isPrint(mode263) && typeof IN !== 'string') return false;
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
                    if (t260()) out = concat(out, OUT); else return setState(stateₒ), false;
                    if (t261()) out = concat(out, OUT); else return setState(stateₒ), false;
                    OUT = out;
                    return true;
                }
            })();
            const t238 = (() => {
                const t264 = (() => {
                    const mode266 = mode & ~2;
                    const out = hasOutput(mode266) ? "\\f" : undefined;
                    if (!hasInput(mode266)) return function STR() { OUT = out; return true; }
                    return function STR() {
                        if (isPrint(mode266) && typeof IN !== 'string') return false;
                        if (IP + 2 > IN.length) return false;
                        if (IN.charCodeAt(IP + 0) !== 92) return false;
                        if (IN.charCodeAt(IP + 1) !== 102) return false;
                        IP += 2;
                        OUT = out;
                        return true;
                    }
                })();
                const t265 = (() => {
                    const mode267 = mode & ~4;
                    const out = hasOutput(mode267) ? "\f" : undefined;
                    if (!hasInput(mode267)) return function STR() { OUT = out; return true; }
                    return function STR() {
                        if (isPrint(mode267) && typeof IN !== 'string') return false;
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
                    if (t264()) out = concat(out, OUT); else return setState(stateₒ), false;
                    if (t265()) out = concat(out, OUT); else return setState(stateₒ), false;
                    OUT = out;
                    return true;
                }
            })();
            const t239 = (() => {
                const t268 = (() => {
                    const mode270 = mode & ~2;
                    const out = hasOutput(mode270) ? "\\n" : undefined;
                    if (!hasInput(mode270)) return function STR() { OUT = out; return true; }
                    return function STR() {
                        if (isPrint(mode270) && typeof IN !== 'string') return false;
                        if (IP + 2 > IN.length) return false;
                        if (IN.charCodeAt(IP + 0) !== 92) return false;
                        if (IN.charCodeAt(IP + 1) !== 110) return false;
                        IP += 2;
                        OUT = out;
                        return true;
                    }
                })();
                const t269 = (() => {
                    const mode271 = mode & ~4;
                    const out = hasOutput(mode271) ? "\n" : undefined;
                    if (!hasInput(mode271)) return function STR() { OUT = out; return true; }
                    return function STR() {
                        if (isPrint(mode271) && typeof IN !== 'string') return false;
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
                    if (t268()) out = concat(out, OUT); else return setState(stateₒ), false;
                    if (t269()) out = concat(out, OUT); else return setState(stateₒ), false;
                    OUT = out;
                    return true;
                }
            })();
            const t240 = (() => {
                const t272 = (() => {
                    const mode274 = mode & ~2;
                    const out = hasOutput(mode274) ? "\\r" : undefined;
                    if (!hasInput(mode274)) return function STR() { OUT = out; return true; }
                    return function STR() {
                        if (isPrint(mode274) && typeof IN !== 'string') return false;
                        if (IP + 2 > IN.length) return false;
                        if (IN.charCodeAt(IP + 0) !== 92) return false;
                        if (IN.charCodeAt(IP + 1) !== 114) return false;
                        IP += 2;
                        OUT = out;
                        return true;
                    }
                })();
                const t273 = (() => {
                    const mode275 = mode & ~4;
                    const out = hasOutput(mode275) ? "\r" : undefined;
                    if (!hasInput(mode275)) return function STR() { OUT = out; return true; }
                    return function STR() {
                        if (isPrint(mode275) && typeof IN !== 'string') return false;
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
                    if (t272()) out = concat(out, OUT); else return setState(stateₒ), false;
                    if (t273()) out = concat(out, OUT); else return setState(stateₒ), false;
                    OUT = out;
                    return true;
                }
            })();
            const t241 = (() => {
                const t276 = (() => {
                    const mode278 = mode & ~2;
                    const out = hasOutput(mode278) ? "\\t" : undefined;
                    if (!hasInput(mode278)) return function STR() { OUT = out; return true; }
                    return function STR() {
                        if (isPrint(mode278) && typeof IN !== 'string') return false;
                        if (IP + 2 > IN.length) return false;
                        if (IN.charCodeAt(IP + 0) !== 92) return false;
                        if (IN.charCodeAt(IP + 1) !== 116) return false;
                        IP += 2;
                        OUT = out;
                        return true;
                    }
                })();
                const t277 = (() => {
                    const mode279 = mode & ~4;
                    const out = hasOutput(mode279) ? "\t" : undefined;
                    if (!hasInput(mode279)) return function STR() { OUT = out; return true; }
                    return function STR() {
                        if (isPrint(mode279) && typeof IN !== 'string') return false;
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
                    if (t276()) out = concat(out, OUT); else return setState(stateₒ), false;
                    if (t277()) out = concat(out, OUT); else return setState(stateₒ), false;
                    OUT = out;
                    return true;
                }
            })();
            const t242 = (() => {
                const t280 = (() => {
                    const mode282 = mode & ~2;
                    const out = hasOutput(mode282) ? "\\u" : undefined;
                    if (!hasInput(mode282)) return function STR() { OUT = out; return true; }
                    return function STR() {
                        if (isPrint(mode282) && typeof IN !== 'string') return false;
                        if (IP + 2 > IN.length) return false;
                        if (IN.charCodeAt(IP + 0) !== 92) return false;
                        if (IN.charCodeAt(IP + 1) !== 117) return false;
                        IP += 2;
                        OUT = out;
                        return true;
                    }
                })();
                const t281 = (𝕊0('unicode'))(𝕊2);
                return function SEQ() {
                    let stateₒ = getState();
                    let out;
                    if (t280()) out = concat(out, OUT); else return setState(stateₒ), false;
                    if (t281()) out = concat(out, OUT); else return setState(stateₒ), false;
                    OUT = out;
                    return true;
                }
            })();
            return function SEL() {
                if (t233()) return true;
                if (t234()) return true;
                if (t235()) return true;
                if (t236()) return true;
                if (t237()) return true;
                if (t238()) return true;
                if (t239()) return true;
                if (t240()) return true;
                if (t241()) return true;
                if (t242()) return true;
                return false;
            }
        })();
        return 𝕊0_CHAR_memo(arg);
    };
    let 𝕊0_CHAR_memo;

    const 𝕊0_LBRACE = (arg) => {
        if (!𝕊0_LBRACE_memo) 𝕊0_LBRACE_memo = (() => {
            const t283 = 𝕊0('WS');
            const t284 = (() => {
                const mode286 = mode & ~2;
                const out = hasOutput(mode286) ? "{" : undefined;
                if (!hasInput(mode286)) return function STR() { OUT = out; return true; }
                return function STR() {
                    if (isPrint(mode286) && typeof IN !== 'string') return false;
                    if (IP + 1 > IN.length) return false;
                    if (IN.charCodeAt(IP + 0) !== 123) return false;
                    IP += 1;
                    OUT = out;
                    return true;
                }
            })();
            const t285 = 𝕊0('WS');
            return function SEQ() {
                let stateₒ = getState();
                let out;
                if (t283()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t284()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t285()) out = concat(out, OUT); else return setState(stateₒ), false;
                OUT = out;
                return true;
            }
        })();
        return 𝕊0_LBRACE_memo(arg);
    };
    let 𝕊0_LBRACE_memo;

    const 𝕊0_RBRACE = (arg) => {
        if (!𝕊0_RBRACE_memo) 𝕊0_RBRACE_memo = (() => {
            const t287 = 𝕊0('WS');
            const t288 = (() => {
                const mode290 = mode & ~2;
                const out = hasOutput(mode290) ? "}" : undefined;
                if (!hasInput(mode290)) return function STR() { OUT = out; return true; }
                return function STR() {
                    if (isPrint(mode290) && typeof IN !== 'string') return false;
                    if (IP + 1 > IN.length) return false;
                    if (IN.charCodeAt(IP + 0) !== 125) return false;
                    IP += 1;
                    OUT = out;
                    return true;
                }
            })();
            const t289 = 𝕊0('WS');
            return function SEQ() {
                let stateₒ = getState();
                let out;
                if (t287()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t288()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t289()) out = concat(out, OUT); else return setState(stateₒ), false;
                OUT = out;
                return true;
            }
        })();
        return 𝕊0_RBRACE_memo(arg);
    };
    let 𝕊0_RBRACE_memo;

    const 𝕊0_LBRACKET = (arg) => {
        if (!𝕊0_LBRACKET_memo) 𝕊0_LBRACKET_memo = (() => {
            const t291 = 𝕊0('WS');
            const t292 = (() => {
                const mode294 = mode & ~2;
                const out = hasOutput(mode294) ? "[" : undefined;
                if (!hasInput(mode294)) return function STR() { OUT = out; return true; }
                return function STR() {
                    if (isPrint(mode294) && typeof IN !== 'string') return false;
                    if (IP + 1 > IN.length) return false;
                    if (IN.charCodeAt(IP + 0) !== 91) return false;
                    IP += 1;
                    OUT = out;
                    return true;
                }
            })();
            const t293 = 𝕊0('WS');
            return function SEQ() {
                let stateₒ = getState();
                let out;
                if (t291()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t292()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t293()) out = concat(out, OUT); else return setState(stateₒ), false;
                OUT = out;
                return true;
            }
        })();
        return 𝕊0_LBRACKET_memo(arg);
    };
    let 𝕊0_LBRACKET_memo;

    const 𝕊0_RBRACKET = (arg) => {
        if (!𝕊0_RBRACKET_memo) 𝕊0_RBRACKET_memo = (() => {
            const t295 = 𝕊0('WS');
            const t296 = (() => {
                const mode298 = mode & ~2;
                const out = hasOutput(mode298) ? "]" : undefined;
                if (!hasInput(mode298)) return function STR() { OUT = out; return true; }
                return function STR() {
                    if (isPrint(mode298) && typeof IN !== 'string') return false;
                    if (IP + 1 > IN.length) return false;
                    if (IN.charCodeAt(IP + 0) !== 93) return false;
                    IP += 1;
                    OUT = out;
                    return true;
                }
            })();
            const t297 = 𝕊0('WS');
            return function SEQ() {
                let stateₒ = getState();
                let out;
                if (t295()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t296()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t297()) out = concat(out, OUT); else return setState(stateₒ), false;
                OUT = out;
                return true;
            }
        })();
        return 𝕊0_RBRACKET_memo(arg);
    };
    let 𝕊0_RBRACKET_memo;

    const 𝕊0_COLON = (arg) => {
        if (!𝕊0_COLON_memo) 𝕊0_COLON_memo = (() => {
            const t299 = 𝕊0('WS');
            const t300 = (() => {
                const mode302 = mode & ~2;
                const out = hasOutput(mode302) ? ":" : undefined;
                if (!hasInput(mode302)) return function STR() { OUT = out; return true; }
                return function STR() {
                    if (isPrint(mode302) && typeof IN !== 'string') return false;
                    if (IP + 1 > IN.length) return false;
                    if (IN.charCodeAt(IP + 0) !== 58) return false;
                    IP += 1;
                    OUT = out;
                    return true;
                }
            })();
            const t301 = 𝕊0('WS');
            return function SEQ() {
                let stateₒ = getState();
                let out;
                if (t299()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t300()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t301()) out = concat(out, OUT); else return setState(stateₒ), false;
                OUT = out;
                return true;
            }
        })();
        return 𝕊0_COLON_memo(arg);
    };
    let 𝕊0_COLON_memo;

    const 𝕊0_COMMA = (arg) => {
        if (!𝕊0_COMMA_memo) 𝕊0_COMMA_memo = (() => {
            const t303 = 𝕊0('WS');
            const t304 = (() => {
                const mode306 = mode & ~2;
                const out = hasOutput(mode306) ? "," : undefined;
                if (!hasInput(mode306)) return function STR() { OUT = out; return true; }
                return function STR() {
                    if (isPrint(mode306) && typeof IN !== 'string') return false;
                    if (IP + 1 > IN.length) return false;
                    if (IN.charCodeAt(IP + 0) !== 44) return false;
                    IP += 1;
                    OUT = out;
                    return true;
                }
            })();
            const t305 = 𝕊0('WS');
            return function SEQ() {
                let stateₒ = getState();
                let out;
                if (t303()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t304()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t305()) out = concat(out, OUT); else return setState(stateₒ), false;
                OUT = out;
                return true;
            }
        })();
        return 𝕊0_COMMA_memo(arg);
    };
    let 𝕊0_COMMA_memo;

    const 𝕊0_DOUBLE_QUOTE = (arg) => {
        if (!𝕊0_DOUBLE_QUOTE_memo) 𝕊0_DOUBLE_QUOTE_memo = (() => {
            const mode307 = mode & ~2;
            const out = hasOutput(mode307) ? "\"" : undefined;
            if (!hasInput(mode307)) return function STR() { OUT = out; return true; }
            return function STR() {
                if (isPrint(mode307) && typeof IN !== 'string') return false;
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
                const t308 = (() => {
                    const mode312 = mode & ~2;
                    const out = hasOutput(mode312) ? " " : undefined;
                    if (!hasInput(mode312)) return function STR() { OUT = out; return true; }
                    return function STR() {
                        if (isPrint(mode312) && typeof IN !== 'string') return false;
                        if (IP + 1 > IN.length) return false;
                        if (IN.charCodeAt(IP + 0) !== 32) return false;
                        IP += 1;
                        OUT = out;
                        return true;
                    }
                })();
                const t309 = (() => {
                    const mode313 = mode & ~2;
                    const out = hasOutput(mode313) ? "\t" : undefined;
                    if (!hasInput(mode313)) return function STR() { OUT = out; return true; }
                    return function STR() {
                        if (isPrint(mode313) && typeof IN !== 'string') return false;
                        if (IP + 1 > IN.length) return false;
                        if (IN.charCodeAt(IP + 0) !== 9) return false;
                        IP += 1;
                        OUT = out;
                        return true;
                    }
                })();
                const t310 = (() => {
                    const mode314 = mode & ~2;
                    const out = hasOutput(mode314) ? "\n" : undefined;
                    if (!hasInput(mode314)) return function STR() { OUT = out; return true; }
                    return function STR() {
                        if (isPrint(mode314) && typeof IN !== 'string') return false;
                        if (IP + 1 > IN.length) return false;
                        if (IN.charCodeAt(IP + 0) !== 10) return false;
                        IP += 1;
                        OUT = out;
                        return true;
                    }
                })();
                const t311 = (() => {
                    const mode315 = mode & ~2;
                    const out = hasOutput(mode315) ? "\r" : undefined;
                    if (!hasInput(mode315)) return function STR() { OUT = out; return true; }
                    return function STR() {
                        if (isPrint(mode315) && typeof IN !== 'string') return false;
                        if (IP + 1 > IN.length) return false;
                        if (IN.charCodeAt(IP + 0) !== 13) return false;
                        IP += 1;
                        OUT = out;
                        return true;
                    }
                })();
                return function SEL() {
                    if (t308()) return true;
                    if (t309()) return true;
                    if (t310()) return true;
                    if (t311()) return true;
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
            const mode316 = mode & ~0;
            const out = hasOutput(mode316) ? " " : undefined;
            if (!hasInput(mode316)) return function STR() { OUT = out; return true; }
            return function STR() {
                if (isPrint(mode316) && typeof IN !== 'string') return false;
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
            const mode317 = mode & ~0;
            const out = hasOutput(mode317) ? "￿" : undefined;
            if (!hasInput(mode317)) return function STR() { OUT = out; return true; }
            return function STR() {
                if (isPrint(mode317) && typeof IN !== 'string') return false;
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
