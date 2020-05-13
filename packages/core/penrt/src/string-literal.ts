// TODO: doc... has both 'txt' and 'ast' representation
function stringLiteral(options: StaticOptions & {value: string}): PenVal {
    const {value} = options;
    const INUL = options.in === 'nil';
    const ONUL = options.out === 'nil';
    return {
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
