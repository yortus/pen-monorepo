function AbstractStringLiteral(value: string): Codec {
    return {
        parse: (_, pos, result) => {
            result.ast = value;
            result.posᐟ = pos;
            return true;
        },
        unparse: (ast, pos, result) => {
            if (typeof ast !== 'string' || !matchesAt(ast, value, pos)) return false;
            result.src = '';
            result.posᐟ = pos + value.length;
            return true;
        },
    };
}

function ConcreteStringLiteral(value: string): Codec {
    return {
        parse: (src, pos, result) => {
            if (!matchesAt(src, value, pos)) return false;
            result.ast = NO_NODE;
            result.posᐟ = pos + value.length;
            return true;
        },
        unparse: (_, pos, result) => {
            result.src = value;
            result.posᐟ = pos;
            return true;
        },
    };
}

function UniformStringLiteral(value: string): Codec {
    return {
        parse: (src, pos, result) => {
            if (!matchesAt(src, value, pos)) return false;
            result.ast = value;
            result.posᐟ = pos + value.length;
            return true;
        },
        unparse: (ast, pos, result) => {
            if (typeof ast !== 'string' || !matchesAt(ast, value, pos)) return false;
            result.src = value;
            result.posᐟ = pos + value.length;
            return true;
        },
    };
}
