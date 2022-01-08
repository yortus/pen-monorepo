// TODO: next:
// [ ] DATATYPE --> CAT_TYP or FRAG, SCALAR --> NON_CAT, STRING_CHARS --> OCTETS, LIST_ELEMENTS --> ELEMENTS, RECORD_FIELDS --> FIELDS or KVPS
// [ ] add OCAP for output capacity, and check/respect it everywhere output is added
//     - NB: only needed for Buffer - and can already check that via bug.len
// [ ] parseValue writes to VALUE, printValue reads from VALUE
// [ ] restore LEN/CAP (capacity) checking
// [ ]   printValue for STRING_CHARS always slices a new Buffer, could just set LEN/CAP instead if it was respected/checked everywhere




// TODO: still inaccurate - we cast around this for:
// - .toString('utf8', start, end);
// - .write(string, offset);
// - narrowing element type to number for octet operations
interface Arrayish<T> {
    [n: number]: T;
    length: number;
    slice(start?: number, end?: number): Arrayish<T>;
}




// VM REGISTERS - callee updates/restores
let ICONTENT: Arrayish<unknown>;
let IPOINTER: number = 0;
let OCONTENT: Arrayish<unknown>;
let OPOINTER: number = 0;
let DATATYPE: DATATYPE = 0; // NB: Parsers _must_ logical-OR this when returning true. Parsers _must not_ change this when returning false.
                            // NB: Printers _may_ check/validate this on entry. Printers _must_ return with the same value in DATATYPE.

type DATATYPE = typeof NOTHING | typeof SCALAR | typeof STRING_CHARS | typeof LIST_ELEMENTS | typeof RECORD_FIELDS;
const [NOTHING, SCALAR, STRING_CHARS, LIST_ELEMENTS, RECORD_FIELDS] = [0, 1, 2, 4, 8] as const;




// NB: for successful calls: OPOINTER is incremented, OCONTENT[OPOINTER-1] contains the new value, DATATYPE is unchanged
function parseValue(rule: Rule): boolean {
    const OPOINTERₒ = OPOINTER, DATATYPEₒ = DATATYPE;
    DATATYPE = NOTHING;
    if (!rule()) return DATATYPE = DATATYPEₒ, false;
    if (DATATYPE === NOTHING) return OPOINTER = OPOINTERₒ, DATATYPE = DATATYPEₒ, false;

    let value: unknown;
    switch (DATATYPE) {
        case SCALAR:
            assert(OPOINTER === OPOINTERₒ + 1);
            value = OCONTENT[OPOINTERₒ];
            break;
        case STRING_CHARS:
            const len = OPOINTER - OPOINTERₒ;
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
            ((atyp: never): never => { throw new Error(`Unhandled abstract type ${atyp}`); })(DATATYPE);
    }
    OCONTENT[OPOINTERₒ] = value;
    OPOINTER = OPOINTERₒ + 1;
    DATATYPE = DATATYPEₒ;
    return true;
}




// NB: for successful calls: IPOINTER is incremented, ICONTENT is unchanged, DATATYPE is unchanged
function printValue(rule: Rule): boolean {
    const IPOINTERₒ = IPOINTER, ICONTENTₒ = ICONTENT, DATATYPEₒ = DATATYPE;
    let value = ICONTENT[IPOINTER];
    let atyp: DATATYPE;
    let objKeys: string[] | undefined;

    // Nothing case
    if (value === undefined) {
        return false;
    }

    // Scalar case
    if (value === null || value === true || value === false || typeof value === 'number') {
        DATATYPE = SCALAR;
        const result = rule();
        DATATYPE = DATATYPEₒ;
        assert(IPOINTER === IPOINTERₒ + 1);
        return result;
    }

    // Aggregate cases
    if (typeof value === 'string') {
        const len = _internalBuffer.write(value, 0, undefined, 'utf8');
        ICONTENT = _internalBuffer.slice(0, len);
        atyp = DATATYPE = STRING_CHARS;
    }
    else if (Array.isArray(value)) {
        ICONTENT = value;
        atyp = DATATYPE = LIST_ELEMENTS;
    }
    else if (isObject(value)) {
        const arr: unknown[] = ICONTENT = [];
        objKeys = Object.keys(value); // TODO: doc reliance on prop order and what this means
        assert(objKeys.length < 32); // TODO: document this limit, move to constant, consider how to remove it
        for (let i = 0; i < objKeys.length; ++i) arr.push(objKeys[i], value[objKeys[i]]);
        atyp = DATATYPE = RECORD_FIELDS;
    }
    else {
        throw new Error(`Unsupported value type for value ${value}`);
    }

    // Do the thing
    IPOINTER = 0;
    let result = rule();

    // Restore ICONTENT/IPOINTER/DATATYPE
    const ICONTENTᐟ = ICONTENT, IPOINTERᐟ = IPOINTER;
    ICONTENT = ICONTENTₒ, IPOINTER = IPOINTERₒ, DATATYPE = DATATYPEₒ;
    if (!result) return false;

    // Ensure input was fully consumed
    if (atyp === RECORD_FIELDS) {
        const keyCount = objKeys!.length;
        if (keyCount > 0 && (IPOINTERᐟ !== -1 >>> (32 - keyCount))) return false;
    }
    else /* STRING_CHARS | LIST_ELEMENTS */ {
        if (IPOINTERᐟ !== ICONTENTᐟ.length) return false;
    }
    IPOINTER += 1;
    return true;
}




// Used internally by the VM
const _internalBuffer = Buffer.alloc(2 ** 16); // TODO: now 64K - how big to make this? What if it's ever too small?
