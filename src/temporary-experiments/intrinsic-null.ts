const intrinsicNull: Rule = {
    kind: 'rule',

    parse() {
        OUT = null;
        return true;
    },

    unparse() {
        if (IBUF !== null || IPTR !== 0) return false;
        IPTR = 1;
        OUT = '';
        return true;
    },
};
