// TODO: ...
type StaticForm = (options: StaticOptions) => PenVal;
interface StaticOptions {
    inForm: 'txt' | 'ast' | 'nil';
    outForm: 'txt' | 'ast' | 'nil';
}






interface PenVal {
    // module
    bindings?: Record<string, PenVal>;

    // rule
    rule?(): boolean;

    // lambda
    lambda?(arg: PenVal): PenVal;

    // compile-time constant
    constant?: {value: unknown};
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
