type PenVal = Rule | Func | Module;
interface Rule {
    (): boolean; // rule
    infer: () => void;
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
        infer: () => void;
    };
    print: {
        full: () => boolean;
        infer: () => void;
    };
    constant?: unknown;
}



// TODO: next:
// [ ] get rid of arrayish? Or use it more?
// [ ] parseValue writes to VALUE, printValue reads from VALUE
// [ ] restore LEN/CAP (capacity) checking
// [ ]   printValue for STRING_CHARS always slices a new Buffer, could just set LEN/CAP instead if it was respected/checked everywhere


interface Arrayish<T> {
    [n: number]: T;
    length: number;
    slice(start?: number, end?: number): Arrayish<T>;
}






// VM REGISTERS - callee updates/restores
let AREP: Arrayish<unknown>;
let APOS: number = 0;
let ATYP: ATYP = 0; // NB: Parsers _must_ logical-OR this when returning true. Parsers _must not_ change this when returning false.
                    // NB: Printers _may_ check/validate this on entry. Printers _must_ return with the same value in ATYP.

let CREP: Buffer = Buffer.alloc(1); //Arrayish<string>; // TODO: not working yet - changing back to `string` works for now
let CPOS: number = 0;

type ATYP = typeof NOTHING | typeof SCALAR | typeof STRING_CHARS | typeof LIST_ELEMENTS | typeof RECORD_FIELDS;
const [NOTHING, SCALAR, STRING_CHARS, LIST_ELEMENTS, RECORD_FIELDS] = [0, 1, 2, 4, 8] as const;



// Used internally by the VM
const internalBuffer = Buffer.alloc(2 ** 16); // TODO: now 64K - how big to make this? What if it's ever too small?




// Top-level parse/print functions - these set up the VM for each parse/print run
// TODO: doc: expects buf to be utf8 encoded
function parse(startRule: Rule, stringOrBuffer: string | Buffer) {
    CREP = Buffer.isBuffer(stringOrBuffer) ? stringOrBuffer : Buffer.from(stringOrBuffer, 'utf8');
    CPOS = 0;
    AREP = [];
    APOS = 0;
    if (!parseValue(startRule)) throw new Error('parse failed');
    if (CPOS !== CREP.length) throw new Error('parse didn\\\'t consume entire input');
    if (APOS !== 1) throw new Error('parse didn\\\'t produce a singular value');
    return AREP[0];
}
function print(startRule: Rule, value: unknown, buffer?: Buffer) {
    AREP = [value]; // TODO: we must use a new AREP array per print call, otherwise the MEMO rule has invalid cached memos across print calls. Fix!!
    APOS = 0;
    CREP = buffer || Buffer.alloc(2 ** 22); // 4MB
    CPOS = 0;
    if (!printValue(startRule)) throw new Error('print failed');
    if (CPOS > CREP.length) throw new Error('output buffer too small');
    return buffer ? CPOS : CREP.toString('utf8', 0, CPOS);
}




// These are only used in parsing, not printing
function emitScalar(value: number | boolean | null) {
    AREP[APOS++] = value;
    ATYP |= SCALAR;
}
function emitByte(value: number) {
    AREP[APOS++] = value;
    ATYP |= STRING_CHARS;
}
function emitBytes(...values: number[]) {
    for (let i = 0; i < values.length; ++i) AREP[APOS++] = values[i];
    ATYP |= STRING_CHARS;
}


