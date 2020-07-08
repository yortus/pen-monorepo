
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

    // -------------------- compile-test.pen --------------------

    const 𝕊0 = (name) => {
        switch (name) {
            case 'start': return 𝕊0_start;
            case 'x': return 𝕊0_x;
            case 'a': return 𝕊0_a;
            case 'b': return 𝕊0_b;
            case 'c': return 𝕊0_c;
            default: return undefined;
        }
    };

    const 𝕊0_start = (arg) => {
        if (!𝕊0_start_memo) 𝕊0_start_memo = (() => {
            const t0 = 𝕊0('x');
            const t1 = 𝕊0('a');
            const t2 = 𝕊0('b');
            const t3 = 𝕊0('c');
            return function SEQ() {
                let stateₒ = getState();
                let out;
                if (t0()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t1()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t2()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t3()) out = concat(out, OUT); else return setState(stateₒ), false;
                OUT = out;
                return true;
            };
        })();
        return 𝕊0_start_memo(arg);
    };
    let 𝕊0_start_memo;

    const 𝕊0_x = (arg) => {
        if (!𝕊0_x_memo) 𝕊0_x_memo = 𝕊1;
        return 𝕊0_x_memo(arg);
    };
    let 𝕊0_x_memo;

    const 𝕊1 = (name) => {
        switch (name) {
            case 'x1': return 𝕊1_x1;
            default: return undefined;
        }
    };

    const 𝕊1_x1 = (arg) => {
        if (!𝕊1_x1_memo) 𝕊1_x1_memo = (() => {
            const t4 = 𝕊0('x')('x1');
            const t5 = function STR() {
                if (IP + 4 > IN.length) return false;
                if (IN.charCodeAt(IP + 0) !== 114) return false;
                if (IN.charCodeAt(IP + 1) !== 101) return false;
                if (IN.charCodeAt(IP + 2) !== 115) return false;
                if (IN.charCodeAt(IP + 3) !== 116) return false;
                IP += 4;
                OUT = "rest";
                return true;
            };
            return function SEQ() {
                let stateₒ = getState();
                let out;
                if (t4()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t5()) out = concat(out, OUT); else return setState(stateₒ), false;
                OUT = out;
                return true;
            };
        })();
        return 𝕊1_x1_memo(arg);
    };
    let 𝕊1_x1_memo;

    const 𝕊0_a = (arg) => {
        if (!𝕊0_a_memo) 𝕊0_a_memo = function STR() {
            if (IP + 3 > IN.length) return false;
            if (IN.charCodeAt(IP + 0) !== 97) return false;
            if (IN.charCodeAt(IP + 1) !== 97) return false;
            if (IN.charCodeAt(IP + 2) !== 97) return false;
            IP += 3;
            OUT = "aaa";
            return true;
        };
        return 𝕊0_a_memo(arg);
    };
    let 𝕊0_a_memo;

    const 𝕊0_b = (arg) => {
        if (!𝕊0_b_memo) 𝕊0_b_memo = (() => {
            const t6 = function STR() {
                if (IP + 3 > IN.length) return false;
                if (IN.charCodeAt(IP + 0) !== 112) return false;
                if (IN.charCodeAt(IP + 1) !== 114) return false;
                if (IN.charCodeAt(IP + 2) !== 101) return false;
                IP += 3;
                OUT = "pre";
                return true;
            };
            const t7 = 𝕊0('c');
            return function SEQ() {
                let stateₒ = getState();
                let out;
                if (t6()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t7()) out = concat(out, OUT); else return setState(stateₒ), false;
                OUT = out;
                return true;
            };
        })();
        return 𝕊0_b_memo(arg);
    };
    let 𝕊0_b_memo;

    const 𝕊0_c = (arg) => {
        if (!𝕊0_c_memo) 𝕊0_c_memo = (() => {
            const t8 = function STR() {
                if (IP + 3 > IN.length) return false;
                if (IN.charCodeAt(IP + 0) !== 112) return false;
                if (IN.charCodeAt(IP + 1) !== 114) return false;
                if (IN.charCodeAt(IP + 2) !== 101) return false;
                IP += 3;
                OUT = "pre";
                return true;
            };
            const t9 = 𝕊0('b');
            return function SEQ() {
                let stateₒ = getState();
                let out;
                if (t8()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t9()) out = concat(out, OUT); else return setState(stateₒ), false;
                OUT = out;
                return true;
            };
        })();
        return 𝕊0_c_memo(arg);
    };
    let 𝕊0_c_memo;

    // -------------------- Compile-time constants --------------------
    𝕊0('a').constant = {value: "aaa"};

    return 𝕊0('start');
})();




