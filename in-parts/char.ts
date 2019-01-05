function Char(): Codec {
    return {
        parse: (src, pos, result) => {
            if (pos >= src.length) return false;
            result.ast = src.charAt(pos);
            result.posᐟ = pos + 1;
            return true;
        },
        unparse: (ast, pos, result) => {
            if (typeof ast !== 'string' || pos >= ast.length) return false;
            result.src = ast.charAt(pos);
            result.posᐟ = pos + 1;
            return true;
        },
    };
}
