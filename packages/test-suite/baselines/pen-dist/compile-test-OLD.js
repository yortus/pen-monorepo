
"use strict";
function field({ mode, name, value }) {
    if (isParse(mode)) {
        return function FLD() {
            let stateₒ = getState();
            let obj = {};
            if (!name())
                return false;
            assert(typeof OUT === 'string');
            let propName = OUT;
            if (!value())
                return setState(stateₒ), false;
            assert(OUT !== undefined);
            obj[propName] = OUT;
            OUT = obj;
            return true;
        };
    }
    else {
        return function FLD() {
            if (objectToString.call(IN) !== '[object Object]')
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
                if (!name())
                    continue;
                if (IP !== propName.length)
                    continue;
                text = concat(text, OUT);
                setState({ IN: obj[propName], IP: 0 });
                if (!value())
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
        };
    }
}
function list({ mode, elements }) {
    const elementsLength = elements.length;
    if (isParse(mode)) {
        return function LST() {
            let stateₒ = getState();
            let arr = [];
            for (let i = 0; i < elementsLength; ++i) {
                if (!elements[i]())
                    return setState(stateₒ), false;
                assert(OUT !== undefined);
                arr.push(OUT);
            }
            OUT = arr;
            return true;
        };
    }
    else {
        return function LST() {
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
                if (!elements[i]())
                    return setState(stateₒ), false;
                if (!isInputFullyConsumed())
                    return setState(stateₒ), false;
                text = concat(text, OUT);
            }
            setState({ IN: arr, IP: off + elementsLength });
            OUT = text;
            return true;
        };
    }
}
function record({ mode, fields }) {
    if (isParse(mode)) {
        return function RCD() {
            let stateₒ = getState();
            let obj = {};
            for (let field of fields) {
                let propName = field.name;
                if (!field.value())
                    return setState(stateₒ), false;
                assert(OUT !== undefined);
                obj[propName] = OUT;
            }
            OUT = obj;
            return true;
        };
    }
    else {
        return function RCD() {
            if (objectToString.call(IN) !== '[object Object]')
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
                if (!field.value())
                    return setState(stateₒ), false;
                if (!isInputFullyConsumed())
                    return setState(stateₒ), false;
                text = concat(text, OUT);
                bitmask += propBit;
            }
            setState({ IN: obj, IP: bitmask });
            OUT = text;
            return true;
        };
    }
}
const PARSE = 6;
const PRINT = 7;
const COVAL = 4;
const COGEN = 5;
const ABGEN = 2;
const ABVAL = 3;
const isParse = (mode) => (mode & 1) === 0;
const isPrint = (mode) => (mode & 1) !== 0;
const hasConcreteForm = (mode) => (mode & 4) !== 0;
const hasAbstractForm = (mode) => (mode & 2) !== 0;
const hasInput = (mode) => isParse(mode) ? hasConcreteForm(mode) : hasAbstractForm(mode);
const hasOutput = (mode) => isParse(mode) ? hasAbstractForm(mode) : hasConcreteForm(mode);
function isRule(_x) {
    return true;
}
function isLambda(_x) {
    return true;
}
function isModule(_x) {
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
    let type = objectToString.call(a);
    if (type !== objectToString.call(b))
        throw new Error(`Internal error: invalid sequence`);
    if (type === '[object String]')
        return a + b;
    if (type === '[object Array]')
        return [...a, ...b];
    if (type === '[object Object]')
        return Object.assign(Object.assign({}, a), b);
    throw new Error(`Internal error: invalid sequence`);
}
function isInputFullyConsumed() {
    let type = objectToString.call(IN);
    if (type === '[object String]')
        return IP === IN.length;
    if (type === '[object Array]')
        return IP === IN.length;
    if (type === '[object Object]') {
        let keyCount = Object.keys(IN).length;
        assert(keyCount <= 32);
        if (keyCount === 0)
            return true;
        return IP === -1 >>> (32 - keyCount);
    }
    return IP === 1;
}
const objectToString = Object.prototype.toString;
function zeroOrMore({ expression }) {
    return function O_M() {
        let IPₒ = IP;
        let out;
        do {
            if (!expression())
                break;
            if (IP === IPₒ)
                break;
            out = concat(out, OUT);
        } while (true);
        OUT = out;
        return true;
    };
}
function zeroOrOne({ expression }) {
    return function O_1() {
        if (!expression())
            OUT = undefined;
        return true;
    };
}

