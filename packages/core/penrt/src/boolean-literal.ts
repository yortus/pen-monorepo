// TODO: doc... has only 'ast' representation
function booleanLiteral({mode, value}: StaticOptions & {value: boolean}): Rule {
    const out = isParse(mode) && hasAbstractForm(mode) ? value : undefined;

    if (isParse(mode)) {
        return function BOO() { return OUT = out, true; };
    }

    return function BOO() {
        if (IN !== value || IP !== 0) return false;
        IP += 1;
        OUT = out;
        return true;
    };
}
