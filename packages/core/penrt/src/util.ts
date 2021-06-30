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
    default: Rule;
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
    if (!impls.parse) throw new Error(`parse method is missing`);
    if (!impls.parseDefault) throw new Error(`parseDefault method is missing`);
    if (!impls.print) throw new Error(`print method is missing`);
    if (!impls.printDefault) throw new Error(`printDefault method is missing`);
    const impl = mode === 'parse' ? impls.parse : impls.print === 'parse' ? impls.parse : impls.print;
    let dflt = mode === 'parse' ? impls.parseDefault : impls.printDefault;
    if (dflt === 'print') dflt = impls.print;
    if (dflt === 'parse') dflt = impls.parse;
    return Object.assign(impl, {default: Object.assign(dflt as any, {default: dflt})});
}
interface RuleImpls {
    parse: () => boolean;
    parseDefault: (() => boolean) | 'parse';
    print: (() => boolean) | 'parse';
    printDefault: (() => boolean) | 'parse' | 'print';
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






// TODO: NEW VM (WIP):
let AREP: Arrayish<unknown>;
let APOS: number;
let ATYP: ATYP;

let CREP: Buffer; //Arrayish<string>; // TODO: not working yet - changing back to `string` works for now
let CPOS: number;

type ATYP = typeof NOTHING | typeof SCALAR | typeof STRING | typeof LIST | typeof RECORD;
const [NOTHING, SCALAR, STRING, LIST, RECORD] = [0, 1, 2, 4, 8] as const;

const savepoint = (): [APOS: number, CPOS: number] => [APOS, CPOS];
const backtrack = (APOSₒ: number, CPOSₒ: number, ATYPₒ?: ATYP): false => (APOS = APOSₒ, CPOS = CPOSₒ, ATYP = ATYPₒ ?? NOTHING, false);

// TODO: temp testing...
const theScalarArray: unknown[] = [];
const theBuffer = Buffer.alloc(2 ** 10); // TODO: how big to make this? What if it's ever too small?
function emitScalar(value: number | boolean | null) {
    if (APOS === 0) AREP = theScalarArray;
    AREP[APOS++] = value;
    ATYP = SCALAR;
}
function emitByte(value: number) {
    if (APOS === 0) AREP = theBuffer;
    AREP[APOS++] = value;
    ATYP = STRING;
}
function emitBytes(...values: number[]) {
    if (APOS === 0) AREP = theBuffer;
    for (let i = 0; i < values.length; ++i) AREP[APOS++] = values[i];
    ATYP = STRING;
}


function parseInner(rule: Rule, mustProduce: boolean): boolean {
    const [AREPₒ, APOSₒ] = [AREP, APOS];
    AREP = undefined as any; // TODO: fix cast
    APOS = 0;
    if (!rule()) return AREP = AREPₒ, APOS = APOSₒ, false;
    if (ATYP === NOTHING) return AREP = AREPₒ, APOS = APOSₒ, mustProduce;

    let value: unknown;
    switch (ATYP) {
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
            ((atyp: never): never => { throw new Error(`Unhandled abstract type ${atyp}`); })(ATYP);
    }
    AREPₒ[APOSₒ] = value;
    AREP = AREPₒ;
    APOS = APOSₒ + 1;
    return true;
}

function printInner(rule: Rule, mustConsume: boolean): boolean {
    const [AREPₒ, APOSₒ, ATYPₒ] = [AREP, APOS, ATYP];
    let value = AREP[APOS];
    let atyp: ATYP;

    // Nothing case
    if (value === undefined) {
        if (mustConsume) return false;
        ATYP = NOTHING;
        const result = rule();
        ATYP = ATYPₒ;
        assert(APOS === APOSₒ);
        return result;
    }

    // Scalar case
    if (value === null || value === true || value === false || typeof value === 'number') {
        ATYP = SCALAR;
        const result = rule();
        ATYP = ATYPₒ;
        assert(APOS - APOSₒ === 1);
        return result;
    }

    // Aggregate cases
    if (typeof value === 'string') {
        AREP = theBuffer.slice(0, theBuffer.write(value, 0));
        atyp = ATYP = STRING;
    }
    else if (Array.isArray(value)) {
        AREP = value;
        atyp = ATYP = LIST;
    }
    else if (typeof value === 'object') {
        const arr = AREP = [] as unknown[];        
        const keys = Object.keys(value!); // TODO: doc reliance on prop order and what this means
        assert(keys.length < 32); // TODO: document this limit, move to constant, consider how to remove it
        for (let i = 0; i < keys.length; ++i) arr.push(keys[i], (value as any)[keys[i]]);
        value = arr;
        atyp = ATYP = RECORD;
    }
    else {
        throw new Error(`Unsupported value type for value ${value}`);
    }

    // Do the thing
    APOS = 0;
    let result = rule();

    // Restore AREP/APOS/ATYP
    const [arep, apos] = [AREP, APOS];
    AREP = AREPₒ, APOS = APOSₒ, ATYP = ATYPₒ;
    if (!result) return false;

    // Ensure input was fully consumed
    if (atyp === RECORD) {
        const keyCount = (value as any).length >> 1;
        if (keyCount > 0 && (apos !== -1 >>> (32 - keyCount))) return false;
    }
    else /* STRING | LIST */ {
        if (apos !== arep.length) return false;
    }
    APOS += 1;
    return true;
}

function printDefaultInner(rule: Rule): boolean {
    const ATYPₒ = ATYP;
    ATYP = NOTHING;
    const result = rule();
    ATYP = ATYPₒ;
    return result;
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
            default(arg: unknown) {
                try {
                    return (f as any).default(arg);
                }
                catch (err) {
                    // TODO: restore??? if (!(err instanceof TypeError) || !err.message.includes('is not a function')) throw err;
                    f = init();
                    return (f as any).default(arg);
                }
            }
        }
    );
}
