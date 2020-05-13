function maybe(options: StaticOptions): PenVal {
    const eps = epsilon(options); // TODO: remove this altogether?
    return {
        bindings: {},
        parse: NOT_A_RULE,
        unparse: NOT_A_RULE,
        apply(expr) {
            return {
                bindings: {},

                parse() {
                    return expr.parse() || eps.parse();
                },

                unparse() {
                    return expr.unparse() || eps.unparse();
                },

                apply: NOT_A_LAMBDA,
            };
        },
    };
}
