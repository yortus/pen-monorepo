
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

    // StringLiteral
    const ꐚx = createRule(mode, {
        parse: {
            full: function STR() {
                if (IPOINTER + 7 > ICONTENT.length) return false;
                if (ICONTENT[IPOINTER + 0] !== 0x6f) return false;
                if (ICONTENT[IPOINTER + 1] !== 0x75) return false;
                if (ICONTENT[IPOINTER + 2] !== 0x74) return false;
                if (ICONTENT[IPOINTER + 3] !== 0x65) return false;
                if (ICONTENT[IPOINTER + 4] !== 0x72) return false;
                if (ICONTENT[IPOINTER + 5] !== 0x20) return false;
                if (ICONTENT[IPOINTER + 6] !== 0x78) return false;
                IPOINTER += 7;
                OCONTENT[OPOINTER++] = 0x6f;
                OCONTENT[OPOINTER++] = 0x75;
                OCONTENT[OPOINTER++] = 0x74;
                OCONTENT[OPOINTER++] = 0x65;
                OCONTENT[OPOINTER++] = 0x72;
                OCONTENT[OPOINTER++] = 0x20;
                OCONTENT[OPOINTER++] = 0x78;
                UNITTYPE |= STRING_OCTETS;
                return true;
            },
            infer: function STR() {
                OCONTENT[OPOINTER++] = 0x6f;
                OCONTENT[OPOINTER++] = 0x75;
                OCONTENT[OPOINTER++] = 0x74;
                OCONTENT[OPOINTER++] = 0x65;
                OCONTENT[OPOINTER++] = 0x72;
                OCONTENT[OPOINTER++] = 0x20;
                OCONTENT[OPOINTER++] = 0x78;
                UNITTYPE |= STRING_OCTETS;
                return true;
            },
        },
        print: {
            full: function STR() {
                if (UNITTYPE !== STRING_OCTETS) return false;
                if (IPOINTER + 7 > ICONTENT.length) return false;
                if (ICONTENT[IPOINTER + 0] !== 0x6f) return false;
                if (ICONTENT[IPOINTER + 1] !== 0x75) return false;
                if (ICONTENT[IPOINTER + 2] !== 0x74) return false;
                if (ICONTENT[IPOINTER + 3] !== 0x65) return false;
                if (ICONTENT[IPOINTER + 4] !== 0x72) return false;
                if (ICONTENT[IPOINTER + 5] !== 0x20) return false;
                if (ICONTENT[IPOINTER + 6] !== 0x78) return false;
                IPOINTER += 7;
                OCONTENT[OPOINTER++] = 0x6f;
                OCONTENT[OPOINTER++] = 0x75;
                OCONTENT[OPOINTER++] = 0x74;
                OCONTENT[OPOINTER++] = 0x65;
                OCONTENT[OPOINTER++] = 0x72;
                OCONTENT[OPOINTER++] = 0x20;
                OCONTENT[OPOINTER++] = 0x78;
                return true;
            },
            infer: function STR() {
                OCONTENT[OPOINTER++] = 0x6f;
                OCONTENT[OPOINTER++] = 0x75;
                OCONTENT[OPOINTER++] = 0x74;
                OCONTENT[OPOINTER++] = 0x65;
                OCONTENT[OPOINTER++] = 0x72;
                OCONTENT[OPOINTER++] = 0x20;
                OCONTENT[OPOINTER++] = 0x78;
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
                    const IPOINTERₒ = IPOINTER, OPOINTERₒ = OPOINTER, UNITTYPEₒ = UNITTYPE;
                    if (!ꐚa()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, UNITTYPE = UNITTYPEₒ, false;
                    if (!ꐚxᱻ3()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, UNITTYPE = UNITTYPEₒ, false;
                    if (!ꐚa()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, UNITTYPE = UNITTYPEₒ, false;
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
                    const IPOINTERₒ = IPOINTER, OPOINTERₒ = OPOINTER, UNITTYPEₒ = UNITTYPE;
                    if (!ꐚa()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, UNITTYPE = UNITTYPEₒ, false;
                    if (!ꐚxᱻ3()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, UNITTYPE = UNITTYPEₒ, false;
                    if (!ꐚa()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, UNITTYPE = UNITTYPEₒ, false;
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
                    const IPOINTERₒ = IPOINTER, OPOINTERₒ = OPOINTER, UNITTYPEₒ = UNITTYPE;
                    if (!ꐚxᱻ2()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, UNITTYPE = UNITTYPEₒ, false;
                    if (!ꐚxᱻ2()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, UNITTYPE = UNITTYPEₒ, false;
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
                    const IPOINTERₒ = IPOINTER, OPOINTERₒ = OPOINTER, UNITTYPEₒ = UNITTYPE;
                    if (!ꐚxᱻ2()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, UNITTYPE = UNITTYPEₒ, false;
                    if (!ꐚxᱻ2()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, UNITTYPE = UNITTYPEₒ, false;
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
                if (IPOINTER + 7 > ICONTENT.length) return false;
                if (ICONTENT[IPOINTER + 0] !== 0x69) return false;
                if (ICONTENT[IPOINTER + 1] !== 0x6e) return false;
                if (ICONTENT[IPOINTER + 2] !== 0x6e) return false;
                if (ICONTENT[IPOINTER + 3] !== 0x65) return false;
                if (ICONTENT[IPOINTER + 4] !== 0x72) return false;
                if (ICONTENT[IPOINTER + 5] !== 0x20) return false;
                if (ICONTENT[IPOINTER + 6] !== 0x78) return false;
                IPOINTER += 7;
                OCONTENT[OPOINTER++] = 0x69;
                OCONTENT[OPOINTER++] = 0x6e;
                OCONTENT[OPOINTER++] = 0x6e;
                OCONTENT[OPOINTER++] = 0x65;
                OCONTENT[OPOINTER++] = 0x72;
                OCONTENT[OPOINTER++] = 0x20;
                OCONTENT[OPOINTER++] = 0x78;
                UNITTYPE |= STRING_OCTETS;
                return true;
            },
            infer: function STR() {
                OCONTENT[OPOINTER++] = 0x69;
                OCONTENT[OPOINTER++] = 0x6e;
                OCONTENT[OPOINTER++] = 0x6e;
                OCONTENT[OPOINTER++] = 0x65;
                OCONTENT[OPOINTER++] = 0x72;
                OCONTENT[OPOINTER++] = 0x20;
                OCONTENT[OPOINTER++] = 0x78;
                UNITTYPE |= STRING_OCTETS;
                return true;
            },
        },
        print: {
            full: function STR() {
                if (UNITTYPE !== STRING_OCTETS) return false;
                if (IPOINTER + 7 > ICONTENT.length) return false;
                if (ICONTENT[IPOINTER + 0] !== 0x69) return false;
                if (ICONTENT[IPOINTER + 1] !== 0x6e) return false;
                if (ICONTENT[IPOINTER + 2] !== 0x6e) return false;
                if (ICONTENT[IPOINTER + 3] !== 0x65) return false;
                if (ICONTENT[IPOINTER + 4] !== 0x72) return false;
                if (ICONTENT[IPOINTER + 5] !== 0x20) return false;
                if (ICONTENT[IPOINTER + 6] !== 0x78) return false;
                IPOINTER += 7;
                OCONTENT[OPOINTER++] = 0x69;
                OCONTENT[OPOINTER++] = 0x6e;
                OCONTENT[OPOINTER++] = 0x6e;
                OCONTENT[OPOINTER++] = 0x65;
                OCONTENT[OPOINTER++] = 0x72;
                OCONTENT[OPOINTER++] = 0x20;
                OCONTENT[OPOINTER++] = 0x78;
                return true;
            },
            infer: function STR() {
                OCONTENT[OPOINTER++] = 0x69;
                OCONTENT[OPOINTER++] = 0x6e;
                OCONTENT[OPOINTER++] = 0x6e;
                OCONTENT[OPOINTER++] = 0x65;
                OCONTENT[OPOINTER++] = 0x72;
                OCONTENT[OPOINTER++] = 0x20;
                OCONTENT[OPOINTER++] = 0x78;
                return true;
            },
        },
        constant: "inner x",
    });

    // NumericLiteral
    const ꐚaᱻ2 = createRule(mode, {
        parse: {
            full: () => {
                OCONTENT[OPOINTER++] = 42;
                UNITTYPE |= SCALAR_VALUE;
                return true;
            },
            infer: () => {
                OCONTENT[OPOINTER++] = 42;
                UNITTYPE != SCALAR_VALUE;
                return true;
            },
        },
        print: {
            full: function LIT() {
                if (UNITTYPE !== SCALAR_VALUE) return false;
                if (ICONTENT[IPOINTER] !== 42) return false;
                IPOINTER += 1;
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
                if (IPOINTER + 7 > ICONTENT.length) return false;
                if (ICONTENT[IPOINTER + 0] !== 0x69) return false;
                if (ICONTENT[IPOINTER + 1] !== 0x6e) return false;
                if (ICONTENT[IPOINTER + 2] !== 0x6e) return false;
                if (ICONTENT[IPOINTER + 3] !== 0x65) return false;
                if (ICONTENT[IPOINTER + 4] !== 0x72) return false;
                if (ICONTENT[IPOINTER + 5] !== 0x20) return false;
                if (ICONTENT[IPOINTER + 6] !== 0x78) return false;
                IPOINTER += 7;
                OCONTENT[OPOINTER++] = 0x69;
                OCONTENT[OPOINTER++] = 0x6e;
                OCONTENT[OPOINTER++] = 0x6e;
                OCONTENT[OPOINTER++] = 0x65;
                OCONTENT[OPOINTER++] = 0x72;
                OCONTENT[OPOINTER++] = 0x20;
                OCONTENT[OPOINTER++] = 0x78;
                UNITTYPE |= STRING_OCTETS;
                return true;
            },
            infer: function STR() {
                OCONTENT[OPOINTER++] = 0x69;
                OCONTENT[OPOINTER++] = 0x6e;
                OCONTENT[OPOINTER++] = 0x6e;
                OCONTENT[OPOINTER++] = 0x65;
                OCONTENT[OPOINTER++] = 0x72;
                OCONTENT[OPOINTER++] = 0x20;
                OCONTENT[OPOINTER++] = 0x78;
                UNITTYPE |= STRING_OCTETS;
                return true;
            },
        },
        print: {
            full: function STR() {
                if (UNITTYPE !== STRING_OCTETS) return false;
                if (IPOINTER + 7 > ICONTENT.length) return false;
                if (ICONTENT[IPOINTER + 0] !== 0x69) return false;
                if (ICONTENT[IPOINTER + 1] !== 0x6e) return false;
                if (ICONTENT[IPOINTER + 2] !== 0x6e) return false;
                if (ICONTENT[IPOINTER + 3] !== 0x65) return false;
                if (ICONTENT[IPOINTER + 4] !== 0x72) return false;
                if (ICONTENT[IPOINTER + 5] !== 0x20) return false;
                if (ICONTENT[IPOINTER + 6] !== 0x78) return false;
                IPOINTER += 7;
                OCONTENT[OPOINTER++] = 0x69;
                OCONTENT[OPOINTER++] = 0x6e;
                OCONTENT[OPOINTER++] = 0x6e;
                OCONTENT[OPOINTER++] = 0x65;
                OCONTENT[OPOINTER++] = 0x72;
                OCONTENT[OPOINTER++] = 0x20;
                OCONTENT[OPOINTER++] = 0x78;
                return true;
            },
            infer: function STR() {
                OCONTENT[OPOINTER++] = 0x69;
                OCONTENT[OPOINTER++] = 0x6e;
                OCONTENT[OPOINTER++] = 0x6e;
                OCONTENT[OPOINTER++] = 0x65;
                OCONTENT[OPOINTER++] = 0x72;
                OCONTENT[OPOINTER++] = 0x20;
                OCONTENT[OPOINTER++] = 0x78;
                return true;
            },
        },
        constant: "inner x",
    });

    // StringLiteral
    const ꐚly = createRule(mode, {
        parse: {
            full: function STR() {
                if (IPOINTER + 3 > ICONTENT.length) return false;
                if (ICONTENT[IPOINTER + 0] !== 0x2a) return false;
                if (ICONTENT[IPOINTER + 1] !== 0x2a) return false;
                if (ICONTENT[IPOINTER + 2] !== 0x2a) return false;
                IPOINTER += 3;
                OCONTENT[OPOINTER++] = 0x2a;
                OCONTENT[OPOINTER++] = 0x2a;
                OCONTENT[OPOINTER++] = 0x2a;
                UNITTYPE |= STRING_OCTETS;
                return true;
            },
            infer: function STR() {
                OCONTENT[OPOINTER++] = 0x2a;
                OCONTENT[OPOINTER++] = 0x2a;
                OCONTENT[OPOINTER++] = 0x2a;
                UNITTYPE |= STRING_OCTETS;
                return true;
            },
        },
        print: {
            full: function STR() {
                if (UNITTYPE !== STRING_OCTETS) return false;
                if (IPOINTER + 3 > ICONTENT.length) return false;
                if (ICONTENT[IPOINTER + 0] !== 0x2a) return false;
                if (ICONTENT[IPOINTER + 1] !== 0x2a) return false;
                if (ICONTENT[IPOINTER + 2] !== 0x2a) return false;
                IPOINTER += 3;
                OCONTENT[OPOINTER++] = 0x2a;
                OCONTENT[OPOINTER++] = 0x2a;
                OCONTENT[OPOINTER++] = 0x2a;
                return true;
            },
            infer: function STR() {
                OCONTENT[OPOINTER++] = 0x2a;
                OCONTENT[OPOINTER++] = 0x2a;
                OCONTENT[OPOINTER++] = 0x2a;
                return true;
            },
        },
        constant: "***",
    });

    // SequenceExpression
    const ꐚletexpr = createRule(mode, {
        parse: {
            full: function SEQ() {
                const IPOINTERₒ = IPOINTER, OPOINTERₒ = OPOINTER, UNITTYPEₒ = UNITTYPE;
                if (!ꐚlx()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, UNITTYPE = UNITTYPEₒ, false;
                if (!ꐚletexprᱻ1()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, UNITTYPE = UNITTYPEₒ, false;
                if (!ꐚlx()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, UNITTYPE = UNITTYPEₒ, false;
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
                const IPOINTERₒ = IPOINTER, OPOINTERₒ = OPOINTER, UNITTYPEₒ = UNITTYPE;
                if (!ꐚlx()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, UNITTYPE = UNITTYPEₒ, false;
                if (!ꐚletexprᱻ1()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, UNITTYPE = UNITTYPEₒ, false;
                if (!ꐚlx()) return IPOINTER = IPOINTERₒ, OPOINTER = OPOINTERₒ, UNITTYPE = UNITTYPEₒ, false;
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
                if (IPOINTER >= ICONTENT.length) return false;
                cc = ICONTENT[IPOINTER];
                if (cc !== 0x2d) return false;
                IPOINTER += 1;
                OCONTENT[OPOINTER++] = cc;
                UNITTYPE |= STRING_OCTETS
                return true;
            },
            infer: () => {
                OCONTENT[OPOINTER++] = 0x2d;
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
                if (cc !== 0x2d) return false;
                IPOINTER += 1;
                OCONTENT[OPOINTER++] = cc;
                return true;
            },
            infer: () => {
                OCONTENT[OPOINTER++] = 0x2d;
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
