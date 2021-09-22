
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
                if (AR !== STRING) return false;
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
                if (AR !== STRING) return false;
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
                const [APOSₒ, CPOSₒ] = [APOS, CPOS];
                let seqType = AW = NOTHING;
                if (!ꐚfoo()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                seqType |= AW;
                if (!ꐚresultᱻ1()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                AW |= seqType;
                return true;
            },
            infer: () => {
                let seqType = AW = NOTHING;
                ꐚfoo.infer();
                seqType |= AW;
                ꐚresultᱻ1.infer();
                AW |= seqType;
            },
        },
        print: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ, ARₒ] = [APOS, CPOS, AR];
                if (!ꐚfoo()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                if (!ꐚresultᱻ1()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
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
                const [APOSₒ, CPOSₒ] = [APOS, CPOS];
                let seqType = AW = NOTHING;
                if (!ꐚbar()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                seqType |= AW;
                if (!ꐚbaz()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                AW |= seqType;
                return true;
            },
            infer: () => {
                let seqType = AW = NOTHING;
                ꐚbar.infer();
                seqType |= AW;
                ꐚbaz.infer();
                AW |= seqType;
            },
        },
        print: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ, ARₒ] = [APOS, CPOS, AR];
                if (!ꐚbar()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                if (!ꐚbaz()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
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
                const [APOSₒ, CPOSₒ] = [APOS, CPOS];
                if (APOS === 0) AREP = [];
                if (!parseInner(ꐚdigit, true)) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                if (!parseInner(ꐚmyListᱻ1, true)) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                if (!parseInner(ꐚmyListᱻ2, true)) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                AW = LIST;
                return true;
            },
            infer: function LST() {
                if (APOS === 0) AREP = [];
                parseInferInner(ꐚdigit.infer);
                parseInferInner(ꐚmyListᱻ1.infer);
                parseInferInner(ꐚmyListᱻ2.infer);
                AW = LIST;
            },
        },
        print: {
            full: function LST() {
                if (AR !== LIST) return false;
                const [APOSₒ, CPOSₒ, ARₒ] = [APOS, CPOS, AR];
                if (!printInner(ꐚdigit, true)) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                if (!printInner(ꐚmyListᱻ1, true)) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                if (!printInner(ꐚmyListᱻ2, true)) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                return true;
            },
            infer: function LST() {
                if (AR !== LIST && AR !== NOTHING) return false;
                printInferInner(ꐚdigit.infer);
                printInferInner(ꐚmyListᱻ1.infer);
                printInferInner(ꐚmyListᱻ2.infer);
            },
        },
    });

    // SequenceExpression
    const ꐚmyListᱻ1 = createRule(mode, {
        parse: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ] = [APOS, CPOS];
                let seqType = AW = NOTHING;
                if (!ꐚdigit()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                seqType |= AW;
                if (!ꐚdigit()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                AW |= seqType;
                return true;
            },
            infer: () => {
                let seqType = AW = NOTHING;
                ꐚdigit.infer();
                seqType |= AW;
                ꐚdigit.infer();
                AW |= seqType;
            },
        },
        print: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ, ARₒ] = [APOS, CPOS, AR];
                if (!ꐚdigit()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                if (!ꐚdigit()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
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
                const [APOSₒ, CPOSₒ] = [APOS, CPOS];
                let seqType = AW = NOTHING;
                if (!ꐚdigit()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                seqType |= AW;
                if (!ꐚdigit()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                seqType |= AW;
                if (!ꐚdigit()) return [APOS, CPOS] = [APOSₒ, CPOSₒ], false;
                AW |= seqType;
                return true;
            },
            infer: () => {
                let seqType = AW = NOTHING;
                ꐚdigit.infer();
                seqType |= AW;
                ꐚdigit.infer();
                seqType |= AW;
                ꐚdigit.infer();
                AW |= seqType;
            },
        },
        print: {
            full: function SEQ() {
                const [APOSₒ, CPOSₒ, ARₒ] = [APOS, CPOS, AR];
                if (!ꐚdigit()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                if (!ꐚdigit()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
                if (!ꐚdigit()) return [APOS, CPOS, AR] = [APOSₒ, CPOSₒ, ARₒ], false;
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
                if (AR !== STRING) return false;
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
                if (AR !== STRING) return false;
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
                if (AR !== STRING) return false;
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
                if (AR !== STRING) return false;
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
