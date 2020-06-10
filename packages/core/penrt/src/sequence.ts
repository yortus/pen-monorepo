// TODO: doc... this rule is representation-agnostic
function sequence(options: StaticOptions & {expressions: Rule[]}): Rule {
    const {expressions} = options;
    const arity = expressions.length;
    return function SEQ() {
        let stateₒ = getState();
        let out: unknown;
        for (let i = 0; i < arity; ++i) {
            if (!expressions[i]()) return setState(stateₒ), false;
            out = concat(out, OUT);
        }
        OUT = out;
        return true;
    };
}
