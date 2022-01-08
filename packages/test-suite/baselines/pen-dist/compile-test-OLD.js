
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
    const ꐚstartᱻ2 = Object.assign(
        arg => ꐚfoo(arg),
        {infer: arg => ꐚfoo.infer(arg)},
    );

    // StringLiteral
    const ꐚfoo = createRule(mode, {
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
    const ꐚbar = createRule(mode, {
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
                if (IPOINTER + 2 > ICONTENT.length) return false;
                if (ICONTENT[IPOINTER + 0] !== 0x62) return false;
                if (ICONTENT[IPOINTER + 1] !== 0x32) return false;
                IPOINTER += 2;
                OCONTENT[OPOINTER++] = 0x62;
                OCONTENT[OPOINTER++] = 0x32;
                UNITTYPE |= STRING_OCTETS;
                return true;
            },
            infer: function STR() {
                OCONTENT[OPOINTER++] = 0x62;
                OCONTENT[OPOINTER++] = 0x32;
                UNITTYPE |= STRING_OCTETS;
                return true;
            },
        },
        print: {
            full: function STR() {
                if (UNITTYPE !== STRING_OCTETS) return false;
                if (IPOINTER + 2 > ICONTENT.length) return false;
                if (ICONTENT[IPOINTER + 0] !== 0x62) return false;
                if (ICONTENT[IPOINTER + 1] !== 0x32) return false;
                IPOINTER += 2;
                OCONTENT[OPOINTER++] = 0x62;
                OCONTENT[OPOINTER++] = 0x32;
                return true;
            },
            infer: function STR() {
                OCONTENT[OPOINTER++] = 0x62;
                OCONTENT[OPOINTER++] = 0x32;
                return true;
            },
        },
        constant: "b2",
    });

    // StringLiteral
    const ꐚbaz = createRule(mode, {
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

    // StringLiteral
    const ꐚmem = createRule(mode, {
        parse: {
            full: function STR() {
                if (IPOINTER + 6 > ICONTENT.length) return false;
                if (ICONTENT[IPOINTER + 0] !== 0x6d) return false;
                if (ICONTENT[IPOINTER + 1] !== 0x65) return false;
                if (ICONTENT[IPOINTER + 2] !== 0x6d) return false;
                if (ICONTENT[IPOINTER + 3] !== 0x62) return false;
                if (ICONTENT[IPOINTER + 4] !== 0x65) return false;
                if (ICONTENT[IPOINTER + 5] !== 0x72) return false;
                IPOINTER += 6;
                OCONTENT[OPOINTER++] = 0x6d;
                OCONTENT[OPOINTER++] = 0x65;
                OCONTENT[OPOINTER++] = 0x6d;
                OCONTENT[OPOINTER++] = 0x62;
                OCONTENT[OPOINTER++] = 0x65;
                OCONTENT[OPOINTER++] = 0x72;
                UNITTYPE |= STRING_OCTETS;
                return true;
            },
            infer: function STR() {
                OCONTENT[OPOINTER++] = 0x6d;
                OCONTENT[OPOINTER++] = 0x65;
                OCONTENT[OPOINTER++] = 0x6d;
                OCONTENT[OPOINTER++] = 0x62;
                OCONTENT[OPOINTER++] = 0x65;
                OCONTENT[OPOINTER++] = 0x72;
                UNITTYPE |= STRING_OCTETS;
                return true;
            },
        },
        print: {
            full: function STR() {
                if (UNITTYPE !== STRING_OCTETS) return false;
                if (IPOINTER + 6 > ICONTENT.length) return false;
                if (ICONTENT[IPOINTER + 0] !== 0x6d) return false;
                if (ICONTENT[IPOINTER + 1] !== 0x65) return false;
                if (ICONTENT[IPOINTER + 2] !== 0x6d) return false;
                if (ICONTENT[IPOINTER + 3] !== 0x62) return false;
                if (ICONTENT[IPOINTER + 4] !== 0x65) return false;
                if (ICONTENT[IPOINTER + 5] !== 0x72) return false;
                IPOINTER += 6;
                OCONTENT[OPOINTER++] = 0x6d;
                OCONTENT[OPOINTER++] = 0x65;
                OCONTENT[OPOINTER++] = 0x6d;
                OCONTENT[OPOINTER++] = 0x62;
                OCONTENT[OPOINTER++] = 0x65;
                OCONTENT[OPOINTER++] = 0x72;
                return true;
            },
            infer: function STR() {
                OCONTENT[OPOINTER++] = 0x6d;
                OCONTENT[OPOINTER++] = 0x65;
                OCONTENT[OPOINTER++] = 0x6d;
                OCONTENT[OPOINTER++] = 0x62;
                OCONTENT[OPOINTER++] = 0x65;
                OCONTENT[OPOINTER++] = 0x72;
                return true;
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
                const IPOINTERₒ = IPOINTER, OPOINTERₒ = OPOINTER, UNITTYPEₒ = UNITTYPE;
                if (!ꐚaᱻ3ᱻ1()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, UNITTYPE = UNITTYPEₒ, false;
                if (!ꐚbᱻ2()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, UNITTYPE = UNITTYPEₒ, false;
                return true;
            },
            infer: () => {
                ꐚaᱻ3ᱻ1.infer();
                ꐚbᱻ2.infer();
                return true;
            },
        },
        print: {
            full: function SEQ() {
                const IPOINTERₒ = IPOINTER, OPOINTERₒ = OPOINTER, UNITTYPEₒ = UNITTYPE;
                if (!ꐚaᱻ3ᱻ1()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, UNITTYPE = UNITTYPEₒ, false;
                if (!ꐚbᱻ2()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, UNITTYPE = UNITTYPEₒ, false;
                return true;
            },
            infer: () => {
                ꐚaᱻ3ᱻ1.infer();
                ꐚbᱻ2.infer();
                return true;
            },
        },
    });

    // ByteExpression
    const ꐚaᱻ3ᱻ1 = createRule(mode, {
        parse: {
            full: function BYT() {
                let cc;
                if (IPOINTER >= ICONTENT.length) return false;
                cc = ICONTENT[IPOINTER];
                if (cc !== 0x61) return false;
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
                if (cc !== 0x61) return false;
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
                const IPOINTERₒ = IPOINTER, OPOINTERₒ = OPOINTER, UNITTYPEₒ = UNITTYPE;
                if (!ꐚbᱻ2ᱻ1()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, UNITTYPE = UNITTYPEₒ, false;
                if (!ꐚaᱻ3()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, UNITTYPE = UNITTYPEₒ, false;
                return true;
            },
            infer: () => {
                ꐚbᱻ2ᱻ1.infer();
                ꐚaᱻ3.infer();
                return true;
            },
        },
        print: {
            full: function SEQ() {
                const IPOINTERₒ = IPOINTER, OPOINTERₒ = OPOINTER, UNITTYPEₒ = UNITTYPE;
                if (!ꐚbᱻ2ᱻ1()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, UNITTYPE = UNITTYPEₒ, false;
                if (!ꐚaᱻ3()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, UNITTYPE = UNITTYPEₒ, false;
                return true;
            },
            infer: () => {
                ꐚbᱻ2ᱻ1.infer();
                ꐚaᱻ3.infer();
                return true;
            },
        },
    });

    // ByteExpression
    const ꐚbᱻ2ᱻ1 = createRule(mode, {
        parse: {
            full: function BYT() {
                let cc;
                if (IPOINTER >= ICONTENT.length) return false;
                cc = ICONTENT[IPOINTER];
                if (cc !== 0x62) return false;
                IPOINTER += 1;
                OCONTENT[OPOINTER++] = cc;
                UNITTYPE |= STRING_OCTETS
                return true;
            },
            infer: () => {
                OCONTENT[OPOINTER++] = 0x62;
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
                if (cc !== 0x62) return false;
                IPOINTER += 1;
                OCONTENT[OPOINTER++] = cc;
                return true;
            },
            infer: () => {
                OCONTENT[OPOINTER++] = 0x62;
                return true;
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
                if (IPOINTER + 2 > ICONTENT.length) return false;
                if (ICONTENT[IPOINTER + 0] !== 0x63) return false;
                if (ICONTENT[IPOINTER + 1] !== 0x31) return false;
                IPOINTER += 2;
                OCONTENT[OPOINTER++] = 0x63;
                OCONTENT[OPOINTER++] = 0x31;
                UNITTYPE |= STRING_OCTETS;
                return true;
            },
            infer: function STR() {
                OCONTENT[OPOINTER++] = 0x63;
                OCONTENT[OPOINTER++] = 0x31;
                UNITTYPE |= STRING_OCTETS;
                return true;
            },
        },
        print: {
            full: function STR() {
                if (UNITTYPE !== STRING_OCTETS) return false;
                if (IPOINTER + 2 > ICONTENT.length) return false;
                if (ICONTENT[IPOINTER + 0] !== 0x63) return false;
                if (ICONTENT[IPOINTER + 1] !== 0x31) return false;
                IPOINTER += 2;
                OCONTENT[OPOINTER++] = 0x63;
                OCONTENT[OPOINTER++] = 0x31;
                return true;
            },
            infer: function STR() {
                OCONTENT[OPOINTER++] = 0x63;
                OCONTENT[OPOINTER++] = 0x31;
                return true;
            },
        },
        constant: "c1",
    });

    // StringLiteral
    const ꐚc2 = createRule(mode, {
        parse: {
            full: function STR() {
                if (IPOINTER + 2 > ICONTENT.length) return false;
                if (ICONTENT[IPOINTER + 0] !== 0x63) return false;
                if (ICONTENT[IPOINTER + 1] !== 0x32) return false;
                IPOINTER += 2;
                OCONTENT[OPOINTER++] = 0x63;
                OCONTENT[OPOINTER++] = 0x32;
                UNITTYPE |= STRING_OCTETS;
                return true;
            },
            infer: function STR() {
                OCONTENT[OPOINTER++] = 0x63;
                OCONTENT[OPOINTER++] = 0x32;
                UNITTYPE |= STRING_OCTETS;
                return true;
            },
        },
        print: {
            full: function STR() {
                if (UNITTYPE !== STRING_OCTETS) return false;
                if (IPOINTER + 2 > ICONTENT.length) return false;
                if (ICONTENT[IPOINTER + 0] !== 0x63) return false;
                if (ICONTENT[IPOINTER + 1] !== 0x32) return false;
                IPOINTER += 2;
                OCONTENT[OPOINTER++] = 0x63;
                OCONTENT[OPOINTER++] = 0x32;
                return true;
            },
            infer: function STR() {
                OCONTENT[OPOINTER++] = 0x63;
                OCONTENT[OPOINTER++] = 0x32;
                return true;
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
