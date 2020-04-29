const maybe: PenVal = {
    bindings: {},
    parse: NOT_A_RULE,
    unparse: NOT_A_RULE,
    apply(expr) {
        return {
            bindings: {},

            parse() {
                return expr.parse() || epsilon.parse();
            },

            unparse() {
                return expr.unparse() || epsilon.unparse();
            },

            apply: NOT_A_LAMBDA,
        };
    },
};
