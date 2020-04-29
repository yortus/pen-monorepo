const sys = initRuntimeSystem();
const std = initStandardLibrary();
const experiments = initTemporaryExperiments();

const 𝕊8 = {
    bindings: {
        memoise: {},
        float64: {},
        int32: {},
        not: {},
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

const 𝕊9 = {
    bindings: {
        base: {},
        signed: {},
    },
};

const 𝕊10 = {
    bindings: {
        base: {},
        signed: {},
    },
};

const 𝕊11 = {
    bindings: {
        signed: {},
    },
};

// -------------------- aliases --------------------
𝕊8.bindings.memoise = std.bindings.memoise;
𝕊8.bindings.float64 = std.bindings.float64;
𝕊8.bindings.int32 = std.bindings.int32;
𝕊8.bindings.not = experiments.bindings.not;
𝕊8.bindings.start = 𝕊8.bindings.expr;

// -------------------- compile-time constants --------------------
𝕊9.bindings.base.constant = {value: 16};
𝕊9.bindings.signed.constant = {value: false};
𝕊10.bindings.base.constant = {value: 2};
𝕊10.bindings.signed.constant = {value: false};
𝕊11.bindings.signed.constant = {value: false};

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
        sys.sequence(
            sys.apply(
                𝕊8.bindings.not,
                sys.selection(
                    sys.stringLiteral("0x"),
                    sys.stringLiteral("0b")
                )
            ),
            𝕊8.bindings.float64
        ),
        sys.sequence(
            sys.concrete(sys.stringLiteral("0x")),
            sys.apply(
                𝕊8.bindings.int32,
                𝕊9
            )
        ),
        sys.sequence(
            sys.concrete(sys.stringLiteral("0b")),
            sys.apply(
                𝕊8.bindings.int32,
                𝕊10
            )
        ),
        sys.sequence(
            sys.concrete(sys.stringLiteral("i")),
            sys.apply(
                𝕊8.bindings.int32,
                𝕊11
            )
        ),
        sys.sequence(
            sys.concrete(sys.stringLiteral("(")),
            𝕊8.bindings.expr,
            sys.concrete(sys.stringLiteral(")"))
        )
    )
);

Object.assign(
    𝕊9.bindings.base,
    sys.numericLiteral(16)
);

Object.assign(
    𝕊9.bindings.signed,
    sys.booleanLiteral(false)
);

Object.assign(
    𝕊10.bindings.base,
    sys.numericLiteral(2)
);

Object.assign(
    𝕊10.bindings.signed,
    sys.booleanLiteral(false)
);

Object.assign(
    𝕊11.bindings.signed,
    sys.booleanLiteral(false)
);

// -------------------- MAIN EXPORTS --------------------

module.exports = sys.createMainExports(𝕊8.bindings.start);

// -------------------- RUNTIME SYSTEM --------------------

