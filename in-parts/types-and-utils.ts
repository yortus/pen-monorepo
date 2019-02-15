// export type Parser = (src: string, pos: number, result: {ast: unknown, posᐟ: number}) => boolean;
// export type Unparser = (ast: unknown, pos: number, result: {src: string, posᐟ: number}) => boolean;
interface Codec {
    parse: (src: string, pos: number, result: {ast: unknown, posᐟ: number}) => boolean;
    unparse: (ast: unknown, pos: number, result: {src: string, posᐟ: number}) => boolean;
}




const NO_NODE = Symbol('NoNode');




function defineRule(init: () => Codec) {
    let result: Codec = {
        parse(src, pos, res) {
            let rule = init();
            result.parse = rule.parse;
            result.unparse = rule.unparse;
            return rule.parse(src, pos, res);
        },
        unparse(ast, pos, res) {
            let rule = init();
            result.parse = rule.parse;
            result.unparse = rule.unparse;
            return rule.unparse(ast, pos, res);
        },
    };
    return result;
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




function matchesAt(text: string, substr: string, position: number) {
    let lastPos = position + substr.length;
    if (lastPos > text.length) return false;
    for (let i = position, j = 0; i < lastPos; ++i, ++j) {
        if (text.charAt(i) !== substr.charAt(j)) return false;
    }
    return true;
}




function assert(value: unknown) {
    if (!value) throw new Error(`Assertion failed`);
}
