function character(min: string, max: string): Rule {
    return {
        kind: 'rule',

        parse() {
            if (INUL) return ODOC = ONUL ? undefined : min, true;    // <===== (1a)

            assumeType<string>(IDOC);                               // <===== (2)
            if (IMEM < 0 || IMEM >= IDOC.length) return false;
            let c = IDOC.charAt(IMEM);
            if (c < min || c > max) return false;

            IMEM += 1;
            ODOC = ONUL ? undefined : c;                             // <===== (1b)
            return true;
        },

        unparse() {
            if (INUL) return ODOC = ONUL ? '' : min, true;           // <===== (1a)

            if (typeof IDOC !== 'string') return false;             // <===== (2)
            if (IMEM < 0 || IMEM >= IDOC.length) return false;
            let c = IDOC.charAt(IMEM);
            if (c < min || c > max) return false;

            IMEM += 1;
            ODOC = ONUL ? '' : c;                                    // <===== (1b)
            return true;
        },
    };
}
