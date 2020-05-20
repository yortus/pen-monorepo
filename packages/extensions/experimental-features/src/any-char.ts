// TODO: doc... has both 'txt' and 'ast' representation
function anyChar(options: StaticOptions): PenVal {
    const checkInType = options.in !== 'txt';

    if (options.in === 'nil') {
        const out = options.out === 'nil' ? undefined : '?';
        return {rule: function ANY() { return OUT = out, true; }};
    }

    return {
        rule: function ANY() {
            if (checkInType && typeof IN !== 'string') return false;
            if (IP < 0 || IP >= (IN as string).length) return false;
            let c = (IN as string).charAt(IP);
            IP += 1;
            OUT = options.out === 'nil' ? undefined : c;
            return true;
        },
    };
}
