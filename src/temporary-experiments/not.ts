const not: Lambda = {
    kind: 'lambda',
    apply(expr: Rule): Rule {
        return {
            kind: 'rule',

            parse() {
                let stateₒ = sys.getState();
                if (!expr.parse()) return epsilon.parse();
                sys.setState(stateₒ);
                return true;
            },

            unparse() {
                let stateₒ = sys.getState();
                if (!expr.unparse()) return epsilon.unparse();
                sys.setState(stateₒ);
                return true;
            },
        };
    },
};
