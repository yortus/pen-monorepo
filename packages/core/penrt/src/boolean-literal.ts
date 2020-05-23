// TODO: doc... has only 'ast' representation
function booleanLiteral(options: StaticOptions & {value: boolean}): PenVal {
    const {value} = options;
    const out = options.outForm === 'ast' ? value : undefined;

    if (options.inForm !== 'ast') {
        return {rule: function BOO() { return OUT = out, true; }};
    }

    return {
        rule: function BOO() {
            if (IN !== value || IP !== 0) return false;
            IP += 1;
            OUT = out;
            return true;
        },
    };
}
