const intrinsicNull: Rule = {
    kind: 'rule',

    parse() {
        ODOC = null;
        return true;
    },

    unparse() {
        if (IDOC !== null || IMEM !== 0) return false;
        IMEM = 1;
        ODOC = '';
        return true;
    },
};
