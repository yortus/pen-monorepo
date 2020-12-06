export function assert(x: unknown): asserts x {
    if (x) return;
    throw new Error(`Assertion failed`);
}
