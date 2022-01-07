
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
    const buf = OREP = buffer !== null && buffer !== void 0 ? buffer : Buffer.alloc(2 ** 22);
    OPOS = 0;
    if (!printValue(startRule))
        throw new Error('print failed');
    if (OPOS > OREP.length)
        throw new Error('output buffer too small');
    return buffer ? OPOS : buf.toString('utf8', 0, OPOS);
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
    else if (isObject(value)) {
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
function assert(value, message) {
    if (!value)
        throw new Error(`Assertion failed: ${message !== null && message !== void 0 ? message : 'no further details'}`);
}
function isObject(value) {
    return value !== null && typeof value === 'object';
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
    const ꐚstartᱻ2 = Object.assign(
        arg => ꐚfoo(arg),
        {infer: arg => ꐚfoo.infer(arg)},
    );

    // StringLiteral
    const ꐚfoo = createRule(mode, {
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
    const ꐚbar = createRule(mode, {
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

    // Identifier
    const ꐚa = Object.assign(
        arg => ꐚb(arg),
        {infer: arg => ꐚb.infer(arg)},
    );

    // Module
    const ꐚexpr = (member) => {
        switch (member) {
            case 'foo': return ꐚfoo;
            case 'bar': return ꐚbar;
            case 'a': return ꐚa;
            default: return undefined;
        }
    };

    // Identifier
    const ꐚaᱻ2 = Object.assign(
        arg => ꐚb(arg),
        {infer: arg => ꐚb.infer(arg)},
    );

    // StringLiteral
    const ꐚb = createRule(mode, {
        parse: {
            full: function STR() {
                if (IPOS + 2 > ILEN) return false;
                if (IREP[IPOS + 0] !== 0x62) return false;
                if (IREP[IPOS + 1] !== 0x32) return false;
                IPOS += 2;
                OREP[OPOS++] = 0x62;
                OREP[OPOS++] = 0x32;
                ATYP |= STRING_CHARS;
                return true;
            },
            infer: function STR() {
                OREP[OPOS++] = 0x62;
                OREP[OPOS++] = 0x32;
                ATYP |= STRING_CHARS;
            },
        },
        print: {
            full: function STR() {
                if (ATYP !== STRING_CHARS) return false;
                if (IPOS + 2 > ILEN) return false;
                if (IREP[IPOS + 0] !== 0x62) return false;
                if (IREP[IPOS + 1] !== 0x32) return false;
                IPOS += 2;
                OREP[OPOS++] = 0x62;
                OREP[OPOS++] = 0x32;
                return true;
            },
            infer: function STR() {
                OREP[OPOS++] = 0x62;
                OREP[OPOS++] = 0x32;
            },
        },
        constant: "b2",
    });

    // StringLiteral
    const ꐚbaz = createRule(mode, {
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

    // StringLiteral
    const ꐚmem = createRule(mode, {
        parse: {
            full: function STR() {
                if (IPOS + 6 > ILEN) return false;
                if (IREP[IPOS + 0] !== 0x6d) return false;
                if (IREP[IPOS + 1] !== 0x65) return false;
                if (IREP[IPOS + 2] !== 0x6d) return false;
                if (IREP[IPOS + 3] !== 0x62) return false;
                if (IREP[IPOS + 4] !== 0x65) return false;
                if (IREP[IPOS + 5] !== 0x72) return false;
                IPOS += 6;
                OREP[OPOS++] = 0x6d;
                OREP[OPOS++] = 0x65;
                OREP[OPOS++] = 0x6d;
                OREP[OPOS++] = 0x62;
                OREP[OPOS++] = 0x65;
                OREP[OPOS++] = 0x72;
                ATYP |= STRING_CHARS;
                return true;
            },
            infer: function STR() {
                OREP[OPOS++] = 0x6d;
                OREP[OPOS++] = 0x65;
                OREP[OPOS++] = 0x6d;
                OREP[OPOS++] = 0x62;
                OREP[OPOS++] = 0x65;
                OREP[OPOS++] = 0x72;
                ATYP |= STRING_CHARS;
            },
        },
        print: {
            full: function STR() {
                if (ATYP !== STRING_CHARS) return false;
                if (IPOS + 6 > ILEN) return false;
                if (IREP[IPOS + 0] !== 0x6d) return false;
                if (IREP[IPOS + 1] !== 0x65) return false;
                if (IREP[IPOS + 2] !== 0x6d) return false;
                if (IREP[IPOS + 3] !== 0x62) return false;
                if (IREP[IPOS + 4] !== 0x65) return false;
                if (IREP[IPOS + 5] !== 0x72) return false;
                IPOS += 6;
                OREP[OPOS++] = 0x6d;
                OREP[OPOS++] = 0x65;
                OREP[OPOS++] = 0x6d;
                OREP[OPOS++] = 0x62;
                OREP[OPOS++] = 0x65;
                OREP[OPOS++] = 0x72;
                return true;
            },
            infer: function STR() {
                OREP[OPOS++] = 0x6d;
                OREP[OPOS++] = 0x65;
                OREP[OPOS++] = 0x6d;
                OREP[OPOS++] = 0x62;
                OREP[OPOS++] = 0x65;
                OREP[OPOS++] = 0x72;
            },
        },
        constant: "member",
    });

    // SelectionExpression
    const ꐚmodExprMem = createRule(mode, {
        parse: {
            full: function SEL() { return ꐚfoo() || ꐚmem() || ꐚbaz(); },
            infer: () => ꐚfoo.infer(),
        },
        print: {
            full: function SEL() { return ꐚfoo() || ꐚmem() || ꐚbaz(); },
            infer: () => ꐚfoo.infer(),
        },
    });

    // SequenceExpression
    const ꐚaᱻ3 = createRule(mode, {
        parse: {
            full: function SEQ() {
                const IPOSₒ = IPOS, OPOSₒ = OPOS, ATYPₒ = ATYP;
                if (!ꐚaᱻ3ᱻ1()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚbᱻ2()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                return true;
            },
            infer: () => {
                ꐚaᱻ3ᱻ1.infer();
                ꐚbᱻ2.infer();
            },
        },
        print: {
            full: function SEQ() {
                const IPOSₒ = IPOS, OPOSₒ = OPOS, ATYPₒ = ATYP;
                if (!ꐚaᱻ3ᱻ1()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚbᱻ2()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                return true;
            },
            infer: () => {
                ꐚaᱻ3ᱻ1.infer();
                ꐚbᱻ2.infer();
            },
        },
    });

    // ByteExpression
    const ꐚaᱻ3ᱻ1 = createRule(mode, {
        parse: {
            full: function BYT() {
                let cc;
                if (IPOS >= ILEN) return false;
                cc = IREP[IPOS];
                if (cc !== 0x61) return false;
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
                if (cc !== 0x61) return false;
                IPOS += 1;
                OREP[OPOS++] = cc;
                return true;
            },
            infer: () => {
                OREP[OPOS++] = 0x61;
            },
        },
    });

    // Module
    const ꐚrecA = (member) => {
        switch (member) {
            case 'a': return ꐚaᱻ3;
            default: return undefined;
        }
    };

    // SequenceExpression
    const ꐚbᱻ2 = createRule(mode, {
        parse: {
            full: function SEQ() {
                const IPOSₒ = IPOS, OPOSₒ = OPOS, ATYPₒ = ATYP;
                if (!ꐚbᱻ2ᱻ1()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚaᱻ3()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                return true;
            },
            infer: () => {
                ꐚbᱻ2ᱻ1.infer();
                ꐚaᱻ3.infer();
            },
        },
        print: {
            full: function SEQ() {
                const IPOSₒ = IPOS, OPOSₒ = OPOS, ATYPₒ = ATYP;
                if (!ꐚbᱻ2ᱻ1()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚaᱻ3()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                return true;
            },
            infer: () => {
                ꐚbᱻ2ᱻ1.infer();
                ꐚaᱻ3.infer();
            },
        },
    });

    // ByteExpression
    const ꐚbᱻ2ᱻ1 = createRule(mode, {
        parse: {
            full: function BYT() {
                let cc;
                if (IPOS >= ILEN) return false;
                cc = IREP[IPOS];
                if (cc !== 0x62) return false;
                IPOS += 1;
                OREP[OPOS++] = cc;
                ATYP |= STRING_CHARS
                return true;
            },
            infer: () => {
                OREP[OPOS++] = 0x62;
                ATYP |= STRING_CHARS
            },
        },
        print: {
            full: function BYT() {
                let cc;
                if (ATYP !== STRING_CHARS) return false;
                if (IPOS >= ILEN) return false;
                cc = IREP[IPOS];
                if (cc !== 0x62) return false;
                IPOS += 1;
                OREP[OPOS++] = cc;
                return true;
            },
            infer: () => {
                OREP[OPOS++] = 0x62;
            },
        },
    });

    // Module
    const ꐚrecB = (member) => {
        switch (member) {
            case 'b': return ꐚbᱻ2;
            default: return undefined;
        }
    };

    // Identifier
    const ꐚrefC = Object.assign(
        arg => ꐚc1(arg),
        {infer: arg => ꐚc1.infer(arg)},
    );

    // StringLiteral
    const ꐚc1 = createRule(mode, {
        parse: {
            full: function STR() {
                if (IPOS + 2 > ILEN) return false;
                if (IREP[IPOS + 0] !== 0x63) return false;
                if (IREP[IPOS + 1] !== 0x31) return false;
                IPOS += 2;
                OREP[OPOS++] = 0x63;
                OREP[OPOS++] = 0x31;
                ATYP |= STRING_CHARS;
                return true;
            },
            infer: function STR() {
                OREP[OPOS++] = 0x63;
                OREP[OPOS++] = 0x31;
                ATYP |= STRING_CHARS;
            },
        },
        print: {
            full: function STR() {
                if (ATYP !== STRING_CHARS) return false;
                if (IPOS + 2 > ILEN) return false;
                if (IREP[IPOS + 0] !== 0x63) return false;
                if (IREP[IPOS + 1] !== 0x31) return false;
                IPOS += 2;
                OREP[OPOS++] = 0x63;
                OREP[OPOS++] = 0x31;
                return true;
            },
            infer: function STR() {
                OREP[OPOS++] = 0x63;
                OREP[OPOS++] = 0x31;
            },
        },
        constant: "c1",
    });

    // StringLiteral
    const ꐚc2 = createRule(mode, {
        parse: {
            full: function STR() {
                if (IPOS + 2 > ILEN) return false;
                if (IREP[IPOS + 0] !== 0x63) return false;
                if (IREP[IPOS + 1] !== 0x32) return false;
                IPOS += 2;
                OREP[OPOS++] = 0x63;
                OREP[OPOS++] = 0x32;
                ATYP |= STRING_CHARS;
                return true;
            },
            infer: function STR() {
                OREP[OPOS++] = 0x63;
                OREP[OPOS++] = 0x32;
                ATYP |= STRING_CHARS;
            },
        },
        print: {
            full: function STR() {
                if (ATYP !== STRING_CHARS) return false;
                if (IPOS + 2 > ILEN) return false;
                if (IREP[IPOS + 0] !== 0x63) return false;
                if (IREP[IPOS + 1] !== 0x32) return false;
                IPOS += 2;
                OREP[OPOS++] = 0x63;
                OREP[OPOS++] = 0x32;
                return true;
            },
            infer: function STR() {
                OREP[OPOS++] = 0x63;
                OREP[OPOS++] = 0x32;
            },
        },
        constant: "c2",
    });

    // Identifier
    const ꐚref1 = Object.assign(
        arg => ꐚc1(arg),
        {infer: arg => ꐚc1.infer(arg)},
    );

    // Identifier
    const ꐚref2 = Object.assign(
        arg => ꐚc1(arg),
        {infer: arg => ꐚc1.infer(arg)},
    );

    // Identifier
    const ꐚref3 = Object.assign(
        arg => ꐚc1(arg),
        {infer: arg => ꐚc1.infer(arg)},
    );

    // Module
    const ꐚc = (member) => {
        switch (member) {
            case 'c1': return ꐚc1;
            case 'c2': return ꐚc2;
            case 'ref1': return ꐚref1;
            case 'ref2': return ꐚref2;
            case 'ref3': return ꐚref3;
            default: return undefined;
        }
    };

    // Identifier
    const ꐚref5 = Object.assign(
        arg => ꐚc1(arg),
        {infer: arg => ꐚc1.infer(arg)},
    );

    // Identifier
    const ꐚref6 = Object.assign(
        arg => ꐚc1(arg),
        {infer: arg => ꐚc1.infer(arg)},
    );

    // Module
    const ꐚdefC = (member) => {
        switch (member) {
            case 'c': return ꐚc;
            case 'ref5': return ꐚref5;
            case 'ref6': return ꐚref6;
            default: return undefined;
        }
    };

    // Module
    const ꐚMODːcompile_test_OLD = (member) => {
        switch (member) {
            case 'start': return ꐚstartᱻ2;
            case 'expr': return ꐚexpr;
            case 'a': return ꐚaᱻ2;
            case 'b': return ꐚb;
            case 'baz': return ꐚbaz;
            case 'modExprMem': return ꐚmodExprMem;
            case 'recA': return ꐚrecA;
            case 'recB': return ꐚrecB;
            case 'refC': return ꐚrefC;
            case 'defC': return ꐚdefC;
            default: return undefined;
        }
    };

    return ꐚstartᱻ2;
}
