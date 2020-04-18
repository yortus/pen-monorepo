const intrinsicFalse: Rule = {
    kind: 'rule',

    parse() {
        let {ONUL} = sys.getState();
        sys.setOutState(ONUL ? undefined : false);
        return true;
    },

    unparse() {
        let {IDOC, IMEM, INUL, ONUL} = sys.getState();
        if (!INUL) {
            if (IDOC !== false || IMEM !== 0) return false;
            IMEM = 1;
        }
        sys.setState({IDOC, IMEM, ODOC: undefined, INUL, ONUL});
        return true;
    },
};
