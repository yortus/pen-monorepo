function zeroOrMore(_options: StaticOptions): PenVal {
    return {
        parse: NOT_A_RULE,

        unparse: NOT_A_RULE,

        lambda(expr) {
            return {
                parse() {
                    let stateₒ = getState();
                    let node: unknown;
                    while (true) {
                        if (!expr.parse()) break;

                        // TODO: check if any input was consumed...
                        // if not, stop iterating, since otherwise we may loop forever
                        if (IP === stateₒ.IP) break;

                        node = concat(node, OUT);
                    }
                    OUT = node;
                    return true;
                },

                unparse() {
                    let stateₒ = getState();
                    let text: unknown;
                    while (true) {
                        if (!expr.unparse()) break;

                        // TODO: check if any input was consumed...
                        // if not, stop iterating, since otherwise we may loop forever
                        // TODO: any other checks needed? review...
                        if (IP === stateₒ.IP) break;

                        // TODO: support more formats / blob types here, like for parse...
                        assert(typeof OUT === 'string'); // just for now... remove after addressing above TODO
                        text = concat(text, OUT);
                    }

                    OUT = text;
                    return true;
                },
            };
        },
    };
}
