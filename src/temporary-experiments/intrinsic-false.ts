const intrinsicFalse: Rule = {
    kind: 'rule',

    parse() {
        OUT = false;
        return true;
    },

    unparse() {
        if (IBUF !== false || IPTR !== 0) return false;
        IPTR = 1;
        OUT = '';
        return true;
    },
};
