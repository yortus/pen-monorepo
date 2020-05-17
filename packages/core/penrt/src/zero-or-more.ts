// TODO: doc... this rule is representation-agnostic
function zeroOrMore(options: StaticOptions & {expression: PenVal}): PenVal {
    const {expression} = options;
    return {
        rule: function O_M() {
            let stateₒ = getState();
            let out: unknown;
            while (true) {
                if (!expression.rule!()) break;

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
}
