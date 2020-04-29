const nullLiteral: PenVal = {
    bindings: {},

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

    apply: NOT_A_LAMBDA,
};
