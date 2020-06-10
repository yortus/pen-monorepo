// TODO: doc... has only 'ast' representation
function booleanLiteral(options: StaticOptions & {value: boolean}): Rule {
    const {value} = options;
    const out = options.outForm === 'ast' ? value : undefined;

    if (options.inForm !== 'ast') {
        return function BOO() { return OUT = out, true; };
    }

    return function BOO() {
        if (IN !== value || IP !== 0) return false;
        IP += 1;
        OUT = out;
        return true;
    };
}
