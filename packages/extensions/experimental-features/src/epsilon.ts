function epsilon(_options: StaticOptions): PenVal {
    return {
        parse() {
            ODOC = undefined;
            return true;
        },

        unparse() {
            ODOC = undefined;
            return true;
        },
    };
}
