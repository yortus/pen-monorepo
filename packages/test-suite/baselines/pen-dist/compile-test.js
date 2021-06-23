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
        const fieldLabels = [];
        for (const recordItem of recordItems) {
            if (recordItem.kind === 'Field') {
                let fieldLabel;
                if (typeof recordItem.label === 'string') {
                    fieldLabel = recordItem.label;
                }
                else {
                    if (!parseInner(recordItem.label, true))
                        return backtrack(APOSₒ, CPOSₒ);
                    assert(ATYP === STRING);
                    APOS -= 1;
                    fieldLabel = AREP[APOS];
                }
                if (fieldLabels.includes(fieldLabel))
                    return backtrack(APOSₒ, CPOSₒ);
                if (!parseInner(recordItem.expr, true))
                    return backtrack(APOSₒ, CPOSₒ);
                const fieldValue = AREP[--APOS];
                AREP[APOS++] = fieldLabel;
                AREP[APOS++] = fieldValue;
                fieldLabels.push(fieldLabel);
            }
            else {
                const apos = APOS;
                if (!recordItem.expr())
                    return backtrack(APOSₒ, CPOSₒ);
                for (let i = apos; i < APOS; i += 2) {
                    const fieldLabel = AREP[i];
                    if (fieldLabels.includes(fieldLabel))
                        return backtrack(APOSₒ, CPOSₒ);
                    fieldLabels.push(fieldLabel);
                }
            }
        }
        ATYP = RECORD;
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
                    if (typeof recordItem.label !== 'string') {
                        APOS = i << 1;
                        if (!printInner(recordItem.label, true))
                            continue;
                    }
                    else {
                        if (propName !== recordItem.label)
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
function isFunc(_x) {
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
const [NOTHING, SCALAR, STRING, LIST, RECORD] = [0, 1, 2, 4, 8];
const savepoint = () => [APOS, CPOS];
const backtrack = (APOSₒ, CPOSₒ, ATYPₒ) => (APOS = APOSₒ, CPOS = CPOSₒ, ATYP = ATYPₒ !== null && ATYPₒ !== void 0 ? ATYPₒ : NOTHING, false);
const theScalarArray = [];
const theBuffer = Buffer.alloc(2 ** 10);
function emitScalar(value) {
    if (APOS === 0)
        AREP = theScalarArray;
    AREP[APOS++] = value;
    ATYP = SCALAR;
}
function emitByte(value) {
    if (APOS === 0)
        AREP = theBuffer;
    AREP[APOS++] = value;
    ATYP = STRING;
}
function emitBytes(...values) {
    if (APOS === 0)
        AREP = theBuffer;
    for (let i = 0; i < values.length; ++i)
        AREP[APOS++] = values[i];
    ATYP = STRING;
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
function lazy(init) {
    let f;
    return function LAZ(arg) {
        try {
            return f(arg);
        }
        catch (err) {
            if (!(err instanceof TypeError) || !err.message.includes('f is not a function'))
                throw err;
            f = init();
            return f(arg);
        }
    };
}




// ------------------------------ Extensions ------------------------------
const extensions = {
};




// ------------------------------ PARSE ------------------------------
const parse = (() => {

    // StringLiteral
    function x() {
        if (CPOS + 7 > CREP.length) return false;
        if (CREP[CPOS + 0] !== 0x6f) return false;
        if (CREP[CPOS + 1] !== 0x75) return false;
        if (CREP[CPOS + 2] !== 0x74) return false;
        if (CREP[CPOS + 3] !== 0x65) return false;
        if (CREP[CPOS + 4] !== 0x72) return false;
        if (CREP[CPOS + 5] !== 0x20) return false;
        if (CREP[CPOS + 6] !== 0x78) return false;
        CPOS += 7;
        emitBytes(0x6f, 0x75, 0x74, 0x65, 0x72, 0x20, 0x78);
        return true;
    }
    x.constant = {value: "outer x"};

    // FunctionExpression
    function REP(ℙ1) {

        // MemberExpression
        function a(arg) {
            return ℙ1("a")(arg);
        }

        // SequenceExpression
        function 𝕊1() {
            const [APOSₒ, CPOSₒ] = savepoint(), ATYPₒ = ATYP;
            let seqType = NOTHING;
            ATYP = NOTHING;
            if (!a()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
            seqType |= ATYP;
            if (!x_3()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
            seqType |= ATYP;
            if (!a()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
            ATYP |= seqType;
            return true;
        }

        return 𝕊1;
    }

    // FunctionExpression
    function FUN(ℙ2) {

        // FunctionParameter
        function x_2(arg) {
            return ℙ2(arg);
        }

        // SequenceExpression
        function 𝕊2() {
            const [APOSₒ, CPOSₒ] = savepoint(), ATYPₒ = ATYP;
            let seqType = NOTHING;
            ATYP = NOTHING;
            if (!x_2()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
            seqType |= ATYP;
            if (!x_2()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
            ATYP |= seqType;
            return true;
        }

        return 𝕊2;
    }

    // StringLiteral
    function x_3() {
        if (CPOS + 7 > CREP.length) return false;
        if (CREP[CPOS + 0] !== 0x69) return false;
        if (CREP[CPOS + 1] !== 0x6e) return false;
        if (CREP[CPOS + 2] !== 0x6e) return false;
        if (CREP[CPOS + 3] !== 0x65) return false;
        if (CREP[CPOS + 4] !== 0x72) return false;
        if (CREP[CPOS + 5] !== 0x20) return false;
        if (CREP[CPOS + 6] !== 0x78) return false;
        CPOS += 7;
        emitBytes(0x69, 0x6e, 0x6e, 0x65, 0x72, 0x20, 0x78);
        return true;
    }
    x_3.constant = {value: "inner x"};

    // NumericLiteral
    function a_2() {
        emitScalar(42);
        return true;
    }
    a_2.constant = {value: 42};

    // Module
    function nested(member) {
        switch (member) {
            case 'REP': return REP;
            case 'FUN': return FUN;
            case 'x': return x_3;
            case 'a': return a_2;
            default: return undefined;
        }
    }

    // StringLiteral
    function lx() {
        if (CPOS + 7 > CREP.length) return false;
        if (CREP[CPOS + 0] !== 0x69) return false;
        if (CREP[CPOS + 1] !== 0x6e) return false;
        if (CREP[CPOS + 2] !== 0x6e) return false;
        if (CREP[CPOS + 3] !== 0x65) return false;
        if (CREP[CPOS + 4] !== 0x72) return false;
        if (CREP[CPOS + 5] !== 0x20) return false;
        if (CREP[CPOS + 6] !== 0x78) return false;
        CPOS += 7;
        emitBytes(0x69, 0x6e, 0x6e, 0x65, 0x72, 0x20, 0x78);
        return true;
    }
    lx.constant = {value: "inner x"};

    // StringLiteral
    function ly() {
        if (CPOS + 3 > CREP.length) return false;
        if (CREP[CPOS + 0] !== 0x2a) return false;
        if (CREP[CPOS + 1] !== 0x2a) return false;
        if (CREP[CPOS + 2] !== 0x2a) return false;
        CPOS += 3;
        emitBytes(0x2a, 0x2a, 0x2a);
        return true;
    }
    ly.constant = {value: "***"};

    // SequenceExpression
    function letexpr() {
        const [APOSₒ, CPOSₒ] = savepoint(), ATYPₒ = ATYP;
        let seqType = NOTHING;
        ATYP = NOTHING;
        if (!lx()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        seqType |= ATYP;
        if (!letexpr_sub1()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        seqType |= ATYP;
        if (!lx()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        ATYP |= seqType;
        return true;
    }

    // ByteExpression
    function letexpr_sub1() {
        let cc;
        if (CPOS >= CREP.length) return false;
        cc = CREP[CPOS];
        if (cc !== 0x2d) return false;
        CPOS += 1;
        emitByte(cc);
        return true;
    }

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

    // ApplicationExpression
    const start_2_sub1 = lazy(() => REP(start_2_sub2));

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

    // StringLiteral
    function x() {
        if (ATYP !== STRING) return false;
        if (APOS + 7 > AREP.length) return false;
        if (AREP[APOS + 0] !== 0x6f) return false;
        if (AREP[APOS + 1] !== 0x75) return false;
        if (AREP[APOS + 2] !== 0x74) return false;
        if (AREP[APOS + 3] !== 0x65) return false;
        if (AREP[APOS + 4] !== 0x72) return false;
        if (AREP[APOS + 5] !== 0x20) return false;
        if (AREP[APOS + 6] !== 0x78) return false;
        APOS += 7;
        CREP[CPOS++] = 0x6f;
        CREP[CPOS++] = 0x75;
        CREP[CPOS++] = 0x74;
        CREP[CPOS++] = 0x65;
        CREP[CPOS++] = 0x72;
        CREP[CPOS++] = 0x20;
        CREP[CPOS++] = 0x78;
        return true;
    }
    x.constant = {value: "outer x"};

    // FunctionExpression
    function REP(ℙ1) {

        // MemberExpression
        function a(arg) {
            return ℙ1("a")(arg);
        }

        // SequenceExpression
        function 𝕊1() {
            const [APOSₒ, CPOSₒ] = savepoint(), ATYPₒ = ATYP;
            if (!a()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
            if (!x_3()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
            if (!a()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
            return true;
        }

        return 𝕊1;
    }

    // FunctionExpression
    function FUN(ℙ2) {

        // FunctionParameter
        function x_2(arg) {
            return ℙ2(arg);
        }

        // SequenceExpression
        function 𝕊2() {
            const [APOSₒ, CPOSₒ] = savepoint(), ATYPₒ = ATYP;
            if (!x_2()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
            if (!x_2()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
            return true;
        }

        return 𝕊2;
    }

    // StringLiteral
    function x_3() {
        if (ATYP !== STRING) return false;
        if (APOS + 7 > AREP.length) return false;
        if (AREP[APOS + 0] !== 0x69) return false;
        if (AREP[APOS + 1] !== 0x6e) return false;
        if (AREP[APOS + 2] !== 0x6e) return false;
        if (AREP[APOS + 3] !== 0x65) return false;
        if (AREP[APOS + 4] !== 0x72) return false;
        if (AREP[APOS + 5] !== 0x20) return false;
        if (AREP[APOS + 6] !== 0x78) return false;
        APOS += 7;
        CREP[CPOS++] = 0x69;
        CREP[CPOS++] = 0x6e;
        CREP[CPOS++] = 0x6e;
        CREP[CPOS++] = 0x65;
        CREP[CPOS++] = 0x72;
        CREP[CPOS++] = 0x20;
        CREP[CPOS++] = 0x78;
        return true;
    }
    x_3.constant = {value: "inner x"};

    // NumericLiteral
    function a_2() {
        if (ATYP !== SCALAR) return false;
        if (AREP[APOS] !== 42) return false;
        APOS += 1;
        return true;
    }
    a_2.constant = {value: 42};

    // Module
    function nested(member) {
        switch (member) {
            case 'REP': return REP;
            case 'FUN': return FUN;
            case 'x': return x_3;
            case 'a': return a_2;
            default: return undefined;
        }
    }

    // StringLiteral
    function lx() {
        if (ATYP !== STRING) return false;
        if (APOS + 7 > AREP.length) return false;
        if (AREP[APOS + 0] !== 0x69) return false;
        if (AREP[APOS + 1] !== 0x6e) return false;
        if (AREP[APOS + 2] !== 0x6e) return false;
        if (AREP[APOS + 3] !== 0x65) return false;
        if (AREP[APOS + 4] !== 0x72) return false;
        if (AREP[APOS + 5] !== 0x20) return false;
        if (AREP[APOS + 6] !== 0x78) return false;
        APOS += 7;
        CREP[CPOS++] = 0x69;
        CREP[CPOS++] = 0x6e;
        CREP[CPOS++] = 0x6e;
        CREP[CPOS++] = 0x65;
        CREP[CPOS++] = 0x72;
        CREP[CPOS++] = 0x20;
        CREP[CPOS++] = 0x78;
        return true;
    }
    lx.constant = {value: "inner x"};

    // StringLiteral
    function ly() {
        if (ATYP !== STRING) return false;
        if (APOS + 3 > AREP.length) return false;
        if (AREP[APOS + 0] !== 0x2a) return false;
        if (AREP[APOS + 1] !== 0x2a) return false;
        if (AREP[APOS + 2] !== 0x2a) return false;
        APOS += 3;
        CREP[CPOS++] = 0x2a;
        CREP[CPOS++] = 0x2a;
        CREP[CPOS++] = 0x2a;
        return true;
    }
    ly.constant = {value: "***"};

    // SequenceExpression
    function letexpr() {
        const [APOSₒ, CPOSₒ] = savepoint(), ATYPₒ = ATYP;
        if (!lx()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        if (!letexpr_sub1()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        if (!lx()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        return true;
    }

    // ByteExpression
    function letexpr_sub1() {
        let cc;
        if (ATYP !== STRING) return false;
        if (APOS >= AREP.length) return false;
        cc = AREP[APOS];
        if (cc !== 0x2d) return false;
        APOS += 1;
        CREP[CPOS++] = cc;
        return true;
    }

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

    // ApplicationExpression
    const start_2_sub1 = lazy(() => REP(start_2_sub2));

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
