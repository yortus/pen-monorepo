// ------------------------------ Main exports ------------------------------
module.exports = {
    parse(text) {
        setState({ IN: text, IP: 0 });
        HAS_IN = HAS_OUT = true;
        if (!parse()) throw new Error('parse failed');
        if (!isInputFullyConsumed()) throw new Error('parse didn\'t consume entire input');
        if (OUT === undefined) throw new Error('parse didn\'t return a value');
        return OUT;
    },
    print(node) {
        setState({ IN: node, IP: 0 });
        HAS_IN = HAS_OUT = true;
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
let HAS_IN;
let HAS_OUT;
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
            ascii,
            f64,
            i32,
            memoise,
        } */
        // TODO: doc... has both 'txt' and 'ast' representation
        // TODO: supports only single UTF-16 code units, ie basic multilingual plane. Extend to full unicode support somehow...
        // TODO: optimise 'any char' case better - or is that a whole other primitive now?
        // TODO: optimise all cases better
        function ascii({ mode }) {
            return function ASC_generic(expr) {
                var _a, _b, _c, _d, _e, _f;
                assert(isModule(expr));
                let min = (_c = (_b = (_a = expr('min')) === null || _a === void 0 ? void 0 : _a.constant) === null || _b === void 0 ? void 0 : _b.value) !== null && _c !== void 0 ? _c : 0x00;
                let max = (_f = (_e = (_d = expr('max')) === null || _d === void 0 ? void 0 : _d.constant) === null || _e === void 0 ? void 0 : _e.value) !== null && _f !== void 0 ? _f : 0x7f;
                if (typeof min === 'string' && min.length === 1)
                    min = min.charCodeAt(0);
                if (typeof max === 'string' && max.length === 1)
                    max = max.charCodeAt(0);
                assert(typeof min === 'number' && min >= 0x00 && min <= 0x7f);
                assert(typeof max === 'number' && max >= 0x00 && max <= 0x7f);
                if (mode === 'parse') {
                    return function ASC() {
                        let c;
                        if (HAS_IN) {
                            if (IP < 0 || IP >= IN.length)
                                return false;
                            c = IN.charAt(IP);
                            const cc = c.charCodeAt(0); // TODO: inefficient! improve...
                            if (cc < min || cc > max)
                                return false;
                            IP += 1;
                        }
                        else {
                            c = String.fromCharCode(min); // TODO: inefficient! improve...
                        }
                        OUT = HAS_OUT ? c : undefined;
                        return true;
                    };
                }
                else /* mode === 'print' */ {
                    return function ASC() {
                        let c;
                        if (HAS_IN) {
                            if (typeof IN !== 'string')
                                return false;
                            if (IP < 0 || IP >= IN.length)
                                return false;
                            c = IN.charAt(IP);
                            const cc = c.charCodeAt(0); // TODO: inefficient! improve...
                            if (cc < min || cc > max)
                                return false;
                            IP += 1;
                        }
                        else {
                            c = String.fromCharCode(min); // TODO: inefficient! improve...
                        }
                        OUT = HAS_OUT ? c : undefined;
                        return true;
                    };
                }
            };
        }
        // TODO: doc... has both 'txt' and 'ast' representation
        function f64({ mode }) {
            if (mode === 'parse') {
                return function F64() {
                    let num = 0;
                    if (HAS_IN) {
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
                        num = Number.parseFloat(IN.slice(stateₒ.IP, IP));
                        if (!Number.isFinite(num))
                            return setState(stateₒ), false;
                    }
                    // Success
                    OUT = HAS_OUT ? num : undefined;
                    return true;
                };
            }
            else /* mode === 'print' */ {
                return function F64() {
                    let out = '0';
                    if (HAS_IN) {
                        // Ensure N is a number.
                        if (typeof IN !== 'number' || IP !== 0)
                            return false;
                        IP = 1;
                        // Delegate unparsing to the JS runtime.
                        // TODO: the conversion may not exactly match the original string. Add this to the lossiness list.
                        out = String(IN);
                    }
                    // Success
                    OUT = HAS_OUT ? out : undefined;
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
                if (mode === 'parse') {
                    return function I32() {
                        let num = 0;
                        if (HAS_IN) {
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
                        }
                        // Success
                        OUT = HAS_OUT ? num : undefined;
                        return true;
                    };
                }
                else /* mode === 'print' */ {
                    return function I32() {
                        let out = '0';
                        if (HAS_IN) {
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
                            IP = 1;
                            if (isNegative)
                                digits.push(0x2d); // char code for '-'
                            // TODO: is String.fromCharCode(...) performant?
                            out = String.fromCharCode(...digits.reverse());
                        }
                        // Success
                        OUT = HAS_OUT ? out : undefined;
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
        return {ascii, f64, i32, memoise};
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
                if (mode === 'parse') {
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
                else /* mode === 'print' */ {
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
    const ascii_2 = extensions["V:/projects/oss/pen-monorepo/packages/core/penc/dist/deps/std.pen.js"].ascii({mode: 'parse'});
    const f64_2 = extensions["V:/projects/oss/pen-monorepo/packages/core/penc/dist/deps/std.pen.js"].f64({mode: 'parse'});
    const i32 = extensions["V:/projects/oss/pen-monorepo/packages/core/penc/dist/deps/std.pen.js"].i32({mode: 'parse'});
    const memoise = extensions["V:/projects/oss/pen-monorepo/packages/core/penc/dist/deps/std.pen.js"].memoise({mode: 'parse'});
    const unicode_2 = extensions["V:/projects/oss/pen-monorepo/packages/core/penc/dist/deps/experiments.pen.js"].unicode({mode: 'parse'});

    // Identifier
    function ascii(arg) {
        return ascii_2(arg);
    }

    // Identifier
    function f64(arg) {
        return f64_2(arg);
    }

    // Identifier
    function unicode(arg) {
        return unicode_2(arg);
    }

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

    // SelectionExpression
    function Value() {
        if (False()) return true;
        if (Null()) return true;
        if (True()) return true;
        if (Object()) return true;
        if (Array()) return true;
        if (Number()) return true;
        if (String()) return true;
        return false;
    }

    // SequenceExpression
    function False() {
        const stateₒ = getState();
        let out;
        if (False_sub1()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (False_sub3()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // CodeExpression
    function False_sub1() {
        const HAS_OUTₒ = HAS_OUT;
        HAS_OUT = false;
        const result = False_sub2();
        HAS_OUT = HAS_OUTₒ;
        return result;
    }

    // StringUniversal
    function False_sub2() {
        if (HAS_IN) {
            if (IP + 5 > IN.length) return false;
            if (IN.charCodeAt(IP + 0) !== 102) return false;
            if (IN.charCodeAt(IP + 1) !== 97) return false;
            if (IN.charCodeAt(IP + 2) !== 108) return false;
            if (IN.charCodeAt(IP + 3) !== 115) return false;
            if (IN.charCodeAt(IP + 4) !== 101) return false;
            IP += 5;
        }
        OUT = HAS_OUT ? "false" : undefined;
        return true;
    }
    False_sub2.constant = {value: "false"};

    // BooleanLiteral
    function False_sub3() {
        OUT = HAS_OUT ? false : undefined;
        return true;
    }
    False_sub3.constant = {value: false};

    // SequenceExpression
    function Null() {
        const stateₒ = getState();
        let out;
        if (Null_sub1()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (Null_sub3()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // CodeExpression
    function Null_sub1() {
        const HAS_OUTₒ = HAS_OUT;
        HAS_OUT = false;
        const result = Null_sub2();
        HAS_OUT = HAS_OUTₒ;
        return result;
    }

    // StringUniversal
    function Null_sub2() {
        if (HAS_IN) {
            if (IP + 4 > IN.length) return false;
            if (IN.charCodeAt(IP + 0) !== 110) return false;
            if (IN.charCodeAt(IP + 1) !== 117) return false;
            if (IN.charCodeAt(IP + 2) !== 108) return false;
            if (IN.charCodeAt(IP + 3) !== 108) return false;
            IP += 4;
        }
        OUT = HAS_OUT ? "null" : undefined;
        return true;
    }
    Null_sub2.constant = {value: "null"};

    // NullLiteral
    function Null_sub3() {
        OUT = HAS_OUT ? null : undefined;
        return true;
    }
    Null_sub3.constant = {value: null};

    // SequenceExpression
    function True() {
        const stateₒ = getState();
        let out;
        if (True_sub1()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (True_sub3()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // CodeExpression
    function True_sub1() {
        const HAS_OUTₒ = HAS_OUT;
        HAS_OUT = false;
        const result = True_sub2();
        HAS_OUT = HAS_OUTₒ;
        return result;
    }

    // StringUniversal
    function True_sub2() {
        if (HAS_IN) {
            if (IP + 4 > IN.length) return false;
            if (IN.charCodeAt(IP + 0) !== 116) return false;
            if (IN.charCodeAt(IP + 1) !== 114) return false;
            if (IN.charCodeAt(IP + 2) !== 117) return false;
            if (IN.charCodeAt(IP + 3) !== 101) return false;
            IP += 4;
        }
        OUT = HAS_OUT ? "true" : undefined;
        return true;
    }
    True_sub2.constant = {value: "true"};

    // BooleanLiteral
    function True_sub3() {
        OUT = HAS_OUT ? true : undefined;
        return true;
    }
    True_sub3.constant = {value: true};

    // SequenceExpression
    function Object() {
        const stateₒ = getState();
        let out;
        if (LBRACE()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (Object_sub1()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (RBRACE()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // SelectionExpression
    function Object_sub1() {
        if (Object_sub2()) return true;
        if (Object_sub5()) return true;
        return false;
    }

    // SequenceExpression
    function Object_sub2() {
        const stateₒ = getState();
        let out;
        if (Property()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (Object_sub3()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // QuantifiedExpression
    function Object_sub3() {
        const IPₒ = IP;
        let out;
        do {
            if (!Object_sub4()) break;
            if (IP === IPₒ) break;
            out = concat(out, OUT);
        } while (true);
        OUT = out;
        return true;
    }

    // SequenceExpression
    function Object_sub4() {
        const stateₒ = getState();
        let out;
        if (COMMA()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (Property()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // RecordExpression
    function Object_sub5() {
        return parseRecord([]);
    }

    // FieldExpression
    function Property() {
        return parseField(String, Property_sub1);
    }

    // SequenceExpression
    function Property_sub1() {
        const stateₒ = getState();
        let out;
        if (COLON()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (Value()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // SequenceExpression
    function Array() {
        const stateₒ = getState();
        let out;
        if (LBRACKET()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (Array_sub1()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (RBRACKET()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // SelectionExpression
    function Array_sub1() {
        if (Array_sub2()) return true;
        if (Array_sub5()) return true;
        return false;
    }

    // SequenceExpression
    function Array_sub2() {
        const stateₒ = getState();
        let out;
        if (Element()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (Array_sub3()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // QuantifiedExpression
    function Array_sub3() {
        const IPₒ = IP;
        let out;
        do {
            if (!Array_sub4()) break;
            if (IP === IPₒ) break;
            out = concat(out, OUT);
        } while (true);
        OUT = out;
        return true;
    }

    // SequenceExpression
    function Array_sub4() {
        const stateₒ = getState();
        let out;
        if (COMMA()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (Element()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // ListExpression
    function Array_sub5() {
        return parseList([]);
    }

    // ListExpression
    function Element() {
        return parseList([Value]);
    }

    // Identifier
    function Number(arg) {
        return f64(arg);
    }

    // SequenceExpression
    function String() {
        const stateₒ = getState();
        let out;
        if (DOUBLE_QUOTE()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (String_sub1()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (DOUBLE_QUOTE()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // QuantifiedExpression
    function String_sub1() {
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

    // NumericLiteral
    function min() {
        OUT = HAS_OUT ? 32 : undefined;
        return true;
    }
    min.constant = {value: 32};

    // NumericLiteral
    function max() {
        OUT = HAS_OUT ? 127 : undefined;
        return true;
    }
    max.constant = {value: 127};

    // NumericLiteral
    function base() {
        OUT = HAS_OUT ? 16 : undefined;
        return true;
    }
    base.constant = {value: 16};

    // NumericLiteral
    function minDigits() {
        OUT = HAS_OUT ? 4 : undefined;
        return true;
    }
    minDigits.constant = {value: 4};

    // NumericLiteral
    function maxDigits() {
        OUT = HAS_OUT ? 4 : undefined;
        return true;
    }
    maxDigits.constant = {value: 4};

    // SelectionExpression
    function CHAR() {
        if (CHAR_sub1()) return true;
        if (CHAR_sub8()) return true;
        if (CHAR_sub12()) return true;
        if (CHAR_sub16()) return true;
        if (CHAR_sub20()) return true;
        if (CHAR_sub24()) return true;
        if (CHAR_sub28()) return true;
        if (CHAR_sub32()) return true;
        if (CHAR_sub36()) return true;
        if (CHAR_sub40()) return true;
        return false;
    }

    // SequenceExpression
    function CHAR_sub1() {
        const stateₒ = getState();
        let out;
        if (CHAR_sub2()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (CHAR_sub4()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (CHAR_sub6()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // NotExpression
    function CHAR_sub2() {
        const stateₒ = getState();
        const result = !CHAR_sub3();
        setState(stateₒ);
        OUT = undefined;
        return result;
    }

    // StringUniversal
    function CHAR_sub3() {
        if (HAS_IN) {
            if (IP + 1 > IN.length) return false;
            if (IN.charCodeAt(IP + 0) !== 92) return false;
            IP += 1;
        }
        OUT = HAS_OUT ? "\\" : undefined;
        return true;
    }
    CHAR_sub3.constant = {value: "\\"};

    // NotExpression
    function CHAR_sub4() {
        const stateₒ = getState();
        const result = !CHAR_sub5();
        setState(stateₒ);
        OUT = undefined;
        return result;
    }

    // StringUniversal
    function CHAR_sub5() {
        if (HAS_IN) {
            if (IP + 1 > IN.length) return false;
            if (IN.charCodeAt(IP + 0) !== 34) return false;
            IP += 1;
        }
        OUT = HAS_OUT ? "\"" : undefined;
        return true;
    }
    CHAR_sub5.constant = {value: "\""};

    // InstantiationExpression
    let CHAR_sub6ₘ;
    function CHAR_sub6(arg) {
        try {
            return CHAR_sub6ₘ(arg);
        }
        catch (err) {
            if (!(err instanceof TypeError) || !err.message.includes('CHAR_sub6ₘ is not a function')) throw err;
            CHAR_sub6ₘ = ascii(CHAR_sub7);
            return CHAR_sub6ₘ(arg);
        }
    }

    // Module
    function CHAR_sub7(member) {
        switch (member) {
            case 'min': return min;
            case 'max': return max;
            default: return undefined;
        }
    }

    // SequenceExpression
    function CHAR_sub8() {
        const stateₒ = getState();
        let out;
        if (CHAR_sub9()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (CHAR_sub11()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // CodeExpression
    function CHAR_sub9() {
        const HAS_OUTₒ = HAS_OUT;
        HAS_OUT = false;
        const result = CHAR_sub10();
        HAS_OUT = HAS_OUTₒ;
        return result;
    }

    // StringUniversal
    function CHAR_sub10() {
        if (HAS_IN) {
            if (IP + 2 > IN.length) return false;
            if (IN.charCodeAt(IP + 0) !== 92) return false;
            if (IN.charCodeAt(IP + 1) !== 34) return false;
            IP += 2;
        }
        OUT = HAS_OUT ? "\\\"" : undefined;
        return true;
    }
    CHAR_sub10.constant = {value: "\\\""};

    // StringAbstract
    function CHAR_sub11() {
        OUT = HAS_OUT ? "\"" : undefined;
        return true;
    }
    CHAR_sub11.constant = {value: "\""};

    // SequenceExpression
    function CHAR_sub12() {
        const stateₒ = getState();
        let out;
        if (CHAR_sub13()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (CHAR_sub15()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // CodeExpression
    function CHAR_sub13() {
        const HAS_OUTₒ = HAS_OUT;
        HAS_OUT = false;
        const result = CHAR_sub14();
        HAS_OUT = HAS_OUTₒ;
        return result;
    }

    // StringUniversal
    function CHAR_sub14() {
        if (HAS_IN) {
            if (IP + 2 > IN.length) return false;
            if (IN.charCodeAt(IP + 0) !== 92) return false;
            if (IN.charCodeAt(IP + 1) !== 92) return false;
            IP += 2;
        }
        OUT = HAS_OUT ? "\\\\" : undefined;
        return true;
    }
    CHAR_sub14.constant = {value: "\\\\"};

    // StringAbstract
    function CHAR_sub15() {
        OUT = HAS_OUT ? "\\" : undefined;
        return true;
    }
    CHAR_sub15.constant = {value: "\\"};

    // SequenceExpression
    function CHAR_sub16() {
        const stateₒ = getState();
        let out;
        if (CHAR_sub17()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (CHAR_sub19()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // CodeExpression
    function CHAR_sub17() {
        const HAS_OUTₒ = HAS_OUT;
        HAS_OUT = false;
        const result = CHAR_sub18();
        HAS_OUT = HAS_OUTₒ;
        return result;
    }

    // StringUniversal
    function CHAR_sub18() {
        if (HAS_IN) {
            if (IP + 2 > IN.length) return false;
            if (IN.charCodeAt(IP + 0) !== 92) return false;
            if (IN.charCodeAt(IP + 1) !== 47) return false;
            IP += 2;
        }
        OUT = HAS_OUT ? "\\/" : undefined;
        return true;
    }
    CHAR_sub18.constant = {value: "\\/"};

    // StringAbstract
    function CHAR_sub19() {
        OUT = HAS_OUT ? "/" : undefined;
        return true;
    }
    CHAR_sub19.constant = {value: "/"};

    // SequenceExpression
    function CHAR_sub20() {
        const stateₒ = getState();
        let out;
        if (CHAR_sub21()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (CHAR_sub23()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // CodeExpression
    function CHAR_sub21() {
        const HAS_OUTₒ = HAS_OUT;
        HAS_OUT = false;
        const result = CHAR_sub22();
        HAS_OUT = HAS_OUTₒ;
        return result;
    }

    // StringUniversal
    function CHAR_sub22() {
        if (HAS_IN) {
            if (IP + 2 > IN.length) return false;
            if (IN.charCodeAt(IP + 0) !== 92) return false;
            if (IN.charCodeAt(IP + 1) !== 98) return false;
            IP += 2;
        }
        OUT = HAS_OUT ? "\\b" : undefined;
        return true;
    }
    CHAR_sub22.constant = {value: "\\b"};

    // StringAbstract
    function CHAR_sub23() {
        OUT = HAS_OUT ? "\b" : undefined;
        return true;
    }
    CHAR_sub23.constant = {value: "\b"};

    // SequenceExpression
    function CHAR_sub24() {
        const stateₒ = getState();
        let out;
        if (CHAR_sub25()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (CHAR_sub27()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // CodeExpression
    function CHAR_sub25() {
        const HAS_OUTₒ = HAS_OUT;
        HAS_OUT = false;
        const result = CHAR_sub26();
        HAS_OUT = HAS_OUTₒ;
        return result;
    }

    // StringUniversal
    function CHAR_sub26() {
        if (HAS_IN) {
            if (IP + 2 > IN.length) return false;
            if (IN.charCodeAt(IP + 0) !== 92) return false;
            if (IN.charCodeAt(IP + 1) !== 102) return false;
            IP += 2;
        }
        OUT = HAS_OUT ? "\\f" : undefined;
        return true;
    }
    CHAR_sub26.constant = {value: "\\f"};

    // StringAbstract
    function CHAR_sub27() {
        OUT = HAS_OUT ? "\f" : undefined;
        return true;
    }
    CHAR_sub27.constant = {value: "\f"};

    // SequenceExpression
    function CHAR_sub28() {
        const stateₒ = getState();
        let out;
        if (CHAR_sub29()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (CHAR_sub31()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // CodeExpression
    function CHAR_sub29() {
        const HAS_OUTₒ = HAS_OUT;
        HAS_OUT = false;
        const result = CHAR_sub30();
        HAS_OUT = HAS_OUTₒ;
        return result;
    }

    // StringUniversal
    function CHAR_sub30() {
        if (HAS_IN) {
            if (IP + 2 > IN.length) return false;
            if (IN.charCodeAt(IP + 0) !== 92) return false;
            if (IN.charCodeAt(IP + 1) !== 110) return false;
            IP += 2;
        }
        OUT = HAS_OUT ? "\\n" : undefined;
        return true;
    }
    CHAR_sub30.constant = {value: "\\n"};

    // StringAbstract
    function CHAR_sub31() {
        OUT = HAS_OUT ? "\n" : undefined;
        return true;
    }
    CHAR_sub31.constant = {value: "\n"};

    // SequenceExpression
    function CHAR_sub32() {
        const stateₒ = getState();
        let out;
        if (CHAR_sub33()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (CHAR_sub35()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // CodeExpression
    function CHAR_sub33() {
        const HAS_OUTₒ = HAS_OUT;
        HAS_OUT = false;
        const result = CHAR_sub34();
        HAS_OUT = HAS_OUTₒ;
        return result;
    }

    // StringUniversal
    function CHAR_sub34() {
        if (HAS_IN) {
            if (IP + 2 > IN.length) return false;
            if (IN.charCodeAt(IP + 0) !== 92) return false;
            if (IN.charCodeAt(IP + 1) !== 114) return false;
            IP += 2;
        }
        OUT = HAS_OUT ? "\\r" : undefined;
        return true;
    }
    CHAR_sub34.constant = {value: "\\r"};

    // StringAbstract
    function CHAR_sub35() {
        OUT = HAS_OUT ? "\r" : undefined;
        return true;
    }
    CHAR_sub35.constant = {value: "\r"};

    // SequenceExpression
    function CHAR_sub36() {
        const stateₒ = getState();
        let out;
        if (CHAR_sub37()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (CHAR_sub39()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // CodeExpression
    function CHAR_sub37() {
        const HAS_OUTₒ = HAS_OUT;
        HAS_OUT = false;
        const result = CHAR_sub38();
        HAS_OUT = HAS_OUTₒ;
        return result;
    }

    // StringUniversal
    function CHAR_sub38() {
        if (HAS_IN) {
            if (IP + 2 > IN.length) return false;
            if (IN.charCodeAt(IP + 0) !== 92) return false;
            if (IN.charCodeAt(IP + 1) !== 116) return false;
            IP += 2;
        }
        OUT = HAS_OUT ? "\\t" : undefined;
        return true;
    }
    CHAR_sub38.constant = {value: "\\t"};

    // StringAbstract
    function CHAR_sub39() {
        OUT = HAS_OUT ? "\t" : undefined;
        return true;
    }
    CHAR_sub39.constant = {value: "\t"};

    // SequenceExpression
    function CHAR_sub40() {
        const stateₒ = getState();
        let out;
        if (CHAR_sub41()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (CHAR_sub43()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // CodeExpression
    function CHAR_sub41() {
        const HAS_OUTₒ = HAS_OUT;
        HAS_OUT = false;
        const result = CHAR_sub42();
        HAS_OUT = HAS_OUTₒ;
        return result;
    }

    // StringUniversal
    function CHAR_sub42() {
        if (HAS_IN) {
            if (IP + 2 > IN.length) return false;
            if (IN.charCodeAt(IP + 0) !== 92) return false;
            if (IN.charCodeAt(IP + 1) !== 117) return false;
            IP += 2;
        }
        OUT = HAS_OUT ? "\\u" : undefined;
        return true;
    }
    CHAR_sub42.constant = {value: "\\u"};

    // InstantiationExpression
    let CHAR_sub43ₘ;
    function CHAR_sub43(arg) {
        try {
            return CHAR_sub43ₘ(arg);
        }
        catch (err) {
            if (!(err instanceof TypeError) || !err.message.includes('CHAR_sub43ₘ is not a function')) throw err;
            CHAR_sub43ₘ = unicode(CHAR_sub44);
            return CHAR_sub43ₘ(arg);
        }
    }

    // Module
    function CHAR_sub44(member) {
        switch (member) {
            case 'base': return base;
            case 'minDigits': return minDigits;
            case 'maxDigits': return maxDigits;
            default: return undefined;
        }
    }

    // SequenceExpression
    function LBRACE() {
        const stateₒ = getState();
        let out;
        if (WS()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (LBRACE_sub1()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (WS()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // CodeExpression
    function LBRACE_sub1() {
        const HAS_OUTₒ = HAS_OUT;
        HAS_OUT = false;
        const result = LBRACE_sub2();
        HAS_OUT = HAS_OUTₒ;
        return result;
    }

    // StringUniversal
    function LBRACE_sub2() {
        if (HAS_IN) {
            if (IP + 1 > IN.length) return false;
            if (IN.charCodeAt(IP + 0) !== 123) return false;
            IP += 1;
        }
        OUT = HAS_OUT ? "{" : undefined;
        return true;
    }
    LBRACE_sub2.constant = {value: "{"};

    // SequenceExpression
    function RBRACE() {
        const stateₒ = getState();
        let out;
        if (WS()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (RBRACE_sub1()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (WS()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // CodeExpression
    function RBRACE_sub1() {
        const HAS_OUTₒ = HAS_OUT;
        HAS_OUT = false;
        const result = RBRACE_sub2();
        HAS_OUT = HAS_OUTₒ;
        return result;
    }

    // StringUniversal
    function RBRACE_sub2() {
        if (HAS_IN) {
            if (IP + 1 > IN.length) return false;
            if (IN.charCodeAt(IP + 0) !== 125) return false;
            IP += 1;
        }
        OUT = HAS_OUT ? "}" : undefined;
        return true;
    }
    RBRACE_sub2.constant = {value: "}"};

    // SequenceExpression
    function LBRACKET() {
        const stateₒ = getState();
        let out;
        if (WS()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (LBRACKET_sub1()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (WS()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // CodeExpression
    function LBRACKET_sub1() {
        const HAS_OUTₒ = HAS_OUT;
        HAS_OUT = false;
        const result = LBRACKET_sub2();
        HAS_OUT = HAS_OUTₒ;
        return result;
    }

    // StringUniversal
    function LBRACKET_sub2() {
        if (HAS_IN) {
            if (IP + 1 > IN.length) return false;
            if (IN.charCodeAt(IP + 0) !== 91) return false;
            IP += 1;
        }
        OUT = HAS_OUT ? "[" : undefined;
        return true;
    }
    LBRACKET_sub2.constant = {value: "["};

    // SequenceExpression
    function RBRACKET() {
        const stateₒ = getState();
        let out;
        if (WS()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (RBRACKET_sub1()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (WS()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // CodeExpression
    function RBRACKET_sub1() {
        const HAS_OUTₒ = HAS_OUT;
        HAS_OUT = false;
        const result = RBRACKET_sub2();
        HAS_OUT = HAS_OUTₒ;
        return result;
    }

    // StringUniversal
    function RBRACKET_sub2() {
        if (HAS_IN) {
            if (IP + 1 > IN.length) return false;
            if (IN.charCodeAt(IP + 0) !== 93) return false;
            IP += 1;
        }
        OUT = HAS_OUT ? "]" : undefined;
        return true;
    }
    RBRACKET_sub2.constant = {value: "]"};

    // SequenceExpression
    function COLON() {
        const stateₒ = getState();
        let out;
        if (WS()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (COLON_sub1()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (WS()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // CodeExpression
    function COLON_sub1() {
        const HAS_OUTₒ = HAS_OUT;
        HAS_OUT = false;
        const result = COLON_sub2();
        HAS_OUT = HAS_OUTₒ;
        return result;
    }

    // StringUniversal
    function COLON_sub2() {
        if (HAS_IN) {
            if (IP + 1 > IN.length) return false;
            if (IN.charCodeAt(IP + 0) !== 58) return false;
            IP += 1;
        }
        OUT = HAS_OUT ? ":" : undefined;
        return true;
    }
    COLON_sub2.constant = {value: ":"};

    // SequenceExpression
    function COMMA() {
        const stateₒ = getState();
        let out;
        if (WS()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (COMMA_sub1()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (WS()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // CodeExpression
    function COMMA_sub1() {
        const HAS_OUTₒ = HAS_OUT;
        HAS_OUT = false;
        const result = COMMA_sub2();
        HAS_OUT = HAS_OUTₒ;
        return result;
    }

    // StringUniversal
    function COMMA_sub2() {
        if (HAS_IN) {
            if (IP + 1 > IN.length) return false;
            if (IN.charCodeAt(IP + 0) !== 44) return false;
            IP += 1;
        }
        OUT = HAS_OUT ? "," : undefined;
        return true;
    }
    COMMA_sub2.constant = {value: ","};

    // CodeExpression
    function DOUBLE_QUOTE() {
        const HAS_OUTₒ = HAS_OUT;
        HAS_OUT = false;
        const result = DOUBLE_QUOTE_sub1();
        HAS_OUT = HAS_OUTₒ;
        return result;
    }

    // StringUniversal
    function DOUBLE_QUOTE_sub1() {
        if (HAS_IN) {
            if (IP + 1 > IN.length) return false;
            if (IN.charCodeAt(IP + 0) !== 34) return false;
            IP += 1;
        }
        OUT = HAS_OUT ? "\"" : undefined;
        return true;
    }
    DOUBLE_QUOTE_sub1.constant = {value: "\""};

    // CodeExpression
    function WS() {
        const HAS_OUTₒ = HAS_OUT;
        HAS_OUT = false;
        const result = WS_sub1();
        HAS_OUT = HAS_OUTₒ;
        return result;
    }

    // QuantifiedExpression
    function WS_sub1() {
        const IPₒ = IP;
        let out;
        do {
            if (!WS_sub2()) break;
            if (IP === IPₒ) break;
            out = concat(out, OUT);
        } while (true);
        OUT = out;
        return true;
    }

    // SelectionExpression
    function WS_sub2() {
        if (WS_sub3()) return true;
        if (WS_sub4()) return true;
        if (WS_sub5()) return true;
        if (WS_sub6()) return true;
        return false;
    }

    // StringUniversal
    function WS_sub3() {
        if (HAS_IN) {
            if (IP + 1 > IN.length) return false;
            if (IN.charCodeAt(IP + 0) !== 32) return false;
            IP += 1;
        }
        OUT = HAS_OUT ? " " : undefined;
        return true;
    }
    WS_sub3.constant = {value: " "};

    // StringUniversal
    function WS_sub4() {
        if (HAS_IN) {
            if (IP + 1 > IN.length) return false;
            if (IN.charCodeAt(IP + 0) !== 9) return false;
            IP += 1;
        }
        OUT = HAS_OUT ? "\t" : undefined;
        return true;
    }
    WS_sub4.constant = {value: "\t"};

    // StringUniversal
    function WS_sub5() {
        if (HAS_IN) {
            if (IP + 1 > IN.length) return false;
            if (IN.charCodeAt(IP + 0) !== 10) return false;
            IP += 1;
        }
        OUT = HAS_OUT ? "\n" : undefined;
        return true;
    }
    WS_sub5.constant = {value: "\n"};

    // StringUniversal
    function WS_sub6() {
        if (HAS_IN) {
            if (IP + 1 > IN.length) return false;
            if (IN.charCodeAt(IP + 0) !== 13) return false;
            IP += 1;
        }
        OUT = HAS_OUT ? "\r" : undefined;
        return true;
    }
    WS_sub6.constant = {value: "\r"};

    // Module
    function Ɱ_json(member) {
        switch (member) {
            case 'ascii': return ascii;
            case 'f64': return f64;
            case 'unicode': return unicode;
            case 'start': return start_2;
            case 'Value': return Value;
            case 'False': return False;
            case 'Null': return Null;
            case 'True': return True;
            case 'Object': return Object;
            case 'Property': return Property;
            case 'Array': return Array;
            case 'Element': return Element;
            case 'Number': return Number;
            case 'String': return String;
            case 'CHAR': return CHAR;
            case 'LBRACE': return LBRACE;
            case 'RBRACE': return RBRACE;
            case 'LBRACKET': return LBRACKET;
            case 'RBRACKET': return RBRACKET;
            case 'COLON': return COLON;
            case 'COMMA': return COMMA;
            case 'DOUBLE_QUOTE': return DOUBLE_QUOTE;
            case 'WS': return WS;
            default: return undefined;
        }
    }

    // Intrinsic

    // Intrinsic

    // Intrinsic

    // Intrinsic

    // Module
    function Ɱ_std(member) {
        switch (member) {
            case 'ascii': return ascii_2;
            case 'f64': return f64_2;
            case 'i32': return i32;
            case 'memoise': return memoise;
            default: return undefined;
        }
    }

    // Intrinsic

    // Module
    function Ɱ_experiments(member) {
        switch (member) {
            case 'unicode': return unicode_2;
            default: return undefined;
        }
    }

    return start_2;
})();




// ------------------------------ PRINT ------------------------------
const print = (() => {

    // Intrinsic
    const ascii_2 = extensions["V:/projects/oss/pen-monorepo/packages/core/penc/dist/deps/std.pen.js"].ascii({mode: 'print'});
    const f64_2 = extensions["V:/projects/oss/pen-monorepo/packages/core/penc/dist/deps/std.pen.js"].f64({mode: 'print'});
    const i32 = extensions["V:/projects/oss/pen-monorepo/packages/core/penc/dist/deps/std.pen.js"].i32({mode: 'print'});
    const memoise = extensions["V:/projects/oss/pen-monorepo/packages/core/penc/dist/deps/std.pen.js"].memoise({mode: 'print'});
    const unicode_2 = extensions["V:/projects/oss/pen-monorepo/packages/core/penc/dist/deps/experiments.pen.js"].unicode({mode: 'print'});

    // Identifier
    function ascii(arg) {
        return ascii_2(arg);
    }

    // Identifier
    function f64(arg) {
        return f64_2(arg);
    }

    // Identifier
    function unicode(arg) {
        return unicode_2(arg);
    }

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

    // SelectionExpression
    function Value() {
        if (False()) return true;
        if (Null()) return true;
        if (True()) return true;
        if (Object()) return true;
        if (Array()) return true;
        if (Number()) return true;
        if (String()) return true;
        return false;
    }

    // SequenceExpression
    function False() {
        const stateₒ = getState();
        let out;
        if (False_sub1()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (False_sub3()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // CodeExpression
    function False_sub1() {
        const HAS_INₒ = HAS_IN;
        HAS_IN = false;
        const result = False_sub2();
        HAS_IN = HAS_INₒ;
        return result;
    }

    // StringUniversal
    function False_sub2() {
        if (HAS_IN) {
            if (typeof IN !== 'string') return false;
            if (IP + 5 > IN.length) return false;
            if (IN.charCodeAt(IP + 0) !== 102) return false;
            if (IN.charCodeAt(IP + 1) !== 97) return false;
            if (IN.charCodeAt(IP + 2) !== 108) return false;
            if (IN.charCodeAt(IP + 3) !== 115) return false;
            if (IN.charCodeAt(IP + 4) !== 101) return false;
            IP += 5;
        }
        OUT = HAS_OUT ? "false" : undefined;
        return true;
    }
    False_sub2.constant = {value: "false"};

    // BooleanLiteral
    function False_sub3() {
        if (HAS_IN) {
            if (IN !== false || IP !== 0) return false;
            IP += 1;
        }
        OUT = HAS_OUT ? undefined : undefined;
        return true;
    }
    False_sub3.constant = {value: false};

    // SequenceExpression
    function Null() {
        const stateₒ = getState();
        let out;
        if (Null_sub1()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (Null_sub3()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // CodeExpression
    function Null_sub1() {
        const HAS_INₒ = HAS_IN;
        HAS_IN = false;
        const result = Null_sub2();
        HAS_IN = HAS_INₒ;
        return result;
    }

    // StringUniversal
    function Null_sub2() {
        if (HAS_IN) {
            if (typeof IN !== 'string') return false;
            if (IP + 4 > IN.length) return false;
            if (IN.charCodeAt(IP + 0) !== 110) return false;
            if (IN.charCodeAt(IP + 1) !== 117) return false;
            if (IN.charCodeAt(IP + 2) !== 108) return false;
            if (IN.charCodeAt(IP + 3) !== 108) return false;
            IP += 4;
        }
        OUT = HAS_OUT ? "null" : undefined;
        return true;
    }
    Null_sub2.constant = {value: "null"};

    // NullLiteral
    function Null_sub3() {
        if (HAS_IN) {
            if (IN !== null || IP !== 0) return false;
            IP += 1;
        }
        OUT = HAS_OUT ? undefined : undefined;
        return true;
    }
    Null_sub3.constant = {value: null};

    // SequenceExpression
    function True() {
        const stateₒ = getState();
        let out;
        if (True_sub1()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (True_sub3()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // CodeExpression
    function True_sub1() {
        const HAS_INₒ = HAS_IN;
        HAS_IN = false;
        const result = True_sub2();
        HAS_IN = HAS_INₒ;
        return result;
    }

    // StringUniversal
    function True_sub2() {
        if (HAS_IN) {
            if (typeof IN !== 'string') return false;
            if (IP + 4 > IN.length) return false;
            if (IN.charCodeAt(IP + 0) !== 116) return false;
            if (IN.charCodeAt(IP + 1) !== 114) return false;
            if (IN.charCodeAt(IP + 2) !== 117) return false;
            if (IN.charCodeAt(IP + 3) !== 101) return false;
            IP += 4;
        }
        OUT = HAS_OUT ? "true" : undefined;
        return true;
    }
    True_sub2.constant = {value: "true"};

    // BooleanLiteral
    function True_sub3() {
        if (HAS_IN) {
            if (IN !== true || IP !== 0) return false;
            IP += 1;
        }
        OUT = HAS_OUT ? undefined : undefined;
        return true;
    }
    True_sub3.constant = {value: true};

    // SequenceExpression
    function Object() {
        const stateₒ = getState();
        let out;
        if (LBRACE()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (Object_sub1()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (RBRACE()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // SelectionExpression
    function Object_sub1() {
        if (Object_sub2()) return true;
        if (Object_sub5()) return true;
        return false;
    }

    // SequenceExpression
    function Object_sub2() {
        const stateₒ = getState();
        let out;
        if (Property()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (Object_sub3()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // QuantifiedExpression
    function Object_sub3() {
        const IPₒ = IP;
        let out;
        do {
            if (!Object_sub4()) break;
            if (IP === IPₒ) break;
            out = concat(out, OUT);
        } while (true);
        OUT = out;
        return true;
    }

    // SequenceExpression
    function Object_sub4() {
        const stateₒ = getState();
        let out;
        if (COMMA()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (Property()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // RecordExpression
    function Object_sub5() {
        return printRecord([]);
    }

    // FieldExpression
    function Property() {
        return printField(String, Property_sub1);
    }

    // SequenceExpression
    function Property_sub1() {
        const stateₒ = getState();
        let out;
        if (COLON()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (Value()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // SequenceExpression
    function Array() {
        const stateₒ = getState();
        let out;
        if (LBRACKET()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (Array_sub1()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (RBRACKET()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // SelectionExpression
    function Array_sub1() {
        if (Array_sub2()) return true;
        if (Array_sub5()) return true;
        return false;
    }

    // SequenceExpression
    function Array_sub2() {
        const stateₒ = getState();
        let out;
        if (Element()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (Array_sub3()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // QuantifiedExpression
    function Array_sub3() {
        const IPₒ = IP;
        let out;
        do {
            if (!Array_sub4()) break;
            if (IP === IPₒ) break;
            out = concat(out, OUT);
        } while (true);
        OUT = out;
        return true;
    }

    // SequenceExpression
    function Array_sub4() {
        const stateₒ = getState();
        let out;
        if (COMMA()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (Element()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // ListExpression
    function Array_sub5() {
        return printList([]);
    }

    // ListExpression
    function Element() {
        return printList([Value]);
    }

    // Identifier
    function Number(arg) {
        return f64(arg);
    }

    // SequenceExpression
    function String() {
        const stateₒ = getState();
        let out;
        if (DOUBLE_QUOTE()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (String_sub1()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (DOUBLE_QUOTE()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // QuantifiedExpression
    function String_sub1() {
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

    // NumericLiteral
    function min() {
        if (HAS_IN) {
            if (IN !== 32 || IP !== 0) return false;
            IP += 1;
        }
        OUT = HAS_OUT ? undefined : undefined;
        return true;
    }
    min.constant = {value: 32};

    // NumericLiteral
    function max() {
        if (HAS_IN) {
            if (IN !== 127 || IP !== 0) return false;
            IP += 1;
        }
        OUT = HAS_OUT ? undefined : undefined;
        return true;
    }
    max.constant = {value: 127};

    // NumericLiteral
    function base() {
        if (HAS_IN) {
            if (IN !== 16 || IP !== 0) return false;
            IP += 1;
        }
        OUT = HAS_OUT ? undefined : undefined;
        return true;
    }
    base.constant = {value: 16};

    // NumericLiteral
    function minDigits() {
        if (HAS_IN) {
            if (IN !== 4 || IP !== 0) return false;
            IP += 1;
        }
        OUT = HAS_OUT ? undefined : undefined;
        return true;
    }
    minDigits.constant = {value: 4};

    // NumericLiteral
    function maxDigits() {
        if (HAS_IN) {
            if (IN !== 4 || IP !== 0) return false;
            IP += 1;
        }
        OUT = HAS_OUT ? undefined : undefined;
        return true;
    }
    maxDigits.constant = {value: 4};

    // SelectionExpression
    function CHAR() {
        if (CHAR_sub1()) return true;
        if (CHAR_sub8()) return true;
        if (CHAR_sub12()) return true;
        if (CHAR_sub16()) return true;
        if (CHAR_sub20()) return true;
        if (CHAR_sub24()) return true;
        if (CHAR_sub28()) return true;
        if (CHAR_sub32()) return true;
        if (CHAR_sub36()) return true;
        if (CHAR_sub40()) return true;
        return false;
    }

    // SequenceExpression
    function CHAR_sub1() {
        const stateₒ = getState();
        let out;
        if (CHAR_sub2()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (CHAR_sub4()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (CHAR_sub6()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // NotExpression
    function CHAR_sub2() {
        const stateₒ = getState();
        const result = !CHAR_sub3();
        setState(stateₒ);
        OUT = undefined;
        return result;
    }

    // StringUniversal
    function CHAR_sub3() {
        if (HAS_IN) {
            if (typeof IN !== 'string') return false;
            if (IP + 1 > IN.length) return false;
            if (IN.charCodeAt(IP + 0) !== 92) return false;
            IP += 1;
        }
        OUT = HAS_OUT ? "\\" : undefined;
        return true;
    }
    CHAR_sub3.constant = {value: "\\"};

    // NotExpression
    function CHAR_sub4() {
        const stateₒ = getState();
        const result = !CHAR_sub5();
        setState(stateₒ);
        OUT = undefined;
        return result;
    }

    // StringUniversal
    function CHAR_sub5() {
        if (HAS_IN) {
            if (typeof IN !== 'string') return false;
            if (IP + 1 > IN.length) return false;
            if (IN.charCodeAt(IP + 0) !== 34) return false;
            IP += 1;
        }
        OUT = HAS_OUT ? "\"" : undefined;
        return true;
    }
    CHAR_sub5.constant = {value: "\""};

    // InstantiationExpression
    let CHAR_sub6ₘ;
    function CHAR_sub6(arg) {
        try {
            return CHAR_sub6ₘ(arg);
        }
        catch (err) {
            if (!(err instanceof TypeError) || !err.message.includes('CHAR_sub6ₘ is not a function')) throw err;
            CHAR_sub6ₘ = ascii(CHAR_sub7);
            return CHAR_sub6ₘ(arg);
        }
    }

    // Module
    function CHAR_sub7(member) {
        switch (member) {
            case 'min': return min;
            case 'max': return max;
            default: return undefined;
        }
    }

    // SequenceExpression
    function CHAR_sub8() {
        const stateₒ = getState();
        let out;
        if (CHAR_sub9()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (CHAR_sub11()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // CodeExpression
    function CHAR_sub9() {
        const HAS_INₒ = HAS_IN;
        HAS_IN = false;
        const result = CHAR_sub10();
        HAS_IN = HAS_INₒ;
        return result;
    }

    // StringUniversal
    function CHAR_sub10() {
        if (HAS_IN) {
            if (typeof IN !== 'string') return false;
            if (IP + 2 > IN.length) return false;
            if (IN.charCodeAt(IP + 0) !== 92) return false;
            if (IN.charCodeAt(IP + 1) !== 34) return false;
            IP += 2;
        }
        OUT = HAS_OUT ? "\\\"" : undefined;
        return true;
    }
    CHAR_sub10.constant = {value: "\\\""};

    // StringAbstract
    function CHAR_sub11() {
        if (HAS_IN) {
            if (typeof IN !== 'string') return false;
            if (IP + 1 > IN.length) return false;
            if (IN.charCodeAt(IP + 0) !== 34) return false;
            IP += 1;
        }
        OUT = HAS_OUT ? undefined : undefined;
        return true;
    }
    CHAR_sub11.constant = {value: "\""};

    // SequenceExpression
    function CHAR_sub12() {
        const stateₒ = getState();
        let out;
        if (CHAR_sub13()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (CHAR_sub15()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // CodeExpression
    function CHAR_sub13() {
        const HAS_INₒ = HAS_IN;
        HAS_IN = false;
        const result = CHAR_sub14();
        HAS_IN = HAS_INₒ;
        return result;
    }

    // StringUniversal
    function CHAR_sub14() {
        if (HAS_IN) {
            if (typeof IN !== 'string') return false;
            if (IP + 2 > IN.length) return false;
            if (IN.charCodeAt(IP + 0) !== 92) return false;
            if (IN.charCodeAt(IP + 1) !== 92) return false;
            IP += 2;
        }
        OUT = HAS_OUT ? "\\\\" : undefined;
        return true;
    }
    CHAR_sub14.constant = {value: "\\\\"};

    // StringAbstract
    function CHAR_sub15() {
        if (HAS_IN) {
            if (typeof IN !== 'string') return false;
            if (IP + 1 > IN.length) return false;
            if (IN.charCodeAt(IP + 0) !== 92) return false;
            IP += 1;
        }
        OUT = HAS_OUT ? undefined : undefined;
        return true;
    }
    CHAR_sub15.constant = {value: "\\"};

    // SequenceExpression
    function CHAR_sub16() {
        const stateₒ = getState();
        let out;
        if (CHAR_sub17()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (CHAR_sub19()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // CodeExpression
    function CHAR_sub17() {
        const HAS_INₒ = HAS_IN;
        HAS_IN = false;
        const result = CHAR_sub18();
        HAS_IN = HAS_INₒ;
        return result;
    }

    // StringUniversal
    function CHAR_sub18() {
        if (HAS_IN) {
            if (typeof IN !== 'string') return false;
            if (IP + 2 > IN.length) return false;
            if (IN.charCodeAt(IP + 0) !== 92) return false;
            if (IN.charCodeAt(IP + 1) !== 47) return false;
            IP += 2;
        }
        OUT = HAS_OUT ? "\\/" : undefined;
        return true;
    }
    CHAR_sub18.constant = {value: "\\/"};

    // StringAbstract
    function CHAR_sub19() {
        if (HAS_IN) {
            if (typeof IN !== 'string') return false;
            if (IP + 1 > IN.length) return false;
            if (IN.charCodeAt(IP + 0) !== 47) return false;
            IP += 1;
        }
        OUT = HAS_OUT ? undefined : undefined;
        return true;
    }
    CHAR_sub19.constant = {value: "/"};

    // SequenceExpression
    function CHAR_sub20() {
        const stateₒ = getState();
        let out;
        if (CHAR_sub21()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (CHAR_sub23()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // CodeExpression
    function CHAR_sub21() {
        const HAS_INₒ = HAS_IN;
        HAS_IN = false;
        const result = CHAR_sub22();
        HAS_IN = HAS_INₒ;
        return result;
    }

    // StringUniversal
    function CHAR_sub22() {
        if (HAS_IN) {
            if (typeof IN !== 'string') return false;
            if (IP + 2 > IN.length) return false;
            if (IN.charCodeAt(IP + 0) !== 92) return false;
            if (IN.charCodeAt(IP + 1) !== 98) return false;
            IP += 2;
        }
        OUT = HAS_OUT ? "\\b" : undefined;
        return true;
    }
    CHAR_sub22.constant = {value: "\\b"};

    // StringAbstract
    function CHAR_sub23() {
        if (HAS_IN) {
            if (typeof IN !== 'string') return false;
            if (IP + 1 > IN.length) return false;
            if (IN.charCodeAt(IP + 0) !== 8) return false;
            IP += 1;
        }
        OUT = HAS_OUT ? undefined : undefined;
        return true;
    }
    CHAR_sub23.constant = {value: "\b"};

    // SequenceExpression
    function CHAR_sub24() {
        const stateₒ = getState();
        let out;
        if (CHAR_sub25()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (CHAR_sub27()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // CodeExpression
    function CHAR_sub25() {
        const HAS_INₒ = HAS_IN;
        HAS_IN = false;
        const result = CHAR_sub26();
        HAS_IN = HAS_INₒ;
        return result;
    }

    // StringUniversal
    function CHAR_sub26() {
        if (HAS_IN) {
            if (typeof IN !== 'string') return false;
            if (IP + 2 > IN.length) return false;
            if (IN.charCodeAt(IP + 0) !== 92) return false;
            if (IN.charCodeAt(IP + 1) !== 102) return false;
            IP += 2;
        }
        OUT = HAS_OUT ? "\\f" : undefined;
        return true;
    }
    CHAR_sub26.constant = {value: "\\f"};

    // StringAbstract
    function CHAR_sub27() {
        if (HAS_IN) {
            if (typeof IN !== 'string') return false;
            if (IP + 1 > IN.length) return false;
            if (IN.charCodeAt(IP + 0) !== 12) return false;
            IP += 1;
        }
        OUT = HAS_OUT ? undefined : undefined;
        return true;
    }
    CHAR_sub27.constant = {value: "\f"};

    // SequenceExpression
    function CHAR_sub28() {
        const stateₒ = getState();
        let out;
        if (CHAR_sub29()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (CHAR_sub31()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // CodeExpression
    function CHAR_sub29() {
        const HAS_INₒ = HAS_IN;
        HAS_IN = false;
        const result = CHAR_sub30();
        HAS_IN = HAS_INₒ;
        return result;
    }

    // StringUniversal
    function CHAR_sub30() {
        if (HAS_IN) {
            if (typeof IN !== 'string') return false;
            if (IP + 2 > IN.length) return false;
            if (IN.charCodeAt(IP + 0) !== 92) return false;
            if (IN.charCodeAt(IP + 1) !== 110) return false;
            IP += 2;
        }
        OUT = HAS_OUT ? "\\n" : undefined;
        return true;
    }
    CHAR_sub30.constant = {value: "\\n"};

    // StringAbstract
    function CHAR_sub31() {
        if (HAS_IN) {
            if (typeof IN !== 'string') return false;
            if (IP + 1 > IN.length) return false;
            if (IN.charCodeAt(IP + 0) !== 10) return false;
            IP += 1;
        }
        OUT = HAS_OUT ? undefined : undefined;
        return true;
    }
    CHAR_sub31.constant = {value: "\n"};

    // SequenceExpression
    function CHAR_sub32() {
        const stateₒ = getState();
        let out;
        if (CHAR_sub33()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (CHAR_sub35()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // CodeExpression
    function CHAR_sub33() {
        const HAS_INₒ = HAS_IN;
        HAS_IN = false;
        const result = CHAR_sub34();
        HAS_IN = HAS_INₒ;
        return result;
    }

    // StringUniversal
    function CHAR_sub34() {
        if (HAS_IN) {
            if (typeof IN !== 'string') return false;
            if (IP + 2 > IN.length) return false;
            if (IN.charCodeAt(IP + 0) !== 92) return false;
            if (IN.charCodeAt(IP + 1) !== 114) return false;
            IP += 2;
        }
        OUT = HAS_OUT ? "\\r" : undefined;
        return true;
    }
    CHAR_sub34.constant = {value: "\\r"};

    // StringAbstract
    function CHAR_sub35() {
        if (HAS_IN) {
            if (typeof IN !== 'string') return false;
            if (IP + 1 > IN.length) return false;
            if (IN.charCodeAt(IP + 0) !== 13) return false;
            IP += 1;
        }
        OUT = HAS_OUT ? undefined : undefined;
        return true;
    }
    CHAR_sub35.constant = {value: "\r"};

    // SequenceExpression
    function CHAR_sub36() {
        const stateₒ = getState();
        let out;
        if (CHAR_sub37()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (CHAR_sub39()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // CodeExpression
    function CHAR_sub37() {
        const HAS_INₒ = HAS_IN;
        HAS_IN = false;
        const result = CHAR_sub38();
        HAS_IN = HAS_INₒ;
        return result;
    }

    // StringUniversal
    function CHAR_sub38() {
        if (HAS_IN) {
            if (typeof IN !== 'string') return false;
            if (IP + 2 > IN.length) return false;
            if (IN.charCodeAt(IP + 0) !== 92) return false;
            if (IN.charCodeAt(IP + 1) !== 116) return false;
            IP += 2;
        }
        OUT = HAS_OUT ? "\\t" : undefined;
        return true;
    }
    CHAR_sub38.constant = {value: "\\t"};

    // StringAbstract
    function CHAR_sub39() {
        if (HAS_IN) {
            if (typeof IN !== 'string') return false;
            if (IP + 1 > IN.length) return false;
            if (IN.charCodeAt(IP + 0) !== 9) return false;
            IP += 1;
        }
        OUT = HAS_OUT ? undefined : undefined;
        return true;
    }
    CHAR_sub39.constant = {value: "\t"};

    // SequenceExpression
    function CHAR_sub40() {
        const stateₒ = getState();
        let out;
        if (CHAR_sub41()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (CHAR_sub43()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // CodeExpression
    function CHAR_sub41() {
        const HAS_INₒ = HAS_IN;
        HAS_IN = false;
        const result = CHAR_sub42();
        HAS_IN = HAS_INₒ;
        return result;
    }

    // StringUniversal
    function CHAR_sub42() {
        if (HAS_IN) {
            if (typeof IN !== 'string') return false;
            if (IP + 2 > IN.length) return false;
            if (IN.charCodeAt(IP + 0) !== 92) return false;
            if (IN.charCodeAt(IP + 1) !== 117) return false;
            IP += 2;
        }
        OUT = HAS_OUT ? "\\u" : undefined;
        return true;
    }
    CHAR_sub42.constant = {value: "\\u"};

    // InstantiationExpression
    let CHAR_sub43ₘ;
    function CHAR_sub43(arg) {
        try {
            return CHAR_sub43ₘ(arg);
        }
        catch (err) {
            if (!(err instanceof TypeError) || !err.message.includes('CHAR_sub43ₘ is not a function')) throw err;
            CHAR_sub43ₘ = unicode(CHAR_sub44);
            return CHAR_sub43ₘ(arg);
        }
    }

    // Module
    function CHAR_sub44(member) {
        switch (member) {
            case 'base': return base;
            case 'minDigits': return minDigits;
            case 'maxDigits': return maxDigits;
            default: return undefined;
        }
    }

    // SequenceExpression
    function LBRACE() {
        const stateₒ = getState();
        let out;
        if (WS()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (LBRACE_sub1()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (WS()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // CodeExpression
    function LBRACE_sub1() {
        const HAS_INₒ = HAS_IN;
        HAS_IN = false;
        const result = LBRACE_sub2();
        HAS_IN = HAS_INₒ;
        return result;
    }

    // StringUniversal
    function LBRACE_sub2() {
        if (HAS_IN) {
            if (typeof IN !== 'string') return false;
            if (IP + 1 > IN.length) return false;
            if (IN.charCodeAt(IP + 0) !== 123) return false;
            IP += 1;
        }
        OUT = HAS_OUT ? "{" : undefined;
        return true;
    }
    LBRACE_sub2.constant = {value: "{"};

    // SequenceExpression
    function RBRACE() {
        const stateₒ = getState();
        let out;
        if (WS()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (RBRACE_sub1()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (WS()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // CodeExpression
    function RBRACE_sub1() {
        const HAS_INₒ = HAS_IN;
        HAS_IN = false;
        const result = RBRACE_sub2();
        HAS_IN = HAS_INₒ;
        return result;
    }

    // StringUniversal
    function RBRACE_sub2() {
        if (HAS_IN) {
            if (typeof IN !== 'string') return false;
            if (IP + 1 > IN.length) return false;
            if (IN.charCodeAt(IP + 0) !== 125) return false;
            IP += 1;
        }
        OUT = HAS_OUT ? "}" : undefined;
        return true;
    }
    RBRACE_sub2.constant = {value: "}"};

    // SequenceExpression
    function LBRACKET() {
        const stateₒ = getState();
        let out;
        if (WS()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (LBRACKET_sub1()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (WS()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // CodeExpression
    function LBRACKET_sub1() {
        const HAS_INₒ = HAS_IN;
        HAS_IN = false;
        const result = LBRACKET_sub2();
        HAS_IN = HAS_INₒ;
        return result;
    }

    // StringUniversal
    function LBRACKET_sub2() {
        if (HAS_IN) {
            if (typeof IN !== 'string') return false;
            if (IP + 1 > IN.length) return false;
            if (IN.charCodeAt(IP + 0) !== 91) return false;
            IP += 1;
        }
        OUT = HAS_OUT ? "[" : undefined;
        return true;
    }
    LBRACKET_sub2.constant = {value: "["};

    // SequenceExpression
    function RBRACKET() {
        const stateₒ = getState();
        let out;
        if (WS()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (RBRACKET_sub1()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (WS()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // CodeExpression
    function RBRACKET_sub1() {
        const HAS_INₒ = HAS_IN;
        HAS_IN = false;
        const result = RBRACKET_sub2();
        HAS_IN = HAS_INₒ;
        return result;
    }

    // StringUniversal
    function RBRACKET_sub2() {
        if (HAS_IN) {
            if (typeof IN !== 'string') return false;
            if (IP + 1 > IN.length) return false;
            if (IN.charCodeAt(IP + 0) !== 93) return false;
            IP += 1;
        }
        OUT = HAS_OUT ? "]" : undefined;
        return true;
    }
    RBRACKET_sub2.constant = {value: "]"};

    // SequenceExpression
    function COLON() {
        const stateₒ = getState();
        let out;
        if (WS()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (COLON_sub1()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (WS()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // CodeExpression
    function COLON_sub1() {
        const HAS_INₒ = HAS_IN;
        HAS_IN = false;
        const result = COLON_sub2();
        HAS_IN = HAS_INₒ;
        return result;
    }

    // StringUniversal
    function COLON_sub2() {
        if (HAS_IN) {
            if (typeof IN !== 'string') return false;
            if (IP + 1 > IN.length) return false;
            if (IN.charCodeAt(IP + 0) !== 58) return false;
            IP += 1;
        }
        OUT = HAS_OUT ? ":" : undefined;
        return true;
    }
    COLON_sub2.constant = {value: ":"};

    // SequenceExpression
    function COMMA() {
        const stateₒ = getState();
        let out;
        if (WS()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (COMMA_sub1()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (WS()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // CodeExpression
    function COMMA_sub1() {
        const HAS_INₒ = HAS_IN;
        HAS_IN = false;
        const result = COMMA_sub2();
        HAS_IN = HAS_INₒ;
        return result;
    }

    // StringUniversal
    function COMMA_sub2() {
        if (HAS_IN) {
            if (typeof IN !== 'string') return false;
            if (IP + 1 > IN.length) return false;
            if (IN.charCodeAt(IP + 0) !== 44) return false;
            IP += 1;
        }
        OUT = HAS_OUT ? "," : undefined;
        return true;
    }
    COMMA_sub2.constant = {value: ","};

    // CodeExpression
    function DOUBLE_QUOTE() {
        const HAS_INₒ = HAS_IN;
        HAS_IN = false;
        const result = DOUBLE_QUOTE_sub1();
        HAS_IN = HAS_INₒ;
        return result;
    }

    // StringUniversal
    function DOUBLE_QUOTE_sub1() {
        if (HAS_IN) {
            if (typeof IN !== 'string') return false;
            if (IP + 1 > IN.length) return false;
            if (IN.charCodeAt(IP + 0) !== 34) return false;
            IP += 1;
        }
        OUT = HAS_OUT ? "\"" : undefined;
        return true;
    }
    DOUBLE_QUOTE_sub1.constant = {value: "\""};

    // CodeExpression
    function WS() {
        const HAS_INₒ = HAS_IN;
        HAS_IN = false;
        const result = WS_sub1();
        HAS_IN = HAS_INₒ;
        return result;
    }

    // QuantifiedExpression
    function WS_sub1() {
        const IPₒ = IP;
        let out;
        do {
            if (!WS_sub2()) break;
            if (IP === IPₒ) break;
            out = concat(out, OUT);
        } while (true);
        OUT = out;
        return true;
    }

    // SelectionExpression
    function WS_sub2() {
        if (WS_sub3()) return true;
        if (WS_sub4()) return true;
        if (WS_sub5()) return true;
        if (WS_sub6()) return true;
        return false;
    }

    // StringUniversal
    function WS_sub3() {
        if (HAS_IN) {
            if (typeof IN !== 'string') return false;
            if (IP + 1 > IN.length) return false;
            if (IN.charCodeAt(IP + 0) !== 32) return false;
            IP += 1;
        }
        OUT = HAS_OUT ? " " : undefined;
        return true;
    }
    WS_sub3.constant = {value: " "};

    // StringUniversal
    function WS_sub4() {
        if (HAS_IN) {
            if (typeof IN !== 'string') return false;
            if (IP + 1 > IN.length) return false;
            if (IN.charCodeAt(IP + 0) !== 9) return false;
            IP += 1;
        }
        OUT = HAS_OUT ? "\t" : undefined;
        return true;
    }
    WS_sub4.constant = {value: "\t"};

    // StringUniversal
    function WS_sub5() {
        if (HAS_IN) {
            if (typeof IN !== 'string') return false;
            if (IP + 1 > IN.length) return false;
            if (IN.charCodeAt(IP + 0) !== 10) return false;
            IP += 1;
        }
        OUT = HAS_OUT ? "\n" : undefined;
        return true;
    }
    WS_sub5.constant = {value: "\n"};

    // StringUniversal
    function WS_sub6() {
        if (HAS_IN) {
            if (typeof IN !== 'string') return false;
            if (IP + 1 > IN.length) return false;
            if (IN.charCodeAt(IP + 0) !== 13) return false;
            IP += 1;
        }
        OUT = HAS_OUT ? "\r" : undefined;
        return true;
    }
    WS_sub6.constant = {value: "\r"};

    // Module
    function Ɱ_json(member) {
        switch (member) {
            case 'ascii': return ascii;
            case 'f64': return f64;
            case 'unicode': return unicode;
            case 'start': return start_2;
            case 'Value': return Value;
            case 'False': return False;
            case 'Null': return Null;
            case 'True': return True;
            case 'Object': return Object;
            case 'Property': return Property;
            case 'Array': return Array;
            case 'Element': return Element;
            case 'Number': return Number;
            case 'String': return String;
            case 'CHAR': return CHAR;
            case 'LBRACE': return LBRACE;
            case 'RBRACE': return RBRACE;
            case 'LBRACKET': return LBRACKET;
            case 'RBRACKET': return RBRACKET;
            case 'COLON': return COLON;
            case 'COMMA': return COMMA;
            case 'DOUBLE_QUOTE': return DOUBLE_QUOTE;
            case 'WS': return WS;
            default: return undefined;
        }
    }

    // Intrinsic

    // Intrinsic

    // Intrinsic

    // Intrinsic

    // Module
    function Ɱ_std(member) {
        switch (member) {
            case 'ascii': return ascii_2;
            case 'f64': return f64_2;
            case 'i32': return i32;
            case 'memoise': return memoise;
            default: return undefined;
        }
    }

    // Intrinsic

    // Module
    function Ɱ_experiments(member) {
        switch (member) {
            case 'unicode': return unicode_2;
            default: return undefined;
        }
    }

    return start_2;
})();
