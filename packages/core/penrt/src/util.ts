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
// [ ] OCTETS is only used for parsing, and never changes (const array instance)
//     - well almost.... print uses it internally to buffer chars but exposes only through AREP - see L#187 in printValue
//     - print could have it's own private buffer instance for that purpose (ie not part of VM's exposed api)
// [ ] VALUES is only used for parsing, and never changes (const array instance)
// [ ] AREP is only used for printing, and changes as various AST nodes are read
// ======= ideas for above =======
// - use OCTETS in print as an exposed thing, same as for parse. Then can remove Arrayish interface
// - rename VALUES to OUTVALS? SINK? PARSE_VALUES
// - rename AREP to INVALS? SOURCE? PRINT_VALUES
// - rename CREP to ???
// - rename OCTETS to ???

// [ ] parseValue writes to VALUE, printValue reads from VALUE
// [ ] ATYP handling?
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
let ATYP: ATYP = 0; // NB: Parsers _must_ set this when returning true. Parsers _may_ restore this when returning false.
                    // NB: Printers _may_ check/validate this on entry. Printers _must_ return with the same value in ATYP.

let CREP: Buffer = Buffer.alloc(1); //Arrayish<string>; // TODO: not working yet - changing back to `string` works for now
let CPOS: number = 0;

type ATYP = typeof NOTHING | typeof SCALAR | typeof STRING_CHARS | typeof LIST_ELEMENTS | typeof RECORD_FIELDS;
const [NOTHING, SCALAR, STRING_CHARS, LIST_ELEMENTS, RECORD_FIELDS] = [0, 1, 2, 4, 8] as const;




// TODO: temp testing...
// OCTETS: Buffer
// VALUES: unknown[]
// LABELS: string[], or alternatively:
// FIELDS: Array<[string, unknown]>
const OCTETS = Buffer.alloc(2 ** 16); // TODO: now 64K - how big to make this? What if it's ever too small?
const VALUES: unknown[] = [];




// These are only used in parsing, not printing
function emitScalar(value: number | boolean | null) {
    VALUES[APOS++] = value;
    ATYP = SCALAR;
}
function emitByte(value: number) {
    OCTETS[APOS++] = value;
    ATYP = STRING_CHARS;
}
function emitBytes(...values: number[]) {
    for (let i = 0; i < values.length; ++i) OCTETS[APOS++] = values[i];
    ATYP = STRING_CHARS;
}


function parseValue(rule: Rule): boolean {
    const APOSₒ = APOS;
    if (!rule()) return APOS = APOSₒ, false;
    if (ATYP === NOTHING) return APOS = APOSₒ, false;

    let value: unknown;
    switch (ATYP) {
        case SCALAR:
            assert(APOS === APOSₒ + 1);
            value = VALUES[APOSₒ];
            break;
        case STRING_CHARS:
            value = OCTETS.toString('utf8', APOSₒ, APOS);
            break;
        case LIST_ELEMENTS:
            value = VALUES.slice(APOSₒ, APOS);
            break;
        case RECORD_FIELDS:
            const obj = value = {} as Record<string, unknown>;
            for (let i = APOSₒ; i < APOS; i += 2) obj[VALUES[i] as string] = VALUES[i + 1];
            if (Object.keys(obj).length * 2 < (APOS - APOSₒ)) throw new Error(`Duplicate labels in record`);
            break;
        default:
            // Ensure all cases have been handled, both at compile time and at runtime.
            ((atyp: never): never => { throw new Error(`Unhandled abstract type ${atyp}`); })(ATYP);
    }
    VALUES[APOSₒ] = value;
    APOS = APOSₒ + 1;
    return true;
}
function parseInferValue(infer: () => void): void {
    const APOSₒ = APOS;
    infer();
    if (ATYP === NOTHING) return;

    let value: unknown;
    switch (ATYP) {
        case SCALAR:
            assert(APOS === APOSₒ + 1);
            value = VALUES[APOSₒ];
            break;
        case STRING_CHARS:
            value = OCTETS.toString('utf8', APOSₒ, APOS);
            break;
        case LIST_ELEMENTS:
            value = VALUES.slice(APOSₒ, APOS);
            break;
        case RECORD_FIELDS:
            const obj = value = {} as Record<string, unknown>;
            for (let i = APOSₒ; i < APOS; i += 2) obj[VALUES[i] as string] = VALUES[i + 1];
            break;
        default:
            // Ensure all cases have been handled, both at compile time and at runtime.
            ((atyp: never): never => { throw new Error(`Unhandled abstract type ${atyp}`); })(ATYP);
    }
    VALUES[APOSₒ] = value;
    APOS = APOSₒ + 1;
}

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
        AREP = OCTETS.slice(0, OCTETS.write(value, 0));
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