// NB: for successful calls: APOS is incremented, AREP[APOS-1] contains the new value, ATYP is unchanged
function parseValue(rule: Rule): boolean {
    const APOSₒ = APOS, ATYPₒ = ATYP;
    ATYP = NOTHING;
    if (!rule()) return ATYP = ATYPₒ, false;
    if (ATYP === NOTHING) return APOS = APOSₒ, ATYP = ATYPₒ, false;

    let value: unknown;
    switch (ATYP) {
        case SCALAR:
            assert(APOS === APOSₒ + 1);
            value = AREP[APOSₒ];
            break;
        case STRING_CHARS:
            const len = APOS - APOSₒ;
            for (let i = 0; i < len; ++i) internalBuffer[i] = AREP[APOSₒ + i] as number;
            value = internalBuffer.toString('utf8', 0, len);
            break;
        case LIST_ELEMENTS:
            value = AREP.slice(APOSₒ, APOS);
            break;
        case RECORD_FIELDS:
            const obj = value = {} as Record<string, unknown>;
            for (let i = APOSₒ; i < APOS; i += 2) obj[AREP[i] as string] = AREP[i + 1];
            if (Object.keys(obj).length * 2 < (APOS - APOSₒ)) throw new Error(`Duplicate labels in record`);
            break;
        default:
            // Ensure all cases have been handled, both at compile time and at runtime.
            ((atyp: never): never => { throw new Error(`Unhandled abstract type ${atyp}`); })(ATYP);
    }
    AREP[APOSₒ] = value;
    APOS = APOSₒ + 1;
    ATYP = ATYPₒ;
    return true;
}
function parseInferValue(infer: () => void): void {
    const APOSₒ = APOS, ATYPₒ = ATYP;
    ATYP = NOTHING;
    infer();
    if (ATYP === NOTHING) return APOS = APOSₒ, ATYP = ATYPₒ, undefined;

    let value: unknown;
    switch (ATYP) {
        case SCALAR:
            assert(APOS === APOSₒ + 1);
            value = AREP[APOSₒ];
            break;
        case STRING_CHARS:
            const len = APOS - APOSₒ;
            for (let i = 0; i < len; ++i) internalBuffer[i] = AREP[APOSₒ + i] as number;
            value = internalBuffer.toString('utf8', 0, len);
            break;
        case LIST_ELEMENTS:
            value = AREP.slice(APOSₒ, APOS);
            break;
        case RECORD_FIELDS:
            const obj = value = {} as Record<string, unknown>;
            for (let i = APOSₒ; i < APOS; i += 2) obj[AREP[i] as string] = AREP[i + 1];
            break;
        default:
            // Ensure all cases have been handled, both at compile time and at runtime.
            ((atyp: never): never => { throw new Error(`Unhandled abstract type ${atyp}`); })(ATYP);
    }
    AREP[APOSₒ] = value;
    APOS = APOSₒ + 1;
    ATYP = ATYPₒ;
}

// NB: for successful calls: APOS is incremented, AREP is unchanged, ATYP is unchanged
function printValue(rule: Rule): boolean {
    const APOSₒ = APOS, AREPₒ = AREP, ATYPₒ = ATYP;
    let value = AREP[APOS];
    let atyp: ATYP;

    // Nothing case
    if (value === undefined) {
        return false;
    }

    // Scalar case
    if (value === null || value === true || value === false || typeof value === 'number') {
        ATYP = SCALAR;
        const result = rule();
        ATYP = ATYPₒ;
        assert(APOS === APOSₒ + 1);
        return result;
    }

    // Aggregate cases
    if (typeof value === 'string') {
        AREP = internalBuffer.slice(0, internalBuffer.write(value, 0));
        atyp = ATYP = STRING_CHARS;
    }
    else if (Array.isArray(value)) {
        AREP = value;
        atyp = ATYP = LIST_ELEMENTS;
    }
    else if (typeof value === 'object') {
        const arr = AREP = [] as unknown[];        
        const keys = Object.keys(value!); // TODO: doc reliance on prop order and what this means
        assert(keys.length < 32); // TODO: document this limit, move to constant, consider how to remove it
        for (let i = 0; i < keys.length; ++i) arr.push(keys[i], (value as any)[keys[i]]);
        value = arr;
        atyp = ATYP = RECORD_FIELDS;
    }
    else {
        throw new Error(`Unsupported value type for value ${value}`);
    }

    // Do the thing
    APOS = 0;
    let result = rule();

    // Restore AREP/APOS/ATYP
    const arep = AREP, apos = APOS;
    AREP = AREPₒ, APOS = APOSₒ, ATYP = ATYPₒ;
    if (!result) return false;

    // Ensure input was fully consumed
    if (atyp === RECORD_FIELDS) {
        const keyCount = (value as any).length >> 1;
        if (keyCount > 0 && (apos !== -1 >>> (32 - keyCount))) return false;
    }
    else /* STRING_CHARS | LIST_ELEMENTS */ {
        if (apos !== arep.length) return false;
    }
    APOS += 1;
    return true;
}

function printInferValue(infer: () => void): void {
    const ATYPₒ = ATYP;
    ATYP = NOTHING;
    infer();
    ATYP = ATYPₒ;
}


// TODO: doc... helper...
function assert(value: unknown): asserts value {
    if (!value) throw new Error(`Assertion failed`);
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
