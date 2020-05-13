function nullLiteral(_options: StaticOptions): PenVal {
    return {
        parse() {
            ODOC = ONUL ? undefined : null;
            return true;
        },

        unparse() {
            if (!INUL) {
                if (IDOC !== null || IMEM !== 0) return false;
                IMEM = 1;
            }
            ODOC = undefined;
            return true;
        },
    };
}
