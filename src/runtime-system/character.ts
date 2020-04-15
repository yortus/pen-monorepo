function character(min: string, max: string): Rule {
    return {
        kind: 'rule',

        parse() {
            if (INUL) return OUT = ONUL ? undefined : min, true;    // <===== (1a)

            assumeType<string>(IBUF);                               // <===== (2)
            if (IPTR < 0 || IPTR >= IBUF.length) return false;
            let c = IBUF.charAt(IPTR);
            if (c < min || c > max) return false;

            IPTR += 1;
            OUT = ONUL ? undefined : c;                             // <===== (1b)
            return true;
        },

        unparse() {
            if (INUL) return OUT = ONUL ? '' : min, true;           // <===== (1a)

            if (typeof IBUF !== 'string') return false;             // <===== (2)
            if (IPTR < 0 || IPTR >= IBUF.length) return false;
            let c = IBUF.charAt(IPTR);
            if (c < min || c > max) return false;

            IPTR += 1;
            OUT = ONUL ? '' : c;                                    // <===== (1b)
            return true;
        },
    };
}
