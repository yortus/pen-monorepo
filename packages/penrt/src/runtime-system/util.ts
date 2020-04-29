interface PenVal {
    // module
    bindings: Record<string, PenVal>;

    // rule
    parse(): boolean;
    unparse(): boolean;

    // lambda
    apply(arg: PenVal): PenVal;

    // compile-time constant
    constant?: {value: unknown};
}


// TODO: new 'registers'... temp testing...
interface Registers {IDOC: unknown; IMEM: number; ODOC: unknown; INUL: boolean; ONUL: boolean; }
let IDOC: unknown;
let IMEM: number;
let ODOC: unknown;
let INUL = false;
let ONUL = false;


function getState(): Registers {
    return {IDOC, IMEM, ODOC, INUL, ONUL};
}


function setState(value: Registers): void {
    ({IDOC, IMEM, ODOC, INUL, ONUL} = value);
}


function setInState(IDOCᐟ: unknown, IMEMᐟ: number): void {
    IDOC = IDOCᐟ;
    IMEM = IMEMᐟ;
}


// TODO: doc... helper...
function assert(value: unknown): asserts value {
    if (!value) throw new Error(`Assertion failed`);
}


// TODO: doc... helper...
// TODO: provide faster impl for known cases - eg when unparsing to text, don't need array/object handling (but instrument first)
function concat(a: unknown, b: unknown): unknown {
    if (a === undefined) return b;
    if (b === undefined) return a;
    if (typeof a === 'string' && typeof b === 'string') return a + b;
    if (Array.isArray(a) && Array.isArray(b)) return [...a, ...b];
    if (isPlainObject(a) && isPlainObject(b)) return {...a, ...b};
    throw new Error(`Internal error: invalid sequence`);
}


// TODO: doc... helper...
function isFullyConsumed(node: unknown, pos: number): boolean {
    if (typeof node === 'string') return pos === node.length;
    if (Array.isArray(node)) return pos === node.length;
    if (isPlainObject(node)) {
        let keyCount = Object.keys(node).length;
        assert(keyCount <= 32); // TODO: document this limit, move to constant, consider how to remove it
        if (keyCount === 0) return true;
        // tslint:disable-next-line: no-bitwise
        return pos === -1 >>> (32 - keyCount);
    }
    return pos === 1; // TODO: doc which case(s) this covers. Better to just return false?
}


// TODO: doc... helper...
function isPlainObject(value: unknown): value is Record<string, unknown> {
    return value !== null && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype;
}


// TODO: doc... helper...
// TODO: provide faster impl for known cases - eg when checking IDOC during text parsing, or ODOC during text unparsing (but instrument first)
function isString(value: unknown): value is string {
    return typeof value === 'string';
}


// TODO: doc... helper...
function matchesAt(text: string, substr: string, position: number): boolean {
    let lastPos = position + substr.length;
    if (lastPos > text.length) return false;
    for (let i = position, j = 0; i < lastPos; ++i, ++j) {
        if (text.charAt(i) !== substr.charAt(j)) return false;
    }
    return true;
}


// TODO: doc... helpers...
function NOT_A_LAMBDA(): never { throw new Error('Not a lambda'); };
function NOT_A_RULE(): never { throw new Error('Not a rule'); };
