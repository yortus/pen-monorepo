function not(options: StaticOptions): PenVal {
    const eps = epsilon(options); // TODO: remove this altogether?
    return {
        parse: NOT_A_RULE,

        unparse: NOT_A_RULE,

        lambda(expr) {
            return {
                parse() {
                    let stateₒ = getState();
                    if (!expr.parse()) return eps.parse();
                    setState(stateₒ);
                    return false;
                },

                unparse() {
                    let stateₒ = getState();
                    if (!expr.unparse()) return eps.unparse();
                    setState(stateₒ);
                    return false;
                },
            };
        },
    };
}
