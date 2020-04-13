function string(value: string, modifier?: 'concrete' | 'abstract'): Rule {
    if (modifier === 'abstract') {
        return {
            kind: 'rule',
            parse() {
                // NB: nothing consumed
                OUT = value;
                return true;
            },
            unparse() {
                if (typeof IBUF !== 'string') return false;
                if (!matchesAt(IBUF, value, IPTR)) return false;
                IPTR += value.length;
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
                if (!matchesAt(IBUF, value, IPTR)) return false;
                IPTR += value.length;
                OUT = undefined;
                return true;
            },
            unparse() {
                // NB: nothing consumed
                OUT = value;
                return true;
            },
        };
    }

    return {
        kind: 'rule',
        parse() {
            assumeType<string>(IBUF);
            if (!matchesAt(IBUF, value, IPTR)) return false;
            IPTR += value.length;
            OUT = value;
            return true;
        },
        unparse() {
            if (typeof IBUF !== 'string') return false;
            if (!matchesAt(IBUF, value, IPTR)) return false;
            IPTR += value.length;
            OUT = value;
            return true;
        },
    };
}
