// TODO: modes...
// type Mode = 2 | 3 | 4 | 5 | 6 | 7;
// const PARSE = 6;
// const PRINT = 7;
// const COVAL = 4;
// const COGEN = 5;
// const ABGEN = 2;
// const ABVAL = 3;
// const isParse = (mode: Mode) => (mode & 1) === 0;
// const isPrint = (mode: Mode) => (mode & 1) !== 0;
// const hasConcreteForm = (mode: Mode) => (mode & 4) !== 0;
// const hasAbstractForm = (mode: Mode) => (mode & 2) !== 0;
// const hasInput = (mode: Mode) => isParse(mode) ? hasConcreteForm(mode) : hasAbstractForm(mode);
// const hasOutput = (mode: Mode) => isParse(mode) ? hasAbstractForm(mode) : hasConcreteForm(mode);
interface StaticOptions {mode: 'parse' | 'print'; }




type PenVal = Rule | Func | Module;
interface Rule {
    (): boolean; // rule
    infer: () => void;
    constant?: {value: unknown}; // compile-time constant
}
interface Func {
    (arg: PenVal): PenVal; // function
    constant?: {value: unknown}; // compile-time constant
}
interface Module {
    (name: string): PenVal | undefined; // module
    constant?: {value: unknown}; // compile-time constant
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
    if (!impls[mode].full) throw new Error(`${mode}._ function is missing`);
    if (!impls[mode].infer) throw new Error(`${mode}.infer function is missing`);
    const {full, infer} = impls[mode];
    return Object.assign(full, {infer});
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
}



// TODO: next:
// [ ] 5. A/C --> I/O (leave ATYP for now)
// [ ] 6. ATYP handling?
// [ ] 7. restore LEN/CAP (capacity) checking
// [ ]    a. eg printInner for STRING always slices a new Buffer, could just set LEN/CAP instead if it was respected/checked everywhere


interface Arrayish<T> {
    [n: number]: T;
    length: number;
    slice(start?: number, end?: number): Arrayish<T>;
}






// VM REGISTERS - callee updates/restores
let AREP: Arrayish<unknown> = [];
let APOS: number = 0;
let AW: ATYP = 0; // NB: Parsers _must_ set this when returning true. Parsers _may_ restore this when returning false.
let AR: ATYP = 0; // NB: Printers _may_ check/validate this on entry. Printers _must_ return with the same value in AR.

let CREP: Buffer = Buffer.alloc(1); //Arrayish<string>; // TODO: not working yet - changing back to `string` works for now
let CPOS: number = 0;

type ATYP = typeof NOTHING | typeof SCALAR | typeof STRING | typeof LIST | typeof RECORD;
const [NOTHING, SCALAR, STRING, LIST, RECORD] = [0, 1, 2, 4, 8] as const;

// TODO: temp testing...
const theScalarArray: unknown[] = [];
const theBuffer = Buffer.alloc(2 ** 10); // TODO: how big to make this? What if it's ever too small?
function emitScalar(value: number | boolean | null) {
    if (APOS === 0) AREP = theScalarArray;
    AREP[APOS++] = value;
    AW = SCALAR;
}
function emitByte(value: number) {
    if (APOS === 0) AREP = theBuffer;
    AREP[APOS++] = value;
    AW = STRING;
}
function emitBytes(...values: number[]) {
    if (APOS === 0) AREP = theBuffer;
    for (let i = 0; i < values.length; ++i) AREP[APOS++] = values[i];
    AW = STRING;
}


