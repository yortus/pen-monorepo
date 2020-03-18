
const sys = initRuntimeSystem();

const 𝕊2 = {
    kind: 'module',
    bindings: {
        foo: {},
        bar: {},
        baz: {},
        digit: {},
        alpha: {},
        myList: {},
        rec: {},
        r2: {},
        r2d: {},
    },
};

const 𝕊3 = {
    kind: 'module',
    bindings: {
        b: {},
        d: {},
    },
};

const 𝕊4 = {
    kind: 'module',
    bindings: {
    },
};

const 𝕊5 = {
    kind: 'module',
    bindings: {
    },
};

const 𝕊6 = {
    kind: 'module',
    bindings: {
    },
};

const 𝕊7 = {
    kind: 'module',
    bindings: {
    },
};

const 𝕊8 = {
    kind: 'module',
    bindings: {
        util: {},
    },
};

const 𝕊9 = {
    kind: 'module',
    bindings: {
        util1: {},
        util2: {},
    },
};

const 𝕊10 = {
    kind: 'module',
    bindings: {
        util1: {},
    },
};

const 𝕊11 = {
    kind: 'module',
    bindings: {
        util2: {},
    },
};

// -------------------- V:\projects\oss\penc\test\results\in\import-graph\index.pen --------------------

{
    let rhs = 𝕊4;
    Object.assign(𝕊2.bindings.foo, sys.bindingLookup(rhs, 'f'));
    Object.assign(𝕊2.bindings.bar, sys.bindingLookup(rhs, 'b'));
    Object.assign(𝕊2.bindings.baz, sys.bindingLookup(rhs, 'baz'));
}

Object.assign(
    𝕊2.bindings.digit,
    sys.charRange("0", "9")
);

Object.assign(
    𝕊2.bindings.alpha,
    sys.selection(
        sys.charRange("a", "z"),
        sys.charRange("A", "Z")
    )
);

Object.assign(
    𝕊2.bindings.myList,
    sys.list([
        sys.reference(𝕊2, 'digit'),
        sys.sequence(
            sys.reference(𝕊2, 'digit'),
            sys.reference(𝕊2, 'digit')
        ),
        sys.sequence(
            sys.reference(𝕊2, 'digit'),
            sys.reference(𝕊2, 'digit'),
            sys.reference(𝕊2, 'digit')
        ),
    ])
);

Object.assign(
    𝕊2.bindings.rec,
    𝕊3
);

Object.assign(
    𝕊2.bindings.r2,
    sys.reference(𝕊2, 'rec')
);

Object.assign(
    𝕊2.bindings.r2d,
    sys.bindingLookup(
        sys.reference(𝕊2, 'rec'),
        'd'
    )
);

Object.assign(
    𝕊3.bindings.b,
    sys.label("b thing")
);

Object.assign(
    𝕊3.bindings.d,
    sys.label("d thing")
);

// -------------------- V:\projects\oss\penc\test\results\in\import-graph\a.pen --------------------

// -------------------- V:\projects\oss\penc\test\results\in\import-graph\b.pen --------------------

// -------------------- V:\projects\oss\penc\test\results\in\import-graph\c.pen --------------------

// -------------------- V:\projects\oss\penc\test\results\in\import-graph\d.pen --------------------

// -------------------- V:\projects\oss\penc\test\results\in\import-graph\util\index.pen --------------------

Object.assign(
    𝕊8.bindings.util,
    𝕊9
);

Object.assign(
    𝕊9.bindings.util1,
    𝕊10
);

Object.assign(
    𝕊9.bindings.util2,
    𝕊11
);

// -------------------- V:\projects\oss\penc\test\results\in\import-graph\util\util1.pen --------------------

Object.assign(
    𝕊10.bindings.util1,
    sys.string("util1")
);

// -------------------- V:\projects\oss\penc\test\results\in\import-graph\util\util2 --------------------

Object.assign(
    𝕊11.bindings.util2,
    sys.string("util2")
);

function initRuntimeSystem() {
    // @ts-ignore
    return {
        record,
        sequence,
        selection,
    };
    
    function assert(value) {
        if (!value)
            throw new Error(`Assertion failed`);
    }
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
    function isPlainObject(value) {
        return value !== null && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype;
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
    
    
    
}
