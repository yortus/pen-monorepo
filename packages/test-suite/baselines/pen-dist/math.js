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
        return {memoise, f64, i32};
    })(),
};




// ------------------------------ PARSE ------------------------------
const parse = (() => {

    // ExtensionExpressions
    const 𝕊4_memoise = extensions["V:\\projects\\oss\\pen-monorepo\\packages\\core\\penc\\dist\\deps\\std.pen.js"].memoise({mode: 6});
    const 𝕊4_f64 = extensions["V:\\projects\\oss\\pen-monorepo\\packages\\core\\penc\\dist\\deps\\std.pen.js"].f64({mode: 6});
    const 𝕊4_i32 = extensions["V:\\projects\\oss\\pen-monorepo\\packages\\core\\penc\\dist\\deps\\std.pen.js"].i32({mode: 6});

    // ApplicationExpression
    function math_expr(arg) {
        if (math_expr_memo) return math_expr_memo(arg);
        math_expr_memo = 𝕊4_memoise(e1);
        return math_expr_memo(arg);
    }
    let math_expr_memo;

    // ExtensionExpression

    // SelectionExpression
    function e1() {
        if (math_add()) return true;
        if (math_sub()) return true;
        if (math_term()) return true;
        return false;
    }

    // RecordExpression
    function math_add() {
        if (math_add_memo) return math_add_memo();
        math_add_memo = record({
            mode: 6,
            fields: [
                {name: 'type', value: e2},
                {name: 'lhs', value: math_expr},
                {name: 'rhs', value: e3},
            ],
        })
        return math_add_memo();
    }
    let math_add_memo;

    // StringLiteralExpression
    function e2() {
        OUT = "add";
        return true;
    }
    e2.constant = {value: "add"};

    // SequenceExpression
    function e3() {
        let stateₒ = getState();
        let out;
        if (e4()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (math_term()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringLiteralExpression
    function e4() {
        if (IP + 1 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 43) return false;
        IP += 1;
        OUT = undefined;
        return true;
    }
    e4.constant = {value: "+"};

    // ApplicationExpression
    function math_term(arg) {
        if (math_term_memo) return math_term_memo(arg);
        math_term_memo = 𝕊4_memoise(e5);
        return math_term_memo(arg);
    }
    let math_term_memo;

    // SelectionExpression
    function e5() {
        if (math_mul()) return true;
        if (math_div()) return true;
        if (math_factor()) return true;
        return false;
    }

    // SequenceExpression
    function math_mul() {
        let stateₒ = getState();
        let out;
        if (e6()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (e9()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (e10()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // FieldExpression
    function e6() {
        if (e6_memo) return e6_memo();
        e6_memo = field({
            mode: 6,
            name: e7,
            value: e8,
        });
        return e6_memo();
    }
    let e6_memo;

    // StringLiteralExpression
    function e7() {
        OUT = "type";
        return true;
    }
    e7.constant = {value: "type"};

    // StringLiteralExpression
    function e8() {
        OUT = "mul";
        return true;
    }
    e8.constant = {value: "mul"};

    // RecordExpression
    function e9() {
        if (e9_memo) return e9_memo();
        e9_memo = record({
            mode: 6,
            fields: [
                {name: 'lhs', value: math_term},
            ],
        })
        return e9_memo();
    }
    let e9_memo;

    // FieldExpression
    function e10() {
        if (e10_memo) return e10_memo();
        e10_memo = field({
            mode: 6,
            name: e11,
            value: e12,
        });
        return e10_memo();
    }
    let e10_memo;

    // StringLiteralExpression
    function e11() {
        OUT = "rhs";
        return true;
    }
    e11.constant = {value: "rhs"};

    // SequenceExpression
    function e12() {
        let stateₒ = getState();
        let out;
        if (e13()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (math_factor()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringLiteralExpression
    function e13() {
        if (IP + 1 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 42) return false;
        IP += 1;
        OUT = undefined;
        return true;
    }
    e13.constant = {value: "*"};

    // SelectionExpression
    function math_factor() {
        if (e14()) return true;
        if (e19()) return true;
        if (e23()) return true;
        if (e27()) return true;
        if (e31()) return true;
        return false;
    }

    // SequenceExpression
    function e14() {
        let stateₒ = getState();
        let out;
        if (e15()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (e17()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (𝕊4_f64()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // NotExpression
    function e15() {
        let stateₒ = getState();
        let result = !e16();
        setState(stateₒ);
        OUT = undefined;
        return result;
    }

    // StringLiteralExpression
    function e16() {
        if (IP + 2 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 48) return false;
        if (IN.charCodeAt(IP + 1) !== 120) return false;
        IP += 2;
        OUT = "0x";
        return true;
    }
    e16.constant = {value: "0x"};

    // NotExpression
    function e17() {
        let stateₒ = getState();
        let result = !e18();
        setState(stateₒ);
        OUT = undefined;
        return result;
    }

    // StringLiteralExpression
    function e18() {
        if (IP + 2 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 48) return false;
        if (IN.charCodeAt(IP + 1) !== 98) return false;
        IP += 2;
        OUT = "0b";
        return true;
    }
    e18.constant = {value: "0b"};

    // ExtensionExpression

    // SequenceExpression
    function e19() {
        let stateₒ = getState();
        let out;
        if (e20()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (e21()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringLiteralExpression
    function e20() {
        if (IP + 2 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 48) return false;
        if (IN.charCodeAt(IP + 1) !== 120) return false;
        IP += 2;
        OUT = undefined;
        return true;
    }
    e20.constant = {value: "0x"};

    // ApplicationExpression
    function e21(arg) {
        if (e21_memo) return e21_memo(arg);
        e21_memo = 𝕊4_i32(e22);
        return e21_memo(arg);
    }
    let e21_memo;

    // ExtensionExpression

    // ModuleExpression
    function e22(bindingName) {
        switch (bindingName) {
            case 'base': return 𝕊1_base;
            case 'signed': return 𝕊3_signed;
            default: return undefined;
        }
    }

    // NumericLiteralExpression
    function 𝕊1_base() {
        OUT = 16;
        return true;
    }
    𝕊1_base.constant = {value: 16};

    // BooleanLiteralExpression
    function 𝕊3_signed() {
        OUT = false;
        return true;
    }
    𝕊3_signed.constant = {value: false};

    // SequenceExpression
    function e23() {
        let stateₒ = getState();
        let out;
        if (e24()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (e25()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringLiteralExpression
    function e24() {
        if (IP + 2 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 48) return false;
        if (IN.charCodeAt(IP + 1) !== 98) return false;
        IP += 2;
        OUT = undefined;
        return true;
    }
    e24.constant = {value: "0b"};

    // ApplicationExpression
    function e25(arg) {
        if (e25_memo) return e25_memo(arg);
        e25_memo = 𝕊4_i32(e26);
        return e25_memo(arg);
    }
    let e25_memo;

    // ModuleExpression
    function e26(bindingName) {
        switch (bindingName) {
            case 'base': return 𝕊2_base;
            case 'signed': return 𝕊3_signed;
            default: return undefined;
        }
    }

    // NumericLiteralExpression
    function 𝕊2_base() {
        OUT = 2;
        return true;
    }
    𝕊2_base.constant = {value: 2};

    // SequenceExpression
    function e27() {
        let stateₒ = getState();
        let out;
        if (e28()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (e29()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringLiteralExpression
    function e28() {
        if (IP + 1 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 105) return false;
        IP += 1;
        OUT = undefined;
        return true;
    }
    e28.constant = {value: "i"};

    // ApplicationExpression
    function e29(arg) {
        if (e29_memo) return e29_memo(arg);
        e29_memo = 𝕊4_i32(e30);
        return e29_memo(arg);
    }
    let e29_memo;

    // ModuleExpression
    function e30(bindingName) {
        switch (bindingName) {
            case 'signed': return 𝕊3_signed;
            default: return undefined;
        }
    }

    // SequenceExpression
    function e31() {
        let stateₒ = getState();
        let out;
        if (e32()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (math_expr()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (e33()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringLiteralExpression
    function e32() {
        if (IP + 1 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 40) return false;
        IP += 1;
        OUT = undefined;
        return true;
    }
    e32.constant = {value: "("};

    // StringLiteralExpression
    function e33() {
        if (IP + 1 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 41) return false;
        IP += 1;
        OUT = undefined;
        return true;
    }
    e33.constant = {value: ")"};

    // RecordExpression
    function math_div() {
        if (math_div_memo) return math_div_memo();
        math_div_memo = record({
            mode: 6,
            fields: [
                {name: 'type', value: e34},
                {name: 'lhs', value: math_term},
                {name: 'rhs', value: e35},
            ],
        })
        return math_div_memo();
    }
    let math_div_memo;

    // StringLiteralExpression
    function e34() {
        OUT = "div";
        return true;
    }
    e34.constant = {value: "div"};

    // SequenceExpression
    function e35() {
        let stateₒ = getState();
        let out;
        if (e36()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (math_factor()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringLiteralExpression
    function e36() {
        if (IP + 1 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 47) return false;
        IP += 1;
        OUT = undefined;
        return true;
    }
    e36.constant = {value: "/"};

    // RecordExpression
    function math_sub() {
        if (math_sub_memo) return math_sub_memo();
        math_sub_memo = record({
            mode: 6,
            fields: [
                {name: 'type', value: e37},
                {name: 'lhs', value: math_expr},
                {name: 'rhs', value: e38},
            ],
        })
        return math_sub_memo();
    }
    let math_sub_memo;

    // StringLiteralExpression
    function e37() {
        OUT = "sub";
        return true;
    }
    e37.constant = {value: "sub"};

    // SequenceExpression
    function e38() {
        let stateₒ = getState();
        let out;
        if (e39()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (math_term()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringLiteralExpression
    function e39() {
        if (IP + 1 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 45) return false;
        IP += 1;
        OUT = undefined;
        return true;
    }
    e39.constant = {value: "-"};

    return math_expr;
})();




// ------------------------------ PRINT ------------------------------
const print = (() => {

    // ExtensionExpressions
    const 𝕊4_memoise = extensions["V:\\projects\\oss\\pen-monorepo\\packages\\core\\penc\\dist\\deps\\std.pen.js"].memoise({mode: 7});
    const 𝕊4_f64 = extensions["V:\\projects\\oss\\pen-monorepo\\packages\\core\\penc\\dist\\deps\\std.pen.js"].f64({mode: 7});
    const 𝕊4_i32 = extensions["V:\\projects\\oss\\pen-monorepo\\packages\\core\\penc\\dist\\deps\\std.pen.js"].i32({mode: 7});

    // ApplicationExpression
    function math_expr(arg) {
        if (math_expr_memo) return math_expr_memo(arg);
        math_expr_memo = 𝕊4_memoise(e1);
        return math_expr_memo(arg);
    }
    let math_expr_memo;

    // ExtensionExpression

    // SelectionExpression
    function e1() {
        if (math_add()) return true;
        if (math_sub()) return true;
        if (math_term()) return true;
        return false;
    }

    // RecordExpression
    function math_add() {
        if (math_add_memo) return math_add_memo();
        math_add_memo = record({
            mode: 7,
            fields: [
                {name: 'type', value: e2},
                {name: 'lhs', value: math_expr},
                {name: 'rhs', value: e3},
            ],
        })
        return math_add_memo();
    }
    let math_add_memo;

    // StringLiteralExpression
    function e2() {
        if (typeof IN !== 'string') return false;
        if (IP + 3 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 97) return false;
        if (IN.charCodeAt(IP + 1) !== 100) return false;
        if (IN.charCodeAt(IP + 2) !== 100) return false;
        IP += 3;
        OUT = undefined;
        return true;
    }
    e2.constant = {value: "add"};

    // SequenceExpression
    function e3() {
        let stateₒ = getState();
        let out;
        if (e4()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (math_term()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringLiteralExpression
    function e4() {
        OUT = "+";
        return true;
    }
    e4.constant = {value: "+"};

    // ApplicationExpression
    function math_term(arg) {
        if (math_term_memo) return math_term_memo(arg);
        math_term_memo = 𝕊4_memoise(e5);
        return math_term_memo(arg);
    }
    let math_term_memo;

    // SelectionExpression
    function e5() {
        if (math_mul()) return true;
        if (math_div()) return true;
        if (math_factor()) return true;
        return false;
    }

    // SequenceExpression
    function math_mul() {
        let stateₒ = getState();
        let out;
        if (e6()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (e9()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (e10()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // FieldExpression
    function e6() {
        if (e6_memo) return e6_memo();
        e6_memo = field({
            mode: 7,
            name: e7,
            value: e8,
        });
        return e6_memo();
    }
    let e6_memo;

    // StringLiteralExpression
    function e7() {
        if (typeof IN !== 'string') return false;
        if (IP + 4 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 116) return false;
        if (IN.charCodeAt(IP + 1) !== 121) return false;
        if (IN.charCodeAt(IP + 2) !== 112) return false;
        if (IN.charCodeAt(IP + 3) !== 101) return false;
        IP += 4;
        OUT = undefined;
        return true;
    }
    e7.constant = {value: "type"};

    // StringLiteralExpression
    function e8() {
        if (typeof IN !== 'string') return false;
        if (IP + 3 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 109) return false;
        if (IN.charCodeAt(IP + 1) !== 117) return false;
        if (IN.charCodeAt(IP + 2) !== 108) return false;
        IP += 3;
        OUT = undefined;
        return true;
    }
    e8.constant = {value: "mul"};

    // RecordExpression
    function e9() {
        if (e9_memo) return e9_memo();
        e9_memo = record({
            mode: 7,
            fields: [
                {name: 'lhs', value: math_term},
            ],
        })
        return e9_memo();
    }
    let e9_memo;

    // FieldExpression
    function e10() {
        if (e10_memo) return e10_memo();
        e10_memo = field({
            mode: 7,
            name: e11,
            value: e12,
        });
        return e10_memo();
    }
    let e10_memo;

    // StringLiteralExpression
    function e11() {
        if (typeof IN !== 'string') return false;
        if (IP + 3 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 114) return false;
        if (IN.charCodeAt(IP + 1) !== 104) return false;
        if (IN.charCodeAt(IP + 2) !== 115) return false;
        IP += 3;
        OUT = undefined;
        return true;
    }
    e11.constant = {value: "rhs"};

    // SequenceExpression
    function e12() {
        let stateₒ = getState();
        let out;
        if (e13()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (math_factor()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringLiteralExpression
    function e13() {
        OUT = "*";
        return true;
    }
    e13.constant = {value: "*"};

    // SelectionExpression
    function math_factor() {
        if (e14()) return true;
        if (e19()) return true;
        if (e23()) return true;
        if (e27()) return true;
        if (e31()) return true;
        return false;
    }

    // SequenceExpression
    function e14() {
        let stateₒ = getState();
        let out;
        if (e15()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (e17()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (𝕊4_f64()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // NotExpression
    function e15() {
        let stateₒ = getState();
        let result = !e16();
        setState(stateₒ);
        OUT = undefined;
        return result;
    }

    // StringLiteralExpression
    function e16() {
        if (typeof IN !== 'string') return false;
        if (IP + 2 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 48) return false;
        if (IN.charCodeAt(IP + 1) !== 120) return false;
        IP += 2;
        OUT = "0x";
        return true;
    }
    e16.constant = {value: "0x"};

    // NotExpression
    function e17() {
        let stateₒ = getState();
        let result = !e18();
        setState(stateₒ);
        OUT = undefined;
        return result;
    }

    // StringLiteralExpression
    function e18() {
        if (typeof IN !== 'string') return false;
        if (IP + 2 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 48) return false;
        if (IN.charCodeAt(IP + 1) !== 98) return false;
        IP += 2;
        OUT = "0b";
        return true;
    }
    e18.constant = {value: "0b"};

    // ExtensionExpression

    // SequenceExpression
    function e19() {
        let stateₒ = getState();
        let out;
        if (e20()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (e21()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringLiteralExpression
    function e20() {
        OUT = "0x";
        return true;
    }
    e20.constant = {value: "0x"};

    // ApplicationExpression
    function e21(arg) {
        if (e21_memo) return e21_memo(arg);
        e21_memo = 𝕊4_i32(e22);
        return e21_memo(arg);
    }
    let e21_memo;

    // ExtensionExpression

    // ModuleExpression
    function e22(bindingName) {
        switch (bindingName) {
            case 'base': return 𝕊1_base;
            case 'signed': return 𝕊3_signed;
            default: return undefined;
        }
    }

    // NumericLiteralExpression
    function 𝕊1_base() {
        if (IN !== 16 || IP !== 0) return false;
        IP += 1;
        OUT = undefined;
        return true;
    }
    𝕊1_base.constant = {value: 16};

    // BooleanLiteralExpression
    function 𝕊3_signed() {
        if (IN !== false || IP !== 0) return false;
        IP += 1;
        OUT = undefined;
        return true;
    }
    𝕊3_signed.constant = {value: false};

    // SequenceExpression
    function e23() {
        let stateₒ = getState();
        let out;
        if (e24()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (e25()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringLiteralExpression
    function e24() {
        OUT = "0b";
        return true;
    }
    e24.constant = {value: "0b"};

    // ApplicationExpression
    function e25(arg) {
        if (e25_memo) return e25_memo(arg);
        e25_memo = 𝕊4_i32(e26);
        return e25_memo(arg);
    }
    let e25_memo;

    // ModuleExpression
    function e26(bindingName) {
        switch (bindingName) {
            case 'base': return 𝕊2_base;
            case 'signed': return 𝕊3_signed;
            default: return undefined;
        }
    }

    // NumericLiteralExpression
    function 𝕊2_base() {
        if (IN !== 2 || IP !== 0) return false;
        IP += 1;
        OUT = undefined;
        return true;
    }
    𝕊2_base.constant = {value: 2};

    // SequenceExpression
    function e27() {
        let stateₒ = getState();
        let out;
        if (e28()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (e29()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringLiteralExpression
    function e28() {
        OUT = "i";
        return true;
    }
    e28.constant = {value: "i"};

    // ApplicationExpression
    function e29(arg) {
        if (e29_memo) return e29_memo(arg);
        e29_memo = 𝕊4_i32(e30);
        return e29_memo(arg);
    }
    let e29_memo;

    // ModuleExpression
    function e30(bindingName) {
        switch (bindingName) {
            case 'signed': return 𝕊3_signed;
            default: return undefined;
        }
    }

    // SequenceExpression
    function e31() {
        let stateₒ = getState();
        let out;
        if (e32()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (math_expr()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (e33()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringLiteralExpression
    function e32() {
        OUT = "(";
        return true;
    }
    e32.constant = {value: "("};

    // StringLiteralExpression
    function e33() {
        OUT = ")";
        return true;
    }
    e33.constant = {value: ")"};

    // RecordExpression
    function math_div() {
        if (math_div_memo) return math_div_memo();
        math_div_memo = record({
            mode: 7,
            fields: [
                {name: 'type', value: e34},
                {name: 'lhs', value: math_term},
                {name: 'rhs', value: e35},
            ],
        })
        return math_div_memo();
    }
    let math_div_memo;

    // StringLiteralExpression
    function e34() {
        if (typeof IN !== 'string') return false;
        if (IP + 3 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 100) return false;
        if (IN.charCodeAt(IP + 1) !== 105) return false;
        if (IN.charCodeAt(IP + 2) !== 118) return false;
        IP += 3;
        OUT = undefined;
        return true;
    }
    e34.constant = {value: "div"};

    // SequenceExpression
    function e35() {
        let stateₒ = getState();
        let out;
        if (e36()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (math_factor()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringLiteralExpression
    function e36() {
        OUT = "/";
        return true;
    }
    e36.constant = {value: "/"};

    // RecordExpression
    function math_sub() {
        if (math_sub_memo) return math_sub_memo();
        math_sub_memo = record({
            mode: 7,
            fields: [
                {name: 'type', value: e37},
                {name: 'lhs', value: math_expr},
                {name: 'rhs', value: e38},
            ],
        })
        return math_sub_memo();
    }
    let math_sub_memo;

    // StringLiteralExpression
    function e37() {
        if (typeof IN !== 'string') return false;
        if (IP + 3 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 115) return false;
        if (IN.charCodeAt(IP + 1) !== 117) return false;
        if (IN.charCodeAt(IP + 2) !== 98) return false;
        IP += 3;
        OUT = undefined;
        return true;
    }
    e37.constant = {value: "sub"};

    // SequenceExpression
    function e38() {
        let stateₒ = getState();
        let out;
        if (e39()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (math_term()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringLiteralExpression
    function e39() {
        OUT = "-";
        return true;
    }
    e39.constant = {value: "-"};

    return math_expr;
})();
