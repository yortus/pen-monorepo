
"use strict";
function abstract(expr) {
    return {
        bindings: {},
        parse() {
            let state = getState();
            let INULₒ = state.INUL;
            state.INUL = true;
            setState(state);
            let result = expr.parse();
            state = getState();
            state.INUL = INULₒ;
            setState(state);
            return result;
        },
        unparse() {
            let state = getState();
            let ONULₒ = state.ONUL;
            state.ONUL = true;
            setState(state);
            let result = expr.unparse();
            state = getState();
            state.ONUL = ONULₒ;
            setState(state);
            return result;
        },
        apply: NOT_A_LAMBDA,
    };
}
function apply(lambda, arg) {
    return lambda.apply(arg);
}
function booleanLiteral(value) {
    return {
        bindings: {},
        parse() {
            let { ONUL } = getState();
            setOutState(ONUL ? undefined : value);
            return true;
        },
        unparse() {
            let { IDOC, IMEM, INUL } = getState();
            if (!INUL) {
                if (IDOC !== value || IMEM !== 0)
                    return false;
                setInState(IDOC, 1);
            }
            setOutState(undefined);
            return true;
        },
        apply: NOT_A_LAMBDA,
    };
}
function character(min, max) {
    return {
        bindings: {},
        parse() {
            let { IDOC, IMEM, INUL, ONUL } = getState();
            let c = min;
            if (!INUL) {
                if (!isString(IDOC))
                    return false;
                if (IMEM < 0 || IMEM >= IDOC.length)
                    return false;
                c = IDOC.charAt(IMEM);
                if (c < min || c > max)
                    return false;
                setInState(IDOC, IMEM + 1);
            }
            setOutState(ONUL ? undefined : c);
            return true;
        },
        unparse() {
            let { IDOC, IMEM, INUL, ONUL } = getState();
            let c = min;
            if (!INUL) {
                if (!isString(IDOC))
                    return false;
                if (IMEM < 0 || IMEM >= IDOC.length)
                    return false;
                c = IDOC.charAt(IMEM);
                if (c < min || c > max)
                    return false;
                setInState(IDOC, IMEM + 1);
            }
            setOutState(ONUL ? undefined : c);
            return true;
        },
        apply: NOT_A_LAMBDA,
    };
}
function concrete(expr) {
    return {
        bindings: {},
        parse() {
            let state = getState();
            let ONULₒ = state.ONUL;
            state.ONUL = true;
            setState(state);
            let result = expr.parse();
            state = getState();
            state.ONUL = ONULₒ;
            setState(state);
            return result;
        },
        unparse() {
            let state = getState();
            let INULₒ = state.INUL;
            state.INUL = true;
            setState(state);
            let result = expr.unparse();
            state = getState();
            state.INUL = INULₒ;
            setState(state);
            return result;
        },
        apply: NOT_A_LAMBDA,
    };
}
function createMainExports(start) {
    return {
        parse: (text) => {
            setInState(text, 0);
            if (!start.parse())
                throw new Error('parse failed');
            let { IDOC, IMEM, ODOC } = getState();
            if (!isFullyConsumed(IDOC, IMEM))
                throw new Error(`parse didn't consume entire input`);
            if (ODOC === undefined)
                throw new Error(`parse didn't return a value`);
            return ODOC;
        },
        unparse: (node) => {
            setInState(node, 0);
            if (!start.unparse())
                throw new Error('parse failed');
            let { IDOC, IMEM, ODOC } = getState();
            if (!isFullyConsumed(IDOC, IMEM))
                throw new Error(`unparse didn't consume entire input`);
            if (ODOC === undefined)
                throw new Error(`parse didn't return a value`);
            return ODOC;
        },
    };
}
function field(name, value) {
    return {
        bindings: {},
        parse() {
            let stateₒ = getState();
            let obj = {};
            if (!name.parse())
                return setState(stateₒ), false;
            let { ODOC } = getState();
            assert(typeof ODOC === 'string');
            let propName = ODOC;
            if (!value.parse())
                return setState(stateₒ), false;
            ({ ODOC } = getState());
            assert(ODOC !== undefined);
            obj[propName] = ODOC;
            setOutState(obj);
            return true;
        },
        unparse() {
            let stateₒ = getState();
            let text;
            if (!isPlainObject(stateₒ.IDOC))
                return false;
            let propNames = Object.keys(stateₒ.IDOC);
            let propCount = propNames.length;
            assert(propCount <= 32);
            const obj = stateₒ.IDOC;
            let bitmask = stateₒ.IMEM;
            for (let i = 0; i < propCount; ++i) {
                let propName = propNames[i];
                const propBit = 1 << i;
                if ((bitmask & propBit) !== 0)
                    continue;
                setInState(propName, 0);
                if (!name.unparse())
                    continue;
                let { IMEM, ODOC } = getState();
                if (IMEM !== propName.length)
                    continue;
                text = concat(text, ODOC);
                setInState(obj[propName], 0);
                if (!value.unparse())
                    continue;
                ({ IMEM, ODOC } = getState());
                if (!isFullyConsumed(obj[propName], IMEM))
                    continue;
                text = concat(text, ODOC);
                bitmask += propBit;
                setInState(obj, bitmask);
                setOutState(text);
                return true;
            }
            setState(stateₒ);
            return false;
        },
        apply: NOT_A_LAMBDA,
    };
}
function list(elements) {
    const elementsLength = elements.length;
    return {
        bindings: {},
        parse() {
            let stateₒ = getState();
            let arr = [];
            for (let i = 0; i < elementsLength; ++i) {
                if (!elements[i].parse())
                    return setState(stateₒ), false;
                let { ODOC } = getState();
                assert(ODOC !== undefined);
                arr.push(ODOC);
            }
            setOutState(arr);
            return true;
        },
        unparse() {
            let stateₒ = getState();
            let text;
            if (!Array.isArray(stateₒ.IDOC))
                return false;
            if (stateₒ.IMEM < 0 || stateₒ.IMEM + elementsLength > stateₒ.IDOC.length)
                return false;
            const arr = stateₒ.IDOC;
            const off = stateₒ.IMEM;
            for (let i = 0; i < elementsLength; ++i) {
                setInState(arr[off + i], 0);
                if (!elements[i].unparse())
                    return setState(stateₒ), false;
                let { IDOC, IMEM, ODOC } = getState();
                if (!isFullyConsumed(IDOC, IMEM))
                    return setState(stateₒ), false;
                text = concat(text, ODOC);
            }
            setInState(arr, off + elementsLength);
            setOutState(text);
            return true;
        },
        apply: NOT_A_LAMBDA,
    };
}
const nullLiteral = {
    bindings: {},
    parse() {
        let { ONUL } = getState();
        setOutState(ONUL ? undefined : null);
        return true;
    },
    unparse() {
        let { IDOC, IMEM, INUL } = getState();
        if (!INUL) {
            if (IDOC !== null || IMEM !== 0)
                return false;
            setInState(IDOC, 1);
        }
        setOutState(undefined);
        return true;
    },
    apply: NOT_A_LAMBDA,
};
function numericLiteral(value) {
    return {
        bindings: {},
        parse() {
            let { ONUL } = getState();
            setOutState(ONUL ? undefined : value);
            return true;
        },
        unparse() {
            let { IDOC, IMEM, INUL } = getState();
            if (!INUL) {
                if (IDOC !== value || IMEM !== 0)
                    return false;
                setInState(IDOC, 1);
            }
            setOutState(undefined);
            return true;
        },
        apply: NOT_A_LAMBDA,
    };
}
function record(fields) {
    return {
        bindings: {},
        parse() {
            let stateₒ = getState();
            let obj = {};
            for (let field of fields) {
                let propName = field.name;
                if (!field.value.parse())
                    return setState(stateₒ), false;
                let { ODOC } = getState();
                assert(ODOC !== undefined);
                obj[propName] = ODOC;
            }
            setOutState(obj);
            return true;
        },
        unparse() {
            let stateₒ = getState();
            let text;
            if (!isPlainObject(stateₒ.IDOC))
                return false;
            let propNames = Object.keys(stateₒ.IDOC);
            let propCount = propNames.length;
            assert(propCount <= 32);
            const obj = stateₒ.IDOC;
            let bitmask = stateₒ.IMEM;
            for (let field of fields) {
                let i = propNames.indexOf(field.name);
                if (i < 0)
                    return setState(stateₒ), false;
                let propName = propNames[i];
                const propBit = 1 << i;
                if ((bitmask & propBit) !== 0)
                    return setState(stateₒ), false;
                setInState(obj[propName], 0);
                if (!field.value.unparse())
                    return setState(stateₒ), false;
                let { IMEM, ODOC } = getState();
                if (!isFullyConsumed(obj[propName], IMEM))
                    return setState(stateₒ), false;
                text = concat(text, ODOC);
                bitmask += propBit;
            }
            setInState(obj, bitmask);
            setOutState(text);
            return true;
        },
        apply: NOT_A_LAMBDA,
    };
}
function selection(...expressions) {
    const arity = expressions.length;
    return {
        bindings: {},
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
        apply: NOT_A_LAMBDA,
    };
}
function sequence(...expressions) {
    const arity = expressions.length;
    return {
        bindings: {},
        parse() {
            let stateₒ = getState();
            let node;
            for (let i = 0; i < arity; ++i) {
                if (!expressions[i].parse())
                    return setState(stateₒ), false;
                let { ODOC } = getState();
                node = concat(node, ODOC);
            }
            setOutState(node);
            return true;
        },
        unparse() {
            let stateₒ = getState();
            let text;
            for (let i = 0; i < arity; ++i) {
                if (!expressions[i].unparse())
                    return setState(stateₒ), false;
                let { ODOC } = getState();
                text = concat(text, ODOC);
            }
            setOutState(text);
            return true;
        },
        apply: NOT_A_LAMBDA,
    };
}
function stringLiteral(value) {
    return {
        bindings: {},
        parse() {
            let { IDOC, IMEM, INUL, ONUL } = getState();
            if (!INUL) {
                if (!isString(IDOC))
                    return false;
                if (!matchesAt(IDOC, value, IMEM))
                    return false;
                setInState(IDOC, IMEM + value.length);
            }
            setOutState(ONUL ? undefined : value);
            return true;
        },
        unparse() {
            let { IDOC, IMEM, INUL, ONUL } = getState();
            if (!INUL) {
                if (!isString(IDOC))
                    return false;
                if (!matchesAt(IDOC, value, IMEM))
                    return false;
                setInState(IDOC, IMEM + value.length);
            }
            setOutState(ONUL ? undefined : value);
            return true;
        },
        apply: NOT_A_LAMBDA,
    };
}
let IDOC;
let IMEM;
let ODOC;
let INUL = false;
let ONUL = false;
function getState() {
    return { IDOC, IMEM, ODOC, INUL, ONUL };
}
function setState(value) {
    ({ IDOC, IMEM, ODOC, INUL, ONUL } = value);
}
function setInState(IDOCᐟ, IMEMᐟ) {
    IDOC = IDOCᐟ;
    IMEM = IMEMᐟ;
}
function setOutState(ODOCᐟ) {
    ODOC = ODOCᐟ;
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
    if (isPlainObject(a) && isPlainObject(b))
        return Object.assign(Object.assign({}, a), b);
    throw new Error(`Internal error: invalid sequence`);
}
function isFullyConsumed(node, pos) {
    if (typeof node === 'string')
        return pos === node.length;
    if (Array.isArray(node))
        return pos === node.length;
    if (isPlainObject(node)) {
        let keyCount = Object.keys(node).length;
        assert(keyCount <= 32);
        if (keyCount === 0)
            return true;
        return pos === -1 >>> (32 - keyCount);
    }
    return pos === 1;
}
function isPlainObject(value) {
    return value !== null && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype;
}
function isString(value) {
    return typeof value === 'string';
}
function matchesAt(text, substr, position) {
    let lastPos = position + substr.length;
    if (lastPos > text.length)
        return false;
    for (let i = position, j = 0; i < lastPos; ++i, ++j) {
        if (text.charAt(i) !== substr.charAt(j))
            return false;
    }
    return true;
}
function NOT_A_LAMBDA() { throw new Error('Not a lambda'); }
;
function NOT_A_RULE() { throw new Error('Not a rule'); }
;
const float64 = (() => {
    const PLUS_SIGN = '+'.charCodeAt(0);
    const MINUS_SIGN = '-'.charCodeAt(0);
    const DECIMAL_POINT = '.'.charCodeAt(0);
    const ZERO_DIGIT = '0'.charCodeAt(0);
    const NINE_DIGIT = '9'.charCodeAt(0);
    const LOWERCASE_E = 'e'.charCodeAt(0);
    const UPPERCASE_E = 'E'.charCodeAt(0);
    return {
        bindings: {},
        parse() {
            let stateₒ = getState();
            let { IDOC, IMEM, INUL, ONUL } = stateₒ;
            if (!isString(IDOC))
                return false;
            const LEN = IDOC.length;
            const EOS = 0;
            let digitCount = 0;
            let c = IDOC.charCodeAt(IMEM);
            if (c === PLUS_SIGN || c === MINUS_SIGN) {
                IMEM += 1;
                c = IMEM < LEN ? IDOC.charCodeAt(IMEM) : EOS;
            }
            while (true) {
                if (c < ZERO_DIGIT || c > NINE_DIGIT)
                    break;
                digitCount += 1;
                IMEM += 1;
                c = IMEM < LEN ? IDOC.charCodeAt(IMEM) : EOS;
            }
            if (c === DECIMAL_POINT) {
                IMEM += 1;
                c = IMEM < LEN ? IDOC.charCodeAt(IMEM) : EOS;
            }
            while (true) {
                if (c < ZERO_DIGIT || c > NINE_DIGIT)
                    break;
                digitCount += 1;
                IMEM += 1;
                c = IMEM < LEN ? IDOC.charCodeAt(IMEM) : EOS;
            }
            if (digitCount === 0)
                return false;
            if (c === UPPERCASE_E || c === LOWERCASE_E) {
                IMEM += 1;
                c = IMEM < LEN ? IDOC.charCodeAt(IMEM) : EOS;
                if (c === PLUS_SIGN || c === MINUS_SIGN) {
                    IMEM += 1;
                    c = IMEM < LEN ? IDOC.charCodeAt(IMEM) : EOS;
                }
                digitCount = 0;
                while (true) {
                    if (c < ZERO_DIGIT || c > NINE_DIGIT)
                        break;
                    digitCount += 1;
                    IMEM += 1;
                    c = IMEM < LEN ? IDOC.charCodeAt(IMEM) : EOS;
                }
                if (digitCount === 0)
                    return false;
            }
            let num = Number.parseFloat(IDOC.slice(stateₒ.IMEM, IMEM));
            if (!Number.isFinite(num))
                return false;
            setState({ IDOC, IMEM, ODOC: num, INUL, ONUL });
            return true;
        },
        unparse() {
            let { IDOC, IMEM, INUL, ONUL } = getState();
            if (typeof IDOC !== 'number' || IMEM !== 0)
                return false;
            let str = String(IDOC);
            setState({ IDOC, IMEM: 1, ODOC: str, INUL, ONUL });
            return true;
        },
        apply: NOT_A_LAMBDA,
    };
})();
const int32 = (() => {
    let result = {
        bindings: {},
        parse: NOT_A_RULE,
        unparse: NOT_A_RULE,
        apply(expr) {
            var _a, _b, _c, _d, _e, _f;
            let base = (_c = (_b = (_a = expr.bindings.base) === null || _a === void 0 ? void 0 : _a.constant) === null || _b === void 0 ? void 0 : _b.value) !== null && _c !== void 0 ? _c : 10;
            let signed = (_f = (_e = (_d = expr.bindings.signed) === null || _d === void 0 ? void 0 : _d.constant) === null || _e === void 0 ? void 0 : _e.value) !== null && _f !== void 0 ? _f : true;
            assert(typeof base === 'number' && base >= 2 && base <= 36);
            assert(typeof signed === 'boolean');
            return {
                bindings: {},
                parse() {
                    let stateₒ = getState();
                    let { IDOC, IMEM, INUL, ONUL } = stateₒ;
                    if (!isString(IDOC))
                        return false;
                    let MAX_NUM = signed ? 0x7FFFFFFF : 0xFFFFFFFF;
                    let isNegative = false;
                    if (signed && IMEM < IDOC.length && IDOC.charAt(IMEM) === '-') {
                        isNegative = true;
                        MAX_NUM = 0x80000000;
                        IMEM += 1;
                    }
                    let num = 0;
                    let digits = 0;
                    while (IMEM < IDOC.length) {
                        let c = IDOC.charCodeAt(IMEM);
                        if (c >= 256)
                            break;
                        let digitValue = DIGIT_VALUES[c];
                        if (digitValue >= base)
                            break;
                        num *= base;
                        num += digitValue;
                        if (num > MAX_NUM)
                            return setState(stateₒ), false;
                        IMEM += 1;
                        digits += 1;
                    }
                    if (digits === 0)
                        return setState(stateₒ), false;
                    if (isNegative)
                        num = -num;
                    setState({ IDOC, IMEM, ODOC: num, INUL, ONUL });
                    return true;
                },
                unparse() {
                    let { IDOC, IMEM, INUL, ONUL } = getState();
                    if (typeof IDOC !== 'number' || IMEM !== 0)
                        return false;
                    let num = IDOC;
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
                    let digits = [];
                    while (true) {
                        let d = num % base;
                        num = (num / base) | 0;
                        digits.push(CHAR_CODES[d]);
                        if (num === 0)
                            break;
                    }
                    if (isNegative)
                        digits.push(0x2d);
                    let str = String.fromCharCode(...digits.reverse());
                    setState({ IDOC, IMEM: 1, ODOC: str, INUL, ONUL });
                    return true;
                },
                apply: NOT_A_LAMBDA,
            };
        },
    };
    result.parse = result.apply({ bindings: {
            base: { constant: { value: 10 } },
            unsigned: { constant: { value: false } },
        } }).parse;
    result.unparse = result.apply({ bindings: {
            base: { constant: { value: 10 } },
            unsigned: { constant: { value: false } },
        } }).unparse;
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
    const CHAR_CODES = [
        0x30, 0x31, 0x32, 0x33, 0x34, 0x35, 0x36, 0x37,
        0x38, 0x39, 0x41, 0x42, 0x43, 0x44, 0x45, 0x46,
        0x47, 0x48, 0x49, 0x4a, 0x4b, 0x4c, 0x4d, 0x4e,
        0x4f, 0x50, 0x51, 0x52, 0x53, 0x54, 0x55, 0x56,
        0x57, 0x58, 0x59, 0x5a,
    ];
    return result;
})();
const memoise = {
    bindings: {},
    parse: NOT_A_RULE,
    unparse: NOT_A_RULE,
    apply(expr) {
        const parseMemos = new Map();
        const unparseMemos = new Map();
        return {
            bindings: {},
            parse() {
                let stateₒ = getState();
                let memos2 = parseMemos.get(stateₒ.IDOC);
                if (memos2 === undefined) {
                    memos2 = new Map();
                    parseMemos.set(stateₒ.IDOC, memos2);
                }
                let memo = memos2.get(stateₒ.IMEM);
                if (!memo) {
                    memo = { resolved: false, isLeftRecursive: false, result: false, stateᐟ: stateₒ };
                    memos2.set(stateₒ.IMEM, memo);
                    if (expr.parse()) {
                        memo.result = true;
                        memo.stateᐟ = getState();
                    }
                    memo.resolved = true;
                    if (!memo.isLeftRecursive) {
                        setState(memo.stateᐟ);
                        return memo.result;
                    }
                    while (memo.result === true) {
                        setState(stateₒ);
                        if (!expr.parse())
                            break;
                        let state = getState();
                        if (state.IMEM <= memo.stateᐟ.IMEM)
                            break;
                        memo.stateᐟ = state;
                    }
                }
                else if (!memo.resolved) {
                    memo.isLeftRecursive = true;
                    return false;
                }
                setState(memo.stateᐟ);
                return memo.result;
            },
            unparse() {
                let stateₒ = getState();
                let memos2 = unparseMemos.get(stateₒ.IDOC);
                if (memos2 === undefined) {
                    memos2 = new Map();
                    unparseMemos.set(stateₒ.IDOC, memos2);
                }
                let memo = memos2.get(stateₒ.IMEM);
                if (!memo) {
                    memo = { resolved: false, isLeftRecursive: false, result: false, stateᐟ: stateₒ };
                    memos2.set(stateₒ.IMEM, memo);
                    if (expr.unparse()) {
                        memo.result = true;
                        memo.stateᐟ = getState();
                    }
                    memo.resolved = true;
                    if (!memo.isLeftRecursive) {
                        setState(memo.stateᐟ);
                        return memo.result;
                    }
                    while (memo.result === true) {
                        setState(stateₒ);
                        if (!expr.parse())
                            break;
                        let state = getState();
                        if (state.IMEM === memo.stateᐟ.IMEM)
                            break;
                        if (!isFullyConsumed(state.IDOC, state.IMEM))
                            break;
                        memo.stateᐟ = state;
                    }
                }
                else if (!memo.resolved) {
                    memo.isLeftRecursive = true;
                    return false;
                }
                setState(memo.stateᐟ);
                return memo.result;
            },
            apply: NOT_A_LAMBDA,
        };
    },
};
const std = {
    bindings: {
        float64,
        int32,
        memoise,
    },
    parse: NOT_A_RULE,
    unparse: NOT_A_RULE,
    apply: NOT_A_LAMBDA,
};
const anyChar = {
    bindings: {},
    parse() {
        let { IDOC, IMEM, INUL, ONUL } = getState();
        let c = '?';
        if (!INUL) {
            if (!isString(IDOC))
                return false;
            if (IMEM < 0 || IMEM >= IDOC.length)
                return false;
            c = IDOC.charAt(IMEM);
            IMEM += 1;
        }
        let ODOC = ONUL ? undefined : c;
        setState({ IDOC, IMEM, ODOC, INUL, ONUL });
        return true;
    },
    unparse() {
        let { IDOC, IMEM, INUL, ONUL } = getState();
        let c = '?';
        if (!INUL) {
            if (!isString(IDOC))
                return false;
            if (IMEM < 0 || IMEM >= IDOC.length)
                return false;
            c = IDOC.charAt(IMEM);
            IMEM += 1;
        }
        let ODOC = ONUL ? undefined : c;
        setState({ IDOC, IMEM, ODOC, INUL, ONUL });
        return true;
    },
    apply: NOT_A_LAMBDA,
};
const epsilon = {
    bindings: {},
    parse() {
        setOutState(undefined);
        return true;
    },
    unparse() {
        setOutState(undefined);
        return true;
    },
    apply: NOT_A_LAMBDA,
};
const maybe = {
    bindings: {},
    parse: NOT_A_RULE,
    unparse: NOT_A_RULE,
    apply(expr) {
        return {
            bindings: {},
            parse() {
                return expr.parse() || epsilon.parse();
            },
            unparse() {
                return expr.unparse() || epsilon.unparse();
            },
            apply: NOT_A_LAMBDA,
        };
    },
};
const not = {
    bindings: {},
    parse: NOT_A_RULE,
    unparse: NOT_A_RULE,
    apply(expr) {
        return {
            bindings: {},
            kind: 'rule',
            parse() {
                let stateₒ = getState();
                if (!expr.parse())
                    return epsilon.parse();
                setState(stateₒ);
                return false;
            },
            unparse() {
                let stateₒ = getState();
                if (!expr.unparse())
                    return epsilon.unparse();
                setState(stateₒ);
                return false;
            },
            apply: NOT_A_LAMBDA,
        };
    },
};
const unicode = {
    bindings: {},
    parse: NOT_A_RULE,
    unparse: NOT_A_RULE,
    apply(expr) {
        var _a, _b, _c, _d, _e, _f;
        let base = (_b = (_a = expr.bindings.base) === null || _a === void 0 ? void 0 : _a.constant) === null || _b === void 0 ? void 0 : _b.value;
        let minDigits = (_d = (_c = expr.bindings.minDigits) === null || _c === void 0 ? void 0 : _c.constant) === null || _d === void 0 ? void 0 : _d.value;
        let maxDigits = (_f = (_e = expr.bindings.maxDigits) === null || _e === void 0 ? void 0 : _e.constant) === null || _f === void 0 ? void 0 : _f.value;
        assert(typeof base === 'number' && base >= 2 && base <= 36);
        assert(typeof minDigits === 'number' && minDigits >= 1 && minDigits <= 8);
        assert(typeof maxDigits === 'number' && maxDigits >= minDigits && maxDigits <= 8);
        return {
            bindings: {},
            parse() {
                let pattern = `[0-${base < 10 ? base - 1 : 9}${base > 10 ? `a-${String.fromCharCode('a'.charCodeAt(0) + base - 11)}` : ''}]`;
                let regex = RegExp(pattern, 'i');
                let { IDOC, IMEM } = getState();
                if (!isString(IDOC))
                    return false;
                const LEN = IDOC.length;
                const EOS = '';
                let len = 0;
                let num = '';
                let c = IMEM < LEN ? IDOC.charAt(IMEM) : EOS;
                while (true) {
                    if (!regex.test(c))
                        break;
                    num += c;
                    IMEM += 1;
                    len += 1;
                    if (len === maxDigits)
                        break;
                    c = IMEM < LEN ? IDOC.charAt(IMEM) : EOS;
                }
                if (len < minDigits)
                    return false;
                setInState(IDOC, IMEM);
                let result = eval(`"\\u{${num}}"`);
                setOutState(result);
                return true;
            },
            unparse: () => {
                return false;
            },
            apply: NOT_A_LAMBDA,
        };
    },
};
const zeroOrMore = {
    bindings: {},
    parse: NOT_A_RULE,
    unparse: NOT_A_RULE,
    apply(expr) {
        return {
            bindings: {},
            parse() {
                let stateₒ = getState();
                let node;
                while (true) {
                    if (!expr.parse())
                        break;
                    let state = getState();
                    if (state.IMEM === stateₒ.IMEM)
                        break;
                    node = concat(node, state.ODOC);
                }
                setOutState(node);
                return true;
            },
            unparse() {
                let stateₒ = getState();
                let text;
                while (true) {
                    if (!expr.unparse())
                        break;
                    let state = getState();
                    if (state.IMEM === stateₒ.IMEM)
                        break;
                    assert(typeof state.ODOC === 'string');
                    text = concat(text, state.ODOC);
                }
                setOutState(text);
                return true;
            },
            apply: NOT_A_LAMBDA,
        };
    },
};
const experiments = {
    bindings: {
        anyChar,
        epsilon,
        maybe,
        not,
        unicode,
        zeroOrMore,
    },
    parse: NOT_A_RULE,
    unparse: NOT_A_RULE,
    apply: NOT_A_LAMBDA,
};

