// ------------------------------ Main exports ------------------------------
module.exports = {
    parse(text) {
        setState({ IN: text, IP: 0 });
        HAS_IN = HAS_OUT = true;
        if (!parse()) throw new Error('parse failed');
        if (!isInputFullyConsumed()) throw new Error('parse didn\'t consume entire input');
        if (OUT === undefined) throw new Error('parse didn\'t return a value');
        return OUT;
    },
    print(node) {
        setState({ IN: node, IP: 0 });
        HAS_IN = HAS_OUT = true;
        if (!print()) throw new Error('print failed');
        if (!isInputFullyConsumed()) throw new Error('print didn\'t consume entire input');
        if (OUT === undefined) throw new Error('print didn\'t return a value');
        return OUT;
    },
};




// ------------------------------ Runtime ------------------------------
"use strict";
function parseField(name, value) {
    const stateₒ = getState();
    const obj = {};
    if (!name())
        return false;
    assert(typeof OUT === 'string');
    const propName = OUT;
    if (!value())
        return setState(stateₒ), false;
    assert(OUT !== undefined);
    obj[propName] = OUT;
    OUT = obj;
    return true;
}
function printField(name, value) {
    if (objectToString.call(IN) !== '[object Object]')
        return false;
    const stateₒ = getState();
    let text;
    const propNames = Object.keys(IN);
    const propCount = propNames.length;
    assert(propCount <= 32);
    const obj = IN;
    let bitmask = IP;
    for (let i = 0; i < propCount; ++i) {
        const propName = propNames[i];
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
}
function parseList(items) {
    const itemsLength = items.length;
    const stateₒ = getState();
    const arr = [];
    for (let i = 0; i < itemsLength; ++i) {
        const item = items[i];
        if (item.kind === 'ListElement') {
            if (!item.expr())
                return setState(stateₒ), false;
            assert(OUT !== undefined);
            arr.push(OUT);
        }
        else {
            if (!item.expr())
                return setState(stateₒ), false;
            assert(Array.isArray(OUT));
            arr.push(...OUT);
        }
    }
    OUT = arr;
    return true;
}
function printList(items) {
    const itemsLength = items.length;
    if (!Array.isArray(IN))
        return false;
    const stateₒ = getState();
    let text;
    const arr = IN;
    let off = IP;
    for (let i = 0; i < itemsLength; ++i) {
        const item = items[i];
        if (item.kind === 'ListElement') {
            setState({ IN: arr[off], IP: 0 });
            if (!item.expr())
                return setState(stateₒ), false;
            if (!isInputFullyConsumed())
                return setState(stateₒ), false;
            text = concat(text, OUT);
            off += 1;
        }
        else {
            setState({ IN: arr, IP: off });
            if (!item.expr())
                return setState(stateₒ), false;
            text = concat(text, OUT);
            off = IP;
        }
    }
    setState({ IN: arr, IP: off });
    OUT = text;
    return true;
}
function parseRecord(fields) {
    const stateₒ = getState();
    const obj = {};
    for (const field of fields) {
        const propName = field.name;
        if (!field.value())
            return setState(stateₒ), false;
        assert(OUT !== undefined);
        obj[propName] = OUT;
    }
    OUT = obj;
    return true;
}
function printRecord(fields) {
    if (objectToString.call(IN) !== '[object Object]')
        return false;
    const stateₒ = getState();
    let text;
    const propNames = Object.keys(IN);
    const propCount = propNames.length;
    assert(propCount <= 32);
    const obj = IN;
    let bitmask = IP;
    for (const field of fields) {
        const i = propNames.indexOf(field.name);
        if (i < 0)
            return setState(stateₒ), false;
        const propName = propNames[i];
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
}
function isRule(_x) {
    return true;
}
function isGeneric(_x) {
    return true;
}
function isModule(_x) {
    return true;
}
let IN;
let IP;
let OUT;
let HAS_IN;
let HAS_OUT;
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
    const type = objectToString.call(a);
    if (type !== objectToString.call(b))
        throw new Error(`Internal error: invalid sequence`);
    if (type === '[object String]')
        return a + b;
    if (type === '[object Object]')
        return Object.assign(Object.assign({}, a), b);
    throw new Error(`Internal error: invalid sequence`);
}
function isInputFullyConsumed() {
    const type = objectToString.call(IN);
    if (type === '[object String]')
        return IP === IN.length;
    if (type === '[object Array]')
        return IP === IN.length;
    if (type === '[object Object]') {
        const keyCount = Object.keys(IN).length;
        assert(keyCount <= 32);
        if (keyCount === 0)
            return true;
        return IP === -1 >>> (32 - keyCount);
    }
    return IP === 1;
}
const objectToString = Object.prototype.toString;




// ------------------------------ Extensions ------------------------------
const extensions = {
};




// ------------------------------ PARSE ------------------------------
const parse = (() => {

    // Identifier
    function start_2(arg) {
        return foo(arg);
    }

    // StringUniversal
    function foo() {
        if (HAS_IN) {
            if (IP + 3 > IN.length) return false;
            if (IN.charCodeAt(IP + 0) !== 102) return false;
            if (IN.charCodeAt(IP + 1) !== 111) return false;
            if (IN.charCodeAt(IP + 2) !== 111) return false;
            IP += 3;
        }
        OUT = HAS_OUT ? "foo" : undefined;
        return true;
    }
    foo.constant = {value: "foo"};

    // StringUniversal
    function bar() {
        if (HAS_IN) {
            if (IP + 3 > IN.length) return false;
            if (IN.charCodeAt(IP + 0) !== 98) return false;
            if (IN.charCodeAt(IP + 1) !== 97) return false;
            if (IN.charCodeAt(IP + 2) !== 114) return false;
            IP += 3;
        }
        OUT = HAS_OUT ? "bar" : undefined;
        return true;
    }
    bar.constant = {value: "bar"};

    // Identifier
    function a(arg) {
        return b(arg);
    }

    // Module
    function expr(member) {
        switch (member) {
            case 'foo': return foo;
            case 'bar': return bar;
            case 'a': return a;
            default: return undefined;
        }
    }

    // Identifier
    function a_2(arg) {
        return b(arg);
    }

    // StringUniversal
    function b() {
        if (HAS_IN) {
            if (IP + 2 > IN.length) return false;
            if (IN.charCodeAt(IP + 0) !== 98) return false;
            if (IN.charCodeAt(IP + 1) !== 50) return false;
            IP += 2;
        }
        OUT = HAS_OUT ? "b2" : undefined;
        return true;
    }
    b.constant = {value: "b2"};

    // StringUniversal
    function baz() {
        if (HAS_IN) {
            if (IP + 3 > IN.length) return false;
            if (IN.charCodeAt(IP + 0) !== 98) return false;
            if (IN.charCodeAt(IP + 1) !== 97) return false;
            if (IN.charCodeAt(IP + 2) !== 122) return false;
            IP += 3;
        }
        OUT = HAS_OUT ? "baz" : undefined;
        return true;
    }
    baz.constant = {value: "baz"};

    // StringUniversal
    function mem() {
        if (HAS_IN) {
            if (IP + 6 > IN.length) return false;
            if (IN.charCodeAt(IP + 0) !== 109) return false;
            if (IN.charCodeAt(IP + 1) !== 101) return false;
            if (IN.charCodeAt(IP + 2) !== 109) return false;
            if (IN.charCodeAt(IP + 3) !== 98) return false;
            if (IN.charCodeAt(IP + 4) !== 101) return false;
            if (IN.charCodeAt(IP + 5) !== 114) return false;
            IP += 6;
        }
        OUT = HAS_OUT ? "member" : undefined;
        return true;
    }
    mem.constant = {value: "member"};

    // SelectionExpression
    function modExprMem() {
        if (foo()) return true;
        if (mem()) return true;
        if (baz()) return true;
        return false;
    }

    // SequenceExpression
    function a_3() {
        const stateₒ = getState();
        let out;
        if (a_3_sub1()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (b_2()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringUniversal
    function a_3_sub1() {
        if (HAS_IN) {
            if (IP + 1 > IN.length) return false;
            if (IN.charCodeAt(IP + 0) !== 97) return false;
            IP += 1;
        }
        OUT = HAS_OUT ? "a" : undefined;
        return true;
    }
    a_3_sub1.constant = {value: "a"};

    // Module
    function recA(member) {
        switch (member) {
            case 'a': return a_3;
            default: return undefined;
        }
    }

    // SequenceExpression
    function b_2() {
        const stateₒ = getState();
        let out;
        if (b_2_sub1()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (a_3()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringUniversal
    function b_2_sub1() {
        if (HAS_IN) {
            if (IP + 1 > IN.length) return false;
            if (IN.charCodeAt(IP + 0) !== 98) return false;
            IP += 1;
        }
        OUT = HAS_OUT ? "b" : undefined;
        return true;
    }
    b_2_sub1.constant = {value: "b"};

    // Module
    function recB(member) {
        switch (member) {
            case 'b': return b_2;
            default: return undefined;
        }
    }

    // Identifier
    function refC(arg) {
        return c1(arg);
    }

    // StringUniversal
    function c1() {
        if (HAS_IN) {
            if (IP + 2 > IN.length) return false;
            if (IN.charCodeAt(IP + 0) !== 99) return false;
            if (IN.charCodeAt(IP + 1) !== 49) return false;
            IP += 2;
        }
        OUT = HAS_OUT ? "c1" : undefined;
        return true;
    }
    c1.constant = {value: "c1"};

    // StringUniversal
    function c2() {
        if (HAS_IN) {
            if (IP + 2 > IN.length) return false;
            if (IN.charCodeAt(IP + 0) !== 99) return false;
            if (IN.charCodeAt(IP + 1) !== 50) return false;
            IP += 2;
        }
        OUT = HAS_OUT ? "c2" : undefined;
        return true;
    }
    c2.constant = {value: "c2"};

    // Identifier
    function ref1(arg) {
        return c1(arg);
    }

    // Identifier
    function ref2(arg) {
        return c1(arg);
    }

    // Identifier
    function ref3(arg) {
        return c1(arg);
    }

    // Module
    function c(member) {
        switch (member) {
            case 'c1': return c1;
            case 'c2': return c2;
            case 'ref1': return ref1;
            case 'ref2': return ref2;
            case 'ref3': return ref3;
            default: return undefined;
        }
    }

    // Identifier
    function ref5(arg) {
        return c1(arg);
    }

    // Identifier
    function ref6(arg) {
        return c1(arg);
    }

    // Module
    function defC(member) {
        switch (member) {
            case 'c': return c;
            case 'ref5': return ref5;
            case 'ref6': return ref6;
            default: return undefined;
        }
    }

    // Module
    function Ɱ_compile_test_OLD(member) {
        switch (member) {
            case 'start': return start_2;
            case 'expr': return expr;
            case 'a': return a_2;
            case 'b': return b;
            case 'baz': return baz;
            case 'modExprMem': return modExprMem;
            case 'recA': return recA;
            case 'recB': return recB;
            case 'refC': return refC;
            case 'defC': return defC;
            default: return undefined;
        }
    }

    return start_2;
})();




// ------------------------------ PRINT ------------------------------
const print = (() => {

    // Identifier
    function start_2(arg) {
        return foo(arg);
    }

    // StringUniversal
    function foo() {
        if (HAS_IN) {
            if (typeof IN !== 'string') return false;
            if (IP + 3 > IN.length) return false;
            if (IN.charCodeAt(IP + 0) !== 102) return false;
            if (IN.charCodeAt(IP + 1) !== 111) return false;
            if (IN.charCodeAt(IP + 2) !== 111) return false;
            IP += 3;
        }
        OUT = HAS_OUT ? "foo" : undefined;
        return true;
    }
    foo.constant = {value: "foo"};

    // StringUniversal
    function bar() {
        if (HAS_IN) {
            if (typeof IN !== 'string') return false;
            if (IP + 3 > IN.length) return false;
            if (IN.charCodeAt(IP + 0) !== 98) return false;
            if (IN.charCodeAt(IP + 1) !== 97) return false;
            if (IN.charCodeAt(IP + 2) !== 114) return false;
            IP += 3;
        }
        OUT = HAS_OUT ? "bar" : undefined;
        return true;
    }
    bar.constant = {value: "bar"};

    // Identifier
    function a(arg) {
        return b(arg);
    }

    // Module
    function expr(member) {
        switch (member) {
            case 'foo': return foo;
            case 'bar': return bar;
            case 'a': return a;
            default: return undefined;
        }
    }

    // Identifier
    function a_2(arg) {
        return b(arg);
    }

    // StringUniversal
    function b() {
        if (HAS_IN) {
            if (typeof IN !== 'string') return false;
            if (IP + 2 > IN.length) return false;
            if (IN.charCodeAt(IP + 0) !== 98) return false;
            if (IN.charCodeAt(IP + 1) !== 50) return false;
            IP += 2;
        }
        OUT = HAS_OUT ? "b2" : undefined;
        return true;
    }
    b.constant = {value: "b2"};

    // StringUniversal
    function baz() {
        if (HAS_IN) {
            if (typeof IN !== 'string') return false;
            if (IP + 3 > IN.length) return false;
            if (IN.charCodeAt(IP + 0) !== 98) return false;
            if (IN.charCodeAt(IP + 1) !== 97) return false;
            if (IN.charCodeAt(IP + 2) !== 122) return false;
            IP += 3;
        }
        OUT = HAS_OUT ? "baz" : undefined;
        return true;
    }
    baz.constant = {value: "baz"};

    // StringUniversal
    function mem() {
        if (HAS_IN) {
            if (typeof IN !== 'string') return false;
            if (IP + 6 > IN.length) return false;
            if (IN.charCodeAt(IP + 0) !== 109) return false;
            if (IN.charCodeAt(IP + 1) !== 101) return false;
            if (IN.charCodeAt(IP + 2) !== 109) return false;
            if (IN.charCodeAt(IP + 3) !== 98) return false;
            if (IN.charCodeAt(IP + 4) !== 101) return false;
            if (IN.charCodeAt(IP + 5) !== 114) return false;
            IP += 6;
        }
        OUT = HAS_OUT ? "member" : undefined;
        return true;
    }
    mem.constant = {value: "member"};

    // SelectionExpression
    function modExprMem() {
        if (foo()) return true;
        if (mem()) return true;
        if (baz()) return true;
        return false;
    }

    // SequenceExpression
    function a_3() {
        const stateₒ = getState();
        let out;
        if (a_3_sub1()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (b_2()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringUniversal
    function a_3_sub1() {
        if (HAS_IN) {
            if (typeof IN !== 'string') return false;
            if (IP + 1 > IN.length) return false;
            if (IN.charCodeAt(IP + 0) !== 97) return false;
            IP += 1;
        }
        OUT = HAS_OUT ? "a" : undefined;
        return true;
    }
    a_3_sub1.constant = {value: "a"};

    // Module
    function recA(member) {
        switch (member) {
            case 'a': return a_3;
            default: return undefined;
        }
    }

    // SequenceExpression
    function b_2() {
        const stateₒ = getState();
        let out;
        if (b_2_sub1()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (a_3()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringUniversal
    function b_2_sub1() {
        if (HAS_IN) {
            if (typeof IN !== 'string') return false;
            if (IP + 1 > IN.length) return false;
            if (IN.charCodeAt(IP + 0) !== 98) return false;
            IP += 1;
        }
        OUT = HAS_OUT ? "b" : undefined;
        return true;
    }
    b_2_sub1.constant = {value: "b"};

    // Module
    function recB(member) {
        switch (member) {
            case 'b': return b_2;
            default: return undefined;
        }
    }

    // Identifier
    function refC(arg) {
        return c1(arg);
    }

    // StringUniversal
    function c1() {
        if (HAS_IN) {
            if (typeof IN !== 'string') return false;
            if (IP + 2 > IN.length) return false;
            if (IN.charCodeAt(IP + 0) !== 99) return false;
            if (IN.charCodeAt(IP + 1) !== 49) return false;
            IP += 2;
        }
        OUT = HAS_OUT ? "c1" : undefined;
        return true;
    }
    c1.constant = {value: "c1"};

    // StringUniversal
    function c2() {
        if (HAS_IN) {
            if (typeof IN !== 'string') return false;
            if (IP + 2 > IN.length) return false;
            if (IN.charCodeAt(IP + 0) !== 99) return false;
            if (IN.charCodeAt(IP + 1) !== 50) return false;
            IP += 2;
        }
        OUT = HAS_OUT ? "c2" : undefined;
        return true;
    }
    c2.constant = {value: "c2"};

    // Identifier
    function ref1(arg) {
        return c1(arg);
    }

    // Identifier
    function ref2(arg) {
        return c1(arg);
    }

    // Identifier
    function ref3(arg) {
        return c1(arg);
    }

    // Module
    function c(member) {
        switch (member) {
            case 'c1': return c1;
            case 'c2': return c2;
            case 'ref1': return ref1;
            case 'ref2': return ref2;
            case 'ref3': return ref3;
            default: return undefined;
        }
    }

    // Identifier
    function ref5(arg) {
        return c1(arg);
    }

    // Identifier
    function ref6(arg) {
        return c1(arg);
    }

    // Module
    function defC(member) {
        switch (member) {
            case 'c': return c;
            case 'ref5': return ref5;
            case 'ref6': return ref6;
            default: return undefined;
        }
    }

    // Module
    function Ɱ_compile_test_OLD(member) {
        switch (member) {
            case 'start': return start_2;
            case 'expr': return expr;
            case 'a': return a_2;
            case 'b': return b;
            case 'baz': return baz;
            case 'modExprMem': return modExprMem;
            case 'recA': return recA;
            case 'recB': return recB;
            case 'refC': return refC;
            case 'defC': return defC;
            default: return undefined;
        }
    }

    return start_2;
})();
