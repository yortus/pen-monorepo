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
};




// ------------------------------ PARSE ------------------------------
const parse = (() => {

    // Intrinsic
    const ascii_2 = extensions["V:/projects/oss/pen-monorepo/packages/core/penc/dist/deps/std.pen.js"].ascii({mode: 'parse'});
    const f64 = extensions["V:/projects/oss/pen-monorepo/packages/core/penc/dist/deps/std.pen.js"].f64({mode: 'parse'});
    const i32 = extensions["V:/projects/oss/pen-monorepo/packages/core/penc/dist/deps/std.pen.js"].i32({mode: 'parse'});
    const memoise = extensions["V:/projects/oss/pen-monorepo/packages/core/penc/dist/deps/std.pen.js"].memoise({mode: 'parse'});

    // Identifier
    function foo(arg) {
        return f(arg);
    }

    // Identifier
    function bar(arg) {
        return b_2(arg);
    }

    // Identifier
    function baz(arg) {
        return baz_2(arg);
    }

    // Identifier
    function ascii(arg) {
        return ascii_2(arg);
    }

    // Identifier
    function start_2(arg) {
        return result(arg);
    }

    // StringUniversal
    function min() {
        if (HAS_IN) {
            if (IP + 1 > IN.length) return false;
            if (IN.charCodeAt(IP + 0) !== 48) return false;
            IP += 1;
        }
        OUT = HAS_OUT ? "0" : undefined;
        return true;
    }
    min.constant = {value: "0"};

    // StringUniversal
    function max() {
        if (HAS_IN) {
            if (IP + 1 > IN.length) return false;
            if (IN.charCodeAt(IP + 0) !== 57) return false;
            IP += 1;
        }
        OUT = HAS_OUT ? "9" : undefined;
        return true;
    }
    max.constant = {value: "9"};

    // InstantiationExpression
    let digitₘ;
    function digit(arg) {
        try {
            return digitₘ(arg);
        }
        catch (err) {
            if (!(err instanceof TypeError) || !err.message.includes('digitₘ is not a function')) throw err;
            digitₘ = ascii(digit_sub1);
            return digitₘ(arg);
        }
    }

    // Module
    function digit_sub1(member) {
        switch (member) {
            case 'min': return min;
            case 'max': return max;
            default: return undefined;
        }
    }

    // StringUniversal
    function min_2() {
        if (HAS_IN) {
            if (IP + 1 > IN.length) return false;
            if (IN.charCodeAt(IP + 0) !== 97) return false;
            IP += 1;
        }
        OUT = HAS_OUT ? "a" : undefined;
        return true;
    }
    min_2.constant = {value: "a"};

    // StringUniversal
    function max_2() {
        if (HAS_IN) {
            if (IP + 1 > IN.length) return false;
            if (IN.charCodeAt(IP + 0) !== 122) return false;
            IP += 1;
        }
        OUT = HAS_OUT ? "z" : undefined;
        return true;
    }
    max_2.constant = {value: "z"};

    // StringUniversal
    function min_3() {
        if (HAS_IN) {
            if (IP + 1 > IN.length) return false;
            if (IN.charCodeAt(IP + 0) !== 65) return false;
            IP += 1;
        }
        OUT = HAS_OUT ? "A" : undefined;
        return true;
    }
    min_3.constant = {value: "A"};

    // StringUniversal
    function max_3() {
        if (HAS_IN) {
            if (IP + 1 > IN.length) return false;
            if (IN.charCodeAt(IP + 0) !== 90) return false;
            IP += 1;
        }
        OUT = HAS_OUT ? "Z" : undefined;
        return true;
    }
    max_3.constant = {value: "Z"};

    // SelectionExpression
    function alpha() {
        if (alpha_sub1()) return true;
        if (alpha_sub3()) return true;
        return false;
    }

    // InstantiationExpression
    let alpha_sub1ₘ;
    function alpha_sub1(arg) {
        try {
            return alpha_sub1ₘ(arg);
        }
        catch (err) {
            if (!(err instanceof TypeError) || !err.message.includes('alpha_sub1ₘ is not a function')) throw err;
            alpha_sub1ₘ = ascii(alpha_sub2);
            return alpha_sub1ₘ(arg);
        }
    }

    // Module
    function alpha_sub2(member) {
        switch (member) {
            case 'min': return min_2;
            case 'max': return max_2;
            default: return undefined;
        }
    }

    // InstantiationExpression
    let alpha_sub3ₘ;
    function alpha_sub3(arg) {
        try {
            return alpha_sub3ₘ(arg);
        }
        catch (err) {
            if (!(err instanceof TypeError) || !err.message.includes('alpha_sub3ₘ is not a function')) throw err;
            alpha_sub3ₘ = ascii(alpha_sub4);
            return alpha_sub3ₘ(arg);
        }
    }

    // Module
    function alpha_sub4(member) {
        switch (member) {
            case 'min': return min_3;
            case 'max': return max_3;
            default: return undefined;
        }
    }

    // SequenceExpression
    function result() {
        const stateₒ = getState();
        let out;
        if (foo()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (result_sub1()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // SequenceExpression
    function result_sub1() {
        const stateₒ = getState();
        let out;
        if (bar()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (baz()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // ListExpression
    function myList() {
        return parseList([digit, myList_sub1, myList_sub2]);
    }

    // SequenceExpression
    function myList_sub1() {
        const stateₒ = getState();
        let out;
        if (digit()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (digit()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // SequenceExpression
    function myList_sub2() {
        const stateₒ = getState();
        let out;
        if (digit()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (digit()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (digit()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringAbstract
    function b() {
        OUT = HAS_OUT ? "b thing" : undefined;
        return true;
    }
    b.constant = {value: "b thing"};

    // StringAbstract
    function d() {
        OUT = HAS_OUT ? "d thing" : undefined;
        return true;
    }
    d.constant = {value: "d thing"};

    // Module
    function rec(member) {
        switch (member) {
            case 'b': return b;
            case 'd': return d;
            default: return undefined;
        }
    }

    // Identifier
    function r2(arg) {
        return rec(arg);
    }

    // Identifier
    function r2d(arg) {
        return d(arg);
    }

    // Module
    function Ɱ_import_graph(member) {
        switch (member) {
            case 'foo': return foo;
            case 'bar': return bar;
            case 'baz': return baz;
            case 'ascii': return ascii;
            case 'start': return start_2;
            case 'digit': return digit;
            case 'alpha': return alpha;
            case 'result': return result;
            case 'myList': return myList;
            case 'rec': return rec;
            case 'r2': return r2;
            case 'r2d': return r2d;
            default: return undefined;
        }
    }

    // StringUniversal
    function f() {
        if (HAS_IN) {
            if (IP + 3 > IN.length) return false;
            if (IN.charCodeAt(IP + 0) !== 102) return false;
            if (IN.charCodeAt(IP + 1) !== 111) return false;
            if (IN.charCodeAt(IP + 2) !== 111) return false;
            IP += 3;
        }
        OUT = HAS_OUT ? "foo" : undefined;
        return true;
    }
    f.constant = {value: "foo"};

    // StringUniversal
    function b_2() {
        if (HAS_IN) {
            if (IP + 3 > IN.length) return false;
            if (IN.charCodeAt(IP + 0) !== 98) return false;
            if (IN.charCodeAt(IP + 1) !== 97) return false;
            if (IN.charCodeAt(IP + 2) !== 114) return false;
            IP += 3;
        }
        OUT = HAS_OUT ? "bar" : undefined;
        return true;
    }
    b_2.constant = {value: "bar"};

    // StringUniversal
    function baz_2() {
        if (HAS_IN) {
            if (IP + 3 > IN.length) return false;
            if (IN.charCodeAt(IP + 0) !== 98) return false;
            if (IN.charCodeAt(IP + 1) !== 97) return false;
            if (IN.charCodeAt(IP + 2) !== 122) return false;
            IP += 3;
        }
        OUT = HAS_OUT ? "baz" : undefined;
        return true;
    }
    baz_2.constant = {value: "baz"};

    // Module
    function Ɱ_a(member) {
        switch (member) {
            case 'f': return f;
            case 'b': return b_2;
            case 'baz': return baz_2;
            default: return undefined;
        }
    }

    // Module
    function Ɱ_b(member) {
        switch (member) {
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
            case 'f64': return f64;
            case 'i32': return i32;
            case 'memoise': return memoise;
            default: return undefined;
        }
    }

    // Module
    function Ɱ_c(member) {
        switch (member) {
            default: return undefined;
        }
    }

    // Module
    function Ɱ_d(member) {
        switch (member) {
            default: return undefined;
        }
    }

    // Identifier
    function util1(arg) {
        return Ɱ_util1(arg);
    }

    // Identifier
    function util2(arg) {
        return Ɱ_util2(arg);
    }

    // Module
    function util(member) {
        switch (member) {
            case 'util1': return util1;
            case 'util2': return util2;
            default: return undefined;
        }
    }

    // Module
    function Ɱ_util(member) {
        switch (member) {
            case 'util': return util;
            default: return undefined;
        }
    }

    // StringUniversal
    function util1_2() {
        if (HAS_IN) {
            if (IP + 5 > IN.length) return false;
            if (IN.charCodeAt(IP + 0) !== 117) return false;
            if (IN.charCodeAt(IP + 1) !== 116) return false;
            if (IN.charCodeAt(IP + 2) !== 105) return false;
            if (IN.charCodeAt(IP + 3) !== 108) return false;
            if (IN.charCodeAt(IP + 4) !== 49) return false;
            IP += 5;
        }
        OUT = HAS_OUT ? "util1" : undefined;
        return true;
    }
    util1_2.constant = {value: "util1"};

    // Module
    function Ɱ_util1(member) {
        switch (member) {
            case 'util1': return util1_2;
            default: return undefined;
        }
    }

    // StringUniversal
    function util2_2() {
        if (HAS_IN) {
            if (IP + 5 > IN.length) return false;
            if (IN.charCodeAt(IP + 0) !== 117) return false;
            if (IN.charCodeAt(IP + 1) !== 116) return false;
            if (IN.charCodeAt(IP + 2) !== 105) return false;
            if (IN.charCodeAt(IP + 3) !== 108) return false;
            if (IN.charCodeAt(IP + 4) !== 50) return false;
            IP += 5;
        }
        OUT = HAS_OUT ? "util2" : undefined;
        return true;
    }
    util2_2.constant = {value: "util2"};

    // Module
    function Ɱ_util2(member) {
        switch (member) {
            case 'util2': return util2_2;
            default: return undefined;
        }
    }

    return start_2;
})();




// ------------------------------ PRINT ------------------------------
const print = (() => {

    // Intrinsic
    const ascii_2 = extensions["V:/projects/oss/pen-monorepo/packages/core/penc/dist/deps/std.pen.js"].ascii({mode: 'print'});
    const f64 = extensions["V:/projects/oss/pen-monorepo/packages/core/penc/dist/deps/std.pen.js"].f64({mode: 'print'});
    const i32 = extensions["V:/projects/oss/pen-monorepo/packages/core/penc/dist/deps/std.pen.js"].i32({mode: 'print'});
    const memoise = extensions["V:/projects/oss/pen-monorepo/packages/core/penc/dist/deps/std.pen.js"].memoise({mode: 'print'});

    // Identifier
    function foo(arg) {
        return f(arg);
    }

    // Identifier
    function bar(arg) {
        return b_2(arg);
    }

    // Identifier
    function baz(arg) {
        return baz_2(arg);
    }

    // Identifier
    function ascii(arg) {
        return ascii_2(arg);
    }

    // Identifier
    function start_2(arg) {
        return result(arg);
    }

    // StringUniversal
    function min() {
        if (HAS_IN) {
            if (typeof IN !== 'string') return false;
            if (IP + 1 > IN.length) return false;
            if (IN.charCodeAt(IP + 0) !== 48) return false;
            IP += 1;
        }
        OUT = HAS_OUT ? "0" : undefined;
        return true;
    }
    min.constant = {value: "0"};

    // StringUniversal
    function max() {
        if (HAS_IN) {
            if (typeof IN !== 'string') return false;
            if (IP + 1 > IN.length) return false;
            if (IN.charCodeAt(IP + 0) !== 57) return false;
            IP += 1;
        }
        OUT = HAS_OUT ? "9" : undefined;
        return true;
    }
    max.constant = {value: "9"};

    // InstantiationExpression
    let digitₘ;
    function digit(arg) {
        try {
            return digitₘ(arg);
        }
        catch (err) {
            if (!(err instanceof TypeError) || !err.message.includes('digitₘ is not a function')) throw err;
            digitₘ = ascii(digit_sub1);
            return digitₘ(arg);
        }
    }

    // Module
    function digit_sub1(member) {
        switch (member) {
            case 'min': return min;
            case 'max': return max;
            default: return undefined;
        }
    }

    // StringUniversal
    function min_2() {
        if (HAS_IN) {
            if (typeof IN !== 'string') return false;
            if (IP + 1 > IN.length) return false;
            if (IN.charCodeAt(IP + 0) !== 97) return false;
            IP += 1;
        }
        OUT = HAS_OUT ? "a" : undefined;
        return true;
    }
    min_2.constant = {value: "a"};

    // StringUniversal
    function max_2() {
        if (HAS_IN) {
            if (typeof IN !== 'string') return false;
            if (IP + 1 > IN.length) return false;
            if (IN.charCodeAt(IP + 0) !== 122) return false;
            IP += 1;
        }
        OUT = HAS_OUT ? "z" : undefined;
        return true;
    }
    max_2.constant = {value: "z"};

    // StringUniversal
    function min_3() {
        if (HAS_IN) {
            if (typeof IN !== 'string') return false;
            if (IP + 1 > IN.length) return false;
            if (IN.charCodeAt(IP + 0) !== 65) return false;
            IP += 1;
        }
        OUT = HAS_OUT ? "A" : undefined;
        return true;
    }
    min_3.constant = {value: "A"};

    // StringUniversal
    function max_3() {
        if (HAS_IN) {
            if (typeof IN !== 'string') return false;
            if (IP + 1 > IN.length) return false;
            if (IN.charCodeAt(IP + 0) !== 90) return false;
            IP += 1;
        }
        OUT = HAS_OUT ? "Z" : undefined;
        return true;
    }
    max_3.constant = {value: "Z"};

    // SelectionExpression
    function alpha() {
        if (alpha_sub1()) return true;
        if (alpha_sub3()) return true;
        return false;
    }

    // InstantiationExpression
    let alpha_sub1ₘ;
    function alpha_sub1(arg) {
        try {
            return alpha_sub1ₘ(arg);
        }
        catch (err) {
            if (!(err instanceof TypeError) || !err.message.includes('alpha_sub1ₘ is not a function')) throw err;
            alpha_sub1ₘ = ascii(alpha_sub2);
            return alpha_sub1ₘ(arg);
        }
    }

    // Module
    function alpha_sub2(member) {
        switch (member) {
            case 'min': return min_2;
            case 'max': return max_2;
            default: return undefined;
        }
    }

    // InstantiationExpression
    let alpha_sub3ₘ;
    function alpha_sub3(arg) {
        try {
            return alpha_sub3ₘ(arg);
        }
        catch (err) {
            if (!(err instanceof TypeError) || !err.message.includes('alpha_sub3ₘ is not a function')) throw err;
            alpha_sub3ₘ = ascii(alpha_sub4);
            return alpha_sub3ₘ(arg);
        }
    }

    // Module
    function alpha_sub4(member) {
        switch (member) {
            case 'min': return min_3;
            case 'max': return max_3;
            default: return undefined;
        }
    }

    // SequenceExpression
    function result() {
        const stateₒ = getState();
        let out;
        if (foo()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (result_sub1()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // SequenceExpression
    function result_sub1() {
        const stateₒ = getState();
        let out;
        if (bar()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (baz()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // ListExpression
    function myList() {
        return printList([digit, myList_sub1, myList_sub2]);
    }

    // SequenceExpression
    function myList_sub1() {
        const stateₒ = getState();
        let out;
        if (digit()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (digit()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // SequenceExpression
    function myList_sub2() {
        const stateₒ = getState();
        let out;
        if (digit()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (digit()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (digit()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringAbstract
    function b() {
        if (HAS_IN) {
            if (typeof IN !== 'string') return false;
            if (IP + 7 > IN.length) return false;
            if (IN.charCodeAt(IP + 0) !== 98) return false;
            if (IN.charCodeAt(IP + 1) !== 32) return false;
            if (IN.charCodeAt(IP + 2) !== 116) return false;
            if (IN.charCodeAt(IP + 3) !== 104) return false;
            if (IN.charCodeAt(IP + 4) !== 105) return false;
            if (IN.charCodeAt(IP + 5) !== 110) return false;
            if (IN.charCodeAt(IP + 6) !== 103) return false;
            IP += 7;
        }
        OUT = HAS_OUT ? undefined : undefined;
        return true;
    }
    b.constant = {value: "b thing"};

    // StringAbstract
    function d() {
        if (HAS_IN) {
            if (typeof IN !== 'string') return false;
            if (IP + 7 > IN.length) return false;
            if (IN.charCodeAt(IP + 0) !== 100) return false;
            if (IN.charCodeAt(IP + 1) !== 32) return false;
            if (IN.charCodeAt(IP + 2) !== 116) return false;
            if (IN.charCodeAt(IP + 3) !== 104) return false;
            if (IN.charCodeAt(IP + 4) !== 105) return false;
            if (IN.charCodeAt(IP + 5) !== 110) return false;
            if (IN.charCodeAt(IP + 6) !== 103) return false;
            IP += 7;
        }
        OUT = HAS_OUT ? undefined : undefined;
        return true;
    }
    d.constant = {value: "d thing"};

    // Module
    function rec(member) {
        switch (member) {
            case 'b': return b;
            case 'd': return d;
            default: return undefined;
        }
    }

    // Identifier
    function r2(arg) {
        return rec(arg);
    }

    // Identifier
    function r2d(arg) {
        return d(arg);
    }

    // Module
    function Ɱ_import_graph(member) {
        switch (member) {
            case 'foo': return foo;
            case 'bar': return bar;
            case 'baz': return baz;
            case 'ascii': return ascii;
            case 'start': return start_2;
            case 'digit': return digit;
            case 'alpha': return alpha;
            case 'result': return result;
            case 'myList': return myList;
            case 'rec': return rec;
            case 'r2': return r2;
            case 'r2d': return r2d;
            default: return undefined;
        }
    }

    // StringUniversal
    function f() {
        if (HAS_IN) {
            if (typeof IN !== 'string') return false;
            if (IP + 3 > IN.length) return false;
            if (IN.charCodeAt(IP + 0) !== 102) return false;
            if (IN.charCodeAt(IP + 1) !== 111) return false;
            if (IN.charCodeAt(IP + 2) !== 111) return false;
            IP += 3;
        }
        OUT = HAS_OUT ? "foo" : undefined;
        return true;
    }
    f.constant = {value: "foo"};

    // StringUniversal
    function b_2() {
        if (HAS_IN) {
            if (typeof IN !== 'string') return false;
            if (IP + 3 > IN.length) return false;
            if (IN.charCodeAt(IP + 0) !== 98) return false;
            if (IN.charCodeAt(IP + 1) !== 97) return false;
            if (IN.charCodeAt(IP + 2) !== 114) return false;
            IP += 3;
        }
        OUT = HAS_OUT ? "bar" : undefined;
        return true;
    }
    b_2.constant = {value: "bar"};

    // StringUniversal
    function baz_2() {
        if (HAS_IN) {
            if (typeof IN !== 'string') return false;
            if (IP + 3 > IN.length) return false;
            if (IN.charCodeAt(IP + 0) !== 98) return false;
            if (IN.charCodeAt(IP + 1) !== 97) return false;
            if (IN.charCodeAt(IP + 2) !== 122) return false;
            IP += 3;
        }
        OUT = HAS_OUT ? "baz" : undefined;
        return true;
    }
    baz_2.constant = {value: "baz"};

    // Module
    function Ɱ_a(member) {
        switch (member) {
            case 'f': return f;
            case 'b': return b_2;
            case 'baz': return baz_2;
            default: return undefined;
        }
    }

    // Module
    function Ɱ_b(member) {
        switch (member) {
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
            case 'f64': return f64;
            case 'i32': return i32;
            case 'memoise': return memoise;
            default: return undefined;
        }
    }

    // Module
    function Ɱ_c(member) {
        switch (member) {
            default: return undefined;
        }
    }

    // Module
    function Ɱ_d(member) {
        switch (member) {
            default: return undefined;
        }
    }

    // Identifier
    function util1(arg) {
        return Ɱ_util1(arg);
    }

    // Identifier
    function util2(arg) {
        return Ɱ_util2(arg);
    }

    // Module
    function util(member) {
        switch (member) {
            case 'util1': return util1;
            case 'util2': return util2;
            default: return undefined;
        }
    }

    // Module
    function Ɱ_util(member) {
        switch (member) {
            case 'util': return util;
            default: return undefined;
        }
    }

    // StringUniversal
    function util1_2() {
        if (HAS_IN) {
            if (typeof IN !== 'string') return false;
            if (IP + 5 > IN.length) return false;
            if (IN.charCodeAt(IP + 0) !== 117) return false;
            if (IN.charCodeAt(IP + 1) !== 116) return false;
            if (IN.charCodeAt(IP + 2) !== 105) return false;
            if (IN.charCodeAt(IP + 3) !== 108) return false;
            if (IN.charCodeAt(IP + 4) !== 49) return false;
            IP += 5;
        }
        OUT = HAS_OUT ? "util1" : undefined;
        return true;
    }
    util1_2.constant = {value: "util1"};

    // Module
    function Ɱ_util1(member) {
        switch (member) {
            case 'util1': return util1_2;
            default: return undefined;
        }
    }

    // StringUniversal
    function util2_2() {
        if (HAS_IN) {
            if (typeof IN !== 'string') return false;
            if (IP + 5 > IN.length) return false;
            if (IN.charCodeAt(IP + 0) !== 117) return false;
            if (IN.charCodeAt(IP + 1) !== 116) return false;
            if (IN.charCodeAt(IP + 2) !== 105) return false;
            if (IN.charCodeAt(IP + 3) !== 108) return false;
            if (IN.charCodeAt(IP + 4) !== 50) return false;
            IP += 5;
        }
        OUT = HAS_OUT ? "util2" : undefined;
        return true;
    }
    util2_2.constant = {value: "util2"};

    // Module
    function Ɱ_util2(member) {
        switch (member) {
            case 'util2': return util2_2;
            default: return undefined;
        }
    }

    return start_2;
})();