// -------------------- Extensions --------------------




// --------------------------------------------------------------------------------
const parse = (() => {

    // -------------------- compile-test-OLD.pen --------------------

    const 𝕊0 = (name) => {
        switch (name) {
            case 'start': return 𝕊0_start;
            case 'expr': return 𝕊0_expr;
            case 'a': return 𝕊0_a;
            case 'b': return 𝕊0_b;
            case 'baz': return 𝕊0_baz;
            case 'modExprMem': return 𝕊0_modExprMem;
            case 'recA': return 𝕊0_recA;
            case 'recB': return 𝕊0_recB;
            case 'refC': return 𝕊0_refC;
            case 'defC': return 𝕊0_defC;
            default: return undefined;
        }
    };

    const 𝕊0_start = (arg) => {
        if (!𝕊0_start_memo) 𝕊0_start_memo = 𝕊0('expr')('foo');
        return 𝕊0_start_memo(arg);
    };
    let 𝕊0_start_memo;

    const 𝕊0_expr = (arg) => {
        if (!𝕊0_expr_memo) 𝕊0_expr_memo = 𝕊1;
        return 𝕊0_expr_memo(arg);
    };
    let 𝕊0_expr_memo;

    const 𝕊1 = (name) => {
        switch (name) {
            case 'foo': return 𝕊1_foo;
            case 'bar': return 𝕊1_bar;
            case 'a': return 𝕊1_a;
            default: return undefined;
        }
    };

    const 𝕊1_foo = (arg) => {
        if (!𝕊1_foo_memo) 𝕊1_foo_memo = function STR() {
            if (IP + 3 > IN.length) return false;
            if (IN.charCodeAt(IP + 0) !== 102) return false;
            if (IN.charCodeAt(IP + 1) !== 111) return false;
            if (IN.charCodeAt(IP + 2) !== 111) return false;
            IP += 3;
            OUT = "foo";
            return true;
        };
        return 𝕊1_foo_memo(arg);
    };
    let 𝕊1_foo_memo;

    const 𝕊1_bar = (arg) => {
        if (!𝕊1_bar_memo) 𝕊1_bar_memo = function STR() {
            if (IP + 3 > IN.length) return false;
            if (IN.charCodeAt(IP + 0) !== 98) return false;
            if (IN.charCodeAt(IP + 1) !== 97) return false;
            if (IN.charCodeAt(IP + 2) !== 114) return false;
            IP += 3;
            OUT = "bar";
            return true;
        };
        return 𝕊1_bar_memo(arg);
    };
    let 𝕊1_bar_memo;

    const 𝕊1_a = (arg) => {
        if (!𝕊1_a_memo) 𝕊1_a_memo = 𝕊0('b');
        return 𝕊1_a_memo(arg);
    };
    let 𝕊1_a_memo;

    const 𝕊0_a = (arg) => {
        if (!𝕊0_a_memo) 𝕊0_a_memo = 𝕊0('b');
        return 𝕊0_a_memo(arg);
    };
    let 𝕊0_a_memo;

    const 𝕊0_b = (arg) => {
        if (!𝕊0_b_memo) 𝕊0_b_memo = function STR() {
            if (IP + 2 > IN.length) return false;
            if (IN.charCodeAt(IP + 0) !== 98) return false;
            if (IN.charCodeAt(IP + 1) !== 50) return false;
            IP += 2;
            OUT = "b2";
            return true;
        };
        return 𝕊0_b_memo(arg);
    };
    let 𝕊0_b_memo;

    const 𝕊0_baz = (arg) => {
        if (!𝕊0_baz_memo) 𝕊0_baz_memo = function STR() {
            if (IP + 3 > IN.length) return false;
            if (IN.charCodeAt(IP + 0) !== 98) return false;
            if (IN.charCodeAt(IP + 1) !== 97) return false;
            if (IN.charCodeAt(IP + 2) !== 122) return false;
            IP += 3;
            OUT = "baz";
            return true;
        };
        return 𝕊0_baz_memo(arg);
    };
    let 𝕊0_baz_memo;

    const 𝕊0_modExprMem = (arg) => {
        if (!𝕊0_modExprMem_memo) 𝕊0_modExprMem_memo = (() => {
            const t2 = 𝕊0('expr')('foo');
            const t3 = 𝕊2('mem');
            const t4 = 𝕊0('baz');
            return function SEL() {
                if (t2()) return true;
                if (t3()) return true;
                if (t4()) return true;
                return false;
            };
        })();
        return 𝕊0_modExprMem_memo(arg);
    };
    let 𝕊0_modExprMem_memo;

    const 𝕊2 = (name) => {
        switch (name) {
            case 'mem': return 𝕊2_mem;
            default: return undefined;
        }
    };

    const 𝕊2_mem = (arg) => {
        if (!𝕊2_mem_memo) 𝕊2_mem_memo = function STR() {
            if (IP + 6 > IN.length) return false;
            if (IN.charCodeAt(IP + 0) !== 109) return false;
            if (IN.charCodeAt(IP + 1) !== 101) return false;
            if (IN.charCodeAt(IP + 2) !== 109) return false;
            if (IN.charCodeAt(IP + 3) !== 98) return false;
            if (IN.charCodeAt(IP + 4) !== 101) return false;
            if (IN.charCodeAt(IP + 5) !== 114) return false;
            IP += 6;
            OUT = "member";
            return true;
        };
        return 𝕊2_mem_memo(arg);
    };
    let 𝕊2_mem_memo;

    const 𝕊0_recA = (arg) => {
        if (!𝕊0_recA_memo) 𝕊0_recA_memo = 𝕊3;
        return 𝕊0_recA_memo(arg);
    };
    let 𝕊0_recA_memo;

    const 𝕊3 = (name) => {
        switch (name) {
            case 'a': return 𝕊3_a;
            default: return undefined;
        }
    };

    const 𝕊3_a = (arg) => {
        if (!𝕊3_a_memo) 𝕊3_a_memo = (() => {
            const t5 = function STR() {
                if (IP + 1 > IN.length) return false;
                if (IN.charCodeAt(IP + 0) !== 97) return false;
                IP += 1;
                OUT = "a";
                return true;
            };
            const t6 = 𝕊0('recB')('b');
            return function SEQ() {
                let stateₒ = getState();
                let out;
                if (t5()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t6()) out = concat(out, OUT); else return setState(stateₒ), false;
                OUT = out;
                return true;
            };
        })();
        return 𝕊3_a_memo(arg);
    };
    let 𝕊3_a_memo;

    const 𝕊0_recB = (arg) => {
        if (!𝕊0_recB_memo) 𝕊0_recB_memo = 𝕊4;
        return 𝕊0_recB_memo(arg);
    };
    let 𝕊0_recB_memo;

    const 𝕊4 = (name) => {
        switch (name) {
            case 'b': return 𝕊4_b;
            default: return undefined;
        }
    };

    const 𝕊4_b = (arg) => {
        if (!𝕊4_b_memo) 𝕊4_b_memo = (() => {
            const t7 = function STR() {
                if (IP + 1 > IN.length) return false;
                if (IN.charCodeAt(IP + 0) !== 98) return false;
                IP += 1;
                OUT = "b";
                return true;
            };
            const t8 = 𝕊0('recA')('a');
            return function SEQ() {
                let stateₒ = getState();
                let out;
                if (t7()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t8()) out = concat(out, OUT); else return setState(stateₒ), false;
                OUT = out;
                return true;
            };
        })();
        return 𝕊4_b_memo(arg);
    };
    let 𝕊4_b_memo;

    const 𝕊0_refC = (arg) => {
        if (!𝕊0_refC_memo) 𝕊0_refC_memo = 𝕊0('defC')('c')('c1');
        return 𝕊0_refC_memo(arg);
    };
    let 𝕊0_refC_memo;

    const 𝕊0_defC = (arg) => {
        if (!𝕊0_defC_memo) 𝕊0_defC_memo = 𝕊5;
        return 𝕊0_defC_memo(arg);
    };
    let 𝕊0_defC_memo;

    const 𝕊5 = (name) => {
        switch (name) {
            case 'c': return 𝕊5_c;
            case 'ref5': return 𝕊5_ref5;
            case 'ref6': return 𝕊5_ref6;
            default: return undefined;
        }
    };

    const 𝕊5_c = (arg) => {
        if (!𝕊5_c_memo) 𝕊5_c_memo = 𝕊6;
        return 𝕊5_c_memo(arg);
    };
    let 𝕊5_c_memo;

    const 𝕊6 = (name) => {
        switch (name) {
            case 'c1': return 𝕊6_c1;
            case 'c2': return 𝕊6_c2;
            case 'ref1': return 𝕊6_ref1;
            case 'ref2': return 𝕊6_ref2;
            case 'ref3': return 𝕊6_ref3;
            default: return undefined;
        }
    };

    const 𝕊6_c1 = (arg) => {
        if (!𝕊6_c1_memo) 𝕊6_c1_memo = function STR() {
            if (IP + 2 > IN.length) return false;
            if (IN.charCodeAt(IP + 0) !== 99) return false;
            if (IN.charCodeAt(IP + 1) !== 49) return false;
            IP += 2;
            OUT = "c1";
            return true;
        };
        return 𝕊6_c1_memo(arg);
    };
    let 𝕊6_c1_memo;

    const 𝕊6_c2 = (arg) => {
        if (!𝕊6_c2_memo) 𝕊6_c2_memo = function STR() {
            if (IP + 2 > IN.length) return false;
            if (IN.charCodeAt(IP + 0) !== 99) return false;
            if (IN.charCodeAt(IP + 1) !== 50) return false;
            IP += 2;
            OUT = "c2";
            return true;
        };
        return 𝕊6_c2_memo(arg);
    };
    let 𝕊6_c2_memo;

    const 𝕊6_ref1 = (arg) => {
        if (!𝕊6_ref1_memo) 𝕊6_ref1_memo = 𝕊6('c1');
        return 𝕊6_ref1_memo(arg);
    };
    let 𝕊6_ref1_memo;

    const 𝕊6_ref2 = (arg) => {
        if (!𝕊6_ref2_memo) 𝕊6_ref2_memo = 𝕊5('c')('c1');
        return 𝕊6_ref2_memo(arg);
    };
    let 𝕊6_ref2_memo;

    const 𝕊6_ref3 = (arg) => {
        if (!𝕊6_ref3_memo) 𝕊6_ref3_memo = 𝕊0('defC')('c')('c1');
        return 𝕊6_ref3_memo(arg);
    };
    let 𝕊6_ref3_memo;

    const 𝕊5_ref5 = (arg) => {
        if (!𝕊5_ref5_memo) 𝕊5_ref5_memo = 𝕊5('c')('c1');
        return 𝕊5_ref5_memo(arg);
    };
    let 𝕊5_ref5_memo;

    const 𝕊5_ref6 = (arg) => {
        if (!𝕊5_ref6_memo) 𝕊5_ref6_memo = 𝕊0('defC')('c')('c1');
        return 𝕊5_ref6_memo(arg);
    };
    let 𝕊5_ref6_memo;

    // -------------------- Compile-time constants --------------------

    return 𝕊0('start');
})();




