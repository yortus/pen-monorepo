
const sys = initRuntimeSystem();
const std = initStandardLibrary();

const 𝕊2 = {
    kind: 'module',
    bindings: {
        memoise: {},
        i32: {},
        math: {},
        expr: {},
        add: {},
        sub: {},
        term: {},
        mul: {},
        div: {},
        factor: {},
    },
};

module.exports = {parse, unparse};
function parse(text) {
    let start = 𝕊2.bindings.math;
    let result = {node: null, posᐟ: 0};
    if (!start.parse(text, 0, result)) throw new Error(`parse failed`);
    if (result.posᐟ !== text.length) throw new Error(`parse didn't consume entire input`);
    if (result.node === undefined) throw new Error(`parse didn't return a value`);
    return result.node;
}
function unparse(node) {
    let start = 𝕊2.bindings.math;
    let result = {text: '', posᐟ: 0};
    if (!start.unparse(node, 0, result)) throw new Error(`parse failed`);
    if (!isFullyConsumed(node, result.posᐟ)) throw new Error(`unparse didn't consume entire input`);
    return result.text;
}

// -------------------- V:\oss\penc\test\results\in\math\index.pen --------------------

{
    let rhs = std;
    𝕊2.bindings.memoise = sys.bindingLookup(rhs, 'memoise');
    𝕊2.bindings.i32 = sys.bindingLookup(rhs, 'i32');
}

𝕊2.bindings.math = 𝕊2.bindings.expr; // alias

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
            dynamic: false,
            name: 'type',
            value: sys.label("add"),
        },
        {
            dynamic: false,
            name: 'lhs',
            value: 𝕊2.bindings.expr,
        },
        {
            dynamic: false,
            name: 'rhs',
            value: sys.sequence(
                sys.string("+"),
                𝕊2.bindings.term
            ),
        },
    ])
);

