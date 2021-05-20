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




// TODO: next:
// [x] 1. charAt -> charCodeAt, in prep for changing to Buffer/UInt8Array (except unicode)
// [x] 2. change CREP from string to Buffer
// [x] 3. perf profile - what are the hottest paths now where speedups would improve overall perf?
// [x]    a. no obvious low-hanging fruit
// [x]    b. most obvious 'smell': extremely deep call chains with LST and RCD. These are tail-recursive in json.pen. fn call/ret overheads dominating execution time?
// [x]    c. can we (a) identify tail-recursion in lists and records? (b) lower it to iteration in a transform?
// [ ]    d. list/record sequences still work! These are iterative instead of recursive so don't have super-deep call chains
// [ ]    e. impl json.pen using (d) and profile again
// [ ]    f. now, most time is spend in the following 2 areas:
// [ ]       i) parseInner
// [ ]          - idea: in parseInner, set AREP = undefined, APOS = 0; rule that sets ATYP also sets AREP (to an array or buffer as reqd, using AREP ??= syntax )
// [ ]          - can reuse a single buffer program-wide, since there can only be one being parsed into at a time
// [ ]       ii) the CHAR rule, specifically the first arm: `!"\\"   !"\""    ascii(min=0x20 max=0x7f)`
// [ ] 4. common 'ArrayLike' interface with []-access, length, slice (remove casts where possible)
// [ ] 5. A/C --> I/O (leave ATYP for now)
// [ ] 6. ATYP handling?
// [ ] 7. restore LEN checking


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

let HAS_IN: boolean; // Flag: is there input?
let HAS_OUT: boolean; // Flag: is there output?

type ATYP = typeof NOTHING | typeof SCALAR | typeof STRING | typeof LIST | typeof RECORD;
const [NOTHING, SCALAR, STRING, LIST, RECORD] = [0, 1, 2, 4, 8] as const;

const savepoint = (): [APOS: number, CPOS: number, ATYP: ATYP] => [APOS, CPOS, ATYP];
const backtrack = (APOSₒ: number, CPOSₒ: number, ATYPₒ?: ATYP): false => (APOS = APOSₒ, CPOS = CPOSₒ, ATYP = ATYPₒ ?? NOTHING, false);

function parseInner(rule: Rule, mustProduce: boolean): boolean {
    const APOSₒ = APOS;
    if (!rule()) return false;
    switch (ATYP) {
        case NOTHING:
            return mustProduce;
        case SCALAR:
            assert(APOS - APOSₒ === 1);
            return true;
        case STRING:
            if (APOS - APOSₒ > 1) {
                const str = (AREP as string[]).slice(APOSₒ, APOS).join(''); // TODO: use utf8 Buffer and do toString here? But how? AREP is an array, not a buffer. Could switch it to Buffer if empty and wanting to emit chars
                AREP[APOSₒ] = str;
                APOS = APOSₒ + 1;
            }
            return true;
        case LIST:
            const lst = AREP.slice(APOSₒ, APOS);
            AREP[APOSₒ] = lst;
            APOS = APOSₒ + 1;
            return true;
        case RECORD:
            const rec = Object.fromEntries((AREP as Array<[string, unknown]>).slice(APOSₒ, APOS));
            AREP[APOSₒ] = rec;
            APOS = APOSₒ + 1;
            return true;
        default:
            // Ensure all cases have been handled, both at compile time and at runtime.
            ((atyp: never): never => { throw new Error(`Unhandled abstract type ${atyp}`); })(ATYP);
    }
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

    // Restore AREP/APOS/ATYP
    const apos = APOS;
    AREP = AREPₒ, APOS = APOSₒ, ATYP = ATYPₒ;
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


// TODO: doc... helper...
function assert(value: unknown): asserts value {
    if (!value) throw new Error(`Assertion failed`);
}
