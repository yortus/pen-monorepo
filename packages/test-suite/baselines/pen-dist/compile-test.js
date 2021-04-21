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
        if (item.kind === 'Element') {
            if (!item.expr())
                return setState(stateₒ), false;
            assert(OUT !== undefined);
            arr.push(OUT);
        }
        else {
            throw new Error('Not implemented!');
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
    const off = IP;
    for (let i = 0; i < itemsLength; ++i) {
        const item = items[i];
        if (item.kind === 'Element') {
            setState({ IN: arr[off + i], IP: 0 });
            if (!item.expr())
                return setState(stateₒ), false;
            if (!isInputFullyConsumed())
                return setState(stateₒ), false;
            text = concat(text, OUT);
        }
        else {
            throw new Error('Not implemented!');
        }
    }
    setState({ IN: arr, IP: off + itemsLength });
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

    // StringUniversal
    function x() {
        if (HAS_IN) {
            if (IP + 7 > IN.length) return false;
            if (IN.charCodeAt(IP + 0) !== 111) return false;
            if (IN.charCodeAt(IP + 1) !== 117) return false;
            if (IN.charCodeAt(IP + 2) !== 116) return false;
            if (IN.charCodeAt(IP + 3) !== 101) return false;
            if (IN.charCodeAt(IP + 4) !== 114) return false;
            if (IN.charCodeAt(IP + 5) !== 32) return false;
            if (IN.charCodeAt(IP + 6) !== 120) return false;
            IP += 7;
        }
        OUT = HAS_OUT ? "outer x" : undefined;
        return true;
    }
    x.constant = {value: "outer x"};

    // GenericExpression
    function REP(ℙ1) {

        // MemberExpression
        function a(arg) {
            return ℙ1("a")(arg);
        }

        // SequenceExpression
        function 𝕊1() {
            const stateₒ = getState();
            let out;
            if (a()) out = concat(out, OUT); else return setState(stateₒ), false;
            if (x_3()) out = concat(out, OUT); else return setState(stateₒ), false;
            if (a()) out = concat(out, OUT); else return setState(stateₒ), false;
            OUT = out;
            return true;
        }

        return 𝕊1;
    }

    // GenericExpression
    function GEN(ℙ2) {

        // GenericParameter
        function x_2(arg) {
            return ℙ2(arg);
        }

        // SequenceExpression
        function 𝕊2() {
            const stateₒ = getState();
            let out;
            if (x_2()) out = concat(out, OUT); else return setState(stateₒ), false;
            if (x_2()) out = concat(out, OUT); else return setState(stateₒ), false;
            OUT = out;
            return true;
        }

        return 𝕊2;
    }

    // StringUniversal
    function x_3() {
        if (HAS_IN) {
            if (IP + 7 > IN.length) return false;
            if (IN.charCodeAt(IP + 0) !== 105) return false;
            if (IN.charCodeAt(IP + 1) !== 110) return false;
            if (IN.charCodeAt(IP + 2) !== 110) return false;
            if (IN.charCodeAt(IP + 3) !== 101) return false;
            if (IN.charCodeAt(IP + 4) !== 114) return false;
            if (IN.charCodeAt(IP + 5) !== 32) return false;
            if (IN.charCodeAt(IP + 6) !== 120) return false;
            IP += 7;
        }
        OUT = HAS_OUT ? "inner x" : undefined;
        return true;
    }
    x_3.constant = {value: "inner x"};

    // NumericLiteral
    function a_2() {
        OUT = HAS_OUT ? 42 : undefined;
        return true;
    }
    a_2.constant = {value: 42};

    // Module
    function nested(member) {
        switch (member) {
            case 'REP': return REP;
            case 'GEN': return GEN;
            case 'x': return x_3;
            case 'a': return a_2;
            default: return undefined;
        }
    }

    // StringUniversal
    function lx() {
        if (HAS_IN) {
            if (IP + 7 > IN.length) return false;
            if (IN.charCodeAt(IP + 0) !== 105) return false;
            if (IN.charCodeAt(IP + 1) !== 110) return false;
            if (IN.charCodeAt(IP + 2) !== 110) return false;
            if (IN.charCodeAt(IP + 3) !== 101) return false;
            if (IN.charCodeAt(IP + 4) !== 114) return false;
            if (IN.charCodeAt(IP + 5) !== 32) return false;
            if (IN.charCodeAt(IP + 6) !== 120) return false;
            IP += 7;
        }
        OUT = HAS_OUT ? "inner x" : undefined;
        return true;
    }
    lx.constant = {value: "inner x"};

    // StringUniversal
    function ly() {
        if (HAS_IN) {
            if (IP + 3 > IN.length) return false;
            if (IN.charCodeAt(IP + 0) !== 42) return false;
            if (IN.charCodeAt(IP + 1) !== 42) return false;
            if (IN.charCodeAt(IP + 2) !== 42) return false;
            IP += 3;
        }
        OUT = HAS_OUT ? "***" : undefined;
        return true;
    }
    ly.constant = {value: "***"};

    // SequenceExpression
    function letexpr() {
        const stateₒ = getState();
        let out;
        if (lx()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (letexpr_sub1()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (lx()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringUniversal
    function letexpr_sub1() {
        if (HAS_IN) {
            if (IP + 1 > IN.length) return false;
            if (IN.charCodeAt(IP + 0) !== 45) return false;
            IP += 1;
        }
        OUT = HAS_OUT ? "-" : undefined;
        return true;
    }
    letexpr_sub1.constant = {value: "-"};

    // Identifier
    function a_3(arg) {
        return x(arg);
    }

    // SelectionExpression
    function start_2() {
        if (start_2_sub1()) return true;
        if (letexpr()) return true;
        return false;
    }

    // InstantiationExpression
    let start_2_sub1ₘ;
    function start_2_sub1(arg) {
        try {
            return start_2_sub1ₘ(arg);
        }
        catch (err) {
            if (!(err instanceof TypeError) || !err.message.includes('start_2_sub1ₘ is not a function')) throw err;
            start_2_sub1ₘ = REP(start_2_sub2);
            return start_2_sub1ₘ(arg);
        }
    }

    // Module
    function start_2_sub2(member) {
        switch (member) {
            case 'a': return a_3;
            default: return undefined;
        }
    }

    // Module
    function Ɱ_compile_test(member) {
        switch (member) {
            case 'x': return x;
            case 'nested': return nested;
            case 'letexpr': return letexpr;
            case 'start': return start_2;
            default: return undefined;
        }
    }

    return start_2;
})();




// ------------------------------ PRINT ------------------------------
const print = (() => {

    // StringUniversal
    function x() {
        if (HAS_IN) {
            if (typeof IN !== 'string') return false;
            if (IP + 7 > IN.length) return false;
            if (IN.charCodeAt(IP + 0) !== 111) return false;
            if (IN.charCodeAt(IP + 1) !== 117) return false;
            if (IN.charCodeAt(IP + 2) !== 116) return false;
            if (IN.charCodeAt(IP + 3) !== 101) return false;
            if (IN.charCodeAt(IP + 4) !== 114) return false;
            if (IN.charCodeAt(IP + 5) !== 32) return false;
            if (IN.charCodeAt(IP + 6) !== 120) return false;
            IP += 7;
        }
        OUT = HAS_OUT ? "outer x" : undefined;
        return true;
    }
    x.constant = {value: "outer x"};

    // GenericExpression
    function REP(ℙ1) {

        // MemberExpression
        function a(arg) {
            return ℙ1("a")(arg);
        }

        // SequenceExpression
        function 𝕊1() {
            const stateₒ = getState();
            let out;
            if (a()) out = concat(out, OUT); else return setState(stateₒ), false;
            if (x_3()) out = concat(out, OUT); else return setState(stateₒ), false;
            if (a()) out = concat(out, OUT); else return setState(stateₒ), false;
            OUT = out;
            return true;
        }

        return 𝕊1;
    }

    // GenericExpression
    function GEN(ℙ2) {

        // GenericParameter
        function x_2(arg) {
            return ℙ2(arg);
        }

        // SequenceExpression
        function 𝕊2() {
            const stateₒ = getState();
            let out;
            if (x_2()) out = concat(out, OUT); else return setState(stateₒ), false;
            if (x_2()) out = concat(out, OUT); else return setState(stateₒ), false;
            OUT = out;
            return true;
        }

        return 𝕊2;
    }

    // StringUniversal
    function x_3() {
        if (HAS_IN) {
            if (typeof IN !== 'string') return false;
            if (IP + 7 > IN.length) return false;
            if (IN.charCodeAt(IP + 0) !== 105) return false;
            if (IN.charCodeAt(IP + 1) !== 110) return false;
            if (IN.charCodeAt(IP + 2) !== 110) return false;
            if (IN.charCodeAt(IP + 3) !== 101) return false;
            if (IN.charCodeAt(IP + 4) !== 114) return false;
            if (IN.charCodeAt(IP + 5) !== 32) return false;
            if (IN.charCodeAt(IP + 6) !== 120) return false;
            IP += 7;
        }
        OUT = HAS_OUT ? "inner x" : undefined;
        return true;
    }
    x_3.constant = {value: "inner x"};

    // NumericLiteral
    function a_2() {
        if (HAS_IN) {
            if (IN !== 42 || IP !== 0) return false;
            IP += 1;
        }
        OUT = HAS_OUT ? undefined : undefined;
        return true;
    }
    a_2.constant = {value: 42};

    // Module
    function nested(member) {
        switch (member) {
            case 'REP': return REP;
            case 'GEN': return GEN;
            case 'x': return x_3;
            case 'a': return a_2;
            default: return undefined;
        }
    }

    // StringUniversal
    function lx() {
        if (HAS_IN) {
            if (typeof IN !== 'string') return false;
            if (IP + 7 > IN.length) return false;
            if (IN.charCodeAt(IP + 0) !== 105) return false;
            if (IN.charCodeAt(IP + 1) !== 110) return false;
            if (IN.charCodeAt(IP + 2) !== 110) return false;
            if (IN.charCodeAt(IP + 3) !== 101) return false;
            if (IN.charCodeAt(IP + 4) !== 114) return false;
            if (IN.charCodeAt(IP + 5) !== 32) return false;
            if (IN.charCodeAt(IP + 6) !== 120) return false;
            IP += 7;
        }
        OUT = HAS_OUT ? "inner x" : undefined;
        return true;
    }
    lx.constant = {value: "inner x"};

    // StringUniversal
    function ly() {
        if (HAS_IN) {
            if (typeof IN !== 'string') return false;
            if (IP + 3 > IN.length) return false;
            if (IN.charCodeAt(IP + 0) !== 42) return false;
            if (IN.charCodeAt(IP + 1) !== 42) return false;
            if (IN.charCodeAt(IP + 2) !== 42) return false;
            IP += 3;
        }
        OUT = HAS_OUT ? "***" : undefined;
        return true;
    }
    ly.constant = {value: "***"};

    // SequenceExpression
    function letexpr() {
        const stateₒ = getState();
        let out;
        if (lx()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (letexpr_sub1()) out = concat(out, OUT); else return setState(stateₒ), false;
        if (lx()) out = concat(out, OUT); else return setState(stateₒ), false;
        OUT = out;
        return true;
    }

    // StringUniversal
    function letexpr_sub1() {
        if (HAS_IN) {
            if (typeof IN !== 'string') return false;
            if (IP + 1 > IN.length) return false;
            if (IN.charCodeAt(IP + 0) !== 45) return false;
            IP += 1;
        }
        OUT = HAS_OUT ? "-" : undefined;
        return true;
    }
    letexpr_sub1.constant = {value: "-"};

    // Identifier
    function a_3(arg) {
        return x(arg);
    }

    // SelectionExpression
    function start_2() {
        if (start_2_sub1()) return true;
        if (letexpr()) return true;
        return false;
    }

    // InstantiationExpression
    let start_2_sub1ₘ;
    function start_2_sub1(arg) {
        try {
            return start_2_sub1ₘ(arg);
        }
        catch (err) {
            if (!(err instanceof TypeError) || !err.message.includes('start_2_sub1ₘ is not a function')) throw err;
            start_2_sub1ₘ = REP(start_2_sub2);
            return start_2_sub1ₘ(arg);
        }
    }

    // Module
    function start_2_sub2(member) {
        switch (member) {
            case 'a': return a_3;
            default: return undefined;
        }
    }

    // Module
    function Ɱ_compile_test(member) {
        switch (member) {
            case 'x': return x;
            case 'nested': return nested;
            case 'letexpr': return letexpr;
            case 'start': return start_2;
            default: return undefined;
        }
    }

    return start_2;
})();
