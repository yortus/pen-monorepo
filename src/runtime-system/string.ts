function string(value: string): Rule {
    return {
        kind: 'rule',

        parse() {
            if (!INUL) {
                assumeType<string>(IDOC);                           // <===== (1)
                if (!matchesAt(IDOC, value, IMEM)) return false;
                IMEM += value.length;
            }

            ODOC = ONUL ? undefined : value;                        // <===== (2)
            return true;
        },

        unparse() {
            if (!INUL) {
                if (typeof IDOC !== 'string') return false;         // <===== (1)
                if (!matchesAt(IDOC, value, IMEM)) return false;
                IMEM += value.length;
            }
            ODOC = ONUL ? '' : value;                               // <===== (2)
            return true;
        },
    };
}
