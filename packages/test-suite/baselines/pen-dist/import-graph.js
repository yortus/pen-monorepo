// ------------------------------ Main exports ------------------------------
module.exports = {
    parse(strOrBuf) { // expects buf to be utf8 encoded
        CREP = Buffer.isBuffer(strOrBuf) ? strOrBuf : Buffer.from(strOrBuf, 'utf8');
        CPOS = 0;
        AREP = [];
        APOS = 0;
        if (!parseInner(parse, true)) throw new Error('parse failed');
        if (CPOS !== CREP.length) throw new Error('parse didn\'t consume entire input');
        return AREP[0];
    },
    print(node, buf) {
        AREP = [node];
        APOS = 0;
        CREP = buf || Buffer.alloc(2 ** 22); // 4MB
        CPOS = 0;
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
                if (AREP !== NIL) {
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
        ATYP = AREP !== NIL ? RECORD : NOTHING;
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
let NIL = null;
const [NOTHING, SCALAR, STRING, LIST, RECORD] = [0, 1, 2, 4, 8];
const savepoint = () => [APOS, CPOS];
const backtrack = (APOSₒ, CPOSₒ, ATYPₒ) => (APOS = APOSₒ, CPOS = CPOSₒ, ATYP = ATYPₒ !== null && ATYPₒ !== void 0 ? ATYPₒ : NOTHING, false);
const theScalarArray = [];
const theBuffer = Buffer.alloc(2 ** 10);
function emitScalar(value) {
    if (AREP !== NIL) {
        if (APOS === 0)
            AREP = theScalarArray;
        AREP[APOS++] = value;
    }
    ATYP = AREP !== NIL ? SCALAR : NOTHING;
}
function emitByte(value) {
    if (AREP !== NIL) {
        if (APOS === 0)
            AREP = theBuffer;
        AREP[APOS++] = value;
    }
    ATYP = AREP !== NIL ? STRING : NOTHING;
}
function emitBytes(...values) {
    if (AREP !== NIL) {
        if (APOS === 0)
            AREP = theBuffer;
        for (let i = 0; i < values.length; ++i)
            AREP[APOS++] = values[i];
    }
    ATYP = AREP !== NIL ? STRING : NOTHING;
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
            if (AREP.length !== APOS)
                AREP.length === APOS;
            value = AREP;
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
        AREP = theBuffer.slice(0, theBuffer.write(value, 0));
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
    const [arep, apos] = [AREP, APOS];
    AREP = AREPₒ, APOS = APOSₒ, ATYP = ATYPₒ;
    if (!result)
        return false;
    if (atyp === RECORD) {
        const keyCount = value.length >> 1;
        if (keyCount > 0 && (apos !== -1 >>> (32 - keyCount)))
            return false;
    }
    else {
        if (apos !== arep.length)
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
    function foo(arg) {
        return f(arg);
    }

    // Identifier
    function bar(arg) {
        return b_2(arg);
    }

    // Identifier
    function baz(arg) {
        return baz_2(arg);
    }

    // Identifier
    function start_2(arg) {
        return result(arg);
    }

    // ByteExpression
    function digit() {
        let cc;
        if (CREP !== NIL) {
            if (CPOS >= CREP.length) return false;
            cc = CREP[CPOS];
            if ((cc < 0x30 || cc > 0x39)) return false;
            CPOS += 1;
        }
        else {
            cc = 0x30;
        }
        emitByte(cc);
        return true;
    }

    // ByteExpression
    function alpha() {
        let cc;
        if (CREP !== NIL) {
            if (CPOS >= CREP.length) return false;
            cc = CREP[CPOS];
            if ((cc < 0x61 || cc > 0x7a) && (cc < 0x41 || cc > 0x5a)) return false;
            CPOS += 1;
        }
        else {
            cc = 0x61;
        }
        emitByte(cc);
        return true;
    }

    // SequenceExpression
    function result() {
        const [APOSₒ, CPOSₒ] = savepoint(), ATYPₒ = ATYP;
        let seqType = NOTHING;
        if (!foo()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        seqType |= ATYP;
        if (!result_sub1()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        ATYP |= seqType;
        return true;
    }

    // SequenceExpression
    function result_sub1() {
        const [APOSₒ, CPOSₒ] = savepoint(), ATYPₒ = ATYP;
        let seqType = NOTHING;
        if (!bar()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        seqType |= ATYP;
        if (!baz()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        ATYP |= seqType;
        return true;
    }

    // ListExpression
    let myListₘ;
    function myList(arg) {
        try {
            return myListₘ(arg);
        }
        catch (err) {
            if (!(err instanceof TypeError) || !err.message.includes('myListₘ is not a function')) throw err;
            myListₘ = parseList([
                {
                    kind: 'Element',
                    expr: digit
                },
                {
                    kind: 'Element',
                    expr: myList_sub1
                },
                {
                    kind: 'Element',
                    expr: myList_sub2
                },
            ]);
            return myListₘ(arg);
        }
    }

    // SequenceExpression
    function myList_sub1() {
        const [APOSₒ, CPOSₒ] = savepoint(), ATYPₒ = ATYP;
        let seqType = NOTHING;
        if (!digit()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        seqType |= ATYP;
        if (!digit()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        ATYP |= seqType;
        return true;
    }

    // SequenceExpression
    function myList_sub2() {
        const [APOSₒ, CPOSₒ] = savepoint(), ATYPₒ = ATYP;
        let seqType = NOTHING;
        if (!digit()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        seqType |= ATYP;
        if (!digit()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        seqType |= ATYP;
        if (!digit()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        ATYP |= seqType;
        return true;
    }

    // StringLiteral
    function b() {
        emitBytes(0x62, 0x20, 0x74, 0x68, 0x69, 0x6e, 0x67);
        return true;
    }
    b.constant = {value: "b thing"};

    // StringLiteral
    function d() {
        emitBytes(0x64, 0x20, 0x74, 0x68, 0x69, 0x6e, 0x67);
        return true;
    }
    d.constant = {value: "d thing"};

    // Module
    function rec(member) {
        switch (member) {
            case 'b': return b;
            case 'd': return d;
            default: return undefined;
        }
    }

    // Identifier
    function r2(arg) {
        return rec(arg);
    }

    // Identifier
    function r2d(arg) {
        return d(arg);
    }

    // Module
    function Ɱ_import_graph(member) {
        switch (member) {
            case 'foo': return foo;
            case 'bar': return bar;
            case 'baz': return baz;
            case 'start': return start_2;
            case 'digit': return digit;
            case 'alpha': return alpha;
            case 'result': return result;
            case 'myList': return myList;
            case 'rec': return rec;
            case 'r2': return r2;
            case 'r2d': return r2d;
            default: return undefined;
        }
    }

    // StringLiteral
    function f() {
        if (CREP !== NIL) {
            if (CPOS + 3 > CREP.length) return false;
            if (CREP[CPOS + 0] !== 0x66) return false;
            if (CREP[CPOS + 1] !== 0x6f) return false;
            if (CREP[CPOS + 2] !== 0x6f) return false;
            CPOS += 3;
        }
        emitBytes(0x66, 0x6f, 0x6f);
        return true;
    }
    f.constant = {value: "foo"};

    // StringLiteral
    function b_2() {
        if (CREP !== NIL) {
            if (CPOS + 3 > CREP.length) return false;
            if (CREP[CPOS + 0] !== 0x62) return false;
            if (CREP[CPOS + 1] !== 0x61) return false;
            if (CREP[CPOS + 2] !== 0x72) return false;
            CPOS += 3;
        }
        emitBytes(0x62, 0x61, 0x72);
        return true;
    }
    b_2.constant = {value: "bar"};

    // StringLiteral
    function baz_2() {
        if (CREP !== NIL) {
            if (CPOS + 3 > CREP.length) return false;
            if (CREP[CPOS + 0] !== 0x62) return false;
            if (CREP[CPOS + 1] !== 0x61) return false;
            if (CREP[CPOS + 2] !== 0x7a) return false;
            CPOS += 3;
        }
        emitBytes(0x62, 0x61, 0x7a);
        return true;
    }
    baz_2.constant = {value: "baz"};

    // Module
    function Ɱ_a(member) {
        switch (member) {
            case 'f': return f;
            case 'b': return b_2;
            case 'baz': return baz_2;
            default: return undefined;
        }
    }

    // Module
    function Ɱ_b(member) {
        switch (member) {
            default: return undefined;
        }
    }

    // Module
    function Ɱ_c(member) {
        switch (member) {
            default: return undefined;
        }
    }

    // Module
    function Ɱ_d(member) {
        switch (member) {
            default: return undefined;
        }
    }

    // Identifier
    function util1(arg) {
        return Ɱ_util1(arg);
    }

    // Identifier
    function util2(arg) {
        return Ɱ_util2(arg);
    }

    // Module
    function util(member) {
        switch (member) {
            case 'util1': return util1;
            case 'util2': return util2;
            default: return undefined;
        }
    }

    // Module
    function Ɱ_util(member) {
        switch (member) {
            case 'util': return util;
            default: return undefined;
        }
    }

    // StringLiteral
    function util1_2() {
        if (CREP !== NIL) {
            if (CPOS + 5 > CREP.length) return false;
            if (CREP[CPOS + 0] !== 0x75) return false;
            if (CREP[CPOS + 1] !== 0x74) return false;
            if (CREP[CPOS + 2] !== 0x69) return false;
            if (CREP[CPOS + 3] !== 0x6c) return false;
            if (CREP[CPOS + 4] !== 0x31) return false;
            CPOS += 5;
        }
        emitBytes(0x75, 0x74, 0x69, 0x6c, 0x31);
        return true;
    }
    util1_2.constant = {value: "util1"};

    // Module
    function Ɱ_util1(member) {
        switch (member) {
            case 'util1': return util1_2;
            default: return undefined;
        }
    }

    // StringLiteral
    function util2_2() {
        if (CREP !== NIL) {
            if (CPOS + 5 > CREP.length) return false;
            if (CREP[CPOS + 0] !== 0x75) return false;
            if (CREP[CPOS + 1] !== 0x74) return false;
            if (CREP[CPOS + 2] !== 0x69) return false;
            if (CREP[CPOS + 3] !== 0x6c) return false;
            if (CREP[CPOS + 4] !== 0x32) return false;
            CPOS += 5;
        }
        emitBytes(0x75, 0x74, 0x69, 0x6c, 0x32);
        return true;
    }
    util2_2.constant = {value: "util2"};

    // Module
    function Ɱ_util2(member) {
        switch (member) {
            case 'util2': return util2_2;
            default: return undefined;
        }
    }

    return start_2;
})();




// ------------------------------ PRINT ------------------------------
const print = (() => {

    // Identifier
    function foo(arg) {
        return f(arg);
    }

    // Identifier
    function bar(arg) {
        return b_2(arg);
    }

    // Identifier
    function baz(arg) {
        return baz_2(arg);
    }

    // Identifier
    function start_2(arg) {
        return result(arg);
    }

    // ByteExpression
    function digit() {
        let cc;
        if (AREP !== NIL) {
            if (ATYP !== STRING) return false;
            if (APOS >= AREP.length) return false;
            cc = AREP[APOS];
            if ((cc < 0x30 || cc > 0x39)) return false;
            APOS += 1;
        }
        else {
            cc = 0x30;
        }
        if (CREP !== NIL) CREP[CPOS++] = cc;
        return true;
    }

    // ByteExpression
    function alpha() {
        let cc;
        if (AREP !== NIL) {
            if (ATYP !== STRING) return false;
            if (APOS >= AREP.length) return false;
            cc = AREP[APOS];
            if ((cc < 0x61 || cc > 0x7a) && (cc < 0x41 || cc > 0x5a)) return false;
            APOS += 1;
        }
        else {
            cc = 0x61;
        }
        if (CREP !== NIL) CREP[CPOS++] = cc;
        return true;
    }

    // SequenceExpression
    function result() {
        const [APOSₒ, CPOSₒ] = savepoint(), ATYPₒ = ATYP;
        if (!foo()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        if (!result_sub1()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        return true;
    }

    // SequenceExpression
    function result_sub1() {
        const [APOSₒ, CPOSₒ] = savepoint(), ATYPₒ = ATYP;
        if (!bar()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        if (!baz()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        return true;
    }

    // ListExpression
    let myListₘ;
    function myList(arg) {
        try {
            return myListₘ(arg);
        }
        catch (err) {
            if (!(err instanceof TypeError) || !err.message.includes('myListₘ is not a function')) throw err;
            myListₘ = printList([
                {
                    kind: 'Element',
                    expr: digit
                },
                {
                    kind: 'Element',
                    expr: myList_sub1
                },
                {
                    kind: 'Element',
                    expr: myList_sub2
                },
            ]);
            return myListₘ(arg);
        }
    }

    // SequenceExpression
    function myList_sub1() {
        const [APOSₒ, CPOSₒ] = savepoint(), ATYPₒ = ATYP;
        if (!digit()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        if (!digit()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        return true;
    }

    // SequenceExpression
    function myList_sub2() {
        const [APOSₒ, CPOSₒ] = savepoint(), ATYPₒ = ATYP;
        if (!digit()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        if (!digit()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        if (!digit()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        return true;
    }

    // StringLiteral
    function b() {
        if (AREP !== NIL) {
            if (ATYP !== STRING) return false;
            if (APOS + 7 > AREP.length) return false;
            if (AREP[APOS + 0] !== 0x62) return false;
            if (AREP[APOS + 1] !== 0x20) return false;
            if (AREP[APOS + 2] !== 0x74) return false;
            if (AREP[APOS + 3] !== 0x68) return false;
            if (AREP[APOS + 4] !== 0x69) return false;
            if (AREP[APOS + 5] !== 0x6e) return false;
            if (AREP[APOS + 6] !== 0x67) return false;
            APOS += 7;
        }
        return true;
    }
    b.constant = {value: "b thing"};

    // StringLiteral
    function d() {
        if (AREP !== NIL) {
            if (ATYP !== STRING) return false;
            if (APOS + 7 > AREP.length) return false;
            if (AREP[APOS + 0] !== 0x64) return false;
            if (AREP[APOS + 1] !== 0x20) return false;
            if (AREP[APOS + 2] !== 0x74) return false;
            if (AREP[APOS + 3] !== 0x68) return false;
            if (AREP[APOS + 4] !== 0x69) return false;
            if (AREP[APOS + 5] !== 0x6e) return false;
            if (AREP[APOS + 6] !== 0x67) return false;
            APOS += 7;
        }
        return true;
    }
    d.constant = {value: "d thing"};

    // Module
    function rec(member) {
        switch (member) {
            case 'b': return b;
            case 'd': return d;
            default: return undefined;
        }
    }

    // Identifier
    function r2(arg) {
        return rec(arg);
    }

    // Identifier
    function r2d(arg) {
        return d(arg);
    }

    // Module
    function Ɱ_import_graph(member) {
        switch (member) {
            case 'foo': return foo;
            case 'bar': return bar;
            case 'baz': return baz;
            case 'start': return start_2;
            case 'digit': return digit;
            case 'alpha': return alpha;
            case 'result': return result;
            case 'myList': return myList;
            case 'rec': return rec;
            case 'r2': return r2;
            case 'r2d': return r2d;
            default: return undefined;
        }
    }

    // StringLiteral
    function f() {
        if (AREP !== NIL) {
            if (ATYP !== STRING) return false;
            if (APOS + 3 > AREP.length) return false;
            if (AREP[APOS + 0] !== 0x66) return false;
            if (AREP[APOS + 1] !== 0x6f) return false;
            if (AREP[APOS + 2] !== 0x6f) return false;
            APOS += 3;
        }
        if (CREP !== NIL) {
            CREP[CPOS++] = 0x66;
            CREP[CPOS++] = 0x6f;
            CREP[CPOS++] = 0x6f;
        }
        return true;
    }
    f.constant = {value: "foo"};

    // StringLiteral
    function b_2() {
        if (AREP !== NIL) {
            if (ATYP !== STRING) return false;
            if (APOS + 3 > AREP.length) return false;
            if (AREP[APOS + 0] !== 0x62) return false;
            if (AREP[APOS + 1] !== 0x61) return false;
            if (AREP[APOS + 2] !== 0x72) return false;
            APOS += 3;
        }
        if (CREP !== NIL) {
            CREP[CPOS++] = 0x62;
            CREP[CPOS++] = 0x61;
            CREP[CPOS++] = 0x72;
        }
        return true;
    }
    b_2.constant = {value: "bar"};

    // StringLiteral
    function baz_2() {
        if (AREP !== NIL) {
            if (ATYP !== STRING) return false;
            if (APOS + 3 > AREP.length) return false;
            if (AREP[APOS + 0] !== 0x62) return false;
            if (AREP[APOS + 1] !== 0x61) return false;
            if (AREP[APOS + 2] !== 0x7a) return false;
            APOS += 3;
        }
        if (CREP !== NIL) {
            CREP[CPOS++] = 0x62;
            CREP[CPOS++] = 0x61;
            CREP[CPOS++] = 0x7a;
        }
        return true;
    }
    baz_2.constant = {value: "baz"};

    // Module
    function Ɱ_a(member) {
        switch (member) {
            case 'f': return f;
            case 'b': return b_2;
            case 'baz': return baz_2;
            default: return undefined;
        }
    }

    // Module
    function Ɱ_b(member) {
        switch (member) {
            default: return undefined;
        }
    }

    // Module
    function Ɱ_c(member) {
        switch (member) {
            default: return undefined;
        }
    }

    // Module
    function Ɱ_d(member) {
        switch (member) {
            default: return undefined;
        }
    }

    // Identifier
    function util1(arg) {
        return Ɱ_util1(arg);
    }

    // Identifier
    function util2(arg) {
        return Ɱ_util2(arg);
    }

    // Module
    function util(member) {
        switch (member) {
            case 'util1': return util1;
            case 'util2': return util2;
            default: return undefined;
        }
    }

    // Module
    function Ɱ_util(member) {
        switch (member) {
            case 'util': return util;
            default: return undefined;
        }
    }

    // StringLiteral
    function util1_2() {
        if (AREP !== NIL) {
            if (ATYP !== STRING) return false;
            if (APOS + 5 > AREP.length) return false;
            if (AREP[APOS + 0] !== 0x75) return false;
            if (AREP[APOS + 1] !== 0x74) return false;
            if (AREP[APOS + 2] !== 0x69) return false;
            if (AREP[APOS + 3] !== 0x6c) return false;
            if (AREP[APOS + 4] !== 0x31) return false;
            APOS += 5;
        }
        if (CREP !== NIL) {
            CREP[CPOS++] = 0x75;
            CREP[CPOS++] = 0x74;
            CREP[CPOS++] = 0x69;
            CREP[CPOS++] = 0x6c;
            CREP[CPOS++] = 0x31;
        }
        return true;
    }
    util1_2.constant = {value: "util1"};

    // Module
    function Ɱ_util1(member) {
        switch (member) {
            case 'util1': return util1_2;
            default: return undefined;
        }
    }

    // StringLiteral
    function util2_2() {
        if (AREP !== NIL) {
            if (ATYP !== STRING) return false;
            if (APOS + 5 > AREP.length) return false;
            if (AREP[APOS + 0] !== 0x75) return false;
            if (AREP[APOS + 1] !== 0x74) return false;
            if (AREP[APOS + 2] !== 0x69) return false;
            if (AREP[APOS + 3] !== 0x6c) return false;
            if (AREP[APOS + 4] !== 0x32) return false;
            APOS += 5;
        }
        if (CREP !== NIL) {
            CREP[CPOS++] = 0x75;
            CREP[CPOS++] = 0x74;
            CREP[CPOS++] = 0x69;
            CREP[CPOS++] = 0x6c;
            CREP[CPOS++] = 0x32;
        }
        return true;
    }
    util2_2.constant = {value: "util2"};

    // Module
    function Ɱ_util2(member) {
        switch (member) {
            case 'util2': return util2_2;
            default: return undefined;
        }
    }

    return start_2;
})();
