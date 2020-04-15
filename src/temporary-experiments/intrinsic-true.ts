const intrinsicTrue: Rule = {
    kind: 'rule',

    parse() {
        ODOC = true;
        return true;
    },

    unparse() {
        if (IDOC !== true || IMEM !== 0) return false;
        IMEM = 1;
        ODOC = '';
        return true;
    },
};