function parseInner(rule: Rule, mustProduce: boolean): boolean {
    const [AREPₒ, APOSₒ] = [AREP, APOS];
    AREP = undefined as any; // TODO: fix cast
    APOS = 0;
    if (!rule()) return AREP = AREPₒ, APOS = APOSₒ, false;
    if (AW === NOTHING) return AREP = AREPₒ, APOS = APOSₒ, !mustProduce;

    let value: unknown;
    switch (AW) {
        case SCALAR:
            assert(APOS === 1);
            value = AREP[0];
            break;
        case STRING:
            value = (AREP as Buffer).toString('utf8', 0, APOS);
            break;
        case LIST:
            if (AREP.length !== APOS) AREP.length = APOS;
            value = AREP;
            break;
        case RECORD:
            const obj = value = {} as Record<string, unknown>;
            for (let i = 0; i < APOS; i += 2) obj[AREP[i] as string] = AREP[i + 1];
            if (Object.keys(obj).length * 2 < APOS) throw new Error(`Duplicate labels in record`);
            break;
        default:
            // Ensure all cases have been handled, both at compile time and at runtime.
            ((aw: never): never => { throw new Error(`Unhandled abstract type ${aw}`); })(AW);
    }
    AREPₒ[APOSₒ] = value;
    AREP = AREPₒ;
    APOS = APOSₒ + 1;
    return true;
}
function parseInferInner(infer: () => void): void {
    const [AREPₒ, APOSₒ] = [AREP, APOS];
    AREP = undefined as any; // TODO: fix cast
    APOS = 0;
    infer();
    if (AW === NOTHING) return;

    let value: unknown;
    switch (AW) {
        case SCALAR:
            assert(APOS === 1);
            value = AREP[0];
            break;
        case STRING:
            value = (AREP as Buffer).toString('utf8', 0, APOS);
            break;
        case LIST:
            if (AREP.length !== APOS) AREP.length = APOS;
            value = AREP;
            break;
        case RECORD:
            const obj = value = {} as Record<string, unknown>;
            for (let i = 0; i < APOS; i += 2) obj[AREP[i] as string] = AREP[i + 1];
            break;
        default:
            // Ensure all cases have been handled, both at compile time and at runtime.
            ((aw: never): never => { throw new Error(`Unhandled abstract type ${aw}`); })(AW);
    }
    AREPₒ[APOSₒ] = value;
    AREP = AREPₒ;
    APOS = APOSₒ + 1;
}

function printInner(rule: Rule, mustConsume: boolean): boolean {
    const [AREPₒ, APOSₒ, ARₒ] = [AREP, APOS, AR];
    let value = AREP[APOS];
    let ar: ATYP;

    // Nothing case
    if (value === undefined) {
        if (mustConsume) return false;
        AR = NOTHING;
        const result = rule();
        AR = ARₒ;
        assert(APOS === APOSₒ);
        return result;
    }

    // Scalar case
    if (value === null || value === true || value === false || typeof value === 'number') {
        AR = SCALAR;
        const result = rule();
        AR = ARₒ;
        assert(APOS - APOSₒ === 1);
        return result;
    }

    // Aggregate cases
    if (typeof value === 'string') {
        AREP = theBuffer.slice(0, theBuffer.write(value, 0));
        ar = AR = STRING;
    }
    else if (Array.isArray(value)) {
        AREP = value;
        ar = AR = LIST;
    }
    else if (typeof value === 'object') {
        const arr = AREP = [] as unknown[];        
        const keys = Object.keys(value!); // TODO: doc reliance on prop order and what this means
        assert(keys.length < 32); // TODO: document this limit, move to constant, consider how to remove it
        for (let i = 0; i < keys.length; ++i) arr.push(keys[i], (value as any)[keys[i]]);
        value = arr;
        ar = AR = RECORD;
    }
    else {
        throw new Error(`Unsupported value type for value ${value}`);
    }

    // Do the thing
    APOS = 0;
    let result = rule();

    // Restore AREP/APOS/AR
    const [arep, apos] = [AREP, APOS];
    AREP = AREPₒ, APOS = APOSₒ, AR = ARₒ;
    if (!result) return false;

    // Ensure input was fully consumed
    if (ar === RECORD) {
        const keyCount = (value as any).length >> 1;
        if (keyCount > 0 && (apos !== -1 >>> (32 - keyCount))) return false;
    }
    else /* STRING | LIST */ {
        if (apos !== arep.length) return false;
    }
    APOS += 1;
    return true;
}

function printInferInner(infer: () => void): void {
    const ARₒ = AR;
    AR = NOTHING;
    infer();
    AR = ARₒ;
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
