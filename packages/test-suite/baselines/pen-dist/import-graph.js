
"use strict";
function booleanLiteral(options) {
    const { value } = options;
    const out = options.out === 'ast' ? value : undefined;
    if (options.in !== 'ast') {
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
function character(options) {
    const { min, max } = options;
    if (options.in === 'nil') {
        const out = options.out === 'nil' ? undefined : min;
        return { rule: function CHA() { return OUT = out, true; } };
    }
    return {
        rule: function CHA() {
            if (typeof IN !== 'string')
                return false;
            if (IP < 0 || IP >= IN.length)
                return false;
            let c = IN.charAt(IP);
            if (c < min || c > max)
                return false;
            IP += 1;
            OUT = options.out === 'nil' ? undefined : c;
            return true;
        },
    };
}
function createMainExports(createProgram) {
    const parse = createProgram({ in: 'txt', out: 'ast' }).rule;
    const print = createProgram({ in: 'ast', out: 'txt' }).rule;
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
    if (options.in === 'txt' || options.out === 'ast') {
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
    if (options.in === 'ast' || options.out === 'txt') {
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
    throw new Error(`Unsupported operation '${options.in}'->'${options.out}'`);
}
function list(options) {
    const { elements } = options;
    const elementsLength = elements.length;
    if (options.in === 'txt' || options.out === 'ast') {
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
    if (options.in === 'ast' || options.out === 'txt') {
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
    throw new Error(`Unsupported operation '${options.in}'->'${options.out}'`);
}
function nullLiteral(options) {
    const out = options.out === 'ast' ? null : undefined;
    if (options.in !== 'ast') {
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
    const out = options.out === 'ast' ? value : undefined;
    if (options.in !== 'ast') {
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
    if (options.in === 'txt' || options.out === 'ast') {
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
    if (options.in === 'ast' || options.out === 'txt') {
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
    throw new Error(`Unsupported operation '${options.in}'->'${options.out}'`);
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
    const out = options.out === 'nil' ? undefined : value;
    if (options.in === 'nil') {
        return { rule: function STR() { return OUT = out, true; } };
    }
    return {
        rule: function STR() {
            if (typeof IN !== 'string')
                return false;
            if (!isMatch(value))
                return false;
            IP += value.length;
            OUT = out;
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

function createProgram({in: IN, out: OUT}) {

    const 𝕊1 = {
        bindings: {
            foo: {},
            bar: {},
            baz: {},
            start: {},
            digit: {},
            alpha: {},
            result: {},
            myList: {},
            rec: {},
            r2: {},
            r2d: {},
        },
    };

    const 𝕊2 = {
        bindings: {
            b: {},
            d: {},
        },
    };

    const 𝕊3 = {
        bindings: {
        },
    };

    const 𝕊4 = {
        bindings: {
        },
    };

    const 𝕊5 = {
        bindings: {
        },
    };

    const 𝕊6 = {
        bindings: {
        },
    };

    const 𝕊7 = {
        bindings: {
            util: {},
        },
    };

    const 𝕊8 = {
        bindings: {
            util1: {},
            util2: {},
        },
    };

    const 𝕊9 = {
        bindings: {
            util1: {},
        },
    };

    const 𝕊10 = {
        bindings: {
            util2: {},
        },
    };

    // -------------------- Aliases --------------------
    𝕊1.bindings.foo = 𝕊3.bindings.f;
    𝕊1.bindings.bar = 𝕊3.bindings.b;
    𝕊1.bindings.baz = 𝕊3.bindings.baz;
    𝕊1.bindings.start = 𝕊1.bindings.result;
    𝕊1.bindings.rec = 𝕊2;
    𝕊1.bindings.r2 = 𝕊1.bindings.rec;
    𝕊7.bindings.util = 𝕊8;
    𝕊8.bindings.util1 = 𝕊9;
    𝕊8.bindings.util2 = 𝕊10;

    // -------------------- Compile-time constants --------------------
    𝕊2.bindings.b.constant = {value: "b thing"};
    𝕊2.bindings.d.constant = {value: "d thing"};
    𝕊9.bindings.util1.constant = {value: "util1"};
    𝕊10.bindings.util2.constant = {value: "util2"};

    // -------------------- index.pen --------------------

    Object.assign(
        𝕊1.bindings.digit,
        character({
            in: IN,
            out: OUT,
            min: "0",
            max: "9",
        })
    );

    Object.assign(
        𝕊1.bindings.alpha,
        selection({
            in: IN,
            out: OUT,
            expressions: [
                character({
                    in: IN,
                    out: OUT,
                    min: "a",
                    max: "z",
                }),
                character({
                    in: IN,
                    out: OUT,
                    min: "A",
                    max: "Z",
                }),
            ],
        })
    );

    Object.assign(
        𝕊1.bindings.result,
        (𝕊1.bindings.foo).lambda(sequence({
            in: IN,
            out: OUT,
            expressions: [
                𝕊1.bindings.bar,
                𝕊1.bindings.baz,
            ],
        }))
    );

    Object.assign(
        𝕊1.bindings.myList,
        list({
            in: IN,
            out: OUT,
            elements: [
                𝕊1.bindings.digit,
                sequence({
                    in: IN,
                    out: OUT,
                    expressions: [
                        𝕊1.bindings.digit,
                        𝕊1.bindings.digit,
                    ],
                }),
                sequence({
                    in: IN,
                    out: OUT,
                    expressions: [
                        𝕊1.bindings.digit,
                        𝕊1.bindings.digit,
                        𝕊1.bindings.digit,
                    ],
                }),
            ],
        })
    );

    Object.assign(
        𝕊1.bindings.r2d,
        𝕊1.bindings.rec.bindings.d
    );

    Object.assign(
        𝕊2.bindings.b,
        stringLiteral({
            in: IN !== "ast" ? "nil" : IN,
            out: OUT !== "ast" ? "nil" : OUT,
            value: "b thing",
        })
    );

    Object.assign(
        𝕊2.bindings.d,
        stringLiteral({
            in: IN !== "ast" ? "nil" : IN,
            out: OUT !== "ast" ? "nil" : OUT,
            value: "d thing",
        })
    );

    // -------------------- a.pen --------------------

    // -------------------- b.pen --------------------

    // -------------------- c.pen --------------------

    // -------------------- d.pen --------------------

    // -------------------- index.pen --------------------

    // -------------------- util1.pen --------------------

    Object.assign(
        𝕊9.bindings.util1,
        stringLiteral({
            in: IN,
            out: OUT,
            value: "util1",
        })
    );

    // -------------------- util2 --------------------

    Object.assign(
        𝕊10.bindings.util2,
        stringLiteral({
            in: IN,
            out: OUT,
            value: "util2",
        })
    );

    return 𝕊1.bindings.start;
}

// -------------------- Main exports --------------------
module.exports = createMainExports(createProgram);