Object.assign(
    𝕊2.bindings.sub,
    sys.record([
        {
            dynamic: false,
            name: 'type',
            value: sys.label("sub"),
        },
        {
            dynamic: false,
            name: 'lhs',
            value: 𝕊2.bindings.expr,
        },
        {
            dynamic: false,
            name: 'rhs',
            value: sys.sequence(
                sys.string("\\-"),
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
    sys.record([
        {
            dynamic: false,
            name: 'type',
            value: sys.label("mul"),
        },
        {
            dynamic: false,
            name: 'lhs',
            value: 𝕊2.bindings.term,
        },
        {
            dynamic: false,
            name: 'rhs',
            value: sys.sequence(
                sys.string("*"),
                𝕊2.bindings.factor
            ),
        },
    ])
);

Object.assign(
    𝕊2.bindings.div,
    sys.record([
        {
            dynamic: false,
            name: 'type',
            value: sys.label("div"),
        },
        {
            dynamic: false,
            name: 'lhs',
            value: 𝕊2.bindings.term,
        },
        {
            dynamic: false,
            name: 'rhs',
            value: sys.sequence(
                sys.string("/"),
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
            sys.string("("),
            𝕊2.bindings.expr,
            sys.string(")")
        )
    )
);

// -------------------- RUNTIME SYSTEM --------------------

function initRuntimeSystem() {
    function apply(func, arg) {
        assert(func.kind === 'function');
        return func.apply(arg);
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
        return {
            kind: 'production',
            parse(text, pos, result) {
                let arr = [];
                for (let element of elements) {
                    if (!element.parse(text, pos, result))
                        return false;
                    assert(result.node !== undefined); // TODO: was NO_NODE. Does it mean the same thing?
                    arr.push(result.node);
                    pos = result.posᐟ;
                }
                result.node = arr;
                result.posᐟ = pos;
                return true;
            },
            unparse(node, pos, result) {
                let text = '';
                if (!Array.isArray(node))
                    return false;
                for (let element of elements) {
                    if (pos >= node.length)
                        return false;
                    if (!element.unparse(node[pos], 0, result))
                        return false;
                    if (!isFullyConsumed(node[pos], result.posᐟ))
                        return false;
                    text += result.text;
                    pos += 1;
                }
                result.text = text;
                result.posᐟ = pos;
                return true;
            },
        };
    }
    function record(fields) {
        return {
            kind: 'production',
            parse(text, pos, result) {
                let obj = {};
                for (let field of fields) {
                    let propName;
                    if (field.dynamic) {
                        if (!field.name.parse(text, pos, result))
                            return false;
                        assert(typeof result.node === 'string');
                        propName = result.node;
                        pos = result.posᐟ;
                    }
                    else /* field.dynamic === false */ {
                        propName = field.name;
                    }
                    if (!field.value.parse(text, pos, result))
                        return false;
                    assert(result.node !== undefined);
                    obj[propName] = result.node;
                    pos = result.posᐟ;
                }
                result.node = obj;
                result.posᐟ = pos;
                return true;
            },
            unparse(node, pos, result) {
                let text = '';
                if (!isPlainObject(node))
                    return false;
                let propNames = Object.keys(node); // TODO: doc reliance on prop order and what this means
                let propCount = propNames.length;
                assert(propCount <= 32); // TODO: document this limit, move to constant, consider how to remove it
                // TODO: O(n^2)? Can we do better? More fast paths for common cases?
                outerLoop: for (let field of fields) {
                    // Find the first property key/value pair that matches this field name/value pair (if any)
                    for (let i = 0; i < propCount; ++i) {
                        let propName = propNames[i];
                        // TODO: skip already-consumed key/value pairs
                        // tslint:disable-next-line: no-bitwise
                        const posIncrement = 1 << i;
                        // tslint:disable-next-line: no-bitwise
                        if ((pos & posIncrement) !== 0)
                            continue;
                        // TODO: match field name
                        if (field.dynamic) {
                            if (!field.name.unparse(propName, 0, result))
                                continue;
                            if (result.posᐟ !== propName.length)
                                continue;
                            text += result.text;
                        }
                        else /* field.dynamic === false */ {
                            if (propName !== field.name)
                                continue;
                        }
                        // TODO: match field value
                        if (!field.value.unparse(node[propName], 0, result))
                            continue; // TODO: bug? modifies result without guarantee of returning true
                        if (!isFullyConsumed(node[propName], result.posᐟ))
                            continue;
                        text += result.text;
                        // TODO: we matched both name and value - consume them from `node`
                        pos += posIncrement;
                        continue outerLoop;
                    }
                    // If we get here, no match...
                    return false;
                }
                result.text = text;
                result.posᐟ = pos;
                return true;
            },
        };
    }
    function selection(...expressions) {
        const arity = expressions.length;
        return {
            kind: 'production',
            parse(text, pos, result) {
                for (let i = 0; i < arity; ++i) {
                    if (expressions[i].parse(text, pos, result))
                        return true;
                }
                return false;
            },
            unparse(node, pos, result) {
                for (let i = 0; i < arity; ++i) {
                    if (expressions[i].unparse(node, pos, result))
                        return true;
                }
                return false;
            },
        };
    }
    function sequence(...expressions) {
        const arity = expressions.length;
        return {
            kind: 'production',
            parse(text, pos, result) {
                let node;
                for (let i = 0; i < arity; ++i) {
                    if (!expressions[i].parse(text, pos, result))
                        return false;
                    pos = result.posᐟ;
                    if (node === undefined)
                        node = result.node;
                    else if (typeof node === 'string' && typeof result.node === 'string')
                        node += result.node;
                    else if (Array.isArray(node) && Array.isArray(result.node))
                        node = [...node, ...result.node];
                    else if (isPlainObject(node) && isPlainObject(result.node))
                        node = Object.assign(Object.assign({}, node), result.node);
                    else if (result.node !== undefined)
                        throw new Error(`Internal error: invalid sequence`);
                }
                result.node = node;
                result.posᐟ = pos;
                return true;
            },
            unparse(node, pos, result) {
                let text = '';
                for (let i = 0; i < arity; ++i) {
                    if (!expressions[i].unparse(node, pos, result))
                        return false;
                    // TODO: more sanity checking in here, like for parse...
                    text += result.text;
                    pos = result.posᐟ;
                }
                result.text = text;
                result.posᐟ = pos;
                return true;
            },
        };
    }
    function string(value) {
        return {
            kind: 'production',
            parse(text, pos, result) {
                if (!matchesAt(text, value, pos))
                    return false;
                result.node = value;
                result.posᐟ = pos + value.length;
                return true;
            },
            unparse(node, pos, result) {
                if (typeof node !== 'string' || !matchesAt(node, value, pos))
                    return false;
                result.text = value;
                result.posᐟ = pos + value.length;
                return true;
            },
        };
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
        apply,
        bindingLookup,
        charRange,
        label,
        list,
        record,
        sequence,
        selection,
        string,
    };
}


// -------------------- STANDARD LIBRARY --------------------

function initStandardLibrary() {
    const i32 = {
        kind: 'production',
        parse(text, pos, result) {
            // Parse optional leading '-' sign...
            let isNegative = false;
            if (pos < text.length && text.charAt(pos) === '-') {
                isNegative = true;
                pos += 1;
            }
            // ...followed by one or more decimal digits. (NB: no exponents).
            let num = 0;
            let digits = 0;
            while (pos < text.length) {
                // Read a digit
                let c = text.charCodeAt(pos);
                if (c < UNICODE_ZERO_DIGIT || c > UNICODE_ZERO_DIGIT + 9)
                    break;
                // Check for overflow
                if (num > ONE_TENTH_MAXINT32) {
                    return false;
                }
                // Update parsed number
                num *= 10;
                num += (c - UNICODE_ZERO_DIGIT);
                pos += 1;
                digits += 1;
            }
            // Check that we parsed at least one digit.
            if (digits === 0)
                return false;
            // Apply the sign.
            if (isNegative)
                num = -num;
            // Check for over/under-flow. This *is* needed to catch -2147483649, 2147483648 and 2147483649.
            // tslint:disable-next-line: no-bitwise
            if (isNegative ? (num & 0xFFFFFFFF) >= 0 : (num & 0xFFFFFFFF) < 0)
                return false;
            // Success
            result.node = num;
            result.posᐟ = pos;
            return true;
        },
        unparse(node, pos, result) {
            // TODO: ensure N is a 32-bit integer
            if (typeof node !== 'number' || pos !== 0)
                return false;
            let num = node;
            // tslint:disable-next-line: no-bitwise
            if ((num & 0xFFFFFFFF) !== num)
                return false;
            // TODO: check sign...
            let isNegative = false;
            if (num < 0) {
                isNegative = true;
                if (num === -2147483648) {
                    // Specially handle the one case where N = -N could overflow
                    result.text = '-2147483648';
                    result.posᐟ = 1;
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
            result.text = digits.reverse().join('');
            result.posᐟ = 1;
            return true;
        },
    };
    // These constants are used by the i32 production.
    const UNICODE_ZERO_DIGIT = '0'.charCodeAt(0);
    const ONE_TENTH_MAXINT32 = 0x7FFFFFFF / 10;
    const memoise = {
        kind: 'function',
        apply(expr) {
            // TODO: investigate... need to use `text` as part of memo key? Study lifecycle/extent of each `memos` instance.
            const parseMemos = new Map();
            // TODO: revise memo key once using new ast/pos signature
            const unparseMemos = new Map();
            return {
                kind: 'production',
                parse(text, pos, result) {
                    // Check whether the memo table already has an entry for the given initial state.
                    let memo = parseMemos.get(pos);
                    if (!memo) {
                        // The memo table does *not* have an entry, so this is the first attempt to apply this rule with this
                        // initial state. The first thing we do is create a memo table entry, which is marked as *unresolved*.
                        // All future applications of this rule with the same initial state will find this memo. If a future
                        // application finds the memo still unresolved, then we know we have encountered left-recursion.
                        memo = { resolved: false, isLeftRecursive: false, result: { node: PARSE_FAIL, posᐟ: 0 } };
                        parseMemos.set(pos, memo);
                        // Now that the unresolved memo is in place, apply the rule, and resolve the memo with the result. At
                        // this point, any left-recursive paths encountered during application are guaranteed to have been noted
                        // and aborted (see below).
                        if (!expr.parse(text, pos, memo.result))
                            memo.result.node = PARSE_FAIL;
                        memo.resolved = true;
                        // If we did *not* encounter left-recursion, then we have simple memoisation, and the result is final.
                        if (!memo.isLeftRecursive) {
                            Object.assign(result, memo.result);
                            return result.node !== PARSE_FAIL;
                        }
                        // If we get here, then the above application of the rule invoked itself left-recursively, but we
                        // aborted the left-recursive paths (see below). That means that the result is either failure, or
                        // success via a non-left-recursive path through the rule. We now iterate, repeatedly re-applying the
                        // same rule with the same initial state. We continue to iterate as long as the application succeeds
                        // and consumes more input than the previous iteration did, in which case we update the memo with the
                        // new result. We thus 'grow' the result, stopping when application either fails or does not consume
                        // more input, at which point we take the result of the previous iteration as final.
                        while (memo.result.node !== PARSE_FAIL) {
                            if (!expr.parse(text, pos, result))
                                result.node = PARSE_FAIL;
                            if (result.node === PARSE_FAIL || result.posᐟ <= memo.result.posᐟ)
                                break;
                            Object.assign(memo.result, result);
                        }
                    }
                    else if (!memo.resolved) {
                        // If we get here, then we have already applied the rule with this initial state, but not yet resolved
                        // it. That means we must have entered a left-recursive path of the rule. All we do here is note that
                        // the rule application encountered left-recursion, and return with failure. This means that the initial
                        // application of the rule for this initial state can only possibly succeed along a non-left-recursive
                        // path. More importantly, it means the parser will never loop endlessly on left-recursive rules.
                        memo.isLeftRecursive = true;
                        return false;
                    }
                    // We have a resolved memo, so the result of the rule application for the given initial state has already
                    // been computed. Return it from the memo.
                    Object.assign(result, memo.result);
                    return result.node !== PARSE_FAIL;
                },
                unparse(node, pos, result) {
                    // Check whether the memo table already has an entry for the given initial state.
                    let memos2 = unparseMemos.get(node);
                    if (memos2 === undefined) {
                        memos2 = new Map();
                        unparseMemos.set(node, memos2);
                    }
                    let memo = memos2.get(pos);
                    if (!memo) {
                        // The memo table does *not* have an entry, so this is the first attempt to apply this rule with this
                        // initial state. The first thing we do is create a memo table entry, which is marked as *unresolved*.
                        // All future applications of this rule with the same initial state will find this memo. If a future
                        // application finds the memo still unresolved, then we know we have encountered left-recursion.
                        memo = { resolved: false, isLeftRecursive: false, result: { text: UNPARSE_FAIL, posᐟ: 0 } };
                        memos2.set(pos, memo);
                        // Now that the unresolved memo is in place, apply the rule, and resolve the memo with the result. At
                        // this point, any left-recursive paths encountered during application are guaranteed to have been noted
                        // and aborted (see below).
                        if (!expr.unparse(node, pos, memo.result))
                            memo.result.text = UNPARSE_FAIL;
                        memo.resolved = true;
                        // If we did *not* encounter left-recursion, then we have simple memoisation, and the result is final.
                        if (!memo.isLeftRecursive) {
                            Object.assign(result, memo.result);
                            return result.text !== UNPARSE_FAIL;
                        }
                        // If we get here, then the above application of the rule invoked itself left-recursively, but we
                        // aborted the left-recursive paths (see below). That means that the result is either failure, or
                        // success via a non-left-recursive path through the rule. We now iterate, repeatedly re-applying the
                        // same rule with the same initial state. We continue to iterate as long as the application succeeds
                        // and consumes more input than the previous iteration did, in which case we update the memo with the
                        // new result. We thus 'grow' the result, stopping when application either fails or does not consume
                        // more input, at which point we take the result of the previous iteration as final.
                        while (memo.result.text !== UNPARSE_FAIL) {
                            if (!expr.unparse(node, pos, result))
                                result.text = UNPARSE_FAIL;
                            // TODO: break cases:
                            // anything --> same thing (covers all string cases, since they can only be same or shorter)
                            // some node --> some different non-empty node (assert: should never happen!)
                            if (result.text === UNPARSE_FAIL)
                                break;
                            if (result.posᐟ === memo.result.posᐟ)
                                break;
                            if (!isFullyConsumed(node, result.posᐟ))
                                break;
                            Object.assign(memo.result, result);
                        }
                    }
                    else if (!memo.resolved) {
                        // If we get here, then we have already applied the rule with this initial state, but not yet resolved
                        // it. That means we must have entered a left-recursive path of the rule. All we do here is note that
                        // the rule application encountered left-recursion, and return with failure. This means that the initial
                        // application of the rule for this initial state can only possibly succeed along a non-left-recursive
                        // path. More importantly, it means the parser will never loop endlessly on left-recursive rules.
                        memo.isLeftRecursive = true;
                        return false;
                    }
                    // We have a resolved memo, so the result of the rule application for the given initial state has already
                    // been computed. Return it from the memo.
                    Object.assign(result, memo.result);
                    return result.text !== UNPARSE_FAIL;
                },
            };
        },
    };
    const PARSE_FAIL = Symbol('FAIL');
    // NB: this is an invalid code point (lead surrogate with no pair). It is used as a sentinel.
    const UNPARSE_FAIL = '\uD800';
    // @ts-ignore
    return {
        kind: 'module',
        bindings: {
            i32,
            memoise,
        },
    };
}
