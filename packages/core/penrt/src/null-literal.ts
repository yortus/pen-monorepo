// TODO: doc... has only 'ast' representation
function nullLiteral(options: StaticOptions): PenVal {
    const INUL = options.in === 'nil';
    const ONUL = options.out === 'nil';
    return {
        parse() {
            ODOC = ONUL ? undefined : null;
            return true;
        },

        unparse() {
            if (!INUL) {
                if (IDOC !== null || IMEM !== 0) return false;
                IMEM = 1;
            }
            ODOC = undefined;
            return true;
        },
    };
}
