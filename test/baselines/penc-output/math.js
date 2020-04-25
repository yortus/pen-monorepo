const sys = initRuntimeSystem();
const std = initStandardLibrary();
const experiments = initTemporaryExperiments();

const 𝕊8 = {
    bindings: {
        memoise: {},
        float64: {},
        start: {},
        expr: {},
        add: {},
        sub: {},
        term: {},
        mul: {},
        div: {},
        factor: {},
    },
};

// -------------------- aliases --------------------
𝕊8.bindings.memoise = std.bindings.memoise;
𝕊8.bindings.float64 = std.bindings.float64;
𝕊8.bindings.start = 𝕊8.bindings.expr;

// -------------------- V:\projects\oss\penc\test\fixtures\penc-input\math.pen --------------------

Object.assign(
    𝕊8.bindings.expr,
    sys.apply(
        𝕊8.bindings.memoise,
        sys.selection(
            𝕊8.bindings.add,
            𝕊8.bindings.sub,
            𝕊8.bindings.term
        )
    )
);

Object.assign(
    𝕊8.bindings.add,
    sys.record([
        {
            name: 'type',
            value: sys.abstract(sys.stringLiteral("add")),
        },
        {
            name: 'lhs',
            value: 𝕊8.bindings.expr,
        },
        {
            name: 'rhs',
            value: sys.sequence(
                sys.concrete(sys.stringLiteral("+")),
                𝕊8.bindings.term
            ),
        },
    ])
);

Object.assign(
    𝕊8.bindings.sub,
    sys.record([
        {
            name: 'type',
            value: sys.abstract(sys.stringLiteral("sub")),
        },
        {
            name: 'lhs',
            value: 𝕊8.bindings.expr,
        },
        {
            name: 'rhs',
            value: sys.sequence(
                sys.concrete(sys.stringLiteral("-")),
                𝕊8.bindings.term
            ),
        },
    ])
);

Object.assign(
    𝕊8.bindings.term,
    sys.apply(
        𝕊8.bindings.memoise,
        sys.selection(
            𝕊8.bindings.mul,
            𝕊8.bindings.div,
            𝕊8.bindings.factor
        )
    )
);

Object.assign(
    𝕊8.bindings.mul,
    sys.sequence(
        sys.field(
            sys.abstract(sys.stringLiteral("type")),
            sys.abstract(sys.stringLiteral("mul"))
        ),
        sys.record([
            {
                name: 'lhs',
                value: 𝕊8.bindings.term,
            },
        ]),
        sys.field(
            sys.abstract(sys.stringLiteral("rhs")),
            sys.sequence(
                sys.concrete(sys.stringLiteral("*")),
                𝕊8.bindings.factor
            )
        )
    )
);

Object.assign(
    𝕊8.bindings.div,
    sys.record([
        {
            name: 'type',
            value: sys.abstract(sys.stringLiteral("div")),
        },
        {
            name: 'lhs',
            value: 𝕊8.bindings.term,
        },
        {
            name: 'rhs',
            value: sys.sequence(
                sys.concrete(sys.stringLiteral("/")),
                𝕊8.bindings.factor
            ),
        },
    ])
);

Object.assign(
    𝕊8.bindings.factor,
    sys.selection(
        𝕊8.bindings.float64,
        sys.sequence(
            sys.concrete(sys.character("(", "(")),
            𝕊8.bindings.expr,
            sys.concrete(sys.character(")", ")"))
        )
    )
);

// -------------------- MAIN EXPORTS --------------------

module.exports = sys.createMainExports(𝕊8.bindings.start);

// -------------------- RUNTIME SYSTEM --------------------

