const epsilon: PenVal = {
    bindings: {},

    parse() {
        setOutState(undefined);
        return true;
    },

    unparse() {
        setOutState(undefined);
        return true;
    },

    apply: NOT_A_LAMBDA,
};
