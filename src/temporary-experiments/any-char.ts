const anyChar: Rule = {
    kind: 'rule',

    parse() {
        let c = '?';
        if (!INUL) {
            assumeType<string>(IDOC);                           // <===== (1)
            if (IMEM < 0 || IMEM >= IDOC.length) return false;
            c = IDOC.charAt(IMEM);
            IMEM += 1;
        }
        ODOC = ONUL ? undefined : c;
        return true;
    },

    unparse() {
        let c = '?';
        if (!INUL) {
            if (typeof IDOC !== 'string') return false;         // <===== (1)
            if (IMEM < 0 || IMEM >= IDOC.length) return false;
            c = IDOC.charAt(IMEM);
            IMEM += 1;
        }
        ODOC = ONUL ? undefined : c;
        return true;
    },
};
