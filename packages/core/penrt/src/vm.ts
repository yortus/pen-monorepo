// VM REGISTERS - callee updates/restores

// NB: Parse/print rules _must not_ reassign ICONTENT or OCONTENT, or modify any input content, or modify any output content before IPOINTER
let ICONTENT: unknown[] | Buffer;
let OCONTENT: unknown[] | Buffer;

// NB: Parse/print rules _may_ advance these registers when returning true. Parse/print rules _must not_ modify these registers when returning false.
let IPOINTER: number = 0;
let OPOINTER: number = 0;

// NB: Parse rules _must_ logical-OR UNITTYPE when returning true. Parse rules _must not_ modify UNITTYPE when returning false.
// NB: Print rules _must_ validate UNITTYPE on entry. Print rules _must not_ modify UNITTYPE.
let UNITTYPE: typeof NO_UNIT | typeof SCALAR_VALUE | typeof STRING_OCTETS | typeof LIST_ELEMENTS | typeof RECORD_FIELDS = 0;
const [NO_UNIT, SCALAR_VALUE, STRING_OCTETS, LIST_ELEMENTS, RECORD_FIELDS] = [0, 1, 2, 4, 8] as const;




// NB: for successful calls: OPOINTER is incremented, OCONTENT[OPOINTER-1] contains the new value, UNITTYPE is unchanged
function parseValue(rule: Rule): boolean {
    const OPOINTERₒ = OPOINTER, UNITTYPEₒ = UNITTYPE;
    UNITTYPE = NO_UNIT;
    if (!rule()) return UNITTYPE = UNITTYPEₒ, false;
    if (UNITTYPE === NO_UNIT) return OPOINTER = OPOINTERₒ, UNITTYPE = UNITTYPEₒ, false;

    let value: unknown;
    switch (UNITTYPE) {
        case SCALAR_VALUE:
            assert(OPOINTER === OPOINTERₒ + 1);
            value = OCONTENT[OPOINTERₒ];
            break;
        case STRING_OCTETS:
            const len = OPOINTER - OPOINTERₒ;
            assert(len < _internalBuffer.length, 'internal buffer too small');
            for (let i = 0; i < len; ++i) _internalBuffer[i] = OCONTENT[OPOINTERₒ + i] as number;
            value = _internalBuffer.toString('utf8', 0, len);
            break;
        case LIST_ELEMENTS:
            value = OCONTENT.slice(OPOINTERₒ, OPOINTER);
            break;
        case RECORD_FIELDS:
            const obj: Record<string, unknown> = value = {};
            for (let i = OPOINTERₒ; i < OPOINTER; i += 2) obj[OCONTENT[i] as string] = OCONTENT[i + 1];
            if (Object.keys(obj).length * 2 < (OPOINTER - OPOINTERₒ)) throw new Error(`Duplicate labels in record`);
            break;
        default:
            // Ensure all cases have been handled, both at compile time and at runtime.
            ((atyp: never): never => { throw new Error(`Unhandled abstract type ${atyp}`); })(UNITTYPE);
    }
    OCONTENT[OPOINTERₒ] = value;
    OPOINTER = OPOINTERₒ + 1;
    UNITTYPE = UNITTYPEₒ;
    return true;
}




// NB: for successful calls: IPOINTER is incremented, ICONTENT is unchanged, UNITTYPE is unchanged
function printValue(rule: Rule): boolean {
    const IPOINTERₒ = IPOINTER, ICONTENTₒ = ICONTENT, UNITTYPEₒ = UNITTYPE;
    const value = ICONTENT[IPOINTER];
    let objKeys: string[] | undefined;

    // Nothing case
    if (value === undefined) {
        return false;
    }

    // Scalar case
    if (value === null || value === true || value === false || typeof value === 'number') {
        UNITTYPE = SCALAR_VALUE;
        const result = rule();
        UNITTYPE = UNITTYPEₒ;
        assert(IPOINTER === IPOINTERₒ + 1);
        return result;
    }

    // Aggregate cases
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
        const arr: unknown[] = ICONTENT = [];
        objKeys = Object.keys(value); // TODO: doc reliance on prop order and what this means
        assert(objKeys.length < 32); // TODO: document this limit, move to constant, consider how to remove it
        for (let i = 0; i < objKeys.length; ++i) arr.push(objKeys[i], value[objKeys[i]]);
        UNITTYPE = RECORD_FIELDS;
    }
    else {
        throw new Error(`Unsupported value type for value ${value}`);
    }

    // Do the thing
    IPOINTER = 0;
    let result = rule();

    // Restore ICONTENT/IPOINTER/UNITTYPE
    const ICONTENTᐟ = ICONTENT, IPOINTERᐟ = IPOINTER, UNITTYPEᐟ = UNITTYPE;
    ICONTENT = ICONTENTₒ, IPOINTER = IPOINTERₒ, UNITTYPE = UNITTYPEₒ;
    if (!result) return false;

    // Ensure input was fully consumed
    if (UNITTYPEᐟ === RECORD_FIELDS) {
        const keyCount = objKeys!.length;
        if (keyCount > 0 && (IPOINTERᐟ !== -1 >>> (32 - keyCount))) return false;
    }
    else /* STRING_OCTETS | LIST_ELEMENTS */ {
        if (IPOINTERᐟ !== ICONTENTᐟ.length) return false;
    }
    IPOINTER += 1;
    return true;
}




// Used internally by the VM
const _internalBuffer = Buffer.alloc(2 ** 16); // TODO: now 64K - how big to make this? Can it be dynamic?
