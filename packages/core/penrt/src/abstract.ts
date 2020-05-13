function abstract(options: StaticOptions & {expr: PenVal}): PenVal {
    const {expr} = options;
    return {
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
