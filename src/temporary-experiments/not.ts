const not: PenVal = {
    bindings: {},
    parse: sys.NOT_A_RULE,
    unparse: sys.NOT_A_RULE,
    apply(expr) {
        return {
            bindings: {},

            kind: 'rule',

            parse() {
                let stateₒ = sys.getState();
                if (!expr.parse()) return epsilon.parse();
                sys.setState(stateₒ);
                return false;
            },

            unparse() {
                let stateₒ = sys.getState();
                if (!expr.unparse()) return epsilon.unparse();
                sys.setState(stateₒ);
                return false;
            },

            apply: sys.NOT_A_LAMBDA,
        };
    },
};
