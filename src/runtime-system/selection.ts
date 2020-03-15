function selection(...expressions: Production[]): Production {
    const arity = expressions.length;
    return {
        kind: 'production',

        parse(text, pos, result) {
            for (let i = 0; i < arity; ++i) {
                if (expressions[i].parse(text, pos, result)) return true;
            }
            return false;
        },

        unparse(node, pos, result) {
            for (let i = 0; i < arity; ++i) {
                if (expressions[i].unparse(node, pos, result)) return true;
            }
            return false;
        },
    };
}
