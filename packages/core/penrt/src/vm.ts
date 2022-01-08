// TODO: next:
// [ ] ATYP --> CAT_TYP or FRAG, SCALAR --> NON_CAT, STRING_CHARS --> OCTETS, LIST_ELEMENTS --> ELEMENTS, RECORD_FIELDS --> FIELDS or KVPS
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
let IREP: Arrayish<unknown>;
let IPOS: number = 0;
let OREP: Arrayish<unknown>;
let OPOS: number = 0;
let ATYP: ATYP = 0; // NB: Parsers _must_ logical-OR this when returning true. Parsers _must not_ change this when returning false.
                    // NB: Printers _may_ check/validate this on entry. Printers _must_ return with the same value in ATYP.

type ATYP = typeof NOTHING | typeof SCALAR | typeof STRING_CHARS | typeof LIST_ELEMENTS | typeof RECORD_FIELDS;
const [NOTHING, SCALAR, STRING_CHARS, LIST_ELEMENTS, RECORD_FIELDS] = [0, 1, 2, 4, 8] as const;




// NB: for successful calls: OPOS is incremented, OREP[OPOS-1] contains the new value, ATYP is unchanged
function parseValue(rule: Rule): boolean {
    const OPOSₒ = OPOS, ATYPₒ = ATYP;
    ATYP = NOTHING;
    if (!rule()) return ATYP = ATYPₒ, false;
    if (ATYP === NOTHING) return OPOS = OPOSₒ, ATYP = ATYPₒ, false;

    let value: unknown;
    switch (ATYP) {
        case SCALAR:
            assert(OPOS === OPOSₒ + 1);
            value = OREP[OPOSₒ];
            break;
        case STRING_CHARS:
            const len = OPOS - OPOSₒ;
            for (let i = 0; i < len; ++i) _internalBuffer[i] = OREP[OPOSₒ + i] as number;
            value = _internalBuffer.toString('utf8', 0, len);
            break;
        case LIST_ELEMENTS:
            value = OREP.slice(OPOSₒ, OPOS);
            break;
        case RECORD_FIELDS:
            const obj: Record<string, unknown> = value = {};
            for (let i = OPOSₒ; i < OPOS; i += 2) obj[OREP[i] as string] = OREP[i + 1];
            if (Object.keys(obj).length * 2 < (OPOS - OPOSₒ)) throw new Error(`Duplicate labels in record`);
            break;
        default:
            // Ensure all cases have been handled, both at compile time and at runtime.
            ((atyp: never): never => { throw new Error(`Unhandled abstract type ${atyp}`); })(ATYP);
    }
    OREP[OPOSₒ] = value;
    OPOS = OPOSₒ + 1;
    ATYP = ATYPₒ;
    return true;
}




// NB: for successful calls: IPOS is incremented, IREP is unchanged, ATYP is unchanged
function printValue(rule: Rule): boolean {
    const IPOSₒ = IPOS, IREPₒ = IREP, ATYPₒ = ATYP;
    let value = IREP[IPOS];
    let atyp: ATYP;
    let objKeys: string[] | undefined;

    // Nothing case
    if (value === undefined) {
        return false;
    }

    // Scalar case
    if (value === null || value === true || value === false || typeof value === 'number') {
        ATYP = SCALAR;
        const result = rule();
        ATYP = ATYPₒ;
        assert(IPOS === IPOSₒ + 1);
        return result;
    }

    // Aggregate cases
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
        const arr: unknown[] = IREP = [];
        objKeys = Object.keys(value); // TODO: doc reliance on prop order and what this means
        assert(objKeys.length < 32); // TODO: document this limit, move to constant, consider how to remove it
        for (let i = 0; i < objKeys.length; ++i) arr.push(objKeys[i], value[objKeys[i]]);
        atyp = ATYP = RECORD_FIELDS;
    }
    else {
        throw new Error(`Unsupported value type for value ${value}`);
    }

    // Do the thing
    IPOS = 0;
    let result = rule();

    // Restore IREP/IPOS/ATYP
    const ipos = IPOS, ilen = IREP.length;
    IREP = IREPₒ, IPOS = IPOSₒ, ATYP = ATYPₒ;
    if (!result) return false;

    // Ensure input was fully consumed
    if (atyp === RECORD_FIELDS) {
        const keyCount = objKeys!.length;
        if (keyCount > 0 && (ipos !== -1 >>> (32 - keyCount))) return false;
    }
    else /* STRING_CHARS | LIST_ELEMENTS */ {
        if (ipos !== ilen) return false;
    }
    IPOS += 1;
    return true;
}




// Used internally by the VM
const _internalBuffer = Buffer.alloc(2 ** 16); // TODO: now 64K - how big to make this? What if it's ever too small?
