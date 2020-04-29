const epsilon: PenVal = {
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
