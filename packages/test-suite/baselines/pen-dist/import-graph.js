
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
    ICONTENT = Buffer.isBuffer(stringOrBuffer) ? stringOrBuffer : Buffer.from(stringOrBuffer, 'utf8');
    IPOINTER = 0;
    OCONTENT = [];
    OPOINTER = 0;
    if (!parseValue(startRule))
        throw new Error('parse failed');
    if (IPOINTER !== ICONTENT.length)
        throw new Error('parse didn\\\'t consume entire input');
    if (OPOINTER !== 1)
        throw new Error('parse didn\\\'t produce a singular value');
    return OCONTENT[0];
}
function print(startRule, value, buffer) {
    ICONTENT = [value];
    IPOINTER = 0;
    const buf = OCONTENT = buffer !== null && buffer !== void 0 ? buffer : Buffer.alloc(2 ** 22);
    OPOINTER = 0;
    if (!printValue(startRule))
        throw new Error('print failed');
    if (OPOINTER > OCONTENT.length)
        throw new Error('output buffer too small');
    return buffer ? OPOINTER : buf.toString('utf8', 0, OPOINTER);
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
const onSettled = [];
let ICONTENT;
let IPOINTER = 0;
let OCONTENT;
let OPOINTER = 0;
let UNITTYPE = 0;
const [NO_UNIT, SCALAR_VALUE, STRING_OCTETS, LIST_ELEMENTS, RECORD_FIELDS] = [0, 1, 2, 4, 8];
function parseValue(rule) {
    const OPOINTERₒ = OPOINTER, UNITTYPEₒ = UNITTYPE;
    UNITTYPE = NO_UNIT;
    if (!rule())
        return UNITTYPE = UNITTYPEₒ, false;
    if (UNITTYPE === NO_UNIT)
        return OPOINTER = OPOINTERₒ, UNITTYPE = UNITTYPEₒ, false;
    let value;
    switch (UNITTYPE) {
        case SCALAR_VALUE:
            assert(OPOINTER === OPOINTERₒ + 1);
            value = OCONTENT[OPOINTERₒ];
            break;
        case STRING_OCTETS:
            const len = OPOINTER - OPOINTERₒ;
            assert(len < _internalBuffer.length, 'internal buffer too small');
            for (let i = 0; i < len; ++i)
                _internalBuffer[i] = OCONTENT[OPOINTERₒ + i];
            value = _internalBuffer.toString('utf8', 0, len);
            break;
        case LIST_ELEMENTS:
            value = OCONTENT.slice(OPOINTERₒ, OPOINTER);
            break;
        case RECORD_FIELDS:
            const obj = value = {};
            for (let i = OPOINTERₒ; i < OPOINTER; i += 2)
                obj[OCONTENT[i]] = OCONTENT[i + 1];
            if (Object.keys(obj).length * 2 < (OPOINTER - OPOINTERₒ))
                throw new Error(`Duplicate labels in record`);
            break;
        default:
            ((atyp) => { throw new Error(`Unhandled abstract type ${atyp}`); })(UNITTYPE);
    }
    OCONTENT[OPOINTERₒ] = value;
    OPOINTER = OPOINTERₒ + 1;
    UNITTYPE = UNITTYPEₒ;
    return true;
}
function printValue(rule) {
    const IPOINTERₒ = IPOINTER, ICONTENTₒ = ICONTENT, UNITTYPEₒ = UNITTYPE;
    const value = ICONTENT[IPOINTER];
    let objKeys;
    if (value === undefined) {
        return false;
    }
    if (value === null || value === true || value === false || typeof value === 'number') {
        UNITTYPE = SCALAR_VALUE;
        const result = rule();
        UNITTYPE = UNITTYPEₒ;
        assert(IPOINTER === IPOINTERₒ + 1);
        return result;
    }
    if (typeof value === 'string') {
        const len = _internalBuffer.write(value, 0, undefined, 'utf8');
        assert(len < _internalBuffer.length, 'internal buffer too small');
        ICONTENT = _internalBuffer.slice(0, len);
        UNITTYPE = STRING_OCTETS;
    }
    else if (Array.isArray(value)) {
        ICONTENT = value;
        UNITTYPE = LIST_ELEMENTS;
    }
    else if (isObject(value)) {
        const arr = ICONTENT = [];
        objKeys = Object.keys(value);
        assert(objKeys.length < 32);
        for (let i = 0; i < objKeys.length; ++i)
            arr.push(objKeys[i], value[objKeys[i]]);
        UNITTYPE = RECORD_FIELDS;
    }
    else {
        throw new Error(`Unsupported value type for value ${value}`);
    }
    IPOINTER = 0;
    let result = rule();
    const ICONTENTᐟ = ICONTENT, IPOINTERᐟ = IPOINTER, UNITTYPEᐟ = UNITTYPE;
    ICONTENT = ICONTENTₒ, IPOINTER = IPOINTERₒ, UNITTYPE = UNITTYPEₒ;
    if (!result)
        return false;
    if (UNITTYPEᐟ === RECORD_FIELDS) {
        const keyCount = objKeys.length;
        if (keyCount > 0 && (IPOINTERᐟ !== -1 >>> (32 - keyCount)))
            return false;
    }
    else {
        if (IPOINTERᐟ !== ICONTENTᐟ.length)
            return false;
    }
    IPOINTER += 1;
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
                if (IPOINTER >= ICONTENT.length) return false;
                cc = ICONTENT[IPOINTER];
                if ((cc < 0x30 || cc > 0x39)) return false;
                IPOINTER += 1;
                OCONTENT[OPOINTER++] = cc;
                UNITTYPE |= STRING_OCTETS
                return true;
            },
            infer: () => {
                OCONTENT[OPOINTER++] = 0x30;
                UNITTYPE |= STRING_OCTETS
                return true;
            },
        },
        print: {
            full: function BYT() {
                let cc;
                if (UNITTYPE !== STRING_OCTETS) return false;
                if (IPOINTER >= ICONTENT.length) return false;
                cc = ICONTENT[IPOINTER];
                if ((cc < 0x30 || cc > 0x39)) return false;
                IPOINTER += 1;
                OCONTENT[OPOINTER++] = cc;
                return true;
            },
            infer: () => {
                OCONTENT[OPOINTER++] = 0x30;
                return true;
            },
        },
    });

    // ByteExpression
    const ꐚalpha = createRule(mode, {
        parse: {
            full: function BYT() {
                let cc;
                if (IPOINTER >= ICONTENT.length) return false;
                cc = ICONTENT[IPOINTER];
                if ((cc < 0x61 || cc > 0x7a) && (cc < 0x41 || cc > 0x5a)) return false;
                IPOINTER += 1;
                OCONTENT[OPOINTER++] = cc;
                UNITTYPE |= STRING_OCTETS
                return true;
            },
            infer: () => {
                OCONTENT[OPOINTER++] = 0x61;
                UNITTYPE |= STRING_OCTETS
                return true;
            },
        },
        print: {
            full: function BYT() {
                let cc;
                if (UNITTYPE !== STRING_OCTETS) return false;
                if (IPOINTER >= ICONTENT.length) return false;
                cc = ICONTENT[IPOINTER];
                if ((cc < 0x61 || cc > 0x7a) && (cc < 0x41 || cc > 0x5a)) return false;
                IPOINTER += 1;
                OCONTENT[OPOINTER++] = cc;
                return true;
            },
            infer: () => {
                OCONTENT[OPOINTER++] = 0x61;
                return true;
            },
        },
    });

    // SequenceExpression
    const ꐚresult = createRule(mode, {
        parse: {
            full: function SEQ() {
                const IPOINTERₒ = IPOINTER, OPOINTERₒ = OPOINTER, UNITTYPEₒ = UNITTYPE;
                if (!ꐚfoo()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, UNITTYPE = UNITTYPEₒ, false;
                if (!ꐚresultᱻ1()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, UNITTYPE = UNITTYPEₒ, false;
                return true;
            },
            infer: () => {
                ꐚfoo.infer();
                ꐚresultᱻ1.infer();
                return true;
            },
        },
        print: {
            full: function SEQ() {
                const IPOINTERₒ = IPOINTER, OPOINTERₒ = OPOINTER, UNITTYPEₒ = UNITTYPE;
                if (!ꐚfoo()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, UNITTYPE = UNITTYPEₒ, false;
                if (!ꐚresultᱻ1()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, UNITTYPE = UNITTYPEₒ, false;
                return true;
            },
            infer: () => {
                ꐚfoo.infer();
                ꐚresultᱻ1.infer();
                return true;
            },
        },
    });

    // SequenceExpression
    const ꐚresultᱻ1 = createRule(mode, {
        parse: {
            full: function SEQ() {
                const IPOINTERₒ = IPOINTER, OPOINTERₒ = OPOINTER, UNITTYPEₒ = UNITTYPE;
                if (!ꐚbar()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, UNITTYPE = UNITTYPEₒ, false;
                if (!ꐚbaz()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, UNITTYPE = UNITTYPEₒ, false;
                return true;
            },
            infer: () => {
                ꐚbar.infer();
                ꐚbaz.infer();
                return true;
            },
        },
        print: {
            full: function SEQ() {
                const IPOINTERₒ = IPOINTER, OPOINTERₒ = OPOINTER, UNITTYPEₒ = UNITTYPE;
                if (!ꐚbar()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, UNITTYPE = UNITTYPEₒ, false;
                if (!ꐚbaz()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, UNITTYPE = UNITTYPEₒ, false;
                return true;
            },
            infer: () => {
                ꐚbar.infer();
                ꐚbaz.infer();
                return true;
            },
        },
    });

    // ListExpression
    const ꐚmyList = createRule(mode, {
        parse: {
            full: function LST() {
                const IPOINTERₒ = IPOINTER, OPOINTERₒ = OPOINTER, UNITTYPEₒ = UNITTYPE;
                if (!parseValue(ꐚdigit)) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, UNITTYPE = UNITTYPEₒ, false;
                if (!parseValue(ꐚmyListᱻ1)) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, UNITTYPE = UNITTYPEₒ, false;
                if (!parseValue(ꐚmyListᱻ2)) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, UNITTYPE = UNITTYPEₒ, false;
                UNITTYPE |= LIST_ELEMENTS;
                return true;
            },
            infer: function LST() {
                parseValue(ꐚdigit.infer);
                parseValue(ꐚmyListᱻ1.infer);
                parseValue(ꐚmyListᱻ2.infer);
                UNITTYPE |= LIST_ELEMENTS;
                return true;
            },
        },
        print: {
            full: function LST() {
                if (UNITTYPE !== LIST_ELEMENTS) return false;
                const IPOINTERₒ = IPOINTER, OPOINTERₒ = OPOINTER, UNITTYPEₒ = UNITTYPE;
                if (!printValue(ꐚdigit)) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, UNITTYPE = UNITTYPEₒ, false;
                if (!printValue(ꐚmyListᱻ1)) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, UNITTYPE = UNITTYPEₒ, false;
                if (!printValue(ꐚmyListᱻ2)) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, UNITTYPE = UNITTYPEₒ, false;
                return true;
            },
            infer: function LST() {
                ꐚdigit.infer();
                ꐚmyListᱻ1.infer();
                ꐚmyListᱻ2.infer();
                return true;
            },
        },
    });

    // SequenceExpression
    const ꐚmyListᱻ1 = createRule(mode, {
        parse: {
            full: function SEQ() {
                const IPOINTERₒ = IPOINTER, OPOINTERₒ = OPOINTER, UNITTYPEₒ = UNITTYPE;
                if (!ꐚdigit()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, UNITTYPE = UNITTYPEₒ, false;
                if (!ꐚdigit()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, UNITTYPE = UNITTYPEₒ, false;
                return true;
            },
            infer: () => {
                ꐚdigit.infer();
                ꐚdigit.infer();
                return true;
            },
        },
        print: {
            full: function SEQ() {
                const IPOINTERₒ = IPOINTER, OPOINTERₒ = OPOINTER, UNITTYPEₒ = UNITTYPE;
                if (!ꐚdigit()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, UNITTYPE = UNITTYPEₒ, false;
                if (!ꐚdigit()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, UNITTYPE = UNITTYPEₒ, false;
                return true;
            },
            infer: () => {
                ꐚdigit.infer();
                ꐚdigit.infer();
                return true;
            },
        },
    });

    // SequenceExpression
    const ꐚmyListᱻ2 = createRule(mode, {
        parse: {
            full: function SEQ() {
                const IPOINTERₒ = IPOINTER, OPOINTERₒ = OPOINTER, UNITTYPEₒ = UNITTYPE;
                if (!ꐚdigit()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, UNITTYPE = UNITTYPEₒ, false;
                if (!ꐚdigit()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, UNITTYPE = UNITTYPEₒ, false;
                if (!ꐚdigit()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, UNITTYPE = UNITTYPEₒ, false;
                return true;
            },
            infer: () => {
                ꐚdigit.infer();
                ꐚdigit.infer();
                ꐚdigit.infer();
                return true;
            },
        },
        print: {
            full: function SEQ() {
                const IPOINTERₒ = IPOINTER, OPOINTERₒ = OPOINTER, UNITTYPEₒ = UNITTYPE;
                if (!ꐚdigit()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, UNITTYPE = UNITTYPEₒ, false;
                if (!ꐚdigit()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, UNITTYPE = UNITTYPEₒ, false;
                if (!ꐚdigit()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, UNITTYPE = UNITTYPEₒ, false;
                return true;
            },
            infer: () => {
                ꐚdigit.infer();
                ꐚdigit.infer();
                ꐚdigit.infer();
                return true;
            },
        },
    });

    // StringLiteral
    const ꐚb = createRule(mode, {
        parse: {
            full: function STR() {
                OCONTENT[OPOINTER++] = 0x62;
                OCONTENT[OPOINTER++] = 0x20;
                OCONTENT[OPOINTER++] = 0x74;
                OCONTENT[OPOINTER++] = 0x68;
                OCONTENT[OPOINTER++] = 0x69;
                OCONTENT[OPOINTER++] = 0x6e;
                OCONTENT[OPOINTER++] = 0x67;
                UNITTYPE |= STRING_OCTETS;
                return true;
            },
            infer: function STR() {
                OCONTENT[OPOINTER++] = 0x62;
                OCONTENT[OPOINTER++] = 0x20;
                OCONTENT[OPOINTER++] = 0x74;
                OCONTENT[OPOINTER++] = 0x68;
                OCONTENT[OPOINTER++] = 0x69;
                OCONTENT[OPOINTER++] = 0x6e;
                OCONTENT[OPOINTER++] = 0x67;
                UNITTYPE |= STRING_OCTETS;
                return true;
            },
        },
        print: {
            full: function STR() {
                if (UNITTYPE !== STRING_OCTETS) return false;
                if (IPOINTER + 7 > ICONTENT.length) return false;
                if (ICONTENT[IPOINTER + 0] !== 0x62) return false;
                if (ICONTENT[IPOINTER + 1] !== 0x20) return false;
                if (ICONTENT[IPOINTER + 2] !== 0x74) return false;
                if (ICONTENT[IPOINTER + 3] !== 0x68) return false;
                if (ICONTENT[IPOINTER + 4] !== 0x69) return false;
                if (ICONTENT[IPOINTER + 5] !== 0x6e) return false;
                if (ICONTENT[IPOINTER + 6] !== 0x67) return false;
                IPOINTER += 7;
                return true;
            },
            infer: function STR() {
                return true;
            },
        },
        constant: "b thing",
    });

    // StringLiteral
    const ꐚd = createRule(mode, {
        parse: {
            full: function STR() {
                OCONTENT[OPOINTER++] = 0x64;
                OCONTENT[OPOINTER++] = 0x20;
                OCONTENT[OPOINTER++] = 0x74;
                OCONTENT[OPOINTER++] = 0x68;
                OCONTENT[OPOINTER++] = 0x69;
                OCONTENT[OPOINTER++] = 0x6e;
                OCONTENT[OPOINTER++] = 0x67;
                UNITTYPE |= STRING_OCTETS;
                return true;
            },
            infer: function STR() {
                OCONTENT[OPOINTER++] = 0x64;
                OCONTENT[OPOINTER++] = 0x20;
                OCONTENT[OPOINTER++] = 0x74;
                OCONTENT[OPOINTER++] = 0x68;
                OCONTENT[OPOINTER++] = 0x69;
                OCONTENT[OPOINTER++] = 0x6e;
                OCONTENT[OPOINTER++] = 0x67;
                UNITTYPE |= STRING_OCTETS;
                return true;
            },
        },
        print: {
            full: function STR() {
                if (UNITTYPE !== STRING_OCTETS) return false;
                if (IPOINTER + 7 > ICONTENT.length) return false;
                if (ICONTENT[IPOINTER + 0] !== 0x64) return false;
                if (ICONTENT[IPOINTER + 1] !== 0x20) return false;
                if (ICONTENT[IPOINTER + 2] !== 0x74) return false;
                if (ICONTENT[IPOINTER + 3] !== 0x68) return false;
                if (ICONTENT[IPOINTER + 4] !== 0x69) return false;
                if (ICONTENT[IPOINTER + 5] !== 0x6e) return false;
                if (ICONTENT[IPOINTER + 6] !== 0x67) return false;
                IPOINTER += 7;
                return true;
            },
            infer: function STR() {
                return true;
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
                if (IPOINTER + 3 > ICONTENT.length) return false;
                if (ICONTENT[IPOINTER + 0] !== 0x66) return false;
                if (ICONTENT[IPOINTER + 1] !== 0x6f) return false;
                if (ICONTENT[IPOINTER + 2] !== 0x6f) return false;
                IPOINTER += 3;
                OCONTENT[OPOINTER++] = 0x66;
                OCONTENT[OPOINTER++] = 0x6f;
                OCONTENT[OPOINTER++] = 0x6f;
                UNITTYPE |= STRING_OCTETS;
                return true;
            },
            infer: function STR() {
                OCONTENT[OPOINTER++] = 0x66;
                OCONTENT[OPOINTER++] = 0x6f;
                OCONTENT[OPOINTER++] = 0x6f;
                UNITTYPE |= STRING_OCTETS;
                return true;
            },
        },
        print: {
            full: function STR() {
                if (UNITTYPE !== STRING_OCTETS) return false;
                if (IPOINTER + 3 > ICONTENT.length) return false;
                if (ICONTENT[IPOINTER + 0] !== 0x66) return false;
                if (ICONTENT[IPOINTER + 1] !== 0x6f) return false;
                if (ICONTENT[IPOINTER + 2] !== 0x6f) return false;
                IPOINTER += 3;
                OCONTENT[OPOINTER++] = 0x66;
                OCONTENT[OPOINTER++] = 0x6f;
                OCONTENT[OPOINTER++] = 0x6f;
                return true;
            },
            infer: function STR() {
                OCONTENT[OPOINTER++] = 0x66;
                OCONTENT[OPOINTER++] = 0x6f;
                OCONTENT[OPOINTER++] = 0x6f;
                return true;
            },
        },
        constant: "foo",
    });

    // StringLiteral
    const ꐚbᱻ2 = createRule(mode, {
        parse: {
            full: function STR() {
                if (IPOINTER + 3 > ICONTENT.length) return false;
                if (ICONTENT[IPOINTER + 0] !== 0x62) return false;
                if (ICONTENT[IPOINTER + 1] !== 0x61) return false;
                if (ICONTENT[IPOINTER + 2] !== 0x72) return false;
                IPOINTER += 3;
                OCONTENT[OPOINTER++] = 0x62;
                OCONTENT[OPOINTER++] = 0x61;
                OCONTENT[OPOINTER++] = 0x72;
                UNITTYPE |= STRING_OCTETS;
                return true;
            },
            infer: function STR() {
                OCONTENT[OPOINTER++] = 0x62;
                OCONTENT[OPOINTER++] = 0x61;
                OCONTENT[OPOINTER++] = 0x72;
                UNITTYPE |= STRING_OCTETS;
                return true;
            },
        },
        print: {
            full: function STR() {
                if (UNITTYPE !== STRING_OCTETS) return false;
                if (IPOINTER + 3 > ICONTENT.length) return false;
                if (ICONTENT[IPOINTER + 0] !== 0x62) return false;
                if (ICONTENT[IPOINTER + 1] !== 0x61) return false;
                if (ICONTENT[IPOINTER + 2] !== 0x72) return false;
                IPOINTER += 3;
                OCONTENT[OPOINTER++] = 0x62;
                OCONTENT[OPOINTER++] = 0x61;
                OCONTENT[OPOINTER++] = 0x72;
                return true;
            },
            infer: function STR() {
                OCONTENT[OPOINTER++] = 0x62;
                OCONTENT[OPOINTER++] = 0x61;
                OCONTENT[OPOINTER++] = 0x72;
                return true;
            },
        },
        constant: "bar",
    });

    // StringLiteral
    const ꐚbazᱻ2 = createRule(mode, {
        parse: {
            full: function STR() {
                if (IPOINTER + 3 > ICONTENT.length) return false;
                if (ICONTENT[IPOINTER + 0] !== 0x62) return false;
                if (ICONTENT[IPOINTER + 1] !== 0x61) return false;
                if (ICONTENT[IPOINTER + 2] !== 0x7a) return false;
                IPOINTER += 3;
                OCONTENT[OPOINTER++] = 0x62;
                OCONTENT[OPOINTER++] = 0x61;
                OCONTENT[OPOINTER++] = 0x7a;
                UNITTYPE |= STRING_OCTETS;
                return true;
            },
            infer: function STR() {
                OCONTENT[OPOINTER++] = 0x62;
                OCONTENT[OPOINTER++] = 0x61;
                OCONTENT[OPOINTER++] = 0x7a;
                UNITTYPE |= STRING_OCTETS;
                return true;
            },
        },
        print: {
            full: function STR() {
                if (UNITTYPE !== STRING_OCTETS) return false;
                if (IPOINTER + 3 > ICONTENT.length) return false;
                if (ICONTENT[IPOINTER + 0] !== 0x62) return false;
                if (ICONTENT[IPOINTER + 1] !== 0x61) return false;
                if (ICONTENT[IPOINTER + 2] !== 0x7a) return false;
                IPOINTER += 3;
                OCONTENT[OPOINTER++] = 0x62;
                OCONTENT[OPOINTER++] = 0x61;
                OCONTENT[OPOINTER++] = 0x7a;
                return true;
            },
            infer: function STR() {
                OCONTENT[OPOINTER++] = 0x62;
                OCONTENT[OPOINTER++] = 0x61;
                OCONTENT[OPOINTER++] = 0x7a;
                return true;
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
                OCONTENT[OPOINTER++] = 0x75;
                OCONTENT[OPOINTER++] = 0x74;
                OCONTENT[OPOINTER++] = 0x69;
                OCONTENT[OPOINTER++] = 0x6c;
                OCONTENT[OPOINTER++] = 0x31;
                UNITTYPE |= STRING_OCTETS;
                return true;
            },
            infer: function STR() {
                OCONTENT[OPOINTER++] = 0x75;
                OCONTENT[OPOINTER++] = 0x74;
                OCONTENT[OPOINTER++] = 0x69;
                OCONTENT[OPOINTER++] = 0x6c;
                OCONTENT[OPOINTER++] = 0x31;
                UNITTYPE |= STRING_OCTETS;
                return true;
            },
        },
        print: {
            full: function STR() {
                if (UNITTYPE !== STRING_OCTETS) return false;
                if (IPOINTER + 5 > ICONTENT.length) return false;
                if (ICONTENT[IPOINTER + 0] !== 0x75) return false;
                if (ICONTENT[IPOINTER + 1] !== 0x74) return false;
                if (ICONTENT[IPOINTER + 2] !== 0x69) return false;
                if (ICONTENT[IPOINTER + 3] !== 0x6c) return false;
                if (ICONTENT[IPOINTER + 4] !== 0x31) return false;
                IPOINTER += 5;
                return true;
            },
            infer: function STR() {
                return true;
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
                OCONTENT[OPOINTER++] = 0x75;
                OCONTENT[OPOINTER++] = 0x74;
                OCONTENT[OPOINTER++] = 0x69;
                OCONTENT[OPOINTER++] = 0x6c;
                OCONTENT[OPOINTER++] = 0x32;
                UNITTYPE |= STRING_OCTETS;
                return true;
            },
            infer: function STR() {
                OCONTENT[OPOINTER++] = 0x75;
                OCONTENT[OPOINTER++] = 0x74;
                OCONTENT[OPOINTER++] = 0x69;
                OCONTENT[OPOINTER++] = 0x6c;
                OCONTENT[OPOINTER++] = 0x32;
                UNITTYPE |= STRING_OCTETS;
                return true;
            },
        },
        print: {
            full: function STR() {
                if (UNITTYPE !== STRING_OCTETS) return false;
                if (IPOINTER + 5 > ICONTENT.length) return false;
                if (ICONTENT[IPOINTER + 0] !== 0x75) return false;
                if (ICONTENT[IPOINTER + 1] !== 0x74) return false;
                if (ICONTENT[IPOINTER + 2] !== 0x69) return false;
                if (ICONTENT[IPOINTER + 3] !== 0x6c) return false;
                if (ICONTENT[IPOINTER + 4] !== 0x32) return false;
                IPOINTER += 5;
                return true;
            },
            infer: function STR() {
                return true;
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
