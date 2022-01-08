
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
function parse(startRule, stringOrBuffer) {
    IREP = Buffer.isBuffer(stringOrBuffer) ? stringOrBuffer : Buffer.from(stringOrBuffer, 'utf8');
    IPOS = 0;
    OREP = [];
    OPOS = 0;
    if (!parseValue(startRule))
        throw new Error('parse failed');
    if (IPOS !== IREP.length)
        throw new Error('parse didn\\\'t consume entire input');
    if (OPOS !== 1)
        throw new Error('parse didn\\\'t produce a singular value');
    return OREP[0];
}
function print(startRule, value, buffer) {
    IREP = [value];
    IPOS = 0;
    const buf = OREP = buffer !== null && buffer !== void 0 ? buffer : Buffer.alloc(2 ** 22);
    OPOS = 0;
    if (!printValue(startRule))
        throw new Error('print failed');
    if (OPOS > OREP.length)
        throw new Error('output buffer too small');
    return buffer ? OPOS : buf.toString('utf8', 0, OPOS);
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
let IREP;
let IPOS = 0;
let OREP;
let OPOS = 0;
let ATYP = 0;
const [NOTHING, SCALAR, STRING_CHARS, LIST_ELEMENTS, RECORD_FIELDS] = [0, 1, 2, 4, 8];
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
                _internalBuffer[i] = OREP[OPOSₒ + i];
            value = _internalBuffer.toString('utf8', 0, len);
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
function printValue(rule) {
    const IPOSₒ = IPOS, IREPₒ = IREP, ATYPₒ = ATYP;
    let value = IREP[IPOS];
    let atyp;
    let objKeys;
    if (value === undefined) {
        return false;
    }
    if (value === null || value === true || value === false || typeof value === 'number') {
        ATYP = SCALAR;
        const result = rule();
        ATYP = ATYPₒ;
        assert(IPOS === IPOSₒ + 1);
        return result;
    }
    if (typeof value === 'string') {
        const len = _internalBuffer.write(value, 0, undefined, 'utf8');
        IREP = _internalBuffer.slice(0, len);
        atyp = ATYP = STRING_CHARS;
    }
    else if (Array.isArray(value)) {
        IREP = value;
        atyp = ATYP = LIST_ELEMENTS;
    }
    else if (isObject(value)) {
        const arr = IREP = [];
        objKeys = Object.keys(value);
        assert(objKeys.length < 32);
        for (let i = 0; i < objKeys.length; ++i)
            arr.push(objKeys[i], value[objKeys[i]]);
        atyp = ATYP = RECORD_FIELDS;
    }
    else {
        throw new Error(`Unsupported value type for value ${value}`);
    }
    IPOS = 0;
    let result = rule();
    const ipos = IPOS, ilen = IREP.length;
    IREP = IREPₒ, IPOS = IPOSₒ, ATYP = ATYPₒ;
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
const _internalBuffer = Buffer.alloc(2 ** 16);




// ------------------------------ Extensions ------------------------------
const extensions = {
};




// ------------------------------ Program ------------------------------
const parseStartRule = createStartRule('parse');
const printStartRule = createStartRule('print');
function createStartRule(mode) {

    // StringLiteral
    const ꐚx = createRule(mode, {
        parse: {
            full: function STR() {
                if (IPOS + 7 > IREP.length) return false;
                if (IREP[IPOS + 0] !== 0x6f) return false;
                if (IREP[IPOS + 1] !== 0x75) return false;
                if (IREP[IPOS + 2] !== 0x74) return false;
                if (IREP[IPOS + 3] !== 0x65) return false;
                if (IREP[IPOS + 4] !== 0x72) return false;
                if (IREP[IPOS + 5] !== 0x20) return false;
                if (IREP[IPOS + 6] !== 0x78) return false;
                IPOS += 7;
                OREP[OPOS++] = 0x6f;
                OREP[OPOS++] = 0x75;
                OREP[OPOS++] = 0x74;
                OREP[OPOS++] = 0x65;
                OREP[OPOS++] = 0x72;
                OREP[OPOS++] = 0x20;
                OREP[OPOS++] = 0x78;
                ATYP |= STRING_CHARS;
                return true;
            },
            infer: function STR() {
                OREP[OPOS++] = 0x6f;
                OREP[OPOS++] = 0x75;
                OREP[OPOS++] = 0x74;
                OREP[OPOS++] = 0x65;
                OREP[OPOS++] = 0x72;
                OREP[OPOS++] = 0x20;
                OREP[OPOS++] = 0x78;
                ATYP |= STRING_CHARS;
                return true;
            },
        },
        print: {
            full: function STR() {
                if (ATYP !== STRING_CHARS) return false;
                if (IPOS + 7 > IREP.length) return false;
                if (IREP[IPOS + 0] !== 0x6f) return false;
                if (IREP[IPOS + 1] !== 0x75) return false;
                if (IREP[IPOS + 2] !== 0x74) return false;
                if (IREP[IPOS + 3] !== 0x65) return false;
                if (IREP[IPOS + 4] !== 0x72) return false;
                if (IREP[IPOS + 5] !== 0x20) return false;
                if (IREP[IPOS + 6] !== 0x78) return false;
                IPOS += 7;
                OREP[OPOS++] = 0x6f;
                OREP[OPOS++] = 0x75;
                OREP[OPOS++] = 0x74;
                OREP[OPOS++] = 0x65;
                OREP[OPOS++] = 0x72;
                OREP[OPOS++] = 0x20;
                OREP[OPOS++] = 0x78;
                return true;
            },
            infer: function STR() {
                OREP[OPOS++] = 0x6f;
                OREP[OPOS++] = 0x75;
                OREP[OPOS++] = 0x74;
                OREP[OPOS++] = 0x65;
                OREP[OPOS++] = 0x72;
                OREP[OPOS++] = 0x20;
                OREP[OPOS++] = 0x78;
                return true;
            },
        },
        constant: "outer x",
    });

    // FunctionExpression
    const ꐚREP = (PARAMː1) => {

        // MemberExpression
        const ꐚa = (arg) => PARAMː1("a")(arg);

        // SequenceExpression
        const ꐚLET = createRule(mode, {
            parse: {
                full: function SEQ() {
                    const IPOSₒ = IPOS, OPOSₒ = OPOS, ATYPₒ = ATYP;
                    if (!ꐚa()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                    if (!ꐚxᱻ3()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                    if (!ꐚa()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                    return true;
                },
                infer: () => {
                    ꐚa.infer();
                    ꐚxᱻ3.infer();
                    ꐚa.infer();
                    return true;
                },
            },
            print: {
                full: function SEQ() {
                    const IPOSₒ = IPOS, OPOSₒ = OPOS, ATYPₒ = ATYP;
                    if (!ꐚa()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                    if (!ꐚxᱻ3()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                    if (!ꐚa()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                    return true;
                },
                infer: () => {
                    ꐚa.infer();
                    ꐚxᱻ3.infer();
                    ꐚa.infer();
                    return true;
                },
            },
        });

        return ꐚLET;
    };

    // FunctionExpression
    const ꐚFUN = (PARAMː2) => {

        // FunctionParameter
        const ꐚxᱻ2 = Object.assign(
            arg => PARAMː2(arg),
            {infer: arg => PARAMː2.infer(arg)},
        );

        // SequenceExpression
        const ꐚLET = createRule(mode, {
            parse: {
                full: function SEQ() {
                    const IPOSₒ = IPOS, OPOSₒ = OPOS, ATYPₒ = ATYP;
                    if (!ꐚxᱻ2()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                    if (!ꐚxᱻ2()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                    return true;
                },
                infer: () => {
                    ꐚxᱻ2.infer();
                    ꐚxᱻ2.infer();
                    return true;
                },
            },
            print: {
                full: function SEQ() {
                    const IPOSₒ = IPOS, OPOSₒ = OPOS, ATYPₒ = ATYP;
                    if (!ꐚxᱻ2()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                    if (!ꐚxᱻ2()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                    return true;
                },
                infer: () => {
                    ꐚxᱻ2.infer();
                    ꐚxᱻ2.infer();
                    return true;
                },
            },
        });

        return ꐚLET;
    };

    // StringLiteral
    const ꐚxᱻ3 = createRule(mode, {
        parse: {
            full: function STR() {
                if (IPOS + 7 > IREP.length) return false;
                if (IREP[IPOS + 0] !== 0x69) return false;
                if (IREP[IPOS + 1] !== 0x6e) return false;
                if (IREP[IPOS + 2] !== 0x6e) return false;
                if (IREP[IPOS + 3] !== 0x65) return false;
                if (IREP[IPOS + 4] !== 0x72) return false;
                if (IREP[IPOS + 5] !== 0x20) return false;
                if (IREP[IPOS + 6] !== 0x78) return false;
                IPOS += 7;
                OREP[OPOS++] = 0x69;
                OREP[OPOS++] = 0x6e;
                OREP[OPOS++] = 0x6e;
                OREP[OPOS++] = 0x65;
                OREP[OPOS++] = 0x72;
                OREP[OPOS++] = 0x20;
                OREP[OPOS++] = 0x78;
                ATYP |= STRING_CHARS;
                return true;
            },
            infer: function STR() {
                OREP[OPOS++] = 0x69;
                OREP[OPOS++] = 0x6e;
                OREP[OPOS++] = 0x6e;
                OREP[OPOS++] = 0x65;
                OREP[OPOS++] = 0x72;
                OREP[OPOS++] = 0x20;
                OREP[OPOS++] = 0x78;
                ATYP |= STRING_CHARS;
                return true;
            },
        },
        print: {
            full: function STR() {
                if (ATYP !== STRING_CHARS) return false;
                if (IPOS + 7 > IREP.length) return false;
                if (IREP[IPOS + 0] !== 0x69) return false;
                if (IREP[IPOS + 1] !== 0x6e) return false;
                if (IREP[IPOS + 2] !== 0x6e) return false;
                if (IREP[IPOS + 3] !== 0x65) return false;
                if (IREP[IPOS + 4] !== 0x72) return false;
                if (IREP[IPOS + 5] !== 0x20) return false;
                if (IREP[IPOS + 6] !== 0x78) return false;
                IPOS += 7;
                OREP[OPOS++] = 0x69;
                OREP[OPOS++] = 0x6e;
                OREP[OPOS++] = 0x6e;
                OREP[OPOS++] = 0x65;
                OREP[OPOS++] = 0x72;
                OREP[OPOS++] = 0x20;
                OREP[OPOS++] = 0x78;
                return true;
            },
            infer: function STR() {
                OREP[OPOS++] = 0x69;
                OREP[OPOS++] = 0x6e;
                OREP[OPOS++] = 0x6e;
                OREP[OPOS++] = 0x65;
                OREP[OPOS++] = 0x72;
                OREP[OPOS++] = 0x20;
                OREP[OPOS++] = 0x78;
                return true;
            },
        },
        constant: "inner x",
    });

    // NumericLiteral
    const ꐚaᱻ2 = createRule(mode, {
        parse: {
            full: () => {
                OREP[OPOS++] = 42;
                ATYP |= SCALAR;
                return true;
            },
            infer: () => {
                OREP[OPOS++] = 42;
                ATYP != SCALAR;
                return true;
            },
        },
        print: {
            full: function LIT() {
                if (ATYP !== SCALAR) return false;
                if (IREP[IPOS] !== 42) return false;
                IPOS += 1;
                return true;
            },
            infer: () => true,
        },
        constant: 42,
    });

    // Module
    const ꐚnested = (member) => {
        switch (member) {
            case 'REP': return ꐚREP;
            case 'FUN': return ꐚFUN;
            case 'x': return ꐚxᱻ3;
            case 'a': return ꐚaᱻ2;
            default: return undefined;
        }
    };

    // StringLiteral
    const ꐚlx = createRule(mode, {
        parse: {
            full: function STR() {
                if (IPOS + 7 > IREP.length) return false;
                if (IREP[IPOS + 0] !== 0x69) return false;
                if (IREP[IPOS + 1] !== 0x6e) return false;
                if (IREP[IPOS + 2] !== 0x6e) return false;
                if (IREP[IPOS + 3] !== 0x65) return false;
                if (IREP[IPOS + 4] !== 0x72) return false;
                if (IREP[IPOS + 5] !== 0x20) return false;
                if (IREP[IPOS + 6] !== 0x78) return false;
                IPOS += 7;
                OREP[OPOS++] = 0x69;
                OREP[OPOS++] = 0x6e;
                OREP[OPOS++] = 0x6e;
                OREP[OPOS++] = 0x65;
                OREP[OPOS++] = 0x72;
                OREP[OPOS++] = 0x20;
                OREP[OPOS++] = 0x78;
                ATYP |= STRING_CHARS;
                return true;
            },
            infer: function STR() {
                OREP[OPOS++] = 0x69;
                OREP[OPOS++] = 0x6e;
                OREP[OPOS++] = 0x6e;
                OREP[OPOS++] = 0x65;
                OREP[OPOS++] = 0x72;
                OREP[OPOS++] = 0x20;
                OREP[OPOS++] = 0x78;
                ATYP |= STRING_CHARS;
                return true;
            },
        },
        print: {
            full: function STR() {
                if (ATYP !== STRING_CHARS) return false;
                if (IPOS + 7 > IREP.length) return false;
                if (IREP[IPOS + 0] !== 0x69) return false;
                if (IREP[IPOS + 1] !== 0x6e) return false;
                if (IREP[IPOS + 2] !== 0x6e) return false;
                if (IREP[IPOS + 3] !== 0x65) return false;
                if (IREP[IPOS + 4] !== 0x72) return false;
                if (IREP[IPOS + 5] !== 0x20) return false;
                if (IREP[IPOS + 6] !== 0x78) return false;
                IPOS += 7;
                OREP[OPOS++] = 0x69;
                OREP[OPOS++] = 0x6e;
                OREP[OPOS++] = 0x6e;
                OREP[OPOS++] = 0x65;
                OREP[OPOS++] = 0x72;
                OREP[OPOS++] = 0x20;
                OREP[OPOS++] = 0x78;
                return true;
            },
            infer: function STR() {
                OREP[OPOS++] = 0x69;
                OREP[OPOS++] = 0x6e;
                OREP[OPOS++] = 0x6e;
                OREP[OPOS++] = 0x65;
                OREP[OPOS++] = 0x72;
                OREP[OPOS++] = 0x20;
                OREP[OPOS++] = 0x78;
                return true;
            },
        },
        constant: "inner x",
    });

    // StringLiteral
    const ꐚly = createRule(mode, {
        parse: {
            full: function STR() {
                if (IPOS + 3 > IREP.length) return false;
                if (IREP[IPOS + 0] !== 0x2a) return false;
                if (IREP[IPOS + 1] !== 0x2a) return false;
                if (IREP[IPOS + 2] !== 0x2a) return false;
                IPOS += 3;
                OREP[OPOS++] = 0x2a;
                OREP[OPOS++] = 0x2a;
                OREP[OPOS++] = 0x2a;
                ATYP |= STRING_CHARS;
                return true;
            },
            infer: function STR() {
                OREP[OPOS++] = 0x2a;
                OREP[OPOS++] = 0x2a;
                OREP[OPOS++] = 0x2a;
                ATYP |= STRING_CHARS;
                return true;
            },
        },
        print: {
            full: function STR() {
                if (ATYP !== STRING_CHARS) return false;
                if (IPOS + 3 > IREP.length) return false;
                if (IREP[IPOS + 0] !== 0x2a) return false;
                if (IREP[IPOS + 1] !== 0x2a) return false;
                if (IREP[IPOS + 2] !== 0x2a) return false;
                IPOS += 3;
                OREP[OPOS++] = 0x2a;
                OREP[OPOS++] = 0x2a;
                OREP[OPOS++] = 0x2a;
                return true;
            },
            infer: function STR() {
                OREP[OPOS++] = 0x2a;
                OREP[OPOS++] = 0x2a;
                OREP[OPOS++] = 0x2a;
                return true;
            },
        },
        constant: "***",
    });

    // SequenceExpression
    const ꐚletexpr = createRule(mode, {
        parse: {
            full: function SEQ() {
                const IPOSₒ = IPOS, OPOSₒ = OPOS, ATYPₒ = ATYP;
                if (!ꐚlx()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚletexprᱻ1()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚlx()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                return true;
            },
            infer: () => {
                ꐚlx.infer();
                ꐚletexprᱻ1.infer();
                ꐚlx.infer();
                return true;
            },
        },
        print: {
            full: function SEQ() {
                const IPOSₒ = IPOS, OPOSₒ = OPOS, ATYPₒ = ATYP;
                if (!ꐚlx()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚletexprᱻ1()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚlx()) return IPOS = IPOSₒ, OPOS = OPOSₒ, ATYP = ATYPₒ, false;
                return true;
            },
            infer: () => {
                ꐚlx.infer();
                ꐚletexprᱻ1.infer();
                ꐚlx.infer();
                return true;
            },
        },
    });

    // ByteExpression
    const ꐚletexprᱻ1 = createRule(mode, {
        parse: {
            full: function BYT() {
                let cc;
                if (IPOS >= IREP.length) return false;
                cc = IREP[IPOS];
                if (cc !== 0x2d) return false;
                IPOS += 1;
                OREP[OPOS++] = cc;
                ATYP |= STRING_CHARS
                return true;
            },
            infer: () => {
                OREP[OPOS++] = 0x2d;
                ATYP |= STRING_CHARS
                return true;
            },
        },
        print: {
            full: function BYT() {
                let cc;
                if (ATYP !== STRING_CHARS) return false;
                if (IPOS >= IREP.length) return false;
                cc = IREP[IPOS];
                if (cc !== 0x2d) return false;
                IPOS += 1;
                OREP[OPOS++] = cc;
                return true;
            },
            infer: () => {
                OREP[OPOS++] = 0x2d;
                return true;
            },
        },
    });

    // Identifier
    const ꐚaᱻ3 = Object.assign(
        arg => ꐚx(arg),
        {infer: arg => ꐚx.infer(arg)},
    );

    // SelectionExpression
    const ꐚstartᱻ2 = createRule(mode, {
        parse: {
            full: function SEL() { return ꐚstartᱻ2ᱻ1() || ꐚletexpr(); },
            infer: () => ꐚstartᱻ2ᱻ1.infer(),
        },
        print: {
            full: function SEL() { return ꐚstartᱻ2ᱻ1() || ꐚletexpr(); },
            infer: () => ꐚstartᱻ2ᱻ1.infer(),
        },
    });

    // ApplicationExpression
    const ꐚstartᱻ2ᱻ1 = lazy(() => ꐚREP(ꐚstartᱻ2ᱻ2));

    // Module
    const ꐚstartᱻ2ᱻ2 = (member) => {
        switch (member) {
            case 'a': return ꐚaᱻ3;
            default: return undefined;
        }
    };

    // Module
    const ꐚMODːcompile_test = (member) => {
        switch (member) {
            case 'x': return ꐚx;
            case 'nested': return ꐚnested;
            case 'letexpr': return ꐚletexpr;
            case 'start': return ꐚstartᱻ2;
            default: return undefined;
        }
    };

    return ꐚstartᱻ2;
}
