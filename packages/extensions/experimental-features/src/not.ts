function not(options: StaticOptions): PenVal {
    const eps = epsilon(options); // TODO: remove this altogether?
    return {
        lambda(expr) {
            return {
                rule() {
                    let stateₒ = getState();
                    if (!expr.rule!()) return eps.rule!();
                    setState(stateₒ);
                    return false;
                },
            };
        },
    };
}
