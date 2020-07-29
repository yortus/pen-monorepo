// ------------------------------ Main exports ------------------------------
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




// ------------------------------ Runtime ------------------------------
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




// ------------------------------ Extensions ------------------------------
const extensions = {
    "V:\\projects\\oss\\pen-monorepo\\packages\\core\\penc\\dist\\deps\\std.pen.js": (() => {
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
        return {char, f64};
    })(),
    "V:\\projects\\oss\\pen-monorepo\\packages\\core\\penc\\dist\\deps\\experiments.pen.js": (() => {
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
        return {unicode};
    })(),
};




// ------------------------------ PARSE ------------------------------
const parse = (() => {

    // ExtensionExpressions
    const id34 = extensions["V:\\projects\\oss\\pen-monorepo\\packages\\core\\penc\\dist\\deps\\std.pen.js"].char({mode: 6});
    const id65 = extensions["V:\\projects\\oss\\pen-monorepo\\packages\\core\\penc\\dist\\deps\\experiments.pen.js"].unicode({mode: 6});
    const id90 = extensions["V:\\projects\\oss\\pen-monorepo\\packages\\core\\penc\\dist\\deps\\std.pen.js"].f64({mode: 6});

    // SequenceExpression
    function id1() {
        let stateₒ = getState();
        let out;
        if (id2()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (id8()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (id2()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // QuantifiedExpression
    function id2() {
        let IPₒ = IP;
        let out;
        do {
            if (!id3()) break;
            if (IP === IPₒ) break;
            out = concat(out, OUT);
        } while (true);
        OUT = out;
        return true;
    }

    // SelectionExpression
    function id3() {
        if (id4()) return true;
        if (id5()) return true;
        if (id6()) return true;
        if (id7()) return true;
        return false;
    }

    // StringLiteralExpression
    function id4() {
        if (IP + 1 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 32) return false;
        IP += 1;
        OUT = undefined;
        return true;
    }
    id4.constant = {value: " "};

    // StringLiteralExpression
    function id5() {
        if (IP + 1 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 9) return false;
        IP += 1;
        OUT = undefined;
        return true;
    }
    id5.constant = {value: "\t"};

    // StringLiteralExpression
    function id6() {
        if (IP + 1 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 10) return false;
        IP += 1;
        OUT = undefined;
        return true;
    }
    id6.constant = {value: "\n"};

    // StringLiteralExpression
    function id7() {
        if (IP + 1 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 13) return false;
        IP += 1;
        OUT = undefined;
        return true;
    }
    id7.constant = {value: "\r"};

    // SelectionExpression
    function id8() {
        if (id9()) return true;
        if (id12()) return true;
        if (id15()) return true;
        if (id18()) return true;
        if (id79()) return true;
        if (id90()) return true;
        if (id24()) return true;
        return false;
    }

    // SequenceExpression
    function id9() {
        let stateₒ = getState();
        let out;
        if (id10()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (id11()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringLiteralExpression
    function id10() {
        if (IP + 5 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 102) return false;
        if (IN.charCodeAt(IP + 1) !== 97) return false;
        if (IN.charCodeAt(IP + 2) !== 108) return false;
        if (IN.charCodeAt(IP + 3) !== 115) return false;
        if (IN.charCodeAt(IP + 4) !== 101) return false;
        IP += 5;
        OUT = undefined;
        return true;
    }
    id10.constant = {value: "false"};

    // BooleanLiteralExpression
    function id11() {
        OUT = false;
        return true;
    }
    id11.constant = {value: false};

    // SequenceExpression
    function id12() {
        let stateₒ = getState();
        let out;
        if (id13()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (id14()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringLiteralExpression
    function id13() {
        if (IP + 4 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 110) return false;
        if (IN.charCodeAt(IP + 1) !== 117) return false;
        if (IN.charCodeAt(IP + 2) !== 108) return false;
        if (IN.charCodeAt(IP + 3) !== 108) return false;
        IP += 4;
        OUT = undefined;
        return true;
    }
    id13.constant = {value: "null"};

    // NullLiteralExpression
    function id14() {
        OUT = null;
        return true;
    }
    id14.constant = {value: null};

    // SequenceExpression
    function id15() {
        let stateₒ = getState();
        let out;
        if (id16()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (id17()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringLiteralExpression
    function id16() {
        if (IP + 4 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 116) return false;
        if (IN.charCodeAt(IP + 1) !== 114) return false;
        if (IN.charCodeAt(IP + 2) !== 117) return false;
        if (IN.charCodeAt(IP + 3) !== 101) return false;
        IP += 4;
        OUT = undefined;
        return true;
    }
    id16.constant = {value: "true"};

    // BooleanLiteralExpression
    function id17() {
        OUT = true;
        return true;
    }
    id17.constant = {value: true};

    // SequenceExpression
    function id18() {
        let stateₒ = getState();
        let out;
        if (id19()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (id21()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (id77()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // SequenceExpression
    function id19() {
        let stateₒ = getState();
        let out;
        if (id2()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (id20()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (id2()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringLiteralExpression
    function id20() {
        if (IP + 1 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 123) return false;
        IP += 1;
        OUT = undefined;
        return true;
    }
    id20.constant = {value: "{"};

    // SelectionExpression
    function id21() {
        if (id22()) return true;
        if (id76()) return true;
        return false;
    }

    // SequenceExpression
    function id22() {
        let stateₒ = getState();
        let out;
        if (id23()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (id72()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // FieldExpression
    function id23() {
        if (id23_memo) return id23_memo();
        id23_memo = field({
            mode: 6,
            name: id24,
            value: id69,
        });
        return id23_memo();
    }
    let id23_memo;

    // SequenceExpression
    function id24() {
        let stateₒ = getState();
        let out;
        if (id25()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (id26()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (id25()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringLiteralExpression
    function id25() {
        if (IP + 1 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 34) return false;
        IP += 1;
        OUT = undefined;
        return true;
    }
    id25.constant = {value: "\""};

    // QuantifiedExpression
    function id26() {
        let IPₒ = IP;
        let out;
        do {
            if (!id27()) break;
            if (IP === IPₒ) break;
            out = concat(out, OUT);
        } while (true);
        OUT = out;
        return true;
    }

    // SelectionExpression
    function id27() {
        if (id28()) return true;
        if (id38()) return true;
        if (id41()) return true;
        if (id44()) return true;
        if (id47()) return true;
        if (id50()) return true;
        if (id53()) return true;
        if (id56()) return true;
        if (id59()) return true;
        if (id62()) return true;
        return false;
    }

    // SequenceExpression
    function id28() {
        let stateₒ = getState();
        let out;
        if (id29()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (id31()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (id33()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // NotExpression
    function id29() {
        let stateₒ = getState();
        let result = !id30();
        setState(stateₒ);
        OUT = undefined;
        return result;
    }

    // StringLiteralExpression
    function id30() {
        if (IP + 1 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 92) return false;
        IP += 1;
        OUT = "\\";
        return true;
    }
    id30.constant = {value: "\\"};

    // NotExpression
    function id31() {
        let stateₒ = getState();
        let result = !id32();
        setState(stateₒ);
        OUT = undefined;
        return result;
    }

    // StringLiteralExpression
    function id32() {
        if (IP + 1 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 34) return false;
        IP += 1;
        OUT = "\"";
        return true;
    }
    id32.constant = {value: "\""};

    // ApplicationExpression
    function id33(arg) {
        if (id33_memo) return id33_memo(arg);
        id33_memo = id34(id35);
        return id33_memo(arg);
    }
    let id33_memo;

    // ExtensionExpression

    // ModuleExpression
    function id35(bindingName) {
        switch (bindingName) {
            case 'min': return id36;
            case 'max': return id37;
            default: return undefined;
        }
    }

    // StringLiteralExpression
    function id36() {
        if (IP + 1 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 32) return false;
        IP += 1;
        OUT = " ";
        return true;
    }
    id36.constant = {value: " "};

    // StringLiteralExpression
    function id37() {
        if (IP + 1 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 65535) return false;
        IP += 1;
        OUT = "￿";
        return true;
    }
    id37.constant = {value: "￿"};

    // SequenceExpression
    function id38() {
        let stateₒ = getState();
        let out;
        if (id39()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (id40()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringLiteralExpression
    function id39() {
        if (IP + 2 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 92) return false;
        if (IN.charCodeAt(IP + 1) !== 34) return false;
        IP += 2;
        OUT = undefined;
        return true;
    }
    id39.constant = {value: "\\\""};

    // StringLiteralExpression
    function id40() {
        OUT = "\"";
        return true;
    }
    id40.constant = {value: "\""};

    // SequenceExpression
    function id41() {
        let stateₒ = getState();
        let out;
        if (id42()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (id43()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringLiteralExpression
    function id42() {
        if (IP + 2 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 92) return false;
        if (IN.charCodeAt(IP + 1) !== 92) return false;
        IP += 2;
        OUT = undefined;
        return true;
    }
    id42.constant = {value: "\\\\"};

    // StringLiteralExpression
    function id43() {
        OUT = "\\";
        return true;
    }
    id43.constant = {value: "\\"};

    // SequenceExpression
    function id44() {
        let stateₒ = getState();
        let out;
        if (id45()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (id46()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringLiteralExpression
    function id45() {
        if (IP + 2 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 92) return false;
        if (IN.charCodeAt(IP + 1) !== 47) return false;
        IP += 2;
        OUT = undefined;
        return true;
    }
    id45.constant = {value: "\\/"};

    // StringLiteralExpression
    function id46() {
        OUT = "/";
        return true;
    }
    id46.constant = {value: "/"};

    // SequenceExpression
    function id47() {
        let stateₒ = getState();
        let out;
        if (id48()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (id49()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringLiteralExpression
    function id48() {
        if (IP + 2 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 92) return false;
        if (IN.charCodeAt(IP + 1) !== 98) return false;
        IP += 2;
        OUT = undefined;
        return true;
    }
    id48.constant = {value: "\\b"};

    // StringLiteralExpression
    function id49() {
        OUT = "\b";
        return true;
    }
    id49.constant = {value: "\b"};

    // SequenceExpression
    function id50() {
        let stateₒ = getState();
        let out;
        if (id51()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (id52()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringLiteralExpression
    function id51() {
        if (IP + 2 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 92) return false;
        if (IN.charCodeAt(IP + 1) !== 102) return false;
        IP += 2;
        OUT = undefined;
        return true;
    }
    id51.constant = {value: "\\f"};

    // StringLiteralExpression
    function id52() {
        OUT = "\f";
        return true;
    }
    id52.constant = {value: "\f"};

    // SequenceExpression
    function id53() {
        let stateₒ = getState();
        let out;
        if (id54()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (id55()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringLiteralExpression
    function id54() {
        if (IP + 2 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 92) return false;
        if (IN.charCodeAt(IP + 1) !== 110) return false;
        IP += 2;
        OUT = undefined;
        return true;
    }
    id54.constant = {value: "\\n"};

    // StringLiteralExpression
    function id55() {
        OUT = "\n";
        return true;
    }
    id55.constant = {value: "\n"};

    // SequenceExpression
    function id56() {
        let stateₒ = getState();
        let out;
        if (id57()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (id58()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringLiteralExpression
    function id57() {
        if (IP + 2 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 92) return false;
        if (IN.charCodeAt(IP + 1) !== 114) return false;
        IP += 2;
        OUT = undefined;
        return true;
    }
    id57.constant = {value: "\\r"};

    // StringLiteralExpression
    function id58() {
        OUT = "\r";
        return true;
    }
    id58.constant = {value: "\r"};

    // SequenceExpression
    function id59() {
        let stateₒ = getState();
        let out;
        if (id60()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (id61()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringLiteralExpression
    function id60() {
        if (IP + 2 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 92) return false;
        if (IN.charCodeAt(IP + 1) !== 116) return false;
        IP += 2;
        OUT = undefined;
        return true;
    }
    id60.constant = {value: "\\t"};

    // StringLiteralExpression
    function id61() {
        OUT = "\t";
        return true;
    }
    id61.constant = {value: "\t"};

    // SequenceExpression
    function id62() {
        let stateₒ = getState();
        let out;
        if (id63()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (id64()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringLiteralExpression
    function id63() {
        if (IP + 2 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 92) return false;
        if (IN.charCodeAt(IP + 1) !== 117) return false;
        IP += 2;
        OUT = undefined;
        return true;
    }
    id63.constant = {value: "\\u"};

    // ApplicationExpression
    function id64(arg) {
        if (id64_memo) return id64_memo(arg);
        id64_memo = id65(id66);
        return id64_memo(arg);
    }
    let id64_memo;

    // ExtensionExpression

    // ModuleExpression
    function id66(bindingName) {
        switch (bindingName) {
            case 'base': return id67;
            case 'minDigits': return id68;
            case 'maxDigits': return id68;
            default: return undefined;
        }
    }

    // NumericLiteralExpression
    function id67() {
        OUT = 16;
        return true;
    }
    id67.constant = {value: 16};

    // NumericLiteralExpression
    function id68() {
        OUT = 4;
        return true;
    }
    id68.constant = {value: 4};

    // SequenceExpression
    function id69() {
        let stateₒ = getState();
        let out;
        if (id70()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (id8()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // SequenceExpression
    function id70() {
        let stateₒ = getState();
        let out;
        if (id2()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (id71()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (id2()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringLiteralExpression
    function id71() {
        if (IP + 1 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 58) return false;
        IP += 1;
        OUT = undefined;
        return true;
    }
    id71.constant = {value: ":"};

    // QuantifiedExpression
    function id72() {
        let IPₒ = IP;
        let out;
        do {
            if (!id73()) break;
            if (IP === IPₒ) break;
            out = concat(out, OUT);
        } while (true);
        OUT = out;
        return true;
    }

    // SequenceExpression
    function id73() {
        let stateₒ = getState();
        let out;
        if (id74()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (id23()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // SequenceExpression
    function id74() {
        let stateₒ = getState();
        let out;
        if (id2()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (id75()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (id2()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringLiteralExpression
    function id75() {
        if (IP + 1 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 44) return false;
        IP += 1;
        OUT = undefined;
        return true;
    }
    id75.constant = {value: ","};

    // RecordExpression
    function id76() {
        if (id76_memo) return id76_memo();
        id76_memo = record({
            mode: 6,
            fields: [],
        })
        return id76_memo();
    }
    let id76_memo;

    // SequenceExpression
    function id77() {
        let stateₒ = getState();
        let out;
        if (id2()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (id78()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (id2()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringLiteralExpression
    function id78() {
        if (IP + 1 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 125) return false;
        IP += 1;
        OUT = undefined;
        return true;
    }
    id78.constant = {value: "}"};

    // SequenceExpression
    function id79() {
        let stateₒ = getState();
        let out;
        if (id80()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (id82()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (id88()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // SequenceExpression
    function id80() {
        let stateₒ = getState();
        let out;
        if (id2()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (id81()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (id2()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringLiteralExpression
    function id81() {
        if (IP + 1 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 91) return false;
        IP += 1;
        OUT = undefined;
        return true;
    }
    id81.constant = {value: "["};

    // SelectionExpression
    function id82() {
        if (id83()) return true;
        if (id87()) return true;
        return false;
    }

    // SequenceExpression
    function id83() {
        let stateₒ = getState();
        let out;
        if (id84()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (id85()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // ListExpression
    function id84() {
        if (id84_memo) return id84_memo();
        id84_memo = list({
            mode: 6,
            elements: [id8],
        })
        return id84_memo();
    }
    let id84_memo;

    // QuantifiedExpression
    function id85() {
        let IPₒ = IP;
        let out;
        do {
            if (!id86()) break;
            if (IP === IPₒ) break;
            out = concat(out, OUT);
        } while (true);
        OUT = out;
        return true;
    }

    // SequenceExpression
    function id86() {
        let stateₒ = getState();
        let out;
        if (id74()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (id84()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // ListExpression
    function id87() {
        if (id87_memo) return id87_memo();
        id87_memo = list({
            mode: 6,
            elements: [],
        })
        return id87_memo();
    }
    let id87_memo;

    // SequenceExpression
    function id88() {
        let stateₒ = getState();
        let out;
        if (id2()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (id89()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (id2()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringLiteralExpression
    function id89() {
        if (IP + 1 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 93) return false;
        IP += 1;
        OUT = undefined;
        return true;
    }
    id89.constant = {value: "]"};

    // ExtensionExpression

    return id1;
})();




// ------------------------------ PRINT ------------------------------
const print = (() => {

    // ExtensionExpressions
    const id34 = extensions["V:\\projects\\oss\\pen-monorepo\\packages\\core\\penc\\dist\\deps\\std.pen.js"].char({mode: 7});
    const id65 = extensions["V:\\projects\\oss\\pen-monorepo\\packages\\core\\penc\\dist\\deps\\experiments.pen.js"].unicode({mode: 7});
    const id90 = extensions["V:\\projects\\oss\\pen-monorepo\\packages\\core\\penc\\dist\\deps\\std.pen.js"].f64({mode: 7});

    // SequenceExpression
    function id1() {
        let stateₒ = getState();
        let out;
        if (id2()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (id8()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (id2()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // QuantifiedExpression
    function id2() {
        let IPₒ = IP;
        let out;
        do {
            if (!id3()) break;
            if (IP === IPₒ) break;
            out = concat(out, OUT);
        } while (true);
        OUT = out;
        return true;
    }

    // SelectionExpression
    function id3() {
        if (id4()) return true;
        if (id5()) return true;
        if (id6()) return true;
        if (id7()) return true;
        return false;
    }

    // StringLiteralExpression
    function id4() {
        OUT = " ";
        return true;
    }
    id4.constant = {value: " "};

    // StringLiteralExpression
    function id5() {
        OUT = "\t";
        return true;
    }
    id5.constant = {value: "\t"};

    // StringLiteralExpression
    function id6() {
        OUT = "\n";
        return true;
    }
    id6.constant = {value: "\n"};

    // StringLiteralExpression
    function id7() {
        OUT = "\r";
        return true;
    }
    id7.constant = {value: "\r"};

    // SelectionExpression
    function id8() {
        if (id9()) return true;
        if (id12()) return true;
        if (id15()) return true;
        if (id18()) return true;
        if (id79()) return true;
        if (id90()) return true;
        if (id24()) return true;
        return false;
    }

    // SequenceExpression
    function id9() {
        let stateₒ = getState();
        let out;
        if (id10()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (id11()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringLiteralExpression
    function id10() {
        OUT = "false";
        return true;
    }
    id10.constant = {value: "false"};

    // BooleanLiteralExpression
    function id11() {
        if (IN !== false || IP !== 0) return false;
        IP += 1;
        OUT = undefined;
        return true;
    }
    id11.constant = {value: false};

    // SequenceExpression
    function id12() {
        let stateₒ = getState();
        let out;
        if (id13()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (id14()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringLiteralExpression
    function id13() {
        OUT = "null";
        return true;
    }
    id13.constant = {value: "null"};

    // NullLiteralExpression
    function id14() {
        if (IN !== null || IP !== 0) return false;
        IP += 1;
        OUT = undefined;
        return true;
    }
    id14.constant = {value: null};

    // SequenceExpression
    function id15() {
        let stateₒ = getState();
        let out;
        if (id16()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (id17()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringLiteralExpression
    function id16() {
        OUT = "true";
        return true;
    }
    id16.constant = {value: "true"};

    // BooleanLiteralExpression
    function id17() {
        if (IN !== true || IP !== 0) return false;
        IP += 1;
        OUT = undefined;
        return true;
    }
    id17.constant = {value: true};

    // SequenceExpression
    function id18() {
        let stateₒ = getState();
        let out;
        if (id19()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (id21()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (id77()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // SequenceExpression
    function id19() {
        let stateₒ = getState();
        let out;
        if (id2()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (id20()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (id2()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringLiteralExpression
    function id20() {
        OUT = "{";
        return true;
    }
    id20.constant = {value: "{"};

    // SelectionExpression
    function id21() {
        if (id22()) return true;
        if (id76()) return true;
        return false;
    }

    // SequenceExpression
    function id22() {
        let stateₒ = getState();
        let out;
        if (id23()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (id72()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // FieldExpression
    function id23() {
        if (id23_memo) return id23_memo();
        id23_memo = field({
            mode: 7,
            name: id24,
            value: id69,
        });
        return id23_memo();
    }
    let id23_memo;

    // SequenceExpression
    function id24() {
        let stateₒ = getState();
        let out;
        if (id25()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (id26()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (id25()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringLiteralExpression
    function id25() {
        OUT = "\"";
        return true;
    }
    id25.constant = {value: "\""};

    // QuantifiedExpression
    function id26() {
        let IPₒ = IP;
        let out;
        do {
            if (!id27()) break;
            if (IP === IPₒ) break;
            out = concat(out, OUT);
        } while (true);
        OUT = out;
        return true;
    }

    // SelectionExpression
    function id27() {
        if (id28()) return true;
        if (id38()) return true;
        if (id41()) return true;
        if (id44()) return true;
        if (id47()) return true;
        if (id50()) return true;
        if (id53()) return true;
        if (id56()) return true;
        if (id59()) return true;
        if (id62()) return true;
        return false;
    }

    // SequenceExpression
    function id28() {
        let stateₒ = getState();
        let out;
        if (id29()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (id31()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (id33()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // NotExpression
    function id29() {
        let stateₒ = getState();
        let result = !id30();
        setState(stateₒ);
        OUT = undefined;
        return result;
    }

    // StringLiteralExpression
    function id30() {
        if (typeof IN !== 'string') return false;
        if (IP + 1 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 92) return false;
        IP += 1;
        OUT = "\\";
        return true;
    }
    id30.constant = {value: "\\"};

    // NotExpression
    function id31() {
        let stateₒ = getState();
        let result = !id32();
        setState(stateₒ);
        OUT = undefined;
        return result;
    }

    // StringLiteralExpression
    function id32() {
        if (typeof IN !== 'string') return false;
        if (IP + 1 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 34) return false;
        IP += 1;
        OUT = "\"";
        return true;
    }
    id32.constant = {value: "\""};

    // ApplicationExpression
    function id33(arg) {
        if (id33_memo) return id33_memo(arg);
        id33_memo = id34(id35);
        return id33_memo(arg);
    }
    let id33_memo;

    // ExtensionExpression

    // ModuleExpression
    function id35(bindingName) {
        switch (bindingName) {
            case 'min': return id36;
            case 'max': return id37;
            default: return undefined;
        }
    }

    // StringLiteralExpression
    function id36() {
        if (typeof IN !== 'string') return false;
        if (IP + 1 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 32) return false;
        IP += 1;
        OUT = " ";
        return true;
    }
    id36.constant = {value: " "};

    // StringLiteralExpression
    function id37() {
        if (typeof IN !== 'string') return false;
        if (IP + 1 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 65535) return false;
        IP += 1;
        OUT = "￿";
        return true;
    }
    id37.constant = {value: "￿"};

    // SequenceExpression
    function id38() {
        let stateₒ = getState();
        let out;
        if (id39()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (id40()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringLiteralExpression
    function id39() {
        OUT = "\\\"";
        return true;
    }
    id39.constant = {value: "\\\""};

    // StringLiteralExpression
    function id40() {
        if (typeof IN !== 'string') return false;
        if (IP + 1 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 34) return false;
        IP += 1;
        OUT = undefined;
        return true;
    }
    id40.constant = {value: "\""};

    // SequenceExpression
    function id41() {
        let stateₒ = getState();
        let out;
        if (id42()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (id43()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringLiteralExpression
    function id42() {
        OUT = "\\\\";
        return true;
    }
    id42.constant = {value: "\\\\"};

    // StringLiteralExpression
    function id43() {
        if (typeof IN !== 'string') return false;
        if (IP + 1 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 92) return false;
        IP += 1;
        OUT = undefined;
        return true;
    }
    id43.constant = {value: "\\"};

    // SequenceExpression
    function id44() {
        let stateₒ = getState();
        let out;
        if (id45()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (id46()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringLiteralExpression
    function id45() {
        OUT = "\\/";
        return true;
    }
    id45.constant = {value: "\\/"};

    // StringLiteralExpression
    function id46() {
        if (typeof IN !== 'string') return false;
        if (IP + 1 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 47) return false;
        IP += 1;
        OUT = undefined;
        return true;
    }
    id46.constant = {value: "/"};

    // SequenceExpression
    function id47() {
        let stateₒ = getState();
        let out;
        if (id48()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (id49()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringLiteralExpression
    function id48() {
        OUT = "\\b";
        return true;
    }
    id48.constant = {value: "\\b"};

    // StringLiteralExpression
    function id49() {
        if (typeof IN !== 'string') return false;
        if (IP + 1 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 8) return false;
        IP += 1;
        OUT = undefined;
        return true;
    }
    id49.constant = {value: "\b"};

    // SequenceExpression
    function id50() {
        let stateₒ = getState();
        let out;
        if (id51()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (id52()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringLiteralExpression
    function id51() {
        OUT = "\\f";
        return true;
    }
    id51.constant = {value: "\\f"};

    // StringLiteralExpression
    function id52() {
        if (typeof IN !== 'string') return false;
        if (IP + 1 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 12) return false;
        IP += 1;
        OUT = undefined;
        return true;
    }
    id52.constant = {value: "\f"};

    // SequenceExpression
    function id53() {
        let stateₒ = getState();
        let out;
        if (id54()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (id55()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringLiteralExpression
    function id54() {
        OUT = "\\n";
        return true;
    }
    id54.constant = {value: "\\n"};

    // StringLiteralExpression
    function id55() {
        if (typeof IN !== 'string') return false;
        if (IP + 1 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 10) return false;
        IP += 1;
        OUT = undefined;
        return true;
    }
    id55.constant = {value: "\n"};

    // SequenceExpression
    function id56() {
        let stateₒ = getState();
        let out;
        if (id57()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (id58()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringLiteralExpression
    function id57() {
        OUT = "\\r";
        return true;
    }
    id57.constant = {value: "\\r"};

    // StringLiteralExpression
    function id58() {
        if (typeof IN !== 'string') return false;
        if (IP + 1 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 13) return false;
        IP += 1;
        OUT = undefined;
        return true;
    }
    id58.constant = {value: "\r"};

    // SequenceExpression
    function id59() {
        let stateₒ = getState();
        let out;
        if (id60()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (id61()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringLiteralExpression
    function id60() {
        OUT = "\\t";
        return true;
    }
    id60.constant = {value: "\\t"};

    // StringLiteralExpression
    function id61() {
        if (typeof IN !== 'string') return false;
        if (IP + 1 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 9) return false;
        IP += 1;
        OUT = undefined;
        return true;
    }
    id61.constant = {value: "\t"};

    // SequenceExpression
    function id62() {
        let stateₒ = getState();
        let out;
        if (id63()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (id64()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringLiteralExpression
    function id63() {
        OUT = "\\u";
        return true;
    }
    id63.constant = {value: "\\u"};

    // ApplicationExpression
    function id64(arg) {
        if (id64_memo) return id64_memo(arg);
        id64_memo = id65(id66);
        return id64_memo(arg);
    }
    let id64_memo;

    // ExtensionExpression

    // ModuleExpression
    function id66(bindingName) {
        switch (bindingName) {
            case 'base': return id67;
            case 'minDigits': return id68;
            case 'maxDigits': return id68;
            default: return undefined;
        }
    }

    // NumericLiteralExpression
    function id67() {
        if (IN !== 16 || IP !== 0) return false;
        IP += 1;
        OUT = undefined;
        return true;
    }
    id67.constant = {value: 16};

    // NumericLiteralExpression
    function id68() {
        if (IN !== 4 || IP !== 0) return false;
        IP += 1;
        OUT = undefined;
        return true;
    }
    id68.constant = {value: 4};

    // SequenceExpression
    function id69() {
        let stateₒ = getState();
        let out;
        if (id70()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (id8()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // SequenceExpression
    function id70() {
        let stateₒ = getState();
        let out;
        if (id2()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (id71()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (id2()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringLiteralExpression
    function id71() {
        OUT = ":";
        return true;
    }
    id71.constant = {value: ":"};

    // QuantifiedExpression
    function id72() {
        let IPₒ = IP;
        let out;
        do {
            if (!id73()) break;
            if (IP === IPₒ) break;
            out = concat(out, OUT);
        } while (true);
        OUT = out;
        return true;
    }

    // SequenceExpression
    function id73() {
        let stateₒ = getState();
        let out;
        if (id74()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (id23()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // SequenceExpression
    function id74() {
        let stateₒ = getState();
        let out;
        if (id2()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (id75()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (id2()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringLiteralExpression
    function id75() {
        OUT = ",";
        return true;
    }
    id75.constant = {value: ","};

    // RecordExpression
    function id76() {
        if (id76_memo) return id76_memo();
        id76_memo = record({
            mode: 7,
            fields: [],
        })
        return id76_memo();
    }
    let id76_memo;

    // SequenceExpression
    function id77() {
        let stateₒ = getState();
        let out;
        if (id2()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (id78()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (id2()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringLiteralExpression
    function id78() {
        OUT = "}";
        return true;
    }
    id78.constant = {value: "}"};

    // SequenceExpression
    function id79() {
        let stateₒ = getState();
        let out;
        if (id80()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (id82()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (id88()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // SequenceExpression
    function id80() {
        let stateₒ = getState();
        let out;
        if (id2()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (id81()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (id2()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringLiteralExpression
    function id81() {
        OUT = "[";
        return true;
    }
    id81.constant = {value: "["};

    // SelectionExpression
    function id82() {
        if (id83()) return true;
        if (id87()) return true;
        return false;
    }

    // SequenceExpression
    function id83() {
        let stateₒ = getState();
        let out;
        if (id84()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (id85()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // ListExpression
    function id84() {
        if (id84_memo) return id84_memo();
        id84_memo = list({
            mode: 7,
            elements: [id8],
        })
        return id84_memo();
    }
    let id84_memo;

    // QuantifiedExpression
    function id85() {
        let IPₒ = IP;
        let out;
        do {
            if (!id86()) break;
            if (IP === IPₒ) break;
            out = concat(out, OUT);
        } while (true);
        OUT = out;
        return true;
    }

    // SequenceExpression
    function id86() {
        let stateₒ = getState();
        let out;
        if (id74()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (id84()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // ListExpression
    function id87() {
        if (id87_memo) return id87_memo();
        id87_memo = list({
            mode: 7,
            elements: [],
        })
        return id87_memo();
    }
    let id87_memo;

    // SequenceExpression
    function id88() {
        let stateₒ = getState();
        let out;
        if (id2()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (id89()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (id2()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringLiteralExpression
    function id89() {
        OUT = "]";
        return true;
    }
    id89.constant = {value: "]"};

    // ExtensionExpression

    return id1;
})();
