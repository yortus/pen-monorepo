
"use strict";
function booleanLiteral(options) {
    const { value } = options;
    const out = options.outForm === 'ast' ? value : undefined;
    if (options.inForm !== 'ast') {
        return function BOO() { return OUT = out, true; };
    }
    return function BOO() {
        if (IN !== value || IP !== 0)
            return false;
        IP += 1;
        OUT = out;
        return true;
    };
}
function createMainExports(createProgram) {
    const parse = createProgram({ inForm: 'txt', outForm: 'ast' });
    const print = createProgram({ inForm: 'ast', outForm: 'txt' });
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
    if (options.inForm === 'ast' || options.outForm === 'txt') {
        return function FLD() {
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
    throw new Error(`Unsupported operation '${options.inForm}'->'${options.outForm}'`);
}
function list(options) {
    const { elements } = options;
    const elementsLength = elements.length;
    if (options.inForm === 'txt' || options.outForm === 'ast') {
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
    if (options.inForm === 'ast' || options.outForm === 'txt') {
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
    throw new Error(`Unsupported operation '${options.inForm}'->'${options.outForm}'`);
}
function not(options) {
    const { expression } = options;
    return function NOT() {
        let stateₒ = getState();
        let result = !expression();
        setState(stateₒ);
        OUT = undefined;
        return result;
    };
}
function nullLiteral(options) {
    const out = options.outForm === 'ast' ? null : undefined;
    if (options.inForm !== 'ast') {
        return function NUL() { return OUT = out, true; };
    }
    return function NUL() {
        if (IN !== null || IP !== 0)
            return false;
        IP = 1;
        OUT = out;
        return true;
    };
}
function numericLiteral(options) {
    const { value } = options;
    const out = options.outForm === 'ast' ? value : undefined;
    if (options.inForm !== 'ast') {
        return function NUM() { return OUT = out, true; };
    }
    return function NUM() {
        if (IN !== value || IP !== 0)
            return false;
        IP = 1;
        OUT = out;
        return true;
    };
}
function record(options) {
    const { fields } = options;
    if (options.inForm === 'txt' || options.outForm === 'ast') {
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
    if (options.inForm === 'ast' || options.outForm === 'txt') {
        return function RCD() {
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
    throw new Error(`Unsupported operation '${options.inForm}'->'${options.outForm}'`);
}
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
    return function O_M() {
        let stateₒ = getState();
        let out;
        while (true) {
            if (!expression())
                break;
            if (IP === stateₒ.IP)
                break;
            out = concat(out, OUT);
        }
        OUT = out;
        return true;
    };
}
function zeroOrOne(options) {
    const { expression } = options;
    return function O_1() {
        if (!expression())
            OUT = undefined;
        return true;
    };
}

// -------------------- Extensions --------------------

function createProgram({inForm, outForm}) {

    // -------------------- compile-test.pen --------------------

    function 𝕊0(name) {
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
    }

    function 𝕊0_start(arg) {
        if (!𝕊0_start_memo) 𝕊0_start_memo = 𝕊0('expr')('foo');
        return 𝕊0_start_memo(arg);
    }
    let 𝕊0_start_memo;

    function 𝕊0_expr(arg) {
        if (!𝕊0_expr_memo) 𝕊0_expr_memo = 𝕊1;
        return 𝕊0_expr_memo(arg);
    }
    let 𝕊0_expr_memo;

    function 𝕊0_a(arg) {
        if (!𝕊0_a_memo) 𝕊0_a_memo = 𝕊0('b');
        return 𝕊0_a_memo(arg);
    }
    let 𝕊0_a_memo;

    function 𝕊0_b(arg) {
        if (!𝕊0_b_memo) 𝕊0_b_memo = (() => {
            const inFormHere = inForm
            const outFormHere = outForm
            const checkInType = inFormHere !== 'txt';
            const out = outFormHere === 'nil' ? undefined : "b2";
            if (inFormHere === 'nil') return function STR() { OUT = out; return true; }
            return function STR() {
                if (checkInType && typeof IN !== 'string') return false;
                if (IP + 2 > IN.length) return false;
                if (IN.charCodeAt(IP + 0) !== 98) return false;
                if (IN.charCodeAt(IP + 1) !== 50) return false;
                IP += 2;
                OUT = out;
                return true;
            }
        })();
        return 𝕊0_b_memo(arg);
    }
    let 𝕊0_b_memo;

    function 𝕊0_baz(arg) {
        if (!𝕊0_baz_memo) 𝕊0_baz_memo = (() => {
            const inFormHere = inForm
            const outFormHere = outForm
            const checkInType = inFormHere !== 'txt';
            const out = outFormHere === 'nil' ? undefined : "baz";
            if (inFormHere === 'nil') return function STR() { OUT = out; return true; }
            return function STR() {
                if (checkInType && typeof IN !== 'string') return false;
                if (IP + 3 > IN.length) return false;
                if (IN.charCodeAt(IP + 0) !== 98) return false;
                if (IN.charCodeAt(IP + 1) !== 97) return false;
                if (IN.charCodeAt(IP + 2) !== 122) return false;
                IP += 3;
                OUT = out;
                return true;
            }
        })();
        return 𝕊0_baz_memo(arg);
    }
    let 𝕊0_baz_memo;

    function 𝕊0_modExprMem(arg) {
        if (!𝕊0_modExprMem_memo) 𝕊0_modExprMem_memo = (() => {
            let expr0 = 𝕊0('expr')('foo');
            let expr1 = 𝕊2('mem');
            let expr2 = 𝕊0('baz');
            return function SEL() {
                if (expr0()) return true;
                if (expr1()) return true;
                if (expr2()) return true;
                return false;
            }
        })();
        return 𝕊0_modExprMem_memo(arg);
    }
    let 𝕊0_modExprMem_memo;

    function 𝕊0_recA(arg) {
        if (!𝕊0_recA_memo) 𝕊0_recA_memo = 𝕊3;
        return 𝕊0_recA_memo(arg);
    }
    let 𝕊0_recA_memo;

    function 𝕊0_recB(arg) {
        if (!𝕊0_recB_memo) 𝕊0_recB_memo = 𝕊4;
        return 𝕊0_recB_memo(arg);
    }
    let 𝕊0_recB_memo;

    function 𝕊0_refC(arg) {
        if (!𝕊0_refC_memo) 𝕊0_refC_memo = 𝕊0('defC')('c')('c1');
        return 𝕊0_refC_memo(arg);
    }
    let 𝕊0_refC_memo;

    function 𝕊0_defC(arg) {
        if (!𝕊0_defC_memo) 𝕊0_defC_memo = 𝕊5;
        return 𝕊0_defC_memo(arg);
    }
    let 𝕊0_defC_memo;

    function 𝕊1(name) {
        switch (name) {
            case 'foo': return 𝕊1_foo;
            case 'bar': return 𝕊1_bar;
            case 'a': return 𝕊1_a;
            default: return undefined;
        }
    }

    function 𝕊1_foo(arg) {
        if (!𝕊1_foo_memo) 𝕊1_foo_memo = (() => {
            const inFormHere = inForm
            const outFormHere = outForm
            const checkInType = inFormHere !== 'txt';
            const out = outFormHere === 'nil' ? undefined : "foo";
            if (inFormHere === 'nil') return function STR() { OUT = out; return true; }
            return function STR() {
                if (checkInType && typeof IN !== 'string') return false;
                if (IP + 3 > IN.length) return false;
                if (IN.charCodeAt(IP + 0) !== 102) return false;
                if (IN.charCodeAt(IP + 1) !== 111) return false;
                if (IN.charCodeAt(IP + 2) !== 111) return false;
                IP += 3;
                OUT = out;
                return true;
            }
        })();
        return 𝕊1_foo_memo(arg);
    }
    let 𝕊1_foo_memo;

    function 𝕊1_bar(arg) {
        if (!𝕊1_bar_memo) 𝕊1_bar_memo = (() => {
            const inFormHere = inForm
            const outFormHere = outForm
            const checkInType = inFormHere !== 'txt';
            const out = outFormHere === 'nil' ? undefined : "bar";
            if (inFormHere === 'nil') return function STR() { OUT = out; return true; }
            return function STR() {
                if (checkInType && typeof IN !== 'string') return false;
                if (IP + 3 > IN.length) return false;
                if (IN.charCodeAt(IP + 0) !== 98) return false;
                if (IN.charCodeAt(IP + 1) !== 97) return false;
                if (IN.charCodeAt(IP + 2) !== 114) return false;
                IP += 3;
                OUT = out;
                return true;
            }
        })();
        return 𝕊1_bar_memo(arg);
    }
    let 𝕊1_bar_memo;

    function 𝕊1_a(arg) {
        if (!𝕊1_a_memo) 𝕊1_a_memo = 𝕊0('b');
        return 𝕊1_a_memo(arg);
    }
    let 𝕊1_a_memo;

    function 𝕊2(name) {
        switch (name) {
            case 'mem': return 𝕊2_mem;
            default: return undefined;
        }
    }

    function 𝕊2_mem(arg) {
        if (!𝕊2_mem_memo) 𝕊2_mem_memo = (() => {
            const inFormHere = inForm
            const outFormHere = outForm
            const checkInType = inFormHere !== 'txt';
            const out = outFormHere === 'nil' ? undefined : "member";
            if (inFormHere === 'nil') return function STR() { OUT = out; return true; }
            return function STR() {
                if (checkInType && typeof IN !== 'string') return false;
                if (IP + 6 > IN.length) return false;
                if (IN.charCodeAt(IP + 0) !== 109) return false;
                if (IN.charCodeAt(IP + 1) !== 101) return false;
                if (IN.charCodeAt(IP + 2) !== 109) return false;
                if (IN.charCodeAt(IP + 3) !== 98) return false;
                if (IN.charCodeAt(IP + 4) !== 101) return false;
                if (IN.charCodeAt(IP + 5) !== 114) return false;
                IP += 6;
                OUT = out;
                return true;
            }
        })();
        return 𝕊2_mem_memo(arg);
    }
    let 𝕊2_mem_memo;

    function 𝕊3(name) {
        switch (name) {
            case 'a': return 𝕊3_a;
            default: return undefined;
        }
    }

    function 𝕊3_a(arg) {
        if (!𝕊3_a_memo) 𝕊3_a_memo = 𝕊0('recB')('b');
        return 𝕊3_a_memo(arg);
    }
    let 𝕊3_a_memo;

    function 𝕊4(name) {
        switch (name) {
            case 'b': return 𝕊4_b;
            default: return undefined;
        }
    }

    function 𝕊4_b(arg) {
        if (!𝕊4_b_memo) 𝕊4_b_memo = 𝕊0('recA')('a');
        return 𝕊4_b_memo(arg);
    }
    let 𝕊4_b_memo;

    function 𝕊5(name) {
        switch (name) {
            case 'c': return 𝕊5_c;
            case 'ref5': return 𝕊5_ref5;
            case 'ref6': return 𝕊5_ref6;
            default: return undefined;
        }
    }

    function 𝕊5_c(arg) {
        if (!𝕊5_c_memo) 𝕊5_c_memo = 𝕊6;
        return 𝕊5_c_memo(arg);
    }
    let 𝕊5_c_memo;

    function 𝕊5_ref5(arg) {
        if (!𝕊5_ref5_memo) 𝕊5_ref5_memo = 𝕊5('c')('c1');
        return 𝕊5_ref5_memo(arg);
    }
    let 𝕊5_ref5_memo;

    function 𝕊5_ref6(arg) {
        if (!𝕊5_ref6_memo) 𝕊5_ref6_memo = 𝕊0('defC')('c')('c1');
        return 𝕊5_ref6_memo(arg);
    }
    let 𝕊5_ref6_memo;

    function 𝕊6(name) {
        switch (name) {
            case 'c1': return 𝕊6_c1;
            case 'c2': return 𝕊6_c2;
            case 'ref1': return 𝕊6_ref1;
            case 'ref2': return 𝕊6_ref2;
            case 'ref3': return 𝕊6_ref3;
            default: return undefined;
        }
    }

    function 𝕊6_c1(arg) {
        if (!𝕊6_c1_memo) 𝕊6_c1_memo = (() => {
            const inFormHere = inForm
            const outFormHere = outForm
            const checkInType = inFormHere !== 'txt';
            const out = outFormHere === 'nil' ? undefined : "c1";
            if (inFormHere === 'nil') return function STR() { OUT = out; return true; }
            return function STR() {
                if (checkInType && typeof IN !== 'string') return false;
                if (IP + 2 > IN.length) return false;
                if (IN.charCodeAt(IP + 0) !== 99) return false;
                if (IN.charCodeAt(IP + 1) !== 49) return false;
                IP += 2;
                OUT = out;
                return true;
            }
        })();
        return 𝕊6_c1_memo(arg);
    }
    let 𝕊6_c1_memo;

    function 𝕊6_c2(arg) {
        if (!𝕊6_c2_memo) 𝕊6_c2_memo = (() => {
            const inFormHere = inForm
            const outFormHere = outForm
            const checkInType = inFormHere !== 'txt';
            const out = outFormHere === 'nil' ? undefined : "c2";
            if (inFormHere === 'nil') return function STR() { OUT = out; return true; }
            return function STR() {
                if (checkInType && typeof IN !== 'string') return false;
                if (IP + 2 > IN.length) return false;
                if (IN.charCodeAt(IP + 0) !== 99) return false;
                if (IN.charCodeAt(IP + 1) !== 50) return false;
                IP += 2;
                OUT = out;
                return true;
            }
        })();
        return 𝕊6_c2_memo(arg);
    }
    let 𝕊6_c2_memo;

    function 𝕊6_ref1(arg) {
        if (!𝕊6_ref1_memo) 𝕊6_ref1_memo = 𝕊6('c1');
        return 𝕊6_ref1_memo(arg);
    }
    let 𝕊6_ref1_memo;

    function 𝕊6_ref2(arg) {
        if (!𝕊6_ref2_memo) 𝕊6_ref2_memo = 𝕊5('c')('c1');
        return 𝕊6_ref2_memo(arg);
    }
    let 𝕊6_ref2_memo;

    function 𝕊6_ref3(arg) {
        if (!𝕊6_ref3_memo) 𝕊6_ref3_memo = 𝕊0('defC')('c')('c1');
        return 𝕊6_ref3_memo(arg);
    }
    let 𝕊6_ref3_memo;

    // -------------------- Compile-time constants --------------------
    𝕊0('b').constant = {value: "b2"};
    𝕊0('baz').constant = {value: "baz"};
    𝕊1('foo').constant = {value: "foo"};
    𝕊1('bar').constant = {value: "bar"};
    𝕊2('mem').constant = {value: "member"};
    𝕊6('c1').constant = {value: "c1"};
    𝕊6('c2').constant = {value: "c2"};

    return 𝕊0('start');
}

// -------------------- Main exports --------------------
module.exports = createMainExports(createProgram);
