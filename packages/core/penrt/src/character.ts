// TODO: doc... has both 'txt' and 'ast' representation
function character(options: StaticOptions & {min: string, max: string}): PenVal {
    const {min, max} = options;
    const NO_CONSUME = options.in === 'nil';
    const NO_PRODUCE = options.out === 'nil';
    return {
        parse() {
            let c = min;
            if (!NO_CONSUME) {
                if (typeof IN !== 'string') return false;
                if (IP < 0 || IP >= IN.length) return false;
                c = IN.charAt(IP);
                if (c < min || c > max) return false;
                IP += 1;
            }
            OUT = NO_PRODUCE ? undefined : c;
            return true;
        },

        unparse() {
            let c = min;
            if (!NO_CONSUME) {
                if (typeof IN !== 'string') return false;
                if (IP < 0 || IP >= IN.length) return false;
                c = IN.charAt(IP);
                if (c < min || c > max) return false;
                IP += 1;
            }
            OUT = NO_PRODUCE ? undefined : c;
            return true;
        },
    };
}
