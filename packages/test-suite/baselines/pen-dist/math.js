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
    const id2 = extensions["V:\\projects\\oss\\pen-monorepo\\packages\\core\\penc\\dist\\deps\\std.pen.js"].memoise({mode: 6});
    const id25 = extensions["V:\\projects\\oss\\pen-monorepo\\packages\\core\\penc\\dist\\deps\\std.pen.js"].f64({mode: 6});
    const id29 = extensions["V:\\projects\\oss\\pen-monorepo\\packages\\core\\penc\\dist\\deps\\std.pen.js"].i32({mode: 6});

    // ApplicationExpression
    function id1(arg) {
        if (id1_memo) return id1_memo(arg);
        id1_memo = id2(id3);
        return id1_memo(arg);
    }
    let id1_memo;

    // ExtensionExpression

    // SelectionExpression
    function id3() {
        if (id4()) return true;
        if (id49()) return true;
        if (id8()) return true;
        return false;
    }

    // RecordExpression
    function id4() {
        if (id4_memo) return id4_memo();
        id4_memo = record({
            mode: 6,
            fields: [
                {name: 'type', value: id5},
                {name: 'lhs', value: id1},
                {name: 'rhs', value: id6},
            ],
        })
        return id4_memo();
    }
    let id4_memo;

    // StringLiteralExpression
    function id5() {
        OUT = "add";
        return true;
    }
    id5.constant = {value: "add"};

    // SequenceExpression
    function id6() {
        let stateₒ = getState();
        let out;
        if (id7()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (id8()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringLiteralExpression
    function id7() {
        if (IP + 1 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 43) return false;
        IP += 1;
        OUT = undefined;
        return true;
    }
    id7.constant = {value: "+"};

    // ApplicationExpression
    function id8(arg) {
        if (id8_memo) return id8_memo(arg);
        id8_memo = id2(id9);
        return id8_memo(arg);
    }
    let id8_memo;

    // SelectionExpression
    function id9() {
        if (id10()) return true;
        if (id45()) return true;
        if (id19()) return true;
        return false;
    }

    // SequenceExpression
    function id10() {
        let stateₒ = getState();
        let out;
        if (id11()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (id14()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (id15()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // FieldExpression
    function id11() {
        if (id11_memo) return id11_memo();
        id11_memo = field({
            mode: 6,
            name: id12,
            value: id13,
        });
        return id11_memo();
    }
    let id11_memo;

    // StringLiteralExpression
    function id12() {
        OUT = "type";
        return true;
    }
    id12.constant = {value: "type"};

    // StringLiteralExpression
    function id13() {
        OUT = "mul";
        return true;
    }
    id13.constant = {value: "mul"};

    // RecordExpression
    function id14() {
        if (id14_memo) return id14_memo();
        id14_memo = record({
            mode: 6,
            fields: [
                {name: 'lhs', value: id8},
            ],
        })
        return id14_memo();
    }
    let id14_memo;

    // FieldExpression
    function id15() {
        if (id15_memo) return id15_memo();
        id15_memo = field({
            mode: 6,
            name: id16,
            value: id17,
        });
        return id15_memo();
    }
    let id15_memo;

    // StringLiteralExpression
    function id16() {
        OUT = "rhs";
        return true;
    }
    id16.constant = {value: "rhs"};

    // SequenceExpression
    function id17() {
        let stateₒ = getState();
        let out;
        if (id18()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (id19()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringLiteralExpression
    function id18() {
        if (IP + 1 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 42) return false;
        IP += 1;
        OUT = undefined;
        return true;
    }
    id18.constant = {value: "*"};

    // SelectionExpression
    function id19() {
        if (id20()) return true;
        if (id26()) return true;
        if (id33()) return true;
        if (id38()) return true;
        if (id42()) return true;
        return false;
    }

    // SequenceExpression
    function id20() {
        let stateₒ = getState();
        let out;
        if (id21()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (id23()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (id25()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // NotExpression
    function id21() {
        let stateₒ = getState();
        let result = !id22();
        setState(stateₒ);
        OUT = undefined;
        return result;
    }

    // StringLiteralExpression
    function id22() {
        if (IP + 2 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 48) return false;
        if (IN.charCodeAt(IP + 1) !== 120) return false;
        IP += 2;
        OUT = "0x";
        return true;
    }
    id22.constant = {value: "0x"};

    // NotExpression
    function id23() {
        let stateₒ = getState();
        let result = !id24();
        setState(stateₒ);
        OUT = undefined;
        return result;
    }

    // StringLiteralExpression
    function id24() {
        if (IP + 2 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 48) return false;
        if (IN.charCodeAt(IP + 1) !== 98) return false;
        IP += 2;
        OUT = "0b";
        return true;
    }
    id24.constant = {value: "0b"};

    // ExtensionExpression

    // SequenceExpression
    function id26() {
        let stateₒ = getState();
        let out;
        if (id27()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (id28()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringLiteralExpression
    function id27() {
        if (IP + 2 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 48) return false;
        if (IN.charCodeAt(IP + 1) !== 120) return false;
        IP += 2;
        OUT = undefined;
        return true;
    }
    id27.constant = {value: "0x"};

    // ApplicationExpression
    function id28(arg) {
        if (id28_memo) return id28_memo(arg);
        id28_memo = id29(id30);
        return id28_memo(arg);
    }
    let id28_memo;

    // ExtensionExpression

    // ModuleExpression
    function id30(bindingName) {
        switch (bindingName) {
            case 'base': return id31;
            case 'signed': return id32;
            default: return undefined;
        }
    }

    // NumericLiteralExpression
    function id31() {
        OUT = 16;
        return true;
    }
    id31.constant = {value: 16};

    // BooleanLiteralExpression
    function id32() {
        OUT = false;
        return true;
    }
    id32.constant = {value: false};

    // SequenceExpression
    function id33() {
        let stateₒ = getState();
        let out;
        if (id34()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (id35()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringLiteralExpression
    function id34() {
        if (IP + 2 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 48) return false;
        if (IN.charCodeAt(IP + 1) !== 98) return false;
        IP += 2;
        OUT = undefined;
        return true;
    }
    id34.constant = {value: "0b"};

    // ApplicationExpression
    function id35(arg) {
        if (id35_memo) return id35_memo(arg);
        id35_memo = id29(id36);
        return id35_memo(arg);
    }
    let id35_memo;

    // ModuleExpression
    function id36(bindingName) {
        switch (bindingName) {
            case 'base': return id37;
            case 'signed': return id32;
            default: return undefined;
        }
    }

    // NumericLiteralExpression
    function id37() {
        OUT = 2;
        return true;
    }
    id37.constant = {value: 2};

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
        if (IP + 1 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 105) return false;
        IP += 1;
        OUT = undefined;
        return true;
    }
    id39.constant = {value: "i"};

    // ApplicationExpression
    function id40(arg) {
        if (id40_memo) return id40_memo(arg);
        id40_memo = id29(id41);
        return id40_memo(arg);
    }
    let id40_memo;

    // ModuleExpression
    function id41(bindingName) {
        switch (bindingName) {
            case 'signed': return id32;
            default: return undefined;
        }
    }

    // SequenceExpression
    function id42() {
        let stateₒ = getState();
        let out;
        if (id43()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (id1()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (id44()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringLiteralExpression
    function id43() {
        if (IP + 1 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 40) return false;
        IP += 1;
        OUT = undefined;
        return true;
    }
    id43.constant = {value: "("};

    // StringLiteralExpression
    function id44() {
        if (IP + 1 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 41) return false;
        IP += 1;
        OUT = undefined;
        return true;
    }
    id44.constant = {value: ")"};

    // RecordExpression
    function id45() {
        if (id45_memo) return id45_memo();
        id45_memo = record({
            mode: 6,
            fields: [
                {name: 'type', value: id46},
                {name: 'lhs', value: id8},
                {name: 'rhs', value: id47},
            ],
        })
        return id45_memo();
    }
    let id45_memo;

    // StringLiteralExpression
    function id46() {
        OUT = "div";
        return true;
    }
    id46.constant = {value: "div"};

    // SequenceExpression
    function id47() {
        let stateₒ = getState();
        let out;
        if (id48()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (id19()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringLiteralExpression
    function id48() {
        if (IP + 1 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 47) return false;
        IP += 1;
        OUT = undefined;
        return true;
    }
    id48.constant = {value: "/"};

    // RecordExpression
    function id49() {
        if (id49_memo) return id49_memo();
        id49_memo = record({
            mode: 6,
            fields: [
                {name: 'type', value: id50},
                {name: 'lhs', value: id1},
                {name: 'rhs', value: id51},
            ],
        })
        return id49_memo();
    }
    let id49_memo;

    // StringLiteralExpression
    function id50() {
        OUT = "sub";
        return true;
    }
    id50.constant = {value: "sub"};

    // SequenceExpression
    function id51() {
        let stateₒ = getState();
        let out;
        if (id52()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (id8()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringLiteralExpression
    function id52() {
        if (IP + 1 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 45) return false;
        IP += 1;
        OUT = undefined;
        return true;
    }
    id52.constant = {value: "-"};

    return id1;
})();




// ------------------------------ PRINT ------------------------------
const print = (() => {

    // ExtensionExpressions
    const id2 = extensions["V:\\projects\\oss\\pen-monorepo\\packages\\core\\penc\\dist\\deps\\std.pen.js"].memoise({mode: 7});
    const id25 = extensions["V:\\projects\\oss\\pen-monorepo\\packages\\core\\penc\\dist\\deps\\std.pen.js"].f64({mode: 7});
    const id29 = extensions["V:\\projects\\oss\\pen-monorepo\\packages\\core\\penc\\dist\\deps\\std.pen.js"].i32({mode: 7});

    // ApplicationExpression
    function id1(arg) {
        if (id1_memo) return id1_memo(arg);
        id1_memo = id2(id3);
        return id1_memo(arg);
    }
    let id1_memo;

    // ExtensionExpression

    // SelectionExpression
    function id3() {
        if (id4()) return true;
        if (id49()) return true;
        if (id8()) return true;
        return false;
    }

    // RecordExpression
    function id4() {
        if (id4_memo) return id4_memo();
        id4_memo = record({
            mode: 7,
            fields: [
                {name: 'type', value: id5},
                {name: 'lhs', value: id1},
                {name: 'rhs', value: id6},
            ],
        })
        return id4_memo();
    }
    let id4_memo;

    // StringLiteralExpression
    function id5() {
        if (typeof IN !== 'string') return false;
        if (IP + 3 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 97) return false;
        if (IN.charCodeAt(IP + 1) !== 100) return false;
        if (IN.charCodeAt(IP + 2) !== 100) return false;
        IP += 3;
        OUT = undefined;
        return true;
    }
    id5.constant = {value: "add"};

    // SequenceExpression
    function id6() {
        let stateₒ = getState();
        let out;
        if (id7()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (id8()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringLiteralExpression
    function id7() {
        OUT = "+";
        return true;
    }
    id7.constant = {value: "+"};

    // ApplicationExpression
    function id8(arg) {
        if (id8_memo) return id8_memo(arg);
        id8_memo = id2(id9);
        return id8_memo(arg);
    }
    let id8_memo;

    // SelectionExpression
    function id9() {
        if (id10()) return true;
        if (id45()) return true;
        if (id19()) return true;
        return false;
    }

    // SequenceExpression
    function id10() {
        let stateₒ = getState();
        let out;
        if (id11()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (id14()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (id15()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // FieldExpression
    function id11() {
        if (id11_memo) return id11_memo();
        id11_memo = field({
            mode: 7,
            name: id12,
            value: id13,
        });
        return id11_memo();
    }
    let id11_memo;

    // StringLiteralExpression
    function id12() {
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
    id12.constant = {value: "type"};

    // StringLiteralExpression
    function id13() {
        if (typeof IN !== 'string') return false;
        if (IP + 3 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 109) return false;
        if (IN.charCodeAt(IP + 1) !== 117) return false;
        if (IN.charCodeAt(IP + 2) !== 108) return false;
        IP += 3;
        OUT = undefined;
        return true;
    }
    id13.constant = {value: "mul"};

    // RecordExpression
    function id14() {
        if (id14_memo) return id14_memo();
        id14_memo = record({
            mode: 7,
            fields: [
                {name: 'lhs', value: id8},
            ],
        })
        return id14_memo();
    }
    let id14_memo;

    // FieldExpression
    function id15() {
        if (id15_memo) return id15_memo();
        id15_memo = field({
            mode: 7,
            name: id16,
            value: id17,
        });
        return id15_memo();
    }
    let id15_memo;

    // StringLiteralExpression
    function id16() {
        if (typeof IN !== 'string') return false;
        if (IP + 3 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 114) return false;
        if (IN.charCodeAt(IP + 1) !== 104) return false;
        if (IN.charCodeAt(IP + 2) !== 115) return false;
        IP += 3;
        OUT = undefined;
        return true;
    }
    id16.constant = {value: "rhs"};

    // SequenceExpression
    function id17() {
        let stateₒ = getState();
        let out;
        if (id18()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (id19()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringLiteralExpression
    function id18() {
        OUT = "*";
        return true;
    }
    id18.constant = {value: "*"};

    // SelectionExpression
    function id19() {
        if (id20()) return true;
        if (id26()) return true;
        if (id33()) return true;
        if (id38()) return true;
        if (id42()) return true;
        return false;
    }

    // SequenceExpression
    function id20() {
        let stateₒ = getState();
        let out;
        if (id21()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (id23()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (id25()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // NotExpression
    function id21() {
        let stateₒ = getState();
        let result = !id22();
        setState(stateₒ);
        OUT = undefined;
        return result;
    }

    // StringLiteralExpression
    function id22() {
        if (typeof IN !== 'string') return false;
        if (IP + 2 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 48) return false;
        if (IN.charCodeAt(IP + 1) !== 120) return false;
        IP += 2;
        OUT = "0x";
        return true;
    }
    id22.constant = {value: "0x"};

    // NotExpression
    function id23() {
        let stateₒ = getState();
        let result = !id24();
        setState(stateₒ);
        OUT = undefined;
        return result;
    }

    // StringLiteralExpression
    function id24() {
        if (typeof IN !== 'string') return false;
        if (IP + 2 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 48) return false;
        if (IN.charCodeAt(IP + 1) !== 98) return false;
        IP += 2;
        OUT = "0b";
        return true;
    }
    id24.constant = {value: "0b"};

    // ExtensionExpression

    // SequenceExpression
    function id26() {
        let stateₒ = getState();
        let out;
        if (id27()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (id28()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringLiteralExpression
    function id27() {
        OUT = "0x";
        return true;
    }
    id27.constant = {value: "0x"};

    // ApplicationExpression
    function id28(arg) {
        if (id28_memo) return id28_memo(arg);
        id28_memo = id29(id30);
        return id28_memo(arg);
    }
    let id28_memo;

    // ExtensionExpression

    // ModuleExpression
    function id30(bindingName) {
        switch (bindingName) {
            case 'base': return id31;
            case 'signed': return id32;
            default: return undefined;
        }
    }

    // NumericLiteralExpression
    function id31() {
        if (IN !== 16 || IP !== 0) return false;
        IP += 1;
        OUT = undefined;
        return true;
    }
    id31.constant = {value: 16};

    // BooleanLiteralExpression
    function id32() {
        if (IN !== false || IP !== 0) return false;
        IP += 1;
        OUT = undefined;
        return true;
    }
    id32.constant = {value: false};

    // SequenceExpression
    function id33() {
        let stateₒ = getState();
        let out;
        if (id34()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (id35()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringLiteralExpression
    function id34() {
        OUT = "0b";
        return true;
    }
    id34.constant = {value: "0b"};

    // ApplicationExpression
    function id35(arg) {
        if (id35_memo) return id35_memo(arg);
        id35_memo = id29(id36);
        return id35_memo(arg);
    }
    let id35_memo;

    // ModuleExpression
    function id36(bindingName) {
        switch (bindingName) {
            case 'base': return id37;
            case 'signed': return id32;
            default: return undefined;
        }
    }

    // NumericLiteralExpression
    function id37() {
        if (IN !== 2 || IP !== 0) return false;
        IP += 1;
        OUT = undefined;
        return true;
    }
    id37.constant = {value: 2};

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
        OUT = "i";
        return true;
    }
    id39.constant = {value: "i"};

    // ApplicationExpression
    function id40(arg) {
        if (id40_memo) return id40_memo(arg);
        id40_memo = id29(id41);
        return id40_memo(arg);
    }
    let id40_memo;

    // ModuleExpression
    function id41(bindingName) {
        switch (bindingName) {
            case 'signed': return id32;
            default: return undefined;
        }
    }

    // SequenceExpression
    function id42() {
        let stateₒ = getState();
        let out;
        if (id43()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (id1()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (id44()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringLiteralExpression
    function id43() {
        OUT = "(";
        return true;
    }
    id43.constant = {value: "("};

    // StringLiteralExpression
    function id44() {
        OUT = ")";
        return true;
    }
    id44.constant = {value: ")"};

    // RecordExpression
    function id45() {
        if (id45_memo) return id45_memo();
        id45_memo = record({
            mode: 7,
            fields: [
                {name: 'type', value: id46},
                {name: 'lhs', value: id8},
                {name: 'rhs', value: id47},
            ],
        })
        return id45_memo();
    }
    let id45_memo;

    // StringLiteralExpression
    function id46() {
        if (typeof IN !== 'string') return false;
        if (IP + 3 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 100) return false;
        if (IN.charCodeAt(IP + 1) !== 105) return false;
        if (IN.charCodeAt(IP + 2) !== 118) return false;
        IP += 3;
        OUT = undefined;
        return true;
    }
    id46.constant = {value: "div"};

    // SequenceExpression
    function id47() {
        let stateₒ = getState();
        let out;
        if (id48()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (id19()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringLiteralExpression
    function id48() {
        OUT = "/";
        return true;
    }
    id48.constant = {value: "/"};

    // RecordExpression
    function id49() {
        if (id49_memo) return id49_memo();
        id49_memo = record({
            mode: 7,
            fields: [
                {name: 'type', value: id50},
                {name: 'lhs', value: id1},
                {name: 'rhs', value: id51},
            ],
        })
        return id49_memo();
    }
    let id49_memo;

    // StringLiteralExpression
    function id50() {
        if (typeof IN !== 'string') return false;
        if (IP + 3 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 115) return false;
        if (IN.charCodeAt(IP + 1) !== 117) return false;
        if (IN.charCodeAt(IP + 2) !== 98) return false;
        IP += 3;
        OUT = undefined;
        return true;
    }
    id50.constant = {value: "sub"};

    // SequenceExpression
    function id51() {
        let stateₒ = getState();
        let out;
        if (id52()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (id8()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringLiteralExpression
    function id52() {
        OUT = "-";
        return true;
    }
    id52.constant = {value: "-"};

    return id1;
})();