// --------------------------------------------------------------------------------
const print = (() => {

    // -------------------- compile-test.pen --------------------

    const 𝕊0 = (name) => {
        switch (name) {
            case 'start': return 𝕊0_start;
            case 'x': return 𝕊0_x;
            case 'a': return 𝕊0_a;
            case 'b': return 𝕊0_b;
            case 'c': return 𝕊0_c;
            default: return undefined;
        }
    };

    const 𝕊0_start = (arg) => {
        if (!𝕊0_start_memo) 𝕊0_start_memo = (() => {
            const t10 = 𝕊0('x');
            const t11 = 𝕊0('a');
            const t12 = 𝕊0('b');
            const t13 = 𝕊0('c');
            return function SEQ() {
                let stateₒ = getState();
                let out;
                if (t10()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t11()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t12()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t13()) out = concat(out, OUT); else return setState(stateₒ), false;
                OUT = out;
                return true;
            };
        })();
        return 𝕊0_start_memo(arg);
    };
    let 𝕊0_start_memo;

    const 𝕊0_x = (arg) => {
        if (!𝕊0_x_memo) 𝕊0_x_memo = 𝕊1;
        return 𝕊0_x_memo(arg);
    };
    let 𝕊0_x_memo;

    const 𝕊1 = (name) => {
        switch (name) {
            case 'x1': return 𝕊1_x1;
            default: return undefined;
        }
    };

    const 𝕊1_x1 = (arg) => {
        if (!𝕊1_x1_memo) 𝕊1_x1_memo = (() => {
            const t14 = 𝕊0('x')('x1');
            const t15 = function STR() {
                if (typeof IN !== 'string') return false;
                if (IP + 4 > IN.length) return false;
                if (IN.charCodeAt(IP + 0) !== 114) return false;
                if (IN.charCodeAt(IP + 1) !== 101) return false;
                if (IN.charCodeAt(IP + 2) !== 115) return false;
                if (IN.charCodeAt(IP + 3) !== 116) return false;
                IP += 4;
                OUT = "rest";
                return true;
            };
            return function SEQ() {
                let stateₒ = getState();
                let out;
                if (t14()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t15()) out = concat(out, OUT); else return setState(stateₒ), false;
                OUT = out;
                return true;
            };
        })();
        return 𝕊1_x1_memo(arg);
    };
    let 𝕊1_x1_memo;

    const 𝕊0_a = (arg) => {
        if (!𝕊0_a_memo) 𝕊0_a_memo = function STR() {
            if (typeof IN !== 'string') return false;
            if (IP + 3 > IN.length) return false;
            if (IN.charCodeAt(IP + 0) !== 97) return false;
            if (IN.charCodeAt(IP + 1) !== 97) return false;
            if (IN.charCodeAt(IP + 2) !== 97) return false;
            IP += 3;
            OUT = "aaa";
            return true;
        };
        return 𝕊0_a_memo(arg);
    };
    let 𝕊0_a_memo;

    const 𝕊0_b = (arg) => {
        if (!𝕊0_b_memo) 𝕊0_b_memo = (() => {
            const t16 = function STR() {
                if (typeof IN !== 'string') return false;
                if (IP + 3 > IN.length) return false;
                if (IN.charCodeAt(IP + 0) !== 112) return false;
                if (IN.charCodeAt(IP + 1) !== 114) return false;
                if (IN.charCodeAt(IP + 2) !== 101) return false;
                IP += 3;
                OUT = "pre";
                return true;
            };
            const t17 = 𝕊0('c');
            return function SEQ() {
                let stateₒ = getState();
                let out;
                if (t16()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t17()) out = concat(out, OUT); else return setState(stateₒ), false;
                OUT = out;
                return true;
            };
        })();
        return 𝕊0_b_memo(arg);
    };
    let 𝕊0_b_memo;

    const 𝕊0_c = (arg) => {
        if (!𝕊0_c_memo) 𝕊0_c_memo = (() => {
            const t18 = function STR() {
                if (typeof IN !== 'string') return false;
                if (IP + 3 > IN.length) return false;
                if (IN.charCodeAt(IP + 0) !== 112) return false;
                if (IN.charCodeAt(IP + 1) !== 114) return false;
                if (IN.charCodeAt(IP + 2) !== 101) return false;
                IP += 3;
                OUT = "pre";
                return true;
            };
            const t19 = 𝕊0('b');
            return function SEQ() {
                let stateₒ = getState();
                let out;
                if (t18()) out = concat(out, OUT); else return setState(stateₒ), false;
                if (t19()) out = concat(out, OUT); else return setState(stateₒ), false;
                OUT = out;
                return true;
            };
        })();
        return 𝕊0_c_memo(arg);
    };
    let 𝕊0_c_memo;

    // -------------------- Compile-time constants --------------------
    𝕊0('a').constant = {value: "aaa"};

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
