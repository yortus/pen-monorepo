function True(): Codec {
    return {
        parse: (_, pos, result) => {
            result.ast = true;
            result.posᐟ = pos;
            return true;
        },
        unparse: (ast, pos, result) => {
            if (ast !== true || pos !== 0) return false;
            result.src = '';
            result.posᐟ = 1;
            return true;
        },
    };
}




function False(): Codec {
    return {
        parse: (_, pos, result) => {
            result.ast = false;
            result.posᐟ = pos;
            return true;
        },
        unparse: (ast, pos, result) => {
            if (ast !== false || pos !== 0) return false;
            result.src = '';
            result.posᐟ = 1;
            return true;
        },
    };
}




function Null(): Codec {
    return {
        parse: (_, pos, result) => {
            result.ast = null;
            result.posᐟ = pos;
            return true;
        },
        unparse: (ast, pos, result) => {
            if (ast !== null || pos !== 0) return false;
            result.src = '';
            result.posᐟ = 1;
            return true;
        },
    };
}




function Maybe(expression: Codec): Codec {
    const epsilon = Epsilon();
    return {
        parse: (src, pos, result) => {
            if (expression.parse(src, pos, result)) return true;
            return epsilon.parse(src, pos, result);
        },
        unparse: (ast, pos, result) => {
            if (expression.unparse(ast, pos, result)) return true;
            return epsilon.unparse(ast, pos, result);
            },
    };
}




function Not(expression: Codec): Codec {
    const epsilon = Epsilon();
    return {
        parse: (src, pos, result) => {
            if (expression.parse(src, pos, result)) return false;
            return epsilon.parse(src, pos, result);
        },
        unparse: (ast, pos, result) => {
            if (expression.unparse(ast, pos, result)) return false;
            return epsilon.unparse(ast, pos, result);
        },
    };
}




function Epsilon(): Codec {
    return {
        parse: (_, pos, result) => {
            result.ast = NO_NODE;
            result.posᐟ = pos;
            return true;
        },
        unparse: (_, pos, result) => {
            result.src = '';
            result.posᐟ = pos;
            return true;
        },
    };
}
