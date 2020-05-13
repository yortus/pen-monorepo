function epsilon(_options: StaticOptions): PenVal {
    return {
        rule() {
            OUT = undefined;
            return true;
        },
    };
}
