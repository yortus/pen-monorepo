function maybe(options: StaticOptions): PenVal {
    const eps = epsilon(options); // TODO: remove this altogether?
    return {
        lambda(expr) {
            return {
                rule: function Oⵈ1() {
                    return expr.rule!() || eps.rule!();
                },
            };
        },
    };
}
