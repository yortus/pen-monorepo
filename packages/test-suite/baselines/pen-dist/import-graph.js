
// ------------------------------ Main exports ------------------------------
module.exports = {
    parse(stringOrBuffer) {
        return parse(parseStartRule, stringOrBuffer);
    },
    print(value, buffer) {
        return print(printStartRule, value, buffer);
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
let IREP;
let IPOS = 0;
let ILEN = 0;
let OREP;
let OPOS = 0;
let ATYP = 0;
const [NOTHING, SCALAR, STRING_CHARS, LIST_ELEMENTS, RECORD_FIELDS] = [0, 1, 2, 4, 8];
const internalBuffer = Buffer.alloc(2 ** 16);
function parse(startRule, stringOrBuffer) {
    IREP = Buffer.isBuffer(stringOrBuffer) ? stringOrBuffer : Buffer.from(stringOrBuffer, 'utf8');
    IPOS = 0;
    ILEN = IREP.length;
    OREP = [];
    OPOS = 0;
    if (!parseValue(startRule))
        throw new Error('parse failed');
    if (IPOS !== ILEN)
        throw new Error('parse didn\\\'t consume entire input');
    if (OPOS !== 1)
        throw new Error('parse didn\\\'t produce a singular value');
    return OREP[0];
}
function print(startRule, value, buffer) {
    IREP = [value];
    IPOS = 0;
    ILEN = 1;
    OREP = buffer || Buffer.alloc(2 ** 22);
    OPOS = 0;
    if (!printValue(startRule))
        throw new Error('print failed');
    if (OPOS > OREP.length)
        throw new Error('output buffer too small');
    return buffer ? OPOS : OREP.toString('utf8', 0, OPOS);
}
function parseValue(rule) {
    const OPOSₒ = OPOS, ATYPₒ = ATYP;
    ATYP = NOTHING;
    if (!rule())
        return ATYP = ATYPₒ, false;
    if (ATYP === NOTHING)
        return OPOS = OPOSₒ, ATYP = ATYPₒ, false;
    let value;
    switch (ATYP) {
        case SCALAR:
            assert(OPOS === OPOSₒ + 1);
            value = OREP[OPOSₒ];
            break;
        case STRING_CHARS:
            const len = OPOS - OPOSₒ;
            for (let i = 0; i < len; ++i)
                internalBuffer[i] = OREP[OPOSₒ + i];
            value = internalBuffer.toString('utf8', 0, len);
            break;
        case LIST_ELEMENTS:
            value = OREP.slice(OPOSₒ, OPOS);
            break;
        case RECORD_FIELDS:
            const obj = value = {};
            for (let i = OPOSₒ; i < OPOS; i += 2)
                obj[OREP[i]] = OREP[i + 1];
            if (Object.keys(obj).length * 2 < (OPOS - OPOSₒ))
                throw new Error(`Duplicate labels in record`);
            break;
        default:
            ((atyp) => { throw new Error(`Unhandled abstract type ${atyp}`); })(ATYP);
    }
    OREP[OPOSₒ] = value;
    OPOS = OPOSₒ + 1;
    ATYP = ATYPₒ;
    return true;
}
function parseInferValue(infer) {
    const OPOSₒ = OPOS, ATYPₒ = ATYP;
    ATYP = NOTHING;
    infer();
    if (ATYP === NOTHING)
        return OPOS = OPOSₒ, ATYP = ATYPₒ, undefined;
    let value;
    switch (ATYP) {
        case SCALAR:
            assert(OPOS === OPOSₒ + 1);
            value = OREP[OPOSₒ];
            break;
        case STRING_CHARS:
            const len = OPOS - OPOSₒ;
            for (let i = 0; i < len; ++i)
                internalBuffer[i] = OREP[OPOSₒ + i];
            value = internalBuffer.toString('utf8', 0, len);
            break;
        case LIST_ELEMENTS:
            value = OREP.slice(OPOSₒ, OPOS);
            break;
        case RECORD_FIELDS:
            const obj = value = {};
            for (let i = OPOSₒ; i < OPOS; i += 2)
                obj[OREP[i]] = OREP[i + 1];
            break;
        default:
            ((atyp) => { throw new Error(`Unhandled abstract type ${atyp}`); })(ATYP);
    }
    OREP[OPOSₒ] = value;
    OPOS = OPOSₒ + 1;
    ATYP = ATYPₒ;
}
function printValue(rule) {
    const IPOSₒ = IPOS, IREPₒ = IREP, ILENₒ = ILEN, ATYPₒ = ATYP;
    let value = IREP[IPOS];
    let atyp;
    let objKeys;
    if (value === undefined) {
        return false;
    }
    if (value === null || value === true || value === false || typeof value === 'number') {
        ILEN = 1, ATYP = SCALAR;
        const result = rule();
        ILEN = ILENₒ, ATYP = ATYPₒ;
        assert(IPOS === IPOSₒ + 1);
        return result;
    }
    if (typeof value === 'string') {
        IREP = internalBuffer;
        ILEN = internalBuffer.write(value, 0, undefined, 'utf8');
        atyp = ATYP = STRING_CHARS;
    }
    else if (Array.isArray(value)) {
        IREP = value;
        ILEN = value.length;
        atyp = ATYP = LIST_ELEMENTS;
    }
    else if (typeof value === 'object' && value !== null) {
        const arr = IREP = [];
        objKeys = Object.keys(value);
        assert(objKeys.length < 32);
        for (let i = 0; i < objKeys.length; ++i)
            arr.push(objKeys[i], value[objKeys[i]]);
        ILEN = arr.length;
        atyp = ATYP = RECORD_FIELDS;
    }
    else {
        throw new Error(`Unsupported value type for value ${value}`);
    }
    IPOS = 0;
    let result = rule();
    const ipos = IPOS, ilen = ILEN;
    IREP = IREPₒ, IPOS = IPOSₒ, ILEN = ILENₒ, ATYP = ATYPₒ;
    if (!result)
        return false;
    if (atyp === RECORD_FIELDS) {
        const keyCount = objKeys.length;
        if (keyCount > 0 && (ipos !== -1 >>> (32 - keyCount)))
            return false;
    }
    else {
        if (ipos !== ilen)
            return false;
    }
    IPOS += 1;
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
const parseStartRule = createStartRule('parse');
const printStartRule = createStartRule('print');
function createStartRule(mode) {

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
                if (IPOS >= ILEN) return false;
                cc = IREP[IPOS];
                if ((cc < 0x30 || cc > 0x39)) return false;
                IPOS += 1;
                OREP[OPOS++] = cc;
                ATYP |= STRING_CHARS
                return true;
            },
            infer: () => {
                OREP[OPOS++] = 0x30;
                ATYP |= STRING_CHARS
            },
        },
        print: {
            full: function BYT() {
                let cc;
                if (ATYP !== STRING_CHARS) return false;
                if (IPOS >= ILEN) return false;
                cc = IREP[IPOS];
                if ((cc < 0x30 || cc > 0x39)) return false;
                IPOS += 1;
                OREP[OPOS++] = cc;
                return true;
            },
            infer: () => {
                OREP[OPOS++] = 0x30;
            },
        },
    });

    // ByteExpression
    const ꐚalpha = createRule(mode, {
        parse: {
            full: function BYT() {
                let cc;
                if (IPOS >= ILEN) return false;
                cc = IREP[IPOS];
                if ((cc < 0x61 || cc > 0x7a) && (cc < 0x41 || cc > 0x5a)) return false;
                IPOS += 1;
                OREP[OPOS++] = cc;
                ATYP |= STRING_CHARS
                return true;
            },
            infer: () => {
                OREP[OPOS++] = 0x61;
                ATYP |= STRING_CHARS
            },
        },
        print: {
            full: function BYT() {
                let cc;
                if (ATYP !== STRING_CHARS) return false;
                if (IPOS >= ILEN) return false;
                cc = IREP[IPOS];
                if ((cc < 0x61 || cc > 0x7a) && (cc < 0x41 || cc > 0x5a)) return false;
                IPOS += 1;
                OREP[OPOS++] = cc;
                return true;
            },
            infer: () => {
                OREP[OPOS++] = 0x61;
            },
        },
    });

    // SequenceExpression
    const ꐚresult = createRule(mode, {
        parse: {
            full: function SEQ() {
                const IPOSₒ = IPOS, OPOSₒ = OPOS, ATYPₒ = ATYP;
                if (!ꐚfoo()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚresultᱻ1()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                return true;
            },
            infer: () => {
                ꐚfoo.infer();
                ꐚresultᱻ1.infer();
            },
        },
        print: {
            full: function SEQ() {
                const IPOSₒ = IPOS, OPOSₒ = OPOS, ATYPₒ = ATYP;
                if (!ꐚfoo()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚresultᱻ1()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
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
                const IPOSₒ = IPOS, OPOSₒ = OPOS, ATYPₒ = ATYP;
                if (!ꐚbar()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚbaz()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                return true;
            },
            infer: () => {
                ꐚbar.infer();
                ꐚbaz.infer();
            },
        },
        print: {
            full: function SEQ() {
                const IPOSₒ = IPOS, OPOSₒ = OPOS, ATYPₒ = ATYP;
                if (!ꐚbar()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚbaz()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
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
                const IPOSₒ = IPOS, OPOSₒ = OPOS, ATYPₒ = ATYP;
                if (!parseValue(ꐚdigit)) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!parseValue(ꐚmyListᱻ1)) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!parseValue(ꐚmyListᱻ2)) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                ATYP |= LIST_ELEMENTS;
                return true;
            },
            infer: function LST() {
                parseInferValue(ꐚdigit.infer);
                parseInferValue(ꐚmyListᱻ1.infer);
                parseInferValue(ꐚmyListᱻ2.infer);
                ATYP |= LIST_ELEMENTS;
            },
        },
        print: {
            full: function LST() {
                if (ATYP !== LIST_ELEMENTS) return false;
                const IPOSₒ = IPOS, OPOSₒ = OPOS, ATYPₒ = ATYP;
                if (!printValue(ꐚdigit)) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!printValue(ꐚmyListᱻ1)) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!printValue(ꐚmyListᱻ2)) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
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
                const IPOSₒ = IPOS, OPOSₒ = OPOS, ATYPₒ = ATYP;
                if (!ꐚdigit()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚdigit()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                return true;
            },
            infer: () => {
                ꐚdigit.infer();
                ꐚdigit.infer();
            },
        },
        print: {
            full: function SEQ() {
                const IPOSₒ = IPOS, OPOSₒ = OPOS, ATYPₒ = ATYP;
                if (!ꐚdigit()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚdigit()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
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
                const IPOSₒ = IPOS, OPOSₒ = OPOS, ATYPₒ = ATYP;
                if (!ꐚdigit()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚdigit()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚdigit()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                return true;
            },
            infer: () => {
                ꐚdigit.infer();
                ꐚdigit.infer();
                ꐚdigit.infer();
            },
        },
        print: {
            full: function SEQ() {
                const IPOSₒ = IPOS, OPOSₒ = OPOS, ATYPₒ = ATYP;
                if (!ꐚdigit()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚdigit()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚdigit()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
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
                OREP[OPOS++] = 0x62;
                OREP[OPOS++] = 0x20;
                OREP[OPOS++] = 0x74;
                OREP[OPOS++] = 0x68;
                OREP[OPOS++] = 0x69;
                OREP[OPOS++] = 0x6e;
                OREP[OPOS++] = 0x67;
                ATYP |= STRING_CHARS;
                return true;
            },
            infer: function STR() {
                OREP[OPOS++] = 0x62;
                OREP[OPOS++] = 0x20;
                OREP[OPOS++] = 0x74;
                OREP[OPOS++] = 0x68;
                OREP[OPOS++] = 0x69;
                OREP[OPOS++] = 0x6e;
                OREP[OPOS++] = 0x67;
                ATYP |= STRING_CHARS;
            },
        },
        print: {
            full: function STR() {
                if (ATYP !== STRING_CHARS) return false;
                if (IPOS + 7 > ILEN) return false;
                if (IREP[IPOS + 0] !== 0x62) return false;
                if (IREP[IPOS + 1] !== 0x20) return false;
                if (IREP[IPOS + 2] !== 0x74) return false;
                if (IREP[IPOS + 3] !== 0x68) return false;
                if (IREP[IPOS + 4] !== 0x69) return false;
                if (IREP[IPOS + 5] !== 0x6e) return false;
                if (IREP[IPOS + 6] !== 0x67) return false;
                IPOS += 7;
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
                OREP[OPOS++] = 0x64;
                OREP[OPOS++] = 0x20;
                OREP[OPOS++] = 0x74;
                OREP[OPOS++] = 0x68;
                OREP[OPOS++] = 0x69;
                OREP[OPOS++] = 0x6e;
                OREP[OPOS++] = 0x67;
                ATYP |= STRING_CHARS;
                return true;
            },
            infer: function STR() {
                OREP[OPOS++] = 0x64;
                OREP[OPOS++] = 0x20;
                OREP[OPOS++] = 0x74;
                OREP[OPOS++] = 0x68;
                OREP[OPOS++] = 0x69;
                OREP[OPOS++] = 0x6e;
                OREP[OPOS++] = 0x67;
                ATYP |= STRING_CHARS;
            },
        },
        print: {
            full: function STR() {
                if (ATYP !== STRING_CHARS) return false;
                if (IPOS + 7 > ILEN) return false;
                if (IREP[IPOS + 0] !== 0x64) return false;
                if (IREP[IPOS + 1] !== 0x20) return false;
                if (IREP[IPOS + 2] !== 0x74) return false;
                if (IREP[IPOS + 3] !== 0x68) return false;
                if (IREP[IPOS + 4] !== 0x69) return false;
                if (IREP[IPOS + 5] !== 0x6e) return false;
                if (IREP[IPOS + 6] !== 0x67) return false;
                IPOS += 7;
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
                if (IPOS + 3 > ILEN) return false;
                if (IREP[IPOS + 0] !== 0x66) return false;
                if (IREP[IPOS + 1] !== 0x6f) return false;
                if (IREP[IPOS + 2] !== 0x6f) return false;
                IPOS += 3;
                OREP[OPOS++] = 0x66;
                OREP[OPOS++] = 0x6f;
                OREP[OPOS++] = 0x6f;
                ATYP |= STRING_CHARS;
                return true;
            },
            infer: function STR() {
                OREP[OPOS++] = 0x66;
                OREP[OPOS++] = 0x6f;
                OREP[OPOS++] = 0x6f;
                ATYP |= STRING_CHARS;
            },
        },
        print: {
            full: function STR() {
                if (ATYP !== STRING_CHARS) return false;
                if (IPOS + 3 > ILEN) return false;
                if (IREP[IPOS + 0] !== 0x66) return false;
                if (IREP[IPOS + 1] !== 0x6f) return false;
                if (IREP[IPOS + 2] !== 0x6f) return false;
                IPOS += 3;
                OREP[OPOS++] = 0x66;
                OREP[OPOS++] = 0x6f;
                OREP[OPOS++] = 0x6f;
                return true;
            },
            infer: function STR() {
                OREP[OPOS++] = 0x66;
                OREP[OPOS++] = 0x6f;
                OREP[OPOS++] = 0x6f;
            },
        },
        constant: "foo",
    });

    // StringLiteral
    const ꐚbᱻ2 = createRule(mode, {
        parse: {
            full: function STR() {
                if (IPOS + 3 > ILEN) return false;
                if (IREP[IPOS + 0] !== 0x62) return false;
                if (IREP[IPOS + 1] !== 0x61) return false;
                if (IREP[IPOS + 2] !== 0x72) return false;
                IPOS += 3;
                OREP[OPOS++] = 0x62;
                OREP[OPOS++] = 0x61;
                OREP[OPOS++] = 0x72;
                ATYP |= STRING_CHARS;
                return true;
            },
            infer: function STR() {
                OREP[OPOS++] = 0x62;
                OREP[OPOS++] = 0x61;
                OREP[OPOS++] = 0x72;
                ATYP |= STRING_CHARS;
            },
        },
        print: {
            full: function STR() {
                if (ATYP !== STRING_CHARS) return false;
                if (IPOS + 3 > ILEN) return false;
                if (IREP[IPOS + 0] !== 0x62) return false;
                if (IREP[IPOS + 1] !== 0x61) return false;
                if (IREP[IPOS + 2] !== 0x72) return false;
                IPOS += 3;
                OREP[OPOS++] = 0x62;
                OREP[OPOS++] = 0x61;
                OREP[OPOS++] = 0x72;
                return true;
            },
            infer: function STR() {
                OREP[OPOS++] = 0x62;
                OREP[OPOS++] = 0x61;
                OREP[OPOS++] = 0x72;
            },
        },
        constant: "bar",
    });

    // StringLiteral
    const ꐚbazᱻ2 = createRule(mode, {
        parse: {
            full: function STR() {
                if (IPOS + 3 > ILEN) return false;
                if (IREP[IPOS + 0] !== 0x62) return false;
                if (IREP[IPOS + 1] !== 0x61) return false;
                if (IREP[IPOS + 2] !== 0x7a) return false;
                IPOS += 3;
                OREP[OPOS++] = 0x62;
                OREP[OPOS++] = 0x61;
                OREP[OPOS++] = 0x7a;
                ATYP |= STRING_CHARS;
                return true;
            },
            infer: function STR() {
                OREP[OPOS++] = 0x62;
                OREP[OPOS++] = 0x61;
                OREP[OPOS++] = 0x7a;
                ATYP |= STRING_CHARS;
            },
        },
        print: {
            full: function STR() {
                if (ATYP !== STRING_CHARS) return false;
                if (IPOS + 3 > ILEN) return false;
                if (IREP[IPOS + 0] !== 0x62) return false;
                if (IREP[IPOS + 1] !== 0x61) return false;
                if (IREP[IPOS + 2] !== 0x7a) return false;
                IPOS += 3;
                OREP[OPOS++] = 0x62;
                OREP[OPOS++] = 0x61;
                OREP[OPOS++] = 0x7a;
                return true;
            },
            infer: function STR() {
                OREP[OPOS++] = 0x62;
                OREP[OPOS++] = 0x61;
                OREP[OPOS++] = 0x7a;
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
                OREP[OPOS++] = 0x75;
                OREP[OPOS++] = 0x74;
                OREP[OPOS++] = 0x69;
                OREP[OPOS++] = 0x6c;
                OREP[OPOS++] = 0x31;
                ATYP |= STRING_CHARS;
                return true;
            },
            infer: function STR() {
                OREP[OPOS++] = 0x75;
                OREP[OPOS++] = 0x74;
                OREP[OPOS++] = 0x69;
                OREP[OPOS++] = 0x6c;
                OREP[OPOS++] = 0x31;
                ATYP |= STRING_CHARS;
            },
        },
        print: {
            full: function STR() {
                if (ATYP !== STRING_CHARS) return false;
                if (IPOS + 5 > ILEN) return false;
                if (IREP[IPOS + 0] !== 0x75) return false;
                if (IREP[IPOS + 1] !== 0x74) return false;
                if (IREP[IPOS + 2] !== 0x69) return false;
                if (IREP[IPOS + 3] !== 0x6c) return false;
                if (IREP[IPOS + 4] !== 0x31) return false;
                IPOS += 5;
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
                OREP[OPOS++] = 0x75;
                OREP[OPOS++] = 0x74;
                OREP[OPOS++] = 0x69;
                OREP[OPOS++] = 0x6c;
                OREP[OPOS++] = 0x32;
                ATYP |= STRING_CHARS;
                return true;
            },
            infer: function STR() {
                OREP[OPOS++] = 0x75;
                OREP[OPOS++] = 0x74;
                OREP[OPOS++] = 0x69;
                OREP[OPOS++] = 0x6c;
                OREP[OPOS++] = 0x32;
                ATYP |= STRING_CHARS;
            },
        },
        print: {
            full: function STR() {
                if (ATYP !== STRING_CHARS) return false;
                if (IPOS + 5 > ILEN) return false;
                if (IREP[IPOS + 0] !== 0x75) return false;
                if (IREP[IPOS + 1] !== 0x74) return false;
                if (IREP[IPOS + 2] !== 0x69) return false;
                if (IREP[IPOS + 3] !== 0x6c) return false;
                if (IREP[IPOS + 4] !== 0x32) return false;
                IPOS += 5;
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
