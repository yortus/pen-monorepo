interface PenVal {
    // module
    bindings: Record<string, PenVal>;

    // rule
    parse(): boolean;
    unparse(): boolean;

    // lambda
    apply(arg: PenVal): PenVal;
}


// TODO: explain... so stdlib and experiments can reference the helpers
declare const sys: {
    assert: (value: unknown) => asserts value;
    concat: (a: unknown, b: unknown) => unknown;
    getState: () => Registers;
    isFullyConsumed: (node: unknown, pos: number) => boolean;
    isPlainObject: (value: unknown) => value is Record<string, unknown>;
    isString: (value: unknown) => value is string;
    matchesAt: (text: string, substr: string, position: number) => boolean;
    NOT_A_LAMBDA: never,
    NOT_A_RULE: never,
    setInState: (IDOCᐟ: unknown, IMEMᐟ: number) => void;
    setOutState: (ODOCᐟ: unknown) => void;
    setState: (value: Registers) => void;
};
