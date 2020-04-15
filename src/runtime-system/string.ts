function string(value: string): Rule {
    return {
        kind: 'rule',

        parse() {
            if (INUL) return ODOC = ONUL ? undefined : value, true;  // <===== (1a)

            assumeType<string>(IDOC);                               // <===== (2)
            if (!matchesAt(IDOC, value, IMEM)) return false;

            IMEM += value.length;
            ODOC = ONUL ? undefined : value;                         // <===== (1b)
            return true;
        },

        unparse() {
            if (INUL) return ODOC = ONUL ? '' : value, true;         // <===== (1a)

            if (typeof IDOC !== 'string') return false;             // <===== (2)
            if (!matchesAt(IDOC, value, IMEM)) return false;

            IMEM += value.length;
            ODOC = ONUL ? '' : value;                                // <===== (1b)
            return true;
        },
    };
}
