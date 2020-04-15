const intrinsicTrue: Rule = {
    kind: 'rule',

    parse() {
        ODOC = ONUL ? undefined : true;
        return true;
    },

    unparse() {
        if (!INUL) {
            if (IDOC !== true || IMEM !== 0) return false;
            IMEM = 1;
        }
        ODOC = undefined;
        return true;
    },
};
