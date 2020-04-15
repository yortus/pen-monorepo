const intrinsicFalse: Rule = {
    kind: 'rule',

    parse() {
        ODOC = false;
        return true;
    },

    unparse() {
        if (IDOC !== false || IMEM !== 0) return false;
        IMEM = 1;
        ODOC = '';
        return true;
    },
};
