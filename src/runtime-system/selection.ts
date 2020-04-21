function selection(...expressions: PenVal[]): PenVal {
    const arity = expressions.length;
    return {
        bindings: {},

        parse() {
            for (let i = 0; i < arity; ++i) {
                if (expressions[i].parse()) return true;
            }
            return false;
        },

        unparse() {
            for (let i = 0; i < arity; ++i) {
                if (expressions[i].unparse()) return true;
            }
            return false;
        },

        apply: NOT_A_LAMBDA,
    };
}
