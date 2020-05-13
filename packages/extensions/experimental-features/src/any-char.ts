// TODO: doc... has both 'txt' and 'ast' representation
function anyChar(options: StaticOptions): PenVal {

    if (options.in === 'nil') {
        const out = options.out === 'nil' ? undefined : '?';
        return {rule: () => (OUT = out, true)};
    }

    return {
        rule() {
            if (typeof IN !== 'string') return false;
            if (IP < 0 || IP >= IN.length) return false;
            let c = IN.charAt(IP);
            IP += 1;
            OUT = options.out === 'nil' ? undefined : c;
            return true;
        },
    };
}