function initRuntimeSystem() {
    var sys;
    (function (sys) {
        function abstract(expr) {
            return {
                bindings: {},
                parse() {
                    let state = sys.getState();
                    let INULₒ = state.INUL;
                    state.INUL = true;
                    sys.setState(state);
                    let result = expr.parse();
                    state = sys.getState();
                    state.INUL = INULₒ;
                    sys.setState(state);
                    return result;
                },
                unparse() {
                    let state = sys.getState();
                    let ONULₒ = state.ONUL;
                    state.ONUL = true;
                    sys.setState(state);
                    let result = expr.unparse();
                    state = sys.getState();
                    state.ONUL = ONULₒ;
                    sys.setState(state);
                    return result;
                },
                apply: sys.NOT_A_LAMBDA,
            };
        }
        sys.abstract = abstract;
    })(sys || (sys = {}));
    var sys;
    (function (sys) {
        function apply(lambda, arg) {
            return lambda.apply(arg);
        }
        sys.apply = apply;
    })(sys || (sys = {}));
    var sys;
    (function (sys) {
        function booleanLiteral(value) {
            return {
                bindings: {},
                parse() {
                    let { ONUL } = sys.getState();
                    sys.setOutState(ONUL ? undefined : value);
                    return true;
                },
                unparse() {
                    let { IDOC, IMEM, INUL } = sys.getState();
                    if (!INUL) {
                        if (IDOC !== value || IMEM !== 0)
                            return false;
                        sys.setInState(IDOC, 1);
                    }
                    sys.setOutState(undefined);
                    return true;
                },
                apply: sys.NOT_A_LAMBDA,
            };
        }
        sys.booleanLiteral = booleanLiteral;
    })(sys || (sys = {}));
    var sys;
    (function (sys) {
        function character(min, max) {
            return {
                bindings: {},
                parse() {
                    let { IDOC, IMEM, INUL, ONUL } = sys.getState();
                    let c = min;
                    if (!INUL) {
                        if (!sys.isString(IDOC))
                            return false;
                        if (IMEM < 0 || IMEM >= IDOC.length)
                            return false;
                        c = IDOC.charAt(IMEM);
                        if (c < min || c > max)
                            return false;
                        sys.setInState(IDOC, IMEM + 1);
                    }
                    sys.setOutState(ONUL ? undefined : c);
                    return true;
                },
                unparse() {
                    let { IDOC, IMEM, INUL, ONUL } = sys.getState();
                    let c = min;
                    if (!INUL) {
                        if (!sys.isString(IDOC))
                            return false;
                        if (IMEM < 0 || IMEM >= IDOC.length)
                            return false;
                        c = IDOC.charAt(IMEM);
                        if (c < min || c > max)
                            return false;
                        sys.setInState(IDOC, IMEM + 1);
                    }
                    sys.setOutState(ONUL ? undefined : c);
                    return true;
                },
                apply: sys.NOT_A_LAMBDA,
            };
        }
        sys.character = character;
    })(sys || (sys = {}));
    var sys;
    (function (sys) {
        function concrete(expr) {
            return {
                bindings: {},
                parse() {
                    let state = sys.getState();
                    let ONULₒ = state.ONUL;
                    state.ONUL = true;
                    sys.setState(state);
                    let result = expr.parse();
                    state = sys.getState();
                    state.ONUL = ONULₒ;
                    sys.setState(state);
                    return result;
                },
                unparse() {
                    let state = sys.getState();
                    let INULₒ = state.INUL;
                    state.INUL = true;
                    sys.setState(state);
                    let result = expr.unparse();
                    state = sys.getState();
                    state.INUL = INULₒ;
                    sys.setState(state);
                    return result;
                },
                apply: sys.NOT_A_LAMBDA,
            };
        }
        sys.concrete = concrete;
    })(sys || (sys = {}));
    var sys;
    (function (sys) {
        function createMainExports(start) {
            return {
                parse: (text) => {
                    sys.setInState(text, 0);
                    if (!start.parse())
                        throw new Error('parse failed');
                    let { IDOC, IMEM, ODOC } = sys.getState();
                    if (!sys.isFullyConsumed(IDOC, IMEM))
                        throw new Error(`parse didn't consume entire input`);
                    if (ODOC === undefined)
                        throw new Error(`parse didn't return a value`);
                    return ODOC;
                },
                unparse: (node) => {
                    sys.setInState(node, 0);
                    if (!start.unparse())
                        throw new Error('parse failed');
                    let { IDOC, IMEM, ODOC } = sys.getState();
                    if (!sys.isFullyConsumed(IDOC, IMEM))
                        throw new Error(`unparse didn't consume entire input`);
                    if (ODOC === undefined)
                        throw new Error(`parse didn't return a value`);
                    return ODOC;
                },
            };
        }
        sys.createMainExports = createMainExports;
    })(sys || (sys = {}));
    var sys;
    (function (sys) {
        function field(name, value) {
            return {
                bindings: {},
                parse() {
                    let stateₒ = sys.getState();
                    let obj = {};
                    if (!name.parse())
                        return sys.setState(stateₒ), false;
                    let { ODOC } = sys.getState();
                    sys.assert(typeof ODOC === 'string');
                    let propName = ODOC;
                    if (!value.parse())
                        return sys.setState(stateₒ), false;
                    ({ ODOC } = sys.getState());
                    sys.assert(ODOC !== undefined);
                    obj[propName] = ODOC;
                    sys.setOutState(obj);
                    return true;
                },
                unparse() {
                    let stateₒ = sys.getState();
                    let text;
                    if (!sys.isPlainObject(stateₒ.IDOC))
                        return false;
                    let propNames = Object.keys(stateₒ.IDOC);
                    let propCount = propNames.length;
                    sys.assert(propCount <= 32);
                    const obj = stateₒ.IDOC;
                    let bitmask = stateₒ.IMEM;
                    for (let i = 0; i < propCount; ++i) {
                        let propName = propNames[i];
                        const propBit = 1 << i;
                        if ((bitmask & propBit) !== 0)
                            continue;
                        sys.setInState(propName, 0);
                        if (!name.unparse())
                            continue;
                        let { IMEM, ODOC } = sys.getState();
                        if (IMEM !== propName.length)
                            continue;
                        text = sys.concat(text, ODOC);
                        sys.setInState(obj[propName], 0);
                        if (!value.unparse())
                            continue;
                        ({ IMEM, ODOC } = sys.getState());
                        if (!sys.isFullyConsumed(obj[propName], IMEM))
                            continue;
                        text = sys.concat(text, ODOC);
                        bitmask += propBit;
                        sys.setInState(obj, bitmask);
                        sys.setOutState(text);
                        return true;
                    }
                    sys.setState(stateₒ);
                    return false;
                },
                apply: sys.NOT_A_LAMBDA,
            };
        }
        sys.field = field;
    })(sys || (sys = {}));
    var sys;
    (function (sys) {
        function list(elements) {
            const elementsLength = elements.length;
            return {
                bindings: {},
                parse() {
                    let stateₒ = sys.getState();
                    let arr = [];
                    for (let i = 0; i < elementsLength; ++i) {
                        if (!elements[i].parse())
                            return sys.setState(stateₒ), false;
                        let { ODOC } = sys.getState();
                        sys.assert(ODOC !== undefined);
                        arr.push(ODOC);
                    }
                    sys.setOutState(arr);
                    return true;
                },
                unparse() {
                    let stateₒ = sys.getState();
                    let text;
                    if (!Array.isArray(stateₒ.IDOC))
                        return false;
                    if (stateₒ.IMEM < 0 || stateₒ.IMEM + elementsLength > stateₒ.IDOC.length)
                        return false;
                    const arr = stateₒ.IDOC;
                    const off = stateₒ.IMEM;
                    for (let i = 0; i < elementsLength; ++i) {
                        sys.setInState(arr[off + i], 0);
                        if (!elements[i].unparse())
                            return sys.setState(stateₒ), false;
                        let { IDOC, IMEM, ODOC } = sys.getState();
                        if (!sys.isFullyConsumed(IDOC, IMEM))
                            return sys.setState(stateₒ), false;
                        text = sys.concat(text, ODOC);
                    }
                    sys.setInState(arr, off + elementsLength);
                    sys.setOutState(text);
                    return true;
                },
                apply: sys.NOT_A_LAMBDA,
            };
        }
        sys.list = list;
    })(sys || (sys = {}));
    var sys;
    (function (sys) {
        sys.nullLiteral = {
            bindings: {},
            parse() {
                let { ONUL } = sys.getState();
                sys.setOutState(ONUL ? undefined : null);
                return true;
            },
            unparse() {
                let { IDOC, IMEM, INUL } = sys.getState();
                if (!INUL) {
                    if (IDOC !== null || IMEM !== 0)
                        return false;
                    sys.setInState(IDOC, 1);
                }
                sys.setOutState(undefined);
                return true;
            },
            apply: sys.NOT_A_LAMBDA,
        };
    })(sys || (sys = {}));
    var sys;
    (function (sys) {
        function numericLiteral(value) {
            return {
                bindings: {},
                parse() {
                    let { ONUL } = sys.getState();
                    sys.setOutState(ONUL ? undefined : value);
                    return true;
                },
                unparse() {
                    let { IDOC, IMEM, INUL } = sys.getState();
                    if (!INUL) {
                        if (IDOC !== value || IMEM !== 0)
                            return false;
                        sys.setInState(IDOC, 1);
                    }
                    sys.setOutState(undefined);
                    return true;
                },
                apply: sys.NOT_A_LAMBDA,
            };
        }
        sys.numericLiteral = numericLiteral;
    })(sys || (sys = {}));
    var sys;
    (function (sys) {
        function record(fields) {
            return {
                bindings: {},
                parse() {
                    let stateₒ = sys.getState();
                    let obj = {};
                    for (let field of fields) {
                        let propName = field.name;
                        if (!field.value.parse())
                            return sys.setState(stateₒ), false;
                        let { ODOC } = sys.getState();
                        sys.assert(ODOC !== undefined);
                        obj[propName] = ODOC;
                    }
                    sys.setOutState(obj);
                    return true;
                },
                unparse() {
                    let stateₒ = sys.getState();
                    let text;
                    if (!sys.isPlainObject(stateₒ.IDOC))
                        return false;
                    let propNames = Object.keys(stateₒ.IDOC);
                    let propCount = propNames.length;
                    sys.assert(propCount <= 32);
                    const obj = stateₒ.IDOC;
                    let bitmask = stateₒ.IMEM;
                    for (let field of fields) {
                        let i = propNames.indexOf(field.name);
                        if (i < 0)
                            return sys.setState(stateₒ), false;
                        let propName = propNames[i];
                        const propBit = 1 << i;
                        if ((bitmask & propBit) !== 0)
                            return sys.setState(stateₒ), false;
                        sys.setInState(obj[propName], 0);
                        if (!field.value.unparse())
                            return sys.setState(stateₒ), false;
                        let { IMEM, ODOC } = sys.getState();
                        if (!sys.isFullyConsumed(obj[propName], IMEM))
                            return sys.setState(stateₒ), false;
                        text = sys.concat(text, ODOC);
                        bitmask += propBit;
                    }
                    sys.setInState(obj, bitmask);
                    sys.setOutState(text);
                    return true;
                },
                apply: sys.NOT_A_LAMBDA,
            };
        }
        sys.record = record;
    })(sys || (sys = {}));
    var sys;
    (function (sys) {
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
                apply: sys.NOT_A_LAMBDA,
            };
        }
        sys.selection = selection;
    })(sys || (sys = {}));
    var sys;
    (function (sys) {
        function sequence(...expressions) {
            const arity = expressions.length;
            return {
                bindings: {},
                parse() {
                    let stateₒ = sys.getState();
                    let node;
                    for (let i = 0; i < arity; ++i) {
                        if (!expressions[i].parse())
                            return sys.setState(stateₒ), false;
                        let { ODOC } = sys.getState();
                        node = sys.concat(node, ODOC);
                    }
                    sys.setOutState(node);
                    return true;
                },
                unparse() {
                    let stateₒ = sys.getState();
                    let text;
                    for (let i = 0; i < arity; ++i) {
                        if (!expressions[i].unparse())
                            return sys.setState(stateₒ), false;
                        let { ODOC } = sys.getState();
                        text = sys.concat(text, ODOC);
                    }
                    sys.setOutState(text);
                    return true;
                },
                apply: sys.NOT_A_LAMBDA,
            };
        }
        sys.sequence = sequence;
    })(sys || (sys = {}));
    var sys;
    (function (sys) {
        function stringLiteral(value) {
            return {
                bindings: {},
                parse() {
                    let { IDOC, IMEM, INUL, ONUL } = sys.getState();
                    if (!INUL) {
                        if (!sys.isString(IDOC))
                            return false;
                        if (!sys.matchesAt(IDOC, value, IMEM))
                            return false;
                        sys.setInState(IDOC, IMEM + value.length);
                    }
                    sys.setOutState(ONUL ? undefined : value);
                    return true;
                },
                unparse() {
                    let { IDOC, IMEM, INUL, ONUL } = sys.getState();
                    if (!INUL) {
                        if (!sys.isString(IDOC))
                            return false;
                        if (!sys.matchesAt(IDOC, value, IMEM))
                            return false;
                        sys.setInState(IDOC, IMEM + value.length);
                    }
                    sys.setOutState(ONUL ? undefined : value);
                    return true;
                },
                apply: sys.NOT_A_LAMBDA,
            };
        }
        sys.stringLiteral = stringLiteral;
    })(sys || (sys = {}));
    var sys;
    (function (sys) {
        let IDOC;
        let IMEM;
        let ODOC;
        let INUL = false;
        let ONUL = false;
        function getState() {
            return { IDOC, IMEM, ODOC, INUL, ONUL };
        }
        sys.getState = getState;
        function setState(value) {
            ({ IDOC, IMEM, ODOC, INUL, ONUL } = value);
        }
        sys.setState = setState;
        function setInState(IDOCᐟ, IMEMᐟ) {
            IDOC = IDOCᐟ;
            IMEM = IMEMᐟ;
        }
        sys.setInState = setInState;
        function setOutState(ODOCᐟ) {
            ODOC = ODOCᐟ;
        }
        sys.setOutState = setOutState;
        function assert(value) {
            if (!value)
                throw new Error(`Assertion failed`);
        }
        sys.assert = assert;
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
        sys.concat = concat;
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
        sys.isFullyConsumed = isFullyConsumed;
        function isPlainObject(value) {
            return value !== null && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype;
        }
        sys.isPlainObject = isPlainObject;
        function isString(value) {
            return typeof value === 'string';
        }
        sys.isString = isString;
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
        sys.matchesAt = matchesAt;
        function NOT_A_LAMBDA() { throw new Error('Not a lambda'); }
        sys.NOT_A_LAMBDA = NOT_A_LAMBDA;
        ;
        function NOT_A_RULE() { throw new Error('Not a rule'); }
        sys.NOT_A_RULE = NOT_A_RULE;
        ;
    })(sys || (sys = {}));
    return sys;
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
    // tslint:disable: no-bitwise
    const int32 = {
        bindings: {},
        parse: sys.NOT_A_RULE,
        unparse: sys.NOT_A_RULE,
        // TODO: temp testing... the lambda form which takes a `base` arg
        apply(expr) {
            var _a, _b, _c, _d, _e, _f;
            let base = (_c = (_b = (_a = expr.bindings.base) === null || _a === void 0 ? void 0 : _a.constant) === null || _b === void 0 ? void 0 : _b.value) !== null && _c !== void 0 ? _c : 10;
            let signed = (_f = (_e = (_d = expr.bindings.signed) === null || _d === void 0 ? void 0 : _d.constant) === null || _e === void 0 ? void 0 : _e.value) !== null && _f !== void 0 ? _f : true;
            sys.assert(typeof base === 'number' && base >= 2 && base <= 36);
            sys.assert(typeof signed === 'boolean');
            return {
                bindings: {},
                parse() {
                    let stateₒ = sys.getState();
                    let { IDOC, IMEM, INUL, ONUL } = stateₒ;
                    if (!sys.isString(IDOC))
                        return false;
                    // Parse optional leading '-' sign (if signed)...
                    let MAX_NUM = signed ? 0x7FFFFFFF : 0xFFFFFFFF;
                    let isNegative = false;
                    if (signed && IMEM < IDOC.length && IDOC.charAt(IMEM) === '-') {
                        isNegative = true;
                        MAX_NUM = 0x80000000;
                        IMEM += 1;
                    }
                    // ...followed by one or more decimal digits. (NB: no exponents).
                    let num = 0;
                    let digits = 0;
                    while (IMEM < IDOC.length) {
                        // Read a digit.
                        let c = IDOC.charCodeAt(IMEM);
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
                            return sys.setState(stateₒ), false;
                        // Loop again.
                        IMEM += 1;
                        digits += 1;
                    }
                    // Check that we parsed at least one digit.
                    if (digits === 0)
                        return sys.setState(stateₒ), false;
                    // Apply the sign.
                    if (isNegative)
                        num = -num;
                    // Success
                    sys.setState({ IDOC, IMEM, ODOC: num, INUL, ONUL });
                    return true;
                },
                unparse() {
                    let { IDOC, IMEM, INUL, ONUL } = sys.getState();
                    if (typeof IDOC !== 'number' || IMEM !== 0)
                        return false;
                    let num = IDOC;
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
                    let str = String.fromCharCode(...digits.reverse()); // TODO: is this performant?
                    sys.setState({ IDOC, IMEM: 1, ODOC: str, INUL, ONUL });
                    return true;
                },
                apply: sys.NOT_A_LAMBDA,
            };
        },
    };
    // TODO: temp testing...
    int32.parse = int32.apply({ bindings: {
            base: { constant: { value: 10 } },
            unsigned: { constant: { value: false } },
        } }).parse;
    int32.unparse = int32.apply({ bindings: {
            base: { constant: { value: 10 } },
            unsigned: { constant: { value: false } },
        } }).unparse;
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
            var _a, _b, _c, _d, _e, _f;
            let base = (_b = (_a = expr.bindings.base) === null || _a === void 0 ? void 0 : _a.constant) === null || _b === void 0 ? void 0 : _b.value;
            let minDigits = (_d = (_c = expr.bindings.minDigits) === null || _c === void 0 ? void 0 : _c.constant) === null || _d === void 0 ? void 0 : _d.value;
            let maxDigits = (_f = (_e = expr.bindings.maxDigits) === null || _e === void 0 ? void 0 : _e.constant) === null || _f === void 0 ? void 0 : _f.value;
            sys.assert(typeof base === 'number' && base >= 2 && base <= 36);
            sys.assert(typeof minDigits === 'number' && minDigits >= 1 && minDigits <= 8);
            sys.assert(typeof maxDigits === 'number' && maxDigits >= minDigits && maxDigits <= 8);
            return {
                bindings: {},
                parse() {
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
