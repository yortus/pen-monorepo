// TODO: doc... has both 'txt' and 'ast' representation
function stringLiteral(options: StaticOptions & {value: string}): PenVal {
    const {value} = options;
    const out = options.out === 'nil' ? undefined : value;

    if (options.in === 'nil') {
        return {rule: () => (OUT = out, true)};
    }

    return {
        rule() {
            if (typeof IN !== 'string') return false;
            if (!isMatch(value)) return false;
            IP += value.length;
            OUT = out;
            return true;
        },
    };
}


// TODO: doc... helper...
function isMatch(substr: string): boolean {
    let lastPos = IP + substr.length;
    if (lastPos > (IN as string).length) return false;
    for (let i = IP, j = 0; i < lastPos; ++i, ++j) {
        if ((IN as string).charAt(i) !== substr.charAt(j)) return false;
    }
    return true;
}
