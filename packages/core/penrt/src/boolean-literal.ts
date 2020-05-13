function booleanLiteral(options: StaticOptions & {value: boolean}): PenVal {
    const {value} = options;
    return {
        bindings: {},

        parse() {
            ODOC = ONUL ? undefined : value;
            return true;
        },

        unparse() {
            if (!INUL) {
                if (IDOC !== value || IMEM !== 0) return false;
                IMEM += 1;
            }
            ODOC = undefined;
            return true;
        },

        apply: NOT_A_LAMBDA,
    };
}
