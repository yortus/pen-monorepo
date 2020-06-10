
"use strict";
function booleanLiteral(options) {
    const { value } = options;
    const out = options.outForm === 'ast' ? value : undefined;
    if (options.inForm !== 'ast') {
        return { rule: function BOO() { return OUT = out, true; } };
    }
    return {
        rule: function BOO() {
            if (IN !== value || IP !== 0)
                return false;
            IP += 1;
            OUT = out;
            return true;
        },
    };
}
function createMainExports(createProgram) {
    const parse = createProgram({ inForm: 'txt', outForm: 'ast' }).rule;
    const print = createProgram({ inForm: 'ast', outForm: 'txt' }).rule;
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
        return {
            rule: function FLD() {
                let stateₒ = getState();
                let obj = {};
                if (!name.rule())
                    return false;
                assert(typeof OUT === 'string');
                let propName = OUT;
                if (!value.rule())
                    return setState(stateₒ), false;
                assert(OUT !== undefined);
                obj[propName] = OUT;
                OUT = obj;
                return true;
            },
        };
    }
    if (options.inForm === 'ast' || options.outForm === 'txt') {
        return {
            rule: function FLD() {
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
                    if (!name.rule())
                        continue;
                    if (IP !== propName.length)
                        continue;
                    text = concat(text, OUT);
                    setState({ IN: obj[propName], IP: 0 });
                    if (!value.rule())
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
            },
        };
    }
    throw new Error(`Unsupported operation '${options.inForm}'->'${options.outForm}'`);
}
function list(options) {
    const { elements } = options;
    const elementsLength = elements.length;
    if (options.inForm === 'txt' || options.outForm === 'ast') {
        return {
            rule: function LST() {
                let stateₒ = getState();
                let arr = [];
                for (let i = 0; i < elementsLength; ++i) {
                    if (!elements[i].rule())
                        return setState(stateₒ), false;
                    assert(OUT !== undefined);
                    arr.push(OUT);
                }
                OUT = arr;
                return true;
            },
        };
    }
    if (options.inForm === 'ast' || options.outForm === 'txt') {
        return {
            rule: function LST() {
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
                    if (!elements[i].rule())
                        return setState(stateₒ), false;
                    if (!isInputFullyConsumed())
                        return setState(stateₒ), false;
                    text = concat(text, OUT);
                }
                setState({ IN: arr, IP: off + elementsLength });
                OUT = text;
                return true;
            },
        };
    }
    throw new Error(`Unsupported operation '${options.inForm}'->'${options.outForm}'`);
}
function not(options) {
    const { expression } = options;
    return {
        rule: function NOT() {
            let stateₒ = getState();
            let result = !expression.rule();
            setState(stateₒ);
            OUT = undefined;
            return result;
        },
    };
}
function nullLiteral(options) {
    const out = options.outForm === 'ast' ? null : undefined;
    if (options.inForm !== 'ast') {
        return { rule: function NUL() { return OUT = out, true; } };
    }
    return {
        rule: function NUL() {
            if (IN !== null || IP !== 0)
                return false;
            IP = 1;
            OUT = out;
            return true;
        },
    };
}
function numericLiteral(options) {
    const { value } = options;
    const out = options.outForm === 'ast' ? value : undefined;
    if (options.inForm !== 'ast') {
        return { rule: function NUM() { return OUT = out, true; } };
    }
    return {
        rule: function NUM() {
            if (IN !== value || IP !== 0)
                return false;
            IP = 1;
            OUT = out;
            return true;
        },
    };
}
function record(options) {
    const { fields } = options;
    if (options.inForm === 'txt' || options.outForm === 'ast') {
        return {
            rule: function RCD() {
                let stateₒ = getState();
                let obj = {};
                for (let field of fields) {
                    let propName = field.name;
                    if (!field.value.rule())
                        return setState(stateₒ), false;
                    assert(OUT !== undefined);
                    obj[propName] = OUT;
                }
                OUT = obj;
                return true;
            },
        };
    }
    if (options.inForm === 'ast' || options.outForm === 'txt') {
        return {
            rule: function RCD() {
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
                    if (!field.value.rule())
                        return setState(stateₒ), false;
                    if (!isInputFullyConsumed())
                        return setState(stateₒ), false;
                    text = concat(text, OUT);
                    bitmask += propBit;
                }
                setState({ IN: obj, IP: bitmask });
                OUT = text;
                return true;
            },
        };
    }
    throw new Error(`Unsupported operation '${options.inForm}'->'${options.outForm}'`);
}
function selection(options) {
    const { expressions } = options;
    const arity = expressions.length;
    return {
        rule: function SEL() {
            for (let i = 0; i < arity; ++i) {
                if (expressions[i].rule())
                    return true;
            }
            return false;
        },
    };
}
function sequence(options) {
    const { expressions } = options;
    const arity = expressions.length;
    return {
        rule: function SEQ() {
            let stateₒ = getState();
            let out;
            for (let i = 0; i < arity; ++i) {
                if (!expressions[i].rule())
                    return setState(stateₒ), false;
                out = concat(out, OUT);
            }
            OUT = out;
            return true;
        },
    };
}
function stringLiteral(options) {
    const { value } = options;
    const length = value.length;
    const out = options.outForm === 'nil' ? undefined : value;
    const checkInType = options.inForm !== 'txt';
    if (options.inForm === 'nil') {
        return { rule: function STR() { return OUT = out, true; } };
    }
    return {
        rule: function STR() {
            if (checkInType && typeof IN !== 'string')
                return false;
            if (IP + length > IN.length)
                return false;
            for (let i = 0; i < length; ++i) {
                if (IN.charAt(IP + i) !== value.charAt(i))
                    return false;
            }
            IP += length;
            OUT = out;
            return true;
        },
    };
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
    return {
        rule: function O_M() {
            let stateₒ = getState();
            let out;
            while (true) {
                if (!expression.rule())
                    break;
                if (IP === stateₒ.IP)
                    break;
                out = concat(out, OUT);
            }
            OUT = out;
            return true;
        },
    };
}
function zeroOrOne(options) {
    const { expression } = options;
    return {
        rule: function O_1() {
            if (!expression.rule())
                OUT = undefined;
            return true;
        },
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
        return {
            lambda(expr) {
                var _a, _b, _c, _d, _e, _f, _g, _h;
                let min = (_d = (_c = (_b = (_a = expr.bindings) === null || _a === void 0 ? void 0 : _a.min) === null || _b === void 0 ? void 0 : _b.constant) === null || _c === void 0 ? void 0 : _c.value) !== null && _d !== void 0 ? _d : '\u0000';
                let max = (_h = (_g = (_f = (_e = expr.bindings) === null || _e === void 0 ? void 0 : _e.max) === null || _f === void 0 ? void 0 : _f.constant) === null || _g === void 0 ? void 0 : _g.value) !== null && _h !== void 0 ? _h : '\uFFFF';
                assert(typeof min === 'string' && min.length === 1);
                assert(typeof max === 'string' && max.length === 1);
                let checkRange = min !== '\u0000' || max !== '\uFFFF';
                if (options.inForm === 'nil') {
                    const out = options.outForm === 'nil' ? undefined : min;
                    return { rule: function CHA() { return OUT = out, true; } };
                }
                return {
                    rule: function CHA() {
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
                    },
                };
            },
        };
    }
    // TODO: doc... has both 'txt' and 'ast' representation
    function f64(options) {
        if (options.inForm === 'nil') {
            const out = options.outForm === 'nil' ? undefined : 0;
            return { rule: function F64() { return OUT = out, true; } };
        }
        if (options.inForm === 'txt' || options.outForm === 'ast') {
            return {
                rule: function F64() {
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
                },
            };
        }
        if (options.inForm === 'ast' || options.outForm === 'txt') {
            return {
                rule: function F64() {
                    // Ensure N is a number.
                    if (typeof IN !== 'number' || IP !== 0)
                        return false;
                    // Delegate unparsing to the JS runtime.
                    // TODO: the conversion may not exactly match the original string. Add this to the lossiness list.
                    OUT = options.outForm === 'nil' ? undefined : String(IN);
                    IP = 1;
                    return true;
                },
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
        return {
            lambda(expr) {
                var _a, _b, _c, _d, _e, _f, _g, _h;
                let base = (_d = (_c = (_b = (_a = expr.bindings) === null || _a === void 0 ? void 0 : _a.base) === null || _b === void 0 ? void 0 : _b.constant) === null || _c === void 0 ? void 0 : _c.value) !== null && _d !== void 0 ? _d : 10;
                let signed = (_h = (_g = (_f = (_e = expr.bindings) === null || _e === void 0 ? void 0 : _e.signed) === null || _f === void 0 ? void 0 : _f.constant) === null || _g === void 0 ? void 0 : _g.value) !== null && _h !== void 0 ? _h : true;
                assert(typeof base === 'number' && base >= 2 && base <= 36);
                assert(typeof signed === 'boolean');
                if (options.inForm === 'nil') {
                    const out = options.outForm === 'nil' ? undefined : 0;
                    return { rule: function I32() { return OUT = out, true; } };
                }
                if (options.inForm === 'txt' || options.outForm === 'ast') {
                    return {
                        rule: function I32() {
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
                        },
                    };
                }
                if (options.inForm === 'ast' || options.outForm === 'txt') {
                    return {
                        rule() {
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
                        },
                    };
                }
                throw new Error(`Unsupported operation '${options.inForm}'->'${options.outForm}'`);
            },
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
        return {
            lambda(expr) {
                // TODO: investigate... need to use `text` as part of memo key? Study lifecycle/extent of each `memos` instance.
                const memos = new Map();
                return {
                    rule: function MEM() {
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
                            if (expr.rule()) {
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
                                if (!expr.rule())
                                    break;
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
                    },
                };
            },
        };
    }

    return (staticOptions) => ({
        bindings: {
            char: char(staticOptions),
            f64: f64(staticOptions),
            i32: i32(staticOptions),
            memoise: memoise(staticOptions),
        }
    });
})();
const createExtension𝕊4 = (() => {
    "use strict";
    /* @pen exports = {
        unicode
    } */
    function unicode(options) {
        return {
            lambda(expr) {
                var _a, _b, _c, _d, _e, _f, _g, _h, _j;
                let base = (_c = (_b = (_a = expr.bindings) === null || _a === void 0 ? void 0 : _a.base) === null || _b === void 0 ? void 0 : _b.constant) === null || _c === void 0 ? void 0 : _c.value;
                let minDigits = (_f = (_e = (_d = expr.bindings) === null || _d === void 0 ? void 0 : _d.minDigits) === null || _e === void 0 ? void 0 : _e.constant) === null || _f === void 0 ? void 0 : _f.value;
                let maxDigits = (_j = (_h = (_g = expr.bindings) === null || _g === void 0 ? void 0 : _g.maxDigits) === null || _h === void 0 ? void 0 : _h.constant) === null || _j === void 0 ? void 0 : _j.value;
                assert(typeof base === 'number' && base >= 2 && base <= 36);
                assert(typeof minDigits === 'number' && minDigits >= 1 && minDigits <= 8);
                assert(typeof maxDigits === 'number' && maxDigits >= minDigits && maxDigits <= 8);
                // Construct a regex to match the digits
                let pattern = `[0-${base < 10 ? base - 1 : 9}${base > 10 ? `a-${String.fromCharCode('a'.charCodeAt(0) + base - 11)}` : ''}]`;
                let regex = RegExp(pattern, 'i');
                if (options.inForm === 'txt' || options.outForm === 'ast') {
                    return {
                        rule: function UNI() {
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
                        },
                    };
                }
                if (options.inForm === 'ast' || options.outForm === 'txt') {
                    return {
                        rule: function UNI() {
                            // TODO: implement
                            return false;
                        },
                    };
                }
                throw new Error(`Unsupported operation '${options.inForm}'->'${options.outForm}'`);
            },
        };
    }

    return (staticOptions) => ({
        bindings: {
            unicode: unicode(staticOptions),
        }
    });
})();

function createProgram({inForm, outForm}) {

    const 𝕊0 = {
        bindings: {
            char: {},
            f64: {},
            unicode: {},
            start: {},
            Value: {},
            False: {},
            Null: {},
            True: {},
            Object: {},
            Properties: {},
            Array: {},
            Elements: {},
            Number: {},
            String: {},
            CHAR: {},
            LBRACE: {},
            RBRACE: {},
            LBRACKET: {},
            RBRACKET: {},
            COLON: {},
            COMMA: {},
            DOUBLE_QUOTE: {},
            WS: {},
        },
    };

    const 𝕊1 = {
        bindings: {
            min: {},
            max: {},
        },
    };

    const 𝕊2 = {
        bindings: {
            base: {},
            minDigits: {},
            maxDigits: {},
        },
    };

    const 𝕊3 = createExtension𝕊3({inForm, outForm});

    const 𝕊4 = createExtension𝕊4({inForm, outForm});

    // -------------------- Aliases --------------------
    𝕊0.bindings.char = 𝕊3.bindings.char;
    𝕊0.bindings.f64 = 𝕊3.bindings.f64;
    𝕊0.bindings.unicode = 𝕊4.bindings.unicode;
    𝕊0.bindings.Number = 𝕊0.bindings.f64;

    // -------------------- Compile-time constants --------------------
    𝕊0.bindings.DOUBLE_QUOTE.constant = {value: "\""};
    𝕊1.bindings.min.constant = {value: " "};
    𝕊1.bindings.max.constant = {value: "￿"};
    𝕊2.bindings.base.constant = {value: 16};
    𝕊2.bindings.minDigits.constant = {value: 4};
    𝕊2.bindings.maxDigits.constant = {value: 4};

    // -------------------- json-recursive.pen --------------------

    function 𝕊0_start() {
        if (𝕊0_start.memo) return 𝕊0_start.memo;
        return 𝕊0_start.memo = sequence({
            inForm,
            outForm,
            expressions: [
                𝕊0.bindings.WS,
                𝕊0.bindings.Value,
                𝕊0.bindings.WS,
            ],
        });
    }
    Object.assign(𝕊0.bindings.start, 𝕊0_start());

    function 𝕊0_Value() {
        if (𝕊0_Value.memo) return 𝕊0_Value.memo;
        return 𝕊0_Value.memo = selection({
            inForm,
            outForm,
            expressions: [
                𝕊0.bindings.False,
                𝕊0.bindings.Null,
                𝕊0.bindings.True,
                𝕊0.bindings.Object,
                𝕊0.bindings.Array,
                𝕊0.bindings.Number,
                𝕊0.bindings.String,
            ],
        });
    }
    Object.assign(𝕊0.bindings.Value, 𝕊0_Value());

    function 𝕊0_False() {
        if (𝕊0_False.memo) return 𝕊0_False.memo;
        return 𝕊0_False.memo = sequence({
            inForm,
            outForm,
            expressions: [
                stringLiteral({
                    inForm: inForm !== "txt" ? "nil" : inForm,
                    outForm: outForm !== "txt" ? "nil" : outForm,
                    value: "false",
                }),
                booleanLiteral({inForm, outForm, value: false}),
            ],
        });
    }
    Object.assign(𝕊0.bindings.False, 𝕊0_False());

    function 𝕊0_Null() {
        if (𝕊0_Null.memo) return 𝕊0_Null.memo;
        return 𝕊0_Null.memo = sequence({
            inForm,
            outForm,
            expressions: [
                stringLiteral({
                    inForm: inForm !== "txt" ? "nil" : inForm,
                    outForm: outForm !== "txt" ? "nil" : outForm,
                    value: "null",
                }),
                nullLiteral({inForm, outForm}),
            ],
        });
    }
    Object.assign(𝕊0.bindings.Null, 𝕊0_Null());

    function 𝕊0_True() {
        if (𝕊0_True.memo) return 𝕊0_True.memo;
        return 𝕊0_True.memo = sequence({
            inForm,
            outForm,
            expressions: [
                stringLiteral({
                    inForm: inForm !== "txt" ? "nil" : inForm,
                    outForm: outForm !== "txt" ? "nil" : outForm,
                    value: "true",
                }),
                booleanLiteral({inForm, outForm, value: true}),
            ],
        });
    }
    Object.assign(𝕊0.bindings.True, 𝕊0_True());

    function 𝕊0_Object() {
        if (𝕊0_Object.memo) return 𝕊0_Object.memo;
        return 𝕊0_Object.memo = sequence({
            inForm,
            outForm,
            expressions: [
                𝕊0.bindings.LBRACE,
                selection({
                    inForm,
                    outForm,
                    expressions: [
                        𝕊0.bindings.Properties,
                        record({
                            inForm,
                            outForm,
                            fields: [],
                        }),
                    ],
                }),
                𝕊0.bindings.RBRACE,
            ],
        });
    }
    Object.assign(𝕊0.bindings.Object, 𝕊0_Object());

    function 𝕊0_Properties() {
        if (𝕊0_Properties.memo) return 𝕊0_Properties.memo;
        return 𝕊0_Properties.memo = sequence({
            inForm,
            outForm,
            expressions: [
                field({
                    inForm,
                    outForm,
                    name: 𝕊0.bindings.String,
                    value: sequence({
                        inForm,
                        outForm,
                        expressions: [
                            𝕊0.bindings.COLON,
                            𝕊0.bindings.Value,
                        ],
                    }),
                }),
                zeroOrOne({
                    inForm,
                    outForm,
                    expression: sequence({
                        inForm,
                        outForm,
                        expressions: [
                            𝕊0.bindings.COMMA,
                            𝕊0.bindings.Properties,
                        ],
                    }),
                }),
            ],
        });
    }
    Object.assign(𝕊0.bindings.Properties, 𝕊0_Properties());

    function 𝕊0_Array() {
        if (𝕊0_Array.memo) return 𝕊0_Array.memo;
        return 𝕊0_Array.memo = sequence({
            inForm,
            outForm,
            expressions: [
                𝕊0.bindings.LBRACKET,
                selection({
                    inForm,
                    outForm,
                    expressions: [
                        𝕊0.bindings.Elements,
                        list({
                            inForm,
                            outForm,
                            elements: [],
                        }),
                    ],
                }),
                𝕊0.bindings.RBRACKET,
            ],
        });
    }
    Object.assign(𝕊0.bindings.Array, 𝕊0_Array());

    function 𝕊0_Elements() {
        if (𝕊0_Elements.memo) return 𝕊0_Elements.memo;
        return 𝕊0_Elements.memo = sequence({
            inForm,
            outForm,
            expressions: [
                list({
                    inForm,
                    outForm,
                    elements: [
                        𝕊0.bindings.Value,
                    ],
                }),
                zeroOrOne({
                    inForm,
                    outForm,
                    expression: sequence({
                        inForm,
                        outForm,
                        expressions: [
                            𝕊0.bindings.COMMA,
                            𝕊0.bindings.Elements,
                        ],
                    }),
                }),
            ],
        });
    }
    Object.assign(𝕊0.bindings.Elements, 𝕊0_Elements());

    function 𝕊0_String() {
        if (𝕊0_String.memo) return 𝕊0_String.memo;
        return 𝕊0_String.memo = sequence({
            inForm,
            outForm,
            expressions: [
                𝕊0.bindings.DOUBLE_QUOTE,
                zeroOrMore({
                    inForm,
                    outForm,
                    expression: 𝕊0.bindings.CHAR,
                }),
                𝕊0.bindings.DOUBLE_QUOTE,
            ],
        });
    }
    Object.assign(𝕊0.bindings.String, 𝕊0_String());

    function 𝕊0_CHAR() {
        if (𝕊0_CHAR.memo) return 𝕊0_CHAR.memo;
        return 𝕊0_CHAR.memo = selection({
            inForm,
            outForm,
            expressions: [
                sequence({
                    inForm,
                    outForm,
                    expressions: [
                        not({
                            inForm,
                            outForm,
                            expression: stringLiteral({
                                inForm: inForm,
                                outForm: outForm,
                                value: "\\",
                            }),
                        }),
                        not({
                            inForm,
                            outForm,
                            expression: stringLiteral({
                                inForm: inForm,
                                outForm: outForm,
                                value: "\"",
                            }),
                        }),
                        (𝕊0.bindings.char).lambda(𝕊1),
                    ],
                }),
                sequence({
                    inForm,
                    outForm,
                    expressions: [
                        stringLiteral({
                            inForm: inForm !== "txt" ? "nil" : inForm,
                            outForm: outForm !== "txt" ? "nil" : outForm,
                            value: "\\\"",
                        }),
                        stringLiteral({
                            inForm: inForm !== "ast" ? "nil" : inForm,
                            outForm: outForm !== "ast" ? "nil" : outForm,
                            value: "\"",
                        }),
                    ],
                }),
                sequence({
                    inForm,
                    outForm,
                    expressions: [
                        stringLiteral({
                            inForm: inForm !== "txt" ? "nil" : inForm,
                            outForm: outForm !== "txt" ? "nil" : outForm,
                            value: "\\\\",
                        }),
                        stringLiteral({
                            inForm: inForm !== "ast" ? "nil" : inForm,
                            outForm: outForm !== "ast" ? "nil" : outForm,
                            value: "\\",
                        }),
                    ],
                }),
                sequence({
                    inForm,
                    outForm,
                    expressions: [
                        stringLiteral({
                            inForm: inForm !== "txt" ? "nil" : inForm,
                            outForm: outForm !== "txt" ? "nil" : outForm,
                            value: "\\/",
                        }),
                        stringLiteral({
                            inForm: inForm !== "ast" ? "nil" : inForm,
                            outForm: outForm !== "ast" ? "nil" : outForm,
                            value: "/",
                        }),
                    ],
                }),
                sequence({
                    inForm,
                    outForm,
                    expressions: [
                        stringLiteral({
                            inForm: inForm !== "txt" ? "nil" : inForm,
                            outForm: outForm !== "txt" ? "nil" : outForm,
                            value: "\\b",
                        }),
                        stringLiteral({
                            inForm: inForm !== "ast" ? "nil" : inForm,
                            outForm: outForm !== "ast" ? "nil" : outForm,
                            value: "\b",
                        }),
                    ],
                }),
                sequence({
                    inForm,
                    outForm,
                    expressions: [
                        stringLiteral({
                            inForm: inForm !== "txt" ? "nil" : inForm,
                            outForm: outForm !== "txt" ? "nil" : outForm,
                            value: "\\f",
                        }),
                        stringLiteral({
                            inForm: inForm !== "ast" ? "nil" : inForm,
                            outForm: outForm !== "ast" ? "nil" : outForm,
                            value: "\f",
                        }),
                    ],
                }),
                sequence({
                    inForm,
                    outForm,
                    expressions: [
                        stringLiteral({
                            inForm: inForm !== "txt" ? "nil" : inForm,
                            outForm: outForm !== "txt" ? "nil" : outForm,
                            value: "\\n",
                        }),
                        stringLiteral({
                            inForm: inForm !== "ast" ? "nil" : inForm,
                            outForm: outForm !== "ast" ? "nil" : outForm,
                            value: "\n",
                        }),
                    ],
                }),
                sequence({
                    inForm,
                    outForm,
                    expressions: [
                        stringLiteral({
                            inForm: inForm !== "txt" ? "nil" : inForm,
                            outForm: outForm !== "txt" ? "nil" : outForm,
                            value: "\\r",
                        }),
                        stringLiteral({
                            inForm: inForm !== "ast" ? "nil" : inForm,
                            outForm: outForm !== "ast" ? "nil" : outForm,
                            value: "\r",
                        }),
                    ],
                }),
                sequence({
                    inForm,
                    outForm,
                    expressions: [
                        stringLiteral({
                            inForm: inForm !== "txt" ? "nil" : inForm,
                            outForm: outForm !== "txt" ? "nil" : outForm,
                            value: "\\t",
                        }),
                        stringLiteral({
                            inForm: inForm !== "ast" ? "nil" : inForm,
                            outForm: outForm !== "ast" ? "nil" : outForm,
                            value: "\t",
                        }),
                    ],
                }),
                sequence({
                    inForm,
                    outForm,
                    expressions: [
                        stringLiteral({
                            inForm: inForm !== "txt" ? "nil" : inForm,
                            outForm: outForm !== "txt" ? "nil" : outForm,
                            value: "\\u",
                        }),
                        (𝕊0.bindings.unicode).lambda(𝕊2),
                    ],
                }),
            ],
        });
    }
    Object.assign(𝕊0.bindings.CHAR, 𝕊0_CHAR());

    function 𝕊0_LBRACE() {
        if (𝕊0_LBRACE.memo) return 𝕊0_LBRACE.memo;
        return 𝕊0_LBRACE.memo = sequence({
            inForm,
            outForm,
            expressions: [
                𝕊0.bindings.WS,
                stringLiteral({
                    inForm: inForm !== "txt" ? "nil" : inForm,
                    outForm: outForm !== "txt" ? "nil" : outForm,
                    value: "{",
                }),
                𝕊0.bindings.WS,
            ],
        });
    }
    Object.assign(𝕊0.bindings.LBRACE, 𝕊0_LBRACE());

    function 𝕊0_RBRACE() {
        if (𝕊0_RBRACE.memo) return 𝕊0_RBRACE.memo;
        return 𝕊0_RBRACE.memo = sequence({
            inForm,
            outForm,
            expressions: [
                𝕊0.bindings.WS,
                stringLiteral({
                    inForm: inForm !== "txt" ? "nil" : inForm,
                    outForm: outForm !== "txt" ? "nil" : outForm,
                    value: "}",
                }),
                𝕊0.bindings.WS,
            ],
        });
    }
    Object.assign(𝕊0.bindings.RBRACE, 𝕊0_RBRACE());

    function 𝕊0_LBRACKET() {
        if (𝕊0_LBRACKET.memo) return 𝕊0_LBRACKET.memo;
        return 𝕊0_LBRACKET.memo = sequence({
            inForm,
            outForm,
            expressions: [
                𝕊0.bindings.WS,
                stringLiteral({
                    inForm: inForm !== "txt" ? "nil" : inForm,
                    outForm: outForm !== "txt" ? "nil" : outForm,
                    value: "[",
                }),
                𝕊0.bindings.WS,
            ],
        });
    }
    Object.assign(𝕊0.bindings.LBRACKET, 𝕊0_LBRACKET());

    function 𝕊0_RBRACKET() {
        if (𝕊0_RBRACKET.memo) return 𝕊0_RBRACKET.memo;
        return 𝕊0_RBRACKET.memo = sequence({
            inForm,
            outForm,
            expressions: [
                𝕊0.bindings.WS,
                stringLiteral({
                    inForm: inForm !== "txt" ? "nil" : inForm,
                    outForm: outForm !== "txt" ? "nil" : outForm,
                    value: "]",
                }),
                𝕊0.bindings.WS,
            ],
        });
    }
    Object.assign(𝕊0.bindings.RBRACKET, 𝕊0_RBRACKET());

    function 𝕊0_COLON() {
        if (𝕊0_COLON.memo) return 𝕊0_COLON.memo;
        return 𝕊0_COLON.memo = sequence({
            inForm,
            outForm,
            expressions: [
                𝕊0.bindings.WS,
                stringLiteral({
                    inForm: inForm !== "txt" ? "nil" : inForm,
                    outForm: outForm !== "txt" ? "nil" : outForm,
                    value: ":",
                }),
                𝕊0.bindings.WS,
            ],
        });
    }
    Object.assign(𝕊0.bindings.COLON, 𝕊0_COLON());

    function 𝕊0_COMMA() {
        if (𝕊0_COMMA.memo) return 𝕊0_COMMA.memo;
        return 𝕊0_COMMA.memo = sequence({
            inForm,
            outForm,
            expressions: [
                𝕊0.bindings.WS,
                stringLiteral({
                    inForm: inForm !== "txt" ? "nil" : inForm,
                    outForm: outForm !== "txt" ? "nil" : outForm,
                    value: ",",
                }),
                𝕊0.bindings.WS,
            ],
        });
    }
    Object.assign(𝕊0.bindings.COMMA, 𝕊0_COMMA());

    function 𝕊0_DOUBLE_QUOTE() {
        if (𝕊0_DOUBLE_QUOTE.memo) return 𝕊0_DOUBLE_QUOTE.memo;
        return 𝕊0_DOUBLE_QUOTE.memo = stringLiteral({
            inForm: inForm !== "txt" ? "nil" : inForm,
            outForm: outForm !== "txt" ? "nil" : outForm,
            value: "\"",
        });
    }
    Object.assign(𝕊0.bindings.DOUBLE_QUOTE, 𝕊0_DOUBLE_QUOTE());

    function 𝕊0_WS() {
        if (𝕊0_WS.memo) return 𝕊0_WS.memo;
        return 𝕊0_WS.memo = zeroOrMore({
            inForm,
            outForm,
            expression: selection({
                inForm,
                outForm,
                expressions: [
                    stringLiteral({
                        inForm: inForm !== "txt" ? "nil" : inForm,
                        outForm: outForm !== "txt" ? "nil" : outForm,
                        value: " ",
                    }),
                    stringLiteral({
                        inForm: inForm !== "txt" ? "nil" : inForm,
                        outForm: outForm !== "txt" ? "nil" : outForm,
                        value: "\t",
                    }),
                    stringLiteral({
                        inForm: inForm !== "txt" ? "nil" : inForm,
                        outForm: outForm !== "txt" ? "nil" : outForm,
                        value: "\n",
                    }),
                    stringLiteral({
                        inForm: inForm !== "txt" ? "nil" : inForm,
                        outForm: outForm !== "txt" ? "nil" : outForm,
                        value: "\r",
                    }),
                ],
            }),
        });
    }
    Object.assign(𝕊0.bindings.WS, 𝕊0_WS());

    function 𝕊1_min() {
        if (𝕊1_min.memo) return 𝕊1_min.memo;
        return 𝕊1_min.memo = stringLiteral({
            inForm: inForm,
            outForm: outForm,
            value: " ",
        });
    }
    Object.assign(𝕊1.bindings.min, 𝕊1_min());

    function 𝕊1_max() {
        if (𝕊1_max.memo) return 𝕊1_max.memo;
        return 𝕊1_max.memo = stringLiteral({
            inForm: inForm,
            outForm: outForm,
            value: "￿",
        });
    }
    Object.assign(𝕊1.bindings.max, 𝕊1_max());

    function 𝕊2_base() {
        if (𝕊2_base.memo) return 𝕊2_base.memo;
        return 𝕊2_base.memo = numericLiteral({inForm, outForm, value: 16});
    }
    Object.assign(𝕊2.bindings.base, 𝕊2_base());

    function 𝕊2_minDigits() {
        if (𝕊2_minDigits.memo) return 𝕊2_minDigits.memo;
        return 𝕊2_minDigits.memo = numericLiteral({inForm, outForm, value: 4});
    }
    Object.assign(𝕊2.bindings.minDigits, 𝕊2_minDigits());

    function 𝕊2_maxDigits() {
        if (𝕊2_maxDigits.memo) return 𝕊2_maxDigits.memo;
        return 𝕊2_maxDigits.memo = numericLiteral({inForm, outForm, value: 4});
    }
    Object.assign(𝕊2.bindings.maxDigits, 𝕊2_maxDigits());

    return 𝕊0.bindings.start;
}

// -------------------- Main exports --------------------
module.exports = createMainExports(createProgram);
