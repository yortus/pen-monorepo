const anyChar: PenVal = {
    bindings: {},

    parse() {
        let c = '?';
        if (!INUL) {
            if (!isString(IDOC)) return false;
            if (IMEM < 0 || IMEM >= IDOC.length) return false;
            c = IDOC.charAt(IMEM);
            IMEM += 1;
        }
        ODOC = ONUL ? undefined : c;
        return true;
    },

    unparse() {
        let c = '?';
        if (!INUL) {
            if (!isString(IDOC)) return false;
            if (IMEM < 0 || IMEM >= IDOC.length) return false;
            c = IDOC.charAt(IMEM);
            IMEM += 1;
        }
        ODOC = ONUL ? undefined : c;
        return true;
    },

    apply: NOT_A_LAMBDA,
};
