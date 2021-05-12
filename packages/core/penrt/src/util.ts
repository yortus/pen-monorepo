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




type PenVal = Rule | Generic | Module;
interface Rule {
    (): boolean; // rule
    constant?: {value: unknown}; // compile-time constant
}
interface Generic {
    (arg: PenVal): PenVal; // generic
    constant?: {value: unknown}; // compile-time constant
}
interface Module {
    (name: string): PenVal | undefined; // module
    constant?: {value: unknown}; // compile-time constant
}
function isRule(_x: PenVal): _x is Rule {
    return true; // TODO: implement runtime check
}
function isGeneric(_x: PenVal): _x is Generic {
    return true; // TODO: implement runtime check
}
function isModule(_x: PenVal): _x is Module {
    return true; // TODO: implement runtime check
}




// TODO: new 'registers'... temp testing...
let IN: unknown;
let IP: number;
let OUT: unknown;

// TODO: temp testing new...
let HAS_IN: boolean; // Flag: is there input?
let HAS_OUT: boolean; // Flag: is there output?


function getState() {
    return {IN, IP};
}


function setState(state: {IN: unknown, IP: number}) {
    IN = state.IN;
    IP = state.IP;
}


// TODO: doc... helper...
function assert(value: unknown): asserts value {
    if (!value) throw new Error(`Assertion failed`);
}


// TODO: doc... helper...
// TODO: provide faster impl for known cases - eg when unparsing to text, don't need array/object handling
//       (but instrument first)
function concat(a: any, b: any): unknown {
    if (a === undefined) return b;
    if (b === undefined) return a;
    // TODO: if program is statically proven valid, the following guard isn't necessary
    if (typeof a !== 'string' || typeof b !== 'string') throw new Error(`Internal error: invalid sequence`);
    return a + b;
}


// TODO: doc... helper...
function isInputFullyConsumed(): boolean {
    const type = objectToString.call(IN);
    if (type === '[object String]') return IP === (IN as any).length;
    if (type === '[object Array]') return IP === (IN as any).length;
    if (type === '[object Object]') {
        const keyCount = Object.keys(IN as any).length;
        assert(keyCount <= 32); // TODO: document this limit, move to constant, consider how to remove it
        if (keyCount === 0) return true;
        return IP === -1 >>> (32 - keyCount);
    }
    return IP === 1; // TODO: doc which case(s) this covers. Better to just return false?
}

const objectToString = Object.prototype.toString;









// TODO: NEW VM (WIP):
let AREP: Array<unknown>;
let APOS: number;
let ATYP: ATYP;

let CREP: string;
let CPOS: number;

type ATYP = typeof NOTHING | typeof SCALAR | typeof STRING | typeof LIST | typeof RECORD;
const [NOTHING, SCALAR, STRING, LIST, RECORD] = [1, 2, 3, 4, 5] as const;

const savepoint = (): [APOS: number, CPOS: number] => [APOS, CPOS];
const backtrack = (APOSₒ: number, CPOSₒ: number): false => (APOS = APOSₒ, CPOS = CPOSₒ, false);

function parseInner(rule: Rule, mustProduce: boolean): boolean {
    const APOSₒ = APOS;
    if (!rule()) return false;
    switch (ATYP) {
        case NOTHING:
            assert(mustProduce === false);
            return true;
        case SCALAR:
            assert(APOS - APOSₒ === 1);
            return true;
        case STRING:
            if (APOS - APOSₒ > 1) {
                const str = AREP.slice(APOSₒ).join('');
                AREP[APOSₒ] = str;
                APOS = APOSₒ + 1;
            }
            return true;
        case LIST:
            const lst = AREP.slice(APOSₒ);
            AREP[APOSₒ] = lst;
            APOS = APOSₒ + 1;
            return true;
        case RECORD:
            const rec = Object.fromEntries((AREP as Array<[string, unknown]>).slice(APOSₒ));
            AREP[APOSₒ] = rec;
            APOS = APOSₒ + 1;
            return true;
        default:
            // Ensure all cases have been handled, both at compile time and at runtime.
            ((atyp: never): never => { throw new Error(`Unhandled abstract type ${atyp}`); })(ATYP);
    }
}

function printInner(rule: Rule): boolean {
    // TODO: need to handle NOTHING case / mustConsume === false?

    // Scalar case
    const [AREPₒ, APOSₒ] = [AREP, APOS];
    let value = AREP[APOS];
    let atyp: ATYP;
    if (value === null || value === true || value === false || typeof value === 'number') {
        ATYP = SCALAR;
        const result = rule();
        assert(APOS - APOSₒ === 1);
        return result;
    }

    // Aggregate cases
    if (typeof value === 'string') {
        AREP = value as any; // TODO: fix cast by having a type with common features of string and Array<unknown>
        atyp = ATYP = STRING;
    }
    else if (Array.isArray(value)) {
        AREP = value;
        atyp = ATYP = LIST;
    }
    else if (typeof value === 'object') {
        AREP = value = [...Object.entries(value!)]; // TODO: doc reliance on prop order and what this means
        assert(AREP.length <= 32); // TODO: document this limit, move to constant, consider how to remove it
        atyp = ATYP = RECORD;
    }
    else {
        throw new Error(`Unsupported value type for value ${value}`);
    }

    // Do the thing
    APOS = 0;
    let result = rule();

    // Restore AREP/APOS
    const apos = APOS;
    AREP = AREPₒ;
    APOS = APOSₒ;
    if (!result) return false;

    // Ensure input was fully consumed
    if (atyp === RECORD) {
        const keyCount = (value as any).length;
        if (keyCount > 0 && (apos !== -1 >>> (32 - keyCount))) return false;
    }
    else /* STRING | LIST */ {
        if (apos !== (value as any).length) return false;
    }
    APOS += 1;
    return true;
}
