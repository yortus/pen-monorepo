// TODO: doc... has only 'ast' representation
// TODO: support 'txt' representation too?
function numericLiteral(options: StaticOptions & {value: number}): PenVal {
    const {value} = options;
    const out = options.out === 'ast' ? value : undefined;

    if (options.in !== 'ast') {
        return {rule: () => (OUT = out, true)};
    }

    return {
        rule() {
            if (IN !== value || IP !== 0) return false;
            IP = 1;
            OUT = out;
            return true;
        },
    };
}
