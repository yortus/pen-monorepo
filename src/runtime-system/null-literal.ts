const nullLiteral: PenVal = {
    bindings: {},

    parse() {
        let {ONUL} = sys.getState();
        sys.setOutState(ONUL ? undefined : null);
        return true;
    },

    unparse() {
        let {IDOC, IMEM, INUL, ONUL} = sys.getState();
        if (!INUL) {
            if (IDOC !== null || IMEM !== 0) return false;
            IMEM = 1;
        }
        sys.setState({IDOC, IMEM, ODOC: undefined, INUL, ONUL});
        return true;
    },

    apply: NOT_A_LAMBDA,
};
