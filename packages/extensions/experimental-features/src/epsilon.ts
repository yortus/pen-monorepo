function epsilon(_options: StaticOptions): PenVal {
    return {
        parse() {
            OUT = undefined;
            return true;
        },

        unparse() {
            OUT = undefined;
            return true;
        },
    };
}