// --------------------------------------------------------------------------------
const print = (() => {

    // -------------------- compile-test-OLD.pen --------------------

    const 𝕊0 = (name) => {
        switch (name) {
            case 'start': return 𝕊0_start;
            case 'expr': return 𝕊0_expr;
            case 'a': return 𝕊0_a;
            case 'b': return 𝕊0_b;
            case 'baz': return 𝕊0_baz;
            case 'modExprMem': return 𝕊0_modExprMem;
            case 'recA': return 𝕊0_recA;
            case 'recB': return 𝕊0_recB;
            case 'refC': return 𝕊0_refC;
            case 'defC': return 𝕊0_defC;
            default: return undefined;
        }
    };

    const 𝕊0_start = (arg) => {
        if (!𝕊0_start_memo) 𝕊0_start_memo = 𝕊0('expr')('foo');
        return 𝕊0_start_memo(arg);
    };
    let 𝕊0_start_memo;

    const 𝕊0_expr = (arg) => {
        if (!𝕊0_expr_memo) 𝕊0_expr_memo = 𝕊1;
        return 𝕊0_expr_memo(arg);
    };
    let 𝕊0_expr_memo;

    const 𝕊1 = (name) => {
        switch (name) {
            case 'foo': return 𝕊1_foo;
            case 'bar': return 𝕊1_bar;
            case 'a': return 𝕊1_a;
            default: return undefined;
        }
    };

    const 𝕊1_foo = (arg) => {
        if (!𝕊1_foo_memo) 𝕊1_foo_memo = function STR() {
            if (typeof IN !== 'string') return false;
            if (IP + 3 > IN.length) return false;
            if (IN.charCodeAt(IP + 0) !== 102) return false;
            if (IN.charCodeAt(IP + 1) !== 111) return false;
            if (IN.charCodeAt(IP + 2) !== 111) return false;
            IP += 3;
            OUT = "foo";
            return true;
        };
        return 𝕊1_foo_memo(arg);
    };
    let 𝕊1_foo_memo;

    const 𝕊1_bar = (arg) => {
        if (!𝕊1_bar_memo) 𝕊1_bar_memo = function STR() {
            if (typeof IN !== 'string') return false;
            if (IP + 3 > IN.length) return false;
            if (IN.charCodeAt(IP + 0) !== 98) return false;
            if (IN.charCodeAt(IP + 1) !== 97) return false;
            if (IN.charCodeAt(IP + 2) !== 114) return false;
            IP += 3;
            OUT = "bar";
            return true;
        };
        return 𝕊1_bar_memo(arg);
    };
    let 𝕊1_bar_memo;

    const 𝕊1_a = (arg) => {
        if (!𝕊1_a_memo) 𝕊1_a_memo = 𝕊0('b');
        return 𝕊1_a_memo(arg);
    };
    let 𝕊1_a_memo;

    const 𝕊0_a = (arg) => {
        if (!𝕊0_a_memo) 𝕊0_a_memo = 𝕊0('b');
        return 𝕊0_a_memo(arg);
    };
    let 𝕊0_a_memo;

    const 𝕊0_b = (arg) => {
        if (!𝕊0_b_memo) 𝕊0_b_memo = function STR() {
            if (typeof IN !== 'string') return false;
            if (IP + 2 > IN.length) return false;
            if (IN.charCodeAt(IP + 0) !== 98) return false;
            if (IN.charCodeAt(IP + 1) !== 50) return false;
            IP += 2;
            OUT = "b2";
            return true;
        };
        return 𝕊0_b_memo(arg);
    };
    let 𝕊0_b_memo;

    const 𝕊0_baz = (arg) => {
        if (!𝕊0_baz_memo) 𝕊0_baz_memo = function STR() {
            if (typeof IN !== 'string') return false;
            if (IP + 3 > IN.length) return false;
            if (IN.charCodeAt(IP + 0) !== 98) return false;
            if (IN.charCodeAt(IP + 1) !== 97) return false;
            if (IN.charCodeAt(IP + 2) !== 122) return false;
            IP += 3;
            OUT = "baz";
            return true;
        };
        return 𝕊0_baz_memo(arg);
    };
    let 𝕊0_baz_memo;

    const 𝕊0_modExprMem = (arg) => {
        if (!𝕊0_modExprMem_memo) 𝕊0_modExprMem_memo = (() => {
            const t9 = 𝕊0('expr')('foo');
            const t10 = 𝕊2('mem');
            const t11 = 𝕊0('baz');
            return function SEL() {
                if (t9()) return true;
                if (t10()) return true;
                if (t11()) return true;
                return false;
            };
        })();
        return 𝕊0_modExprMem_memo(arg);
    };
    let 𝕊0_modExprMem_memo;

    const 𝕊2 = (name) => {
        switch (name) {
            case 'mem': return 𝕊2_mem;
            default: return undefined;
        }
    };

    const 𝕊2_mem = (arg) => {
        if (!𝕊2_mem_memo) 𝕊2_mem_memo = function STR() {
            if (typeof IN !== 'string') return false;
            if (IP + 6 > IN.length) return false;
            if (IN.charCodeAt(IP + 0) !== 109) return false;
            if (IN.charCodeAt(IP + 1) !== 101) return false;
            if (IN.charCodeAt(IP + 2) !== 109) return false;
            if (IN.charCodeAt(IP + 3) !== 98) return false;
            if (IN.charCodeAt(IP + 4) !== 101) return false;
            if (IN.charCodeAt(IP + 5) !== 114) return false;
            IP += 6;
            OUT = "member";
            return true;
        };
        return 𝕊2_mem_memo(arg);
    };
    let 𝕊2_mem_memo;

    const 𝕊0_recA = (arg) => {
        if (!𝕊0_recA_memo) 𝕊0_recA_memo = 𝕊3;
        return 𝕊0_recA_memo(arg);
    };
    let 𝕊0_recA_memo;

    const 𝕊3 = (name) => {
        switch (name) {
            case 'a': return 𝕊3_a;
            default: return undefined;
        }
    };

    const 𝕊3_a = (arg) => {
        if (!𝕊3_a_memo) 𝕊3_a_memo = (() => {
            const t12 = function STR() {
                if (typeof IN !== 'string') return false;
                if (IP + 1 > IN.length) return false;
                if (IN.charCodeAt(IP + 0) !== 97) return false;
                IP += 1;
                OUT = "a";
                return true;
            };
            const t13 = 𝕊0('recB')('b');
            return function SEQ() {
                let stateₒ = getState();
                let out;
                if (t12()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t13()) out = concat(out, OUT); else return setState(stateₒ), false;
                OUT = out;
                return true;
            };
        })();
        return 𝕊3_a_memo(arg);
    };
    let 𝕊3_a_memo;

    const 𝕊0_recB = (arg) => {
        if (!𝕊0_recB_memo) 𝕊0_recB_memo = 𝕊4;
        return 𝕊0_recB_memo(arg);
    };
    let 𝕊0_recB_memo;

    const 𝕊4 = (name) => {
        switch (name) {
            case 'b': return 𝕊4_b;
            default: return undefined;
        }
    };

    const 𝕊4_b = (arg) => {
        if (!𝕊4_b_memo) 𝕊4_b_memo = (() => {
            const t14 = function STR() {
                if (typeof IN !== 'string') return false;
                if (IP + 1 > IN.length) return false;
                if (IN.charCodeAt(IP + 0) !== 98) return false;
                IP += 1;
                OUT = "b";
                return true;
            };
            const t15 = 𝕊0('recA')('a');
            return function SEQ() {
                let stateₒ = getState();
                let out;
                if (t14()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t15()) out = concat(out, OUT); else return setState(stateₒ), false;
                OUT = out;
                return true;
            };
        })();
        return 𝕊4_b_memo(arg);
    };
    let 𝕊4_b_memo;

    const 𝕊0_refC = (arg) => {
        if (!𝕊0_refC_memo) 𝕊0_refC_memo = 𝕊0('defC')('c')('c1');
        return 𝕊0_refC_memo(arg);
    };
    let 𝕊0_refC_memo;

    const 𝕊0_defC = (arg) => {
        if (!𝕊0_defC_memo) 𝕊0_defC_memo = 𝕊5;
        return 𝕊0_defC_memo(arg);
    };
    let 𝕊0_defC_memo;

    const 𝕊5 = (name) => {
        switch (name) {
            case 'c': return 𝕊5_c;
            case 'ref5': return 𝕊5_ref5;
            case 'ref6': return 𝕊5_ref6;
            default: return undefined;
        }
    };

    const 𝕊5_c = (arg) => {
        if (!𝕊5_c_memo) 𝕊5_c_memo = 𝕊6;
        return 𝕊5_c_memo(arg);
    };
    let 𝕊5_c_memo;

    const 𝕊6 = (name) => {
        switch (name) {
            case 'c1': return 𝕊6_c1;
            case 'c2': return 𝕊6_c2;
            case 'ref1': return 𝕊6_ref1;
            case 'ref2': return 𝕊6_ref2;
            case 'ref3': return 𝕊6_ref3;
            default: return undefined;
        }
    };

    const 𝕊6_c1 = (arg) => {
        if (!𝕊6_c1_memo) 𝕊6_c1_memo = function STR() {
            if (typeof IN !== 'string') return false;
            if (IP + 2 > IN.length) return false;
            if (IN.charCodeAt(IP + 0) !== 99) return false;
            if (IN.charCodeAt(IP + 1) !== 49) return false;
            IP += 2;
            OUT = "c1";
            return true;
        };
        return 𝕊6_c1_memo(arg);
    };
    let 𝕊6_c1_memo;

    const 𝕊6_c2 = (arg) => {
        if (!𝕊6_c2_memo) 𝕊6_c2_memo = function STR() {
            if (typeof IN !== 'string') return false;
            if (IP + 2 > IN.length) return false;
            if (IN.charCodeAt(IP + 0) !== 99) return false;
            if (IN.charCodeAt(IP + 1) !== 50) return false;
            IP += 2;
            OUT = "c2";
            return true;
        };
        return 𝕊6_c2_memo(arg);
    };
    let 𝕊6_c2_memo;

    const 𝕊6_ref1 = (arg) => {
        if (!𝕊6_ref1_memo) 𝕊6_ref1_memo = 𝕊6('c1');
        return 𝕊6_ref1_memo(arg);
    };
    let 𝕊6_ref1_memo;

    const 𝕊6_ref2 = (arg) => {
        if (!𝕊6_ref2_memo) 𝕊6_ref2_memo = 𝕊5('c')('c1');
        return 𝕊6_ref2_memo(arg);
    };
    let 𝕊6_ref2_memo;

    const 𝕊6_ref3 = (arg) => {
        if (!𝕊6_ref3_memo) 𝕊6_ref3_memo = 𝕊0('defC')('c')('c1');
        return 𝕊6_ref3_memo(arg);
    };
    let 𝕊6_ref3_memo;

    const 𝕊5_ref5 = (arg) => {
        if (!𝕊5_ref5_memo) 𝕊5_ref5_memo = 𝕊5('c')('c1');
        return 𝕊5_ref5_memo(arg);
    };
    let 𝕊5_ref5_memo;

    const 𝕊5_ref6 = (arg) => {
        if (!𝕊5_ref6_memo) 𝕊5_ref6_memo = 𝕊0('defC')('c')('c1');
        return 𝕊5_ref6_memo(arg);
    };
    let 𝕊5_ref6_memo;

    // -------------------- Compile-time constants --------------------

    return 𝕊0('start');
})();

// -------------------- Main exports --------------------
module.exports = {
    parse(text) {
        setState({ IN: text, IP: 0 });
        if (!parse()) throw new Error('parse failed');
        if (!isInputFullyConsumed()) throw new Error('parse didn\'t consume entire input');
        if (OUT === undefined) throw new Error('parse didn\'t return a value');
        return OUT;
    },
    print(node) {
        setState({ IN: node, IP: 0 });
        if (!print()) throw new Error('print failed');
        if (!isInputFullyConsumed()) throw new Error('print didn\'t consume entire input');
        if (OUT === undefined) throw new Error('print didn\'t return a value');
        return OUT;
    },
};
