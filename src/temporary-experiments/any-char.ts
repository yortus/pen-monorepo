const anyChar: Rule = {
    kind: 'rule',

    parse() {
        assumeType<string>(IBUF);
        if (IPTR >= IBUF.length) return false;
        IPTR += 1;
        OUT = IBUF.charAt(IPTR);
        return true;
    },

    unparse() {
        if (typeof IBUF !== 'string' || IPTR >= IBUF.length) return false;
        IPTR += 1;
        OUT = IBUF.charAt(IPTR);
        return true;
    },
};
