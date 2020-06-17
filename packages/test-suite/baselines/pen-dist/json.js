
"use strict";
function booleanLiteral(options) {
    const { value } = options;
    const out = options.outForm === 'ast' ? value : undefined;
    if (options.inForm !== 'ast') {
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
    const parse = createProgram({ inForm: 'txt', outForm: 'ast' });
    const print = createProgram({ inForm: 'ast', outForm: 'txt' });
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
function field(options) {
    const { name, value } = options;
    if (options.inForm === 'txt' || options.outForm === 'ast') {
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
    if (options.inForm === 'ast' || options.outForm === 'txt') {
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
    throw new Error(`Unsupported operation '${options.inForm}'->'${options.outForm}'`);
}
function list(options) {
    const { elements } = options;
    const elementsLength = elements.length;
    if (options.inForm === 'txt' || options.outForm === 'ast') {
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
    if (options.inForm === 'ast' || options.outForm === 'txt') {
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
    throw new Error(`Unsupported operation '${options.inForm}'->'${options.outForm}'`);
}
function not(options) {
    const { expression } = options;
    return function NOT() {
        let stateₒ = getState();
        let result = !expression();
        setState(stateₒ);
        OUT = undefined;
        return result;
    };
}
function nullLiteral(options) {
    const out = options.outForm === 'ast' ? null : undefined;
    if (options.inForm !== 'ast') {
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
function numericLiteral(options) {
    const { value } = options;
    const out = options.outForm === 'ast' ? value : undefined;
    if (options.inForm !== 'ast') {
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
function record(options) {
    const { fields } = options;
    if (options.inForm === 'txt' || options.outForm === 'ast') {
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
    if (options.inForm === 'ast' || options.outForm === 'txt') {
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
    throw new Error(`Unsupported operation '${options.inForm}'->'${options.outForm}'`);
}
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
function zeroOrMore(options) {
    const { expression } = options;
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
function zeroOrOne(options) {
    const { expression } = options;
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
    function char(options) {
        const checkInType = options.inForm !== 'txt';
        return function CHA_lambda(expr) {
            var _a, _b, _c, _d, _e, _f;
            assert(isModule(expr));
            let min = (_c = (_b = (_a = expr('min')) === null || _a === void 0 ? void 0 : _a.constant) === null || _b === void 0 ? void 0 : _b.value) !== null && _c !== void 0 ? _c : '\u0000';
            let max = (_f = (_e = (_d = expr('max')) === null || _d === void 0 ? void 0 : _d.constant) === null || _e === void 0 ? void 0 : _e.value) !== null && _f !== void 0 ? _f : '\uFFFF';
            assert(typeof min === 'string' && min.length === 1);
            assert(typeof max === 'string' && max.length === 1);
            let checkRange = min !== '\u0000' || max !== '\uFFFF';
            if (options.inForm === 'nil') {
                const out = options.outForm === 'nil' ? undefined : min;
                return function CHA() { return OUT = out, true; };
            }
            return function CHA() {
                if (checkInType && typeof IN !== 'string')
                    return false;
                if (IP < 0 || IP >= IN.length)
                    return false;
                let c = IN.charAt(IP);
                if (checkRange && (c < min || c > max))
                    return false;
                IP += 1;
                OUT = options.outForm === 'nil' ? undefined : c;
                return true;
            };
        };
    }
    // TODO: doc... has both 'txt' and 'ast' representation
    function f64(options) {
        if (options.inForm === 'nil') {
            const out = options.outForm === 'nil' ? undefined : 0;
            return function F64() { return OUT = out, true; };
        }
        if (options.inForm === 'txt' || options.outForm === 'ast') {
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
                OUT = options.outForm === 'nil' ? undefined : num;
                return true;
            };
        }
        if (options.inForm === 'ast' || options.outForm === 'txt') {
            return function F64() {
                // Ensure N is a number.
                if (typeof IN !== 'number' || IP !== 0)
                    return false;
                // Delegate unparsing to the JS runtime.
                // TODO: the conversion may not exactly match the original string. Add this to the lossiness list.
                OUT = options.outForm === 'nil' ? undefined : String(IN);
                IP = 1;
                return true;
            };
        }
        throw new Error(`Unsupported operation '${options.inForm}'->'${options.outForm}'`);
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
    function i32(options) {
        return function I32_lambda(expr) {
            var _a, _b, _c, _d, _e, _f;
            assert(isModule(expr));
            let base = (_c = (_b = (_a = expr('base')) === null || _a === void 0 ? void 0 : _a.constant) === null || _b === void 0 ? void 0 : _b.value) !== null && _c !== void 0 ? _c : 10;
            let signed = (_f = (_e = (_d = expr('signed')) === null || _d === void 0 ? void 0 : _d.constant) === null || _e === void 0 ? void 0 : _e.value) !== null && _f !== void 0 ? _f : true;
            assert(typeof base === 'number' && base >= 2 && base <= 36);
            assert(typeof signed === 'boolean');
            if (options.inForm === 'nil') {
                const out = options.outForm === 'nil' ? undefined : 0;
                return function I32() { return OUT = out, true; };
            }
            if (options.inForm === 'txt' || options.outForm === 'ast') {
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
                    OUT = options.outForm === 'nil' ? undefined : num;
                    return true;
                };
            }
            if (options.inForm === 'ast' || options.outForm === 'txt') {
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
                    OUT = options.outForm === 'nil' ? undefined : String.fromCharCode(...digits.reverse());
                    IP = 1;
                    return true;
                };
            }
            throw new Error(`Unsupported operation '${options.inForm}'->'${options.outForm}'`);
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
    function memoise(_options) {
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

    return (staticOptions) => {
        let _char = char(staticOptions);
        let _f64 = f64(staticOptions);
        let _i32 = i32(staticOptions);
        let _memoise = memoise(staticOptions);
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
    function unicode(options) {
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
            if (options.inForm === 'txt' || options.outForm === 'ast') {
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
            if (options.inForm === 'ast' || options.outForm === 'txt') {
                return function UNI() {
                    // TODO: implement
                    return false;
                };
            }
            throw new Error(`Unsupported operation '${options.inForm}'->'${options.outForm}'`);
        };
    }

    return (staticOptions) => {
        let _unicode = unicode(staticOptions);
        return (name) => {
            switch(name) {
                case 'unicode': return _unicode;
                default: return undefined;
            }
        };
    };
})();

function createProgram({inForm, outForm}) {

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
            const t269 = 𝕊0('WS');
            const t270 = 𝕊0('Value');
            const t271 = 𝕊0('WS');
            return function SEQ() {
                let stateₒ = getState();
                let out;
                if (t269()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t270()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t271()) out = concat(out, OUT); else return setState(stateₒ), false;
                OUT = out;
                return true;
            }
        })();
        return 𝕊0_start_memo(arg);
    };
    let 𝕊0_start_memo;

    const 𝕊0_Value = (arg) => {
        if (!𝕊0_Value_memo) 𝕊0_Value_memo = (() => {
            const t272 = 𝕊0('False');
            const t273 = 𝕊0('Null');
            const t274 = 𝕊0('True');
            const t275 = 𝕊0('Object');
            const t276 = 𝕊0('Array');
            const t277 = 𝕊0('Number');
            const t278 = 𝕊0('String');
            return function SEL() {
                if (t272()) return true;
                if (t273()) return true;
                if (t274()) return true;
                if (t275()) return true;
                if (t276()) return true;
                if (t277()) return true;
                if (t278()) return true;
                return false;
            }
        })();
        return 𝕊0_Value_memo(arg);
    };
    let 𝕊0_Value_memo;

    const 𝕊0_False = (arg) => {
        if (!𝕊0_False_memo) 𝕊0_False_memo = (() => {
            const t279 = (() => {
                const inFormHere281 = inForm !== "txt" ? "nil" : inForm
                const outFormHere282 = outForm !== "txt" ? "nil" : outForm
                const checkInType283 = inFormHere281 !== 'txt';
                const out = outFormHere282 === 'nil' ? undefined : "false";
                if (inFormHere281 === 'nil') return function STR() { OUT = out; return true; }
                return function STR() {
                    if (checkInType283 && typeof IN !== 'string') return false;
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
            const t280 = booleanLiteral({inForm, outForm, value: false});
            return function SEQ() {
                let stateₒ = getState();
                let out;
                if (t279()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t280()) out = concat(out, OUT); else return setState(stateₒ), false;
                OUT = out;
                return true;
            }
        })();
        return 𝕊0_False_memo(arg);
    };
    let 𝕊0_False_memo;

    const 𝕊0_Null = (arg) => {
        if (!𝕊0_Null_memo) 𝕊0_Null_memo = (() => {
            const t284 = (() => {
                const inFormHere286 = inForm !== "txt" ? "nil" : inForm
                const outFormHere287 = outForm !== "txt" ? "nil" : outForm
                const checkInType288 = inFormHere286 !== 'txt';
                const out = outFormHere287 === 'nil' ? undefined : "null";
                if (inFormHere286 === 'nil') return function STR() { OUT = out; return true; }
                return function STR() {
                    if (checkInType288 && typeof IN !== 'string') return false;
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
            const t285 = nullLiteral({inForm, outForm});
            return function SEQ() {
                let stateₒ = getState();
                let out;
                if (t284()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t285()) out = concat(out, OUT); else return setState(stateₒ), false;
                OUT = out;
                return true;
            }
        })();
        return 𝕊0_Null_memo(arg);
    };
    let 𝕊0_Null_memo;

    const 𝕊0_True = (arg) => {
        if (!𝕊0_True_memo) 𝕊0_True_memo = (() => {
            const t289 = (() => {
                const inFormHere291 = inForm !== "txt" ? "nil" : inForm
                const outFormHere292 = outForm !== "txt" ? "nil" : outForm
                const checkInType293 = inFormHere291 !== 'txt';
                const out = outFormHere292 === 'nil' ? undefined : "true";
                if (inFormHere291 === 'nil') return function STR() { OUT = out; return true; }
                return function STR() {
                    if (checkInType293 && typeof IN !== 'string') return false;
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
            const t290 = booleanLiteral({inForm, outForm, value: true});
            return function SEQ() {
                let stateₒ = getState();
                let out;
                if (t289()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t290()) out = concat(out, OUT); else return setState(stateₒ), false;
                OUT = out;
                return true;
            }
        })();
        return 𝕊0_True_memo(arg);
    };
    let 𝕊0_True_memo;

    const 𝕊0_Object = (arg) => {
        if (!𝕊0_Object_memo) 𝕊0_Object_memo = (() => {
            const t294 = 𝕊0('LBRACE');
            const t295 = (() => {
                const t297 = (() => {
                    const t299 = 𝕊0('Property');
                    const t300 = zeroOrMore({
                        inForm,
                        outForm,
                        expression: (() => {
                            const t301 = 𝕊0('COMMA');
                            const t302 = 𝕊0('Property');
                            return function SEQ() {
                                let stateₒ = getState();
                                let out;
                                if (t301()) out = concat(out, OUT); else return setState(stateₒ), false;
                                if (t302()) out = concat(out, OUT); else return setState(stateₒ), false;
                                OUT = out;
                                return true;
                            }
                        })(),
                    });
                    return function SEQ() {
                        let stateₒ = getState();
                        let out;
                        if (t299()) out = concat(out, OUT); else return setState(stateₒ), false;
                        if (t300()) out = concat(out, OUT); else return setState(stateₒ), false;
                        OUT = out;
                        return true;
                    }
                })();
                const t298 = record({
                    inForm,
                    outForm,
                    fields: [],
                });
                return function SEL() {
                    if (t297()) return true;
                    if (t298()) return true;
                    return false;
                }
            })();
            const t296 = 𝕊0('RBRACE');
            return function SEQ() {
                let stateₒ = getState();
                let out;
                if (t294()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t295()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t296()) out = concat(out, OUT); else return setState(stateₒ), false;
                OUT = out;
                return true;
            }
        })();
        return 𝕊0_Object_memo(arg);
    };
    let 𝕊0_Object_memo;

    const 𝕊0_Property = (arg) => {
        if (!𝕊0_Property_memo) 𝕊0_Property_memo = field({
            inForm,
            outForm,
            name: 𝕊0('String'),
            value: (() => {
                const t303 = 𝕊0('COLON');
                const t304 = 𝕊0('Value');
                return function SEQ() {
                    let stateₒ = getState();
                    let out;
                    if (t303()) out = concat(out, OUT); else return setState(stateₒ), false;
                    if (t304()) out = concat(out, OUT); else return setState(stateₒ), false;
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
            const t305 = 𝕊0('LBRACKET');
            const t306 = (() => {
                const t308 = (() => {
                    const t310 = 𝕊0('Element');
                    const t311 = zeroOrMore({
                        inForm,
                        outForm,
                        expression: (() => {
                            const t312 = 𝕊0('COMMA');
                            const t313 = 𝕊0('Element');
                            return function SEQ() {
                                let stateₒ = getState();
                                let out;
                                if (t312()) out = concat(out, OUT); else return setState(stateₒ), false;
                                if (t313()) out = concat(out, OUT); else return setState(stateₒ), false;
                                OUT = out;
                                return true;
                            }
                        })(),
                    });
                    return function SEQ() {
                        let stateₒ = getState();
                        let out;
                        if (t310()) out = concat(out, OUT); else return setState(stateₒ), false;
                        if (t311()) out = concat(out, OUT); else return setState(stateₒ), false;
                        OUT = out;
                        return true;
                    }
                })();
                const t309 = list({
                    inForm,
                    outForm,
                    elements: [],
                });
                return function SEL() {
                    if (t308()) return true;
                    if (t309()) return true;
                    return false;
                }
            })();
            const t307 = 𝕊0('RBRACKET');
            return function SEQ() {
                let stateₒ = getState();
                let out;
                if (t305()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t306()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t307()) out = concat(out, OUT); else return setState(stateₒ), false;
                OUT = out;
                return true;
            }
        })();
        return 𝕊0_Array_memo(arg);
    };
    let 𝕊0_Array_memo;

    const 𝕊0_Element = (arg) => {
        if (!𝕊0_Element_memo) 𝕊0_Element_memo = list({
            inForm,
            outForm,
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
            const t314 = 𝕊0('DOUBLE_QUOTE');
            const t315 = zeroOrMore({
                inForm,
                outForm,
                expression: 𝕊0('CHAR'),
            });
            const t316 = 𝕊0('DOUBLE_QUOTE');
            return function SEQ() {
                let stateₒ = getState();
                let out;
                if (t314()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t315()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t316()) out = concat(out, OUT); else return setState(stateₒ), false;
                OUT = out;
                return true;
            }
        })();
        return 𝕊0_String_memo(arg);
    };
    let 𝕊0_String_memo;

    const 𝕊0_CHAR = (arg) => {
        if (!𝕊0_CHAR_memo) 𝕊0_CHAR_memo = (() => {
            const t317 = (() => {
                const t327 = not({
                    inForm,
                    outForm,
                    expression: (() => {
                        const inFormHere330 = inForm
                        const outFormHere331 = outForm
                        const checkInType332 = inFormHere330 !== 'txt';
                        const out = outFormHere331 === 'nil' ? undefined : "\\";
                        if (inFormHere330 === 'nil') return function STR() { OUT = out; return true; }
                        return function STR() {
                            if (checkInType332 && typeof IN !== 'string') return false;
                            if (IP + 1 > IN.length) return false;
                            if (IN.charCodeAt(IP + 0) !== 92) return false;
                            IP += 1;
                            OUT = out;
                            return true;
                        }
                    })(),
                });
                const t328 = not({
                    inForm,
                    outForm,
                    expression: (() => {
                        const inFormHere333 = inForm
                        const outFormHere334 = outForm
                        const checkInType335 = inFormHere333 !== 'txt';
                        const out = outFormHere334 === 'nil' ? undefined : "\"";
                        if (inFormHere333 === 'nil') return function STR() { OUT = out; return true; }
                        return function STR() {
                            if (checkInType335 && typeof IN !== 'string') return false;
                            if (IP + 1 > IN.length) return false;
                            if (IN.charCodeAt(IP + 0) !== 34) return false;
                            IP += 1;
                            OUT = out;
                            return true;
                        }
                    })(),
                });
                const t329 = (𝕊0('char'))(𝕊1);
                return function SEQ() {
                    let stateₒ = getState();
                    let out;
                    if (t327()) out = concat(out, OUT); else return setState(stateₒ), false;
                    if (t328()) out = concat(out, OUT); else return setState(stateₒ), false;
                    if (t329()) out = concat(out, OUT); else return setState(stateₒ), false;
                    OUT = out;
                    return true;
                }
            })();
            const t318 = (() => {
                const t336 = (() => {
                    const inFormHere338 = inForm !== "txt" ? "nil" : inForm
                    const outFormHere339 = outForm !== "txt" ? "nil" : outForm
                    const checkInType340 = inFormHere338 !== 'txt';
                    const out = outFormHere339 === 'nil' ? undefined : "\\\"";
                    if (inFormHere338 === 'nil') return function STR() { OUT = out; return true; }
                    return function STR() {
                        if (checkInType340 && typeof IN !== 'string') return false;
                        if (IP + 2 > IN.length) return false;
                        if (IN.charCodeAt(IP + 0) !== 92) return false;
                        if (IN.charCodeAt(IP + 1) !== 34) return false;
                        IP += 2;
                        OUT = out;
                        return true;
                    }
                })();
                const t337 = (() => {
                    const inFormHere341 = inForm !== "ast" ? "nil" : inForm
                    const outFormHere342 = outForm !== "ast" ? "nil" : outForm
                    const checkInType343 = inFormHere341 !== 'txt';
                    const out = outFormHere342 === 'nil' ? undefined : "\"";
                    if (inFormHere341 === 'nil') return function STR() { OUT = out; return true; }
                    return function STR() {
                        if (checkInType343 && typeof IN !== 'string') return false;
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
                    if (t336()) out = concat(out, OUT); else return setState(stateₒ), false;
                    if (t337()) out = concat(out, OUT); else return setState(stateₒ), false;
                    OUT = out;
                    return true;
                }
            })();
            const t319 = (() => {
                const t344 = (() => {
                    const inFormHere346 = inForm !== "txt" ? "nil" : inForm
                    const outFormHere347 = outForm !== "txt" ? "nil" : outForm
                    const checkInType348 = inFormHere346 !== 'txt';
                    const out = outFormHere347 === 'nil' ? undefined : "\\\\";
                    if (inFormHere346 === 'nil') return function STR() { OUT = out; return true; }
                    return function STR() {
                        if (checkInType348 && typeof IN !== 'string') return false;
                        if (IP + 2 > IN.length) return false;
                        if (IN.charCodeAt(IP + 0) !== 92) return false;
                        if (IN.charCodeAt(IP + 1) !== 92) return false;
                        IP += 2;
                        OUT = out;
                        return true;
                    }
                })();
                const t345 = (() => {
                    const inFormHere349 = inForm !== "ast" ? "nil" : inForm
                    const outFormHere350 = outForm !== "ast" ? "nil" : outForm
                    const checkInType351 = inFormHere349 !== 'txt';
                    const out = outFormHere350 === 'nil' ? undefined : "\\";
                    if (inFormHere349 === 'nil') return function STR() { OUT = out; return true; }
                    return function STR() {
                        if (checkInType351 && typeof IN !== 'string') return false;
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
                    if (t344()) out = concat(out, OUT); else return setState(stateₒ), false;
                    if (t345()) out = concat(out, OUT); else return setState(stateₒ), false;
                    OUT = out;
                    return true;
                }
            })();
            const t320 = (() => {
                const t352 = (() => {
                    const inFormHere354 = inForm !== "txt" ? "nil" : inForm
                    const outFormHere355 = outForm !== "txt" ? "nil" : outForm
                    const checkInType356 = inFormHere354 !== 'txt';
                    const out = outFormHere355 === 'nil' ? undefined : "\\/";
                    if (inFormHere354 === 'nil') return function STR() { OUT = out; return true; }
                    return function STR() {
                        if (checkInType356 && typeof IN !== 'string') return false;
                        if (IP + 2 > IN.length) return false;
                        if (IN.charCodeAt(IP + 0) !== 92) return false;
                        if (IN.charCodeAt(IP + 1) !== 47) return false;
                        IP += 2;
                        OUT = out;
                        return true;
                    }
                })();
                const t353 = (() => {
                    const inFormHere357 = inForm !== "ast" ? "nil" : inForm
                    const outFormHere358 = outForm !== "ast" ? "nil" : outForm
                    const checkInType359 = inFormHere357 !== 'txt';
                    const out = outFormHere358 === 'nil' ? undefined : "/";
                    if (inFormHere357 === 'nil') return function STR() { OUT = out; return true; }
                    return function STR() {
                        if (checkInType359 && typeof IN !== 'string') return false;
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
                    if (t352()) out = concat(out, OUT); else return setState(stateₒ), false;
                    if (t353()) out = concat(out, OUT); else return setState(stateₒ), false;
                    OUT = out;
                    return true;
                }
            })();
            const t321 = (() => {
                const t360 = (() => {
                    const inFormHere362 = inForm !== "txt" ? "nil" : inForm
                    const outFormHere363 = outForm !== "txt" ? "nil" : outForm
                    const checkInType364 = inFormHere362 !== 'txt';
                    const out = outFormHere363 === 'nil' ? undefined : "\\b";
                    if (inFormHere362 === 'nil') return function STR() { OUT = out; return true; }
                    return function STR() {
                        if (checkInType364 && typeof IN !== 'string') return false;
                        if (IP + 2 > IN.length) return false;
                        if (IN.charCodeAt(IP + 0) !== 92) return false;
                        if (IN.charCodeAt(IP + 1) !== 98) return false;
                        IP += 2;
                        OUT = out;
                        return true;
                    }
                })();
                const t361 = (() => {
                    const inFormHere365 = inForm !== "ast" ? "nil" : inForm
                    const outFormHere366 = outForm !== "ast" ? "nil" : outForm
                    const checkInType367 = inFormHere365 !== 'txt';
                    const out = outFormHere366 === 'nil' ? undefined : "\b";
                    if (inFormHere365 === 'nil') return function STR() { OUT = out; return true; }
                    return function STR() {
                        if (checkInType367 && typeof IN !== 'string') return false;
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
                    if (t360()) out = concat(out, OUT); else return setState(stateₒ), false;
                    if (t361()) out = concat(out, OUT); else return setState(stateₒ), false;
                    OUT = out;
                    return true;
                }
            })();
            const t322 = (() => {
                const t368 = (() => {
                    const inFormHere370 = inForm !== "txt" ? "nil" : inForm
                    const outFormHere371 = outForm !== "txt" ? "nil" : outForm
                    const checkInType372 = inFormHere370 !== 'txt';
                    const out = outFormHere371 === 'nil' ? undefined : "\\f";
                    if (inFormHere370 === 'nil') return function STR() { OUT = out; return true; }
                    return function STR() {
                        if (checkInType372 && typeof IN !== 'string') return false;
                        if (IP + 2 > IN.length) return false;
                        if (IN.charCodeAt(IP + 0) !== 92) return false;
                        if (IN.charCodeAt(IP + 1) !== 102) return false;
                        IP += 2;
                        OUT = out;
                        return true;
                    }
                })();
                const t369 = (() => {
                    const inFormHere373 = inForm !== "ast" ? "nil" : inForm
                    const outFormHere374 = outForm !== "ast" ? "nil" : outForm
                    const checkInType375 = inFormHere373 !== 'txt';
                    const out = outFormHere374 === 'nil' ? undefined : "\f";
                    if (inFormHere373 === 'nil') return function STR() { OUT = out; return true; }
                    return function STR() {
                        if (checkInType375 && typeof IN !== 'string') return false;
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
                    if (t368()) out = concat(out, OUT); else return setState(stateₒ), false;
                    if (t369()) out = concat(out, OUT); else return setState(stateₒ), false;
                    OUT = out;
                    return true;
                }
            })();
            const t323 = (() => {
                const t376 = (() => {
                    const inFormHere378 = inForm !== "txt" ? "nil" : inForm
                    const outFormHere379 = outForm !== "txt" ? "nil" : outForm
                    const checkInType380 = inFormHere378 !== 'txt';
                    const out = outFormHere379 === 'nil' ? undefined : "\\n";
                    if (inFormHere378 === 'nil') return function STR() { OUT = out; return true; }
                    return function STR() {
                        if (checkInType380 && typeof IN !== 'string') return false;
                        if (IP + 2 > IN.length) return false;
                        if (IN.charCodeAt(IP + 0) !== 92) return false;
                        if (IN.charCodeAt(IP + 1) !== 110) return false;
                        IP += 2;
                        OUT = out;
                        return true;
                    }
                })();
                const t377 = (() => {
                    const inFormHere381 = inForm !== "ast" ? "nil" : inForm
                    const outFormHere382 = outForm !== "ast" ? "nil" : outForm
                    const checkInType383 = inFormHere381 !== 'txt';
                    const out = outFormHere382 === 'nil' ? undefined : "\n";
                    if (inFormHere381 === 'nil') return function STR() { OUT = out; return true; }
                    return function STR() {
                        if (checkInType383 && typeof IN !== 'string') return false;
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
                    if (t376()) out = concat(out, OUT); else return setState(stateₒ), false;
                    if (t377()) out = concat(out, OUT); else return setState(stateₒ), false;
                    OUT = out;
                    return true;
                }
            })();
            const t324 = (() => {
                const t384 = (() => {
                    const inFormHere386 = inForm !== "txt" ? "nil" : inForm
                    const outFormHere387 = outForm !== "txt" ? "nil" : outForm
                    const checkInType388 = inFormHere386 !== 'txt';
                    const out = outFormHere387 === 'nil' ? undefined : "\\r";
                    if (inFormHere386 === 'nil') return function STR() { OUT = out; return true; }
                    return function STR() {
                        if (checkInType388 && typeof IN !== 'string') return false;
                        if (IP + 2 > IN.length) return false;
                        if (IN.charCodeAt(IP + 0) !== 92) return false;
                        if (IN.charCodeAt(IP + 1) !== 114) return false;
                        IP += 2;
                        OUT = out;
                        return true;
                    }
                })();
                const t385 = (() => {
                    const inFormHere389 = inForm !== "ast" ? "nil" : inForm
                    const outFormHere390 = outForm !== "ast" ? "nil" : outForm
                    const checkInType391 = inFormHere389 !== 'txt';
                    const out = outFormHere390 === 'nil' ? undefined : "\r";
                    if (inFormHere389 === 'nil') return function STR() { OUT = out; return true; }
                    return function STR() {
                        if (checkInType391 && typeof IN !== 'string') return false;
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
                    if (t384()) out = concat(out, OUT); else return setState(stateₒ), false;
                    if (t385()) out = concat(out, OUT); else return setState(stateₒ), false;
                    OUT = out;
                    return true;
                }
            })();
            const t325 = (() => {
                const t392 = (() => {
                    const inFormHere394 = inForm !== "txt" ? "nil" : inForm
                    const outFormHere395 = outForm !== "txt" ? "nil" : outForm
                    const checkInType396 = inFormHere394 !== 'txt';
                    const out = outFormHere395 === 'nil' ? undefined : "\\t";
                    if (inFormHere394 === 'nil') return function STR() { OUT = out; return true; }
                    return function STR() {
                        if (checkInType396 && typeof IN !== 'string') return false;
                        if (IP + 2 > IN.length) return false;
                        if (IN.charCodeAt(IP + 0) !== 92) return false;
                        if (IN.charCodeAt(IP + 1) !== 116) return false;
                        IP += 2;
                        OUT = out;
                        return true;
                    }
                })();
                const t393 = (() => {
                    const inFormHere397 = inForm !== "ast" ? "nil" : inForm
                    const outFormHere398 = outForm !== "ast" ? "nil" : outForm
                    const checkInType399 = inFormHere397 !== 'txt';
                    const out = outFormHere398 === 'nil' ? undefined : "\t";
                    if (inFormHere397 === 'nil') return function STR() { OUT = out; return true; }
                    return function STR() {
                        if (checkInType399 && typeof IN !== 'string') return false;
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
                    if (t392()) out = concat(out, OUT); else return setState(stateₒ), false;
                    if (t393()) out = concat(out, OUT); else return setState(stateₒ), false;
                    OUT = out;
                    return true;
                }
            })();
            const t326 = (() => {
                const t400 = (() => {
                    const inFormHere402 = inForm !== "txt" ? "nil" : inForm
                    const outFormHere403 = outForm !== "txt" ? "nil" : outForm
                    const checkInType404 = inFormHere402 !== 'txt';
                    const out = outFormHere403 === 'nil' ? undefined : "\\u";
                    if (inFormHere402 === 'nil') return function STR() { OUT = out; return true; }
                    return function STR() {
                        if (checkInType404 && typeof IN !== 'string') return false;
                        if (IP + 2 > IN.length) return false;
                        if (IN.charCodeAt(IP + 0) !== 92) return false;
                        if (IN.charCodeAt(IP + 1) !== 117) return false;
                        IP += 2;
                        OUT = out;
                        return true;
                    }
                })();
                const t401 = (𝕊0('unicode'))(𝕊2);
                return function SEQ() {
                    let stateₒ = getState();
                    let out;
                    if (t400()) out = concat(out, OUT); else return setState(stateₒ), false;
                    if (t401()) out = concat(out, OUT); else return setState(stateₒ), false;
                    OUT = out;
                    return true;
                }
            })();
            return function SEL() {
                if (t317()) return true;
                if (t318()) return true;
                if (t319()) return true;
                if (t320()) return true;
                if (t321()) return true;
                if (t322()) return true;
                if (t323()) return true;
                if (t324()) return true;
                if (t325()) return true;
                if (t326()) return true;
                return false;
            }
        })();
        return 𝕊0_CHAR_memo(arg);
    };
    let 𝕊0_CHAR_memo;

    const 𝕊0_LBRACE = (arg) => {
        if (!𝕊0_LBRACE_memo) 𝕊0_LBRACE_memo = (() => {
            const t405 = 𝕊0('WS');
            const t406 = (() => {
                const inFormHere408 = inForm !== "txt" ? "nil" : inForm
                const outFormHere409 = outForm !== "txt" ? "nil" : outForm
                const checkInType410 = inFormHere408 !== 'txt';
                const out = outFormHere409 === 'nil' ? undefined : "{";
                if (inFormHere408 === 'nil') return function STR() { OUT = out; return true; }
                return function STR() {
                    if (checkInType410 && typeof IN !== 'string') return false;
                    if (IP + 1 > IN.length) return false;
                    if (IN.charCodeAt(IP + 0) !== 123) return false;
                    IP += 1;
                    OUT = out;
                    return true;
                }
            })();
            const t407 = 𝕊0('WS');
            return function SEQ() {
                let stateₒ = getState();
                let out;
                if (t405()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t406()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t407()) out = concat(out, OUT); else return setState(stateₒ), false;
                OUT = out;
                return true;
            }
        })();
        return 𝕊0_LBRACE_memo(arg);
    };
    let 𝕊0_LBRACE_memo;

    const 𝕊0_RBRACE = (arg) => {
        if (!𝕊0_RBRACE_memo) 𝕊0_RBRACE_memo = (() => {
            const t411 = 𝕊0('WS');
            const t412 = (() => {
                const inFormHere414 = inForm !== "txt" ? "nil" : inForm
                const outFormHere415 = outForm !== "txt" ? "nil" : outForm
                const checkInType416 = inFormHere414 !== 'txt';
                const out = outFormHere415 === 'nil' ? undefined : "}";
                if (inFormHere414 === 'nil') return function STR() { OUT = out; return true; }
                return function STR() {
                    if (checkInType416 && typeof IN !== 'string') return false;
                    if (IP + 1 > IN.length) return false;
                    if (IN.charCodeAt(IP + 0) !== 125) return false;
                    IP += 1;
                    OUT = out;
                    return true;
                }
            })();
            const t413 = 𝕊0('WS');
            return function SEQ() {
                let stateₒ = getState();
                let out;
                if (t411()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t412()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t413()) out = concat(out, OUT); else return setState(stateₒ), false;
                OUT = out;
                return true;
            }
        })();
        return 𝕊0_RBRACE_memo(arg);
    };
    let 𝕊0_RBRACE_memo;

    const 𝕊0_LBRACKET = (arg) => {
        if (!𝕊0_LBRACKET_memo) 𝕊0_LBRACKET_memo = (() => {
            const t417 = 𝕊0('WS');
            const t418 = (() => {
                const inFormHere420 = inForm !== "txt" ? "nil" : inForm
                const outFormHere421 = outForm !== "txt" ? "nil" : outForm
                const checkInType422 = inFormHere420 !== 'txt';
                const out = outFormHere421 === 'nil' ? undefined : "[";
                if (inFormHere420 === 'nil') return function STR() { OUT = out; return true; }
                return function STR() {
                    if (checkInType422 && typeof IN !== 'string') return false;
                    if (IP + 1 > IN.length) return false;
                    if (IN.charCodeAt(IP + 0) !== 91) return false;
                    IP += 1;
                    OUT = out;
                    return true;
                }
            })();
            const t419 = 𝕊0('WS');
            return function SEQ() {
                let stateₒ = getState();
                let out;
                if (t417()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t418()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t419()) out = concat(out, OUT); else return setState(stateₒ), false;
                OUT = out;
                return true;
            }
        })();
        return 𝕊0_LBRACKET_memo(arg);
    };
    let 𝕊0_LBRACKET_memo;

    const 𝕊0_RBRACKET = (arg) => {
        if (!𝕊0_RBRACKET_memo) 𝕊0_RBRACKET_memo = (() => {
            const t423 = 𝕊0('WS');
            const t424 = (() => {
                const inFormHere426 = inForm !== "txt" ? "nil" : inForm
                const outFormHere427 = outForm !== "txt" ? "nil" : outForm
                const checkInType428 = inFormHere426 !== 'txt';
                const out = outFormHere427 === 'nil' ? undefined : "]";
                if (inFormHere426 === 'nil') return function STR() { OUT = out; return true; }
                return function STR() {
                    if (checkInType428 && typeof IN !== 'string') return false;
                    if (IP + 1 > IN.length) return false;
                    if (IN.charCodeAt(IP + 0) !== 93) return false;
                    IP += 1;
                    OUT = out;
                    return true;
                }
            })();
            const t425 = 𝕊0('WS');
            return function SEQ() {
                let stateₒ = getState();
                let out;
                if (t423()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t424()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t425()) out = concat(out, OUT); else return setState(stateₒ), false;
                OUT = out;
                return true;
            }
        })();
        return 𝕊0_RBRACKET_memo(arg);
    };
    let 𝕊0_RBRACKET_memo;

    const 𝕊0_COLON = (arg) => {
        if (!𝕊0_COLON_memo) 𝕊0_COLON_memo = (() => {
            const t429 = 𝕊0('WS');
            const t430 = (() => {
                const inFormHere432 = inForm !== "txt" ? "nil" : inForm
                const outFormHere433 = outForm !== "txt" ? "nil" : outForm
                const checkInType434 = inFormHere432 !== 'txt';
                const out = outFormHere433 === 'nil' ? undefined : ":";
                if (inFormHere432 === 'nil') return function STR() { OUT = out; return true; }
                return function STR() {
                    if (checkInType434 && typeof IN !== 'string') return false;
                    if (IP + 1 > IN.length) return false;
                    if (IN.charCodeAt(IP + 0) !== 58) return false;
                    IP += 1;
                    OUT = out;
                    return true;
                }
            })();
            const t431 = 𝕊0('WS');
            return function SEQ() {
                let stateₒ = getState();
                let out;
                if (t429()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t430()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t431()) out = concat(out, OUT); else return setState(stateₒ), false;
                OUT = out;
                return true;
            }
        })();
        return 𝕊0_COLON_memo(arg);
    };
    let 𝕊0_COLON_memo;

    const 𝕊0_COMMA = (arg) => {
        if (!𝕊0_COMMA_memo) 𝕊0_COMMA_memo = (() => {
            const t435 = 𝕊0('WS');
            const t436 = (() => {
                const inFormHere438 = inForm !== "txt" ? "nil" : inForm
                const outFormHere439 = outForm !== "txt" ? "nil" : outForm
                const checkInType440 = inFormHere438 !== 'txt';
                const out = outFormHere439 === 'nil' ? undefined : ",";
                if (inFormHere438 === 'nil') return function STR() { OUT = out; return true; }
                return function STR() {
                    if (checkInType440 && typeof IN !== 'string') return false;
                    if (IP + 1 > IN.length) return false;
                    if (IN.charCodeAt(IP + 0) !== 44) return false;
                    IP += 1;
                    OUT = out;
                    return true;
                }
            })();
            const t437 = 𝕊0('WS');
            return function SEQ() {
                let stateₒ = getState();
                let out;
                if (t435()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t436()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t437()) out = concat(out, OUT); else return setState(stateₒ), false;
                OUT = out;
                return true;
            }
        })();
        return 𝕊0_COMMA_memo(arg);
    };
    let 𝕊0_COMMA_memo;

    const 𝕊0_DOUBLE_QUOTE = (arg) => {
        if (!𝕊0_DOUBLE_QUOTE_memo) 𝕊0_DOUBLE_QUOTE_memo = (() => {
            const inFormHere441 = inForm !== "txt" ? "nil" : inForm
            const outFormHere442 = outForm !== "txt" ? "nil" : outForm
            const checkInType443 = inFormHere441 !== 'txt';
            const out = outFormHere442 === 'nil' ? undefined : "\"";
            if (inFormHere441 === 'nil') return function STR() { OUT = out; return true; }
            return function STR() {
                if (checkInType443 && typeof IN !== 'string') return false;
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
            inForm,
            outForm,
            expression: (() => {
                const t444 = (() => {
                    const inFormHere448 = inForm !== "txt" ? "nil" : inForm
                    const outFormHere449 = outForm !== "txt" ? "nil" : outForm
                    const checkInType450 = inFormHere448 !== 'txt';
                    const out = outFormHere449 === 'nil' ? undefined : " ";
                    if (inFormHere448 === 'nil') return function STR() { OUT = out; return true; }
                    return function STR() {
                        if (checkInType450 && typeof IN !== 'string') return false;
                        if (IP + 1 > IN.length) return false;
                        if (IN.charCodeAt(IP + 0) !== 32) return false;
                        IP += 1;
                        OUT = out;
                        return true;
                    }
                })();
                const t445 = (() => {
                    const inFormHere451 = inForm !== "txt" ? "nil" : inForm
                    const outFormHere452 = outForm !== "txt" ? "nil" : outForm
                    const checkInType453 = inFormHere451 !== 'txt';
                    const out = outFormHere452 === 'nil' ? undefined : "\t";
                    if (inFormHere451 === 'nil') return function STR() { OUT = out; return true; }
                    return function STR() {
                        if (checkInType453 && typeof IN !== 'string') return false;
                        if (IP + 1 > IN.length) return false;
                        if (IN.charCodeAt(IP + 0) !== 9) return false;
                        IP += 1;
                        OUT = out;
                        return true;
                    }
                })();
                const t446 = (() => {
                    const inFormHere454 = inForm !== "txt" ? "nil" : inForm
                    const outFormHere455 = outForm !== "txt" ? "nil" : outForm
                    const checkInType456 = inFormHere454 !== 'txt';
                    const out = outFormHere455 === 'nil' ? undefined : "\n";
                    if (inFormHere454 === 'nil') return function STR() { OUT = out; return true; }
                    return function STR() {
                        if (checkInType456 && typeof IN !== 'string') return false;
                        if (IP + 1 > IN.length) return false;
                        if (IN.charCodeAt(IP + 0) !== 10) return false;
                        IP += 1;
                        OUT = out;
                        return true;
                    }
                })();
                const t447 = (() => {
                    const inFormHere457 = inForm !== "txt" ? "nil" : inForm
                    const outFormHere458 = outForm !== "txt" ? "nil" : outForm
                    const checkInType459 = inFormHere457 !== 'txt';
                    const out = outFormHere458 === 'nil' ? undefined : "\r";
                    if (inFormHere457 === 'nil') return function STR() { OUT = out; return true; }
                    return function STR() {
                        if (checkInType459 && typeof IN !== 'string') return false;
                        if (IP + 1 > IN.length) return false;
                        if (IN.charCodeAt(IP + 0) !== 13) return false;
                        IP += 1;
                        OUT = out;
                        return true;
                    }
                })();
                return function SEL() {
                    if (t444()) return true;
                    if (t445()) return true;
                    if (t446()) return true;
                    if (t447()) return true;
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
            const inFormHere460 = inForm
            const outFormHere461 = outForm
            const checkInType462 = inFormHere460 !== 'txt';
            const out = outFormHere461 === 'nil' ? undefined : " ";
            if (inFormHere460 === 'nil') return function STR() { OUT = out; return true; }
            return function STR() {
                if (checkInType462 && typeof IN !== 'string') return false;
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
            const inFormHere463 = inForm
            const outFormHere464 = outForm
            const checkInType465 = inFormHere463 !== 'txt';
            const out = outFormHere464 === 'nil' ? undefined : "￿";
            if (inFormHere463 === 'nil') return function STR() { OUT = out; return true; }
            return function STR() {
                if (checkInType465 && typeof IN !== 'string') return false;
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
        if (!𝕊2_base_memo) 𝕊2_base_memo = numericLiteral({inForm, outForm, value: 16});
        return 𝕊2_base_memo(arg);
    };
    let 𝕊2_base_memo;

    const 𝕊2_minDigits = (arg) => {
        if (!𝕊2_minDigits_memo) 𝕊2_minDigits_memo = numericLiteral({inForm, outForm, value: 4});
        return 𝕊2_minDigits_memo(arg);
    };
    let 𝕊2_minDigits_memo;

    const 𝕊2_maxDigits = (arg) => {
        if (!𝕊2_maxDigits_memo) 𝕊2_maxDigits_memo = numericLiteral({inForm, outForm, value: 4});
        return 𝕊2_maxDigits_memo(arg);
    };
    let 𝕊2_maxDigits_memo;

    const 𝕊3 = createExtension𝕊3({inForm, outForm});

    const 𝕊4 = createExtension𝕊4({inForm, outForm});

    // -------------------- Compile-time constants --------------------
    𝕊0('DOUBLE_QUOTE').constant = {value: "\""};
    𝕊1('min').constant = {value: " "};
    𝕊1('max').constant = {value: "￿"};
    𝕊2('base').constant = {value: 16};
    𝕊2('minDigits').constant = {value: 4};
    𝕊2('maxDigits').constant = {value: 4};

    return 𝕊0('start');
}

// -------------------- Main exports --------------------
module.exports = createMainExports(createProgram);
