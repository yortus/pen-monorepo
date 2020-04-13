const intrinsicTrue: Rule = {
    kind: 'rule',

    parse() {
        OUT = true;
        return true;
    },

    unparse() {
        if (IBUF !== true || IPTR !== 0) return false;
        IPTR = 1;
        OUT = '';
        return true;
    },
};
