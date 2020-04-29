function abstract(expr: PenVal): PenVal {
    return {
        bindings: {},

        parse() {
            let INULₒ = INUL;
            INUL = true;
            let result = expr.parse();
            INUL = INULₒ;
            return result;
        },

        unparse() {
            let ONULₒ = ONUL;
            ONUL = true;
            let result = expr.unparse();
            ONUL = ONULₒ;
            return result;
        },

        apply: NOT_A_LAMBDA,
    };
}
