const anyChar: PenVal = {
    bindings: {},

    parse() {
        let {IDOC, IMEM, INUL, ONUL} = getState();
        let c = '?';
        if (!INUL) {
            if (!isString(IDOC)) return false;
            if (IMEM < 0 || IMEM >= IDOC.length) return false;
            c = IDOC.charAt(IMEM);
            IMEM += 1;
        }
        let ODOC = ONUL ? undefined : c;
        setState({IDOC, IMEM, ODOC, INUL, ONUL});
        return true;
    },

    unparse() {
        let {IDOC, IMEM, INUL, ONUL} = getState();
        let c = '?';
        if (!INUL) {
            if (!isString(IDOC)) return false;
            if (IMEM < 0 || IMEM >= IDOC.length) return false;
            c = IDOC.charAt(IMEM);
            IMEM += 1;
        }
        let ODOC = ONUL ? undefined : c;
        setState({IDOC, IMEM, ODOC, INUL, ONUL});
        return true;
    },

    apply: NOT_A_LAMBDA,
};
