const anyChar: Rule = {
    kind: 'rule',

    parse() {
        assumeType<string>(IDOC);
        if (IMEM >= IDOC.length) return false;
        IMEM += 1;
        ODOC = IDOC.charAt(IMEM);
        return true;
    },

    unparse() {
        if (typeof IDOC !== 'string' || IMEM >= IDOC.length) return false;
        IMEM += 1;
        ODOC = IDOC.charAt(IMEM);
        return true;
    },
};
