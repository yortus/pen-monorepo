const maybe: PenVal = {
    bindings: {},
    parse: sys.NOT_A_RULE,
    unparse: sys.NOT_A_RULE,
    apply(expr) {
        return {
            bindings: {},

            parse() {
                return expr.parse() || epsilon.parse();
            },

            unparse() {
                return expr.unparse() || epsilon.unparse();
            },

            apply: sys.NOT_A_LAMBDA,
        };
    },
};
