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
function parseField(name, value) {
    const stateₒ = getState();
    const obj = {};
    if (!name())
        return false;
    assert(typeof OUT === 'string');
    const propName = OUT;
    if (!value())
        return setState(stateₒ), false;
    assert(OUT !== undefined);
    obj[propName] = OUT;
    OUT = obj;
    return true;
}
function printField(name, value) {
    if (objectToString.call(IN) !== '[object Object]')
        return false;
    const stateₒ = getState();
    let text;
    const propNames = Object.keys(IN);
    const propCount = propNames.length;
    assert(propCount <= 32);
    const obj = IN;
    let bitmask = IP;
    for (let i = 0; i < propCount; ++i) {
        const propName = propNames[i];
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
}
function parseList(elements) {
    const elementsLength = elements.length;
    const stateₒ = getState();
    const arr = [];
    for (let i = 0; i < elementsLength; ++i) {
        if (!elements[i]())
            return setState(stateₒ), false;
        assert(OUT !== undefined);
        arr.push(OUT);
    }
    OUT = arr;
    return true;
}
function printList(elements) {
    const elementsLength = elements.length;
    if (!Array.isArray(IN))
        return false;
    if (IP < 0 || IP + elementsLength > IN.length)
        return false;
    const stateₒ = getState();
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
}
function parseRecord(fields) {
    const stateₒ = getState();
    const obj = {};
    for (const field of fields) {
        const propName = field.name;
        if (!field.value())
            return setState(stateₒ), false;
        assert(OUT !== undefined);
        obj[propName] = OUT;
    }
    OUT = obj;
    return true;
}
function printRecord(fields) {
    if (objectToString.call(IN) !== '[object Object]')
        return false;
    const stateₒ = getState();
    let text;
    const propNames = Object.keys(IN);
    const propCount = propNames.length;
    assert(propCount <= 32);
    const obj = IN;
    let bitmask = IP;
    for (const field of fields) {
        const i = propNames.indexOf(field.name);
        if (i < 0)
            return setState(stateₒ), false;
        const propName = propNames[i];
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
function isGeneric(_x) {
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
    const type = objectToString.call(a);
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
    const type = objectToString.call(IN);
    if (type === '[object String]')
        return IP === IN.length;
    if (type === '[object Array]')
        return IP === IN.length;
    if (type === '[object Object]') {
        const keyCount = Object.keys(IN).length;
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
    "V:/projects/oss/pen-monorepo/packages/core/penc/dist/deps/std.pen.js": (() => {
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
            return function CHA_generic(expr) {
                var _a, _b, _c, _d, _e, _f;
                assert(isModule(expr));
                const min = (_c = (_b = (_a = expr('min')) === null || _a === void 0 ? void 0 : _a.constant) === null || _b === void 0 ? void 0 : _b.value) !== null && _c !== void 0 ? _c : '\u0000';
                const max = (_f = (_e = (_d = expr('max')) === null || _d === void 0 ? void 0 : _d.constant) === null || _e === void 0 ? void 0 : _e.value) !== null && _f !== void 0 ? _f : '\uFFFF';
                assert(typeof min === 'string' && min.length === 1);
                assert(typeof max === 'string' && max.length === 1);
                const checkRange = min !== '\u0000' || max !== '\uFFFF';
                if (!hasInput(mode)) {
                    assert(hasOutput(mode));
                    return function CHA() { return OUT = min, true; };
                }
                return function CHA() {
                    if (isPrint(mode) && typeof IN !== 'string')
                        return false;
                    if (IP < 0 || IP >= IN.length)
                        return false;
                    const c = IN.charAt(IP);
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
                    const stateₒ = getState();
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
                    const num = Number.parseFloat(IN.slice(stateₒ.IP, IP));
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
            return function I32_generic(expr) {
                var _a, _b, _c, _d, _e, _f;
                assert(isModule(expr));
                const base = (_c = (_b = (_a = expr('base')) === null || _a === void 0 ? void 0 : _a.constant) === null || _b === void 0 ? void 0 : _b.value) !== null && _c !== void 0 ? _c : 10;
                const signed = (_f = (_e = (_d = expr('signed')) === null || _d === void 0 ? void 0 : _d.constant) === null || _e === void 0 ? void 0 : _e.value) !== null && _f !== void 0 ? _f : true;
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
                        const stateₒ = getState();
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
                            const digitValue = DIGIT_VALUES[c];
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
                        const digits = [];
                        while (true) {
                            const d = num % base;
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
        function memoise({}) {
            return function MEM_generic(expr) {
                // TODO: investigate... need to use `text` as part of memo key? Study lifecycle/extent of each `memos` instance.
                const memos = new Map();
                return function MEM() {
                    // Check whether the memo table already has an entry for the given initial state.
                    const stateₒ = getState();
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
                            const state = getState();
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
    "V:/projects/oss/pen-monorepo/packages/core/penc/dist/deps/experiments.pen.js": (() => {
        "use strict";
        /* @pen exports = {
            unicode
        } */
        function unicode({ mode }) {
            return function UNI_generic(expr) {
                var _a, _b, _c, _d, _e, _f;
                assert(isModule(expr));
                const base = (_b = (_a = expr('base')) === null || _a === void 0 ? void 0 : _a.constant) === null || _b === void 0 ? void 0 : _b.value;
                const minDigits = (_d = (_c = expr('minDigits')) === null || _c === void 0 ? void 0 : _c.constant) === null || _d === void 0 ? void 0 : _d.value;
                const maxDigits = (_f = (_e = expr('maxDigits')) === null || _e === void 0 ? void 0 : _e.constant) === null || _f === void 0 ? void 0 : _f.value;
                assert(typeof base === 'number' && base >= 2 && base <= 36);
                assert(typeof minDigits === 'number' && minDigits >= 1 && minDigits <= 8);
                assert(typeof maxDigits === 'number' && maxDigits >= minDigits && maxDigits <= 8);
                // Construct a regex to match the digits
                const pattern = `[0-${base < 10 ? base - 1 : 9}${base > 10 ? `a-${String.fromCharCode('a'.charCodeAt(0) + base - 11)}` : ''}]`;
                const regex = RegExp(pattern, 'i');
                if (isParse(mode)) {
                    return function UNI() {
                        if (typeof IN !== 'string')
                            return false;
                        const stateₒ = getState();
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

    // Intrinsic
    const char = extensions["V:/projects/oss/pen-monorepo/packages/core/penc/dist/deps/std.pen.js"].char({mode: 6});
    const unicode = extensions["V:/projects/oss/pen-monorepo/packages/core/penc/dist/deps/experiments.pen.js"].unicode({mode: 6});
    const f64 = extensions["V:/projects/oss/pen-monorepo/packages/core/penc/dist/deps/std.pen.js"].f64({mode: 6});

    // SequenceExpression
    function start_2() {
        const stateₒ = getState();
        let out;
        if (WS()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (Value()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (WS()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // QuantifiedExpression
    function WS() {
        const IPₒ = IP;
        let out;
        do {
            if (!WS_e()) break;
            if (IP === IPₒ) break;
            out = concat(out, OUT);
        } while (true);
        OUT = out;
        return true;
    }

    // SelectionExpression
    function WS_e() {
        if (WS_e2()) return true;
        if (WS_e3()) return true;
        if (WS_e4()) return true;
        if (WS_e5()) return true;
        return false;
    }

    // StringLiteral
    function WS_e2() {
        if (IP + 1 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 32) return false;
        IP += 1;
        OUT = undefined;
        return true;
    }
    WS_e2.constant = {value: " "};

    // StringLiteral
    function WS_e3() {
        if (IP + 1 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 9) return false;
        IP += 1;
        OUT = undefined;
        return true;
    }
    WS_e3.constant = {value: "\t"};

    // StringLiteral
    function WS_e4() {
        if (IP + 1 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 10) return false;
        IP += 1;
        OUT = undefined;
        return true;
    }
    WS_e4.constant = {value: "\n"};

    // StringLiteral
    function WS_e5() {
        if (IP + 1 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 13) return false;
        IP += 1;
        OUT = undefined;
        return true;
    }
    WS_e5.constant = {value: "\r"};

    // SelectionExpression
    function Value() {
        if (False()) return true;
        if (Null()) return true;
        if (True()) return true;
        if (Object()) return true;
        if (Array()) return true;
        if (f64()) return true;
        if (String()) return true;
        return false;
    }

    // SequenceExpression
    function False() {
        const stateₒ = getState();
        let out;
        if (False_e()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (False_e2()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringLiteral
    function False_e() {
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
    False_e.constant = {value: "false"};

    // BooleanLiteral
    function False_e2() {
        OUT = false;
        return true;
    }
    False_e2.constant = {value: false};

    // SequenceExpression
    function Null() {
        const stateₒ = getState();
        let out;
        if (Null_e()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (Null_e2()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringLiteral
    function Null_e() {
        if (IP + 4 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 110) return false;
        if (IN.charCodeAt(IP + 1) !== 117) return false;
        if (IN.charCodeAt(IP + 2) !== 108) return false;
        if (IN.charCodeAt(IP + 3) !== 108) return false;
        IP += 4;
        OUT = undefined;
        return true;
    }
    Null_e.constant = {value: "null"};

    // NullLiteral
    function Null_e2() {
        OUT = null;
        return true;
    }
    Null_e2.constant = {value: null};

    // SequenceExpression
    function True() {
        const stateₒ = getState();
        let out;
        if (True_e()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (True_e2()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringLiteral
    function True_e() {
        if (IP + 4 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 116) return false;
        if (IN.charCodeAt(IP + 1) !== 114) return false;
        if (IN.charCodeAt(IP + 2) !== 117) return false;
        if (IN.charCodeAt(IP + 3) !== 101) return false;
        IP += 4;
        OUT = undefined;
        return true;
    }
    True_e.constant = {value: "true"};

    // BooleanLiteral
    function True_e2() {
        OUT = true;
        return true;
    }
    True_e2.constant = {value: true};

    // SequenceExpression
    function Object() {
        const stateₒ = getState();
        let out;
        if (LBRACE()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (Object_e()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (RBRACE()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // SequenceExpression
    function LBRACE() {
        const stateₒ = getState();
        let out;
        if (WS()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (LBRACE_e()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (WS()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringLiteral
    function LBRACE_e() {
        if (IP + 1 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 123) return false;
        IP += 1;
        OUT = undefined;
        return true;
    }
    LBRACE_e.constant = {value: "{"};

    // SelectionExpression
    function Object_e() {
        if (Object_e2()) return true;
        if (Object_e5()) return true;
        return false;
    }

    // SequenceExpression
    function Object_e2() {
        const stateₒ = getState();
        let out;
        if (Property()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (Object_e3()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // FieldExpression
    function Property() {
        return parseField(String, Property_e);
    }

    // SequenceExpression
    function String() {
        const stateₒ = getState();
        let out;
        if (DOUBLE_QUOTE()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (String_e()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (DOUBLE_QUOTE()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringLiteral
    function DOUBLE_QUOTE() {
        if (IP + 1 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 34) return false;
        IP += 1;
        OUT = undefined;
        return true;
    }
    DOUBLE_QUOTE.constant = {value: "\""};

    // QuantifiedExpression
    function String_e() {
        const IPₒ = IP;
        let out;
        do {
            if (!CHAR()) break;
            if (IP === IPₒ) break;
            out = concat(out, OUT);
        } while (true);
        OUT = out;
        return true;
    }

    // SelectionExpression
    function CHAR() {
        if (CHAR_e()) return true;
        if (CHAR_e8()) return true;
        if (CHAR_e11()) return true;
        if (CHAR_e14()) return true;
        if (CHAR_e17()) return true;
        if (CHAR_e20()) return true;
        if (CHAR_e23()) return true;
        if (CHAR_e26()) return true;
        if (CHAR_e29()) return true;
        if (CHAR_e32()) return true;
        return false;
    }

    // SequenceExpression
    function CHAR_e() {
        const stateₒ = getState();
        let out;
        if (CHAR_e2()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (CHAR_e4()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (CHAR_e6()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // NotExpression
    function CHAR_e2() {
        const stateₒ = getState();
        const result = !CHAR_e3();
        setState(stateₒ);
        OUT = undefined;
        return result;
    }

    // StringLiteral
    function CHAR_e3() {
        if (IP + 1 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 92) return false;
        IP += 1;
        OUT = "\\";
        return true;
    }
    CHAR_e3.constant = {value: "\\"};

    // NotExpression
    function CHAR_e4() {
        const stateₒ = getState();
        const result = !CHAR_e5();
        setState(stateₒ);
        OUT = undefined;
        return result;
    }

    // StringLiteral
    function CHAR_e5() {
        if (IP + 1 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 34) return false;
        IP += 1;
        OUT = "\"";
        return true;
    }
    CHAR_e5.constant = {value: "\""};

    // InstantiationExpression
    let CHAR_e6ₘ;
    function CHAR_e6(arg) {
        try {
            return CHAR_e6ₘ(arg);
        }
        catch (err) {
            if (!(err instanceof TypeError) || !err.message.includes('CHAR_e6ₘ is not a function')) throw err;
            CHAR_e6ₘ = char(CHAR_e7);
            return CHAR_e6ₘ(arg);
        }
    }

    // Intrinsic

    // Module
    function CHAR_e7(member) {
        switch (member) {
            case 'min': return min;
            case 'max': return max;
            default: return undefined;
        }
    }

    // StringLiteral
    function min() {
        if (IP + 1 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 32) return false;
        IP += 1;
        OUT = " ";
        return true;
    }
    min.constant = {value: " "};

    // StringLiteral
    function max() {
        if (IP + 1 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 65535) return false;
        IP += 1;
        OUT = "￿";
        return true;
    }
    max.constant = {value: "￿"};

    // SequenceExpression
    function CHAR_e8() {
        const stateₒ = getState();
        let out;
        if (CHAR_e9()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (CHAR_e10()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringLiteral
    function CHAR_e9() {
        if (IP + 2 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 92) return false;
        if (IN.charCodeAt(IP + 1) !== 34) return false;
        IP += 2;
        OUT = undefined;
        return true;
    }
    CHAR_e9.constant = {value: "\\\""};

    // StringLiteral
    function CHAR_e10() {
        OUT = "\"";
        return true;
    }
    CHAR_e10.constant = {value: "\""};

    // SequenceExpression
    function CHAR_e11() {
        const stateₒ = getState();
        let out;
        if (CHAR_e12()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (CHAR_e13()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringLiteral
    function CHAR_e12() {
        if (IP + 2 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 92) return false;
        if (IN.charCodeAt(IP + 1) !== 92) return false;
        IP += 2;
        OUT = undefined;
        return true;
    }
    CHAR_e12.constant = {value: "\\\\"};

    // StringLiteral
    function CHAR_e13() {
        OUT = "\\";
        return true;
    }
    CHAR_e13.constant = {value: "\\"};

    // SequenceExpression
    function CHAR_e14() {
        const stateₒ = getState();
        let out;
        if (CHAR_e15()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (CHAR_e16()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringLiteral
    function CHAR_e15() {
        if (IP + 2 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 92) return false;
        if (IN.charCodeAt(IP + 1) !== 47) return false;
        IP += 2;
        OUT = undefined;
        return true;
    }
    CHAR_e15.constant = {value: "\\/"};

    // StringLiteral
    function CHAR_e16() {
        OUT = "/";
        return true;
    }
    CHAR_e16.constant = {value: "/"};

    // SequenceExpression
    function CHAR_e17() {
        const stateₒ = getState();
        let out;
        if (CHAR_e18()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (CHAR_e19()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringLiteral
    function CHAR_e18() {
        if (IP + 2 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 92) return false;
        if (IN.charCodeAt(IP + 1) !== 98) return false;
        IP += 2;
        OUT = undefined;
        return true;
    }
    CHAR_e18.constant = {value: "\\b"};

    // StringLiteral
    function CHAR_e19() {
        OUT = "\b";
        return true;
    }
    CHAR_e19.constant = {value: "\b"};

    // SequenceExpression
    function CHAR_e20() {
        const stateₒ = getState();
        let out;
        if (CHAR_e21()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (CHAR_e22()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringLiteral
    function CHAR_e21() {
        if (IP + 2 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 92) return false;
        if (IN.charCodeAt(IP + 1) !== 102) return false;
        IP += 2;
        OUT = undefined;
        return true;
    }
    CHAR_e21.constant = {value: "\\f"};

    // StringLiteral
    function CHAR_e22() {
        OUT = "\f";
        return true;
    }
    CHAR_e22.constant = {value: "\f"};

    // SequenceExpression
    function CHAR_e23() {
        const stateₒ = getState();
        let out;
        if (CHAR_e24()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (CHAR_e25()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringLiteral
    function CHAR_e24() {
        if (IP + 2 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 92) return false;
        if (IN.charCodeAt(IP + 1) !== 110) return false;
        IP += 2;
        OUT = undefined;
        return true;
    }
    CHAR_e24.constant = {value: "\\n"};

    // StringLiteral
    function CHAR_e25() {
        OUT = "\n";
        return true;
    }
    CHAR_e25.constant = {value: "\n"};

    // SequenceExpression
    function CHAR_e26() {
        const stateₒ = getState();
        let out;
        if (CHAR_e27()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (CHAR_e28()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringLiteral
    function CHAR_e27() {
        if (IP + 2 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 92) return false;
        if (IN.charCodeAt(IP + 1) !== 114) return false;
        IP += 2;
        OUT = undefined;
        return true;
    }
    CHAR_e27.constant = {value: "\\r"};

    // StringLiteral
    function CHAR_e28() {
        OUT = "\r";
        return true;
    }
    CHAR_e28.constant = {value: "\r"};

    // SequenceExpression
    function CHAR_e29() {
        const stateₒ = getState();
        let out;
        if (CHAR_e30()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (CHAR_e31()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringLiteral
    function CHAR_e30() {
        if (IP + 2 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 92) return false;
        if (IN.charCodeAt(IP + 1) !== 116) return false;
        IP += 2;
        OUT = undefined;
        return true;
    }
    CHAR_e30.constant = {value: "\\t"};

    // StringLiteral
    function CHAR_e31() {
        OUT = "\t";
        return true;
    }
    CHAR_e31.constant = {value: "\t"};

    // SequenceExpression
    function CHAR_e32() {
        const stateₒ = getState();
        let out;
        if (CHAR_e33()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (CHAR_e34()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringLiteral
    function CHAR_e33() {
        if (IP + 2 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 92) return false;
        if (IN.charCodeAt(IP + 1) !== 117) return false;
        IP += 2;
        OUT = undefined;
        return true;
    }
    CHAR_e33.constant = {value: "\\u"};

    // InstantiationExpression
    let CHAR_e34ₘ;
    function CHAR_e34(arg) {
        try {
            return CHAR_e34ₘ(arg);
        }
        catch (err) {
            if (!(err instanceof TypeError) || !err.message.includes('CHAR_e34ₘ is not a function')) throw err;
            CHAR_e34ₘ = unicode(CHAR_e35);
            return CHAR_e34ₘ(arg);
        }
    }

    // Intrinsic

    // Module
    function CHAR_e35(member) {
        switch (member) {
            case 'base': return base;
            case 'minDigits': return minDigits;
            case 'maxDigits': return minDigits;
            default: return undefined;
        }
    }

    // NumericLiteral
    function base() {
        OUT = 16;
        return true;
    }
    base.constant = {value: 16};

    // NumericLiteral
    function minDigits() {
        OUT = 4;
        return true;
    }
    minDigits.constant = {value: 4};

    // SequenceExpression
    function Property_e() {
        const stateₒ = getState();
        let out;
        if (COLON()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (Value()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // SequenceExpression
    function COLON() {
        const stateₒ = getState();
        let out;
        if (WS()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (COLON_e()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (WS()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringLiteral
    function COLON_e() {
        if (IP + 1 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 58) return false;
        IP += 1;
        OUT = undefined;
        return true;
    }
    COLON_e.constant = {value: ":"};

    // QuantifiedExpression
    function Object_e3() {
        const IPₒ = IP;
        let out;
        do {
            if (!Object_e4()) break;
            if (IP === IPₒ) break;
            out = concat(out, OUT);
        } while (true);
        OUT = out;
        return true;
    }

    // SequenceExpression
    function Object_e4() {
        const stateₒ = getState();
        let out;
        if (COMMA()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (Property()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // SequenceExpression
    function COMMA() {
        const stateₒ = getState();
        let out;
        if (WS()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (COMMA_e()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (WS()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringLiteral
    function COMMA_e() {
        if (IP + 1 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 44) return false;
        IP += 1;
        OUT = undefined;
        return true;
    }
    COMMA_e.constant = {value: ","};

    // RecordExpression
    function Object_e5() {
        return parseRecord([]);
    }

    // SequenceExpression
    function RBRACE() {
        const stateₒ = getState();
        let out;
        if (WS()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (RBRACE_e()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (WS()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringLiteral
    function RBRACE_e() {
        if (IP + 1 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 125) return false;
        IP += 1;
        OUT = undefined;
        return true;
    }
    RBRACE_e.constant = {value: "}"};

    // SequenceExpression
    function Array() {
        const stateₒ = getState();
        let out;
        if (LBRACKET()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (Array_e()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (RBRACKET()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // SequenceExpression
    function LBRACKET() {
        const stateₒ = getState();
        let out;
        if (WS()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (LBRACKET_e()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (WS()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringLiteral
    function LBRACKET_e() {
        if (IP + 1 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 91) return false;
        IP += 1;
        OUT = undefined;
        return true;
    }
    LBRACKET_e.constant = {value: "["};

    // SelectionExpression
    function Array_e() {
        if (Array_e2()) return true;
        if (Array_e5()) return true;
        return false;
    }

    // SequenceExpression
    function Array_e2() {
        const stateₒ = getState();
        let out;
        if (Element()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (Array_e3()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // ListExpression
    function Element() {
        return parseList([Value]);
    }

    // QuantifiedExpression
    function Array_e3() {
        const IPₒ = IP;
        let out;
        do {
            if (!Array_e4()) break;
            if (IP === IPₒ) break;
            out = concat(out, OUT);
        } while (true);
        OUT = out;
        return true;
    }

    // SequenceExpression
    function Array_e4() {
        const stateₒ = getState();
        let out;
        if (COMMA()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (Element()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // ListExpression
    function Array_e5() {
        return parseList([]);
    }

    // SequenceExpression
    function RBRACKET() {
        const stateₒ = getState();
        let out;
        if (WS()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (RBRACKET_e()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (WS()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringLiteral
    function RBRACKET_e() {
        if (IP + 1 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 93) return false;
        IP += 1;
        OUT = undefined;
        return true;
    }
    RBRACKET_e.constant = {value: "]"};

    // Intrinsic

    return start_2;
})();




// ------------------------------ PRINT ------------------------------
const print = (() => {

    // Intrinsic
    const char = extensions["V:/projects/oss/pen-monorepo/packages/core/penc/dist/deps/std.pen.js"].char({mode: 7});
    const unicode = extensions["V:/projects/oss/pen-monorepo/packages/core/penc/dist/deps/experiments.pen.js"].unicode({mode: 7});
    const f64 = extensions["V:/projects/oss/pen-monorepo/packages/core/penc/dist/deps/std.pen.js"].f64({mode: 7});

    // SequenceExpression
    function start_2() {
        const stateₒ = getState();
        let out;
        if (WS()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (Value()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (WS()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // QuantifiedExpression
    function WS() {
        const IPₒ = IP;
        let out;
        do {
            if (!WS_e()) break;
            if (IP === IPₒ) break;
            out = concat(out, OUT);
        } while (true);
        OUT = out;
        return true;
    }

    // SelectionExpression
    function WS_e() {
        if (WS_e2()) return true;
        if (WS_e3()) return true;
        if (WS_e4()) return true;
        if (WS_e5()) return true;
        return false;
    }

    // StringLiteral
    function WS_e2() {
        OUT = " ";
        return true;
    }
    WS_e2.constant = {value: " "};

    // StringLiteral
    function WS_e3() {
        OUT = "\t";
        return true;
    }
    WS_e3.constant = {value: "\t"};

    // StringLiteral
    function WS_e4() {
        OUT = "\n";
        return true;
    }
    WS_e4.constant = {value: "\n"};

    // StringLiteral
    function WS_e5() {
        OUT = "\r";
        return true;
    }
    WS_e5.constant = {value: "\r"};

    // SelectionExpression
    function Value() {
        if (False()) return true;
        if (Null()) return true;
        if (True()) return true;
        if (Object()) return true;
        if (Array()) return true;
        if (f64()) return true;
        if (String()) return true;
        return false;
    }

    // SequenceExpression
    function False() {
        const stateₒ = getState();
        let out;
        if (False_e()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (False_e2()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringLiteral
    function False_e() {
        OUT = "false";
        return true;
    }
    False_e.constant = {value: "false"};

    // BooleanLiteral
    function False_e2() {
        if (IN !== false || IP !== 0) return false;
        IP += 1;
        OUT = undefined;
        return true;
    }
    False_e2.constant = {value: false};

    // SequenceExpression
    function Null() {
        const stateₒ = getState();
        let out;
        if (Null_e()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (Null_e2()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringLiteral
    function Null_e() {
        OUT = "null";
        return true;
    }
    Null_e.constant = {value: "null"};

    // NullLiteral
    function Null_e2() {
        if (IN !== null || IP !== 0) return false;
        IP += 1;
        OUT = undefined;
        return true;
    }
    Null_e2.constant = {value: null};

    // SequenceExpression
    function True() {
        const stateₒ = getState();
        let out;
        if (True_e()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (True_e2()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringLiteral
    function True_e() {
        OUT = "true";
        return true;
    }
    True_e.constant = {value: "true"};

    // BooleanLiteral
    function True_e2() {
        if (IN !== true || IP !== 0) return false;
        IP += 1;
        OUT = undefined;
        return true;
    }
    True_e2.constant = {value: true};

    // SequenceExpression
    function Object() {
        const stateₒ = getState();
        let out;
        if (LBRACE()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (Object_e()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (RBRACE()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // SequenceExpression
    function LBRACE() {
        const stateₒ = getState();
        let out;
        if (WS()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (LBRACE_e()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (WS()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringLiteral
    function LBRACE_e() {
        OUT = "{";
        return true;
    }
    LBRACE_e.constant = {value: "{"};

    // SelectionExpression
    function Object_e() {
        if (Object_e2()) return true;
        if (Object_e5()) return true;
        return false;
    }

    // SequenceExpression
    function Object_e2() {
        const stateₒ = getState();
        let out;
        if (Property()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (Object_e3()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // FieldExpression
    function Property() {
        return printField(String, Property_e);
    }

    // SequenceExpression
    function String() {
        const stateₒ = getState();
        let out;
        if (DOUBLE_QUOTE()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (String_e()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (DOUBLE_QUOTE()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringLiteral
    function DOUBLE_QUOTE() {
        OUT = "\"";
        return true;
    }
    DOUBLE_QUOTE.constant = {value: "\""};

    // QuantifiedExpression
    function String_e() {
        const IPₒ = IP;
        let out;
        do {
            if (!CHAR()) break;
            if (IP === IPₒ) break;
            out = concat(out, OUT);
        } while (true);
        OUT = out;
        return true;
    }

    // SelectionExpression
    function CHAR() {
        if (CHAR_e()) return true;
        if (CHAR_e8()) return true;
        if (CHAR_e11()) return true;
        if (CHAR_e14()) return true;
        if (CHAR_e17()) return true;
        if (CHAR_e20()) return true;
        if (CHAR_e23()) return true;
        if (CHAR_e26()) return true;
        if (CHAR_e29()) return true;
        if (CHAR_e32()) return true;
        return false;
    }

    // SequenceExpression
    function CHAR_e() {
        const stateₒ = getState();
        let out;
        if (CHAR_e2()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (CHAR_e4()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (CHAR_e6()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // NotExpression
    function CHAR_e2() {
        const stateₒ = getState();
        const result = !CHAR_e3();
        setState(stateₒ);
        OUT = undefined;
        return result;
    }

    // StringLiteral
    function CHAR_e3() {
        if (typeof IN !== 'string') return false;
        if (IP + 1 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 92) return false;
        IP += 1;
        OUT = "\\";
        return true;
    }
    CHAR_e3.constant = {value: "\\"};

    // NotExpression
    function CHAR_e4() {
        const stateₒ = getState();
        const result = !CHAR_e5();
        setState(stateₒ);
        OUT = undefined;
        return result;
    }

    // StringLiteral
    function CHAR_e5() {
        if (typeof IN !== 'string') return false;
        if (IP + 1 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 34) return false;
        IP += 1;
        OUT = "\"";
        return true;
    }
    CHAR_e5.constant = {value: "\""};

    // InstantiationExpression
    let CHAR_e6ₘ;
    function CHAR_e6(arg) {
        try {
            return CHAR_e6ₘ(arg);
        }
        catch (err) {
            if (!(err instanceof TypeError) || !err.message.includes('CHAR_e6ₘ is not a function')) throw err;
            CHAR_e6ₘ = char(CHAR_e7);
            return CHAR_e6ₘ(arg);
        }
    }

    // Intrinsic

    // Module
    function CHAR_e7(member) {
        switch (member) {
            case 'min': return min;
            case 'max': return max;
            default: return undefined;
        }
    }

    // StringLiteral
    function min() {
        if (typeof IN !== 'string') return false;
        if (IP + 1 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 32) return false;
        IP += 1;
        OUT = " ";
        return true;
    }
    min.constant = {value: " "};

    // StringLiteral
    function max() {
        if (typeof IN !== 'string') return false;
        if (IP + 1 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 65535) return false;
        IP += 1;
        OUT = "￿";
        return true;
    }
    max.constant = {value: "￿"};

    // SequenceExpression
    function CHAR_e8() {
        const stateₒ = getState();
        let out;
        if (CHAR_e9()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (CHAR_e10()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringLiteral
    function CHAR_e9() {
        OUT = "\\\"";
        return true;
    }
    CHAR_e9.constant = {value: "\\\""};

    // StringLiteral
    function CHAR_e10() {
        if (typeof IN !== 'string') return false;
        if (IP + 1 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 34) return false;
        IP += 1;
        OUT = undefined;
        return true;
    }
    CHAR_e10.constant = {value: "\""};

    // SequenceExpression
    function CHAR_e11() {
        const stateₒ = getState();
        let out;
        if (CHAR_e12()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (CHAR_e13()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringLiteral
    function CHAR_e12() {
        OUT = "\\\\";
        return true;
    }
    CHAR_e12.constant = {value: "\\\\"};

    // StringLiteral
    function CHAR_e13() {
        if (typeof IN !== 'string') return false;
        if (IP + 1 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 92) return false;
        IP += 1;
        OUT = undefined;
        return true;
    }
    CHAR_e13.constant = {value: "\\"};

    // SequenceExpression
    function CHAR_e14() {
        const stateₒ = getState();
        let out;
        if (CHAR_e15()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (CHAR_e16()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringLiteral
    function CHAR_e15() {
        OUT = "\\/";
        return true;
    }
    CHAR_e15.constant = {value: "\\/"};

    // StringLiteral
    function CHAR_e16() {
        if (typeof IN !== 'string') return false;
        if (IP + 1 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 47) return false;
        IP += 1;
        OUT = undefined;
        return true;
    }
    CHAR_e16.constant = {value: "/"};

    // SequenceExpression
    function CHAR_e17() {
        const stateₒ = getState();
        let out;
        if (CHAR_e18()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (CHAR_e19()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringLiteral
    function CHAR_e18() {
        OUT = "\\b";
        return true;
    }
    CHAR_e18.constant = {value: "\\b"};

    // StringLiteral
    function CHAR_e19() {
        if (typeof IN !== 'string') return false;
        if (IP + 1 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 8) return false;
        IP += 1;
        OUT = undefined;
        return true;
    }
    CHAR_e19.constant = {value: "\b"};

    // SequenceExpression
    function CHAR_e20() {
        const stateₒ = getState();
        let out;
        if (CHAR_e21()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (CHAR_e22()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringLiteral
    function CHAR_e21() {
        OUT = "\\f";
        return true;
    }
    CHAR_e21.constant = {value: "\\f"};

    // StringLiteral
    function CHAR_e22() {
        if (typeof IN !== 'string') return false;
        if (IP + 1 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 12) return false;
        IP += 1;
        OUT = undefined;
        return true;
    }
    CHAR_e22.constant = {value: "\f"};

    // SequenceExpression
    function CHAR_e23() {
        const stateₒ = getState();
        let out;
        if (CHAR_e24()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (CHAR_e25()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringLiteral
    function CHAR_e24() {
        OUT = "\\n";
        return true;
    }
    CHAR_e24.constant = {value: "\\n"};

    // StringLiteral
    function CHAR_e25() {
        if (typeof IN !== 'string') return false;
        if (IP + 1 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 10) return false;
        IP += 1;
        OUT = undefined;
        return true;
    }
    CHAR_e25.constant = {value: "\n"};

    // SequenceExpression
    function CHAR_e26() {
        const stateₒ = getState();
        let out;
        if (CHAR_e27()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (CHAR_e28()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringLiteral
    function CHAR_e27() {
        OUT = "\\r";
        return true;
    }
    CHAR_e27.constant = {value: "\\r"};

    // StringLiteral
    function CHAR_e28() {
        if (typeof IN !== 'string') return false;
        if (IP + 1 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 13) return false;
        IP += 1;
        OUT = undefined;
        return true;
    }
    CHAR_e28.constant = {value: "\r"};

    // SequenceExpression
    function CHAR_e29() {
        const stateₒ = getState();
        let out;
        if (CHAR_e30()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (CHAR_e31()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringLiteral
    function CHAR_e30() {
        OUT = "\\t";
        return true;
    }
    CHAR_e30.constant = {value: "\\t"};

    // StringLiteral
    function CHAR_e31() {
        if (typeof IN !== 'string') return false;
        if (IP + 1 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 9) return false;
        IP += 1;
        OUT = undefined;
        return true;
    }
    CHAR_e31.constant = {value: "\t"};

    // SequenceExpression
    function CHAR_e32() {
        const stateₒ = getState();
        let out;
        if (CHAR_e33()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (CHAR_e34()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringLiteral
    function CHAR_e33() {
        OUT = "\\u";
        return true;
    }
    CHAR_e33.constant = {value: "\\u"};

    // InstantiationExpression
    let CHAR_e34ₘ;
    function CHAR_e34(arg) {
        try {
            return CHAR_e34ₘ(arg);
        }
        catch (err) {
            if (!(err instanceof TypeError) || !err.message.includes('CHAR_e34ₘ is not a function')) throw err;
            CHAR_e34ₘ = unicode(CHAR_e35);
            return CHAR_e34ₘ(arg);
        }
    }

    // Intrinsic

    // Module
    function CHAR_e35(member) {
        switch (member) {
            case 'base': return base;
            case 'minDigits': return minDigits;
            case 'maxDigits': return minDigits;
            default: return undefined;
        }
    }

    // NumericLiteral
    function base() {
        if (IN !== 16 || IP !== 0) return false;
        IP += 1;
        OUT = undefined;
        return true;
    }
    base.constant = {value: 16};

    // NumericLiteral
    function minDigits() {
        if (IN !== 4 || IP !== 0) return false;
        IP += 1;
        OUT = undefined;
        return true;
    }
    minDigits.constant = {value: 4};

    // SequenceExpression
    function Property_e() {
        const stateₒ = getState();
        let out;
        if (COLON()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (Value()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // SequenceExpression
    function COLON() {
        const stateₒ = getState();
        let out;
        if (WS()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (COLON_e()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (WS()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringLiteral
    function COLON_e() {
        OUT = ":";
        return true;
    }
    COLON_e.constant = {value: ":"};

    // QuantifiedExpression
    function Object_e3() {
        const IPₒ = IP;
        let out;
        do {
            if (!Object_e4()) break;
            if (IP === IPₒ) break;
            out = concat(out, OUT);
        } while (true);
        OUT = out;
        return true;
    }

    // SequenceExpression
    function Object_e4() {
        const stateₒ = getState();
        let out;
        if (COMMA()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (Property()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // SequenceExpression
    function COMMA() {
        const stateₒ = getState();
        let out;
        if (WS()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (COMMA_e()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (WS()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringLiteral
    function COMMA_e() {
        OUT = ",";
        return true;
    }
    COMMA_e.constant = {value: ","};

    // RecordExpression
    function Object_e5() {
        return printRecord([]);
    }

    // SequenceExpression
    function RBRACE() {
        const stateₒ = getState();
        let out;
        if (WS()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (RBRACE_e()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (WS()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringLiteral
    function RBRACE_e() {
        OUT = "}";
        return true;
    }
    RBRACE_e.constant = {value: "}"};

    // SequenceExpression
    function Array() {
        const stateₒ = getState();
        let out;
        if (LBRACKET()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (Array_e()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (RBRACKET()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // SequenceExpression
    function LBRACKET() {
        const stateₒ = getState();
        let out;
        if (WS()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (LBRACKET_e()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (WS()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringLiteral
    function LBRACKET_e() {
        OUT = "[";
        return true;
    }
    LBRACKET_e.constant = {value: "["};

    // SelectionExpression
    function Array_e() {
        if (Array_e2()) return true;
        if (Array_e5()) return true;
        return false;
    }

    // SequenceExpression
    function Array_e2() {
        const stateₒ = getState();
        let out;
        if (Element()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (Array_e3()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // ListExpression
    function Element() {
        return printList([Value]);
    }

    // QuantifiedExpression
    function Array_e3() {
        const IPₒ = IP;
        let out;
        do {
            if (!Array_e4()) break;
            if (IP === IPₒ) break;
            out = concat(out, OUT);
        } while (true);
        OUT = out;
        return true;
    }

    // SequenceExpression
    function Array_e4() {
        const stateₒ = getState();
        let out;
        if (COMMA()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (Element()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // ListExpression
    function Array_e5() {
        return printList([]);
    }

    // SequenceExpression
    function RBRACKET() {
        const stateₒ = getState();
        let out;
        if (WS()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (RBRACKET_e()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (WS()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringLiteral
    function RBRACKET_e() {
        OUT = "]";
        return true;
    }
    RBRACKET_e.constant = {value: "]"};

    // Intrinsic

    return start_2;
})();
