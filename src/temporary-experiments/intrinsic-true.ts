const intrinsicTrue: Rule = {
    kind: 'rule',

    parse() {
        let {ONUL} = sys.getState();
        sys.setOutState(ONUL ? undefined : true);
        return true;
    },

    unparse() {
        let {IDOC, IMEM, INUL, ONUL} = sys.getState();
        if (!INUL) {
            if (IDOC !== true || IMEM !== 0) return false;
            IMEM = 1;
        }
        sys.setState({IDOC, IMEM, ODOC: undefined, INUL, ONUL});
        return true;
    },
};
