const not: PenVal = {
    bindings: {},
    parse: NOT_A_RULE,
    unparse: NOT_A_RULE,
    apply(expr) {
        return {
            bindings: {},

            kind: 'rule',

            parse() {
                let stateₒ = getState();
                if (!expr.parse()) return epsilon.parse();
                setState(stateₒ);
                return false;
            },

            unparse() {
                let stateₒ = getState();
                if (!expr.unparse()) return epsilon.unparse();
                setState(stateₒ);
                return false;
            },

            apply: NOT_A_LAMBDA,
        };
    },
};
