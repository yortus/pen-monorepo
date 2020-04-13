function character(min: string, max: string, modifier?: 'concrete' | 'abstract'): Rule {
    if (modifier === 'abstract') {
        return {
            kind: 'rule',
            parse() {
                // NB: nothing consumed
                OUT = min;
                return true;
            },
            unparse() {
                if (typeof IBUF !== 'string') return false;
                if (IPTR < 0 || IPTR >= IBUF.length) return false;
                let c = IBUF.charAt(IPTR);
                if (c < min || c > max) return false;

                IPTR += 1;
                OUT = '';
                return true;
            },
        };
    }

    if (modifier === 'concrete') {
        return {
            kind: 'rule',
            parse() {
                assumeType<string>(IBUF);
                if (IPTR < 0 || IPTR >= IBUF.length) return false;
                let c = IBUF.charAt(IPTR);
                if (c < min || c > max) return false;

                IPTR += 1;
                OUT = undefined;
                return true;
            },
            unparse() {
                // NB: nothing consumed
                OUT = min;
                return true;
            },
        };
    }

    return {
        kind: 'rule',
        parse() {
            assumeType<string>(IBUF);
            if (IPTR < 0 || IPTR >= IBUF.length) return false;
            let c = IBUF.charAt(IPTR);
            if (c < min || c > max) return false;

            IPTR += 1;
            OUT = c;
            return true;
    },
        unparse() {
            if (typeof IBUF !== 'string') return false;
            if (IPTR < 0 || IPTR >= IBUF.length) return false;
            let c = IBUF.charAt(IPTR);
            if (c < min || c > max) return false;

            IPTR += 1;
            OUT = c;
            return true;
        },
    };
}
