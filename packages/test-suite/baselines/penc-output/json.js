
"use strict";
function booleanLiteral(options) {
    const { value } = options;
    const NO_CONSUME = options.in === 'nil';
    const NO_PRODUCE = options.out === 'nil';
    return {
        parse() {
            OUT = NO_PRODUCE ? undefined : value;
            return true;
        },
        unparse() {
            if (!NO_CONSUME) {
                if (IN !== value || IP !== 0)
                    return false;
                IP += 1;
            }
            OUT = undefined;
            return true;
        },
    };
}
function character(options) {
    const { min, max } = options;
    const NO_CONSUME = options.in === 'nil';
    const NO_PRODUCE = options.out === 'nil';
    return {
        parse() {
            let c = min;
            if (!NO_CONSUME) {
                if (typeof IN !== 'string')
                    return false;
                if (IP < 0 || IP >= IN.length)
                    return false;
                c = IN.charAt(IP);
                if (c < min || c > max)
                    return false;
                IP += 1;
            }
            OUT = NO_PRODUCE ? undefined : c;
            return true;
        },
        unparse() {
            let c = min;
            if (!NO_CONSUME) {
                if (typeof IN !== 'string')
                    return false;
                if (IP < 0 || IP >= IN.length)
                    return false;
                c = IN.charAt(IP);
                if (c < min || c > max)
                    return false;
                IP += 1;
            }
            OUT = NO_PRODUCE ? undefined : c;
            return true;
        },
    };
}
function createMainExports(createProgram) {
    const parse = createProgram({ in: 'txt', out: 'ast' }).parse;
    const unparse = createProgram({ in: 'ast', out: 'txt' }).unparse;
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
        unparse: (node) => {
            setState({ IN: node, IP: 0 });
            if (!unparse())
                throw new Error('parse failed');
            if (!isInputFullyConsumed())
                throw new Error(`unparse didn't consume entire input`);
            if (OUT === undefined)
                throw new Error(`parse didn't return a value`);
            return OUT;
        },
    };
}
function field(options) {
    const { name, value } = options;
    return {
        parse() {
            let stateₒ = getState();
            let obj = {};
            if (!name.parse())
                return false;
            assert(typeof OUT === 'string');
            let propName = OUT;
            if (!value.parse())
                return setState(stateₒ), false;
            assert(OUT !== undefined);
            obj[propName] = OUT;
            OUT = obj;
            return true;
        },
        unparse() {
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
                if (!name.unparse())
                    continue;
                if (IP !== propName.length)
                    continue;
                text = concat(text, OUT);
                setState({ IN: obj[propName], IP: 0 });
                if (!value.unparse())
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
function list(options) {
    const { elements } = options;
    const elementsLength = elements.length;
    return {
        parse() {
            let stateₒ = getState();
            let arr = [];
            for (let i = 0; i < elementsLength; ++i) {
                if (!elements[i].parse())
                    return setState(stateₒ), false;
                assert(OUT !== undefined);
                arr.push(OUT);
            }
            OUT = arr;
            return true;
        },
        unparse() {
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
                if (!elements[i].unparse())
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
function nullLiteral(options) {
    const NO_CONSUME = options.in === 'nil';
    const NO_PRODUCE = options.out === 'nil';
    return {
        parse() {
            OUT = NO_PRODUCE ? undefined : null;
            return true;
        },
        unparse() {
            if (!NO_CONSUME) {
                if (IN !== null || IP !== 0)
                    return false;
                IP = 1;
            }
            OUT = undefined;
            return true;
        },
    };
}
function numericLiteral(options) {
    const { value } = options;
    const NO_CONSUME = options.in === 'nil';
    const NO_PRODUCE = options.out === 'nil';
    return {
        parse() {
            OUT = NO_PRODUCE ? undefined : value;
            return true;
        },
        unparse() {
            if (!NO_CONSUME) {
                if (IN !== value || IP !== 0)
                    return false;
                IP = 1;
            }
            OUT = undefined;
            return true;
        },
    };
}
function record(options) {
    const { fields } = options;
    return {
        parse() {
            let stateₒ = getState();
            let obj = {};
            for (let field of fields) {
                let propName = field.name;
                if (!field.value.parse())
                    return setState(stateₒ), false;
                assert(OUT !== undefined);
                obj[propName] = OUT;
            }
            OUT = obj;
            return true;
        },
        unparse() {
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
                if (!field.value.unparse())
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
function selection(options) {
    const { expressions } = options;
    const arity = expressions.length;
    return {
        parse() {
            for (let i = 0; i < arity; ++i) {
                if (expressions[i].parse())
                    return true;
            }
            return false;
        },
        unparse() {
            for (let i = 0; i < arity; ++i) {
                if (expressions[i].unparse())
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
        parse() {
            let stateₒ = getState();
            let node;
            for (let i = 0; i < arity; ++i) {
                if (!expressions[i].parse())
                    return setState(stateₒ), false;
                node = concat(node, OUT);
            }
            OUT = node;
            return true;
        },
        unparse() {
            let stateₒ = getState();
            let text;
            for (let i = 0; i < arity; ++i) {
                if (!expressions[i].unparse())
                    return setState(stateₒ), false;
                text = concat(text, OUT);
            }
            OUT = text;
            return true;
        },
    };
}
function stringLiteral(options) {
    const { value } = options;
    const NO_CONSUME = options.in === 'nil';
    const NO_PRODUCE = options.out === 'nil';
    return {
        parse() {
            if (!NO_CONSUME) {
                if (typeof IN !== 'string')
                    return false;
                if (!isMatch(value))
                    return false;
                IP += value.length;
            }
            OUT = NO_PRODUCE ? undefined : value;
            return true;
        },
        unparse() {
            if (!NO_CONSUME) {
                if (typeof IN !== 'string')
                    return false;
                if (!isMatch(value))
                    return false;
                IP += value.length;
            }
            OUT = NO_PRODUCE ? undefined : value;
            return true;
        },
    };
}
function isMatch(substr) {
    let lastPos = IP + substr.length;
    if (lastPos > IN.length)
        return false;
    for (let i = IP, j = 0; i < lastPos; ++i, ++j) {
        if (IN.charAt(i) !== substr.charAt(j))
            return false;
    }
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
    if (typeof a === 'object' && a !== null && typeof b === 'object' && b !== null)
        return Object.assign(Object.assign({}, a), b);
    throw new Error(`Internal error: invalid sequence`);
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
function NOT_A_RULE() { throw new Error('Not a rule'); }

// -------------------- Extensions --------------------
const 𝔼9 = (() => {
    "use strict";
    /* @pen exports = {
        float64,
        int32,
        memoise,
    } */
    // TODO: doc... has both 'txt' and 'ast' representation
    function float64(options) {
        const NO_CONSUME = options.in === 'nil';
        const NO_PRODUCE = options.out === 'nil';
        return {
            parse() {
                if (NO_CONSUME) {
                    OUT = NO_PRODUCE ? undefined : 0;
                    return true;
                }
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
                OUT = NO_PRODUCE ? undefined : num;
                return true;
            },
            unparse() {
                if (NO_CONSUME) {
                    OUT = NO_PRODUCE ? undefined : '0';
                    return true;
                }
                // Ensure N is a number.
                if (typeof IN !== 'number' || IP !== 0)
                    return false;
                // Delegate unparsing to the JS runtime.
                // TODO: the conversion may not exactly match the original string. Add this to the lossiness list.
                OUT = NO_PRODUCE ? undefined : String(IN);
                IP = 1;
                return true;
            },
        };
    }
    // These constants are used by the float64 rule.
    const PLUS_SIGN = '+'.charCodeAt(0);
    const MINUS_SIGN = '-'.charCodeAt(0);
    const DECIMAL_POINT = '.'.charCodeAt(0);
    const ZERO_DIGIT = '0'.charCodeAt(0);
    const NINE_DIGIT = '9'.charCodeAt(0);
    const LOWERCASE_E = 'e'.charCodeAt(0);
    const UPPERCASE_E = 'E'.charCodeAt(0);
    // tslint:disable: no-bitwise
    // TODO: doc... has both 'txt' and 'ast' representation
    function int32(options) {
        const NO_CONSUME = options.in === 'nil';
        const NO_PRODUCE = options.out === 'nil';
        let result = {
            parse: NOT_A_RULE,
            unparse: NOT_A_RULE,
            // TODO: temp testing... the lambda form which takes a `base` arg
            lambda(expr) {
                var _a, _b, _c, _d, _e, _f, _g, _h;
                let base = (_d = (_c = (_b = (_a = expr.bindings) === null || _a === void 0 ? void 0 : _a.base) === null || _b === void 0 ? void 0 : _b.constant) === null || _c === void 0 ? void 0 : _c.value) !== null && _d !== void 0 ? _d : 10;
                let signed = (_h = (_g = (_f = (_e = expr.bindings) === null || _e === void 0 ? void 0 : _e.signed) === null || _f === void 0 ? void 0 : _f.constant) === null || _g === void 0 ? void 0 : _g.value) !== null && _h !== void 0 ? _h : true;
                assert(typeof base === 'number' && base >= 2 && base <= 36);
                assert(typeof signed === 'boolean');
                return {
                    parse() {
                        if (NO_CONSUME) {
                            OUT = NO_PRODUCE ? undefined : 0;
                            return true;
                        }
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
                        OUT = NO_PRODUCE ? undefined : num;
                        return true;
                    },
                    unparse() {
                        if (NO_CONSUME) {
                            OUT = NO_PRODUCE ? undefined : '0';
                            return true;
                        }
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
                        OUT = NO_PRODUCE ? undefined : String.fromCharCode(...digits.reverse()); // TODO: is this performant?
                        IP = 1;
                        return true;
                    },
                };
            },
        };
        // TODO: temp testing...
        result.parse = result.lambda({ bindings: {
                base: { constant: { value: 10 } },
                unsigned: { constant: { value: false } },
            } }).parse;
        result.unparse = result.lambda({ bindings: {
                base: { constant: { value: 10 } },
                unsigned: { constant: { value: false } },
            } }).unparse;
        return result;
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
            parse: NOT_A_RULE,
            unparse: NOT_A_RULE,
            lambda(expr) {
                // TODO: investigate... need to use `text` as part of memo key? Study lifecycle/extent of each `memos` instance.
                const parseMemos = new Map();
                // TODO: revise memo key once using new ast/pos signature
                const unparseMemos = new Map();
                return {
                    parse() {
                        // Check whether the memo table already has an entry for the given initial state.
                        let stateₒ = getState();
                        let memos2 = parseMemos.get(IN);
                        if (memos2 === undefined) {
                            memos2 = new Map();
                            parseMemos.set(IN, memos2);
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
                            if (expr.parse()) {
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
                                if (!expr.parse())
                                    break;
                                let state = getState();
                                if (state.IP <= memo.stateᐟ.IP)
                                    break;
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
                    unparse() {
                        // Check whether the memo table already has an entry for the given initial state.
                        let stateₒ = getState();
                        let memos2 = unparseMemos.get(IN);
                        if (memos2 === undefined) {
                            memos2 = new Map();
                            unparseMemos.set(IN, memos2);
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
                            if (expr.unparse()) {
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
                                // TODO: break cases:
                                // anything --> same thing (covers all string cases, since they can only be same or shorter)
                                // some node --> some different non-empty node (assert: should never happen!)
                                if (!expr.parse())
                                    break;
                                let state = getState();
                                if (state.IP === memo.stateᐟ.IP)
                                    break;
                                if (!isInputFullyConsumed())
                                    break;
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

    return {
        float64,
        int32,
        memoise,
    };
})();
const 𝔼10 = (() => {
    "use strict";
    /* @pen exports = {
        anyChar,
        epsilon,
        maybe,
        not,
        unicode,
        zeroOrMore
    } */
    // TODO: doc... has both 'txt' and 'ast' representation
    function anyChar(options) {
        const NO_CONSUME = options.in === 'nil';
        const NO_PRODUCE = options.out === 'nil';
        return {
            parse() {
                let c = '?';
                if (!NO_CONSUME) {
                    if (typeof IN !== 'string')
                        return false;
                    if (IP < 0 || IP >= IN.length)
                        return false;
                    c = IN.charAt(IP);
                    IP += 1;
                }
                OUT = NO_PRODUCE ? undefined : c;
                return true;
            },
            unparse() {
                let c = '?';
                if (!NO_CONSUME) {
                    if (typeof IN !== 'string')
                        return false;
                    if (IP < 0 || IP >= IN.length)
                        return false;
                    c = IN.charAt(IP);
                    IP += 1;
                }
                OUT = NO_PRODUCE ? undefined : c;
                return true;
            },
        };
    }
    function epsilon(_options) {
        return {
            parse() {
                OUT = undefined;
                return true;
            },
            unparse() {
                OUT = undefined;
                return true;
            },
        };
    }
    function maybe(options) {
        const eps = epsilon(options); // TODO: remove this altogether?
        return {
            parse: NOT_A_RULE,
            unparse: NOT_A_RULE,
            lambda(expr) {
                return {
                    parse() {
                        return expr.parse() || eps.parse();
                    },
                    unparse() {
                        return expr.unparse() || eps.unparse();
                    },
                };
            },
        };
    }
    function not(options) {
        const eps = epsilon(options); // TODO: remove this altogether?
        return {
            parse: NOT_A_RULE,
            unparse: NOT_A_RULE,
            lambda(expr) {
                return {
                    parse() {
                        let stateₒ = getState();
                        if (!expr.parse())
                            return eps.parse();
                        setState(stateₒ);
                        return false;
                    },
                    unparse() {
                        let stateₒ = getState();
                        if (!expr.unparse())
                            return eps.unparse();
                        setState(stateₒ);
                        return false;
                    },
                };
            },
        };
    }
    function unicode(_options) {
        return {
            parse: NOT_A_RULE,
            unparse: NOT_A_RULE,
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
                return {
                    parse() {
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
                    unparse: () => {
                        // TODO: implement
                        return false;
                    },
                };
            },
        };
    }
    function zeroOrMore(_options) {
        return {
            parse: NOT_A_RULE,
            unparse: NOT_A_RULE,
            lambda(expr) {
                return {
                    parse() {
                        let stateₒ = getState();
                        let node;
                        while (true) {
                            if (!expr.parse())
                                break;
                            // TODO: check if any input was consumed...
                            // if not, stop iterating, since otherwise we may loop forever
                            if (IP === stateₒ.IP)
                                break;
                            node = concat(node, OUT);
                        }
                        OUT = node;
                        return true;
                    },
                    unparse() {
                        let stateₒ = getState();
                        let text;
                        while (true) {
                            if (!expr.unparse())
                                break;
                            // TODO: check if any input was consumed...
                            // if not, stop iterating, since otherwise we may loop forever
                            // TODO: any other checks needed? review...
                            if (IP === stateₒ.IP)
                                break;
                            // TODO: support more formats / blob types here, like for parse...
                            assert(typeof OUT === 'string'); // just for now... remove after addressing above TODO
                            text = concat(text, OUT);
                        }
                        OUT = text;
                        return true;
                    },
                };
            },
        };
    }

    return {
        anyChar,
        epsilon,
        maybe,
        not,
        unicode,
        zeroOrMore,
    };
})();

function createProgram({in: IN, out: OUT}) {

    const 𝕊7 = {
        bindings: {
            float64: {},
            anyChar: {},
            maybe: {},
            not: {},
            zeroOrMore: {},
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

    const 𝕊8 = {
        bindings: {
            base: {},
            minDigits: {},
            maxDigits: {},
        },
    };

    const 𝕊9 = {
        bindings: {
            float64: {},
            int32: {},
            memoise: {},
        },
    };

    const 𝕊10 = {
        bindings: {
            anyChar: {},
            epsilon: {},
            maybe: {},
            not: {},
            unicode: {},
            zeroOrMore: {},
        },
    };

    // -------------------- Aliases --------------------
    𝕊7.bindings.float64 = 𝕊9.bindings.float64;
    𝕊7.bindings.anyChar = 𝕊10.bindings.anyChar;
    𝕊7.bindings.maybe = 𝕊10.bindings.maybe;
    𝕊7.bindings.not = 𝕊10.bindings.not;
    𝕊7.bindings.zeroOrMore = 𝕊10.bindings.zeroOrMore;
    𝕊7.bindings.unicode = 𝕊10.bindings.unicode;
    𝕊7.bindings.Number = 𝕊7.bindings.float64;

    // -------------------- Compile-time constants --------------------
    𝕊7.bindings.DOUBLE_QUOTE.constant = {value: "\""};
    𝕊8.bindings.base.constant = {value: 16};
    𝕊8.bindings.minDigits.constant = {value: 4};
    𝕊8.bindings.maxDigits.constant = {value: 4};

    // -------------------- std.pen.js --------------------

    Object.assign(
        𝕊9.bindings.float64,
        𝔼9.float64({/*TODO: pass staticOptions*/}),
    );

    Object.assign(
        𝕊9.bindings.int32,
        𝔼9.int32({/*TODO: pass staticOptions*/}),
    );

    Object.assign(
        𝕊9.bindings.memoise,
        𝔼9.memoise({/*TODO: pass staticOptions*/}),
    );

    // -------------------- experiments.pen.js --------------------

    Object.assign(
        𝕊10.bindings.anyChar,
        𝔼10.anyChar({/*TODO: pass staticOptions*/}),
    );

    Object.assign(
        𝕊10.bindings.epsilon,
        𝔼10.epsilon({/*TODO: pass staticOptions*/}),
    );

    Object.assign(
        𝕊10.bindings.maybe,
        𝔼10.maybe({/*TODO: pass staticOptions*/}),
    );

    Object.assign(
        𝕊10.bindings.not,
        𝔼10.not({/*TODO: pass staticOptions*/}),
    );

    Object.assign(
        𝕊10.bindings.unicode,
        𝔼10.unicode({/*TODO: pass staticOptions*/}),
    );

    Object.assign(
        𝕊10.bindings.zeroOrMore,
        𝔼10.zeroOrMore({/*TODO: pass staticOptions*/}),
    );

    // -------------------- json.pen --------------------

    Object.assign(
        𝕊7.bindings.start,
        sequence({
            expressions: [
                𝕊7.bindings.WS,
                𝕊7.bindings.Value,
                𝕊7.bindings.WS,
            ],
        })
    );

    Object.assign(
        𝕊7.bindings.Value,
        selection({
            expressions: [
                𝕊7.bindings.False,
                𝕊7.bindings.Null,
                𝕊7.bindings.True,
                𝕊7.bindings.Object,
                𝕊7.bindings.Array,
                𝕊7.bindings.Number,
                𝕊7.bindings.String,
            ],
        })
    );

    Object.assign(
        𝕊7.bindings.False,
        sequence({
            expressions: [
                stringLiteral({
                    in: IN !== "txt" ? "nil" : IN,
                    out: OUT !== "txt" ? "nil" : OUT,
                    value: "false",
                }),
                booleanLiteral({value: false}),
            ],
        })
    );

    Object.assign(
        𝕊7.bindings.Null,
        sequence({
            expressions: [
                stringLiteral({
                    in: IN !== "txt" ? "nil" : IN,
                    out: OUT !== "txt" ? "nil" : OUT,
                    value: "null",
                }),
                nullLiteral({}),
            ],
        })
    );

    Object.assign(
        𝕊7.bindings.True,
        sequence({
            expressions: [
                stringLiteral({
                    in: IN !== "txt" ? "nil" : IN,
                    out: OUT !== "txt" ? "nil" : OUT,
                    value: "true",
                }),
                booleanLiteral({value: true}),
            ],
        })
    );

    Object.assign(
        𝕊7.bindings.Object,
        sequence({
            expressions: [
                𝕊7.bindings.LBRACE,
                selection({
                    expressions: [
                        𝕊7.bindings.Properties,
                        record({
                            fields: [],
                        }),
                    ],
                }),
                𝕊7.bindings.RBRACE,
            ],
        })
    );

    Object.assign(
        𝕊7.bindings.Properties,
        sequence({
            expressions: [
                field({
                    name: 𝕊7.bindings.String,
                    value: sequence({
                        expressions: [
                            𝕊7.bindings.COLON,
                            𝕊7.bindings.Value,
                        ],
                    }),
                }),
                (𝕊7.bindings.maybe).lambda(sequence({
                    expressions: [
                        𝕊7.bindings.COMMA,
                        𝕊7.bindings.Properties,
                    ],
                })),
            ],
        })
    );

    Object.assign(
        𝕊7.bindings.Array,
        sequence({
            expressions: [
                𝕊7.bindings.LBRACKET,
                selection({
                    expressions: [
                        𝕊7.bindings.Elements,
                        list({
                            elements: [],
                        }),
                    ],
                }),
                𝕊7.bindings.RBRACKET,
            ],
        })
    );

    Object.assign(
        𝕊7.bindings.Elements,
        sequence({
            expressions: [
                list({
                    elements: [
                        𝕊7.bindings.Value,
                    ],
                }),
                (𝕊7.bindings.maybe).lambda(sequence({
                    expressions: [
                        𝕊7.bindings.COMMA,
                        𝕊7.bindings.Elements,
                    ],
                })),
            ],
        })
    );

    Object.assign(
        𝕊7.bindings.String,
        sequence({
            expressions: [
                𝕊7.bindings.DOUBLE_QUOTE,
                (𝕊7.bindings.zeroOrMore).lambda(𝕊7.bindings.CHAR),
                𝕊7.bindings.DOUBLE_QUOTE,
            ],
        })
    );

    Object.assign(
        𝕊7.bindings.CHAR,
        selection({
            expressions: [
                sequence({
                    expressions: [
                        (𝕊7.bindings.not).lambda(selection({
                            expressions: [
                                character({
                                    in: IN,
                                    out: OUT,
                                    min: "\u0000",
                                    max: "\u001f",
                                }),
                                stringLiteral({
                                    in: IN,
                                    out: OUT,
                                    value: "\"",
                                }),
                                stringLiteral({
                                    in: IN,
                                    out: OUT,
                                    value: "\\",
                                }),
                            ],
                        })),
                        𝕊7.bindings.anyChar,
                    ],
                }),
                sequence({
                    expressions: [
                        stringLiteral({
                            in: IN !== "txt" ? "nil" : IN,
                            out: OUT !== "txt" ? "nil" : OUT,
                            value: "\\\"",
                        }),
                        stringLiteral({
                            in: IN !== "ast" ? "nil" : IN,
                            out: OUT !== "ast" ? "nil" : OUT,
                            value: "\"",
                        }),
                    ],
                }),
                sequence({
                    expressions: [
                        stringLiteral({
                            in: IN !== "txt" ? "nil" : IN,
                            out: OUT !== "txt" ? "nil" : OUT,
                            value: "\\\\",
                        }),
                        stringLiteral({
                            in: IN !== "ast" ? "nil" : IN,
                            out: OUT !== "ast" ? "nil" : OUT,
                            value: "\\",
                        }),
                    ],
                }),
                sequence({
                    expressions: [
                        stringLiteral({
                            in: IN !== "txt" ? "nil" : IN,
                            out: OUT !== "txt" ? "nil" : OUT,
                            value: "\\/",
                        }),
                        stringLiteral({
                            in: IN !== "ast" ? "nil" : IN,
                            out: OUT !== "ast" ? "nil" : OUT,
                            value: "/",
                        }),
                    ],
                }),
                sequence({
                    expressions: [
                        stringLiteral({
                            in: IN !== "txt" ? "nil" : IN,
                            out: OUT !== "txt" ? "nil" : OUT,
                            value: "\\b",
                        }),
                        stringLiteral({
                            in: IN !== "ast" ? "nil" : IN,
                            out: OUT !== "ast" ? "nil" : OUT,
                            value: "\b",
                        }),
                    ],
                }),
                sequence({
                    expressions: [
                        stringLiteral({
                            in: IN !== "txt" ? "nil" : IN,
                            out: OUT !== "txt" ? "nil" : OUT,
                            value: "\\f",
                        }),
                        stringLiteral({
                            in: IN !== "ast" ? "nil" : IN,
                            out: OUT !== "ast" ? "nil" : OUT,
                            value: "\f",
                        }),
                    ],
                }),
                sequence({
                    expressions: [
                        stringLiteral({
                            in: IN !== "txt" ? "nil" : IN,
                            out: OUT !== "txt" ? "nil" : OUT,
                            value: "\\n",
                        }),
                        stringLiteral({
                            in: IN !== "ast" ? "nil" : IN,
                            out: OUT !== "ast" ? "nil" : OUT,
                            value: "\n",
                        }),
                    ],
                }),
                sequence({
                    expressions: [
                        stringLiteral({
                            in: IN !== "txt" ? "nil" : IN,
                            out: OUT !== "txt" ? "nil" : OUT,
                            value: "\\r",
                        }),
                        stringLiteral({
                            in: IN !== "ast" ? "nil" : IN,
                            out: OUT !== "ast" ? "nil" : OUT,
                            value: "\r",
                        }),
                    ],
                }),
                sequence({
                    expressions: [
                        stringLiteral({
                            in: IN !== "txt" ? "nil" : IN,
                            out: OUT !== "txt" ? "nil" : OUT,
                            value: "\\t",
                        }),
                        stringLiteral({
                            in: IN !== "ast" ? "nil" : IN,
                            out: OUT !== "ast" ? "nil" : OUT,
                            value: "\t",
                        }),
                    ],
                }),
                sequence({
                    expressions: [
                        stringLiteral({
                            in: IN !== "txt" ? "nil" : IN,
                            out: OUT !== "txt" ? "nil" : OUT,
                            value: "\\u",
                        }),
                        (𝕊7.bindings.unicode).lambda(𝕊8),
                    ],
                }),
            ],
        })
    );

    Object.assign(
        𝕊7.bindings.LBRACE,
        sequence({
            expressions: [
                𝕊7.bindings.WS,
                stringLiteral({
                    in: IN !== "txt" ? "nil" : IN,
                    out: OUT !== "txt" ? "nil" : OUT,
                    value: "{",
                }),
                𝕊7.bindings.WS,
            ],
        })
    );

    Object.assign(
        𝕊7.bindings.RBRACE,
        sequence({
            expressions: [
                𝕊7.bindings.WS,
                stringLiteral({
                    in: IN !== "txt" ? "nil" : IN,
                    out: OUT !== "txt" ? "nil" : OUT,
                    value: "}",
                }),
                𝕊7.bindings.WS,
            ],
        })
    );

    Object.assign(
        𝕊7.bindings.LBRACKET,
        sequence({
            expressions: [
                𝕊7.bindings.WS,
                stringLiteral({
                    in: IN !== "txt" ? "nil" : IN,
                    out: OUT !== "txt" ? "nil" : OUT,
                    value: "[",
                }),
                𝕊7.bindings.WS,
            ],
        })
    );

    Object.assign(
        𝕊7.bindings.RBRACKET,
        sequence({
            expressions: [
                𝕊7.bindings.WS,
                stringLiteral({
                    in: IN !== "txt" ? "nil" : IN,
                    out: OUT !== "txt" ? "nil" : OUT,
                    value: "]",
                }),
                𝕊7.bindings.WS,
            ],
        })
    );

    Object.assign(
        𝕊7.bindings.COLON,
        sequence({
            expressions: [
                𝕊7.bindings.WS,
                stringLiteral({
                    in: IN !== "txt" ? "nil" : IN,
                    out: OUT !== "txt" ? "nil" : OUT,
                    value: ":",
                }),
                𝕊7.bindings.WS,
            ],
        })
    );

    Object.assign(
        𝕊7.bindings.COMMA,
        sequence({
            expressions: [
                𝕊7.bindings.WS,
                stringLiteral({
                    in: IN !== "txt" ? "nil" : IN,
                    out: OUT !== "txt" ? "nil" : OUT,
                    value: ",",
                }),
                𝕊7.bindings.WS,
            ],
        })
    );

    Object.assign(
        𝕊7.bindings.DOUBLE_QUOTE,
        stringLiteral({
            in: IN !== "txt" ? "nil" : IN,
            out: OUT !== "txt" ? "nil" : OUT,
            value: "\"",
        })
    );

    Object.assign(
        𝕊7.bindings.WS,
        (𝕊7.bindings.zeroOrMore).lambda(selection({
            expressions: [
                stringLiteral({
                    in: IN !== "txt" ? "nil" : IN,
                    out: OUT !== "txt" ? "nil" : OUT,
                    value: " ",
                }),
                stringLiteral({
                    in: IN !== "txt" ? "nil" : IN,
                    out: OUT !== "txt" ? "nil" : OUT,
                    value: "\t",
                }),
                stringLiteral({
                    in: IN !== "txt" ? "nil" : IN,
                    out: OUT !== "txt" ? "nil" : OUT,
                    value: "\n",
                }),
                stringLiteral({
                    in: IN !== "txt" ? "nil" : IN,
                    out: OUT !== "txt" ? "nil" : OUT,
                    value: "\r",
                }),
            ],
        }))
    );

    Object.assign(
        𝕊8.bindings.base,
        numericLiteral({value: 16})
    );

    Object.assign(
        𝕊8.bindings.minDigits,
        numericLiteral({value: 4})
    );

    Object.assign(
        𝕊8.bindings.maxDigits,
        numericLiteral({value: 4})
    );

    return 𝕊7.bindings.start;
}

// -------------------- Main exports --------------------
module.exports = createMainExports(createProgram);
