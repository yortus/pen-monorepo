// TODO: doc... has only 'ast' representation
// TODO: support 'txt' representation too?
function numericLiteral(options: StaticOptions & {value: number}): Rule {
    const {value} = options;
    const out = options.outForm === 'ast' ? value : undefined;

    if (options.inForm !== 'ast') {
        return function NUM() { return OUT = out, true; };
    }

    return function NUM() {
        if (IN !== value || IP !== 0) return false;
        IP = 1;
        OUT = out;
        return true;
    };
}
