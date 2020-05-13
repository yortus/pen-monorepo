// TODO: doc... has both 'txt' and 'ast' representation
function anyChar(options: StaticOptions): PenVal {
    const NO_CONSUME = options.in === 'nil';
    const NO_PRODUCE = options.out === 'nil';
    return {
        parse() {
            let c = '?';
            if (!NO_CONSUME) {
                if (!isString(IN)) return false;
                if (IP < 0 || IP >= IN.length) return false;
                c = IN.charAt(IP);
                IP += 1;
            }
            OUT = NO_PRODUCE ? undefined : c;
            return true;
        },

        unparse() {
            let c = '?';
            if (!NO_CONSUME) {
                if (!isString(IN)) return false;
                if (IP < 0 || IP >= IN.length) return false;
                c = IN.charAt(IP);
                IP += 1;
            }
            OUT = NO_PRODUCE ? undefined : c;
            return true;
        },
    };
}
