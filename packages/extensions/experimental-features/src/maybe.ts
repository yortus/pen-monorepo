function maybe(options: StaticOptions): PenVal {
    const eps = epsilon(options); // TODO: remove this altogether?
    return {
        parse: NOT_A_RULE,

        unparse: NOT_A_RULE,

        lambda(expr) {
            return {
                parse() {
                    return expr.parse() || eps.parse();
                },

                unparse() {
                    return expr.unparse() || eps.unparse();
                },
            };
        },
    };
}
