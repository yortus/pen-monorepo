
// ------------------------------ Main exports ------------------------------
module.exports = {
    parse(strOrBuf) {
        CREP = Buffer.isBuffer(strOrBuf) ? strOrBuf : Buffer.from(strOrBuf, 'utf8');
        CPOS = 0;
        AREP = [];
        APOS = 0;
        if (!parseInner(parse, false)) throw new Error('parse failed');
        if (CPOS !== CREP.length) throw new Error('parse didn\'t consume entire input');
        return AREP[0];
    },
    print(node, buf) {
        AREP = [node];
        APOS = 0;
        CREP = buf || Buffer.alloc(2 ** 22); // 4MB
        CPOS = 0;
        if (!printInner(print, false)) throw new Error('print failed');
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
        throw new Error(`${mode}._ function is missing`);
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
let AW = 0;
let AR = 0;
let CREP = Buffer.alloc(1);
let CPOS = 0;
const [NOTHING, SCALAR, STRING, LIST, RECORD] = [0, 1, 2, 4, 8];
const theScalarArray = [];
const theBuffer = Buffer.alloc(2 ** 10);
function emitScalar(value) {
    if (APOS === 0)
        AREP = theScalarArray;
    AREP[APOS++] = value;
    AW = SCALAR;
}
function emitByte(value) {
    if (APOS === 0)
        AREP = theBuffer;
    AREP[APOS++] = value;
    AW = STRING;
}
function emitBytes(...values) {
    if (APOS === 0)
        AREP = theBuffer;
    for (let i = 0; i < values.length; ++i)
        AREP[APOS++] = values[i];
    AW = STRING;
}
function parseInner(rule, mustProduce) {
    const [AREPₒ, APOSₒ] = [AREP, APOS];
    AREP = undefined;
    APOS = 0;
    if (!rule())
        return AREP = AREPₒ, APOS = APOSₒ, false;
    if (AW === NOTHING)
        return AREP = AREPₒ, APOS = APOSₒ, !mustProduce;
    let value;
    switch (AW) {
        case SCALAR:
            assert(APOS === 1);
            value = AREP[0];
            break;
        case STRING:
            value = AREP.toString('utf8', 0, APOS);
            break;
        case LIST:
            if (AREP.length !== APOS)
                AREP.length = APOS;
            value = AREP;
            break;
        case RECORD:
            const obj = value = {};
            for (let i = 0; i < APOS; i += 2)
                obj[AREP[i]] = AREP[i + 1];
            if (Object.keys(obj).length * 2 < APOS)
                throw new Error(`Duplicate labels in record`);
            break;
        default:
            ((aw) => { throw new Error(`Unhandled abstract type ${aw}`); })(AW);
    }
    AREPₒ[APOSₒ] = value;
    AREP = AREPₒ;
    APOS = APOSₒ + 1;
    return true;
}
function parseInferInner(infer) {
    const [AREPₒ, APOSₒ] = [AREP, APOS];
    AREP = undefined;
    APOS = 0;
    infer();
    if (AW === NOTHING)
        return;
    let value;
    switch (AW) {
        case SCALAR:
            assert(APOS === 1);
            value = AREP[0];
            break;
        case STRING:
            value = AREP.toString('utf8', 0, APOS);
            break;
        case LIST:
            if (AREP.length !== APOS)
                AREP.length = APOS;
            value = AREP;
            break;
        case RECORD:
            const obj = value = {};
            for (let i = 0; i < APOS; i += 2)
                obj[AREP[i]] = AREP[i + 1];
            break;
        default:
            ((aw) => { throw new Error(`Unhandled abstract type ${aw}`); })(AW);
    }
    AREPₒ[APOSₒ] = value;
    AREP = AREPₒ;
    APOS = APOSₒ + 1;
}
function printInner(rule, mustConsume) {
    const [AREPₒ, APOSₒ, ARₒ] = [AREP, APOS, AR];
    let value = AREP[APOS];
    let ar;
    if (value === undefined) {
        if (mustConsume)
            return false;
        AR = NOTHING;
        const result = rule();
        AR = ARₒ;
        assert(APOS === APOSₒ);
        return result;
    }
    if (value === null || value === true || value === false || typeof value === 'number') {
        AR = SCALAR;
        const result = rule();
        AR = ARₒ;
        assert(APOS - APOSₒ === 1);
        return result;
    }
    if (typeof value === 'string') {
        AREP = theBuffer.slice(0, theBuffer.write(value, 0));
        ar = AR = STRING;
    }
    else if (Array.isArray(value)) {
        AREP = value;
        ar = AR = LIST;
    }
    else if (typeof value === 'object') {
        const arr = AREP = [];
        const keys = Object.keys(value);
        assert(keys.length < 32);
        for (let i = 0; i < keys.length; ++i)
            arr.push(keys[i], value[keys[i]]);
        value = arr;
        ar = AR = RECORD;
    }
    else {
        throw new Error(`Unsupported value type for value ${value}`);
    }
    APOS = 0;
    let result = rule();
    const [arep, apos] = [AREP, APOS];
    AREP = AREPₒ, APOS = APOSₒ, AR = ARₒ;
    if (!result)
        return false;
    if (ar === RECORD) {
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
function printInferInner(infer) {
    const ARₒ = AR;
    AR = NOTHING;
    infer();
    AR = ARₒ;
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
    const ꐚstartᱻ2 = Object.assign(
        arg => ꐚfoo(arg),
        {infer: arg => ꐚfoo.infer(arg)},
    );

    // StringLiteral
    const ꐚfoo = createRule(mode, {
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
                if (AR !== STRING) return false;
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
    const ꐚbar = createRule(mode, {
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
                if (AR !== STRING) return false;
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
                if (CPOS + 2 > CREP.length) return false;
                if (CREP[CPOS + 0] !== 0x62) return false;
                if (CREP[CPOS + 1] !== 0x32) return false;
                CPOS += 2;
                emitBytes(0x62, 0x32);
                return true;
            },
            infer: function STR() {
                emitBytes(0x62, 0x32);
            },
        },
        print: {
            full: function STR() {
                if (AR !== STRING) return false;
                if (APOS + 2 > AREP.length) return false;
                if (AREP[APOS + 0] !== 0x62) return false;
                if (AREP[APOS + 1] !== 0x32) return false;
                APOS += 2;
                CREP[CPOS++] = 0x62;
                CREP[CPOS++] = 0x32;
                return true;
            },
            infer: function STR() {
                CREP[CPOS++] = 0x62;
                CREP[CPOS++] = 0x32;
            },
        },
        constant: "b2",
    });

    // StringLiteral
    const ꐚbaz = createRule(mode, {
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
                if (AR !== STRING) return false;
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

    // StringLiteral
    const ꐚmem = createRule(mode, {
        parse: {
            full: function STR() {
                if (CPOS + 6 > CREP.length) return false;
                if (CREP[CPOS + 0] !== 0x6d) return false;
                if (CREP[CPOS + 1] !== 0x65) return false;
                if (CREP[CPOS + 2] !== 0x6d) return false;
                if (CREP[CPOS + 3] !== 0x62) return false;
                if (CREP[CPOS + 4] !== 0x65) return false;
                if (CREP[CPOS + 5] !== 0x72) return false;
                CPOS += 6;
                emitBytes(0x6d, 0x65, 0x6d, 0x62, 0x65, 0x72);
                return true;
            },
            infer: function STR() {
                emitBytes(0x6d, 0x65, 0x6d, 0x62, 0x65, 0x72);
            },
        },
        print: {
            full: function STR() {
                if (AR !== STRING) return false;
                if (APOS + 6 > AREP.length) return false;
                if (AREP[APOS + 0] !== 0x6d) return false;
                if (AREP[APOS + 1] !== 0x65) return false;
                if (AREP[APOS + 2] !== 0x6d) return false;
                if (AREP[APOS + 3] !== 0x62) return false;
                if (AREP[APOS + 4] !== 0x65) return false;
                if (AREP[APOS + 5] !== 0x72) return false;
                APOS += 6;
                CREP[CPOS++] = 0x6d;
                CREP[CPOS++] = 0x65;
                CREP[CPOS++] = 0x6d;
                CREP[CPOS++] = 0x62;
                CREP[CPOS++] = 0x65;
                CREP[CPOS++] = 0x72;
                return true;
            },
            infer: function STR() {
                CREP[CPOS++] = 0x6d;
                CREP[CPOS++] = 0x65;
                CREP[CPOS++] = 0x6d;
                CREP[CPOS++] = 0x62;
                CREP[CPOS++] = 0x65;
                CREP[CPOS++] = 0x72;
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
                const [APOSₒ, CPOSₒ] = [APOS, CPOS];
                let seqType = AW = NOTHING;
                if (!ꐚaᱻ3ᱻ1()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                seqType |= AW;
                if (!ꐚbᱻ2()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                AW |= seqType;
                return true;
            },
            infer: () => {
                let seqType = AW = NOTHING;
                ꐚaᱻ3ᱻ1.infer();
                seqType |= AW;
                ꐚbᱻ2.infer();
                AW |= seqType;
            },
        },
        print: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ, ARₒ] = [APOS, CPOS, AR];
                if (!ꐚaᱻ3ᱻ1()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                if (!ꐚbᱻ2()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
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
                if (CPOS >= CREP.length) return false;
                cc = CREP[CPOS];
                if (cc !== 0x61) return false;
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
                if (AR !== STRING) return false;
                if (APOS >= AREP.length) return false;
                cc = AREP[APOS];
                if (cc !== 0x61) return false;
                APOS += 1;
                CREP[CPOS++] = cc;
                return true;
            },
            infer: () => {
                CREP[CPOS++] = 0x61;
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
                const [APOSₒ, CPOSₒ] = [APOS, CPOS];
                let seqType = AW = NOTHING;
                if (!ꐚbᱻ2ᱻ1()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                seqType |= AW;
                if (!ꐚaᱻ3()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                AW |= seqType;
                return true;
            },
            infer: () => {
                let seqType = AW = NOTHING;
                ꐚbᱻ2ᱻ1.infer();
                seqType |= AW;
                ꐚaᱻ3.infer();
                AW |= seqType;
            },
        },
        print: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ, ARₒ] = [APOS, CPOS, AR];
                if (!ꐚbᱻ2ᱻ1()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                if (!ꐚaᱻ3()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
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
                if (CPOS >= CREP.length) return false;
                cc = CREP[CPOS];
                if (cc !== 0x62) return false;
                CPOS += 1;
                emitByte(cc);
                return true;
            },
            infer: () => {
                emitByte(0x62);
            },
        },
        print: {
            full: function BYT() {
                let cc;
                if (AR !== STRING) return false;
                if (APOS >= AREP.length) return false;
                cc = AREP[APOS];
                if (cc !== 0x62) return false;
                APOS += 1;
                CREP[CPOS++] = cc;
                return true;
            },
            infer: () => {
                CREP[CPOS++] = 0x62;
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
                if (CPOS + 2 > CREP.length) return false;
                if (CREP[CPOS + 0] !== 0x63) return false;
                if (CREP[CPOS + 1] !== 0x31) return false;
                CPOS += 2;
                emitBytes(0x63, 0x31);
                return true;
            },
            infer: function STR() {
                emitBytes(0x63, 0x31);
            },
        },
        print: {
            full: function STR() {
                if (AR !== STRING) return false;
                if (APOS + 2 > AREP.length) return false;
                if (AREP[APOS + 0] !== 0x63) return false;
                if (AREP[APOS + 1] !== 0x31) return false;
                APOS += 2;
                CREP[CPOS++] = 0x63;
                CREP[CPOS++] = 0x31;
                return true;
            },
            infer: function STR() {
                CREP[CPOS++] = 0x63;
                CREP[CPOS++] = 0x31;
            },
        },
        constant: "c1",
    });

    // StringLiteral
    const ꐚc2 = createRule(mode, {
        parse: {
            full: function STR() {
                if (CPOS + 2 > CREP.length) return false;
                if (CREP[CPOS + 0] !== 0x63) return false;
                if (CREP[CPOS + 1] !== 0x32) return false;
                CPOS += 2;
                emitBytes(0x63, 0x32);
                return true;
            },
            infer: function STR() {
                emitBytes(0x63, 0x32);
            },
        },
        print: {
            full: function STR() {
                if (AR !== STRING) return false;
                if (APOS + 2 > AREP.length) return false;
                if (AREP[APOS + 0] !== 0x63) return false;
                if (AREP[APOS + 1] !== 0x32) return false;
                APOS += 2;
                CREP[CPOS++] = 0x63;
                CREP[CPOS++] = 0x32;
                return true;
            },
            infer: function STR() {
                CREP[CPOS++] = 0x63;
                CREP[CPOS++] = 0x32;
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
