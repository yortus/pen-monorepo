function stringLiteral(value: string): Rule {
    return {
        kind: 'rule',

        parse() {
            if (!INUL) {
                if (!isString(IDOC)) return false;
                if (!matchesAt(IDOC, value, IMEM)) return false;
                IMEM += value.length;
            }
            ODOC = ONUL ? undefined : value;
            return true;
        },

        unparse() {
            if (!INUL) {
                if (!isString(IDOC)) return false;
                if (!matchesAt(IDOC, value, IMEM)) return false;
                IMEM += value.length;
            }
            ODOC = ONUL ? undefined : value;
            return true;
        },
    };
}
