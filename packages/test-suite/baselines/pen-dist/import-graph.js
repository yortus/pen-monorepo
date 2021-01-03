// ------------------------------ Main exports ------------------------------
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
function parseList(elements) {
    const elementsLength = elements.length;
    const stateₒ = getState();
    const arr = [];
    for (let i = 0; i < elementsLength; ++i) {
        if (!elements[i]())
            return setState(stateₒ), false;
        assert(OUT !== undefined);
        arr.push(OUT);
    }
    OUT = arr;
    return true;
}
function printList(elements) {
    const elementsLength = elements.length;
    if (!Array.isArray(IN))
        return false;
    if (IP < 0 || IP + elementsLength > IN.length)
        return false;
    const stateₒ = getState();
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
function isGeneric(_x) {
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
    const type = objectToString.call(a);
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

    // SequenceExpression
    function start() {
        const stateₒ = getState();
        let out;
        if (foo()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (start_e()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringLiteral
    function foo() {
        if (IP + 3 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 102) return false;
        if (IN.charCodeAt(IP + 1) !== 111) return false;
        if (IN.charCodeAt(IP + 2) !== 111) return false;
        IP += 3;
        OUT = "foo";
        return true;
    }
    foo.constant = {value: "foo"};

    // SequenceExpression
    function start_e() {
        const stateₒ = getState();
        let out;
        if (bar()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (baz()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringLiteral
    function bar() {
        if (IP + 3 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 98) return false;
        if (IN.charCodeAt(IP + 1) !== 97) return false;
        if (IN.charCodeAt(IP + 2) !== 114) return false;
        IP += 3;
        OUT = "bar";
        return true;
    }
    bar.constant = {value: "bar"};

    // StringLiteral
    function baz() {
        if (IP + 3 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 98) return false;
        if (IN.charCodeAt(IP + 1) !== 97) return false;
        if (IN.charCodeAt(IP + 2) !== 122) return false;
        IP += 3;
        OUT = "baz";
        return true;
    }
    baz.constant = {value: "baz"};

    return start;
})();




// ------------------------------ PRINT ------------------------------
const print = (() => {

    // SequenceExpression
    function start() {
        const stateₒ = getState();
        let out;
        if (foo()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (start_e()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringLiteral
    function foo() {
        if (typeof IN !== 'string') return false;
        if (IP + 3 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 102) return false;
        if (IN.charCodeAt(IP + 1) !== 111) return false;
        if (IN.charCodeAt(IP + 2) !== 111) return false;
        IP += 3;
        OUT = "foo";
        return true;
    }
    foo.constant = {value: "foo"};

    // SequenceExpression
    function start_e() {
        const stateₒ = getState();
        let out;
        if (bar()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (baz()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringLiteral
    function bar() {
        if (typeof IN !== 'string') return false;
        if (IP + 3 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 98) return false;
        if (IN.charCodeAt(IP + 1) !== 97) return false;
        if (IN.charCodeAt(IP + 2) !== 114) return false;
        IP += 3;
        OUT = "bar";
        return true;
    }
    bar.constant = {value: "bar"};

    // StringLiteral
    function baz() {
        if (typeof IN !== 'string') return false;
        if (IP + 3 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 98) return false;
        if (IN.charCodeAt(IP + 1) !== 97) return false;
        if (IN.charCodeAt(IP + 2) !== 122) return false;
        IP += 3;
        OUT = "baz";
        return true;
    }
    baz.constant = {value: "baz"};

    return start;
})();
