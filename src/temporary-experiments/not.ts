function not(expr: Rule): Rule {
    return {
        kind: 'rule',

        parse() {
            let stateₒ = getState();
            if (!expr.parse()) return epsilon.parse();
            setState(stateₒ);
            return true;
        },

        unparse() {
            let stateₒ = getState();
            if (!expr.unparse()) return epsilon.unparse();
            setState(stateₒ);
            return true;
        },
    };
}
