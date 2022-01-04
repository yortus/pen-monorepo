
// ------------------------------ Main exports ------------------------------
module.exports = {
    parse(strOrBuf) {
        CREP = Buffer.isBuffer(strOrBuf) ? strOrBuf : Buffer.from(strOrBuf, 'utf8');
        CPOS = 0;
        AREP = [];
        APOS = 0;
        if (!parseValue(parse)) throw new Error('parse failed');
        if (CPOS !== CREP.length) throw new Error('parse didn\'t consume entire input');
        return AREP[0];
    },
    print(node, buf) {
        AREP = [node];
        APOS = 0;
        CREP = buf || Buffer.alloc(2 ** 22); // 4MB
        CPOS = 0;
        if (!printValue(print)) throw new Error('print failed');
        if (CPOS > CREP.length) throw new Error('output buffer too small');
        return buf ? CPOS : CREP.toString('utf8', 0, CPOS);
    },
};




// ------------------------------ Runtime ------------------------------
"use strict";
function isRule(_x) {
    return true;
}
function isFunc(_x) {
    return true;
}
function isModule(_x) {
    return true;
}
function createRule(mode, impls) {
    if (!impls[mode])
        throw new Error(`${mode} object is missing`);
    if (!impls[mode].full)
        throw new Error(`${mode}.full function is missing`);
    if (!impls[mode].infer)
        throw new Error(`${mode}.infer function is missing`);
    const { full, infer } = impls[mode];
    const result = Object.assign(full, { infer });
    if (impls.hasOwnProperty('constant'))
        result.constant = impls.constant;
    return result;
}
let AREP = [];
let APOS = 0;
let ATYP = 0;
let CREP = Buffer.alloc(1);
let CPOS = 0;
const [NOTHING, SCALAR, STRING_CHARS, LIST_ELEMENTS, RECORD_FIELDS] = [0, 1, 2, 4, 8];
const OCTETS = Buffer.alloc(2 ** 10);
function emitScalar(value) {
    AREP[APOS++] = value;
    ATYP = SCALAR;
}
function emitByte(value) {
    OCTETS[APOS++] = value;
    ATYP = STRING_CHARS;
}
function emitBytes(...values) {
    for (let i = 0; i < values.length; ++i)
        OCTETS[APOS++] = values[i];
    ATYP = STRING_CHARS;
}
function parseValue(rule) {
    const APOSₒ = APOS;
    if (!rule())
        return APOS = APOSₒ, false;
    if (ATYP === NOTHING)
        return APOS = APOSₒ, false;
    let value;
    switch (ATYP) {
        case SCALAR:
            assert(APOS === APOSₒ + 1);
            value = AREP[APOSₒ];
            break;
        case STRING_CHARS:
            value = OCTETS.toString('utf8', APOSₒ, APOS);
            break;
        case LIST_ELEMENTS:
            value = AREP.slice(APOSₒ, APOS);
            break;
        case RECORD_FIELDS:
            const obj = value = {};
            for (let i = APOSₒ; i < APOS; i += 2)
                obj[AREP[i]] = AREP[i + 1];
            if (Object.keys(obj).length * 2 < (APOS - APOSₒ))
                throw new Error(`Duplicate labels in record`);
            break;
        default:
            ((atyp) => { throw new Error(`Unhandled abstract type ${atyp}`); })(ATYP);
    }
    AREP[APOSₒ] = value;
    APOS = APOSₒ + 1;
    return true;
}
function parseInferValue(infer) {
    const APOSₒ = APOS;
    infer();
    if (ATYP === NOTHING)
        return;
    let value;
    switch (ATYP) {
        case SCALAR:
            assert(APOS === APOSₒ + 1);
            value = AREP[APOSₒ];
            break;
        case STRING_CHARS:
            value = OCTETS.toString('utf8', APOSₒ, APOS);
            break;
        case LIST_ELEMENTS:
            value = AREP.slice(APOSₒ, APOS);
            break;
        case RECORD_FIELDS:
            const obj = value = {};
            for (let i = APOSₒ; i < APOS; i += 2)
                obj[AREP[i]] = AREP[i + 1];
            break;
        default:
            ((atyp) => { throw new Error(`Unhandled abstract type ${atyp}`); })(ATYP);
    }
    AREP[APOSₒ] = value;
    APOS = APOSₒ + 1;
}
function printValue(rule) {
    const APOSₒ = APOS, AREPₒ = AREP, ATYPₒ = ATYP;
    let value = AREP[APOS];
    let atyp;
    if (value === undefined) {
        return false;
    }
    if (value === null || value === true || value === false || typeof value === 'number') {
        ATYP = SCALAR;
        const result = rule();
        ATYP = ATYPₒ;
        assert(APOS - APOSₒ === 1);
        return result;
    }
    if (typeof value === 'string') {
        AREP = OCTETS.slice(0, OCTETS.write(value, 0));
        atyp = ATYP = STRING_CHARS;
    }
    else if (Array.isArray(value)) {
        AREP = value;
        atyp = ATYP = LIST_ELEMENTS;
    }
    else if (typeof value === 'object') {
        const arr = AREP = [];
        const keys = Object.keys(value);
        assert(keys.length < 32);
        for (let i = 0; i < keys.length; ++i)
            arr.push(keys[i], value[keys[i]]);
        value = arr;
        atyp = ATYP = RECORD_FIELDS;
    }
    else {
        throw new Error(`Unsupported value type for value ${value}`);
    }
    APOS = 0;
    let result = rule();
    const arep = AREP, apos = APOS;
    AREP = AREPₒ, APOS = APOSₒ, ATYP = ATYPₒ;
    if (!result)
        return false;
    if (atyp === RECORD_FIELDS) {
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
function printInferValue(infer) {
    const ATYPₒ = ATYP;
    ATYP = NOTHING;
    infer();
    ATYP = ATYPₒ;
}
function assert(value) {
    if (!value)
        throw new Error(`Assertion failed`);
}
function lazy(init) {
    let f;
    return Object.assign(function LAZ(arg) {
        try {
            return f(arg);
        }
        catch (err) {
            if (!(err instanceof TypeError) || !err.message.includes('f is not a function'))
                throw err;
            f = init();
            return f(arg);
        }
    }, {
        infer(arg) {
            try {
                return f.infer(arg);
            }
            catch (err) {
                f = init();
                return f.infer(arg);
            }
        }
    });
}




// ------------------------------ Extensions ------------------------------
const extensions = {
};




// ------------------------------ Program ------------------------------
const parse = create('parse');
const print = create('print');
function create(mode) {

    // Identifier
    const ꐚfoo = Object.assign(
        arg => ꐚf(arg),
        {infer: arg => ꐚf.infer(arg)},
    );

    // Identifier
    const ꐚbar = Object.assign(
        arg => ꐚbᱻ2(arg),
        {infer: arg => ꐚbᱻ2.infer(arg)},
    );

    // Identifier
    const ꐚbaz = Object.assign(
        arg => ꐚbazᱻ2(arg),
        {infer: arg => ꐚbazᱻ2.infer(arg)},
    );

    // Identifier
    const ꐚstartᱻ2 = Object.assign(
        arg => ꐚresult(arg),
        {infer: arg => ꐚresult.infer(arg)},
    );

    // ByteExpression
    const ꐚdigit = createRule(mode, {
        parse: {
            full: function BYT() {
                let cc;
                if (CPOS >= CREP.length) return false;
                cc = CREP[CPOS];
                if ((cc < 0x30 || cc > 0x39)) return false;
                CPOS += 1;
                emitByte(cc);
                return true;
            },
            infer: () => {
                emitByte(0x30);
            },
        },
        print: {
            full: function BYT() {
                let cc;
                if (ATYP !== STRING_CHARS) return false;
                if (APOS >= AREP.length) return false;
                cc = AREP[APOS];
                if ((cc < 0x30 || cc > 0x39)) return false;
                APOS += 1;
                CREP[CPOS++] = cc;
                return true;
            },
            infer: () => {
                CREP[CPOS++] = 0x30;
            },
        },
    });

    // ByteExpression
    const ꐚalpha = createRule(mode, {
        parse: {
            full: function BYT() {
                let cc;
                if (CPOS >= CREP.length) return false;
                cc = CREP[CPOS];
                if ((cc < 0x61 || cc > 0x7a) && (cc < 0x41 || cc > 0x5a)) return false;
                CPOS += 1;
                emitByte(cc);
                return true;
            },
            infer: () => {
                emitByte(0x61);
            },
        },
        print: {
            full: function BYT() {
                let cc;
                if (ATYP !== STRING_CHARS) return false;
                if (APOS >= AREP.length) return false;
                cc = AREP[APOS];
                if ((cc < 0x61 || cc > 0x7a) && (cc < 0x41 || cc > 0x5a)) return false;
                APOS += 1;
                CREP[CPOS++] = cc;
                return true;
            },
            infer: () => {
                CREP[CPOS++] = 0x61;
            },
        },
    });

    // SequenceExpression
    const ꐚresult = createRule(mode, {
        parse: {
            full: function SEQ() {
                const APOSₒ = APOS, CPOSₒ = CPOS;
                let seqType = ATYP = NOTHING;
                if (!ꐚfoo()) return APOS = APOSₒ, CPOS = CPOSₒ, false;
                seqType |= ATYP;
                if (!ꐚresultᱻ1()) return APOS = APOSₒ, CPOS = CPOSₒ, false;
                ATYP |= seqType;
                return true;
            },
            infer: () => {
                let seqType = ATYP = NOTHING;
                ꐚfoo.infer();
                seqType |= ATYP;
                ꐚresultᱻ1.infer();
                ATYP |= seqType;
            },
        },
        print: {
            full: function SEQ() {
                const APOSₒ = APOS, CPOSₒ = CPOS, ATYPₒ = ATYP;
                if (!ꐚfoo()) return APOS = APOSₒ, CPOS = CPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚresultᱻ1()) return APOS = APOSₒ, CPOS = CPOSₒ, ATYP = ATYPₒ, false;
                return true;
            },
            infer: () => {
                ꐚfoo.infer();
                ꐚresultᱻ1.infer();
            },
        },
    });

    // SequenceExpression
    const ꐚresultᱻ1 = createRule(mode, {
        parse: {
            full: function SEQ() {
                const APOSₒ = APOS, CPOSₒ = CPOS;
                let seqType = ATYP = NOTHING;
                if (!ꐚbar()) return APOS = APOSₒ, CPOS = CPOSₒ, false;
                seqType |= ATYP;
                if (!ꐚbaz()) return APOS = APOSₒ, CPOS = CPOSₒ, false;
                ATYP |= seqType;
                return true;
            },
            infer: () => {
                let seqType = ATYP = NOTHING;
                ꐚbar.infer();
                seqType |= ATYP;
                ꐚbaz.infer();
                ATYP |= seqType;
            },
        },
        print: {
            full: function SEQ() {
                const APOSₒ = APOS, CPOSₒ = CPOS, ATYPₒ = ATYP;
                if (!ꐚbar()) return APOS = APOSₒ, CPOS = CPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚbaz()) return APOS = APOSₒ, CPOS = CPOSₒ, ATYP = ATYPₒ, false;
                return true;
            },
            infer: () => {
                ꐚbar.infer();
                ꐚbaz.infer();
            },
        },
    });

    // ListExpression
    const ꐚmyList = createRule(mode, {
        parse: {
            full: function LST() {
                const APOSₒ = APOS, CPOSₒ = CPOS;
                if (!parseValue(ꐚdigit)) return APOS = APOSₒ, CPOS = CPOSₒ, false;
                if (!parseValue(ꐚmyListᱻ1)) return APOS = APOSₒ, CPOS = CPOSₒ, false;
                if (!parseValue(ꐚmyListᱻ2)) return APOS = APOSₒ, CPOS = CPOSₒ, false;
                ATYP = LIST_ELEMENTS;
                return true;
            },
            infer: function LST() {
                parseInferValue(ꐚdigit.infer);
                parseInferValue(ꐚmyListᱻ1.infer);
                parseInferValue(ꐚmyListᱻ2.infer);
                ATYP = LIST_ELEMENTS;
            },
        },
        print: {
            full: function LST() {
                if (ATYP !== LIST_ELEMENTS) return false;
                const APOSₒ = APOS, CPOSₒ = CPOS, ATYPₒ = ATYP;
                if (!printValue(ꐚdigit)) return APOS = APOSₒ, CPOS = CPOSₒ, ATYP = ATYPₒ, false;
                if (!printValue(ꐚmyListᱻ1)) return APOS = APOSₒ, CPOS = CPOSₒ, ATYP = ATYPₒ, false;
                if (!printValue(ꐚmyListᱻ2)) return APOS = APOSₒ, CPOS = CPOSₒ, ATYP = ATYPₒ, false;
                return true;
            },
            infer: function LST() {
                if (ATYP !== LIST_ELEMENTS && ATYP !== NOTHING) return false;
                printInferValue(ꐚdigit.infer);
                printInferValue(ꐚmyListᱻ1.infer);
                printInferValue(ꐚmyListᱻ2.infer);
            },
        },
    });

    // SequenceExpression
    const ꐚmyListᱻ1 = createRule(mode, {
        parse: {
            full: function SEQ() {
                const APOSₒ = APOS, CPOSₒ = CPOS;
                let seqType = ATYP = NOTHING;
                if (!ꐚdigit()) return APOS = APOSₒ, CPOS = CPOSₒ, false;
                seqType |= ATYP;
                if (!ꐚdigit()) return APOS = APOSₒ, CPOS = CPOSₒ, false;
                ATYP |= seqType;
                return true;
            },
            infer: () => {
                let seqType = ATYP = NOTHING;
                ꐚdigit.infer();
                seqType |= ATYP;
                ꐚdigit.infer();
                ATYP |= seqType;
            },
        },
        print: {
            full: function SEQ() {
                const APOSₒ = APOS, CPOSₒ = CPOS, ATYPₒ = ATYP;
                if (!ꐚdigit()) return APOS = APOSₒ, CPOS = CPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚdigit()) return APOS = APOSₒ, CPOS = CPOSₒ, ATYP = ATYPₒ, false;
                return true;
            },
            infer: () => {
                ꐚdigit.infer();
                ꐚdigit.infer();
            },
        },
    });

    // SequenceExpression
    const ꐚmyListᱻ2 = createRule(mode, {
        parse: {
            full: function SEQ() {
                const APOSₒ = APOS, CPOSₒ = CPOS;
                let seqType = ATYP = NOTHING;
                if (!ꐚdigit()) return APOS = APOSₒ, CPOS = CPOSₒ, false;
                seqType |= ATYP;
                if (!ꐚdigit()) return APOS = APOSₒ, CPOS = CPOSₒ, false;
                seqType |= ATYP;
                if (!ꐚdigit()) return APOS = APOSₒ, CPOS = CPOSₒ, false;
                ATYP |= seqType;
                return true;
            },
            infer: () => {
                let seqType = ATYP = NOTHING;
                ꐚdigit.infer();
                seqType |= ATYP;
                ꐚdigit.infer();
                seqType |= ATYP;
                ꐚdigit.infer();
                ATYP |= seqType;
            },
        },
        print: {
            full: function SEQ() {
                const APOSₒ = APOS, CPOSₒ = CPOS, ATYPₒ = ATYP;
                if (!ꐚdigit()) return APOS = APOSₒ, CPOS = CPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚdigit()) return APOS = APOSₒ, CPOS = CPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚdigit()) return APOS = APOSₒ, CPOS = CPOSₒ, ATYP = ATYPₒ, false;
                return true;
            },
            infer: () => {
                ꐚdigit.infer();
                ꐚdigit.infer();
                ꐚdigit.infer();
            },
        },
    });

    // StringLiteral
    const ꐚb = createRule(mode, {
        parse: {
            full: function STR() {
                emitBytes(0x62, 0x20, 0x74, 0x68, 0x69, 0x6e, 0x67);
                return true;
            },
            infer: function STR() {
                emitBytes(0x62, 0x20, 0x74, 0x68, 0x69, 0x6e, 0x67);
            },
        },
        print: {
            full: function STR() {
                if (ATYP !== STRING_CHARS) return false;
                if (APOS + 7 > AREP.length) return false;
                if (AREP[APOS + 0] !== 0x62) return false;
                if (AREP[APOS + 1] !== 0x20) return false;
                if (AREP[APOS + 2] !== 0x74) return false;
                if (AREP[APOS + 3] !== 0x68) return false;
                if (AREP[APOS + 4] !== 0x69) return false;
                if (AREP[APOS + 5] !== 0x6e) return false;
                if (AREP[APOS + 6] !== 0x67) return false;
                APOS += 7;
                return true;
            },
            infer: function STR() {
            },
        },
        constant: "b thing",
    });

    // StringLiteral
    const ꐚd = createRule(mode, {
        parse: {
            full: function STR() {
                emitBytes(0x64, 0x20, 0x74, 0x68, 0x69, 0x6e, 0x67);
                return true;
            },
            infer: function STR() {
                emitBytes(0x64, 0x20, 0x74, 0x68, 0x69, 0x6e, 0x67);
            },
        },
        print: {
            full: function STR() {
                if (ATYP !== STRING_CHARS) return false;
                if (APOS + 7 > AREP.length) return false;
                if (AREP[APOS + 0] !== 0x64) return false;
                if (AREP[APOS + 1] !== 0x20) return false;
                if (AREP[APOS + 2] !== 0x74) return false;
                if (AREP[APOS + 3] !== 0x68) return false;
                if (AREP[APOS + 4] !== 0x69) return false;
                if (AREP[APOS + 5] !== 0x6e) return false;
                if (AREP[APOS + 6] !== 0x67) return false;
                APOS += 7;
                return true;
            },
            infer: function STR() {
            },
        },
        constant: "d thing",
    });

    // Module
    const ꐚrec = (member) => {
        switch (member) {
            case 'b': return ꐚb;
            case 'd': return ꐚd;
            default: return undefined;
        }
    };

    // Identifier
    const ꐚr2 = Object.assign(
        arg => ꐚrec(arg),
        {infer: arg => ꐚrec.infer(arg)},
    );

    // Identifier
    const ꐚr2d = Object.assign(
        arg => ꐚd(arg),
        {infer: arg => ꐚd.infer(arg)},
    );

    // Module
    const ꐚMODːimport_graph = (member) => {
        switch (member) {
            case 'foo': return ꐚfoo;
            case 'bar': return ꐚbar;
            case 'baz': return ꐚbaz;
            case 'start': return ꐚstartᱻ2;
            case 'digit': return ꐚdigit;
            case 'alpha': return ꐚalpha;
            case 'result': return ꐚresult;
            case 'myList': return ꐚmyList;
            case 'rec': return ꐚrec;
            case 'r2': return ꐚr2;
            case 'r2d': return ꐚr2d;
            default: return undefined;
        }
    };

    // StringLiteral
    const ꐚf = createRule(mode, {
        parse: {
            full: function STR() {
                if (CPOS + 3 > CREP.length) return false;
                if (CREP[CPOS + 0] !== 0x66) return false;
                if (CREP[CPOS + 1] !== 0x6f) return false;
                if (CREP[CPOS + 2] !== 0x6f) return false;
                CPOS += 3;
                emitBytes(0x66, 0x6f, 0x6f);
                return true;
            },
            infer: function STR() {
                emitBytes(0x66, 0x6f, 0x6f);
            },
        },
        print: {
            full: function STR() {
                if (ATYP !== STRING_CHARS) return false;
                if (APOS + 3 > AREP.length) return false;
                if (AREP[APOS + 0] !== 0x66) return false;
                if (AREP[APOS + 1] !== 0x6f) return false;
                if (AREP[APOS + 2] !== 0x6f) return false;
                APOS += 3;
                CREP[CPOS++] = 0x66;
                CREP[CPOS++] = 0x6f;
                CREP[CPOS++] = 0x6f;
                return true;
            },
            infer: function STR() {
                CREP[CPOS++] = 0x66;
                CREP[CPOS++] = 0x6f;
                CREP[CPOS++] = 0x6f;
            },
        },
        constant: "foo",
    });

    // StringLiteral
    const ꐚbᱻ2 = createRule(mode, {
        parse: {
            full: function STR() {
                if (CPOS + 3 > CREP.length) return false;
                if (CREP[CPOS + 0] !== 0x62) return false;
                if (CREP[CPOS + 1] !== 0x61) return false;
                if (CREP[CPOS + 2] !== 0x72) return false;
                CPOS += 3;
                emitBytes(0x62, 0x61, 0x72);
                return true;
            },
            infer: function STR() {
                emitBytes(0x62, 0x61, 0x72);
            },
        },
        print: {
            full: function STR() {
                if (ATYP !== STRING_CHARS) return false;
                if (APOS + 3 > AREP.length) return false;
                if (AREP[APOS + 0] !== 0x62) return false;
                if (AREP[APOS + 1] !== 0x61) return false;
                if (AREP[APOS + 2] !== 0x72) return false;
                APOS += 3;
                CREP[CPOS++] = 0x62;
                CREP[CPOS++] = 0x61;
                CREP[CPOS++] = 0x72;
                return true;
            },
            infer: function STR() {
                CREP[CPOS++] = 0x62;
                CREP[CPOS++] = 0x61;
                CREP[CPOS++] = 0x72;
            },
        },
        constant: "bar",
    });

    // StringLiteral
    const ꐚbazᱻ2 = createRule(mode, {
        parse: {
            full: function STR() {
                if (CPOS + 3 > CREP.length) return false;
                if (CREP[CPOS + 0] !== 0x62) return false;
                if (CREP[CPOS + 1] !== 0x61) return false;
                if (CREP[CPOS + 2] !== 0x7a) return false;
                CPOS += 3;
                emitBytes(0x62, 0x61, 0x7a);
                return true;
            },
            infer: function STR() {
                emitBytes(0x62, 0x61, 0x7a);
            },
        },
        print: {
            full: function STR() {
                if (ATYP !== STRING_CHARS) return false;
                if (APOS + 3 > AREP.length) return false;
                if (AREP[APOS + 0] !== 0x62) return false;
                if (AREP[APOS + 1] !== 0x61) return false;
                if (AREP[APOS + 2] !== 0x7a) return false;
                APOS += 3;
                CREP[CPOS++] = 0x62;
                CREP[CPOS++] = 0x61;
                CREP[CPOS++] = 0x7a;
                return true;
            },
            infer: function STR() {
                CREP[CPOS++] = 0x62;
                CREP[CPOS++] = 0x61;
                CREP[CPOS++] = 0x7a;
            },
        },
        constant: "baz",
    });

    // Module
    const ꐚMODːa = (member) => {
        switch (member) {
            case 'f': return ꐚf;
            case 'b': return ꐚbᱻ2;
            case 'baz': return ꐚbazᱻ2;
            default: return undefined;
        }
    };

    // Module
    const ꐚMODːb = (member) => {
        switch (member) {
            default: return undefined;
        }
    };

    // Module
    const ꐚMODːc = (member) => {
        switch (member) {
            default: return undefined;
        }
    };

    // Module
    const ꐚMODːd = (member) => {
        switch (member) {
            default: return undefined;
        }
    };

    // Identifier
    const ꐚu1 = Object.assign(
        arg => ꐚMODːutil1(arg),
        {infer: arg => ꐚMODːutil1.infer(arg)},
    );

    // Identifier
    const ꐚu2 = Object.assign(
        arg => ꐚMODːutil2(arg),
        {infer: arg => ꐚMODːutil2.infer(arg)},
    );

    // Identifier
    const ꐚutil1 = Object.assign(
        arg => ꐚu1(arg),
        {infer: arg => ꐚu1.infer(arg)},
    );

    // Identifier
    const ꐚutil2 = Object.assign(
        arg => ꐚu2(arg),
        {infer: arg => ꐚu2.infer(arg)},
    );

    // Module
    const ꐚutil = (member) => {
        switch (member) {
            case 'util1': return ꐚutil1;
            case 'util2': return ꐚutil2;
            default: return undefined;
        }
    };

    // Module
    const ꐚMODːutil = (member) => {
        switch (member) {
            case 'u1': return ꐚu1;
            case 'u2': return ꐚu2;
            case 'util': return ꐚutil;
            default: return undefined;
        }
    };

    // StringLiteral
    const ꐚutil1ᱻ2 = createRule(mode, {
        parse: {
            full: function STR() {
                emitBytes(0x75, 0x74, 0x69, 0x6c, 0x31);
                return true;
            },
            infer: function STR() {
                emitBytes(0x75, 0x74, 0x69, 0x6c, 0x31);
            },
        },
        print: {
            full: function STR() {
                if (ATYP !== STRING_CHARS) return false;
                if (APOS + 5 > AREP.length) return false;
                if (AREP[APOS + 0] !== 0x75) return false;
                if (AREP[APOS + 1] !== 0x74) return false;
                if (AREP[APOS + 2] !== 0x69) return false;
                if (AREP[APOS + 3] !== 0x6c) return false;
                if (AREP[APOS + 4] !== 0x31) return false;
                APOS += 5;
                return true;
            },
            infer: function STR() {
            },
        },
        constant: "util1",
    });

    // Module
    const ꐚMODːutil1 = (member) => {
        switch (member) {
            case 'util1': return ꐚutil1ᱻ2;
            default: return undefined;
        }
    };

    // StringLiteral
    const ꐚutil2ᱻ2 = createRule(mode, {
        parse: {
            full: function STR() {
                emitBytes(0x75, 0x74, 0x69, 0x6c, 0x32);
                return true;
            },
            infer: function STR() {
                emitBytes(0x75, 0x74, 0x69, 0x6c, 0x32);
            },
        },
        print: {
            full: function STR() {
                if (ATYP !== STRING_CHARS) return false;
                if (APOS + 5 > AREP.length) return false;
                if (AREP[APOS + 0] !== 0x75) return false;
                if (AREP[APOS + 1] !== 0x74) return false;
                if (AREP[APOS + 2] !== 0x69) return false;
                if (AREP[APOS + 3] !== 0x6c) return false;
                if (AREP[APOS + 4] !== 0x32) return false;
                APOS += 5;
                return true;
            },
            infer: function STR() {
            },
        },
        constant: "util2",
    });

    // Module
    const ꐚMODːutil2 = (member) => {
        switch (member) {
            case 'util2': return ꐚutil2ᱻ2;
            default: return undefined;
        }
    };

    return ꐚstartᱻ2;
}
