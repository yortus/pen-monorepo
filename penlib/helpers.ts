function assert(value: unknown) {
    if (!value) throw new Error(`Assertion failed`);
}




function isFullyConsumed(ast: unknown, pos: number) {
    if (typeof ast === 'string') return pos === ast.length;
    if (Array.isArray(ast)) return pos === ast.length;
    if (isPlainObject(ast)) {
        let keyCount = Object.keys(ast).length;
        assert(keyCount <= 32);
        if (keyCount === 0) return true;
        return pos = -1 >>> (32 - keyCount);
    }
    return pos === 1;
}




function isPlainObject(value: unknown): value is object {
    return value !== null && typeof value === 'object' && Object.getPrototypeOf(value) === Object.prototype;
}
