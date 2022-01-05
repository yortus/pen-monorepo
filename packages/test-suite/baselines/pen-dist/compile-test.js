
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
let AREP;
let APOS = 0;
let ATYP = 0;
let CREP = Buffer.alloc(1);
let CPOS = 0;
const [NOTHING, SCALAR, STRING_CHARS, LIST_ELEMENTS, RECORD_FIELDS] = [0, 1, 2, 4, 8];
const OCTETS = Buffer.alloc(2 ** 16);
const VALUES = [];
function parse(startRule, stringOrBuffer) {
    CREP = Buffer.isBuffer(stringOrBuffer) ? stringOrBuffer : Buffer.from(stringOrBuffer, 'utf8');
    CPOS = 0;
    APOS = 0;
    if (!parseValue(startRule))
        throw new Error('parse failed');
    if (CPOS !== CREP.length)
        throw new Error('parse didn\\\'t consume entire input');
    if (APOS !== 1)
        throw new Error('parse didn\\\'t produce a singular value');
    return VALUES[0];
}
function print(startRule, value, buffer) {
    AREP = [value];
    APOS = 0;
    CREP = buffer || Buffer.alloc(2 ** 22);
    CPOS = 0;
    if (!printValue(startRule))
        throw new Error('print failed');
    if (CPOS > CREP.length)
        throw new Error('output buffer too small');
    return buffer ? CPOS : CREP.toString('utf8', 0, CPOS);
}
function emitScalar(value) {
    VALUES[APOS++] = value;
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
            value = VALUES[APOSₒ];
            break;
        case STRING_CHARS:
            value = OCTETS.toString('utf8', APOSₒ, APOS);
            break;
        case LIST_ELEMENTS:
            value = VALUES.slice(APOSₒ, APOS);
            break;
        case RECORD_FIELDS:
            const obj = value = {};
            for (let i = APOSₒ; i < APOS; i += 2)
                obj[VALUES[i]] = VALUES[i + 1];
            if (Object.keys(obj).length * 2 < (APOS - APOSₒ))
                throw new Error(`Duplicate labels in record`);
            break;
        default:
            ((atyp) => { throw new Error(`Unhandled abstract type ${atyp}`); })(ATYP);
    }
    VALUES[APOSₒ] = value;
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
            value = VALUES[APOSₒ];
            break;
        case STRING_CHARS:
            value = OCTETS.toString('utf8', APOSₒ, APOS);
            break;
        case LIST_ELEMENTS:
            value = VALUES.slice(APOSₒ, APOS);
            break;
        case RECORD_FIELDS:
            const obj = value = {};
            for (let i = APOSₒ; i < APOS; i += 2)
                obj[VALUES[i]] = VALUES[i + 1];
            break;
        default:
            ((atyp) => { throw new Error(`Unhandled abstract type ${atyp}`); })(ATYP);
    }
    VALUES[APOSₒ] = value;
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
        assert(APOS === APOSₒ + 1);
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
const parseStartRule = create('parse');
const printStartRule = create('print');
function create(mode) {

    // StringLiteral
    const ꐚx = createRule(mode, {
        parse: {
            full: function STR() {
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
            },
            infer: function STR() {
                emitBytes(0x6f, 0x75, 0x74, 0x65, 0x72, 0x20, 0x78);
            },
        },
        print: {
            full: function STR() {
                if (ATYP !== STRING_CHARS) return false;
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
            },
            infer: function STR() {
                CREP[CPOS++] = 0x6f;
                CREP[CPOS++] = 0x75;
                CREP[CPOS++] = 0x74;
                CREP[CPOS++] = 0x65;
                CREP[CPOS++] = 0x72;
                CREP[CPOS++] = 0x20;
                CREP[CPOS++] = 0x78;
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
                    const APOSₒ = APOS, CPOSₒ = CPOS;
                    let seqType = ATYP = NOTHING;
                    if (!ꐚa()) return APOS = APOSₒ, CPOS = CPOSₒ, false;
                    seqType |= ATYP;
                    if (!ꐚxᱻ3()) return APOS = APOSₒ, CPOS = CPOSₒ, false;
                    seqType |= ATYP;
                    if (!ꐚa()) return APOS = APOSₒ, CPOS = CPOSₒ, false;
                    ATYP |= seqType;
                    return true;
                },
                infer: () => {
                    let seqType = ATYP = NOTHING;
                    ꐚa.infer();
                    seqType |= ATYP;
                    ꐚxᱻ3.infer();
                    seqType |= ATYP;
                    ꐚa.infer();
                    ATYP |= seqType;
                },
            },
            print: {
                full: function SEQ() {
                    const APOSₒ = APOS, CPOSₒ = CPOS, ATYPₒ = ATYP;
                    if (!ꐚa()) return APOS = APOSₒ, CPOS = CPOSₒ, ATYP = ATYPₒ, false;
                    if (!ꐚxᱻ3()) return APOS = APOSₒ, CPOS = CPOSₒ, ATYP = ATYPₒ, false;
                    if (!ꐚa()) return APOS = APOSₒ, CPOS = CPOSₒ, ATYP = ATYPₒ, false;
                    return true;
                },
                infer: () => {
                    ꐚa.infer();
                    ꐚxᱻ3.infer();
                    ꐚa.infer();
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
                    const APOSₒ = APOS, CPOSₒ = CPOS;
                    let seqType = ATYP = NOTHING;
                    if (!ꐚxᱻ2()) return APOS = APOSₒ, CPOS = CPOSₒ, false;
                    seqType |= ATYP;
                    if (!ꐚxᱻ2()) return APOS = APOSₒ, CPOS = CPOSₒ, false;
                    ATYP |= seqType;
                    return true;
                },
                infer: () => {
                    let seqType = ATYP = NOTHING;
                    ꐚxᱻ2.infer();
                    seqType |= ATYP;
                    ꐚxᱻ2.infer();
                    ATYP |= seqType;
                },
            },
            print: {
                full: function SEQ() {
                    const APOSₒ = APOS, CPOSₒ = CPOS, ATYPₒ = ATYP;
                    if (!ꐚxᱻ2()) return APOS = APOSₒ, CPOS = CPOSₒ, ATYP = ATYPₒ, false;
                    if (!ꐚxᱻ2()) return APOS = APOSₒ, CPOS = CPOSₒ, ATYP = ATYPₒ, false;
                    return true;
                },
                infer: () => {
                    ꐚxᱻ2.infer();
                    ꐚxᱻ2.infer();
                },
            },
        });

        return ꐚLET;
    };

    // StringLiteral
    const ꐚxᱻ3 = createRule(mode, {
        parse: {
            full: function STR() {
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
            },
            infer: function STR() {
                emitBytes(0x69, 0x6e, 0x6e, 0x65, 0x72, 0x20, 0x78);
            },
        },
        print: {
            full: function STR() {
                if (ATYP !== STRING_CHARS) return false;
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
            },
            infer: function STR() {
                CREP[CPOS++] = 0x69;
                CREP[CPOS++] = 0x6e;
                CREP[CPOS++] = 0x6e;
                CREP[CPOS++] = 0x65;
                CREP[CPOS++] = 0x72;
                CREP[CPOS++] = 0x20;
                CREP[CPOS++] = 0x78;
            },
        },
        constant: "inner x",
    });

    // NumericLiteral
    const ꐚaᱻ2 = createRule(mode, {
        parse: {
            full: () => (emitScalar(42), true),
            infer: () => emitScalar(42),
        },
        print: {
            full: function LIT() {
                if (ATYP !== SCALAR) return false;
                if (AREP[APOS] !== 42) return false;
                APOS += 1;
                return true;
            },
            infer: () => {},
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
            },
            infer: function STR() {
                emitBytes(0x69, 0x6e, 0x6e, 0x65, 0x72, 0x20, 0x78);
            },
        },
        print: {
            full: function STR() {
                if (ATYP !== STRING_CHARS) return false;
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
            },
            infer: function STR() {
                CREP[CPOS++] = 0x69;
                CREP[CPOS++] = 0x6e;
                CREP[CPOS++] = 0x6e;
                CREP[CPOS++] = 0x65;
                CREP[CPOS++] = 0x72;
                CREP[CPOS++] = 0x20;
                CREP[CPOS++] = 0x78;
            },
        },
        constant: "inner x",
    });

    // StringLiteral
    const ꐚly = createRule(mode, {
        parse: {
            full: function STR() {
                if (CPOS + 3 > CREP.length) return false;
                if (CREP[CPOS + 0] !== 0x2a) return false;
                if (CREP[CPOS + 1] !== 0x2a) return false;
                if (CREP[CPOS + 2] !== 0x2a) return false;
                CPOS += 3;
                emitBytes(0x2a, 0x2a, 0x2a);
                return true;
            },
            infer: function STR() {
                emitBytes(0x2a, 0x2a, 0x2a);
            },
        },
        print: {
            full: function STR() {
                if (ATYP !== STRING_CHARS) return false;
                if (APOS + 3 > AREP.length) return false;
                if (AREP[APOS + 0] !== 0x2a) return false;
                if (AREP[APOS + 1] !== 0x2a) return false;
                if (AREP[APOS + 2] !== 0x2a) return false;
                APOS += 3;
                CREP[CPOS++] = 0x2a;
                CREP[CPOS++] = 0x2a;
                CREP[CPOS++] = 0x2a;
                return true;
            },
            infer: function STR() {
                CREP[CPOS++] = 0x2a;
                CREP[CPOS++] = 0x2a;
                CREP[CPOS++] = 0x2a;
            },
        },
        constant: "***",
    });

    // SequenceExpression
    const ꐚletexpr = createRule(mode, {
        parse: {
            full: function SEQ() {
                const APOSₒ = APOS, CPOSₒ = CPOS;
                let seqType = ATYP = NOTHING;
                if (!ꐚlx()) return APOS = APOSₒ, CPOS = CPOSₒ, false;
                seqType |= ATYP;
                if (!ꐚletexprᱻ1()) return APOS = APOSₒ, CPOS = CPOSₒ, false;
                seqType |= ATYP;
                if (!ꐚlx()) return APOS = APOSₒ, CPOS = CPOSₒ, false;
                ATYP |= seqType;
                return true;
            },
            infer: () => {
                let seqType = ATYP = NOTHING;
                ꐚlx.infer();
                seqType |= ATYP;
                ꐚletexprᱻ1.infer();
                seqType |= ATYP;
                ꐚlx.infer();
                ATYP |= seqType;
            },
        },
        print: {
            full: function SEQ() {
                const APOSₒ = APOS, CPOSₒ = CPOS, ATYPₒ = ATYP;
                if (!ꐚlx()) return APOS = APOSₒ, CPOS = CPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚletexprᱻ1()) return APOS = APOSₒ, CPOS = CPOSₒ, ATYP = ATYPₒ, false;
                if (!ꐚlx()) return APOS = APOSₒ, CPOS = CPOSₒ, ATYP = ATYPₒ, false;
                return true;
            },
            infer: () => {
                ꐚlx.infer();
                ꐚletexprᱻ1.infer();
                ꐚlx.infer();
            },
        },
    });

    // ByteExpression
    const ꐚletexprᱻ1 = createRule(mode, {
        parse: {
            full: function BYT() {
                let cc;
                if (CPOS >= CREP.length) return false;
                cc = CREP[CPOS];
                if (cc !== 0x2d) return false;
                CPOS += 1;
                emitByte(cc);
                return true;
            },
            infer: () => {
                emitByte(0x2d);
            },
        },
        print: {
            full: function BYT() {
                let cc;
                if (ATYP !== STRING_CHARS) return false;
                if (APOS >= AREP.length) return false;
                cc = AREP[APOS];
                if (cc !== 0x2d) return false;
                APOS += 1;
                CREP[CPOS++] = cc;
                return true;
            },
            infer: () => {
                CREP[CPOS++] = 0x2d;
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
