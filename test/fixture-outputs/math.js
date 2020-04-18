const sys = initRuntimeSystem();
const std = initStandardLibrary();
const experiments = initTemporaryExperiments();

const 𝕊4 = {
    kind: 'module',
    bindings: {
        memoise: {},
        i32: {},
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

𝕊4.bindings.start = 𝕊4.bindings.expr;

// -------------------- v:\projects\oss\penc\test\fixture-inputs\math.pen --------------------

{
    let rhs = std;
    Object.assign(
        𝕊4.bindings.memoise,
        sys.bindingLookup(rhs, 'memoise')
    );
    Object.assign(
        𝕊4.bindings.i32,
        sys.bindingLookup(rhs, 'i32')
    );
}

Object.assign(
    𝕊4.bindings.expr,
    sys.apply(
        𝕊4.bindings.memoise,
        sys.selection(
            𝕊4.bindings.add,
            𝕊4.bindings.sub,
            𝕊4.bindings.term
        )
    )
);

Object.assign(
    𝕊4.bindings.add,
    sys.record([
        {
            name: 'type',
            value: sys.abstract(sys.string("add")),
        },
        {
            name: 'lhs',
            value: 𝕊4.bindings.expr,
        },
        {
            name: 'rhs',
            value: sys.sequence(
                sys.concrete(sys.string("+")),
                𝕊4.bindings.term
            ),
        },
    ])
);

Object.assign(
    𝕊4.bindings.sub,
    sys.record([
        {
            name: 'type',
            value: sys.abstract(sys.string("sub")),
        },
        {
            name: 'lhs',
            value: 𝕊4.bindings.expr,
        },
        {
            name: 'rhs',
            value: sys.sequence(
                sys.concrete(sys.string("-")),
                𝕊4.bindings.term
            ),
        },
    ])
);

Object.assign(
    𝕊4.bindings.term,
    sys.apply(
        𝕊4.bindings.memoise,
        sys.selection(
            𝕊4.bindings.mul,
            𝕊4.bindings.div,
            𝕊4.bindings.factor
        )
    )
);

Object.assign(
    𝕊4.bindings.mul,
    sys.sequence(
        sys.field(
            sys.abstract(sys.string("type")),
            sys.abstract(sys.string("mul"))
        ),
        sys.record([
            {
                name: 'lhs',
                value: 𝕊4.bindings.term,
            },
        ]),
        sys.field(
            sys.abstract(sys.string("rhs")),
            sys.sequence(
                sys.concrete(sys.string("*")),
                𝕊4.bindings.factor
            )
        )
    )
);

Object.assign(
    𝕊4.bindings.div,
    sys.record([
        {
            name: 'type',
            value: sys.abstract(sys.string("div")),
        },
        {
            name: 'lhs',
            value: 𝕊4.bindings.term,
        },
        {
            name: 'rhs',
            value: sys.sequence(
                sys.concrete(sys.string("/")),
                𝕊4.bindings.factor
            ),
        },
    ])
);

Object.assign(
    𝕊4.bindings.factor,
    sys.selection(
        𝕊4.bindings.i32,
        sys.sequence(
            sys.concrete(sys.character("(", "(")),
            𝕊4.bindings.expr,
            sys.concrete(sys.character(")", ")"))
        )
    )
);

// -------------------- MAIN EXPORTS --------------------

module.exports = sys.createMainExports(𝕊4.bindings.start);

// -------------------- RUNTIME SYSTEM --------------------

function initRuntimeSystem() {
    function abstract(expr) {
        return {
            kind: 'rule',
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
        };
    }
    function apply(lambda, arg) {
        assert(lambda.kind === 'lambda');
        return lambda.apply(arg);
    }
    function bindingLookup(module, name) {
        var _a;
        assert(module.kind === 'module' && ((_a = module.bindings) === null || _a === void 0 ? void 0 : _a[name]));
        // TODO: ensure binding is exported/visible
        return module.bindings[name];
    }
    function charRange(min, max) {
        return {
            kind: 'production',
            parse(text, pos, result) {
                if (pos >= text.length)
                    return false;
                let c = text.charAt(pos);
                if (c < min || c > max)
                    return false;
                result.node = c;
                result.posᐟ = pos + 1;
                return true;
            },
            unparse(node, pos, result) {
                if (typeof node !== 'string' || pos >= node.length)
                    return false;
                let c = node.charAt(pos);
                if (c < min || c > max)
                    return false;
                result.text = c;
                result.posᐟ = pos + 1;
                return true;
            },
        };
    }
    function character(min, max) {
        return {
            kind: 'rule',
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
        };
    }
    function concrete(expr) {
        return {
            kind: 'rule',
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
            kind: 'rule',
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
        };
    }
    function label(value) {
        return {
            kind: 'production',
            parse(_, pos, result) {
                result.node = value;
                result.posᐟ = pos;
                return true;
            },
            unparse(node, pos, result) {
                if (typeof node !== 'string' || !matchesAt(node, value, pos))
                    return false;
                result.text = '';
                result.posᐟ = pos + value.length;
                return true;
            },
        };
    }
    function list(elements) {
        const elementsLength = elements.length;
        return {
            kind: 'rule',
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
        };
    }
    function record(fields) {
        return {
            kind: 'rule',
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
        };
    }
    // TODO: investigate optimisations... Don't need to retain indirection in many cases. Or will V8 optimisations suffice?
    function reference(target) {
        // TODO: hacky and repetitive, fix this. Prob: if its a forward ref, we don't know target type yet.
        if (target.kind === 'production') {
            return {
                kind: 'production',
                parse: (text, pos, result) => target.parse(text, pos, result),
                unparse: (node, pos, result) => target.unparse(node, pos, result),
            };
        }
        else if (target.kind === 'function') {
            return {
                kind: 'function',
                apply: (arg) => target.apply(arg),
            };
        }
        else {
            throw new Error('Not implemented'); // TODO: ...
        }
    }
    function selection(...expressions) {
        const arity = expressions.length;
        return {
            kind: 'rule',
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
    function sequence(...expressions) {
        const arity = expressions.length;
        return {
            kind: 'rule',
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
        };
    }
    function string(value) {
        return {
            kind: 'rule',
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
    // @ts-ignore
    return {
        abstract,
        apply,
        bindingLookup,
        concrete,
        createMainExports,
        character,
        field,
        list,
        record,
        sequence,
        selection,
        string,
        // export helpers too so std can reference them
        assert,
        concat,
        getState,
        isFullyConsumed,
        isPlainObject,
        isString,
        matchesAt,
        setInState,
        setOutState,
        setState,
    };
}


// -------------------- STANDARD LIBRARY --------------------

function initStandardLibrary() {
    // TODO: habdle abstract/concrete...
    const i32 = {
        kind: 'rule',
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
    };
    // These constants are used by the i32 rule.
    const UNICODE_ZERO_DIGIT = '0'.charCodeAt(0);
    const ONE_TENTH_MAXINT32 = 0x7FFFFFFF / 10;
    const memoise = {
        kind: 'lambda',
        apply(expr) {
            // TODO: investigate... need to use `text` as part of memo key? Study lifecycle/extent of each `memos` instance.
            const parseMemos = new Map();
            // TODO: revise memo key once using new ast/pos signature
            const unparseMemos = new Map();
            return {
                kind: 'rule',
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
            };
        },
    };
    // @ts-ignore
    return {
        kind: 'module',
        bindings: {
            i32,
            memoise,
        },
    };
}


// -------------------- TEMPORARY EXPERIMENTS --------------------

function initTemporaryExperiments() {
    const anyChar = {
        kind: 'rule',
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
    };
    const epsilon = {
        kind: 'rule',
        parse() {
            sys.setOutState(undefined);
            return true;
        },
        unparse() {
            sys.setOutState(undefined);
            return true;
        },
    };
    const intrinsicFalse = {
        kind: 'rule',
        parse() {
            let { ONUL } = sys.getState();
            sys.setOutState(ONUL ? undefined : false);
            return true;
        },
        unparse() {
            let { IDOC, IMEM, INUL, ONUL } = sys.getState();
            if (!INUL) {
                if (IDOC !== false || IMEM !== 0)
                    return false;
                IMEM = 1;
            }
            sys.setState({ IDOC, IMEM, ODOC: undefined, INUL, ONUL });
            return true;
        },
    };
    const intrinsicNull = {
        kind: 'rule',
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
    };
    const intrinsicTrue = {
        kind: 'rule',
        parse() {
            let { ONUL } = sys.getState();
            sys.setOutState(ONUL ? undefined : true);
            return true;
        },
        unparse() {
            let { IDOC, IMEM, INUL, ONUL } = sys.getState();
            if (!INUL) {
                if (IDOC !== true || IMEM !== 0)
                    return false;
                IMEM = 1;
            }
            sys.setState({ IDOC, IMEM, ODOC: undefined, INUL, ONUL });
            return true;
        },
    };
    const maybe = {
        kind: 'lambda',
        apply(expr) {
            return {
                kind: 'rule',
                parse() {
                    return expr.parse() || epsilon.parse();
                },
                unparse() {
                    return expr.unparse() || epsilon.unparse();
                },
            };
        },
    };
    const not = {
        kind: 'lambda',
        apply(expr) {
            return {
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
            };
        },
    };
    const zeroOrMore = {
        kind: 'lambda',
        apply(expr) {
            return {
                kind: 'rule',
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
            };
        },
    };
    // @ts-ignore
    return {
        kind: 'module',
        bindings: {
            anyChar,
            epsilon,
            intrinsicFalse,
            intrinsicNull,
            intrinsicTrue,
            maybe,
            not,
            zeroOrMore,
        },
    };
}
