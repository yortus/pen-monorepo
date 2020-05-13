function epsilon(_options: StaticOptions): PenVal {
    return {
        bindings: {},

        parse() {
            ODOC = undefined;
            return true;
        },

        unparse() {
            ODOC = undefined;
            return true;
        },

        apply: NOT_A_LAMBDA,
    };
}
