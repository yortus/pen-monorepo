type PenVal = Rule | Func | Module;
interface Rule {
    (): boolean; // rule
    infer: () => true;
    constant?: unknown; // compile-time constant
}
interface Func {
    (arg: PenVal): PenVal; // function
    constant?: unknown; // compile-time constant
}
interface Module {
    (name: string): PenVal | undefined; // module
    constant?: unknown; // compile-time constant
}
function isRule(_x: PenVal): _x is Rule {
    return true; // TODO: implement runtime check
}
function isFunc(_x: PenVal): _x is Func {
    return true; // TODO: implement runtime check
}
function isModule(_x: PenVal): _x is Module {
    return true; // TODO: implement runtime check
}
function createRule(mode: 'parse' | 'print', impls: RuleImpls): Rule {
    if (!impls[mode]) throw new Error(`${mode} object is missing`);
    if (!impls[mode].full) throw new Error(`${mode}.full function is missing`);
    if (!impls[mode].infer) throw new Error(`${mode}.infer function is missing`);
    const {full, infer} = impls[mode];
    const result: Rule = Object.assign(full, {infer});
    if (impls.hasOwnProperty('constant')) result.constant = impls.constant;
    return result;
}
interface RuleImpls {
    parse: {
        full: () => boolean;
        infer: () => true;
    };
    print: {
        full: () => boolean;
        infer: () => true;
    };
    constant?: unknown;
}



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

// Used internally by the VM
const internalBuffer = Buffer.alloc(2 ** 16); // TODO: now 64K - how big to make this? What if it's ever too small?




// Top-level parse/print functions - these set up the VM for each parse/print run
// TODO: doc: expects buf to be utf8 encoded
function parse(startRule: Rule, stringOrBuffer: string | Buffer) {
    IREP = Buffer.isBuffer(stringOrBuffer) ? stringOrBuffer : Buffer.from(stringOrBuffer, 'utf8');
    IPOS = 0;
    OREP = [];
    OPOS = 0;
    if (!parseValue(startRule)) throw new Error('parse failed');
    if (IPOS !== IREP.length) throw new Error('parse didn\\\'t consume entire input');
    if (OPOS !== 1) throw new Error('parse didn\\\'t produce a singular value');
    return OREP[0];
}
function print(startRule: Rule, value: unknown): string;
function print(startRule: Rule, value: unknown, buffer: Buffer): number;
function print(startRule: Rule, value: unknown, buffer?: Buffer) {
    IREP = [value];
    IPOS = 0;
    const buf = OREP = buffer ?? Buffer.alloc(2 ** 22); // 4MB
    OPOS = 0;
    if (!printValue(startRule)) throw new Error('print failed');
    if (OPOS > OREP.length) throw new Error('output buffer too small');
    return buffer ? OPOS : buf.toString('utf8', 0, OPOS);
}




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
            for (let i = 0; i < len; ++i) internalBuffer[i] = OREP[OPOSₒ + i] as number;
            value = internalBuffer.toString('utf8', 0, len);
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
        const len = internalBuffer.write(value, 0, undefined, 'utf8');
        IREP = internalBuffer.slice(0, len);
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

// TODO: doc... helper...
function assert(value: unknown, message?: string): asserts value {
    if (!value) throw new Error(`Assertion failed: ${message ?? 'no further details'}`);
}

function isObject(value: unknown): value is Record<string, unknown> {
    return value !== null && typeof value === 'object';
}

function lazy(init: () => (arg: unknown) => unknown) {
    let f: (arg: unknown) => unknown;
    return Object.assign(
        function LAZ(arg: unknown) {
            try {
                return f(arg);
            }
            catch (err) {
                if (!(err instanceof TypeError) || !err.message.includes('f is not a function')) throw err;
                f = init();
                return f(arg);
            }
        },
        {
            infer(arg: unknown) {
                try {
                    return (f as any).infer(arg);
                }
                catch (err) {
                    // TODO: restore??? if (!(err instanceof TypeError) || !err.message.includes('is not a function')) throw err;
                    f = init();
                    return (f as any).infer(arg);
                }
            }
        }
    );
}
