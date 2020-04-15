function abstract(expr: Rule): Rule {
    return {
        kind: 'rule',

        parse() {
            let INULₒ = INUL;
            INUL = true;
            let result = expr.parse();
            INUL = INULₒ;
            return result;
        },

        unparse() {
            let ONULₒ = ONUL;
            ONUL = true;
            let result = expr.unparse();
            ONUL = ONULₒ;
            return result;
        },
    };
}