function initRuntimeSystem() {
    function abstract(expr) {
        return {
            bindings: {},
            parse() {
                let INULₒ = INUL;
                INUL = true;
                let result = expr.parse();
                INUL = INULₒ;
                return result;
            },
            unparse() {
                let ONULₒ = ONUL;
                ONUL = true;
                let result = expr.unparse();
                ONUL = ONULₒ;
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
                let { ONUL } = sys.getState();
                sys.setOutState(ONUL ? undefined : value);
                return true;
            },
            unparse() {
                let { IDOC, IMEM, INUL, ONUL } = sys.getState();
                if (!INUL) {
                    if (IDOC !== value || IMEM !== 0)
                        return false;
                    IMEM = 1;
                }
                sys.setState({ IDOC, IMEM, ODOC: undefined, INUL, ONUL });
                return true;
            },
            apply: NOT_A_LAMBDA,
        };
    }
    function character(min, max) {
        return {
            bindings: {},
            parse() {
                let c = min;
                if (!INUL) {
                    if (!isString(IDOC))
                        return false;
                    if (IMEM < 0 || IMEM >= IDOC.length)
                        return false;
                    c = IDOC.charAt(IMEM);
                    if (c < min || c > max)
                        return false;
                    IMEM += 1;
                }
                ODOC = ONUL ? undefined : c;
                return true;
            },
            unparse() {
                let c = min;
                if (!INUL) {
                    if (!isString(IDOC))
                        return false;
                    if (IMEM < 0 || IMEM >= IDOC.length)
                        return false;
                    c = IDOC.charAt(IMEM);
                    if (c < min || c > max)
                        return false;
                    IMEM += 1;
                }
                ODOC = ONUL ? undefined : c;
                return true;
            },
            apply: NOT_A_LAMBDA,
        };
    }
    function concrete(expr) {
        return {
            bindings: {},
            parse() {
                let ONULₒ = ONUL;
                ONUL = true;
                let result = expr.parse();
                ONUL = ONULₒ;
                return result;
            },
            unparse() {
                let INULₒ = INUL;
                INUL = true;
                let result = expr.unparse();
                INUL = INULₒ;
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
                assert(typeof ODOC === 'string');
                let propName = ODOC;
                if (!value.parse())
                    return setState(stateₒ), false;
                assert(ODOC !== undefined);
                obj[propName] = ODOC;
                ODOC = obj;
                return true;
            },
            unparse() {
                let stateₒ = getState();
                let text;
                if (!isPlainObject(IDOC))
                    return false;
                let propNames = Object.keys(IDOC); // TODO: doc reliance on prop order and what this means
                let propCount = propNames.length;
                assert(propCount <= 32); // TODO: document this limit, move to constant, consider how to remove it
                // TODO: temp testing...
                const obj = IDOC;
                let bitmask = IMEM;
                // Find the first property key/value pair that matches this field name/value pair (if any)
                for (let i = 0; i < propCount; ++i) {
                    let propName = propNames[i];
                    // TODO: skip already-consumed key/value pairs
                    // tslint:disable-next-line: no-bitwise
                    const propBit = 1 << i;
                    // tslint:disable-next-line: no-bitwise
                    if ((bitmask & propBit) !== 0)
                        continue;
                    // TODO: match field name
                    setInState(propName, 0);
                    if (!name.unparse())
                        continue;
                    if (IMEM !== propName.length)
                        continue;
                    text = concat(text, ODOC);
                    // TODO: match field value
                    setInState(obj[propName], 0);
                    if (!value.unparse())
                        continue;
                    if (!isFullyConsumed(obj[propName], IMEM))
                        continue;
                    text = concat(text, ODOC);
                    // TODO: we matched both name and value - consume them from `node`
                    bitmask += propBit;
                    setInState(obj, bitmask);
                    ODOC = text;
                    return true;
                }
                // If we get here, no match...
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
                    assert(ODOC !== undefined);
                    arr.push(ODOC);
                }
                ODOC = arr;
                return true;
            },
            unparse() {
                let stateₒ = getState();
                let text;
                if (!Array.isArray(IDOC))
                    return false;
                if (IMEM < 0 || IMEM + elementsLength > IDOC.length)
                    return false;
                const arr = IDOC;
                const off = IMEM;
                for (let i = 0; i < elementsLength; ++i) {
                    setInState(arr[off + i], 0);
                    if (!elements[i].unparse())
                        return setState(stateₒ), false;
                    if (!isFullyConsumed(IDOC, IMEM))
                        return setState(stateₒ), false;
                    text = concat(text, ODOC);
                }
                setInState(arr, off + elementsLength);
                ODOC = text;
                return true;
            },
            apply: NOT_A_LAMBDA,
        };
    }
    const nullLiteral = {
        bindings: {},
        parse() {
            let { ONUL } = sys.getState();
            sys.setOutState(ONUL ? undefined : null);
            return true;
        },
        unparse() {
            let { IDOC, IMEM, INUL, ONUL } = sys.getState();
            if (!INUL) {
                if (IDOC !== null || IMEM !== 0)
                    return false;
                IMEM = 1;
            }
            sys.setState({ IDOC, IMEM, ODOC: undefined, INUL, ONUL });
            return true;
        },
        apply: NOT_A_LAMBDA,
    };
    function numericLiteral(value) {
        return {
            bindings: {},
            parse() {
                let { ONUL } = sys.getState();
                sys.setOutState(ONUL ? undefined : value);
                return true;
            },
            unparse() {
                let { IDOC, IMEM, INUL, ONUL } = sys.getState();
                if (!INUL) {
                    if (IDOC !== value || IMEM !== 0)
                        return false;
                    IMEM = 1;
                }
                sys.setState({ IDOC, IMEM, ODOC: undefined, INUL, ONUL });
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
                    assert(ODOC !== undefined);
                    obj[propName] = ODOC;
                }
                ODOC = obj;
                return true;
            },
            unparse() {
                let stateₒ = getState();
                let text;
                if (!isPlainObject(IDOC))
                    return false;
                let propNames = Object.keys(IDOC); // TODO: doc reliance on prop order and what this means
                let propCount = propNames.length;
                assert(propCount <= 32); // TODO: document this limit, move to constant, consider how to remove it
                // TODO: temp testing...
                const obj = IDOC;
                let bitmask = IMEM;
                for (let field of fields) {
                    // Find the property key/value pair that matches this field name/value pair (if any)
                    let i = propNames.indexOf(field.name);
                    if (i < 0)
                        return setState(stateₒ), false;
                    let propName = propNames[i];
                    // TODO: skip already-consumed key/value pairs
                    // tslint:disable-next-line: no-bitwise
                    const propBit = 1 << i;
                    // tslint:disable-next-line: no-bitwise
                    if ((bitmask & propBit) !== 0)
                        return setState(stateₒ), false;
                    // TODO: match field value
                    setInState(obj[propName], 0);
                    if (!field.value.unparse())
                        return setState(stateₒ), false;
                    if (!isFullyConsumed(obj[propName], IMEM))
                        return setState(stateₒ), false;
                    text = concat(text, ODOC);
                    // TODO: we matched both name and value - consume them from `node`
                    bitmask += propBit;
                }
                setInState(obj, bitmask);
                ODOC = text;
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
                    node = concat(node, ODOC);
                }
                ODOC = node;
                return true;
            },
            unparse() {
                let stateₒ = getState();
                let text;
                for (let i = 0; i < arity; ++i) {
                    if (!expressions[i].unparse())
                        return setState(stateₒ), false;
                    text = concat(text, ODOC);
                }
                ODOC = text;
                return true;
            },
            apply: NOT_A_LAMBDA,
        };
    }
    function stringLiteral(value) {
        return {
            bindings: {},
            parse() {
                if (!INUL) {
                    if (!isString(IDOC))
                        return false;
                    if (!matchesAt(IDOC, value, IMEM))
                        return false;
                    IMEM += value.length;
                }
                ODOC = ONUL ? undefined : value;
                return true;
            },
            unparse() {
                if (!INUL) {
                    if (!isString(IDOC))
                        return false;
                    if (!matchesAt(IDOC, value, IMEM))
                        return false;
                    IMEM += value.length;
                }
                ODOC = ONUL ? undefined : value;
                return true;
            },
            apply: NOT_A_LAMBDA,
        };
    }
    // TODO: new 'registers'... temp testing...
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
    // TODO: doc... helper...
    function assert(value) {
        if (!value)
            throw new Error(`Assertion failed`);
    }
    // TODO: doc... helper...
    // TODO: provide faster impl for known cases - eg when unparsing to text, don't need array/object handling (but instrument first)
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
    // TODO: doc... helper...
    function isFullyConsumed(node, pos) {
        if (typeof node === 'string')
            return pos === node.length;
        if (Array.isArray(node))
            return pos === node.length;
        if (isPlainObject(node)) {
            let keyCount = Object.keys(node).length;
            assert(keyCount <= 32); // TODO: document this limit, move to constant, consider how to remove it
            if (keyCount === 0)
                return true;
            // tslint:disable-next-line: no-bitwise
            return pos === -1 >>> (32 - keyCount);
        }
        return pos === 1; // TODO: doc which case(s) this covers. Better to just return false?
    }
    // TODO: doc... helper...
    function isPlainObject(value) {
        return value !== null && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype;
    }
    // TODO: doc... helper...
    // TODO: provide faster impl for known cases - eg when checking IDOC during text parsing, or ODOC during text unparsing (but instrument first)
    function isString(value) {
        return typeof value === 'string';
    }
    // TODO: doc... helper...
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
    // TODO: doc... helpers...
    function NOT_A_LAMBDA() { throw new Error('Not a lambda'); }
    ;
    function NOT_A_RULE() { throw new Error('Not a rule'); }
    ;
    // @ts-ignore
    return {
        abstract,
        apply,
        booleanLiteral,
        concrete,
        createMainExports,
        character,
        field,
        list,
        nullLiteral,
        numericLiteral,
        record,
        sequence,
        selection,
        stringLiteral,
        // export helpers too so std can reference them
        assert,
        concat,
        getState,
        isFullyConsumed,
        isPlainObject,
        isString,
        matchesAt,
        NOT_A_LAMBDA,
        NOT_A_RULE,
        setInState,
        setOutState,
        setState,
    };
}


