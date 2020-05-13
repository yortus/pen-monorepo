// TODO: doc... has only 'ast' representation
function booleanLiteral(options: StaticOptions & {value: boolean}): PenVal {
    const {value} = options;
    const out = options.out === 'ast' ? value : undefined;

    if (options.in !== 'ast') {
        return {rule: () => (OUT = out, true)};
    }

    return {
        rule() {
            if (IN !== value || IP !== 0) return false;
            IP += 1;
            OUT = out;
            return true;
        },
    };
}
