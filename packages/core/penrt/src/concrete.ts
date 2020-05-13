function concrete(options: StaticOptions & {expr: PenVal}): PenVal {
    const {expr} = options;
    return {
        bindings: {},

        parse() {
            let ONULₒ = ONUL;
            ONUL = true;
            let result = expr.parse();
            ONUL = ONULₒ;
            return result;
        },

        unparse() {
            let INULₒ = INUL;
            INUL = true;
            let result = expr.unparse();
            INUL = INULₒ;
            return result;
        },

        apply: NOT_A_LAMBDA,
    };
}
