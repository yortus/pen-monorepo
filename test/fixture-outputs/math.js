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
                    return OUT = ONUL ? undefined : min, true; // <===== (1a)
                assumeType(IBUF); // <===== (2)
                if (IPTR < 0 || IPTR >= IBUF.length)
                    return false;
                let c = IBUF.charAt(IPTR);
                if (c < min || c > max)
                    return false;
                IPTR += 1;
                OUT = ONUL ? undefined : c; // <===== (1b)
                return true;
            },
            unparse() {
                if (INUL)
                    return OUT = ONUL ? '' : min, true; // <===== (1a)
                if (typeof IBUF !== 'string')
                    return false; // <===== (2)
                if (IPTR < 0 || IPTR >= IBUF.length)
                    return false;
                let c = IBUF.charAt(IPTR);
                if (c < min || c > max)
                    return false;
                IPTR += 1;
                OUT = ONUL ? '' : c; // <===== (1b)
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
                if (!isFullyConsumed(IBUF, IPTR))
                    throw new Error(`parse didn't consume entire input`);
                if (OUT === undefined)
                    throw new Error(`parse didn't return a value`);
                return OUT;
            },
            unparse: (node) => {
                setInState(node, 0);
                if (!start.unparse())
                    throw new Error('parse failed');
                if (!isFullyConsumed(IBUF, IPTR))
                    throw new Error(`unparse didn't consume entire input`);
                if (OUT === undefined)
                    throw new Error(`parse didn't return a value`);
                return OUT;
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
                let stateₒ = getState();
                let text = '';
                if (!isPlainObject(IBUF))
                    return false;
                let propNames = Object.keys(IBUF); // TODO: doc reliance on prop order and what this means
                let propCount = propNames.length;
                assert(propCount <= 32); // TODO: document this limit, move to constant, consider how to remove it
                // TODO: temp testing...
                const obj = IBUF;
                let bitmask = IPTR;
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
                    if (IPTR !== propName.length)
                        continue;
                    text += OUT;
                    // TODO: match field value
                    setInState(obj[propName], 0);
                    if (!value.unparse())
                        continue;
                    if (!isFullyConsumed(obj[propName], IPTR))
                        continue;
                    text += OUT;
                    // TODO: we matched both name and value - consume them from `node`
                    bitmask += propBit;
                    setInState(obj, bitmask);
                    OUT = text;
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
                    assert(OUT !== undefined);
                    arr.push(OUT);
                }
                OUT = arr;
                return true;
            },
            unparse() {
                let stateₒ = getState();
                let text = '';
                if (!Array.isArray(IBUF))
                    return false;
                if (IPTR < 0 || IPTR + elementsLength >= IBUF.length)
                    return false;
                const arr = IBUF;
                const off = IPTR;
                for (let i = 0; i < elementsLength; ++i) {
                    setInState(arr[off + i], 0);
                    if (!elements[i].unparse())
                        return setState(stateₒ), false;
                    if (!isFullyConsumed(IBUF, IPTR))
                        return setState(stateₒ), false;
                    text += OUT;
                }
                setInState(arr, off + elementsLength);
                OUT = text;
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
                    assert(OUT !== undefined);
                    obj[propName] = OUT;
                }
                OUT = obj;
                return true;
            },
            unparse() {
                let stateₒ = getState();
                let text = '';
                if (!isPlainObject(IBUF))
                    return false;
                let propNames = Object.keys(IBUF); // TODO: doc reliance on prop order and what this means
                let propCount = propNames.length;
                assert(propCount <= 32); // TODO: document this limit, move to constant, consider how to remove it
                // TODO: temp testing...
                const obj = IBUF;
                let bitmask = IPTR;
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
                    if (!isFullyConsumed(obj[propName], IPTR))
                        return setState(stateₒ), false;
                    text += OUT;
                    // TODO: we matched both name and value - consume them from `node`
                    bitmask += propBit;
                }
                setInState(obj, bitmask);
                OUT = text;
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
                        node = OUT;
                    // TODO: generalise below cases to a helper function that can be extended for new formats / blob types
                    else if (typeof node === 'string' && typeof OUT === 'string')
                        node += OUT;
                    else if (Array.isArray(node) && Array.isArray(OUT))
                        node = [...node, ...OUT];
                    else if (isPlainObject(node) && isPlainObject(OUT))
                        node = Object.assign(Object.assign({}, node), OUT);
                    else if (OUT !== undefined)
                        throw new Error(`Internal error: invalid sequence`);
                }
                OUT = node;
                return true;
            },
            unparse() {
                let stateₒ = getState();
                let text = '';
                for (let i = 0; i < arity; ++i) {
                    if (!expressions[i].unparse())
                        return setState(stateₒ), false;
                    // TODO: support more formats / blob types here, like for parse...
                    assert(typeof OUT === 'string'); // just for now... remove after addressing above TODO
                    text += OUT;
                }
                OUT = text;
                return true;
            },
        };
    }
    function string(value) {
        return {
            kind: 'rule',
            parse() {
                if (INUL)
                    return OUT = ONUL ? undefined : value, true; // <===== (1a)
                assumeType(IBUF); // <===== (2)
                if (!matchesAt(IBUF, value, IPTR))
                    return false;
                IPTR += value.length;
                OUT = ONUL ? undefined : value; // <===== (1b)
                return true;
            },
            unparse() {
                if (INUL)
                    return OUT = ONUL ? '' : value, true; // <===== (1a)
                if (typeof IBUF !== 'string')
                    return false; // <===== (2)
                if (!matchesAt(IBUF, value, IPTR))
                    return false;
                IPTR += value.length;
                OUT = ONUL ? '' : value; // <===== (1b)
                return true;
            },
        };
    }
    // TODO: new 'registers'... temp testing...
    let IBUF; // TODO: --> IDOC
    let IPTR; // TODO: --> IMEM
    let INUL = false;
    let OUT; // TODO: --> ODOC
    let ONUL = false;
    function getState() {
        return { IBUF, IPTR, OUT };
    }
    function setState(value) {
        ({ IBUF, IPTR, OUT } = value);
    }
    function setInState(IBUFᐟ, IPTRᐟ) {
        IBUF = IBUFᐟ;
        IPTR = IPTRᐟ;
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
            let { IBUF, IPTR } = stateₒ;
            sys.assumeType(IBUF);
            // Parse optional leading '-' sign...
            let isNegative = false;
            if (IPTR < IBUF.length && IBUF.charAt(IPTR) === '-') {
                isNegative = true;
                IPTR += 1;
            }
            // ...followed by one or more decimal digits. (NB: no exponents).
            let num = 0;
            let digits = 0;
            while (IPTR < IBUF.length) {
                // Read a digit
                let c = IBUF.charCodeAt(IPTR);
                if (c < UNICODE_ZERO_DIGIT || c > UNICODE_ZERO_DIGIT + 9)
                    break;
                // Check for overflow
                if (num > ONE_TENTH_MAXINT32)
                    return sys.setState(stateₒ), false;
                // Update parsed number
                num *= 10;
                num += (c - UNICODE_ZERO_DIGIT);
                IPTR += 1;
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
            sys.setState({ IBUF, IPTR, OUT: num });
            return true;
        },
        unparse() {
            // TODO: ensure N is a 32-bit integer
            let { IBUF, IPTR } = sys.getState();
            if (typeof IBUF !== 'number' || IPTR !== 0)
                return false;
            let num = IBUF;
            // tslint:disable-next-line: no-bitwise
            if ((num & 0xFFFFFFFF) !== num)
                return false;
            // TODO: check sign...
            let isNegative = false;
            if (num < 0) {
                isNegative = true;
                if (num === -2147483648) {
                    // Specially handle the one case where N = -N could overflow
                    sys.setState({ IBUF, IPTR: 1, OUT: '-2147483648' });
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
            sys.setState({ IBUF, IPTR: 1, OUT: digits.reverse().join('') });
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
                    sys.assumeType(stateₒ.IBUF);
                    let memos2 = parseMemos.get(stateₒ.IBUF);
                    if (memos2 === undefined) {
                        memos2 = new Map();
                        parseMemos.set(stateₒ.IBUF, memos2);
                    }
                    let memo = memos2.get(stateₒ.IPTR);
                    if (!memo) {
                        // The memo table does *not* have an entry, so this is the first attempt to apply this rule with
                        // this initial state. The first thing we do is create a memo table entry, which is marked as
                        // *unresolved*. All future applications of this rule with the same initial state will find this
                        // memo. If a future application finds the memo still unresolved, then we know we have encountered
                        // left-recursion.
                        memo = { resolved: false, isLeftRecursive: false, result: false, stateᐟ: stateₒ };
                        memos2.set(stateₒ.IPTR, memo);
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
                            if (state.IPTR <= memo.stateᐟ.IPTR)
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
                    let memos2 = unparseMemos.get(stateₒ.IBUF);
                    if (memos2 === undefined) {
                        memos2 = new Map();
                        unparseMemos.set(stateₒ.IBUF, memos2);
                    }
                    let memo = memos2.get(stateₒ.IPTR);
                    if (!memo) {
                        // The memo table does *not* have an entry, so this is the first attempt to apply this rule with
                        // this initial state. The first thing we do is create a memo table entry, which is marked as
                        // *unresolved*. All future applications of this rule with the same initial state will find this
                        // memo. If a future application finds the memo still unresolved, then we know we have encountered
                        // left-recursion.
                        memo = { resolved: false, isLeftRecursive: false, result: false, stateᐟ: stateₒ };
                        memos2.set(stateₒ.IPTR, memo);
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
                            if (state.IPTR === memo.stateᐟ.IPTR)
                                break;
                            if (!sys.isFullyConsumed(state.IBUF, state.IPTR))
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
