// ------------------------------ Main exports ------------------------------
module.exports = {
    parse(text) {
        CREP = text;
        CPOS = 0;
        AREP = [];
        APOS = 0;
        HAS_IN = HAS_OUT = true;
        if (!parseInner(parse, true)) throw new Error('parse failed');
        if (CPOS !== CREP.length) throw new Error('parse didn\'t consume entire input');
        return AREP[0];
    },
    print(node) {
        AREP = [node];
        APOS = 0;
        CREP = [];
        CPOS = 0;
        HAS_IN = HAS_OUT = true;
        if (!printInner(print, true)) throw new Error('print failed');
        return CREP.slice(0, CPOS).join('');
    },
};




// ------------------------------ Runtime ------------------------------
"use strict";
function parseList(listItems) {
    return function LST() {
        const [APOSₒ, CPOSₒ] = savepoint();
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
        const [APOSₒ, CPOSₒ, ATYPₒ] = savepoint();
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
                AREP[APOS - 1] = [fieldName, AREP[APOS - 1]];
                fieldNames.push(fieldName);
            }
            else {
                const apos = APOS;
                if (!recordItem.expr())
                    return backtrack(APOSₒ, CPOSₒ);
                for (let i = apos; i < APOS; ++i) {
                    const fieldName = AREP[i][0];
                    if (fieldNames.includes(fieldName))
                        return backtrack(APOSₒ, CPOSₒ);
                    fieldNames.push(fieldName);
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
        const [APOSₒ, CPOSₒ, ATYPₒ] = savepoint();
        const propList = AREP;
        const propCount = AREP.length;
        let bitmask = APOS;
        outerLoop: for (const recordItem of recordItems) {
            if (recordItem.kind === 'Field') {
                for (let i = 0; i < propCount; ++i) {
                    let propName = propList[i][0];
                    const propBit = 1 << i;
                    if ((bitmask & propBit) !== 0)
                        continue;
                    if (typeof recordItem.name !== 'string') {
                        AREP = propList[i];
                        APOS = 0;
                        if (!printInner(recordItem.name, true))
                            continue;
                    }
                    else {
                        if (propName !== recordItem.name)
                            continue;
                    }
                    AREP = propList[i];
                    APOS = 1;
                    if (!printInner(recordItem.expr, true))
                        continue;
                    bitmask += propBit;
                    continue outerLoop;
                }
                AREP = propList;
                return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
            }
            else {
                AREP = propList;
                APOS = bitmask;
                ATYP = RECORD;
                if (!recordItem.expr())
                    return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
                bitmask = APOS;
            }
        }
        AREP = propList;
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
const savepoint = () => [APOS, CPOS, ATYP];
const backtrack = (APOSₒ, CPOSₒ, ATYPₒ) => (APOS = APOSₒ, CPOS = CPOSₒ, ATYP = ATYPₒ !== null && ATYPₒ !== void 0 ? ATYPₒ : NOTHING, false);
function parseInner(rule, mustProduce) {
    const APOSₒ = APOS;
    if (!rule())
        return false;
    switch (ATYP) {
        case NOTHING:
            return mustProduce;
        case SCALAR:
            assert(APOS - APOSₒ === 1);
            return true;
        case STRING:
            if (APOS - APOSₒ > 1) {
                const str = AREP.slice(APOSₒ, APOS).join('');
                AREP[APOSₒ] = str;
                APOS = APOSₒ + 1;
            }
            return true;
        case LIST:
            const lst = AREP.slice(APOSₒ, APOS);
            AREP[APOSₒ] = lst;
            APOS = APOSₒ + 1;
            return true;
        case RECORD:
            const rec = Object.fromEntries(AREP.slice(APOSₒ, APOS));
            AREP[APOSₒ] = rec;
            APOS = APOSₒ + 1;
            return true;
        default:
            ((atyp) => { throw new Error(`Unhandled abstract type ${atyp}`); })(ATYP);
    }
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
        assert(APOS === APOSₒ);
        return result;
    }
    if (value === null || value === true || value === false || typeof value === 'number') {
        ATYP = SCALAR;
        const result = rule();
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
        AREP = value = [...Object.entries(value)];
        assert(AREP.length <= 32);
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
        const keyCount = value.length;
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

    // StringUniversal
    function x() {
        if (HAS_IN) {
            if (CPOS + 7 > CREP.length) return false;
            if (CREP.charCodeAt(CPOS + 0) !== 111) return false;
            if (CREP.charCodeAt(CPOS + 1) !== 117) return false;
            if (CREP.charCodeAt(CPOS + 2) !== 116) return false;
            if (CREP.charCodeAt(CPOS + 3) !== 101) return false;
            if (CREP.charCodeAt(CPOS + 4) !== 114) return false;
            if (CREP.charCodeAt(CPOS + 5) !== 32) return false;
            if (CREP.charCodeAt(CPOS + 6) !== 120) return false;
            CPOS += 7;
        }
        if (HAS_OUT) AREP[APOS++] = "outer x";
        ATYP = HAS_OUT ? STRING : NOTHING;
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
            const [APOSₒ, CPOSₒ, ATYPₒ] = savepoint();
            let seqType = NOTHING;
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

    // GenericExpression
    function GEN(ℙ2) {

        // GenericParameter
        function x_2(arg) {
            return ℙ2(arg);
        }

        // SequenceExpression
        function 𝕊2() {
            const [APOSₒ, CPOSₒ, ATYPₒ] = savepoint();
            let seqType = NOTHING;
            if (!x_2()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
            seqType |= ATYP;
            if (!x_2()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
            ATYP |= seqType;
            return true;
        }

        return 𝕊2;
    }

    // StringUniversal
    function x_3() {
        if (HAS_IN) {
            if (CPOS + 7 > CREP.length) return false;
            if (CREP.charCodeAt(CPOS + 0) !== 105) return false;
            if (CREP.charCodeAt(CPOS + 1) !== 110) return false;
            if (CREP.charCodeAt(CPOS + 2) !== 110) return false;
            if (CREP.charCodeAt(CPOS + 3) !== 101) return false;
            if (CREP.charCodeAt(CPOS + 4) !== 114) return false;
            if (CREP.charCodeAt(CPOS + 5) !== 32) return false;
            if (CREP.charCodeAt(CPOS + 6) !== 120) return false;
            CPOS += 7;
        }
        if (HAS_OUT) AREP[APOS++] = "inner x";
        ATYP = HAS_OUT ? STRING : NOTHING;
        return true;
    }
    x_3.constant = {value: "inner x"};

    // NumericLiteral
    function a_2() {
        if (HAS_OUT) AREP[APOS++] = 42;
        ATYP = HAS_OUT ? SCALAR : NOTHING;
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
            if (CPOS + 7 > CREP.length) return false;
            if (CREP.charCodeAt(CPOS + 0) !== 105) return false;
            if (CREP.charCodeAt(CPOS + 1) !== 110) return false;
            if (CREP.charCodeAt(CPOS + 2) !== 110) return false;
            if (CREP.charCodeAt(CPOS + 3) !== 101) return false;
            if (CREP.charCodeAt(CPOS + 4) !== 114) return false;
            if (CREP.charCodeAt(CPOS + 5) !== 32) return false;
            if (CREP.charCodeAt(CPOS + 6) !== 120) return false;
            CPOS += 7;
        }
        if (HAS_OUT) AREP[APOS++] = "inner x";
        ATYP = HAS_OUT ? STRING : NOTHING;
        return true;
    }
    lx.constant = {value: "inner x"};

    // StringUniversal
    function ly() {
        if (HAS_IN) {
            if (CPOS + 3 > CREP.length) return false;
            if (CREP.charCodeAt(CPOS + 0) !== 42) return false;
            if (CREP.charCodeAt(CPOS + 1) !== 42) return false;
            if (CREP.charCodeAt(CPOS + 2) !== 42) return false;
            CPOS += 3;
        }
        if (HAS_OUT) AREP[APOS++] = "***";
        ATYP = HAS_OUT ? STRING : NOTHING;
        return true;
    }
    ly.constant = {value: "***"};

    // SequenceExpression
    function letexpr() {
        const [APOSₒ, CPOSₒ, ATYPₒ] = savepoint();
        let seqType = NOTHING;
        if (!lx()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        seqType |= ATYP;
        if (!letexpr_sub1()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        seqType |= ATYP;
        if (!lx()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        ATYP |= seqType;
        return true;
    }

    // StringUniversal
    function letexpr_sub1() {
        if (HAS_IN) {
            if (CPOS + 1 > CREP.length) return false;
            if (CREP.charCodeAt(CPOS + 0) !== 45) return false;
            CPOS += 1;
        }
        if (HAS_OUT) AREP[APOS++] = "-";
        ATYP = HAS_OUT ? STRING : NOTHING;
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
            if (ATYP !== STRING) return false;
            if (APOS + 7 > AREP.length) return false;
            if (AREP.charCodeAt(APOS + 0) !== 111) return false;
            if (AREP.charCodeAt(APOS + 1) !== 117) return false;
            if (AREP.charCodeAt(APOS + 2) !== 116) return false;
            if (AREP.charCodeAt(APOS + 3) !== 101) return false;
            if (AREP.charCodeAt(APOS + 4) !== 114) return false;
            if (AREP.charCodeAt(APOS + 5) !== 32) return false;
            if (AREP.charCodeAt(APOS + 6) !== 120) return false;
            APOS += 7;
        }
        if (HAS_OUT) CREP[CPOS++] = "outer x";
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
            const [APOSₒ, CPOSₒ, ATYPₒ] = savepoint();
            if (!a()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
            if (!x_3()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
            if (!a()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
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
            const [APOSₒ, CPOSₒ, ATYPₒ] = savepoint();
            if (!x_2()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
            if (!x_2()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
            return true;
        }

        return 𝕊2;
    }

    // StringUniversal
    function x_3() {
        if (HAS_IN) {
            if (ATYP !== STRING) return false;
            if (APOS + 7 > AREP.length) return false;
            if (AREP.charCodeAt(APOS + 0) !== 105) return false;
            if (AREP.charCodeAt(APOS + 1) !== 110) return false;
            if (AREP.charCodeAt(APOS + 2) !== 110) return false;
            if (AREP.charCodeAt(APOS + 3) !== 101) return false;
            if (AREP.charCodeAt(APOS + 4) !== 114) return false;
            if (AREP.charCodeAt(APOS + 5) !== 32) return false;
            if (AREP.charCodeAt(APOS + 6) !== 120) return false;
            APOS += 7;
        }
        if (HAS_OUT) CREP[CPOS++] = "inner x";
        return true;
    }
    x_3.constant = {value: "inner x"};

    // NumericLiteral
    function a_2() {
        if (HAS_IN) {
            if (ATYP !== SCALAR) return false;
            if (AREP[APOS] !== 42) return false;
            APOS += 1;
        }
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
            if (ATYP !== STRING) return false;
            if (APOS + 7 > AREP.length) return false;
            if (AREP.charCodeAt(APOS + 0) !== 105) return false;
            if (AREP.charCodeAt(APOS + 1) !== 110) return false;
            if (AREP.charCodeAt(APOS + 2) !== 110) return false;
            if (AREP.charCodeAt(APOS + 3) !== 101) return false;
            if (AREP.charCodeAt(APOS + 4) !== 114) return false;
            if (AREP.charCodeAt(APOS + 5) !== 32) return false;
            if (AREP.charCodeAt(APOS + 6) !== 120) return false;
            APOS += 7;
        }
        if (HAS_OUT) CREP[CPOS++] = "inner x";
        return true;
    }
    lx.constant = {value: "inner x"};

    // StringUniversal
    function ly() {
        if (HAS_IN) {
            if (ATYP !== STRING) return false;
            if (APOS + 3 > AREP.length) return false;
            if (AREP.charCodeAt(APOS + 0) !== 42) return false;
            if (AREP.charCodeAt(APOS + 1) !== 42) return false;
            if (AREP.charCodeAt(APOS + 2) !== 42) return false;
            APOS += 3;
        }
        if (HAS_OUT) CREP[CPOS++] = "***";
        return true;
    }
    ly.constant = {value: "***"};

    // SequenceExpression
    function letexpr() {
        const [APOSₒ, CPOSₒ, ATYPₒ] = savepoint();
        if (!lx()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        if (!letexpr_sub1()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        if (!lx()) return backtrack(APOSₒ, CPOSₒ, ATYPₒ);
        return true;
    }

    // StringUniversal
    function letexpr_sub1() {
        if (HAS_IN) {
            if (ATYP !== STRING) return false;
            if (APOS + 1 > AREP.length) return false;
            if (AREP.charCodeAt(APOS + 0) !== 45) return false;
            APOS += 1;
        }
        if (HAS_OUT) CREP[CPOS++] = "-";
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
