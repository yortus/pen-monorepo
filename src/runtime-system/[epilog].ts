// TODO: doc... helper...
function assert(value: unknown): asserts value {
    if (!value) throw new Error(`Assertion failed`);
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
function matchesAt(text: string, substr: string, position: number) {
    let lastPos = position + substr.length;
    if (lastPos > text.length) return false;
    for (let i = position, j = 0; i < lastPos; ++i, ++j) {
        if (text.charAt(i) !== substr.charAt(j)) return false;
    }
    return true;
}


// @ts-ignore
return {
    apply,
    bindingLookup,
    charRange,
    label,
    list,
    record,
    reference,
    sequence,
    selection,
    string,
};
