// ------------------------------ Main exports ------------------------------
module.exports = {
    parse(strOrBuf) { // expects buf to be utf8 encoded
        CREP = Buffer.isBuffer(strOrBuf) ? strOrBuf : Buffer.from(strOrBuf, 'utf8');
        CPOS = 0;
        AREP = [];
        APOS = 0;
        HAS_IN = HAS_OUT = true;
        if (!parseInner(parse, true)) throw new Error('parse failed');
        if (CPOS !== CREP.length) throw new Error('parse didn\'t consume entire input');
        return AREP[0];
    },
    print(node, buf) {
        AREP = [node];
        APOS = 0;
        CREP = buf || Buffer.alloc(2 ** 22); // 4MB
        CPOS = 0;
        HAS_IN = HAS_OUT = true;
        if (!printInner(print, true)) throw new Error('print failed');
        if (CPOS > CREP.length) throw new Error('output buffer too small');
        return buf ? CPOS : CREP.toString('utf8', 0, CPOS);
    },
};




// ------------------------------ Runtime ------------------------------
"use strict";
function parseList(listItems) {
    return function LST() {
        const [APOSₒ, CPOSₒ] = savepoint();
        if (APOS === 0)
            AREP = [];
        for (const listItem of listItems) {
            if (listItem.kind === 'Element') {
                if (!parseInner(listItem.expr, true))
                    return backtrack(APOSₒ, CPOSₒ);
            }
            else {
                if (!listItem.expr())
                    return backtrack(APOSₒ, CPOSₒ);
            }
        }
        ATYP = LIST;
        return true;
    };
}
function printList(listItems) {
    return function LST() {
        if (ATYP !== LIST)
            return false;
        const [APOSₒ, CPOSₒ] = savepoint(), ATYPₒ = ATYP;
        for (const listItem of listItems) {
            if (listItem.kind === 'Element') {
                if (!printInner(listItem.expr, true))
                    return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
            }
            else {
                ATYP = LIST;
                if (!listItem.expr())
                    return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
            }
        }
        return true;
    };
}
function parseRecord(recordItems) {
    return function RCD() {
        const [APOSₒ, CPOSₒ] = savepoint();
        if (APOS === 0)
            AREP = [];
        const fieldNames = [];
        for (const recordItem of recordItems) {
            if (recordItem.kind === 'Field') {
                let fieldName;
                if (typeof recordItem.name === 'string') {
                    fieldName = recordItem.name;
                }
                else {
                    if (!parseInner(recordItem.name, true))
                        return backtrack(APOSₒ, CPOSₒ);
                    assert(ATYP === STRING);
                    APOS -= 1;
                    fieldName = AREP[APOS];
                }
                if (fieldNames.includes(fieldName))
                    return backtrack(APOSₒ, CPOSₒ);
                if (!parseInner(recordItem.expr, true))
                    return backtrack(APOSₒ, CPOSₒ);
                if (HAS_OUT) {
                    const fieldValue = AREP[--APOS];
                    AREP[APOS++] = fieldName;
                    AREP[APOS++] = fieldValue;
                }
                fieldNames.push(fieldName);
            }
            else {
                const apos = APOS;
                if (!recordItem.expr())
                    return backtrack(APOSₒ, CPOSₒ);
                for (let i = apos; i < APOS; i += 2) {
                    const fieldName = AREP[i];
                    if (fieldNames.includes(fieldName))
                        return backtrack(APOSₒ, CPOSₒ);
                    fieldNames.push(fieldName);
                }
            }
        }
        ATYP = HAS_OUT ? RECORD : NOTHING;
        return true;
    };
}
function printRecord(recordItems) {
    return function RCD() {
        if (ATYP !== RECORD)
            return false;
        const [APOSₒ, CPOSₒ] = savepoint(), ATYPₒ = ATYP;
        const propList = AREP;
        const propCount = AREP.length;
        let bitmask = APOS;
        outerLoop: for (const recordItem of recordItems) {
            if (recordItem.kind === 'Field') {
                for (let i = 0; i < propCount; ++i) {
                    let propName = propList[i << 1];
                    const propBit = 1 << i;
                    if ((bitmask & propBit) !== 0)
                        continue;
                    if (typeof recordItem.name !== 'string') {
                        APOS = i << 1;
                        if (!printInner(recordItem.name, true))
                            continue;
                    }
                    else {
                        if (propName !== recordItem.name)
                            continue;
                    }
                    APOS = (i << 1) + 1;
                    if (!printInner(recordItem.expr, true))
                        continue;
                    bitmask += propBit;
                    continue outerLoop;
                }
                return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
            }
            else {
                APOS = bitmask;
                ATYP = RECORD;
                if (!recordItem.expr())
                    return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
                bitmask = APOS;
            }
        }
        APOS = bitmask;
        return true;
    };
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
let AREP;
let APOS;
let ATYP;
let CREP;
let CPOS;
let HAS_IN;
let HAS_OUT;
const [NOTHING, SCALAR, STRING, LIST, RECORD] = [0, 1, 2, 4, 8];
const savepoint = () => [APOS, CPOS];
const backtrack = (APOSₒ, CPOSₒ, ATYPₒ) => (APOS = APOSₒ, CPOS = CPOSₒ, ATYP = ATYPₒ !== null && ATYPₒ !== void 0 ? ATYPₒ : NOTHING, false);
const theScalarArray = [];
const theBuffer = Buffer.alloc(2 ** 10);
function emitScalar(value) {
    if (HAS_OUT) {
        if (APOS === 0)
            AREP = theScalarArray;
        AREP[APOS++] = value;
    }
    ATYP = HAS_OUT ? SCALAR : NOTHING;
}
function emitByte(value) {
    if (HAS_OUT) {
        if (APOS === 0)
            AREP = theBuffer;
        AREP[APOS++] = value;
    }
    ATYP = HAS_OUT ? STRING : NOTHING;
}
function emitBytes(...values) {
    if (HAS_OUT) {
        if (APOS === 0)
            AREP = theBuffer;
        for (let i = 0; i < values.length; ++i)
            AREP[APOS++] = values[i];
    }
    ATYP = HAS_OUT ? STRING : NOTHING;
}
function parseInner(rule, mustProduce) {
    const [AREPₒ, APOSₒ] = [AREP, APOS];
    AREP = undefined;
    APOS = 0;
    if (!rule())
        return AREP = AREPₒ, APOS = APOSₒ, false;
    if (ATYP === NOTHING)
        return AREP = AREPₒ, APOS = APOSₒ, mustProduce;
    let value;
    switch (ATYP) {
        case SCALAR:
            assert(APOS === 1);
            value = AREP[0];
            break;
        case STRING:
            value = AREP.toString('utf8', 0, APOS);
            break;
        case LIST:
            value = APOS === AREP.length ? AREP : AREP.slice(0, APOS);
            break;
        case RECORD:
            const obj = value = {};
            for (let i = 0; i < APOS; i += 2)
                obj[AREP[i]] = AREP[i + 1];
            break;
        default:
            ((atyp) => { throw new Error(`Unhandled abstract type ${atyp}`); })(ATYP);
    }
    AREPₒ[APOSₒ] = value;
    AREP = AREPₒ;
    APOS = APOSₒ + 1;
    return true;
}
function printInner(rule, mustConsume) {
    const [AREPₒ, APOSₒ, ATYPₒ] = [AREP, APOS, ATYP];
    let value = AREP[APOS];
    let atyp;
    if (value === undefined) {
        if (mustConsume)
            return false;
        ATYP = NOTHING;
        const result = rule();
        ATYP = ATYPₒ;
        assert(APOS === APOSₒ);
        return result;
    }
    if (value === null || value === true || value === false || typeof value === 'number') {
        ATYP = SCALAR;
        const result = rule();
        ATYP = ATYPₒ;
        assert(APOS - APOSₒ === 1);
        return result;
    }
    if (typeof value === 'string') {
        AREP = value;
        atyp = ATYP = STRING;
    }
    else if (Array.isArray(value)) {
        AREP = value;
        atyp = ATYP = LIST;
    }
    else if (typeof value === 'object') {
        const arr = AREP = [];
        const keys = Object.keys(value);
        assert(keys.length < 32);
        for (let i = 0; i < keys.length; ++i)
            arr.push(keys[i], value[keys[i]]);
        value = arr;
        atyp = ATYP = RECORD;
    }
    else {
        throw new Error(`Unsupported value type for value ${value}`);
    }
    APOS = 0;
    let result = rule();
    const apos = APOS;
    AREP = AREPₒ, APOS = APOSₒ, ATYP = ATYPₒ;
    if (!result)
        return false;
    if (atyp === RECORD) {
        const keyCount = value.length >> 1;
        if (keyCount > 0 && (apos !== -1 >>> (32 - keyCount)))
            return false;
    }
    else {
        if (apos !== value.length)
            return false;
    }
    APOS += 1;
    return true;
}
function assert(value) {
    if (!value)
        throw new Error(`Assertion failed`);
}




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
            if (CPOS + 3 > CREP.length) return false;
            if (CREP[CPOS + 0] !== 102) return false;
            if (CREP[CPOS + 1] !== 111) return false;
            if (CREP[CPOS + 2] !== 111) return false;
            CPOS += 3;
        }
        emitBytes(0x66, 0x6f, 0x6f);
        return true;
    }
    foo.constant = {value: "foo"};

    // StringUniversal
    function bar() {
        if (HAS_IN) {
            if (CPOS + 3 > CREP.length) return false;
            if (CREP[CPOS + 0] !== 98) return false;
            if (CREP[CPOS + 1] !== 97) return false;
            if (CREP[CPOS + 2] !== 114) return false;
            CPOS += 3;
        }
        emitBytes(0x62, 0x61, 0x72);
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
            if (CPOS + 2 > CREP.length) return false;
            if (CREP[CPOS + 0] !== 98) return false;
            if (CREP[CPOS + 1] !== 50) return false;
            CPOS += 2;
        }
        emitBytes(0x62, 0x32);
        return true;
    }
    b.constant = {value: "b2"};

    // StringUniversal
    function baz() {
        if (HAS_IN) {
            if (CPOS + 3 > CREP.length) return false;
            if (CREP[CPOS + 0] !== 98) return false;
            if (CREP[CPOS + 1] !== 97) return false;
            if (CREP[CPOS + 2] !== 122) return false;
            CPOS += 3;
        }
        emitBytes(0x62, 0x61, 0x7a);
        return true;
    }
    baz.constant = {value: "baz"};

    // StringUniversal
    function mem() {
        if (HAS_IN) {
            if (CPOS + 6 > CREP.length) return false;
            if (CREP[CPOS + 0] !== 109) return false;
            if (CREP[CPOS + 1] !== 101) return false;
            if (CREP[CPOS + 2] !== 109) return false;
            if (CREP[CPOS + 3] !== 98) return false;
            if (CREP[CPOS + 4] !== 101) return false;
            if (CREP[CPOS + 5] !== 114) return false;
            CPOS += 6;
        }
        emitBytes(0x6d, 0x65, 0x6d, 0x62, 0x65, 0x72);
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
        const [APOSₒ, CPOSₒ] = savepoint(), ATYPₒ = ATYP;
        let seqType = NOTHING;
        if (!a_3_sub1()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        seqType |= ATYP;
        if (!b_2()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        ATYP |= seqType;
        return true;
    }

    // StringUniversal
    function a_3_sub1() {
        if (HAS_IN) {
            if (CPOS + 1 > CREP.length) return false;
            if (CREP[CPOS + 0] !== 97) return false;
            CPOS += 1;
        }
        emitByte(0x61);
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
        const [APOSₒ, CPOSₒ] = savepoint(), ATYPₒ = ATYP;
        let seqType = NOTHING;
        if (!b_2_sub1()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        seqType |= ATYP;
        if (!a_3()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        ATYP |= seqType;
        return true;
    }

    // StringUniversal
    function b_2_sub1() {
        if (HAS_IN) {
            if (CPOS + 1 > CREP.length) return false;
            if (CREP[CPOS + 0] !== 98) return false;
            CPOS += 1;
        }
        emitByte(0x62);
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
            if (CPOS + 2 > CREP.length) return false;
            if (CREP[CPOS + 0] !== 99) return false;
            if (CREP[CPOS + 1] !== 49) return false;
            CPOS += 2;
        }
        emitBytes(0x63, 0x31);
        return true;
    }
    c1.constant = {value: "c1"};

    // StringUniversal
    function c2() {
        if (HAS_IN) {
            if (CPOS + 2 > CREP.length) return false;
            if (CREP[CPOS + 0] !== 99) return false;
            if (CREP[CPOS + 1] !== 50) return false;
            CPOS += 2;
        }
        emitBytes(0x63, 0x32);
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
            if (ATYP !== STRING) return false;
            if (APOS + 3 > AREP.length) return false;
            if (AREP.charCodeAt(APOS + 0) !== 102) return false;
            if (AREP.charCodeAt(APOS + 1) !== 111) return false;
            if (AREP.charCodeAt(APOS + 2) !== 111) return false;
            APOS += 3;
        }
        if (HAS_OUT) {
            CPOS += CREP.write("foo", CPOS, undefined, 'utf8');
        }
        return true;
    }
    foo.constant = {value: "foo"};

    // StringUniversal
    function bar() {
        if (HAS_IN) {
            if (ATYP !== STRING) return false;
            if (APOS + 3 > AREP.length) return false;
            if (AREP.charCodeAt(APOS + 0) !== 98) return false;
            if (AREP.charCodeAt(APOS + 1) !== 97) return false;
            if (AREP.charCodeAt(APOS + 2) !== 114) return false;
            APOS += 3;
        }
        if (HAS_OUT) {
            CPOS += CREP.write("bar", CPOS, undefined, 'utf8');
        }
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
            if (ATYP !== STRING) return false;
            if (APOS + 2 > AREP.length) return false;
            if (AREP.charCodeAt(APOS + 0) !== 98) return false;
            if (AREP.charCodeAt(APOS + 1) !== 50) return false;
            APOS += 2;
        }
        if (HAS_OUT) {
            CPOS += CREP.write("b2", CPOS, undefined, 'utf8');
        }
        return true;
    }
    b.constant = {value: "b2"};

    // StringUniversal
    function baz() {
        if (HAS_IN) {
            if (ATYP !== STRING) return false;
            if (APOS + 3 > AREP.length) return false;
            if (AREP.charCodeAt(APOS + 0) !== 98) return false;
            if (AREP.charCodeAt(APOS + 1) !== 97) return false;
            if (AREP.charCodeAt(APOS + 2) !== 122) return false;
            APOS += 3;
        }
        if (HAS_OUT) {
            CPOS += CREP.write("baz", CPOS, undefined, 'utf8');
        }
        return true;
    }
    baz.constant = {value: "baz"};

    // StringUniversal
    function mem() {
        if (HAS_IN) {
            if (ATYP !== STRING) return false;
            if (APOS + 6 > AREP.length) return false;
            if (AREP.charCodeAt(APOS + 0) !== 109) return false;
            if (AREP.charCodeAt(APOS + 1) !== 101) return false;
            if (AREP.charCodeAt(APOS + 2) !== 109) return false;
            if (AREP.charCodeAt(APOS + 3) !== 98) return false;
            if (AREP.charCodeAt(APOS + 4) !== 101) return false;
            if (AREP.charCodeAt(APOS + 5) !== 114) return false;
            APOS += 6;
        }
        if (HAS_OUT) {
            CPOS += CREP.write("member", CPOS, undefined, 'utf8');
        }
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
        const [APOSₒ, CPOSₒ] = savepoint(), ATYPₒ = ATYP;
        if (!a_3_sub1()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        if (!b_2()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        return true;
    }

    // StringUniversal
    function a_3_sub1() {
        if (HAS_IN) {
            if (ATYP !== STRING) return false;
            if (APOS + 1 > AREP.length) return false;
            if (AREP.charCodeAt(APOS + 0) !== 97) return false;
            APOS += 1;
        }
        if (HAS_OUT) {
            CPOS += CREP.write("a", CPOS, undefined, 'utf8');
        }
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
        const [APOSₒ, CPOSₒ] = savepoint(), ATYPₒ = ATYP;
        if (!b_2_sub1()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        if (!a_3()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        return true;
    }

    // StringUniversal
    function b_2_sub1() {
        if (HAS_IN) {
            if (ATYP !== STRING) return false;
            if (APOS + 1 > AREP.length) return false;
            if (AREP.charCodeAt(APOS + 0) !== 98) return false;
            APOS += 1;
        }
        if (HAS_OUT) {
            CPOS += CREP.write("b", CPOS, undefined, 'utf8');
        }
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
            if (ATYP !== STRING) return false;
            if (APOS + 2 > AREP.length) return false;
            if (AREP.charCodeAt(APOS + 0) !== 99) return false;
            if (AREP.charCodeAt(APOS + 1) !== 49) return false;
            APOS += 2;
        }
        if (HAS_OUT) {
            CPOS += CREP.write("c1", CPOS, undefined, 'utf8');
        }
        return true;
    }
    c1.constant = {value: "c1"};

    // StringUniversal
    function c2() {
        if (HAS_IN) {
            if (ATYP !== STRING) return false;
            if (APOS + 2 > AREP.length) return false;
            if (AREP.charCodeAt(APOS + 0) !== 99) return false;
            if (AREP.charCodeAt(APOS + 1) !== 50) return false;
            APOS += 2;
        }
        if (HAS_OUT) {
            CPOS += CREP.write("c2", CPOS, undefined, 'utf8');
        }
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
