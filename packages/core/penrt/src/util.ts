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




// Top-level parse/print functions - these set up the VM for each parse/print run
// TODO: doc: expects buf to be utf8 encoded
function parse(startRule: Rule, stringOrBuffer: string | Buffer) {
    ICONTENT = Buffer.isBuffer(stringOrBuffer) ? stringOrBuffer : Buffer.from(stringOrBuffer, 'utf8');
    IPOINTER = 0;
    OCONTENT = [];
    OPOINTER = 0;
    if (!parseValue(startRule)) throw new Error('parse failed');
    if (IPOINTER !== ICONTENT.length) throw new Error('parse didn\\\'t consume entire input');
    if (OPOINTER !== 1) throw new Error('parse didn\\\'t produce a singular value');
    return OCONTENT[0];
}
function print(startRule: Rule, value: unknown): string;
function print(startRule: Rule, value: unknown, buffer: Buffer): number;
function print(startRule: Rule, value: unknown, buffer?: Buffer) {
    ICONTENT = [value];
    IPOINTER = 0;
    const buf = OCONTENT = buffer ?? Buffer.alloc(2 ** 22); // 4MB
    OPOINTER = 0;
    if (!printValue(startRule)) throw new Error('print failed');
    if (OPOINTER > OCONTENT.length) throw new Error('output buffer too small');
    return buffer ? OPOINTER : buf.toString('utf8', 0, OPOINTER);
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
