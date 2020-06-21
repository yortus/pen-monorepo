// TODO: doc... has only 'ast' representation
// TODO: support 'txt' representation too?
function numericLiteral({mode, value}: StaticOptions & {value: number}): Rule {
    const out = isParse(mode) && hasAbstractForm(mode) ? value : undefined;

    if (isParse(mode)) {
        return function NUM() { return OUT = out, true; };
    }

    return function NUM() {
        if (IN !== value || IP !== 0) return false;
        IP = 1;
        OUT = out;
        return true;
    };
}