// -------------------- STANDARD LIBRARY --------------------

function initStandardLibrary() {
    // TODO: handle abstract/concrete...
    const float64 = {
        bindings: {},
        parse() {
            let stateₒ = sys.getState();
            let { IDOC, IMEM, INUL, ONUL } = stateₒ;
            if (!sys.isString(IDOC))
                return false;
            const LEN = IDOC.length;
            const EOS = 0;
            let digitCount = 0;
            // Parse optional '+' or '-' sign
            let c = IDOC.charCodeAt(IMEM);
            if (c === PLUS_SIGN || c === MINUS_SIGN) {
                IMEM += 1;
                c = IMEM < LEN ? IDOC.charCodeAt(IMEM) : EOS;
            }
            // Parse 0..M digits
            while (true) {
                if (c < ZERO_DIGIT || c > NINE_DIGIT)
                    break;
                digitCount += 1;
                IMEM += 1;
                c = IMEM < LEN ? IDOC.charCodeAt(IMEM) : EOS;
            }
            // Parse optional '.'
            if (c === DECIMAL_POINT) {
                IMEM += 1;
                c = IMEM < LEN ? IDOC.charCodeAt(IMEM) : EOS;
            }
            // Parse 0..M digits
            while (true) {
                if (c < ZERO_DIGIT || c > NINE_DIGIT)
                    break;
                digitCount += 1;
                IMEM += 1;
                c = IMEM < LEN ? IDOC.charCodeAt(IMEM) : EOS;
            }
            // Ensure we have parsed at least one significant digit
            if (digitCount === 0)
                return false;
            // Parse optional exponent
            if (c === UPPERCASE_E || c === LOWERCASE_E) {
                IMEM += 1;
                c = IMEM < LEN ? IDOC.charCodeAt(IMEM) : EOS;
                // Parse optional '+' or '-' sign
                if (c === PLUS_SIGN || c === MINUS_SIGN) {
                    IMEM += 1;
                    c = IMEM < LEN ? IDOC.charCodeAt(IMEM) : EOS;
                }
                // Parse 1..M digits
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
            // There is a syntactically valid float. Delegate parsing to the JS runtime.
            // Reject the number if it parses to Infinity or Nan.
            // TODO: the conversion may still be lossy. Provide a non-lossy mode, like `safenum` does?
            let num = Number.parseFloat(IDOC.slice(stateₒ.IMEM, IMEM));
            if (!Number.isFinite(num))
                return false;
            // Success
            sys.setState({ IDOC, IMEM, ODOC: num, INUL, ONUL });
            return true;
        },
        unparse() {
            // Ensure N is a number.
            let { IDOC, IMEM, INUL, ONUL } = sys.getState();
            if (typeof IDOC !== 'number' || IMEM !== 0)
                return false;
            // Delegate unparsing to the JS runtime.
            // TODO: the conversion may not exactly match the original string. Add this to the lossiness list.
            let str = String(IDOC);
            sys.setState({ IDOC, IMEM: 1, ODOC: str, INUL, ONUL });
            return true;
        },
        apply: sys.NOT_A_LAMBDA,
    };
    // These constants are used by the float64 rule.
    const PLUS_SIGN = '+'.charCodeAt(0);
    const MINUS_SIGN = '-'.charCodeAt(0);
    const DECIMAL_POINT = '.'.charCodeAt(0);
    const ZERO_DIGIT = '0'.charCodeAt(0);
    const NINE_DIGIT = '9'.charCodeAt(0);
    const LOWERCASE_E = 'e'.charCodeAt(0);
    const UPPERCASE_E = 'E'.charCodeAt(0);
    // TODO: handle abstract/concrete...
    const int32 = {
        bindings: {},
        parse() {
            let stateₒ = sys.getState();
            let { IDOC, IMEM, INUL, ONUL } = stateₒ;
            if (!sys.isString(IDOC))
                return false;
            // Parse optional leading '-' sign...
            let isNegative = false;
            if (IMEM < IDOC.length && IDOC.charAt(IMEM) === '-') {
                isNegative = true;
                IMEM += 1;
            }
            // ...followed by one or more decimal digits. (NB: no exponents).
            let num = 0;
            let digits = 0;
            while (IMEM < IDOC.length) {
                // Read a digit
                let c = IDOC.charCodeAt(IMEM);
                if (c < UNICODE_ZERO_DIGIT || c > UNICODE_ZERO_DIGIT + 9)
                    break;
                // Check for overflow
                if (num > ONE_TENTH_MAXINT32)
                    return sys.setState(stateₒ), false;
                // Update parsed number
                num *= 10;
                num += (c - UNICODE_ZERO_DIGIT);
                IMEM += 1;
                digits += 1;
            }
            // Check that we parsed at least one digit.
            if (digits === 0)
                return sys.setState(stateₒ), false;
            // Apply the sign.
            if (isNegative)
                num = -num;
            // Check for over/under-flow. This *is* needed to catch -2147483649, 2147483648 and 2147483649.
            // tslint:disable-next-line: no-bitwise
            if (isNegative ? (num & 0xFFFFFFFF) >= 0 : (num & 0xFFFFFFFF) < 0)
                return sys.setState(stateₒ), false;
            // Success
            sys.setState({ IDOC, IMEM, ODOC: num, INUL, ONUL });
            return true;
        },
        unparse() {
            // TODO: ensure N is a 32-bit integer
            let { IDOC, IMEM, INUL, ONUL } = sys.getState();
            if (typeof IDOC !== 'number' || IMEM !== 0)
                return false;
            let num = IDOC;
            // tslint:disable-next-line: no-bitwise
            if ((num & 0xFFFFFFFF) !== num)
                return false;
            // TODO: check sign...
            let isNegative = false;
            if (num < 0) {
                isNegative = true;
                if (num === -2147483648) {
                    // Specially handle the one case where N = -N could overflow
                    sys.setState({ IDOC, IMEM: 1, ODOC: '-2147483648', INUL, ONUL });
                    return true;
                }
                num = -num;
            }
            // TODO: ...then digits
            let digits = [];
            while (true) {
                let d = num % 10;
                // tslint:disable-next-line: no-bitwise
                num = (num / 10) | 0;
                digits.push(String.fromCharCode(UNICODE_ZERO_DIGIT + d));
                if (num === 0)
                    break;
            }
            // TODO: compute final string...
            if (isNegative)
                digits.push('-');
            sys.setState({ IDOC, IMEM: 1, ODOC: digits.reverse().join(''), INUL, ONUL });
            return true;
        },
        apply: sys.NOT_A_LAMBDA,
    };
    // These constants are used by the int32 rule.
    const UNICODE_ZERO_DIGIT = '0'.charCodeAt(0);
    const ONE_TENTH_MAXINT32 = 0x7FFFFFFF / 10;
    // TODO: temp testing...
    // use this for bases between 2-36. Get the charCode, ensure < 256, look up DIGIT_VALUES[code], ensure < BASE
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
    const memoise = {
        bindings: {},
        parse: sys.NOT_A_RULE,
        unparse: sys.NOT_A_RULE,
        apply(expr) {
            // TODO: investigate... need to use `text` as part of memo key? Study lifecycle/extent of each `memos` instance.
            const parseMemos = new Map();
            // TODO: revise memo key once using new ast/pos signature
            const unparseMemos = new Map();
            return {
                bindings: {},
                parse() {
                    // Check whether the memo table already has an entry for the given initial state.
                    let stateₒ = sys.getState();
                    let memos2 = parseMemos.get(stateₒ.IDOC);
                    if (memos2 === undefined) {
                        memos2 = new Map();
                        parseMemos.set(stateₒ.IDOC, memos2);
                    }
                    let memo = memos2.get(stateₒ.IMEM);
                    if (!memo) {
                        // The memo table does *not* have an entry, so this is the first attempt to apply this rule with
                        // this initial state. The first thing we do is create a memo table entry, which is marked as
                        // *unresolved*. All future applications of this rule with the same initial state will find this
                        // memo. If a future application finds the memo still unresolved, then we know we have encountered
                        // left-recursion.
                        memo = { resolved: false, isLeftRecursive: false, result: false, stateᐟ: stateₒ };
                        memos2.set(stateₒ.IMEM, memo);
                        // Now that the unresolved memo is in place, apply the rule, and resolve the memo with the result.
                        // At this point, any left-recursive paths encountered during application are guaranteed to have
                        // been noted and aborted (see below).
                        if (expr.parse()) {
                            memo.result = true;
                            memo.stateᐟ = sys.getState();
                        }
                        memo.resolved = true;
                        // If we did *not* encounter left-recursion, then we have simple memoisation, and the result is
                        // final.
                        if (!memo.isLeftRecursive) {
                            setState(memo.stateᐟ);
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
                            sys.setState(stateₒ);
                            if (!expr.parse())
                                break;
                            let state = sys.getState();
                            if (state.IMEM <= memo.stateᐟ.IMEM)
                                break;
                            memo.stateᐟ = state;
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
                    sys.setState(memo.stateᐟ);
                    return memo.result;
                },
                unparse() {
                    // Check whether the memo table already has an entry for the given initial state.
                    let stateₒ = sys.getState();
                    let memos2 = unparseMemos.get(stateₒ.IDOC);
                    if (memos2 === undefined) {
                        memos2 = new Map();
                        unparseMemos.set(stateₒ.IDOC, memos2);
                    }
                    let memo = memos2.get(stateₒ.IMEM);
                    if (!memo) {
                        // The memo table does *not* have an entry, so this is the first attempt to apply this rule with
                        // this initial state. The first thing we do is create a memo table entry, which is marked as
                        // *unresolved*. All future applications of this rule with the same initial state will find this
                        // memo. If a future application finds the memo still unresolved, then we know we have encountered
                        // left-recursion.
                        memo = { resolved: false, isLeftRecursive: false, result: false, stateᐟ: stateₒ };
                        memos2.set(stateₒ.IMEM, memo);
                        // Now that the unresolved memo is in place, apply the rule, and resolve the memo with the result.
                        // At this point, any left-recursive paths encountered during application are guaranteed to have
                        // been noted and aborted (see below).
                        if (expr.unparse()) {
                            memo.result = true;
                            memo.stateᐟ = sys.getState();
                        }
                        memo.resolved = true;
                        // If we did *not* encounter left-recursion, then we have simple memoisation, and the result is
                        // final.
                        if (!memo.isLeftRecursive) {
                            sys.setState(memo.stateᐟ);
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
                            sys.setState(stateₒ);
                            // TODO: break cases:
                            // anything --> same thing (covers all string cases, since they can only be same or shorter)
                            // some node --> some different non-empty node (assert: should never happen!)
                            if (!expr.parse())
                                break;
                            let state = sys.getState();
                            if (state.IMEM === memo.stateᐟ.IMEM)
                                break;
                            if (!sys.isFullyConsumed(state.IDOC, state.IMEM))
                                break;
                            memo.stateᐟ = state;
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
                    sys.setState(memo.stateᐟ);
                    return memo.result;
                },
                apply: sys.NOT_A_LAMBDA,
            };
        },
    };
    // @ts-ignore
    return {
        bindings: {
            float64,
            int32,
            memoise,
        },
        parse: sys.NOT_A_RULE,
        unparse: sys.NOT_A_RULE,
        apply: sys.NOT_A_LAMBDA,
    };
}


// -------------------- TEMPORARY EXPERIMENTS --------------------

function initTemporaryExperiments() {
    const anyChar = {
        bindings: {},
        parse() {
            let { IDOC, IMEM, INUL, ONUL } = sys.getState();
            let c = '?';
            if (!INUL) {
                if (!sys.isString(IDOC))
                    return false;
                if (IMEM < 0 || IMEM >= IDOC.length)
                    return false;
                c = IDOC.charAt(IMEM);
                IMEM += 1;
            }
            let ODOC = ONUL ? undefined : c;
            sys.setState({ IDOC, IMEM, ODOC, INUL, ONUL });
            return true;
        },
        unparse() {
            let { IDOC, IMEM, INUL, ONUL } = sys.getState();
            let c = '?';
            if (!INUL) {
                if (!sys.isString(IDOC))
                    return false;
                if (IMEM < 0 || IMEM >= IDOC.length)
                    return false;
                c = IDOC.charAt(IMEM);
                IMEM += 1;
            }
            let ODOC = ONUL ? undefined : c;
            sys.setState({ IDOC, IMEM, ODOC, INUL, ONUL });
            return true;
        },
        apply: sys.NOT_A_LAMBDA,
    };
    const epsilon = {
        bindings: {},
        parse() {
            sys.setOutState(undefined);
            return true;
        },
        unparse() {
            sys.setOutState(undefined);
            return true;
        },
        apply: sys.NOT_A_LAMBDA,
    };
    const maybe = {
        bindings: {},
        parse: sys.NOT_A_RULE,
        unparse: sys.NOT_A_RULE,
        apply(expr) {
            return {
                bindings: {},
                parse() {
                    return expr.parse() || epsilon.parse();
                },
                unparse() {
                    return expr.unparse() || epsilon.unparse();
                },
                apply: sys.NOT_A_LAMBDA,
            };
        },
    };
    const not = {
        bindings: {},
        parse: sys.NOT_A_RULE,
        unparse: sys.NOT_A_RULE,
        apply(expr) {
            return {
                bindings: {},
                kind: 'rule',
                parse() {
                    let stateₒ = sys.getState();
                    if (!expr.parse())
                        return epsilon.parse();
                    sys.setState(stateₒ);
                    return false;
                },
                unparse() {
                    let stateₒ = sys.getState();
                    if (!expr.unparse())
                        return epsilon.unparse();
                    sys.setState(stateₒ);
                    return false;
                },
                apply: sys.NOT_A_LAMBDA,
            };
        },
    };
    const unicode = {
        bindings: {},
        parse: sys.NOT_A_RULE,
        unparse: sys.NOT_A_RULE,
        apply(expr) {
            // TODO: base, minDigits, maxDigits may not be defined yet. Is this fine, or a bug?
            return {
                bindings: {},
                parse() {
                    // TODO: move resolution of base/minDigits/maxDigits out of here, inefficient to repeat this work
                    // on every parse/unparse call. It's here for now due to the above TODO (may not be defined when the
                    // unicode() function is first called).
                    sys.assert(expr.bindings);
                    // TODO: temp testing...
                    let { base, minDigits, maxDigits } = { base: 16, minDigits: 4, maxDigits: 4 };
                    // TODO: was... let {base, minDigits, maxDigits} = expr.bindings;
                    sys.assert(typeof base === 'number' && base >= 2 && base <= 36);
                    sys.assert(typeof minDigits === 'number' && minDigits >= 1 && minDigits <= 8);
                    sys.assert(typeof maxDigits === 'number' && maxDigits >= minDigits && maxDigits <= 8);
                    // Construct a regex to match the digits
                    let pattern = `[0-${base < 10 ? base - 1 : 9}${base > 10 ? `a-${String.fromCharCode('a'.charCodeAt(0) + base - 11)}` : ''}]`;
                    let regex = RegExp(pattern, 'i');
                    let { IDOC, IMEM } = sys.getState();
                    if (!sys.isString(IDOC))
                        return false;
                    const LEN = IDOC.length;
                    const EOS = '';
                    let len = 0;
                    let num = ''; // TODO: fix this - should actually keep count
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
                    sys.setInState(IDOC, IMEM);
                    let result = eval(`"\\u{${num}}"`); // TODO: hacky... fix when we have a charCode
                    sys.setOutState(result);
                    return true;
                },
                unparse: () => {
                    // TODO: implement
                    return false;
                },
                apply: sys.NOT_A_LAMBDA,
            };
        },
    };
    const zeroOrMore = {
        bindings: {},
        parse: sys.NOT_A_RULE,
        unparse: sys.NOT_A_RULE,
        apply(expr) {
            return {
                bindings: {},
                parse() {
                    let stateₒ = sys.getState();
                    let node;
                    while (true) {
                        if (!expr.parse())
                            break;
                        // TODO: check if any input was consumed...
                        // if not, stop iterating, since otherwise we may loop forever
                        let state = sys.getState();
                        if (state.IMEM === stateₒ.IMEM)
                            break;
                        node = sys.concat(node, state.ODOC);
                    }
                    sys.setOutState(node);
                    return true;
                },
                unparse() {
                    let stateₒ = sys.getState();
                    let text;
                    while (true) {
                        if (!expr.unparse())
                            break;
                        // TODO: check if any input was consumed...
                        // if not, stop iterating, since otherwise we may loop forever
                        // TODO: any other checks needed? review...
                        let state = sys.getState();
                        if (state.IMEM === stateₒ.IMEM)
                            break;
                        // TODO: support more formats / blob types here, like for parse...
                        sys.assert(typeof state.ODOC === 'string'); // just for now... remove after addressing above TODO
                        text = sys.concat(text, state.ODOC);
                    }
                    sys.setOutState(text);
                    return true;
                },
                apply: sys.NOT_A_LAMBDA,
            };
        },
    };
    // @ts-ignore
    return {
        bindings: {
            anyChar,
            epsilon,
            maybe,
            not,
            unicode,
            zeroOrMore,
        },
        parse: sys.NOT_A_RULE,
        unparse: sys.NOT_A_RULE,
        apply: sys.NOT_A_LAMBDA,
    };
}
