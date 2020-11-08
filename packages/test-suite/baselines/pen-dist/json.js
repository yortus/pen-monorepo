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
            return function I32_lambda(expr) {
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
    "V:\\projects\\oss\\pen-monorepo\\packages\\core\\penc\\dist\\deps\\experiments.pen.js": (() => {
        "use strict";
        /* @pen exports = {
            unicode
        } */
        function unicode({ mode }) {
            return function UNI_lambda(expr) {
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

    // ExtensionExpressions
    const std_char = extensions["V:\\projects\\oss\\pen-monorepo\\packages\\core\\penc\\dist\\deps\\std.pen.js"].char({mode: 6});
    const experiments_unicode = extensions["V:\\projects\\oss\\pen-monorepo\\packages\\core\\penc\\dist\\deps\\experiments.pen.js"].unicode({mode: 6});
    const std_f64 = extensions["V:\\projects\\oss\\pen-monorepo\\packages\\core\\penc\\dist\\deps\\std.pen.js"].f64({mode: 6});

    // SequenceExpression
    function json_start() {
        const stateₒ = getState();
        let out;
        if (json_WS()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (json_Value()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (json_WS()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // QuantifiedExpression
    function json_WS() {
        const IPₒ = IP;
        let out;
        do {
            if (!e1()) break;
            if (IP === IPₒ) break;
            out = concat(out, OUT);
        } while (true);
        OUT = out;
        return true;
    }

    // SelectionExpression
    function e1() {
        if (e2()) return true;
        if (e3()) return true;
        if (e4()) return true;
        if (e5()) return true;
        return false;
    }

    // StringLiteralExpression
    function e2() {
        if (IP + 1 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 32) return false;
        IP += 1;
        OUT = undefined;
        return true;
    }
    e2.constant = {value: " "};

    // StringLiteralExpression
    function e3() {
        if (IP + 1 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 9) return false;
        IP += 1;
        OUT = undefined;
        return true;
    }
    e3.constant = {value: "\t"};

    // StringLiteralExpression
    function e4() {
        if (IP + 1 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 10) return false;
        IP += 1;
        OUT = undefined;
        return true;
    }
    e4.constant = {value: "\n"};

    // StringLiteralExpression
    function e5() {
        if (IP + 1 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 13) return false;
        IP += 1;
        OUT = undefined;
        return true;
    }
    e5.constant = {value: "\r"};

    // SelectionExpression
    function json_Value() {
        if (json_False()) return true;
        if (json_Null()) return true;
        if (json_True()) return true;
        if (json_Object()) return true;
        if (json_Array()) return true;
        if (std_f64()) return true;
        if (json_String()) return true;
        return false;
    }

    // SequenceExpression
    function json_False() {
        const stateₒ = getState();
        let out;
        if (e6()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (e7()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringLiteralExpression
    function e6() {
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
    e6.constant = {value: "false"};

    // BooleanLiteralExpression
    function e7() {
        OUT = false;
        return true;
    }
    e7.constant = {value: false};

    // SequenceExpression
    function json_Null() {
        const stateₒ = getState();
        let out;
        if (e8()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (e9()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringLiteralExpression
    function e8() {
        if (IP + 4 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 110) return false;
        if (IN.charCodeAt(IP + 1) !== 117) return false;
        if (IN.charCodeAt(IP + 2) !== 108) return false;
        if (IN.charCodeAt(IP + 3) !== 108) return false;
        IP += 4;
        OUT = undefined;
        return true;
    }
    e8.constant = {value: "null"};

    // NullLiteralExpression
    function e9() {
        OUT = null;
        return true;
    }
    e9.constant = {value: null};

    // SequenceExpression
    function json_True() {
        const stateₒ = getState();
        let out;
        if (e10()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (e11()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringLiteralExpression
    function e10() {
        if (IP + 4 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 116) return false;
        if (IN.charCodeAt(IP + 1) !== 114) return false;
        if (IN.charCodeAt(IP + 2) !== 117) return false;
        if (IN.charCodeAt(IP + 3) !== 101) return false;
        IP += 4;
        OUT = undefined;
        return true;
    }
    e10.constant = {value: "true"};

    // BooleanLiteralExpression
    function e11() {
        OUT = true;
        return true;
    }
    e11.constant = {value: true};

    // SequenceExpression
    function json_Object() {
        const stateₒ = getState();
        let out;
        if (json_LBRACE()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (e13()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (json_RBRACE()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // SequenceExpression
    function json_LBRACE() {
        const stateₒ = getState();
        let out;
        if (json_WS()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (e12()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (json_WS()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringLiteralExpression
    function e12() {
        if (IP + 1 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 123) return false;
        IP += 1;
        OUT = undefined;
        return true;
    }
    e12.constant = {value: "{"};

    // SelectionExpression
    function e13() {
        if (e14()) return true;
        if (e56()) return true;
        return false;
    }

    // SequenceExpression
    function e14() {
        const stateₒ = getState();
        let out;
        if (json_Property()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (e53()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // FieldExpression
    function json_Property() {
        return parseField(json_String, e51);
    }

    // SequenceExpression
    function json_String() {
        const stateₒ = getState();
        let out;
        if (json_DOUBLE_QUOTE()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (e15()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (json_DOUBLE_QUOTE()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringLiteralExpression
    function json_DOUBLE_QUOTE() {
        if (IP + 1 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 34) return false;
        IP += 1;
        OUT = undefined;
        return true;
    }
    json_DOUBLE_QUOTE.constant = {value: "\""};

    // QuantifiedExpression
    function e15() {
        const IPₒ = IP;
        let out;
        do {
            if (!json_CHAR()) break;
            if (IP === IPₒ) break;
            out = concat(out, OUT);
        } while (true);
        OUT = out;
        return true;
    }

    // SelectionExpression
    function json_CHAR() {
        if (e16()) return true;
        if (e23()) return true;
        if (e26()) return true;
        if (e29()) return true;
        if (e32()) return true;
        if (e35()) return true;
        if (e38()) return true;
        if (e41()) return true;
        if (e44()) return true;
        if (e47()) return true;
        return false;
    }

    // SequenceExpression
    function e16() {
        const stateₒ = getState();
        let out;
        if (e17()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (e19()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (e21()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // NotExpression
    function e17() {
        const stateₒ = getState();
        const result = !e18();
        setState(stateₒ);
        OUT = undefined;
        return result;
    }

    // StringLiteralExpression
    function e18() {
        if (IP + 1 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 92) return false;
        IP += 1;
        OUT = "\\";
        return true;
    }
    e18.constant = {value: "\\"};

    // NotExpression
    function e19() {
        const stateₒ = getState();
        const result = !e20();
        setState(stateₒ);
        OUT = undefined;
        return result;
    }

    // StringLiteralExpression
    function e20() {
        if (IP + 1 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 34) return false;
        IP += 1;
        OUT = "\"";
        return true;
    }
    e20.constant = {value: "\""};

    // ApplicationExpression
    let e21ₘ;
    function e21(arg) {
        try {
            return e21ₘ(arg);
        }
        catch (err) {
            if (!(err instanceof TypeError) || !err.message.includes('e21ₘ is not a function')) throw err;
            e21ₘ = std_char(e22);
            return e21ₘ(arg);
        }
    }

    // ExtensionExpression

    // ModuleExpression
    function e22(bindingName) {
        switch (bindingName) {
            case 'min': return 𝕊1_min;
            case 'max': return 𝕊1_max;
            default: return undefined;
        }
    }

    // StringLiteralExpression
    function 𝕊1_min() {
        if (IP + 1 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 32) return false;
        IP += 1;
        OUT = " ";
        return true;
    }
    𝕊1_min.constant = {value: " "};

    // StringLiteralExpression
    function 𝕊1_max() {
        if (IP + 1 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 65535) return false;
        IP += 1;
        OUT = "￿";
        return true;
    }
    𝕊1_max.constant = {value: "￿"};

    // SequenceExpression
    function e23() {
        const stateₒ = getState();
        let out;
        if (e24()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (e25()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringLiteralExpression
    function e24() {
        if (IP + 2 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 92) return false;
        if (IN.charCodeAt(IP + 1) !== 34) return false;
        IP += 2;
        OUT = undefined;
        return true;
    }
    e24.constant = {value: "\\\""};

    // StringLiteralExpression
    function e25() {
        OUT = "\"";
        return true;
    }
    e25.constant = {value: "\""};

    // SequenceExpression
    function e26() {
        const stateₒ = getState();
        let out;
        if (e27()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (e28()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringLiteralExpression
    function e27() {
        if (IP + 2 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 92) return false;
        if (IN.charCodeAt(IP + 1) !== 92) return false;
        IP += 2;
        OUT = undefined;
        return true;
    }
    e27.constant = {value: "\\\\"};

    // StringLiteralExpression
    function e28() {
        OUT = "\\";
        return true;
    }
    e28.constant = {value: "\\"};

    // SequenceExpression
    function e29() {
        const stateₒ = getState();
        let out;
        if (e30()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (e31()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringLiteralExpression
    function e30() {
        if (IP + 2 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 92) return false;
        if (IN.charCodeAt(IP + 1) !== 47) return false;
        IP += 2;
        OUT = undefined;
        return true;
    }
    e30.constant = {value: "\\/"};

    // StringLiteralExpression
    function e31() {
        OUT = "/";
        return true;
    }
    e31.constant = {value: "/"};

    // SequenceExpression
    function e32() {
        const stateₒ = getState();
        let out;
        if (e33()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (e34()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringLiteralExpression
    function e33() {
        if (IP + 2 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 92) return false;
        if (IN.charCodeAt(IP + 1) !== 98) return false;
        IP += 2;
        OUT = undefined;
        return true;
    }
    e33.constant = {value: "\\b"};

    // StringLiteralExpression
    function e34() {
        OUT = "\b";
        return true;
    }
    e34.constant = {value: "\b"};

    // SequenceExpression
    function e35() {
        const stateₒ = getState();
        let out;
        if (e36()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (e37()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringLiteralExpression
    function e36() {
        if (IP + 2 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 92) return false;
        if (IN.charCodeAt(IP + 1) !== 102) return false;
        IP += 2;
        OUT = undefined;
        return true;
    }
    e36.constant = {value: "\\f"};

    // StringLiteralExpression
    function e37() {
        OUT = "\f";
        return true;
    }
    e37.constant = {value: "\f"};

    // SequenceExpression
    function e38() {
        const stateₒ = getState();
        let out;
        if (e39()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (e40()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringLiteralExpression
    function e39() {
        if (IP + 2 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 92) return false;
        if (IN.charCodeAt(IP + 1) !== 110) return false;
        IP += 2;
        OUT = undefined;
        return true;
    }
    e39.constant = {value: "\\n"};

    // StringLiteralExpression
    function e40() {
        OUT = "\n";
        return true;
    }
    e40.constant = {value: "\n"};

    // SequenceExpression
    function e41() {
        const stateₒ = getState();
        let out;
        if (e42()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (e43()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringLiteralExpression
    function e42() {
        if (IP + 2 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 92) return false;
        if (IN.charCodeAt(IP + 1) !== 114) return false;
        IP += 2;
        OUT = undefined;
        return true;
    }
    e42.constant = {value: "\\r"};

    // StringLiteralExpression
    function e43() {
        OUT = "\r";
        return true;
    }
    e43.constant = {value: "\r"};

    // SequenceExpression
    function e44() {
        const stateₒ = getState();
        let out;
        if (e45()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (e46()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringLiteralExpression
    function e45() {
        if (IP + 2 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 92) return false;
        if (IN.charCodeAt(IP + 1) !== 116) return false;
        IP += 2;
        OUT = undefined;
        return true;
    }
    e45.constant = {value: "\\t"};

    // StringLiteralExpression
    function e46() {
        OUT = "\t";
        return true;
    }
    e46.constant = {value: "\t"};

    // SequenceExpression
    function e47() {
        const stateₒ = getState();
        let out;
        if (e48()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (e49()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringLiteralExpression
    function e48() {
        if (IP + 2 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 92) return false;
        if (IN.charCodeAt(IP + 1) !== 117) return false;
        IP += 2;
        OUT = undefined;
        return true;
    }
    e48.constant = {value: "\\u"};

    // ApplicationExpression
    let e49ₘ;
    function e49(arg) {
        try {
            return e49ₘ(arg);
        }
        catch (err) {
            if (!(err instanceof TypeError) || !err.message.includes('e49ₘ is not a function')) throw err;
            e49ₘ = experiments_unicode(e50);
            return e49ₘ(arg);
        }
    }

    // ExtensionExpression

    // ModuleExpression
    function e50(bindingName) {
        switch (bindingName) {
            case 'base': return 𝕊2_base;
            case 'minDigits': return 𝕊2_maxDigits;
            case 'maxDigits': return 𝕊2_maxDigits;
            default: return undefined;
        }
    }

    // NumericLiteralExpression
    function 𝕊2_base() {
        OUT = 16;
        return true;
    }
    𝕊2_base.constant = {value: 16};

    // NumericLiteralExpression
    function 𝕊2_maxDigits() {
        OUT = 4;
        return true;
    }
    𝕊2_maxDigits.constant = {value: 4};

    // SequenceExpression
    function e51() {
        const stateₒ = getState();
        let out;
        if (json_COLON()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (json_Value()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // SequenceExpression
    function json_COLON() {
        const stateₒ = getState();
        let out;
        if (json_WS()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (e52()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (json_WS()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringLiteralExpression
    function e52() {
        if (IP + 1 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 58) return false;
        IP += 1;
        OUT = undefined;
        return true;
    }
    e52.constant = {value: ":"};

    // QuantifiedExpression
    function e53() {
        const IPₒ = IP;
        let out;
        do {
            if (!e54()) break;
            if (IP === IPₒ) break;
            out = concat(out, OUT);
        } while (true);
        OUT = out;
        return true;
    }

    // SequenceExpression
    function e54() {
        const stateₒ = getState();
        let out;
        if (json_COMMA()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (json_Property()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // SequenceExpression
    function json_COMMA() {
        const stateₒ = getState();
        let out;
        if (json_WS()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (e55()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (json_WS()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringLiteralExpression
    function e55() {
        if (IP + 1 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 44) return false;
        IP += 1;
        OUT = undefined;
        return true;
    }
    e55.constant = {value: ","};

    // RecordExpression
    function e56() {
        return parseRecord([]);
    }

    // SequenceExpression
    function json_RBRACE() {
        const stateₒ = getState();
        let out;
        if (json_WS()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (e57()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (json_WS()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringLiteralExpression
    function e57() {
        if (IP + 1 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 125) return false;
        IP += 1;
        OUT = undefined;
        return true;
    }
    e57.constant = {value: "}"};

    // SequenceExpression
    function json_Array() {
        const stateₒ = getState();
        let out;
        if (json_LBRACKET()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (e59()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (json_RBRACKET()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // SequenceExpression
    function json_LBRACKET() {
        const stateₒ = getState();
        let out;
        if (json_WS()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (e58()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (json_WS()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringLiteralExpression
    function e58() {
        if (IP + 1 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 91) return false;
        IP += 1;
        OUT = undefined;
        return true;
    }
    e58.constant = {value: "["};

    // SelectionExpression
    function e59() {
        if (e60()) return true;
        if (e63()) return true;
        return false;
    }

    // SequenceExpression
    function e60() {
        const stateₒ = getState();
        let out;
        if (json_Element()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (e61()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // ListExpression
    function json_Element() {
        return parseList([json_Value]);
    }

    // QuantifiedExpression
    function e61() {
        const IPₒ = IP;
        let out;
        do {
            if (!e62()) break;
            if (IP === IPₒ) break;
            out = concat(out, OUT);
        } while (true);
        OUT = out;
        return true;
    }

    // SequenceExpression
    function e62() {
        const stateₒ = getState();
        let out;
        if (json_COMMA()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (json_Element()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // ListExpression
    function e63() {
        return parseList([]);
    }

    // SequenceExpression
    function json_RBRACKET() {
        const stateₒ = getState();
        let out;
        if (json_WS()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (e64()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (json_WS()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringLiteralExpression
    function e64() {
        if (IP + 1 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 93) return false;
        IP += 1;
        OUT = undefined;
        return true;
    }
    e64.constant = {value: "]"};

    // ExtensionExpression

    return json_start;
})();




// ------------------------------ PRINT ------------------------------
const print = (() => {

    // ExtensionExpressions
    const std_char = extensions["V:\\projects\\oss\\pen-monorepo\\packages\\core\\penc\\dist\\deps\\std.pen.js"].char({mode: 7});
    const experiments_unicode = extensions["V:\\projects\\oss\\pen-monorepo\\packages\\core\\penc\\dist\\deps\\experiments.pen.js"].unicode({mode: 7});
    const std_f64 = extensions["V:\\projects\\oss\\pen-monorepo\\packages\\core\\penc\\dist\\deps\\std.pen.js"].f64({mode: 7});

    // SequenceExpression
    function json_start() {
        const stateₒ = getState();
        let out;
        if (json_WS()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (json_Value()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (json_WS()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // QuantifiedExpression
    function json_WS() {
        const IPₒ = IP;
        let out;
        do {
            if (!e1()) break;
            if (IP === IPₒ) break;
            out = concat(out, OUT);
        } while (true);
        OUT = out;
        return true;
    }

    // SelectionExpression
    function e1() {
        if (e2()) return true;
        if (e3()) return true;
        if (e4()) return true;
        if (e5()) return true;
        return false;
    }

    // StringLiteralExpression
    function e2() {
        OUT = " ";
        return true;
    }
    e2.constant = {value: " "};

    // StringLiteralExpression
    function e3() {
        OUT = "\t";
        return true;
    }
    e3.constant = {value: "\t"};

    // StringLiteralExpression
    function e4() {
        OUT = "\n";
        return true;
    }
    e4.constant = {value: "\n"};

    // StringLiteralExpression
    function e5() {
        OUT = "\r";
        return true;
    }
    e5.constant = {value: "\r"};

    // SelectionExpression
    function json_Value() {
        if (json_False()) return true;
        if (json_Null()) return true;
        if (json_True()) return true;
        if (json_Object()) return true;
        if (json_Array()) return true;
        if (std_f64()) return true;
        if (json_String()) return true;
        return false;
    }

    // SequenceExpression
    function json_False() {
        const stateₒ = getState();
        let out;
        if (e6()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (e7()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringLiteralExpression
    function e6() {
        OUT = "false";
        return true;
    }
    e6.constant = {value: "false"};

    // BooleanLiteralExpression
    function e7() {
        if (IN !== false || IP !== 0) return false;
        IP += 1;
        OUT = undefined;
        return true;
    }
    e7.constant = {value: false};

    // SequenceExpression
    function json_Null() {
        const stateₒ = getState();
        let out;
        if (e8()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (e9()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringLiteralExpression
    function e8() {
        OUT = "null";
        return true;
    }
    e8.constant = {value: "null"};

    // NullLiteralExpression
    function e9() {
        if (IN !== null || IP !== 0) return false;
        IP += 1;
        OUT = undefined;
        return true;
    }
    e9.constant = {value: null};

    // SequenceExpression
    function json_True() {
        const stateₒ = getState();
        let out;
        if (e10()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (e11()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringLiteralExpression
    function e10() {
        OUT = "true";
        return true;
    }
    e10.constant = {value: "true"};

    // BooleanLiteralExpression
    function e11() {
        if (IN !== true || IP !== 0) return false;
        IP += 1;
        OUT = undefined;
        return true;
    }
    e11.constant = {value: true};

    // SequenceExpression
    function json_Object() {
        const stateₒ = getState();
        let out;
        if (json_LBRACE()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (e13()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (json_RBRACE()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // SequenceExpression
    function json_LBRACE() {
        const stateₒ = getState();
        let out;
        if (json_WS()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (e12()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (json_WS()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringLiteralExpression
    function e12() {
        OUT = "{";
        return true;
    }
    e12.constant = {value: "{"};

    // SelectionExpression
    function e13() {
        if (e14()) return true;
        if (e56()) return true;
        return false;
    }

    // SequenceExpression
    function e14() {
        const stateₒ = getState();
        let out;
        if (json_Property()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (e53()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // FieldExpression
    function json_Property() {
        return printField(json_String, e51);
    }

    // SequenceExpression
    function json_String() {
        const stateₒ = getState();
        let out;
        if (json_DOUBLE_QUOTE()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (e15()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (json_DOUBLE_QUOTE()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringLiteralExpression
    function json_DOUBLE_QUOTE() {
        OUT = "\"";
        return true;
    }
    json_DOUBLE_QUOTE.constant = {value: "\""};

    // QuantifiedExpression
    function e15() {
        const IPₒ = IP;
        let out;
        do {
            if (!json_CHAR()) break;
            if (IP === IPₒ) break;
            out = concat(out, OUT);
        } while (true);
        OUT = out;
        return true;
    }

    // SelectionExpression
    function json_CHAR() {
        if (e16()) return true;
        if (e23()) return true;
        if (e26()) return true;
        if (e29()) return true;
        if (e32()) return true;
        if (e35()) return true;
        if (e38()) return true;
        if (e41()) return true;
        if (e44()) return true;
        if (e47()) return true;
        return false;
    }

    // SequenceExpression
    function e16() {
        const stateₒ = getState();
        let out;
        if (e17()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (e19()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (e21()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // NotExpression
    function e17() {
        const stateₒ = getState();
        const result = !e18();
        setState(stateₒ);
        OUT = undefined;
        return result;
    }

    // StringLiteralExpression
    function e18() {
        if (typeof IN !== 'string') return false;
        if (IP + 1 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 92) return false;
        IP += 1;
        OUT = "\\";
        return true;
    }
    e18.constant = {value: "\\"};

    // NotExpression
    function e19() {
        const stateₒ = getState();
        const result = !e20();
        setState(stateₒ);
        OUT = undefined;
        return result;
    }

    // StringLiteralExpression
    function e20() {
        if (typeof IN !== 'string') return false;
        if (IP + 1 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 34) return false;
        IP += 1;
        OUT = "\"";
        return true;
    }
    e20.constant = {value: "\""};

    // ApplicationExpression
    let e21ₘ;
    function e21(arg) {
        try {
            return e21ₘ(arg);
        }
        catch (err) {
            if (!(err instanceof TypeError) || !err.message.includes('e21ₘ is not a function')) throw err;
            e21ₘ = std_char(e22);
            return e21ₘ(arg);
        }
    }

    // ExtensionExpression

    // ModuleExpression
    function e22(bindingName) {
        switch (bindingName) {
            case 'min': return 𝕊1_min;
            case 'max': return 𝕊1_max;
            default: return undefined;
        }
    }

    // StringLiteralExpression
    function 𝕊1_min() {
        if (typeof IN !== 'string') return false;
        if (IP + 1 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 32) return false;
        IP += 1;
        OUT = " ";
        return true;
    }
    𝕊1_min.constant = {value: " "};

    // StringLiteralExpression
    function 𝕊1_max() {
        if (typeof IN !== 'string') return false;
        if (IP + 1 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 65535) return false;
        IP += 1;
        OUT = "￿";
        return true;
    }
    𝕊1_max.constant = {value: "￿"};

    // SequenceExpression
    function e23() {
        const stateₒ = getState();
        let out;
        if (e24()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (e25()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringLiteralExpression
    function e24() {
        OUT = "\\\"";
        return true;
    }
    e24.constant = {value: "\\\""};

    // StringLiteralExpression
    function e25() {
        if (typeof IN !== 'string') return false;
        if (IP + 1 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 34) return false;
        IP += 1;
        OUT = undefined;
        return true;
    }
    e25.constant = {value: "\""};

    // SequenceExpression
    function e26() {
        const stateₒ = getState();
        let out;
        if (e27()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (e28()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringLiteralExpression
    function e27() {
        OUT = "\\\\";
        return true;
    }
    e27.constant = {value: "\\\\"};

    // StringLiteralExpression
    function e28() {
        if (typeof IN !== 'string') return false;
        if (IP + 1 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 92) return false;
        IP += 1;
        OUT = undefined;
        return true;
    }
    e28.constant = {value: "\\"};

    // SequenceExpression
    function e29() {
        const stateₒ = getState();
        let out;
        if (e30()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (e31()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringLiteralExpression
    function e30() {
        OUT = "\\/";
        return true;
    }
    e30.constant = {value: "\\/"};

    // StringLiteralExpression
    function e31() {
        if (typeof IN !== 'string') return false;
        if (IP + 1 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 47) return false;
        IP += 1;
        OUT = undefined;
        return true;
    }
    e31.constant = {value: "/"};

    // SequenceExpression
    function e32() {
        const stateₒ = getState();
        let out;
        if (e33()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (e34()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringLiteralExpression
    function e33() {
        OUT = "\\b";
        return true;
    }
    e33.constant = {value: "\\b"};

    // StringLiteralExpression
    function e34() {
        if (typeof IN !== 'string') return false;
        if (IP + 1 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 8) return false;
        IP += 1;
        OUT = undefined;
        return true;
    }
    e34.constant = {value: "\b"};

    // SequenceExpression
    function e35() {
        const stateₒ = getState();
        let out;
        if (e36()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (e37()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringLiteralExpression
    function e36() {
        OUT = "\\f";
        return true;
    }
    e36.constant = {value: "\\f"};

    // StringLiteralExpression
    function e37() {
        if (typeof IN !== 'string') return false;
        if (IP + 1 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 12) return false;
        IP += 1;
        OUT = undefined;
        return true;
    }
    e37.constant = {value: "\f"};

    // SequenceExpression
    function e38() {
        const stateₒ = getState();
        let out;
        if (e39()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (e40()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringLiteralExpression
    function e39() {
        OUT = "\\n";
        return true;
    }
    e39.constant = {value: "\\n"};

    // StringLiteralExpression
    function e40() {
        if (typeof IN !== 'string') return false;
        if (IP + 1 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 10) return false;
        IP += 1;
        OUT = undefined;
        return true;
    }
    e40.constant = {value: "\n"};

    // SequenceExpression
    function e41() {
        const stateₒ = getState();
        let out;
        if (e42()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (e43()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringLiteralExpression
    function e42() {
        OUT = "\\r";
        return true;
    }
    e42.constant = {value: "\\r"};

    // StringLiteralExpression
    function e43() {
        if (typeof IN !== 'string') return false;
        if (IP + 1 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 13) return false;
        IP += 1;
        OUT = undefined;
        return true;
    }
    e43.constant = {value: "\r"};

    // SequenceExpression
    function e44() {
        const stateₒ = getState();
        let out;
        if (e45()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (e46()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringLiteralExpression
    function e45() {
        OUT = "\\t";
        return true;
    }
    e45.constant = {value: "\\t"};

    // StringLiteralExpression
    function e46() {
        if (typeof IN !== 'string') return false;
        if (IP + 1 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 9) return false;
        IP += 1;
        OUT = undefined;
        return true;
    }
    e46.constant = {value: "\t"};

    // SequenceExpression
    function e47() {
        const stateₒ = getState();
        let out;
        if (e48()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (e49()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringLiteralExpression
    function e48() {
        OUT = "\\u";
        return true;
    }
    e48.constant = {value: "\\u"};

    // ApplicationExpression
    let e49ₘ;
    function e49(arg) {
        try {
            return e49ₘ(arg);
        }
        catch (err) {
            if (!(err instanceof TypeError) || !err.message.includes('e49ₘ is not a function')) throw err;
            e49ₘ = experiments_unicode(e50);
            return e49ₘ(arg);
        }
    }

    // ExtensionExpression

    // ModuleExpression
    function e50(bindingName) {
        switch (bindingName) {
            case 'base': return 𝕊2_base;
            case 'minDigits': return 𝕊2_maxDigits;
            case 'maxDigits': return 𝕊2_maxDigits;
            default: return undefined;
        }
    }

    // NumericLiteralExpression
    function 𝕊2_base() {
        if (IN !== 16 || IP !== 0) return false;
        IP += 1;
        OUT = undefined;
        return true;
    }
    𝕊2_base.constant = {value: 16};

    // NumericLiteralExpression
    function 𝕊2_maxDigits() {
        if (IN !== 4 || IP !== 0) return false;
        IP += 1;
        OUT = undefined;
        return true;
    }
    𝕊2_maxDigits.constant = {value: 4};

    // SequenceExpression
    function e51() {
        const stateₒ = getState();
        let out;
        if (json_COLON()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (json_Value()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // SequenceExpression
    function json_COLON() {
        const stateₒ = getState();
        let out;
        if (json_WS()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (e52()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (json_WS()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringLiteralExpression
    function e52() {
        OUT = ":";
        return true;
    }
    e52.constant = {value: ":"};

    // QuantifiedExpression
    function e53() {
        const IPₒ = IP;
        let out;
        do {
            if (!e54()) break;
            if (IP === IPₒ) break;
            out = concat(out, OUT);
        } while (true);
        OUT = out;
        return true;
    }

    // SequenceExpression
    function e54() {
        const stateₒ = getState();
        let out;
        if (json_COMMA()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (json_Property()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // SequenceExpression
    function json_COMMA() {
        const stateₒ = getState();
        let out;
        if (json_WS()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (e55()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (json_WS()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringLiteralExpression
    function e55() {
        OUT = ",";
        return true;
    }
    e55.constant = {value: ","};

    // RecordExpression
    function e56() {
        return printRecord([]);
    }

    // SequenceExpression
    function json_RBRACE() {
        const stateₒ = getState();
        let out;
        if (json_WS()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (e57()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (json_WS()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringLiteralExpression
    function e57() {
        OUT = "}";
        return true;
    }
    e57.constant = {value: "}"};

    // SequenceExpression
    function json_Array() {
        const stateₒ = getState();
        let out;
        if (json_LBRACKET()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (e59()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (json_RBRACKET()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // SequenceExpression
    function json_LBRACKET() {
        const stateₒ = getState();
        let out;
        if (json_WS()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (e58()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (json_WS()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringLiteralExpression
    function e58() {
        OUT = "[";
        return true;
    }
    e58.constant = {value: "["};

    // SelectionExpression
    function e59() {
        if (e60()) return true;
        if (e63()) return true;
        return false;
    }

    // SequenceExpression
    function e60() {
        const stateₒ = getState();
        let out;
        if (json_Element()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (e61()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // ListExpression
    function json_Element() {
        return printList([json_Value]);
    }

    // QuantifiedExpression
    function e61() {
        const IPₒ = IP;
        let out;
        do {
            if (!e62()) break;
            if (IP === IPₒ) break;
            out = concat(out, OUT);
        } while (true);
        OUT = out;
        return true;
    }

    // SequenceExpression
    function e62() {
        const stateₒ = getState();
        let out;
        if (json_COMMA()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (json_Element()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // ListExpression
    function e63() {
        return printList([]);
    }

    // SequenceExpression
    function json_RBRACKET() {
        const stateₒ = getState();
        let out;
        if (json_WS()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (e64()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (json_WS()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringLiteralExpression
    function e64() {
        OUT = "]";
        return true;
    }
    e64.constant = {value: "]"};

    // ExtensionExpression

    return json_start;
})();
