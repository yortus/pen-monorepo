function epsilon(_options: StaticOptions): PenVal {
    return {
        rule: function EPS() {
            OUT = undefined;
            return true;
        },
    };
}
