declare const sys: {
    assert: (value: unknown) => asserts value;
    isFullyConsumed: (node: unknown, pos: number) => boolean;
    isPlainObject: (value: unknown) => value is Record<string, unknown>;
    matchesAt: (text: string, substr: string, position: number) => boolean;
};
