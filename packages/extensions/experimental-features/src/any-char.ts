// TODO: doc... has both 'txt' and 'ast' representation
function anyChar(options: StaticOptions): PenVal {
    const INUL = options.in === 'nil';
    const ONUL = options.out === 'nil';
    return {
        parse() {
            let c = '?';
            if (!INUL) {
                if (!isString(IDOC)) return false;
                if (IMEM < 0 || IMEM >= IDOC.length) return false;
                c = IDOC.charAt(IMEM);
                IMEM += 1;
            }
            ODOC = ONUL ? undefined : c;
            return true;
        },

        unparse() {
            let c = '?';
            if (!INUL) {
                if (!isString(IDOC)) return false;
                if (IMEM < 0 || IMEM >= IDOC.length) return false;
                c = IDOC.charAt(IMEM);
                IMEM += 1;
            }
            ODOC = ONUL ? undefined : c;
            return true;
        },
    };
}
