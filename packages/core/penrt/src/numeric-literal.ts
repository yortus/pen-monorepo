function numericLiteral(options: StaticOptions & {value: number}): PenVal {
    const {value} = options;
    return {
        parse() {
            ODOC = ONUL ? undefined : value;
            return true;
        },

        unparse() {
            if (!INUL) {
                if (IDOC !== value || IMEM !== 0) return false;
                IMEM = 1;
            }
            ODOC = undefined;
            return true;
        },
    };
}
