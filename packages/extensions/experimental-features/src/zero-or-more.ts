function zeroOrMore(_options: StaticOptions): PenVal {
    return {
        lambda(expr) {
            return {
                rule() {
                    let stateₒ = getState();
                    let out: unknown;
                    while (true) {
                        if (!expr.rule!()) break;

                        // TODO: check if any input was consumed...
                        // if not, stop iterating, since otherwise we may loop forever
                        // TODO: any other checks needed? review...
                        if (IP === stateₒ.IP) break;

                        out = concat(out, OUT);
                    }
                    OUT = out;
                    return true;
                },
            };
        },
    };
}
