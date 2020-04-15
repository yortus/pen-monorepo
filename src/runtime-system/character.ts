function character(min: string, max: string): Rule {
    return {
        kind: 'rule',

        parse() {
            let c = min;
            if (!INUL) {
                if (!isString(IDOC)) return false;
                if (IMEM < 0 || IMEM >= IDOC.length) return false;
                c = IDOC.charAt(IMEM);
                if (c < min || c > max) return false;
                IMEM += 1;
            }
            ODOC = ONUL ? undefined : c;
            return true;
        },

        unparse() {
            let c = min;
            if (!INUL) {
                if (!isString(IDOC)) return false;
                if (IMEM < 0 || IMEM >= IDOC.length) return false;
                c = IDOC.charAt(IMEM);
                if (c < min || c > max) return false;
                IMEM += 1;
            }
            ODOC = ONUL ? undefined : c;
            return true;
        },
    };
}
