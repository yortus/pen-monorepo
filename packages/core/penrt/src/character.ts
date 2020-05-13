// TODO: doc... has both 'txt' and 'ast' representation
function character(options: StaticOptions & {min: string, max: string}): PenVal {
    const {min, max} = options;

    if (options.in === 'nil') {
        const out = options.out === 'nil' ? undefined : min;
        return {rule: () => (OUT = out, true)};
    }

    return {
        rule() {
            if (typeof IN !== 'string') return false;
            if (IP < 0 || IP >= IN.length) return false;
            let c = IN.charAt(IP);
            if (c < min || c > max) return false;
            IP += 1;
            OUT = options.out === 'nil' ? undefined : c;
            return true;
        },
    };
}
