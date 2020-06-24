// TODO: doc... this rule is representation-agnostic
function zeroOrMore({expression}: StaticOptions & {expression: Rule}): Rule {
    return function O_M() {
        let IPₒ = IP;
        let out: unknown;
        do {
            if (!expression()) break;
            if (IP === IPₒ) break;
            out = concat(out, OUT);
        } while (true);
        OUT = out;
        return true;
    };
}
