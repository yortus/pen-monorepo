
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

function createProgram({inForm, outForm}) {

    const 𝕊1 = {
        bindings: {
            𝕊1_start: {},
            𝕊1_expr: {},
            𝕊1_a: {},
            𝕊1_b: {},
            𝕊1_baz: {},
            𝕊1_modExprMem: {},
            𝕊1_recA: {},
            𝕊1_recB: {},
            𝕊1_refC: {},
            𝕊1_defC: {},
        },
    };

    const 𝕊2 = {
        bindings: {
            𝕊2_foo: {},
            𝕊2_bar: {},
            𝕊2_a: {},
        },
    };

    const 𝕊3 = {
        bindings: {
            𝕊3_mem: {},
        },
    };

    const 𝕊4 = {
        bindings: {
            𝕊4_a: {},
        },
    };

    const 𝕊5 = {
        bindings: {
            𝕊5_b: {},
        },
    };

    const 𝕊6 = {
        bindings: {
            𝕊6_c: {},
            𝕊6_ref5: {},
            𝕊6_ref6: {},
        },
    };

    const 𝕊7 = {
        bindings: {
            𝕊7_c1: {},
            𝕊7_c2: {},
            𝕊7_ref1: {},
            𝕊7_ref2: {},
            𝕊7_ref3: {},
        },
    };

    // -------------------- Aliases --------------------
    𝕊1.bindings.𝕊1_expr = 𝕊2;
    𝕊1.bindings.𝕊1_a = 𝕊1.bindings.𝕊1_b;
    𝕊1.bindings.𝕊1_recA = 𝕊4;
    𝕊1.bindings.𝕊1_recB = 𝕊5;
    𝕊1.bindings.𝕊1_defC = 𝕊6;
    𝕊2.bindings.𝕊2_a = 𝕊1.bindings.𝕊1_b;
    𝕊6.bindings.𝕊6_c = 𝕊7;
    𝕊7.bindings.𝕊7_ref1 = 𝕊7.bindings.𝕊7_c1;

    // -------------------- Compile-time constants --------------------
    𝕊1.bindings.𝕊1_b.constant = {value: "b2"};
    𝕊1.bindings.𝕊1_baz.constant = {value: "baz"};
    𝕊2.bindings.𝕊2_foo.constant = {value: "foo"};
    𝕊2.bindings.𝕊2_bar.constant = {value: "bar"};
    𝕊3.bindings.𝕊3_mem.constant = {value: "member"};
    𝕊7.bindings.𝕊7_c1.constant = {value: "c1"};
    𝕊7.bindings.𝕊7_c2.constant = {value: "c2"};

    // -------------------- compile-test.pen --------------------

    Object.assign(
        𝕊1.bindings.𝕊1_start,
        𝕊1.bindings.𝕊1_expr.bindings.foo
    );

    Object.assign(
        𝕊1.bindings.𝕊1_b,
        stringLiteral({
            inForm: inForm,
            outForm: outForm,
            value: "b2",
        })
    );

    Object.assign(
        𝕊1.bindings.𝕊1_baz,
        stringLiteral({
            inForm: inForm,
            outForm: outForm,
            value: "baz",
        })
    );

    Object.assign(
        𝕊1.bindings.𝕊1_modExprMem,
        selection({
            inForm,
            outForm,
            expressions: [
                𝕊1.bindings.𝕊1_expr.bindings.foo,
                𝕊3.bindings.mem,
                𝕊1.bindings.𝕊1_baz,
            ],
        })
    );

    Object.assign(
        𝕊1.bindings.𝕊1_refC,
        𝕊1.bindings.𝕊1_defC.bindings.c.bindings.c1
    );

    Object.assign(
        𝕊2.bindings.𝕊2_foo,
        stringLiteral({
            inForm: inForm,
            outForm: outForm,
            value: "foo",
        })
    );

    Object.assign(
        𝕊2.bindings.𝕊2_bar,
        stringLiteral({
            inForm: inForm,
            outForm: outForm,
            value: "bar",
        })
    );

    Object.assign(
        𝕊3.bindings.𝕊3_mem,
        stringLiteral({
            inForm: inForm,
            outForm: outForm,
            value: "member",
        })
    );

    Object.assign(
        𝕊4.bindings.𝕊4_a,
        𝕊1.bindings.𝕊1_recB.bindings.b
    );

    Object.assign(
        𝕊5.bindings.𝕊5_b,
        𝕊1.bindings.𝕊1_recA.bindings.a
    );

    Object.assign(
        𝕊6.bindings.𝕊6_ref5,
        𝕊6.bindings.𝕊6_c.bindings.c1
    );

    Object.assign(
        𝕊6.bindings.𝕊6_ref6,
        𝕊1.bindings.𝕊1_defC.bindings.c.bindings.c1
    );

    Object.assign(
        𝕊7.bindings.𝕊7_c1,
        stringLiteral({
            inForm: inForm,
            outForm: outForm,
            value: "c1",
        })
    );

    Object.assign(
        𝕊7.bindings.𝕊7_c2,
        stringLiteral({
            inForm: inForm,
            outForm: outForm,
            value: "c2",
        })
    );

    Object.assign(
        𝕊7.bindings.𝕊7_ref2,
        𝕊6.bindings.𝕊6_c.bindings.c1
    );

    Object.assign(
        𝕊7.bindings.𝕊7_ref3,
        𝕊1.bindings.𝕊1_defC.bindings.c.bindings.c1
    );

    return 𝕊1.bindings.𝕊1_start;
}

// -------------------- Main exports --------------------
module.exports = createMainExports(createProgram);
