function string(value: string): Rule {
    return {
        kind: 'rule',

        parse() {
            if (INUL) return OUT = ONUL ? undefined : value, true;  // <===== (1a)

            assumeType<string>(IBUF);                               // <===== (2)
            if (!matchesAt(IBUF, value, IPTR)) return false;

            IPTR += value.length;
            OUT = ONUL ? undefined : value;                         // <===== (1b)
            return true;
        },

        unparse() {
            if (INUL) return OUT = ONUL ? '' : value, true;         // <===== (1a)

            if (typeof IBUF !== 'string') return false;             // <===== (2)
            if (!matchesAt(IBUF, value, IPTR)) return false;

            IPTR += value.length;
            OUT = ONUL ? '' : value;                                // <===== (1b)
            return true;
        },
    };
}
