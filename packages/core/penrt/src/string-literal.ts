// TODO: doc... has both 'txt' and 'ast' representation
function stringLiteral(options: StaticOptions & {value: string}): PenVal {
    const {value} = options;
    const length = value.length;
    const out = options.out === 'nil' ? undefined : value;
    const checkInType = options.in !== 'txt';

    if (options.in === 'nil') {
        return {rule: function STR() { return OUT = out, true; }};
    }

    return {
        rule: function STR() {
            if (checkInType && typeof IN !== 'string') return false;
            if (IP + length > (IN as string).length) return false;
            for (let i = 0; i < length; ++i) {
                if ((IN as string).charAt(IP + i) !== value.charAt(i)) return false;
            }
            IP += length;
            OUT = out;
            return true;
        },
    };
}
