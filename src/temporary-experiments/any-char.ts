const anyChar: Rule = {
    kind: 'rule',

    parse() {
        let {IDOC, IMEM, INUL, ONUL} = sys.getState();
        let c = '?';
        if (!INUL) {
            if (!sys.isString(IDOC)) return false;
            if (IMEM < 0 || IMEM >= IDOC.length) return false;
            c = IDOC.charAt(IMEM);
            IMEM += 1;
        }
        let ODOC = ONUL ? undefined : c;
        sys.setState({IDOC, IMEM, ODOC, INUL, ONUL});
        return true;
    },

    unparse() {
        let {IDOC, IMEM, INUL, ONUL} = sys.getState();
        let c = '?';
        if (!INUL) {
            if (!sys.isString(IDOC)) return false;
            if (IMEM < 0 || IMEM >= IDOC.length) return false;
            c = IDOC.charAt(IMEM);
            IMEM += 1;
        }
        let ODOC = ONUL ? undefined : c;
        sys.setState({IDOC, IMEM, ODOC, INUL, ONUL});
        return true;
    },
};
