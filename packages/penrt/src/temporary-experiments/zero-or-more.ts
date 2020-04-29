const zeroOrMore: PenVal = {
    bindings: {},
    parse: NOT_A_RULE,
    unparse: NOT_A_RULE,
    apply(expr) {
        return {
            bindings: {},

            parse() {
                let stateₒ = getState();
                let node: unknown;
                while (true) {
                    if (!expr.parse()) break;

                    // TODO: check if any input was consumed...
                    // if not, stop iterating, since otherwise we may loop forever
                    let state = getState();
                    if (state.IMEM === stateₒ.IMEM) break;

                    node = concat(node, state.ODOC);
                }
                setOutState(node);
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
                    let state = getState();
                    if (state.IMEM === stateₒ.IMEM) break;

                    // TODO: support more formats / blob types here, like for parse...
                    assert(typeof state.ODOC === 'string'); // just for now... remove after addressing above TODO
                    text = concat(text, state.ODOC);
                }

                setOutState(text);
                return true;
            },

            apply: NOT_A_LAMBDA,
        };
    },
};
