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
}
function printField(name, value) {
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
}
function parseList(elements) {
    const elementsLength = elements.length;
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
}
function printList(elements) {
    const elementsLength = elements.length;
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
}
function parseRecord(fields) {
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
}
function printRecord(fields) {
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




// ------------------------------ Extensions ------------------------------
const extensions = {
};




// ------------------------------ PARSE ------------------------------
const parse = (() => {

    // ApplicationExpression
    let import_graph_resultₘ;
    function import_graph_result(arg) {
        try {
            return import_graph_resultₘ(arg);
        }
        catch (err) {
            if (!(err instanceof TypeError) || !err.message.includes('import_graph_resultₘ is not a function')) throw err;
            import_graph_resultₘ = a_f(e1);
            return import_graph_resultₘ(arg);
        }
    }

    // StringLiteralExpression
    function a_f() {
        if (IP + 3 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 102) return false;
        if (IN.charCodeAt(IP + 1) !== 111) return false;
        if (IN.charCodeAt(IP + 2) !== 111) return false;
        IP += 3;
        OUT = "foo";
        return true;
    }
    a_f.constant = {value: "foo"};

    // SequenceExpression
    function e1() {
        let stateₒ = getState();
        let out;
        if (a_b()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (a_baz()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringLiteralExpression
    function a_b() {
        if (IP + 3 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 98) return false;
        if (IN.charCodeAt(IP + 1) !== 97) return false;
        if (IN.charCodeAt(IP + 2) !== 114) return false;
        IP += 3;
        OUT = "bar";
        return true;
    }
    a_b.constant = {value: "bar"};

    // StringLiteralExpression
    function a_baz() {
        if (IP + 3 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 98) return false;
        if (IN.charCodeAt(IP + 1) !== 97) return false;
        if (IN.charCodeAt(IP + 2) !== 122) return false;
        IP += 3;
        OUT = "baz";
        return true;
    }
    a_baz.constant = {value: "baz"};

    return import_graph_result;
})();




// ------------------------------ PRINT ------------------------------
const print = (() => {

    // ApplicationExpression
    let import_graph_resultₘ;
    function import_graph_result(arg) {
        try {
            return import_graph_resultₘ(arg);
        }
        catch (err) {
            if (!(err instanceof TypeError) || !err.message.includes('import_graph_resultₘ is not a function')) throw err;
            import_graph_resultₘ = a_f(e1);
            return import_graph_resultₘ(arg);
        }
    }

    // StringLiteralExpression
    function a_f() {
        if (typeof IN !== 'string') return false;
        if (IP + 3 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 102) return false;
        if (IN.charCodeAt(IP + 1) !== 111) return false;
        if (IN.charCodeAt(IP + 2) !== 111) return false;
        IP += 3;
        OUT = "foo";
        return true;
    }
    a_f.constant = {value: "foo"};

    // SequenceExpression
    function e1() {
        let stateₒ = getState();
        let out;
        if (a_b()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (a_baz()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringLiteralExpression
    function a_b() {
        if (typeof IN !== 'string') return false;
        if (IP + 3 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 98) return false;
        if (IN.charCodeAt(IP + 1) !== 97) return false;
        if (IN.charCodeAt(IP + 2) !== 114) return false;
        IP += 3;
        OUT = "bar";
        return true;
    }
    a_b.constant = {value: "bar"};

    // StringLiteralExpression
    function a_baz() {
        if (typeof IN !== 'string') return false;
        if (IP + 3 > IN.length) return false;
        if (IN.charCodeAt(IP + 0) !== 98) return false;
        if (IN.charCodeAt(IP + 1) !== 97) return false;
        if (IN.charCodeAt(IP + 2) !== 122) return false;
        IP += 3;
        OUT = "baz";
        return true;
    }
    a_baz.constant = {value: "baz"};

    return import_graph_result;
})();
