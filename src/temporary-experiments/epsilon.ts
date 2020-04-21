const epsilon: PenVal = {
    bindings: {},

    parse() {
        sys.setOutState(undefined);
        return true;
    },

    unparse() {
        sys.setOutState(undefined);
        return true;
    },

    apply: sys.NOT_A_LAMBDA,
};
