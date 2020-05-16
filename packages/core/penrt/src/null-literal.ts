// TODO: doc... has only 'ast' representation
function nullLiteral(options: StaticOptions): PenVal {
    const out = options.out === 'ast' ? null : undefined;

    if (options.in !== 'ast') {
        return {rule: function NUL() { return OUT = out, true; }};
    }

    return {
        rule: function NUL() {
            if (IN !== null || IP !== 0) return false;
            IP = 1;
            OUT = out;
            return true;
        },
    };
}
