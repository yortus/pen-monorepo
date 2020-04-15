const intrinsicFalse: Rule = {
    kind: 'rule',

    parse() {
        ODOC = ONUL ? undefined : false;
        return true;
    },

    unparse() {
        if (!INUL) {
            if (IDOC !== false || IMEM !== 0) return false;
            IMEM = 1;
        }
        ODOC = undefined;
        return true;
    },
};
