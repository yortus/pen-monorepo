// TODO: doc... this rule is representation-agnostic
function zeroOrMore({expression}: StaticOptions & {expression: Rule}): Rule {
    return function O_M() {
        let stateₒ = getState();
        let out: unknown;
        while (true) {
            if (!expression()) break;

            // TODO: check if any input was consumed...
            // if not, stop iterating, since otherwise we may loop forever
            // TODO: any other checks needed? review...
            if (IP === stateₒ.IP) break;

            // TODO: once we know what the value type is (str, obj or arr), keep appending to the same instance
            out = concat(out, OUT);
        }
        OUT = out;
        return true;
    };
}
