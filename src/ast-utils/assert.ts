export function assert(x: unknown): asserts x {
    if (!x) throw new Error(`Assertion failed`);
}
