// TODO: doc... has only 'ast' representation
// TODO: support 'txt' representation too?
function numericLiteral(options: StaticOptions & {value: number}): PenVal {
    const {value} = options;
    const INUL = options.in === 'nil';
    const ONUL = options.out === 'nil';
    return {
        parse() {
            ODOC = ONUL ? undefined : value;
            return true;
        },

        unparse() {
            if (!INUL) {
                if (IDOC !== value || IMEM !== 0) return false;
                IMEM = 1;
            }
            ODOC = undefined;
            return true;
        },
    };
}
