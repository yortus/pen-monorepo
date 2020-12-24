export function assert(x: unknown, message?: string): asserts x {
    if (x) return;
    throw new Error(message ?? `Assertion failed`);
}
