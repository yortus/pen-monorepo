// tslint:disable: no-bitwise
// TODO: modes...
type Mode = 2 | 3 | 4 | 5 | 6 | 7;
const PARSE = 6;
const PRINT = 7;
const COVAL = 4;
const COGEN = 5;
const ABGEN = 2;
const ABVAL = 3;
const isParse = (mode: Mode) => (mode & 1) === 0;
const isPrint = (mode: Mode) => (mode & 1) !== 0;
const hasConcreteForm = (mode: Mode) => (mode & 4) !== 0;
const hasAbstractForm = (mode: Mode) => (mode & 2) !== 0;
const hasInput = (mode: Mode) => isParse(mode) ? hasConcreteForm(mode) : hasAbstractForm(mode);
const hasOutput = (mode: Mode) => isParse(mode) ? hasAbstractForm(mode) : hasConcreteForm(mode);
interface StaticOptions {mode: Mode; }




type PenVal = Rule | Lambda | Module;
interface Rule {
    (): boolean; // rule
    constant?: {value: unknown}; // compile-time constant
}
interface Lambda {
    (arg: PenVal): PenVal; // lambda
    constant?: {value: unknown}; // compile-time constant
}
interface Module {
    (name: string): PenVal | undefined; // module
    constant?: {value: unknown}; // compile-time constant
}
function isRule(_x: PenVal): _x is Rule {
    return true; // TODO: implement runtime check
}
function isLambda(_x: PenVal): _x is Lambda {
    return true; // TODO: implement runtime check
}
function isModule(_x: PenVal): _x is Module {
    return true; // TODO: implement runtime check
}




// TODO: new 'registers'... temp testing...
let IN: unknown;
let IP: number;
let OUT: unknown;


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
    if (typeof a === 'string' && typeof b === 'string') return a + b;
    // TODO: if program is statically proven valid, the following check isn't necessary
    // if (typeof a !== 'object' || typeof b !== 'object') throw new Error(`Internal error: invalid sequence`);
    if (Array.isArray(a) && Array.isArray(b)) return [...a, ...b];
    return {...a, ...b};
}


// TODO: doc... helper...
function isInputFullyConsumed(): boolean {
    if (typeof IN === 'string') return IP === IN.length;
    if (Array.isArray(IN)) return IP === IN.length;
    if (typeof IN === 'object' && IN !== null) {
        let keyCount = Object.keys(IN).length;
        assert(keyCount <= 32); // TODO: document this limit, move to constant, consider how to remove it
        if (keyCount === 0) return true;
        // tslint:disable-next-line: no-bitwise
        return IP === -1 >>> (32 - keyCount);
    }
    return IP === 1; // TODO: doc which case(s) this covers. Better to just return false?
}


// TODO: doc... helper...
function isPlainObject(value: unknown): value is Record<string, unknown> {
    return value !== null && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype;
}
