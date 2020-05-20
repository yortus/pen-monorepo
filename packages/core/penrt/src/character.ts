// TODO: doc... has both 'txt' and 'ast' representation
function character(options: StaticOptions & {min: string, max: string}): PenVal {
    const {min, max} = options;
    const checkInType = options.in !== 'txt';

    if (options.in === 'nil') {
        const out = options.out === 'nil' ? undefined : min;
        return {rule: function CHA() { return OUT = out, true; }};
    }

    return {
        rule: function CHA() {
            if (checkInType && typeof IN !== 'string') return false;
            if (IP < 0 || IP >= (IN as string).length) return false;
            let c = (IN as string).charAt(IP);
            if (c < min || c > max) return false;
            IP += 1;
            OUT = options.out === 'nil' ? undefined : c;
            return true;
        },
    };
}
