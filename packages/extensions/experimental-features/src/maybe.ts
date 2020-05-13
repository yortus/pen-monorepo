function maybe(options: StaticOptions): PenVal {
    const eps = epsilon(options); // TODO: remove this altogether?
    return {
        lambda(expr) {
            return {
                rule() {
                    return expr.rule!() || eps.rule!();
                },
            };
        },
    };
}