const 𝕊5 = {
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

const 𝕊6 = {
    bindings: {
        base: {},
        minDigits: {},
        maxDigits: {},
    },
};

// -------------------- aliases --------------------
𝕊5.bindings.float64 = std.bindings.float64;
𝕊5.bindings.anyChar = experiments.bindings.anyChar;
𝕊5.bindings.maybe = experiments.bindings.maybe;
𝕊5.bindings.not = experiments.bindings.not;
𝕊5.bindings.zeroOrMore = experiments.bindings.zeroOrMore;
𝕊5.bindings.unicode = experiments.bindings.unicode;
𝕊5.bindings.Number = 𝕊5.bindings.float64;

// -------------------- compile-time constants --------------------
𝕊5.bindings.DOUBLE_QUOTE.constant = {value: "\""};
𝕊6.bindings.base.constant = {value: 16};
𝕊6.bindings.minDigits.constant = {value: 4};
𝕊6.bindings.maxDigits.constant = {value: 4};

// -------------------- json.pen --------------------

Object.assign(
    𝕊5.bindings.start,
    sequence(
        𝕊5.bindings.WS,
        𝕊5.bindings.Value,
        𝕊5.bindings.WS
    )
);

Object.assign(
    𝕊5.bindings.Value,
    selection(
        𝕊5.bindings.False,
        𝕊5.bindings.Null,
        𝕊5.bindings.True,
        𝕊5.bindings.Object,
        𝕊5.bindings.Array,
        𝕊5.bindings.Number,
        𝕊5.bindings.String
    )
);

Object.assign(
    𝕊5.bindings.False,
    sequence(
        concrete(stringLiteral("false")),
        booleanLiteral(false)
    )
);

Object.assign(
    𝕊5.bindings.Null,
    sequence(
        concrete(stringLiteral("null")),
        nullLiteral
    )
);

Object.assign(
    𝕊5.bindings.True,
    sequence(
        concrete(stringLiteral("true")),
        booleanLiteral(true)
    )
);

Object.assign(
    𝕊5.bindings.Object,
    sequence(
        𝕊5.bindings.LBRACE,
        selection(
            𝕊5.bindings.Properties,
            record([
            ])
        ),
        𝕊5.bindings.RBRACE
    )
);

Object.assign(
    𝕊5.bindings.Properties,
    sequence(
        field(
            𝕊5.bindings.String,
            sequence(
                𝕊5.bindings.COLON,
                𝕊5.bindings.Value
            )
        ),
        apply(
            𝕊5.bindings.maybe,
            sequence(
                𝕊5.bindings.COMMA,
                𝕊5.bindings.Properties
            )
        )
    )
);

Object.assign(
    𝕊5.bindings.Array,
    sequence(
        𝕊5.bindings.LBRACKET,
        selection(
            𝕊5.bindings.Elements,
            list([
            ])
        ),
        𝕊5.bindings.RBRACKET
    )
);

Object.assign(
    𝕊5.bindings.Elements,
    sequence(
        list([
            𝕊5.bindings.Value,
        ]),
        apply(
            𝕊5.bindings.maybe,
            sequence(
                𝕊5.bindings.COMMA,
                𝕊5.bindings.Elements
            )
        )
    )
);

Object.assign(
    𝕊5.bindings.String,
    sequence(
        𝕊5.bindings.DOUBLE_QUOTE,
        apply(
            𝕊5.bindings.zeroOrMore,
            𝕊5.bindings.CHAR
        ),
        𝕊5.bindings.DOUBLE_QUOTE
    )
);

Object.assign(
    𝕊5.bindings.CHAR,
    selection(
        sequence(
            apply(
                𝕊5.bindings.not,
                selection(
                    character("\u0000", "\u001f"),
                    stringLiteral("\""),
                    stringLiteral("\\")
                )
            ),
            𝕊5.bindings.anyChar
        ),
        sequence(
            concrete(stringLiteral("\\\"")),
            abstract(stringLiteral("\""))
        ),
        sequence(
            concrete(stringLiteral("\\\\")),
            abstract(stringLiteral("\\"))
        ),
        sequence(
            concrete(stringLiteral("\\/")),
            abstract(stringLiteral("/"))
        ),
        sequence(
            concrete(stringLiteral("\\b")),
            abstract(stringLiteral("\b"))
        ),
        sequence(
            concrete(stringLiteral("\\f")),
            abstract(stringLiteral("\f"))
        ),
        sequence(
            concrete(stringLiteral("\\n")),
            abstract(stringLiteral("\n"))
        ),
        sequence(
            concrete(stringLiteral("\\r")),
            abstract(stringLiteral("\r"))
        ),
        sequence(
            concrete(stringLiteral("\\t")),
            abstract(stringLiteral("\t"))
        ),
        sequence(
            concrete(stringLiteral("\\u")),
            apply(
                𝕊5.bindings.unicode,
                𝕊6
            )
        )
    )
);

Object.assign(
    𝕊5.bindings.LBRACE,
    sequence(
        𝕊5.bindings.WS,
        concrete(stringLiteral("{")),
        𝕊5.bindings.WS
    )
);

Object.assign(
    𝕊5.bindings.RBRACE,
    sequence(
        𝕊5.bindings.WS,
        concrete(stringLiteral("}")),
        𝕊5.bindings.WS
    )
);

Object.assign(
    𝕊5.bindings.LBRACKET,
    sequence(
        𝕊5.bindings.WS,
        concrete(stringLiteral("[")),
        𝕊5.bindings.WS
    )
);

Object.assign(
    𝕊5.bindings.RBRACKET,
    sequence(
        𝕊5.bindings.WS,
        concrete(stringLiteral("]")),
        𝕊5.bindings.WS
    )
);

Object.assign(
    𝕊5.bindings.COLON,
    sequence(
        𝕊5.bindings.WS,
        concrete(stringLiteral(":")),
        𝕊5.bindings.WS
    )
);

Object.assign(
    𝕊5.bindings.COMMA,
    sequence(
        𝕊5.bindings.WS,
        concrete(stringLiteral(",")),
        𝕊5.bindings.WS
    )
);

Object.assign(
    𝕊5.bindings.DOUBLE_QUOTE,
    concrete(stringLiteral("\""))
);

Object.assign(
    𝕊5.bindings.WS,
    apply(
        𝕊5.bindings.zeroOrMore,
        selection(
            concrete(stringLiteral(" ")),
            concrete(stringLiteral("\t")),
            concrete(stringLiteral("\n")),
            concrete(stringLiteral("\r"))
        )
    )
);

Object.assign(
    𝕊6.bindings.base,
    numericLiteral(16)
);

Object.assign(
    𝕊6.bindings.minDigits,
    numericLiteral(4)
);

Object.assign(
    𝕊6.bindings.maxDigits,
    numericLiteral(4)
);

// -------------------- MAIN EXPORTS --------------------

module.exports = createMainExports(𝕊5.bindings.start);