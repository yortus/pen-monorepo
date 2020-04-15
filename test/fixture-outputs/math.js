const sys = initRuntimeSystem();
const std = initStandardLibrary();

const 𝕊2 = {
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

𝕊2.bindings.start = 𝕊2.bindings.expr;

// -------------------- V:\oss\penc\test\fixture-inputs\math.pen --------------------

{
    let rhs = std;
    Object.assign(
        𝕊2.bindings.memoise,
        sys.bindingLookup(rhs, 'memoise')
    );
    Object.assign(
        𝕊2.bindings.i32,
        sys.bindingLookup(rhs, 'i32')
    );
}

Object.assign(
    𝕊2.bindings.expr,
    sys.apply(
        𝕊2.bindings.memoise,
        sys.selection(
            𝕊2.bindings.add,
            𝕊2.bindings.sub,
            𝕊2.bindings.term
        )
    )
);

Object.assign(
    𝕊2.bindings.add,
    sys.record([
        {
            name: 'type',
            value: sys.abstract(sys.string("add")),
        },
        {
            name: 'lhs',
            value: 𝕊2.bindings.expr,
        },
        {
            name: 'rhs',
            value: sys.sequence(
                sys.concrete(sys.string("+")),
                𝕊2.bindings.term
            ),
        },
    ])
);

Object.assign(
    𝕊2.bindings.sub,
    sys.record([
        {
            name: 'type',
            value: sys.abstract(sys.string("sub")),
        },
        {
            name: 'lhs',
            value: 𝕊2.bindings.expr,
        },
        {
            name: 'rhs',
            value: sys.sequence(
                sys.concrete(sys.string("-")),
                𝕊2.bindings.term
            ),
        },
    ])
);

Object.assign(
    𝕊2.bindings.term,
    sys.apply(
        𝕊2.bindings.memoise,
        sys.selection(
            𝕊2.bindings.mul,
            𝕊2.bindings.div,
            𝕊2.bindings.factor
        )
    )
);

Object.assign(
    𝕊2.bindings.mul,
    sys.sequence(
        sys.field(
            sys.abstract(sys.string("type")),
            sys.abstract(sys.string("mul"))
        ),
        sys.record([
            {
                name: 'lhs',
                value: 𝕊2.bindings.term,
            },
        ]),
        sys.field(
            sys.abstract(sys.string("rhs")),
            sys.sequence(
                sys.concrete(sys.string("*")),
                𝕊2.bindings.factor
            )
        )
    )
);

Object.assign(
    𝕊2.bindings.div,
    sys.record([
        {
            name: 'type',
            value: sys.abstract(sys.string("div")),
        },
        {
            name: 'lhs',
            value: 𝕊2.bindings.term,
        },
        {
            name: 'rhs',
            value: sys.sequence(
                sys.concrete(sys.string("/")),
                𝕊2.bindings.factor
            ),
        },
    ])
);

Object.assign(
    𝕊2.bindings.factor,
    sys.selection(
        𝕊2.bindings.i32,
        sys.sequence(
            sys.concrete(sys.character("(", "(")),
            𝕊2.bindings.expr,
            sys.concrete(sys.character(")", ")"))
        )
    )
);

// -------------------- MAIN EXPORTS --------------------

module.exports = sys.createMainExports(𝕊2.bindings.start);

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
    function character(min, max) {
        return {
            kind: 'rule',
            parse() {
                if (INUL)
                    return ODOC = ONUL ? undefined : min, true; // <===== (1a)
                assumeType(IDOC); // <===== (2)
                if (IMEM < 0 || IMEM >= IDOC.length)
                    return false;
                let c = IDOC.charAt(IMEM);
                if (c < min || c > max)
                    return false;
                IMEM += 1;
                ODOC = ONUL ? undefined : c; // <===== (1b)
                return true;
            },
            unparse() {
                if (INUL)
                    return ODOC = ONUL ? '' : min, true; // <===== (1a)
                if (typeof IDOC !== 'string')
                    return false; // <===== (2)
                if (IMEM < 0 || IMEM >= IDOC.length)
                    return false;
                let c = IDOC.charAt(IMEM);
                if (c < min || c > max)
                    return false;
                IMEM += 1;
                ODOC = ONUL ? '' : c; // <===== (1b)
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
                let text = '';
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
                    text += ODOC;
                    // TODO: match field value
                    setInState(obj[propName], 0);
                    if (!value.unparse())
                        continue;
                    if (!isFullyConsumed(obj[propName], IMEM))
                        continue;
                    text += ODOC;
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
                let text = '';
                if (!Array.isArray(IDOC))
                    return false;
                if (IMEM < 0 || IMEM + elementsLength >= IDOC.length)
                    return false;
                const arr = IDOC;
                const off = IMEM;
                for (let i = 0; i < elementsLength; ++i) {
                    setInState(arr[off + i], 0);
                    if (!elements[i].unparse())
                        return setState(stateₒ), false;
                    if (!isFullyConsumed(IDOC, IMEM))
                        return setState(stateₒ), false;
                    text += ODOC;
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
                let text = '';
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
                    text += ODOC;
                    // TODO: we matched both name and value - consume them from `node`
                    bitmask += propBit;
                }
                setInState(obj, bitmask);
                ODOC = text;
                return true;
            },
        };
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
                    if (node === undefined)
                        node = ODOC;
                    // TODO: generalise below cases to a helper function that can be extended for new formats / blob types
                    else if (typeof node === 'string' && typeof ODOC === 'string')
                        node += ODOC;
                    else if (Array.isArray(node) && Array.isArray(ODOC))
                        node = [...node, ...ODOC];
                    else if (isPlainObject(node) && isPlainObject(ODOC))
                        node = Object.assign(Object.assign({}, node), ODOC);
                    else if (ODOC !== undefined)
                        throw new Error(`Internal error: invalid sequence`);
                }
                ODOC = node;
                return true;
            },
            unparse() {
                let stateₒ = getState();
                let text = '';
                for (let i = 0; i < arity; ++i) {
                    if (!expressions[i].unparse())
                        return setState(stateₒ), false;
                    // TODO: support more formats / blob types here, like for parse...
                    assert(typeof ODOC === 'string'); // just for now... remove after addressing above TODO
                    text += ODOC;
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
                if (INUL)
                    return ODOC = ONUL ? undefined : value, true; // <===== (1a)
                assumeType(IDOC); // <===== (2)
                if (!matchesAt(IDOC, value, IMEM))
                    return false;
                IMEM += value.length;
                ODOC = ONUL ? undefined : value; // <===== (1b)
                return true;
            },
            unparse() {
                if (INUL)
                    return ODOC = ONUL ? '' : value, true; // <===== (1a)
                if (typeof IDOC !== 'string')
                    return false; // <===== (2)
                if (!matchesAt(IDOC, value, IMEM))
                    return false;
                IMEM += value.length;
                ODOC = ONUL ? '' : value; // <===== (1b)
                return true;
            },
        };
    }
    // TODO: new 'registers'... temp testing...
    let IDOC;
    let IMEM;
    let INUL = false;
    let ODOC;
    let ONUL = false;
    function getState() {
        return { IDOC, IMEM, ODOC };
    }
    function setState(value) {
        ({ IDOC, IMEM, ODOC } = value);
    }
    function setInState(IDOCᐟ, IMEMᐟ) {
        IDOC = IDOCᐟ;
        IMEM = IMEMᐟ;
    }
    function assumeType(_) {
        // since its *assume*, body is a no-op
    }
    // TODO: doc... helper...
    function assert(value) {
        if (!value)
            throw new Error(`Assertion failed`);
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
        assumeType,
        getState,
        isFullyConsumed,
        isPlainObject,
        matchesAt,
        setState,
    };
}


// -------------------- STANDARD LIBRARY --------------------

function initStandardLibrary() {
    const i32 = {
        kind: 'rule',
        parse() {
            let stateₒ = sys.getState();
            let { IDOC, IMEM } = stateₒ;
            sys.assumeType(IDOC);
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
            sys.setState({ IDOC, IMEM, ODOC: num });
            return true;
        },
        unparse() {
            // TODO: ensure N is a 32-bit integer
            let { IDOC, IMEM } = sys.getState();
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
                    sys.setState({ IDOC, IMEM: 1, ODOC: '-2147483648' });
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
            sys.setState({ IDOC, IMEM: 1, ODOC: digits.reverse().join('') });
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
                    sys.assumeType(stateₒ.IDOC);
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
