function AbstractCharRange(min: string, max: string): Codec {
    return {
        parse: (_, pos, result) => {
            result.ast = min;
            result.posᐟ = pos;
            return true;
        },
        unparse: (ast, pos, result) => {
            if (typeof ast !== 'string' || pos >= ast.length) return false;
            let c = ast.charAt(pos);
            if (c < min || c > max) return false;
            result.src = '';
            result.posᐟ = pos + 1;
            return true;
        },
    };
}




function ConcreteCharRange(min: string, max: string): Codec {
    return {
        parse: (src, pos, result) => {
            if (pos >= src.length) return false;
            let c = src.charAt(pos);
            if (c < min || c > max) return false;
            result.ast = NO_NODE;
            result.posᐟ = pos + 1;
            return true;
        },
        unparse: (_, pos, result) => {
            result.src = min;
            result.posᐟ = pos;
            return true;
        },
    };
}




function UniformCharRange(min: string, max: string): Codec {
    return {
        parse: (src, pos, result) => {
            if (pos >= src.length) return false;
            let c = src.charAt(pos);
            if (c < min || c > max) return false;
            result.ast = c;
            result.posᐟ = pos + 1;
            return true;
        },
        unparse: (ast, pos, result) => {
            if (typeof ast !== 'string' || pos >= ast.length) return false;
            let c = ast.charAt(pos);
            if (c < min || c > max) return false;
            result.src = c;
            result.posᐟ = pos + 1;
            return true;
        },
    };
}
